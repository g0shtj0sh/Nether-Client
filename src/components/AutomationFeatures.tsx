// Composants pour les fonctionnalités d'automatisation
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  AlertTriangle, 
  Download, 
  RefreshCw, 
  Trash2,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';
import { invoke } from '@tauri-apps/api/tauri';

// ========== DÉTECTION DE CRASHES ==========
interface CrashDetectorProps {
  serverName: string;
  onCrashDetected: () => void;
}

export const CrashDetector: React.FC<CrashDetectorProps> = ({ serverName, onCrashDetected }) => {
  const [crashed, setCrashed] = useState(false);
  const [autoRestart, setAutoRestart] = useState(false);

  useEffect(() => {
    const checkCrash = async () => {
      try {
        const hasCrashed = await invoke<boolean>('detect_crash', { serverName });
        if (hasCrashed && !crashed) {
          setCrashed(true);
          onCrashDetected();
          
          // Redémarrage automatique si activé
          if (autoRestart) {
            setTimeout(() => {
              // Logique de redémarrage
              setCrashed(false);
            }, 5000);
          }
        }
      } catch (error) {
        console.error('Erreur détection crash:', error);
      }
    };

    const interval = setInterval(checkCrash, 10000); // Vérifier toutes les 10 secondes
    return () => clearInterval(interval);
  }, [serverName, crashed, autoRestart]);

  const toggleAutoRestart = async () => {
    try {
      await invoke('enable_auto_restart', { serverName, enabled: !autoRestart });
      setAutoRestart(!autoRestart);
    } catch (error) {
      console.error('Erreur toggle auto-restart:', error);
    }
  };

  if (!crashed) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-red-500/20 border border-red-500 rounded-lg p-4 mb-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          <div>
            <p className="text-white font-semibold">Crash détecté !</p>
            <p className="text-sm text-red-300">Le serveur {serverName} a crashé</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <label className="flex items-center space-x-2 text-sm text-white">
            <input
              type="checkbox"
              checked={autoRestart}
              onChange={toggleAutoRestart}
              className="w-4 h-4"
            />
            <span>Redémarrage auto</span>
          </label>
        </div>
      </div>
    </motion.div>
  );
};

// ========== VÉRIFICATION DES MISES À JOUR ==========
interface UpdateCheckerProps {
  version: string;
  serverType: string;
  serverName: string;
}

export const UpdateChecker: React.FC<UpdateCheckerProps> = ({ version, serverType, serverName }) => {
  const [updateAvailable, setUpdateAvailable] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    checkUpdates();
  }, [version, serverType]);

  const checkUpdates = async () => {
    setChecking(true);
    try {
      const newVersion = await invoke<string | null>('check_updates', { version, serverType });
      setUpdateAvailable(newVersion);
    } catch (error) {
      console.error('Erreur vérification mises à jour:', error);
    } finally {
      setChecking(false);
    }
  };

  const handleUpdate = async () => {
    if (!updateAvailable) return;
    
    const confirmed = confirm(
      `Voulez-vous vraiment mettre à jour ${serverName} de ${version} vers ${updateAvailable}?\n\n` +
      `⚠️ Le serveur sera arrêté pendant la mise à jour.\n` +
      `✅ Une sauvegarde automatique sera créée.\n` +
      `⏱️ Cela peut prendre quelques minutes.`
    );
    
    if (!confirmed) return;
    
    setUpdating(true);
    try {
      // 1. Arrêter le serveur s'il est en cours d'exécution
      try {
        await invoke('stop_server', { serverName });
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (e) {
        console.log('Serveur déjà arrêté');
      }
      
      // 2. Obtenir le chemin du serveur depuis localStorage
      const savedServers = localStorage.getItem('nether-client-servers');
      if (!savedServers) {
        throw new Error('Serveurs non trouvés');
      }
      
      const servers = JSON.parse(savedServers);
      const server = servers.find((s: any) => s.name === serverName);
      if (!server) {
        throw new Error('Serveur non trouvé');
      }
      
      // 3. Lancer la mise à jour automatique
      const result = await invoke<string>('update_server', {
        serverName,
        serverPath: server.path,
        newVersion: updateAvailable,
        serverType
      });
      
      alert(`✅ ${result}\n\nVous pouvez maintenant redémarrer le serveur.`);
      
      // 4. Mettre à jour la version dans localStorage
      const updatedServers = servers.map((s: any) => 
        s.name === serverName ? { ...s, version: updateAvailable } : s
      );
      localStorage.setItem('nether-client-servers', JSON.stringify(updatedServers));
      
      setUpdateAvailable(null);
      
      // Recharger la page pour afficher la nouvelle version
      window.location.reload();
    } catch (error) {
      console.error('Erreur mise à jour:', error);
      alert('❌ Erreur lors de la mise à jour:\n\n' + error + '\n\nVotre sauvegarde a été conservée.');
    } finally {
      setUpdating(false);
    }
  };

  if (checking) {
    return (
      <div className="flex items-center space-x-2 text-sm text-dark-400">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Vérification...</span>
      </div>
    );
  }

  if (!updateAvailable) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-blue-500/20 border border-blue-500 rounded-lg p-3"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white font-medium">Mise à jour disponible</p>
          <p className="text-sm text-blue-300">{version} → {updateAvailable}</p>
        </div>
        <motion.button
          onClick={handleUpdate}
          disabled={updating}
          className="btn-primary text-sm px-3 py-1 flex items-center space-x-2"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {updating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Mise à jour...</span>
            </>
          ) : (
            <span>Mettre à jour</span>
          )}
        </motion.button>
      </div>
    </motion.div>
  );
};

// ========== TÉLÉCHARGEMENT JAVA ==========
export const JavaDownloader: React.FC = () => {
  const [javaVersion, setJavaVersion] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<8 | 17 | 21>(17);

  useEffect(() => {
    checkJava();
  }, []);

  const checkJava = async () => {
    try {
      const version = await invoke<string | null>('check_java_version');
      setJavaVersion(version);
    } catch (error) {
      console.error('Erreur vérification Java:', error);
    }
  };

  const downloadJava = async () => {
    setDownloading(true);
    try {
      const path = await invoke<string>('download_java_runtime', { version: selectedVersion });
      alert(`Java ${selectedVersion} installé avec succès !\nChemin: ${path}`);
      checkJava();
    } catch (error) {
      alert('Erreur: ' + error);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-white font-semibold">Java Runtime</h3>
          {javaVersion ? (
            <p className="text-sm text-green-400 flex items-center space-x-2">
              <CheckCircle className="w-4 h-4" />
              <span>{javaVersion}</span>
            </p>
          ) : (
            <p className="text-sm text-red-400 flex items-center space-x-2">
              <XCircle className="w-4 h-4" />
              <span>Java non détecté</span>
            </p>
          )}
        </div>
      </div>

      {!javaVersion && (
        <div className="bg-dark-800 rounded-lg p-4 space-y-4">
          <p className="text-dark-400 text-sm">
            Java n'est pas installé. Téléchargez la version recommandée :
          </p>
          
          <div className="flex items-center space-x-2">
            <select
              value={selectedVersion}
              onChange={(e) => setSelectedVersion(Number(e.target.value) as 8 | 17 | 21)}
              className="input flex-1"
            >
              <option value="8">Java 8 (Minecraft 1.16 et antérieur)</option>
              <option value="17">Java 17 (Minecraft 1.17-1.20)</option>
              <option value="21">Java 21 (Minecraft 1.21+)</option>
            </select>
            
            <motion.button
              onClick={downloadJava}
              disabled={downloading}
              className="btn-primary flex items-center space-x-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {downloading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Téléchargement...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Télécharger</span>
                </>
              )}
            </motion.button>
          </div>
        </div>
      )}
    </div>
  );
};

// ========== NETTOYAGE AUTOMATIQUE ==========
export const AutoCleanup: React.FC = () => {
  const [cleaning, setCleaning] = useState(false);
  const [lastCleanup, setLastCleanup] = useState<Date | null>(null);

  const cleanupCache = async () => {
    setCleaning(true);
    try {
      const freedBytes = await invoke<number>('cleanup_app_cache');
      const freedMB = (freedBytes / 1024 / 1024).toFixed(2);
      alert(`Cache nettoyé ! ${freedMB} MB libérés`);
      setLastCleanup(new Date());
    } catch (error) {
      alert('Erreur: ' + error);
    } finally {
      setCleaning(false);
    }
  };

  const cleanupLogs = async (serverPath: string, days: number) => {
    setCleaning(true);
    try {
      await invoke('cleanup_server_logs', { serverPath, daysToKeep: days });
      alert(`Logs nettoyés ! (gardé ${days} jours)`);
      setLastCleanup(new Date());
    } catch (error) {
      alert('Erreur: ' + error);
    } finally {
      setCleaning(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-white font-semibold mb-2">Nettoyage automatique</h3>
        {lastCleanup && (
          <p className="text-sm text-dark-400">
            Dernier nettoyage : {lastCleanup.toLocaleString()}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <motion.button
          onClick={cleanupCache}
          disabled={cleaning}
          className="btn-secondary flex items-center justify-center space-x-2"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {cleaning ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
          <span>Nettoyer le cache</span>
        </motion.button>

        <motion.button
          onClick={() => {
            const servers = JSON.parse(localStorage.getItem('nether-client-servers') || '[]');
            if (servers.length > 0) {
              cleanupLogs(servers[0].path, 7);
            }
          }}
          disabled={cleaning}
          className="btn-secondary flex items-center justify-center space-x-2"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {cleaning ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
          <span>Nettoyer les logs</span>
        </motion.button>
      </div>
    </div>
  );
};

// ========== ATTRIBUTION AUTOMATIQUE DE PORTS ==========
interface PortFinderProps {
  onPortFound: (port: number) => void;
}

export const PortFinder: React.FC<PortFinderProps> = ({ onPortFound }) => {
  const [finding, setFinding] = useState(false);

  const findPort = async () => {
    setFinding(true);
    try {
      const port = await invoke<number>('get_available_port');
      onPortFound(port);
    } catch (error) {
      alert('Erreur: ' + error);
    } finally {
      setFinding(false);
    }
  };

  return (
    <motion.button
      onClick={findPort}
      disabled={finding}
      className="btn-secondary text-sm px-3 py-1 flex items-center space-x-2"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {finding ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <RefreshCw className="w-4 h-4" />
      )}
      <span>Port auto</span>
    </motion.button>
  );
};

