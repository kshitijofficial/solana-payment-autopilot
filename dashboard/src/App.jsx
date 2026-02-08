import React, { useState, useEffect } from 'react';
import { Wallet, QrCode, TrendingUp, DollarSign, Plus } from 'lucide-react';

const API = 'http://localhost:3000/api';

export default function App() {
  const [merchants, setMerchants] = useState([]);
  const [selectedMerchant, setSelectedMerchant] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [qrCode, setQrCode] = useState(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [newMerchant, setNewMerchant] = useState({ business_name: '', email: '' });
  const [qrAmount, setQrAmount] = useState('0.05');

  useEffect(() => {
    loadMerchants();
  }, []);

  useEffect(() => {
    if (selectedMerchant) {
      loadTransactions(selectedMerchant.id);
      // Poll for new transactions every 20 seconds
      const interval = setInterval(() => loadTransactions(selectedMerchant.id), 20000);
      return () => clearInterval(interval);
    }
  }, [selectedMerchant]);

  const loadMerchants = async () => {
    try {
      const res = await fetch(`${API}/merchants`);
      const data = await res.json();
      if (data.success) {
        setMerchants(data.data);
        if (data.data.length > 0 && !selectedMerchant) {
          setSelectedMerchant(data.data[0]);
        }
      }
    } catch (error) {
      console.error('Failed to load merchants:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = async (merchantId) => {
    try {
      const res = await fetch(`${API}/merchants/${merchantId}/transactions`);
      const data = await res.json();
      if (data.success) {
        setTransactions(data.data);
      }
    } catch (error) {
      console.error('Failed to load transactions:', error);
    }
  };

  const createMerchant = async (e) => {
    e.preventDefault();
    if (!newMerchant.business_name || !newMerchant.email) {
      alert('Please fill in all fields');
      return;
    }

    try {
      const res = await fetch(`${API}/merchants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMerchant)
      });
      const data = await res.json();
      
      if (data.success) {
        alert(`Merchant created! Wallet: ${data.data.wallet_address}`);
        setNewMerchant({ business_name: '', email: '' });
        loadMerchants();
      } else {
        alert('Failed to create merchant: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Failed to create merchant:', error);
      alert('Failed to create merchant');
    }
  };

  const generateQR = async () => {
    if (!selectedMerchant) {
      alert('Please select a merchant first');
      return;
    }

    try {
      const res = await fetch(`${API}/payments/qr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet_address: selectedMerchant.wallet_address,
          amount: qrAmount,
          label: selectedMerchant.business_name
        })
      });
      const data = await res.json();
      
      if (data.success) {
        setQrCode(data.data.qr_code);
      } else {
        alert('Failed to generate QR code');
      }
    } catch (error) {
      console.error('Failed to generate QR:', error);
      alert('Failed to generate QR code');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⚡</div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">☄️ Solana Payment Autopilot</h1>
          <p className="text-sm text-gray-600">Autonomous crypto payments for merchants</p>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatsCard 
            icon={<Wallet />} 
            title="Total Merchants" 
            value={merchants.length} 
          />
          <StatsCard 
            icon={<DollarSign />} 
            title="Total Transactions" 
            value={transactions.length} 
          />
          <StatsCard 
            icon={<TrendingUp />} 
            title="Recent Amount" 
            value={transactions[0] ? `${transactions[0].amount} ${transactions[0].token}` : 'N/A'} 
          />
        </div>

        {/* Create Merchant Form */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Plus size={20} /> Create New Merchant
          </h2>
          <form onSubmit={createMerchant} className="flex gap-4">
            <input 
              type="text"
              placeholder="Business Name"
              value={newMerchant.business_name}
              onChange={(e) => setNewMerchant({...newMerchant, business_name: e.target.value})}
              className="border rounded px-4 py-2 flex-1"
            />
            <input 
              type="email"
              placeholder="Email"
              value={newMerchant.email}
              onChange={(e) => setNewMerchant({...newMerchant, email: e.target.value})}
              className="border rounded px-4 py-2 flex-1"
            />
            <button 
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
            >
              Create
            </button>
          </form>
        </div>

        {/* Merchant Selector */}
        {merchants.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-lg font-semibold mb-4">Select Merchant</h2>
            <select 
              value={selectedMerchant?.id || ''} 
              onChange={(e) => setSelectedMerchant(merchants.find(m => m.id === e.target.value))}
              className="border rounded px-4 py-2 w-full"
            >
              {merchants.map(m => (
                <option key={m.id} value={m.id}>
                  {m.business_name} ({m.email})
                </option>
              ))}
            </select>
            
            {selectedMerchant && (
              <div className="mt-4">
                <p className="text-sm text-gray-600 mb-2">Wallet Address:</p>
                <div className="font-mono text-xs bg-gray-100 p-3 rounded break-all">
                  {selectedMerchant.wallet_address}
                </div>
                <a 
                  href={`https://solscan.io/account/${selectedMerchant.wallet_address}?cluster=devnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 text-sm mt-2 inline-block hover:underline"
                >
                  View on Solscan (Devnet) →
                </a>
              </div>
            )}
          </div>
        )}

        {/* QR Code Generator */}
        {selectedMerchant && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <QrCode size={20} /> Generate Payment QR Code
            </h2>
            <div className="flex gap-4 mb-4">
              <input 
                type="number"
                step="0.01"
                value={qrAmount}
                onChange={(e) => setQrAmount(e.target.value)}
                placeholder="Amount (SOL)"
                className="border rounded px-4 py-2"
              />
              <button 
                onClick={generateQR}
                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
              >
                Generate QR
              </button>
            </div>
            
            {qrCode && (
              <div className="border-t pt-4">
                <p className="text-sm text-gray-600 mb-2">Scan with Phantom wallet (devnet):</p>
                <img src={qrCode} alt="Payment QR Code" className="w-64 h-64" />
                <p className="text-xs text-gray-500 mt-2">
                  Amount: {qrAmount} SOL → {selectedMerchant.business_name}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Transactions List */}
        {selectedMerchant && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">
              Transactions for {selectedMerchant.business_name}
            </h2>
            
            {transactions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="mb-2">No transactions yet</p>
                <p className="text-sm">Send devnet SOL to the wallet address above to test!</p>
                <a 
                  href="https://faucet.solana.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 text-sm mt-2 inline-block hover:underline"
                >
                  Get Devnet SOL from Faucet →
                </a>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-2 px-2">Time</th>
                    <th className="py-2 px-2">From</th>
                    <th className="py-2 px-2">Amount</th>
                    <th className="py-2 px-2">Status</th>
                    <th className="py-2 px-2">Signature</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-2 text-sm">
                        {new Date(tx.created_at).toLocaleString()}
                      </td>
                      <td className="py-2 px-2 text-xs font-mono">
                        {tx.from_address.slice(0, 8)}...
                      </td>
                      <td className="py-2 px-2 font-mono">
                        {tx.amount} {tx.token}
                      </td>
                      <td className="py-2 px-2">
                        <span className={`text-sm px-2 py-1 rounded ${
                          tx.status === 'confirmed' ? 'bg-green-100 text-green-800' : 
                          tx.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-red-100 text-red-800'
                        }`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="py-2 px-2">
                        <a 
                          href={`https://solscan.io/tx/${tx.signature}?cluster=devnet`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 text-xs hover:underline"
                        >
                          View →
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {merchants.length === 0 && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">🚀</div>
            <h2 className="text-2xl font-bold mb-2">Welcome to Solana Payment Autopilot</h2>
            <p className="text-gray-600 mb-6">Create your first merchant to get started</p>
            <p className="text-sm text-gray-500">
              Autonomous crypto payment processing for small businesses
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function StatsCard({ icon, title, value }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="text-blue-600">{icon}</div>
        <h3 className="text-sm text-gray-600">{title}</h3>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
