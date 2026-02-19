// src/pages/StaffPasswordSetup.jsx
import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Calendar, Lock, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { setupPassword } from '../api/auth';

export default function StaffPasswordSetup() {
  const navigate = useNavigate();
  const location = useLocation();
  const { staffLogin: loginToContext } = useAuth();

  const setupToken = location.state?.setupToken;
  const staffName = location.state?.staffName;

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // セットアップトークンがない場合はログインページへ
  if (!setupToken) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-600 mb-4">セットアップセッションが無効です</p>
          <Link to="/staff/login" className="text-primary hover:underline">
            ログインページへ戻る
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword.length < 4) {
      setError('パスワードは4文字以上で設定してください');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('パスワードが一致しません');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const result = await setupPassword(setupToken, newPassword);
      loginToContext(result.access_token, {
        staff_id: result.staff_id,
        staff_name: result.staff_name,
      });
      navigate('/staff/request-day-off');
    } catch (err) {
      setError(err.message || 'パスワードの設定に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* ロゴ */}
        <div className="flex items-center gap-2 justify-center mb-8">
          <Calendar className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold text-gray-800">CareShift AI</span>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <h1 className="text-xl font-bold text-gray-800">パスワード設定</h1>
          </div>
          <p className="text-sm text-gray-500 mb-2">
            <span className="font-medium text-gray-700">{staffName}</span> さん、初回ログインです
          </p>
          <p className="text-sm text-gray-500 mb-6">使用するパスワードを設定してください</p>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">新しいパスワード</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="4文字以上で設定"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">パスワード（確認）</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="もう一度入力してください"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  disabled={loading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-2.5 rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '設定中...' : 'パスワードを設定してログイン'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
