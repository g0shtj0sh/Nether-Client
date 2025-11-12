import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { invoke } from '@tauri-apps/api/tauri';
import { 
  Network as NetworkIcon, 
  Globe, 
  Shield, 
  Download, 
  Play, 
  Square,
  Settings,
  Info,
  ExternalLink,
  Copy,
  CheckCircle,
  AlertCircle,
  Loader2,
  Server,
  X
} from 'lucide-react';
import { Server as ServerType } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

const Network: React.FC = () => {
  const { t } = useLanguage();
  const [servers, setServers] = useState<ServerType[]>([]);
  const [playitInstalled, setPlayitInstalled] = useState(false);
  const [playitRunning, setPlayitRunning] = useState(false);
  const [tunnelUrl, setTunnelUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showTunnelNotification, setShowTunnelNotification] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [manualUrl, setManualUrl] = useState('');
  const [showHelp, setShowHelp] = useState(false);

  const checkTunnelStatus = async () => {
    setLoading(true);
    try {
      const detailedStatus = await invoke<any>('get_playit_detailed_status');
      setPlayitRunning(detailedStatus.running);
      if (detailedStatus.tunnel_url) {
        setTunnelUrl(detailedStatus.tunnel_url);
      } else {
        setTunnelUrl(null);
      }
    } catch (e) {
      console.error('Erreur vérification statut:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const savedServers = localStorage.getItem('nether-client-servers');
    if (savedServers) {
      setServers(JSON.parse(savedServers));
    }
    
    checkPlayitInstallation();
    
    // Vérification initiale du statut (sans intervalle automatique)
    const checkInitialStatus = async () => {
      try {
        const detailedStatus = await invoke<any>('get_playit_detailed_status');
        setPlayitRunning(detailedStatus.running);
        if (detailedStatus.tunnel_url) {
          setTunnelUrl(detailedStatus.tunnel_url);
        }
      } catch (e) {
        console.error('Erreur vérification statut:', e);
      }
    };
    
    checkInitialStatus();
  }, []);

  const checkPlayitInstallation = async () => {
    try {
      const installed = await invoke<boolean>('check_playit_installation');
      setPlayitInstalled(installed);
      
      if (installed) {
        // Le statut est maintenant géré par le hook usePlayitStatus
      }
    } catch (error) {
      console.error('Erreur lors de la vérification:', error);
      setPlayitInstalled(false);
    }
  };

  const installPlayit = async () => {
    setLoading(true);
    try {
      const path = await invoke<string>('install_playit');
      console.log('Playit.gg installé à:', path);
      setPlayitInstalled(true);
      localStorage.setItem('playit-installed', 'true');
    } catch (error) {
      console.error('Erreur lors de l\'installation:', error);
      alert('Erreur lors de l\'installation de Playit.gg: ' + error);
    } finally {
      setLoading(false);
    }
  };

  const startTunnel = async (server: ServerType) => {
    setLoading(true);
    try {
      const result = await invoke<string>('start_playit', { port: server.port });
      setPlayitRunning(true);
      
      // Afficher les instructions dans une alerte bien formatée
      const instructions = result.split('\n').join('\n');
      alert(instructions);
      
      // Récupérer le lien tunnel après quelques secondes (au cas où)
      setTimeout(async () => {
        try {
          const detailedStatus = await invoke<any>('get_playit_detailed_status');
          if (detailedStatus.tunnel_url) {
            setTunnelUrl(detailedStatus.tunnel_url);
          }
        } catch (e) {
          console.error('Erreur récupération URL:', e);
        }
      }, 2000);
    } catch (error) {
      console.error('Erreur lors du démarrage du tunnel:', error);
      alert('❌ Erreur lors du démarrage du tunnel:\n\n' + error + '\n\nVérifiez que Playit.gg est bien installé.');
    } finally {
      setLoading(false);
    }
  };

  const stopTunnel = async () => {
    setLoading(true);
    try {
      await invoke('stop_playit');
      setPlayitRunning(false);
      setTunnelUrl(null);
    } catch (error) {
      console.error('Erreur lors de l\'arrêt du tunnel:', error);
      alert('❌ Erreur lors de l\'arrêt du tunnel:\n\n' + error);
    } finally {
      setLoading(false);
    }
  };

  const copyTunnelUrl = async () => {
    if (tunnelUrl) {
      try {
        await navigator.clipboard.writeText(tunnelUrl);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (error) {
        console.error('Erreur lors de la copie:', error);
        // Fallback pour les navigateurs qui ne supportent pas l'API Clipboard
        const textArea = document.createElement('textarea');
        textArea.value = tunnelUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      }
    }
  };

  const detectTunnelUrl = async () => {
    setLoading(true);
    try {
      const detectedUrl = await invoke<string | null>('detect_playit_tunnel_url');
      if (detectedUrl) {
        setTunnelUrl(detectedUrl);
        setShowTunnelNotification(true);
        setTimeout(() => setShowTunnelNotification(false), 5000);
      } else {
        alert('Aucune IP tunnel détectée automatiquement. Vérifiez que Playit.gg est configuré et actif, ou utilisez la saisie manuelle.');
      }
    } catch (error) {
      console.error('Erreur lors de la détection:', error);
      alert('Erreur lors de la détection automatique: ' + error);
    } finally {
      setLoading(false);
    }
  };

  const setManualTunnelUrl = async () => {
    if (manualUrl.trim()) {
      try {
        await invoke('set_playit_tunnel_url', { url: manualUrl.trim() });
        setTunnelUrl(manualUrl.trim());
        setShowUrlInput(false);
        setManualUrl('');
      } catch (error) {
        console.error('Erreur lors de la définition de l\'URL:', error);
      }
    }
  };

  return (
    <div className="h-full p-6 overflow-y-auto overflow-x-hidden scrollbar-hide">
      {/* Notification de tunnel détecté */}
      {showTunnelNotification && tunnelUrl && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-4 right-4 z-50 bg-gradient-to-r from-green-500 to-blue-500 text-white p-4 rounded-lg shadow-lg max-w-md"
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Tunnel Configuré !</h3>
              <p className="text-sm opacity-90">Votre serveur est maintenant accessible</p>
            </div>
            <button
              onClick={() => setShowTunnelNotification(false)}
              className="text-white/70 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      )}

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">{t.network.title}</h1>
        <p className="text-dark-400">{t.network.subtitle}</p>
      </div>

      {/* Status Playit.gg */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <motion.div 
          className="card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Globe className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">{t.network.playitTitle}</h3>
                <p className="text-sm text-dark-400">{t.network.freeSecureTunnel}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {playitInstalled ? (
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-green-400">{t.network.installed}</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-400" />
                  <span className="text-sm text-red-400">{t.network.notInstalled}</span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {!playitInstalled ? (
              <div>
                <p className="text-sm text-dark-400 mb-4">
                  {t.network.playitDescription}
                </p>
                <motion.button
                  onClick={installPlayit}
                  disabled={loading}
                  className="btn-primary w-full flex items-center justify-center space-x-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{t.network.installing}</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>{t.network.installPlayit}</span>
                    </>
                  )}
                </motion.button>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-dark-400">{t.network.tunnelStatus}:</span>
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${
                        playitRunning ? 'bg-green-400' : 'bg-red-400'
                      }`} />
                      <span className={`text-sm ${
                        playitRunning ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {playitRunning ? t.network.active : t.network.inactive}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={checkTunnelStatus}
                    disabled={loading}
                    className="px-3 py-1 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-400 text-white rounded text-xs font-medium flex items-center space-x-1"
                  >
                    {loading ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Settings className="w-3 h-3" />
                    )}
                    <span>Vérifier</span>
                  </button>
                </div>

                {playitRunning && !tunnelUrl && (
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-4">
                    <div className="flex items-start space-x-2">
                      <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-yellow-400 mb-2 break-words">
                          Tunnel actif mais URL non détectée
                        </p>
                        <p className="text-xs text-yellow-300 mb-3 break-words">
                          Si vous avez configuré votre tunnel dans la fenêtre Playit.gg, 
                          vous pouvez saisir manuellement l'URL ci-dessous :
                        </p>
                        
                        {!showUrlInput ? (
                          <div className="flex flex-col sm:flex-row gap-2 flex-wrap">
                            <button
                              onClick={detectTunnelUrl}
                              disabled={loading}
                              className="px-3 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-400 text-white rounded text-sm font-medium flex items-center justify-center space-x-2 flex-1 sm:flex-initial min-w-0"
                            >
                              {loading ? (
                                <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
                              ) : (
                                <Globe className="w-4 h-4 flex-shrink-0" />
                              )}
                              <span className="truncate">Détecter automatiquement</span>
                            </button>
                            <button
                              onClick={() => setShowUrlInput(true)}
                              className="px-3 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded text-sm font-medium flex-1 sm:flex-initial whitespace-nowrap"
                            >
                              Saisir manuellement
                            </button>
                            <button
                              onClick={() => setShowHelp(!showHelp)}
                              className="px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded text-sm font-medium flex items-center justify-center space-x-1 flex-1 sm:flex-initial"
                            >
                              <Info className="w-4 h-4 flex-shrink-0" />
                              <span>Aide</span>
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={manualUrl}
                              onChange={(e) => setManualUrl(e.target.value)}
                              placeholder="Ex: playit.gg:12345"
                              className="w-full px-3 py-2 bg-dark-800 border border-yellow-500/30 rounded text-white text-sm"
                            />
                            <div className="flex flex-col sm:flex-row gap-2">
                              <button
                                onClick={setManualTunnelUrl}
                                className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-sm flex-1 sm:flex-initial"
                              >
                                Valider
                              </button>
                              <button
                                onClick={() => {
                                  setShowUrlInput(false);
                                  setManualUrl('');
                                }}
                                className="px-3 py-1 bg-gray-500 hover:bg-gray-600 text-white rounded text-sm flex-1 sm:flex-initial"
                              >
                                Annuler
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {showHelp && (
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-4">
                    <div className="flex items-start space-x-2">
                      <Info className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-blue-400 mb-3">
                          📋 Comment obtenir l'IP du tunnel manuellement
                        </h3>
                        <div className="text-xs text-blue-300 space-y-2">
                          <p className="font-medium">Dans la fenêtre Playit.gg qui s'est ouverte :</p>
                          <ol className="list-decimal list-inside space-y-1 ml-2">
                            <li>Connectez-vous avec votre compte Playit.gg</li>
                            <li>Créez un nouveau tunnel pour le port 25565 (TCP)</li>
                            <li>Une fois configuré, vous verrez une ligne comme :</li>
                          </ol>
                          <div className="bg-black/20 rounded p-2 mt-2 font-mono text-green-400">
                            <p>✅ Tunnel created: mon-serveur.share.playit.gg</p>
                            <p>ou</p>
                            <p>✅ Connected as: mon-serveur.joinmc.link</p>
                          </div>
                          <p className="mt-2">
                            <strong>Copiez cette adresse</strong> et collez-la dans le champ "Saisir manuellement"
                          </p>
                          <p className="text-yellow-300 mt-2">
                            💡 <strong>Astuce :</strong> L'adresse sera au format "nom-du-tunnel.share.playit.gg" ou "nom-du-tunnel.joinmc.link"
                          </p>
                        </div>
                        <button
                          onClick={() => setShowHelp(false)}
                          className="mt-3 px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm"
                        >
                          Fermer l'aide
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {tunnelUrl && (
                  <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-500/30 rounded-lg p-6 mb-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                        <h3 className="text-lg font-semibold text-green-400">🌐 Serveur Accessible</h3>
                      </div>
                      <div className="text-sm text-gray-400">
                        Partagez cette adresse avec vos amis
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-300 mb-2">Adresse du serveur Minecraft :</p>
                        <div className="bg-black/30 rounded-lg p-4 border border-gray-600">
                          <div className="flex items-center justify-between">
                            <p className="text-white font-mono text-xl font-bold break-all select-all">
                              {tunnelUrl}
                            </p>
                            <motion.button
                              onClick={copyTunnelUrl}
                              className={`ml-4 p-3 rounded-lg border transition-all flex items-center space-x-2 ${
                                copySuccess 
                                  ? 'bg-green-600 text-white border-green-400' 
                                  : 'bg-green-500 hover:bg-green-600 text-white border-green-400'
                              }`}
                              whileHover={{ scale: copySuccess ? 1 : 1.05 }}
                              whileTap={{ scale: copySuccess ? 1 : 0.95 }}
                              title="Copier l'adresse"
                            >
                              {copySuccess ? (
                                <>
                                  <CheckCircle className="w-5 h-5" />
                                  <span className="font-medium">Copié !</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-5 h-5" />
                                  <span className="font-medium">Copier</span>
                                </>
                              )}
                            </motion.button>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                        <div className="flex items-start space-x-2">
                          <Info className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                          <div className="text-sm text-blue-300">
                            <p className="font-medium mb-1">Comment vos amis peuvent se connecter :</p>
                            <ol className="list-decimal list-inside space-y-1 text-xs">
                              <li>Ouvrez Minecraft</li>
                              <li>Cliquez sur "Multijoueur"</li>
                              <li>Cliquez sur "Ajouter un serveur"</li>
                              <li>Collez l'adresse ci-dessus dans "Adresse du serveur"</li>
                              <li>Cliquez sur "Terminé" et rejoignez !</li>
                            </ol>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                        <div className="flex items-start space-x-2">
                          <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                          <div className="text-sm text-yellow-300">
                            <p className="font-medium mb-1">💡 Astuce :</p>
                            <p className="text-xs">
                              Si vos amis sont sur le même réseau WiFi que vous, ils peuvent aussi utiliser votre IP locale : 
                              <span className="font-mono bg-black/20 px-1 rounded">localhost</span> ou 
                              <span className="font-mono bg-black/20 px-1 rounded">127.0.0.1</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {servers.length === 0 && (
                  <div className="mb-3 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <p className="text-sm text-yellow-400 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      Créez d'abord un serveur dans l'onglet "Serveurs"
                    </p>
                  </div>
                )}

                <div className="flex space-x-2">
                  {!playitRunning ? (
                    <motion.button
                      onClick={() => servers.length > 0 && startTunnel(servers[0])}
                      disabled={loading || servers.length === 0}
                      className="flex-1 btn-primary flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      whileHover={{ scale: servers.length > 0 ? 1.02 : 1 }}
                      whileTap={{ scale: servers.length > 0 ? 0.98 : 1 }}
                      title={servers.length === 0 ? "Créez d'abord un serveur" : "Démarrer le tunnel"}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Démarrage...</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4" />
                          <span>{t.network.startTunnel}</span>
                        </>
                      )}
                    </motion.button>
                  ) : (
                    <motion.button
                      onClick={stopTunnel}
                      disabled={loading}
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Square className="w-4 h-4" />
                      <span>{t.network.stopTunnel}</span>
                    </motion.button>
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div 
          className="card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <Shield className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white">{t.network.alternativesFree}</h3>
              <p className="text-sm text-dark-400">{t.network.alternativesSolutions}</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-dark-800 rounded-lg">
              <div>
                <h4 className="font-medium text-white">ngrok</h4>
                <p className="text-sm text-dark-400">{t.network.ngrokDesc}</p>
              </div>
              <motion.button
                className="p-2 text-dark-400 hover:text-white hover:bg-dark-700 rounded-lg"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <ExternalLink className="w-4 h-4" />
              </motion.button>
            </div>

            <div className="flex items-center justify-between p-3 bg-dark-800 rounded-lg">
              <div>
                <h4 className="font-medium text-white">LocalTunnel</h4>
                <p className="text-sm text-dark-400">{t.network.localTunnelDesc}</p>
              </div>
              <motion.button
                className="p-2 text-dark-400 hover:text-white hover:bg-dark-700 rounded-lg"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <ExternalLink className="w-4 h-4" />
              </motion.button>
            </div>

            <div className="flex items-center justify-between p-3 bg-dark-800 rounded-lg">
              <div>
                <h4 className="font-medium text-white">Serveo</h4>
                <p className="text-sm text-dark-400">{t.network.serveoDesc}</p>
              </div>
              <motion.button
                className="p-2 text-dark-400 hover:text-white hover:bg-dark-700 rounded-lg"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <ExternalLink className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Serveurs disponibles */}
      <motion.div 
        className="card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">{t.network.availableServers}</h2>
          <div className="flex items-center space-x-2">
            <NetworkIcon className="w-5 h-5 text-primary-400" />
            <span className="text-sm text-dark-400">{servers.length} {t.network.serversCount}</span>
          </div>
        </div>

        {servers.length === 0 ? (
          <div className="text-center py-8">
            <Server className="w-12 h-12 text-dark-600 mx-auto mb-4" />
            <p className="text-dark-400 mb-2">{t.network.noServersCreated}</p>
            <p className="text-sm text-dark-500">{t.network.noServersDesc}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {servers.map((server, index) => (
              <motion.div
                key={server.id}
                className="bg-dark-800 rounded-lg p-4 border border-dark-700"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-white">{server.name}</h3>
                    <p className="text-sm text-dark-400">
                      {server.version} • {t.network.port} {server.port}
                    </p>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${
                    server.status === 'running' ? 'bg-green-400' : 'bg-red-400'
                  }`} />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-dark-400">{t.network.statusLabel}:</span>
                    <span className={`${
                      server.status === 'running' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {server.status === 'running' ? t.network.running : t.network.stopped}
                    </span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-dark-400">{t.network.type}:</span>
                    <span className="text-white capitalize">{server.type}</span>
                  </div>
                </div>

                <div className="mt-4 flex space-x-2">
                  <motion.button
                    disabled={server.status !== 'running'}
                    className="flex-1 py-2 bg-primary-500/20 text-primary-400 rounded-lg hover:bg-primary-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Settings className="w-4 h-4 mx-auto" />
                  </motion.button>
                  
                  <motion.button
                    disabled={server.status !== 'running'}
                    className="flex-1 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Globe className="w-4 h-4 mx-auto" />
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Tutoriel Vidéo */}
      <motion.div 
        className="card mt-6 bg-primary-500/10 border-primary-500"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="flex items-center space-x-3 mb-4">
          <Info className="w-5 h-5 text-blue-400" />
          <h3 className="font-semibold text-white">📹 Tutoriel Vidéo - Configuration du Système de Tunnel</h3>
        </div>
        <p className="text-dark-400 mb-4 leading-relaxed">
          Regardez ce tutoriel vidéo pour apprendre à configurer le système de tunnel étape par étape :
        </p>
        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
          <iframe
            className="absolute top-0 left-0 w-full h-full rounded-lg"
            src="https://www.youtube.com/embed/RkPnrH6A_mg"
            title="Tutoriel Configuration Système de Tunnel"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </motion.div>

      {/* Guide d'utilisation */}
      <motion.div 
        className="card mt-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <div className="flex items-center space-x-3 mb-4">
          <Info className="w-5 h-5 text-blue-400" />
          <h3 className="font-semibold text-white">{t.network.usageGuide}</h3>
        </div>

        <div className="space-y-4 text-sm text-dark-400">
          <div>
            <h4 className="font-medium text-white mb-2">{t.network.guideStep1Title}</h4>
            <p>{t.network.guideStep1Desc}</p>
          </div>
          
          <div>
            <h4 className="font-medium text-white mb-2">{t.network.guideStep2Title}</h4>
            <p>{t.network.guideStep2Desc}</p>
          </div>
          
          <div>
            <h4 className="font-medium text-white mb-2">{t.network.guideStep3Title}</h4>
            <p>{t.network.guideStep3Desc}</p>
          </div>
          
          <div>
            <h4 className="font-medium text-white mb-2">{t.network.guideStep4Title}</h4>
            <p>{t.network.guideStep4Desc}</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Network;
