import React, { useEffect, useState } from 'react';
import { getUserSettings, updateUserSettings } from '../../services/userSettingsService';
import LoadingSpinner from '../Common/LoadingSpinner';
import Alert from '../Common/Alert';
import Button from '../Common/Button';
import Input from '../Common/Input';
import { useAuth } from '../../hooks/useAuth';

const UserSettings: React.FC = () => {
  const [nickname, setNickname] = useState('');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    const fetchSettings = async () => {
      setLoading(true);
      setError(null);
      try {
        const settings = await getUserSettings();
        setNickname(settings.nickname || '');
        setTheme(settings.theme || 'light');
      } catch (err: any) {
        setError(err.message || '설정 불러오기 실패');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await updateUserSettings({ nickname, theme });
      setSuccess('저장 완료!');
      setTimeout(() => setSuccess(null), 1000);
    } catch (err: any) {
      setError(err.message || '저장 실패');
    } finally {
      setLoading(false);
    }
  };

  const handleThemeToggle = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <div className="max-w-lg mx-auto mt-8 p-4 border rounded shadow bg-white dark:bg-gray-800">
      <h2 className="font-bold mb-4">사용자 설정</h2>
      {loading && <LoadingSpinner />}
      {error && <Alert message={error} type="error" />}
      {success && <Alert message={success} type="success" />}
      <div className="mb-4">
        <label className="block mb-1 font-medium">닉네임</label>
        <Input
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          className="w-full"
        />
      </div>
      <div className="mb-4 flex items-center gap-2">
        <span className="font-medium">테마</span>
        <Button
          variant={theme === 'dark' ? 'secondary' : 'primary'}
          onClick={handleThemeToggle}
          className="ml-2"
        >
          {theme === 'dark' ? '다크' : '라이트'}
        </Button>
      </div>
      <Button onClick={handleSave} disabled={loading}>
        저장
      </Button>
    </div>
  );
};

export default UserSettings;
