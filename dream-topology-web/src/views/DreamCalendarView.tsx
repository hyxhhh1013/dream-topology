import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, ChevronRight as ChevronRightIcon } from 'lucide-react';
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
  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  const emotionColors: Record<string, string> = {
    anxious: 'bg-purple-500',
    fear: 'bg-red-500',
    stress: 'bg-orange-500',
    peace: 'bg-apple-blue',
    neutral: 'bg-gray-400'
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
        <header className="flex items-center gap-4 sticky top-0 bg-[#F0F2F5]/80 dark:bg-[#1C1E21]/80 backdrop-blur-xl z-10 py-4 -mx-6 px-6">
          <button 
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-white/75 dark:bg-white/10 border border-black/10 dark:border-white/12 backdrop-blur flex items-center justify-center text-gray-700 dark:text-white/90 transition-colors shadow-sm hover:bg-white hover:dark:bg-white/14"
          >
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-black dark:text-white flex items-center gap-2">
            <CalendarIcon size={20} className="text-apple-blue" />
            梦境日历
          </h1>
        </header>

        <section className="meta-card rounded-[2rem] p-6 flex flex-col gap-4">
          <div className="flex justify-between items-center px-2">
            <h2 className="text-lg font-bold text-black dark:text-white">
              {currentYear}年 {currentMonth + 1}月
            </h2>
            <div className="flex gap-2">
              <button
                onClick={goPrevMonth}
                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                aria-label="上一个月"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={goNextMonth}
                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
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
                className="meta-card rounded-3xl p-5 flex flex-col gap-3 transition-all cursor-pointer relative overflow-hidden group mb-2"
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
                    <span key={tag} className="text-[10px] font-bold text-gray-700 dark:text-gray-200 bg-[#F1F4F7] dark:bg-white/8 border border-black/5 dark:border-white/10 px-2 py-0.5 rounded-md">
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
              className="rounded-3xl p-8 flex flex-col items-center justify-center gap-3 text-center border border-dashed border-black/10 dark:border-white/10 bg-transparent"
            >
              <div className="w-12 h-12 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center text-gray-400 mb-2">
                <CalendarIcon size={20} />
              </div>
              <p className="text-sm font-bold text-gray-500 dark:text-gray-400">这一天没有捕获到梦境</p>
              <button className="text-xs font-bold text-apple-blue mt-1 hover:opacity-80 transition-opacity">
                手动补录记录
              </button>
            </motion.div>
          )}
        </section>
      </div>
    </motion.div>
  );
}
