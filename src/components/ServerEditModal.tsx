import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Save, Settings } from 'lucide-react';
import { Server as ServerType } from '../types';

interface ServerEditModalProps {
  server: ServerType;
  onClose: () => void;
  onSave: (updatedServer: ServerType) => void;
}

const ServerEditModal: React.FC<ServerEditModalProps> = ({ server, onClose, onSave }) => {
  const [config, setConfig] = useState({
    name: server.name,
    port: server.port,
    ram: server.ram,
    motd: server.motd,
    maxPlayers: server.maxPlayers,
    difficulty: server.difficulty,
    gamemode: server.gamemode,
    whitelist: server.properties?.whitelist ?? false,
    pvp: server.properties?.pvp ?? true,
    allowFlight: server.properties?.allowFlight ?? false,
    enableCommandBlock: server.properties?.enableCommandBlock ?? false,
    spawnMonsters: server.properties?.spawnMonsters ?? true,
    allowNether: server.properties?.allowNether ?? true,
    spawnProtection: server.properties?.spawnProtection ?? 16,
    forceGamemode: server.properties?.forceGamemode ?? false,
    onlineMode: server.properties?.onlineMode ?? true,
    resourcePack: server.properties?.resourcePack ?? '',
  });

  const handleSave = async () => {
    try {
      const { invoke } = await import('@tauri-apps/api/tauri');
      
      // Préparer les propriétés pour server.properties
      const properties = {
        'server-port': config.port,
        'max-players': config.maxPlayers,
        'motd': config.motd,
        'difficulty': config.difficulty,
        'gamemode': config.gamemode,
        'online-mode': config.onlineMode,
        'pvp': config.pvp,
        'spawn-protection': config.spawnProtection,
        'white-list': config.whitelist,
        'allow-flight': config.allowFlight,
        'enable-command-block': config.enableCommandBlock,
        'spawn-monsters': config.spawnMonsters,
        'allow-nether': config.allowNether,
        'force-gamemode': config.forceGamemode,
        'resource-pack': config.resourcePack,
      };

      // Mettre à jour le fichier server.properties
      await invoke('update_server_properties', {
        serverName: config.name,
        properties: properties
      });

      const updatedServer: ServerType = {
        ...server,
        name: config.name,
        port: config.port,
        ram: config.ram,
        motd: config.motd,
        maxPlayers: config.maxPlayers,
        difficulty: config.difficulty,
        gamemode: config.gamemode,
        properties: {
          whitelist: config.whitelist,
          pvp: config.pvp,
          allowFlight: config.allowFlight,
          enableCommandBlock: config.enableCommandBlock,
          spawnMonsters: config.spawnMonsters,
          allowNether: config.allowNether,
          spawnProtection: config.spawnProtection,
          forceGamemode: config.forceGamemode,
          onlineMode: config.onlineMode,
          resourcePack: config.resourcePack,
        },
      };

      onSave(updatedServer);
    } catch (error) {
      console.error('Erreur sauvegarde propriétés:', error);
      alert(`❌ Erreur lors de la sauvegarde: ${error}`);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-gradient-to-br from-dark-100 to-dark-200 rounded-xl border border-dark-400 shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b-2 border-purple-500/30 shadow-[0_2px_10px_rgba(168,85,247,0.1)] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Settings className="w-6 h-6 text-primary-400" />
            <div>
              <h2 className="text-2xl font-bold text-white">Modifier le serveur</h2>
              <p className="text-sm text-dark-400">Configuration avancée</p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Informations de base */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-4">Informations de base</h3>
              
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Nom du serveur
                </label>
                <input
                  type="text"
                  value={config.name}
                  onChange={(e) => setConfig({ ...config, name: e.target.value })}
                  className="input w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  MOTD (Message du jour)
                </label>
                <input
                  type="text"
                  value={config.motd}
                  onChange={(e) => setConfig({ ...config, motd: e.target.value })}
                  className="input w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2 flex items-center gap-2">
                    <span className="text-lg">👥</span>
                    Slots (max-players)
                  </label>
                  <input
                    type="number"
                    value={config.maxPlayers}
                    onChange={(e) => setConfig({ ...config, maxPlayers: parseInt(e.target.value) })}
                    className="input w-full"
                    min="1"
                    max="1000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Port
                  </label>
                  <input
                    type="number"
                    value={config.port}
                    onChange={(e) => setConfig({ ...config, port: parseInt(e.target.value) })}
                    className="input w-full"
                    min="1"
                    max="65535"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  RAM (MB)
                </label>
                <input
                  type="number"
                  value={config.ram}
                  onChange={(e) => setConfig({ ...config, ram: parseInt(e.target.value) })}
                  className="input w-full"
                  min="512"
                  step="512"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Mode de jeu (Gamemode)
                </label>
                <select
                  value={config.gamemode}
                  onChange={(e) => setConfig({ ...config, gamemode: e.target.value as any })}
                  className="input w-full"
                >
                  <option value="survival">Survival</option>
                  <option value="creative">Creative</option>
                  <option value="adventure">Adventure</option>
                  <option value="spectator">Spectator</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Difficulté (Difficulty)
                </label>
                <select
                  value={config.difficulty}
                  onChange={(e) => setConfig({ ...config, difficulty: e.target.value as any })}
                  className="input w-full"
                >
                  <option value="peaceful">Peaceful</option>
                  <option value="easy">Easy</option>
                  <option value="normal">Normal</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>

            {/* Options de gameplay */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-4">Options de gameplay</h3>

              {/* Whitelist */}
              <div className="flex items-center justify-between p-4 bg-dark-800 rounded-lg border border-dark-700">
                <div>
                  <h4 className="font-medium text-white">Whitelist</h4>
                  <p className="text-sm text-dark-400">Liste blanche des joueurs</p>
                </div>
                <button
                  onClick={() => setConfig({ ...config, whitelist: !config.whitelist })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    config.whitelist ? 'bg-primary-500' : 'bg-dark-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      config.whitelist ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* PVP */}
              <div className="flex items-center justify-between p-4 bg-dark-800 rounded-lg border border-dark-700">
                <div>
                  <h4 className="font-medium text-white">PVP</h4>
                  <p className="text-sm text-dark-400">Combats entre joueurs</p>
                </div>
                <button
                  onClick={() => setConfig({ ...config, pvp: !config.pvp })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    config.pvp ? 'bg-primary-500' : 'bg-dark-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      config.pvp ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Allow Flight */}
              <div className="flex items-center justify-between p-4 bg-dark-800 rounded-lg border border-dark-700">
                <div>
                  <h4 className="font-medium text-white">Fly</h4>
                  <p className="text-sm text-dark-400">Autoriser le vol</p>
                </div>
                <button
                  onClick={() => setConfig({ ...config, allowFlight: !config.allowFlight })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    config.allowFlight ? 'bg-primary-500' : 'bg-dark-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      config.allowFlight ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Command Blocks */}
              <div className="flex items-center justify-between p-4 bg-dark-800 rounded-lg border border-dark-700">
                <div>
                  <h4 className="font-medium text-white">Commandblocks</h4>
                  <p className="text-sm text-dark-400">Blocs de commande</p>
                </div>
                <button
                  onClick={() => setConfig({ ...config, enableCommandBlock: !config.enableCommandBlock })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    config.enableCommandBlock ? 'bg-primary-500' : 'bg-dark-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      config.enableCommandBlock ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Monsters */}
              <div className="flex items-center justify-between p-4 bg-dark-800 rounded-lg border border-dark-700">
                <div>
                  <h4 className="font-medium text-white">Monster</h4>
                  <p className="text-sm text-dark-400">Apparition des monstres</p>
                </div>
                <button
                  onClick={() => setConfig({ ...config, spawnMonsters: !config.spawnMonsters })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    config.spawnMonsters ? 'bg-primary-500' : 'bg-dark-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      config.spawnMonsters ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Nether */}
              <div className="flex items-center justify-between p-4 bg-dark-800 rounded-lg border border-dark-700">
                <div>
                  <h4 className="font-medium text-white">Nether</h4>
                  <p className="text-sm text-dark-400">Accès au Nether</p>
                </div>
                <button
                  onClick={() => setConfig({ ...config, allowNether: !config.allowNether })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    config.allowNether ? 'bg-primary-500' : 'bg-dark-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      config.allowNether ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Force Gamemode */}
              <div className="flex items-center justify-between p-4 bg-dark-800 rounded-lg border border-dark-700">
                <div>
                  <h4 className="font-medium text-white">Force Gamemode</h4>
                  <p className="text-sm text-dark-400">Forcer le mode de jeu</p>
                </div>
                <button
                  onClick={() => setConfig({ ...config, forceGamemode: !config.forceGamemode })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    config.forceGamemode ? 'bg-primary-500' : 'bg-dark-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      config.forceGamemode ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Cracked (online-mode) */}
              <div className="flex items-center justify-between p-4 bg-dark-800 rounded-lg border border-dark-700">
                <div>
                  <h4 className="font-medium text-white">Cracked</h4>
                  <p className="text-sm text-dark-400">Mode hors ligne (non premium)</p>
                </div>
                <button
                  onClick={() => setConfig({ ...config, onlineMode: !config.onlineMode })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    !config.onlineMode ? 'bg-primary-500' : 'bg-dark-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      !config.onlineMode ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Spawn Protection */}
              <div className="p-4 bg-dark-800 rounded-lg border border-dark-700">
                <label className="block mb-2">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-medium text-white">Spawn Protection</h4>
                      <p className="text-sm text-white">Rayon de protection du spawn (blocs)</p>
                    </div>
                    <span className="text-primary-400 font-bold">{config.spawnProtection}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="64"
                    value={config.spawnProtection}
                    onChange={(e) => setConfig({ ...config, spawnProtection: parseInt(e.target.value) })}
                    className="w-full h-2 bg-dark-600 rounded-lg appearance-none cursor-pointer"
                  />
                </label>
              </div>

              {/* Resource Pack */}
              <div className="p-4 bg-dark-800 rounded-lg border border-dark-700">
                <label className="block">
                  <h4 className="font-medium text-white mb-2">Resource pack</h4>
                  <p className="text-sm text-white mb-2">URL du pack de ressources</p>
                  <input
                    type="url"
                    value={config.resourcePack}
                    onChange={(e) => setConfig({ ...config, resourcePack: e.target.value })}
                    placeholder="https://example.com/resource-pack.zip"
                    className="input w-full"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t-2 border-purple-500/40 shadow-[0_-2px_10px_rgba(168,85,247,0.15)] flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-dark-700 hover:bg-dark-600 text-white rounded-lg transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            className="btn-primary flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>Enregistrer</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default ServerEditModal;

