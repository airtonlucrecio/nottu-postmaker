import { Home, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-nottu-dark flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="mb-8">
          <div className="text-8xl font-bold text-nottu-purple mb-4">404</div>
          <h1 className="text-2xl font-bold text-white mb-2">Página não encontrada</h1>
          <p className="text-nottu-gray-400">
            A página que você está procurando não existe ou foi movida.
          </p>
        </div>
        
        <div className="space-y-4">
          <Link
            to="/"
            className="inline-flex items-center space-x-2 bg-nottu-purple hover:bg-nottu-purple-light text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            <Home className="w-5 h-5" />
            <span>Voltar ao Início</span>
          </Link>
          
          <div className="text-center">
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center space-x-2 text-nottu-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar à página anterior</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}