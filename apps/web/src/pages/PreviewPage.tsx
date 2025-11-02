import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  RefreshCw,
  Loader2,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { PostPreview } from '../components/Post/PostPreview';
import { apiService, type JobStatus } from '../services/api';

export function PreviewPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!jobId) {
      setError('ID do job não encontrado');
      setIsLoading(false);
      return;
    }

    const loadJobStatus = async () => {
      try {
        const status = await apiService.getJobStatus(jobId);
        setJobStatus(status);

        // Se ainda está processando, fazer polling
        if (status.status === 'processing') {
          await apiService.pollJobStatus(jobId, {
            onProgress: (updatedStatus) => {
              setJobStatus(updatedStatus);
            }
          });
        }
      } catch (err) {
        setError('Erro ao carregar o post');
      } finally {
        setIsLoading(false);
      }
    };

    loadJobStatus();
  }, [jobId]);

  const handleRetry = async () => {
    if (!jobId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const status = await apiService.getJobStatus(jobId);
      setJobStatus(status);
      
      if (status && status.status === 'processing') {
        await apiService.pollJobStatus(jobId, {
          onProgress: (updatedStatus) => {
            setJobStatus(updatedStatus);
          }
        });
      }
    } catch (err) {
      setError('Erro ao recarregar o post');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-6 h-6 text-green-400" />;
      case 'failed':
        return <AlertCircle className="w-6 h-6 text-red-400" />;
      case 'processing':
        return <Loader2 className="w-6 h-6 text-nottu-purple animate-spin" />;
      default:
        return <AlertCircle className="w-6 h-6 text-nottu-gray-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Concluído';
      case 'failed': return 'Falhou';
      case 'processing': return 'Processando';
      default: return 'Desconhecido';
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-nottu-purple animate-spin mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Carregando post...</h3>
          <p className="text-nottu-gray-400">Aguarde enquanto buscamos os dados</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Erro ao carregar</h3>
          <p className="text-nottu-gray-400 mb-6">{error}</p>
          <div className="flex items-center justify-center space-x-3">
            <button
              onClick={() => navigate('/')}
              className="flex items-center space-x-2 px-4 py-2 bg-nottu-gray-800 hover:bg-nottu-gray-700 text-white rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar</span>
            </button>
            <button
              onClick={handleRetry}
              className="flex items-center space-x-2 px-4 py-2 bg-nottu-purple hover:bg-nottu-purple-light text-white rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Tentar novamente</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const previewImagePath =
    jobStatus?.result?.publicAssets?.finalPath ||
    jobStatus?.result?.metadata?.output?.public?.finalPath ||
    jobStatus?.result?.metadata?.image?.url;

  const previewImageUrl =
    apiService.resolveAssetUrl(previewImagePath) || jobStatus?.result?.metadata?.image?.url;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-nottu-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/')}
              className="p-2 text-nottu-gray-400 hover:text-white hover:bg-nottu-gray-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            
            <div>
              <h1 className="text-xl font-semibold text-white">Preview do Post</h1>
              <div className="flex items-center space-x-3 mt-1">
                <span className="text-sm text-nottu-gray-400">Job ID: {jobId}</span>
                {jobStatus && (
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(jobStatus.status)}
                    <span className="text-sm text-nottu-gray-300">
                      {getStatusText(jobStatus.status)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleRetry}
              className="flex items-center space-x-2 px-4 py-2 bg-nottu-gray-800 hover:bg-nottu-gray-700 text-white rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Atualizar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {jobStatus?.status === 'completed' && jobStatus.result ? (
          <div className="max-w-2xl mx-auto">
            <PostPreview
              postData={{
                id: jobStatus.id,
                imageUrl: previewImageUrl,
                caption: jobStatus.result.caption || '',
                hashtags: jobStatus.result.hashtags || [],
                status: 'completed'
              }}
            />
            
            {/* Metadata */}
            {jobStatus.result.metadata && (
              <div className="mt-6 bg-nottu-gray-800 border border-nottu-gray-700 rounded-lg p-4">
                <h3 className="text-white font-medium mb-3">Informações da Geração</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {jobStatus.result.metadata.completedAt && (
                    <div>
                      <span className="text-nottu-gray-400">Concluído em:</span>
                      <span className="text-white ml-2">{new Date(jobStatus.result.metadata.completedAt).toLocaleString()}</span>
                    </div>
                  )}
                  {jobStatus.result.metadata.provider?.image && (
                    <div>
                      <span className="text-nottu-gray-400">Provider:</span>
                      <span className="text-white ml-2">{jobStatus.result.metadata.provider.image}</span>
                    </div>
                  )}
                  {jobStatus.result.metadata.output?.finalPath && (
                    <div>
                      <span className="text-nottu-gray-400">Arquivo:</span>
                      <span className="text-white ml-2">{jobStatus.result.metadata.output.finalPath}</span>
                    </div>
                  )}
                  {jobStatus.result.metadata.render && (
                    <div>
                      <span className="text-nottu-gray-400">Render:</span>
                      <span className="text-white ml-2">
                        {jobStatus.result.metadata.render.width}x{jobStatus.result.metadata.render.height} · {jobStatus.result.metadata.render.format.toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : jobStatus?.status === 'failed' ? (
          <div className="max-w-md mx-auto text-center">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">Falha na geração</h3>
            <p className="text-nottu-gray-400 mb-6">
              {jobStatus.error || 'Ocorreu um erro durante a geração do post'}
            </p>
            <button
              onClick={handleRetry}
              className="flex items-center space-x-2 px-6 py-3 bg-nottu-purple hover:bg-nottu-purple-light text-white rounded-lg transition-colors mx-auto"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Tentar novamente</span>
            </button>
          </div>
        ) : (
          <div className="max-w-md mx-auto text-center">
            <Loader2 className="w-16 h-16 text-nottu-purple animate-spin mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">Gerando post...</h3>
            {jobStatus?.progress && (
              <div className="space-y-3">
                <p className="text-nottu-gray-400">{jobStatus.progress.message || 'Processando...'}</p>
                <div className="w-full bg-nottu-gray-800 rounded-full h-2">
                  <div
                    className="bg-nottu-purple h-2 rounded-full transition-all duration-300"
                    style={{ width: `${jobStatus.progress.percentage}%` }}
                  />
                </div>
                <p className="text-sm text-nottu-gray-500">
                  {jobStatus.progress.percentage}% concluído
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}