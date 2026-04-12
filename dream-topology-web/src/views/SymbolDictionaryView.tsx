import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Search, Sparkles, Loader2 } from 'lucide-react';
import { fetchDreamSymbols } from '../services/api';

export default function SymbolDictionaryView({ onBack }: { onBack: () => void }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [symbols, setSymbols] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadSymbols() {
      try {
        const data = await fetchDreamSymbols();
        setSymbols(data);
      } catch (error) {
        console.error("Failed to load symbols", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadSymbols();
  }, []);

  const mockDictionary = [
    { id: 1, word: "火 (Fire)", type: "毁灭与重生", icon: "🔥", meaning: "在荣格心理学中，火通常代表强烈的情绪能量，可能是现实中被压抑的愤怒，或是创造力的觉醒。近期出现频率升高，建议关注情绪宣泄途径。" },
    { id: 2, word: "被追赶 (Being Chased)", type: "阴影 (Shadow)", icon: "🏃", meaning: "梦中追赶你的往往是你自己拒绝面对的性格侧面或现实压力。直面它，恐惧就会消散。这通常与高压工作环境相关。" },
    { id: 3, word: "深水 (Deep Water)", type: "集体潜意识", icon: "🌊", meaning: "水通常象征情感和潜意识。深水或洪水可能意味着你感觉被现实中的情绪或责任淹没。" },
    { id: 4, word: "掉牙 (Teeth Falling Out)", type: "自我形象/焦虑", icon: "🦷", meaning: "非常常见的压力梦。通常与对衰老、外貌、沟通能力或失去控制感的焦虑有关。" },
    { id: 5, word: "陌生的房间 (Unknown Rooms)", type: "自我探索", icon: "🏠", meaning: "发现房子里有未知的房间，通常代表你正在发现自己潜藏的才能、未被探索的性格部分。" }
  ];

  // Use real symbols if available, otherwise fallback to mock data
  const displaySymbols = symbols.length > 0 
    ? symbols.map(s => ({
        id: s.id,
        word: s.name,
        type: '原型', // Simplified mapping
        icon: '🌌',
        meaning: s.universal_meaning,
        appearances: 1, // Placeholder
        lastSeen: '最近' // Placeholder
      }))
    : mockDictionary;

  const filteredWords = displaySymbols.filter(item => {
    return item.word.toLowerCase().includes(searchQuery.toLowerCase()) || 
           item.meaning.toLowerCase().includes(searchQuery.toLowerCase());
  });

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
          <h1 className="text-xl font-bold text-black dark:text-white">潜意识词典</h1>
        </header>

        <div className="relative">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索符号、原型或梦境..." 
            className="meta-input pl-12 text-sm"
          />
        </div>

        <div className="flex flex-col gap-4">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="animate-spin text-gray-400" size={24} />
            </div>
          ) : filteredWords.length > 0 ? (
            filteredWords.map((item) => (
              <DictionaryCard 
                key={item.id}
                icon={item.icon} 
                name={item.word} 
                archetype={item.type} 
                desc={item.meaning}
              />
            ))
          ) : (
            <div className="text-center py-10 text-gray-500 dark:text-gray-400">
              没有找到相关符号
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function DictionaryCard({ icon, name, archetype, desc }: { icon: string, name: string, archetype: string, desc: string }) {
  return (
    <div className="meta-card rounded-3xl p-5 flex flex-col gap-3 transition-colors">
      <div className="flex items-center gap-4 mb-2">
        <div className="w-12 h-12 rounded-2xl bg-[#F7F8FA] dark:bg-white/6 border border-black/5 dark:border-white/10 flex items-center justify-center text-2xl shadow-sm">
          {icon}
        </div>
        <div>
          <h3 className="font-bold text-black dark:text-white text-base">{name}</h3>
          <div className="flex items-center gap-1 text-xs text-apple-blue dark:text-white/90 font-medium mt-0.5 max-w-[200px] truncate" title={archetype}>
            <Sparkles size={12} />
            <span>原型：{archetype}</span>
          </div>
        </div>
      </div>
      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-medium bg-[#F7F8FA] dark:bg-white/6 border border-black/5 dark:border-white/10 p-4 rounded-2xl line-clamp-4" title={desc}>
        {desc}
      </p>
    </div>
  );
}
