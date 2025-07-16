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
    <div className="min-h-screen flex items-center justify-center pt-32 bg-dark-bg">
      <div className="w-full max-w-md p-6 bg-dark-card rounded-lg shadow-neon-cyan">
        <h2 className="text-2xl font-bold text-center text-white mb-6">로그인</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="이메일"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full px-4 py-2 rounded bg-black text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-neon-cyan"
          />
          <input
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full px-4 py-2 rounded bg-black text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-neon-cyan"
          />
          <button
            type="submit"
            className="w-full py-2 rounded bg-neon-cyan text-black font-bold hover:bg-cyan-300 transition"
          >
            로그인
          </button>
        </form>
        <button
          onClick={googleLogin}
          className="w-full py-2 mt-4 rounded bg-red-600 text-white font-bold hover:bg-red-700 transition"
        >
          Google 계정으로 로그인
        </button>
        <div className="mt-4 text-center">
          <button
            onClick={() => setIsLogin((v) => !v)}
            className="text-neon-cyan hover:underline text-sm"
          >
            회원가입으로 전환
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;
