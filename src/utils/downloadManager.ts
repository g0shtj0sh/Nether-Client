// Utilitaires pour télécharger des fichiers
export class DownloadManager {
  static async downloadFile(url: string, destination: string, onProgress?: (progress: number) => void): Promise<void> {
    try {
      // @ts-ignore - Tauri API
      if (window.__TAURI__) {
        const { invoke } = await import('@tauri-apps/api/tauri');
        await invoke('download_file', { url, destination });
      } else {
        // Mode développement - simuler le téléchargement
        console.log(`Téléchargement simulé: ${url} -> ${destination}`);
        
        // Simuler la progression
        if (onProgress) {
          for (let i = 0; i <= 100; i += 10) {
            await new Promise(resolve => setTimeout(resolve, 100));
            onProgress(i);
          }
        }
      }
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      throw error;
    }
  }

  static async downloadMinecraftVersion(version: string): Promise<string> {
    try {
      // @ts-ignore - Tauri API
      if (window.__TAURI__) {
        const { invoke } = await import('@tauri-apps/api/tauri');
        return await invoke('download_minecraft_version', { version });
      }
      
      // Mode développement
      return `minecraft_server_${version}.jar`;
    } catch (error) {
      console.error('Erreur lors du téléchargement de Minecraft:', error);
      throw error;
    }
  }

  static async getMinecraftVersions(): Promise<string[]> {
    try {
      // @ts-ignore - Tauri API
      if (window.__TAURI__) {
        const { invoke } = await import('@tauri-apps/api/tauri');
        return await invoke('get_minecraft_versions');
      }
      
      // Mode développement - versions simulées
      return ['1.20.1', '1.20', '1.19.4', '1.19.3', '1.19.2'];
    } catch (error) {
      console.error('Erreur lors de la récupération des versions:', error);
      throw error;
    }
  }
}

export default DownloadManager;
