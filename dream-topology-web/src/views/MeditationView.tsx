import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Play, Pause, Volume2, VolumeX } from 'lucide-react';

export default function MeditationView({ onBack, title = "降噪冥想", type = "relax" }: { onBack: () => void, title?: string, type?: string }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const [phase, setPhase] = useState<'inhale' | 'hold' | 'exhale'>('exhale');
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isPlaying && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsPlaying(false);
    }
    return () => clearInterval(interval);
  }, [isPlaying, timeLeft]);

  useEffect(() => {
    let phaseInterval: ReturnType<typeof setInterval>;
    if (isPlaying) {
      // 4-7-8 breathing technique
      const cycle = () => {
        setPhase('inhale');
        setTimeout(() => {
          setPhase('hold');
          setTimeout(() => {
            setPhase('exhale');
          }, 7000); // Hold for 7s
        }, 4000); // Inhale for 4s
      };
      
      cycle();
      phaseInterval = setInterval(cycle, 19000); // 4 + 7 + 8 = 19s total
    } else {
      setPhase('exhale');
    }
    return () => clearInterval(phaseInterval);
  }, [isPlaying]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const circleVariants: any = {
    idle: { scale: 1, transition: { duration: 1, ease: "easeInOut" } },
    inhale: { scale: 1.5, transition: { duration: 4, ease: "easeInOut" } },
    hold: { scale: 1.5, transition: { duration: 7, ease: "linear" } },
    exhale: { scale: 1, transition: { duration: 8, ease: "easeInOut" } }
  };

  const phaseText = {
    inhale: '吸气',
    hold: '屏息',
    exhale: '呼气'
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: '100%' }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: '100%' }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[60] bg-[#0A0A0C] text-white overflow-hidden flex flex-col"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-apple-blue/18 via-transparent to-apple-blue/10 opacity-60 pointer-events-none" />
      
      <header className="flex items-center justify-between p-6 relative z-10">
        <button 
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors backdrop-blur-md"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="flex gap-4">
          <button 
            onClick={() => setIsMuted(!isMuted)}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors backdrop-blur-md"
          >
            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center relative z-10 pb-10">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2 tracking-wide">{title}</h1>
          <p className="text-white/60 text-sm">{type === 'relax' ? '跟随圆环的节奏，放松身心' : '通过深呼吸释放压力'}</p>
        </div>

        <div className="relative w-64 h-64 flex items-center justify-center my-16">
          {/* Outer glowing rings */}
          <motion.div 
            animate={isPlaying ? phase : 'exhale'}
            variants={circleVariants}
            className="absolute inset-0 rounded-full bg-apple-blue/16 blur-xl"
          />
          <motion.div 
            animate={isPlaying ? phase : 'exhale'}
            variants={circleVariants}
            className="absolute inset-4 rounded-full bg-apple-blue/22 blur-md"
          />
          
          {/* Inner circle */}
          <motion.div 
            animate={isPlaying ? phase : 'exhale'}
            variants={circleVariants}
            className="absolute inset-10 rounded-full bg-apple-blue shadow-[0_0_40px_rgba(0,100,224,0.42)] flex items-center justify-center z-10"
          >
            <AnimatePresence mode="wait">
              <motion.span 
                key={isPlaying ? phase : 'paused'}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.3 }}
                className="text-2xl font-bold tracking-widest text-white/90 drop-shadow-md"
              >
                {isPlaying ? phaseText[phase] : '准备'}
              </motion.span>
            </AnimatePresence>
          </motion.div>
        </div>

        <div className="text-5xl font-light tabular-nums tracking-widest text-white/90 mt-4 mb-12 drop-shadow-sm">
          {formatTime(timeLeft)}
        </div>

        <button 
          onClick={() => setIsPlaying(!isPlaying)}
          className="w-16 h-16 rounded-full bg-white text-apple-blue flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(255,255,255,0.22)]"
        >
          {isPlaying ? <Pause size={24} className="fill-current" /> : <Play size={24} className="fill-current ml-1" />}
        </button>
      </main>
    </motion.div>
  );
}
