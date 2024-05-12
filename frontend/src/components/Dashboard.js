import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import './styles/Dashboard.css';
import DashboardDataContext from './DashboardDataContext';  // only if you used a separate file
import PortfolioCharts from './PortfolioCharts'; // Import the charts component
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, Cell, PieChart, Pie, LineChart, Line, AreaChart, Area, ComposedChart } from 'recharts';
import { format, parseISO } from 'date-fns';
import { Link } from 'react-router-dom';
import ChatBot from './ChatBot';
import { useLocation } from 'react-router-dom';
import { useParams } from 'react-router-dom';

const Dashboard = () => {
    const [portfolioData, setPortfolioData] = useState(null);
    // const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const token = localStorage.getItem('token'); // Get the JWT token from local storage
    // const { dashboardData, setDashboardData } = useContext(DashboardDataContext);
    const [hasMadeInitialDeposit, setHasMadeInitialDeposit] = useState(true);
    const [hasPortfolioValue, setHasPortfolioValue] = useState(false);
    const [chartData, setChartData] = useState([]);
    const [showChatbot, setShowChatbot] = useState(false);
    const [autoMessage, setAutoMessage] = useState('');
    const [userFirstName, setUserFirstName] = useState(''); // State to store the user's first name
    const [userPortfolios, setUserPortfolios] = useState([]);
    const [selectedPortfolioName, setSelectedPortfolioName] = useState('');
    const [currentGoals, setCurrentGoals] = useState([]);
    const { portfolioName } = useParams();

    useEffect(() => {
        if (portfolioName) {
            console.log("Portfolio Name from URL:", portfolioName);
            setSelectedPortfolioName(portfolioName);
            handlePortfolioChange(portfolioName);
        }
    }, [portfolioName]); // React to changes in portfolioName URL parameter

    useEffect(() => {
        const fetchCurrentGoals = async () => {
            try {
                const response = await axios.get('http://localhost:5000/get_current_user_goals', {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                setCurrentGoals(response.data);
                
            } catch (error) {
                console.error('Error fetching current goals:', error);
            }
        };

        fetchCurrentGoals();
    }, [token]); // Fetch current goals when the component mounts or token changes

    // Function to handle selection of a new portfolio name
    const handlePortfolioChange = async (newPortfolioName) => {
        setSelectedPortfolioName(newPortfolioName);
        console.log("newPortfolioName: ", newPortfolioName)

        // Clear relevant local storage items
        // localStorage.removeItem('dashboardData');
        // Reset relevant states
        setPortfolioData(null);
        setError(null);
        setHasMadeInitialDeposit(true);
        // setDashboardData({});
        // Optionally, re-fetch user portfolios or any other initialization logic
        fetchPortfolios();
        fetchInitialDeposit(newPortfolioName);
    };


    // Now handleQuestionClick takes a message as a parameter
    const handleQuestionClick = (message) => {
        setShowChatbot(true); // Open the chatbot
        setAutoMessage(message); // Set the message to be sent automatically
    };

    useEffect(() => {
        // Function to fetch user information
        const fetchUserInfo = async () => {
            try {
                const response = await axios.get('http://localhost:5000/get-user-info', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (response.status === 200 && response.data.firstName) {
                    // Assuming the first name is returned in response.data.firstName
                    setUserFirstName(response.data.firstName);
                } else {
                    setError("Failed to fetch user information.");
                }
            } catch (err) {
                setError(err.response ? err.response.data.error : 'An error occurred fetching user information.');
            }
        };
        
        fetchUserInfo();
    }, [token]); // Effect runs on component mount and whenever the token changes


    useEffect(() => {
        // Fetch user portfolios on component mount
        fetchPortfolios();
    }, [token]); // Dependency array includes token to refetch if it changes

    const fetchPortfolios = async () => {
        try {
            const response = await axios.get('http://localhost:5000/get_user_portfolios', {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (response.status === 200) {
                setUserPortfolios(response.data);
            } else {
                setError('Failed to fetch portfolios.');
            }
        } catch (err) {
            setError(err.response ? err.response.data.error : 'An error occurred fetching portfolios.');
        }
    };


    const optimizePortfolio = async (portfolioName) => {
        // setLoading(true);
        setError(null);

        console.log("inside optimize the portfolio name: ", portfolioName)
        try {
            // Call the backend endpoint
            const response = await axios.get(`http://localhost:5000/optimize-portfolio?portfolio_name=${portfolioName}`, {
                headers: {
                    'Authorization': `Bearer ${token}` // Replace with your actual token or logic to fetch it
                }
            });

            console.log("response: ", response)

            if (response.status === 200) {
                const updatedPortfolioData = {
                    ...response.data,
                    // weightsData: response.data["Selected Portfolio Weights"]
                };
    
                setPortfolioData(updatedPortfolioData);
                console.log("updatedPortfolioData: ", updatedPortfolioData)


            } else {
                setError('Failed to optimize portfolio.');
            }
        } catch (err) {
            setError(err.response ? err.response.data.error : 'An error occurred.');
        } finally {
            // setLoading(false);
        }
    };



    const fetchInitialDeposit = async (portfolioName) => {

        if (!portfolioName) return; // Exit if no portfolio name is provided
        console.log("inside fetchinital deposit the portfolio name: ", portfolioName)
        try {
            const response = await axios.get(`http://localhost:5000/get-initial-deposit?portfolio_name=${portfolioName}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.status === 200) {
                const initialDepositValue = response.data.initialDeposit;
                const portfolioValue = response.data.portfolioValue;
                console.log("initialDepositValue: ", initialDepositValue)
                console.log("portfolioValue: ", portfolioValue)
                // if there is a initial deposit and not portfolioValue returned 
                if (initialDepositValue !== -1.0) { //&& !portfolioValue
                    console.log("Entering inside this", 0)

                    console.log("entering optimize")
                    // If data is not in local storage, fetch it
                    optimizePortfolio(portfolioName);
                    // }
                } else if (initialDepositValue !== -1.0 && portfolioValue){
                    setHasPortfolioValue(true);
                } else {
                    setHasMadeInitialDeposit(false);
                }
            } else {
                // setError("Failed to fetch initial deposit.");
                setHasMadeInitialDeposit(false);
            }
        } catch (err) {
            // setError(err.response ? err.response.data.error : 'An error occurred.');
            setHasMadeInitialDeposit(false);
        }
    };

    useEffect(() => {
        if (portfolioData) {
            const mergedData = mergeData(selectedPortfolioName);
            setChartData(mergedData);
            console.log("chartdata: ", chartData)
        }
    }, [portfolioData, selectedPortfolioName]);



    const mergeData = (selectedPortfolioName) => {
        const portfolioValues = portfolioData["Portfolio Value Over Time"];
        const transactionsSource = selectedPortfolioName !== 'automated' ? "Money in Portfolio" : "Transaction History";
        const transactions = portfolioData[transactionsSource];
        // const transactions = portfolioData["Transaction History"];
    
        transactions.sort((a, b) => new Date(a.date) - new Date(b.date));
        console.log("transactions: ", transactions);
    
        // Initialize an object to keep the latest running total for each date
        const latestRunningTotalsByDate = {};
    
        // Store the last known running total here
        let lastKnownRunningTotal = 0;
    
        transactions.forEach(transaction => {
            const date = transaction.date.split(' ')[0]; // Isolate the date part
            lastKnownRunningTotal = transaction.amount; // Update the last known running total
            latestRunningTotalsByDate[date] = lastKnownRunningTotal;
        });
    
        console.log('Latest running totals by date:', latestRunningTotalsByDate);
    
        // To handle dates without transactions, we extend the latestRunningTotalsByDate
        // to include all dates in portfolioValues, carrying over the last known value
        const allDates = portfolioValues.map(pv => pv.date.split(' ')[0]);
        allDates.forEach(date => {
            if (!latestRunningTotalsByDate[date]) {
                latestRunningTotalsByDate[date] = lastKnownRunningTotal; // Use the last known total for dates without transactions
            } else {
                lastKnownRunningTotal = latestRunningTotalsByDate[date]; // Update last known total to the current date's total
            }
        });
    
        const merged = portfolioValues.map(pv => {
            const datePart = pv.date.split(' ')[0];
            // Now, latestRunningTotalsByDate includes all portfolio value dates,
            // so it directly provides either the day's total or the last known total
            let netDeposits = latestRunningTotalsByDate[datePart];
    
            // console.log(`Portfolio value date: ${datePart}, netDeposits: ${netDeposits}`);
    
            return {
                ...pv,
                date: datePart,
                PortfolioValue: Number(pv.value) || 0, // Ensure it's a number and provide a fallback
                NetDeposits: netDeposits,
            };
        });
    
        return merged;
    };


    const calculateNiceTicks = (min, max, maxTicks = 5) => {
        const range = max - min;
        // Estimate the initially "nice" interval
        let interval = Math.pow(10, Math.floor(Math.log10(range / maxTicks)));
        const fraction = range / (interval * maxTicks);
    
        // Refine the interval to ensure it divides the range into nice parts
        if (fraction < 0.15) interval *= 0.2;
        else if (fraction < 0.35) interval *= 0.5;
        else if (fraction < 0.75) interval *= 1;
        else interval *= 2;
    
        // Calculate tick values
        const niceMin = Math.floor(min / interval) * interval;
        const niceMax = Math.ceil(max / interval) * interval;
        const ticks = [];
        for (let val = niceMin; val <= niceMax; val += interval) {
            ticks.push(val);
        }
    
        return ticks;
    };


    // Example data min and max values, replace with your actual calculation
    const dataMin = Math.min(...chartData.map(item => Math.min(item.PortfolioValue, item.NetDeposits)));
    const dataMax = Math.max(...chartData.map(item => Math.max(item.PortfolioValue, item.NetDeposits)));

    // Calculate tick values
    const yAxisTicks = calculateNiceTicks(dataMin, dataMax);

    const formatDate = (tickItem) => {
        // Assuming your date format is compatible with new Date(), otherwise you might need to parse it first
        const date = new Date(tickItem);
        return format(date, 'MMM d'); // Formats like "Dec 6"
    };

    // Calculate min and max for PortfolioValues
    const PortfolioValues = chartData.map(item => item.NetDeposits).filter(value => value !== null);
    const minY = Math.min(...PortfolioValues) * 0.95; // 5% padding below min
    const maxY = Math.max(...PortfolioValues) * 1.05; // 5% padding above max


    // Compute the max value for PortfolioValue and NetDeposits
    const maxValuePortfolio = Math.max(...chartData.map(item => item.PortfolioValue));
    const maxValueNetDeposits = Math.max(...chartData.map(item => item.NetDeposits));
    // Find the maximum value between them and add 50
    let maxDomainValue = Math.max(maxValuePortfolio, maxValueNetDeposits) + 50;
    // Round it up to the nearest whole number
    maxDomainValue = Math.ceil(maxDomainValue);


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
                            <span style={{ float: 'right', color: entry.color }}>{`$${entry.value.toFixed(2)}`}</span>
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
            PortfolioValue: 'What does Portfolio Value mean?',
            NetDeposits: 'What does Net Deposits mean?'
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
        <div className="dashboard-container">
            {/* Display the welcome message with the user's first name */}
            {userFirstName && (
                <div className="welcome-message">
                    <span>Welcome to WealthWise,</span> <strong>{userFirstName}!</strong>
                </div>
            )}

            <div className="current-goals-container">
                    <div className="current-goals-header">
                        <h2 className='current-goals-title'>Progress Tracker: Your Ongoing Goals</h2>
                    </div>
                {currentGoals.length > 0 && currentGoals.map(goal => (
                    <div key={goal._id.$oid} className="goal-donut-container">
                        <div className="goal-container-header">
                            <span className="goal-name">{goal.name}</span>
                        </div>
                        <svg className="donut" viewBox="0 0 40 40">
                            <circle className="donut-hole" cx="20" cy="20" r="15.91549430918954" fill="#000d1a"></circle>
                            <circle className="donut-ring" cx="20" cy="20" r="15.91549430918954" fill="transparent" stroke="#001a33" strokeWidth="5"></circle>
                            <circle className="donut-segment" cx="20" cy="20" r="15.91549430918954" fill="transparent" stroke="#0066cd" strokeWidth="5" strokeDasharray={`${goal.progress ? goal.progress[goal.progress.length - 1].progress_percentage : 0} ${100 - (goal.progress ? goal.progress[goal.progress.length - 1].progress_percentage : 0)}`} strokeDashoffset="25"></circle>
                            <text x="50%" y="50%" className="donut-text" dominantBaseline="middle" textAnchor="middle">
                                {`${goal.progress && goal.progress.length > 0 ? goal.progress[goal.progress.length - 1].progress_percentage.toFixed(1) : '0'}%`}
                            </text>
                        </svg>
                    </div>
                ))}
            </div>

            {/* Portfolio Selection Dropdown */}
            <div className="portfolio-selector">
                <select value={selectedPortfolioName} onChange={(e) => handlePortfolioChange(e.target.value)}>
                    <option value="">Select a portfolio</option>
                    {userPortfolios.map((portfolio, index) => (
                        <option key={index} value={portfolio.portfolio_name}>{portfolio.portfolio_name}</option>
                    ))}
                </select>
            </div>
    
    
            {/* {loading && <div className="spinner"></div>} */}
    
            {error && <div className="error-message">{error}</div>}
    
            {hasMadeInitialDeposit ? (
                hasPortfolioValue ? (
                    <div className="portfolio-value">
                    <p className ="heading">Total value (SGD):</p>
                    <p className="value">{portfolioData["Current Portfolio Value"]}</p>
                    </div>
                ) : (
                    portfolioData && (
                        <div className="portfolio-results">
                            <div className="portfolio-value">
                                <p className ="heading">Portfolio value (SGD):<i className="material-icons clickable-icon" onClick={() => handleQuestionClick('What does Portfolio value of a portfolio mean?')}>help_outline</i></p>
                                {/* <p className="value">{new Intl.NumberFormat('en-SG', { style: 'currency', currency: 'SGD' }).format(portfolioData["Current Portfolio Value"])}</p> */}
                                <p className="value">{new Intl.NumberFormat('en-SG', { style: 'currency', currency: 'SGD' }).format(portfolioData["Current Portfolio Value"] || 0)}</p>
                            </div>
                            <div className="portfolio-statistics">
                                <div className="profit-loss">
                                    <p className ="heading">Profit or Loss:<i className="material-icons clickable-icon" onClick={() => handleQuestionClick('What does Profit and Loss mean?')}>help_outline</i></p>
                                    {/* Apply a dynamic class based on the profit or loss value */}
                                    <p className={`value-box ${portfolioData["Profit or Loss"] >= 0 ? 'positive-value' : 'negative-value'}`}>
                                        {new Intl.NumberFormat('en-SG', { style: 'currency', currency: 'SGD' }).format(portfolioData["Profit or Loss"])}
                                    </p>
                                </div>
                                <div className="portfolio-return">
                                    <p className ="heading">All-time returns:<i className="material-icons clickable-icon" onClick={() => handleQuestionClick('What does All-time returns mean?')}>help_outline</i></p>
                                    {/* Apply a dynamic class based on the all-time returns value */}
                                    <p className={`value-box ${parseFloat(portfolioData["Selected Portfolio All Time Return"]) >= 0 ? 'positive-value' : 'negative-value'}`}>
                                        {parseFloat(portfolioData["Selected Portfolio All Time Return"]) >= 0 ? `+${parseFloat(portfolioData["Selected Portfolio All Time Return"]).toFixed(2)}` : parseFloat(portfolioData["Selected Portfolio All Time Return"]).toFixed(2)}
                                    </p>
                                </div>
                            </div>
                            <div className="chart-container">
                                <h2 className='chart-header'>Portfolio Value and Net Deposits Over Time</h2>
                                <ComposedChart width={1300} height={500} data={chartData} margin={{ top: 20, right: 30, left: 30, bottom: 5 }}>
                                    <defs>
                                        <linearGradient id="colorPv" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#8884d8" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="date" tickFormatter={formatDate} dy={10} interval={5}/>
                                    <YAxis domain={[minY, maxDomainValue]} orientation="right" tickFormatter={(value) => `$${value.toFixed(0)}`} ticks={yAxisTicks} dx={5}/>
                                    <CartesianGrid stroke="none" />
                                    <Tooltip content={<CustomTooltip />}/>
                                    <Legend content={renderCustomLegend} wrapperStyle={{ paddingTop: '20px' }}/>
                                    <Area type="monotone" dataKey="PortfolioValue" name='Portfolio Value' stroke="#8884d8" fillOpacity={1} fill="url(#colorPv)" />
                                    <Line type="monotone" dataKey="NetDeposits" name="Net Deposits" stroke="#82ca9d" dot={false} strokeWidth={2} strokeDasharray="5 5"/>
                                </ComposedChart>
                            </div>
    
                            <div className="learn-more-container">
                                <Link to="/portfolio/overview" className="learn-more-button">
                                    Learn More
                                </Link>
                            </div>
                        </div>
                    )
                )
                
            ) : (
                <div className="info-message">Please make an initial deposit before accessing the dashboard.</div>
            )}
            {showChatbot && <ChatBot closeChatbot={() => setShowChatbot(false)} autoSendMessage={autoMessage} />}
        </div>
    );
};

export default Dashboard;