import { useState } from 'react';
import { 
  Download, 
  Share2, 
  Heart, 
  MessageCircle, 
  Send,
  Bookmark,
  MoreHorizontal,
  Copy,

  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../../utils/cn';


interface PostData {
  id: string;
  imageUrl?: string;
  caption: string;
  hashtags: string[];
  status: 'generating' | 'completed' | 'error';
}

interface PostPreviewProps {
  postData: PostData;
}

export function PostPreview({ postData }: PostPreviewProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showFullCaption, setShowFullCaption] = useState(false);

  const handleDownload = () => {
    if (postData.imageUrl) {
      const link = document.createElement('a');
      link.href = postData.imageUrl;
      link.download = `nottu-post-${postData.id}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Post baixado com sucesso!');
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Post criado com Nottu',
        text: postData.caption,
        url: postData.imageUrl
      });
    } else {
      navigator.clipboard.writeText(postData.caption);
      toast.success('Legenda copiada para a área de transferência!');
    }
  };

  const handleCopyCaption = () => {
    navigator.clipboard.writeText(postData.caption);
    toast.success('Legenda copiada!');
  };

  const handleCopyHashtags = () => {
    const hashtagsText = postData.hashtags.join(' ');
    navigator.clipboard.writeText(hashtagsText);
    toast.success('Hashtags copiadas!');
  };

  if (postData.status === 'generating') {
    return (
      <div className="bg-nottu-gray-900 rounded-xl border border-nottu-gray-800 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="w-8 h-8 text-nottu-purple animate-spin mx-auto mb-4" />
            <p className="text-nottu-gray-400">Gerando post...</p>
          </div>
        </div>
      </div>
    );
  }

  if (postData.status === 'error') {
    return (
      <div className="bg-nottu-gray-900 rounded-xl border border-nottu-gray-800 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-4" />
            <p className="text-nottu-gray-400">Erro ao gerar post</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-nottu-gray-900 rounded-xl border border-nottu-gray-800 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-nottu-gray-800">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-nottu-purple to-nottu-purple-light rounded-full flex items-center justify-center">
            <CheckCircle className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-white">Post gerado</p>
            <p className="text-xs text-nottu-gray-400">Pronto para publicar</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleDownload}
            className="p-2 text-nottu-gray-400 hover:text-white hover:bg-nottu-gray-800 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={handleShare}
            className="p-2 text-nottu-gray-400 hover:text-white hover:bg-nottu-gray-800 rounded-lg transition-colors"
          >
            <Share2 className="w-4 h-4" />
          </button>
          <button className="p-2 text-nottu-gray-400 hover:text-white hover:bg-nottu-gray-800 rounded-lg transition-colors">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Image */}
      {postData.imageUrl && (
        <div className="aspect-square bg-nottu-gray-800">
          <img
            src={postData.imageUrl}
            alt="Post gerado"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between p-4 border-b border-nottu-gray-800">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setIsLiked(!isLiked)}
            className={cn(
              'p-2 rounded-lg transition-colors',
              isLiked
                ? 'text-red-500 bg-red-500/10'
                : 'text-nottu-gray-400 hover:text-white hover:bg-nottu-gray-800'
            )}
          >
            <Heart className={cn('w-5 h-5', isLiked && 'fill-current')} />
          </button>
          <button className="p-2 text-nottu-gray-400 hover:text-white hover:bg-nottu-gray-800 rounded-lg transition-colors">
            <MessageCircle className="w-5 h-5" />
          </button>
          <button className="p-2 text-nottu-gray-400 hover:text-white hover:bg-nottu-gray-800 rounded-lg transition-colors">
            <Send className="w-5 h-5" />
          </button>
        </div>
        <button
          onClick={() => setIsSaved(!isSaved)}
          className={cn(
            'p-2 rounded-lg transition-colors',
            isSaved
              ? 'text-nottu-purple bg-nottu-purple/10'
              : 'text-nottu-gray-400 hover:text-white hover:bg-nottu-gray-800'
          )}
        >
          <Bookmark className={cn('w-5 h-5', isSaved && 'fill-current')} />
        </button>
      </div>

      {/* Caption */}
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className={cn(
              'text-sm text-nottu-gray-100 leading-relaxed',
              !showFullCaption && 'line-clamp-3'
            )}>
              {postData.caption}
            </p>
            {postData.caption.length > 150 && (
              <button
                onClick={() => setShowFullCaption(!showFullCaption)}
                className="text-nottu-gray-400 hover:text-white text-sm mt-1"
              >
                {showFullCaption ? 'Ver menos' : 'Ver mais'}
              </button>
            )}
          </div>
          <button
            onClick={handleCopyCaption}
            className="p-1 text-nottu-gray-400 hover:text-white hover:bg-nottu-gray-800 rounded transition-colors ml-2"
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>

        {/* Hashtags */}
        {postData.hashtags.length > 0 && (
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex flex-wrap gap-1">
                {postData.hashtags.map((hashtag, index) => (
                  <span
                    key={index}
                    className="text-nottu-purple text-sm hover:text-nottu-purple-light cursor-pointer"
                  >
                    #{hashtag}
                  </span>
                ))}
              </div>
            </div>
            <button
              onClick={handleCopyHashtags}
              className="p-1 text-nottu-gray-400 hover:text-white hover:bg-nottu-gray-800 rounded transition-colors ml-2"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}