import React, { useState, useEffect, useRef } from 'react';
import './styles/PaperTradingStage2.css';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import { format, parseISO, parse } from 'date-fns';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042']; // Add other colors as needed

const PaperTradingStage2 = () => {
  const [stocks, setStocks] = useState([]);
  const [selectedStock, setSelectedStock] = useState(null);
  const [quantity, setQuantity] = useState(0);
  const [transactionType, setTransactionType] = useState('buy');
  const [currentCash, setCurrentCash] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [chartData, setChartData] = useState([]);
  const [pieChartData, setPieChartData] = useState([]);
  const [chatGPTAdvice, setChatGPTAdvice] = useState(''); // State to store ChatGPT advice
  const [profitOrLoss, setProfitOrLoss] = useState(0);
  const [showAdviceModal, setShowAdviceModal] = useState(false);
  const [showPriceChartModal, setShowPriceChartModal] = useState(false);
  const [showNewsModal, setShowNewsModal] = useState(false);

  const [priceChartData, setPriceChartData] = useState([]); // State to store price chart data
  const [newsData, setNewsData] = useState([]); // State to store news data

  const parseAndFormatDate = (dateString) => {
    // Parse the date string using the correct format
    const parsedDate = parse(dateString, "yyyy-MM-dd hh:mm:ss a", new Date());
  
    // Format the date to "MMM do yyyy hh:mm:ssaa"
    // For example, "Jan 15th 2024 11:38:11AM"
    return format(parsedDate, "MMM do yyyy hh:mm:ssaa");
  };


  const portfolioValues = chartData.map(item => item.MoneyInPortfolio);
  const minY = Math.min(...portfolioValues) * 0.95; // 5% padding below min
  const maxY = Math.max(...portfolioValues) * 1.05; // 5% padding above max

  // Then store minY and maxY in the state to use them later in rendering the chart
  const [domain, setDomain] = useState([minY, maxY]);

  // Update the domain state whenever the chartData changes
  useEffect(() => {
    if (chartData.length) {
      console.log("chart: ", chartData);
      const portfolioValues = chartData.map(item => item.MoneyInPortfolio);
      let minY = Math.min(...portfolioValues) * 0.95;
      let maxY = Math.max(...portfolioValues) * 1.05;
  
      // Rounding to two decimal places
      minY = parseFloat(minY.toFixed(2));
      maxY = parseFloat(maxY.toFixed(2));
  
      setDomain([minY, maxY]);
      console.log("domain: ", domain);
      console.log("minY: ", minY);
      console.log("maxY: ", maxY);
    }
  }, [chartData]);

  const fetchCurrentCash = async () => {
    try {
      const cashResponse = await axios.get('http://localhost:5000/get_current_cash?paperTradingPortfolioName=paper_trading_stage_2&paperTradingTemplateName=none', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setCurrentCash(cashResponse.data.current_cash_value);
    } catch (error) {
      console.error('Error fetching current cash:', error);
    }
  };

  const fetchChartData = async () => {
    try {
      const response = await axios.get('http://localhost:5000/get_paper_portfolio_data?paperTradingPortfolioName=paper_trading_stage_2&paperTradingTemplateName=none', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.data) {
        setProfitOrLoss(response.data.profitOrLoss)
        console.log("profitOrLoss: ", response.data.profitOrLoss)
        processChartData(response.data.portfolioValueOverTime, response.data.moneyInPortfolio);
        processPieChartData(response.data.currentAssets);
      }
    } catch (error) {
      console.error('Error fetching chart data:', error);
    }
  };

  const processChartData = (portfolioValueOverTime, moneyInPortfolio) => {
    let lastKnownMoneyInPortfolio = 0;
  
    const mergedData = portfolioValueOverTime.map(pv => {
      const portfolioDate = pv.date.split(' ')[0]; // Only keep the date part for portfolio values
  
      // Find the latest moneyInPortfolio entry before or on the current portfolioDate
      const relevantMoneyEntries = moneyInPortfolio.filter(mip => mip.date.split(' ')[0] <= portfolioDate);
      if (relevantMoneyEntries.length > 0) {
        // Get the most recent entry
        lastKnownMoneyInPortfolio = relevantMoneyEntries[relevantMoneyEntries.length - 1].amount;
      }
  
      return {
        date: portfolioDate, // Use only the date part for chart X-axis
        PortfolioValue: pv.value,
        MoneyInPortfolio: lastKnownMoneyInPortfolio || 0
      };
    });
  
    setChartData(mergedData);
  };

  const processPieChartData = (currentAssets) => {
    const totalQuantity = currentAssets.reduce((acc, asset) => acc + asset.quantity, 0);
    const pieData = currentAssets.map(asset => ({
      name: asset.symbol,
      value: parseFloat(((asset.quantity / totalQuantity) * 100).toFixed(2))
    }));
    setPieChartData(pieData);
  };

  const getChatGPTAdvice = async (data) => {
    try {
      const response = await axios.post('http://localhost:5000/chatgpt_advice_stage_2', data, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.data && response.data.advice) {
        setChatGPTAdvice(response.data.advice);
        setShowAdviceModal(true); // Open the modal when advice is received
      }
    } catch (error) {
      console.error('Error fetching advice from ChatGPT:', error);
    }
  };

  useEffect(() => {
    fetchStockData();
    fetchCurrentCash();
    fetchChartData();
  }, []);

  const fetchStockData = async () => {
    try {
      const response = await axios.get('http://localhost:5000/get_stock_data_stage_2', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setStocks(response.data);
    } catch (error) {
      console.error('Error fetching stock data:', error);
    }
  };

  const formatDate = (tickItem) => {
    const date = new Date(tickItem);
    return format(date, 'MMM d');
  };

  const selectStock = (stock) => {
    setSelectedStock(stock);
    setQuantity(0);
    setErrorMessage('');
  };

  const viewPriceChart = async (stockSymbol, event) => {
    event.stopPropagation();
    try {
      const response = await axios.get(`http://localhost:5000/get_price_chart/${stockSymbol}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setPriceChartData(response.data); // Update the state with chart data
      setShowPriceChartModal(true); // Show the price chart modal
    } catch (error) {
      console.error('Error fetching price chart:', error);
    }
  };
  
  const viewPastNews = async (stockSymbol, event) => {
    event.stopPropagation();
    try {
      const response = await axios.get(`http://localhost:5000/get_news/${stockSymbol}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setNewsData(response.data); // Update the state with news data
      console.log("news: ", response.data)
      setShowNewsModal(true); // Show the news modal
    } catch (error) {
      console.error('Error fetching news:', error);
    }
  };

  const handleTransaction = async () => {
    const transactionDetails = {
        stockSymbol: selectedStock.symbol,
        quantity: parseInt(quantity),
        transactionType,
        totalAmount: selectedStock.price * parseInt(quantity),
        paperTradingPortfolioName: "paper_trading_stage_2",
        paperTradingTemplateName: "none",
        portfolioAssetTypes: selectedStock.portfolioAssetTypes
    };

    try {
        // Execute the transaction
        const response = await axios.post('http://localhost:5000/execute_transaction_paper_trading', transactionDetails, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        fetchCurrentCash();
        setErrorMessage('');

        // Fetch stock data for all stocks
        const stockDataResponse = await axios.get('http://localhost:5000/get_stock_data_stage_2', {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });

        // Find the selected stock's additional data
        const selectedStockData = stockDataResponse.data.find(stock => stock.symbol === selectedStock.symbol);

        // Prepare data for ChatGPT advice request
        const chatGPTData = {
            userActions: `User ${transactionType} ${quantity} shares of ${selectedStock.symbol} at a price of $${selectedStock.price} per share with a daily change of ${selectedStock.dailyChange}%, a moving average of $${selectedStockData.movingAverage}, RSI of ${selectedStockData.rsi}, MACD of ${selectedStockData.macd}, and MACD Signal of ${selectedStockData.macdSignal}.`,
            paperTradingPortfolioName: "paper_trading_stage_2",
            paperTradingTemplateName: "none",
            allStocksData: stockDataResponse.data // Include data about all stocks
        };
        getChatGPTAdvice(chatGPTData);

    } catch (error) {
        if (error.response && error.response.data) {
            setErrorMessage(error.response.data.error);
        } else {
            console.error('Error executing transaction:', error);
            setErrorMessage('An unexpected error occurred.');
        }
    }
    setSelectedStock(null);
  };


  const stockListRef = useRef(null);

  const scrollStockList = (direction) => {
    if (stockListRef.current) {
      const stockItems = stockListRef.current.getElementsByClassName('stock-item');
      if (stockItems.length > 0) {
        const scrollAmount = 2*(stockItems[0].offsetWidth); // Get the width of a single stock item
        const { scrollLeft } = stockListRef.current;
        const newScrollPosition = direction === 'left'
          ? scrollLeft - scrollAmount: scrollLeft + scrollAmount;
        stockListRef.current.scrollTo({ left: newScrollPosition, behavior: 'smooth' });
      }
    }
  };

  let lastPortfolioValue = chartData.length > 0 ? chartData[chartData.length - 1].PortfolioValue : 0;

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
                <p className="label" style={{ marginBottom: '5px', color: "#989898" }}>{`${formatDate(label)}`}</p>
                {payload.map((entry, index) => (
                    <p key={`item-${index}`} className="intro" style={{ marginBottom: '5px' }}>
                        <span style={{ marginRight: '20px', color: entry.color }}>{entry.name}</span>
                        <span style={{ float: 'right', color: entry.color }}>{entry.value.toFixed(2)}</span>
                    </p>
                ))}
            </div>
        );
    }

    return null;
  };

  return (
    <div className="paper-trading-stage2">
      <h1>Welcome to <bold>Paper Trading Stage 2</bold></h1>
      <p className='welcome-bottom'>Get access to more financial knowledge to build your own Portfolio!</p>
      <div className="cash-value-container">
      <div className="current-cash-profit-loss-container">
        <div className="current-cash-container">
          <p className="current-cash-label">Current Cash: </p>
          <p className="current-cash-value">${currentCash.toFixed(2)}</p>
        </div>
        
        {/* New Profit or Loss Component */}
        <div className="profit-loss-container">
          <p className="profit-loss-label">Profit or Loss:</p>
          <p className={`value-box ${profitOrLoss >= 0 ? 'positive-value' : 'negative-value'}`}>${profitOrLoss.toFixed(2)}</p>
        </div>
        </div>

        <div className="portfolio-value-container">
          <p className="portfolio-value-label">Portfolio Value:</p>
          <p className="portfolio-value">${lastPortfolioValue.toFixed(2)}</p>
        </div>
      </div>
      {errorMessage && <p className="error-message">{errorMessage}</p>}
      

      {showPriceChartModal && (
        <div className="modal-overlay">
          <div className="price-chart-modal">
            <button onClick={() => setShowPriceChartModal(false)} className="close-modal-btn">X</button>
            <h1>Price Chart for the Past 1 month</h1>
            {/* Your price chart content here */}
            {priceChartData.length > 0 && (
              <div className="price-chart-container">
                <LineChart width={600} height={300} data={priceChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="price" stroke="#8884d8" />
                </LineChart>
              </div>
            )}
          </div>
        </div>
      )}


      {showNewsModal && (
        <div className="modal-overlay">
          <div className="news-modal">
            <button onClick={() => setShowNewsModal(false)} className="close-modal-btn">X</button>
            <div className="news-content">
              {newsData.length > 0 && newsData.map((newsItem, index) => (
                <div key={index} className="news-item">
                  <p className="news-date"> {parseAndFormatDate(newsItem.date)}</p>
                  <h3 className="news-headline">{newsItem.headline}</h3>
                  <p className="news-summary">{newsItem.summary}</p>
                  <a href={newsItem.url} target="_blank" rel="noopener noreferrer" className="news-link">Click Here</a>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="charts-container">
        <div className="chart-container">
            <LineChart width={1050} height={400} data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={formatDate} />
              {/* <YAxis /> */}
              <YAxis domain={domain} />
              <Tooltip content={<CustomTooltip />}/>
              <Legend />
              <Line type="monotone" dataKey="PortfolioValue" name="Portfolio Value" stroke="#8884d8" />
              {/* <Line type="monotone" dataKey="MoneyInPortfolio" name="Money in Portfolio" stroke="#82ca9d" /> */}
            </LineChart>
          </div>

      <div className="pie-chart-container">
        <PieChart width={400} height={400}>
          <Pie
            data={pieChartData}
            cx={200}
            cy={200}
            labelLine={false}
            label={({ name, value }) => `${name}: ${value}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            stroke="#000d1a" 
          >
            {pieChartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </div>
      </div>

      <div className="stock-list-controls">
        <button onClick={() => scrollStockList('left')} className="scroll-btn">&lt;</button>
        <div className="stock-list-container" ref={stockListRef}>
          <div className="stock-list">
            {stocks.map((stock) => (
              <div key={stock.symbol} className="stock-item" onClick={() => selectStock(stock)}>
                <h2>{stock.symbol}</h2>
                <div className="stock-info">
                  <p><span className="label">Price:</span> <span className="value">${stock.price}</span></p>
                  <p><span className="label">Daily Change:</span> <span className={`value-stock ${stock.dailyChange >= 0 ? 'positive-value' : 'negative-value'}`}>{stock.dailyChange}%</span></p>
                  <p><span className="label">Moving Average:</span> <span className="value-rest">${stock.movingAverage}</span></p>
                  <p><span className="label">RSI:</span> <span className="value-rest">{stock.rsi}</span></p>
                  <p><span className="label">MACD:</span> <span className="value-rest">{stock.macd}</span></p>
                  <p><span className="label">MACD Signal:</span> <span className="value-rest">{stock.macdSignal}</span></p>
                  <div className="button-container">
                    <button onClick={(e) => viewPriceChart(stock.symbol, e)}>View Price Chart</button>
                    <button onClick={(e) => viewPastNews(stock.symbol, e)}>View Past News</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <button onClick={()=> scrollStockList('right')} className="scroll-btn">&gt;</button>
      </div>

      {selectedStock && (
        <div className="modal-overlay">
        <div className="transaction-modal">
          <h2>{selectedStock.name}</h2>
          <p>{selectedStock.symbol}</p>
          <div>
            <label>Number of Shares: </label>
            <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
          </div>
          <div>
            <label>Transaction Type: </label>
            <select value={transactionType} onChange={(e) => setTransactionType(e.target.value)}>
              <option value="buy">Buy</option>
              <option value="sell">Sell</option>
            </select>
          </div>
          <div>
            <label>Total Amount: </label>
            <span>${(selectedStock.price * quantity).toFixed(2)}</span>
          </div>
          <div className="transaction-modal-actions">
            <button onClick={handleTransaction} className="execute-transaction-btn">Execute Trade</button>
            <button onClick={() => setSelectedStock(null)} className="cancel-transaction-btn">Cancel</button>
          </div>
        </div>

        </div>
      )}

    {/* {chatGPTAdvice && <p className="chatgpt-advice">{chatGPTAdvice}</p>} */}

    {showAdviceModal && (
        <div className="modal-overlay">
          <div className="advice-modal">
            <p className="chatgpt-advice">{chatGPTAdvice}</p>
            <button onClick={() => setShowAdviceModal(false)} className="close-advice-btn">X</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaperTradingStage2;