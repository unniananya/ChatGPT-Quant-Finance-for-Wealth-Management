import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import moment from 'moment'; // You might need to install moment if not already installed
import './styles/Overview.css';
import { format, parseISO } from 'date-fns';
import ChatBot from './ChatBot';
import { useParams } from 'react-router-dom';

const Overview = () => {
    const [combinedData, setCombinedData] = useState([]);
    const [timePeriod, setTimePeriod] = useState('3M'); // New state variable for time period
    const token = localStorage.getItem('token'); // Replace with your actual token or logic to fetch it
    const [showChatbot, setShowChatbot] = useState(false);
    const [autoMessage, setAutoMessage] = useState('');
    const [userPortfolios, setUserPortfolios] = useState([]);
    const [selectedPortfolioName, setSelectedPortfolioName] = useState('');
    const [sharpeRatio, setSharpeRatio] = useState('');
    const [portfolioStdDev, setPortfolioStdDev] = useState('');
    const [portfolioBeta, setPortfolioBeta] = useState('');
    const hasPortfolioData = combinedData.some(data => data.portfolio !== undefined);
    const { portfolioName } = useParams();

    useEffect(() => {
        if (portfolioName) {
            console.log("Portfolio Name from URL:", portfolioName);
            setSelectedPortfolioName(portfolioName);
        }
    }, [portfolioName]); // React to changes in portfolioName URL parameter

    useEffect(() => {
        const fetchPortfolios = async () => {
            try {
                const response = await axios.get('http://localhost:5000/get_user_portfolios', {
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                if (response.status === 200) {
                    setUserPortfolios(response.data);
                    // if(response.data.length > 0){
                    //     // Automatically select the first portfolio if not already selected
                    //     setSelectedPortfolioName(response.data[0].portfolio_name);
                    // }
                } else {
                    console.error('Failed to fetch portfolios.');
                }
            } catch (err) {
                console.error('An error occurred fetching portfolios:', err.message);
            }
        };

        fetchPortfolios();
    }, [token]);


    // Now handleQuestionClick takes a message as a parameter
    const handleQuestionClick = (message) => {
        setShowChatbot(true); // Open the chatbot
        setAutoMessage(message); // Set the message to be sent automatically
    };

    useEffect(() => {
        const fetchData = async () => {
            if (!selectedPortfolioName) return; // Ensure a portfolio is selected
            try {
                const sp500Response = await axios.get('http://localhost:5000/sp500-historical-returns');
                const sp500Data = sp500Response.data;
                // const portfolioName = "automated"
                const portfolioResponse = await axios.get(`http://localhost:5000/optimize-portfolio?portfolio_name=${selectedPortfolioName}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                const portfolioData = portfolioResponse.data['Selected Portfolio Historical Returns'];
                setSharpeRatio(portfolioResponse.data['Selected Portfolio Sharpe Ratio']);
                setPortfolioStdDev(portfolioResponse.data['Selected Portfolio Risk']);
                setPortfolioBeta(portfolioResponse.data['Selected Portfolio Beta']);

                let startDate;
                switch (timePeriod) {
                    case '6M':
                        startDate = moment().subtract(6, 'months');
                        break;
                    case '3M':
                        startDate = moment().subtract(3, 'months');
                        break;
                    case '1M':
                        startDate = moment().subtract(1, 'months');
                        break;
                    case '1W':
                        startDate = moment().subtract(1, 'weeks');
                        break;
                    default:
                        startDate = moment().subtract(3, 'months');
                }

                const filteredCombinedData = sp500Data
                    .filter(entry => moment(entry.date).isAfter(startDate))
                    .map(sp500Entry => {
                        const portfolioEntry = portfolioData.find(entry => entry.date === sp500Entry.date) || {};
                        return { date: sp500Entry.date, sp500: sp500Entry.return, portfolio: portfolioEntry.return };
                    });

                setCombinedData(filteredCombinedData);
            } catch (error) {
                console.error('Error fetching historical returns data:', error);
            }
        };

        fetchData();
    }, [token, timePeriod, selectedPortfolioName]); // Add timePeriod as a dependency

    // Function to render a button with active class if it matches the current time period
    const renderButton = (label, periodValue) => (
      <button
          onClick={() => setTimePeriod(periodValue)}
          className={`toggleButton ${timePeriod === periodValue ? 'active' : ''}`}
      >
          {label}
      </button>
    );

    const formatDate = (tickItem) => {
        // Assuming your date format is compatible with new Date(), otherwise you might need to parse it first
        const date = new Date(tickItem);
        return format(date, 'MMM d'); // Formats like "Dec 6"
    };

    const CustomTooltip = ({ active, payload, label }) => {
        // Function to format the date
        const formatDate = (dateString) => {
            // Assuming date is in ISO format, adjust as needed
            const date = parseISO(dateString);
            return format(date, 'MMM dd yyyy'); // e.g., Dec 18 2023
        };
      
        if (active && payload && payload.length) {
            return (
                <div className="custom-tooltip" style={{ backgroundColor: 'rgb(0,13,26,0.8)', padding: '10px', borderRadius: '5px', border: '0.1px solid #676767', textAlign: 'left' }}>
                    <p className="label" style={{ marginBottom: '5px' }}>{`${formatDate(label)}`}</p>
                    {payload.map((entry, index) => (
                        <p key={`item-${index}`} className="intro" style={{ marginBottom: '5px' }}>
                            <span style={{ marginRight: '20px', color: entry.color }}>{entry.name}</span>
                            <span style={{ float: 'right', color: entry.color }}>{entry.value.toFixed(4)}</span>
                        </p>
                    ))}
                </div>
            );
        }
    
        return null;
    };

    const renderCustomLegend = (props) => {
        const { payload } = props;

        const legendQuestions = {
            sp500: 'What does SP500 returns mean?',
            portfolio: 'What does Portfolio Returns mean?'
          };
      
        return (
            <div className="custom-legend-container">
                {payload.map((entry, index) => (
                <div key={`item-${index}`} className="legend-item">
                    <svg width="20" height="10" className="legend-icon">
                    <rect width="20" height="10" style={{ fill: entry.color }} />
                    </svg>
                    <span style={{ color: entry.color }}>{entry.value}</span>
                    <i className="material-icons clickable-icon" 
                        style={{ color: '#989898' }}
                        onClick={() => handleQuestionClick(`What does ${entry.value} mean?`)}>
                    help_outline
                    </i>
                </div>
                ))}
            </div>
        );
    };


    return (
          <div className="overviewContainer">
            <div className="portfolio-selector">
                <select value={selectedPortfolioName} onChange={(e) => setSelectedPortfolioName(e.target.value)}>
                    <option value="">Select a portfolio</option>
                    {userPortfolios.map((portfolio, index) => (
                        <option key={index} value={portfolio.portfolio_name}>{portfolio.portfolio_name}</option>
                    ))}
                </select>
            </div>
            {selectedPortfolioName ? (
            hasPortfolioData ? (
            <>
            <h2 className='overview-title'>Portfolio Performance Details</h2>
            <h3 className='overview-subtitle'>An Overview of all time performance</h3>
            <div className="chart-message-container">
                {/* {hasPortfolioData ? (
                <> */}
                <div className="risk-metrics-container">
                    <div className="risk-metrics-header">
                        <h2 className="risk-metrics-title">Performance Metrics</h2>
                    </div>
                    <div className="risk-metrics-values">
                        <div className="risk-metric-container">
                            <span className="risk-metric-title">Sharpe Ratio:
                            <i className="material-icons clickable-icon" 
                            style={{ color: '#989898' }}
                            onClick={() => handleQuestionClick(`What does Sharpe Ratio mean?`)}>
                            help_outline
                            </i>
                            </span>
                            <div className="risk-metric">{Number(sharpeRatio).toFixed(2)}</div>
                        </div>
                        <div className="risk-metric-container">
                            <span className="risk-metric-title">Portfolio Std Dev:
                            <i className="material-icons clickable-icon" 
                            style={{ color: '#989898' }}
                            onClick={() => handleQuestionClick(`What does Portfolio Std Dev mean?`)}>
                            help_outline
                            </i>
                            </span>
                            <div className="risk-metric">{Number(portfolioStdDev).toFixed(2)}</div>
                        </div>
                        <div className="risk-metric-container">
                            <span className="risk-metric-title">Portfolio Beta:
                            <i className="material-icons clickable-icon" 
                            style={{ color: '#989898' }}
                            onClick={() => handleQuestionClick(`What does Portfolio Beta in relation to SP500 mean?`)}>
                            help_outline
                            </i>
                            </span>
                            <div className="risk-metric">{Number(portfolioBeta).toFixed(2)}</div>
                        </div>
                    </div>
                </div>
                <div className="chartContainer">
                    <h2 className='chart-header'>Portfolio returns vs SP500 Returns</h2>
                <ResponsiveContainer>
                    <LineChart
                        data={combinedData}
                        margin={{ top: 5, right: 30, left: 30, bottom: 5 }}
                    >
                        <CartesianGrid stroke="none" />
                        <XAxis dataKey="date" tickFormatter={formatDate} dy={10} interval={5}/>
                        <YAxis orientation="right" dx={5}/>
                        <Tooltip content={<CustomTooltip />}/>
                        {/* <Legend /> */}
                        <Legend content={renderCustomLegend} wrapperStyle={{ paddingTop: '20px' }}/>
                        <Line type="monotone" dataKey="sp500" name="SP500 Returns" stroke="#8884d8" activeDot={{ r: 8 }} />
                        <Line type="monotone" dataKey="portfolio" name="Portfolio Returns" stroke="#82ca9d" />
                    </LineChart>
                </ResponsiveContainer>
                </div>

                {/* Buttons for selecting time period */}
                <div className="buttonContainer">
                    {renderButton('1 Week', '1W')}
                    {renderButton('1 Month', '1M')}
                    {renderButton('3 Months', '3M')}
                    {renderButton('6 Months', '6M')}
                </div>
                </div>
                </>
            ) : (
                <div className="initial-deposit-message">
                    Please make an initial deposit to view this portfolio's details.
                </div>
            )
        ) : (
            <div className="initial-deposit-message">
                Please select a portfolio to view details.
            </div>
        )}
        {/* </div> */}
        {showChatbot && <ChatBot closeChatbot={() => setShowChatbot(false)} autoSendMessage={autoMessage} />}
        </div>
    );
};

export default Overview;