import { NavLink } from 'react-router-dom';
import { 
  MessageSquare, 
  History, 
  Settings, 
  Sparkles
} from 'lucide-react';
import { cn } from '../../utils/cn';

const navigation = [
  {
    name: 'Chat',
    href: '/',
    icon: MessageSquare,
    description: 'Gerar posts com IA'
  },
  {
    name: 'Histórico',
    href: '/history',
    icon: History,
    description: 'Posts anteriores'
  },
  {
    name: 'Configurações',
    href: '/settings',
    icon: Settings,
    description: 'Preferências e API'
  }
];

export function Sidebar() {
  return (
    <div className="w-64 bg-nottu-gray-900 border-r border-nottu-gray-800 flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-nottu-gray-800">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-nottu-purple to-nottu-purple-light rounded-lg flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Nottu</h1>
            <p className="text-xs text-nottu-gray-400">PostMaker</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6">
        <div className="space-y-2">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  'flex items-center space-x-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-nottu-purple text-white'
                    : 'text-nottu-gray-300 hover:text-white hover:bg-nottu-gray-800'
                )
              }
            >
              <item.icon className="w-5 h-5" />
              <div className="flex-1">
                <div>{item.name}</div>
                <div className="text-xs text-nottu-gray-400">{item.description}</div>
              </div>
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-nottu-gray-800">
        <div className="flex items-center space-x-3 p-3 bg-nottu-gray-800 rounded-lg">
          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
          <div className="flex-1">
            <div className="text-sm font-medium text-white">Sistema Online</div>
            <div className="text-xs text-nottu-gray-400">Todos os serviços funcionando</div>
          </div>
        </div>
      </div>
    </div>
  );
}