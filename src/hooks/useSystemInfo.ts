import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';

export interface SystemInfo {
  os: string;
  osVersion: string;
  arch: string;
  cpu: string;
  cpuCores: number;
  totalRam: number;
  availableRam: number;
  usedRam: number;
  totalDisk: number;
  usedDisk: number;
  freeDisk: number;
}

export const useSystemInfo = () => {
  const [systemInfo, setSystemInfo] = useState<SystemInfo>({
    os: 'Windows',
    osVersion: '11',
    arch: 'x64',
    cpu: 'Intel Core i7',
    cpuCores: navigator.hardwareConcurrency || 8,
    totalRam: 16384, // MB
    availableRam: 8192, // MB
    usedRam: 8192, // MB
    totalDisk: 512000, // MB
    usedDisk: 256000, // MB
    freeDisk: 256000, // MB
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Détecter les informations système réelles via Tauri
    const detectSystemInfo = async () => {
      try {
        setLoading(true);
        
        // Appeler la commande Tauri pour obtenir les vraies informations système
        const info = await invoke<SystemInfo>('get_system_info');
        
        setSystemInfo(info);
      } catch (error) {
        console.error('Error detecting system info:', error);
        
        // Fallback sur la détection navigateur en cas d'erreur
        const cpuCores = navigator.hardwareConcurrency || 8;
        
        // @ts-ignore - navigator.deviceMemory est une API expérimentale
        const deviceMemory = navigator.deviceMemory || 8; // GB
        const totalRam = deviceMemory * 1024; // Convertir en MB
        const availableRam = Math.floor(totalRam * 0.5);
        
        const userAgent = navigator.userAgent;
        let os = 'Windows';
        let osVersion = '10';
        
        if (userAgent.indexOf('Windows NT 10.0') !== -1) {
          os = 'Windows';
          osVersion = '10/11';
        }
        
        const arch = navigator.userAgent.indexOf('WOW64') !== -1 || 
                     navigator.userAgent.indexOf('Win64') !== -1 ? 'x64' : 'x86';
        
        setSystemInfo({
          os,
          osVersion,
          arch,
          cpu: 'Intel/AMD Processor',
          cpuCores,
          totalRam,
          availableRam,
          usedRam: totalRam - availableRam,
          totalDisk: 512000,
          usedDisk: 256000,
          freeDisk: 256000,
        });
      } finally {
        setLoading(false);
      }
    };

    detectSystemInfo();
  }, []);

  return { systemInfo, loading };
};

export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

export const formatMB = (mb: number): string => {
  if (mb < 1024) {
    return `${Math.round(mb)} MB`;
  }
  return `${Math.round(mb / 1024 * 10) / 10} GB`;
};

