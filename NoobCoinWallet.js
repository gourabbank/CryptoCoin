import React, { useState, useEffect } from 'react';
import { Wallet, Send, TrendingUp, Clock, Hash, User, DollarSign, Activity } from 'lucide-react';

// Mock API calls (in real app, these would connect to your NoobCoin API)
const mockAPI = {
  getBalance: (address) => {
    const balances = {
      'NBC00d43fd51e77071f0e4d8e580bb4d02b': 1010,
      'NBC28fb3c79e1bd90bdbca54e3605eaa70c': 674.998,
      'NBC91252f30b02957e7eb1f563e8244871a': 624.999,
      'NBCa6f812bf1b5fe90306de2340e8dc5d98': 120.006
    };
    return Promise.resolve(balances[address] || 0);
  },
  
  getTransactions: (address) => {
    const transactions = [
      { id: '1', type: 'received', amount: 1000, from: 'NBCdea2572...', to: address, timestamp: Date.now() - 3600000, status: 'confirmed' },
      { id: '2', type: 'sent', amount: 150, from: address, to: 'NBC28fb3c...', timestamp: Date.now() - 1800000, status: 'confirmed' },
      { id: '3', type: 'sent', amount: 100, from: address, to: 'NBCa6f812...', timestamp: Date.now() - 900000, status: 'confirmed' },
      { id: '4', type: 'received', amount: 200, from: 'NBC28fb3c...', to: address, timestamp: Date.now() - 300000, status: 'confirmed' }
    ];
    return Promise.resolve(transactions);
  },
  
  sendTransaction: (from, to, amount) => {
    return Promise.resolve({
      id: 'tx_' + Math.random().toString(36).substr(2, 9),
      status: 'pending',
      hash: '0x' + Math.random().toString(16).substr(2, 64)
    });
  }
};

const NoobCoinWallet = () => {
  const [currentWallet, setCurrentWallet] = useState('NBC00d43fd51e77071f0e4d8e580bb4d02b');
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sendForm, setSendForm] = useState({ to: '', amount: '', memo: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadWalletData();
  }, [currentWallet]);

  const loadWalletData = async () => {
    setLoading(true);
    try {
      const [walletBalance, walletTransactions] = await Promise.all([
        mockAPI.getBalance(currentWallet),
        mockAPI.getTransactions(currentWallet)
      ]);
      setBalance(walletBalance);
      setTransactions(walletTransactions);
    } catch (error) {
      console.error('Error loading wallet data:', error);
    }
    setLoading(false);
  };

  const handleSendTransaction = async () => {
    if (!sendForm.to || !sendForm.amount) {
      alert('Please fill in recipient address and amount');
      return;
    }
    
    setLoading(true);
    
    try {
      const result = await mockAPI.sendTransaction(currentWallet, sendForm.to, parseFloat(sendForm.amount));
      alert(`Transaction sent! Hash: ${result.hash}`);
      setSendForm({ to: '', amount: '', memo: '' });
      loadWalletData();
    } catch (error) {
      alert('Transaction failed: ' + error.message);
    }
    
    setLoading(false);
  };

  const formatAddress = (address) => {
    return address.length > 15 ? `${address.substring(0, 8)}...${address.substring(address.length - 6)}` : address;
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const DashboardTab = () => (
    <div className="space-y-6">
      {/* Balance Card */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Wallet size={24} />
            <span className="text-lg font-semibold">NoobCoin Wallet</span>
          </div>
          <div className="text-right">
            <div className="text-sm opacity-80">Current Address</div>
            <div className="text-xs font-mono">{formatAddress(currentWallet)}</div>
          </div>
        </div>
        <div className="text-4xl font-bold mb-2">{balance.toLocaleString()} NBC</div>
        <div className="text-lg opacity-80">${(balance * 1).toLocaleString()} USD</div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <button 
          onClick={() => setActiveTab('send')}
          className="bg-green-500 hover:bg-green-600 text-white p-4 rounded-xl flex items-center justify-center space-x-2 transition-colors"
        >
          <Send size={20} />
          <span>Send NBC</span>
        </button>
        <button 
          onClick={() => setActiveTab('receive')}
          className="bg-blue-500 hover:bg-blue-600 text-white p-4 rounded-xl flex items-center justify-center space-x-2 transition-colors"
        >
          <User size={20} />
          <span>Receive NBC</span>
        </button>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Activity size={20} className="text-gray-600" />
          <h3 className="text-lg font-semibold">Recent Transactions</h3>
        </div>
        <div className="space-y-3">
          {transactions.slice(0, 3).map((tx) => (
            <div key={tx.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${tx.type === 'received' ? 'bg-green-400' : 'bg-red-400'}`}></div>
                <div>
                  <div className="font-medium">{tx.type === 'received' ? 'Received' : 'Sent'}</div>
                  <div className="text-sm text-gray-500">{formatTime(tx.timestamp)}</div>
                </div>
              </div>
              <div className={`font-semibold ${tx.type === 'received' ? 'text-green-600' : 'text-red-600'}`}>
                {tx.type === 'received' ? '+' : '-'}{tx.amount} NBC
              </div>
            </div>
          ))}
        </div>
        <button 
          onClick={() => setActiveTab('transactions')}
          className="w-full mt-4 text-blue-600 hover:text-blue-800 font-medium"
        >
          View All Transactions
        </button>
      </div>
    </div>
  );

  const SendTab = () => (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center space-x-2 mb-6">
        <Send size={20} className="text-gray-600" />
        <h3 className="text-lg font-semibold">Send NoobCoin</h3>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Recipient Address</label>
          <input
            type="text"
            value={sendForm.to}
            onChange={(e) => setSendForm({...sendForm, to: e.target.value})}
            placeholder="NBC..."
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Amount (NBC)</label>
          <input
            type="number"
            step="0.001"
            value={sendForm.amount}
            onChange={(e) => setSendForm({...sendForm, amount: e.target.value})}
            placeholder="0.000"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
          <div className="text-sm text-gray-500 mt-1">
            Available: {balance} NBC | Fee: 0.001 NBC
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Memo (Optional)</label>
          <input
            type="text"
            value={sendForm.memo}
            onChange={(e) => setSendForm({...sendForm, memo: e.target.value})}
            placeholder="Payment for..."
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <button
          type="button"
          onClick={handleSendTransaction}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white p-3 rounded-lg font-medium transition-colors"
        >
          {loading ? 'Sending...' : 'Send Transaction'}
        </button>
      </div>
    </div>
  );

  const ReceiveTab = () => (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center space-x-2 mb-6">
        <User size={20} className="text-gray-600" />
        <h3 className="text-lg font-semibold">Receive NoobCoin</h3>
      </div>
      
      <div className="text-center space-y-4">
        <div className="bg-gray-100 p-8 rounded-xl">
          <div className="w-32 h-32 bg-black mx-auto mb-4 rounded-lg flex items-center justify-center">
            <Hash size={64} className="text-white" />
          </div>
          <div className="text-sm text-gray-600 mb-2">Your NoobCoin Address</div>
          <div className="font-mono text-sm bg-white p-3 rounded border break-all">
            {currentWallet}
          </div>
        </div>
        
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium">
          Copy Address
        </button>
        
        <div className="text-sm text-gray-500">
          Share this address to receive NoobCoin payments
        </div>
      </div>
    </div>
  );

  const TransactionsTab = () => (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center space-x-2 mb-6">
        <Clock size={20} className="text-gray-600" />
        <h3 className="text-lg font-semibold">Transaction History</h3>
      </div>
      
      <div className="space-y-3">
        {transactions.map((tx) => (
          <div key={tx.id} className="border-b border-gray-200 pb-3 last:border-b-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-4 h-4 rounded-full ${tx.type === 'received' ? 'bg-green-400' : 'bg-red-400'}`}></div>
                <div>
                  <div className="font-medium">{tx.type === 'received' ? 'Received from' : 'Sent to'}</div>
                  <div className="text-sm text-gray-500 font-mono">
                    {formatAddress(tx.type === 'received' ? tx.from : tx.to)}
                  </div>
                  <div className="text-xs text-gray-400">{formatTime(tx.timestamp)}</div>
                </div>
              </div>
              <div className="text-right">
                <div className={`font-semibold ${tx.type === 'received' ? 'text-green-600' : 'text-red-600'}`}>
                  {tx.type === 'received' ? '+' : '-'}{tx.amount} NBC
                </div>
                <div className="text-xs text-gray-500 capitalize">{tx.status}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Wallet size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">NoobCoin Wallet</h1>
                <div className="text-sm text-gray-500">Secure • Decentralized • Fast</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Network Status</div>
              <div className="text-green-600 font-medium">● Connected</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Navigation Tabs */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-gray-200 p-1 rounded-lg">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
              { id: 'send', label: 'Send', icon: Send },
              { id: 'receive', label: 'Receive', icon: User },
              { id: 'transactions', label: 'History', icon: Clock }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-md font-medium transition-colors ${
                  activeTab === tab.id 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <tab.icon size={18} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'dashboard' && <DashboardTab />}
        {activeTab === 'send' && <SendTab />}
        {activeTab === 'receive' && <ReceiveTab />}
        {activeTab === 'transactions' && <TransactionsTab />}
      </div>
    </div>
  );
};

export default NoobCoinWallet;