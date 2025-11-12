import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Server, 
  Users, 
  HardDrive, 
  Play, 
  Square, 
  RotateCcw,
  Plus,
  Activity,
  ExternalLink,
  FolderOpen,
  Copy,
  BarChart3
} from 'lucide-react';
import { Server as ServerType, ServerStats } from '../types';
import logoImage from '../assets/logo.png';
import { useLanguage } from '../contexts/LanguageContext';
import { CrashDetector } from '../components/AutomationFeatures';
import AdvancedMonitoring from '../components/AdvancedMonitoring';

interface DashboardProps {
  setCurrentPage: (page: string) => void;
}

interface RealTimeServerStats {
  cpu_usage: number;
  memory_usage: number;
  memory_total: number;
  uptime: number;
}

interface Activity {
  id: string;
  type: 'start' | 'stop' | 'restart' | 'crash' | 'create' | 'delete';
  serverName: string;
  timestamp: Date;
  message: string;
}

const Dashboard: React.FC<DashboardProps> = ({ setCurrentPage }) => {
  const { t } = useLanguage();
  const [servers, setServers] = useState<ServerType[]>([]);
  const [realTimeStats, setRealTimeStats] = useState<Record<string, RealTimeServerStats>>({});
  const [showAdvancedMonitoring, setShowAdvancedMonitoring] = useState(false);
  const [monitoringServer, setMonitoringServer] = useState<ServerType | null>(null);
  const [stats, setStats] = useState<ServerStats>({
    ram: 0,
    tps: 20,
    players: 0,
    maxPlayers: 0
  });
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    // Charger les serveurs depuis le stockage local
    const savedServers = localStorage.getItem('nether-client-servers');
    if (savedServers) {
      setServers(JSON.parse(savedServers));
    }

    // Charger les activités depuis le stockage local
    const savedActivities = localStorage.getItem('nether-client-activities');
    if (savedActivities) {
      const parsed = JSON.parse(savedActivities);
      // Convertir les timestamps en objets Date
      const activitiesWithDates = parsed.map((a: any) => ({
        ...a,
        timestamp: new Date(a.timestamp)
      }));
      setActivities(activitiesWithDates);
    }
  }, []);

  // Fonction pour obtenir le message d'activité
  const getActivityMessage = (type: Activity['type'], serverName: string): string => {
    switch (type) {
      case 'start':
        return `Serveur "${serverName}" démarré`;
      case 'stop':
        return `Serveur "${serverName}" arrêté`;
      case 'restart':
        return `Serveur "${serverName}" redémarré`;
      case 'crash':
        return `Serveur "${serverName}" a crashé`;
      case 'create':
        return `Serveur "${serverName}" créé`;
      case 'delete':
        return `Serveur "${serverName}" supprimé`;
      default:
        return `Activité sur "${serverName}"`;
    }
  };

  // Fonction pour ajouter une activité
  const addActivity = (type: Activity['type'], serverName: string, message?: string) => {
    const activity: Activity = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      type,
      serverName,
      timestamp: new Date(),
      message: message || getActivityMessage(type, serverName)
    };

    setActivities(prev => {
      const updated = [activity, ...prev].slice(0, 50); // Garder seulement les 50 dernières
      localStorage.setItem('nether-client-activities', JSON.stringify(updated));
      return updated;
    });
  };

  // Fonction pour obtenir l'icône d'activité
  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'start':
        return <Play className="w-4 h-4 text-green-400" />;
      case 'stop':
        return <Square className="w-4 h-4 text-red-400" />;
      case 'restart':
        return <RotateCcw className="w-4 h-4 text-blue-400" />;
      case 'crash':
        return <Activity className="w-4 h-4 text-red-500" />;
      case 'create':
        return <Plus className="w-4 h-4 text-purple-400" />;
      case 'delete':
        return <Square className="w-4 h-4 text-orange-400" />;
      default:
        return <Activity className="w-4 h-4 text-gray-400" />;
    }
  };

  // Fonction pour formater le temps relatif
  const getRelativeTime = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return 'Il y a quelques secondes';
    if (minutes < 60) return `Il y a ${minutes} minute${minutes > 1 ? 's' : ''}`;
    if (hours < 24) return `Il y a ${hours} heure${hours > 1 ? 's' : ''}`;
    if (days < 7) return `Il y a ${days} jour${days > 1 ? 's' : ''}`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  // Charger les stats en temps réel des serveurs actifs
  useEffect(() => {
    const loadRealTimeStats = async () => {
      const { invoke } = await import('@tauri-apps/api/tauri');
      const newStats: Record<string, RealTimeServerStats> = {};
      let totalRam = 0;
      let totalPlayers = 0;
      let runningServers = 0;

      for (const server of servers) {
        if (server.status === 'running') {
          try {
            const stats = await invoke<RealTimeServerStats>('get_server_stats', {
              serverName: server.name
            });
            newStats[server.id] = stats;
            
            // Accumuler les statistiques globales
            totalRam += stats.memory_usage;
            runningServers++;
            
            // Récupérer le nombre de joueurs connectés
            try {
              const players = await invoke<any[]>('get_server_players', {
                serverPath: server.path
              });
              // Le backend retourne is_online qui est converti en isOnline par Serde
              const onlinePlayers = players.filter(p => p.isOnline === true || p.is_online === true).length;
              totalPlayers += onlinePlayers;
            } catch (error) {
              // Ignorer les erreurs de récupération des joueurs
              console.debug('Erreur récupération joueurs:', error);
            }
          } catch (error) {
            // Ignorer les erreurs silencieusement
            console.debug('Erreur récupération stats:', error);
          }
        }
      }

      setRealTimeStats(newStats);
      
      // Mettre à jour les statistiques globales
      if (runningServers > 0) {
        setStats(prev => ({
          ...prev,
          ram: Math.round((totalRam / 1024 / 1024) * 10) / 10, // RAM en MB
          players: totalPlayers
        }));
      } else {
        setStats(prev => ({
          ...prev,
          ram: 0,
          players: 0
        }));
      }
    };

    // Charger immédiatement
    if (servers.length > 0) {
      loadRealTimeStats();
      // Mettre à jour toutes les 2 secondes pour un rafraîchissement plus rapide
      const interval = setInterval(loadRealTimeStats, 2000);
      return () => clearInterval(interval);
    } else {
      // Réinitialiser les stats si aucun serveur
      setStats({
        ram: 0,
        tps: 20,
        players: 0,
        maxPlayers: 0
      });
    }
  }, [servers]);

  const handleServerAction = async (serverId: string, action: 'start' | 'stop' | 'restart') => {
    const server = servers.find(s => s.id === serverId);
    if (!server) return;

    try {
      // Mettre à jour le statut immédiatement
      const newStatus: 'starting' | 'stopping' = action === 'start' ? 'starting' : 'stopping';
      setServers(prev => prev.map(s => 
        s.id === serverId 
          ? { 
              ...s, 
              status: newStatus
            }
          : s
      ));

      const { invoke } = await import('@tauri-apps/api/tauri');

      if (action === 'start') {
        await invoke('start_server', { 
          serverName: server.name,
          serverPath: server.path 
        });
        
        setServers(prev => {
          const updated = prev.map(s => 
            s.id === serverId ? { ...s, status: 'running' as const } : s
          );
          // Sauvegarder immédiatement pour déclencher le rafraîchissement des stats
          localStorage.setItem('nether-client-servers', JSON.stringify(updated));
          return updated;
        });
        
        // Ajouter l'activité
        addActivity('start', server.name);
      } else if (action === 'stop') {
        await invoke('stop_server', { 
          serverName: server.name 
        });
        
        setServers(prev => {
          const updated = prev.map(s => 
            s.id === serverId ? { ...s, status: 'stopped' as const } : s
          );
          // Sauvegarder immédiatement pour déclencher le rafraîchissement des stats
          localStorage.setItem('nether-client-servers', JSON.stringify(updated));
          return updated;
        });
        
        // Ajouter l'activité
        addActivity('stop', server.name);
      } else if (action === 'restart') {
        await invoke('stop_server', { serverName: server.name });
        await new Promise(resolve => setTimeout(resolve, 2000));
        await invoke('start_server', { 
          serverName: server.name,
          serverPath: server.path 
        });
        
        setServers(prev => {
          const updated = prev.map(s => 
            s.id === serverId ? { ...s, status: 'running' as const } : s
          );
          // Sauvegarder immédiatement pour déclencher le rafraîchissement des stats
          localStorage.setItem('nether-client-servers', JSON.stringify(updated));
          return updated;
        });
        
        // Ajouter l'activité
        addActivity('restart', server.name);
      }
    } catch (error) {
      console.error('Erreur lors de l\'action du serveur:', error);
      alert('Erreur: ' + error);
      
      // Remettre le statut précédent en cas d'erreur
      setServers(prev => prev.map(s => 
        s.id === serverId ? { ...s, status: server.status } : s
      ));
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
      case 'running': return t.dashboard.status.running;
      case 'starting': return t.dashboard.status.starting;
      case 'stopping': return t.dashboard.status.stopping;
      case 'stopped': return t.dashboard.status.stopped;
      case 'error': return t.dashboard.status.error;
      default: return t.dashboard.status.stopped;
    }
  };

  return (
    <div className="h-full p-6 overflow-y-auto overflow-x-hidden scrollbar-hide">
      {/* Hero Header */}
      <motion.div 
        className="mb-12 text-center pb-8 border-b-2 border-purple-500/40"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Logo flottant */}
        <motion.div
          className="flex justify-center mb-6"
          animate={{ 
            y: [0, -10, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <div className="relative inline-block">
            {/* Lueur violette forte derrière le logo (même couleur que les boutons) */}
            <div 
              className="absolute inset-0 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(147, 51, 234, 0.8) 0%, rgba(124, 58, 237, 0.6) 50%, transparent 70%)',
                filter: 'blur(40px)',
                transform: 'scale(1.4)',
                zIndex: 0
              }}
            ></div>
            <div 
              className="absolute inset-0 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(147, 51, 234, 0.5) 0%, transparent 80%)',
                filter: 'blur(20px)',
                transform: 'scale(1.2)',
                zIndex: 0
              }}
            ></div>
            
            {/* Logo */}
            <img 
              src={logoImage} 
              alt="Nether Client Logo" 
              className="w-40 h-40 relative z-10"
              style={{ display: 'block' }}
            />
          </div>
        </motion.div>

        {/* Titre et description */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                >
                  <h1 className="text-4xl font-bold text-white mb-3 drop-shadow-lg">
                    {t.dashboard.title}
                  </h1>
                  <p className="text-lg text-dark-500 mb-4 max-w-2xl mx-auto drop-shadow-sm">
                    {t.dashboard.description}
                  </p>
                  
                  {/* Bouton Josh Studio */}
                  <motion.a
                    href="https://www.josh-studio.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-medium rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span>{t.dashboard.createdBy}</span>
                    <ExternalLink className="w-4 h-4" />
                  </motion.a>
                </motion.div>
      </motion.div>

      {/* Section Dashboard */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-2 drop-shadow-lg">{t.dashboard.subtitle}</h2>
        <p className="text-dark-600 drop-shadow-sm">{t.dashboard.description}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 max-w-5xl mx-auto">
                <motion.div 
                  className="dashboard-card"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-dark-400 text-sm">{t.dashboard.activeServers}</p>
                      <p className="text-2xl font-bold text-white">
                        {servers.filter(s => s.status === 'running').length}
                      </p>
                    </div>
                    <div className="p-3 bg-primary-500/20 rounded-lg">
                      <Server className="w-6 h-6 text-primary-400" />
                    </div>
                  </div>
                </motion.div>

                <motion.div 
                  className="dashboard-card"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-dark-400 text-sm">{t.dashboard.connectedPlayers}</p>
                      <p className="text-2xl font-bold text-white">{stats.players}</p>
                    </div>
                    <div className="p-3 bg-green-500/20 rounded-lg">
                      <Users className="w-6 h-6 text-green-400" />
                    </div>
                  </div>
                </motion.div>

                <motion.div 
                  className="dashboard-card"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-dark-400 text-sm">{t.dashboard.ramUsage}</p>
                      <p className="text-2xl font-bold text-white">{stats.ram} MB</p>
                    </div>
                    <div className="p-3 bg-purple-500/20 rounded-lg">
                      <HardDrive className="w-6 h-6 text-purple-400" />
                    </div>
                  </div>
                </motion.div>

      </div>

      {/* Serveurs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Liste des serveurs */}
                <motion.div 
                  className="card-portal"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-white">{t.dashboard.myServers}</h2>
                    <motion.button
                      onClick={() => setCurrentPage('servers')}
                      className="btn-primary flex items-center space-x-2"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Plus className="w-4 h-4" />
                      <span>{t.dashboard.newServer}</span>
                    </motion.button>
                  </div>

                  <div className="space-y-4">
                    {servers.length === 0 ? (
                      <div className="text-center py-8">
                        <Server className="w-12 h-12 text-dark-600 mx-auto mb-4" />
                        <p className="text-dark-400 mb-2">{t.dashboard.noServers}</p>
                        <p className="text-sm text-dark-500">{t.dashboard.noServersDesc}</p>
                      </div>
            ) : (
              servers.map((server, index) => (
                <motion.div
                  key={server.id}
                  className="bg-dark-800 rounded-lg p-4 border border-dark-700"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                >
                  {/* Détection de crash */}
                  {server.status === 'running' && (
                    <CrashDetector
                      serverName={server.name}
                      onCrashDetected={() => {
                        alert(`Le serveur ${server.name} a crashé !`);
                        addActivity('crash', server.name);
                      }}
                    />
                  )}


                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-white">{server.name}</h3>
                      <p className="text-sm text-dark-400">
                        {server.version} • {server.type}
                      </p>
                    </div>
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
                  </div>

                  {/* Stats en temps réel */}
                  {realTimeStats[server.id] && (
                    <div className="mb-3">
                      <div className="bg-dark-900 rounded px-2 py-1 text-xs">
                        <div className="text-dark-500">RAM</div>
                        <div className="text-white font-semibold">
                          {(realTimeStats[server.id].memory_usage / 1024 / 1024).toFixed(0)}MB
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-dark-400">
                      <span>Port: {server.port}</span>
                      <span className="mx-2">•</span>
                      <span>{server.ram}MB RAM</span>
                    </div>
                    
                    <div className="flex space-x-2">
                      <motion.button
                        onClick={() => handleServerAction(server.id, 'start')}
                        disabled={server.status === 'running' || server.status === 'starting'}
                        className="p-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 disabled:opacity-50"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Play className="w-4 h-4" />
                      </motion.button>
                      
                      <motion.button
                        onClick={() => handleServerAction(server.id, 'stop')}
                        disabled={server.status === 'stopped' || server.status === 'stopping'}
                        className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 disabled:opacity-50"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Square className="w-4 h-4" />
                      </motion.button>
                      
                      <motion.button
                        onClick={() => handleServerAction(server.id, 'restart')}
                        disabled={server.status === 'starting' || server.status === 'stopping'}
                        className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 disabled:opacity-50"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <RotateCcw className="w-4 h-4" />
                      </motion.button>

                      {server.status === 'running' && (
                        <motion.button
                          onClick={() => {
                            setMonitoringServer(server);
                            setShowAdvancedMonitoring(true);
                          }}
                          className="p-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 rounded-lg hover:from-purple-500/30 hover:to-pink-500/30"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          title="Monitoring Avancé"
                        >
                          <BarChart3 className="w-4 h-4" />
                        </motion.button>
                      )}
                    </div>
                  </div>

                </motion.div>
              ))
            )}
          </div>
        </motion.div>

                {/* Activité récente */}
                <motion.div 
                  className="card"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <div className="flex items-center space-x-2 mb-6">
                    <Activity className="w-5 h-5 text-primary-400" />
                    <h2 className="text-xl font-semibold text-white">{t.dashboard.recentActivity}</h2>
                  </div>
                  
                  {activities.length === 0 ? (
                    <div className="text-center py-8 text-dark-400">
                      {t.dashboard.noActivity}
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[600px] overflow-y-auto scrollbar-hide">
                      {activities.map((activity) => (
                        <motion.div
                          key={activity.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="bg-dark-800 rounded-lg p-3 border border-dark-700 hover:border-purple-500/30 transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5 flex-shrink-0">
                              {getActivityIcon(activity.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-white text-sm font-medium">
                                {activity.message}
                              </p>
                              <p className="text-dark-400 text-xs mt-1">
                                {getRelativeTime(activity.timestamp)}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
      </div>

      {/* Modal Monitoring Avancé */}
      {showAdvancedMonitoring && monitoringServer && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowAdvancedMonitoring(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-dark-100 rounded-xl w-full max-w-7xl max-h-[90vh] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b-2 border-purple-500/40 shadow-[0_2px_10px_rgba(168,85,247,0.2)] bg-gradient-to-r from-purple-900/20 to-pink-900/20">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Activity className="w-6 h-6 text-purple-400" />
                Monitoring Avancé - {monitoringServer.name}
              </h2>
              <button
                onClick={() => setShowAdvancedMonitoring(false)}
                className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="overflow-auto max-h-[calc(90vh-5rem)]">
              <AdvancedMonitoring 
                serverName={monitoringServer.name}
                serverPath={monitoringServer.path}
                serverRam={monitoringServer.ram}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default Dashboard;
