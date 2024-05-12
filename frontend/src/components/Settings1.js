import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './styles/Settings1.css';

function Settings1() {
    const [password, setPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [amount, setAmount] = useState(0);
    const [message, setMessage] = useState('');
    const [profilePic, setProfilePic] = useState(null); // state to hold the selected file
    // State to hold the profile picture URL
    const [profilePicURL, setProfilePicURL] = useState(''); 
    const [selectedFileName, setSelectedFileName] = useState("");


    const handleImageUpload = () => {
        const formData = new FormData();
        formData.append('file', profilePic);

        axios.post('http://localhost:5000/upload-profile-pic', formData, {
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('token'),
                'Content-Type': 'multipart/form-data'
            }
        }).then(response => {
            setMessage(response.data.message);
            // Update the profile picture URL upon successful upload
            setProfilePicURL('http://localhost:5000/' + response.data.file_path);
        }).catch(error => {
            console.error("There was an error uploading the profile picture:", error);
            setMessage(error.response.data.error || "An error occurred.");
        });
    };

    useEffect(() => {
        // Fetch user information (e.g., username) on component mount if needed
        axios.get('http://localhost:5000/get-user-info', {
            headers: {
                Authorization: 'Bearer ' + localStorage.getItem('token')
            }
        }).then(response => {
            // Handle response here if needed
            setProfilePicURL('http://localhost:5000/' + response.data.profile_pic); 
        }).catch(error => {
            console.error("There was an error fetching user info:", error);
        });
    }, []);

    const handlePasswordChange = (event) => {
        event.preventDefault();

        const data = {
            old_password: password,
            new_password: newPassword
        };

        axios.post('http://localhost:5000/change-password', data, {
            headers: {
                Authorization: 'Bearer ' + localStorage.getItem('token')
            }
        }).then(response => {
            setMessage(response.data.message);
        }).catch(error => {
            console.error("There was an error changing the password:", error);
            setMessage(error.response.data.error || "An error occurred.");
        });
    };

    const handleDeposit = () => {
        axios.post('http://localhost:5000/deposit-money', { amount }, {
            headers: {
                Authorization: 'Bearer ' + localStorage.getItem('token')
            }
        }).then(response => {
            setMessage(response.data.message);
        }).catch(error => {
            console.error("There was an error depositing money:", error);
            setMessage(error.response.data.error || "An error occurred.");
        });
    };

    const handleWithdraw = () => {
        axios.post('http://localhost:5000/withdraw-money', { amount }, {
            headers: {
                Authorization: 'Bearer ' + localStorage.getItem('token')
            }
        }).then(response => {
            setMessage(response.data.message);
        }).catch(error => {
            console.error("There was an error withdrawing money:", error);
            setMessage(error.response.data.error || "An error occurred.");
        });
    };

    return (
        <div className="settings">
            {/* Display profile picture if available */}
            {profilePicURL && <img src={profilePicURL} alt="User Profile" className="profile-picture" />}
            <h2>Upload Profile Picture</h2>
            <div className="button-group">
                <label className="file-wrapper">
                    {selectedFileName ? selectedFileName : "Choose File"}
                    <input 
                        type="file" 
                        onChange={(e) => {
                            setProfilePic(e.target.files[0]);
                            setSelectedFileName(e.target.files[0].name); // Set the selected file name
                        }}
                        accept="image/*" // restricts to only image files
                    />
                </label>
                <button className="upload-btn" onClick={handleImageUpload}>Upload</button>
            </div>
            <h2>Change Password</h2>
            <form onSubmit={handlePasswordChange}>
                <div className="input-group">
                    <label>Current Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <div className="input-group">
                    <label>New Password</label>
                    <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                    />
                </div>
                <button type="submit">Change Password</button>
            </form>
    
            <h2>Deposit & Withdraw Money</h2>
            <div className="input-group">
                <label>Amount</label>
                <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(parseFloat(e.target.value))}
                    required
                />
            </div>
            <div className="button-group">
                <button onClick={handleDeposit}>Deposit Money</button>
                <button onClick={handleWithdraw}>Withdraw Money</button>
            </div>
    
            {message && <div className="message">{message}</div>}
        </div>
    );
}

export default Settings1;