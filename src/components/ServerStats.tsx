import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Activity, 
  Clock, 
  Users,
  Download,
  BarChart3
} from 'lucide-react';

interface ServerStatsProps {
  serverName: string;
  serverPath: string;
}

interface StatsData {
  cpu_usage: number;
  memory_usage: number;
  memory_total: number;
  uptime: number;
}

interface HistoricalData {
  timestamp: number;
  cpu: number;
  memory: number;
}

const ServerStats: React.FC<ServerStatsProps> = ({ serverName, serverPath }) => {
  const [currentStats, setCurrentStats] = useState<StatsData | null>(null);
  const [historicalData, setHistoricalData] = useState<HistoricalData[]>([]);
  const [maxDataPoints] = useState(20);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { invoke } = await import('@tauri-apps/api/tauri');
        const stats = await invoke<StatsData>('get_server_stats', { serverName });
        
        setCurrentStats(stats);
        
        // Ajouter aux données historiques
        setHistoricalData(prev => {
          const newData = [
            ...prev,
            {
              timestamp: Date.now(),
              cpu: stats.cpu_usage,
              memory: (stats.memory_usage / 1024 / 1024) // MB
            }
          ];
          
          // Garder seulement les N derniers points
          if (newData.length > maxDataPoints) {
            return newData.slice(-maxDataPoints);
          }
          return newData;
        });
      } catch (error) {
        console.error('Erreur récupération stats:', error);
        // En cas d'erreur, ajouter des données par défaut pour éviter un graphique vide
        setHistoricalData(prev => {
          const newData = [
            ...prev,
            {
              timestamp: Date.now(),
              cpu: 0,
              memory: 0
            }
          ];
          
          if (newData.length > maxDataPoints) {
            return newData.slice(-maxDataPoints);
          }
          return newData;
        });
      }
    };

    // Charger immédiatement
    fetchStats();
    
    // Puis toutes les 3 secondes
    const interval = setInterval(fetchStats, 3000);
    return () => clearInterval(interval);
  }, [serverName, maxDataPoints]);

  const formatUptime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const exportStats = () => {
    const statsReport = {
      server: serverName,
      exportDate: new Date().toISOString(),
      currentStats,
      historicalData,
      summary: {
        avgCpu: historicalData.reduce((sum, d) => sum + d.cpu, 0) / historicalData.length,
        avgMemory: historicalData.reduce((sum, d) => sum + d.memory, 0) / historicalData.length,
        maxCpu: Math.max(...historicalData.map(d => d.cpu)),
        maxMemory: Math.max(...historicalData.map(d => d.memory))
      }
    };

    const blob = new Blob([JSON.stringify(statsReport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stats_${serverName}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!currentStats) {
    return (
      <div className="bg-dark-800 rounded-lg p-6">
        <p className="text-dark-400 text-center">Chargement des statistiques...</p>
      </div>
    );
  }

  const maxCpu = historicalData.length > 0 ? Math.max(...historicalData.map(d => d.cpu), 1) : 100;
  const maxMemory = historicalData.length > 0 ? Math.max(...historicalData.map(d => d.memory), 1) : 1000;

  return (
    <div className="space-y-6">
      {/* Stats actuelles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 border border-blue-500/30 rounded-lg p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <Activity className="w-5 h-5 text-blue-400" />
            <span className="text-2xl font-bold text-white">
              {currentStats.cpu_usage.toFixed(1)}%
            </span>
          </div>
          <p className="text-sm text-blue-300">Utilisation CPU</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 border border-purple-500/30 rounded-lg p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-5 h-5 text-purple-400" />
            <span className="text-2xl font-bold text-white">
              {(currentStats.memory_usage / 1024 / 1024).toFixed(0)} MB
            </span>
          </div>
          <p className="text-sm text-purple-300">Mémoire utilisée</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-green-600/20 to-green-800/20 border border-green-500/30 rounded-lg p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-5 h-5 text-green-400" />
            <span className="text-2xl font-bold text-white">
              {formatUptime(currentStats.uptime)}
            </span>
          </div>
          <p className="text-sm text-green-300">Temps d'activité</p>
        </motion.div>
      </div>

      {/* Graphiques historiques */}
      <div className="bg-dark-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">Historique des performances</h3>
          </div>
          <motion.button
            onClick={exportStats}
            className="btn-secondary flex items-center space-x-2 text-sm"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Download className="w-4 h-4" />
            <span>Exporter</span>
          </motion.button>
        </div>

        {historicalData.length > 0 ? (
          <div className="space-y-6">
            {/* Graphique CPU */}
            <div>
              <p className="text-sm text-dark-400 mb-2">CPU (%)</p>
              <div className="h-24 flex items-end space-x-1">
                {historicalData.map((data, index) => (
                  <motion.div
                    key={index}
                    initial={{ height: 0 }}
                    animate={{ height: `${(data.cpu / maxCpu) * 100}%` }}
                    className="flex-1 bg-gradient-to-t from-blue-600 to-blue-400 rounded-t"
                    style={{ minHeight: '2px' }}
                  />
                ))}
              </div>
              <div className="flex justify-between text-xs text-dark-500 mt-1">
                <span>-{maxDataPoints * 3}s</span>
                <span>Maintenant</span>
              </div>
            </div>

            {/* Graphique Mémoire */}
            <div>
              <p className="text-sm text-dark-400 mb-2">Mémoire (MB)</p>
              <div className="h-24 flex items-end space-x-1">
                {historicalData.map((data, index) => (
                  <motion.div
                    key={index}
                    initial={{ height: 0 }}
                    animate={{ height: `${(data.memory / maxMemory) * 100}%` }}
                    className="flex-1 bg-gradient-to-t from-purple-600 to-purple-400 rounded-t"
                    style={{ minHeight: '2px' }}
                  />
                ))}
              </div>
              <div className="flex justify-between text-xs text-dark-500 mt-1">
                <span>-{maxDataPoints * 3}s</span>
                <span>Maintenant</span>
              </div>
            </div>

            {/* Statistiques résumées */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t-2 border-purple-500/40 shadow-[0_-2px_10px_rgba(168,85,247,0.15)]">
              <div className="text-center">
                <p className="text-xs text-dark-500">CPU Moyen</p>
                <p className="text-lg font-semibold text-blue-400">
                  {historicalData.length > 0 
                    ? (historicalData.reduce((sum, d) => sum + d.cpu, 0) / historicalData.length).toFixed(1)
                    : '0.0'}%
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-dark-500">CPU Max</p>
                <p className="text-lg font-semibold text-blue-400">
                  {historicalData.length > 0 
                    ? Math.max(...historicalData.map(d => d.cpu)).toFixed(1)
                    : '0.0'}%
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-dark-500">RAM Moyenne</p>
                <p className="text-lg font-semibold text-purple-400">
                  {historicalData.length > 0 
                    ? (historicalData.reduce((sum, d) => sum + d.memory, 0) / historicalData.length).toFixed(0)
                    : '0'} MB
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-dark-500">RAM Max</p>
                <p className="text-lg font-semibold text-purple-400">
                  {historicalData.length > 0 
                    ? Math.max(...historicalData.map(d => d.memory)).toFixed(0)
                    : '0'} MB
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <BarChart3 className="w-12 h-12 text-dark-600 mx-auto mb-4" />
            <p className="text-dark-400">Collecte des données en cours...</p>
            <p className="text-sm text-dark-500 mt-2">Les graphiques apparaîtront dans quelques secondes</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ServerStats;

