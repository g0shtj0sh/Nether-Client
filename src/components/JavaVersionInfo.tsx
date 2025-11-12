import React from 'react';
import { CheckCircle, AlertTriangle, Info, Loader2 } from 'lucide-react';
import { useJavaDetection, JavaVersion } from '../hooks/useJavaDetection';

interface JavaVersionInfoProps {
  minecraftVersion: string;
  className?: string;
}

const JavaVersionInfo: React.FC<JavaVersionInfoProps> = ({ minecraftVersion, className = '' }) => {
  const { 
    versions, 
    recommendedVersion, 
    loading, 
    error, 
    formatJavaVersion,
    isCompatibleWithMinecraft 
  } = useJavaDetection(minecraftVersion);

  if (loading) {
    return (
      <div className={`bg-dark-700 p-3 rounded-lg ${className}`}>
        <div className="flex items-center space-x-2">
          <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
          <span className="text-sm text-gray-300">Détection des versions Java...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-500/20 border border-red-500/30 p-3 rounded-lg ${className}`}>
        <div className="flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-red-400" />
          <span className="text-sm text-red-400">{error}</span>
        </div>
      </div>
    );
  }

  if (versions.length === 0) {
    return (
      <div className={`bg-yellow-500/20 border border-yellow-500/30 p-3 rounded-lg ${className}`}>
        <div className="flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-yellow-400" />
          <span className="text-sm text-yellow-400">Aucune version Java détectée</span>
        </div>
      </div>
    );
  }

  const compatibleVersions = versions.filter((java: JavaVersion) => 
    isCompatibleWithMinecraft(java.version, minecraftVersion)
  );

  return (
    <div className={`bg-dark-700 p-3 rounded-lg ${className}`}>
      <div className="flex items-center space-x-2 mb-2">
        <Info className="w-4 h-4 text-blue-400" />
        <span className="text-sm font-medium text-white">Versions Java détectées</span>
      </div>
      
      <div className="space-y-2">
        {recommendedVersion && (
          <div className="flex items-center space-x-2 p-2 bg-green-500/20 border border-green-500/30 rounded">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <div className="flex-1">
              <div className="text-sm font-medium text-green-400">
                {formatJavaVersion(recommendedVersion.version)} (Recommandé)
              </div>
              <div className="text-xs text-gray-400">
                {recommendedVersion.type} • {recommendedVersion.source}
              </div>
            </div>
          </div>
        )}
        
        {compatibleVersions.length > 0 && (
          <div className="space-y-1">
            <div className="text-xs text-gray-400">Versions compatibles :</div>
            {compatibleVersions.slice(0, 3).map((java: JavaVersion, index: number) => (
              <div key={index} className="flex items-center space-x-2 text-xs text-gray-300">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>{formatJavaVersion(java.version)}</span>
                <span className="text-gray-500">({java.type})</span>
              </div>
            ))}
            {compatibleVersions.length > 3 && (
              <div className="text-xs text-gray-500">
                +{compatibleVersions.length - 3} autres versions compatibles
              </div>
            )}
          </div>
        )}
        
        {compatibleVersions.length === 0 && (
          <div className="flex items-center space-x-2 p-2 bg-red-500/20 border border-red-500/30 rounded">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <div className="text-sm text-red-400">
              Aucune version Java compatible détectée pour Minecraft {minecraftVersion}
            </div>
          </div>
        )}
      </div>
      
      <div className="mt-2 text-xs text-gray-500">
        Total: {versions.length} version{versions.length > 1 ? 's' : ''} Java détectée{versions.length > 1 ? 's' : ''}
      </div>
    </div>
  );
};

export default JavaVersionInfo;
