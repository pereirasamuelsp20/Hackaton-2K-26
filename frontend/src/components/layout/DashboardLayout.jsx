import { Outlet, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, LogOut, User, Activity, Menu, X } from 'lucide-react';
import useAppStore from '../../store/useAppStore';
import { useState } from 'react';

export default function DashboardLayout() {
  const { user, logout, notifications } = useAppStore();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const unreadCount = notifications.length;

  return (
    <div className="flex h-screen bg-[#0d0d0f] text-white overflow-hidden font-sans">
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 260 : 70 }}
        className="glass border-r border-white/5 relative z-50 flex-col hidden md:flex transition-all duration-300"
      >
        {/* Sidebar Header - Menu Toggle & Branding */}
        <div className="flex flex-col h-20 px-4 justify-center border-b border-white/5">
          <div className="flex items-center justify-between">
            {sidebarOpen ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 overflow-hidden"
              >
                <div className="w-8 h-8 rounded-lg bg-linear-to-tr from-neon-blue to-neon-purple flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(0,240,255,0.3)]">
                  <Activity size={18} className="text-white" />
                </div>
                <span className="font-black text-lg tracking-tighter bg-clip-text text-transparent bg-linear-to-r from-white to-zinc-500 whitespace-nowrap">
                  WARDWATCH
                </span>
              </motion.div>
            ) : (
              <div className="flex justify-center w-full">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-neon-blue shadow-lg shadow-neon-blue/10">
                  <Activity size={22} />
                </div>
              </div>
            )}

            {sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1.5 hover:bg-white/5 rounded-lg text-zinc-500 hover:text-white transition-colors"
              >
                <Menu size={18} />
              </button>
            )}
          </div>
        </div>

        {!sidebarOpen && (
          <div className="flex justify-center py-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 hover:bg-white/5 rounded-xl text-zinc-400 hover:text-neon-blue transition-all"
            >
              <Menu size={22} />
            </button>
          </div>
        )}

        {/* Sidebar Navigation */}
        <div className="flex-1 px-3 py-6 space-y-2 overflow-y-auto custom-scrollbar">
          {/* Add more nav items here if needed */}
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-white/5 space-y-4">
          {sidebarOpen && (
            <div className="bg-zinc-900/50 rounded-2xl p-3 border border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-linear-to-tr from-neon-blue to-neon-purple flex items-center justify-center font-bold text-xs ring-2 ring-white/5">
                  {user?.name?.charAt(0)}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-bold truncate text-white/90">{user?.name}</span>
                  <span className="text-[10px] text-zinc-500 font-black uppercase tracking-tighter">{user?.role}</span>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 p-3 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-2xl transition-all duration-300 font-bold text-sm ${!sidebarOpen && 'justify-center'}`}
          >
            <LogOut size={20} />
            {sidebarOpen && <span>Secure Sign-Out</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative z-40 w-full overflow-hidden">
        {/* Topbar */}
        <header className="h-20 glass border-b border-white/5 flex items-center justify-between px-6 md:px-10 z-50">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-black tracking-tight flex items-center gap-3">
              <span className="bg-clip-text text-transparent bg-linear-to-r from-neon-blue via-white to-neon-purple uppercase">
                {user?.role} Terminal
              </span>
              <span className="w-1 h-6 bg-white/10 rounded-full hidden sm:block" />
              <span className="text-zinc-500 text-xs font-bold uppercase tracking-widest hidden sm:block">Tactical Feed Active</span>
            </h2>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden lg:flex items-center gap-3">
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-500 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider shadow-[0_0_20px_rgba(239,68,68,0.15)] animate-pulse">
                <Activity size={14} /> Critical Yield: 92%
              </div>
              <div className="w-px h-6 bg-white/5" />
              <div className="text-right">
                <div className="text-[10px] text-zinc-500 font-black uppercase tracking-tighter">System Health</div>
                <div className="text-xs text-green-400 font-bold">OPTIMAL 00.3ms</div>
              </div>
            </div>

            {/* Notifications */}
            <div className="relative group">
              <button
                onClick={() => {
                  if (showNotifications) {
                    useAppStore.getState().clearNotifications();
                  }
                  setShowNotifications(!showNotifications);
                }}
                className={`p-2.5 rounded-2xl transition-all relative border border-white/10 shadow-lg ${showNotifications ? 'bg-neon-blue/10 border-neon-blue/40 text-neon-blue' : 'bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white'}`}
              >
                <Bell size={22} className={unreadCount > 0 ? 'animate-bounce' : ''} />
                {unreadCount > 0 && (
                  <>
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-black text-white border-2 border-[#0d0d0f] z-10">
                      {unreadCount}
                    </span>
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-ping-slow opacity-75" />
                  </>
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95, y: 15 }}
                    className="absolute right-0 top-14 w-80 glass border border-white/10 rounded-3xl shadow-[0_30px_60px_rgba(0,0,0,0.5)] overflow-hidden origin-top-right z-100"
                  >
                    <div className="p-5 border-b border-white/5 bg-white/3 flex justify-between items-center">
                      <span className="font-black text-sm uppercase tracking-widest underline decoration-neon-blue decoration-2 underline-offset-4">Intelligence Feed</span>
                      <span className="text-[10px] bg-neon-purple/20 text-neon-purple border border-neon-purple/30 px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter">{unreadCount} Ops Pending</span>
                    </div>
                    <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                      {notifications.length === 0 ? (
                        <div className="py-12 flex flex-col items-center gap-3">
                          <Activity className="text-zinc-800" size={40} />
                          <div className="text-zinc-600 text-xs font-bold uppercase tracking-widest">Sector Clear</div>
                        </div>
                      ) : (
                        notifications.map((n, i) => (
                          <div key={i} className="p-4 border-b border-white/5 hover:bg-white/5 transition-all group">
                            <div className="flex gap-4">
                              <div className={`w-2 h-2 mt-1.5 rounded-full shrink-0 group-hover:scale-150 transition-transform ${n.type === 'CLEANING' ? 'bg-neon-blue' : 'bg-red-500'}`} />
                              <div className="space-y-1">
                                <div className="text-xs font-bold text-white group-hover:text-neon-blue transition-colors uppercase tracking-tight">{n.type} ALERT</div>
                                <div className="text-xs text-zinc-400 font-medium leading-relaxed">{n.message}</div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-x-hidden overflow-y-auto p-6 md:p-10 relative custom-scrollbar">
          {/* Subtle bg glow for content area */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-neon-blue/5 rounded-full blur-[140px] pointer-events-none" />

          <div className="relative z-10 w-full h-full max-w-7xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
