import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Terminal as TerminalIcon, 
  Send, 
  Download, 
  Trash2, 
  Copy, 
  Filter,
  Server,
  Clock,
  AlertCircle,
  CheckCircle,
  Info,
  X,
  Search,
  ArrowUp,
  ArrowDown,
  FileText,
  Code,
  Eye,
  EyeOff
} from 'lucide-react';
import { LogEntry, Server as ServerType } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { useThemeClasses } from '../contexts/ThemeContext';

const Terminal: React.FC = () => {
  const { t } = useLanguage();
  const { borderClass } = useThemeClasses();
  const [servers, setServers] = useState<ServerType[]>([]);
  const [selectedServer, setSelectedServer] = useState<ServerType | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [command, setCommand] = useState('');
  const [filter, setFilter] = useState<'all' | 'info' | 'warn' | 'error' | 'debug'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [autoScroll, setAutoScroll] = useState(false);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [showTimestamps, setShowTimestamps] = useState(true);
  const [wordWrap, setWordWrap] = useState(true);
  const [hideLowPriorityWarnings, setHideLowPriorityWarnings] = useState(false);
  
  const terminalRef = useRef<HTMLDivElement>(null);
  const commandRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadServers = () => {
      const savedServers = localStorage.getItem('nether-client-servers');
      if (savedServers) {
        const parsedServers = JSON.parse(savedServers);
        setServers(parsedServers);
        
        // Filtrer uniquement les serveurs en ligne
        const runningServers = parsedServers.filter((s: any) => s.status === 'running');
        
        // Si le serveur sélectionné n'est plus en ligne ou n'existe plus, sélectionner le premier serveur en ligne disponible
        if (selectedServer) {
          const stillExists = runningServers.find((s: any) => s.id === selectedServer.id);
          if (!stillExists) {
            setSelectedServer(runningServers.length > 0 ? runningServers[0] : null);
          }
        } else if (runningServers.length > 0) {
          setSelectedServer(runningServers[0]);
        } else {
          // Si aucun serveur n'est en ligne, désélectionner
          setSelectedServer(null);
        }
      } else {
        setServers([]);
        setSelectedServer(null);
      }
    };

    loadServers();

    // Charger l'historique des commandes
    const savedHistory = localStorage.getItem('nether-command-history');
    if (savedHistory) {
      try {
        setCommandHistory(JSON.parse(savedHistory));
      } catch {}
    }

    // Écouter les changements du localStorage (pour synchroniser avec la page Serveurs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'nether-client-servers') {
        loadServers();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Vérifier les changements toutes les 2 secondes (backup si storage event ne marche pas)
    const interval = setInterval(loadServers, 2000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [selectedServer]);

  useEffect(() => {
    if (selectedServer) {
      loadServerLogs();
      
      const interval = setInterval(() => {
        if (selectedServer.status === 'running') {
          loadServerLogs();
        }
      }, 2000);
      
      return () => clearInterval(interval);
    }
  }, [selectedServer]);

  // Fonction pour parser le timestamp depuis une ligne de log Minecraft
  const parseLogTimestamp = (line: string): Date => {
    // Format Minecraft: [HH:MM:SS] [Thread/LEVEL]: Message
    // Exemple: [12:34:56] [main/INFO]: Starting minecraft server version 1.20.1
    
    const timestampMatch = line.match(/\[(\d{2}):(\d{2}):(\d{2})\]/);
    if (timestampMatch) {
      const [, hours, minutes, seconds] = timestampMatch;
      const now = new Date();
      const logDate = new Date();
      logDate.setHours(parseInt(hours, 10));
      logDate.setMinutes(parseInt(minutes, 10));
      logDate.setSeconds(parseInt(seconds, 10));
      logDate.setMilliseconds(0);
      
      // Si l'heure du log est supérieure à l'heure actuelle, c'est probablement hier
      if (logDate > now) {
        logDate.setDate(logDate.getDate() - 1);
      }
      
      return logDate;
    }
    
    // Si pas de timestamp trouvé, utiliser l'heure actuelle (pour les nouveaux logs)
    return new Date();
  };

  const loadServerLogs = async () => {
    if (!selectedServer) return;
    
    try {
      const { invoke } = await import('@tauri-apps/api/tauri');
      const logLines = await invoke<string[]>('get_server_logs', { 
        serverName: selectedServer.name 
      });
      
      // Garder une référence aux logs existants pour préserver les timestamps
      setLogs(prevLogs => {
        const existingMessages = new Set(prevLogs.map(log => log.message));
        const newLogs: LogEntry[] = [];
        
        logLines.forEach((line, index) => {
          // Si le log existe déjà, garder son timestamp original
          const existingLog = prevLogs.find(log => log.message === line);
          
          if (existingLog) {
            newLogs.push(existingLog);
          } else {
            // Nouveau log, parser le timestamp depuis la ligne
            let level: 'info' | 'warn' | 'error' | 'debug' = 'info';
            
            // Détection améliorée des niveaux de log
            const lineLower = line.toLowerCase();
            
            // Détection des warnings - plus détaillée
            // D'abord détecter les warnings non critiques (informatifs)
            const isLowPriorityWarning = 
              lineLower.includes('deprecated') ||
              lineLower.includes('outdated') ||
              lineLower.includes('legacy') ||
              lineLower.includes('consider using') ||
              lineLower.includes('recommend') ||
              lineLower.includes('suggestion') ||
              lineLower.includes('note:') ||
              lineLower.includes('info:') ||
              lineLower.includes('version') && (lineLower.includes('old') || lineLower.includes('new')) ||
              lineLower.includes('plugin') && lineLower.includes('version') ||
              lineLower.includes('api') && (lineLower.includes('deprecated') || lineLower.includes('old'));
            
            // Ensuite détecter les warnings critiques
            const isCriticalWarning = 
              lineLower.includes('/warn') || 
              lineLower.includes('[warn]') || 
              (lineLower.includes('warning') && !isLowPriorityWarning) ||
              lineLower.includes('warn:') ||
              lineLower.match(/\[.*\/warn.*\]/i) ||
              lineLower.includes('⚠') ||
              lineLower.includes('failed to') ||
              lineLower.includes('unable to') ||
              lineLower.includes('cannot') ||
              lineLower.includes('missing') ||
              lineLower.includes('not found') ||
              lineLower.includes('timeout') ||
              lineLower.includes('connection') && (lineLower.includes('refused') || lineLower.includes('failed')) ||
              lineLower.includes('memory') && (lineLower.includes('low') || lineLower.includes('high')) ||
              lineLower.includes('performance') ||
              lineLower.includes('lag') ||
              lineLower.includes('tps') && (lineLower.includes('low') || lineLower.includes('dropped'));
            
            if (isCriticalWarning) {
              level = 'warn';
            } else if (isLowPriorityWarning) {
              // Marquer comme info mais avec un indicateur spécial
              level = 'info';
            }
            // Détection des erreurs
            else if (lineLower.includes('/error') || 
                     lineLower.includes('[error]') || 
                     lineLower.includes('error:') ||
                     lineLower.match(/\[.*\/error.*\]/i) ||
                     lineLower.includes('exception') ||
                     lineLower.includes('failed') ||
                     lineLower.includes('crash') ||
                     lineLower.includes('fatal')) {
              level = 'error';
            }
            // Détection du debug
            else if (lineLower.includes('/debug') || 
                     lineLower.includes('[debug]') || 
                     lineLower.includes('debug:') ||
                     lineLower.match(/\[.*\/debug.*\]/i)) {
              level = 'debug';
            }
            
            newLogs.push({
              timestamp: parseLogTimestamp(line),
              level,
              message: line,
              serverId: selectedServer.id
            });
          }
        });
        
        return newLogs;
      });
    } catch (error) {
      console.error('Erreur lors du chargement des logs:', error);
    }
  };

  useEffect(() => {
    if (autoScroll && terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const handleCommandSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim() || !selectedServer) return;

    try {
      const { invoke } = await import('@tauri-apps/api/tauri');
      
      console.log(`Envoi de la commande: "${command.trim()}" au serveur: ${selectedServer.name}`);
      
      await invoke('send_server_command', {
        serverName: selectedServer.name,
        command: command.trim()
      });

      console.log('Commande envoyée avec succès');

      // Ajouter à l'historique
      const newHistory = [command.trim(), ...commandHistory.filter(c => c !== command.trim())].slice(0, 50);
      setCommandHistory(newHistory);
      localStorage.setItem('nether-command-history', JSON.stringify(newHistory));
      
      setCommand('');
      setHistoryIndex(-1);
      loadServerLogs();
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la commande:', error);
      
      // Message d'erreur plus détaillé
      let errorMessage = 'Erreur lors de l\'envoi de la commande:\n\n';
      if (typeof error === 'string') {
        errorMessage += error;
      } else {
        errorMessage += JSON.stringify(error);
      }
      
      errorMessage += `\n\nServeur: ${selectedServer?.name}\nCommande: "${command.trim()}"\nStatut: ${selectedServer?.status}`;
      
      alert(errorMessage);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0 && historyIndex < commandHistory.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setCommand(commandHistory[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setCommand(commandHistory[newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setCommand('');
      }
    }
  };

  const clearLogs = async () => {
    if (!selectedServer) return;
    
    if (confirm('Êtes-vous sûr de vouloir effacer tous les logs ?')) {
      try {
        const { invoke } = await import('@tauri-apps/api/tauri');
        await invoke('clear_server_logs', { serverName: selectedServer.name });
        setLogs([]);
      } catch (error) {
        console.error('Erreur effacement logs:', error);
      }
    }
  };

  const copyLogs = () => {
    const logText = filteredLogs
      .map(log => formatLogLine(log))
      .join('\n');
    
    navigator.clipboard.writeText(logText);
    alert('Logs copiés !');
  };

  const downloadLogs = (format: 'txt' | 'csv' = 'txt') => {
    let content: string;
    let filename: string;
    let mimeType: string;

    if (format === 'csv') {
      content = 'Timestamp,Level,Message\n' + filteredLogs
        .map(log => `"${log.timestamp.toISOString()}","${log.level.toUpperCase()}","${log.message.replace(/"/g, '""')}"`)
        .join('\n');
      filename = `logs-${selectedServer?.name || 'server'}-${new Date().toISOString().split('T')[0]}.csv`;
      mimeType = 'text/csv';
    } else {
      content = filteredLogs
        .map(log => formatLogLine(log))
        .join('\n');
      filename = `logs-${selectedServer?.name || 'server'}-${new Date().toISOString().split('T')[0]}.txt`;
      mimeType = 'text/plain';
    }
    
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatLogLine = (log: LogEntry): string => {
    const timestamp = showTimestamps ? `[${log.timestamp.toLocaleTimeString()}] ` : '';
    return `${timestamp}[${log.level.toUpperCase()}] ${log.message}`;
  };

  const getLogColor = (level: string, message: string): string => {
    const isLowPriority = isLowPriorityWarning(message);
    
    switch (level) {
      case 'error': return 'text-red-400 bg-red-900/30 border-l-4 border-red-500';
      case 'warn': return 'text-yellow-300 bg-yellow-900/30 border-l-4 border-yellow-500';
      case 'debug': return 'text-gray-400 bg-gray-900/20';
      case 'info':
        // Si c'est un warning non critique marqué comme info, utiliser un style différent
        if (isLowPriority) {
          return 'text-gray-400 bg-gray-800/20 border-l-2 border-gray-600/50 opacity-75';
        }
        return 'text-green-400 bg-green-900/20';
      default: return 'text-green-400 bg-green-900/20';
    }
  };

  const getLevelIcon = (level: string, message: string) => {
    const isLowPriority = isLowPriorityWarning(message);
    
    switch (level) {
      case 'error': return <AlertCircle className="w-4 h-4 text-red-400" />;
      case 'warn': return <AlertCircle className="w-4 h-4 text-yellow-400" />;
      case 'debug': return <Code className="w-4 h-4 text-gray-400" />;
      case 'info':
        // Si c'est un warning non critique, utiliser une icône différente
        if (isLowPriority) {
          return <Info className="w-4 h-4 text-gray-500" />;
        }
        return <Info className="w-4 h-4 text-green-400" />;
      default: return <Info className="w-4 h-4 text-green-400" />;
    }
  };

  // Fonction pour détecter si un log est un warning non critique (informatif)
  const isLowPriorityWarning = (message: string): boolean => {
    const lineLower = message.toLowerCase();
    return (
      lineLower.includes('deprecated') ||
      lineLower.includes('outdated') ||
      lineLower.includes('legacy') ||
      lineLower.includes('consider using') ||
      lineLower.includes('recommend') ||
      lineLower.includes('suggestion') ||
      lineLower.includes('note:') ||
      (lineLower.includes('version') && (lineLower.includes('old') || lineLower.includes('new'))) ||
      (lineLower.includes('plugin') && lineLower.includes('version')) ||
      (lineLower.includes('api') && (lineLower.includes('deprecated') || lineLower.includes('old')))
    );
  };

  // Fonction pour extraire les détails d'un warning
  const extractWarningDetails = (message: string): { thread?: string; source?: string; details?: string } => {
    const details: { thread?: string; source?: string; details?: string } = {};
    
    // Extraire le thread depuis le format [HH:MM:SS] [Thread/LEVEL]: Message
    const threadMatch = message.match(/\[.*?\]\s*\[([^\/]+)\//);
    if (threadMatch) {
      details.thread = threadMatch[1].trim();
    }
    
    // Extraire la source (classe/méthode) si présente
    const sourceMatch = message.match(/at\s+([\w\.\$]+)/);
    if (sourceMatch) {
      details.source = sourceMatch[1];
    }
    
    // Extraire des détails supplémentaires
    const detailMatch = message.match(/:\s*(.+)/);
    if (detailMatch && detailMatch[1].length > 0) {
      details.details = detailMatch[1].substring(0, 200); // Limiter à 200 caractères
    }
    
    return details;
  };

  const filteredLogs = logs.filter(log => {
    const matchesFilter = filter === 'all' || log.level === filter;
    const matchesSearch = !searchTerm || log.message.toLowerCase().includes(searchTerm.toLowerCase());
    const isLowPriority = isLowPriorityWarning(log.message);
    const hideLowPriority = hideLowPriorityWarnings && isLowPriority;
    return matchesFilter && matchesSearch && !hideLowPriority;
  });

  const logStats = {
    total: logs.length,
    info: logs.filter(l => l.level === 'info').length,
    warn: logs.filter(l => l.level === 'warn').length,
    error: logs.filter(l => l.level === 'error').length,
    debug: logs.filter(l => l.level === 'debug').length,
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Partie haute fixe */}
      <div className="flex-shrink-0">
        {/* Header */}
        <div className={`p-6 border-b-2 ${borderClass} shadow-[0_2px_10px_var(--color-glow)]`}>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <TerminalIcon className="w-8 h-8" style={{ color: 'var(--color-primary)' }} />
            {t.terminal.title} & Logs
          </h1>
          <p className="text-dark-400">{t.terminal.subtitle}</p>
        </div>

        {/* Sélection du serveur */}
        <div className={`p-6 border-b-2 ${borderClass} shadow-[0_2px_10px_var(--color-glow)]`}>
          <select
            value={selectedServer?.id || ''}
            onChange={(e) => {
              const server = servers.find(s => s.id === e.target.value);
              setSelectedServer(server || null);
            }}
            className="input w-full"
          >
            <option value="">{t.terminal.selectServer}</option>
            {servers.filter(server => server.status === 'running').map(server => (
              <option key={server.id} value={server.id}>
                {server.name} ({server.type}) - {server.status}
              </option>
            ))}
          </select>
        </div>

        {selectedServer && (
          <>
            {/* Statistiques */}
            <div className={`px-6 py-4 grid grid-cols-5 gap-4 border-b-2 ${borderClass}`}>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{logStats.total}</div>
                <div className="text-xs text-gray-400">{t.terminal.total}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{logStats.info}</div>
                <div className="text-xs text-gray-400">{t.terminal.info}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400">{logStats.warn}</div>
                <div className="text-xs text-gray-400">{t.terminal.warn}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-400">{logStats.error}</div>
                <div className="text-xs text-gray-400">{t.terminal.error}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-400">{logStats.debug}</div>
                <div className="text-xs text-gray-400">{t.terminal.debug}</div>
              </div>
            </div>

            {/* Barre d'outils */}
            <div className={`p-4 border-b-2 ${borderClass} shadow-[0_2px_10px_var(--color-glow)] flex flex-wrap items-center gap-3`}>
              {/* Recherche */}
              <div className="flex-1 relative min-w-[200px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-dark-400" />
                <input
                  type="text"
                  placeholder={t.terminal.searchLogs}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input w-full pl-10 py-2"
                />
              </div>

              {/* Filtres de niveau */}
              <div className="flex gap-2">
                {(['all', 'info', 'warn', 'error', 'debug'] as const).map(level => (
                  <button
                    key={level}
                    onClick={() => setFilter(level)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filter === level
                        ? 'text-white'
                        : 'bg-dark-700 text-dark-400 hover:bg-dark-600'
                    }`}
                    style={filter === level ? { backgroundColor: 'var(--color-primary)' } : {}}
                  >
                    {level.toUpperCase()}
                  </button>
                ))}
              </div>

              {/* Options d'affichage */}
              <div className="flex gap-2">
                <button
                  onClick={() => setShowTimestamps(!showTimestamps)}
                  className={`p-2 rounded-lg ${showTimestamps ? '' : 'bg-dark-700'}`}
                  style={showTimestamps ? { backgroundColor: 'var(--color-primary)' } : {}}
                  title={t.terminal.showTimestamps}
                >
                  <Clock className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setWordWrap(!wordWrap)}
                  className={`p-2 rounded-lg ${wordWrap ? '' : 'bg-dark-700'}`}
                  style={wordWrap ? { backgroundColor: 'var(--color-primary)' } : {}}
                  title={t.terminal.wordWrap}
                >
                  <FileText className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setAutoScroll(!autoScroll)}
                  className={`p-2 rounded-lg ${autoScroll ? '' : 'bg-dark-700'}`}
                  style={autoScroll ? { backgroundColor: 'var(--color-primary)' } : {}}
                  title={t.terminal.autoScroll}
                >
                  <ArrowDown className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setHideLowPriorityWarnings(!hideLowPriorityWarnings)}
                  className={`p-2 rounded-lg ${hideLowPriorityWarnings ? '' : 'bg-dark-700'}`}
                  style={hideLowPriorityWarnings ? { backgroundColor: 'var(--color-primary)' } : {}}
                  title={hideLowPriorityWarnings ? 'Afficher les warnings non critiques' : 'Masquer les warnings non critiques'}
                >
                  {hideLowPriorityWarnings ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={copyLogs}
                  className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
                  title={t.terminal.copy}
                >
                  <Copy className="w-4 h-4" />
                </button>

                <button
                  onClick={() => downloadLogs('csv')}
                  className="p-2 bg-green-600 hover:bg-green-700 rounded-lg"
                  title={t.terminal.downloadCsv}
                >
                  <FileText className="w-4 h-4" />
                </button>

                <button
                  onClick={clearLogs}
                  className="p-2 bg-red-600 hover:bg-red-700 rounded-lg"
                  title={t.terminal.delete}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Zone des logs scrollable */}
      {selectedServer ? (
        <div
          ref={terminalRef}
          className={`flex-1 overflow-y-auto overflow-x-hidden p-4 font-mono text-sm scrollbar-hide ${
            wordWrap ? '' : 'whitespace-nowrap overflow-x-auto'
          }`}
        >
          {filteredLogs.length === 0 ? (
            <div className="text-center py-20">
              <TerminalIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">{t.terminal.noLogsToDisplay}</p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredLogs.map((log, index) => {
                const isLowPriority = isLowPriorityWarning(log.message);
                const warningDetails = log.level === 'warn' ? extractWarningDetails(log.message) : null;
                const isInfoWarning = log.level === 'info' && isLowPriority;
                
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.1 }}
                    className={`p-3 rounded-lg ${getLogColor(log.level, log.message)} hover:brightness-110 transition-all ${
                      log.level === 'warn' ? 'shadow-lg shadow-yellow-900/20' : ''
                    } ${isInfoWarning ? 'hover:opacity-100' : ''}`}
                  >
                    <div className="flex items-start gap-2">
                      <span className="mt-0.5 flex-shrink-0">{getLevelIcon(log.level, log.message)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2 flex-wrap">
                          {showTimestamps && (
                            <span className={`text-xs font-mono flex-shrink-0 ${
                              isInfoWarning ? 'text-gray-500' : 'text-gray-400'
                            }`}>
                              [{log.timestamp.toLocaleTimeString()}]
                            </span>
                          )}
                          {log.level === 'warn' && warningDetails?.thread && (
                            <span className="text-yellow-400/70 text-xs font-semibold px-2 py-0.5 bg-yellow-900/40 rounded flex-shrink-0">
                              {warningDetails.thread}
                            </span>
                          )}
                          {log.level === 'warn' && (
                            <span className="text-yellow-400/80 text-xs font-bold uppercase flex-shrink-0">
                              ⚠ WARNING CRITIQUE
                            </span>
                          )}
                          {isInfoWarning && (
                            <span className="text-gray-500 text-xs font-medium px-2 py-0.5 bg-gray-800/40 rounded flex-shrink-0">
                              ℹ Info (Non critique)
                            </span>
                          )}
                        </div>
                        <div className="mt-1">
                          <span className={`break-words text-sm ${isInfoWarning ? 'text-gray-400' : ''}`}>
                            {log.message}
                          </span>
                        </div>
                        {log.level === 'warn' && warningDetails?.source && (
                          <div className="mt-2 pt-2 border-t border-yellow-700/30">
                            <div className="text-xs text-yellow-300/60">
                              <span className="font-semibold">Source:</span> {warningDetails.source}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Server className="w-20 h-20 text-gray-600 mx-auto mb-4" />
            <p className="text-xl text-gray-400">
              {servers.filter(s => s.status === 'running').length === 0 
                ? t.terminal.noRunningServers
                : t.terminal.selectServerToViewLogs}
            </p>
          </div>
        </div>
      )}

      {/* Partie basse fixe - Input de commande */}
      {selectedServer && (
        <form 
          onSubmit={handleCommandSubmit} 
          className={`flex-shrink-0 p-4 border-t-2 ${borderClass} shadow-[0_-2px_10px_var(--color-glow)]`}
        >
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <TerminalIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: 'var(--color-primary)' }} />
              <input
                ref={commandRef}
                type="text"
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`${t.terminal.commandPlaceholder} (↑↓ ${t.terminal.commandHistoryHint})`}
                className="input w-full pl-12 py-3 font-mono"
                disabled={selectedServer?.status !== 'running'}
              />
            </div>
            <motion.button
              type="submit"
              disabled={selectedServer?.status !== 'running' || !command.trim()}
              className="btn-primary px-6 py-3 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Send className="w-5 h-5" />
              {t.terminal.send}
            </motion.button>
          </div>
          {commandHistory.length > 0 && (
            <div className="mt-2 text-xs text-gray-500">
              <ArrowUp className="w-3 h-3 inline" /> <ArrowDown className="w-3 h-3 inline" /> {t.terminal.commandHistoryHint}
            </div>
          )}
        </form>
      )}
    </div>
  );
};

export default Terminal;
