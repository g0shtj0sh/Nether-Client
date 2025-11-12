import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Server as ServerIcon,
  RefreshCw
} from 'lucide-react';
import { Server as ServerType } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { useThemeClasses } from '../contexts/ThemeContext';
import ModerationPanel from '../components/ModerationPanel';

const Players: React.FC = () => {
  const { t } = useLanguage();
  const { borderClass } = useThemeClasses();
  const [servers, setServers] = useState<ServerType[]>([]);
  const [selectedServer, setSelectedServer] = useState<ServerType | null>(null);
  const [allPlayers, setAllPlayers] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadListsFromServer = async () => {
    if (!selectedServer) return;

    setIsRefreshing(true);
    try {
      const { invoke } = await import('@tauri-apps/api/tauri');
      const players = await invoke<any[]>('get_server_players', {
        serverPath: selectedServer.path
      });

      // Stocker tous les joueurs avec leur statut
      setAllPlayers(players);
      
      // Debug: afficher les joueurs
      console.log('Joueurs chargés:', players);
      console.log('Joueurs en ligne:', players.filter(p => p.isOnline === true || p.is_online === true));
      console.log('Joueurs bannis:', players.filter(p => p.isBanned === true || p.is_banned === true));
      console.log('Joueurs whitelist:', players.filter(p => p.isWhitelisted === true || p.is_whitelisted === true));

      // Extraire les listes depuis les données des joueurs
      // Vérification stricte avec === true pour éviter les faux positifs
      const whitelist = players
        .filter(p => p.isWhitelisted === true || p.is_whitelisted === true)
        .map(p => p.username);
      const ops = players
        .filter(p => p.isOp === true || p.is_op === true)
        .map(p => p.username);
      const banned = players
        .filter(p => p.isBanned === true || p.is_banned === true)
        .map(p => p.username);
      
      console.log('Listes extraites - Bannis:', banned, 'Whitelist:', whitelist, 'Ops:', ops);

      // Mettre à jour le serveur dans l'état en utilisant la fonction de mise à jour
      setServers(prevServers => {
        const updatedServers = prevServers.map(s => {
          if (s.id === selectedServer.id) {
            const updated = {
              ...s,
              whitelist: whitelist,
              ops: ops,
              bannedPlayers: banned
            };
            console.log('Serveur mis à jour avec bannis:', updated.bannedPlayers);
            return updated;
          }
          return s;
        });

        localStorage.setItem('nether-client-servers', JSON.stringify(updatedServers));
        return updatedServers;
      });

      // Mettre à jour le serveur sélectionné avec les nouvelles listes
      setSelectedServer(prev => {
        if (!prev) return null;
        const updated = {
          ...prev,
          whitelist: whitelist,
          ops: ops,
          bannedPlayers: banned
        };
        console.log('Serveur sélectionné mis à jour avec bannis:', updated.bannedPlayers);
        console.log('Liste actuelle dans getCurrentList:', updated.bannedPlayers);
        return updated;
      });
    } catch (error) {
      console.error('Erreur chargement listes:', error);
      alert('Erreur lors du chargement des joueurs: ' + error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    const loadServers = () => {
      const savedServers = localStorage.getItem('nether-client-servers');
      if (savedServers) {
        const parsedServers = JSON.parse(savedServers);
        setServers(prevServers => {
          // Filtrer uniquement les serveurs en ligne
          const runningServers = parsedServers.filter((s: ServerType) => s.status === 'running');
          
          // Si le serveur sélectionné n'est plus en ligne ou n'existe plus, sélectionner le premier serveur en ligne disponible
          setSelectedServer(prevSelected => {
            if (prevSelected) {
              const stillExists = runningServers.find((s: ServerType) => s.id === prevSelected.id);
              if (!stillExists) {
                return runningServers.length > 0 ? runningServers[0] : null;
              }
              return prevSelected;
            } else if (runningServers.length > 0) {
              return runningServers[0];
            }
            return null;
          });
          
          return parsedServers;
        });
      } else {
        setServers([]);
        setSelectedServer(null);
      }
    };

    loadServers();

    // Écouter les changements du localStorage
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'nether-client-servers') {
        loadServers();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    const interval = setInterval(loadServers, 2000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // Charger les listes depuis les fichiers du serveur
  useEffect(() => {
    if (selectedServer) {
      loadListsFromServer();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedServer?.id]);


  return (
    <div className="h-full p-8 max-w-6xl mx-auto overflow-y-auto overflow-x-hidden scrollbar-hide">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">{t.players.title}</h1>
        <p className="text-dark-400">{t.players.subtitle}</p>
      </div>

      {/* Sélection du serveur */}
      <div className={`rounded-lg p-6 mb-6 border ${borderClass}`}>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-white">
            {t.players.server}
          </label>
          {selectedServer && (
            <motion.button
              onClick={loadListsFromServer}
              disabled={isRefreshing}
              className="flex items-center space-x-2 px-3 py-1 text-sm bg-dark-700 hover:bg-dark-600 rounded-lg transition-colors disabled:opacity-50"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Actualiser les joueurs"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Actualiser</span>
            </motion.button>
          )}
        </div>
        <select
          value={selectedServer?.id || ''}
          onChange={(e) => {
            if (!e.target.value) {
              setSelectedServer(null);
              return;
            }
            const runningServers = servers.filter(s => s.status === 'running');
            const server = runningServers.find(s => s.id === e.target.value);
            setSelectedServer(server || null);
          }}
          className="input w-full"
        >
          <option value="">{t.players.selectServer}</option>
          {servers.filter(server => server.status === 'running').map(server => (
            <option key={server.id} value={server.id}>
              {server.name} ({server.type})
            </option>
          ))}
        </select>
        {servers.filter(s => s.status === 'running').length === 0 && (
          <p className="text-sm text-dark-400 mt-2">{t.terminal.noRunningServers}</p>
        )}
        {selectedServer && allPlayers.length > 0 && (
          <div className="mt-3 pt-3 border-t border-dark-700">
            <p className="text-sm text-dark-400">
              Joueurs en ligne: <span className="text-green-400 font-semibold">
                {allPlayers.filter(p => p.isOnline === true || p.is_online === true).length}
              </span> / {allPlayers.length} joueurs
            </p>
          </div>
        )}
      </div>

      {selectedServer ? (
        <ModerationPanel
          serverName={selectedServer.name}
          serverPath={selectedServer.path}
          onListUpdate={loadListsFromServer}
        />
      ) : (
        <div className="rounded-lg p-12 text-center border border-purple-500/30">
          <ServerIcon className="w-16 h-16 text-dark-600 mx-auto mb-4" />
          <p className="text-dark-400 text-lg">{t.players.selectServerToManage}</p>
        </div>
      )}
    </div>
  );
};

export default Players;

