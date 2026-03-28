import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import useAppStore from '../../store/useAppStore';
import { SprayCan, CheckCircle2 } from 'lucide-react';
import axios from 'axios';

export default function CleaningDashboard() {
  const { wards, fetchWards } = useAppStore();
  const [dirtyBeds, setDirtyBeds] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchWards();
  }, [fetchWards]);

  useEffect(() => {
    // Flatten beds from wards and filter
    const beds = wards.flatMap(w => w.beds || [])
      .filter(b => b.status === 'NEEDS_CLEANING' || b.status === 'IN_CLEANING')
      .map(b => ({ ...b, wardName: wards.find(w => w.id === b.wardId)?.name }));
    setDirtyBeds(beds);
  }, [wards]);

  const updateStatus = async (bedId, status) => {
    setLoading(true);
    try {
      await axios.put(`http://localhost:5001/api/beds/${bedId}/status`, { status });
      // Socket will trigger fetchWards automatically
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full h-full pb-10">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-linear-to-tr from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-xl shadow-[0_0_20px_rgba(234,179,8,0.2)]">
            <SprayCan className="text-yellow-500" size={32} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-white tracking-tight">Environmental Services</h2>
            <p className="text-zinc-400 text-sm mt-1">Manage sanitization requests and active cleanings</p>
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="flex gap-3">
          <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-center">
            <div className="text-2xl font-black text-red-400">{dirtyBeds.filter(b => b.status === 'NEEDS_CLEANING').length}</div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Pending</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-center">
            <div className="text-2xl font-black text-orange-400">{dirtyBeds.filter(b => b.status === 'IN_CLEANING').length}</div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">In Progress</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {dirtyBeds.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center p-20 glass border border-white/5 rounded-3xl">
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center text-green-500 mb-4 shadow-[0_0_30px_rgba(34,197,94,0.2)]">
              <CheckCircle2 size={32} />
            </div>
            <h3 className="text-xl font-black text-white">Facility is Fully Sanitized</h3>
            <p className="text-zinc-500 text-sm mt-2">No active beds require cleaning at this moment.</p>
          </div>
        ) : (
          dirtyBeds.map(bed => (
            <motion.div 
              key={bed.id}
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className={`p-5 rounded-3xl border glass relative overflow-hidden transition-all group ${bed.status === 'NEEDS_CLEANING' ? 'border-red-500/30 bg-red-500/5 hover:border-red-500/50' : 'border-orange-500/30 bg-orange-500/5 hover:border-orange-500/50'}`}
            >
              {/* Glow Effect */}
              <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-[50px] pointer-events-none transition-opacity ${bed.status === 'NEEDS_CLEANING' ? 'bg-red-500/30 group-hover:bg-red-500/40' : 'bg-orange-500/30 group-hover:bg-orange-500/40 animate-pulse'}`} />
              
              <div className="flex justify-between items-start mb-6 relative z-10">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-1">Bed Identifier</div>
                  <div className="text-3xl font-black text-white tracking-tight">{bed.number}</div>
                  <div className="text-sm font-medium text-zinc-400 mt-1 flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
                    {bed.wardName}
                  </div>
                </div>
                <div className={`px-2.5 py-1 rounded-lg text-[10px] uppercase font-black tracking-wider border shadow-sm ${bed.status === 'NEEDS_CLEANING' ? 'text-red-400 border-red-500/40 bg-red-500/10' : 'text-orange-400 border-orange-500/40 bg-orange-500/10'}`}>
                  {bed.status.replace('_', ' ')}
                </div>
              </div>

              <div className="relative z-10 pt-4 border-t border-white/10 mt-2">
                {bed.status === 'NEEDS_CLEANING' ? (
                  <button 
                    disabled={loading}
                    onClick={() => updateStatus(bed.id, 'IN_CLEANING')}
                    className="w-full py-3.5 px-4 bg-linear-to-r from-red-500/80 to-orange-500/80 hover:from-red-500 hover:to-orange-500 border border-orange-500/50 text-white font-bold rounded-xl transition-all disabled:opacity-50 active:scale-95 shadow-[0_0_15px_rgba(249,115,22,0.2)] flex items-center justify-center gap-2"
                  >
                    <SprayCan size={18} /> Initiate Protocol
                  </button>
                ) : (
                  <button 
                    disabled={loading}
                    onClick={() => updateStatus(bed.id, 'AVAILABLE')}
                    className="w-full flex justify-center items-center gap-2 py-3.5 px-4 bg-linear-to-r from-green-500/80 to-emerald-500/80 hover:from-green-500 hover:to-emerald-500 border border-green-500/50 text-white font-bold rounded-xl transition-all disabled:opacity-50 active:scale-95 shadow-[0_0_20px_rgba(34,197,94,0.3)] animate-pulse hover:animate-none"
                  >
                    <CheckCircle2 size={18} /> Mark as Sanitized
                  </button>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
