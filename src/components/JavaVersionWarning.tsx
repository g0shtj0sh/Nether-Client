import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Download, CheckCircle, X, Settings } from 'lucide-react';
import JavaVersionSelector from './JavaVersionSelector';

const JavaVersionWarning: React.FC = () => {
  const [javaVersion, setJavaVersion] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [showJavaSelector, setShowJavaSelector] = useState(false);
  const [minecraftVersion, setMinecraftVersion] = useState('1.21.1');

  useEffect(() => {
    const checkJavaVersion = async () => {
      try {
        const { invoke } = await import('@tauri-apps/api/tauri');
        const version = await invoke<string>('check_java_version');
        setJavaVersion(version);
        
        // Vérifier si la version est suffisante (Java 17+ pour Minecraft 1.21+)
        const versionNumber = parseFloat(version.split('.')[0]);
        if (versionNumber < 17) {
          setIsVisible(true);
        }
      } catch (error) {
        console.error('Erreur vérification Java:', error);
        setIsVisible(true); // Afficher l'avertissement si on ne peut pas vérifier
      }
    };

    checkJavaVersion();
  }, []);

  const handleJavaSelected = (javaPath: string) => {
    console.log('Java sélectionné:', javaPath);
    // Ici on pourrait sauvegarder le chemin Java sélectionné
    setIsVisible(false);
  };

  if (!isVisible || !javaVersion) return null;

  const versionNumber = parseFloat(javaVersion.split('.')[0]);
  const isOutdated = versionNumber < 17;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4"
      >
        <div className="bg-gradient-to-r from-red-900/90 to-orange-900/90 backdrop-blur-sm border border-red-500/50 rounded-xl p-4 shadow-2xl">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white mb-2">
                ⚠️ Version Java obsolète
              </h3>
              <div className="text-sm text-red-200 mb-3">
                <p className="mb-2">
                  <strong>Version actuelle :</strong> Java {javaVersion}
                </p>
                <p className="mb-2">
                  <strong>Version requise :</strong> Java 17 ou supérieur
                </p>
                <p>
                  Minecraft 1.21+ nécessite Java 17+. Votre version actuelle ({javaVersion}) est trop ancienne.
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-green-200">Téléchargez Java 21 LTS (recommandé)</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-green-200">Ou Java 17 minimum</span>
                </div>
              </div>

              <div className="mt-4 flex space-x-2">
                <button
                  onClick={() => setShowJavaSelector(true)}
                  className="flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
                >
                  <Settings className="w-4 h-4" />
                  <span>Détecter Java</span>
                </button>
                <a
                  href="https://adoptium.net/temurin/releases/?version=21"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>Télécharger Java 21</span>
                </a>
                <button
                  onClick={() => setIsVisible(false)}
                  className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm"
                >
                  Fermer
                </button>
              </div>
            </div>
            <button
              onClick={() => setIsVisible(false)}
              className="p-1 text-red-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Modal de sélection Java */}
      {showJavaSelector && (
        <JavaVersionSelector
          minecraftVersion={minecraftVersion}
          onJavaSelected={handleJavaSelected}
          onClose={() => setShowJavaSelector(false)}
        />
      )}
    </>
  );
};

export default JavaVersionWarning;
