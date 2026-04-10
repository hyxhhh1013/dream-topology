import { useState, useRef, useEffect } from 'react';
import { Activity, Thermometer, Sparkles, BrainCircuit, Keyboard, Mic, Loader2, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { analyzeDream, fetchLocalTemperature } from '../services/api';
import type { AnalyzeResponse } from '../services/api';

// Types for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export default function CaptureView({ onGenerate }: { onGenerate?: (data?: any) => void }) {
  const [isRecording, setIsRecording] = useState(false);
  const [dreamText, setDreamText] = useState("");
  const [inputMode, setInputMode] = useState<'voice' | 'text'>('voice');
  const [analysisMode, setAnalysisMode] = useState<'fast' | 'deep'>('fast');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [, setAnalysisResult] = useState<AnalyzeResponse | null>(null);

  // Dynamic states for evaluation
  const [vividness, setVividness] = useState(30);
  const [terror, setTerror] = useState(10);
  const [lucidity, setLucidity] = useState(20);

  // Environmental data state
  const [localTemp, setLocalTemp] = useState<number | null>(null);
  const [isTempLoading, setIsTempLoading] = useState(true);

  // Fetch local temperature on mount
  useEffect(() => {
    async function getTemp() {
      setIsTempLoading(true);
      const temp = await fetchLocalTemperature();
      setLocalTemp(temp);
      setIsTempLoading(false);
    }
    getTemp();
  }, []);

  // Analyze text in real-time to update sliders
  useEffect(() => {
    if (!dreamText) {
      setVividness(30);
      setTerror(10);
      setLucidity(20);
      return;
    }

    // Simple heuristic-based evaluation for real-time feedback
    const text = dreamText;
    const length = text.length;
    
    // 1. Vividness based on length and descriptive words
    const descriptiveWords = ['红', '黑', '大', '小', '亮', '暗', '声音', '感觉', '光', '影', '跑', '飞'];
    const descCount = descriptiveWords.filter(w => text.includes(w)).length;
    const calcVividness = Math.min(30 + (length * 0.5) + (descCount * 5), 95);
    setVividness(Math.floor(calcVividness));

    // 2. Terror based on negative keywords
    const terrorWords = ['怕', '恐惧', '死', '追', '鬼', '怪物', '掉', '落', '血', '黑', '急', '哭', '喊', '噩梦'];
    const terrorCount = terrorWords.filter(w => text.includes(w)).length;
    const calcTerror = Math.min(10 + (terrorCount * 15) + (length > 100 ? 5 : 0), 98);
    setTerror(Math.floor(calcTerror));

    // 3. Lucidity based on self-awareness keywords
    const lucidityWords = ['知道', '意识到', '梦', '醒', '控制', '想', '发现', '明白'];
    const lucidityCount = lucidityWords.filter(w => text.includes(w)).length;
    const calcLucidity = Math.min(20 + (lucidityCount * 12), 85);
    setLucidity(Math.floor(calcLucidity));

  }, [dreamText]);
  
  // Ref to store the speech recognition instance
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Initialize Speech Recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true; // Keep listening
      recognition.interimResults = true; // Show results while speaking
      recognition.lang = 'zh-CN'; // Set language to Chinese (can be dynamic later)

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        // We append the final transcript and show interim temporarily
        // For a smoother experience, we'll just set the state to the combination
        setDreamText(() => {
           // We only want to append final transcripts once they are done, 
           // but for simplicity in this demo, let's just use the full transcript string from the event
           let fullText = '';
           for (let i = 0; i < event.results.length; i++) {
             fullText += event.results[i][0].transcript;
           }
           return fullText;
        });
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsRecording(false);
        if (event.error === 'not-allowed') {
          alert('请允许麦克风权限以使用语音捕获功能。您可能需要在浏览器设置或系统设置中手动开启麦克风权限。');
        } else if (event.error === 'network') {
          alert('语音识别需要网络连接或受到浏览器限制，请尝试切换网络或使用其他浏览器（推荐使用系统自带浏览器或 Chrome）。');
        } else if (event.error === 'no-speech') {
          // Ignore no-speech errors, they just mean the user was quiet
        } else {
          // Provide fallback for unknown errors
          alert(`语音识别遇到问题 (${event.error})，请尝试使用文本输入模式。`);
          setInputMode('text');
        }
      };

      recognition.onend = () => {
        // If it ended automatically but we are still supposed to be recording, restart it
        // (Sometimes it stops after a pause)
        // Add a small delay to prevent infinite loops of fast crashes in unsupported environments
        if (isRecording) {
          setTimeout(() => {
            try {
               if (recognitionRef.current) {
                 recognitionRef.current.start();
               }
            } catch(e) {
               console.error("Failed to restart recognition", e);
               setIsRecording(false);
            }
          }, 300);
        } else {
           setIsRecording(false);
        }
      };

      recognitionRef.current = recognition;
    } else {
      console.warn("Speech Recognition API is not supported in this browser.");
    }

    // Cleanup
      return () => {
        if (recognitionRef.current) {
          recognitionRef.current.stop();
        }
      };
  }, []); // isRecording is intentionally omitted from dependency array to avoid recreating the object

  // Update recognition state when isRecording changes
  useEffect(() => {
    if (isRecording && recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error("Error starting recognition", e);
      }
    } else if (!isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, [isRecording]);

  const toggleRecord = () => {
    // Check for HTTPS or localhost which is required for getUserMedia and SpeechRecognition on mobile
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      alert("安全限制：语音识别在移动端需要 HTTPS 环境。请使用 HTTPS 访问该网站。");
      // Fallback to text mode
      setInputMode('text');
      return;
    }

    if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
      alert("抱歉，您的浏览器不支持语音识别功能，请使用最新版的 Chrome、Safari 或 Edge，或者切换为文本输入模式。");
      // Fallback to text mode
      setInputMode('text');
      return;
    }
    
    setIsRecording(!isRecording);
    // Emotion detection mock based on recording attempt
    if (!isRecording) {
       // Mock logic
    }
  };

  const handleGenerate = async () => {
    if (!dreamText.trim()) return;
    
    setIsAnalyzing(true);
    try {
      // Use a deterministic estimate from current evaluation to avoid fixed mock constants
      const estimatedHeartRate = Math.round(Math.min(110, Math.max(58, 62 + terror * 0.32 + vividness * 0.08)));
      const mockPhysiologicalData = {
        heartRate: estimatedHeartRate,
        temperature: localTemp || 24.5 // Use fetched temp or fallback
      };

      // 1. Analyze dream to extract symbols, emotion, and cross-analysis
      const result = await analyzeDream(dreamText, mockPhysiologicalData, analysisMode);
      setAnalysisResult(result);
      
      // 2. Generate embedding (fire and forget for now, or await if needed)
      // await embedDream(dreamText);
      
      // 3. Pass data to parent component (to show in Insights/Topology)
      if (onGenerate) {
        onGenerate({ 
          dreamText, 
          analysis: result,
          physiologicalData: mockPhysiologicalData 
        });
      }
    } catch (error) {
      console.error("Analysis failed:", error);
      alert("解析失败，请检查后端服务是否启动。");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col gap-4 max-w-5xl mx-auto px-4 pb-24 relative overflow-hidden"
    >
      {/* Background Decorative Element */}
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-apple-purple/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-1/2 -left-32 w-80 h-80 bg-apple-blue/10 rounded-full blur-[120px] pointer-events-none" />

      <header className="flex justify-between items-end py-2 relative z-10">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-apple-blue shadow-[0_0_8px_rgba(0,113,227,0.5)]" />
            <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">梦境拓卜</h1>
          </div>
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] ml-3.5">Subconscious Signal Capture</p>
        </div>
        
        <div className="relative flex p-1 bg-apple-gray-light/30 dark:bg-white/5 backdrop-blur-xl rounded-2xl border border-black/5 dark:border-white/10 w-fit">
          <motion.div
            layoutId="activeTab"
            className="absolute inset-1 w-[calc(50%-4px)] bg-white dark:bg-[#2c2c2e] rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
            initial={false}
            animate={{ x: inputMode === 'voice' ? 0 : '100%' }}
            transition={{ type: "spring", stiffness: 500, damping: 40 }}
          />
          <button 
            onClick={() => setInputMode('voice')}
            className={`relative z-10 flex items-center gap-2 px-4 py-1.5 rounded-xl transition-colors duration-300 ${inputMode === 'voice' ? 'text-apple-blue' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}
          >
            <Mic size={14} className={inputMode === 'voice' ? 'animate-pulse' : ''} />
            <span className="text-[10px] font-black uppercase tracking-widest">语音</span>
          </button>
          <button 
            onClick={() => setInputMode('text')}
            className={`relative z-10 flex items-center gap-2 px-4 py-1.5 rounded-xl transition-colors duration-300 ${inputMode === 'text' ? 'text-apple-blue' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}
          >
            <Keyboard size={14} />
            <span className="text-[10px] font-black uppercase tracking-widest">文字</span>
          </button>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row gap-5 relative z-10">
        {/* 记录梦境核心区域 */}
        <section className="flex flex-col gap-4 flex-1 lg:w-[60%]">
          <div className="group relative glass-panel rounded-[2.5rem] p-5 flex flex-col min-h-[320px] sm:min-h-[380px] bg-white/60 dark:bg-black/20 border border-white/40 dark:border-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.03)] dark:shadow-none backdrop-blur-2xl transition-all duration-500 hover:shadow-[0_12px_48px_rgba(0,0,0,0.06)]">
            
            {/* Header within card */}
            <div className="flex items-center justify-between mb-4 px-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-apple-purple/10 flex items-center justify-center text-apple-purple">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h2 className="text-xs font-black text-gray-800 dark:text-gray-200 uppercase tracking-widest">记录梦境</h2>
                  <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Subconscious Input</p>
                </div>
              </div>

              <div className="relative flex bg-black/5 dark:bg-white/5 rounded-xl p-0.5 border border-black/5 dark:border-white/5">
                <motion.div
                  layoutId="analysisTab"
                  className="absolute inset-0.5 w-[calc(50%-1px)] bg-white dark:bg-[#3a3a3c] rounded-lg shadow-sm"
                  initial={false}
                  animate={{ x: analysisMode === 'fast' ? 0 : '100%' }}
                  transition={{ type: "spring", stiffness: 500, damping: 40 }}
                />
                <button
                  onClick={() => setAnalysisMode('fast')}
                  className={`relative z-10 px-3 py-1 rounded-lg text-[9px] font-black uppercase transition-colors duration-300 ${analysisMode === 'fast' ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}
                >
                  Fast
                </button>
                <button
                  onClick={() => setAnalysisMode('deep')}
                  className={`relative z-10 px-3 py-1 rounded-lg text-[9px] font-black uppercase transition-colors duration-300 ${analysisMode === 'deep' ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}
                >
                  Deep
                </button>
              </div>
            </div>

            {/* Input Content */}
            <AnimatePresence mode="wait">
              {inputMode === 'voice' ? (
                <motion.div 
                  key="voice"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.02 }}
                  className="flex-1 flex flex-col items-center justify-center gap-6 py-4"
                >
                  <div className="relative w-28 h-28 flex items-center justify-center">
                    {/* Organic Waves Animation */}
                    {isRecording && (
                      <>
                        {[1, 2, 3].map((i) => (
                          <motion.div
                            key={i}
                            className="absolute inset-0 rounded-full border-2 border-apple-blue/30"
                            animate={{ 
                              scale: [1, 1.8],
                              opacity: [0.5, 0],
                            }}
                            transition={{ 
                              duration: 2, 
                              repeat: Infinity, 
                              delay: i * 0.6,
                              ease: "easeOut"
                            }}
                          />
                        ))}
                        <motion.div
                          className="absolute inset-[-10px] rounded-full bg-apple-blue/5 blur-xl"
                          animate={{ opacity: [0.3, 0.6, 0.3] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      </>
                    )}
                    
                    <button 
                      onClick={toggleRecord}
                      className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center transition-all duration-500 active:scale-90 shadow-2xl ${isRecording ? 'bg-red-500 shadow-red-500/30' : 'bg-gradient-to-tr from-apple-blue to-blue-400 shadow-apple-blue/30'}`}
                    >
                      {isRecording ? (
                        <div className="flex gap-1 items-center">
                          {[1, 2, 3].map(i => (
                            <motion.div 
                              key={i}
                              className="w-1.5 bg-white rounded-full"
                              animate={{ height: [8, 24, 8] }}
                              transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                            />
                          ))}
                        </div>
                      ) : (
                        <Mic size={32} className="text-white" />
                      )}
                    </button>
                  </div>
                  
                  <div className="max-w-sm text-center space-y-2">
                    <p className={`text-sm font-bold tracking-tight transition-colors duration-300 ${isRecording ? 'text-apple-blue' : 'text-gray-400'}`}>
                      {isRecording ? "正在捕捉潜意识波形..." : "点击开启信号捕捉"}
                    </p>
                    <div className="min-h-[3rem] flex items-center justify-center">
                      <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2 px-6 italic">
                        {dreamText || (isRecording ? "" : "“我梦见在一座漂浮的城市里飞行...”")}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="flex-1 flex flex-col relative">
                  <textarea 
                    value={dreamText}
                    onChange={(e) => setDreamText(e.target.value)}
                    placeholder="在这页纸上写下你记得的所有碎片..."
                    className="w-full flex-1 bg-black/5 dark:bg-white/5 border border-transparent focus:border-apple-blue/20 rounded-[1.5rem] p-5 text-sm leading-relaxed text-gray-900 dark:text-gray-200 focus:outline-none transition-all duration-300 resize-none placeholder-gray-400 dark:placeholder-gray-600 shadow-inner"
                  />
                  <div className="absolute bottom-4 right-4 text-[9px] font-black text-gray-400 uppercase tracking-widest pointer-events-none">
                    {dreamText.length} characters
                  </div>
                </div>
              )}
            </AnimatePresence>

            {/* Transcription Review Area (for voice mode) */}
            {dreamText && inputMode === 'voice' && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-4"
              >
                <div className="bg-black/5 dark:bg-white/5 rounded-2xl p-4 border border-black/5 dark:border-white/5">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <div className="w-1 h-1 rounded-full bg-apple-blue" />
                    信号转换结果
                  </p>
                  <textarea 
                    value={dreamText}
                    onChange={(e) => setDreamText(e.target.value)}
                    className="w-full bg-transparent text-[11px] leading-relaxed text-gray-700 dark:text-gray-300 focus:outline-none resize-none min-h-[60px]"
                  />
                </div>
              </motion.div>
            )}

            <button 
              onClick={handleGenerate}
              disabled={isAnalyzing || !dreamText.trim()}
              className="group relative w-full mt-5 h-12 rounded-2xl overflow-hidden shadow-[0_10px_20px_-5px_rgba(0,113,227,0.3)] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:grayscale disabled:scale-100"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-apple-purple via-apple-blue to-apple-purple bg-[length:200%_auto] animate-gradient-x" />
              <div className="relative flex items-center justify-center gap-2.5 text-white font-black text-xs uppercase tracking-[0.2em]">
                {isAnalyzing ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <BrainCircuit size={16} className="group-hover:rotate-12 transition-transform duration-500" />
                )}
                {isAnalyzing ? '拓扑网络绘制中...' : '生成拓扑解析'}
              </div>
            </button>
          </div>
        </section>

        {/* 侧边数据卡片 */}
        <section className="flex flex-col gap-4 lg:w-[40%]">
          {/* Physiological Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="glass-panel rounded-3xl p-4 bg-white/60 dark:bg-white/5 border border-white/40 dark:border-white/5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500">
                  <Activity size={12} />
                </div>
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">REM心率</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">85</span>
                <span className="text-[10px] font-bold text-gray-400 uppercase">bpm</span>
              </div>
              <div className="mt-2 w-full h-1 bg-black/5 dark:bg-white/10 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '70%' }}
                  className="h-full bg-red-500/60 rounded-full"
                />
              </div>
            </div>

            <div className="glass-panel rounded-3xl p-4 bg-white/60 dark:bg-white/5 border border-white/40 dark:border-white/5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500">
                  <Thermometer size={12} />
                </div>
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">体感温度</span>
              </div>
              <div className="flex items-baseline gap-1">
                {isTempLoading ? (
                  <Loader2 size={14} className="animate-spin text-gray-300" />
                ) : (
                  <>
                    <span className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">{localTemp?.toFixed(1) || '24.5'}</span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">°C</span>
                  </>
                )}
              </div>
              <div className="mt-2 w-full h-1 bg-black/5 dark:bg-white/10 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '45%' }}
                  className="h-full bg-orange-500/60 rounded-full"
                />
              </div>
            </div>
          </div>

          {/* Real-time Mapping */}
          <div className="glass-panel rounded-[2rem] p-6 bg-white/60 dark:bg-white/5 border border-white/40 dark:border-white/5 shadow-sm flex-1">
            <div className="flex items-center justify-between mb-6">
              <div className="space-y-0.5">
                <h3 className="text-[10px] font-black text-gray-800 dark:text-gray-200 uppercase tracking-widest">实时体感映射</h3>
                <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest">Real-time Physical Feedback</p>
              </div>
              <div className="w-8 h-8 rounded-xl bg-apple-blue/10 flex items-center justify-center text-apple-blue">
                <Activity size={16} />
              </div>
            </div>

            <div className="space-y-6">
              <CompactSlider label="清晰度" value={vividness} color="bg-gradient-to-r from-blue-400 to-apple-blue" icon="👁️" />
              <CompactSlider label="惊悚感" value={terror} color="bg-gradient-to-r from-red-400 to-red-600" icon="🌑" />
              <CompactSlider label="控制力" value={lucidity} color="bg-gradient-to-r from-emerald-400 to-emerald-600" icon="🧘" />
            </div>

            <div className="mt-8 p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
              <div className="flex items-center gap-2 mb-1.5">
                <Info size={10} className="text-gray-400" />
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">解析提示</span>
              </div>
              <p className="text-[10px] leading-relaxed text-gray-500 dark:text-gray-400">
                系统正根据你的描述深度推演脑电波频率与情绪载荷，这些指标将作为拓扑网络的核心权重。
              </p>
            </div>
          </div>
        </section>
      </div>
    </motion.div>
  );
}

function CompactSlider({ label, value, color, icon }: { label: string, value: number, color: string, icon?: string }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center px-1">
        <div className="flex items-center gap-2">
          <span className="text-sm">{icon}</span>
          <span className="text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider">{label}</span>
        </div>
        <span className="text-[10px] font-black text-apple-blue">{value}%</span>
      </div>
      <div className="h-2 w-full bg-black/5 dark:bg-white/5 rounded-full overflow-hidden border border-black/5 dark:border-white/5 shadow-inner">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          className={`h-full ${color} rounded-full shadow-[0_0_10px_rgba(0,0,0,0.1)]`}
          transition={{ type: "spring", stiffness: 50, damping: 20 }}
        />
      </div>
    </div>
  );
}
