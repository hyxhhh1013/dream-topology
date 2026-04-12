import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, TrendingUp, Sparkles, ChevronRight, CalendarDays, X } from 'lucide-react';
import SymbolDictionaryView from './SymbolDictionaryView';
import JournalDetailView from './JournalDetailView';
import DreamCalendarView from './DreamCalendarView';
import MeditationView from './MeditationView';
import { getUserDreams, fetchDreamSymbols } from '../services/api';

export default function InsightsView({ dreamData }: { dreamData?: any }) {
  const [activeTab, setActiveTab] = useState<'stats' | 'journal'>('stats');
  const [showDictionary, setShowDictionary] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showMeditation, setShowMeditation] = useState(false);
  const [selectedJournal, setSelectedJournal] = useState<any>(null);
  const [selectedSymbol, setSelectedSymbol] = useState<any>(null);
  const [showGuide, setShowGuide] = useState(false);
  
  const [allDreams, setAllDreams] = useState<any[]>([]);
  const [isLoadingDreams, setIsLoadingDreams] = useState(true);

  const [recentSymbols, setRecentSymbols] = useState<any[]>([]);
  const archetypeConfidence = dreamData?.analysis?.scientific_basis?.confidence;
  const archetypeConfidencePct = (() => {
    if (typeof archetypeConfidence !== 'number' || Number.isNaN(archetypeConfidence)) return undefined;
    const raw = archetypeConfidence <= 1 ? archetypeConfidence * 100 : archetypeConfidence;
    return Math.max(0, Math.min(100, Math.round(raw)));
  })();

  // Fetch all dreams for the list view
  useEffect(() => {
    async function fetchDreams() {
      try {
        setIsLoadingDreams(true);
        const dreams = await getUserDreams();
        setAllDreams(dreams);
      } catch (e) {
        console.error("Failed to fetch dreams", e);
      } finally {
        setIsLoadingDreams(false);
      }
    }
    if (activeTab === 'journal') {
      fetchDreams();
    }
  }, [activeTab]);

  // Fetch recent symbols for the stats view
  useEffect(() => {
    async function fetchSymbols() {
      try {
        const symbols = await fetchDreamSymbols();
        setRecentSymbols(symbols.slice(0, 2)); // Only take top 2 for the dashboard
      } catch (e) {
        console.error("Failed to fetch symbols", e);
      }
    }
    if (activeTab === 'stats') {
      fetchSymbols();
    }
  }, [activeTab]);

  // Dynamic meditation guide based on emotion
  const getMeditationGuide = () => {
    if (!dreamData || !dreamData.analysis || !dreamData.analysis.emotion) {
      return {
        title: "睡前 10 分钟降噪冥想",
        desc: "针对你近期的「高频应激梦境」",
        type: "relax"
      };
    }

    const emotion = dreamData.analysis.emotion.toUpperCase();
    if (['FEAR', 'ANXIETY', 'STRESS'].includes(emotion)) {
      return {
        title: "4-7-8 深度安神呼吸法",
        desc: "有效降低自主神经系统唤醒水平，缓解梦魇带来的躯体紧张。",
        type: "breathe"
      };
    } else if (['ANGER', 'FRUSTRATION'].includes(emotion)) {
      return {
        title: "情绪释放可视化冥想",
        desc: "通过意象引导，将潜意识中被压抑的愤怒转化为具象的能量流排出体外。",
        type: "release"
      };
    } else if (['SADNESS', 'GRIEF', 'MELANCHOLY'].includes(emotion)) {
      return {
        title: "内在孩童拥抱练习",
        desc: "针对梦境中展现的失落感，提供温柔的心理抚慰与自我慈悲。",
        type: "comfort"
      };
    } else {
      return {
        title: "睡前 10 分钟潜意识锚定",
        desc: "巩固你在梦境中获得的积极力量，为今晚的深度睡眠设定良好意图。",
        type: "anchor"
      };
    }
  };

  const guideData = getMeditationGuide();

  useEffect(() => {
    const saved = localStorage.getItem('dream_topology_guide_push');
    if (saved !== null) {
      setShowGuide(JSON.parse(saved));
    }
    
    // Listen for storage events in case it's changed in another tab/component
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'dream_topology_guide_push' && e.newValue !== null) {
        setShowGuide(JSON.parse(e.newValue));
      }
    };
    
    // Also set up an interval to poll just in case (simple cross-component sync for hackathon)
    const interval = setInterval(() => {
      const current = localStorage.getItem('dream_topology_guide_push');
      if (current !== null && JSON.parse(current) !== showGuide) {
        setShowGuide(JSON.parse(current));
      }
    }, 1000);

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [showGuide]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col h-full gap-4 pb-16 sm:pb-10"
    >
      <header className="flex justify-between items-end mb-2 sm:mb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 dark:text-white transition-colors">洞察</h1>
          <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mt-0.5 sm:mt-1 transition-colors">探索你的潜意识百科</p>
        </div>
      </header>

      {/* 顶部标签切换 */}
      <div className="flex p-1 bg-[#F0F2F5] dark:bg-white/5 rounded-xl sm:rounded-2xl border border-black/5 dark:border-white/10 transition-colors">
        <button 
          onClick={() => setActiveTab('stats')}
          className={`flex-1 py-1.5 sm:py-2 text-xs sm:text-sm font-bold rounded-lg sm:rounded-xl transition-all duration-300 ${activeTab === 'stats' ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-300'}`}
        >
          数据统计
        </button>
        <button 
          onClick={() => setActiveTab('journal')}
          className={`flex-1 py-1.5 sm:py-2 text-xs sm:text-sm font-bold rounded-lg sm:rounded-xl transition-all duration-300 ${activeTab === 'journal' ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-300'}`}
        >
          梦境日记
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'stats' ? (
          <motion.div 
            key="stats"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col gap-4 sm:gap-6"
          >
            {/* 核心统计卡片 */}
            <section className="grid grid-cols-2 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="meta-card p-3.5 sm:p-5 flex flex-col gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-apple-blue/10 flex items-center justify-center text-apple-blue">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <p className="text-[9px] sm:text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider transition-colors">月度高频符号</p>
                  <p className="text-sm sm:text-xl font-bold text-gray-900 dark:text-white mt-0.5 sm:mt-1 transition-colors truncate" title={recentSymbols.length > 0 ? recentSymbols.map(s => s.name).join(' / ') : '迷宫 / 坠落'}>
                    {recentSymbols.length > 0 
                      ? recentSymbols.map(s => s.name).join(' / ') 
                      : '迷宫 / 坠落'}
                  </p>
                </div>
              </div>
              <div className="meta-card p-3.5 sm:p-5 flex flex-col gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-apple-blue/10 flex items-center justify-center text-apple-blue">
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <p className="text-[9px] sm:text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider transition-colors">主导心理原型</p>
                  <p className="text-sm sm:text-xl font-bold text-gray-900 dark:text-white mt-0.5 sm:mt-1 transition-colors flex items-baseline">
                    <span className="truncate" title={dreamData && dreamData.analysis && dreamData.analysis.overall_archetype ? dreamData.analysis.overall_archetype : '阿尼玛'}>
                      {dreamData && dreamData.analysis && dreamData.analysis.overall_archetype
                        ? dreamData.analysis.overall_archetype.split('（')[0].split('(')[0] // 兼容中英文括号
                        : '阿尼玛'} 
                    </span>
                    <span className="text-[10px] sm:text-sm font-normal text-gray-500 dark:text-gray-400 ml-1.5 shrink-0">
                      {archetypeConfidencePct !== undefined ? `${archetypeConfidencePct}%` : '—'}
                    </span>
                  </p>
                </div>
              </div>
            </section>

            {/* 符号百科列表 */}
            <section className="flex flex-col gap-3 sm:gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white transition-colors">最近解析的符号</h2>
                <button 
                  onClick={() => setShowDictionary(true)}
                  className="text-[10px] sm:text-xs text-apple-blue font-bold hover:opacity-80 transition-opacity"
                >
                  查看全部
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 items-stretch">
                {recentSymbols.length > 0 ? (
                  recentSymbols.map((symbol: any, idx: number) => (
                    <SymbolCard 
                      key={idx}
                      icon={"🔮"} // Placeholder since category isn't in db currently
                      name={symbol.name} 
                      archetype={symbol.universal_meaning.split('。')[0] || symbol.universal_meaning.substring(0, 15)} 
                      count={1} 
                      trend="up"
                      desc={symbol.universal_meaning}
                      onClick={() => setSelectedSymbol({
                        icon: "🔮",
                        name: symbol.name,
                        archetype: symbol.universal_meaning.split('。')[0] || symbol.universal_meaning.substring(0, 15),
                        desc: symbol.universal_meaning.split('。').slice(0, 2).join('。') + '。', // 基本含义取前两句话
                        count: 1,
                        trend: 'up',
                        fullAnalysis: symbol.universal_meaning, // 深度分析保留完整段落
                        cultureTag: symbol.culture_tag,
                        symbolEmotion: symbol.emotion || symbol.symbol_emotion
                      })}
                    />
                  ))
                ) : (
                  <div className="col-span-1 md:col-span-2 py-8 flex justify-center text-gray-500 text-xs sm:text-sm">
                    暂无符号记录，快去解析一个梦境吧！
                  </div>
                )}
              </div>
            </section>

            {/* 自愈指南推送 */}
            {showGuide && (
              <section className="mt-1">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4 transition-colors">专属自愈指南</h2>
                <motion.div 
                  whileHover={{ scale: 1.01 }}
                  className="meta-card p-4 sm:p-6 relative overflow-hidden transition-colors"
                >
                  <div className="absolute top-0 right-0 w-24 sm:w-32 h-24 sm:h-32 bg-apple-blue/12 blur-3xl rounded-full" />
                  
                  <div className="relative z-10 flex flex-col gap-3 sm:gap-4">
                    <div className="flex items-center gap-2.5 sm:gap-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-apple-blue text-white flex items-center justify-center shadow-lg">
                        <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-gray-900 dark:text-white transition-colors text-sm sm:text-base truncate">{guideData.title}</h3>
                        <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 transition-colors font-medium mt-0.5 pr-2 truncate sm:whitespace-normal">{guideData.desc}</p>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => setShowMeditation(true)}
                      className="meta-btn-primary w-full"
                    >
                      开始今日练习 <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                  </div>
                </motion.div>
              </section>
            )}
          </motion.div>
        ) : (
          <motion.div 
            key="journal"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col gap-3 sm:gap-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white transition-colors">所有记录</h2>
              <button 
                onClick={() => setShowCalendar(true)}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/75 dark:bg-white/10 border border-black/10 dark:border-white/12 backdrop-blur flex items-center justify-center text-gray-700 dark:text-white/90 hover:bg-white hover:dark:bg-white/14 transition-colors"
              >
                <CalendarDays className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>

            {/* 日记列表项 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 items-stretch">
              {isLoadingDreams ? (
                <div className="col-span-1 md:col-span-2 py-8 flex justify-center text-gray-500 text-xs sm:text-sm">
                  加载中...
                </div>
              ) : allDreams.length > 0 ? (
                allDreams.map((dream) => (
                  <JournalCard 
                    key={dream.id}
                    date={dream.date === "今天" ? "今天" : dream.date.substring(5, 10).replace('-', '月') + '日'}
                    time={dream.time}
                    title={dream.title}
                    preview={dream.content.substring(0, 40) + '...'}
                    emotion={dream.emotion}
                    tags={dream.tags}
                    onClick={() => setSelectedJournal({
                        date: dream.date === "今天" ? "今天" : dream.date.substring(5, 10).replace('-', '月') + '日', 
                        time: dream.time, 
                        title: dream.title, 
                        content: dream.content, 
                        emotion: dream.emotion, 
                        tags: dream.tags,
                        crossAnalysis: dream.crossAnalysis || dream.cross_analysis || '暂无交叉分析数据'
                      })}
                  />
                ))
              ) : (
                <div className="col-span-1 md:col-span-2 py-8 flex justify-center text-gray-500 text-xs sm:text-sm">
                  暂无梦境记录
                </div>
              )}
            </div>
            
            <div className="mt-2 sm:mt-4 text-center">
              <button className="text-[10px] sm:text-sm font-bold text-gray-400 hover:text-apple-blue transition-colors">
                加载更多历史记录
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDictionary && (
          <SymbolDictionaryView onBack={() => setShowDictionary(false)} />
        )}
        {showCalendar && (
          <DreamCalendarView 
            onBack={() => setShowCalendar(false)} 
            onSelectJournal={(journal) => setSelectedJournal(journal)}
          />
        )}
        {showMeditation && (
          <MeditationView onBack={() => setShowMeditation(false)} />
        )}
        {selectedJournal && (
          <JournalDetailView 
            {...selectedJournal}
            onBack={() => setSelectedJournal(null)}
            onUpdate={(updatedData) => setSelectedJournal({ ...selectedJournal, ...updatedData })}
          />
        )}
        {selectedSymbol && (
          <SymbolDetailCard 
            symbol={selectedSymbol} 
            onClose={() => setSelectedSymbol(null)} 
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function SymbolCard({ icon, name, archetype, count, trend, desc, onClick }: { icon: string, name: string, archetype: string, count: number, trend: 'up' | 'down', desc: string, onClick?: () => void }) {
  return (
    <motion.div 
      onClick={onClick}
      whileHover={{ scale: 1.01 }}
      className="meta-card p-5 flex flex-col gap-3 transition-all cursor-pointer h-full"
    >
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#F7F8FA] dark:bg-black/30 flex items-center justify-center text-2xl border border-black/5 dark:border-white/10">
            {icon}
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white transition-colors text-base">{name}</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 transition-colors font-medium mt-0.5 max-w-[120px] truncate" title={archetype}>原型：{archetype}</p>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[10px] font-bold text-gray-500 dark:text-gray-500 uppercase tracking-widest transition-colors mb-1">本月出现</span>
          <div className="flex items-center gap-1">
            <span className="text-xl font-black text-gray-900 dark:text-white transition-colors">{count}</span>
            <span className="text-xs text-gray-500 font-medium">次</span>
            {trend === 'up' ? (
              <TrendingUp size={14} className="text-red-500 ml-1" />
            ) : (
              <TrendingUp size={14} className="text-green-500 ml-1 transform rotate-180 scale-y-[-1]" />
            )}
          </div>
        </div>
      </div>
      <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed bg-[#F7F8FA] dark:bg-black/20 p-4 rounded-2xl transition-colors font-medium line-clamp-3">
        {desc}
      </p>
    </motion.div>
  );
}

function SymbolDetailCard({ symbol, onClose }: { symbol: any, onClose: () => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: '100%' }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: '100%' }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[70] bg-[#F0F2F5] dark:bg-[#1C1E21] overflow-y-auto"
    >
      <div className="max-w-md mx-auto min-h-screen px-6 pt-12 pb-24 flex flex-col gap-6 relative">
        <header className="flex justify-between items-center sticky top-0 bg-[#F0F2F5]/80 dark:bg-[#1C1E21]/80 backdrop-blur-xl z-10 py-4 -mx-6 px-6">
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/75 dark:bg-white/10 border border-black/10 dark:border-white/12 backdrop-blur flex items-center justify-center text-gray-700 dark:text-white/90 transition-colors shadow-sm hover:bg-white hover:dark:bg-white/14"
          >
            <X size={20} />
          </button>
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">符号解析</h2>
          <div className="w-10 h-10"></div> {/* Placeholder for balance */}
        </header>

        <article className="flex flex-col gap-6 mt-4">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="w-24 h-24 rounded-[2rem] bg-white dark:bg-black/40 flex items-center justify-center text-5xl shadow-sm border border-black/5 dark:border-white/5">
              {symbol.icon}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{symbol.name}</h1>
              <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#E8F3FF] dark:bg-white/8 text-apple-blue dark:text-white/90 text-sm font-bold border border-black/5 dark:border-white/10">
                <Sparkles size={16} />
                <span>原型：{symbol.archetype}</span>
              </div>
            </div>
          </div>

          <div className="meta-card p-6 mt-4">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">基本含义</h3>
            <p className="text-base text-gray-700 dark:text-gray-200 leading-relaxed font-medium whitespace-pre-wrap">
              {symbol.desc}
            </p>
            
            {(symbol.cultureTag || symbol.symbolEmotion) && (
              <div className="mt-4 flex flex-wrap gap-2">
                {symbol.cultureTag && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#E8F3FF] dark:bg-white/8 text-apple-blue dark:text-white/90 text-xs font-bold border border-black/5 dark:border-white/10">
                    文化标签: {symbol.cultureTag}
                  </span>
                )}
                {symbol.symbolEmotion && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-red-500/10 text-red-600 dark:text-red-300 text-xs font-bold border border-black/5 dark:border-white/10">
                    潜在情绪: {symbol.symbolEmotion}
                  </span>
                )}
              </div>
            )}
          </div>

          {symbol.fullAnalysis && (
            <div className="meta-card p-6">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">深度荣格分析</h3>
              <p className="text-base text-gray-700 dark:text-gray-200 leading-relaxed font-medium whitespace-pre-wrap">
                {symbol.fullAnalysis}
              </p>
            </div>
          )}

          <div className="rounded-[20px] p-6 bg-[#E8F3FF] dark:bg-white/6 border border-[#0064E0]/18 dark:border-white/10 shadow-sm flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-white/70 dark:bg-white/10 border border-black/10 dark:border-white/12 flex items-center justify-center text-apple-blue dark:text-white/90 shrink-0">
              <TrendingUp size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">近期频次分析</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium leading-relaxed">
                本月该符号已出现 <span className="text-black dark:text-white font-bold">{symbol.count}</span> 次，呈上升趋势。这通常是一个明确的信号，表明相关的心理议题目前在你的潜意识中占据了主导地位，需要你分配更多的意识能量去关注和整合。
              </p>
            </div>
          </div>
        </article>
      </div>
    </motion.div>
  );
}

function JournalCard({ date, time, title, preview, emotion, tags, onClick }: { date: string, time: string, title: string, preview: string, emotion: string, tags: string[], onClick?: () => void }) {
  const emotionColors: Record<string, string> = {
    anxious: 'bg-apple-blue',
    fear: 'bg-red-500',
    stress: 'bg-[#F7B928]',
    peace: 'bg-[#31A24C]'
  };

  return (
    <motion.div 
      onClick={onClick}
      whileHover={{ scale: 1.01 }}
      className="meta-card p-5 flex flex-col gap-3 transition-all cursor-pointer relative overflow-hidden h-full"
    >
      <div className="flex justify-between items-start relative z-10">
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-center justify-center w-12 h-12 rounded-2xl bg-[#F7F8FA] dark:bg-black/30 border border-black/5 dark:border-white/10">
            <span className="text-[10px] font-bold text-gray-500 uppercase">{date}</span>
            <span className="text-sm font-black text-gray-900 dark:text-white">{time}</span>
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white transition-colors text-base flex items-center gap-2">
              {title}
              <span className={`w-2 h-2 rounded-full ${emotionColors[emotion] ?? 'bg-gray-400'}`} />
            </h3>
            <div className="flex gap-2 mt-1">
              {tags.map(tag => (
                <span key={tag} className="text-[10px] font-bold text-gray-700 dark:text-gray-200 bg-[#F1F4F7] dark:bg-white/8 px-2 py-0.5 rounded-md border border-black/5 dark:border-white/10">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </div>
        <button className="text-gray-400 hover:text-apple-blue transition-colors">
          <ChevronRight size={20} />
        </button>
      </div>
      
      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-medium line-clamp-2 mt-1 relative z-10">
        {preview}
      </p>
    </motion.div>
  );
}
