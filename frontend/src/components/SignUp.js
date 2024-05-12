import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import 'react-phone-number-input/style.css';
import PhoneInput from 'react-phone-number-input';
import './styles/SignUp.css';

function SignUp(props) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [dateOfBirth, setDateOfBirth] = useState('');
    const [email, setEmail] = useState('');
    const [phoneNo, setPhoneNo] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [progress, setProgress] = useState(0);

    const dateInputRef = useRef(null);
    const openCalendar = () => {
        if(dateInputRef.current) {
            dateInputRef.current.click();
        }
    };

    const [currentStep, setCurrentStep] = useState(1);
    const navigate = useNavigate();


    const getProgressBarColor = (progress) => {
        if (progress < 14.3) return '#7cbeff'; // Light blue for the first question#00BFFF
        if (progress < 28.6) return '#41a0ff'; // Sky blue
        if (progress < 42.9) return '#0683ff'; // Dodger blue
        if (progress < 57.1) return '#005bb7'; // Azure blue
        if (progress < 71.4) return '#4169E1'; // Royal blue
        if (progress < 85.7) return '#005bb7'; // Blue
        if (progress < 100) return "#0066cd"
        return '#0066cd'; // Dark blue for the last question
    };

    useEffect(() => {
        // Calculate progress
        const fields = [username, password, firstName, lastName, dateOfBirth, email, phoneNo];
        const filledFields = fields.filter(Boolean).length; // Count how many fields are not empty
        const totalFields = fields.length;
        const progressPercentage = (filledFields / totalFields) * 100;

        setProgress(progressPercentage);
    }, [username, password, firstName, lastName, dateOfBirth, email, phoneNo]);

    const handleSignUp = async () => {
        try {
            const response = await axios.post('http://localhost:5000/signup', {
                username,
                password,
                first_name: firstName,
                last_name: lastName,
                date_of_birth: dateOfBirth,
                email,
                phone_no: phoneNo
            });

            localStorage.setItem('token', response.data.token);
            props.onSuccessfulSignUp();
            navigate('/questionnaire');

        } catch (error) {
            console.error("Error during sign up:", error);
            setErrorMessage('Signup failed! Please try again.');
        }
    };

    return (
        <div className="signup-container">
            <h2 className="signup-title">Welcome to WealthWise!</h2>
            <h3 className="signup-subtitle">Please fill in your particulars to register your profile.</h3>
            <div className="progress-bar-container">
                <div className="progress-bar" style={{width: `${progress}%`, backgroundColor: getProgressBarColor(progress)}}></div>
            </div>
            {/* Conditionally render input fields based on the current step */}
            {currentStep === 1 && (
                <>
                    <label className="signup-label">Enter your username:</label>
                    <div className="input-icon-wrapper">
                        <input className="signup-input" type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} />
                        <i className="material-icons input-icon">person_outline</i>
                    </div>

                    <label className="signup-label">Create a password:</label>
                    <div className="input-icon-wrapper">
                        <input className="signup-input" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
                        <i className="material-icons input-icon">lock_outline</i>
                    </div>

                    <label className="signup-label">What's your first name?</label>
                    <div className="input-icon-wrapper">
                        <input className="signup-input" type="text" placeholder="First Name" value={firstName} onChange={e => setFirstName(e.target.value)} />
                        <i className="material-icons input-icon">person_outline</i>
                    </div>

                    <label className="signup-label">And your last name?</label>
                    <div className="input-icon-wrapper">
                        <input className="signup-input" type="text" placeholder="Last Name" value={lastName} onChange={e => setLastName(e.target.value)} />
                        <i className="material-icons input-icon">person_outline</i>
                    </div>

                    <button className="next-back-button" onClick={() => setCurrentStep(2)}>
                        <span class="material-icons-outlined">
                        chevron_right
                        </span>
                    </button>
                </>
            )}

            {currentStep === 2 && (
                <>
                    <label className="signup-label">When were you born?</label>
                    <div className="input-icon-wrapper">
                        <input ref={dateInputRef} className="signup-input" type="date" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} style={{ WebkitAppearance: 'none' }} />
                        <i className="material-icons input-icon date-icon" onClick={openCalendar}>calendar_today</i>
                    </div>

                    <label className="signup-label">Your email address:</label>
                    <div className="input-icon-wrapper">
                        <input className="signup-input" type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
                        <i className="material-icons input-icon">mail_outline</i>
                    </div>

                    <label className="signup-label">Your phone number:</label>
                    <div className="input-icon-wrapper">
                        <PhoneInput
                            className="signup-input"
                            placeholder="Enter phone number"
                            value={phoneNo}
                            onChange={setPhoneNo}
                        />
                        <i className="material-icons input-icon">call</i>
                    </div>

                    <button className="next-back-button" onClick={() => setCurrentStep(1)} style={{ marginRight: '10px' }}>
                        <span class="material-icons-outlined">
                        chevron_left
                        </span>
                    </button>
                    <button className="signup-button" onClick={handleSignUp}>Sign Up</button>
                </>
            )}

            {errorMessage && <p className="signup-error">{errorMessage}</p>}
        </div>
    );
}

export default SignUp;