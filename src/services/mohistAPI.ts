// Service pour récupérer les versions MohistMC depuis le dépôt GitHub uniquement
import API_CONFIG from '../config/api';
import { MohistVersion } from '../types';

export class MohistAPI {
  /**
   * Récupère les versions MohistMC disponibles depuis les releases GitHub
   * MohistMC est un serveur hybride qui supporte Forge + Bukkit/Spigot
   */
  static async getVersions(): Promise<MohistVersion[]> {
    try {
      console.log('🔍 Récupération des versions MohistMC depuis les releases GitHub...');
      
       // Versions MohistMC disponibles avec URLs directes
       const versions: MohistVersion[] = [
         {
           version: "1.12.2",
           installer: "https://github.com/g0shtj0sh/nether-client-resources/releases/download/MohistMC/mohist-1.12.2-5af9344.jar",
           universal: "https://github.com/g0shtj0sh/nether-client-resources/releases/download/MohistMC/mohist-1.12.2-5af9344.jar",
           changelog: "Minecraft 1.12.2 - Serveur hybride Forge + Bukkit/Spigot"
         },
         {
           version: "1.16.5",
           installer: "https://github.com/g0shtj0sh/nether-client-resources/releases/download/MohistMC/mohist-1.16.5-8c7caaf.jar",
           universal: "https://github.com/g0shtj0sh/nether-client-resources/releases/download/MohistMC/mohist-1.16.5-8c7caaf.jar",
           changelog: "Minecraft 1.16.5 - Serveur hybride Forge + Bukkit/Spigot"
         },
         {
           version: "1.18.2",
           installer: "https://github.com/g0shtj0sh/nether-client-resources/releases/download/MohistMC/mohist-1.18.2-aecc5e9.jar",
           universal: "https://github.com/g0shtj0sh/nether-client-resources/releases/download/MohistMC/mohist-1.18.2-aecc5e9.jar",
           changelog: "Minecraft 1.18.2 - Serveur hybride Forge + Bukkit/Spigot"
         },
         {
           version: "1.19.4",
           installer: "https://github.com/g0shtj0sh/nether-client-resources/releases/download/MohistMC/mohist-1.19.4-c1f9ddb.jar",
           universal: "https://github.com/g0shtj0sh/nether-client-resources/releases/download/MohistMC/mohist-1.19.4-c1f9ddb.jar",
           changelog: "Minecraft 1.19.4 - Serveur hybride Forge + Bukkit/Spigot"
         },
         {
           version: "1.7.10",
           installer: "https://github.com/g0shtj0sh/nether-client-resources/releases/download/MohistMC/mohist-1.7.10-de68ad7.jar",
           universal: "https://github.com/g0shtj0sh/nether-client-resources/releases/download/MohistMC/mohist-1.7.10-de68ad7.jar",
           changelog: "Minecraft 1.7.10 - Serveur hybride Forge + Bukkit/Spigot"
         }
       ];
      
      console.log(`✅ ${versions.length} versions MohistMC chargées depuis les releases GitHub`);
      console.log('📋 Versions disponibles:', versions.map(v => v.version));
      
      return versions;
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des versions MohistMC:', error);
      return [];
    }
  }

  /**
   * Extrait la version Minecraft correspondante d'une version MohistMC
   */
  static extractMinecraftVersion(mohistVersion: string): string {
    // Format MohistMC: "1.20.1-403" → "1.20.1"
    if (mohistVersion.includes('-') && mohistVersion.startsWith('1.')) {
      return mohistVersion.split('-')[0];
    }
    
    // Format direct: "1.20.1" → "1.20.1"
    if (mohistVersion.match(/^\d+\.\d+\.\d+/)) {
      return mohistVersion;
    }
    
    return mohistVersion;
  }

  /**
   * Compare deux versions numériquement (ex: "1.21.6" vs "1.20.2")
   */
  static compareVersions(a: string, b: string): number {
    const aParts = a.split('.').map(Number);
    const bParts = b.split('.').map(Number);
    
    const maxLength = Math.max(aParts.length, bParts.length);
    
    for (let i = 0; i < maxLength; i++) {
      const aPart = aParts[i] || 0;
      const bPart = bParts[i] || 0;
      
      if (aPart > bPart) return 1;
      if (aPart < bPart) return -1;
    }
    
    return 0;
  }

  /**
   * Récupère l'URL de téléchargement du serveur MohistMC depuis les releases GitHub
   */
  static getServerUrl(version: string): string {
    return `https://github.com/g0shtj0sh/nether-client-resources/releases/download/MohistMC/mohist-${version}.jar`;
  }

  /**
   * Vérifie si une version MohistMC existe dans le dépôt GitHub
   */
  static async versionExists(version: string): Promise<boolean> {
    try {
      const url = this.getServerUrl(version);
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Récupère les versions par version Minecraft
   */
  static async getVersionsForMinecraft(mcVersion: string): Promise<MohistVersion[]> {
    const allVersions = await this.getVersions();
    return allVersions.filter(v => {
      const versionMc = this.extractMinecraftVersion(v.version);
      return versionMc === mcVersion;
    });
  }

  /**
   * Obtient la version Minecraft correspondante à une version MohistMC
   */
  static getMinecraftVersion(mohistVersion: string): string {
    return this.extractMinecraftVersion(mohistVersion);
  }

  /**
   * Récupère les informations sur MohistMC
   */
  static getMohistInfo(): { name: string; description: string; features: string[] } {
    return {
      name: 'MohistMC',
      description: 'Serveur hybride Minecraft qui combine Forge et Bukkit/Spigot pour supporter à la fois les mods et les plugins.',
      features: [
        'Support des mods Forge',
        'Support des plugins Bukkit/Spigot',
        'API hybride unique',
        'Performance optimisée',
        'Compatibilité étendue',
        'Communauté active'
      ]
    };
  }
}

export default MohistAPI;



