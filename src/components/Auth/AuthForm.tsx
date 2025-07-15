import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

const AuthForm: React.FC = () => {
  const { signup, login, user, loading, error, googleLogin, logout } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLogin) {
      await login(email, password);
    } else {
      await signup(email, password);
    }
  };

  if (user) {
    return (
      <div className="max-w-xs mx-auto mt-8 p-6 bg-dark-card border border-dark-border rounded-lg shadow-neon-cyan flex flex-col items-center">
        <div className="mb-2 text-neon-green font-bold">로그인됨</div>
        {user.photoURL && (
          <img
            src={user.photoURL}
            alt="프로필"
            className="w-16 h-16 rounded-full mb-2 ring-2 ring-neon-cyan"
          />
        )}
        <div className="mb-1 text-white">{user.displayName || user.email}</div>
        <button
          className="mt-2 bg-dark-bg hover:bg-gray-800 text-red-400 py-2 px-4 rounded border border-red-400 hover:shadow-glow-sm transition-all duration-200"
          onClick={logout}
        >
          로그아웃
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-xs mx-auto mt-8 p-6 bg-dark-card border border-dark-border rounded-lg shadow-neon-cyan">
      <h2 className="text-xl font-bold mb-4 text-white text-center">
        {isLogin ? '로그인' : '회원가입'}
      </h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="email"
          placeholder="이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="bg-dark-bg border border-dark-border text-white p-3 rounded focus:border-neon-cyan focus:shadow-glow-sm outline-none transition-all duration-200"
          required
        />
        <input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="bg-dark-bg border border-dark-border text-white p-3 rounded focus:border-neon-cyan focus:shadow-glow-sm outline-none transition-all duration-200"
          required
        />
        {error && <div className="text-red-400 text-sm text-center">{error}</div>}
        <button
          type="submit"
          className="bg-neon-cyan text-black py-3 rounded font-bold disabled:opacity-50 hover:shadow-neon-cyan transition-all duration-200 disabled:cursor-not-allowed"
          disabled={loading}
        >
          {loading ? '처리 중...' : isLogin ? '로그인' : '회원가입'}
        </button>
      </form>
      <button
        type="button"
        className="mt-4 bg-red-600 hover:bg-red-700 text-white py-3 rounded w-full font-bold hover:shadow-glow-sm transition-all duration-200"
        onClick={googleLogin}
        disabled={loading}
      >
        {loading ? '처리 중...' : 'Google 계정으로 로그인'}
      </button>
      <button
        className="mt-4 text-neon-blue hover:text-neon-cyan underline text-sm w-full transition-colors duration-200"
        onClick={() => setIsLogin((v) => !v)}
      >
        {isLogin ? '회원가입으로 전환' : '로그인으로 전환'}
      </button>
    </div>
  );
};

export default AuthForm;
