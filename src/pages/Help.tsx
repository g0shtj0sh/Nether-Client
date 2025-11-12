import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Server,
  Terminal as TerminalIcon,
  Network,
  Package,
  AlertTriangle,
  Mic
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const Help: React.FC = () => {
  const { t } = useLanguage();
  const [activeSection, setActiveSection] = useState('getting-started');

  const sections = [
    { id: 'getting-started', label: t.help.gettingStarted, icon: BookOpen },
    { id: 'create-server', label: t.help.createServer, icon: Server },
    { id: 'manage-server', label: t.help.manageServer, icon: Server },
    { id: 'terminal', label: t.help.terminal, icon: TerminalIcon },
    { id: 'network', label: t.help.network, icon: Network },
    { id: 'voice-chat', label: t.help.voiceChat, icon: Mic },
    { id: 'mods', label: t.help.mods, icon: Package },
    { id: 'troubleshooting', label: t.help.troubleshooting, icon: AlertTriangle },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'getting-started':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-white mb-4 drop-shadow-lg">
                {t.help.gettingStartedContent.title}
              </h2>
              <p className="text-dark-400 text-lg leading-relaxed drop-shadow-sm">
                {t.help.gettingStartedContent.welcome}
              </p>
            </div>

            <div className="grid gap-6 mt-8">
              <div className="card">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-primary-500/20 rounded-lg flex items-center justify-center">
                    <span className="text-2xl font-bold text-primary-400">1</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">
                      {t.help.gettingStartedContent.step1Title}
                    </h3>
                    <p className="text-dark-400 leading-relaxed">
                      {t.help.gettingStartedContent.step1Desc}
                    </p>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-primary-500/20 rounded-lg flex items-center justify-center">
                    <span className="text-2xl font-bold text-primary-400">2</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">
                      {t.help.gettingStartedContent.step2Title}
                    </h3>
                    <p className="text-dark-400 leading-relaxed">
                      {t.help.gettingStartedContent.step2Desc}
                    </p>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-primary-500/20 rounded-lg flex items-center justify-center">
                    <span className="text-2xl font-bold text-primary-400">3</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">
                      {t.help.gettingStartedContent.step3Title}
                    </h3>
                    <p className="text-dark-400 leading-relaxed">
                      {t.help.gettingStartedContent.step3Desc}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'create-server':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-white mb-4 drop-shadow-lg">
                {t.help.createServerContent.title}
              </h2>
              <p className="text-dark-400 text-lg leading-relaxed drop-shadow-sm">
                {t.help.createServerContent.intro}
              </p>
            </div>

            <div className="grid gap-6 mt-8">
              <div className="card">
                <h3 className="text-xl font-semibold text-white mb-3">
                  {t.help.createServerContent.vanillaTitle}
                </h3>
                <p className="text-dark-400 leading-relaxed">
                  {t.help.createServerContent.vanillaDesc}
                </p>
              </div>

              <div className="card">
                <h3 className="text-xl font-semibold text-white mb-3">
                  {t.help.createServerContent.forgeTitle}
                </h3>
                <p className="text-dark-400 leading-relaxed">
                  {t.help.createServerContent.forgeDesc}
                </p>
              </div>

              <div className="card">
                <h3 className="text-xl font-semibold text-white mb-3">
                  {t.help.createServerContent.neoforgeTitle}
                </h3>
                <p className="text-dark-400 leading-relaxed">
                  {t.help.createServerContent.neoforgeDesc}
                </p>
              </div>
            </div>
          </div>
        );

      case 'manage-server':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-white mb-4 drop-shadow-lg">
                {t.help.manageServerContent.title}
              </h2>
            </div>

            <div className="grid gap-6">
              <div className="card">
                <h3 className="text-xl font-semibold text-white mb-3">
                  {t.help.manageServerContent.startStop}
                </h3>
                <p className="text-dark-400 leading-relaxed">
                  {t.help.manageServerContent.startStopDesc}
                </p>
              </div>

              <div className="card">
                <h3 className="text-xl font-semibold text-white mb-3">
                  {t.help.manageServerContent.configure}
                </h3>
                <p className="text-dark-400 leading-relaxed">
                  {t.help.manageServerContent.configureDesc}
                </p>
              </div>

              <div className="card">
                <h3 className="text-xl font-semibold text-white mb-3">
                  {t.help.manageServerContent.whitelist}
                </h3>
                <p className="text-dark-400 leading-relaxed">
                  {t.help.manageServerContent.whitelistDesc}
                </p>
              </div>
            </div>
          </div>
        );

      case 'terminal':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-white mb-4 drop-shadow-lg">
                {t.help.terminalContent.title}
              </h2>
              <p className="text-dark-400 text-lg leading-relaxed drop-shadow-sm">
                {t.help.terminalContent.intro}
              </p>
            </div>

            <div className="card bg-dark-800">
              <h3 className="text-xl font-semibold text-white mb-4">
                {t.help.terminalContent.commands}
              </h3>
              
              <div className="space-y-4">
                <div className="bg-dark-700 rounded-lg p-4">
                  <code className="text-primary-400 font-mono text-lg">
                    {t.help.terminalContent.stopCmd}
                  </code>
                  <p className="text-dark-400 mt-2">
                    {t.help.terminalContent.stopDesc}
                  </p>
                </div>

                <div className="bg-dark-700 rounded-lg p-4">
                  <code className="text-primary-400 font-mono text-lg">
                    {t.help.terminalContent.opCmd}
                  </code>
                  <p className="text-dark-400 mt-2">
                    {t.help.terminalContent.opDesc}
                  </p>
                </div>

                <div className="bg-dark-700 rounded-lg p-4">
                  <code className="text-primary-400 font-mono text-lg">
                    {t.help.terminalContent.whitelistCmd}
                  </code>
                  <p className="text-dark-400 mt-2">
                    {t.help.terminalContent.whitelistDesc}
                  </p>
                </div>

                <div className="bg-dark-700 rounded-lg p-4">
                  <code className="text-primary-400 font-mono text-lg">
                    {t.help.terminalContent.sayCmd}
                  </code>
                  <p className="text-dark-400 mt-2">
                    {t.help.terminalContent.sayDesc}
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'network':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-white mb-4 drop-shadow-lg">
                {t.help.networkContent.title}
              </h2>
              <p className="text-dark-400 text-lg leading-relaxed drop-shadow-sm">
                {t.help.networkContent.intro}
              </p>
            </div>

            <div className="card bg-primary-500/10 border-primary-500">
              <h3 className="text-xl font-semibold text-white mb-4">
                {t.help.networkContent.playitTitle}
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary-500/20 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-primary-400">1</span>
                  </div>
                  <p className="text-dark-400 leading-relaxed pt-1">
                    {t.help.networkContent.playitStep1}
                  </p>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary-500/20 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-primary-400">2</span>
                  </div>
                  <p className="text-dark-400 leading-relaxed pt-1">
                    {t.help.networkContent.playitStep2}
                  </p>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary-500/20 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-primary-400">3</span>
                  </div>
                  <p className="text-dark-400 leading-relaxed pt-1">
                    {t.help.networkContent.playitStep3}
                  </p>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary-500/20 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-primary-400">4</span>
                  </div>
                  <p className="text-dark-400 leading-relaxed pt-1">
                    {t.help.networkContent.playitStep4}
                  </p>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 className="text-xl font-semibold text-white mb-3">
                {t.help.networkContent.alternativesTitle}
              </h3>
              <p className="text-dark-400 leading-relaxed">
                {t.help.networkContent.alternativesDesc}
              </p>
            </div>

            <div className="card bg-primary-500/10 border-primary-500">
              <h3 className="text-xl font-semibold text-white mb-4">
                📹 Tutoriel Vidéo - Configuration du Système de Tunnel
              </h3>
              <p className="text-dark-400 mb-4 leading-relaxed">
                Regardez ce tutoriel vidéo pour apprendre à configurer le système de tunnel étape par étape :
              </p>
              <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                <iframe
                  className="absolute top-0 left-0 w-full h-full rounded-lg"
                  src="https://www.youtube.com/embed/RkPnrH6A_mg"
                  title="Tutoriel Configuration Système de Tunnel"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          </div>
        );

      case 'voice-chat':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-white mb-4 drop-shadow-lg">
                {t.help.voiceChatContent.title}
              </h2>
              <p className="text-dark-400 text-lg leading-relaxed drop-shadow-sm">
                {t.help.voiceChatContent.intro}
              </p>
            </div>

            <div className="card bg-primary-500/10 border-primary-500">
              <h3 className="text-xl font-semibold text-white mb-4">
                📹 Tutoriel Vidéo - Configuration du Voice Chat
              </h3>
              <p className="text-dark-400 mb-4 leading-relaxed">
                {t.help.voiceChatContent.videoDescription}
              </p>
              <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                <iframe
                  className="absolute top-0 left-0 w-full h-full rounded-lg"
                  src="https://www.youtube.com/embed/RdkPRQZTGSw"
                  title="Tutoriel Configuration Voice Chat"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          </div>
        );

      case 'mods':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-white mb-4 drop-shadow-lg">
                {t.help.modsContent.title}
              </h2>
              <p className="text-dark-400 text-lg leading-relaxed drop-shadow-sm">
                {t.help.modsContent.intro}
              </p>
            </div>

            <div className="grid gap-6">
              <div className="card">
                <h3 className="text-xl font-semibold text-white mb-3">
                  {t.help.modsContent.addModTitle}
                </h3>
                <p className="text-dark-400 leading-relaxed">
                  {t.help.modsContent.addModDesc}
                </p>
              </div>

              <div className="card">
                <h3 className="text-xl font-semibold text-white mb-3">
                  {t.help.modsContent.compatibilityTitle}
                </h3>
                <p className="text-dark-400 leading-relaxed">
                  {t.help.modsContent.compatibilityDesc}
                </p>
              </div>

              <div className="card">
                <h3 className="text-xl font-semibold text-white mb-3">
                  {t.help.modsContent.troubleshootTitle}
                </h3>
                <p className="text-dark-400 leading-relaxed">
                  {t.help.modsContent.troubleshootDesc}
                </p>
              </div>
            </div>
          </div>
        );

      case 'troubleshooting':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-white mb-4 drop-shadow-lg">
                {t.help.troubleshootingContent.title}
              </h2>
            </div>

            <div className="grid gap-6">
              <div className="card bg-red-500/10 border-red-500/50">
                <h3 className="text-xl font-semibold text-white mb-3">
                  ❌ {t.help.troubleshootingContent.issue1}
                </h3>
                <p className="text-dark-400 leading-relaxed">
                  ✅ {t.help.troubleshootingContent.solution1}
                </p>
              </div>

              <div className="card bg-red-500/10 border-red-500/50">
                <h3 className="text-xl font-semibold text-white mb-3">
                  ❌ {t.help.troubleshootingContent.issue2}
                </h3>
                <p className="text-dark-400 leading-relaxed">
                  ✅ {t.help.troubleshootingContent.solution2}
                </p>
              </div>

              <div className="card bg-red-500/10 border-red-500/50">
                <h3 className="text-xl font-semibold text-white mb-3">
                  ❌ {t.help.troubleshootingContent.issue3}
                </h3>
                <p className="text-dark-400 leading-relaxed">
                  ✅ {t.help.troubleshootingContent.solution3}
                </p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex overflow-y-auto overflow-x-hidden scrollbar-hide">
      {/* Sidebar */}
      <div className="w-64 sidebar border-r border-dark-400 p-4">
        <h2 className="text-xl font-bold text-white mb-6 drop-shadow-lg">{t.help.title}</h2>
        <p className="text-sm text-dark-600 mb-6 drop-shadow-sm">{t.help.subtitle}</p>
        
        <nav className="space-y-2">
          {sections.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            
            return (
              <motion.button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-300 ${
                  isActive
                    ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white'
                    : 'text-dark-400 hover:text-white hover:bg-dark-700'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium text-sm">{section.label}</span>
              </motion.button>
            );
          })}
        </nav>
      </div>

      {/* Contenu */}
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-4xl">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default Help;

