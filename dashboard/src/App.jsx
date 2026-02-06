import React, { useState, useEffect } from 'react';
import { Wallet, QrCode, TrendingUp, DollarSign } from 'lucide-react';

const API = 'http://localhost:3000';

export default function App() {
  const [wallet, setWallet] = useState(null);
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState({ balance: '0' });
  const [amount, setAmount] = useState('0.1');

  useEffect(() => {
    fetch(`${API}/api/merchant/wallet`).then(r => r.json()).then(d => {
      setWallet(d);
      setStats({ balance: d.balance });
    });
    fetch(`${API}/api/payments`).then(r => r.json()).then(setPayments);
    
    const poll = setInterval(() => {
      fetch(`${API}/api/payments/check`).then(r => r.json()).then(d => {
        if (d.newPayments?.length) {
          setPayments(p => [...d.newPayments, ...p]);
          fetch(`${API}/api/merchant/wallet`).then(r => r.json()).then(w => setStats({ balance: w.balance }));
        }
      });
    }, 5000);
    return () => clearInterval(poll);
  }, []);

  const generateQR = () => {
    fetch(`${API}/api/qr/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount })
    }).then(r => r.json()).then(() => alert('QR saved to qr-codes/'));
  };

  const convertToUSDC = () => {
    const amt = prompt('Amount of SOL to convert:');
    if (!amt) return;
    fetch(`${API}/api/convert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: amt })
    }).then(r => r.json()).then(d => alert(`Converted to ${d.usdcAmount} USDC`)).catch(e => alert('Conversion failed'));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">☄️ Payment Autopilot</h1>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatsCard icon={<DollarSign />} title="Total Volume" value={`${payments.length} payments`} />
          <StatsCard icon={<TrendingUp />} title="Recent" value={payments[0]?.amount || '0'} />
          <StatsCard icon={<Wallet />} title="Balance" value={`${stats.balance} SOL`} />
        </div>

        {wallet && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-lg font-semibold mb-4">Merchant Wallet</h2>
            <div className="font-mono text-sm bg-gray-100 p-3 rounded break-all mb-4">
              {wallet.publicKey}
            </div>
            <button onClick={convertToUSDC} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
              Convert SOL → USDC
            </button>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <QrCode size={20} /> Payment QR Code
          </h2>
          <div className="flex gap-4">
            <input 
              type="number" 
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="Amount (SOL)" 
              className="border rounded px-4 py-2" 
            />
            <button onClick={generateQR} className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
              Generate QR
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Payments</h2>
          {payments.length === 0 ? (
            <p className="text-gray-500">No payments yet. Send SOL to your wallet to test!</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Time</th>
                  <th className="text-left py-2">Amount</th>
                  <th className="text-left py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p, i) => (
                  <tr key={i} className="border-b">
                    <td className="py-2 text-sm">{p.timestamp}</td>
                    <td className="py-2 font-mono">{p.amount} SOL</td>
                    <td className="py-2"><span className="text-green-600 text-sm">✓ {p.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
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
