import React, { createContext, useContext, useState, useEffect } from 'react';
import { Translation, Language, getTranslation } from '../i18n/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translation;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Fonction pour détecter la langue basée sur la localisation
const detectLanguageFromLocation = async (): Promise<Language> => {
  try {
    const response = await fetch('https://wtfismyip.com/json');
    if (!response.ok) {
      throw new Error('Failed to fetch location');
    }
    
    const data = await response.json();
    const countryCode = data.YourFuckingCountryCode || data.CountryCode || '';
    
    // Mapper les codes pays aux langues supportées
    const countryToLanguage: Record<string, Language> = {
      // Français
      'FR': 'fr', // France
      'BE': 'fr', // Belgique
      'CH': 'fr', // Suisse
      'CA': 'fr', // Canada (francophone)
      'LU': 'fr', // Luxembourg
      'MC': 'fr', // Monaco
      // Anglais
      'US': 'en', // États-Unis
      'GB': 'en', // Royaume-Uni
      'AU': 'en', // Australie
      'NZ': 'en', // Nouvelle-Zélande
      'IE': 'en', // Irlande
      'ZA': 'en', // Afrique du Sud
      'SG': 'en', // Singapour
      'MY': 'en', // Malaisie
      'PH': 'en', // Philippines
      'IN': 'en', // Inde
      'PK': 'en', // Pakistan
      'BD': 'en', // Bangladesh
      'NG': 'en', // Nigeria
      'KE': 'en', // Kenya
      'GH': 'en', // Ghana
      'TZ': 'en', // Tanzanie
      'UG': 'en', // Ouganda
      'ZW': 'en', // Zimbabwe
      'ZM': 'en', // Zambie
      'MW': 'en', // Malawi
      'RW': 'en', // Rwanda
      'ET': 'en', // Éthiopie
      'JM': 'en', // Jamaïque
      'TT': 'en', // Trinité-et-Tobago
      'BB': 'en', // Barbade
      'BS': 'en', // Bahamas
      'BZ': 'en', // Belize
      'GY': 'en', // Guyana
      'SR': 'en', // Suriname
      'FJ': 'en', // Fidji
      'PG': 'en', // Papouasie-Nouvelle-Guinée
      'SB': 'en', // Îles Salomon
      'VU': 'en', // Vanuatu
      'KI': 'en', // Kiribati
      'TV': 'en', // Tuvalu
      'NR': 'en', // Nauru
      'PW': 'en', // Palaos
      'FM': 'en', // Micronésie
      'MH': 'en', // Îles Marshall
    };
    
    // Si le pays est dans la liste, utiliser la langue correspondante
    if (countryCode && countryToLanguage[countryCode]) {
      return countryToLanguage[countryCode];
    }
    
    // Par défaut, retourner français
    return 'fr';
  } catch (error) {
    console.warn('Erreur lors de la détection de la langue:', error);
    // En cas d'erreur, retourner français par défaut
    return 'fr';
  }
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('nether-client-language');
    return (saved as Language) || 'fr';
  });

  const [t, setT] = useState<Translation>(getTranslation(language));
  const [isDetecting, setIsDetecting] = useState(false);

  // Détecter la langue au premier démarrage si aucune n'est sauvegardée
  useEffect(() => {
    const saved = localStorage.getItem('nether-client-language');
    const hasDetectedBefore = localStorage.getItem('nether-client-language-detected');
    
    // Si aucune langue n'est sauvegardée et qu'on n'a pas encore détecté
    if (!saved && !hasDetectedBefore && !isDetecting) {
      setIsDetecting(true);
      detectLanguageFromLocation()
        .then((detectedLang) => {
          setLanguageState(detectedLang);
          localStorage.setItem('nether-client-language', detectedLang);
          localStorage.setItem('nether-client-language-detected', 'true');
          setIsDetecting(false);
        })
        .catch((error) => {
          console.warn('Erreur lors de la détection automatique de la langue:', error);
          setIsDetecting(false);
        });
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('nether-client-language', language);
    setT(getTranslation(language));
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

