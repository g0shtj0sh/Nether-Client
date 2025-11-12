// Service pour récupérer les versions Forge
import API_CONFIG from '../config/api';
import { ForgeVersion } from '../types';

export class ForgeAPI {
  /**
   * Récupère les versions Forge disponibles
   * Ne garde que la dernière version de chaque version Minecraft
   */
  static async getVersions(): Promise<ForgeVersion[]> {
    try {
      // Essayer d'abord l'API Maven pour toutes les versions
      const mavenVersions = await this.getMavenVersions();
      if (mavenVersions.length > 0) {
        return mavenVersions;
      }

      // Fallback sur les promotions si Maven ne fonctionne pas
      const promotionVersions = await this.getPromotionVersions();
      if (promotionVersions.length > 0) {
        return promotionVersions;
      }

      // Dernier recours : versions connues
      return this.getFallbackVersions();
    } catch (error) {
      console.error('Erreur lors de la récupération des versions Forge:', error);
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
  static async getMavenVersions(): Promise<ForgeVersion[]> {
    try {
      // URL de l'API Maven pour récupérer toutes les versions
      const mavenApiUrl = 'https://maven.minecraftforge.net/api/maven/versions/releases/net/minecraftforge/forge';
      
      const response = await fetch(mavenApiUrl);
      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      const versions: ForgeVersion[] = [];

      if (data.versions && Array.isArray(data.versions)) {
        // Trier les versions numériquement (plus récentes en premier)
        const sortedVersions = data.versions
          .filter((v: string) => v.includes('-'))
          .sort((a: string, b: string) => {
            // Extraire la version MC et Forge pour le tri
            const [mcA, forgeA] = a.split('-');
            const [mcB, forgeB] = b.split('-');
            
            // Comparer d'abord la version MC numériquement
            const mcCompare = this.compareVersions(mcB, mcA);
            if (mcCompare !== 0) return mcCompare;
            
            // Puis comparer la version Forge numériquement
            return this.compareVersions(forgeB, forgeA);
          });

        // Grouper par version MC et garder seulement la dernière de chaque groupe
        const mcVersionMap = new Map<string, string>();
        
        for (const version of sortedVersions) {
          const [mcVersion] = version.split('-');
          
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
          const [mcVersion, forgeVersion] = version.split('-');
          
          versions.push({
            version: version,
            installer: `${API_CONFIG.forge.mavenUrl}/${version}/forge-${version}-installer.jar`,
            universal: `${API_CONFIG.forge.mavenUrl}/${version}/forge-${version}-universal.jar`,
            changelog: this.getVersionDescription(mcVersion, forgeVersion)
          });
        }
      }

      return versions;
    } catch (error) {
      console.error('Erreur Maven API:', error);
      return [];
    }
  }

  /**
   * Récupère les versions via les promotions (fallback)
   */
  static async getPromotionVersions(): Promise<ForgeVersion[]> {
    try {
      const response = await fetch(API_CONFIG.forge.promotionsUrl);
      
      if (!response.ok) {
        return [];
      }
      
      const data = await response.json();
      const versions: ForgeVersion[] = [];
      
      if (data.promos) {
        const promos = data.promos;
        const processedVersions = new Set<string>();
        
        for (const [key, value] of Object.entries(promos)) {
          if (key.includes('-recommended') || key.includes('-latest')) {
            const mcVersion = key.split('-')[0];
            const forgeVersion = value as string;
            const fullVersion = `${mcVersion}-${forgeVersion}`;
            
            if (!processedVersions.has(fullVersion)) {
              processedVersions.add(fullVersion);
              versions.push({
                version: fullVersion,
                installer: `${API_CONFIG.forge.mavenUrl}/${fullVersion}/forge-${fullVersion}-installer.jar`,
                universal: `${API_CONFIG.forge.mavenUrl}/${fullVersion}/forge-${fullVersion}-universal.jar`,
                changelog: key.includes('-recommended') ? 'Version recommandée' : 'Dernière version'
              });
            }
          }
        }
      }
      
      return versions;
    } catch (error) {
      console.error('Erreur Promotions API:', error);
      return [];
    }
  }

  /**
   * Génère une description pour une version
   */
  static getVersionDescription(mcVersion: string, forgeVersion: string): string {
    // Versions MC importantes
    const importantMcVersions = ['1.21', '1.20', '1.19', '1.18', '1.17', '1.16', '1.15', '1.14', '1.13', '1.12'];
    
    if (importantMcVersions.some(v => mcVersion.startsWith(v))) {
      return `Minecraft ${mcVersion} - Dernière version stable`;
    }
    
    return `Minecraft ${mcVersion} - Version stable`;
  }

  /**
   * Versions Forge connues (fallback si l'API ne répond pas)
   */
  static getFallbackVersions(): ForgeVersion[] {
    const knownVersions = [
      { mc: '1.21.1', forge: '47.3.0', desc: 'Minecraft 1.21.1 - Dernière version stable' },
      { mc: '1.21', forge: '47.2.0', desc: 'Minecraft 1.21 - Dernière version stable' },
      { mc: '1.20.6', forge: '47.1.0', desc: 'Minecraft 1.20.6 - Dernière version stable' },
      { mc: '1.20.4', forge: '47.0.0', desc: 'Minecraft 1.20.4 - Dernière version stable' },
      { mc: '1.20.1', forge: '47.2.0', desc: 'Minecraft 1.20.1 - Dernière version stable' },
      { mc: '1.20', forge: '46.0.14', desc: 'Minecraft 1.20 - Dernière version stable' },
      { mc: '1.19.4', forge: '45.1.0', desc: 'Minecraft 1.19.4 - Dernière version stable' },
      { mc: '1.19.3', forge: '44.1.23', desc: 'Minecraft 1.19.3 - Dernière version stable' },
      { mc: '1.19.2', forge: '43.3.0', desc: 'Minecraft 1.19.2 - Version LTS recommandée' },
      { mc: '1.18.2', forge: '40.2.0', desc: 'Minecraft 1.18.2 - Version stable pour modpacks' },
      { mc: '1.17.1', forge: '37.1.1', desc: 'Minecraft 1.17.1 - Dernière version stable' },
      { mc: '1.16.5', forge: '36.2.39', desc: 'Minecraft 1.16.5 - Version très stable avec beaucoup de mods' },
      { mc: '1.15.2', forge: '31.2.57', desc: 'Minecraft 1.15.2 - Dernière version stable' },
      { mc: '1.14.4', forge: '28.2.26', desc: 'Minecraft 1.14.4 - Dernière version stable' },
      { mc: '1.13.2', forge: '25.0.223', desc: 'Minecraft 1.13.2 - Dernière version stable' },
      { mc: '1.12.2', forge: '14.23.5.2859', desc: 'Minecraft 1.12.2 - Version classique avec énormément de mods' }
    ];

    return knownVersions.map(v => ({
      version: `${v.mc}-${v.forge}`,
      installer: `${API_CONFIG.forge.mavenUrl}/${v.mc}-${v.forge}/forge-${v.mc}-${v.forge}-installer.jar`,
      universal: `${API_CONFIG.forge.mavenUrl}/${v.mc}-${v.forge}/forge-${v.mc}-${v.forge}-universal.jar`,
      changelog: v.desc
    }));
  }

  /**
   * Récupère l'URL de téléchargement de l'installeur Forge
   */
  static getInstallerUrl(version: string): string {
    return `${API_CONFIG.forge.mavenUrl}/${version}/forge-${version}-installer.jar`;
  }

  /**
   * Vérifie si une version Forge existe
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
}

export default ForgeAPI;