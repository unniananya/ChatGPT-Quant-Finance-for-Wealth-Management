import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './styles/Navbar.css';
import appIcon from './styles/images/app-icon-2.png';
import { FaCaretRight, FaCaretLeft } from 'react-icons/fa';


function Navbar({ isAuthenticated, hasCompletedQuestionnaire, onLogout }) {
    const [userInfo, setUserInfo] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);

    useEffect(() => {
        if (isAuthenticated && hasCompletedQuestionnaire) {
            const fetchUserInfo = async () => {
                try {
                    const response = await axios.get('http://localhost:5000/get-user-info', {
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        }
                    });
                    setUserInfo(response.data);
                } catch (error) {
                    console.error('Error fetching user info:', error);
                }
            };

            fetchUserInfo();
        }
    }, [isAuthenticated, hasCompletedQuestionnaire]);

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    const toggleDropdown = () => {
        setShowDropdown(!showDropdown);
    };

    if (!isAuthenticated || !hasCompletedQuestionnaire) {
        return null;
    }

    return (
        <nav>
        <div className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
            <button className="toggle-button" onClick={toggleSidebar}>
                {/* <i className="fas fa-bars"></i> */}
                {/* <img src={appIcon} alt="Toggle Sidebar" /> */}
                <img src={appIcon} alt="App Icon" className="app-icon" />
                {sidebarOpen && <span className="app-name">WealthWise</span>}
            </button>
            <ul>
                <li>
                    <Link to="/dashboard" onClick={toggleSidebar}>
                        {/* <i className="fas fa-home"></i> */}
                        <i className="material-icons-outlined">dashboard</i>
                        {/* <img src={dashboardIcon} alt="Dashboard" className="icon" /> */}
                        {sidebarOpen && <span>Dashboard</span>}
                    </Link>
                </li>
                <li>
                    <Link to="/portfolio/overview" onClick={toggleSidebar}>
                        {/* <i className="fas fa-briefcase"></i> */}
                        <i className="material-icons-outlined">pie_chart_outline</i>
                        {/* <img src={portfolioIcon} alt="Portfolio" className="icon" /> */}
                        {sidebarOpen && <span>Portfolio</span>}
                    </Link>
                </li>
                <li>
                    <Link to="/goals" onClick={toggleSidebar}>
                        {/* <i className="fas fa-chart-line"></i> */}
                        <i className="material-icons-outlined">flag</i>
                        {/* <img src={riskAnalysisIcon} alt="Risk Analysis" className="icon" /> */}
                        {sidebarOpen && <span>Goals</span>}
                    </Link>
                </li>
                <li>
                    <Link to="/learn-chat" onClick={toggleSidebar}>
                    {/* <Link to="/papertrading-stage1" onClick={toggleSidebar}> */}
                        {/* <i className="fas fa-chart-line"></i> */}
                        <i className="material-icons-outlined">school</i>
                        {/* <img src={riskAnalysisIcon} alt="Risk Analysis" className="icon" /> */}
                        {sidebarOpen && <span>Learn Finance</span>}
                    </Link>
                </li>
                <li>
                    <Link to="/papertrading-stage3" onClick={toggleSidebar}>
                        {/* <i className="fas fa-chart-line"></i> */}
                        <i className="material-icons-outlined">analytics</i>
                        {/* <img src={riskAnalysisIcon} alt="Risk Analysis" className="icon" /> */}
                        {sidebarOpen && <span>Portfolio Contruction</span>}
                    </Link>
                </li>
                <li>
                    <Link to="/create-portfolio" onClick={toggleSidebar}>
                        {/* <i className="fas fa-chart-line"></i> */}
                        <i className="material-icons-outlined">add_box</i>
                        {/* <img src={riskAnalysisIcon} alt="Risk Analysis" className="icon" /> */}
                        {sidebarOpen && <span>Create Portfolio</span>}
                    </Link>
                </li>
                {/* <li>
                    <Link to="/questionnaire" onClick={toggleSidebar}>
                        <i className="material-icons-outlined">question_answer</i>
                        {sidebarOpen && <span>Questionnaire</span>}
                    </Link>
                </li> */}
                {/* <li>
                    <Link to="/chatbot" onClick={toggleSidebar}>
                        <i className="material-icons-outlined">chat</i>
                        {sidebarOpen && <span>ChatBot</span>}
                    </Link>
                </li> */}
                {/* <li>
                    <Link to="/" onClick={(e) => { e.preventDefault(); onLogout(); }}>
                        <i className="material-icons-outlined">logout</i>
                        {sidebarOpen && <span>Logout</span>}
                    </Link>
                </li> */}
            
            {userInfo && (
                <li className="profile-container" onClick={toggleDropdown}>
                    <img 
                        src={`http://localhost:5000/${userInfo.profile_pic}`} 
                        alt={userInfo.username} 
                        className="profile-picture"
                    />
                    {/* {sidebarOpen && <span className="profile-name">{userInfo.username}</span>} */}
                    {sidebarOpen && (
                        <>
                            <span className="profile-name">{userInfo.username}</span>
                            <i onClick={toggleDropdown} className={`profile-dropdown-icon ${showDropdown ? 'open' : ''}`}>
                                {showDropdown ? <FaCaretLeft /> : <FaCaretRight />}
                            </i>
                        </>
                    )}
                    {showDropdown && (
                            <div className="dropdown-menu">
                                <Link to="/settings" className="dropdown-item">
                                    <i className="material-icons-outlined">settings</i>
                                    Settings
                                </Link>
                                <Link to="/questionnaire" className="dropdown-item">
                                    <i className="material-icons-outlined">quiz</i>
                                    Risk Assessment
                                </Link>
                                {/* <Link to="/questionnaire" className="dropdown-item">Questionnaire</Link> */}
                                {/* <Link to="/financial-transactions" className="dropdown-item">Deposit or Withdraw</Link> */}
                                {/* <Link to="/transaction-history" className="dropdown-item">Transaction History</Link> */}
                                {/* Add other links as needed */}
                                <Link to="/" onClick={onLogout} className="dropdown-item">
                                    <i className="material-icons-outlined">logout</i>
                                    Logout
                                </Link>
                                {/* <li><Link to="/" onClick={(e) => { e.preventDefault(); onLogout(); }} className="dropdown-item">Logout</Link></li> */}
                            </div>
                        )}
                </li>
            )}
            </ul>
        </div>
        </nav>
    );
}

export default Navbar;