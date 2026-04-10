import { motion } from 'framer-motion';
import { ArrowLeft, Apple, Watch, Activity, ActivitySquare, Smartphone, Loader2, Link2, Download } from 'lucide-react';
import { useState } from 'react';
import { getXiaomiAuthUrl, syncXiaomiHealthData, syncOSHealthData, getHuaweiAuthUrl, syncHuaweiHealthData } from '../services/api';

interface DeviceSyncViewProps {
  onBack: () => void;
}

export default function DeviceSyncView({ onBack }: DeviceSyncViewProps) {
  const [healthSync, setHealthSync] = useState(false);
  const [xiaomiSync, setXiaomiSync] = useState(false);
  const [huaweiSync, setHuaweiSync] = useState(false);
  const [garminSync, setGarminSync] = useState(false);
  const [envMonitor, setEnvMonitor] = useState(true);

  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  // iOS Shortcut Modal
  const [showShortcutModal, setShowShortcutModal] = useState(false);

  const handleAppleHealthToggle = async (checked: boolean) => {
    if (!checked) {
      setHealthSync(false);
      return;
    }
    
    // In a real PWA/Capacitor app, this would trigger native HealthKit prompt
    // For Web/Hackathon, we show the iOS Shortcut guide
    setShowShortcutModal(true);
  };

  const simulateShortcutTrigger = async () => {
    try {
      setIsSyncing(true);
      setShowShortcutModal(false);
      setSyncMessage('正在接收 Apple Health 数据...');
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      const syncData = await syncOSHealthData();
      setHealthSync(true);
      setSyncMessage(`同步成功！来自 ${syncData.device_source} (心率 ${syncData.rem_heart_rate}bpm)`);
      
      setTimeout(() => setSyncMessage(null), 3000);
    } catch (error) {
      console.error(error);
      setSyncMessage('数据接收失败，请重试。');
      setTimeout(() => setSyncMessage(null), 3000);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleXiaomiToggle = async (checked: boolean) => {
    if (!checked) {
      setXiaomiSync(false);
      return;
    }

    try {
      setIsSyncing(true);
      setSyncMessage('正在获取小米授权...');
      const authRes = await getXiaomiAuthUrl();
      
      if (authRes.url) {
        window.location.href = authRes.url;
      } else {
        setSyncMessage('模拟授权成功，正在拉取昨晚睡眠数据...');
        const syncData = await syncXiaomiHealthData();
        setXiaomiSync(true);
        setSyncMessage(`同步成功！已获取数据：心率 ${syncData.rem_heart_rate}bpm`);
        setTimeout(() => setSyncMessage(null), 3000);
      }
    } catch (error) {
      console.error(error);
      setSyncMessage('同步失败，请检查网络或配置。');
      setTimeout(() => setSyncMessage(null), 3000);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleHuaweiToggle = async (checked: boolean) => {
    if (!checked) {
      setHuaweiSync(false);
      return;
    }

    try {
      setIsSyncing(true);
      setSyncMessage('正在连接华为 Health Kit...');
      const authRes = await getHuaweiAuthUrl();
      
      if (authRes.url) {
        window.location.href = authRes.url;
      } else {
        setSyncMessage('华为模拟授权成功，正在拉取数据...');
        const syncData = await syncHuaweiHealthData();
        setHuaweiSync(true);
        setSyncMessage(`同步成功！来自 ${syncData.device_source} (心率 ${syncData.rem_heart_rate}bpm)`);
        setTimeout(() => setSyncMessage(null), 3000);
      }
    } catch (error) {
      console.error(error);
      setSyncMessage('华为同步失败，请重试。');
      setTimeout(() => setSyncMessage(null), 3000);
    } finally {
      setIsSyncing(false);
    }
  };
  
  return (
    <motion.div 
      initial={{ opacity: 0, x: '100%' }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-50 bg-gray-50 dark:bg-black overflow-y-auto"
    >
      <div className="sticky top-0 z-10 bg-gray-50/80 dark:bg-black/80 backdrop-blur-md px-6 py-4 flex items-center gap-4 border-b border-black/5 dark:border-white/5">
        <button 
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-white dark:bg-white/10 flex items-center justify-center shadow-sm"
        >
          <ArrowLeft size={20} className="text-gray-900 dark:text-white" />
        </button>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">数据同步</h2>
      </div>

      <div className="p-6 flex flex-col gap-6 pb-20">
        {/* Sync Status Toast */}
        {syncMessage && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-black/80 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg backdrop-blur-sm flex items-center gap-2 max-w-[90%] w-max whitespace-nowrap overflow-hidden text-ellipsis">
            {isSyncing && <Loader2 size={14} className="animate-spin shrink-0" />}
            <span className="truncate">{syncMessage}</span>
          </div>
        )}

        <div className="glass-panel rounded-3xl p-6 flex flex-col items-center justify-center gap-3 text-center bg-white/90 dark:bg-white/5 border border-black/5 dark:border-white/5">
          <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 mb-2">
            <Activity size={32} />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">多设备协同同步</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            连接您的智能手表或手环，自动获取睡眠期间的心率、血氧与环境温度数据，为梦境解析提供生理依据。
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <h3 className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-widest pl-4">健康平台接入</h3>
          <div className="glass-panel rounded-3xl overflow-hidden flex flex-col bg-white/90 dark:bg-white/5 border border-black/5 dark:border-white/5">
            <SyncItem 
              icon={<Apple size={20} className={healthSync ? "text-apple-blue transition-colors" : "text-gray-400 transition-colors"} />} 
              label="Apple Health (推荐)" 
              value={healthSync ? "已连接" : "未连接"} 
              valueColor={healthSync ? "text-apple-blue" : "text-gray-400"}
              isToggle={true}
              toggleState={healthSync}
              onToggle={handleAppleHealthToggle}
            />
            <SyncItem 
              icon={<Activity size={20} className={xiaomiSync ? "text-orange-500 transition-colors" : "text-gray-400 transition-colors"} />} 
              label="小米运动健康" 
              value={xiaomiSync ? "已连接" : "未连接"} 
              valueColor={xiaomiSync ? "text-orange-500" : "text-gray-400"}
              isToggle={true}
              toggleState={xiaomiSync}
              onToggle={handleXiaomiToggle}
            />
            <SyncItem 
              icon={<ActivitySquare size={20} className={huaweiSync ? "text-red-500 transition-colors" : "text-gray-400 transition-colors"} />} 
              label="华为运动健康" 
              value={huaweiSync ? "已连接" : "未连接"} 
              valueColor={huaweiSync ? "text-red-500" : "text-gray-400"}
              isToggle={true}
              toggleState={huaweiSync}
              onToggle={handleHuaweiToggle}
            />
            <SyncItem 
              icon={<Watch size={20} className={garminSync ? "text-blue-500 transition-colors" : "text-gray-400 transition-colors"} />} 
              label="Garmin Connect" 
              value={garminSync ? "已连接" : "未连接"} 
              valueColor={garminSync ? "text-blue-500" : "text-gray-400"}
              isToggle={true}
              toggleState={garminSync}
              onToggle={setGarminSync}
            />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <h3 className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-widest pl-4">其他数据源</h3>
          <div className="glass-panel rounded-3xl overflow-hidden flex flex-col bg-white/90 dark:bg-white/5 border border-black/5 dark:border-white/5">
            <SyncItem 
              icon={<Smartphone size={20} className="text-gray-500" />} 
              label="环境噪音与温度监测" 
              isToggle={true}
              toggleState={envMonitor}
              onToggle={setEnvMonitor}
            />
          </div>
        </div>
      </div>

      {/* iOS Shortcut Modal */}
      {showShortcutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white dark:bg-gray-900 rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-black/5 dark:border-white/10"
          >
            <div className="w-12 h-12 bg-apple-blue/10 text-apple-blue rounded-full flex items-center justify-center mb-4 mx-auto">
              <Apple size={24} />
            </div>
            <h3 className="text-xl font-bold text-center text-gray-900 dark:text-white mb-2">连接 Apple Health</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-6">
              由于 Web 浏览器限制，我们无法直接读取系统健康数据。请通过 iOS 快捷指令完成一键同步。这能兼容你绑定的所有品牌手环。
            </p>
            
            <div className="space-y-3 mb-6">
              <button className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-white/5 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-200">
                <div className="flex items-center gap-2">
                  <Download size={16} className="text-apple-blue" />
                  <span>1. 获取 "梦境拓卜同步" 快捷指令</span>
                </div>
                <Link2 size={16} className="text-gray-400" />
              </button>
              <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-200">
                <div className="flex items-center gap-2 mb-1">
                  <Activity size={16} className="text-apple-blue" />
                  <span>2. 运行指令完成数据回填</span>
                </div>
                <p className="text-xs text-gray-500 font-normal pl-6">起床后对 Siri 说“记录梦境”，即可自动读取昨晚心率与睡眠。</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setShowShortcutModal(false)}
                className="flex-1 py-3 rounded-xl font-bold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-white/5"
              >
                取消
              </button>
              <button 
                onClick={simulateShortcutTrigger}
                className="flex-1 py-3 rounded-xl font-bold text-white bg-apple-blue shadow-lg shadow-apple-blue/30"
              >
                模拟已运行
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}

function SyncItem({ 
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