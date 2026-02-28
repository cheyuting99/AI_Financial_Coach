// src/App.tsx
import { useState, useEffect, useRef } from 'react';
import { 
  LineChart, Line, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import logo from './assets/logo.png'; 
import './App.css';
import WatsonChatEmbed from "./components/WatsonChatEmbed"; // RESTORED

// --- FALLBACK MOCK DATA ---
const BUDGET_AI_TEXT = "Your Housing category takes up the largest portion of your budget at $2,000. Consider reviewing your utility and subscription costs to find extra savings.";
const DEBT_AI_TEXT = "You currently owe $24,500. At your current payoff rate, you are on track to be debt-free in 18 months. Keep up the great work!";
const INVEST_AI_TEXT = "Your portfolio has grown consistently. Tech stocks like NVDA are driving your gains, but you may want to consider diversifying into more index funds.";
const DEFAULT_AI_TEXT = "Hello! How can I help you analyze your finances today?";

const MOCK_NET_WORTH = 145250.00;
const MOCK_TOTAL_DEBT = 24500.00;

const FALLBACK_NET_WORTH_HISTORY = [
  { date: 'Jan', amount: 130000 }, { date: 'Feb', amount: 135000 },
  { date: 'Mar', amount: 132000 }, { date: 'Apr', amount: 145250 },
];

const FALLBACK_BUDGET_DATA = [
  { category: 'Housing', amount: 2000, color: '#FF6384' },
  { category: 'Food', amount: 600, color: '#36A2EB' },
  { category: 'Transport', amount: 400, color: '#FFCE56' },
  { category: 'Entertainment', amount: 300, color: '#4BC0C0' },
];

const FALLBACK_DEBT_HISTORY = [
  { date: 'Jan', amount: 28000 }, { date: 'Feb', amount: 26500 },
  { date: 'Mar', amount: 25000 }, { date: 'Apr', amount: 24500 },
];

const FALLBACK_INVESTMENT_HISTORY = [
  { date: 'Jan', amount: 85000 }, { date: 'Feb', amount: 88000 },
  { date: 'Mar', amount: 86000 }, { date: 'Apr', amount: 92000 },
];

const MOCK_STOCKS = [
  { id: 1, name: 'Apple (AAPL)', change: '+1.2%', isPositive: true },
  { id: 2, name: 'Tesla (TSLA)', change: '-0.8%', isPositive: false },
  { id: 3, name: 'S&P 500 (VOO)', change: '+0.5%', isPositive: true },
  { id: 4, name: 'Nvidia (NVDA)', change: '+3.4%', isPositive: true }
];

// --- MONTH DEFINITIONS FOR PIE CHART ---
const MONTHS = [
  { label: 'JAN', start: '2024-01-01', end: '2024-01-31' },
  { label: 'FEB', start: '2024-02-01', end: '2024-02-29' },
  { label: 'MAR', start: '2024-03-01', end: '2024-03-31' },
  { label: 'APR', start: '2024-04-01', end: '2024-04-30' },
  { label: 'MAY', start: '2024-05-01', end: '2024-05-31' },
  { label: 'JUN', start: '2024-06-01', end: '2024-06-30' },
  { label: 'JUL', start: '2024-07-01', end: '2024-07-31' },
  { label: 'AUG', start: '2024-08-01', end: '2024-08-31' },
  { label: 'SEP', start: '2024-09-01', end: '2024-09-30' },
  { label: 'OCT', start: '2024-10-01', end: '2024-10-31' },
  { label: 'NOV', start: '2024-11-01', end: '2024-11-30' },
  { label: 'DEC', start: '2024-12-01', end: '2024-12-31' },
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

  // Dynamic Header Totals
  const [totalBudget, setTotalBudget] = useState<number>(0);
  const [totalDebt, setTotalDebt] = useState<number>(MOCK_TOTAL_DEBT);
  const [netWorth, setNetWorth] = useState<number>(MOCK_NET_WORTH);

  // Graph Data States
  const [budgetData, setBudgetData] = useState(FALLBACK_BUDGET_DATA);
  const [debtHistory, setDebtHistory] = useState(FALLBACK_DEBT_HISTORY);
  const [netWorthHistory, setNetWorthHistory] = useState(FALLBACK_NET_WORTH_HISTORY);
  const [investmentHistory, setInvestmentHistory] = useState(FALLBACK_INVESTMENT_HISTORY);

  // Pie Chart Month Tracker
  const [monthIndex, setMonthIndex] = useState<number>(0); 

  const chatInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- AUTO-SCROLL EFFECT ---
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // --- FETCH GENERAL BACKEND DATA ---
  useEffect(() => {
    const fetchBackendData = async () => {
      try {
        const API_BASE_URL = 'http://localhost:8000'; 

        const debtListRes = await fetch(`${API_BASE_URL}/debt/list`);
        if (debtListRes.ok) {
          const debtList = await debtListRes.json();
          const currentTotalDebt = debtList.reduce((sum: number, debt: any) => sum + debt.balance, 0);
          setTotalDebt(currentTotalDebt);
        }

        const debtRes = await fetch(`${API_BASE_URL}/debt/plan?schedule_months=12`);
        if (debtRes.ok) {
          const rawDebtData = await debtRes.json();
          if (rawDebtData.schedule_preview) {
            const mappedDebt = rawDebtData.schedule_preview.map((monthData: any) => {
              const totalRemainingBalance = monthData.debts.reduce(
                (sum: number, debt: any) => sum + debt.ending_balance, 0
              );
              return {
                date: `Month ${monthData.month}`,
                amount: totalRemainingBalance
              };
            });
            setDebtHistory(mappedDebt);
          }
        }
      } catch (error) {
        console.error("Failed to connect to backend for general data.", error);
      }
    };
    fetchBackendData();
  }, []);

  // --- FETCH MONTHLY BUDGET DATA (Triggers on arrow click) ---
  useEffect(() => {
    const fetchBudgetData = async () => {
      try {
        const API_BASE_URL = 'http://localhost:8000'; 
        const month = MONTHS[monthIndex]; 

        const budgetSummaryRes = await fetch(`${API_BASE_URL}/spend/summary?start=${month.start}&end=${month.end}`);
        if (budgetSummaryRes.ok) {
          const summaryData = await budgetSummaryRes.json();
          setTotalBudget(summaryData.total_spend || 0); 
        } else {
          setTotalBudget(0);
        }

        const budgetRes = await fetch(`${API_BASE_URL}/spend/top_categories?k=5&start=${month.start}&end=${month.end}`); 
        if (budgetRes.ok) {
          const rawBudgetData = await budgetRes.json();
          const chartColors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'];

          const mappedBudget = rawBudgetData.map((item: any, index: number) => ({
            category: item.Category,
            amount: item.total_spend,
            color: chartColors[index % chartColors.length]
          }));
          setBudgetData(mappedBudget);
        } else {
          setBudgetData([]);
        }

      } catch (error) {
        console.error("Failed to connect to backend for budget data.", error);
      }
    };
    fetchBudgetData();
  }, [monthIndex]); 

  // Splash Screen Lifecycle
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
  
  // Chat Focus Lifecycle
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

  // IBM WATSON FETCH LOGIC
  const handleSendMessage = async () => {
    if (!inputText.trim()) return;
    
    const userText = inputText;
    
    const newUserMessage = {
      id: Date.now(),
      text: userText,
      sender: 'user' as const
    };
    setMessages((prev) => [...prev, newUserMessage]);
    setInputText('');
    setIsTyping(true);

    try {
      const response = await fetch("http://localhost:8000/agent/chat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ text: userText })
});

if (response.ok) {
  const data = await response.json();
  const aiReply = data.reply || "No reply returned.";
  setMessages((prev) => [...prev, { id: Date.now() + 1, text: aiReply, sender: "ai" }]);
} else {
  throw new Error(`Backend responded with status: ${response.status}`);
}
    } catch (error) {
      console.error("Agent Connection Error:", error);
      setMessages((prev) => [...prev, { 
        id: Date.now() + 1, 
        text: "Error: The browser blocked the direct connection to the agent (CORS). If this happens, route the request through your FastAPI backend.", 
        sender: 'ai' 
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSendMessage();
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setIsChatOpen(false);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const rect = target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    target.style.setProperty('--mouse-x', `${x}px`);
    target.style.setProperty('--mouse-y', `${y}px`);
  };

  // --- PAGE COMPONENTS ---
  const renderOverview = () => (
    <div className="page-container">
      <h1>Net Worth Overview</h1>
      <h2>${netWorth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD</h2>
      <div className="chart-container" style={{ height: '300px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={netWorthHistory}>
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
      
      {/* Month Selector UI */}
      <div className="month-selector">
        <div className="month-arrow-container" onClick={() => monthIndex > 0 && setMonthIndex(monthIndex - 1)}>
          {monthIndex > 0 ? (
            <>
              <span className="month-arrow-label">{MONTHS[monthIndex - 1].label}</span>
              <span className="month-arrow">{"\u25C0"}</span> 
            </>
          ) : <div style={{width: '60px'}}></div>}
        </div>

        <div className="current-month-display">
          <div className="current-month-label">{MONTHS[monthIndex].label} 2024</div>
          <h2>${totalBudget.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD Spent</h2>
        </div>

        <div className="month-arrow-container" onClick={() => monthIndex < MONTHS.length - 1 && setMonthIndex(monthIndex + 1)}>
          {monthIndex < MONTHS.length - 1 ? (
            <>
              <span className="month-arrow-label">{MONTHS[monthIndex + 1].label}</span>
              <span className="month-arrow">{"\u25B6"}</span>
            </>
          ) : <div style={{width: '60px'}}></div>}
        </div>
      </div>

      <div className="chart-container" style={{ height: '350px', display: 'block' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie 
              data={budgetData} 
              dataKey="amount" 
              nameKey="category" 
              cx="50%" cy="45%" 
              innerRadius={70} outerRadius={100} 
              paddingAngle={5} stroke="none"
            >
              {budgetData.map((entry, index) => <Cell key={`c-${index}`} fill={entry.color || '#36A2EB'} />)}
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
      <h2>${totalDebt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD Owed</h2>
      
      <div className="chart-container" style={{ height: '300px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={debtHistory}>
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
          <LineChart data={investmentHistory}>
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
          <h1 className="splash-title">Personal Finance Coach</h1>
        </div>
      )}

      <header className={`app-header ${isChatOpen ? 'blurred' : ''}`}>
        <img src={logo} alt="Cat Logo" className="app-logo" />
        <h1 className="app-title">Personal Finance Coach</h1>
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
            {/* Auto-scroll target */}
            <div ref={messagesEndRef} />
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
            
            {/* --- RESTORED WATSON EMBED --- */}
            <div className="chatbot-body" style={{ padding: 0 }}>
              <WatsonChatEmbed rootElementID="wxo-chat-root" />
            </div>
            {/* ------------------------------- */}

          </div>
        </div>
      </div>

      <div className="bottom-nav">
        <div className={`nav-tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => handleTabChange('overview')}>Overview</div>
        <div className={`nav-tab ${activeTab === 'budget' ? 'active' : ''}`} onClick={() => handleTabChange('budget')}>Budget</div>
        
        <div className="nav-ai-input" onClick={() => openChatWithContext(DEFAULT_AI_TEXT)}>
          <div className="ai-search-box" onMouseMove={handleMouseMove}>
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