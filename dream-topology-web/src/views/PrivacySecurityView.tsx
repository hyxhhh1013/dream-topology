import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Shield, Key, Eye, Lock, X, Check } from 'lucide-react';
import { useState } from 'react';

interface PrivacySecurityViewProps {
  onBack: () => void;
}

export default function PrivacySecurityView({ onBack }: PrivacySecurityViewProps) {
  const [biometricAuth, setBiometricAuth] = useState(true);
  const [dataCollection, setDataCollection] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  
  // Password form states
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleClearData = () => {
    if (window.confirm('警告：此操作将永久删除您设备上的所有梦境记录和分析数据，且无法恢复。是否继续？')) {
      // Clear localStorage logic
      localStorage.clear();
      alert('所有本地数据已清除。');
      // In a real app, you might want to redirect to onboarding or reload
      window.location.reload();
    }
  };

  const handleChangePassword = () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      alert('请填写所有密码字段');
      return;
    }
    if (newPassword !== confirmPassword) {
      alert('新密码与确认密码不一致');
      return;
    }
    // Simulate API call
    setTimeout(() => {
      alert('密码修改成功！');
      setShowPasswordModal(false);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }, 500);
  };
  
  return (
    <motion.div 
      initial={{ opacity: 0, x: '100%' }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-50 bg-[#F0F2F5] dark:bg-[#1C1E21] overflow-y-auto"
    >
      <div className="sticky top-0 z-10 bg-[#F0F2F5]/80 dark:bg-[#1C1E21]/80 backdrop-blur-md px-6 py-4 flex items-center gap-4 border-b border-black/5 dark:border-white/10">
        <button 
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-white/75 dark:bg-white/10 border border-black/10 dark:border-white/12 backdrop-blur flex items-center justify-center shadow-sm"
        >
          <ArrowLeft size={20} className="text-gray-900 dark:text-white" />
        </button>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">隐私与安全</h2>
      </div>

      <div className="p-6 flex flex-col gap-6 pb-20">
        <div className="meta-card rounded-3xl p-6 flex flex-col items-center justify-center gap-3 text-center">
          <div className="w-16 h-16 rounded-full bg-[#E8F3FF] dark:bg-white/8 border border-black/5 dark:border-white/10 flex items-center justify-center text-apple-blue dark:text-white/90 mb-2">
            <Shield size={32} />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">您的数据安全至上</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            所有的梦境数据均采用端到端加密存储，只有您自己可以访问和解密这些内容。
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <h3 className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-widest pl-4">安全设置</h3>
          <div className="meta-card rounded-3xl overflow-hidden flex flex-col">
            <PrivacyItem 
              icon={<Lock size={20} className="text-apple-blue" />}
              label="修改密码"
              hasArrow
              onClick={() => setShowPasswordModal(true)}
            />
            <PrivacyItem 
              icon={<Key size={20} className="text-apple-blue" />}
              label="面容/指纹解锁"
              isToggle
              toggleState={biometricAuth}
              onToggle={setBiometricAuth}
            />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <h3 className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-widest pl-4">隐私偏好</h3>
          <div className="meta-card rounded-3xl overflow-hidden flex flex-col">
            <PrivacyItem 
              icon={<Eye size={20} className="text-orange-500" />}
              label="允许收集匿名分析数据"
              isToggle
              toggleState={dataCollection}
              onToggle={setDataCollection}
            />
            <div className="p-4 border-t border-black/5 dark:border-white/10">
              <button 
                onClick={handleClearData}
                className="w-full py-3 rounded-xl border border-red-500/30 text-red-600 font-bold hover:bg-red-500/10 transition-colors"
              >
                清除所有本地数据
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Password Modal */}
      <AnimatePresence>
        {showPasswordModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full max-w-sm meta-card rounded-3xl p-6 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">修改密码</h3>
                <button 
                  onClick={() => setShowPasswordModal(false)}
                  className="w-9 h-9 rounded-full bg-white/75 dark:bg-white/10 border border-black/10 dark:border-white/12 backdrop-blur flex items-center justify-center text-gray-700 dark:text-white/90 transition-colors hover:bg-white hover:dark:bg-white/14"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 pl-1">原密码</label>
                  <input 
                    type="password" 
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="meta-input text-sm"
                    placeholder="输入当前密码"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 pl-1">新密码</label>
                  <input 
                    type="password" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="meta-input text-sm"
                    placeholder="设置新密码 (至少 6 位)"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 pl-1">确认新密码</label>
                  <input 
                    type="password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="meta-input text-sm"
                    placeholder="再次输入新密码"
                  />
                </div>
              </div>

              <button 
                onClick={handleChangePassword}
                className="meta-btn-primary w-full mt-8"
              >
                <Check size={18} />
                确认修改
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function PrivacyItem({ 
  icon, 
  label, 
  isToggle = false, 
  toggleState = false,
  hasArrow = false,
  onToggle,
  onClick
}: { 
  icon: React.ReactNode, 
  label: string, 
  isToggle?: boolean,
  toggleState?: boolean,
  hasArrow?: boolean,
  onToggle?: (val: boolean) => void,
  onClick?: () => void
}) {
  return (
    <div 
      onClick={isToggle && onToggle ? () => onToggle(!toggleState) : onClick}
      className={`flex items-center justify-between p-4 border-b border-black/5 dark:border-white/10 last:border-0 transition-colors ${(onClick || (isToggle && onToggle)) ? 'cursor-pointer active:bg-black/5 dark:active:bg-white/6' : ''}`}
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-2xl bg-[#F7F8FA] dark:bg-white/6 border border-black/5 dark:border-white/10 flex items-center justify-center transition-colors">
          {icon}
        </div>
        <span className="font-bold text-sm text-gray-900 dark:text-white transition-colors">{label}</span>
      </div>
      
      <div className="flex items-center">
        {isToggle && (
          <div className={`w-12 h-7 rounded-full p-1 transition-colors duration-300 ${toggleState ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
            <div className={`w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform duration-300 ${toggleState ? 'translate-x-5' : 'translate-x-0'}`} />
          </div>
        )}
        
        {hasArrow && (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-400">
            <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>
    </div>
  );
}
