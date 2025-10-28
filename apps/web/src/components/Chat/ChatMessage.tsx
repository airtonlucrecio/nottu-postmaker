import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { User, Sparkles } from 'lucide-react';
import { cn } from '../../utils/cn';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.type === 'user';

  return (
    <div className={cn(
      'flex items-start space-x-3',
      isUser ? 'flex-row-reverse space-x-reverse' : ''
    )}>
      {/* Avatar */}
      <div className={cn(
        'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
        isUser 
          ? 'bg-gradient-to-br from-nottu-purple to-nottu-purple-light'
          : 'bg-nottu-gray-800 border border-nottu-gray-700'
      )}>
        {isUser ? (
          <User className="w-4 h-4 text-white" />
        ) : (
          <Sparkles className="w-4 h-4 text-nottu-purple" />
        )}
      </div>

      {/* Message Content */}
      <div className={cn(
        'flex-1 max-w-3xl',
        isUser ? 'flex flex-col items-end' : ''
      )}>
        {/* Message Bubble */}
        <div className={cn(
          'px-4 py-3 rounded-2xl text-sm leading-relaxed',
          isUser
            ? 'bg-nottu-purple text-white rounded-br-md'
            : 'bg-nottu-gray-800 text-nottu-gray-100 rounded-bl-md border border-nottu-gray-700'
        )}>
          {message.content}
        </div>

        {/* Timestamp */}
        <div className={cn(
          'mt-1 text-xs text-nottu-gray-500',
          isUser ? 'text-right' : 'text-left'
        )}>
          {format(message.timestamp, 'HH:mm', { locale: ptBR })}
        </div>
      </div>
    </div>
  );
}