// Service pour récupérer les versions Minecraft depuis l'API Mojang
import API_CONFIG from '../config/api';
import { MinecraftVersion } from '../types';

export class MinecraftAPI {
  /**
   * Récupère toutes les versions Minecraft disponibles
   */
  static async getVersions(): Promise<MinecraftVersion[]> {
    try {
      const response = await fetch(API_CONFIG.mojang.versionManifest);
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Retourner les versions
      return data.versions.map((version: any) => ({
        id: version.id,
        type: version.type,
        url: version.url,
        time: version.time,
        releaseTime: version.releaseTime
      }));
    } catch (error) {
      console.error('Erreur lors de la récupération des versions Minecraft:', error);
      throw error;
    }
  }

  /**
   * Récupère les détails d'une version spécifique
   */
  static async getVersionDetails(versionUrl: string): Promise<any> {
    try {
      const response = await fetch(versionUrl);
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erreur lors de la récupération des détails de version:', error);
      throw error;
    }
  }

  /**
   * Récupère l'URL de téléchargement du server.jar
   */
  static async getServerDownloadUrl(versionUrl: string): Promise<string> {
    try {
      const details = await this.getVersionDetails(versionUrl);
      
      if (!details.downloads?.server?.url) {
        throw new Error('URL du serveur non disponible pour cette version');
      }
      
      return details.downloads.server.url;
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'URL du serveur:', error);
      throw error;
    }
  }

  /**
   * Filtre les versions par type (release, snapshot, etc.)
   */
  static filterVersionsByType(versions: MinecraftVersion[], type: string): MinecraftVersion[] {
    return versions.filter(v => v.type === type);
  }

  /**
   * Récupère uniquement les versions release
   */
  static async getReleaseVersions(): Promise<MinecraftVersion[]> {
    const versions = await this.getVersions();
    return this.filterVersionsByType(versions, 'release');
  }

  /**
   * Récupère uniquement les snapshots
   */
  static async getSnapshotVersions(): Promise<MinecraftVersion[]> {
    const versions = await this.getVersions();
    return this.filterVersionsByType(versions, 'snapshot');
  }
}

export default MinecraftAPI;
