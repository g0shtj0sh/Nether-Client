import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Server, 
  Download, 
  Settings, 
  Trash2,
  Play,
  Square,
  RotateCcw,
  FolderOpen,
  Copy,
  Edit,
  RefreshCw
} from 'lucide-react';
import { Server as ServerType, MinecraftVersion } from '../types';
import JavaBuilder from '../components/builders/JavaBuilder';
import ForgeBuilder from '../components/builders/ForgeBuilder';
import NeoForgeBuilder from '../components/builders/NeoForgeBuilder';
import MohistBuilder from '../components/builders/MohistBuilder';
import ServerEditModal from '../components/ServerEditModal';
import { useLanguage } from '../contexts/LanguageContext';

const Servers: React.FC = () => {
  const { t } = useLanguage();
  const [servers, setServers] = useState<ServerType[]>([]);
  const [showBuilder, setShowBuilder] = useState<'java' | 'forge' | 'neoforge' | 'mohist' | null>(null);
  const [selectedServer, setSelectedServer] = useState<ServerType | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    const savedServers = localStorage.getItem('nether-client-servers');
    if (savedServers) {
      setServers(JSON.parse(savedServers));
    }
  }, []);

  // Vérifier périodiquement le statut des serveurs
  useEffect(() => {
    const checkServerStatuses = async () => {
      const { invoke } = await import('@tauri-apps/api/tauri');
      
      const updatedServers = await Promise.all(
        servers.map(async (server) => {
          try {
            const isRunning = await invoke<boolean>('get_server_status', { serverName: server.name });
            const newStatus: 'running' | 'stopped' = isRunning ? 'running' : 'stopped';
            
            // Ne mettre à jour que si le statut a changé
            if (server.status !== newStatus && server.status !== 'starting' && server.status !== 'stopping') {
              return { ...server, status: newStatus };
            }
            return server;
          } catch (error) {
            return server;
          }
        })
      );

      // Vérifier si un serveur a changé de statut
      const hasChanged = updatedServers.some((server, index) => server.status !== servers[index].status);
      
      if (hasChanged) {
        setServers(updatedServers);
        localStorage.setItem('nether-client-servers', JSON.stringify(updatedServers));
      }
    };

    const interval = setInterval(checkServerStatuses, 5000); // Vérifier toutes les 5 secondes
    
    return () => clearInterval(interval);
  }, [servers]);

  const handleServerAction = async (serverId: string, action: 'start' | 'stop' | 'restart') => {
    const server = servers.find(s => s.id === serverId);
    if (!server) return;

    try {
      const { invoke } = await import('@tauri-apps/api/tauri');

      // Mettre à jour le statut en "starting" ou "stopping"
      setServers(prev => prev.map(s => 
        s.id === serverId 
          ? { ...s, status: action === 'start' ? 'starting' : action === 'stop' ? 'stopping' : 'starting' }
          : s
      ));

      if (action === 'start' || action === 'restart') {
        if (action === 'restart') {
          await invoke('stop_server', { serverName: server.name });
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        await invoke('start_server', { 
          serverName: server.name,
          serverPath: server.path 
        });

        // Vérifier le statut après démarrage
        setTimeout(async () => {
          const isRunning = await invoke<boolean>('get_server_status', { serverName: server.name });
          const newStatus: 'running' | 'error' = isRunning ? 'running' : 'error';
          const updatedServers = servers.map(s => 
            s.id === serverId 
              ? { ...s, status: newStatus }
              : s
          );
          setServers(updatedServers);
          localStorage.setItem('nether-client-servers', JSON.stringify(updatedServers));
        }, 3000);
      } else if (action === 'stop') {
        await invoke('stop_server', { serverName: server.name });
        
        const updatedServers = servers.map(s => 
          s.id === serverId ? { ...s, status: 'stopped' as const } : s
        );
        setServers(updatedServers);
        localStorage.setItem('nether-client-servers', JSON.stringify(updatedServers));
      }
    } catch (error) {
      console.error('Erreur action serveur:', error);
      alert(`Erreur: ${error}`);
      setServers(prev => prev.map(s => 
        s.id === serverId ? { ...s, status: 'error' } : s
      ));
    }
  };

  const handleDeleteServer = async (serverId: string) => {
    const server = servers.find(s => s.id === serverId);
    if (!server) return;

    if (!confirm(t.servers.deleteConfirm)) return;

    try {
      const { invoke } = await import('@tauri-apps/api/tauri');
      
      // Arrêter le serveur s'il est en cours d'exécution
      if (server.status === 'running') {
        await invoke('stop_server', { serverName: server.name });
        await new Promise(resolve => setTimeout(resolve, 3000)); // Attendre l'arrêt complet
      }

      console.log('Suppression du serveur:', server.name);
      console.log('Chemin:', server.path);

      // Supprimer le dossier du serveur
      await invoke('delete_server_folder', {
        serverName: server.name,
        serverPath: server.path
      });

      // Supprimer du localStorage
      const updatedServers = servers.filter(s => s.id !== serverId);
      setServers(updatedServers);
      localStorage.setItem('nether-client-servers', JSON.stringify(updatedServers));

      alert(`✅ Serveur "${server.name}" supprimé avec succès !\n\nDossier supprimé : ${server.path}`);
    } catch (error) {
      console.error('Erreur suppression serveur:', error);
      alert(`❌ Erreur lors de la suppression: ${error}`);
    }
  };

  const handleOpenFolder = async (serverPath: string) => {
    try {
      const { invoke } = await import('@tauri-apps/api/tauri');
      await invoke('open_folder', { path: serverPath });
    } catch (error) {
      console.error('Erreur ouverture dossier:', error);
      alert(`❌ Erreur lors de l'ouverture du dossier: ${error}`);
    }
  };

  const handleEditServer = (server: ServerType) => {
    setSelectedServer(server);
    setShowEditModal(true);
  };

  const handleSaveServer = (updatedServer: ServerType) => {
    const updatedServers = servers.map(s => 
      s.id === updatedServer.id ? updatedServer : s
    );
    setServers(updatedServers);
    localStorage.setItem('nether-client-servers', JSON.stringify(updatedServers));
    setShowEditModal(false);
    setSelectedServer(null);
    alert(`✅ Serveur "${updatedServer.name}" mis à jour avec succès !`);
  };

  const handleRefreshServers = async () => {
    setIsScanning(true);
    try {
      const { invoke } = await import('@tauri-apps/api/tauri');
      const detectedServers = await invoke<any[]>('scan_servers_directory');
      
      // Obtenir les chemins des serveurs existants
      const existingPaths = new Set(servers.map(s => s.path.toLowerCase()));
      
      // Filtrer les nouveaux serveurs
      const newServers: ServerType[] = detectedServers
        .filter((detected: any) => !existingPaths.has(detected.path.toLowerCase()))
        .map((detected: any) => {
          // Créer un objet ServerType avec des valeurs par défaut
          const newServer: ServerType = {
            id: `server-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: detected.name,
            version: detected.version || 'Unknown',
            type: (detected.type || 'vanilla') as 'vanilla' | 'forge' | 'neoforge' | 'mohist',
            port: detected.port || 25565,
            ram: 2048, // Valeur par défaut
            motd: 'A Minecraft Server',
            maxPlayers: 20,
            difficulty: 'normal',
            gamemode: 'survival',
            whitelist: [],
            ops: [],
            bannedPlayers: [],
            bannedIPs: [],
            status: 'stopped',
            path: detected.path,
            createdAt: new Date(),
          };
          return newServer;
        });
      
      if (newServers.length > 0) {
        const updatedServers = [...servers, ...newServers];
        setServers(updatedServers);
        localStorage.setItem('nether-client-servers', JSON.stringify(updatedServers));
        alert(`✅ ${t.servers.newServersFound} (${newServers.length})`);
      } else {
        alert(t.servers.noNewServers);
      }
    } catch (error) {
      console.error('Erreur scan serveurs:', error);
      alert(`❌ Erreur lors du scan: ${error}`);
    } finally {
      setIsScanning(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'text-green-400';
      case 'starting': return 'text-yellow-400';
      case 'stopping': return 'text-orange-400';
      case 'stopped': return 'text-red-400';
      case 'error': return 'text-red-500';
      default: return 'text-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'running': return t.servers.running;
      case 'starting': return t.servers.starting;
      case 'stopping': return t.servers.stopping;
      case 'stopped': return t.servers.stopped;
      case 'error': return t.servers.error;
      default: return t.servers.unknown;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'vanilla': return 'bg-blue-500/20 text-blue-400';
      case 'forge': return 'bg-orange-500/20 text-orange-400';
      case 'neoforge': return 'bg-purple-500/20 text-purple-400';
      case 'mohist': return 'bg-purple-500/20 text-purple-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <div className="h-full p-6 overflow-y-auto overflow-x-hidden scrollbar-hide">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">{t.servers.title}</h1>
          <p className="text-dark-400">{t.servers.subtitle}</p>
        </div>
        <motion.button
          onClick={handleRefreshServers}
          disabled={isScanning}
          className="btn-secondary flex items-center space-x-2"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title={t.servers.refreshDesc}
        >
          <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
          <span>{isScanning ? t.servers.scanning : t.servers.refresh}</span>
        </motion.button>
      </div>

      {/* Actions rapides */}
      <div className="flex flex-wrap gap-4 mb-8">
        <motion.button
          onClick={() => setShowBuilder('java')}
          className="btn-primary flex items-center space-x-2"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Plus className="w-4 h-4" />
          <span>{t.servers.vanillaServer}</span>
        </motion.button>

        <motion.button
          onClick={() => setShowBuilder('forge')}
          className="btn-primary flex items-center space-x-2"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Plus className="w-4 h-4" />
          <span>{t.servers.forgeServer}</span>
        </motion.button>

        <motion.button
          onClick={() => setShowBuilder('neoforge')}
          className="btn-primary flex items-center space-x-2"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Plus className="w-4 h-4" />
          <span>{t.servers.neoforgeServer}</span>
        </motion.button>

        <motion.button
          onClick={() => setShowBuilder('mohist')}
          className="btn-primary flex items-center space-x-2"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Plus className="w-4 h-4" />
          <span>{t.servers.mohistServer}</span>
        </motion.button>
      </div>

      {/* Liste des serveurs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {servers.map((server, index) => (
          <motion.div
            key={server.id}
            className="card hover:border-primary-500/50 transition-colors duration-200"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            {/* Header du serveur */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-dark-800 rounded-lg">
                  <Server className="w-5 h-5 text-primary-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{server.name}</h3>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded text-xs ${getTypeColor(server.type)}`}>
                      {server.type}
                    </span>
                    <span className="text-xs text-dark-400">{server.version}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-1">
                <motion.button
                  onClick={() => handleEditServer(server)}
                  className="p-1 text-dark-400 hover:text-white"
                  whileHover={{ scale: 1.1 }}
                  title="Modifier le serveur"
                >
                  <Edit className="w-4 h-4" />
                </motion.button>
                <motion.button
                  onClick={() => handleDeleteServer(server.id)}
                  className="p-1 text-dark-400 hover:text-red-400"
                  whileHover={{ scale: 1.1 }}
                >
                  <Trash2 className="w-4 h-4" />
                </motion.button>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  server.status === 'running' ? 'bg-green-400' :
                  server.status === 'starting' ? 'bg-yellow-400' :
                  server.status === 'stopping' ? 'bg-orange-400' :
                  'bg-red-400'
                }`} />
                <span className={`text-sm ${getStatusColor(server.status)}`}>
                  {getStatusText(server.status)}
                </span>
              </div>
              
              {server.status === 'running' && (
                <div className="text-sm text-dark-400">
                  {server.players?.length || 0} {t.servers.players}
                </div>
              )}
            </div>

            {/* Informations */}
            <div className="space-y-2 mb-4 text-sm text-dark-400">
              <div className="flex justify-between">
                <span>{t.servers.port}:</span>
                <span className="text-white">{server.port}</span>
              </div>
              <div className="flex justify-between">
                <span>{t.servers.ram}:</span>
                <span className="text-white">{server.ram}MB</span>
              </div>
              <div className="flex justify-between">
                <span>{t.servers.mode}:</span>
                <span className="text-white capitalize">{server.gamemode}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-2">
              <motion.button
                onClick={() => handleServerAction(server.id, 'start')}
                disabled={server.status === 'running' || server.status === 'starting'}
                className="flex-1 flex items-center justify-center space-x-2 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 disabled:opacity-50"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Play className="w-4 h-4" />
                <span>{t.servers.start}</span>
              </motion.button>
              
              <motion.button
                onClick={() => handleServerAction(server.id, 'stop')}
                disabled={server.status === 'stopped' || server.status === 'stopping'}
                className="flex-1 flex items-center justify-center space-x-2 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 disabled:opacity-50"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Square className="w-4 h-4" />
                <span>{t.servers.stop}</span>
              </motion.button>
              
              <motion.button
                onClick={() => handleServerAction(server.id, 'restart')}
                disabled={server.status === 'starting' || server.status === 'stopping'}
                className="flex-1 flex items-center justify-center space-x-2 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 disabled:opacity-50"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <RotateCcw className="w-4 h-4" />
                <span>{t.servers.restart}</span>
              </motion.button>
            </div>

            {/* Actions supplémentaires */}
            <div className="flex space-x-2 mt-3">
              <motion.button
                onClick={() => handleOpenFolder(server.path)}
                className="flex-1 flex items-center justify-center space-x-2 py-2 bg-dark-800 text-dark-300 rounded-lg hover:bg-dark-700 hover:text-white"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                title={`Ouvrir le dossier: ${server.path}`}
              >
                <FolderOpen className="w-4 h-4" />
                <span>{t.servers.folder}</span>
              </motion.button>
              
              <motion.button
                className="flex-1 flex items-center justify-center space-x-2 py-2 bg-dark-800 text-dark-300 rounded-lg hover:bg-dark-700 hover:text-white"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                title="Dupliquer ce serveur (bientôt disponible)"
              >
                <Copy className="w-4 h-4" />
                <span>{t.servers.copy}</span>
              </motion.button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Message si aucun serveur */}
      {servers.length === 0 && (
        <motion.div 
          className="text-center py-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Server className="w-16 h-16 text-dark-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">{t.servers.noServers}</h3>
          <p className="text-dark-400 mb-6">{t.servers.noServersDesc}</p>
          <motion.button
            onClick={() => setShowBuilder('java')}
            className="btn-primary"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {t.servers.createVanilla}
          </motion.button>
        </motion.div>
      )}

      {/* Modals des builders */}
      <AnimatePresence>
        {showBuilder === 'java' && (
          <JavaBuilder 
            onClose={() => setShowBuilder(null)}
            onServerCreated={(server) => {
              setServers(prev => [...prev, server]);
              localStorage.setItem('nether-client-servers', JSON.stringify([...servers, server]));
              setShowBuilder(null);
            }}
          />
        )}
        
        {showBuilder === 'forge' && (
          <ForgeBuilder 
            onClose={() => setShowBuilder(null)}
            onServerCreated={(server) => {
              setServers(prev => [...prev, server]);
              localStorage.setItem('nether-client-servers', JSON.stringify([...servers, server]));
              setShowBuilder(null);
            }}
          />
        )}
        
        {showBuilder === 'neoforge' && (
          <NeoForgeBuilder 
            onClose={() => setShowBuilder(null)}
            onServerCreated={(server) => {
              setServers(prev => [...prev, server]);
              localStorage.setItem('nether-client-servers', JSON.stringify([...servers, server]));
              setShowBuilder(null);
            }}
          />
        )}

        {showBuilder === 'mohist' && (
          <MohistBuilder 
            onClose={() => setShowBuilder(null)}
            onServerCreated={(server) => {
              setServers(prev => [...prev, server]);
              localStorage.setItem('nether-client-servers', JSON.stringify([...servers, server]));
              setShowBuilder(null);
            }}
          />
        )}

        {/* Modal d'édition */}
        {showEditModal && selectedServer && (
          <ServerEditModal
            server={selectedServer}
            onClose={() => {
              setShowEditModal(false);
              setSelectedServer(null);
            }}
            onSave={handleSaveServer}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Servers;