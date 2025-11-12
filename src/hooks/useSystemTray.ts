// Hook pour gérer le System Tray Windows
import { useEffect } from 'react';

export const useSystemTray = () => {
  useEffect(() => {
    // Configuration du System Tray
    const setupTray = async () => {
      try {
        // @ts-ignore - Tauri API
        if (window.__TAURI__) {
          const { appWindow } = await import('@tauri-apps/api/window');
          
          // Minimiser dans le tray au lieu de fermer
          const unlisten = await appWindow.onCloseRequested((event) => {
            event.preventDefault();
            appWindow.hide();
          });

          return () => {
            unlisten();
          };
        }
      } catch (error) {
        console.error('Erreur lors de la configuration du System Tray:', error);
      }
    };

    setupTray();
  }, []);
};

export default useSystemTray;
