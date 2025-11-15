// Service pour récupérer les versions Paper depuis l'API PaperMC
import API_CONFIG from '../config/api';

export interface PaperVersion {
  version: string;
  builds: number[];
  latestBuild: number;
}

export interface PaperBuild {
  build: number;
  version: string;
  time: string;
  channel: string;
  promoted: boolean;
  downloads: {
    application: {
      name: string;
      sha256: string;
    };
  };
}

export class PaperAPI {
  /**
   * Récupère toutes les versions Paper disponibles
   * Essaie d'abord la commande Tauri, puis fallback sur fetch
   */
  static async getVersions(): Promise<PaperVersion[]> {
    // Essayer d'abord la commande Tauri (backend Rust) - plus fiable
    try {
      const { invoke } = await import('@tauri-apps/api/tauri');
      console.log('Tentative de récupération via Tauri...');
      
      const versions = await invoke<any[]>('get_paper_versions');
      
      if (versions && Array.isArray(versions) && versions.length > 0) {
        console.log(`✅ ${versions.length} versions récupérées via Tauri`);
        
        // Convertir les versions JSON en PaperVersion
        const paperVersions: PaperVersion[] = versions.map((v: any) => ({
          version: v.version || '',
          builds: Array.isArray(v.builds) ? v.builds : [v.latestBuild || 1],
          latestBuild: v.latestBuild || 1
        })).filter((v: PaperVersion) => v.version);
        
        if (paperVersions.length > 0) {
          // Trier par version (plus récentes en premier)
          return paperVersions.sort((a, b) => {
            const aParts = a.version.split('.').map(Number);
            const bParts = b.version.split('.').map(Number);
            
            for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
              const aPart = aParts[i] || 0;
              const bPart = bParts[i] || 0;
              if (aPart !== bPart) {
                return bPart - aPart;
              }
            }
            return 0;
          });
        }
      }
    } catch (tauriError: any) {
      console.warn('⚠️ Erreur avec la commande Tauri, fallback sur fetch:', tauriError);
      // Continuer avec fetch
    }
    
    // Fallback sur fetch direct (comme Forge/NeoForge)
    try {
      const apiUrl = `${API_CONFIG.paper.apiUrl}`;
      console.log('Fetching Paper versions from:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        console.error('Paper API error:', response.status, errorText);
        throw new Error(`Erreur HTTP ${response.status}: ${errorText || response.statusText || 'Erreur inconnue'}`);
      }
      
      const data = await response.json();
      console.log('Paper API response:', data);
      
      // L'API PaperMC v2 retourne { versions: [...] }
      const versionList = data.versions || [];
      
      if (!Array.isArray(versionList) || versionList.length === 0) {
        console.warn('Aucune version trouvée dans la réponse:', data);
        throw new Error('Aucune version Paper disponible');
      }
      
      // Retourner les versions avec leurs builds (limiter à 30 versions pour éviter trop de requêtes)
      const versions: PaperVersion[] = [];
      const versionsToProcess = versionList.slice(0, 30); // Limiter à 30 versions
      
      // Récupérer les builds pour chaque version (en parallèle mais limité)
      const buildPromises = versionsToProcess.map(async (version: string) => {
        try {
          const buildsUrl = `${API_CONFIG.paper.apiUrl}/versions/${version}/builds`;
          const buildsResponse = await fetch(buildsUrl, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
            },
          });
          
          if (buildsResponse.ok) {
            const buildsData = await buildsResponse.json();
            const builds = buildsData.builds ? buildsData.builds.map((b: any) => b.build) : [];
            const latestBuild = builds.length > 0 ? Math.max(...builds) : 1;
            
            return {
              version,
              builds,
              latestBuild
            } as PaperVersion;
          } else {
            console.warn(`Impossible de récupérer les builds pour ${version}:`, buildsResponse.status);
            // Ajouter quand même la version avec un build par défaut
            return {
              version,
              builds: [1],
              latestBuild: 1
            } as PaperVersion;
          }
        } catch (e) {
          console.warn(`Impossible de récupérer les builds pour ${version}:`, e);
          // Ajouter quand même la version avec un build par défaut
          return {
            version,
            builds: [1],
            latestBuild: 1
          } as PaperVersion;
        }
      });
      
      const results = await Promise.all(buildPromises);
      versions.push(...results.filter(v => v && v.version));
      
      if (versions.length === 0) {
        throw new Error('Aucune version Paper valide trouvée');
      }
      
      // Trier par version (plus récentes en premier)
      return versions.sort((a, b) => {
        const aParts = a.version.split('.').map(Number);
        const bParts = b.version.split('.').map(Number);
        
        for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
          const aPart = aParts[i] || 0;
          const bPart = bParts[i] || 0;
          if (aPart !== bPart) {
            return bPart - aPart;
          }
        }
        return 0;
      });
    } catch (error: any) {
      console.error('Erreur lors de la récupération des versions Paper:', error);
      throw error;
    }
  }

  /**
   * Récupère les builds disponibles pour une version spécifique
   */
  static async getBuilds(version: string): Promise<PaperBuild[]> {
    try {
      const response = await fetch(`${API_CONFIG.paper.apiUrl}/versions/${version}/builds`);
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      return data.builds.map((build: any) => ({
        build: build.build,
        version: build.version,
        time: build.time,
        channel: build.channel,
        promoted: build.promoted || false,
        downloads: build.downloads
      }));
    } catch (error) {
      console.error(`Erreur lors de la récupération des builds pour ${version}:`, error);
      throw error;
    }
  }

  /**
   * Récupère l'URL de téléchargement d'un build spécifique
   */
  static getDownloadUrl(version: string, build: number): string {
    return `${API_CONFIG.paper.downloadUrl}/versions/${version}/builds/${build}/downloads/paper-${version}-${build}.jar`;
  }

  /**
   * Récupère le build le plus récent pour une version
   */
  static async getLatestBuild(version: string): Promise<PaperBuild | null> {
    try {
      const builds = await this.getBuilds(version);
      if (builds.length === 0) return null;
      
      // Trier par build number (plus récent en premier)
      builds.sort((a, b) => b.build - a.build);
      return builds[0];
    } catch (error) {
      console.error(`Erreur lors de la récupération du build le plus récent pour ${version}:`, error);
      return null;
    }
  }

  /**
   * Filtre les versions release (exclut les snapshots si nécessaire)
   */
  static filterReleaseVersions(versions: PaperVersion[]): PaperVersion[] {
    // Paper ne distingue pas vraiment les snapshots, mais on peut filtrer les versions très anciennes
    return versions.filter(v => {
      const major = parseInt(v.version.split('.')[0]);
      return major >= 1; // Filtrer les versions valides
    });
  }
}

export default PaperAPI;

