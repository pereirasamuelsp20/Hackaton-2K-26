import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Activity } from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black text-white">
      {/* Background Blobs and Gradients */}
      <div className="absolute inset-0 bg-[#0d0d0f]">
        <div className="absolute top-0 left-0 w-full h-full bg-linear-to-b from-transparent via-[#0d0d0f] to-[#0d0d0f] z-0" />
      </div>

      {/* Floating Blobs (Enhanced for better background fill) */}
      <div className="absolute top-0 -left-1/4 w-[800px] h-[800px] bg-neon-blue/20 rounded-full mix-blend-screen filter blur-[160px] opacity-40 animate-pulse pointer-events-none" />
      <div className="absolute -bottom-1/4 -right-1/4 w-[800px] h-[800px] bg-neon-purple/20 rounded-full mix-blend-screen filter blur-[160px] opacity-40 animate-pulse pointer-events-none" style={{ animationDelay: '2s'}} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/5 rounded-full filter blur-[120px] opacity-20 pointer-events-none" />

      {/* Glass Overlay Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-10 p-4">
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex flex-col items-center"
        >
          {/* Logo with Glow */}
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-neon-blue blur-2xl opacity-50 rounded-full" />
            <Activity size={80} className="relative text-white drop-shadow-[0_0_15px_rgba(0,240,255,1)]" />
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-4 text-center">
            Ward<span className="text-neon-blue">Watch</span>
          </h1>
          <p className="text-lg md:text-xl text-zinc-300 max-w-2xl text-center mb-10 leading-relaxed">
            Next-generation real-time hospital ward management. Optimize patient flow, automate discharges, and sync your entire facility seamlessly.
          </p>

          <div className="flex gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/login')}
              className="px-8 py-3 bg-white text-black font-bold rounded-full shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.6)] transition-all cursor-pointer"
            >
              Login to System
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
