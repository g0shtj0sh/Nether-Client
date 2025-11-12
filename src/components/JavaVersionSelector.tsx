import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, 
  AlertTriangle, 
  Download, 
  RefreshCw, 
  Settings,
  X,
  ExternalLink
} from 'lucide-react';

interface JavaVersion {
  path: string;
  version: string;
  type: 'JDK' | 'JRE' | 'System';
  source: string;
}

interface JavaVersionSelectorProps {
  minecraftVersion: string;
  onJavaSelected: (javaPath: string) => void;
  onClose: () => void;
}

const JavaVersionSelector: React.FC<JavaVersionSelectorProps> = ({
  minecraftVersion,
  onJavaSelected,
  onClose
}) => {
  const [javaVersions, setJavaVersions] = useState<JavaVersion[]>([]);
  const [selectedJava, setSelectedJava] = useState<JavaVersion | null>(null);
  const [recommendedVersion, setRecommendedVersion] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    detectJavaVersions();
  }, [minecraftVersion]);

  const detectJavaVersions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { invoke } = await import('@tauri-apps/api/tauri');
      
      // Détecter toutes les versions Java
      const versions = await invoke<JavaVersion[]>('detect_java_versions');
      setJavaVersions(versions);
      
      // Obtenir la version recommandée
      const recommended = await invoke<string>('get_recommended_java_version', {
        minecraftVersion: minecraftVersion
      });
      setRecommendedVersion(recommended);
      
      // Sélectionner automatiquement la meilleure version
      const bestJava = await invoke<JavaVersion | null>('select_best_java_version', {
        minecraftVersion: minecraftVersion
      });
      
      if (bestJava) {
        setSelectedJava(bestJava);
      } else if (versions.length > 0) {
        setSelectedJava(versions[0]);
      }
      
    } catch (err) {
      console.error('Erreur détection Java:', err);
      setError(`Erreur lors de la détection des versions Java: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectJava = (java: JavaVersion) => {
    setSelectedJava(java);
  };

  const handleConfirm = () => {
    if (selectedJava) {
      onJavaSelected(selectedJava.path);
      onClose();
    }
  };

  const getVersionStatus = (version: string) => {
    const versionMajor = parseInt(version.split('.')[0]);
    const recommendedMajor = parseInt(recommendedVersion);
    
    if (versionMajor >= recommendedMajor) {
      return { status: 'compatible', color: 'text-green-400', icon: CheckCircle };
    } else if (versionMajor >= recommendedMajor - 4) {
      return { status: 'warning', color: 'text-yellow-400', icon: AlertTriangle };
    } else {
      return { status: 'incompatible', color: 'text-red-400', icon: X };
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'Program Files':
      case 'Program Files (x86)':
        return '📁';
      case 'PATH':
        return '⚙️';
      case 'JAVA_HOME':
        return '🏠';
      default:
        return '🔍';
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-dark-100 to-dark-200 rounded-xl border border-dark-400 shadow-2xl p-8 max-w-md w-full"
        >
          <div className="text-center">
            <RefreshCw className="w-8 h-8 text-primary-400 mx-auto mb-4 animate-spin" />
            <h3 className="text-xl font-semibold text-white mb-2">
              Détection des versions Java...
            </h3>
            <p className="text-dark-400">
              Recherche dans Program Files, PATH et JAVA_HOME
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-br from-dark-100 to-dark-200 rounded-xl border border-dark-400 shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b-2 border-purple-500/30 shadow-[0_2px_10px_rgba(168,85,247,0.1)] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Settings className="w-6 h-6 text-primary-400" />
            <div>
              <h2 className="text-2xl font-bold text-white">Sélection de Java</h2>
              <p className="text-sm text-dark-400">
                Version Minecraft: {minecraftVersion} | Java recommandé: {recommendedVersion}+
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-dark-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {error ? (
            <div className="text-center py-8">
              <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Erreur de détection</h3>
              <p className="text-red-300 mb-4">{error}</p>
              <button
                onClick={detectJavaVersions}
                className="btn-primary flex items-center space-x-2 mx-auto"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Réessayer</span>
              </button>
            </div>
          ) : javaVersions.length === 0 ? (
            <div className="text-center py-8">
              <AlertTriangle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Aucune version Java trouvée</h3>
              <p className="text-dark-400 mb-6">
                Aucune installation Java détectée sur votre système.
              </p>
              <div className="space-y-3">
                <a
                  href="https://adoptium.net/temurin/releases/?version=21"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Télécharger Java 21 LTS</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <div className="text-sm text-dark-400">
                  Ou installez Java 17+ minimum
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">
                  Versions Java détectées ({javaVersions.length})
                </h3>
                <button
                  onClick={detectJavaVersions}
                  className="flex items-center space-x-2 px-3 py-1 bg-dark-700 hover:bg-dark-600 text-white rounded-lg transition-colors text-sm"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Actualiser</span>
                </button>
              </div>

              <div className="grid gap-3">
                {javaVersions.map((java, index) => {
                  const status = getVersionStatus(java.version);
                  const StatusIcon = status.icon;
                  const isSelected = selectedJava?.path === java.path;
                  
                  return (
                    <motion.div
                      key={java.path}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => handleSelectJava(java)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-primary-500 bg-primary-500/10'
                          : 'border-dark-700 bg-dark-800 hover:border-dark-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${
                            isSelected ? 'bg-primary-500' : 'bg-dark-600'
                          }`} />
                          
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">{getSourceIcon(java.source)}</span>
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="font-semibold text-white">
                                  Java {java.version}
                                </span>
                                <StatusIcon className={`w-4 h-4 ${status.color}`} />
                              </div>
                              <div className="text-sm text-dark-400">
                                {java.type} • {java.source}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className={`text-sm font-medium ${status.color}`}>
                            {status.status === 'compatible' && '✅ Compatible'}
                            {status.status === 'warning' && '⚠️ Compatible avec limitations'}
                            {status.status === 'incompatible' && '❌ Incompatible'}
                          </div>
                          <div className="text-xs text-dark-500 truncate max-w-48">
                            {java.path}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t-2 border-purple-500/40 shadow-[0_-2px_10px_rgba(168,85,247,0.15)] flex justify-between">
          <div className="text-sm text-dark-400">
            {selectedJava ? (
              <span>Java {selectedJava.version} sélectionné</span>
            ) : (
              <span>Sélectionnez une version Java</span>
            )}
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-dark-700 hover:bg-dark-600 text-white rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleConfirm}
              disabled={!selectedJava}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Confirmer
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default JavaVersionSelector;
