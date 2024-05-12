// TransactionHistory.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './styles/TransactionHistory.css'; // Assume you have a CSS file for styling

function TransactionHistory() {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchTransactions = async () => {
            setLoading(true);
            try {
                const response = await axios.get('http://localhost:5000/transactions', {
                    headers: {
                        'Authorization': 'Bearer ' + localStorage.getItem('token')
                    }
                });
                setTransactions(response.data);
            } catch (error) {
                console.error('Error fetching transactions:', error);
                setError('Failed to fetch transactions.');
            } finally {
                setLoading(false);
            }
        };

        fetchTransactions();
    }, []);

    return (
        <div className="transaction-history-container">
        <h2 className="transaction-history-header">Transaction History</h2>
            {loading && <p>Loading transactions...</p>}
            {error && <p className="error">{error}</p>}
            {!loading && !error && (
                <table className="transactions-table">
                    <thead>
                        <tr>
                            {/* <th>ID</th> */}
                            <th>Amount</th>
                            <th>Type</th>
                            <th>Timestamp</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transactions.map((transaction) => (
                            <tr key={transaction.id}>
                                {/* <td>{transaction.id}</td> */}
                                <td>{transaction.amount}</td>
                                <td>{transaction.type}</td>
                                <td>{new Date(transaction.timestamp).toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

export default TransactionHistory;