import React, { useState, useEffect } from 'react';
import { Wallet, TrendingUp, DollarSign, RefreshCw, ExternalLink, CheckCircle, Clock, XCircle } from 'lucide-react';

const API = 'http://localhost:3000/api';

export default function App() {
  const [merchants, setMerchants] = useState([]);
  const [selectedMerchant, setSelectedMerchant] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [conversions, setConversions] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
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
        
        {/* Platform Admin Notice */}
        {merchants.length > 1 && (
          <div className="max-w-7xl mx-auto px-6 pb-4">
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-800">
                    <strong>Platform Admin View:</strong> In production, each merchant would log in to see only their own account. 
                    This view is for platform operators managing multiple merchants.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        
        {merchants.length === 0 ? (
          /* Welcome Screen */
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <div className="text-8xl mb-6">🏢</div>
            <h2 className="text-3xl font-bold mb-4">Platform Admin Panel</h2>
            <p className="text-gray-600 mb-8 text-lg">
              No merchants registered yet.<br />
              Merchants can sign up at: <span className="font-mono text-blue-600">http://localhost:8888</span>
            </p>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded text-left max-w-xl mx-auto">
              <p className="text-sm text-blue-900 mb-2">
                <strong>How merchants join:</strong>
              </p>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Visit the signup page (port 8888)</li>
                <li>Fill in business details</li>
                <li>Pay 0.1 SOL setup fee</li>
                <li>Account created automatically</li>
                <li>Appears here in admin panel!</li>
              </ol>
            </div>
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
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Select Merchant to View</h2>
                  {selectedMerchant && (
                    <p className="text-sm text-gray-500 mt-1">
                      👤 Viewing: <span className="font-semibold text-blue-600">{selectedMerchant.business_name}</span>
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-700">Total Merchants</p>
                  <p className="text-2xl font-bold text-blue-600">{merchants.length}</p>
                </div>
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

            {/* Merchant Info Banner */}
            {selectedMerchant && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200 mb-8">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Merchant Details</h3>
                    <p className="text-sm text-gray-600">Registered merchant information and stats</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Registered</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {new Date(selectedMerchant.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Email</p>
                    <p className="text-sm font-semibold text-gray-900">{selectedMerchant.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Auto-Convert</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {selectedMerchant.auto_convert_enabled ? '✅ Enabled' : '❌ Disabled'}
                    </p>
                  </div>
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
