import React, { useState } from 'react';
import axios from 'axios';
import { Navigate } from 'react-router-dom'; // <-- import Navigate
import './styles/Login.css';

function Login(props) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState(''); // To store and display any login errors
    const [redirectToDashboard, setRedirectToDashboard] = useState(false); // <-- New state for redirection

    const handleLogin = async () => {
        try {
            const response = await axios.post('http://localhost:5000/login', {
                username,
                password
            });

            props.onSuccessfulLogin(); // This prop is passed from App.js to handle logic after a successful login

            // If login is successful, store the token and call the onSuccessfulLogin prop
            localStorage.setItem('token', response.data.token);
            setRedirectToDashboard(true); // <-- Set redirection state after successful login

            // Redirect to the dashboard after successful login
            // window.location.href = "/dashboard";
        } catch (error) {
            console.error("Error during login:", error);
            setErrorMessage('Login failed! Please check your credentials and try again.'); // Display error if login fails
        }
    };

    // Redirect to the dashboard if redirectToDashboard is true
    if (redirectToDashboard) {
        return <Navigate to="/dashboard" />;
    }

    return (
        <div className="login-container">
            <h2 className="login-title">Welcome back to WealthWise!</h2>
            <h3 className="login-subtitle">Please input your username and password to login.</h3>
            <div className="input-icon-wrapper">
                <input className="login-input" type="text" placeholder="Username" onChange={e => setUsername(e.target.value)} />
                <i className="material-icons input-icon">person_outline</i>
            </div>
            <div className="input-icon-wrapper">
                <input className="login-input" type="password" placeholder="Password" onChange={e => setPassword(e.target.value)} />
                <i className="material-icons input-icon">lock_outline</i>
            </div>
            <button className="login-button" onClick={handleLogin}>Login</button>
            {errorMessage && <p className="login-error">{errorMessage}</p>}
        </div>
    );
}

export default Login;