import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useNetwork } from '../context/NetworkContext';
import { ArrowLeft, Wifi, WifiOff, Zap, CheckCircle2, QrCode } from 'lucide-react';
import MeshVisualizer from '../components/MeshVisualizer';
import QRScanner from '../components/QRScanner';

export default function PaymentScreen() {
  const navigate = useNavigate();
  const { isOnline, addTransaction } = useNetwork();
  const [step, setStep] = useState(1); // 1: Amount&User, 2: MeshVisualizer, 3: Success, 4: Scanner
  const [amount, setAmount] = useState('0');
  const [recipient, setRecipient] = useState('');

  const handleNumber = (n) => {
    if (amount === '0') setAmount(n);
    else setAmount(prev => prev + n);
  };
  const handleDel = () => {
    if (amount.length > 1) setAmount(prev => prev.slice(0, -1));
    else setAmount('0');
  };

  const handleScan = (data) => {
    // Parse UPI payload if it exists (e.g. upi://pay?pa=haris@upi&pn=Haris...)
    let parsedName = data;
    if (data.toLowerCase().startsWith('upi://')) {
      const urlParams = new URLSearchParams(data.split('?')[1]);
      parsedName = urlParams.get('pn') || urlParams.get('pa') || data;
    }
    setRecipient(parsedName);
    setStep(1); // Return to input mode
  };

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  const handlePay = () => {
    if (amount === '0' || !recipient) return;
    if (!isOnline) {
      setStep(2); // Show mesh animation
    } else {
      completePayment('Online');
    }
  };

  const completePayment = async (methodStr) => {
    setIsProcessing(true);
    setError('');
    try {
      await addTransaction({
        amount: parseFloat(amount),
        name: recipient,
        method: methodStr,
      });
      setStep(3);
    } catch (err) {
      setError(err.message);
      setStep(1); // Back to input if offline routing wasn't used yet, or handle differently
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-[var(--color-canvas)]">
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between z-10 shrink-0">
        <button onClick={() => navigate('/')} className="p-2 bg-[var(--color-surface)] rounded-full text-white active:scale-95 transition-transform border border-white/5"><ArrowLeft size={20}/></button>
        <span className="text-white font-bold tracking-wide">Send Payment</span>
        <div className="w-10"></div>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 flex flex-col px-6 pt-2 pb-6 min-h-0">
            
            <div className="flex-1 flex flex-col max-h-[300px]">
              <div className="text-center mb-6 relative">
                <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Sending to</span>
                <div className="flex items-center justify-center mt-2 relative">
                   <input 
                     type="text" 
                     placeholder="Enter Mobile Number" 
                     value={recipient}
                     onChange={e => setRecipient(e.target.value)}
                     className="w-full bg-transparent border-none text-center text-[22px] text-[var(--text-main)] font-bold outline-none placeholder-gray-600 focus:ring-0 px-12" 
                   />
                   <button 
                     onClick={() => setStep(4)} 
                     className="absolute right-2 p-2 text-emerald-500 bg-emerald-500/10 rounded-full hover:bg-emerald-500/20 transition-colors"
                   >
                     <QrCode size={20} />
                   </button>
                </div>
              </div>

              <div className="text-center flex justify-center items-center mt-2 pb-6 border-b border-white/5">
                <span className="text-[28px] font-semibold text-emerald-500 mr-1 mt-2">$</span>
                <span className="text-[64px] font-bold text-white tracking-tight leading-none">{amount}</span>
              </div>
              
              <AnimatePresence>
                {error && (
                  <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <p className="text-red-500 text-xs font-bold text-center uppercase tracking-wide">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Connection Status Box */}
            <div className={`mt-auto mb-6 p-4 rounded-[1.25rem] border ${isOnline ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-100'} flex items-center space-x-3 shrink-0`}>
              <div className={`p-2.5 rounded-full ${isOnline ? 'bg-emerald-500/20 text-emerald-400' : 'bg-yellow-500/20 text-yellow-500'}`}>
                {isOnline ? <Wifi size={20} /> : <WifiOff size={20} />}
              </div>
              <div>
                <p className="text-[13px] font-bold text-white">{isOnline ? 'Network Connected' : 'Offline Mesh Ready'}</p>
                <p className={`text-[11px] font-semibold leading-tight mt-0.5 ${isOnline ? 'text-emerald-500/80' : 'text-yellow-600'}`}>
                  {isOnline ? 'Instant transfer via server' : 'Auto-routing via nearby devices'}
                </p>
              </div>
            </div>

            {/* Numpad */}
            <div className="grid grid-cols-3 gap-3 mb-5 shrink-0">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, '.', 0].map((n, i) => (
                <button key={i} onClick={() => handleNumber(n.toString())} className="h-[3.5rem] rounded-[1.25rem] bg-[var(--color-surface)] text-white text-[22px] font-semibold active:bg-white/10 transition-colors border border-white/5">
                  {n}
                </button>
              ))}
              <button onClick={handleDel} className="h-[3.5rem] rounded-[1.25rem] bg-[var(--color-surface)] text-gray-400 text-sm tracking-widest font-bold active:bg-white/10 transition-colors flex items-center justify-center border border-white/5">
                DEL
              </button>
            </div>

            <button 
              disabled={amount === '0' || !recipient || isProcessing}
              onClick={handlePay}
              className="w-full bg-[var(--color-primary)] disabled:opacity-50 disabled:grayscale text-black py-4 rounded-full font-extrabold text-[15px] shadow-[0_0_20px_rgba(16,185,129,0.3)] disabled:shadow-none active:scale-[0.98] transition-all flex items-center justify-center shrink-0 uppercase tracking-wide"
            >
              {!isOnline && !isProcessing && <Zap size={18} className="mr-2" />}
              {isProcessing ? 'Processing Payment...' : `Send $${amount}`}
            </button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 w-full h-full pb-6 px-4">
            <MeshVisualizer recipientName={recipient || 'Target'} onComplete={() => completePayment('Mesh')} />
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key="step3" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex-1 flex flex-col items-center justify-center px-6 text-center">
            <div className="w-24 h-24 bg-emerald-500/20 text-emerald-400 rounded-[2rem] flex items-center justify-center mb-8 border border-emerald-500/50 shadow-[0_0_40px_rgba(16,185,129,0.2)]">
              <CheckCircle2 size={48} />
            </div>
            <h2 className="text-[28px] font-bold text-white mb-3">Successful</h2>
            <p className="text-gray-400 text-[15px] mb-10 max-w-[240px] leading-relaxed">
              Your payment of <strong className="text-white">${amount}</strong> was sent to <strong className="text-white">{recipient}</strong>.
            </p>
            <button 
              onClick={() => navigate('/')}
              className="w-full bg-[var(--color-surface)] text-[var(--text-main)] py-4 rounded-full font-bold active:bg-white/5 transition-colors border border-white/5"
            >
              Back to Home
            </button>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div key="step4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="absolute inset-0 z-50">
            <QRScanner 
              onScan={handleScan} 
              onClose={() => setStep(1)} 
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
