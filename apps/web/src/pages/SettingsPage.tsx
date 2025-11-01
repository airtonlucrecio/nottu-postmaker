import { useState, useEffect } from 'react';
import {
  User,
  Bell,
  Shield,
  Palette,
  Save,
  Eye,
  EyeOff
} from 'lucide-react';
import { cn } from '../utils/cn';
import { apiService } from '../services/api';
import { toast } from 'sonner';

interface SettingsSection {
  id: string;
  title: string;
  icon: any;
  description: string;
}

export function SettingsPage() {
  const [activeSection, setActiveSection] = useState('profile');
  const [showApiKey, setShowApiKey] = useState(false);
  const [settings, setSettings] = useState({
    profile: {
      name: 'Airton Lucrécio',
      email: 'contato@nottu.com',
      bio: 'Criador e apaixonado por tecnologia'
    },
    preferences: {
      language: 'pt',
      theme: 'dark',
      defaultTone: 'casual',
      includeHashtags: true,
      includeEmojis: true,
      primaryColor: '#4E3FE2',
      secondaryColor: '#0A0A0F',
      accentColor: '#8B5CF6',
      headingFont: 'Inter',
      bodyFont: 'Inter'
    },
    notifications: {
      emailNotifications: true,
      pushNotifications: false,
      weeklyReport: true
    },
    api: {
      apiKey: 'dev-api-key-nottu-2024',
      usage: {
        current: 150,
        limit: 1000
      }
    }
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const apiSettings = await apiService.getSettings();
      
      // Merge API settings with local state
      setSettings(prev => ({
        ...prev,
        preferences: {
          ...prev.preferences,
          ...apiSettings.colors && {
            primaryColor: apiSettings.colors.primary,
            secondaryColor: apiSettings.colors.secondary,
            accentColor: apiSettings.colors.accent
          },
          ...apiSettings.fonts && {
            headingFont: apiSettings.fonts.heading,
            bodyFont: apiSettings.fonts.body
          }
        }
      }));
    } catch (error) {
      toast.error('Erro ao carregar configurações');
    }
  };



  const sections: SettingsSection[] = [
    {
      id: 'profile',
      title: 'Perfil',
      icon: User,
      description: 'Informações pessoais e conta'
    },
    {
      id: 'preferences',
      title: 'Preferências',
      icon: Palette,
      description: 'Configurações de geração de posts'
    },
    {
      id: 'notifications',
      title: 'Notificações',
      icon: Bell,
      description: 'Configurações de notificações'
    },
    {
      id: 'api',
      title: 'API',
      icon: Shield,
      description: 'Chaves de API e uso'
    }
  ];

  const handleSave = () => {
    // Implementar salvamento das configurações
  };

  const updateSetting = (section: string, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [key]: value
      }
    }));
  };

  const renderProfileSection = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Nome
        </label>
        <input
          type="text"
          value={settings.profile.name}
          onChange={(e) => updateSetting('profile', 'name', e.target.value)}
          className="w-full px-4 py-3 bg-nottu-gray-800 border border-nottu-gray-700 rounded-lg text-white focus:outline-none focus:border-nottu-purple focus:ring-1 focus:ring-nottu-purple"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Email
        </label>
        <input
          type="email"
          value={settings.profile.email}
          onChange={(e) => updateSetting('profile', 'email', e.target.value)}
          className="w-full px-4 py-3 bg-nottu-gray-800 border border-nottu-gray-700 rounded-lg text-white focus:outline-none focus:border-nottu-purple focus:ring-1 focus:ring-nottu-purple"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Bio
        </label>
        <textarea
          value={settings.profile.bio}
          onChange={(e) => updateSetting('profile', 'bio', e.target.value)}
          rows={3}
          className="w-full px-4 py-3 bg-nottu-gray-800 border border-nottu-gray-700 rounded-lg text-white focus:outline-none focus:border-nottu-purple focus:ring-1 focus:ring-nottu-purple resize-none"
        />
      </div>
    </div>
  );

  const renderPreferencesSection = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Idioma
        </label>
        <select
          value={settings.preferences.language}
          onChange={(e) => updateSetting('preferences', 'language', e.target.value)}
          className="w-full px-4 py-3 bg-nottu-gray-800 border border-nottu-gray-700 rounded-lg text-white focus:outline-none focus:border-nottu-purple focus:ring-1 focus:ring-nottu-purple"
        >
          <option value="pt">Português</option>
          <option value="en">English</option>
          <option value="es">Español</option>
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Tom padrão
        </label>
        <select
          value={settings.preferences.defaultTone}
          onChange={(e) => updateSetting('preferences', 'defaultTone', e.target.value)}
          className="w-full px-4 py-3 bg-nottu-gray-800 border border-nottu-gray-700 rounded-lg text-white focus:outline-none focus:border-nottu-purple focus:ring-1 focus:ring-nottu-purple"
        >
          <option value="casual">Casual</option>
          <option value="professional">Profissional</option>
          <option value="creative">Criativo</option>
          <option value="formal">Formal</option>
        </select>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-white font-medium">Incluir hashtags</h4>
            <p className="text-sm text-nottu-gray-400">Adicionar hashtags relevantes automaticamente</p>
          </div>
          <button
            onClick={() => updateSetting('preferences', 'includeHashtags', !settings.preferences.includeHashtags)}
            className={cn(
              'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
              settings.preferences.includeHashtags ? 'bg-nottu-purple' : 'bg-nottu-gray-600'
            )}
          >
            <span
              className={cn(
                'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                settings.preferences.includeHashtags ? 'translate-x-6' : 'translate-x-1'
              )}
            />
          </button>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-white font-medium">Incluir emojis</h4>
            <p className="text-sm text-nottu-gray-400">Adicionar emojis para tornar o conteúdo mais expressivo</p>
          </div>
          <button
            onClick={() => updateSetting('preferences', 'includeEmojis', !settings.preferences.includeEmojis)}
            className={cn(
              'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
              settings.preferences.includeEmojis ? 'bg-nottu-purple' : 'bg-nottu-gray-600'
            )}
          >
            <span
              className={cn(
                'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                settings.preferences.includeEmojis ? 'translate-x-6' : 'translate-x-1'
              )}
            />
          </button>
        </div>
      </div>
    </div>
  );

  const renderNotificationsSection = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-white font-medium">Notificações por email</h4>
          <p className="text-sm text-nottu-gray-400">Receber atualizações importantes por email</p>
        </div>
        <button
          onClick={() => updateSetting('notifications', 'emailNotifications', !settings.notifications.emailNotifications)}
          className={cn(
            'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
            settings.notifications.emailNotifications ? 'bg-nottu-purple' : 'bg-nottu-gray-600'
          )}
        >
          <span
            className={cn(
              'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
              settings.notifications.emailNotifications ? 'translate-x-6' : 'translate-x-1'
            )}
          />
        </button>
      </div>
      
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-white font-medium">Notificações push</h4>
          <p className="text-sm text-nottu-gray-400">Receber notificações no navegador</p>
        </div>
        <button
          onClick={() => updateSetting('notifications', 'pushNotifications', !settings.notifications.pushNotifications)}
          className={cn(
            'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
            settings.notifications.pushNotifications ? 'bg-nottu-purple' : 'bg-nottu-gray-600'
          )}
        >
          <span
            className={cn(
              'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
              settings.notifications.pushNotifications ? 'translate-x-6' : 'translate-x-1'
            )}
          />
        </button>
      </div>
      
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-white font-medium">Relatório semanal</h4>
          <p className="text-sm text-nottu-gray-400">Receber resumo semanal de atividades</p>
        </div>
        <button
          onClick={() => updateSetting('notifications', 'weeklyReport', !settings.notifications.weeklyReport)}
          className={cn(
            'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
            settings.notifications.weeklyReport ? 'bg-nottu-purple' : 'bg-nottu-gray-600'
          )}
        >
          <span
            className={cn(
              'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
              settings.notifications.weeklyReport ? 'translate-x-6' : 'translate-x-1'
            )}
          />
        </button>
      </div>
    </div>
  );

  const renderApiSection = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Chave da API
        </label>
        <div className="relative">
          <input
            type={showApiKey ? 'text' : 'password'}
            value={settings.api.apiKey}
            readOnly
            className="w-full px-4 py-3 pr-12 bg-nottu-gray-800 border border-nottu-gray-700 rounded-lg text-white focus:outline-none"
          />
          <button
            onClick={() => setShowApiKey(!showApiKey)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-nottu-gray-400 hover:text-white transition-colors"
          >
            {showApiKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        <p className="text-sm text-nottu-gray-400 mt-2">
          Use esta chave para acessar a API do Nottu
        </p>
      </div>
      
      <div className="bg-nottu-gray-800 border border-nottu-gray-700 rounded-lg p-4">
        <h4 className="text-white font-medium mb-3">Uso da API</h4>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-nottu-gray-400">Requisições este mês</span>
            <span className="text-white">{settings.api.usage.current} / {settings.api.usage.limit}</span>
          </div>
          <div className="w-full bg-nottu-gray-700 rounded-full h-2">
            <div 
              className="bg-nottu-purple h-2 rounded-full transition-all duration-300"
              style={{ width: `${(settings.api.usage.current / settings.api.usage.limit) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'profile':
        return renderProfileSection();
      case 'preferences':
        return renderPreferencesSection();
      case 'notifications':
        return renderNotificationsSection();
      case 'api':
        return renderApiSection();
      default:
        return renderProfileSection();
    }
  };

  return (
    <div className="h-full flex">
      {/* Sidebar */}
      <div className="w-80 bg-nottu-gray-900 border-r border-nottu-gray-800 p-6">
        <h1 className="text-2xl font-bold text-white mb-8">Configurações</h1>
        
        <nav className="space-y-2">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={cn(
                'w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors',
                activeSection === section.id
                  ? 'bg-nottu-purple text-white'
                  : 'text-nottu-gray-300 hover:bg-nottu-gray-800 hover:text-white'
              )}
            >
              <section.icon className="w-5 h-5" />
              <div>
                <div className="font-medium">{section.title}</div>
                <div className="text-xs opacity-75">{section.description}</div>
              </div>
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 p-8">
        <div className="max-w-2xl">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">
              {sections.find(s => s.id === activeSection)?.title}
            </h2>
            <p className="text-nottu-gray-400">
              {sections.find(s => s.id === activeSection)?.description}
            </p>
          </div>

          {renderContent()}

          <div className="mt-8 pt-6 border-t border-nottu-gray-800">
            <button
              onClick={handleSave}
              className="flex items-center space-x-2 bg-nottu-purple hover:bg-nottu-purple-light text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              <Save className="w-5 h-5" />
              <span>Salvar Alterações</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}