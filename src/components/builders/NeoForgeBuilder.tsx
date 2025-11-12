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
import { Server as ServerType, NeoForgeVersion } from '../../types';
import NeoForgeAPI from '../../services/neoforgeAPI';
import { PortFinder } from '../AutomationFeatures';
import { useRamOptions } from '../../hooks/useRamOptions';
import JavaVersionInfo from '../JavaVersionInfo';

interface NeoForgeBuilderProps {
  onClose: () => void;
  onServerCreated: (server: ServerType) => void;
}

const NeoForgeBuilder: React.FC<NeoForgeBuilderProps> = ({ onClose, onServerCreated }) => {
  const [step, setStep] = useState(1);
  const [versions, setVersions] = useState<NeoForgeVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<NeoForgeVersion | null>(null);
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
    motd: 'Un serveur Minecraft NeoForge',
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
      
      // Utiliser le service NeoForgeAPI
      const neoforgeVersions = await NeoForgeAPI.getVersions();
      
      setVersions(neoforgeVersions);
      setTotalPages(Math.ceil(neoforgeVersions.length / versionsPerPage));
    } catch (err) {
      setError('Erreur lors du chargement des versions NeoForge. Vérifiez votre connexion Internet.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVersionSelect = (version: NeoForgeVersion) => {
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

      // Appeler la vraie commande Tauri pour créer le serveur NeoForge
      const { invoke } = await import('@tauri-apps/api/tauri');
      
      const config = {
        name: serverConfig.name,
        version: selectedVersion.version,
        port: serverConfig.port,
        ram: serverConfig.ram,
        motd: serverConfig.motd,
        max_players: serverConfig.maxPlayers,
        difficulty: serverConfig.difficulty,
        gamemode: serverConfig.gamemode,
      };

      const serverId = await invoke<string>('create_neoforge_server', { config });
      console.log('Serveur NeoForge créé avec ID:', serverId);

      // Récupérer le vrai chemin APPDATA depuis le backend
      const appData = await invoke<string>('get_app_data_path');
      console.log('APPDATA path:', appData);
      
      const serverPath = `${appData}\\Serveurs\\${serverConfig.name}`;
      console.log('Server path:', serverPath);

      const newServer: ServerType = {
        id: serverId,
        name: serverConfig.name,
        version: selectedVersion.version,
        type: 'neoforge',
        port: serverConfig.port,
        ram: serverConfig.ram,
        motd: serverConfig.motd,
        maxPlayers: serverConfig.maxPlayers,
        difficulty: serverConfig.difficulty,
        gamemode: serverConfig.gamemode,
        whitelist: [],
        ops: [],
        bannedPlayers: [],
        bannedIPs: [],
        status: 'stopped',
        path: serverPath,
        createdAt: new Date(),
      };

      onServerCreated(newServer);
      setStep(3);
    } catch (err) {
      setError('Erreur lors de la création du serveur NeoForge: ' + err);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentPageVersions = () => {
    const startIndex = (currentPage - 1) * versionsPerPage;
    const endIndex = startIndex + versionsPerPage;
    return versions.slice(startIndex, endIndex);
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const extractMinecraftVersion = (neoforgeVersion: string): string => {
    // Format "1.20.1-47.1.106" → "1.20.1" (versions compatibles Forge)
    if (neoforgeVersion.includes('-') && neoforgeVersion.startsWith('1.')) {
      return neoforgeVersion.split('-')[0];
    }
    
    // Format NeoForge moderne : "20.4.237-beta" → "1.20.4"
    // NeoForge utilise : 20.4.x = Minecraft 1.20.4, 21.0.x = Minecraft 1.21, etc.
    if (neoforgeVersion.match(/^\d+\.\d+/)) {
      const match = neoforgeVersion.match(/^(\d+)\.(\d+)/);
      if (match) {
        const major = parseInt(match[1]);
        const minor = parseInt(match[2]);
        
        // Mapping NeoForge → Minecraft
        if (major === 21) {
          return `1.21.${minor}`;
        } else if (major === 20) {
          return `1.20.${minor}`;
        } else if (major === 19) {
          return `1.19.${minor}`;
        } else if (major === 18) {
          return `1.18.${minor}`;
        } else if (major === 17) {
          return `1.17.${minor}`;
        } else if (major === 16) {
          return `1.16.${minor}`;
        } else {
          // Fallback générique
          return `1.${major}.${minor}`;
        }
      }
    }
    
    return neoforgeVersion;
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-dark-900 rounded-lg border border-dark-800 w-full max-w-4xl max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b-2 border-purple-500/30 shadow-[0_2px_10px_rgba(168,85,247,0.1)]">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Zap className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Créer un serveur NeoForge</h2>
                <p className="text-sm text-dark-400">Serveur Minecraft moderne avec NeoForge</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-dark-400 hover:text-white hover:bg-dark-800 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Sélectionner une version NeoForge</h3>
                  
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
                      <span className="ml-3 text-dark-400">Chargement des versions...</span>
                    </div>
                  ) : error ? (
                    <div className="flex items-center space-x-3 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-red-400" />
                      <span className="text-red-400">{error}</span>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                        {getCurrentPageVersions().map((version) => (
                          <motion.button
                            key={version.version}
                            onClick={() => handleVersionSelect(version)}
                            className="p-4 bg-dark-800 hover:bg-dark-700 border border-dark-700 hover:border-purple-500/50 rounded-lg text-left transition-colors duration-200"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <div className="font-semibold text-white">{extractMinecraftVersion(version.version)}</div>
                                <div className="text-xs text-dark-500">{version.version}</div>
                              </div>
                              <span className="px-2 py-1 rounded text-xs bg-purple-500/20 text-purple-400">
                                NeoForge
                              </span>
                            </div>
                            <p className="text-sm text-dark-400">{version.changelog}</p>
                          </motion.button>
                        ))}
                      </div>

                      {/* Pagination */}
                      {totalPages > 1 && (
                        <div className="flex items-center justify-center space-x-2 mt-6">
                          <button
                            onClick={() => goToPage(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="p-2 text-dark-400 hover:text-white hover:bg-dark-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
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
                                  onClick={() => goToPage(pageNum)}
                                  className={`px-3 py-1 rounded text-sm ${
                                    currentPage === pageNum
                                      ? 'bg-primary-500 text-white'
                                      : 'text-dark-400 hover:text-white hover:bg-dark-800'
                                  }`}
                                >
                                  {pageNum}
                                </button>
                              );
                            })}
                          </div>
                          
                          <button
                            onClick={() => goToPage(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="p-2 text-dark-400 hover:text-white hover:bg-dark-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      )}

                      <div className="text-center text-sm text-dark-500 mt-2">
                        Page {currentPage} sur {totalPages} • {versions.length} versions disponibles
                      </div>
                    </>
                  )}
                </div>

                <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Zap className="w-5 h-5 text-purple-400" />
                    <h4 className="font-semibold text-white">À propos de NeoForge</h4>
                  </div>
                  <p className="text-sm text-dark-400">
                    NeoForge est un fork moderne de Forge avec des optimisations de performance, 
                    une meilleure stabilité et un support étendu pour les mods récents.
                  </p>
                </div>
              </motion.div>
            )}

            {step === 2 && (
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
                          placeholder="Mon Serveur NeoForge"
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
                                  serverType: 'neoforge'
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
                          placeholder="Un serveur Minecraft NeoForge"
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

                  <div className="mt-6 p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Zap className="w-5 h-5 text-purple-400" />
                      <h4 className="font-semibold text-white">Avantages de NeoForge</h4>
                    </div>
                    <ul className="text-sm text-dark-400 space-y-1">
                      <li>• Optimisations de performance avancées</li>
                      <li>• Meilleure stabilité et compatibilité</li>
                      <li>• Support étendu pour les mods modernes</li>
                      <li>• API améliorée pour les développeurs</li>
                    </ul>
                  </div>

                  {error && (
                    <div className="flex items-center space-x-3 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-red-400" />
                      <span className="text-red-400">{error}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-center py-8"
              >
                <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Serveur NeoForge créé avec succès !</h3>
                <p className="text-dark-400 mb-6">
                  Le serveur "{serverConfig.name}" a été créé et est prêt à être démarré.
                </p>
                <div className="bg-dark-800 rounded-lg p-4 text-left">
                  <h4 className="font-semibold text-white mb-2">Détails du serveur :</h4>
                  <div className="space-y-1 text-sm text-dark-400">
                    <p><span className="text-white">Version:</span> {selectedVersion?.version}</p>
                    <p><span className="text-white">Port:</span> {serverConfig.port}</p>
                    <p><span className="text-white">RAM:</span> {serverConfig.ram} MB</p>
                    <p><span className="text-white">Type:</span> NeoForge</p>
                  </div>
                </div>
              </motion.div>
            )}
            
            {/* Boutons de navigation */}
            {step > 1 && step < 3 && (
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setStep(step - 1)}
                  className="btn-secondary"
                >
                  Précédent
                </button>
                
                {step === 2 && (
                  <button
                    onClick={createServer}
                    disabled={loading || !serverConfig.name.trim()}
                    className="btn-primary flex items-center space-x-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Installation...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        <span>Installer NeoForge</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
            
            {step === 3 && (
              <div className="flex justify-end mt-6">
                <button
                  onClick={onClose}
                  className="btn-primary"
                >
                  Terminer
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default NeoForgeBuilder;