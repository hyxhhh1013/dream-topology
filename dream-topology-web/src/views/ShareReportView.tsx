import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Download, Share2, Loader2, Sparkles } from 'lucide-react';
import { toPng } from 'html-to-image';

interface ShareReportProps {
  onBack: () => void;
  title: string;
  date: string;
  content: string;
  emotion: string;
  tags: string[];
  dreamImage?: string | null;
  crossAnalysis?: string;
}

export default function ShareReportView({ onBack, title, date, content, emotion, tags, dreamImage, crossAnalysis }: ShareReportProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const emotionColors: Record<string, string> = {
    anxious: 'from-purple-500/20 to-purple-900/40',
    fear: 'from-red-500/20 to-red-900/40',
    stress: 'from-orange-500/20 to-orange-900/40',
    peace: 'from-blue-500/20 to-blue-900/40'
  };

  const handleDownload = async () => {
    if (!cardRef.current) return;
    try {
      setIsGenerating(true);
      
      const image = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: window.devicePixelRatio || 2,
        backgroundColor: '#F5F8FF',
      });
      const link = document.createElement('a');
      link.download = `梦境拓卜-解析报告-${date}.png`;
      link.href = image;
      link.click();
    } catch (error) {
      console.error('Error generating image:', error);
      alert('生成图片失败，请重试。错误信息: ' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShare = async () => {
    if (isSharing) return;
    try {
      setIsSharing(true);
      const shareText = `梦境拓卜: ${title}\n核心意象：${tags.join(', ')}\n${window.location.href}`;

      if (navigator.share) {
        await navigator.share({
          title: `梦境拓卜: ${title}`,
          text: `这是我今早的梦境解析报告，核心意象包括：${tags.join(', ')}。快来看看我的潜意识在诉说什么！`,
          url: window.location.href,
        });
        return;
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareText);
        alert('当前环境不支持系统分享，已复制分享文案到剪贴板。');
      } else {
        alert('当前环境不支持系统分享。请先保存图片，再手动发送给好友。');
      }
    } catch (error) {
      console.log('Error sharing:', error);
      alert('分享失败，请重试。');
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: '100%' }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: '100%' }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[70] bg-[#0B1020]/90 backdrop-blur-xl overflow-y-auto flex flex-col"
    >
      <header className="flex justify-between items-center p-6 sticky top-0 z-10">
        <button 
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        <span className="text-white font-medium text-sm tracking-widest">分享解析</span>
        <div className="w-10" /> {/* Spacer */}
      </header>

      <div className="flex-1 flex flex-col items-center px-6 pb-24">
        {/* Share Card to be captured */}
        <div 
          ref={cardRef}
          className={`w-full max-w-2xl rounded-[2rem] overflow-hidden relative shadow-2xl bg-gradient-to-br ${emotionColors[emotion] || 'from-blue-100 to-indigo-100'} border border-white/40`}
        >
          <div className="h-64 bg-black/20 relative flex items-center justify-center overflow-hidden">
            {dreamImage ? (
              <img src={dreamImage} alt="Dream Canvas" className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-[#9CB7FF]/40 to-[#B89CFF]/40"></div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A]/65 via-[#0F172A]/35 to-transparent"></div>
            {!dreamImage && <Sparkles className="text-white/40 w-24 h-24 absolute" />}
          </div>

          <div className="p-8 flex flex-col gap-5 relative z-10 bg-[#10192D]/78 backdrop-blur-sm -mt-10">
            <div className="flex flex-col gap-2">
              <span className="text-white/60 text-xs font-bold uppercase tracking-widest">{date}</span>
              <h2 className="text-2xl font-bold text-white leading-tight">{title}</h2>
            </div>

            <div className="flex flex-wrap gap-2">
              {tags.map(tag => (
                <span key={tag} className="text-xs font-bold text-white/90 bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/10">
                  #{tag}
                </span>
              ))}
            </div>

            <div className="bg-white/10 border border-white/15 rounded-2xl p-4">
              <p className="text-white/70 text-[11px] font-bold tracking-widest">梦境内容</p>
              <p className="text-white/95 text-sm leading-relaxed mt-2 whitespace-pre-wrap">{content}</p>
            </div>

            {crossAnalysis && (
              <div className="bg-white/10 border border-white/15 rounded-2xl p-4">
                <p className="text-white/70 text-[11px] font-bold tracking-widest">AI 综合洞察</p>
                <p className="text-white/95 text-sm leading-relaxed mt-2 whitespace-pre-wrap">
                  {crossAnalysis}
                </p>
              </div>
            )}

            <div className="h-px w-full bg-white/10 my-2"></div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
                  <span className="text-xl">🌌</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-white font-bold text-sm">梦境拓卜</span>
                  <span className="text-white/50 text-[10px] uppercase tracking-wider">Dream Topology</span>
                </div>
              </div>
              <div className="px-3 py-2 bg-white/10 rounded-lg border border-white/20">
                <span className="text-[10px] text-white/50 tracking-wider">DREAM TOPOLOGY</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 w-full max-w-2xl mt-8">
          <button 
            onClick={handleDownload}
            disabled={isGenerating}
            className="flex-1 py-4 bg-white text-black rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-50"
          >
            {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
            保存图片
          </button>
          <button 
            onClick={handleShare}
            disabled={isSharing}
            className="flex-1 py-4 bg-white/10 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-transform active:scale-95 backdrop-blur-md disabled:opacity-60"
          >
            {isSharing ? <Loader2 size={18} className="animate-spin" /> : <Share2 size={18} />}
            {isSharing ? '处理中...' : '分享链接'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
