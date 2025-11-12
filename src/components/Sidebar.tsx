import React from 'react';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  Server, 
  Terminal, 
  Network, 
  Package, 
  Users,
  Settings, 
  HelpCircle
} from 'lucide-react';
import logoImage from '../assets/logo.png';
import { useLanguage } from '../contexts/LanguageContext';

interface SidebarProps {
  currentPage: string;
  setCurrentPage: (page: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage, setCurrentPage }) => {
  const { t } = useLanguage();
  
  const menuItems = [
    { id: 'dashboard', label: t.sidebar.dashboard, icon: LayoutDashboard },
    { id: 'servers', label: t.sidebar.servers, icon: Server },
    { id: 'terminal', label: t.sidebar.terminal, icon: Terminal },
    { id: 'network', label: t.sidebar.network, icon: Network },
    { id: 'mods', label: t.sidebar.mods, icon: Package },
    { id: 'players', label: 'Joueurs', icon: Users },
    { id: 'settings', label: t.sidebar.settings, icon: Settings },
    { id: 'help', label: t.sidebar.help, icon: HelpCircle },
  ];

  return (
    <motion.div 
      initial={{ x: -300 }}
      animate={{ x: 0 }}
      className="w-64 sidebar flex flex-col rounded-bl-xl"
    >
      {/* Logo et titre */}
      <div className="p-6 border-b-2 border-purple-500/40 shadow-[0_2px_10px_rgba(168,85,247,0.2)]">
        <div className="flex items-center space-x-3">
          <img 
            src={logoImage} 
            alt="Nether Client Logo" 
            className="w-12 h-12 rounded-lg object-cover"
          />
          
          <div>
            <h1 className="text-xl font-bold text-white drop-shadow-lg">{t.sidebar.title}</h1>
            <p className="text-sm text-dark-600 drop-shadow-sm">{t.sidebar.subtitle}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          
          return (
            <motion.button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-300 ${
                isActive 
                  ? 'nav-item active' 
                  : 'nav-item'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
              
              {isActive && (
                <motion.div
                  className="ml-auto w-2 h-2 bg-white rounded-full"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </motion.button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t-2 border-purple-500/40 shadow-[0_-2px_10px_rgba(168,85,247,0.2)]">
        <div className="text-xs text-dark-600 text-center">
          <p className="drop-shadow-sm">Version 1.0.0</p>
          <p className="mt-1 drop-shadow-sm">© 2025 Nether Client</p>
        </div>
      </div>
    </motion.div>
  );
};

export default Sidebar;
