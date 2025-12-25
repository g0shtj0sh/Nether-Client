import { useState, useEffect } from 'react';
import { useSystemInfo } from './useSystemInfo';

export interface RamOption {
  value: number;
  label: string;
  recommended?: boolean;
}

export const useRamOptions = () => {
  const { systemInfo, loading } = useSystemInfo();
  const [ramOptions, setRamOptions] = useState<RamOption[]>([]);
  const [defaultRam, setDefaultRam] = useState<number>(2048);

  useEffect(() => {
    if (!loading && systemInfo.totalRam > 0) {
      generateRamOptions();
    }
  }, [systemInfo, loading]);

  const generateRamOptions = () => {
    const totalRamMB = systemInfo.totalRam;
    const totalRamGB = Math.floor(totalRamMB / 1024);
    
    // Calculer la RAM recommandée (environ 25% de la RAM totale, avec un minimum de 2GB et un maximum de 8GB)
    const recommendedRamMB = Math.min(Math.max(Math.floor(totalRamMB * 0.25), 2048), 8192);
    
    // Ne pas dépasser 50% de la RAM totale pour laisser de la RAM au système
    const maxRamMB = Math.floor(totalRamMB * 0.5);
    
    const options: RamOption[] = [];
    
    // Générer les options progressives de 2 GB jusqu'à la limite du système
    // Commence à 2 GB (2048 MB)
    let currentRamMB = 2048;
    
    while (currentRamMB <= maxRamMB && currentRamMB <= totalRamMB) {
      const ramGB = currentRamMB / 1024;
      options.push({ 
        value: currentRamMB, 
        label: `${ramGB} GB` 
      });
      
      // Augmenter le pas progressivement pour les grandes valeurs
      if (currentRamMB >= 16384) {
        // Au-delà de 16 GB, augmenter par pas de 4 GB
        currentRamMB += 4096;
      } else {
        // En dessous de 16 GB, augmenter par pas de 2 GB
        currentRamMB += 2048;
      }
    }
    
    // Marquer l'option recommandée
    const recommendedOption = options.find(option => option.value === recommendedRamMB);
    if (recommendedOption) {
      recommendedOption.recommended = true;
    }
    
    // Si aucune option exacte n'est trouvée, trouver la plus proche
    if (!recommendedOption && options.length > 0) {
      const closestOption = options.reduce((prev, curr) => 
        Math.abs(curr.value - recommendedRamMB) < Math.abs(prev.value - recommendedRamMB) ? curr : prev
      );
      closestOption.recommended = true;
    }
    
    setRamOptions(options);
    
    // Définir la valeur par défaut comme l'option recommandée ou la première disponible
    const defaultOption = options.find(option => option.recommended) || options[0];
    setDefaultRam(defaultOption?.value || 2048);
  };

  const getRecommendedRam = (): number => {
    if (ramOptions.length === 0) return 2048;
    const recommended = ramOptions.find(option => option.recommended);
    return recommended?.value || ramOptions[0].value;
  };

  const getMaxRecommendedRam = (): number => {
    if (ramOptions.length === 0) return 8192;
    // Ne pas dépasser 50% de la RAM totale
    return Math.min(Math.floor(systemInfo.totalRam * 0.5), ramOptions[ramOptions.length - 1].value);
  };

  return {
    ramOptions,
    defaultRam,
    loading,
    getRecommendedRam,
    getMaxRecommendedRam,
    systemInfo
  };
};
