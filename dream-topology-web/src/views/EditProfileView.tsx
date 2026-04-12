import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Camera, User, Shield, Loader2, X, Check } from 'lucide-react';
import { getUserStats } from '../services/api';

export default function EditProfileView({ onBack }: { onBack: () => void }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [signature, setSignature] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  // Password modal state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Avatar state
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  useEffect(() => {
    async function loadStats() {
      try {
        const currentUserStr = localStorage.getItem('dream_topology_current_user');
        if (!currentUserStr) {
          // Fallback
          const stats = await getUserStats();
          setUsername(stats.username);
          setEmail(stats.email);
          return;
        }

        const currentUser = JSON.parse(currentUserStr);
        const userId = currentUser.id;
        
        setUsername(currentUser.username);
        setEmail(currentUser.email);
        
        // Try to load saved profile data from local storage for this user
        const savedProfile = localStorage.getItem(`dream_topology_profile_${userId}`);
        if (savedProfile) {
          const profile = JSON.parse(savedProfile);
          if (profile.username) setUsername(profile.username);
          if (profile.email) setEmail(profile.email);
          if (profile.signature) setSignature(profile.signature);
          if (profile.avatar) setAvatarPreview(profile.avatar);
        }
      } catch (error) {
        console.error("Failed to load user stats", error);
      }
    }
    loadStats();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const currentUserStr = localStorage.getItem('dream_topology_current_user');
      const userId = currentUserStr ? JSON.parse(currentUserStr).id : 'default';

      // Save to local storage for demo persistence scoped by user
      localStorage.setItem(`dream_topology_profile_${userId}`, JSON.stringify({
        username,
        email,
        signature,
        avatar: avatarPreview
      }));

      if (currentUserStr) {
        const currentUser = JSON.parse(currentUserStr);
        currentUser.username = username;
        currentUser.email = email;
        localStorage.setItem('dream_topology_current_user', JSON.stringify(currentUser));
        
        // Update user in users DB
        const usersDB = JSON.parse(localStorage.getItem('dream_topology_users') || '{}');
        // Find user by id in usersDB
        const userKey = Object.keys(usersDB).find(key => usersDB[key].id === userId);
        if (userKey) {
          usersDB[userKey].name = username;
          usersDB[userKey].email = email;
          localStorage.setItem('dream_topology_users', JSON.stringify(usersDB));
        }
      }
      
      // Simulate a successful API call
      await new Promise(resolve => setTimeout(resolve, 800));
      onBack();
    } catch (error) {
      console.error("Failed to save profile", error);
      alert("保存失败，请重试");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Basic validation
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert("图片大小不能超过 5MB");
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
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

  const handleDeleteAccount = () => {
    if (window.confirm('警告：此操作将永久注销您的账户并删除所有数据，且无法恢复。是否继续？')) {
      alert('账户已注销。');
      window.location.reload();
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: '100%' }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: '100%' }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[60] bg-[#F0F2F5] dark:bg-[#1C1E21] overflow-y-auto"
    >
      <div className="max-w-md mx-auto min-h-screen px-6 pt-12 pb-24 flex flex-col gap-6 relative">
        <header className="flex justify-between items-center sticky top-0 bg-[#F0F2F5]/80 dark:bg-[#1C1E21]/80 backdrop-blur-xl z-10 py-4 -mx-6 px-6">
          <button 
            onClick={onBack}
            className="text-apple-blue font-medium transition-colors"
          >
            取消
          </button>
          <h1 className="text-base font-bold text-black dark:text-white">编辑资料</h1>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="text-apple-blue font-bold transition-colors disabled:opacity-50 flex items-center gap-1"
          >
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : "完成"}
          </button>
        </header>

        <div className="flex flex-col items-center gap-4 mt-4">
          <div className="relative group cursor-pointer">
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleAvatarChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              title="更换头像"
            />
            <div className="w-24 h-24 rounded-full bg-[#E8F3FF] dark:bg-white/8 border border-black/10 dark:border-white/12 p-[2px] shadow-sm">
              <div className="w-full h-full bg-white dark:bg-[#1C1E21] rounded-full flex items-center justify-center transition-colors overflow-hidden">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar Preview" className="w-full h-full object-cover" />
                ) : (
                  <User size={40} className="text-gray-400" />
                )}
              </div>
            </div>
            <div className="absolute bottom-0 right-0 w-8 h-8 bg-[#0064E0] rounded-full flex items-center justify-center text-white shadow-md border-2 border-[#F0F2F5] dark:border-[#1C1E21] pointer-events-none group-hover:scale-110 transition-transform">
              <Camera size={14} />
            </div>
          </div>
          <span className="text-sm font-medium text-apple-blue pointer-events-none">
            更换头像
          </span>
        </div>

        <section className="flex flex-col gap-4 mt-6">
          <div className="meta-card rounded-3xl overflow-hidden flex flex-col transition-colors">
            <div className="flex items-center gap-3 p-4 border-b border-black/5 dark:border-white/10 transition-colors">
              <span className="w-20 text-sm font-medium text-gray-500 dark:text-gray-400">用户名</span>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Dreamer_001"
                className="flex-1 bg-transparent border-none text-sm font-bold text-black dark:text-white focus:outline-none placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>
            <div className="flex items-center gap-3 p-4 border-b border-black/5 dark:border-white/10 transition-colors">
              <span className="w-20 text-sm font-medium text-gray-500 dark:text-gray-400">邮箱</span>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="flex-1 bg-transparent border-none text-sm font-bold text-black dark:text-white focus:outline-none placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>
            <div className="flex items-center gap-3 p-4 transition-colors">
              <span className="w-20 text-sm font-medium text-gray-500 dark:text-gray-400">个性签名</span>
              <input 
                type="text" 
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                placeholder="记录潜意识的探索者"
                className="flex-1 bg-transparent border-none text-sm font-bold text-black dark:text-white focus:outline-none placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>
          </div>

          <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mt-4 pl-4 transition-colors">账户安全</h3>
          <div className="meta-card rounded-3xl overflow-hidden flex flex-col transition-colors">
            <button 
              onClick={() => setShowPasswordModal(true)}
              className="flex items-center justify-between p-4 border-b border-black/5 dark:border-white/10 transition-colors active:bg-black/5 dark:active:bg-white/6 text-left w-full"
            >
              <div className="flex items-center gap-3">
                <Shield size={18} className="text-apple-blue" />
                <span className="text-sm font-bold text-black dark:text-white">修改密码</span>
              </div>
              <ChevronLeft size={16} className="text-gray-400 transform rotate-180" />
            </button>
            <button 
              onClick={handleDeleteAccount}
              className="flex items-center justify-between p-4 transition-colors active:bg-black/5 dark:active:bg-white/6 text-left w-full"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-red-500">注销账户</span>
              </div>
            </button>
          </div>
        </section>
      </div>

      {/* Password Modal */}
      <AnimatePresence>
        {showPasswordModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm flex items-center justify-center p-6"
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
