import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, translations } from '../i18n/translations';
import { Globe, Check } from 'lucide-react';

interface LanguageContextType {
  language: Language;
  direction: 'ltr' | 'rtl';
  setLanguage: (lang: Language) => void;
  t: (key: string, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('apex_pos_language');
    if (saved === 'ur' || saved === 'ar' || saved === 'en') {
      return saved;
    }
    return 'en';
  });

  const direction: 'ltr' | 'rtl' = (language === 'ur' || language === 'ar') ? 'rtl' : 'ltr';

  useEffect(() => {
    localStorage.setItem('apex_pos_language', language);
    document.documentElement.dir = direction;
    document.documentElement.lang = language;
    if (direction === 'rtl') {
      document.body.classList.add('rtl-layout');
    } else {
      document.body.classList.remove('rtl-layout');
    }
  }, [language, direction]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string, fallback?: string): string => {
    const item = translations[key];
    if (item && item[language]) {
      return item[language];
    }
    return fallback || key;
  };

  return (
    <LanguageContext.Provider value={{ language, direction, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

// Toggle component that can be used in Header, Login screen, and Settings
interface LanguageToggleProps {
  variant?: 'pill' | 'dropdown' | 'buttons';
  className?: string;
}

export const LanguageToggle: React.FC<LanguageToggleProps> = ({ variant = 'buttons', className = '' }) => {
  const { language, setLanguage, t } = useLanguage();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const languages: Array<{ code: Language; label: string; flag: string }> = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'ur', label: 'اردو', flag: '🇵🇰' },
    { code: 'ar', label: 'العربية', flag: '🇸🇦' },
  ];

  if (variant === 'pill') {
    return (
      <div className={`inline-flex items-center bg-slate-900 border border-slate-700/80 rounded-xl p-1 text-xs select-none ${className}`}>
        {languages.map(l => (
          <button
            key={l.code}
            type="button"
            onClick={() => setLanguage(l.code)}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
              language === l.code
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/60'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
            }`}
          >
            <span>{l.flag}</span>
            <span>{l.label}</span>
          </button>
        ))}
      </div>
    );
  }

  if (variant === 'dropdown') {
    const current = languages.find(l => l.code === language) || languages[0];
    return (
      <div className={`relative inline-block ${className}`}>
        <button
          type="button"
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900 border border-slate-700 hover:border-slate-600 rounded-lg text-xs font-semibold text-slate-200 transition-colors"
        >
          <Globe className="w-3.5 h-3.5 text-emerald-400" />
          <span>{current.flag}</span>
          <span className="font-bold">{current.label}</span>
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 mt-1.5 w-36 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-1 z-50 animate-in fade-in">
            {languages.map(l => (
              <button
                key={l.code}
                type="button"
                onClick={() => {
                  setLanguage(l.code);
                  setDropdownOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  language === l.code
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>{l.flag}</span>
                  <span>{l.label}</span>
                </div>
                {language === l.code && <Check className="w-3.5 h-3.5" />}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Default 'buttons' variant
  return (
    <div className={`inline-flex items-center bg-slate-900/90 border border-slate-700/80 rounded-lg p-0.5 text-xs select-none ${className}`}>
      {languages.map(l => (
        <button
          key={l.code}
          type="button"
          onClick={() => setLanguage(l.code)}
          className={`px-2.5 py-1 rounded-md font-bold transition-all flex items-center gap-1 ${
            language === l.code
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span className="text-[11px]">{l.flag}</span>
          <span>{l.label}</span>
        </button>
      ))}
    </div>
  );
};
