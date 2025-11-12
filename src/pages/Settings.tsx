import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Globe,
  Cpu,
  HardDrive,
  Save,
  FolderOpen,
  Trash2,
  RefreshCw,
  Info,
  Palette,
  X,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme, ThemeType, useThemeClasses } from '../contexts/ThemeContext';
import { useSystemInfo, formatMB } from '../hooks/useSystemInfo';
import { invoke } from '@tauri-apps/api/tauri';
import { AppConfig } from '../types';
import { JavaDownloader, AutoCleanup } from '../components/AutomationFeatures';

interface SettingsProps {
  config: AppConfig;
  setConfig: (config: AppConfig) => void;
}

interface BackupInfo {
  name: string;
  date: string;
  size: number;
}

// Composant pour l'apparence
const AppearanceSection: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const { t } = useLanguage();

  const themes: { id: ThemeType; name: string; description: string; colors: string[]; icon: string }[] = [
    {
      id: 'nether',
      name: t.settings.netherTheme,
      description: t.settings.netherThemeDesc,
      colors: ['#dc2626', '#ea580c', '#f59e0b'],
      icon: '🔥',
    },
    {
      id: 'end',
      name: t.settings.endTheme,
      description: t.settings.endThemeDesc,
      colors: ['#9333ea', '#ec4899', '#c084fc'],
      icon: '✨',
    },
    {
      id: 'overworld',
      name: t.settings.overworldTheme,
      description: t.settings.overworldThemeDesc,
      colors: ['#16a34a', '#0891b2', '#3b82f6'],
      icon: '🌍',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-white mb-2">{t.settings.colorTheme}</h3>
        <p className="text-sm text-gray-400 mb-6">
          {t.settings.colorThemeDesc}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {themes.map((themeOption) => (
          <motion.button
            key={themeOption.id}
            onClick={() => setTheme(themeOption.id)}
            className={`relative p-6 rounded-xl border-2 transition-all duration-300 ${
              theme === themeOption.id
                ? 'border-white shadow-lg scale-105'
                : 'border-dark-400 hover:border-gray-500'
            } bg-dark-200`}
            whileHover={{ scale: theme === themeOption.id ? 1.05 : 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Badge sélectionné */}
            {theme === themeOption.id && (
              <div className="absolute top-3 right-3 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                {t.settings.activeTheme}
              </div>
            )}

            {/* Icône */}
            <div className="text-5xl mb-4">{themeOption.icon}</div>

            {/* Nom */}
            <h4 className="text-lg font-bold text-white mb-2">{themeOption.name}</h4>

            {/* Description */}
            <p className="text-sm text-gray-400 mb-4">{themeOption.description}</p>

            {/* Palette de couleurs */}
            <div className="flex gap-2 justify-center">
              {themeOption.colors.map((color, idx) => (
                <div
                  key={idx}
                  className="w-8 h-8 rounded-full border-2 border-dark-600"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </motion.button>
        ))}
      </div>

      {/* Aperçu */}
      <div className="mt-8 p-6 bg-dark-200 rounded-xl border border-dark-400">
        <h4 className="text-lg font-bold text-white mb-4">{t.settings.themePreview}</h4>
        <div className="space-y-4">
          <div className="flex gap-4">
            <button className={`px-4 py-2 rounded-lg ${
              theme === 'nether' ? 'bg-gradient-to-r from-red-600 to-orange-600' :
              theme === 'end' ? 'bg-gradient-to-r from-purple-600 to-pink-600' :
              'bg-gradient-to-r from-green-600 to-cyan-600'
            } text-white font-bold`}>
              {t.settings.primaryButton}
            </button>
            <button className={`px-4 py-2 rounded-lg border-2 ${
              theme === 'nether' ? 'border-red-500 text-red-400' :
              theme === 'end' ? 'border-purple-500 text-purple-400' :
              'border-green-500 text-green-400'
            }`}>
              {t.settings.secondaryButton}
            </button>
          </div>

          <div className={`p-4 rounded-lg ${
            theme === 'nether' ? 'bg-red-500/10 border-l-4 border-red-500' :
            theme === 'end' ? 'bg-purple-500/10 border-l-4 border-purple-500' :
            'bg-green-500/10 border-l-4 border-green-500'
          }`}>
            <p className={`font-bold ${
              theme === 'nether' ? 'text-red-400' :
              theme === 'end' ? 'text-purple-400' :
              'text-green-400'
            }`}>
              {t.settings.exampleCard}
            </p>
            <p className="text-gray-400 text-sm mt-1">
              {t.settings.exampleCardDesc}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Composant pour la gestion des backups
const BackupSection: React.FC<{config: any, setConfig: any}> = ({ config, setConfig }) => {
  const { t } = useLanguage();
  const [backups, setBackups] = React.useState<BackupInfo[]>([]);
  const [servers, setServers] = React.useState<any[]>([]);
  const [selectedServer, setSelectedServer] = React.useState<string>('');
  const [loading, setLoading] = React.useState(false);
  const [showRestoreModal, setShowRestoreModal] = React.useState(false);
  const [backupToRestore, setBackupToRestore] = React.useState<BackupInfo | null>(null);

  React.useEffect(() => {
    loadBackups();
    loadServers();
  }, []);

  React.useEffect(() => {
    // Activer/désactiver les backups automatiques
    if (config.autoBackup !== undefined) {
      enableAutoBackup(config.autoBackup, config.backupInterval || 24);
    }
  }, [config.autoBackup, config.backupInterval]);

  const loadBackups = async () => {
    try {
      const backupList = await invoke<BackupInfo[]>('list_backups');
      setBackups(backupList);
    } catch (error) {
      console.error('Erreur chargement backups:', error);
    }
  };

  const loadServers = () => {
    const savedServers = localStorage.getItem('nether-client-servers');
    if (savedServers) {
      setServers(JSON.parse(savedServers));
    }
  };

  const enableAutoBackup = async (enabled: boolean, intervalHours: number) => {
    try {
      await invoke('enable_auto_backup', { enabled, intervalHours });
    } catch (error) {
      console.error('Erreur activation backups auto:', error);
    }
  };

  const createBackup = async () => {
    if (!selectedServer) {
      alert('Veuillez sélectionner un serveur');
      return;
    }

    setLoading(true);
    try {
      const server = servers.find(s => s.id === selectedServer);
      await invoke('create_backup', {
        serverName: server.name,
        serverPath: server.path
      });
      alert('Backup créé avec succès !');
      loadBackups();
    } catch (error) {
      alert('Erreur: ' + error);
    } finally {
      setLoading(false);
    }
  };

  const openRestoreModal = (backup: BackupInfo) => {
    setBackupToRestore(backup);
    setShowRestoreModal(true);
  };

  const confirmRestore = async () => {
    if (!selectedServer || !backupToRestore) return;

    setLoading(true);
    try {
      const server = servers.find(s => s.id === selectedServer);
      
      // Créer un backup de sécurité avant la restauration
      await invoke('create_backup', {
        serverName: `${server.name}_pre-restore`,
        serverPath: server.path
      });
      
      // Restaurer le backup
      await invoke('restore_backup', {
        backupName: backupToRestore.name,
        serverName: server.name
      });
      
      alert('✅ Rollback effectué avec succès !');
      setShowRestoreModal(false);
      setBackupToRestore(null);
      loadBackups();
    } catch (error) {
      alert('❌ Erreur: ' + error);
    } finally {
      setLoading(false);
    }
  };

  const deleteBackup = async (backupName: string) => {
    if (!confirm('Supprimer ce backup ?')) return;

    try {
      await invoke('delete_backup', { backupName });
      loadBackups();
    } catch (error) {
      alert('Erreur: ' + error);
    }
  };

  const formatSize = (bytes: number) => {
    const mb = bytes / 1024 / 1024;
    return mb > 1024 ? `${(mb / 1024).toFixed(2)} GB` : `${mb.toFixed(2)} MB`;
  };

  return (
    <div className="space-y-6">
      {/* Backups automatiques */}
      <div className="flex items-center justify-between">
        <div>
          <label className="block text-sm font-medium text-white mb-1">
            {t.settings.autoBackup}
          </label>
          <p className="text-sm text-dark-400">{t.settings.autoBackupDesc}</p>
        </div>
        <input
          type="checkbox"
          checked={config.autoBackup}
          onChange={(e) => setConfig({ ...config, autoBackup: e.target.checked })}
          className="w-5 h-5"
        />
      </div>

      {/* Fréquence */}
      {config.autoBackup && (
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            {t.settings.backupFrequency}
          </label>
          <select
            value={config.backupInterval || 24}
            onChange={(e) => setConfig({ ...config, backupInterval: parseInt(e.target.value) })}
            className="input w-full"
          >
            <option value="24">{t.settings.daily}</option>
            <option value="168">{t.settings.weekly}</option>
            <option value="720">{t.settings.monthly}</option>
          </select>
        </div>
      )}

      {/* Sélection du serveur */}
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Serveur
        </label>
        <select
          value={selectedServer}
          onChange={(e) => setSelectedServer(e.target.value)}
          className="input w-full"
        >
          <option value="">Sélectionner un serveur</option>
          {servers.map(server => (
            <option key={server.id} value={server.id}>{server.name}</option>
          ))}
        </select>
      </div>

      {/* Actions */}
      <div className="flex space-x-4">
        <motion.button
          onClick={createBackup}
          disabled={loading || !selectedServer}
          className="btn-primary flex-1"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {loading ? 'Création...' : t.settings.createBackup}
        </motion.button>
      </div>

      {/* Liste des backups avec timeline */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">📋 Backups disponibles</h3>
        <div className="space-y-3">
          {backups.length === 0 ? (
            <p className="text-dark-400 text-sm">Aucun backup disponible</p>
          ) : (
            backups.map((backup, index) => {
              const isRecent = index === 0;
              const isOld = index > 5;
              
              return (
                <motion.div
                  key={backup.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="relative pl-8 pb-4"
                >
                  {/* Timeline */}
                  {index < backups.length - 1 && (
                    <div className="absolute left-3 top-8 w-0.5 h-full bg-dark-600"></div>
                  )}
                  
                  <div className={`absolute left-0 top-3 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    isRecent
                      ? 'bg-green-500 border-green-400'
                      : isOld
                      ? 'bg-gray-600 border-gray-500'
                      : 'bg-blue-500 border-blue-400'
                  }`}>
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>

                  <div className="bg-dark-700 rounded-lg p-4 hover:bg-dark-600 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-white font-bold">{backup.name}</p>
                          {isRecent && (
                            <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full font-bold">
                              ⚡ Plus récent
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-400 flex items-center gap-4">
                          <span>📅 {backup.date}</span>
                          <span>💾 {formatSize(backup.size)}</span>
                        </p>
                      </div>
                      
                      <div className="flex gap-2">
                        <motion.button
                          onClick={() => openRestoreModal(backup)}
                          disabled={loading || !selectedServer}
                          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-bold text-sm flex items-center gap-2"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          ⚡ Rollback
                        </motion.button>
                        <motion.button
                          onClick={() => deleteBackup(backup.name)}
                          className="p-2 bg-red-600 hover:bg-red-700 rounded-lg"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      {/* Modal de confirmation de rollback */}
      {showRestoreModal && backupToRestore && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => !loading && setShowRestoreModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-dark-100 rounded-xl w-full max-w-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-dark-700 bg-gradient-to-r from-blue-900/20 to-purple-900/20">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                ⚡ Rollback Rapide
              </h2>
              <button
                onClick={() => setShowRestoreModal(false)}
                disabled={loading}
                className="p-2 hover:bg-dark-700 rounded-lg transition-colors disabled:opacity-50"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Informations du backup */}
              <div className="bg-dark-200 rounded-lg p-4 border border-dark-400">
                <h3 className="font-bold text-white mb-3 flex items-center gap-2">
                  📦 Backup sélectionné
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Nom:</span>
                    <span className="text-white font-mono">{backupToRestore.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Date:</span>
                    <span className="text-white">{backupToRestore.date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Taille:</span>
                    <span className="text-white">{formatSize(backupToRestore.size)}</span>
                  </div>
                </div>
              </div>

              {/* Avertissement */}
              <div className="bg-yellow-900/20 border-l-4 border-yellow-500 p-4 rounded">
                <p className="text-yellow-400 font-bold mb-2 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  ⚠️ Attention
                </p>
                <p className="text-yellow-200 text-sm">
                  Le serveur actuel sera remplacé par ce backup. Un backup de sécurité sera créé automatiquement avant la restauration.
                </p>
              </div>

              {/* Informations supplémentaires */}
              <div className="bg-blue-900/20 border-l-4 border-blue-500 p-4 rounded">
                <p className="text-blue-400 font-bold mb-2 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  ✅ Sécurité
                </p>
                <p className="text-blue-200 text-sm">
                  Un backup de sauvegarde sera automatiquement créé avant la restauration pour permettre un retour arrière si nécessaire.
                </p>
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t-2 border-purple-500/40 shadow-[0_-2px_10px_rgba(168,85,247,0.15)]">
              <button
                onClick={() => setShowRestoreModal(false)}
                disabled={loading}
                className="flex-1 px-4 py-3 bg-dark-300 hover:bg-dark-400 disabled:opacity-50 rounded-lg transition-colors font-bold"
              >
                Annuler
              </button>
              <button
                onClick={confirmRestore}
                disabled={loading}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors font-bold flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Restauration...
                  </>
                ) : (
                  <>
                    ⚡ Confirmer le Rollback
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

const Settings: React.FC<SettingsProps> = ({ config, setConfig }) => {
  const { language, setLanguage, t } = useLanguage();
  const { systemInfo, loading: systemLoading } = useSystemInfo();
  const { buttonClass } = useThemeClasses();
  
  const [activeTab, setActiveTab] = useState('general');
  const [localConfig, setLocalConfig] = useState({
    ...config,
    cpuThreads: config.cpuThreads || Math.min(4, systemInfo.cpuCores)
  });
  const [javaPath, setJavaPath] = useState('');
  const [cacheSize, setCacheSize] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLocalConfig({
      ...config,
      cpuThreads: config.cpuThreads || Math.min(4, systemInfo.cpuCores)
    });
  }, [config, systemInfo.cpuCores]);

  useEffect(() => {
    // Charger la taille du cache
    loadCacheSize();
  }, []);

  const loadCacheSize = async () => {
    try {
      const appDataPath = await invoke<string>('get_app_data_path');
      const cachePath = `${appDataPath}/cache`;
      const size = await invoke<number>('get_folder_size', { path: cachePath });
      setCacheSize(size);
    } catch (error) {
      console.error('Error loading cache size:', error);
    }
  };

  const handleSave = () => {
    setConfig(localConfig);
    // Mettre à jour la langue globalement
    if (localConfig.language !== language) {
      setLanguage(localConfig.language as 'fr' | 'en');
    }
  };

  const handleOpenFolder = async (type: 'install' | 'backup' | 'cache') => {
    try {
      const appDataPath = await invoke<string>('get_app_data_path');
      let path = appDataPath;
      
      if (type === 'backup') {
        path = `${appDataPath}/backups`;
      } else if (type === 'cache') {
        path = `${appDataPath}/cache`;
      }
      
      await invoke('open_folder', { path });
    } catch (error) {
      console.error('Error opening folder:', error);
    }
  };

  const handleClearCache = async () => {
    if (!window.confirm(t.settings.resetConfirm)) return;
    
    try {
      setLoading(true);
      const appDataPath = await invoke<string>('get_app_data_path');
      const cachePath = `${appDataPath}/cache`;
      await invoke('clear_cache', { path: cachePath });
      setCacheSize(0);
      alert(t.common.success);
    } catch (error) {
      console.error('Error clearing cache:', error);
      alert(t.common.error);
    } finally {
      setLoading(false);
    }
  };

  const handleAutoDetectJava = async () => {
    try {
      setLoading(true);
      const versions = await invoke<string[]>('check_java_installation');
      if (versions.length > 0) {
        setJavaPath(versions[0]);
        alert(`${t.settings.detected}: Java ${versions[0]}`);
      } else {
        alert('Java not found');
      }
    } catch (error) {
      console.error('Error detecting Java:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'general', label: t.settings.general, icon: Globe },
    { id: 'appearance', label: t.settings.appearance, icon: Palette },
    { id: 'performance', label: t.settings.performance, icon: Cpu },
    { id: 'storage', label: t.settings.storage, icon: HardDrive },
    { id: 'backup', label: t.settings.backup, icon: Save },
    { id: 'maintenance', label: 'Maintenance', icon: RefreshCw },
    { id: 'system', label: t.settings.system, icon: Info },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <div className="space-y-6">
            {/* Langue */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                {t.settings.language}
              </label>
              <p className="text-sm text-dark-400 mb-3">{t.settings.languageDesc}</p>
              <select
                value={localConfig.language}
                onChange={(e) => setLocalConfig({ ...localConfig, language: e.target.value as 'fr' | 'en' })}
                className="input w-full"
              >
                <option value="fr">{t.settings.french}</option>
                <option value="en">{t.settings.english}</option>
              </select>
            </div>

            {/* RAM par défaut */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                {t.settings.defaultRam}
              </label>
              <p className="text-sm text-dark-400 mb-3">{t.settings.defaultRamDesc}</p>
              <div className="flex items-center space-x-4">
                <input
                  type="range"
                  min="1024"
                  max={systemInfo.totalRam}
                  step="512"
                  value={Math.min(localConfig.defaultRam, systemInfo.totalRam)}
                  onChange={(e) => setLocalConfig({ ...localConfig, defaultRam: parseInt(e.target.value) })}
                  className="flex-1 accent-primary-500"
                  style={{ cursor: 'pointer' }}
                />
                <span className="text-white font-medium w-24 text-right">
                  {formatMB(Math.min(localConfig.defaultRam, systemInfo.totalRam))}
                </span>
              </div>
              <p className="text-xs text-dark-500 mt-2">
                RAM totale du PC: {formatMB(systemInfo.totalRam)} | Disponible: {formatMB(systemInfo.availableRam)}
              </p>
            </div>

            {/* Démarrage automatique */}
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-white mb-1">
                  {t.settings.autoStart}
                </label>
                <p className="text-sm text-dark-400">{t.settings.autoStartDesc}</p>
              </div>
              <input
                type="checkbox"
                checked={localConfig.autoBackup}
                onChange={(e) => setLocalConfig({ ...localConfig, autoBackup: e.target.checked })}
                className="w-5 h-5"
              />
            </div>

            {/* Notifications */}
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-white mb-1">
                  {t.settings.notifications}
                </label>
                <p className="text-sm text-dark-400">{t.settings.notificationsDesc}</p>
              </div>
              <input
                type="checkbox"
                checked={true}
                onChange={() => {}}
                className="w-5 h-5"
              />
            </div>
          </div>
        );

      case 'appearance':
        return <AppearanceSection />;

      case 'performance':
        return (
          <div className="space-y-6">
            {/* Chemin Java */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                {t.settings.javaPath}
              </label>
              <p className="text-sm text-dark-400 mb-3">{t.settings.javaPathDesc}</p>
              <div className="space-y-3">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={javaPath}
                    onChange={(e) => setJavaPath(e.target.value)}
                    placeholder="C:/Program Files/Java/jdk-17/bin/java.exe"
                    className="input flex-1"
                  />
                  <motion.button
                    onClick={handleAutoDetectJava}
                    disabled={loading}
                    className="btn-secondary px-4"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {t.settings.autoDetect}
                  </motion.button>
                </div>
                
                {/* Versions Java courantes */}
                <div className="bg-dark-800 rounded-lg p-4">
                  <p className="text-sm text-dark-400 mb-2">Versions Java courantes :</p>
                  <div className="space-y-2">
                    {[
                      { version: 'Java 8', path: 'C:/Program Files/Java/jre1.8.0/bin/java.exe' },
                      { version: 'Java 17', path: 'C:/Program Files/Java/jdk-17/bin/java.exe' },
                      { version: 'Java 21', path: 'C:/Program Files/Java/jdk-21/bin/java.exe' },
                    ].map((java) => (
                      <button
                        key={java.version}
                        onClick={() => setJavaPath(java.path)}
                        className="w-full text-left px-3 py-2 bg-dark-700 hover:bg-dark-600 rounded text-sm text-dark-300 hover:text-white transition-colors"
                      >
                        <span className="font-medium">{java.version}</span>
                        <span className="text-xs text-dark-500 block">{java.path}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Threads CPU */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                {t.settings.cpuThreads}
              </label>
              <p className="text-sm text-dark-400 mb-3">{t.settings.cpuThreadsDesc}</p>
              <div className="flex items-center space-x-4">
                <input
                  type="range"
                  min="1"
                  max={systemInfo.cpuCores}
                  step="1"
                  value={localConfig.cpuThreads || Math.min(4, systemInfo.cpuCores)}
                  onChange={(e) => setLocalConfig({ ...localConfig, cpuThreads: parseInt(e.target.value) })}
                  className="flex-1 accent-primary-500"
                  style={{ cursor: 'pointer' }}
                />
                <span className="text-white font-medium w-24 text-right">
                  {localConfig.cpuThreads || Math.min(4, systemInfo.cpuCores)} / {systemInfo.cpuCores}
                </span>
              </div>
              <p className="text-xs text-dark-500 mt-2">
                {t.settings.availableThreads}: {systemInfo.cpuCores}
              </p>
            </div>

            {/* Optimisation GC */}
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-white mb-1">
                  {t.settings.gcOptimization}
                </label>
                <p className="text-sm text-dark-400">{t.settings.gcOptimizationDesc}</p>
              </div>
              <input
                type="checkbox"
                checked={true}
                onChange={() => {}}
                className="w-5 h-5"
              />
            </div>
          </div>
        );

      case 'storage':
        return (
          <div className="space-y-6">
            {/* Dossier d'installation */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                {t.settings.installDir}
              </label>
              <p className="text-sm text-dark-400 mb-3">{t.settings.installDirDesc}</p>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value="%APPDATA%/NetherClient"
                  readOnly
                  className="input flex-1"
                />
                <motion.button
                  onClick={() => handleOpenFolder('install')}
                  className="btn-secondary px-4"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <FolderOpen className="w-5 h-5" />
                </motion.button>
              </div>
            </div>

            {/* Cache */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                {t.settings.cacheSize}
              </label>
              <div className="flex items-center justify-between p-4 bg-dark-800 rounded-lg">
                <div>
                  <p className="text-white font-medium">{formatMB(cacheSize)}</p>
                  <p className="text-sm text-dark-400">Fichiers temporaires et téléchargements</p>
                </div>
                <motion.button
                  onClick={handleClearCache}
                  disabled={loading || cacheSize === 0}
                  className="btn-secondary flex items-center space-x-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{t.settings.clearCache}</span>
                </motion.button>
              </div>
            </div>
          </div>
        );

      case 'backup':
        return <BackupSection config={localConfig} setConfig={setLocalConfig} />;

      case 'maintenance':
        return (
          <div className="space-y-6">
            <JavaDownloader />
            <div className="border-t-2 border-purple-500/40 shadow-[0_-2px_10px_rgba(168,85,247,0.15)] pt-6">
              <AutoCleanup />
            </div>
          </div>
        );

      case 'system':
        return (
          <div className="space-y-6">
            {/* Informations système */}
            <div className="card bg-dark-800">
              <h3 className="text-lg font-semibold text-white mb-4">{t.settings.systemInfo}</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-dark-400">{t.settings.os}</span>
                  <span className="text-white font-medium">{systemInfo.os} {systemInfo.osVersion}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-dark-400">{t.settings.cpu}</span>
                  <span className="text-white font-medium">{systemInfo.cpu}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-dark-400">{t.settings.totalRam}</span>
                  <span className="text-white font-medium">{formatMB(systemInfo.totalRam)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-dark-400">{t.settings.architecture}</span>
                  <span className="text-white font-medium">{systemInfo.arch}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-dark-400">{t.settings.appVersion}</span>
                  <span className="text-white font-medium">1.0.0</span>
                </div>
              </div>
            </div>

            {/* Actions système */}
            <div className="space-y-3">
              <motion.button
                className="btn-secondary w-full flex items-center justify-center space-x-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <RefreshCw className="w-4 h-4" />
                <span>{t.settings.checkUpdates}</span>
              </motion.button>
              
              <motion.button
                onClick={() => {
                  if (window.confirm(t.settings.resetConfirm)) {
                    setLocalConfig({
                      language: 'fr',
                      theme: 'dark',
                      defaultRam: 2048,
                      cpuThreads: Math.min(4, systemInfo.cpuCores),
                      autoBackup: true,
                      backupInterval: 24,
                      playitEnabled: false,
                    });
                  }
                }}
                className="btn-secondary w-full text-red-400 border-red-400 hover:bg-red-500/20"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {t.settings.resetSettings}
              </motion.button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex overflow-y-auto overflow-x-hidden scrollbar-hide">
      {/* Sidebar des onglets */}
      <div className="w-64 sidebar border-r border-dark-400 p-4">
        <h2 className="text-xl font-bold text-white mb-6 drop-shadow-lg">{t.settings.title}</h2>
        <p className="text-sm text-dark-600 mb-6 drop-shadow-sm">{t.settings.subtitle}</p>
        
        <nav className="space-y-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-300 ${
                  isActive
                    ? buttonClass
                    : 'text-dark-400 hover:text-white hover:bg-dark-700'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={isActive ? {} : undefined}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{tab.label}</span>
              </motion.button>
            );
          })}
        </nav>
      </div>

      {/* Contenu */}
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-3xl">
          {renderContent()}
          
          {/* Bouton Enregistrer */}
          <motion.button
            onClick={handleSave}
            className="btn-primary w-full mt-8 flex items-center justify-center space-x-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Save className="w-5 h-5" />
            <span>{t.common.save}</span>
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default Settings;

