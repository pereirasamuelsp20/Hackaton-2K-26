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
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4 mb-4">
        <div className="p-3 bg-red-500/20 rounded-xl shadow-[0_0_20px_rgba(239,68,68,0.3)]">
          <SprayCan className="text-red-500" size={32} />
        </div>
        <div>
          <h2 className="text-3xl font-black text-white">Cleaning Queue</h2>
          <p className="text-zinc-400">Beds requiring sanitization across all wards</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dirtyBeds.length === 0 ? (
          <div className="col-span-3 text-center py-20 text-zinc-500 glass rounded-3xl">
            All wards are completely sanitized!
          </div>
        ) : (
          dirtyBeds.map(bed => (
            <motion.div 
              key={bed.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`p-6 rounded-3xl border glass relative overflow-hidden ${bed.status === 'NEEDS_CLEANING' ? 'border-red-500/50 bg-red-500/10' : 'border-orange-500/50 bg-orange-500/10'}`}
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="text-2xl font-black text-white">{bed.number}</div>
                  <div className="text-sm font-bold opacity-70 mt-1">{bed.wardName}</div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold border ${bed.status === 'NEEDS_CLEANING' ? 'text-red-400 border-red-500/50' : 'text-orange-400 border-orange-500/50'}`}>
                  {bed.status.replace('_', ' ')}
                </div>
              </div>

              <div className="flex gap-3">
                {bed.status === 'NEEDS_CLEANING' ? (
                  <button 
                    disabled={loading}
                    onClick={() => updateStatus(bed.id, 'IN_CLEANING')}
                    className="flex-1 py-3 px-4 bg-linear-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-bold rounded-xl transition cursor-pointer"
                  >
                    Start Cleaning
                  </button>
                ) : (
                  <button 
                    disabled={loading}
                    onClick={() => updateStatus(bed.id, 'AVAILABLE')}
                    className="flex-1 flex gap-2 justify-center items-center py-3 px-4 bg-linear-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white font-bold rounded-xl transition shadow-[0_0_15px_rgba(34,197,94,0.4)] cursor-pointer"
                  >
                    <CheckCircle2 size={18} /> Mark Available
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
