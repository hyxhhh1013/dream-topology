import { useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
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
    try {
      const result = await drawTarot({
        dreamText,
        emotion,
        question: question.trim() || undefined,
        spreadType: 'three_card',
      });
      setReading(result);
      setActiveTab('draw');
    } catch (error) {
      console.error(error);
      alert('抽牌失败，请确认后端是否正常运行。');
    } finally {
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
        backgroundColor: '#F6F8FF',
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
      className="fixed inset-0 z-[80] bg-apple-gray-light dark:bg-apple-black overflow-y-auto"
    >
      <div className="max-w-3xl mx-auto min-h-screen px-4 sm:px-6 pt-8 sm:pt-10 pb-28 relative">
        <div className="absolute top-0 left-0 w-72 h-72 bg-apple-purple/15 blur-3xl rounded-full pointer-events-none" />
        <div className="absolute top-20 right-0 w-72 h-72 bg-apple-blue/15 blur-3xl rounded-full pointer-events-none" />
        <header className="flex items-center justify-between sticky top-0 py-3 bg-apple-gray-light/75 dark:bg-apple-black/75 backdrop-blur-xl z-10">
          <button onClick={onBack} className="w-10 h-10 rounded-full glass-panel flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5">
            <ChevronLeft size={20} />
          </button>
          <h2 className="font-bold tracking-widest text-gray-900 dark:text-white">梦境联动塔罗</h2>
          <button onClick={shareImage} disabled={!reading || isSharing} className="w-10 h-10 rounded-full glass-panel flex items-center justify-center text-apple-blue disabled:opacity-50 hover:bg-black/5 dark:hover:bg-white/5">
            {isSharing ? <Loader2 size={18} className="animate-spin" /> : <Share2 size={18} />}
          </button>
        </header>

        <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-4 p-1 bg-black/5 dark:bg-white/5 rounded-2xl">
          <button onClick={() => setActiveTab('draw')} className={`py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${activeTab === 'draw' ? 'bg-white dark:bg-[#2c2c2e] text-gray-900 dark:text-white shadow-sm' : 'text-gray-700 dark:text-gray-300'}`}>
            抽牌
          </button>
          <button onClick={loadHistory} className={`py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1 sm:gap-2 transition-all ${activeTab === 'history' ? 'bg-white dark:bg-[#2c2c2e] text-gray-900 dark:text-white shadow-sm' : 'text-gray-700 dark:text-gray-300'}`}>
            <History size={13} /> 历史
          </button>
          <button onClick={loadFavorites} className={`py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1 sm:gap-2 transition-all ${activeTab === 'favorites' ? 'bg-white dark:bg-[#2c2c2e] text-gray-900 dark:text-white shadow-sm' : 'text-gray-700 dark:text-gray-300'}`}>
            <BookMarked size={13} /> 收藏
          </button>
        </div>

        {activeTab === 'draw' && (
          <section className="mt-5 flex flex-col gap-4">
            <div className="glass-panel rounded-3xl p-5 bg-white/80 dark:bg-white/5 border border-black/5 dark:border-white/10">
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 tracking-widest">提问（可选）</p>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="例如：我该如何面对最近的人际焦虑？"
                className="w-full mt-2 min-h-[90px] rounded-2xl bg-black/5 dark:bg-black/30 border border-black/5 dark:border-white/10 p-3 text-sm text-gray-800 dark:text-gray-200"
              />
              <button onClick={handleDraw} disabled={isDrawing} className="mt-3 px-5 py-2.5 rounded-full bg-gradient-to-r from-apple-purple to-apple-blue text-white text-sm font-bold disabled:opacity-60 flex items-center gap-2">
                {isDrawing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                {isDrawing ? '正在抽牌...' : '抽三张牌'}
              </button>
            </div>

            {reading && (
              <div className="glass-panel rounded-3xl p-5 bg-white/80 dark:bg-white/5 border border-black/5 dark:border-white/10">
                <p className="text-xs font-bold tracking-widest text-gray-500 dark:text-gray-400">过去 · 现在 · 未来</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                  {reading.cards.map((card) => {
                    const favorited = favoriteCodes.has(card.card_code);
                    return (
                      <div key={card.id} className="rounded-2xl p-4 bg-gradient-to-b from-[#F7FAFF] to-white dark:from-[#1A1D29] dark:to-[#11141F] border border-[#DCE6FF] dark:border-white/10 shadow-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-gray-500">第{card.position}张</span>
                          <button onClick={() => handleToggleFavorite(card)} className={`${favorited ? 'text-red-500' : 'text-gray-400'} transition-colors`}>
                            <Heart size={15} fill={favorited ? 'currentColor' : 'none'} />
                          </button>
                        </div>
                        <p className="text-3xl mt-2">{card.card_emoji || '🔮'}</p>
                        <p className="text-lg font-bold mt-1 text-gray-900 dark:text-white">{card.card_name}</p>
                        <p className={`text-xs mt-1 font-bold ${card.is_reversed ? 'text-orange-500' : 'text-emerald-500'}`}>
                          {card.is_reversed ? '逆位' : '正位'}
                        </p>
                        <p className="text-xs mt-2 text-gray-600 dark:text-gray-300 leading-5">
                          {card.is_reversed ? card.reversed_meaning : card.upright_meaning}
                        </p>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 rounded-2xl p-4 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10">
                  <p className="text-sm font-bold text-gray-900 dark:text-white">结论：{reading.ai_summary}</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-7 mt-2">{reading.ai_interpretation}</p>
                  {!!reading.evidence?.length && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs font-bold tracking-widest text-gray-500 dark:text-gray-400">解读依据</p>
                      {reading.evidence.map((e, i) => (
                        <div key={`evidence-${i}`} className="rounded-xl bg-white/70 dark:bg-white/5 border border-black/5 dark:border-white/10 p-3">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">{i + 1}. {e.point}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">牌面依据：{e.card_basis}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">梦境依据：{e.dream_basis}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="mt-3 space-y-2">
                    {reading.advice.map((a, i) => (
                      <p key={i} className="text-sm text-gray-700 dark:text-gray-300">• {a}</p>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {activeTab === 'history' && (
          <section className="mt-5 space-y-3">
            {history.length === 0 && <p className="text-gray-500 text-sm">暂无历史记录</p>}
            {history.map((item) => (
              <button key={item.id} onClick={() => { setReading(item); setActiveTab('draw'); }} className="w-full text-left rounded-2xl p-4 glass-panel bg-white/80 dark:bg-white/5 border border-black/5 dark:border-white/10">
                <p className="text-xs text-gray-500">{new Date(item.created_at).toLocaleString()}</p>
                <p className="text-sm font-bold mt-1 text-gray-900 dark:text-white">{item.ai_summary}</p>
                <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">{item.cards.map(c => `${c.card_name}${c.is_reversed ? '(逆)' : '(正)'}`).join(' · ')}</p>
              </button>
            ))}
          </section>
        )}

        {activeTab === 'favorites' && (
          <section className="mt-5 grid grid-cols-2 md:grid-cols-3 gap-3">
            {favorites.length === 0 && <p className="text-gray-500 text-sm col-span-full">暂无收藏牌</p>}
            {favorites.map((f) => (
              <div key={f.id} className="rounded-2xl p-4 glass-panel bg-white/80 dark:bg-white/5 border border-black/5 dark:border-white/10">
                <p className="text-2xl">{f.card_emoji || '🔮'}</p>
                <p className="text-sm font-bold mt-1 text-gray-900 dark:text-white">{f.card_name}</p>
                <p className="text-[11px] text-gray-500 mt-1">{f.card_code}</p>
              </div>
            ))}
          </section>
        )}
      </div>

      <div className="fixed -left-[99999px] top-0 pointer-events-none">
        <div ref={exportRef} className="w-[1080px] p-14 bg-gradient-to-b from-[#F8FAFF] to-[#EEF3FF] text-[#1D2333]">
          <div className="rounded-[30px] bg-white border border-[#DEE6FF] p-10 shadow-[0_20px_60px_rgba(71,89,162,0.12)]">
            <p className="text-[13px] tracking-[0.22em] font-semibold text-[#6D78A8]">DREAM TAROT REPORT</p>
            <h1 className="text-[42px] font-black mt-2">三张牌阵解读</h1>
            {reading && (
              <>
                <div className="grid grid-cols-3 gap-4 mt-8">
                  {reading.cards.map((card) => (
                    <div key={`share-${card.id}`} className="rounded-2xl border border-[#E3E9FF] bg-[#F9FBFF] p-4">
                      <p className="text-4xl">{card.card_emoji || '🔮'}</p>
                      <p className="text-lg font-bold mt-2">{card.card_name}</p>
                      <p className="text-sm mt-1">{card.is_reversed ? '逆位' : '正位'}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-8 rounded-2xl border border-[#E3E9FF] p-5">
                  <p className="text-sm font-bold tracking-wider text-[#68749A]">结论</p>
                  <p className="text-xl font-bold mt-2 text-[#2C3B77]">{reading.ai_summary}</p>
                  <p className="text-[17px] leading-8 mt-3">{reading.ai_interpretation}</p>
                  {!!reading.evidence?.length && (
                    <div className="mt-4 space-y-3">
                      <p className="text-sm font-bold tracking-wider text-[#68749A]">解读依据</p>
                      {reading.evidence.slice(0, 3).map((e, idx) => (
                        <div key={`share-evidence-${idx}`} className="rounded-xl border border-[#E9EEFF] bg-[#FAFCFF] p-3">
                          <p className="text-[15px] font-semibold">{idx + 1}. {e.point}</p>
                          <p className="text-[13px] mt-1 text-[#4F5D86]">牌面依据：{e.card_basis}</p>
                          <p className="text-[13px] mt-1 text-[#4F5D86]">梦境依据：{e.dream_basis}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {!!reading.advice?.length && (
                    <div className="mt-4 space-y-2">
                      <p className="text-sm font-bold tracking-wider text-[#68749A]">行动建议</p>
                      {reading.advice.map((advice, idx) => (
                        <p key={`share-advice-${idx}`} className="text-[15px] leading-7">• {advice}</p>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
