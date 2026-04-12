import { useState, useRef, useEffect } from 'react';
import { Activity, Thermometer, Info, Sparkles, BrainCircuit, Keyboard, Mic, Loader2 } from 'lucide-react';
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
      // Mock physiological data to send to backend for cross-analysis
      const mockPhysiologicalData = {
        heartRate: 85, // From the UI mock
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col h-full gap-6"
    >
      <header className="flex justify-between items-end mb-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white transition-colors">梦境拓扑</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-2 font-medium transition-colors">记录昨晚的潜意识</p>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row gap-8 flex-1">
        {/* 左侧：录音/文字输入卡片 */}
        <section className="glass-panel rounded-[2rem] p-8 flex flex-col items-center justify-center gap-6 relative overflow-hidden transition-colors border border-black/5 dark:border-white/10 shadow-sm dark:shadow-none min-h-[400px] lg:min-h-full flex-1 lg:w-1/2">
        {/* 输入模式切换 */}
        <div className="absolute top-4 right-4 z-20 flex flex-col sm:flex-row items-end sm:items-center gap-2">
        <div className="flex bg-black/5 dark:bg-white/10 rounded-full p-1 transition-colors">
          <button
            onClick={() => setInputMode('voice')}
            className={`p-2 rounded-full transition-all duration-300 ${inputMode === 'voice' ? 'bg-white dark:bg-[#2c2c2e] text-apple-blue shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
          >
            <Mic size={16} />
          </button>
          <button
            onClick={() => setInputMode('text')}
            className={`p-2 rounded-full transition-all duration-300 ${inputMode === 'text' ? 'bg-white dark:bg-[#2c2c2e] text-apple-blue shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
          >
            <Keyboard size={16} />
          </button>
        </div>
        <div className="flex bg-black/5 dark:bg-white/10 rounded-full p-1 transition-colors">
          <button
            onClick={() => setAnalysisMode('fast')}
            className={`px-3 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
              analysisMode === 'fast'
                ? 'bg-white dark:bg-[#2c2c2e] text-apple-blue shadow-sm'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Fast
          </button>
          <button
            onClick={() => setAnalysisMode('deep')}
            className={`px-3 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
              analysisMode === 'deep'
                ? 'bg-white dark:bg-[#2c2c2e] text-apple-blue shadow-sm'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Deep
          </button>
        </div>
        </div>

        <AnimatePresence mode="wait">
          {inputMode === 'voice' ? (
            <motion.div 
              key="voice"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="relative z-10 w-full text-center mt-4 flex-1 flex flex-col justify-center"
            >
              <div className="relative flex items-center justify-center w-32 h-32 mx-auto my-4 group">
                {/* 简化后的录音波纹特效 */}
                <AnimatePresence>
                  {isRecording && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="absolute inset-0"
                    >
                      <div className="absolute inset-[-10px] rounded-full bg-apple-purple/20 animate-siri-wave blur-md" />
                      <div className="absolute inset-[-20px] rounded-full border border-apple-purple/30 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]" />
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {/* 主按钮体 */}
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={toggleRecord}
                  className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 overflow-hidden ${
                    isRecording 
                      ? 'shadow-[0_0_30px_rgba(175,82,222,0.3)] dark:shadow-[0_0_40px_rgba(175,82,222,0.4)] border border-black/5 dark:border-white/20' 
                      : 'bg-black/5 dark:bg-[#2c2c2e] text-gray-700 dark:text-gray-300 shadow-none dark:shadow-sm hover:bg-black/10 dark:hover:bg-[#3a3a3c]'
                  }`}
                >
                  {/* 录音时的遮罩和流光背景 */}
                  {isRecording && (
                    <>
                      <div className="absolute inset-0 bg-white/80 dark:bg-black/40 backdrop-blur-md transition-colors" />
                      <div className="absolute inset-0 bg-gradient-to-tr from-apple-blue via-apple-purple to-orange-500 opacity-30 dark:opacity-60 animate-gradient-x mix-blend-multiply dark:mix-blend-overlay" />
                    </>
                  )}
                  {/* 中心图标 */}
                  <motion.div
                    animate={isRecording ? { rotate: [0, 5, -5, 0] } : { rotate: 0 }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="relative z-10"
                  >
                    <BrainCircuit 
                      size={42} 
                      strokeWidth={isRecording ? 2.5 : 2}
                      className={`transition-colors duration-300 ${
                        isRecording ? 'text-apple-purple dark:text-white' : 'text-gray-600 dark:text-gray-300'
                      }`} 
                    />
                  </motion.div>
                </motion.button>
              </div>
              
              <motion.div
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="mt-6"
              >
                <p className={`text-sm font-bold tracking-widest uppercase transition-colors ${
                  isRecording ? 'text-apple-purple drop-shadow-[0_0_10px_rgba(175,82,222,0.5)]' : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {isRecording ? "正在连接潜意识..." : "点击捕获梦境"}
                </p>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div 
              key="text"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="w-full relative z-10 mt-8 flex-1 flex flex-col"
            >
              <textarea 
                value={dreamText}
                onChange={(e) => {
                  setDreamText(e.target.value);
                  // if (e.target.value.length > 20) setEmotion('stress'); // Mock emotion detection based on text length
                }}
                className="w-full flex-1 bg-black/5 dark:bg-black/40 border border-transparent focus:border-apple-blue/50 rounded-2xl p-5 text-sm leading-relaxed text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-apple-blue/20 resize-none min-h-[180px] transition-all shadow-inner placeholder-gray-400"
                placeholder="在此输入你记得的梦境细节..."
              />
            </motion.div>
          )}
        </AnimatePresence>

        {dreamText && inputMode === 'voice' && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="w-full relative z-10"
          >
            <textarea 
              value={dreamText}
              onChange={(e) => setDreamText(e.target.value)}
              className="w-full bg-white/60 dark:bg-black/40 border border-black/5 dark:border-white/10 rounded-2xl p-5 text-sm leading-relaxed text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-apple-blue/50 resize-none min-h-[120px] transition-colors shadow-inner"
              placeholder="你的梦境将显示在这里..."
            />
          </motion.div>
        )}

        <motion.div className="mt-6 flex justify-center">
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: dreamText && !isAnalyzing ? 1.05 : 1 }}
            whileTap={{ scale: dreamText && !isAnalyzing ? 0.95 : 1 }}
            onClick={handleGenerate}
            disabled={!dreamText || isAnalyzing}
            className={`px-8 py-3 rounded-full flex items-center gap-2 transition-all duration-300 shadow-md text-sm font-semibold tracking-wide ${
              dreamText && !isAnalyzing
                ? 'shadow-apple-blue/20 bg-gradient-to-r from-apple-blue to-blue-500 text-white hover:shadow-lg hover:shadow-apple-blue/30' 
                : 'bg-black/5 dark:bg-white/5 text-gray-400 dark:text-gray-500 cursor-not-allowed border border-transparent dark:border-white/5'
            }`}
          >
            {isAnalyzing ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                正在解析潜意识...
              </>
            ) : (
              <>
                生成拓扑解析
                <Sparkles size={16} className={dreamText ? "animate-pulse" : ""} />
              </>
            )}
          </motion.button>
        </motion.div>
      </section>

      {/* 右侧：数据与体感评估 */}
      <div className="flex flex-col gap-8 flex-1 lg:w-1/2">
        {/* 生理体征回填 (Device Health Mock) */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-gray-700 dark:text-gray-400 uppercase tracking-widest transition-colors">昨晚睡眠数据</h2>
              <Info size={14} className="text-gray-500 dark:text-gray-500 transition-colors" />
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/5 dark:bg-white/10">
              <Activity size={12} className="text-apple-blue" />
              <span className="text-[10px] font-bold text-gray-600 dark:text-gray-300">多设备协同同步</span>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="glass-panel rounded-3xl p-5 flex flex-col gap-2 transition-colors relative overflow-hidden group border border-black/10 dark:border-white/5 bg-white dark:bg-transparent">
              <div className="absolute top-0 right-0 w-24 h-24 bg-apple-blue/10 rounded-full blur-2xl group-hover:bg-apple-blue/20 transition-colors" />
              <div className="flex items-center gap-2 text-apple-blue relative z-10">
                <Activity size={18} />
                <span className="text-xs font-semibold uppercase tracking-wider">REM心率</span>
              </div>
              <div className="flex items-baseline gap-1 relative z-10">
                <span className="text-3xl font-bold text-gray-900 dark:text-white transition-colors tracking-tighter">85</span>
                <span className="text-xs text-gray-600 font-medium">bpm</span>
              </div>
              <p className="text-[10px] text-red-600 dark:text-red-400 mt-1 transition-colors font-medium">↑ 偏高 (+15%)</p>
            </div>

            <div className="glass-panel rounded-3xl p-5 flex flex-col gap-2 transition-colors relative overflow-hidden group border border-black/10 dark:border-white/5 bg-white dark:bg-transparent">
              <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/10 rounded-full blur-2xl group-hover:bg-orange-500/20 transition-colors" />
              <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 relative z-10 transition-colors">
                <Thermometer size={18} />
                <span className="text-xs font-semibold uppercase tracking-wider">环境温度</span>
              </div>
              <div className="flex items-baseline gap-1 relative z-10">
                {isTempLoading ? (
                  <Loader2 size={24} className="animate-spin text-orange-400 mt-1" />
                ) : (
                  <>
                    <span className="text-3xl font-bold text-gray-900 dark:text-white transition-colors tracking-tighter">
                      {localTemp !== null ? localTemp.toFixed(1) : '24.5'}
                    </span>
                    <span className="text-xs text-gray-600 font-medium">°C</span>
                  </>
                )}
              </div>
              <p className="text-[10px] text-orange-600 dark:text-orange-400 mt-1 transition-colors font-medium">
                {isTempLoading ? '定位中...' : (localTemp && localTemp > 26 ? '环境偏热' : localTemp && localTemp < 20 ? '环境偏冷' : '温度适宜')}
              </p>
            </div>
          </div>
        </section>

        {/* 多维体感评估 */}
        <section className="mb-8 flex-1 flex flex-col">
          <h2 className="text-sm font-bold text-gray-700 dark:text-gray-400 uppercase tracking-widest mb-3 transition-colors">体感评估</h2>
          <div className="glass-panel rounded-3xl p-6 flex flex-col justify-center gap-6 transition-colors border border-black/10 dark:border-white/5 shadow-sm dark:shadow-none bg-white dark:bg-transparent flex-1">
            <Slider label="生动度 (Vividness)" value={vividness} gradient="bg-gradient-to-r from-cyan-400 to-blue-500" />
            <Slider label="惊悚度 (Terror)" value={terror} gradient="bg-gradient-to-r from-purple-400 to-purple-600" />
            <Slider label="清醒度 (Lucidity)" value={lucidity} gradient="bg-gradient-to-r from-gray-400 to-gray-500" />
          </div>
        </section>
      </div>
      </div>
    </motion.div>
  );
}

function Slider({ label, value, gradient }: { label: string; value: number; gradient: string }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between text-xs font-medium">
        <span className="text-gray-700 dark:text-gray-300 transition-colors">{label}</span>
        <span className="text-gray-500">{value}/100</span>
      </div>
      <div className="w-full h-3 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden shadow-inner transition-colors p-[2px]">
        <div className={`h-full ${gradient} rounded-full shadow-sm`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
