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
    
    // Calculer la RAM recommandée (environ 25% de la RAM totale, avec un minimum de 1GB et un maximum de 8GB)
    const recommendedRamMB = Math.min(Math.max(Math.floor(totalRamMB * 0.25), 1024), 8192);
    
    const options: RamOption[] = [];
    
    // Générer les options en fonction de la RAM disponible
    if (totalRamGB >= 2) {
      options.push({ value: 1024, label: '1 GB' });
    }
    
    if (totalRamGB >= 4) {
      options.push({ value: 2048, label: '2 GB' });
    }
    
    if (totalRamGB >= 6) {
      options.push({ value: 4096, label: '4 GB' });
    }
    
    if (totalRamGB >= 8) {
      options.push({ value: 6144, label: '6 GB' });
    }
    
    if (totalRamGB >= 12) {
      options.push({ value: 8192, label: '8 GB' });
    }
    
    if (totalRamGB >= 16) {
      options.push({ value: 12288, label: '12 GB' });
    }
    
    if (totalRamGB >= 20) {
      options.push({ value: 16384, label: '16 GB' });
    }
    
    if (totalRamGB >= 24) {
      options.push({ value: 20480, label: '20 GB' });
    }
    
    if (totalRamGB >= 32) {
      options.push({ value: 24576, label: '24 GB' });
      options.push({ value: 32768, label: '32 GB' });
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
