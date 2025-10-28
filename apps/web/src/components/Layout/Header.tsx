import { useLocation } from 'react-router-dom';
import { 
  Bell, 
  User, 
  ChevronDown,
  Crown
} from 'lucide-react';


const pageNames: Record<string, string> = {
  '/': 'Chat',
  '/history': 'Histórico',
  '/settings': 'Configurações',
  '/preview': 'Preview'
};

export function Header() {
  const location = useLocation();
  const currentPageName = pageNames[location.pathname] || 'Nottu';

  return (
    <header className="h-16 bg-nottu-gray-900 border-b border-nottu-gray-800 flex items-center justify-between px-6">
      {/* Page Title */}
      <div className="flex items-center space-x-4">
        <h1 className="text-xl font-semibold text-white">{currentPageName}</h1>
      </div>

      {/* Right Side */}
      <div className="flex items-center space-x-4">
        {/* Pro Badge */}
        <div className="flex items-center space-x-2 px-3 py-1.5 bg-gradient-to-r from-nottu-purple to-nottu-purple-light rounded-full">
          <Crown className="w-4 h-4 text-white" />
          <span className="text-sm font-medium text-white">Pro</span>
        </div>

        {/* Notifications */}
        <button className="relative p-2 text-nottu-gray-400 hover:text-white hover:bg-nottu-gray-800 rounded-lg transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-nottu-purple rounded-full"></span>
        </button>

        {/* User Menu */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-nottu-purple to-nottu-purple-light rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          <div className="hidden sm:block">
            <div className="text-sm font-medium text-white">Usuário</div>
            <div className="text-xs text-nottu-gray-400">user@nottu.com</div>
          </div>
          <ChevronDown className="w-4 h-4 text-nottu-gray-400" />
        </div>
      </div>
    </header>
  );
}