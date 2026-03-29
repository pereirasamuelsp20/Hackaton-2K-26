import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useAppStore from '../../store/useAppStore';
import {
  Stethoscope, BedDouble, Calendar, Pill, FileText, FileSignature,
  LogOut, Loader2, CheckCircle2, Clock, UserRound, ClipboardList,
  AlertCircle, ChevronRight, BedIcon
} from 'lucide-react';
import axios from 'axios';

const API = 'http://localhost:5001/api';

const TABS = [
  { id: 'beds',      label: 'Bed Availability',   icon: BedDouble },
  { id: 'schedule',  label: 'Daily Schedule',      icon: Calendar },
  { id: 'meds',      label: 'Medication Summary',  icon: Pill },
  { id: 'history',   label: 'Patient History',     icon: FileText },
  { id: 'discharge', label: 'Discharge Review',    icon: FileSignature },
];

const MOCK_SCHEDULE = [
  { time: '08:00 AM', type: 'Routine Round',   detail: 'All occupied beds — general vitals check' },
  { time: '09:30 AM', type: 'Post-Op Check',   detail: 'Surgical incision review — priority beds' },
  { time: '11:00 AM', type: 'Case Consult',    detail: 'Coordination with Oncology' },
  { time: '01:00 PM', type: 'Discharge Review',detail: 'Sign off on pending discharge forms' },
  { time: '03:30 PM', type: 'Family Briefing', detail: 'Update next of kin on treatment progress' },
];

const STATUS_COLORS = {
  AVAILABLE:     'bg-green-500/20 text-green-400 border-green-500/80 shadow-[0_0_15px_rgba(34,197,94,0.3)]',
  OCCUPIED:      'bg-red-500/20 text-red-500 border-red-500/80 shadow-[0_0_15px_rgba(239,68,68,0.3)]',
  RESERVED:      'bg-blue-500/20 text-blue-400 border-blue-500/80 shadow-[0_0_15px_rgba(59,130,246,0.3)]',
  NEEDS_CLEANING:'bg-yellow-500/20 text-yellow-400 border-yellow-500/80 shadow-[0_0_15px_rgba(234,179,8,0.3)]',
  IN_CLEANING:   'bg-yellow-500/20 text-yellow-400 border-yellow-500/80 shadow-[0_0_15px_rgba(234,179,8,0.3)]',
};

export default function DoctorDashboard() {
  const { user, wards, patients, fetchWards, fetchPatients, dischargePatient } = useAppStore();
  const [activeTab, setActiveTab] = useState('beds');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [checkedMeds, setCheckedMeds] = useState({});
  const [signedOff, setSignedOff] = useState({});
  const [discharging, setDischarging] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchWards();
    fetchPatients();
  }, [fetchWards, fetchPatients]);

  const visibleWards = wards.filter(w => {
    if (user?.email === '225ananya0117@dbit.in') return w.name === 'Cardiology Ward';
    if (user?.email === 'mohan@gmail.com') return w.name === 'Neurology Ward';
    return true;
  });

  const allBeds = visibleWards.flatMap(w =>
    (w.beds || []).map(b => ({ ...b, wardName: w.name }))
  );
  const occupiedBeds   = allBeds.filter(b => b.status === 'OCCUPIED');
  const targetDischarge = patients.filter(p => p.adminReviewRequested && allBeds.some(b => b.patientId === p.id || b.patient?.id === p.id));

  const filteredBeds = allBeds.filter(bed => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const bedNoMatches = bed.number.toLowerCase().includes(term);
    const patientMatches = bed.patient?.name.toLowerCase().includes(term);
    return bedNoMatches || patientMatches;
  });

  const handleDischarge = async (p) => {
    setDischarging(p.id);
    await dischargePatient(p.id);
    fetchPatients();
    fetchWards();
    setDischarging(null);
    setSignedOff(prev => ({ ...prev, [p.id]: true }));
  };

  return (
    <div className="flex flex-col gap-0 w-full h-full">
      {/* Tab Bar */}
      <div className="flex gap-1 bg-white/3 p-1 rounded-2xl mb-6 border border-white/5 overflow-x-auto">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-white/10 text-white shadow-lg border border-white/10'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
              }`}
            >
              <Icon size={15} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content + Queues */}
      <div className="flex gap-6 flex-1 min-h-0">

        {/* Main Panel */}
        <div className="flex-1 overflow-y-auto pr-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
            >
              {/* ── TAB: BED AVAILABILITY ── */}
              {activeTab === 'beds' && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-black text-white flex items-center gap-2">
                      <BedIcon size={20} className="text-neon-blue" /> Tactical Bed Grid
                    </h3>
                    <input 
                      type="text"
                      placeholder="Search bed or patient..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-hidden focus:border-neon-blue transition-all min-w-[200px]"
                    />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {filteredBeds.map(bed => (
                      <div
                        key={bed.id}
                        className={`p-4 rounded-2xl border glass ${STATUS_COLORS[bed.status] || 'border-white/10 bg-white/5'}`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-lg font-black">{bed.number}</span>
                          <span className="text-[10px] border border-current rounded-full px-2 py-0.5 uppercase font-bold">
                            {bed.status?.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <div className="text-[10px] opacity-60 mb-1">{bed.wardName}</div>
                        {bed.patient
                          ? (
                            <div className="mt-2 pt-2 border-t border-current/20">
                              <div className="text-xs font-semibold truncate">{bed.patient.name}</div>
                            </div>
                          )
                          : <div className="text-xs opacity-40 mt-2 pt-2 border-t border-current/20 italic">Empty</div>
                        }
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── TAB: SCHEDULE ── */}
              {activeTab === 'schedule' && (
                <div>
                  <h3 className="text-xl font-black text-white mb-4 flex items-center gap-2">
                    <Clock size={20} className="text-neon-blue" /> Daily Rounds Schedule
                  </h3>
                  <div className="glass rounded-2xl border border-white/5 overflow-hidden">
                    {MOCK_SCHEDULE.map((item, i) => (
                      <div key={i} className={`flex items-start gap-4 p-4 ${i < MOCK_SCHEDULE.length - 1 ? 'border-b border-white/5' : ''} hover:bg-white/3 transition`}>
                        <div className="text-xs font-mono text-neon-blue bg-neon-blue/10 px-3 py-1 rounded-lg whitespace-nowrap shrink-0 mt-0.5">
                          {item.time}
                        </div>
                        <div>
                          <div className="font-bold text-white text-sm">{item.type}</div>
                          <div className="text-xs text-zinc-400 mt-0.5">{item.detail}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── TAB: MEDICATION ── */}
              {activeTab === 'meds' && (
                <div>
                  <h3 className="text-xl font-black text-white mb-4 flex items-center gap-2">
                    <Pill size={20} className="text-neon-blue" /> Medication Summary
                  </h3>
                  <div className="glass rounded-2xl border border-white/5 overflow-hidden">
                    {patients.map((p, i) => (
                      <div key={p.id} className={`flex items-center gap-4 p-4 ${i < patients.length - 1 ? 'border-b border-white/5' : ''} hover:bg-white/3 transition`}>
                        <div className="flex-1">
                          <div className="font-bold text-white text-sm">{p.name}</div>
                          <div className="text-xs text-zinc-400 mt-0.5">{p.medication || 'No medication prescribed'}</div>
                        </div>
                        <button
                          onClick={() => setCheckedMeds(prev => ({ ...prev, [p.id]: true }))}
                          className={`p-2 rounded-xl transition border ${
                            checkedMeds[p.id]
                              ? 'bg-green-500/20 border-green-500/50 text-green-400'
                              : 'bg-white/5 border-white/10 text-zinc-500 hover:text-white hover:bg-white/10'
                          }`}
                        >
                          {checkedMeds[p.id] ? <CheckCircle2 size={18} /> : <Pill size={18} />}
                        </button>
                      </div>
                    ))}
                    {patients.length === 0 && (
                      <div className="p-8 text-center text-zinc-500 text-sm">No active patients</div>
                    )}
                  </div>
                </div>
              )}

              {/* ── TAB: HISTORY ── */}
              {activeTab === 'history' && (
                <div>
                  <h3 className="text-xl font-black text-white mb-4 flex items-center gap-2">
                    <FileText size={20} className="text-neon-blue" /> Patient History (EMR Quick View)
                  </h3>
                  <div className="space-y-3">
                    {patients.map(p => (
                      <div
                        key={p.id}
                        onClick={() => setSelectedPatient(selectedPatient?.id === p.id ? null : p)}
                        className="glass rounded-2xl border border-white/5 p-5 cursor-pointer hover:bg-white/5 transition"
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-bold text-white text-base">{p.name}</div>
                            <div className="text-xs text-zinc-400 mt-0.5">
                              DOB: {p.dob} &nbsp;•&nbsp; Age: {p.age} &nbsp;•&nbsp; {p.gender}
                              {p.allergies && p.allergies !== 'None' && (
                                <span className="ml-2 text-red-400 font-semibold">⚠ {p.allergies}</span>
                              )}
                            </div>
                          </div>
                          <ChevronRight
                            size={18}
                            className={`text-zinc-500 transition-transform ${selectedPatient?.id === p.id ? 'rotate-90' : ''}`}
                          />
                        </div>
                        <AnimatePresence>
                          {selectedPatient?.id === p.id && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <div className="text-xs text-zinc-500 font-semibold uppercase mb-1">History</div>
                                  <p className="text-sm text-zinc-300 leading-relaxed">{p.history || 'No history recorded.'}</p>
                                </div>
                                <div>
                                  <div className="text-xs text-zinc-500 font-semibold uppercase mb-1">Current Medication</div>
                                  <p className="text-sm text-zinc-300 leading-relaxed">{p.medication || 'None prescribed.'}</p>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── TAB: DISCHARGE ── */}
              {activeTab === 'discharge' && (
                <div>
                  <h3 className="text-xl font-black text-white mb-4 flex items-center gap-2">
                    <FileSignature size={20} className="text-neon-blue" /> Discharge Review
                  </h3>
                  <div className="space-y-3">
                    {patients.filter(p => p.bed).map(p => (
                      <div key={p.id} className="glass rounded-2xl border-l-4 border-neon-blue/60 p-5 flex items-start justify-between gap-4 hover:bg-white/3 transition">
                        <div className="flex-1">
                          <div className="font-bold text-white text-base">{p.name}</div>
                          <div className="text-xs text-zinc-400 mt-1">Bed {p.bed?.number} &nbsp;•&nbsp; {p.bed?.ward?.name || 'Ward'}</div>
                          <div className="text-xs text-zinc-500 mt-2">{p.history || 'Post-observation. Vitals stable. Pending sign-off.'}</div>
                          {p.allergies && p.allergies !== 'None' && (
                            <div className="flex items-center gap-1 text-xs text-red-400 mt-2">
                              <AlertCircle size={12} /> Allergy: {p.allergies}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => !signedOff[p.id] && handleDischarge(p)}
                          disabled={!!signedOff[p.id] || discharging === p.id}
                          className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border transition ${
                            signedOff[p.id]
                              ? 'bg-green-500/20 border-green-500/40 text-green-400 cursor-default'
                              : 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white cursor-pointer'
                          }`}
                        >
                          {discharging === p.id
                            ? <Loader2 size={16} className="animate-spin" />
                            : signedOff[p.id]
                              ? <><CheckCircle2 size={16} /> Discharged</>
                              : <><LogOut size={16} /> Discharge</>
                          }
                        </button>
                      </div>
                    ))}
                    {patients.filter(p => p.bed).length === 0 && (
                      <div className="glass rounded-2xl p-10 text-center text-zinc-500">No patients pending discharge.</div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Right Queues Panel */}
        <aside className="w-72 shrink-0 flex flex-col gap-4 overflow-y-auto">
          {/* Target Discharges */}
          <div className="glass rounded-2xl border border-white/5 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-white/3">
              <h4 className="font-bold text-sm flex items-center gap-2 text-white">
                <LogOut size={15} className="text-red-400" /> Target Discharges
              </h4>
              <span className="text-xs bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full font-bold">
                {targetDischarge.length}
              </span>
            </div>
            <div className="divide-y divide-white/5">
              {targetDischarge.map(p => (
                <div key={p.id} className="flex items-start gap-3 p-3 hover:bg-white/3 transition">
                  <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center font-bold text-red-400 text-sm shrink-0">
                    {p.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-white truncate">{p.name}</div>
                    <div className="text-xs text-zinc-500">Bed {p.bed?.number || '—'}</div>
                  </div>
                  <button
                    onClick={() => setActiveTab('discharge')}
                    className="text-zinc-600 hover:text-neon-blue transition"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              ))}
              {targetDischarge.length === 0 && (
                <div className="p-4 text-xs text-zinc-600 text-center">No targets today</div>
              )}
            </div>
          </div>



          {/* Bed Stats Summary */}
          <div className="glass rounded-2xl border border-white/5 p-4">
            <h4 className="font-bold text-sm text-white mb-3">Ward Snapshot</h4>
            <div className="space-y-2">
              {visibleWards.map(w => (
                <div key={w.id}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-zinc-400 truncate max-w-[130px]">{w.name}</span>
                    <span className="text-zinc-500">{w.stats?.occupied}/{w.stats?.total}</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-linear-to-r from-neon-blue to-neon-purple rounded-full transition-all"
                      style={{ width: `${((w.stats?.occupied || 0) / (w.stats?.total || 1)) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
