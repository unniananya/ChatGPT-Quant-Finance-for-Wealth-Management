import React , { useState, useEffect } from 'react';
import './App.css';
import './global.css'
import { BrowserRouter as Router, Route, Routes, Navigate,useLocation } from 'react-router-dom';
import axios from 'axios';

import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import Portfolio from './components/Portfolio';
import RiskAnalysis from './components/RiskAnalysis';
import Settings1 from './components/Settings1';
import Settings from './components/Settings';
import ChatBot from './components/ChatBot';
import ChatBotPage from './components/ChatBotPage';
import Questionnaire from './components/Questionnaire';
import SignUp from './components/SignUp';
import Login from './components/Login';
import Welcome from './components/Welcome'; 
import FloatingChatbotButton from './components/FloatingChatbotButton';
import DashboardDataContext from './components/DashboardDataContext';
import Overview from './components/Overview';
import Assets from './components/Assets';
import Projections from './components/Projections';
import FinancialTransactions from './components/FinancialTransactions';
import TransactionHistory from './components/TransactionHistory';
import Goals from './components/Goals';
import Learn from './components/Learn';
import LearnChat from './components/LearnChat';
import PaperTradingStage1 from './components/PaperTradingStage1';
import PaperTradingStage2 from './components/PaperTradingStage2';
import PaperTradingStage3 from './components/PaperTradingStage3';
import CreatePortfolio from './components/CreatePortfolio';

function withRouterInfo(Component) {
  return function WrappedComponent(props) {
    const location = useLocation();
    return <Component {...props} location={location} />;
  };
}

// const FloatingChatbotButtonWithRouterInfo = withRouterInfo(function(props) {
//   return props.location.pathname !== '/chatbot' ? 
//          <FloatingChatbotButton onClick={() => props.setShowChatbot(true)} /> : null;
// });


const FloatingChatbotButtonWithRouterInfo = withRouterInfo(function(props) {
  // Show the chatbot if the user is authenticated or if they're on the questionnaire page
  const shouldShowChatbot = props.isAuthenticated || props.location.pathname === '/questionnaire';
  return shouldShowChatbot && props.location.pathname !== '/chatbot' ? 
         <FloatingChatbotButton onClick={() => props.setShowChatbot(true)} /> : null;
});

function App() {
  const [showChatbot, setShowChatbot] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasCompletedQuestionnaire, setHasCompletedQuestionnaire] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  // Initialize dashboardData with data from local storage
  const storedData = localStorage.getItem('dashboardData');
  const initialData = storedData ? JSON.parse(storedData) : null;

  const [dashboardData, setDashboardData] = useState(initialData);
  // const location = useLocation();

  useEffect(() => {
    const checkQuestionnaireCompletion = async () => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const response = await axios.get('http://localhost:5000/get-scores', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                setIsAuthenticated(true);
                if (response.data.scores && response.data.scores.length > 0) {
                    setHasCompletedQuestionnaire(true);
                } else {
                    setHasCompletedQuestionnaire(false);
                }
            } catch (error) {
                console.error("Error checking scores:", error);
                setHasCompletedQuestionnaire(false);
            }
        }
      };

      checkQuestionnaireCompletion();
  }, [isAuthenticated]);

  useEffect(() => {
    if (isLoggingOut) {
      setIsLoggingOut(false);
    }
  }, [isLoggingOut]);

  const afterLoginOrSignUp = () => {
      setIsAuthenticated(true);
  };

  const logout = () => {
    // localStorage.removeItem('token');
    // localStorage.removeItem('dashboardData');
    localStorage.clear();
    setIsAuthenticated(false);
    setHasCompletedQuestionnaire(false);
    setIsLoggingOut(true);
  };

  return (
    <DashboardDataContext.Provider value={{ dashboardData, setDashboardData }}>
      <Router>
          <div className="app-container">
              {isLoggingOut && <Navigate to="/" replace />}
              <Navbar isAuthenticated={isAuthenticated} hasCompletedQuestionnaire={hasCompletedQuestionnaire} onLogout={logout} />
              <Routes>
                  <Route path="/signup" element={<SignUp onSuccessfulSignUp={afterLoginOrSignUp} />} />
                  <Route path="/login" element={<Login onSuccessfulLogin={afterLoginOrSignUp} />} />
                  <Route path="/portfolio" element={isAuthenticated ? <Portfolio /> : <Navigate to="/login" />} />
                  <Route path="/portfolio/*" element={isAuthenticated ? <Portfolio /> : <Navigate to="/login" />} />
                  <Route path="/risk-analysis" element={isAuthenticated ? <RiskAnalysis /> : <Navigate to="/login" />} />
                  <Route path="/papertrading-stage1" element={isAuthenticated ? <PaperTradingStage1 /> : <Navigate to="/login" />} />
                  <Route path="/papertrading-stage2" element={isAuthenticated ? <PaperTradingStage2 /> : <Navigate to="/login" />} />
                  <Route path="/papertrading-stage3" element={isAuthenticated ? <PaperTradingStage3 /> : <Navigate to="/login" />} />
                  <Route path="/create-portfolio" element={isAuthenticated ? <CreatePortfolio /> : <Navigate to="/login" />} />
                  <Route path="/goals" element={isAuthenticated ? <Goals /> : <Navigate to="/login" />} />
                  <Route path="/learn" element={isAuthenticated ? <Learn /> : <Navigate to="/login" />} />
                  <Route path="/learn-chat" element={isAuthenticated ? <LearnChat /> : <Navigate to="/login" />} />
                  {/* <Route path="/chatbot" element={isAuthenticated ? <ChatBotPage /> : <Navigate to="/login" />} /> */}
                  {/* <Route path="/settings1" element={isAuthenticated ? <Settings1 /> : <Navigate to="/login" />} /> */}
                  <Route path="/settings" element={isAuthenticated ? <Settings /> : <Navigate to="/login" />} />
                  <Route path="/financial-transactions" element={isAuthenticated ? <FinancialTransactions /> : <Navigate to="/login" />} />
                  <Route path="/transaction-history" element={isAuthenticated ? <TransactionHistory /> : <Navigate to="/login" />} />
                  {/* <Route path="/questionnaire" element={isAuthenticated && !hasCompletedQuestionnaire ? <Questionnaire onCompletion={setHasCompletedQuestionnaire} /> : <Navigate to="/dashboard" />} /> */}
                  <Route path="/questionnaire" element={isAuthenticated ? <Questionnaire onCompletion={setHasCompletedQuestionnaire} /> : <Navigate to="/login" />} />
                  {/* <Route path="/dashboard" element={isAuthenticated ? (hasCompletedQuestionnaire ? <Dashboard /> : <Navigate to="/questionnaire" />) : <Navigate to="/login" />} /> */}
                  <Route path="/dashboard" element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} />
                  <Route path="/dashboard/:portfolioName" element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} />
                  <Route path="/portfolio/overview/:portfolioName" element={isAuthenticated ? <Portfolio /> : <Navigate to="/login" />} />
                  <Route path="/" element={<Welcome />} />  {/* <-- Added the Welcome route */}
              </Routes>
              {/* {location.pathname !== '/chatbot' && <FloatingChatbotButton onClick={() => setShowChatbot(true)} />} */}
              <FloatingChatbotButtonWithRouterInfo setShowChatbot={setShowChatbot} isAuthenticated={isAuthenticated}/>
              {showChatbot && <ChatBot closeChatbot={() => setShowChatbot(false)} />} {/* Pass closeChatbot prop */}
          </div>
      </Router>
    </DashboardDataContext.Provider>
  );
}

export default App;
