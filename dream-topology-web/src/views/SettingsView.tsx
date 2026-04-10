import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Bell, Shield, Database, LogOut, Link2 } from 'lucide-react';
import EditProfileView from './EditProfileView';
import SymbolDictionaryView from './SymbolDictionaryView';
import PrivacySecurityView from './PrivacySecurityView';
import DeviceSyncView from './DeviceSyncView';
import AuthView from './AuthView';
import { getUserStats } from '../services/api';

export default function SettingsView() {
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showDictionary, setShowDictionary] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showDeviceSync, setShowDeviceSync] = useState(false);
  
  // Toggles state
  // Initialize guidePush from localStorage, default to true if not set
  const [guidePush, setGuidePush] = useState(() => {
    const saved = localStorage.getItem('dream_topology_guide_push');
    return saved !== null ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    // Persist guidePush state to localStorage whenever it changes
    localStorage.setItem('dream_topology_guide_push', JSON.stringify(guidePush));
  }, [guidePush]);

  // Logout state
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const [userStats, setUserStats] = useState({ dreamCount: 0, username: '未命名用户', email: '' });
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  
  // Profile avatar state
  const [profileAvatar, setProfileAvatar] = useState<string | null>(null);

  // Login State
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('dream_topology_is_logged_in') === 'true';
  });
  const [showAuthView, setShowAuthView] = useState(false);

  const handleLoginSuccess = (user: any) => {
    localStorage.setItem('dream_topology_is_logged_in', 'true');
    localStorage.setItem('dream_topology_current_user', JSON.stringify(user));
    
    // Check if profile exists, otherwise create a base one
    const savedProfile = localStorage.getItem(`dream_topology_profile_${user.id}`);
    if (savedProfile) {
      const profile = JSON.parse(savedProfile);
      setUserStats({
        dreamCount: profile.dreamCount || 0,
        username: profile.username || user.username,
        email: profile.email || user.email
      });
      setProfileAvatar(profile.avatar || null);
    } else {
      setUserStats({
        dreamCount: 0,
        username: user.username,
        email: user.email
      });
      setProfileAvatar(null);
    }

    setIsLoggedIn(true);
    setShowAuthView(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('dream_topology_is_logged_in');
    localStorage.removeItem('dream_topology_current_user');
    setIsLoggedIn(false);
    setShowLogoutConfirm(false);
  };

  useEffect(() => {
    async function loadStats() {
      if (!isLoggedIn) {
        setIsLoadingStats(false);
        return;
      }

      try {
        // Retrieve current logged in user
        const currentUserStr = localStorage.getItem('dream_topology_current_user');
        if (!currentUserStr) return;
        
        const currentUser = JSON.parse(currentUserStr);
        const userId = currentUser.id;
        const remoteDreamCount = await getUserStats()
          .then((stats) => stats?.dreamCount)
          .catch(() => undefined);

        // Try to load saved profile data from local storage for this specific user
        const savedProfile = localStorage.getItem(`dream_topology_profile_${userId}`);
        
        if (savedProfile) {
          const profile = JSON.parse(savedProfile);
          setUserStats({
            dreamCount: remoteDreamCount ?? profile.dreamCount ?? 0,
            username: profile.username || currentUser.username,
            email: profile.email || currentUser.email
          });
          if (profile.avatar) {
            setProfileAvatar(profile.avatar);
          }
        } else {
          // Default fallback if no profile saved yet
          setUserStats({
            dreamCount: remoteDreamCount ?? 0,
            username: currentUser.username,
            email: currentUser.email
          });
        }
      } catch (error) {
        console.error("Failed to load user stats", error);
      } finally {
        setIsLoadingStats(false);
      }
    }
    loadStats();
  }, [showEditProfile, isLoggedIn]); // Reload stats when coming back from EditProfileView or login status changes

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col h-full gap-6 pb-10"
    >
      <header className="mb-4">
        <h1 className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-white transition-colors">设置</h1>
      </header>

      {/* 用户资料卡片 */}
      <section className="glass-panel rounded-[2rem] p-6 flex items-center justify-between transition-colors border border-black/5 dark:border-white/5 shadow-sm dark:shadow-none bg-white/80 dark:bg-transparent">
        {isLoggedIn ? (
          <>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-apple-blue to-apple-purple p-[2px] shadow-md shrink-0">
                <div className="w-full h-full bg-white dark:bg-black rounded-full flex items-center justify-center transition-colors overflow-hidden">
                  {profileAvatar ? (
                    <img src={profileAvatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User size={24} className="text-gray-400" />
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white transition-colors">{userStats.username}</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors font-medium">
                  {isLoadingStats ? '加载中...' : `已记录 ${userStats.dreamCount} 个梦境`}
                </p>
              </div>
            </div>
            <button 
              onClick={() => setShowEditProfile(true)}
              className="px-4 py-2 bg-black/5 dark:bg-white/10 rounded-full text-sm font-bold text-gray-900 dark:text-white transition-colors hover:bg-black/10 dark:hover:bg-white/20 shrink-0"
            >
              编辑
            </button>
          </>
        ) : (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center shrink-0">
                <User size={24} className="text-gray-400" />
              </div>
              <div className="flex flex-col gap-1">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white transition-colors">未登录</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors font-medium">
                  登录以同步和备份您的梦境
                </p>
              </div>
            </div>
            <button 
              onClick={() => setShowAuthView(true)}
              className="px-6 py-2 bg-apple-blue text-white rounded-full text-sm font-bold transition-colors hover:bg-blue-600 shrink-0"
            >
              登录 / 注册
            </button>
          </div>
        )}
      </section>

      {/* 设置列表 */}
      <section className="flex flex-col gap-4">
        <SettingsGroup title="数据同步">
          <SettingsItem 
            icon={<Link2 size={20} className="text-apple-blue" />} 
            label="多设备数据同步" 
            hasArrow={true}
            onClick={() => setShowDeviceSync(true)}
          />
        </SettingsGroup>

        <SettingsGroup title="偏好与隐私">
          <SettingsItem 
            icon={<Bell size={20} className="text-orange-500" />} 
            label="自愈指南推送" 
            isToggle={true}
            toggleState={guidePush}
            onToggle={setGuidePush}
          />
          <SettingsItem 
            icon={<Shield size={20} className="text-green-500" />} 
            label="隐私与安全" 
            hasArrow={true}
            onClick={() => setShowPrivacy(true)}
          />
          <SettingsItem 
            icon={<Database size={20} className="text-apple-purple" />} 
            label="查看我的私人潜意识词典" 
            hasArrow={true}
            onClick={() => setShowDictionary(true)}
          />
        </SettingsGroup>
      </section>

      {/* 退出登录 */}
      {isLoggedIn && (
        <button 
          onClick={() => setShowLogoutConfirm(true)}
          className="mt-4 glass-panel rounded-2xl p-4 flex items-center justify-center gap-2 text-red-600 font-bold transition-colors active:scale-95 shadow-sm dark:shadow-none bg-white/90 dark:bg-transparent border border-black/5 dark:border-white/5 hover:bg-red-50 dark:hover:bg-red-500/10"
        >
          <LogOut size={18} />
          退出登录
        </button>
      )}
      
      <div className="text-center mt-4">
        <p className="text-[10px] text-gray-400 uppercase tracking-widest">Dream Topology v1.0 (Hackathon)</p>
      </div>

      <AnimatePresence>
        {showAuthView && (
          <AuthView 
            onClose={() => setShowAuthView(false)} 
            onSuccess={handleLoginSuccess}
          />
        )}
        {showEditProfile && (
          <EditProfileView onBack={() => setShowEditProfile(false)} />
        )}
        {showDictionary && (
          <SymbolDictionaryView onBack={() => setShowDictionary(false)} />
        )}
        {showPrivacy && (
          <PrivacySecurityView onBack={() => setShowPrivacy(false)} />
        )}
        {showDeviceSync && (
          <DeviceSyncView onBack={() => setShowDeviceSync(false)} />
        )}
        
        {/* Logout Confirmation Modal */}
        {showLogoutConfirm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-900 rounded-3xl p-6 w-full max-w-sm shadow-xl"
            >
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 text-center">确认退出登录？</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-6">
                退出后，您的本地未同步数据可能会被清除。
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 py-3 rounded-xl font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  取消
                </button>
                <button 
                  onClick={handleLogout}
                  className="flex-1 py-3 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 transition-colors shadow-sm shadow-red-500/30"
                >
                  确认退出
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function SettingsGroup({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-widest mb-2 pl-4 transition-colors">{title}</h3>
      <div className="glass-panel rounded-3xl overflow-hidden flex flex-col transition-colors shadow-sm dark:shadow-none bg-white/90 dark:bg-transparent border border-black/5 dark:border-white/5">
        {children}
      </div>
    </div>
  );
}

function SettingsItem({ 
  icon, 
  label, 
  value, 
  valueColor = "text-gray-500", 
  isToggle = false, 
  toggleState = false,
  hasArrow = false,
  onClick,
  onToggle
}: { 
  icon: React.ReactNode, 
  label: string, 
  value?: string, 
  valueColor?: string,
  isToggle?: boolean,
  toggleState?: boolean,
  hasArrow?: boolean,
  onClick?: () => void,
  onToggle?: (val: boolean) => void
}) {
  return (
    <div 
      onClick={isToggle && onToggle ? () => onToggle(!toggleState) : onClick}
      className={`flex items-center justify-between p-4 border-b border-black/5 dark:border-white/5 last:border-0 transition-colors ${(onClick || (isToggle && onToggle)) ? 'cursor-pointer active:bg-black/5 dark:active:bg-white/5' : ''}`}
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-black/5 dark:bg-white/5 flex items-center justify-center transition-colors">
          {icon}
        </div>
        <span className="font-bold text-sm text-gray-900 dark:text-white transition-colors">{label}</span>
      </div>
      
      <div className="flex items-center">
        {value && <span className={`text-sm ${valueColor} mr-2`}>{value}</span>}
        
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
