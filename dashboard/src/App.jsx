import React, { useState, useEffect } from 'react';
import { Wallet, QrCode, TrendingUp, DollarSign } from 'lucide-react';

export default function App() {
  const [wallet, setWallet] = useState(null);
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState({ total: 0, today: 0, balance: 0 });

  useEffect(() => {
    // Load merchant wallet
    fetch('/api/merchant/wallet')
      .then(r => r.json())
      .then(setWallet)
      .catch(() => {});
    
    // Load payments
    fetch('/api/payments')
      .then(r => r.json())
      .then(setPayments)
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">☄️ Payment Autopilot</h1>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatsCard icon={<DollarSign />} title="Total Volume" value="$0.00" />
          <StatsCard icon={<TrendingUp />} title="Today" value="0 payments" />
          <StatsCard icon={<Wallet />} title="Balance" value={`${stats.balance} SOL`} />
        </div>

        {/* Wallet Info */}
        {wallet && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-lg font-semibold mb-4">Merchant Wallet</h2>
            <div className="font-mono text-sm bg-gray-100 p-3 rounded">
              {wallet.publicKey}
            </div>
          </div>
        )}

        {/* QR Code */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <QrCode size={20} /> Payment QR Code
          </h2>
          <div className="flex gap-4">
            <input type="number" placeholder="Amount (SOL)" className="border rounded px-4 py-2" defaultValue="0.1" />
            <button className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
              Generate QR
            </button>
          </div>
        </div>

        {/* Payments List */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Payments</h2>
          {payments.length === 0 ? (
            <p className="text-gray-500">No payments yet</p>
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
                    <td className="py-2">{p.timestamp}</td>
                    <td className="py-2">{p.amount} SOL</td>
                    <td className="py-2"><span className="text-green-600">✓ Confirmed</span></td>
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
