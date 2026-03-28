import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import useAppStore from '../../store/useAppStore';
import { HeartPulse, BedDouble, AlertCircle, Plus, LogOut, X, Loader2 } from 'lucide-react';
import axios from 'axios';

const STATUS_COLORS = {
  AVAILABLE:     'bg-green-500/20 text-green-400 border-green-500/80 shadow-[0_0_15px_rgba(34,197,94,0.3)]',
  OCCUPIED:      'bg-red-500/20 text-red-500 border-red-500/80 shadow-[0_0_15px_rgba(239,68,68,0.3)]',
  RESERVED:      'bg-blue-500/20 text-blue-400 border-blue-500/80 shadow-[0_0_15px_rgba(59,130,246,0.3)]',
  NEEDS_CLEANING:'bg-yellow-500/20 text-yellow-400 border-yellow-500/80 shadow-[0_0_15px_rgba(234,179,8,0.3)]',
  IN_CLEANING:   'bg-yellow-500/20 text-yellow-400 border-yellow-500/80 shadow-[0_0_15px_rgba(234,179,8,0.3)]',
};

export default function NurseDashboard() {
  const { user, wards, fetchWards, dischargePatient, admitPatient } = useAppStore();
  const [selectedWard] = useState(0); // Hardcode Ward 0 for demo purposes
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [dischargingId, setDischargingId] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '', age: '', gender: 'Male', diagnosis: '', allergies: '', admissionDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchWards();
  }, [fetchWards]);

  const visibleWards = wards.filter(w => {
    if (user?.email === '225ananya0117@dbit.in') return w.name === 'Cardiology Ward';
    if (user?.email === 'mohan@gmail.com') return w.name === 'Neurology Ward';
    return true;
  });

  const activeWard = visibleWards[selectedWard] || visibleWards[0];

  const handleAddPatient = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await admitPatient(formData, activeWard.id);
      setShowAddModal(false);
      setFormData({ name: '', age: '', gender: 'Male', diagnosis: '', allergies: '', admissionDate: new Date().toISOString().split('T')[0] });
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Failed to add patient");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDischarge = async (patientId) => {
    setDischargingId(patientId);
    await dischargePatient(patientId);
    setDischargingId(null);
  };

  if (!activeWard) return <div className="p-8 text-zinc-500">Loading Ward Data...</div>;

  return (
    <div className="flex flex-col gap-6 w-full h-full pb-10">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-pink-500/20 rounded-xl shadow-[0_0_20px_rgba(236,72,153,0.3)]">
            <HeartPulse className="text-pink-500" size={32} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-white">{activeWard.name}</h2>
            <p className="text-zinc-400">Manage patient care and bed statuses</p>
          </div>
        </div>
        
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-neon-blue to-neon-purple hover:opacity-90 text-white rounded-xl font-bold shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all active:scale-95"
        >
          <Plus size={18} /> Add Patient
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {activeWard.beds?.map(bed => (
          <motion.div
            key={bed.id}
            whileHover={{ scale: 1.02 }}
            className={`p-5 rounded-3xl border glass relative ${STATUS_COLORS[bed.status] || 'border-white/10 bg-white/5'}`}
          >
            <div className="flex justify-between items-start mb-4">
              <span className="text-2xl font-black text-white">{bed.number}</span>
              <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider border border-current`}>
                {bed.status.replace(/_/g, ' ')}
              </span>
            </div>

            {bed.status === 'OCCUPIED' && bed.patient ? (
              <div className="mt-4 pt-4 border-t border-white/10 flex flex-col h-full space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-bold text-white shrink-0">
                    {bed.patient.name.charAt(0)}
                  </div>
                  <div className="overflow-hidden">
                    <div className="font-bold text-lg leading-tight text-white truncate">{bed.patient.name}</div>
                    <div className="text-xs text-zinc-300 truncate">{bed.patient.age} yrs • {bed.patient.gender}</div>
                  </div>
                </div>
                
                {bed.patient.diagnosis && (
                  <div className="text-xs text-zinc-400 line-clamp-2">
                    <span className="font-semibold text-zinc-300">Dx:</span> {bed.patient.diagnosis}
                  </div>
                )}

                {bed.patient.allergies && bed.patient.allergies !== 'None' && (
                  <div className="flex items-center gap-2 text-xs text-red-100 bg-red-500/40 px-3 py-2 rounded-lg font-bold border border-red-500/50 mt-auto">
                    <AlertCircle size={14} /> Allergy: {bed.patient.allergies}
                  </div>
                )}
                
                <button
                  onClick={() => handleDischarge(bed.patient.id)}
                  disabled={dischargingId === bed.patient.id}
                  className="mt-4 w-full flex justify-center items-center gap-2 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition border border-white/10"
                >
                  {dischargingId === bed.patient.id ? <Loader2 size={16} className="animate-spin" /> : <><LogOut size={16} /> Discharge Patient</>}
                </button>
              </div>
            ) : (
              <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-center h-[100px] opacity-40 text-sm">
                <BedDouble size={24} className="mr-2" />
                Empty Bed
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Add Patient Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass border border-white/10 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl"
          >
            <div className="flex justify-between items-center px-6 py-4 border-b border-white/10 bg-white/5">
              <h3 className="text-xl font-bold text-white">Admit New Patient</h3>
              <button onClick={() => setShowAddModal(false)} className="text-zinc-400 hover:text-white transition">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddPatient} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-zinc-400 mb-1 uppercase tracking-wider">Full Name</label>
                  <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder:text-zinc-600 focus:outline-hidden focus:border-neon-blue transition" placeholder="e.g. John Doe" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1 uppercase tracking-wider">Age</label>
                  <input required type="number" min="0" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-hidden focus:border-neon-blue transition" placeholder="0" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1 uppercase tracking-wider">Gender</label>
                  <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} className="w-full bg-[#18181b] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-hidden focus:border-neon-blue transition appearance-none">
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-zinc-400 mb-1 uppercase tracking-wider">Diagnosis</label>
                  <input required value={formData.diagnosis} onChange={e => setFormData({...formData, diagnosis: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-hidden focus:border-neon-blue transition" placeholder="Primary complaint/diagnosis" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1 uppercase tracking-wider">Allergies</label>
                  <input value={formData.allergies} onChange={e => setFormData({...formData, allergies: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-hidden focus:border-neon-blue transition" placeholder="None" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1 uppercase tracking-wider">Admission Date</label>
                  <input required type="date" value={formData.admissionDate} onChange={e => setFormData({...formData, admissionDate: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-hidden focus:border-neon-blue transition" />
                </div>
              </div>
              
              <div className="pt-4 border-t border-white/10 flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-5 py-2.5 rounded-xl font-semibold text-zinc-400 hover:text-white transition">Cancel</button>
                <button type="submit" disabled={submitting} className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold bg-white text-black hover:bg-zinc-200 transition active:scale-95 disabled:opacity-50">
                  {submitting ? <Loader2 size={18} className="animate-spin" /> : 'Admit & Auto-assign'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
