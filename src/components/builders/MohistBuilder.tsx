import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Download, 
  Server, 
  Settings, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  Calendar,
  Code,
  Package,
  Zap,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Server as ServerType, MohistVersion } from '../../types';
import MohistAPI from '../../services/mohistAPI';
import { PortFinder } from '../AutomationFeatures';
import { useRamOptions } from '../../hooks/useRamOptions';
import JavaVersionInfo from '../JavaVersionInfo';

interface MohistBuilderProps {
  onClose: () => void;
  onServerCreated: (server: ServerType) => void;
}

const MohistBuilder: React.FC<MohistBuilderProps> = ({ onClose, onServerCreated }) => {
  const [step, setStep] = useState(1);
  const [versions, setVersions] = useState<MohistVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<MohistVersion | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const versionsPerPage = 12;
  
  // Utiliser le hook pour les options de RAM adaptées
  const { ramOptions, defaultRam, loading: ramLoading } = useRamOptions();
  
  const [serverConfig, setServerConfig] = useState({
    name: '',
    port: 25565,
    ram: 2048,
    motd: 'Un serveur Minecraft MohistMC',
    maxPlayers: 20,
    difficulty: 'normal' as const,
    gamemode: 'survival' as const,
  });

  useEffect(() => {
    fetchVersions();
  }, []);

  // Mettre à jour la RAM par défaut quand les options sont chargées
  useEffect(() => {
    if (!ramLoading && defaultRam !== 2048) {
      setServerConfig(prev => ({ ...prev, ram: defaultRam }));
    }
  }, [defaultRam, ramLoading]);

  const fetchVersions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Chargement des versions MohistMC depuis le dépôt GitHub...');
      const mohistVersions = await MohistAPI.getVersions();
      
      if (mohistVersions.length === 0) {
        setError('Aucune version MohistMC trouvée dans le dépôt GitHub. Vérifiez que le fichier versions.json existe.');
        return;
      }
      
      setVersions(mohistVersions);
      setTotalPages(Math.ceil(mohistVersions.length / versionsPerPage));
      console.log(`✅ ${mohistVersions.length} versions MohistMC chargées`);
    } catch (err) {
      setError('Erreur lors du chargement des versions MohistMC depuis le dépôt GitHub. Vérifiez votre connexion Internet.');
      console.error('❌ Erreur fetchVersions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVersionSelect = (version: MohistVersion) => {
    setSelectedVersion(version);
    setStep(2);
  };

  const handleConfigChange = (field: string, value: any) => {
    setServerConfig(prev => ({ ...prev, [field]: value }));
  };

  const generateServerId = () => {
    return 'server_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  };

  const createServer = async () => {
    if (!selectedVersion || !serverConfig.name.trim()) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { invoke } = await import('@tauri-apps/api/tauri');
      
      const config = {
        name: serverConfig.name.trim(),
        version: selectedVersion.version,
        port: serverConfig.port,
        ram: serverConfig.ram,
        motd: serverConfig.motd,
        max_players: serverConfig.maxPlayers,
        difficulty: serverConfig.difficulty,
        gamemode: serverConfig.gamemode,
      };

      console.log('🚀 Création du serveur MohistMC avec la configuration:', config);
      const serverId = await invoke<string>('create_mohist_server', { config, localJarPath: null });
      console.log('✅ Serveur MohistMC créé avec ID:', serverId);

      // Récupérer le vrai chemin APPDATA depuis le backend
      const appData = await invoke<string>('get_app_data_path');
      console.log('📁 APPDATA path:', appData);
      
      const serverPath = `${appData}\\Serveurs\\${serverConfig.name}`;
      console.log('📂 Server path:', serverPath);

      const newServer: ServerType = {
        id: serverId,
        name: serverConfig.name,
        type: 'mohist',
        version: selectedVersion.version,
        port: serverConfig.port,
        ram: serverConfig.ram,
        status: 'stopped',
        path: serverPath,
        motd: serverConfig.motd,
        maxPlayers: serverConfig.maxPlayers,
        difficulty: serverConfig.difficulty,
        gamemode: serverConfig.gamemode,
        whitelist: [],
        ops: [],
        bannedPlayers: [],
        bannedIPs: [],
        createdAt: new Date(),
        lastStarted: undefined,
        uptime: 0,
        players: []
      };

      console.log('🎉 Serveur MohistMC créé avec succès:', newServer);
      onServerCreated(newServer);
      onClose();
    } catch (err: any) {
      console.error('❌ Erreur lors de la création du serveur MohistMC:', err);
      setError(`Erreur lors de la création du serveur: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  const getPaginatedVersions = () => {
    const startIndex = (currentPage - 1) * versionsPerPage;
    const endIndex = startIndex + versionsPerPage;
    return versions.slice(startIndex, endIndex);
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const mohistInfo = MohistAPI.getMohistInfo();

  if (step === 1) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-gray-900 rounded-xl border border-purple-500/20 w-full max-w-6xl max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Zap className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Créer un serveur MohistMC</h2>
                <p className="text-gray-400">Serveur hybride Forge + Bukkit/Spigot</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Sélectionner une version MohistMC</h3>
                
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                    <span className="ml-3 text-gray-400">Chargement des versions...</span>
                  </div>
                ) : error ? (
                  <div className="flex items-center space-x-3 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-red-400" />
                    <span className="text-red-400">{error}</span>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                      {getPaginatedVersions().map((version) => (
                        <motion.button
                          key={version.version}
                          onClick={() => handleVersionSelect(version)}
                          className="p-4 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-purple-500/50 rounded-lg text-left transition-colors duration-200"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-white">{version.version}</span>
                            <span className="px-2 py-1 rounded text-xs bg-purple-500/20 text-purple-400">
                              MohistMC
                            </span>
                          </div>
                          <p className="text-sm text-gray-400">{version.changelog}</p>
                        </motion.button>
                      ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-center space-x-2 mt-6">
                        <button
                          onClick={goToPreviousPage}
                          disabled={currentPage === 1}
                          className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        
                        <div className="flex space-x-1">
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum;
                            if (totalPages <= 5) {
                              pageNum = i + 1;
                            } else if (currentPage <= 3) {
                              pageNum = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                              pageNum = totalPages - 4 + i;
                            } else {
                              pageNum = currentPage - 2 + i;
                            }
                            
                            return (
                              <button
                                key={pageNum}
                                onClick={() => setCurrentPage(pageNum)}
                                className={`px-3 py-1 rounded text-sm ${
                                  currentPage === pageNum
                                    ? 'bg-purple-500 text-white'
                                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          })}
                        </div>
                        
                        <button
                          onClick={goToNextPage}
                          disabled={currentPage === totalPages}
                          className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    <div className="text-center text-sm text-gray-500 mt-2">
                      Page {currentPage} sur {totalPages} • {versions.length} versions disponibles
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-gray-900 rounded-xl border border-purple-500/20 w-full max-w-4xl max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Settings className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Configuration du serveur</h2>
                <p className="text-gray-400">MohistMC {selectedVersion?.version}</p>
              </div>
            </div>
            <button
              onClick={() => setStep(1)}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Configuration du serveur</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Nom du serveur *
                      </label>
                      <input
                        type="text"
                        value={serverConfig.name}
                        onChange={(e) => handleConfigChange('name', e.target.value)}
                        className="input w-full"
                        placeholder="Mon Serveur MohistMC"
                      />
                    </div>
                    
                    {selectedVersion && (
                      <JavaVersionInfo 
                        minecraftVersion={selectedVersion.version}
                        className="mt-4"
                      />
                    )}

                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Port
                      </label>
                      <div className="flex space-x-2">
                        <input
                          type="number"
                          value={serverConfig.port}
                          onChange={(e) => handleConfigChange('port', parseInt(e.target.value))}
                          className="input flex-1"
                          min="1024"
                          max="65535"
                        />
                        <PortFinder onPortFound={(port) => handleConfigChange('port', port)} />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white mb-2 flex items-center justify-between">
                        <span>RAM (MB)</span>
                        <motion.button
                          type="button"
                          onClick={async () => {
                            try {
                              const { invoke } = await import('@tauri-apps/api/tauri');
                              const flags = await invoke<string>('get_optimized_java_flags', {
                                ram: serverConfig.ram,
                                version: selectedVersion?.version || '1.20.1',
                                serverType: 'mohist'
                              });
                              alert(`Flags Java optimisés:\n\n${flags}\n\nCes flags seront automatiquement appliqués au script de démarrage.`);
                            } catch (error) {
                              console.error('Erreur optimisation Java:', error);
                            }
                          }}
                          className="text-xs px-2 py-1 bg-purple-600 hover:bg-purple-700 rounded transition-colors"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          ⚡ Optimiser
                        </motion.button>
                      </label>
                      <select
                        value={serverConfig.ram}
                        onChange={(e) => handleConfigChange('ram', parseInt(e.target.value))}
                        className="input w-full"
                        disabled={ramLoading}
                      >
                        {ramLoading ? (
                          <option value={2048}>Chargement...</option>
                        ) : (
                          ramOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label} {option.recommended ? '(Recommandé)' : ''}
                            </option>
                          ))
                        )}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Message du jour
                      </label>
                      <input
                        type="text"
                        value={serverConfig.motd}
                        onChange={(e) => handleConfigChange('motd', e.target.value)}
                        className="input w-full"
                        placeholder="Un serveur Minecraft MohistMC"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Joueurs maximum
                      </label>
                      <input
                        type="number"
                        value={serverConfig.maxPlayers}
                        onChange={(e) => handleConfigChange('maxPlayers', parseInt(e.target.value))}
                        className="input w-full"
                        min="1"
                        max="100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Difficulté
                      </label>
                      <select
                        value={serverConfig.difficulty}
                        onChange={(e) => handleConfigChange('difficulty', e.target.value)}
                        className="input w-full"
                      >
                        <option value="peaceful">Paisible</option>
                        <option value="easy">Facile</option>
                        <option value="normal">Normal</option>
                        <option value="hard">Difficile</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Mode de jeu
                      </label>
                      <select
                        value={serverConfig.gamemode}
                        onChange={(e) => handleConfigChange('gamemode', e.target.value)}
                        className="input w-full"
                      >
                        <option value="survival">Survie</option>
                        <option value="creative">Créatif</option>
                        <option value="adventure">Aventure</option>
                        <option value="spectator">Spectateur</option>
                      </select>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="mt-6 bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="w-5 h-5 text-red-400" />
                      <span className="text-red-400 font-medium">Erreur</span>
                    </div>
                    <p className="text-red-300 mt-2">{error}</p>
                  </div>
                )}

                <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-700">
                  <button
                    onClick={() => setStep(1)}
                    className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                  >
                    Précédent
                  </button>
                  
                  <button
                    onClick={createServer}
                    disabled={loading || !serverConfig.name.trim()}
                    className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center space-x-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Installation MohistMC...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        <span>Installer MohistMC</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    );
  }

  return null;
};

export default MohistBuilder;




