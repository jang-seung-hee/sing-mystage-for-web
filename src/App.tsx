import React, { useEffect } from 'react';
import './App.css';
import AuthForm from './components/Auth/AuthForm';
import { useAuth } from './hooks/useAuth';
import MainPage from './pages/MainPage';
import { registerServiceWorker, requestNotificationPermission } from './utils/serviceWorkerUtils';

function App() {
  const { user, loading } = useAuth();

  // Service Worker 등록 및 알림 권한 요청
  useEffect(() => {
    const initializeApp = async () => {
      // Service Worker 등록
      await registerServiceWorker();
      
      // 알림 권한 요청
      await requestNotificationPermission();
    };

    initializeApp();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-neon-cyan text-xl font-bold animate-pulse-glow mb-4">로딩 중...</div>
          <div className="w-16 h-16 border-4 border-neon-cyan border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }
  return <div className="min-h-screen bg-black dark">{user ? <MainPage /> : <AuthForm />}</div>;
}

export default App;
