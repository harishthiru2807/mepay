import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { NetworkProvider, useNetwork } from './context/NetworkContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { Wifi, WifiOff, Home as HomeIcon, Clock, Settings, Wallet, LogOut, Sun, Moon } from 'lucide-react';

import HomeScreen from './screens/HomeScreen';
import PaymentScreen from './screens/PaymentScreen';
import ReceiveScreen from './screens/ReceiveScreen';
import LoginScreen from './screens/LoginScreen';
import PinScreen from './screens/PinScreen';

function StatusBar() {
  const { isOnline, toggleConnection } = useNetwork();
  const { logout, user } = useAuth();
  const { isLight, toggleTheme } = useTheme();
  
  return (
    <div className="flex items-center justify-between px-5 py-3 bg-[var(--color-surface)] shrink-0 z-40 relative">
      <div className="flex items-center space-x-2">
        <Wallet className="text-[var(--color-primary)]" size={18} />
        <div className="text-xs font-bold tracking-wide text-[var(--text-main)] opacity-80 uppercase">
          {user?.name || 'MeshPay'}
        </div>
      </div>
      <div className="flex items-center space-x-3">
        <button 
          onClick={toggleTheme}
          className="p-1.5 text-gray-500 hover:text-[var(--color-primary)] transition-colors"
        >
          {isLight ? <Moon size={16} /> : <Sun size={16} />}
        </button>
        <button 
          onClick={toggleConnection}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all shadow-sm ${
            isOnline 
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
              : 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
          }`}
        >
          {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
          <span className="hidden sm:inline">{isOnline ? 'Online' : 'Mesh'}</span>
        </button>
        <button onClick={logout} className="p-1.5 text-gray-500 hover:text-red-400 transition-colors">
          <LogOut size={16} />
        </button>
      </div>
    </div>
  );
}

function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const navItems = [
    { path: '/', icon: HomeIcon, label: 'Home' },
    { path: '/history', icon: Clock, label: 'History' },
    { path: '/settings', icon: Settings, label: 'Settings' }
  ];

  if (['/pay', '/receive', '/login', '/pin'].includes(location.pathname)) return null;

  return (
    <div className="flex items-center justify-around px-2 py-4 bg-[var(--color-surface)] border-t border-white/5 shrink-0 relative z-40">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;
        return (
          <button 
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center justify-center p-2 rounded-2xl transition-all duration-300 w-16 ${
              isActive ? 'text-[var(--color-primary)]' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <div className="relative">
              <Icon size={22} className={`mb-1 transition-all ${isActive ? 'scale-110 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'opacity-80'}`} />
              {isActive && (
                 <motion.div layoutId="nav-pill" className="absolute -inset-2 bg-emerald-500/10 rounded-full -z-10" />
              )}
            </div>
            <span className={`text-[10px] font-semibold mt-1 ${isActive ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function AppContent() {
  const { user, loading } = useAuth();
  const [loginPhone, setLoginPhone] = useState(null);
  const location = useLocation();

  if (loading) return <div className="flex-1 flex items-center justify-center text-emerald-500">Loading...</div>;

  if (!user) {
    return (
      <AnimatePresence mode="wait">
        {!loginPhone ? (
          <LoginScreen key="login" onNext={setLoginPhone} />
        ) : (
          <PinScreen key="pin" phone={loginPhone} onBack={() => setLoginPhone(null)} />
        )}
      </AnimatePresence>
    );
  }

  return (
    <div className="flex flex-col h-full w-full pt-10 relative z-10 transition-all duration-500">
      <StatusBar />
      <div className="flex-1 overflow-y-auto overflow-x-hidden relative bg-[var(--color-canvas)] pb-4">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<HomeScreen />} />
            <Route path="/pay" element={<PaymentScreen />} />
            <Route path="/receive" element={<ReceiveScreen />} />
            <Route path="/history" element={
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-6">
                <h2 className="text-xl font-bold text-white mb-4">History</h2>
                <div className="p-8 bg-[var(--color-surface)] rounded-3xl border border-white/5 text-center text-gray-500 font-medium">
                  Transaction details cached locally
                </div>
              </motion.div>
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
      </div>
      <BottomNav />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NetworkProvider>
          <div className="flex items-center justify-center min-h-[100dvh] bg-black p-4 sm:p-8 font-sans selection:bg-emerald-500/30 transition-colors">
            <div className="relative w-full max-w-[390px] h-[844px] max-h-[95vh] bg-[var(--color-canvas)] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col border-[8px] border-neutral-800 ring-1 ring-white/10 isolate transition-colors duration-300">
              <div className="absolute top-2 inset-x-0 w-[120px] h-7 bg-black mx-auto rounded-full z-50 flex items-center justify-center shadow-lg">
                <div className="w-2 h-2 rounded-full bg-[#111] mx-1 mr-4 ring-1 ring-white/10"></div>
              </div>
              <Router>
                <AppContent />
                <div className="absolute top-0 -left-1/4 w-full h-1/2 bg-emerald-500 opacity-5 blur-[120px] rounded-full pointer-events-none -z-10"></div>
                <div className="absolute bottom-0 -right-1/4 w-full h-1/2 bg-blue-500 opacity-5 blur-[120px] rounded-full pointer-events-none -z-10"></div>
              </Router>
            </div>
          </div>
        </NetworkProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
