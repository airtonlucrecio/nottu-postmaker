import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ChatPage } from './pages/ChatPage';
import { HistoryPage } from './pages/HistoryPage';
import { SettingsPage } from './pages/SettingsPage';
import { PreviewPage } from './pages/PreviewPage';
import { NotFoundPage } from './pages/NotFoundPage';

function App() {
  // Teste simples para verificar se o Tailwind está funcionando
  return (
    <div className="min-h-screen bg-nottu-dark text-white">
      <Layout>
        <Routes>
          <Route path="/" element={<ChatPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/preview/:jobId" element={<PreviewPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Layout>
    </div>
  );
}

export default App;