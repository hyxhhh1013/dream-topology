import { useMemo, useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Sparkles, Loader2, Share2, Heart, History, BookMarked } from 'lucide-react';
import { toPng } from 'html-to-image';
import {
  drawTarot,
  getTarotFavorites,
  getTarotHistory,
  toggleTarotFavorite,
  type TarotFavorite,
  type TarotReading,
  type TarotReadingCard
} from '../services/api';

type TarotViewProps = {
  onBack: () => void;
  dreamText?: string;
  emotion?: string;
};

// Sub-component for individual card with flip animation
function TarotCardItem({ card, favorited, onToggleFavorite, index }: { card: TarotReadingCard, favorited: boolean, onToggleFavorite: (card: TarotReadingCard) => void, index: number }) {
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsFlipped(true);
    }, 500 + index * 400);
    return () => clearTimeout(timer);
  }, [index]);

  return (
    <div className="perspective-1000 w-full aspect-[2/3] max-h-[220px] sm:max-h-[320px]">
      <motion.div
        className="relative w-full h-full transition-all duration-700 preserve-3d"
        initial={false}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
      >
        {/* Card Back */}
        <div className="absolute inset-0 w-full h-full backface-hidden rounded-xl border border-apple-blue/30 bg-gradient-to-br from-[#1A1D29] to-[#0B0D14] flex flex-col items-center justify-center p-2 shadow-lg">
          <div className="w-full h-full rounded-lg border border-apple-blue/10 flex flex-col items-center justify-center overflow-hidden relative">
            <Sparkles size={16} className="text-apple-blue/40" />
          </div>
        </div>

        {/* Card Front */}
        <div className="absolute inset-0 w-full h-full backface-hidden rounded-xl border border-white/10 bg-white dark:bg-[#1C1D26] flex flex-col p-3 shadow-xl overflow-hidden" style={{ transform: 'rotateY(180deg)' }}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[8px] font-black text-apple-blue uppercase tracking-widest px-1.5 py-0.5 rounded-full bg-apple-blue/5">
              P{card.position}
            </span>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(card);
              }} 
              className={`${favorited ? 'text-red-500' : 'text-gray-300 dark:text-gray-600'} transition-all`}
            >
              <Heart size={14} fill={favorited ? 'currentColor' : 'none'} />
            </button>
          </div>
          
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <p className="text-3xl sm:text-5xl mb-1 drop-shadow-sm">
              {card.card_emoji || '🔮'}
            </p>
            <h3 className="text-xs sm:text-lg font-black text-gray-900 dark:text-white tracking-tight leading-tight truncate w-full">
              {card.card_name}
            </h3>
            <span className={`mt-1 text-[7px] sm:text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full ${card.is_reversed ? 'text-orange-500 bg-orange-500/10' : 'text-emerald-500 bg-emerald-500/10'}`}>
              {card.is_reversed ? 'Rev' : 'Up'}
            </span>
          </div>

          {/* Mobile meaning - more compact */}
          <div className="mt-2 pt-2 border-t border-gray-100 dark:border-white/5 hidden sm:block">
            <p className="text-[10px] leading-tight text-gray-600 dark:text-gray-400">
              {card.is_reversed ? card.reversed_meaning.substring(0, 30) + '...' : card.upright_meaning.substring(0, 30) + '...'}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function TarotView({ onBack, dreamText, emotion }: TarotViewProps) {
  const [question, setQuestion] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [activeTab, setActiveTab] = useState<'draw' | 'history' | 'favorites'>('draw');
  const [reading, setReading] = useState<TarotReading | null>(null);
  const [history, setHistory] = useState<TarotReading[]>([]);
  const [favorites, setFavorites] = useState<TarotFavorite[]>([]);
  const exportRef = useRef<HTMLDivElement>(null);

  const favoriteCodes = useMemo(() => new Set(favorites.map((f) => f.card_code)), [favorites]);

  const handleDraw = async () => {
    setIsDrawing(true);
    setReading(null); // Clear previous result to trigger animations
    try {
      const result = await drawTarot({
        dreamText,
        emotion,
        question: question.trim() || undefined,
        spreadType: 'three_card',
      });
      // Add a slight delay to let the shuffling animation feel substantial
      setTimeout(() => {
        setReading(result);
        setIsDrawing(false);
      }, 1500);
    } catch (error) {
      console.error(error);
      alert('抽牌失败，请确认后端是否正常运行。');
      setIsDrawing(false);
    }
  };

  const loadHistory = async () => {
    try {
      const list = await getTarotHistory();
      setHistory(list);
      setActiveTab('history');
    } catch (error) {
      console.error(error);
      alert('读取历史失败。');
    }
  };

  const loadFavorites = async () => {
    try {
      const list = await getTarotFavorites();
      setFavorites(list);
      setActiveTab('favorites');
    } catch (error) {
      console.error(error);
      alert('读取收藏失败。');
    }
  };

  const handleToggleFavorite = async (card: TarotReadingCard) => {
    try {
      const res = await toggleTarotFavorite({
        cardCode: card.card_code,
        cardName: card.card_name,
        cardEmoji: card.card_emoji || undefined,
      });
      if (res.favorited) {
        setFavorites((prev) => [
          {
            id: `temp-${card.card_code}`,
            card_code: card.card_code,
            card_name: card.card_name,
            card_emoji: card.card_emoji || null,
            created_at: new Date().toISOString(),
          },
          ...prev.filter((f) => f.card_code !== card.card_code),
        ]);
      } else {
        setFavorites((prev) => prev.filter((f) => f.card_code !== card.card_code));
      }
    } catch (error) {
      console.error(error);
      alert('收藏操作失败。');
    }
  };

  const shareImage = async () => {
    if (!exportRef.current || !reading) return;
    setIsSharing(true);
    try {
      const image = await toPng(exportRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#FFFFFF',
      });
      const link = document.createElement('a');
      link.download = `塔罗解读-${new Date().toISOString().slice(0, 10)}.png`;
      link.href = image;
      link.click();
    } catch (error) {
      console.error(error);
      alert('分享图生成失败。');
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: '100%' }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 220 }}
      className="fixed inset-0 z-[80] bg-[#F0F2F5] dark:bg-[#1C1E21] overflow-y-auto"
    >
      <div className="max-w-4xl mx-auto min-h-screen px-4 sm:px-8 pt-4 sm:pt-12 pb-20 relative z-10">
        <header className="flex items-center justify-between sticky top-0 py-3 bg-[#F0F2F5]/80 dark:bg-[#1C1E21]/80 backdrop-blur-xl z-20 -mx-4 px-4 sm:-mx-8 sm:px-8">
          <button onClick={onBack} className="w-9 h-9 rounded-full bg-white/75 dark:bg-white/10 border border-black/10 dark:border-white/12 backdrop-blur flex items-center justify-center text-gray-700 dark:text-white/90 hover:bg-white hover:dark:bg-white/14 active:scale-90 transition-all shadow-sm">
            <ChevronLeft size={18} />
          </button>
          <div className="flex flex-col items-center">
            <h2 className="font-black tracking-[0.2em] text-gray-900 dark:text-white uppercase text-xs sm:text-sm">梦境塔罗</h2>
            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Dream Divination</span>
          </div>
          <button onClick={shareImage} disabled={!reading || isSharing} className="w-9 h-9 rounded-full bg-white/75 dark:bg-white/10 border border-black/10 dark:border-white/12 backdrop-blur flex items-center justify-center text-apple-blue disabled:opacity-50 hover:bg-white hover:dark:bg-white/14 active:scale-90 transition-all shadow-sm">
            {isSharing ? <Loader2 size={16} className="animate-spin" /> : <Share2 size={16} />}
          </button>
        </header>

        <nav className="flex gap-1 p-1 bg-[#F0F2F5] dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/10 mt-4">
          <button onClick={() => setActiveTab('draw')} className={`flex-1 py-2 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'draw' ? 'bg-white dark:bg-white/10 text-apple-blue shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}>
            抽牌
          </button>
          <button onClick={loadHistory} className={`flex-1 py-2 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all ${activeTab === 'history' ? 'bg-white dark:bg-white/10 text-apple-blue shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}>
            <History size={12} /> 历史
          </button>
          <button onClick={loadFavorites} className={`flex-1 py-2 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all ${activeTab === 'favorites' ? 'bg-white dark:bg-white/10 text-apple-blue shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}>
            <BookMarked size={12} /> 收藏
          </button>
        </nav>

        {activeTab === 'draw' && (
          <section className="mt-3 flex flex-col gap-3">
            <div className="meta-card rounded-2xl p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-1.5">
                <Sparkles size={12} className="text-apple-blue" />
                <p className="text-[9px] font-black text-gray-500 dark:text-gray-400 tracking-widest uppercase">潜意识提问</p>
              </div>
              <div className="relative">
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="想问潜意识什么？"
                  className="meta-input min-h-[70px] text-xs resize-none placeholder-gray-400"
                />
              </div>
              <button
                onClick={handleDraw}
                disabled={isDrawing}
                className="meta-btn-primary w-full mt-3"
              >
                {isDrawing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                {isDrawing ? '正在抽牌...' : '抽三张牌'}
              </button>
            </div>

            <AnimatePresence mode="wait">
              {isDrawing && !reading && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex flex-col items-center justify-center py-8 gap-4"
                >
                  <div className="relative w-20 h-30 flex items-center justify-center">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="absolute w-full h-full rounded-xl border border-apple-blue/20 bg-[#0B0D14]"
                        animate={{ 
                          x: [0, (i - 1) * 25, 0],
                          rotate: [0, (i - 1) * 8, 0],
                        }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
                      />
                    ))}
                  </div>
                  <p className="text-[9px] font-black text-apple-blue animate-pulse tracking-widest uppercase">Connecting...</p>
                </motion.div>
              )}

              {reading && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col gap-4"
                >
                  {/* Card Spread Area - Three in a row on mobile */}
                  <div className="flex flex-col gap-2">
                    <div className="grid grid-cols-3 gap-2">
                      {reading.cards.map((card, idx) => (
                        <TarotCardItem 
                          key={card.id} 
                          card={card} 
                          index={idx}
                          favorited={favoriteCodes.has(card.card_code)}
                          onToggleFavorite={handleToggleFavorite}
                        />
                      ))}
                    </div>
                  </div>

                  {/* AI Interpretation Area - Compact */}
                  <div className="meta-card rounded-2xl p-4 sm:p-6">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-[#E8F3FF] dark:bg-white/8 border border-black/5 dark:border-white/10 flex items-center justify-center shrink-0">
                        <Sparkles size={18} className="text-apple-blue dark:text-white/90" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] text-apple-blue font-bold uppercase tracking-widest">AI Insights</p>
                        <h4 className="text-base sm:text-lg font-black text-gray-900 dark:text-white tracking-tight mt-1">{reading.ai_summary}</h4>
                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-medium mt-3 whitespace-pre-wrap">
                          {reading.ai_interpretation}
                        </p>
                      </div>
                    </div>

                    {!!reading.evidence?.length && (
                      <div className="mt-5">
                        <p className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">解读依据</p>
                        <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {reading.evidence.slice(0, 3).map((e, idx) => (
                            <div key={idx} className="rounded-2xl bg-[#F7F8FA] dark:bg-white/6 border border-black/5 dark:border-white/10 p-3">
                              <div className="flex items-start gap-2">
                                <div className="w-6 h-6 rounded-full bg-[#E8F3FF] dark:bg-white/8 border border-black/5 dark:border-white/10 text-apple-blue dark:text-white/90 flex items-center justify-center text-[10px] font-black shrink-0">
                                  {idx + 1}
                                </div>
                                <p className="text-[11px] font-bold text-gray-900 dark:text-white leading-snug">
                                  {e.point}
                                </p>
                              </div>
                              <div className="mt-2 space-y-2">
                                <div>
                                  <p className="text-[9px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">牌面</p>
                                  <p className="text-[11px] text-gray-700 dark:text-gray-300 leading-snug">{e.card_basis}</p>
                                </div>
                                <div>
                                  <p className="text-[9px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">梦境</p>
                                  <p className="text-[11px] text-gray-700 dark:text-gray-300 leading-snug">{e.dream_basis}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {!!reading.advice?.length && (
                      <div className="mt-5">
                        <p className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">行动建议</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {reading.advice.map((a, i) => (
                            <div key={i} className="px-3 py-2 rounded-2xl bg-[#E8F3FF] dark:bg-white/8 border border-black/5 dark:border-white/10 text-[11px] font-bold text-apple-blue dark:text-white/90 flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-apple-blue dark:bg-white/80" />
                              {a}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        )}

        {activeTab === 'history' && (
          <section className="mt-8 space-y-4">
            {history.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
                <History size={40} className="opacity-20" />
                <p className="text-sm font-bold tracking-widest uppercase">暂无历史记录</p>
              </div>
            )}
            {history.map((item) => (
              <button key={item.id} onClick={() => { setReading(item); setActiveTab('draw'); }} className="w-full text-left rounded-3xl p-5 meta-card group hover:border-black/10 dark:hover:border-white/18 transition-all active:scale-[0.98]">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{new Date(item.created_at).toLocaleString()}</p>
                  <div className="flex gap-1">
                    {item.cards.map(c => (
                      <span key={c.id} className="text-sm grayscale group-hover:grayscale-0 transition-all">{c.card_emoji}</span>
                    ))}
                  </div>
                </div>
                <p className="text-base font-black text-gray-900 dark:text-white tracking-tight">{item.ai_summary}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {item.cards.map(c => (
                    <span key={c.id} className="text-[10px] font-bold text-gray-700 dark:text-gray-200 bg-[#F1F4F7] dark:bg-white/8 border border-black/5 dark:border-white/10 px-2 py-1 rounded-md">
                      {c.card_name}{c.is_reversed ? '(逆)' : ''}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </section>
        )}

        {activeTab === 'favorites' && (
          <section className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-4">
            {favorites.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
                <BookMarked size={40} className="opacity-20" />
                <p className="text-sm font-bold tracking-widest uppercase">暂无收藏牌</p>
              </div>
            )}
            {favorites.map((f) => (
              <div key={f.id} className="rounded-3xl p-5 meta-card flex flex-col items-center text-center gap-2">
                <p className="text-4xl mb-1">{f.card_emoji || '🔮'}</p>
                <p className="text-sm font-black text-gray-900 dark:text-white tracking-tight">{f.card_name}</p>
                <p className="text-[9px] font-black text-apple-blue dark:text-white/90 uppercase tracking-widest bg-[#E8F3FF] dark:bg-white/8 border border-black/5 dark:border-white/10 px-2 py-0.5 rounded-full">{f.card_code}</p>
              </div>
            ))}
          </section>
        )}
      </div>

      {/* Share Export Hidden Area - Refined for better image generation */}
      <div className="fixed -left-[99999px] top-0 pointer-events-none">
        <div ref={exportRef} className="w-[1080px] p-16 bg-white text-[#050505] font-sans">
          <div className="rounded-[40px] bg-white border border-[#CED0D4] p-12 shadow-[0_30px_80px_rgba(0,0,0,0.10)] relative overflow-hidden">
            <div className="relative">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[14px] tracking-[0.3em] font-black text-[#65676B] uppercase">Dream Divination Report</p>
                  <h1 className="text-[52px] font-black mt-3 tracking-tighter text-[#050505]">塔罗牌阵解读</h1>
                </div>
                <div className="w-20 h-20 rounded-3xl bg-[#E8F3FF] flex items-center justify-center border border-[#CED0D4]">
                  <span className="text-4xl">🔮</span>
                </div>
              </div>

              {reading && (
                <>
                  <div className="grid grid-cols-3 gap-6 mt-12">
                    {reading.cards.map((card) => (
                      <div key={`share-${card.id}`} className="rounded-[2rem] border-2 border-[#CED0D4] bg-white p-6 shadow-sm flex flex-col items-center text-center">
                        <p className="text-6xl mb-4">{card.card_emoji || '🔮'}</p>
                        <p className="text-2xl font-black text-[#050505]">{card.card_name}</p>
                        <p className={`text-sm mt-2 font-black uppercase tracking-widest ${card.is_reversed ? 'text-orange-500' : 'text-emerald-500'}`}>
                          {card.is_reversed ? '逆位 (Reversed)' : '正位 (Upright)'}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-12 space-y-8">
                    <div className="p-8 rounded-[2.5rem] bg-[#F7F8FA] border border-[#CED0D4]">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-2 h-6 bg-[#0064E0] rounded-full" />
                        <p className="text-lg font-black text-[#65676B] uppercase tracking-widest">潜意识洞察结论</p>
                      </div>
                      <p className="text-3xl font-black text-[#050505] leading-tight">{reading.ai_summary}</p>
                      <p className="text-[20px] leading-relaxed mt-6 text-[#1C2B33] font-medium border-l-4 border-[#CED0D4] pl-6 py-2 whitespace-pre-wrap">
                        {reading.ai_interpretation}
                      </p>
                    </div>

                    {!!reading.evidence?.length && (
                      <div className="grid grid-cols-1 gap-4">
                        <p className="text-sm font-black text-[#65676B] uppercase tracking-[0.3em] ml-2">Evidence Map / 解读依据</p>
                        {reading.evidence.slice(0, 3).map((e, idx) => (
                          <div key={`share-evidence-${idx}`} className="rounded-3xl border border-[#CED0D4] bg-white p-6 flex flex-col gap-4">
                            <p className="text-[18px] font-black text-[#050505] flex items-center gap-3">
                              <span className="w-7 h-7 rounded-full bg-[#E8F3FF] text-[#0064E0] flex items-center justify-center text-xs">{idx + 1}</span>
                              {e.point}
                            </p>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="bg-[#F7F8FA] p-4 rounded-2xl border border-black/5">
                                <p className="text-[11px] font-black text-[#65676B] uppercase tracking-widest mb-2">牌面依据</p>
                                <p className="text-[14px] text-[#1C2B33] leading-normal">{e.card_basis}</p>
                              </div>
                              <div className="bg-[#F7F8FA] p-4 rounded-2xl border border-black/5">
                                <p className="text-[11px] font-black text-[#65676B] uppercase tracking-widest mb-2">梦境依据</p>
                                <p className="text-[14px] text-[#1C2B33] leading-normal">{e.dream_basis}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {!!reading.advice?.length && (
                      <div className="p-8 rounded-[2.5rem] bg-[#1C1E21] text-white border border-black/10">
                        <p className="text-sm font-black text-white/50 uppercase tracking-[0.3em] mb-6">Advice / 行动建议</p>
                        <div className="flex flex-wrap gap-3">
                          {reading.advice.map((advice, idx) => (
                            <div key={`share-advice-${idx}`} className="px-6 py-3 rounded-2xl bg-white/10 border border-white/10 text-lg font-bold flex items-center gap-3">
                              <div className="w-2 h-2 rounded-full bg-[#47A5FA]" />
                              {advice}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              <div className="mt-16 pt-8 border-t border-[#CED0D4] flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#0064E0] flex items-center justify-center">
                    <span className="text-2xl">🌌</span>
                  </div>
                  <div>
                    <p className="text-lg font-black text-[#050505] leading-none">梦境拓卜</p>
                    <p className="text-[11px] font-black text-[#65676B] uppercase tracking-widest mt-1">Dream Topology v1.0</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[11px] font-black text-[#65676B] uppercase tracking-[0.2em]">Captured on</p>
                  <p className="text-sm font-bold text-[#050505] mt-1">{new Date().toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .preserve-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </motion.div>
  );
}
