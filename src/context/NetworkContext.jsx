import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const NetworkContext = createContext(null);

export function NetworkProvider({ children }) {
  const { user, refreshProfile } = useAuth();
  const [isOnline, setIsOnline] = useState(true);
  const [transactions, setTransactions] = useState([]);

  const fetchTransactions = async () => {
    const token = localStorage.getItem('meshpay_token');
    if (!token) return;
    try {
      const response = await fetch('http://127.0.0.1:5000/api/transactions', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        // Transform for UI
        const transformed = data.map(tx => ({
          id: tx.id.toString(),
          type: tx.sender_id === user?.id ? 'send' : 'receive',
          amount: tx.amount,
          name: tx.sender_id === user?.id ? `To ${tx.receiver_phone}` : 'Incoming Transfer',
          method: tx.method,
          status: tx.status,
          time: new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }));
        setTransactions(transformed);
      }
    } catch (err) {
      console.error("Fetch transactions failed", err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchTransactions();
    }
  }, [user]);

  const toggleConnection = () => {
    setIsOnline(!isOnline);
  };

  const addTransaction = async (txData) => {
    const token = localStorage.getItem('meshpay_token');
    if (!token) return;

    try {
      const response = await fetch('http://127.0.0.1:5000/api/pay', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          receiverPhone: txData.name, // We use recipient name field as phone in this demo
          amount: txData.amount,
          method: txData.method
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Payment failed');
      }

      await refreshProfile();
      await fetchTransactions();
    } catch (err) {
      throw err;
    }
  };

  return (
    <NetworkContext.Provider value={{ isOnline, toggleConnection, balance: user?.balance || 0, transactions, addTransaction, fetchTransactions }}>
      {children}
    </NetworkContext.Provider>
  );
}

export const useNetwork = () => useContext(NetworkContext);
