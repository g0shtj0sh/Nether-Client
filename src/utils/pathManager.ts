// Utilitaires pour gérer les chemins de fichiers
export class PathManager {
  private static appDataPath: string | null = null;

  static async getAppDataPath(): Promise<string> {
    if (this.appDataPath) {
      return this.appDataPath;
    }

    try {
      // @ts-ignore - Tauri API
      if (window.__TAURI__) {
        const { appDataDir } = await import('@tauri-apps/api/path');
        const baseDir = await appDataDir();
        this.appDataPath = `${baseDir}NetherClient`;
        return this.appDataPath;
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du chemin AppData:', error);
    }

    // Fallback pour le développement
    this.appDataPath = 'C:\\Users\\Default\\AppData\\Roaming\\NetherClient';
    return this.appDataPath;
  }

  static async getServersPath(): Promise<string> {
    const appData = await this.getAppDataPath();
    return `${appData}\\Serveurs`;
  }

  static async getCachePath(): Promise<string> {
    const appData = await this.getAppDataPath();
    return `${appData}\\cache`;
  }

  static async getLogsPath(): Promise<string> {
    const appData = await this.getAppDataPath();
    return `${appData}\\logs`;
  }

  static async getConfigPath(): Promise<string> {
    const appData = await this.getAppDataPath();
    return `${appData}\\config.json`;
  }

  static async getServerPath(serverName: string): Promise<string> {
    const serversPath = await this.getServersPath();
    return `${serversPath}\\${serverName}`;
  }

  static async ensureDirectories(): Promise<void> {
    try {
      // @ts-ignore - Tauri API
      if (window.__TAURI__) {
        const { createDir } = await import('@tauri-apps/api/fs');
        
        const paths = [
          await this.getAppDataPath(),
          await this.getServersPath(),
          await this.getCachePath(),
          await this.getLogsPath()
        ];

        for (const path of paths) {
          try {
            await createDir(path, { recursive: true });
          } catch (error) {
            // Le dossier existe déjà, c'est ok
          }
        }
      }
    } catch (error) {
      console.error('Erreur lors de la création des dossiers:', error);
    }
  }
}

export default PathManager;
