import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Package, 
  Trash2, 
  Upload, 
  Download,
  Search, 
  Filter,
  Server,
  CheckCircle,
  AlertCircle,
  FolderOpen,
  Eye,
  EyeOff,
  RefreshCw
} from 'lucide-react';
import { Server as ServerType } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { useThemeClasses } from '../contexts/ThemeContext';
import ModConflictAnalyzer from '../components/ModConflictAnalyzer';

interface Mod {
  id: string;
  name: string;
  version: string;
  description: string;
  enabled: boolean;
  file: string;
  size: number;
  loader: 'forge' | 'neoforge' | 'fabric';
}

const Mods: React.FC = () => {
  const { t } = useLanguage();
  const { borderClass } = useThemeClasses();
  const [servers, setServers] = useState<ServerType[]>([]);
  const [selectedServer, setSelectedServer] = useState<ServerType | null>(null);
  const [mods, setMods] = useState<Mod[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLoader, setFilterLoader] = useState<'all' | 'forge' | 'neoforge' | 'fabric'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'enabled' | 'disabled'>('all');
  const [activeTab, setActiveTab] = useState<'mods' | 'conflicts'>('mods');

  useEffect(() => {
    const savedServers = localStorage.getItem('nether-client-servers');
    if (savedServers) {
      const parsedServers = JSON.parse(savedServers);
      setServers(parsedServers);
      if (parsedServers.length > 0) {
        setSelectedServer(parsedServers[0]);
      }
    }
  }, []);

  useEffect(() => {
    if (selectedServer) {
      loadMods();
    }
  }, [selectedServer]);

  const loadMods = async () => {
    if (!selectedServer) return;

    try {
      const { invoke } = await import('@tauri-apps/api/tauri');
      const modInfos = await invoke<Array<{name: string, size: number, enabled: boolean}>>('list_server_mods', {
        serverPath: selectedServer.path
      });

      const loadedMods: Mod[] = modInfos.map((modInfo, index) => ({
        id: `mod_${index}`,
        name: modInfo.name.replace('.jar', '').replace('.disabled', ''),
        version: 'Unknown',
        description: '',
        enabled: modInfo.enabled,
        file: modInfo.name,
        size: modInfo.size,
        loader: selectedServer.type === 'neoforge' ? 'neoforge' : selectedServer.type === 'forge' ? 'forge' : 'fabric'
      }));

      setMods(loadedMods);
    } catch (error) {
      console.error('Erreur lors du chargement des mods:', error);
      setMods([]);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !selectedServer) return;

    try {
      const { invoke } = await import('@tauri-apps/api/tauri');

      for (const file of Array.from(files)) {
        // Le fichier est déjà sélectionné, on a juste besoin du chemin
        // Tauri va copier le fichier dans le dossier mods
        const filePath = (file as any).path || file.name;
        
        await invoke('add_mod', {
          serverPath: selectedServer.path,
          modFilePath: filePath
        });
      }

      // Recharger la liste des mods
      loadMods();
    } catch (error) {
      console.error('Erreur lors de l\'ajout du mod:', error);
      alert('Erreur: ' + error);
    }
  };

  const handleModpackImport = async () => {
    if (!selectedServer) return;

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.zip';
    
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        const { invoke } = await import('@tauri-apps/api/tauri');
        
        const confirmed = confirm(
          `Importer le modpack "${file.name}"?\n\n` +
          `⚠️ Cela ajoutera les mods au serveur ${selectedServer.name}.\n` +
          `✅ Une sauvegarde automatique sera créée.\n` +
          `⏱️ Cela peut prendre quelques minutes.`
        );
        
        if (!confirmed) return;

        // Créer une sauvegarde avant l'import
        await invoke('create_backup', { serverName: selectedServer.name });

        // Importer le modpack
        const result = await invoke<string>('import_modpack', {
          serverPath: selectedServer.path,
          modpackPath: (file as any).path || file.name
        });

        alert(`✅ ${result}\n\nLes mods ont été importés avec succès !`);

        // Recharger la liste des mods
        loadMods();
      } catch (error) {
        console.error('Erreur import modpack:', error);
        alert('❌ Erreur lors de l\'import du modpack:\n\n' + error);
      }
    };

    input.click();
  };

  const handleModpackExport = async () => {
    if (!selectedServer) return;

    try {
      const { invoke } = await import('@tauri-apps/api/tauri');
      
      const modpackName = prompt(
        `Nom du modpack à exporter:`,
        `${selectedServer.name}_modpack`
      );
      
      if (!modpackName) return;

      // Exporter le modpack
      const result = await invoke<string>('export_modpack', {
        serverPath: selectedServer.path,
        outputName: modpackName
      });
      
      alert(`✅ ${result}\n\nVous pouvez le partager avec d'autres joueurs !`);
    } catch (error) {
      console.error('Erreur export modpack:', error);
      alert('❌ Erreur lors de l\'export du modpack:\n\n' + error);
    }
  };

  const toggleMod = async (modId: string) => {
    if (!selectedServer) return;

    const mod = mods.find(m => m.id === modId);
    if (!mod) return;

    try {
      const { invoke } = await import('@tauri-apps/api/tauri');
      await invoke('toggle_mod', {
        serverPath: selectedServer.path,
        modName: mod.file,
        enabled: !mod.enabled
      });

      // Recharger la liste des mods
      loadMods();
    } catch (error) {
      console.error('Erreur lors du toggle du mod:', error);
      alert('Erreur: ' + error);
    }
  };

  const removeMod = async (modId: string) => {
    if (!selectedServer) return;
    if (!confirm(t.mods.deleteConfirm)) return;

    const mod = mods.find(m => m.id === modId);
    if (!mod) return;

    try {
      const { invoke } = await import('@tauri-apps/api/tauri');
      await invoke('delete_mod', {
        serverPath: selectedServer.path,
        modName: mod.file
      });

      // Recharger la liste des mods
      loadMods();
    } catch (error) {
      console.error('Erreur lors de la suppression du mod:', error);
      alert('Erreur: ' + error);
    }
  };

  const refreshMods = () => {
    console.log(t.mods.refreshMods);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getLoaderColor = (loader: string) => {
    switch (loader) {
      case 'forge': return 'bg-orange-500/20 text-orange-400';
      case 'neoforge': return 'bg-purple-500/20 text-purple-400';
      case 'fabric': return 'bg-blue-500/20 text-blue-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const filteredMods = mods.filter(mod => {
    const matchesSearch = mod.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         mod.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLoader = filterLoader === 'all' || mod.loader === filterLoader;
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'enabled' && mod.enabled) ||
                         (filterStatus === 'disabled' && !mod.enabled);
    
    return matchesSearch && matchesLoader && matchesStatus;
  });

  return (
    <div className="min-h-screen flex flex-col overflow-y-auto overflow-x-hidden scrollbar-hide">
      {/* Header */}
      <div className={`p-6 border-b-2 ${borderClass} shadow-[0_2px_10px_var(--color-glow)]`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Package className="w-6 h-6 text-primary-400" />
            <div>
              <h1 className="text-2xl font-bold text-white">{t.mods.title}</h1>
              <p className="text-dark-400">{t.mods.subtitle}</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Sélection du serveur */}
            <div className="flex items-center space-x-2">
              <Server className="w-4 h-4 text-dark-400" />
              <select
                value={selectedServer?.id || ''}
                onChange={(e) => {
                  const server = servers.find(s => s.id === e.target.value);
                  setSelectedServer(server || null);
                }}
                className="input"
              >
                <option value="">{t.mods.selectServer}</option>
                {servers.filter(s => s.type !== 'vanilla').map(server => (
                  <option key={server.id} value={server.id}>
                    {server.name} ({server.version})
                  </option>
                ))}
              </select>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2">
              <motion.button
                onClick={refreshMods}
                className="p-2 text-dark-400 hover:text-white hover:bg-dark-800 rounded-lg"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <RefreshCw className="w-4 h-4" />
              </motion.button>
              
              <motion.button
                className="p-2 text-dark-400 hover:text-white hover:bg-dark-800 rounded-lg"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FolderOpen className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* Onglets */}
      <div className={`border-b-2 ${borderClass} shadow-[0_2px_10px_var(--color-glow)] px-6`}>
        <div className="flex space-x-4">
          <button
            onClick={() => setActiveTab('mods')}
            className={`px-6 py-3 font-medium transition-all ${
              activeTab === 'mods'
                ? `border-b-2 ${borderClass}`
                : 'text-gray-400 hover:text-white'
            }`}
            style={activeTab === 'mods' ? { color: 'var(--color-primary)' } : {}}
          >
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Mods Installés
            </div>
          </button>
          <button
            onClick={() => setActiveTab('conflicts')}
            className={`px-6 py-3 font-medium transition-all ${
              activeTab === 'conflicts'
                ? `border-b-2 ${borderClass}`
                : 'text-gray-400 hover:text-white'
            }`}
            style={activeTab === 'conflicts' ? { color: 'var(--color-primary)' } : {}}
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Analyse Conflits
            </div>
          </button>
        </div>
      </div>

      {/* Contenu principal */}
      {activeTab === 'conflicts' && selectedServer ? (
        <ModConflictAnalyzer
          serverPath={selectedServer.path}
          serverVersion={selectedServer.version}
          serverType={selectedServer.type}
        />
      ) : activeTab === 'conflicts' ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="w-20 h-20 text-gray-600 mx-auto mb-4" />
            <p className="text-xl text-gray-400">Sélectionnez un serveur pour analyser les conflits</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Filtres et recherche */}
        <div className={`p-4 border-b-2 ${borderClass} shadow-[0_2px_10px_var(--color-glow)]`}>
          <div className="flex items-center space-x-4">
            {/* Recherche */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-dark-400" />
              <input
                type="text"
                placeholder={t.mods.searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input w-full pl-10"
              />
            </div>

            {/* Filtres */}
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-dark-400" />
              
              <select
                value={filterLoader}
                onChange={(e) => setFilterLoader(e.target.value as any)}
                className="input"
              >
                <option value="all">{t.mods.allLoaders}</option>
                <option value="forge">Forge</option>
                <option value="neoforge">NeoForge</option>
                <option value="fabric">Fabric</option>
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="input"
              >
                <option value="all">{t.mods.all}</option>
                <option value="enabled">{t.mods.enabledMods}</option>
                <option value="disabled">{t.mods.disabledMods}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Zone principale */}
        <div className="flex-1 p-6 overflow-y-auto">
          {!selectedServer ? (
            <div className="text-center py-16">
              <Package className="w-16 h-16 text-dark-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">{t.mods.noServerSelected}</h3>
              <p className="text-dark-400 mb-6">{t.mods.noServerSelectedDesc}</p>
            </div>
          ) : selectedServer.type === 'vanilla' ? (
            <div className="text-center py-16">
              <AlertCircle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">{t.mods.vanillaServer}</h3>
              <p className="text-dark-400 mb-6">{t.mods.vanillaServerDesc}</p>
              <p className="text-sm text-dark-500">{t.mods.vanillaServerTip}</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Actions rapides */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-dark-400">{t.mods.modsCount}:</span>
                    <span className="text-white font-semibold">{filteredMods.length}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-dark-400">{t.mods.enabledCount}:</span>
                    <span className="text-green-400 font-semibold">
                      {filteredMods.filter(m => m.enabled).length}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-dark-400">{t.mods.disabledCount}:</span>
                    <span className="text-red-400 font-semibold">
                      {filteredMods.filter(m => !m.enabled).length}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <motion.button
                    onClick={handleModpackImport}
                    className="btn-secondary flex items-center space-x-2"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Download className="w-4 h-4" />
                    <span>Importer Modpack</span>
                  </motion.button>

                  <motion.button
                    onClick={handleModpackExport}
                    className="btn-secondary flex items-center space-x-2"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Package className="w-4 h-4" />
                    <span>Exporter Modpack</span>
                  </motion.button>

                  <label className="btn-secondary cursor-pointer flex items-center space-x-2">
                    <Upload className="w-4 h-4" />
                    <span>{t.mods.addMods}</span>
                    <input
                      type="file"
                      multiple
                      accept=".jar"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Liste des mods */}
              {filteredMods.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-12 h-12 text-dark-600 mx-auto mb-4" />
                  <p className="text-dark-400 mb-2">{t.mods.noModsFound}</p>
                  <p className="text-sm text-dark-500">
                    {searchTerm ? t.mods.noModsSearch : t.mods.noModsInstalled}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {filteredMods.map((mod, index) => (
                    <motion.div
                      key={mod.id}
                      className={`rounded-lg p-4 border transition-colors duration-200 ${
                        mod.enabled ? 'border-green-500/30 bg-green-500/5' : `${borderClass}`
                      }`}
                      style={!mod.enabled ? { backgroundColor: 'var(--color-glow)' } : {}}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-semibold text-white">{mod.name}</h3>
                            <span className={`px-2 py-1 rounded text-xs ${getLoaderColor(mod.loader)}`}>
                              {mod.loader}
                            </span>
                          </div>
                          <p className="text-sm text-dark-400 mb-2">{mod.description}</p>
                          <div className="flex items-center space-x-4 text-xs text-dark-500">
                            <span>v{mod.version}</span>
                            <span>{formatFileSize(mod.size)}</span>
                            <span>{mod.file}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <motion.button
                            onClick={() => toggleMod(mod.id)}
                            className={`p-2 rounded-lg transition-colors duration-200 ${
                              mod.enabled 
                                ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' 
                                : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                            }`}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            {mod.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                          </motion.button>
                          
                          <motion.button
                            onClick={() => removeMod(mod.id)}
                            className="p-2 text-dark-400 hover:text-red-400 hover:bg-red-500/20 rounded-lg"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </motion.button>
                        </div>
                      </div>

                      {/* Status */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {mod.enabled ? (
                            <>
                              <CheckCircle className="w-4 h-4 text-green-400" />
                              <span className="text-sm text-green-400">{t.mods.enabled}</span>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-4 h-4 text-red-400" />
                              <span className="text-sm text-red-400">{t.mods.disabled}</span>
                            </>
                          )}
                        </div>
                        
                        <div className="text-xs text-dark-500">
                          {t.mods.compatibleWith} {selectedServer.type}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        </div>
      )}
    </div>
  );
};

export default Mods;