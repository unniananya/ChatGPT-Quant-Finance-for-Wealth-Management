import React from 'react';
import { Link } from 'react-router-dom';
import './styles/Welcome.css'; // Assuming you have a CSS file named Welcome.css
import appIcon from './styles/images/app-icon-2.png';

function Welcome() {
    return (
        // <div className="welcome-container" style={{ backgroundImage: `url(${welcomeImage})` }}>
        <div className="welcome-container">
            <div className="welcome-header">
                <img src={appIcon} alt="App Icon" className="welcome-icon" />
                <h1>WealthWise</h1>
            </div>
            <div className="welcome-actions">
                <Link className="btn-welcome" to="/login">Log In</Link>
                <Link className="btn-welcome" to="/signup">Sign Up</Link>
            </div>
        </div>
    );
}

export default Welcome;