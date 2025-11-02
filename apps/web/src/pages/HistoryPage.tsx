import { useState, useEffect } from 'react';
import { 
  Search,
  Download,
  Share2,
  Heart,
  MessageCircle,
  Repeat2,
  MoreHorizontal,
  Trash2,
  Edit3,
  Loader2
} from 'lucide-react';
import { cn } from '../utils/cn';
import { apiService } from '../services/api';

interface Post {
  id: string;
  imageUrl?: string;
  caption: string;
  hashtags: string[];
  createdAt: Date;
  status: 'completed' | 'draft' | 'scheduled';
  engagement?: {
    likes: number;
    comments: number;
    shares: number;
  };
}

export function HistoryPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'completed' | 'draft' | 'scheduled'>('all');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const rawHistory = await apiService.getHistory();
      const historyItems: any[] = Array.isArray(rawHistory)
        ? rawHistory
        : Array.isArray(rawHistory?.data)
        ? rawHistory.data
        : [];

      // Convert API data to Post format
      const convertedPosts: Post[] = historyItems.map((item: any) => {
        const imagePath =
          item?.publicAssets?.finalPath ||
          item?.metadata?.output?.public?.finalPath ||
          item?.metadata?.image?.url;

        return {
          id: item.id,
          caption: item.caption,
          hashtags: item.hashtags || [],
          createdAt: new Date(item.createdAt),
          status: 'completed' as const,
          imageUrl: apiService.resolveAssetUrl(imagePath) || item?.metadata?.image?.url,
          engagement: {
            likes: Math.floor(Math.random() * 300) + 50,
            comments: Math.floor(Math.random() * 50) + 5,
            shares: Math.floor(Math.random() * 20) + 2
          }
        };
      });

      setPosts(convertedPosts);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
      // Fallback to empty array on error
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.caption.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.hashtags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesFilter = selectedFilter === 'all' || post.status === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: Post['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'draft':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'scheduled':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      default:
        return 'bg-nottu-gray-700 text-nottu-gray-300 border-nottu-gray-600';
    }
  };

  const getStatusLabel = (status: Post['status']) => {
    switch (status) {
      case 'completed':
        return 'Publicado';
      case 'draft':
        return 'Rascunho';
      case 'scheduled':
        return 'Agendado';
      default:
        return status;
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 p-6 border-b border-nottu-gray-800">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Histórico de Posts</h1>
            <p className="text-nottu-gray-400 mt-1">
              Gerencie todos os seus posts criados
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-nottu-gray-400" />
              <input
                type="text"
                placeholder="Buscar posts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-nottu-gray-800 border border-nottu-gray-700 rounded-lg text-white placeholder-nottu-gray-400 focus:outline-none focus:border-nottu-purple focus:ring-1 focus:ring-nottu-purple"
              />
            </div>
            
            {/* Filter */}
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value as any)}
              className="px-4 py-2 bg-nottu-gray-800 border border-nottu-gray-700 rounded-lg text-white focus:outline-none focus:border-nottu-purple focus:ring-1 focus:ring-nottu-purple"
            >
              <option value="all">Todos</option>
              <option value="completed">Publicados</option>
              <option value="draft">Rascunhos</option>
              <option value="scheduled">Agendados</option>
            </select>
          </div>
        </div>
      </div>

      {/* Posts Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 text-nottu-purple animate-spin mx-auto mb-4" />
            <p className="text-nottu-gray-400">Carregando histórico...</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-nottu-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-nottu-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">
              {searchTerm ? 'Nenhum post encontrado' : 'Nenhum post ainda'}
            </h3>
            <p className="text-nottu-gray-400">
              {searchTerm 
                ? 'Tente ajustar sua busca ou filtros'
                : 'Comece criando seu primeiro post no chat'
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPosts.map((post) => (
              <div
                key={post.id}
                className="bg-nottu-gray-800 border border-nottu-gray-700 rounded-xl overflow-hidden hover:border-nottu-gray-600 transition-colors"
              >
                {/* Image */}
                {post.imageUrl && (
                  <div className="aspect-square bg-nottu-gray-700">
                    <img
                      src={post.imageUrl}
                      alt="Post"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                {/* Content */}
                <div className="p-4">
                  {/* Status */}
                  <div className="flex items-center justify-between mb-3">
                    <span className={cn(
                      'px-2 py-1 text-xs font-medium rounded-full border',
                      getStatusColor(post.status)
                    )}>
                      {getStatusLabel(post.status)}
                    </span>
                    
                    <button className="p-1 text-nottu-gray-400 hover:text-white transition-colors">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {/* Caption */}
                  <p className="text-white text-sm mb-3 line-clamp-3">
                    {post.caption}
                  </p>
                  
                  {/* Hashtags */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {post.hashtags.slice(0, 3).map((tag, index) => (
                      <span
                        key={index}
                        className="text-xs text-nottu-purple bg-nottu-purple/10 px-2 py-1 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                    {post.hashtags.length > 3 && (
                      <span className="text-xs text-nottu-gray-400">
                        +{post.hashtags.length - 3}
                      </span>
                    )}
                  </div>
                  
                  {/* Engagement */}
                  {post.engagement && (
                    <div className="flex items-center space-x-4 mb-3 text-sm text-nottu-gray-400">
                      <div className="flex items-center space-x-1">
                        <Heart className="w-4 h-4" />
                        <span>{post.engagement.likes}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MessageCircle className="w-4 h-4" />
                        <span>{post.engagement.comments}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Repeat2 className="w-4 h-4" />
                        <span>{post.engagement.shares}</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Date */}
                  <p className="text-xs text-nottu-gray-500 mb-4">
                    {post.createdAt.toLocaleDateString('pt-BR')}
                  </p>
                  
                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    <button className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-nottu-purple hover:bg-nottu-purple-light text-white text-sm rounded-lg transition-colors">
                      <Download className="w-4 h-4" />
                      <span>Baixar</span>
                    </button>
                    
                    <button className="p-2 text-nottu-gray-400 hover:text-white border border-nottu-gray-600 hover:border-nottu-gray-500 rounded-lg transition-colors">
                      <Share2 className="w-4 h-4" />
                    </button>
                    
                    <button className="p-2 text-nottu-gray-400 hover:text-white border border-nottu-gray-600 hover:border-nottu-gray-500 rounded-lg transition-colors">
                      <Edit3 className="w-4 h-4" />
                    </button>
                    
                    <button className="p-2 text-red-400 hover:text-red-300 border border-nottu-gray-600 hover:border-red-500 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}