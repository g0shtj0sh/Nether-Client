import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';

export interface JavaVersion {
  path: string;
  version: string;
  type: 'JDK' | 'JRE' | 'System';
  source: string;
}

export interface JavaDetectionResult {
  versions: JavaVersion[];
  recommendedVersion?: JavaVersion;
  loading: boolean;
  error?: string;
}

export const useJavaDetection = (minecraftVersion?: string) => {
  const [result, setResult] = useState<JavaDetectionResult>({
    versions: [],
    loading: true,
  });

  useEffect(() => {
    detectJavaVersions();
  }, []);

  const detectJavaVersions = async () => {
    try {
      setResult(prev => ({ ...prev, loading: true, error: undefined }));
      
      // Détecter toutes les versions Java installées
      const javaVersions = await invoke<JavaVersion[]>('detect_java_versions');
      
      // Si une version Minecraft est spécifiée, obtenir la version Java recommandée
      let recommendedVersion: JavaVersion | undefined;
      if (minecraftVersion) {
        try {
          const recommended = await invoke<JavaVersion | null>('select_best_java_version', {
            minecraftVersion
          });
          recommendedVersion = recommended || undefined;
        } catch (error) {
          console.warn('Impossible de déterminer la version Java recommandée:', error);
        }
      }
      
      setResult({
        versions: javaVersions,
        recommendedVersion,
        loading: false,
      });
    } catch (error) {
      setResult({
        versions: [],
        loading: false,
        error: `Erreur lors de la détection Java: ${error}`,
      });
    }
  };

  const getRecommendedJavaVersion = async (minecraftVersion: string): Promise<JavaVersion | null> => {
    try {
      return await invoke<JavaVersion | null>('select_best_java_version', {
        minecraftVersion
      });
    } catch (error) {
      console.error('Erreur lors de la récupération de la version Java recommandée:', error);
      return null;
    }
  };

  const getJavaVersionForMinecraft = async (minecraftVersion: string): Promise<string> => {
    try {
      const recommended = await invoke<string>('get_recommended_java_version', {
        minecraftVersion
      });
      return recommended;
    } catch (error) {
      console.error('Erreur lors de la récupération de la version Java:', error);
      return '21'; // Fallback sur Java 21
    }
  };

  const formatJavaVersion = (version: string): string => {
    // Formater la version Java pour l'affichage
    const parts = version.split('.');
    if (parts.length >= 1) {
      const major = parts[0];
      if (major === '1') {
        // Ancien format (ex: 1.8.0_291)
        return `Java ${parts[1] || '8'}`;
      } else {
        // Nouveau format (ex: 21.0.1)
        return `Java ${major}`;
      }
    }
    return `Java ${version}`;
  };

  const isCompatibleWithMinecraft = (javaVersion: string, minecraftVersion: string): boolean => {
    const javaMajor = parseInt(javaVersion.split('.')[0]);
    const minecraftParts = minecraftVersion.split('.');
    const minecraftMajor = parseInt(minecraftParts[0]);
    const minecraftMinor = parseInt(minecraftParts[1] || '0');

    // Minecraft 1.21+ nécessite Java 21+
    if (minecraftMajor > 1 || (minecraftMajor === 1 && minecraftMinor >= 21)) {
      return javaMajor >= 21;
    }
    // Minecraft 1.17-1.20 nécessite Java 17+
    else if (minecraftMajor === 1 && minecraftMinor >= 17) {
      return javaMajor >= 17;
    }
    // Minecraft 1.16 et antérieur fonctionne avec Java 8+
    else {
      return javaMajor >= 8;
    }
  };

  return {
    ...result,
    detectJavaVersions,
    getRecommendedJavaVersion,
    getJavaVersionForMinecraft,
    formatJavaVersion,
    isCompatibleWithMinecraft,
  };
};