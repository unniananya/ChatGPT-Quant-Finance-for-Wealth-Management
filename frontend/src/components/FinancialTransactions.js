// FinancialTransactions.js
import React, { useState } from 'react';
import axios from 'axios';
import './styles/FinancialTransactions.css'; // Assume you have a CSS file for styling

function FinancialTransactions() {
    const [amount, setAmount] = useState('');
    const [transactionMessage, setTransactionMessage] = useState('');

    const handleTransaction = async (type) => {
        try {
            const response = await axios.post(`http://localhost:5000/${type}-money`, { amount }, {
                headers: {
                    Authorization: 'Bearer ' + localStorage.getItem('token')
                }
            });
            setTransactionMessage(response.data.message);
            setAmount(''); // Clear the amount after the transaction
        } catch (error) {
            console.error(`There was an error ${type}ing money:`, error);
            setTransactionMessage(error.response?.data?.error || "An error occurred.");
        }
    };

    return (
        <div className="financial-transactions-container">
            <h2>Financial Transactions</h2>
            <div className="input-group">
                <label htmlFor="amount">Amount</label>
                <input
                    id="amount"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                />
            </div>
            <div className="button-group">
                <button onClick={() => handleTransaction('deposit')}>Deposit Money</button>
                <button onClick={() => handleTransaction('withdraw')}>Withdraw Money</button>
            </div>
            {transactionMessage && <div className="message">{transactionMessage}</div>}
        </div>
    );
}

export default FinancialTransactions;