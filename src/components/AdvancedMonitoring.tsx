import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Activity, HardDrive, Zap, TrendingUp, TrendingDown, Clock, AlertTriangle, BarChart3, Users } from 'lucide-react';
import { invoke } from '@tauri-apps/api/tauri';

interface MonitoringData {
  timestamp: string;
  ram: number;
  tps: number;
  players: number;
}

interface AdvancedMonitoringProps {
  serverName: string;
  serverPath?: string;
  serverRam?: number; // RAM allouée au serveur en MB
}

const AdvancedMonitoring: React.FC<AdvancedMonitoringProps> = ({ serverName, serverPath, serverRam }) => {
  const [data, setData] = useState<MonitoringData[]>([]);
  const [currentStats, setCurrentStats] = useState({
    ram: 0,
    ramTotal: 0,
    ramUsed: 0,
    tps: 20,
    players: 0,
    uptime: 0,
  });
  const [alerts, setAlerts] = useState<string[]>([]);
  const intervalRef = useRef<number | null>(null);

  // Vérifier les alertes
  useEffect(() => {
    checkAlerts();
  }, [currentStats]);

  const loadStats = useCallback(async () => {
    try {
      const stats: any = await invoke('get_server_stats', {
        serverName: serverName,
      });

      const ramMB = Math.round(stats.memory_usage / 1024 / 1024);
      // Utiliser la RAM allouée au serveur si disponible, sinon utiliser la RAM totale du système
      const ramTotalMB = serverRam ? serverRam : Math.round(stats.memory_total / 1024 / 1024);
      const ramPercent = ramTotalMB > 0 ? Math.round((ramMB / ramTotalMB) * 100) : 0;

      // Récupérer le nombre de joueurs connectés
      let playerCount = 0;
      if (serverPath) {
        try {
          const players = await invoke<any[]>('get_server_players', {
            serverPath: serverPath
          });
          // Filtrer les joueurs en ligne (vérifier les deux formats possibles)
          // Utiliser une vérification stricte pour éviter les faux positifs
          playerCount = players.filter(p => {
            const isOnline = p.isOnline === true || p.is_online === true;
            // Ignorer les valeurs string "true" car elles ne sont pas fiables
            return isOnline;
          }).length;
          
          // Log pour débogage (seulement si le nombre change)
          if (playerCount !== currentStats.players) {
            console.log('Joueurs mis à jour:', playerCount, 'sur', players.length, 'joueurs totaux');
          }
        } catch (error) {
          console.error('Erreur récupération joueurs:', error);
        }
      } else {
        console.warn('serverPath non défini, impossible de récupérer les joueurs');
      }

      setCurrentStats({
        ram: ramPercent,
        ramTotal: ramTotalMB,
        ramUsed: ramMB,
        tps: 20, // TODO: Implémenter lecture TPS réelle
        players: playerCount,
        uptime: stats.uptime,
      });

      // Ajouter au graphique
      const now = new Date();
      const timeStr = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
      
      setData(prev => {
        const newData = [
          ...prev,
          {
            timestamp: timeStr,
            ram: ramMB, // Utiliser la RAM en MB pour le graphique
            tps: 20,
            players: playerCount,
          }
        ];
        
        // Garder seulement les 30 dernières entrées (1 minute)
        return newData.slice(-30);
      });
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    }
  }, [serverName, serverPath, serverRam]);

  // Charger les stats toutes les 2 secondes
  useEffect(() => {
    if (!serverName) return;
    
    // Charger immédiatement
    loadStats();
    
    // Puis toutes les 2 secondes
    intervalRef.current = window.setInterval(() => {
      loadStats();
    }, 2000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [loadStats, serverName]);

  const checkAlerts = () => {
    const newAlerts: string[] = [];

    if (currentStats.ram > 90) {
      newAlerts.push('🔴 RAM critique (>' + currentStats.ram + '%)');
    } else if (currentStats.ram > 75) {
      newAlerts.push('⚠️ RAM élevée (>' + currentStats.ram + '%)');
    }

    if (currentStats.tps < 18) {
      newAlerts.push('⚠️ TPS bas (' + currentStats.tps + ')');
    }

    setAlerts(newAlerts);
  };

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}h ${minutes}m ${secs}s`;
  };

  const getStatusColor = (value: number, thresholds: { warning: number; critical: number }) => {
    if (value >= thresholds.critical) return 'text-red-400';
    if (value >= thresholds.warning) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getStatusBg = (value: number, thresholds: { warning: number; critical: number }) => {
    if (value >= thresholds.critical) return 'bg-red-500/20 border-red-500/50';
    if (value >= thresholds.warning) return 'bg-yellow-500/20 border-yellow-500/50';
    return 'bg-green-500/20 border-green-500/50';
  };

  return (
    <div className="h-full p-6 overflow-auto">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-purple-500" />
              Monitoring Avancé
            </h2>
            <p className="text-gray-400 mt-1">Serveur: {serverName}</p>
          </div>

          <div className="text-right">
            <div className="text-sm text-gray-400">Uptime</div>
            <div className="text-xl font-mono font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-purple-400" />
              {formatUptime(currentStats.uptime)}
            </div>
          </div>
        </div>

        {/* Alertes */}
        {alerts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/10 border border-red-500/30 rounded-lg p-4"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-bold text-red-400 mb-2">Alertes Actives</h3>
                <div className="space-y-1">
                  {alerts.map((alert, index) => (
                    <div key={index} className="text-sm text-red-300">
                      {alert}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Stats en temps réel */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* RAM */}
          <div className={`border rounded-lg p-4 ${getStatusBg(currentStats.ram, { warning: 75, critical: 90 })}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <HardDrive className="w-5 h-5 text-blue-400" />
                <span className="font-medium text-gray-300">RAM</span>
              </div>
              {currentStats.ram > 60 ? (
                <TrendingUp className="w-4 h-4 text-red-400" />
              ) : (
                <TrendingDown className="w-4 h-4 text-green-400" />
              )}
            </div>
            <div className={`text-3xl font-bold ${getStatusColor(currentStats.ram, { warning: 75, critical: 90 })}`}>
              {currentStats.ram}%
            </div>
            <div className="text-sm text-gray-400 mt-1">
              {currentStats.ramUsed} / {currentStats.ramTotal} MB
            </div>
            <div className="mt-2 h-1 bg-dark-700 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  currentStats.ram >= 90
                    ? 'bg-red-500'
                    : currentStats.ram >= 75
                    ? 'bg-yellow-500'
                    : 'bg-blue-500'
                }`}
                style={{ width: `${currentStats.ram}%` }}
              />
            </div>
          </div>

          {/* TPS */}
          <div className={`border rounded-lg p-4 ${getStatusBg(20 - currentStats.tps, { warning: 2, critical: 5 })}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                <span className="font-medium text-gray-300">TPS</span>
              </div>
              {currentStats.tps >= 19 ? (
                <TrendingUp className="w-4 h-4 text-green-400" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-400" />
              )}
            </div>
            <div className={`text-3xl font-bold ${
              currentStats.tps >= 19 ? 'text-green-400' : currentStats.tps >= 18 ? 'text-yellow-400' : 'text-red-400'
            }`}>
              {currentStats.tps.toFixed(1)}
            </div>
            <div className="text-sm text-gray-400 mt-1">
              {currentStats.tps >= 19 ? 'Excellent' : currentStats.tps >= 18 ? 'Bon' : 'Lag détecté'}
            </div>
          </div>

          {/* Joueurs */}
          <div className="border border-purple-500/30 bg-purple-500/10 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-400" />
                <span className="font-medium text-gray-300">Joueurs</span>
              </div>
            </div>
            <div className="text-3xl font-bold text-purple-400">
              {currentStats.players}
            </div>
            <div className="text-sm text-gray-400 mt-1">
              Connectés
            </div>
          </div>
        </div>

        {/* Graphiques */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Graphique RAM */}
          <div className="bg-gradient-to-br from-dark-200 to-dark-300 border border-dark-400 rounded-lg p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-blue-400" />
              Utilisation RAM
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorRam" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="timestamp" stroke="#9ca3af" fontSize={12} />
                <YAxis 
                  stroke="#9ca3af" 
                  fontSize={12} 
                  domain={[0, currentStats.ramTotal || 2048]} 
                  label={{ value: 'MB', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                  }}
                  formatter={(value: any) => [`${value} MB`, 'RAM']}
                />
                <Area type="monotone" dataKey="ram" stroke="#3b82f6" fillOpacity={1} fill="url(#colorRam)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Graphique TPS & Joueurs */}
          <div className="bg-gradient-to-br from-dark-200 to-dark-300 border border-dark-400 rounded-lg p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-green-400" />
              Performance Serveur
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="timestamp" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="tps" stroke="#10b981" strokeWidth={2} dot={false} name="TPS" />
                <Line type="monotone" dataKey="players" stroke="#f59e0b" strokeWidth={2} dot={false} name="Joueurs" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedMonitoring;

