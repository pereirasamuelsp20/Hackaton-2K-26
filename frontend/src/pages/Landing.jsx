import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Activity } from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black text-white">
      {/* Background Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute top-0 left-0 w-full h-full object-cover opacity-40 mix-blend-screen"
      >
        <source src="https://cdn.pixabay.com/video/2019/11/05/28607-371425126_large.mp4" type="video/mp4" />
      </video>

      {/* Floating Blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-blue rounded-full mix-blend-screen filter blur-[128px] opacity-30 animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neon-purple rounded-full mix-blend-screen filter blur-[128px] opacity-30 animate-pulse" style={{ animationDelay: '1s'}} />

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
