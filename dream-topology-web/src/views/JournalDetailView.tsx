import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Share, Calendar, Clock, Thermometer, Activity, BrainCircuit, Loader2, Image as ImageIcon, Edit2, Check, X } from 'lucide-react';
import ShareReportView from './ShareReportView';
import { generateDreamImage } from '../services/api';

interface JournalDetailProps {
  onBack: () => void;
  onUpdate?: (updatedData: any) => void;
  title: string;
  date: string;
  time: string;
  content: string;
  emotion: string;
  tags: string[];
  crossAnalysis?: string; // Add crossAnalysis to props
}

export default function JournalDetailView({ onBack, onUpdate, title: initialTitle, date, time, content: initialContent, emotion, tags, crossAnalysis }: JournalDetailProps) {
  const [showShare, setShowShare] = useState(false);
  const [dreamImage, setDreamImage] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  
  // Edit mode states
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [selectedStyle, setSelectedStyle] = useState('surrealism');

  const styles = [
    { id: 'surrealism', name: '超现实主义', icon: '🌌' },
    { id: 'cyberpunk', name: '赛博朋克', icon: '🏙️' },
    { id: 'watercolor', name: '梦幻水彩', icon: '🎨' },
    { id: 'oil_painting', name: '古典油画', icon: '🖌️' },
    { id: 'anime', name: '二次元', icon: '🌸' },
    { id: 'sketch', name: '心理素描', icon: '✏️' }
  ];

  const handleSave = () => {
    setIsEditing(false);
    if (onUpdate) {
      onUpdate({ title, content });
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setTitle(initialTitle);
    setContent(initialContent);
  };

  const emotionColors: Record<string, string> = {
    anxious: 'bg-purple-500',
    fear: 'bg-red-500',
    stress: 'bg-orange-500',
    peace: 'bg-blue-500',
    neutral: 'bg-gray-500',
    happy: 'bg-yellow-500',
    sad: 'bg-blue-400',
    confusion: 'bg-indigo-500'
  };

  const emotionLabels: Record<string, string> = {
    anxious: '焦虑',
    fear: '恐惧',
    stress: '压力',
    peace: '平静',
    neutral: '中性',
    happy: '快乐',
    sad: '悲伤',
    confusion: '困惑'
  };

  const handleGenerateImage = async () => {
    if (isGeneratingImage || dreamImage) return;
    
    setIsGeneratingImage(true);
    try {
      const imageUrl = await generateDreamImage(content, undefined, selectedStyle);
      setDreamImage(imageUrl);
    } catch (error) {
      console.error("Failed to generate image:", error);
      alert("生成画卷失败，请重试。");
    } finally {
      setIsGeneratingImage(false);
    }
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
        <header className="flex justify-between items-center sticky top-0 bg-apple-gray-light/80 dark:bg-apple-black/80 backdrop-blur-xl z-10 py-4 -mx-6 px-6">
          <button 
            onClick={onBack}
            className="w-10 h-10 rounded-full glass-panel flex items-center justify-center text-gray-600 dark:text-gray-300 transition-colors shadow-sm"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <button 
                  onClick={handleCancel}
                  className="w-10 h-10 rounded-full glass-panel flex items-center justify-center text-gray-500 hover:text-red-500 transition-colors shadow-sm"
                >
                  <X size={18} />
                </button>
                <button 
                  onClick={handleSave}
                  className="w-10 h-10 rounded-full glass-panel flex items-center justify-center text-apple-blue hover:text-blue-600 transition-colors shadow-sm"
                >
                  <Check size={18} />
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={() => setIsEditing(true)}
                  className="w-10 h-10 rounded-full glass-panel flex items-center justify-center text-gray-600 dark:text-gray-300 transition-colors shadow-sm hover:text-apple-blue"
                >
                  <Edit2 size={18} />
                </button>
                <button 
                  onClick={() => setShowShare(true)}
                  className="w-10 h-10 rounded-full glass-panel flex items-center justify-center text-apple-blue transition-colors shadow-sm"
                >
                  <Share size={18} />
                </button>
              </>
            )}
          </div>
        </header>

        <article className="flex flex-col gap-6">
          {/* Header Info */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 font-medium">
              <span className="flex items-center gap-1 bg-black/5 dark:bg-white/10 px-2.5 py-1 rounded-md">
                <Calendar size={14} /> {date}
              </span>
              <span className="flex items-center gap-1 bg-black/5 dark:bg-white/10 px-2.5 py-1 rounded-md">
                <Clock size={14} /> {time}
              </span>
            </div>
            {isEditing ? (
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-3xl font-bold text-black dark:text-white leading-tight bg-transparent border-b border-gray-300 dark:border-gray-700 focus:outline-none focus:border-apple-blue pb-1"
                placeholder="日记标题"
              />
            ) : (
              <h1 className="text-3xl font-bold text-black dark:text-white leading-tight">
                {title}
              </h1>
            )}
            
            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-black/40 border border-black/5 dark:border-white/5 shadow-sm">
                <span className={`w-2.5 h-2.5 rounded-full ${emotionColors[emotion]}`} />
                <span className="text-xs font-bold text-black dark:text-white">{emotionLabels[emotion]}</span>
              </div>
              <div className="flex gap-2">
                {tags.map(tag => (
                  <span key={tag} className="text-xs font-bold text-gray-500 dark:text-gray-400 bg-black/5 dark:bg-white/10 px-2.5 py-1.5 rounded-md">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* AI Generate Image Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest">梦境画卷</h2>
            </div>
            
            {!dreamImage && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">选择艺术风格</p>
                  <span className="text-[10px] text-apple-blue font-bold">{styles.find(s => s.id === selectedStyle)?.name}</span>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 no-scrollbar">
                  {styles.map((style) => (
                    <button
                      key={style.id}
                      onClick={() => setSelectedStyle(style.id)}
                      className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                        selectedStyle === style.id 
                          ? 'bg-apple-blue/10 border-apple-blue text-apple-blue shadow-sm' 
                          : 'bg-black/5 dark:bg-white/5 border-transparent text-gray-500 hover:bg-black/10'
                      }`}
                    >
                      <span>{style.icon}</span>
                      <span>{style.name}</span>
                    </button>
                  ))}
                </div>
                <button 
                  onClick={handleGenerateImage}
                  disabled={isGeneratingImage}
                  className="w-full h-14 rounded-2xl bg-gradient-to-r from-apple-purple to-apple-blue text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-apple-blue/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale"
                >
                  {isGeneratingImage ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <ImageIcon size={18} />
                  )}
                  {isGeneratingImage ? '正在绘制潜意识...' : '生成梦境画卷'}
                </button>
              </div>
            )}
            
            {dreamImage && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full aspect-square rounded-[2rem] overflow-hidden border border-black/10 dark:border-white/10 shadow-lg"
              >
                <img src={dreamImage} alt="Dream visualization" className="w-full h-full object-cover" />
              </motion.div>
            )}
            
            {isGeneratingImage && (
              <div className="w-full aspect-video rounded-[2rem] bg-black/5 dark:bg-white/5 flex flex-col items-center justify-center gap-3 border border-black/5 dark:border-white/5 animate-pulse">
                <BrainCircuit size={32} className="text-apple-blue opacity-50" />
                <p className="text-sm text-gray-500 font-medium">AI 正在绘制潜意识画面...</p>
              </div>
            )}
          </div>

          {/* Dream Content */}
          <div className="glass-panel rounded-[2rem] p-6 bg-white/60 dark:bg-white/5 border border-black/5 dark:border-white/5 shadow-sm">
            {isEditing ? (
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full min-h-[200px] text-base text-gray-700 dark:text-gray-200 leading-relaxed font-medium bg-transparent border-none focus:outline-none resize-y"
                placeholder="记录你的梦境..."
              />
            ) : (
              <p className="text-base text-gray-700 dark:text-gray-200 leading-relaxed font-medium whitespace-pre-wrap">
                {content}
              </p>
            )}
          </div>

          {/* Health Data Context & Cross Analysis */}
          <div className="flex flex-col gap-3 mt-2">
            <div className="flex items-center justify-between pl-1">
              <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">生理-心理交叉验证</h3>
              <div className="flex items-center gap-1 text-xs text-gray-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                数据已同步
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="glass-panel p-4 rounded-3xl bg-white/40 dark:bg-black/20 border border-black/5 dark:border-white/5">
                <div className="flex items-center gap-2 text-apple-blue mb-1">
                  <Activity size={14} />
                  <span className="text-xs font-bold uppercase tracking-wider">REM心率</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter">85</span>
                  <span className="text-xs text-gray-500 font-medium">bpm</span>
                </div>
              </div>
              
              <div className="glass-panel p-4 rounded-3xl bg-white/40 dark:bg-black/20 border border-black/5 dark:border-white/5">
                <div className="flex items-center gap-2 text-orange-500 mb-1">
                  <Thermometer size={14} />
                  <span className="text-xs font-bold uppercase tracking-wider">环境温度</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter">28.5</span>
                  <span className="text-xs text-gray-500 font-medium">°C</span>
                </div>
              </div>
            </div>

            {crossAnalysis && (
              <div className="glass-panel p-5 rounded-3xl bg-apple-purple/5 dark:bg-apple-purple/10 border border-apple-purple/20 dark:border-apple-purple/30 mt-2">
                <div className="flex items-center gap-2 text-apple-purple mb-4">
                  <BrainCircuit size={18} />
                  <span className="text-sm font-bold tracking-wider">AI 深度综合洞察</span>
                </div>
                <div className="flex flex-col gap-4">
                  {crossAnalysis.split('\n\n').map((paragraph, idx) => {
                    // Extract section title if it matches the format 【Title】
                    const match = paragraph.match(/^【(.*?)】([\s\S]*)$/);
                    if (match) {
                      return (
                        <div key={idx} className="flex flex-col gap-1">
                          <h4 className="text-xs font-bold text-apple-purple uppercase tracking-wider">{match[1]}</h4>
                          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
                            {match[2].trim()}
                          </p>
                        </div>
                      );
                    }
                    return (
                      <p key={idx} className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
                        {paragraph}
                      </p>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </article>
      </div>

      <AnimatePresence>
        {showShare && (
          <ShareReportView 
            onBack={() => setShowShare(false)} 
            title={title}
            date={date}
            content={content}
            emotion={emotion}
            tags={tags}
            dreamImage={dreamImage}
            crossAnalysis={crossAnalysis}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
