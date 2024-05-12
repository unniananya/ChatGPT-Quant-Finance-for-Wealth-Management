import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './styles/Settings.css';

const ProfilePictureSection = ({ onUpload, profilePicURL, userInfo, onUpdateUserInfo }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [editableUserInfo, setEditableUserInfo] = useState({ ...userInfo });

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);
    setSelectedFileName(file.name);
  };

  const handleUpload = () => {
    onUpload(selectedFile);
  };

  const handleUserInfoChange = (e) => {
    const { name, value } = e.target;
    setEditableUserInfo((prevInfo) => ({
      ...prevInfo,
      [name]: value,
    }));
  };

  const handleUpdateUserInfo = () => {
    onUpdateUserInfo(editableUserInfo);
  };

  return (
    <div className="profile-picture-section">
      {profilePicURL && <img src={profilePicURL} alt="Profile" />}
      <div className="username">{userInfo.username}</div>
      {/* <h2>Upload Profile Picture</h2> */}
      <div className="button-group">
        <label className="file-wrapper">
          {selectedFileName || " No File Chosen"}
          <input 
            type="file" 
            onChange={handleFileChange}
            accept="image/*"
          />
        </label>
        <button className="upload-btn" onClick={handleUpload}>Upload</button>
      </div>
      <div className="user-info">
        <label>First Name:</label>
        <div className="input-icon-wrapper">
            <input type="text" name="first_name" value={editableUserInfo.first_name} onChange={handleUserInfoChange} />
            <i className="material-icons input-icon">person_outline</i>
        </div>
        <label>Last Name:</label>
        <div className="input-icon-wrapper">
            <input type="text" name="last_name" value={editableUserInfo.last_name} onChange={handleUserInfoChange} />
            <i className="material-icons input-icon">person_outline</i>
        </div>
        <label>Email:</label>
        <div className="input-icon-wrapper">
            <input type="email" name="email" value={editableUserInfo.email} onChange={handleUserInfoChange} />
            <i className="material-icons input-icon">mail_outline</i>
        </div>
        <label>Date of Birth:</label>
        <div className="input-icon-wrapper">
            <input type="text" name="date_of_birth" value={editableUserInfo.date_of_birth} onChange={handleUserInfoChange} />
            <i className="material-icons input-icon date-icon">calendar_today</i>
        </div>
        <label>Phone No:</label>
        <div className="input-icon-wrapper">
            <input type="text" name="phone_no" value={editableUserInfo.phone_no} onChange={handleUserInfoChange} />
            <i className="material-icons input-icon">call</i>
        </div>
      </div>
      <button className="update-user-info-btn" onClick={handleUpdateUserInfo}>Update Info</button>
    </div>
  );
};

const PasswordSection = ({ onChangePassword }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    if (newPassword !== confirmNewPassword) {
      setPasswordError('New Password and Confirm New Password do not match.');
      return;
    }
    // Proceed with password change
    setPasswordError(''); // Clear any previous error message
    onChangePassword(currentPassword, newPassword);
  };

  return (
    <div className="password-section">
      <h2 className='password-heading'>Change Password</h2>
      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label>Current Password: </label>
          <div className="input-icon-wrapper">
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
            <i className="material-icons input-icon">lock_outline</i>
          </div>
        </div>
        <div className="input-group">
          <label>New Password: </label>
          <div className="input-icon-wrapper">
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <i className="material-icons input-icon">lock_outline</i>
          </div>
        </div>
        <div className="input-group">
          <label>Confirm New Password: </label>

          <div className="input-icon-wrapper">
            <input
              type="password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              required
            />
            <i className="material-icons input-icon">lock_outline</i>
          </div>
        </div>
        <button className='submit-password' type="submit">Change Password</button>
      </form>
    </div>
  );
};

const WatchlistSection = () => {
  const [watchlistItems, setWatchlistItems] = useState([]);

  useEffect(() => {
    // Fetch watchlist items
    const fetchWatchlistItems = async () => {
      try {
        const response = await axios.get('http://localhost:5000/get-user-watchlist', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        setWatchlistItems(response.data.watchlist);
      } catch (error) {
        console.error('Error fetching watchlist:', error);
      }
    };

    fetchWatchlistItems();
  }, []);


  const handleAddStock = () => {
    // Implement the functionality to add a stock
    console.log("Add stock functionality to be implemented");
  };

  const handleRemoveFromWatchlist = async (itemToRemove) => {
    // Call API to remove the item from the watchlist in the backend
    try {
      await axios.post('http://localhost:5000/remove-from-watchlist', { stockSymbol: itemToRemove.symbol }, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      // If successful, update the watchlist in the UI
      const updatedWatchlist = watchlistItems.filter(item => item.symbol !== itemToRemove.symbol);
      setWatchlistItems(updatedWatchlist);
    } catch (error) {
      console.error('Error removing item from watchlist:', error);
    }
  };

  return (
    <div className="watchlist-section">
      <div className="watchlist-title-container">
        <h2 className='watchlist-title'>Current Stock Watchlist</h2>
        <button className="add-stock-button" onClick={handleAddStock}><span className="material-icons-outlined">add</span>Add Stock</button>
      </div>
      <table className="watchlist-table">
        <thead>
          <tr>
            <th>Stock</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {watchlistItems.map(item => (
            <tr key={item.symbol}>
              <td>
                {item.name}
                <div className="stock-symbol">{item.symbol}</div>
              </td>
              <td>
                <div className="remove-button-container">
                  <button className="remove-button" onClick={() => handleRemoveFromWatchlist(item)}><span className="material-icons-outlined">close</span>Remove</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};


const DepositWithdrawSection = ({ onDeposit, onWithdraw }) => {
  const [amount, setAmount] = useState(0);
  const [portfolios, setPortfolios] = useState([]);
  const [selectedPortfolio, setSelectedPortfolio] = useState('');
  const [accountBalance, setAccountBalance] = useState(0);

  useEffect(() => {
    // Fetch portfolios
    const fetchPortfolios = async () => {
      try {
        const response = await axios.get('http://localhost:5000/get_user_portfolios', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setPortfolios(response.data);
        if (response.data.length > 0) {
          setSelectedPortfolio(response.data[0].portfolio_name); // Default to first portfolio
        }
      } catch (error) {
        console.error('Error fetching portfolios:', error);
      }
    };

    fetchPortfolios();
  }, []);

  useEffect(() => {
    // Fetch account balance whenever selectedPortfolio changes
    const fetchAccountBalance = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/get_portfolio_weights_data?portfolioName=${encodeURIComponent(selectedPortfolio)}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setAccountBalance(response.data.accountBalance); // Assuming the backend sends this data
      } catch (error) {
        console.error('Error fetching account balance:', error);
      }
    };

    if (selectedPortfolio) {
      fetchAccountBalance();
    }
  }, [selectedPortfolio]);

  const handleDepositClick = () => {
    onDeposit(amount, selectedPortfolio);
  };

  const handleWithdrawClick = () => {
    onWithdraw(amount, selectedPortfolio);
  };

  return (
    <div className="finance-section">
      <h2 className='finance-section-title'>Deposit & Withdraw Money</h2>
      <div className="input-group">
        <label>Select Your Portfolio: </label>
        <select 
          value={selectedPortfolio} 
          onChange={(e) => setSelectedPortfolio(e.target.value)}
          required
        >
          {portfolios.map((portfolio) => (
            <option key={portfolio.portfolio_name} value={portfolio.portfolio_name}>
              {portfolio.portfolio_name}
            </option>
          ))}
        </select>
      </div>
      <div className="input-group">
        <label>Current Cash in Account:</label>
        <div className="account-balance-value">${accountBalance.toFixed(2)}</div>
      </div>
      <div className="input-group">
        <label>Amount:</label>
        <div className="input-icon-wrapper">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value))}
              required
            />
            <i className="material-icons input-icon">payments</i>
        </div>
      </div>
      <div className="button-group">
        <button onClick={handleDepositClick}>Deposit Money</button>
        <button onClick={handleWithdrawClick}>Withdraw Money</button>
      </div>
    </div>
  );
};



const PaymentInformationSection = () => {
  // Placeholder for card details
  const cardDetails = {
    cardNumber: '•••• •••• •••• 1234',
    cardHolderName: 'Ananya Unnikrishnan',
    expiryMonth: '12',
    expiryYear: '34',
  };

  // Placeholder functions for future implementation
  const handleAddCard = () => console.log("Add card functionality to be implemented");
  const handleEditCard = () => console.log("Edit card functionality to be implemented");
  const handleDeleteCard = () => console.log("Delete card functionality to be implemented");

  return (
    <div className="payment-information-section">
      <h2 className='section-heading'>Payment Information</h2>
      <div className="input-group">
        <label>Card Number:</label>
        <div className="input-icon-wrapper">
            <input type="text" value={cardDetails.cardNumber} disabled />
            <i className="material-icons input-icon">credit_card</i>
        </div>
      </div>
      <div className="input-group">
        <label>Card Holder Name:</label>
        <div className="input-icon-wrapper">
            <input type="text" value={cardDetails.cardHolderName} disabled />
            <i className="material-icons input-icon">person_outline</i>
        </div>
      </div>
      <div className="input-group">
        <label>Expiry Date:</label>
        <div className="input-icon-wrapper">
            <input type="text" value={`${cardDetails.expiryMonth}/${cardDetails.expiryYear}`} disabled />
            <i className="material-icons input-icon">calendar_today</i>
        </div>
      </div>
      <div className="button-group">
        {/* <button onClick={handleAddCard}>Add Card</button> */}
        <button onClick={handleEditCard}>Edit Card</button>
        <button onClick={handleDeleteCard}>Delete Card</button>
      </div>
    </div>
  );
};


function Settings() {
    const [activeSection, setActiveSection] = useState('profile');
    const [message, setMessage] = useState('');
    const [profilePicURL, setProfilePicURL] = useState('');


    const showMessage = (newMessage) => {
      setMessage(newMessage);
      setTimeout(() => {
        setMessage('');
      }, 2000);
    };
  
    // Handling profile picture upload
    const handleImageUpload = (file) => {
      const formData = new FormData();
      formData.append('file', file);
  
      axios.post('http://localhost:5000/upload-profile-pic', formData, {
        headers: {
          'Authorization': 'Bearer ' + localStorage.getItem('token'),
          'Content-Type': 'multipart/form-data'
        }
      }).then(response => {
        showMessage(response.data.message);
        setProfilePicURL('http://localhost:5000/' + response.data.file_path);
      }).catch(error => {
        console.error("There was an error uploading the profile picture:", error);
        showMessage(error.response?.data?.error || "An error occurred.");
      });
    };
  
    // Handling password change
    const handlePasswordChange = (oldPassword, newPassword) => {
      const data = {
        old_password: oldPassword,
        new_password: newPassword
      };
  
      axios.post('http://localhost:5000/change-password', data, {
        headers: {
          'Authorization': 'Bearer ' + localStorage.getItem('token')
        }
      }).then(response => {
        showMessage(response.data.message);
      }).catch(error => {
        console.error("There was an error changing the password:", error);
        showMessage(error.response?.data?.error || "An error occurred.");
      });
    };
  
    // Handling deposit
  const handleDeposit = (amount, portfolioName) => {
    axios.post('http://localhost:5000/deposit-money', { amount, portfolioName }, {
      headers: {
        'Authorization': 'Bearer ' + localStorage.getItem('token')
      }
    }).then(response => {
      showMessage(response.data.message);
    }).catch(error => {
      console.error("There was an error depositing money:", error);
      showMessage(error.response?.data?.error || "An error occurred.");
    });
  };

  // Handling withdraw
  const handleWithdraw = (amount, portfolioName) => {
    axios.post('http://localhost:5000/withdraw-money', { amount, portfolioName }, {
      headers: {
        'Authorization': 'Bearer ' + localStorage.getItem('token')
      }
    }).then(response => {
      showMessage(response.data.message);
    }).catch(error => {
      console.error("There was an error withdrawing money:", error);
      showMessage(error.response?.data?.error || "An error occurred.");
    });
  };

  // Add states for user information
  const [userInfo, setUserInfo] = useState({
    username: '',
    first_name: '',
    last_name: '',
    email: '',
    date_of_birth: '',
    phone_no: '',
  });


  // Function to update user information
  const onUpdateUserInfo = async (updatedUserInfo) => {
    try {
      const response = await axios.put('http://localhost:5000/update-user-info', updatedUserInfo, {
        headers: {
          'Authorization': 'Bearer ' + localStorage.getItem('token'),
        },
      });
      showMessage(response.data.message);
      // Optionally, fetch user info again to reflect the updated information
      // fetchUserInfo();
    } catch (error) {
      console.error("There was an error updating user information:", error);
      showMessage(error.response?.data?.error || "An error occurred.");
    }
  };
  
    // Fetch user information on component mount
    // Modify useEffect to fetch user information
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await axios.get('http://localhost:5000/get-user-info', {
          headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') },
        });
        if (response.data) {
          setUserInfo({
            username: response.data.username,
            first_name: response.data.firstName,
            last_name: response.data.lastName,
            email: response.data.email,
            date_of_birth: response.data.dateOfBirth,
            phone_no: response.data.phoneNo,
          });
          setProfilePicURL('http://localhost:5000/' + response.data.profile_pic);
        }
      } catch (error) {
        console.error("There was an error fetching user info:", error);
      }
    };

    fetchUserInfo();
  }, []);
  
    // Function to render the active section's component
    const renderSection = () => {
      switch (activeSection) {
        case 'profile':
          return <ProfilePictureSection onUpload={handleImageUpload} profilePicURL={profilePicURL} userInfo={userInfo} onUpdateUserInfo={onUpdateUserInfo}/>;
        case 'password':
          return <PasswordSection onChangePassword={handlePasswordChange} />;
        case 'finance':
          return <DepositWithdrawSection onDeposit={handleDeposit} onWithdraw={handleWithdraw} />;
        case 'watchlist':
          return <WatchlistSection />;
        case 'payment':
          return <PaymentInformationSection />;
        default:
          return <div>Select a section</div>;
      }
    };
  
    return (
        <div className="settings-container">
        <div className="sections-list">
          <h1 className="settings-heading">
            <span className="material-icons-outlined">settings</span>
            Settings
          </h1>
          <button className={activeSection === 'profile' ? 'active' : ''} onClick={() => setActiveSection('profile')}><span className="material-icons-outlined">account_circle</span>Account Settings</button>
          <button className={activeSection === 'password' ? 'active' : ''} onClick={() => setActiveSection('password')}><span className="material-icons-outlined">vpn_key</span>Password</button>
          <button className={activeSection === 'finance' ? 'active' : ''} onClick={() => setActiveSection('finance')}><span className="material-icons-outlined">payments</span>Deposit or Withdraw Money</button>
          <button className={activeSection === 'watchlist' ? 'active' : ''} onClick={() => setActiveSection('watchlist')}><span className="material-icons-outlined">notifications</span>Financial Alerts</button>
          <button className={activeSection === 'payment' ? 'active' : ''} onClick={() => setActiveSection('payment')}><span className="material-icons-outlined">credit_card</span>Payment Information</button>
          {/* Add other sections as needed */}
        </div>
        <div className="section-content">
          {renderSection()}
          {message && <div className="message">{message}</div>}
        </div>
      </div>
    );
  }
  
  export default Settings;