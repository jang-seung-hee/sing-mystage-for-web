import React from 'react';
import './App.css';
import AuthForm from './components/Auth/AuthForm';
import { useAuth } from './hooks/useAuth';
import MainPage from './pages/MainPage';

function App() {
  const { user, loading } = useAuth();
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
