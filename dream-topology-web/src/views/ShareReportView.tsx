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

  const emotionDot: Record<string, string> = {
    anxious: 'bg-apple-blue',
    fear: 'bg-red-500',
    stress: 'bg-[#F7B928]',
    peace: 'bg-[#31A24C]'
  };

  const handleDownload = async () => {
    if (!cardRef.current) return;
    try {
      setIsGenerating(true);
      
      const image = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: window.devicePixelRatio || 2,
        backgroundColor: '#FFFFFF',
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
      className="fixed inset-0 z-[70] bg-[#F0F2F5] dark:bg-[#1C1E21] overflow-y-auto flex flex-col"
    >
      <header className="flex justify-between items-center p-6 sticky top-0 z-10 bg-[#F0F2F5]/80 dark:bg-[#1C1E21]/80 backdrop-blur-xl">
        <button 
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-white/75 dark:bg-white/10 border border-black/10 dark:border-white/12 backdrop-blur flex items-center justify-center text-gray-700 dark:text-white/90 transition-colors shadow-sm hover:bg-white hover:dark:bg-white/14"
        >
          <ChevronLeft size={20} />
        </button>
        <span className="text-gray-900 dark:text-white font-bold text-sm tracking-widest">分享解析</span>
        <div className="w-10" /> {/* Spacer */}
      </header>

      <div className="flex-1 flex flex-col items-center px-6 pb-24">
        {/* Share Card to be captured */}
        <div 
          ref={cardRef}
          className="w-full max-w-2xl meta-card overflow-hidden"
        >
          <div className="h-64 bg-[#F7F8FA] dark:bg-white/6 relative flex items-center justify-center overflow-hidden border-b border-black/5 dark:border-white/10">
            {dreamImage ? (
              <img src={dreamImage} alt="Dream Canvas" className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 bg-[#E8F3FF] dark:bg-white/6"></div>
            )}
            {!dreamImage && <Sparkles className="text-apple-blue/30 w-24 h-24 absolute" />}
          </div>

          <div className="p-8 flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">{date}</span>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${emotionDot[emotion] ?? 'bg-gray-400'}`} />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">{title}</h2>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {tags.map(tag => (
                <span key={tag} className="text-xs font-bold text-gray-700 dark:text-gray-200 bg-[#F1F4F7] dark:bg-white/8 border border-black/5 dark:border-white/10 px-3 py-1.5 rounded-full">
                  #{tag}
                </span>
              ))}
            </div>

            <div className="rounded-2xl p-4 bg-[#F7F8FA] dark:bg-white/6 border border-black/5 dark:border-white/10">
              <p className="text-[11px] font-bold tracking-widest text-gray-500 dark:text-gray-400">梦境内容</p>
              <p className="text-gray-800 dark:text-gray-200 text-sm leading-relaxed mt-2 line-clamp-6 whitespace-pre-wrap">{content}</p>
            </div>

            {crossAnalysis && (
              <div className="rounded-2xl p-4 bg-[#F7F8FA] dark:bg-white/6 border border-black/5 dark:border-white/10">
                <p className="text-[11px] font-bold tracking-widest text-gray-500 dark:text-gray-400">AI 综合洞察</p>
                <p className="text-gray-800 dark:text-gray-200 text-sm leading-relaxed mt-2 line-clamp-8 whitespace-pre-wrap">
                  {crossAnalysis}
                </p>
              </div>
            )}

            <div className="h-px w-full bg-black/5 dark:bg-white/10 my-2"></div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#0064E0] flex items-center justify-center">
                  <span className="text-xl">🌙</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-gray-900 dark:text-white font-bold text-sm">梦境拓卜</span>
                  <span className="text-gray-500 dark:text-gray-400 text-[10px] uppercase tracking-wider">Dream Topology</span>
                </div>
              </div>
              <div className="px-3 py-2 bg-[#E8F3FF] dark:bg-white/8 border border-black/5 dark:border-white/10 rounded-lg">
                <span className="text-[10px] text-apple-blue dark:text-white/80 tracking-wider font-bold">DREAM TOPOLOGY</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 w-full max-w-2xl mt-8">
          <button 
            onClick={handleDownload}
            disabled={isGenerating}
            className="meta-btn-primary flex-1 disabled:opacity-50"
          >
            {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
            保存图片
          </button>
          <button 
            onClick={handleShare}
            disabled={isSharing}
            className="meta-btn-secondary flex-1 disabled:opacity-60"
          >
            {isSharing ? <Loader2 size={18} className="animate-spin" /> : <Share2 size={18} />}
            {isSharing ? '处理中...' : '分享链接'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
