import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LanguageProvider } from './contexts/LanguageContext';
import { ThemeProvider, useThemeClasses } from './contexts/ThemeContext';
import TitleBar from './components/TitleBar';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Servers from './pages/Servers';
import Terminal from './pages/Terminal';
import Network from './pages/Network';
import Mods from './pages/Mods';
import Players from './pages/Players';
import Settings from './pages/Settings';
import Help from './pages/Help';
import JavaVersionWarning from './components/JavaVersionWarning';
import { AppConfig } from './types';

const AppContent: React.FC = () => {
  const { borderClass, glowClass } = useThemeClasses();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [config, setConfig] = useState<AppConfig>({
    language: 'fr',
    theme: 'dark',
    defaultRam: 2048,
    autoBackup: true,
    backupInterval: 24,
    playitEnabled: false,
  });

  useEffect(() => {
    // Charger la configuration depuis le stockage local
    const savedConfig = localStorage.getItem('nether-client-config');
    if (savedConfig) {
      setConfig(JSON.parse(savedConfig));
    }
  }, []);

  useEffect(() => {
    // Sauvegarder la configuration
    localStorage.setItem('nether-client-config', JSON.stringify(config));
  }, [config]);

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard setCurrentPage={setCurrentPage} />;
      case 'servers':
        return <Servers />;
      case 'terminal':
        return <Terminal />;
      case 'network':
        return <Network />;
      case 'mods':
        return <Mods />;
      case 'players':
        return <Players />;
      case 'settings':
        return <Settings config={config} setConfig={setConfig} />;
      case 'help':
        return <Help />;
      default:
        return <Dashboard setCurrentPage={setCurrentPage} />;
    }
  };

  return (
    <div className={`flex flex-col h-screen text-white rounded-xl border app-container ${borderClass} ${glowClass}`}>
      <TitleBar />
      
      <div className="flex flex-1 min-h-0 rounded-b-xl">
        <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
        
        <main className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide rounded-br-xl h-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {renderPage()}
            </motion.div>
          </AnimatePresence>
        </main>
        
        {/* Avertissement version Java */}
        <JavaVersionWarning />
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AppContent />
      </LanguageProvider>
    </ThemeProvider>
  );
};

export default App;
