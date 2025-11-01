import { useState, useRef, useEffect } from 'react';
import { 
  Send,
  Loader2,
  Sparkles,
  Image as ImageIcon,
  Heart,
  Paperclip
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { cn } from '../utils/cn';
import { ChatMessage } from '../components/Chat/ChatMessage';
import { apiService } from '../services/api';

interface Message {
  id: string;
  content: string;
  type: 'user' | 'assistant';
  timestamp: Date;
}

export function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      type: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const topic = inputValue;
    setInputValue('');

    try {
      setIsLoading(true);
      
      // Generate post via API
      const response = await apiService.generatePost({
        topic,
        includeImage: true,
        imageProvider: 'dalle'
      });

      if (response.jobId) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: `Post sendo gerado! 🚀 Acompanhe o progresso na página de preview.`,
          type: 'assistant',
          timestamp: new Date()
        };

        setMessages(prev => [...prev, assistantMessage]);
        
        // Navigate to preview page
        setTimeout(() => {
          navigate(`/preview/${response.jobId}`);
        }, 1500);
        
        toast.success('Post iniciado com sucesso!');
      } else {
        throw new Error('Resposta inválida da API');
      }
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Desculpe, ocorreu um erro ao gerar o post. Tente novamente.',
        type: 'assistant',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
      toast.error('Erro ao gerar post');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  return (
    <div className="h-full flex flex-col bg-nottu-dark">
      {/* Chat Header */}
      <div className="flex-shrink-0 p-6 border-b border-nottu-gray-800">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-nottu-purple to-nottu-purple-light rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Crie posts incríveis com IA
            </h1>
            <p className="text-nottu-gray-400 max-w-2xl mx-auto">
              Descreva o que você quer postar e nossa IA criará uma legenda envolvente 
              com hashtags relevantes e uma imagem personalizada.
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-6">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {[
                  {
                    icon: ImageIcon,
                    title: 'Posts com imagem',
                    description: 'Gere posts com imagens personalizadas'
                  },
                  {
                    icon: Sparkles,
                    title: 'Legendas criativas',
                    description: 'Textos envolventes e autênticos'
                  },
                  {
                    icon: Heart,
                    title: 'Hashtags relevantes',
                    description: 'Maximize o alcance dos seus posts'
                  }
                ].map((feature, index) => (
                  <div
                    key={index}
                    className="p-4 bg-nottu-gray-900 border border-nottu-gray-800 rounded-xl"
                  >
                    <feature.icon className="w-8 h-8 text-nottu-purple mb-3" />
                    <h3 className="font-medium text-white mb-2">{feature.title}</h3>
                    <p className="text-sm text-nottu-gray-400">{feature.description}</p>
                  </div>
                ))}
              </div>
              <p className="text-nottu-gray-500">
                Digite sua ideia abaixo para começar
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
              {isLoading && (
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-nottu-gray-800 border border-nottu-gray-700 rounded-full flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-nottu-purple" />
                  </div>
                  <div className="flex-1">
                    <div className="bg-nottu-gray-800 border border-nottu-gray-700 rounded-2xl rounded-bl-md p-4">
                      <div className="flex items-center space-x-2">
                        <Loader2 className="w-4 h-4 text-nottu-purple animate-spin" />
                        <span className="text-sm text-nottu-gray-300">
                          Gerando seu post...
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="flex-shrink-0 p-6 border-t border-nottu-gray-800">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="relative">
            <div className="flex items-end space-x-4">
              <div className="flex-1 relative">
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Descreva o post que você quer criar..."
                  className="w-full px-4 py-3 pr-12 bg-nottu-gray-900 border border-nottu-gray-700 rounded-xl text-white placeholder-nottu-gray-400 focus:outline-none focus:border-nottu-purple focus:ring-1 focus:ring-nottu-purple resize-none"
                  rows={1}
                  style={{ minHeight: '48px', maxHeight: '120px' }}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="absolute right-3 top-3 p-1 text-nottu-gray-400 hover:text-white transition-colors"
                >
                  <Paperclip className="w-4 h-4" />
                </button>
              </div>
              <button
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className={cn(
                  'p-3 rounded-xl transition-colors',
                  inputValue.trim() && !isLoading
                    ? 'bg-nottu-purple hover:bg-nottu-purple-light text-white'
                    : 'bg-nottu-gray-800 text-nottu-gray-500 cursor-not-allowed'
                )}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}