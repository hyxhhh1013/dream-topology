import { useState, useEffect } from 'react';
import { Mic, Network, BookOpen, Settings, Sun, Moon } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import CaptureView from './views/CaptureView';
import TopologyView from './views/TopologyView';
import InsightsView from './views/InsightsView';
import SettingsView from './views/SettingsView';
import TarotView from './views/TarotView';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('capture');
  const [isDarkMode, setIsDarkMode] = useState(false); // Default to light mode
  const [toast, setToast] = useState<{message: string, visible: boolean}>({ message: '', visible: false });
  const [dreamData, setDreamData] = useState<any>(null); // Store parsed dream data
  const [showTarot, setShowTarot] = useState(false);
  const [isMobileNavVisible, setIsMobileNavVisible] = useState(true);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    let hideTimer: ReturnType<typeof setTimeout> | null = null;
    const isMobile = () => window.innerWidth < 768;
    const isTouchDevice = () => window.matchMedia('(hover: none) and (pointer: coarse)').matches;

    const showAndScheduleHide = () => {
      if (!isMobile() || !isTouchDevice()) {
        setIsMobileNavVisible(true);
        return;
      }
      setIsMobileNavVisible(true);
      if (hideTimer) clearTimeout(hideTimer);
      hideTimer = setTimeout(() => setIsMobileNavVisible(false), 2200);
    };

    const handleResize = () => {
      if (!isMobile() || !isTouchDevice()) setIsMobileNavVisible(true);
      else showAndScheduleHide();
    };

    showAndScheduleHide();
    window.addEventListener('scroll', showAndScheduleHide, { passive: true });
    window.addEventListener('touchstart', showAndScheduleHide, { passive: true });
    window.addEventListener('touchmove', showAndScheduleHide, { passive: true });
    window.addEventListener('click', showAndScheduleHide);
    window.addEventListener('resize', handleResize);

    return () => {
      if (hideTimer) clearTimeout(hideTimer);
      window.removeEventListener('scroll', showAndScheduleHide);
      window.removeEventListener('touchstart', showAndScheduleHide);
      window.removeEventListener('touchmove', showAndScheduleHide);
      window.removeEventListener('click', showAndScheduleHide);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  // 全局 Toast 提示功能
  const showToast = (message: string) => {
    setToast({ message, visible: true });
    setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, 2500);
  };

  return (
    <div className={`relative min-h-screen transition-colors duration-500 ${isDarkMode ? 'bg-[#1C1E21] text-white' : 'bg-[#F0F2F5] text-black'} overflow-hidden pb-24 selection:bg-[#E8F3FF] dark:selection:bg-white/12`}>
      {/* 全局 Toast 提示 */}
      <AnimatePresence>
        {toast.visible && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-6 left-0 right-0 z-[100] flex justify-center pointer-events-none"
          >
            <div className="bg-black/80 dark:bg-white/90 text-white dark:text-black backdrop-blur-md px-6 py-3 rounded-full shadow-2xl font-bold text-sm border border-white/10 dark:border-black/10">
              {toast.message}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showTarot && (
          <TarotView
            onBack={() => setShowTarot(false)}
            dreamText={dreamData?.dreamText}
            emotion={dreamData?.analysis?.emotion}
          />
        )}
      </AnimatePresence>

      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className={`absolute top-[-20%] right-[-20%] w-[70%] h-[70%] ${isDarkMode ? 'bg-apple-blue/14' : 'bg-apple-blue/8'} blur-[120px] rounded-full`} />
      </div>

      {/* Theme Toggle Button - Floating */}
      <motion.button 
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={toggleTheme}
        className="fixed top-4 right-4 md:top-8 md:right-8 z-50 p-3 rounded-full transition-colors shadow-sm dark:shadow-none bg-white/80 dark:bg-black/20 backdrop-blur-md border border-black/5 dark:border-white/10"
        aria-label="Toggle theme"
      >
        {isDarkMode ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} className="text-apple-blue" />}
      </motion.button>

      {/* 主视图区域 */}
      <div className="md:pl-24 w-full min-h-screen flex justify-center">
        <main className="relative z-10 w-full max-w-md md:max-w-3xl lg:max-w-5xl h-full min-h-screen pt-16 md:pt-20 px-6 pb-24 md:pb-12">
          <AnimatePresence mode="wait">
            {activeTab === 'capture' && <motion.div key="capture" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }}><CaptureView onGenerate={(data) => { 
              if(data) setDreamData(data);
              setActiveTab('topology'); // Jump directly to topology to show the updated data
              showToast("解析完成，可继续进行塔罗三牌联动解读"); 
            }} /></motion.div>}
            {activeTab === 'topology' && <motion.div key="topology" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }}><TopologyView onBack={() => setActiveTab('capture')} analysisData={dreamData?.analysis} onOpenTarot={() => setShowTarot(true)} /></motion.div>}
            {activeTab === 'insights' && <motion.div key="insights" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }}><InsightsView dreamData={dreamData} /></motion.div>}
            {activeTab === 'settings' && <motion.div key="settings" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }}><SettingsView /></motion.div>}
          </AnimatePresence>
        </main>
      </div>

      <nav className={`fixed z-50 transition-all duration-300 bg-white/78 dark:bg-white/10 backdrop-blur-md border border-black/10 dark:border-white/12 shadow-sm
        bottom-3 left-1/2 -translate-x-1/2 w-[calc(100%-1.25rem)] max-w-md py-2 px-3 rounded-2xl border
        md:rounded-none md:top-0 md:bottom-0 md:left-0 md:translate-x-0 md:w-24 md:h-screen md:py-12 md:px-0 md:border-t-0 md:border-r md:flex md:flex-col
        ${isMobileNavVisible ? 'translate-y-0 opacity-100' : 'translate-y-[105%] opacity-0 pointer-events-none'}
        md:translate-y-0 md:opacity-100 md:pointer-events-auto
        ${isDarkMode ? 'border-white/12' : 'border-black/10'}`}>
        <div className="w-full max-w-md mx-auto md:max-w-none md:mx-0 md:h-full flex md:flex-col justify-between items-center relative gap-2 md:gap-8">
          <NavItem 
            icon={<Mic size={24} />} 
            label="捕获" 
            isActive={activeTab === 'capture'} 
            onClick={() => setActiveTab('capture')} 
            isDarkMode={isDarkMode}
          />
          <NavItem 
            icon={<Network size={24} />} 
            label="拓扑" 
            isActive={activeTab === 'topology'} 
            onClick={() => setActiveTab('topology')} 
            isDarkMode={isDarkMode}
          />
          <NavItem 
            icon={<BookOpen size={24} />} 
            label="洞察" 
            isActive={activeTab === 'insights'} 
            onClick={() => setActiveTab('insights')} 
            isDarkMode={isDarkMode}
          />
          <NavItem 
            icon={<Settings size={24} />} 
            label="设置" 
            isActive={activeTab === 'settings'} 
            onClick={() => setActiveTab('settings')} 
            isDarkMode={isDarkMode}
          />
        </div>
      </nav>
    </div>
  );
}

function NavItem({ icon, label, isActive, onClick, isDarkMode }: { icon: React.ReactNode; label: string; isActive: boolean; onClick: () => void; isDarkMode: boolean }) {
  const activeColor = 'text-apple-blue';
  const inactiveColor = isDarkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600';
  
  return (
    <button 
      onClick={onClick}
      className={`relative flex flex-col items-center justify-center w-14 md:w-16 transition-colors duration-300 ${isActive ? activeColor : inactiveColor} group`}
    >
      <div className={`mb-0.5 md:mb-1 transition-all duration-300 ${isActive ? 'scale-110 drop-shadow-[0_0_8px_rgba(0,122,255,0.4)]' : 'scale-100 group-hover:scale-105'}`}>
        {icon}
      </div>
      <span className={`text-[10px] font-bold tracking-wide transition-all ${isActive ? 'opacity-100' : 'opacity-70'}`}>{label}</span>
      {isActive && (
        <motion.div 
          layoutId="nav-indicator"
          className="absolute -top-4 md:top-auto md:-left-4 md:right-auto md:w-1 md:h-8 w-8 h-1 bg-apple-blue rounded-b-full md:rounded-b-none md:rounded-r-full shadow-[0_2px_10px_rgba(0,122,255,0.5)] md:shadow-[2px_0_10px_rgba(0,122,255,0.5)]"
        />
      )}
    </button>
  );
}

export default App;
