import React, { useState, useEffect } from 'react';
import { Wallet, QrCode, TrendingUp, DollarSign, Plus, RefreshCw, ExternalLink, CheckCircle, Clock, XCircle } from 'lucide-react';

const API = 'http://localhost:3000/api';

export default function App() {
  const [merchants, setMerchants] = useState([]);
  const [selectedMerchant, setSelectedMerchant] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [conversions, setConversions] = useState({});
  const [qrCode, setQrCode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Form states
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newMerchant, setNewMerchant] = useState({ business_name: '', email: '' });
  const [qrAmount, setQrAmount] = useState('0.05');
  const [qrLabel, setQrLabel] = useState('Payment');
  
  // Filter states
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadMerchants();
  }, []);

  useEffect(() => {
    if (selectedMerchant) {
      loadTransactions(selectedMerchant.id);
      // Poll for new transactions every 10 seconds
      const interval = setInterval(() => loadTransactions(selectedMerchant.id), 10000);
      return () => clearInterval(interval);
    }
  }, [selectedMerchant]);

  const loadMerchants = async () => {
    try {
      const res = await fetch(`${API}/merchants`);
      const data = await res.json();
      if (data.success) {
        const validMerchants = data.data.filter(m => m.wallet_address !== 'DEMO_WALLET_ADDRESS_REPLACE_ME');
        setMerchants(validMerchants);
        if (validMerchants.length > 0 && !selectedMerchant) {
          setSelectedMerchant(validMerchants[0]);
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
        
        // Load conversions for each transaction
        const conversionMap = {};
        for (const tx of data.data) {
          const convRes = await fetch(`${API}/transactions/${tx.id}/conversions`);
          const convData = await convRes.json();
          if (convData.success && convData.data.length > 0) {
            conversionMap[tx.id] = convData.data[0]; // Get latest conversion
          }
        }
        setConversions(conversionMap);
      }
    } catch (error) {
      console.error('Failed to load transactions:', error);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await Promise.all([
      loadMerchants(),
      selectedMerchant && loadTransactions(selectedMerchant.id)
    ]);
    setTimeout(() => setRefreshing(false), 500);
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
        setNewMerchant({ business_name: '', email: '' });
        setShowCreateForm(false);
        loadMerchants();
        // Show success notification
        alert(`✅ Merchant created!\n\nWallet: ${data.data.wallet_address}\n\nYou can now accept payments.`);
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
          label: qrLabel || selectedMerchant.business_name
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

  const totalAmount = transactions.reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
  const totalConverted = Object.values(conversions).reduce((sum, conv) => sum + (conv.to_amount || 0), 0);

  // Filter transactions
  const filteredTransactions = transactions.filter(tx => {
    const matchesStatus = filterStatus === 'all' || tx.status === filterStatus;
    const matchesSearch = !searchTerm || 
      tx.signature.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.from_address.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // CSV Export
  const exportToCSV = () => {
    if (transactions.length === 0) {
      alert('No transactions to export');
      return;
    }

    const headers = ['Date', 'Time', 'From', 'To', 'Amount', 'Token', 'Converted (USDC)', 'Status', 'Signature'];
    const rows = transactions.map(tx => {
      const conversion = conversions[tx.id];
      const date = new Date(tx.created_at);
      return [
        date.toLocaleDateString(),
        date.toLocaleTimeString(),
        tx.from_address,
        tx.to_address,
        tx.amount,
        tx.token,
        conversion ? conversion.to_amount.toFixed(2) : '-',
        tx.status,
        tx.signature
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `transactions-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-pulse">☄️</div>
          <p className="text-gray-600 text-lg">Loading Solana Payment Autopilot...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <nav className="bg-white shadow-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                ☄️ Solana Payment Autopilot
              </h1>
              <p className="text-sm text-gray-600 mt-1">Autonomous crypto payments for merchants</p>
            </div>
            <button
              onClick={refreshData}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              disabled={refreshing}
            >
              <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        
        {merchants.length === 0 ? (
          /* Welcome Screen */
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <div className="text-8xl mb-6">🚀</div>
            <h2 className="text-3xl font-bold mb-4">Welcome to Solana Payment Autopilot</h2>
            <p className="text-gray-600 mb-8 text-lg">
              Accept crypto payments without technical expertise.<br />
              Create your first merchant account to get started.
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all text-lg font-semibold shadow-lg"
            >
              <Plus size={24} />
              Create Merchant Account
            </button>
          </div>
        ) : (
          <>
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <StatsCard 
                icon={<Wallet className="text-blue-600" />} 
                title="Total Merchants" 
                value={merchants.length}
                gradient="from-blue-500 to-blue-600"
              />
              <StatsCard 
                icon={<DollarSign className="text-green-600" />} 
                title="Total Transactions" 
                value={transactions.length}
                gradient="from-green-500 to-green-600"
              />
              <StatsCard 
                icon={<TrendingUp className="text-indigo-600" />} 
                title="Total Converted" 
                value={totalConverted > 0 ? `$${totalConverted.toFixed(2)}` : `${totalAmount.toFixed(4)} SOL`}
                gradient="from-indigo-500 to-indigo-600"
              />
            </div>

            {/* Merchant Selector */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">Active Merchant</h2>
                {!showCreateForm && (
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    <Plus size={16} />
                    New Merchant
                  </button>
                )}
              </div>
              
              <select 
                value={selectedMerchant?.id || ''} 
                onChange={(e) => setSelectedMerchant(merchants.find(m => m.id === e.target.value))}
                className="border-2 border-gray-300 rounded-lg px-4 py-3 w-full text-lg focus:border-blue-500 focus:outline-none transition-colors"
              >
                {merchants.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.business_name} — {m.email}
                  </option>
                ))}
              </select>
              
              {selectedMerchant && (
                <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Wallet Address</p>
                  <div className="font-mono text-sm bg-white p-3 rounded-lg break-all border border-gray-300">
                    {selectedMerchant.wallet_address}
                  </div>
                  <a 
                    href={`https://solscan.io/account/${selectedMerchant.wallet_address}?cluster=devnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-blue-600 text-sm mt-3 hover:text-blue-700 transition-colors font-medium"
                  >
                    <ExternalLink size={16} />
                    View on Solscan (Devnet)
                  </a>
                </div>
              )}
            </div>

            {/* Create Merchant Form */}
            {showCreateForm && (
              <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border-2 border-blue-200">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <Plus size={24} className="text-blue-600" />
                    Create New Merchant
                  </h2>
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className="text-gray-500 hover:text-gray-700 text-sm"
                  >
                    Cancel
                  </button>
                </div>
                <form onSubmit={createMerchant} className="space-y-4">
                  <input 
                    type="text"
                    placeholder="Business Name (e.g., Joe's Coffee Shop)"
                    value={newMerchant.business_name}
                    onChange={(e) => setNewMerchant({...newMerchant, business_name: e.target.value})}
                    className="border-2 border-gray-300 rounded-lg px-4 py-3 w-full focus:border-blue-500 focus:outline-none transition-colors"
                  />
                  <input 
                    type="email"
                    placeholder="Email Address"
                    value={newMerchant.email}
                    onChange={(e) => setNewMerchant({...newMerchant, email: e.target.value})}
                    className="border-2 border-gray-300 rounded-lg px-4 py-3 w-full focus:border-blue-500 focus:outline-none transition-colors"
                  />
                  <button 
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 font-semibold transition-all shadow-lg"
                  >
                    Create Merchant Account
                  </button>
                </form>
              </div>
            )}

            {/* QR Code Generator */}
            {selectedMerchant && (
              <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <QrCode size={24} className="text-blue-600" />
                  Generate Payment QR Code
                </h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Amount (SOL)</label>
                      <input 
                        type="number"
                        step="0.001"
                        value={qrAmount}
                        onChange={(e) => setQrAmount(e.target.value)}
                        placeholder="0.05"
                        className="border-2 border-gray-300 rounded-lg px-4 py-3 w-full focus:border-blue-500 focus:outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Label (Optional)</label>
                      <input 
                        type="text"
                        value={qrLabel}
                        onChange={(e) => setQrLabel(e.target.value)}
                        placeholder={selectedMerchant.business_name}
                        className="border-2 border-gray-300 rounded-lg px-4 py-3 w-full focus:border-blue-500 focus:outline-none transition-colors"
                      />
                    </div>
                    <button 
                      onClick={generateQR}
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 font-semibold transition-all shadow-lg"
                    >
                      Generate QR Code
                    </button>
                  </div>
                  
                  {qrCode && (
                    <div className="flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200">
                      <p className="text-sm font-semibold text-gray-700 mb-3">Scan with Phantom Wallet (Devnet)</p>
                      <img src={qrCode} alt="Payment QR Code" className="w-64 h-64 rounded-lg shadow-md" />
                      <p className="text-xs text-gray-600 mt-3 text-center">
                        <span className="font-mono bg-white px-2 py-1 rounded">{qrAmount} SOL</span>
                        <br />
                        {qrLabel || selectedMerchant.business_name}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Transactions List */}
            {selectedMerchant && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-800">
                    Transaction History
                  </h2>
                  {transactions.length > 0 && (
                    <button
                      onClick={exportToCSV}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-semibold"
                    >
                      📊 Export CSV
                    </button>
                  )}
                </div>

                {/* Filters & Results Count */}
                {transactions.length > 0 && (
                  <>
                    <div className="mb-4 text-sm text-gray-600">
                      Showing {filteredTransactions.length} of {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
                    </div>
                    <div className="mb-6 grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Filter by Status</label>
                      <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none transition-colors"
                      >
                        <option value="all">All Status</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="pending">Pending</option>
                        <option value="failed">Failed</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Search</label>
                      <input
                        type="text"
                        placeholder="Search by signature or address..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                  </>
                )}
                
                {transactions.length === 0 ? (
                  <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl">
                    <div className="text-6xl mb-4">💳</div>
                    <p className="text-gray-600 mb-2 text-lg font-medium">No transactions yet</p>
                    <p className="text-sm text-gray-500 mb-4">Send devnet SOL to the wallet address above to test</p>
                    <a 
                      href="https://faucet.solana.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-semibold"
                    >
                      <ExternalLink size={16} />
                      Get Devnet SOL from Faucet
                    </a>
                  </div>
                ) : filteredTransactions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No transactions match your filters</p>
                    <button
                      onClick={() => {
                        setFilterStatus('all');
                        setSearchTerm('');
                      }}
                      className="mt-3 text-blue-600 hover:text-blue-700 text-sm font-semibold"
                    >
                      Clear filters
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b-2 border-gray-200 text-left bg-gray-50">
                          <th className="py-3 px-4 font-semibold text-gray-700">Status</th>
                          <th className="py-3 px-4 font-semibold text-gray-700">Time</th>
                          <th className="py-3 px-4 font-semibold text-gray-700">From</th>
                          <th className="py-3 px-4 font-semibold text-gray-700">Amount</th>
                          <th className="py-3 px-4 font-semibold text-gray-700">Converted</th>
                          <th className="py-3 px-4 font-semibold text-gray-700">Link</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTransactions.map((tx, idx) => {
                          const conversion = conversions[tx.id];
                          return (
                          <tr key={tx.id} className={`border-b border-gray-100 hover:bg-blue-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                            <td className="py-4 px-4">
                              <StatusBadge status={tx.status} />
                            </td>
                            <td className="py-4 px-4 text-sm text-gray-600">
                              {new Date(tx.created_at).toLocaleString()}
                            </td>
                            <td className="py-4 px-4 text-xs font-mono text-gray-700">
                              {tx.from_address.slice(0, 4)}...{tx.from_address.slice(-4)}
                            </td>
                            <td className="py-4 px-4 font-mono font-semibold text-gray-900">
                              {tx.amount} <span className="text-gray-500">{tx.token}</span>
                            </td>
                            <td className="py-4 px-4">
                              {conversion ? (
                                <div className="flex flex-col">
                                  <span className="font-mono text-sm text-green-700 font-semibold">
                                    {conversion.to_amount.toFixed(2)} USDC
                                  </span>
                                  <span className={`text-xs ${conversion.status === 'completed' ? 'text-green-600' : conversion.status === 'pending' ? 'text-yellow-600' : 'text-red-600'}`}>
                                    {conversion.status}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-xs text-gray-400">-</span>
                              )}
                            </td>
                            <td className="py-4 px-4">
                              <a 
                                href={`https://solscan.io/tx/${tx.signature}?cluster=devnet`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium"
                              >
                                View <ExternalLink size={14} />
                              </a>
                            </td>
                          </tr>
                        );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function StatsCard({ icon, title, value, gradient }) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
      <div className="flex items-center gap-4 mb-3">
        <div className={`p-3 bg-gradient-to-r ${gradient} rounded-xl text-white`}>
          {icon}
        </div>
        <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">{title}</h3>
      </div>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

function StatusBadge({ status }) {
  const config = {
    confirmed: { icon: CheckCircle, text: 'Confirmed', className: 'bg-green-100 text-green-800 border-green-200' },
    pending: { icon: Clock, text: 'Pending', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    failed: { icon: XCircle, text: 'Failed', className: 'bg-red-100 text-red-800 border-red-200' },
  };
  
  const { icon: Icon, text, className } = config[status] || config.pending;
  
  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${className}`}>
      <Icon size={14} />
      {text}
    </span>
  );
}
