import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, ChevronRight as ChevronRightIcon, Plus, X } from 'lucide-react';
import { getUserDreams } from '../services/api';

interface DreamCalendarProps {
  onBack: () => void;
  onSelectJournal?: (journal: any) => void;
}

export default function DreamCalendarView({ onBack, onSelectJournal }: DreamCalendarProps) {
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const currentMonth = viewDate.getMonth();
  const currentYear = viewDate.getFullYear();
  const currentDay = today.getDate();

  const [selectedDate, setSelectedDate] = useState(currentDay);
  const [dreamsData, setDreamsData] = useState<Record<number, any[]>>({});

  useEffect(() => {
    async function loadDreams() {
      try {
        const dreams = await getUserDreams();
        
        // Transform array to Record<day, dream[]> for current month
        const formattedData: Record<number, any[]> = {};
        
        dreams.forEach(dream => {
          const date = new Date(dream.date);
          // Only map dreams from the current month/year to the calendar view
          if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
            const day = date.getDate();
            if (!formattedData[day]) {
              formattedData[day] = [];
            }
            const month = date.getMonth() + 1;
            const year = date.getFullYear();
            const isTodayDate =
              day === currentDay &&
              currentMonth === today.getMonth() &&
              currentYear === today.getFullYear();

            formattedData[day].push({
              ...dream,
              date: isTodayDate ? "今天" : `${year}年${month}月${day}日`
            });
          }
        });

        setDreamsData(formattedData);
      } catch (error) {
        console.error("Failed to fetch dreams for calendar", error);
      }
    }

    loadDreams();
  }, [currentMonth, currentYear, currentDay]);

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const isCurrentViewingMonth = currentMonth === today.getMonth() && currentYear === today.getFullYear();

  const goPrevMonth = () => {
    setViewDate(new Date(currentYear, currentMonth - 1, 1));
    setSelectedDate(1);
  };

  const goNextMonth = () => {
    setViewDate(new Date(currentYear, currentMonth + 1, 1));
    setSelectedDate(1);
  };

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDay }, (_, i) => i);
  // Manual entry modal state
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualTitle, setManualTitle] = useState('');
  const [manualContent, setManualContent] = useState('');
  const [manualEmotion, setManualEmotion] = useState('neutral');
  const [manualSaving, setManualSaving] = useState(false);

  const emotionOptions = [
    { value: 'peace', label: '平静', color: 'bg-apple-blue' },
    { value: 'neutral', label: '中性', color: 'bg-gray-400' },
    { value: 'anxious', label: '焦虑', color: 'bg-purple-500' },
    { value: 'stress', label: '压力', color: 'bg-orange-500' },
    { value: 'fear', label: '恐惧', color: 'bg-red-500' },
  ];

  const handleOpenManualEntry = useCallback(() => {
    setManualTitle('');
    setManualContent('');
    setManualEmotion('neutral');
    setShowManualEntry(true);
  }, []);

  const handleSaveManualEntry = useCallback(async () => {
    if (!manualTitle.trim() || !manualContent.trim()) return;

    setManualSaving(true);
    // Store in localStorage so it persists
    try {
      const key = `dream_topology_manual_${currentYear}_${currentMonth + 1}_${selectedDate}`;
      const existing = localStorage.getItem(key);
      const entries = existing ? JSON.parse(existing) : [];
      const newEntry = {
        id: `manual_${Date.now()}`,
        title: manualTitle.trim(),
        content: manualContent.trim(),
        emotion: manualEmotion,
        tags: ['手动补录'],
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        date: `${currentYear}年${currentMonth + 1}月${selectedDate}日`,
      };
      entries.push(newEntry);
      localStorage.setItem(key, JSON.stringify(entries));

      // Also merge into dreamsData for current view
      setDreamsData(prev => {
        const day = selectedDate;
        const existingDay = prev[day] || [];
        return { ...prev, [day]: [...existingDay, newEntry] };
      });

      setShowManualEntry(false);
    } catch (e) {
      console.error('Failed to save manual entry', e);
    } finally {
      setManualSaving(false);
    }
  }, [manualTitle, manualContent, manualEmotion, currentYear, currentMonth, selectedDate]);

  // Load manual entries from localStorage on mount/month change
  useEffect(() => {
    const prefix = `dream_topology_manual_${currentYear}_${currentMonth + 1}_`;
    try {
      for (let d = 1; d <= daysInMonth; d++) {
        const key = prefix + d;
        const raw = localStorage.getItem(key);
        if (raw) {
          const entries = JSON.parse(raw);
          if (entries.length > 0) {
            setDreamsData(prev => {
              if (prev[d]?.some((e: any) => e.id?.startsWith('manual_'))) {
                return prev; // already loaded
              }
              const existingDay = prev[d] || [];
              return { ...prev, [d]: [...existingDay, ...entries] };
            });
          }
        }
      }
    } catch (e) {
      console.error('Failed to load manual entries', e);
    }
  }, [currentYear, currentMonth, daysInMonth]);

  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  const emotionColors: Record<string, string> = {
    anxious: 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]',
    fear: 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]',
    stress: 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]',
    peace: 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]',
    neutral: 'bg-gray-400 shadow-[0_0_8px_rgba(156,163,175,0.8)]'
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: '100%' }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: '100%' }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[60] bg-apple-gray-light dark:bg-apple-black overflow-y-auto"
    >
      <div className="max-w-md mx-auto min-h-screen px-6 pt-12 pb-24 flex flex-col gap-6 relative">
        <header className="flex items-center gap-4 sticky top-0 bg-apple-gray-light/80 dark:bg-apple-black/80 backdrop-blur-xl z-10 py-4 -mx-6 px-6">
          <button 
            onClick={onBack}
            className="w-10 h-10 rounded-full glass-panel flex items-center justify-center text-gray-600 dark:text-gray-300 transition-colors shadow-sm"
          >
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-black dark:text-white flex items-center gap-2">
            <CalendarIcon size={20} className="text-apple-blue" />
            梦境日历
          </h1>
        </header>

        <section className="glass-panel rounded-[2rem] p-6 bg-white/60 dark:bg-white/5 border border-black/5 dark:border-white/5 shadow-sm flex flex-col gap-4">
          <div className="flex justify-between items-center px-2">
            <h2 className="text-lg font-bold text-black dark:text-white">
              {currentYear}年 {currentMonth + 1}月
            </h2>
            <div className="flex gap-2">
              <button
                onClick={goPrevMonth}
                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                aria-label="上一个月"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={goNextMonth}
                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                aria-label="下一个月"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-y-4 gap-x-1 text-center mt-2">
            {weekDays.map(day => (
              <div key={day} className="text-xs font-bold text-gray-400 mb-2">
                {day}
              </div>
            ))}
            
            {blanks.map(blank => (
              <div key={`blank-${blank}`} className="w-10 h-10 mx-auto" />
            ))}
            
            {days.map(day => {
                const isSelected = selectedDate === day;
                const dreamsForDay = dreamsData[day] || [];
                const hasDream = dreamsForDay.length > 0;
                const isToday = isCurrentViewingMonth && day === currentDay;
                
                return (
                <button
                  key={day}
                  onClick={() => setSelectedDate(day)}
                  className={`relative w-10 h-10 mx-auto flex items-center justify-center rounded-full text-sm font-bold transition-all duration-300 ${
                    isSelected
                      ? 'bg-black text-white dark:bg-white dark:text-black shadow-md scale-110'
                      : isToday
                        ? 'text-apple-blue'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10'
                  }`}
                >
                  {day}
                  {hasDream && (
                    <div className="absolute bottom-1 flex gap-0.5">
                      {dreamsForDay.slice(0, 3).map((d, i) => (
                        <span key={i} className={`w-1.5 h-1.5 rounded-full ${emotionColors[d.emotion] || emotionColors['neutral']}`} />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        <section className="flex flex-col gap-4 mt-2">
          <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest pl-1">
            {currentMonth + 1}月{selectedDate}日 记录
          </h3>
          
          {dreamsData[selectedDate] && dreamsData[selectedDate].length > 0 ? (
            dreamsData[selectedDate].map((entry: any, index: number) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={`${selectedDate}-${index}`}
                onClick={() => onSelectJournal?.(entry)}
                className="glass-panel rounded-3xl p-5 flex flex-col gap-3 transition-all shadow-sm bg-white/80 dark:bg-white/10 border border-black/5 dark:border-white/5 cursor-pointer relative overflow-hidden group mb-2"
              >
                <div className="flex justify-between items-start relative z-10">
                  <div className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full ${emotionColors[entry.emotion] || emotionColors['neutral']}`} />
                    <h4 className="font-bold text-black dark:text-white text-base">
                      {entry.title}
                    </h4>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400 group-hover:text-apple-blue transition-colors">
                    <span className="text-xs font-medium">{entry.time}</span>
                    <ChevronRightIcon size={16} />
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed font-medium line-clamp-2">
                  {entry.content}
                </p>
                <div className="flex gap-2 mt-1">
                  {entry.tags?.map((tag: string) => (
                    <span key={tag} className="text-[10px] font-bold text-gray-500 dark:text-gray-400 bg-black/5 dark:bg-white/10 px-2 py-0.5 rounded-md">
                      #{tag}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              key={`empty-${selectedDate}`}
              className="glass-panel rounded-3xl p-8 flex flex-col items-center justify-center gap-3 text-center border border-dashed border-black/10 dark:border-white/10 bg-transparent shadow-none"
            >
              <div className="w-12 h-12 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center text-gray-400 mb-2">
                <CalendarIcon size={20} />
              </div>
              <p className="text-sm font-bold text-gray-500 dark:text-gray-400">这一天没有捕获到梦境</p>
              <button
                onClick={handleOpenManualEntry}
                className="text-xs font-bold text-apple-blue mt-1 hover:opacity-80 transition-opacity"
              >
                手动补录记录
              </button>
            </motion.div>
          )}
        </section>
      </div>

      {/* Manual Entry Modal */}
      <AnimatePresence>
        {showManualEntry && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="meta-card rounded-3xl p-6 w-full max-w-sm shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">手动补录梦境</h3>
                <button
                  onClick={() => setShowManualEntry(false)}
                  className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center text-gray-500"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 block">
                    日期
                  </label>
                  <div className="text-sm font-bold text-gray-900 dark:text-white bg-[#F7F8FA] dark:bg-white/6 border border-black/5 dark:border-white/10 rounded-xl px-4 py-2.5">
                    {currentYear}年{currentMonth + 1}月{selectedDate}日
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 block">
                    梦境标题
                  </label>
                  <input
                    type="text"
                    value={manualTitle}
                    onChange={e => setManualTitle(e.target.value)}
                    placeholder="给梦境起个名字..."
                    className="w-full text-sm font-medium text-gray-900 dark:text-white bg-[#F7F8FA] dark:bg-white/6 border border-black/5 dark:border-white/10 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-apple-blue/30 transition-all placeholder:text-gray-400"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 block">
                    梦境内容
                  </label>
                  <textarea
                    value={manualContent}
                    onChange={e => setManualContent(e.target.value)}
                    placeholder="描述你梦到了什么..."
                    rows={4}
                    className="w-full text-sm font-medium text-gray-900 dark:text-white bg-[#F7F8FA] dark:bg-white/6 border border-black/5 dark:border-white/10 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-apple-blue/30 transition-all placeholder:text-gray-400 resize-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 block">
                    情绪标签
                  </label>
                  <div className="flex gap-2">
                    {emotionOptions.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setManualEmotion(opt.value)}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                          manualEmotion === opt.value
                            ? `${opt.color} text-white shadow-md scale-105`
                            : 'bg-[#F7F8FA] dark:bg-white/6 text-gray-600 dark:text-gray-400 border border-black/5 dark:border-white/10'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleSaveManualEntry}
                  disabled={!manualTitle.trim() || !manualContent.trim() || manualSaving}
                  className="meta-btn-primary w-full mt-2 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {manualSaving ? '保存中...' : '保存记录'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
