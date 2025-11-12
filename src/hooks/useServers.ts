// Hook pour gérer les serveurs
import { useState, useEffect } from 'react';
import { Server } from '../types';

export const useServers = () => {
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadServers();
  }, []);

  const loadServers = () => {
    try {
      const savedServers = localStorage.getItem('nether-client-servers');
      if (savedServers) {
        setServers(JSON.parse(savedServers));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des serveurs:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveServers = (newServers: Server[]) => {
    try {
      localStorage.setItem('nether-client-servers', JSON.stringify(newServers));
      setServers(newServers);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des serveurs:', error);
    }
  };

  const addServer = (server: Server) => {
    const newServers = [...servers, server];
    saveServers(newServers);
  };

  const updateServer = (serverId: string, updates: Partial<Server>) => {
    const newServers = servers.map(server =>
      server.id === serverId ? { ...server, ...updates } : server
    );
    saveServers(newServers);
  };

  const deleteServer = (serverId: string) => {
    const newServers = servers.filter(server => server.id !== serverId);
    saveServers(newServers);
  };

  const getServer = (serverId: string) => {
    return servers.find(server => server.id === serverId);
  };

  return {
    servers,
    loading,
    addServer,
    updateServer,
    deleteServer,
    getServer,
    reloadServers: loadServers
  };
};

export default useServers;
