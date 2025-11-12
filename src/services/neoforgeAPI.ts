// Service pour récupérer les versions NeoForge
import API_CONFIG from '../config/api';
import { NeoForgeVersion } from '../types';

export class NeoForgeAPI {
  /**
   * Récupère les versions NeoForge disponibles
   * Ne garde que la dernière version de chaque version Minecraft
   */
  static async getVersions(): Promise<NeoForgeVersion[]> {
    try {
      // Essayer d'abord l'API Maven pour toutes les versions
      const mavenVersions = await this.getMavenVersions();
      if (mavenVersions.length > 0) {
        return mavenVersions;
      }

      // Fallback sur les versions connues
      return this.getFallbackVersions();
    } catch (error) {
      console.error('Erreur lors de la récupération des versions NeoForge:', error);
      return this.getFallbackVersions();
    }
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
   * Récupère les versions via l'API Maven et filtre pour garder seulement la dernière de chaque MC
   */
  static async getMavenVersions(): Promise<NeoForgeVersion[]> {
    try {
      const response = await fetch(API_CONFIG.neoforge.versionsUrl);
      
      if (!response.ok) {
        return [];
      }
      
      const data = await response.json();
      const versions: NeoForgeVersion[] = [];
      
      if (data.versions && Array.isArray(data.versions)) {
        // Trier les versions numériquement (plus récentes en premier)
        const sortedVersions = data.versions
          .filter((v: string) => v && v.length > 0)
          .sort((a: string, b: string) => {
            // Extraire les composants de version pour le tri
            const parseVersion = (version: string) => {
              // Format NeoForge: "20.4.237-beta" ou "1.20.1-47.1.106"
              if (version.includes('-')) {
                const parts = version.split('-');
                if (parts.length >= 2) {
                  const mcPart = parts[0];
                  const forgePart = parts[1];
                  return { mc: mcPart, forge: forgePart, isBeta: version.includes('beta') };
                }
              }
              return { mc: version, forge: '', isBeta: version.includes('beta') };
            };

            const aParsed = parseVersion(a);
            const bParsed = parseVersion(b);

            // Les versions non-beta en premier
            if (aParsed.isBeta !== bParsed.isBeta) {
              return aParsed.isBeta ? 1 : -1;
            }

            // Comparer les versions MC numériquement
            const mcCompare = this.compareVersions(bParsed.mc, aParsed.mc);
            if (mcCompare !== 0) return mcCompare;

            // Comparer les versions Forge/NeoForge numériquement
            return this.compareVersions(bParsed.forge, aParsed.forge);
          });

        // Grouper par version MC et garder seulement la dernière de chaque groupe
        const mcVersionMap = new Map<string, string>();
        
        for (const version of sortedVersions) {
          const mcVersion = this.extractMinecraftVersion(version);
          
          // Si on n'a pas encore cette version MC, on la garde
          if (!mcVersionMap.has(mcVersion)) {
            mcVersionMap.set(mcVersion, version);
          }
        }

        // Convertir en array, trier numériquement et limiter à 50 versions max
        const latestVersions = Array.from(mcVersionMap.entries())
          .sort((a, b) => this.compareVersions(b[0], a[0]))
          .map(([_, version]) => version)
          .slice(0, 50);

        for (const version of latestVersions) {
          const mcVersion = this.extractMinecraftVersion(version);
          versions.push({
            version: version,
            installer: `${API_CONFIG.neoforge.mavenUrl}/${version}/neoforge-${version}-installer.jar`,
            universal: `${API_CONFIG.neoforge.mavenUrl}/${version}/neoforge-${version}-universal.jar`,
            changelog: this.getVersionDescription(version, mcVersion)
          });
        }
      }
      
      return versions;
    } catch (error) {
      console.error('Erreur Maven API NeoForge:', error);
      return [];
    }
  }

  /**
   * Extrait la version Minecraft correspondante d'une version NeoForge
   * Basé sur le système de versioning officiel de NeoForge
   */
  static extractMinecraftVersion(neoforgeVersion: string): string {
    // Format "1.20.1-47.1.106" → "1.20.1" (versions compatibles Forge)
    if (neoforgeVersion.includes('-') && neoforgeVersion.startsWith('1.')) {
      return neoforgeVersion.split('-')[0];
    }
    
    // Format NeoForge moderne : "20.4.237-beta" → "1.20.4"
    // NeoForge utilise : 20.4.x = Minecraft 1.20.4, 21.0.x = Minecraft 1.21, etc.
    if (neoforgeVersion.match(/^\d+\.\d+/)) {
      const match = neoforgeVersion.match(/^(\d+)\.(\d+)/);
      if (match) {
        const major = parseInt(match[1]);
        const minor = parseInt(match[2]);
        
        // Mapping NeoForge → Minecraft
        if (major === 21) {
          return `1.21.${minor}`;
        } else if (major === 20) {
          return `1.20.${minor}`;
        } else if (major === 19) {
          return `1.19.${minor}`;
        } else if (major === 18) {
          return `1.18.${minor}`;
        } else if (major === 17) {
          return `1.17.${minor}`;
        } else if (major === 16) {
          return `1.16.${minor}`;
        } else {
          // Fallback générique
          return `1.${major}.${minor}`;
        }
      }
    }
    
    return neoforgeVersion;
  }

  /**
   * Génère une description pour une version NeoForge
   */
  static getVersionDescription(version: string, mcVersion: string): string {
    // Versions importantes
    if (version.includes('beta')) {
      return `Minecraft ${mcVersion} - Version beta avec dernières fonctionnalités`;
    }
    
    // Versions MC importantes
    if (mcVersion.startsWith('1.21')) {
      return `Minecraft ${mcVersion} - Dernière version stable`;
    }
    
    if (mcVersion.startsWith('1.20')) {
      return `Minecraft ${mcVersion} - Dernière version stable`;
    }
    
    if (mcVersion.startsWith('1.19')) {
      return `Minecraft ${mcVersion} - Dernière version stable`;
    }
    
    if (mcVersion.startsWith('1.18')) {
      return `Minecraft ${mcVersion} - Dernière version stable`;
    }
    
    if (mcVersion.startsWith('1.17')) {
      return `Minecraft ${mcVersion} - Dernière version stable`;
    }
    
    if (mcVersion.startsWith('1.16')) {
      return `Minecraft ${mcVersion} - Dernière version stable`;
    }
    
    return `Minecraft ${mcVersion} - Dernière version stable avec optimisations modernes`;
  }

  /**
   * Versions NeoForge connues (fallback) avec mapping correct MC
   */
  static getFallbackVersions(): NeoForgeVersion[] {
    const knownVersions = [
      // Versions modernes NeoForge (format 20.x.x = MC 1.20.x)
      { version: '20.4.237-beta', mc: '1.20.4', desc: 'Minecraft 1.20.4 - Version beta avec dernières fonctionnalités' },
      { version: '20.4.190', mc: '1.20.4', desc: 'Minecraft 1.20.4 - Dernière version stable' },
      { version: '20.3.20', mc: '1.20.3', desc: 'Minecraft 1.20.3 - Dernière version stable' },
      { version: '20.2.88', mc: '1.20.2', desc: 'Minecraft 1.20.2 - Dernière version stable' },
      { version: '20.1.85', mc: '1.20.1', desc: 'Minecraft 1.20.1 - Version LTS recommandée' },
      { version: '20.0.50', mc: '1.20', desc: 'Minecraft 1.20 - Dernière version stable' },
      
      // Versions avec format MC-Forge (compatibles Forge)
      { version: '1.21.1-47.3.0', mc: '1.21.1', desc: 'Minecraft 1.21.1 - Compatible Forge' },
      { version: '1.21-47.2.0', mc: '1.21', desc: 'Minecraft 1.21 - Compatible Forge' },
      { version: '1.20.6-47.1.0', mc: '1.20.6', desc: 'Minecraft 1.20.6 - Compatible Forge' },
      { version: '1.20.4-47.0.0', mc: '1.20.4', desc: 'Minecraft 1.20.4 - Compatible Forge' },
      { version: '1.20.1-47.1.106', mc: '1.20.1', desc: 'Minecraft 1.20.1 - Compatible Forge' },
      { version: '1.20-46.0.14', mc: '1.20', desc: 'Minecraft 1.20 - Compatible Forge' },
      { version: '1.19.4-45.1.0', mc: '1.19.4', desc: 'Minecraft 1.19.4 - Compatible Forge' },
      { version: '1.19.3-44.1.23', mc: '1.19.3', desc: 'Minecraft 1.19.3 - Compatible Forge' },
      { version: '1.19.2-43.3.0', mc: '1.19.2', desc: 'Minecraft 1.19.2 - Version LTS recommandée' },
      { version: '1.18.2-40.2.0', mc: '1.18.2', desc: 'Minecraft 1.18.2 - Version stable pour modpacks' },
      { version: '1.17.1-37.1.1', mc: '1.17.1', desc: 'Minecraft 1.17.1 - Compatible Forge' },
      { version: '1.16.5-36.2.39', mc: '1.16.5', desc: 'Minecraft 1.16.5 - Version très stable' }
    ];

    return knownVersions.map(v => ({
      version: v.version,
      installer: `${API_CONFIG.neoforge.mavenUrl}/${v.version}/neoforge-${v.version}-installer.jar`,
      universal: `${API_CONFIG.neoforge.mavenUrl}/${v.version}/neoforge-${v.version}-universal.jar`,
      changelog: v.desc
    }));
  }

  /**
   * Récupère l'URL de téléchargement de l'installeur NeoForge
   */
  static getInstallerUrl(version: string): string {
    return `${API_CONFIG.neoforge.mavenUrl}/${version}/neoforge-${version}-installer.jar`;
  }

  /**
   * Vérifie si une version NeoForge existe
   */
  static async versionExists(version: string): Promise<boolean> {
    try {
      const url = this.getInstallerUrl(version);
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Récupère les versions par version Minecraft
   */
  static async getVersionsForMinecraft(mcVersion: string): Promise<NeoForgeVersion[]> {
    const allVersions = await this.getVersions();
    return allVersions.filter(v => {
      const versionMc = this.extractMinecraftVersion(v.version);
      return versionMc === mcVersion;
    });
  }

  /**
   * Récupère les versions beta uniquement
   */
  static async getBetaVersions(): Promise<NeoForgeVersion[]> {
    const allVersions = await this.getVersions();
    return allVersions.filter(v => v.version.includes('beta'));
  }

  /**
   * Récupère les versions stables uniquement
   */
  static async getStableVersions(): Promise<NeoForgeVersion[]> {
    const allVersions = await this.getVersions();
    return allVersions.filter(v => !v.version.includes('beta'));
  }

  /**
   * Obtient la version Minecraft correspondante à une version NeoForge
   */
  static getMinecraftVersion(neoforgeVersion: string): string {
    return this.extractMinecraftVersion(neoforgeVersion);
  }
}

export default NeoForgeAPI;