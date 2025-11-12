import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Shield,
  Ban,
  UserX,
  UserCheck,
  Crown,
  UserMinus,
  RefreshCw,
  Search,
  Plus,
  Trash2,
  Clock,
  AlertTriangle,
  CheckCircle,
  User,
  Users,
  Lock,
  Unlock,
} from 'lucide-react';
import { invoke } from '@tauri-apps/api/tauri';

interface Player {
  username: string;
  uuid: string;
  isOnline?: boolean;
  is_online?: boolean;
  isOp?: boolean;
  is_op?: boolean;
  isBanned?: boolean;
  is_banned?: boolean;
  isWhitelisted?: boolean;
  is_whitelisted?: boolean;
}

interface ModerationAction {
  id: string;
  type: 'ban' | 'unban' | 'kick' | 'op' | 'deop' | 'whitelist' | 'unwhitelist';
  player: string;
  reason?: string;
  timestamp: string;
  moderator: string;
}

interface ModerationPanelProps {
  serverName: string;
  serverPath: string;
  onListUpdate?: () => void; // Callback pour notifier la mise à jour des listes
}

const ModerationPanel: React.FC<ModerationPanelProps> = ({
  serverName,
  serverPath,
  onListUpdate,
}) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [actions, setActions] = useState<ModerationAction[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'players' | 'history'>('players');
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'banned' | 'whitelisted' | 'op'>('all');
  const [selectedPlayerDetails, setSelectedPlayerDetails] = useState<Player | null>(null);
  const [showPlayerDetails, setShowPlayerDetails] = useState(false);

  // Formulaires
  const [showBanModal, setShowBanModal] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<string>('');
  const [banReason, setBanReason] = useState('');

  useEffect(() => {
    loadPlayers();
    loadActions();
  }, [serverPath]);

  const loadPlayers = async () => {
    setLoading(true);
    try {
      // Charger les joueurs depuis le serveur
      const data = await invoke<any[]>('get_server_players', { serverPath });
      // Convertir les propriétés snake_case en camelCase pour correspondre à l'interface
      const convertedPlayers: Player[] = data.map((p: any) => ({
        username: p.username,
        uuid: p.uuid,
        isOnline: p.is_online ?? p.isOnline ?? false,
        isOp: p.is_op ?? p.isOp ?? false,
        isBanned: p.is_banned ?? p.isBanned ?? false,
        isWhitelisted: p.is_whitelisted ?? p.isWhitelisted ?? false,
      }));
      setPlayers(convertedPlayers);
    } catch (error) {
      console.error('Erreur chargement joueurs:', error);
    }
    setLoading(false);
  };

  const loadActions = () => {
    const key = `nether-moderation-${serverName}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        setActions(JSON.parse(saved));
      } catch {
        setActions([]);
      }
    }
  };

  const saveAction = (action: Omit<ModerationAction, 'id' | 'timestamp'>) => {
    const newAction: ModerationAction = {
      ...action,
      id: `action-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };

    const updatedActions = [newAction, ...actions].slice(0, 100); // Garder les 100 dernières actions
    setActions(updatedActions);

    const key = `nether-moderation-${serverName}`;
    localStorage.setItem(key, JSON.stringify(updatedActions));
  };

  const handleBan = async (username: string, reason: string) => {
    try {
      await invoke('ban_player', {
        serverPath,
        username,
        reason,
      });

      saveAction({
        type: 'ban',
        player: username,
        reason,
        moderator: 'Admin',
      });

      // Attendre plus longtemps pour que le serveur mette à jour le fichier JSON
      // Le serveur Minecraft peut prendre un peu de temps pour écrire dans banned-players.json
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      await loadPlayers();
      // Notifier la mise à jour des listes avec un délai supplémentaire
      if (onListUpdate) {
        // Attendre encore un peu pour s'assurer que le fichier est bien mis à jour
        setTimeout(async () => {
          await onListUpdate();
        }, 500);
      }
      setShowBanModal(false);
      setBanReason('');
      setSelectedPlayer('');
    } catch (error) {
      console.error('Erreur ban:', error);
      alert('Erreur lors du bannissement');
    }
  };

  const handleUnban = async (username: string) => {
    try {
      await invoke('unban_player', {
        serverPath,
        username,
      });

      saveAction({
        type: 'unban',
        player: username,
        moderator: 'Admin',
      });

      // Attendre pour que le serveur mette à jour le fichier JSON
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await loadPlayers();
      // Notifier la mise à jour des listes
      if (onListUpdate) {
        setTimeout(async () => {
          await onListUpdate();
        }, 500);
      }
    } catch (error) {
      console.error('Erreur unban:', error);
      alert('Erreur lors du débannissement');
    }
  };

  const handleKick = async (username: string, reason: string) => {
    try {
      await invoke('kick_player', {
        serverPath,
        username,
        reason,
      });

      saveAction({
        type: 'kick',
        player: username,
        reason,
        moderator: 'Admin',
      });
    } catch (error) {
      console.error('Erreur kick:', error);
      alert('Erreur lors de l\'expulsion');
    }
  };

  const handleOp = async (username: string, makeOp: boolean) => {
    try {
      await invoke('set_player_op', {
        serverPath,
        username,
        isOp: makeOp,
      });

      saveAction({
        type: makeOp ? 'op' : 'deop',
        player: username,
        moderator: 'Admin',
      });

      await loadPlayers();
      // Notifier la mise à jour des listes
      if (onListUpdate) {
        onListUpdate();
      }
    } catch (error) {
      console.error('Erreur op:', error);
      alert('Erreur lors de la modification du statut OP');
    }
  };

  const handleWhitelist = async (username: string, add: boolean) => {
    try {
      await invoke('set_player_whitelist', {
        serverPath,
        username,
        add,
      });

      saveAction({
        type: add ? 'whitelist' : 'unwhitelist',
        player: username,
        moderator: 'Admin',
      });

      // Attendre plus longtemps pour que le serveur mette à jour le fichier JSON
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await loadPlayers();
      // Notifier la mise à jour des listes avec un délai supplémentaire
      if (onListUpdate) {
        // Attendre encore un peu pour s'assurer que le fichier est bien mis à jour
        setTimeout(async () => {
          await onListUpdate();
        }, 500);
      }
    } catch (error) {
      console.error('Erreur whitelist:', error);
      alert('Erreur lors de la modification de la whitelist');
    }
  };

  const filteredPlayers = players.filter(p => {
    // Filtre de recherche
    const matchesSearch = p.username.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;

    // Filtre par statut
    switch (statusFilter) {
      case 'online':
        return p.isOnline || p.is_online;
      case 'banned':
        return p.isBanned || p.is_banned;
      case 'whitelisted':
        return p.isWhitelisted || p.is_whitelisted;
      case 'op':
        return p.isOp || p.is_op;
      case 'all':
      default:
        return true;
    }
  });

  // Récupérer l'historique d'un joueur spécifique
  const getPlayerHistory = (username: string): ModerationAction[] => {
    return actions.filter(action => action.player === username);
  };

  const getActionIcon = (type: ModerationAction['type']) => {
    switch (type) {
      case 'ban': return <Ban className="w-4 h-4 text-red-400" />;
      case 'unban': return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'kick': return <UserX className="w-4 h-4 text-orange-400" />;
      case 'op': return <Crown className="w-4 h-4 text-yellow-400" />;
      case 'deop': return <UserMinus className="w-4 h-4 text-gray-400" />;
      case 'whitelist': return <Lock className="w-4 h-4 text-blue-400" />;
      case 'unwhitelist': return <Unlock className="w-4 h-4 text-gray-400" />;
      default: return <Shield className="w-4 h-4" />;
    }
  };

  const getActionText = (action: ModerationAction) => {
    const typeText = {
      ban: 'a banni',
      unban: 'a débanni',
      kick: 'a expulsé',
      op: 'a promu OP',
      deop: 'a révoqué OP',
      whitelist: 'a ajouté à la whitelist',
      unwhitelist: 'a retiré de la whitelist',
    }[action.type];

    return `${action.moderator} ${typeText} ${action.player}`;
  };

  return (
    <div className="min-h-screen overflow-y-auto overflow-x-hidden scrollbar-hide p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold flex items-center gap-3">
              <Shield className="w-8 h-8 text-purple-500" />
              Panneau de Modération
            </h2>
            <p className="text-gray-400 mt-1">Gérez les joueurs et la sécurité du serveur</p>
          </div>

          <button
            onClick={loadPlayers}
            disabled={loading}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 rounded-lg transition-colors flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-green-600/20 to-green-800/20 border border-green-500/30 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">En ligne</p>
                <p className="text-3xl font-bold text-green-400">
                  {players.filter(p => p.isOnline || p.is_online).length}
                </p>
              </div>
              <Users className="w-10 h-10 text-green-400 opacity-50" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-600/20 to-yellow-800/20 border border-yellow-500/30 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Opérateurs</p>
                <p className="text-3xl font-bold text-yellow-400">
                  {players.filter(p => p.isOp || p.is_op).length}
                </p>
              </div>
              <Crown className="w-10 h-10 text-yellow-400 opacity-50" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-600/20 to-red-800/20 border border-red-500/30 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Bannis</p>
                <p className="text-3xl font-bold text-red-400">
                  {players.filter(p => p.isBanned || p.is_banned).length}
                </p>
              </div>
              <Ban className="w-10 h-10 text-red-400 opacity-50" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 border border-blue-500/30 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Whitelist</p>
                <p className="text-3xl font-bold text-blue-400">
                  {players.filter(p => p.isWhitelisted || p.is_whitelisted).length}
                </p>
              </div>
              <Lock className="w-10 h-10 text-blue-400 opacity-50" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b-2 border-purple-500/30 shadow-[0_2px_10px_rgba(168,85,247,0.1)] mb-6">
          <div className="flex space-x-4">
            {[
              { id: 'players', label: 'Tous les Joueurs', icon: Users },
              { id: 'history', label: 'Historique', icon: Clock },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-6 py-3 font-medium transition-all flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'text-purple-400 border-b-2 border-purple-500'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Recherche et Filtres */}
        {activeTab !== 'history' && (
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher un joueur..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-dark-200 border border-dark-400 rounded-lg focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Filtres par statut */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-gray-400">Filtrer par statut:</span>
              {[
                { id: 'all' as const, label: 'Tous', icon: Users, color: 'gray' },
                { id: 'online' as const, label: 'En ligne', icon: UserCheck, color: 'green' },
                { id: 'banned' as const, label: 'Bannis', icon: Ban, color: 'red' },
                { id: 'whitelisted' as const, label: 'Whitelist', icon: Lock, color: 'blue' },
                { id: 'op' as const, label: 'OP', icon: Crown, color: 'yellow' },
              ].map(filter => {
                const Icon = filter.icon;
                return (
                  <button
                    key={filter.id}
                    onClick={() => setStatusFilter(filter.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors text-sm ${
                      statusFilter === filter.id
                        ? filter.id === 'all' ? 'bg-gray-600 text-white'
                          : filter.id === 'online' ? 'bg-green-600 text-white'
                          : filter.id === 'banned' ? 'bg-red-600 text-white'
                          : filter.id === 'whitelisted' ? 'bg-blue-600 text-white'
                          : 'bg-yellow-600 text-white'
                        : 'bg-dark-800 text-gray-400 hover:bg-dark-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{filter.label}</span>
                    <span className={`px-1.5 py-0.5 rounded text-xs ${
                      statusFilter === filter.id ? 'bg-white/20' : 'bg-dark-900'
                    }`}>
                      {filter.id === 'all' 
                        ? players.length 
                        : players.filter(p => {
                            switch (filter.id) {
                              case 'online': return p.isOnline || p.is_online;
                              case 'banned': return p.isBanned || p.is_banned;
                              case 'whitelisted': return p.isWhitelisted || p.is_whitelisted;
                              case 'op': return p.isOp || p.is_op;
                              default: return false;
                            }
                          }).length
                      }
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Contenu */}
        {activeTab === 'players' && (
          <div className="space-y-2">
            {filteredPlayers.length === 0 ? (
              <div className="text-center py-20">
                <Users className="w-20 h-20 text-gray-600 mx-auto mb-4" />
                <p className="text-xl text-gray-400">Aucun joueur trouvé</p>
                <p className="text-sm text-gray-500 mt-2">
                  {searchTerm ? 'Essayez de modifier votre recherche ou vos filtres' : 'Aucun joueur ne correspond aux filtres sélectionnés'}
                </p>
              </div>
            ) : (
              filteredPlayers.map(player => (
                <PlayerCard
                  key={player.uuid}
                  player={player}
                  onBan={() => {
                    setSelectedPlayer(player.username);
                    setShowBanModal(true);
                  }}
                  onUnban={() => handleUnban(player.username)}
                  onKick={() => {
                    const reason = prompt('Raison du kick:');
                    if (reason !== null) handleKick(player.username, reason);
                  }}
                  onOp={() => handleOp(player.username, !(player.isOp || player.is_op))}
                  onWhitelist={() => handleWhitelist(player.username, !(player.isWhitelisted || player.is_whitelisted))}
                  onViewDetails={() => {
                    setSelectedPlayerDetails(player);
                    setShowPlayerDetails(true);
                  }}
                />
              ))
            )}
          </div>
        )}


        {activeTab === 'history' && (
          <div className="space-y-2">
            {actions.length > 0 ? (
              actions.map(action => (
                <motion.div
                  key={action.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-dark-200 border border-dark-400 rounded-lg p-4 flex items-center gap-4"
                >
                  {getActionIcon(action.type)}
                  <div className="flex-1">
                    <p className="text-white">{getActionText(action)}</p>
                    {action.reason && (
                      <p className="text-sm text-gray-400">Raison: {action.reason}</p>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(action.timestamp).toLocaleString()}
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-20">
                <Clock className="w-20 h-20 text-gray-600 mx-auto mb-4" />
                <p className="text-xl text-gray-400">Aucune action enregistrée</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal Vue détaillée du joueur */}
      {showPlayerDetails && selectedPlayerDetails && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowPlayerDetails(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-dark-100 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-dark-400 rounded-lg overflow-hidden flex items-center justify-center">
                    <MinecraftSkin username={selectedPlayerDetails.username} size={64} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">{selectedPlayerDetails.username}</h3>
                    <p className="text-sm text-gray-400 font-mono">{selectedPlayerDetails.uuid}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPlayerDetails(false)}
                  className="p-2 hover:bg-dark-300 rounded-lg transition-colors"
                >
                  <UserX className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Statuts */}
              <div className="flex flex-wrap gap-2 mb-6">
                {(selectedPlayerDetails.isOnline || selectedPlayerDetails.is_online) && (
                  <span className="px-3 py-1 bg-green-500/20 text-green-400 text-sm rounded-full flex items-center gap-1">
                    <UserCheck className="w-4 h-4" /> En ligne
                  </span>
                )}
                {(selectedPlayerDetails.isOp || selectedPlayerDetails.is_op) && (
                  <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 text-sm rounded-full flex items-center gap-1">
                    <Crown className="w-4 h-4" /> OP
                  </span>
                )}
                {(selectedPlayerDetails.isBanned || selectedPlayerDetails.is_banned) && (
                  <span className="px-3 py-1 bg-red-500/20 text-red-400 text-sm rounded-full flex items-center gap-1">
                    <Ban className="w-4 h-4" /> Banni
                  </span>
                )}
                {(selectedPlayerDetails.isWhitelisted || selectedPlayerDetails.is_whitelisted) && (
                  <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-sm rounded-full flex items-center gap-1">
                    <Lock className="w-4 h-4" /> Whitelist
                  </span>
                )}
              </div>

              {/* Actions rapides */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                {!(selectedPlayerDetails.isBanned || selectedPlayerDetails.is_banned) ? (
                  <button
                    onClick={() => {
                      setShowPlayerDetails(false);
                      setSelectedPlayer(selectedPlayerDetails.username);
                      setShowBanModal(true);
                    }}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Ban className="w-4 h-4" />
                    Bannir
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      handleUnban(selectedPlayerDetails.username);
                      setShowPlayerDetails(false);
                    }}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Débannir
                  </button>
                )}

                {(selectedPlayerDetails.isOnline || selectedPlayerDetails.is_online) && !(selectedPlayerDetails.isBanned || selectedPlayerDetails.is_banned) && (
                  <button
                    onClick={() => {
                      const reason = prompt('Raison du kick:');
                      if (reason !== null) {
                        handleKick(selectedPlayerDetails.username, reason);
                        setShowPlayerDetails(false);
                      }
                    }}
                    className="px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <UserX className="w-4 h-4" />
                    Expulser
                  </button>
                )}

                <button
                  onClick={() => {
                    handleOp(selectedPlayerDetails.username, !(selectedPlayerDetails.isOp || selectedPlayerDetails.is_op));
                    setShowPlayerDetails(false);
                  }}
                  className={`px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                    (selectedPlayerDetails.isOp || selectedPlayerDetails.is_op)
                      ? 'bg-gray-600 hover:bg-gray-700'
                      : 'bg-yellow-600 hover:bg-yellow-700'
                  }`}
                >
                  <Crown className="w-4 h-4" />
                  {(selectedPlayerDetails.isOp || selectedPlayerDetails.is_op) ? 'Révoquer OP' : 'Promouvoir OP'}
                </button>

                {(selectedPlayerDetails.isWhitelisted || selectedPlayerDetails.is_whitelisted) ? (
                  <button
                    onClick={() => {
                      handleWhitelist(selectedPlayerDetails.username, false);
                      setShowPlayerDetails(false);
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Unlock className="w-4 h-4" />
                    Retirer Whitelist
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      handleWhitelist(selectedPlayerDetails.username, true);
                      setShowPlayerDetails(false);
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Lock className="w-4 h-4" />
                    Ajouter Whitelist
                  </button>
                )}
              </div>

              {/* Historique des actions */}
              <div className="border-t border-dark-400 pt-6">
                <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Historique des actions
                </h4>
                {getPlayerHistory(selectedPlayerDetails.username).length > 0 ? (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {getPlayerHistory(selectedPlayerDetails.username).map(action => (
                      <motion.div
                        key={action.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-dark-200 border border-dark-400 rounded-lg p-3 flex items-center gap-3"
                      >
                        {getActionIcon(action.type)}
                        <div className="flex-1">
                          <p className="text-white text-sm">{getActionText(action)}</p>
                          {action.reason && (
                            <p className="text-xs text-gray-400 mt-1">Raison: {action.reason}</p>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(action.timestamp).toLocaleString()}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm text-center py-8">Aucune action enregistrée pour ce joueur</p>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal Ban */}
      {showBanModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowBanModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-dark-100 rounded-xl w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Ban className="w-6 h-6 text-red-400" />
              Bannir {selectedPlayer}
            </h3>

            <div className="mb-4">
              <label className="block text-sm font-bold mb-2">Raison</label>
              <textarea
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="Comportement inapproprié..."
                rows={4}
                className="w-full px-4 py-2 bg-dark-200 border border-dark-400 rounded-lg focus:border-red-500 focus:outline-none resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowBanModal(false)}
                className="flex-1 px-4 py-2 bg-dark-300 hover:bg-dark-400 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => handleBan(selectedPlayer, banReason)}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors font-bold"
              >
                Bannir
              </button>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
};

// Composant pour afficher le skin Minecraft
const MinecraftSkin: React.FC<{ username: string; size?: number }> = ({ username, size = 64 }) => {
  const skinUrl = `https://mc-heads.net/avatar/${encodeURIComponent(username)}/${size}`;
  
  return (
    <img
      src={skinUrl}
      alt={username}
      className="rounded-lg"
      style={{ width: size, height: size, imageRendering: 'pixelated' }}
      onError={(e) => {
        // En cas d'erreur, afficher une initiale
        const target = e.target as HTMLImageElement;
        target.style.display = 'none';
        if (target.parentElement) {
          const fallback = document.createElement('div');
          fallback.className = `w-${size/4} h-${size/4} bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center`;
          fallback.innerHTML = `<span class="text-white font-bold text-xl">${username.charAt(0).toUpperCase()}</span>`;
          target.parentElement.appendChild(fallback);
        }
      }}
    />
  );
};

// Composant carte joueur
const PlayerCard: React.FC<{
  player: Player;
  onBan: () => void;
  onUnban: () => void;
  onKick: () => void;
  onOp: () => void;
  onWhitelist: () => void;
  onViewDetails: () => void;
}> = ({ player, onBan, onUnban, onKick, onOp, onWhitelist, onViewDetails }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-dark-200 to-dark-300 border border-dark-400 rounded-lg p-4 hover:border-purple-500 transition-all"
    >
      <div className="flex items-center gap-4">
        {/* Avatar avec skin Minecraft */}
        <div 
          className="w-16 h-16 bg-dark-400 rounded-lg overflow-hidden flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
          onClick={onViewDetails}
          title="Voir les détails"
        >
          <MinecraftSkin username={player.username} size={64} />
        </div>

        {/* Info */}
        <div 
          className="flex-1 cursor-pointer"
          onClick={onViewDetails}
          title="Voir les détails"
        >
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-lg text-white">{player.username}</h3>
            {(player.isOnline || player.is_online) && (
              <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">
                En ligne
              </span>
            )}
            {(player.isOp || player.is_op) && (
              <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded-full flex items-center gap-1">
                <Crown className="w-3 h-3" /> OP
              </span>
            )}
            </div>
            {/* Statuts à droite */}
            <div className="flex items-center gap-2">
              {(player.isBanned || player.is_banned) && (
                <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full">
                  Banni
                </span>
              )}
              {(player.isWhitelisted || player.is_whitelisted) && (
                <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-full flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Whitelist
                </span>
              )}
            </div>
          </div>
          <p className="text-sm text-gray-400 font-mono">{player.uuid}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {!(player.isBanned || player.is_banned) ? (
            <button
              onClick={onBan}
              className="p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              title="Bannir"
            >
              <Ban className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={onUnban}
              className="p-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
              title="Débannir"
            >
              <CheckCircle className="w-4 h-4" />
            </button>
          )}

          {(player.isOnline || player.is_online) && !(player.isBanned || player.is_banned) && (
            <button
              onClick={onKick}
              className="p-2 bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors"
              title="Expulser"
            >
              <UserX className="w-4 h-4" />
            </button>
          )}

          {!(player.isBanned || player.is_banned) && (
            <button
              onClick={onOp}
              className={`p-2 ${
                (player.isOp || player.is_op)
                  ? 'bg-gray-600 hover:bg-gray-700'
                  : 'bg-yellow-600 hover:bg-yellow-700'
              } rounded-lg transition-colors`}
              title={(player.isOp || player.is_op) ? 'Révoquer OP' : 'Promouvoir OP'}
            >
              <Crown className="w-4 h-4" />
            </button>
          )}

          {/* Bouton contextuel : Retirer de la whitelist si whitelisté */}
          {(player.isWhitelisted || player.is_whitelisted) && (
            <button
              onClick={onWhitelist}
              className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              title="Retirer de la whitelist"
            >
              <Unlock className="w-4 h-4" />
            </button>
          )}

          {/* Bouton pour ajouter à la whitelist si pas whitelisté et pas banni */}
          {!(player.isWhitelisted || player.is_whitelisted) && !(player.isBanned || player.is_banned) && (
            <button
              onClick={onWhitelist}
              className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              title="Ajouter à la whitelist"
            >
              <Lock className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ModerationPanel;

