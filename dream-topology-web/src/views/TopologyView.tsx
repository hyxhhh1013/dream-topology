import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Share, ChevronLeft, Sparkles, BrainCircuit, Activity, Droplets, Loader2, WandSparkles } from 'lucide-react';
import type { AnalyzeResponse } from '../services/api';
import { toBlob } from 'html-to-image';

export default function TopologyView({ onBack, analysisData, onOpenTarot }: { onBack?: () => void, analysisData?: AnalyzeResponse | null, onOpenTarot?: () => void }) {
  const [isSharing, setIsSharing] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);

  // Dynamic generation of core insight and action items based on analysisData
  const generateInsights = () => {
    if (analysisData?.insights) {
      return {
        coreInsight: analysisData.insights.coreTheme || "潜意识信号已捕获",
        interpretation: analysisData.insights.interpretation || analysisData.cross_analysis || "暂无解析说明",
        actionItems: (analysisData.insights.actionableAdvice && analysisData.insights.actionableAdvice.length > 0)
          ? analysisData.insights.actionableAdvice
          : ["请结合梦境与近期压力源，记录 1 条最核心触发因素。"]
      };
    }

    // If no dynamic data, return the default mock data
    if (!analysisData || !analysisData.symbols || analysisData.symbols.length === 0) {
      return {
        coreInsight: "高应激预警",
        interpretation: "梦境中的“迷宫”与“倒影”指向身份认同焦虑。结合生理数据，判定为「生理干扰叠加心理压力的双重噩梦」。这种组合通常出现在高强度工作周期或重大决策前夕。",
        actionItems: [
          "环境调节：睡前将空调温度下调至 24°C-26°C，保持卧室通风，降低由闷热引起的生理性焦虑。",
          "心理阻断：尝试 10 分钟身体扫描冥想或 4-7-8 呼吸法，有效降低入睡前的心率，平复自主神经系统。",
          "认知重构：在清醒状态下重新回想场景，并在脑海中为自己设定一个“上帝视角”或找到出口，打破无力感的心理暗示。"
        ]
      };
    }

    // Dynamic generation based on actual data
    const emotionMap: Record<string, { theme: string, action: string }> = {
      'FEAR': { theme: "潜意识恐惧与逃避机制", action: "直面练习：在安全的现实环境中，尝试写下你目前最害怕失去或面对的三件事。" },
      'ANXIETY': { theme: "高压过载与控制感缺失", action: "降噪减压：睡前 1 小时断开所有电子设备，进行 15 分钟的白噪音正念冥想。" },
      'SADNESS': { theme: "未处理的失落与哀伤", action: "情感释放：允许自己体验这些情绪，可以尝试艺术表达（如绘画、自由书写）来疏导。" },
      'ANGER': { theme: "被压抑的界限感与能量", action: "界限重建：在日常生活中练习说“不”，并在安全的空间（如拳击、高强度运动）释放物理能量。" },
      'JOY': { theme: "内在和谐与能量重置", action: "积极锚定：记录下今天让你开心的 3 件小事，强化这种积极的潜意识连接。" }
    };

    const mainEmotion = analysisData.emotion?.toUpperCase() || 'ANXIETY';
    const emotionConfig = emotionMap[mainEmotion] || emotionMap['ANXIETY'];
    
    // Extract main symbols for the interpretation
    const symbolNames = analysisData.symbols.slice(0, 2).map(s => s.name).join('”与“');
    const overallArchetype = analysisData.overall_archetype || "集体潜意识";

    return {
      coreInsight: emotionConfig.theme,
      interpretation: `梦境中反复出现的“${symbolNames}”指向了【${overallArchetype}】的激活。这表明你的心理能量正在重新分配，当前处于 ${mainEmotion === 'FEAR' || mainEmotion === 'ANXIETY' ? '较高的心理防御状态' : '深层的情感整合期'}。`,
      actionItems: [
        emotionConfig.action,
        `象征物对话：闭上眼睛，在脑海中召唤“${analysisData.symbols[0]?.name || '梦中关键物'}”，问它想传达什么信息。`,
        "睡眠重构：保持规律的作息时间，睡前避免过度刺激的大脑活动，为潜意识创造安全的处理空间。"
      ]
    };
  };

  const { coreInsight, interpretation, actionItems } = generateInsights();

  // Dynamic topology nodes based on real symbols
  const generateNodes = () => {
    if (!analysisData || !analysisData.symbols || analysisData.symbols.length === 0) {
      return [
        <MinimalNode key="1" label="迷宫" subLabel="(空间)" top="20%" left="25%" delay={0} dotColor="bg-purple-500" icon="🌌" />,
        <MinimalNode key="2" label="焦虑" subLabel="(情绪)" top="35%" left="75%" delay={0.2} dotColor="bg-red-500" icon="😰" />,
        <MinimalNode key="3" label="倒影" subLabel="(自我)" top="80%" left="35%" delay={0.4} dotColor="bg-blue-500" icon="🪞" />,
        <MinimalNode key="4" label="逃避" subLabel="(行为)" top="75%" left="70%" delay={0.6} dotColor="bg-orange-500" icon="🏃" />
      ];
    }

    const positions = [
      { top: "20%", left: "25%" },
      { top: "35%", left: "75%" },
      { top: "80%", left: "35%" },
      { top: "75%", left: "70%" },
      { top: "15%", left: "65%" },
    ];

    const colors = ["bg-purple-500", "bg-red-500", "bg-blue-500", "bg-orange-500", "bg-green-500"];
    
    return analysisData.symbols.slice(0, 5).map((symbol, index) => {
      const pos = positions[index % positions.length];
      const icon = symbol.category === '动作' ? "🏃" : symbol.category === '物体' ? "🔮" : "🌌";
      return (
        <MinimalNode 
          key={index}
          label={symbol.name} 
          subLabel={`(${symbol.category || '意象'})`} 
          top={pos.top} 
          left={pos.left} 
          delay={index * 0.2} 
          dotColor={colors[index % colors.length]} 
          icon={icon} 
        />
      );
    });
  };

  const nodes = generateNodes();

  // Dynamic metrics calculation based on symbols and emotions
  const calculateMetrics = () => {
    if (!analysisData || !analysisData.symbols || analysisData.symbols.length === 0) {
      return {
        activity: "87%",
        emotionExtreme: "High",
        lucidity: "Level 4",
        matchRate: "92%"
      };
    }

    const symbolCount = analysisData.symbols.length;
    // Calculate activity based on number of symbols (max 5 symbols = 98%)
    const activityValue = Math.min(65 + (symbolCount * 8), 98);
    
    // Calculate emotion extreme
    let emotionExtreme = "Medium";
    if (['FEAR', 'ANGER', 'SADNESS'].includes(analysisData.emotion?.toUpperCase() || '')) {
      emotionExtreme = "High";
    } else if (['JOY', 'SURPRISE'].includes(analysisData.emotion?.toUpperCase() || '')) {
      emotionExtreme = "Low";
    }

    // Calculate lucidity (randomized slightly but consistently based on symbol count)
    const lucidityLevel = Math.min(Math.max(Math.ceil(symbolCount / 1.5) + 1, 2), 5);

    // Provide some natural variation if we have real data, else static default
    const randomVariation = analysisData.symbols.length > 0 ? Math.floor(Math.random() * 10) : 0;

    return {
      activity: `${activityValue}%`,
      emotionExtreme,
      lucidity: `Level ${lucidityLevel}`,
      matchRate: `${Math.min(75 + (symbolCount * 3) + randomVariation, 99)}%`
    };
  };

  const metrics = calculateMetrics();
  const shareSymbols = analysisData?.symbols?.length
    ? analysisData.symbols.slice(0, 6).map(s => `${s.name}（${s.category || '意象'}）`)
    : ['迷宫（空间）', '焦虑（情绪）', '倒影（自我）', '逃避（行为）'];
  const evidenceMap = analysisData?.scientific_basis?.evidenceMap || [];
  const confidence = analysisData?.scientific_basis?.confidence;
  const limitations = analysisData?.scientific_basis?.limitations || [];
  const immersiveReflection = analysisData?.immersive_reflection;

  const handleShare = async () => {
    if (!exportRef.current || isSharing) return;
    
    try {
      setIsSharing(true);
      
      // We need to wait a tiny bit to ensure any hover states or animations are settled
      await new Promise(resolve => setTimeout(resolve, 100));

      const blob = await toBlob(exportRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#F6F8FF',
      });
      if (!blob) throw new Error('Failed to create image blob');

      const file = new File([blob], 'dream-topology-report.png', { type: 'image/png' });

      // Try native Web Share API first
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: '我的潜意识拓扑解析报告',
          text: `核心洞察: ${coreInsight}`,
          files: [file],
        });
      } else {
        // Fallback: Download the image
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'dream-topology-report.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        alert('当前环境不支持系统分享，已自动为你保存图片。');
      }
    } catch (error) {
      console.error('Error sharing report:', error);
      alert('生成分享图片时出错，请重试。');
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <>
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col h-full gap-4 pb-16 sm:pb-10"
      ref={reportRef}
    >
      <header className="flex justify-between items-center mb-1">
        <button 
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-white/75 dark:bg-white/10 border border-black/10 dark:border-white/12 backdrop-blur flex items-center justify-center text-gray-700 dark:text-white/90 transition-colors hover:bg-white hover:dark:bg-white/14 shadow-sm"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white transition-colors tracking-widest">拓扑解析报告</span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={onOpenTarot}
            className="h-9 px-2.5 rounded-full bg-white/75 dark:bg-white/10 border border-black/10 dark:border-white/12 backdrop-blur flex items-center justify-center gap-1 text-apple-blue dark:text-white/90 transition-colors hover:bg-white hover:dark:bg-white/14 shadow-sm"
          >
            <WandSparkles size={14} />
            <span className="text-[10px] sm:text-xs font-bold">塔罗</span>
          </button>
          <button 
            onClick={handleShare}
            className="w-9 h-9 rounded-full bg-white/75 dark:bg-white/10 border border-black/10 dark:border-white/12 backdrop-blur flex items-center justify-center text-apple-blue dark:text-white/90 transition-colors hover:bg-white hover:dark:bg-white/14 disabled:opacity-50 shadow-sm"
            aria-label="分享报告"
            aria-busy={isSharing}
          >
            {isSharing ? <Loader2 size={16} className="animate-spin" /> : <Share size={16} />}
          </button>
        </div>
      </header>

      {/* 极简拓扑图区域 */}
      <section className="relative w-full h-[300px] sm:h-[350px] lg:h-[500px] flex items-center justify-center my-2 rounded-2xl sm:rounded-3xl bg-white dark:bg-[#1C1E21] shadow-inner border border-black/5 dark:border-white/10 overflow-hidden">
        {/* 背景光效 */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[18%] left-[18%] w-48 sm:w-64 h-48 sm:h-64 bg-apple-blue/10 rounded-full blur-3xl" />
          <div className="absolute bottom-[18%] right-[18%] w-48 sm:w-64 h-48 sm:h-64 bg-apple-blue/10 rounded-full blur-3xl" />
        </div>

        {/* 极简连接线 */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
          <g className="text-gray-400/70 dark:text-white/20" stroke="currentColor" strokeWidth="1.5" fill="none">
            <motion.line 
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              x1="50%" y1="50%" x2="25%" y2="20%" 
            />
            <motion.line 
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.5, delay: 0.2, ease: "easeInOut" }}
              x1="50%" y1="50%" x2="75%" y2="35%" 
            />
            <motion.line 
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.5, delay: 0.4, ease: "easeInOut" }}
              x1="50%" y1="50%" x2="35%" y2="80%" 
            />
            <motion.line 
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.5, delay: 0.6, ease: "easeInOut" }}
              x1="50%" y1="50%" x2="70%" y2="75%" 
            />
          </g>
        </svg>

        {/* 中心节点：潜意识 */}
        <motion.div 
          className="absolute z-20"
          animate={{ 
            scale: [1, 1.02, 1],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="relative group cursor-pointer">
            {/* 极简实色球体 */}
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full flex flex-col items-center justify-center bg-white dark:bg-[#1C2B33] border border-black/10 dark:border-white/12 shadow-[0_10px_26px_rgba(0,0,0,0.10)]">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-apple-blue/10 flex items-center justify-center mb-0.5 sm:mb-1">
                <Sparkles size={20} className="text-apple-blue" />
              </div>
              <span className="text-[8px] font-black text-apple-blue uppercase tracking-[0.2em]">CORE</span>
            </div>
          </div>
        </motion.div>

        {/* 极简节点 */}
        {nodes}
      </section>

      {/* 详细数据指标 */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4 mt-1">
        <div className="meta-card p-3 sm:p-4 flex flex-col gap-1 sm:gap-2">
          <div className="flex items-center gap-1.5 text-apple-blue">
            <BrainCircuit size={14} />
            <span className="text-[10px] sm:text-xs font-bold">活跃度</span>
          </div>
          <span className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">{metrics.activity}</span>
        </div>
        <div className="meta-card p-3 sm:p-4 flex flex-col gap-1 sm:gap-2">
          <div className="flex items-center gap-1.5 text-red-500">
            <Activity size={14} />
            <span className="text-[10px] sm:text-xs font-bold">情绪极值</span>
          </div>
          <span className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">{metrics.emotionExtreme}</span>
        </div>
        <div className="meta-card p-3 sm:p-4 flex flex-col gap-1 sm:gap-2">
          <div className="flex items-center gap-1.5 text-apple-blue">
            <Droplets size={14} />
            <span className="text-[10px] sm:text-xs font-bold">清晰度</span>
          </div>
          <span className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">{metrics.lucidity}</span>
        </div>
        <div className="meta-card p-3 sm:p-4 flex flex-col gap-1 sm:gap-2">
          <div className="flex items-center gap-1.5 text-apple-blue">
            <Sparkles size={14} />
            <span className="text-[10px] sm:text-xs font-bold">原型匹配</span>
          </div>
          <span className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">{metrics.matchRate}</span>
        </div>
      </section>

      {/* 极简解析结论 */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 mt-2 sm:mt-4">
        <div className="meta-card p-4 sm:p-6">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-apple-blue/10 text-apple-blue text-[10px] font-bold tracking-wider uppercase">
            核心洞察
          </div>
          <h3 className="text-base sm:text-lg font-black text-gray-900 dark:text-white mt-2.5 tracking-tight">
            {coreInsight}
          </h3>
          <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed mt-2 font-medium">
            {interpretation}
          </p>
        </div>

        <div className="meta-card p-4 sm:p-6">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-apple-blue/10 text-apple-blue text-[10px] font-bold tracking-wider uppercase">
            行动建议
          </div>
          <ul className="mt-3.5 space-y-2.5">
            {actionItems.map((item: string, index: number) => {
              return (
                <li key={index} className="flex gap-2.5 text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
                  <span className="w-4 h-4 mt-0.5 rounded-full bg-apple-blue/15 text-apple-blue flex items-center justify-center text-[9px] font-bold shrink-0">
                    {index + 1}
                  </span>
                  <span>{item}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {(confidence !== undefined || evidenceMap.length > 0) && (
        <section className="rounded-3xl p-6 bg-white/70 dark:bg-white/5 border border-black/5 dark:border-white/10">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-bold tracking-wider text-gray-700 dark:text-gray-300">科学依据与证据链</h3>
            {confidence !== undefined && (
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                置信度 {confidence}%
              </span>
            )}
          </div>
          <div className="mt-4 space-y-3">
            {evidenceMap.map((e: any, idx: number) => (
              <div key={idx} className="rounded-2xl p-4 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{idx + 1}. {e.observation}</p>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">推断：{e.inference}</p>
                <p className="text-xs mt-2 text-gray-500 dark:text-gray-400">证据强度：{e.strength}</p>
              </div>
            ))}
          </div>
          {!!limitations.length && (
            <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 space-y-1">
              {limitations.map((item: string, i: number) => (
                <p key={i}>- {item}</p>
              ))}
            </div>
          )}
        </section>
      )}

      {!!immersiveReflection && (
        <section className="rounded-3xl p-6 bg-white/70 dark:bg-white/5 border border-black/5 dark:border-white/10">
          <h3 className="text-sm font-bold tracking-wider text-gray-700 dark:text-gray-300">身临其境反思引导</h3>
          <p className="mt-3 text-sm leading-7 text-gray-700 dark:text-gray-300">{immersiveReflection}</p>
        </section>
      )}
    </motion.div>
    <div className="fixed -left-[99999px] top-0 pointer-events-none">
      <div
        ref={exportRef}
        className="w-[1080px] p-14 bg-white text-[#050505]"
      >
        <div className="rounded-[28px] border border-[#CED0D4] bg-white shadow-[0_20px_60px_rgba(0,0,0,0.10)] p-10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] tracking-[0.22em] font-semibold text-[#65676B]">DREAM TOPOLOGY</p>
              <h1 className="text-[40px] font-black mt-2">拓扑解析报告</h1>
            </div>
            <div className="text-right">
              <p className="text-[14px] text-[#65676B]">潜意识核心洞察</p>
              <p className="text-[24px] font-bold text-[#0064E0]">{coreInsight}</p>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4 mt-8">
            <div className="rounded-2xl border border-[#CED0D4] bg-[#F7F8FA] p-4">
              <p className="text-xs text-[#65676B]">潜意识活跃度</p>
              <p className="text-2xl font-black mt-1">{metrics.activity}</p>
            </div>
            <div className="rounded-2xl border border-[#CED0D4] bg-[#F7F8FA] p-4">
              <p className="text-xs text-[#65676B]">情绪波动极值</p>
              <p className="text-2xl font-black mt-1">{metrics.emotionExtreme}</p>
            </div>
            <div className="rounded-2xl border border-[#CED0D4] bg-[#F7F8FA] p-4">
              <p className="text-xs text-[#65676B]">梦境清晰度</p>
              <p className="text-2xl font-black mt-1">{metrics.lucidity}</p>
            </div>
            <div className="rounded-2xl border border-[#CED0D4] bg-[#F7F8FA] p-4">
              <p className="text-xs text-[#65676B]">原型匹配度</p>
              <p className="text-2xl font-black mt-1">{metrics.matchRate}</p>
            </div>
          </div>
          <div className="mt-8 rounded-3xl border border-[#CED0D4] bg-[#F7F8FA] p-6">
            <p className="text-sm font-bold tracking-wider text-[#1C2B33]">关键梦境符号</p>
            <div className="flex flex-wrap gap-2 mt-3">
              {shareSymbols.map((symbol) => (
                <span key={symbol} className="px-3 py-1.5 rounded-full bg-white border border-[#CED0D4] text-sm font-medium text-[#1C2B33]">
                  {symbol}
                </span>
              ))}
            </div>
          </div>
          <div className="mt-8 rounded-3xl border border-[#CED0D4] bg-white p-6">
            <p className="text-sm font-bold tracking-wider text-[#1C2B33]">综合解读</p>
            <p className="text-[17px] leading-8 text-[#1C2B33] mt-3">{interpretation}</p>
          </div>
          <div className="mt-8 rounded-3xl border border-[#CED0D4] bg-white p-6">
            <p className="text-sm font-bold tracking-wider text-[#1C2B33]">行动建议</p>
            <div className="mt-3 space-y-3">
              {actionItems.map((item, i) => (
                <p key={i} className="text-[16px] leading-7 text-[#1C2B33]">• {item}</p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}

function MinimalNode({ label, subLabel, top, left, delay, dotColor, icon }: { label: string, subLabel?: string, top: string, left: string, delay: number, dotColor: string, icon?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: delay * 0.15 + 0.4, duration: 0.6 }}
      style={{ top, left }}
      className="absolute -translate-x-1/2 -translate-y-1/2 z-20"
    >
      <div className="flex flex-col items-center gap-1">
        <div className="flex items-center gap-2 bg-white dark:bg-[#2C2C2E] px-3 py-1.5 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm group hover:border-apple-blue transition-colors duration-300">
          {icon && <span className="text-sm shrink-0">{icon}</span>}
          <div className="flex flex-col items-start leading-none">
            {subLabel && (
              <span className="text-[8px] font-black text-gray-400 dark:text-white/30 uppercase tracking-widest mb-0.5">
                {subLabel.replace(/[()]/g, '')}
              </span>
            )}
            <span className="text-xs font-bold text-gray-900 dark:text-white tracking-tight">
              {label}
            </span>
          </div>
        </div>
        
        {/* 指示小点 */}
        <div className={`w-1 h-1 rounded-full ${dotColor}`} />
      </div>
    </motion.div>
  );
}
