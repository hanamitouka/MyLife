import { useState } from 'react';
import { signIn, signUp } from '../../lib/supabase';

type Mode = 'login' | 'signup';

/** 登录 / 注册界面（配置了 Supabase 且未登录时显示）。 */
export function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<Mode>('login');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = mode === 'login' ? await signIn(email, password) : await signUp(email, password);
    setLoading(false);
    if (res.error) setError(res.error.message);
    // 成功时 onAuthStateChange 会更新 session，App 自动进入主界面
  }

  return (
    <div className="auth-screen">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>MyLife</h1>
        <p className="hint">{mode === 'login' ? '登录以同步你的数据' : '注册一个账号开始使用'}</p>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="邮箱"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="密码（至少 6 位）"
          required
          minLength={6}
        />
        {error && <p className="auth-error">{error}</p>}
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? '请稍候…' : mode === 'login' ? '登录' : '注册'}
        </button>
        <button
          type="button"
          className="btn-ghost"
          onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
        >
          {mode === 'login' ? '没有账号？去注册' : '已有账号？去登录'}
        </button>
      </form>
    </div>
  );
}
