// src/App.tsx
import { useState, useEffect, useRef } from 'react';
import { 
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import './App.css';

// --- MOCK DATA ---
const AI_LOREM_TEXT = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum.";

// Simple Values
const MOCK_NET_WORTH = 145250.00;
const MOCK_TOTAL_DEBT = 24500.00;

// Graph Data Arrays
const MOCK_NET_WORTH_HISTORY = [
  { date: 'Jan', amount: 130000 },
  { date: 'Feb', amount: 135000 },
  { date: 'Mar', amount: 132000 },
  { date: 'Apr', amount: 145250 },
];

const MOCK_BUDGET_DATA = [
  { category: 'Housing', amount: 2000, color: '#FF6384' },
  { category: 'Food', amount: 600, color: '#36A2EB' },
  { category: 'Transport', amount: 400, color: '#FFCE56' },
  { category: 'Entertainment', amount: 300, color: '#4BC0C0' },
];

const MOCK_DEBT_HISTORY = [
  { date: 'Jan', amount: 28000 },
  { date: 'Feb', amount: 26500 },
  { date: 'Mar', amount: 25000 },
  { date: 'Apr', amount: 24500 },
];

const MOCK_INVESTMENT_HISTORY = [
  { date: 'Jan', amount: 85000 },
  { date: 'Feb', amount: 88000 },
  { date: 'Mar', amount: 86000 },
  { date: 'Apr', amount: 92000 },
];

const MOCK_STOCKS = [
  { id: 1, name: 'Apple (AAPL)', change: '+1.2%', isPositive: true },
  { id: 2, name: 'Tesla (TSLA)', change: '-0.8%', isPositive: false },
  { id: 3, name: 'S&P 500 ETF (VOO)', change: '+0.5%', isPositive: true },
  { id: 4, name: 'Nvidia (NVDA)', change: '+3.4%', isPositive: true }
];

// Tab identifiers
type TabType = 'overview' | 'budget' | 'debt' | 'investments';

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [messages, setMessages] = useState([
    { id: 1, text: "Hello! How can I help you analyze your finances today?", sender: 'ai' }
  ]);

  const chatInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (isChatOpen && chatInputRef.current) {
      chatInputRef.current.focus();
    }
  }, [isChatOpen]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setIsChatOpen(false);
  };

  const openChat = () => setIsChatOpen(true);
  const closeChat = () => setIsChatOpen(false);

  // --- PAGE COMPONENTS ---

  const renderOverview = () => (
    <div className="page-container">
      <h1>Net Worth Overview</h1>
      <h2>${MOCK_NET_WORTH.toLocaleString()} USD</h2>
      <div className="chart-container" style={{ height: '300px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={MOCK_NET_WORTH_HISTORY}>
            <defs>
              <linearGradient id="colorNetWorth" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0066cc" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#0066cc" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" axisLine={false} tickLine={false} />
            <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `$${value/1000}k`} />
            <Tooltip formatter={(value: any) => `$${value.toLocaleString()}`} />
            <Area type="monotone" dataKey="amount" stroke="#0066cc" fillOpacity={1} fill="url(#colorNetWorth)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const renderBudget = () => (
    <div className="page-container">
      <h1>Budgeting Overview</h1>
      <div className="budget-layout">
        <div className="chart-container pie-chart" style={{ height: '250px', padding: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie 
                data={MOCK_BUDGET_DATA} 
                dataKey="amount" 
                nameKey="category" 
                cx="50%" 
                cy="50%" 
                innerRadius={60} 
                outerRadius={80} 
                paddingAngle={5}
              >
                {MOCK_BUDGET_DATA.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value: any) => `$${value}`} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="ai-suggestion">
          <strong>AI Budget Analysis</strong>
          <p>{AI_LOREM_TEXT}</p>
          <span className="details-link" onClick={openChat}>details</span>
        </div>
      </div>
    </div>
  );

  const renderDebt = () => (
    <div className="page-container">
      <h1>Debt Helper</h1>
      <h2>${MOCK_TOTAL_DEBT.toLocaleString()} USD Owed</h2>
      <div className="chart-container" style={{ height: '300px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={MOCK_DEBT_HISTORY}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" axisLine={false} tickLine={false} />
            <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `$${value/1000}k`} />
            <Tooltip formatter={(value: any) => `$${value.toLocaleString()}`} />
            <Line type="monotone" dataKey="amount" stroke="#dc3545" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="ai-suggestion" style={{ marginTop: '20px' }}>
        <strong>AI Debt Analyzer</strong>
        <p>{AI_LOREM_TEXT}</p>
        <span className="details-link" onClick={openChat}>details</span>
      </div>
    </div>
  );

  const renderInvestments = () => (
    <div className="page-container">
      <h1>Investments</h1>
      <div className="chart-container" style={{ height: '300px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={MOCK_INVESTMENT_HISTORY}>
            <defs>
              <linearGradient id="colorInvestments" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#28a745" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#28a745" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" axisLine={false} tickLine={false} />
            <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `$${value/1000}k`} />
            <Tooltip formatter={(value: any) => `$${value.toLocaleString()}`} />
            <Area type="monotone" dataKey="amount" stroke="#28a745" fillOpacity={1} fill="url(#colorInvestments)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
      <div className="ai-suggestion" style={{ marginTop: '20px' }}>
        <strong>AI Investment Suggestion</strong>
        <p>{AI_LOREM_TEXT}</p>
        <span className="details-link" onClick={openChat}>details</span>
      </div>

      <h3 style={{ marginTop: '10px' }}>Your Assets</h3>
      <div className="stock-list">
        {MOCK_STOCKS.map((stock) => (
          <div className="stock-item" key={stock.id}>
            <span className="stock-name">{stock.name}</span>
            <span className={`stock-change ${stock.isPositive ? 'positive' : 'negative'}`}>
              {stock.change}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="app-container">
      <header className={`app-header ${isChatOpen ? 'blurred' : ''}`}>
        <div className="logo-placeholder"></div>
        <h1 className="app-title">Lorem Finance</h1>
      </header>

      <div className={`content-area ${isChatOpen ? 'blurred' : ''}`}>
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'budget' && renderBudget()}
        {activeTab === 'debt' && renderDebt()}
        {activeTab === 'investments' && renderInvestments()}
      </div>

      <div className={`chatbot-overlay ${isChatOpen ? 'open' : ''}`}>
        <div className="chatbot-window">
          <div className="chatbot-header">
            <h3>Financial AI Coach</h3>
            <button className="close-btn" onClick={closeChat}>&times;</button>
          </div>
          
          <div className="chatbot-body">
            {messages.map((msg) => (
              <div key={msg.id} className={`chat-message ${msg.sender}`}>
                {msg.sender === 'ai' && (
                  <div className="chat-avatar"></div>
                )}
                <div className="chat-bubble">
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          <div className="chatbot-input-area">
            <input 
              ref={chatInputRef} 
              type="text" 
              placeholder="Type your message..." 
            />
          </div>
        </div>
      </div>

      <div className="bottom-nav">
        <div className={`nav-tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => handleTabChange('overview')}>
          Overview
        </div>
        <div className={`nav-tab ${activeTab === 'budget' ? 'active' : ''}`} onClick={() => handleTabChange('budget')}>
          Budget
        </div>
        <div className="nav-ai-input" onClick={openChat}>
          <div className="ai-search-box">
            Ask AI for anything...
          </div>
        </div>
        <div className={`nav-tab ${activeTab === 'debt' ? 'active' : ''}`} onClick={() => handleTabChange('debt')}>
          Debt
        </div>
        <div className={`nav-tab ${activeTab === 'investments' ? 'active' : ''}`} onClick={() => handleTabChange('investments')}>
          Invest
        </div>
      </div>

    </div>
  );
}

export default App;