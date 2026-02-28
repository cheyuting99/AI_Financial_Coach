// src/App.tsx
import { useState } from 'react';
import './App.css';

// --- MOCK DATA ---
const AI_LOREM_TEXT = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum.";

const MOCK_NET_WORTH = 145250.00;
const MOCK_TOTAL_DEBT = 24500.00;

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
  // New state to manage chat messages
  const [messages, setMessages] = useState([
    { id: 1, text: "Hello! How can I help you analyze your finances today?", sender: 'ai' }
  ]);

  // Helper to change tabs and close chat overlay simultaneously
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
      <div className="chart-container">
        [ Line Graph: Net Worth History Over Time ]
      </div>
    </div>
  );

  const renderBudget = () => (
    <div className="page-container">
      <h1>Budgeting Overview</h1>
      <div className="budget-layout">
        <div className="chart-container pie-chart">
          [ Pie Chart: Spending Categories ]
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
      <div className="chart-container">
        [ Line Graph: Debt Amount History ]
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
      <div className="chart-container">
        [ Line Graph: Stock Portfolio Net Worth ]
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
      
      {/* MAIN CONTENT AREA */}
      <div className={`content-area ${isChatOpen ? 'blurred' : ''}`}>
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'budget' && renderBudget()}
        {activeTab === 'debt' && renderDebt()}
        {activeTab === 'investments' && renderInvestments()}
      </div>

      {/* AI CHATBOT OVERLAY */}
      {isChatOpen && (
        <div className="chatbot-overlay">
          <div className="chatbot-window">
            <div className="chatbot-header">
              <h3>Financial AI Coach</h3>
              <button className="close-btn" onClick={closeChat}>&times;</button>
            </div>
            
            <div className="chatbot-body">
              {messages.map((msg) => (
                <div key={msg.id} className={`chat-message ${msg.sender}`}>
                  {msg.sender === 'ai' && (
                    <div className="chat-avatar">
                      {/* You can drop an <img src="..." /> in here later */}
                    </div>
                  )}
                  <div className="chat-bubble">
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            <div className="chatbot-input-area">
              <input type="text" placeholder="Type your message..." />
            </div>
          </div>
        </div>
      )}

      {/* BOTTOM NAVIGATION BAR */}
      <div className="bottom-nav">
        <div 
          className={`nav-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => handleTabChange('overview')}
        >
          Overview
        </div>
        
        <div 
          className={`nav-tab ${activeTab === 'budget' ? 'active' : ''}`}
          onClick={() => handleTabChange('budget')}
        >
          Budget
        </div>
        
        {/* CENTER AI BUTTON (Tab 3) */}
        <div className="nav-ai-input" onClick={openChat}>
          <div className="ai-search-box">
            Ask AI for anything...
          </div>
        </div>
        
        <div 
          className={`nav-tab ${activeTab === 'debt' ? 'active' : ''}`}
          onClick={() => handleTabChange('debt')}
        >
          Debt
        </div>
        
        <div 
          className={`nav-tab ${activeTab === 'investments' ? 'active' : ''}`}
          onClick={() => handleTabChange('investments')}
        >
          Invest
        </div>
      </div>

    </div>
  );
}

export default App;