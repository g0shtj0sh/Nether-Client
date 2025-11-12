import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Info,
  RefreshCw,
  Shield,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import {
  ModInfo,
  Conflict,
  parseModFileName,
  detectConflicts,
  generateModHealthReport,
  getSuggestionsForConflict,
  getConflictIcon,
  getSeverityColor,
} from '../services/modConflictDetector';

interface ModConflictAnalyzerProps {
  serverPath: string;
  serverVersion: string;
  serverType: string;
}

const ModConflictAnalyzer: React.FC<ModConflictAnalyzerProps> = ({
  serverPath,
  serverVersion,
  serverType,
}) => {
  const [analyzing, setAnalyzing] = useState(false);
  const [modInfos, setModInfos] = useState<ModInfo[]>([]);
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [healthReport, setHealthReport] = useState<any>(null);
  const [selectedConflict, setSelectedConflict] = useState<Conflict | null>(null);

  useEffect(() => {
    analyzeConflicts();
  }, [serverPath]);

  const analyzeConflicts = async () => {
    setAnalyzing(true);
    try {
      const { invoke } = await import('@tauri-apps/api/tauri');
      
      // Charger la liste des mods
      const modList: any[] = await invoke('list_server_mods', {
        serverPath: serverPath,
      });

      // Parser les infos des mods
      const parsedMods = modList.map(mod => parseModFileName(mod.name));
      setModInfos(parsedMods);

      // Détecter les conflits
      const detected = detectConflicts(parsedMods, serverVersion, serverType);
      setConflicts(detected);

      // Générer le rapport de santé
      const report = generateModHealthReport(parsedMods, detected);
      setHealthReport(report);
    } catch (error) {
      console.error('Erreur analyse conflits:', error);
    }
    setAnalyzing(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent': return <CheckCircle2 className="w-8 h-8 text-green-400" />;
      case 'good': return <CheckCircle2 className="w-8 h-8 text-blue-400" />;
      case 'warning': return <AlertTriangle className="w-8 h-8 text-yellow-400" />;
      case 'critical': return <XCircle className="w-8 h-8 text-red-400" />;
      default: return <Info className="w-8 h-8 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'from-green-600 to-green-800';
      case 'good': return 'from-blue-600 to-blue-800';
      case 'warning': return 'from-yellow-600 to-yellow-800';
      case 'critical': return 'from-red-600 to-red-800';
      default: return 'from-gray-600 to-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'excellent': return 'Excellent';
      case 'good': return 'Bon';
      case 'warning': return 'Attention';
      case 'critical': return 'Critique';
      default: return 'Inconnu';
    }
  };

  if (analyzing) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-16 h-16 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-xl text-gray-400">Analyse des conflits en cours...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto p-6 space-y-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold flex items-center gap-3">
              <Shield className="w-8 h-8 text-purple-500" />
              Analyse de Conflits
            </h2>
            <p className="text-gray-400 mt-1">Détection automatique des problèmes</p>
          </div>

          <button
            onClick={analyzeConflicts}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Réanalyser
          </button>
        </div>

        {/* Score de santé */}
        {healthReport && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-gradient-to-r ${getStatusColor(healthReport.status)} p-6 rounded-xl shadow-xl mb-6`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {getStatusIcon(healthReport.status)}
                <div>
                  <h3 className="text-2xl font-bold text-white">
                    État: {getStatusText(healthReport.status)}
                  </h3>
                  <p className="text-white/80 text-sm">
                    {healthReport.totalMods} mods installés
                  </p>
                </div>
              </div>

              <div className="text-right">
                <div className="text-5xl font-bold text-white">
                  {healthReport.healthScore}%
                </div>
                <div className="text-white/80 text-sm">
                  Score de santé
                </div>
              </div>
            </div>

            {/* Statistiques */}
            <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/20">
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{healthReport.errors}</div>
                <div className="text-white/80 text-sm">Erreurs</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{healthReport.warnings}</div>
                <div className="text-white/80 text-sm">Avertissements</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{healthReport.info}</div>
                <div className="text-white/80 text-sm">Infos</div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Liste des conflits */}
        {conflicts.length > 0 ? (
          <div className="space-y-4">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              Conflits Détectés ({conflicts.length})
            </h3>

            {conflicts.map((conflict, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-gradient-to-br from-dark-200 to-dark-300 border border-dark-400 rounded-lg p-4 hover:border-purple-500 transition-all cursor-pointer"
                onClick={() => setSelectedConflict(selectedConflict?.message === conflict.message ? null : conflict)}
              >
                <div className="flex items-start gap-4">
                  {/* Icône */}
                  <div className="text-3xl">{getConflictIcon(conflict.type)}</div>

                  {/* Contenu */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                        conflict.severity === 'error' 
                          ? 'bg-red-500/20 text-red-400'
                          : conflict.severity === 'warning'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {conflict.severity}
                      </span>

                      <span className="text-sm text-gray-500">
                        {conflict.type.replace('_', ' ')}
                      </span>
                    </div>

                    <h4 className="font-bold text-white mb-1">{conflict.message}</h4>

                    {conflict.mod2 && (
                      <p className="text-sm text-gray-400 mb-2">
                        Entre: <span className="text-purple-400">{conflict.mod1}</span> et{' '}
                        <span className="text-purple-400">{conflict.mod2}</span>
                      </p>
                    )}

                    {/* Suggestions (si sélectionné) */}
                    {selectedConflict?.message === conflict.message && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-4 pt-4 border-t-2 border-purple-500/40 shadow-[0_-2px_10px_rgba(168,85,247,0.15)]"
                      >
                        <h5 className="font-bold text-sm text-gray-300 mb-2">💡 Suggestions:</h5>
                        <ul className="space-y-2">
                          {getSuggestionsForConflict(conflict).map((suggestion, i) => (
                            <li key={i} className="text-sm text-gray-400 flex items-start gap-2">
                              <span className="text-purple-400 mt-1">•</span>
                              <span>{suggestion}</span>
                            </li>
                          ))}
                        </ul>
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/30 rounded-lg p-8 text-center"
          >
            <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">
              Aucun conflit détecté !
            </h3>
            <p className="text-gray-400">
              Tous vos mods sont compatibles entre eux. Excellent travail ! 🎉
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ModConflictAnalyzer;

