import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User as UserIcon, ArrowRight, Loader2 } from 'lucide-react';
import { registerUser, loginUser, setAuthToken } from '../services/api';

interface AuthViewProps {
  onClose: () => void;
  onSuccess: (user: any) => void;
}

export default function AuthView({ onClose, onSuccess }: AuthViewProps) {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email || !password || (!isLoginMode && !name)) {
      setErrorMsg('请填写所有必填字段');
      return;
    }

    setIsLoading(true);

    try {
      let result;
      if (isLoginMode) {
        // Real login via backend API
        result = await loginUser(email, password);
      } else {
        // Real register via backend API
        result = await registerUser(email, password, name);
      }

      // Store user info in localStorage for legacy compatibility
      const userData = {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        token: result.token,
      };
      localStorage.setItem('dream_topology_current_user', JSON.stringify(userData));

      // Auth token is already stored by setAuthToken in registerUser/loginUser

      onSuccess({ email: result.user.email, username: result.user.name, id: result.user.id, token: result.token });
    } catch (err: any) {
      setErrorMsg(err.message || '认证失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="w-full max-w-sm bg-white dark:bg-[#1C1C1E] rounded-3xl overflow-hidden shadow-2xl border border-black/5 dark:border-white/10"
      >
        {/* Header */}
        <div className="relative p-6 pb-2 text-center">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-2 rounded-full bg-black/5 dark:bg-white/10 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
          <div className="w-12 h-12 bg-gradient-to-tr from-apple-blue to-apple-purple rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg shadow-apple-blue/20">
            <UserIcon size={24} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {isLoginMode ? '欢迎回来' : '创建你的潜意识档案'}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {isLoginMode ? '登录以同步你的梦境数据' : '注册以保存和分析你的梦境'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 pt-4 space-y-4">
          <AnimatePresence mode="popLayout">
            {!isLoginMode && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                className="relative"
              >
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <UserIcon size={18} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="用户名 (如: Dreamer_001)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-black/5 dark:bg-white/5 border border-transparent focus:border-apple-blue/50 rounded-xl py-3.5 pl-11 pr-4 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-apple-blue/20 transition-all placeholder-gray-500"
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Mail size={18} className="text-gray-400" />
            </div>
            <input
              type="email"
              placeholder="电子邮箱"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black/5 dark:bg-white/5 border border-transparent focus:border-apple-blue/50 rounded-xl py-3.5 pl-11 pr-4 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-apple-blue/20 transition-all placeholder-gray-500"
            />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Lock size={18} className="text-gray-400" />
            </div>
            <input
              type="password"
              placeholder="密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black/5 dark:bg-white/5 border border-transparent focus:border-apple-blue/50 rounded-xl py-3.5 pl-11 pr-4 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-apple-blue/20 transition-all placeholder-gray-500"
            />
          </div>

          {errorMsg && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-red-500 font-medium text-center"
            >
              {errorMsg}
            </motion.p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-apple-blue to-apple-purple text-white font-bold text-sm shadow-lg shadow-apple-blue/30 flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-70"
          >
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : (
              <>
                {isLoginMode ? '登录' : '立即注册'}
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="p-6 pt-0 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {isLoginMode ? '还没有潜意识档案？' : '已拥有档案？'}
            <button
              type="button"
              onClick={() => {
                setIsLoginMode(!isLoginMode);
                setErrorMsg('');
              }}
              className="ml-1 text-apple-blue font-bold hover:underline"
            >
              {isLoginMode ? '创建一个' : '直接登录'}
            </button>
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}