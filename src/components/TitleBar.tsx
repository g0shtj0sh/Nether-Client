import React from 'react';
import { appWindow } from '@tauri-apps/api/window';
import { invoke } from '@tauri-apps/api/tauri';
import { Minus, ChevronDown, X } from 'lucide-react';
import logo from '../assets/logo.png';
import { useThemeClasses } from '../contexts/ThemeContext';

const TitleBar: React.FC = () => {
  const { backgroundGradient, borderClass } = useThemeClasses();
  // Minimiser la fenêtre dans la barre des tâches
  const handleMinimize = async () => {
    try {
      await appWindow.minimize();
    } catch (error) {
      console.error('Erreur lors de la minimisation:', error);
    }
  };

  // Cacher dans le system tray (barre des tâches mais invisible)
  const handleHide = async () => {
    try {
      await appWindow.hide();
    } catch (error) {
      console.error('Erreur lors du masquage:', error);
    }
  };

  // Fermer complètement l'application (comme terminer la tâche)
  const handleClose = async () => {
    try {
      await invoke('force_quit');
    } catch (error) {
      console.error('Erreur lors de la fermeture:', error);
    }
  };

  return (
    <div
      data-tauri-drag-region
      className={`h-11 bg-gradient-to-r ${backgroundGradient} flex items-center select-none border-b ${borderClass} shadow-lg rounded-t-xl`}
    >
      {/* Logo et titre */}
      <div className="flex items-center gap-3 pointer-events-none pl-4">
        <img 
          src={logo} 
          alt="Nether Client Logo" 
          className="w-7 h-7 object-contain drop-shadow-lg"
        />
        <div className="flex flex-col">
          <span className="text-sm font-bold text-white tracking-wide">Nether Client</span>
          <span className="text-[10px] text-gray-400/80">Minecraft Server Manager</span>
        </div>
      </div>

      {/* Spacer pour pousser les boutons à droite */}
      <div className="flex-1"></div>

      {/* Boutons de contrôle - collés à droite sans padding */}
      <div className="flex items-center pointer-events-auto">
        {/* Bouton Minimiser (-) */}
        <button
          onClick={handleMinimize}
          className="h-11 w-12 flex items-center justify-center hover:bg-white/10 transition-all duration-200 group"
          title="Minimiser dans la barre des tâches"
        >
          <Minus className="w-4 h-4 text-gray-300 group-hover:text-white transition-colors" strokeWidth={2.5} />
        </button>

        {/* Bouton Cacher (flèche bas) */}
        <button
          onClick={handleHide}
          className="h-11 w-12 flex items-center justify-center hover:bg-white/10 transition-all duration-200 group"
          title="Cacher dans le system tray"
        >
          <ChevronDown className="w-4 h-4 text-gray-300 group-hover:text-white transition-colors" strokeWidth={2.5} />
        </button>

        {/* Bouton Fermer (X) */}
        <button
          onClick={handleClose}
          className="h-11 w-12 flex items-center justify-center hover:bg-red-500/90 transition-all duration-200 group"
          title="Fermer l'application"
        >
          <X className="w-4 h-4 text-gray-300 group-hover:text-white transition-colors" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
};

export default TitleBar;

