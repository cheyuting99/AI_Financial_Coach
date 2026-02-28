// src/App.tsx
import { useState, useEffect, useRef } from 'react';
import { 
  LineChart, Line, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import logo from './assets/logo.png'; 
import './App.css';

// --- MOCK DATA ---
const BUDGET_AI_TEXT = "Your Housing category takes up the largest portion of your budget at $2,000. Consider reviewing your utility and subscription costs to find extra savings.";
const DEBT_AI_TEXT = "You currently owe $24,500. At your current payoff rate, you are on track to be debt-free in 18 months. Keep up the great work!";
const INVEST_AI_TEXT = "Your portfolio has grown consistently. Tech stocks like NVDA are driving your gains, but you may want to consider diversifying into more index funds.";
const DEFAULT_AI_TEXT = "Hello! How can I help you analyze your finances today?";

const MOCK_NET_WORTH = 145250.00;
const MOCK_TOTAL_DEBT = 24500.00;

const MOCK_NET_WORTH_HISTORY = [
  { date: 'Jan', amount: 130000 }, { date: 'Feb', amount: 135000 },
  { date: 'Mar', amount: 132000 }, { date: 'Apr', amount: 145250 },
];

const MOCK_BUDGET_DATA = [
  { category: 'Housing', amount: 2000, color: '#FF6384' },
  { category: 'Food', amount: 600, color: '#36A2EB' },
  { category: 'Transport', amount: 400, color: '#FFCE56' },
  { category: 'Entertainment', amount: 300, color: '#4BC0C0' },
];

const MOCK_DEBT_HISTORY = [
  { date: 'Jan', amount: 28000 }, { date: 'Feb', amount: 26500 },
  { date: 'Mar', amount: 25000 }, { date: 'Apr', amount: 24500 },
];

const MOCK_INVESTMENT_HISTORY = [
  { date: 'Jan', amount: 85000 }, { date: 'Feb', amount: 88000 },
  { date: 'Mar', amount: 86000 }, { date: 'Apr', amount: 92000 },
];

const MOCK_STOCKS = [
  { id: 1, name: 'Apple (AAPL)', change: '+1.2%', isPositive: true },
  { id: 2, name: 'Tesla (TSLA)', change: '-0.8%', isPositive: false },
  { id: 3, name: 'S&P 500 (VOO)', change: '+0.5%', isPositive: true },
  { id: 4, name: 'Nvidia (NVDA)', change: '+3.4%', isPositive: true }
];

type TabType = 'overview' | 'budget' | 'debt' | 'investments';

function App() {
  const [showSplash, setShowSplash] = useState<boolean>(true);
  const [fadeSplash, setFadeSplash] = useState<boolean>(false);

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState<boolean>(false); 
  
  const [messages, setMessages] = useState([
    { id: 1, text: DEFAULT_AI_TEXT, sender: 'ai' }
  ]);

  const chatInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      setFadeSplash(true);
    }, 1200);

    const removeTimer = setTimeout(() => {
      setShowSplash(false);
    }, 1700);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);
  
  useEffect(() => {
    if (isChatOpen) {
      const timer = setTimeout(() => {
        chatInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isChatOpen]);

  const openChatWithContext = (contextText: string) => {
    setMessages([{ id: Date.now(), text: contextText, sender: 'ai' }]);
    setIsChatOpen(true);
  };

  const closeChat = () => setIsChatOpen(false);

  const handleSendMessage = () => {
    if (!inputText.trim()) return;
    
    const newUserMessage = {
      id: Date.now(),
      text: inputText,
      sender: 'user' as const
    };
    setMessages((prev) => [...prev, newUserMessage]);
    setInputText('');
    
    setIsTyping(true);

    setTimeout(() => {
      const aiResponse = {
        id: Date.now() + 1,
        text: "This is a simulated backend response! Once you hook up your database, you can replace this setTimeout with your actual API fetch.",
        sender: 'ai' as const
      };
      
      setIsTyping(false);
      setMessages((prev) => [...prev, aiResponse]);
    }, 2500);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSendMessage();
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setIsChatOpen(false);
  };

  // --- NEW: Calculates cursor position and feeds it to CSS ---
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const rect = target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Injects the exact pixel coordinates into CSS variables
    target.style.setProperty('--mouse-x', `${x}px`);
    target.style.setProperty('--mouse-y', `${y}px`);
  };

  // --- PAGE COMPONENTS ---
  const renderOverview = () => (
    <div className="page-container">
      <h1>Net Worth Overview</h1>
      <h2>${MOCK_NET_WORTH.toLocaleString()} USD</h2>
      <div className="chart-container" style={{ height: '300px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={MOCK_NET_WORTH_HISTORY}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" axisLine={false} tickLine={false} />
            <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `$${v/1000}k`} />
            <Tooltip formatter={(value: any) => `$${value.toLocaleString()}`} />
            <Line type="monotone" dataKey="amount" stroke="#0066cc" strokeWidth={3} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const renderBudget = () => (
    <div className="page-container">
      <h1>Budgeting Overview</h1>
      <div className="chart-container" style={{ height: '350px', display: 'block' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie 
              data={MOCK_BUDGET_DATA} 
              dataKey="amount" 
              nameKey="category" 
              cx="50%" cy="45%" 
              innerRadius={70} outerRadius={100} 
              paddingAngle={5} stroke="none"
            >
              {MOCK_BUDGET_DATA.map((entry, index) => <Cell key={`c-${index}`} fill={entry.color} />)}
            </Pie>
            <Tooltip formatter={(value: any) => `$${value}`} />
            <Legend layout="horizontal" verticalAlign="bottom" align="center" iconType="circle" />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="ai-suggestion">
        <strong>AI Budget Analysis</strong>
        <p>{BUDGET_AI_TEXT}</p>
        <span className="details-link" onClick={() => openChatWithContext(BUDGET_AI_TEXT)}>details</span>
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
            <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `$${v/1000}k`} />
            <Tooltip formatter={(value: any) => `$${value.toLocaleString()}`} />
            <Line type="monotone" dataKey="amount" stroke="#dc3545" strokeWidth={3} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="ai-suggestion">
        <strong>AI Debt Analyzer</strong>
        <p>{DEBT_AI_TEXT}</p>
        <span className="details-link" onClick={() => openChatWithContext(DEBT_AI_TEXT)}>details</span>
      </div>
    </div>
  );

  const renderInvestments = () => (
    <div className="page-container">
      <h1>Investments</h1>
      <div className="chart-container" style={{ height: '300px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={MOCK_INVESTMENT_HISTORY}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" axisLine={false} tickLine={false} />
            <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `$${v/1000}k`} />
            <Tooltip formatter={(value: any) => `$${value.toLocaleString()}`} />
            <Line type="monotone" dataKey="amount" stroke="#28a745" strokeWidth={3} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="ai-suggestion">
        <strong>AI Investment Suggestion</strong>
        <p>{INVEST_AI_TEXT}</p>
        <span className="details-link" onClick={() => openChatWithContext(INVEST_AI_TEXT)}>details</span>
      </div>
      <div className="stock-list">
        {MOCK_STOCKS.map((stock) => (
          <div className="stock-item" key={stock.id}>
            <span className="stock-name">{stock.name}</span>
            <span className={`stock-change ${stock.isPositive ? 'positive' : 'negative'}`}>{stock.change}</span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="app-container">
      
      {showSplash && (
        <div className={`splash-screen ${fadeSplash ? 'fade-out' : ''}`}>
          <img src={logo} alt="Cat Logo" className="splash-logo" />
          <h1 className="splash-title">Lorem Finance</h1>
        </div>
      )}

      <header className={`app-header ${isChatOpen ? 'blurred' : ''}`}>
        <img src={logo} alt="Cat Logo" className="app-logo" />
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
            <button className="close-btn" onClick={closeChat}>&times;</button>
          </div>
          <div className="chatbot-body">
            {messages.map((msg) => (
              <div key={msg.id} className={`chat-message ${msg.sender}`}>
                {msg.sender === 'ai' && <img src={logo} alt="AI Avatar" className="chat-avatar" />}
                <div className="chat-bubble">{msg.text}</div>
              </div>
            ))}
            
            {isTyping && (
              <div className="chat-message ai">
                <img src={logo} alt="AI Avatar" className="chat-avatar" />
                <div className="chat-bubble typing-bubble">
                  <span className="typing-dots"></span>
                </div>
              </div>
            )}

          </div>
          <div className="chatbot-input-area">
            <input 
              ref={chatInputRef} 
              type="text" 
              placeholder="Type your message..." 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
        </div>
      </div>

      <div className="bottom-nav">
        <div className={`nav-tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => handleTabChange('overview')}>Overview</div>
        <div className={`nav-tab ${activeTab === 'budget' ? 'active' : ''}`} onClick={() => handleTabChange('budget')}>Budget</div>
        
        {/* --- UPDATED AI BUTTON --- */}
        <div className="nav-ai-input" onClick={() => openChatWithContext(DEFAULT_AI_TEXT)}>
          {/* Attached the onMouseMove listener here */}
          <div className="ai-search-box" onMouseMove={handleMouseMove}>
            {/* Wrapped text in a span so it stays clearly above the glow */}
            <span className="ai-search-text">Ask AI for anything...</span>
          </div>
        </div>
        
        <div className={`nav-tab ${activeTab === 'debt' ? 'active' : ''}`} onClick={() => handleTabChange('debt')}>Debt</div>
        <div className={`nav-tab ${activeTab === 'investments' ? 'active' : ''}`} onClick={() => handleTabChange('investments')}>Invest</div>
      </div>
    </div>
  );
}

export default App;