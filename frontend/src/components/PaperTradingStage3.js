import React, { useState, useEffect, useRef } from 'react';
import './styles/PaperTradingStage3.css';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ComposedChart, Area, BarChart, Bar } from 'recharts';
import { format, parseISO, parse } from 'date-fns';
import CandlestickChart from './CandlestickChart';
import ChatBot from './ChatBot';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042']; // Add other colors as needed

// const riskProfiles = {
//     Conservative: { Stocks: 20, Bonds: 80 },
//     Moderate: { Stocks: 40, Bonds: 30, 'Cash and Cash Equivalents': 20, 'Real Estate': 10 },
//     Aggressive: { Stocks: 75, Bonds: 10, 'Cash and Cash Equivalents': 5, 'Real Estate': 10 }
// };


const assetTypeColors = {
  'Cash and Cash Equivalents': { color: '#00dbff', transparent: 'rgba(0, 219, 255, 0.15)' }, // Cooler Bright Sky Blue
  'Large Cap Blend': { color: '#7ECA9C', transparent: 'rgba(126, 202, 156, 0.15)' }, // Updated to a unique shade of soft green
  'Small Cap Value': { color: '#ffe600', transparent: 'rgba(255, 230, 0, 0.15)' }, // Cooler Bright Yellow
  'International Stocks': { color: '#ff7855', transparent: 'rgba(255, 120, 85, 0.15)' }, // Cooler Bright Orange
  'World Developed Stocks': { color: '#a8fc50', transparent: 'rgba(168, 252, 80, 0.15)' }, // Cooler Lime Green
  'International Large Cap Blend': { color: '#b2a3fa', transparent: 'rgba(178, 163, 250, 0.15)' }, // Cooler Soft Purple
  'Intermediate Bonds': { color: '#1bfc30', transparent: 'rgba(27, 252, 48, 0.15)' }, // Cooler Neon Green
  'International Bonds': { color: '#a264ed', transparent: 'rgba(162, 100, 237, 0.15)' }, // Cooler Bright Purple
  'Short Term Bonds': { color: '#FFD700', transparent: 'rgba(255, 215, 0, 0.15)' }, // Updated to Gold for differentiation
  'International Large Cap Value': { color: '#ff3b80', transparent: 'rgba(255, 59, 128, 0.15)' }, // Cooler Bright Pink
  'Gold': { color: '#fcff40', transparent: 'rgba(252, 255, 64, 0.15)' }, // Cooler Electric Yellow
  'International Small Cap Blend': { color: '#ff9600', transparent: 'rgba(255, 150, 0, 0.15)' }, // Cooler Bright Orange
  'Total Stock Market': { color: '#709bff', transparent: 'rgba(112, 155, 255, 0.15)' }, // Cooler Soft Blue
  'Small Cap Growth': { color: '#ff4088', transparent: 'rgba(255, 64, 136, 0.15)' }, // Cooler Bright Pink
  'Emerging Markets': { color: '#ff6a1a', transparent: 'rgba(255, 106, 26, 0.15)' }, // Cooler Bright Orange
  'Large Cap Value': { color: '#00ffa1', transparent: 'rgba(0, 255, 161, 0.15)' }, // Cooler Bright Green
  'International Small Cap Value': { color: '#c27dff', transparent: 'rgba(194, 125, 255, 0.15)' }, // Cooler Light Purple
  'Real Estate': { color: '#F08080', transparent: 'rgba(240, 128, 128, 0.15)' }, // Updated to Light Coral for differentiation
  'Long Term Bonds': { color: '#ff68c6', transparent: 'rgba(255, 104, 198, 0.15)' }, // Cooler Bright Pink
  'Small Cap Blend': { color: '#ffea00', transparent: 'rgba(255, 234, 0, 0.15)' }, // Cooler Bright Yellow
  'Large Cap Growth': { color: '#ce00ff', transparent: 'rgba(206, 0, 255, 0.15)' }, // Cooler Bright Purple
  'ESG': { color: '#3ca9ff', transparent: 'rgba(60, 169, 255, 0.15)' }, // Cooler Bright Blue
  'Cryptocurrencies': { color: '#ffdf70', transparent: 'rgba(255, 223, 112, 0.15)' }, // Cooler Golden Yellow
  'Commodities': { color: '#FF6347', transparent: 'rgba(255, 99, 71, 0.15)' }, // Updated to Tomato for differentiation
  'Other': { color: '#ffa500', transparent: 'rgba(255, 165, 0, 0.15)' }, // Cooler Bright Orange
};









const riskProfiles = {
  Conservative: {
      'Total Stock Market': 20,
      'Long Term Bonds': 80,
  },
  'Moderately Conservative': {
      'Small Cap Value': 15,
      'International Small Cap Value': 7.5,
      'Emerging Markets': 7.5,
      'Intermediate Bonds': 70
  },
  Moderate: {
      'Total Stock Market': 60,
      'Intermediate Bonds': 40
  },
  'Moderately Aggressive': {
      'Total Stock Market': 20,
      'International Stocks': 20,
      'Intermediate Bonds': 20,
      'Commodities': 20,
      'Real Estate': 20
  },
  Aggressive: {
      'Total Stock Market': 100
  }
};



const RISK_PROFILE_PORTFOLIO_INFO = {
  Conservative: {
    name: "20/80 Portfolio",
    description: "The 20/80 portfolio allocates 20% to stocks for growth potential and 80% to bonds for income and stability, ideal for conservative investors seeking minimal risk.",
    url: "https://www.lazyportfolioetf.com/allocation/stocks-bonds-20-80/",
    portfolio_std_dev_range: "3-6%",
    portfolio_compound_annual_return_range: "4-7%"
  },
  'Moderately Conservative': {
    name: "Larry Portfolio",
    description: "Focuses on small-cap and value stocks with a significant allocation to fixed income. Designed for investors with a lower risk tolerance who seek higher returns through factor investing.",
    url: "https://portfoliocharts.com/portfolios/larry-portfolio/",
    portfolio_std_dev_range: "4-7%",
    portfolio_compound_annual_return_range: "4-7%"
  },
  Moderate: {
    name: "Classic 60-40 Portfolio",
    description: "A traditional portfolio with 60% allocated to stocks for growth and 40% to bonds for income and stability. Best for investors with a moderate risk tolerance and a medium to long-term horizon.",
    url: "https://portfoliocharts.com/portfolios/classic-60-40-portfolio/",
    portfolio_std_dev_range: "8-11%",
    portfolio_compound_annual_return_range: "7-10%"
  },
  'Moderately Aggressive': {
    name: "Ivy Portfolio",
    description: "Mimics the diversified, alternative investment strategies of Ivy League endowments. Suitable for sophisticated investors seeking growth with a balanced approach to risk through diversification across asset classes.",
    url: "https://portfoliocharts.com/portfolios/ivy-portfolio/",
    portfolio_std_dev_range: "10-13%",
    portfolio_compound_annual_return_range: "5-12%"
  },
  Aggressive: {
    name: "Total Stock Market Portfolio",
    description: "Invests entirely in a total stock market fund for maximum growth potential. Best suited for investors with a high risk tolerance and a long-term investment horizon.",
    url: "https://portfoliocharts.com/portfolios/total-stock-market-portfolio/",
    portfolio_std_dev_range: "13-17%",
    portfolio_compound_annual_return_range: "6-14%"
  }
};

const PaperTradingStage3 = () => {
  const [stocks, setStocks] = useState([]);
  const [selectedStock, setSelectedStock] = useState(null);
  const [quantity, setQuantity] = useState(0);
  const [transactionType, setTransactionType] = useState('buy');
  const [currentCash, setCurrentCash] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [chartData, setChartData] = useState([]);
  const [pieChartData, setPieChartData] = useState([]);
  const [currentAssets, setCurrentAssets] = useState([]); // Assuming this is how you've defined it
  const [chatGPTAdvice, setChatGPTAdvice] = useState(''); // State to store ChatGPT advice
  const [profitOrLoss, setProfitOrLoss] = useState(0);
  const [portfolioStdDev, setPortfolioStdDev] = useState(0);
  const [portfolioReturn, setPortfolioReturn] = useState(0);
  const [cagr, setCagr] = useState(0);
  const [priceChartData, setPriceChartData] = useState([]); // State to store price chart data
  const [newsData, setNewsData] = useState([]); // State to store news data
  const [availableStocks, setAvailableStocks] = useState({});
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [filterAssetType, setFilterAssetType] = useState('All');
  const [isScrollingNeeded, setIsScrollingNeeded] = useState(false);
  const [riskProfileChartData, setRiskProfileChartData] = useState([]);
  const [currentAssetClassPercentages, setCurrentAssetClassPercentages] = useState({});
  const [showChatbot, setShowChatbot] = useState(false);
  const [autoMessage, setAutoMessage] = useState('');
  // State to hold the currently hovered asset class details
  const [hoveredAssetClassDetails, setHoveredAssetClassDetails] = useState(null); 

  const [showAdviceModal, setShowAdviceModal] = useState(false);
  const [showPriceChartModal, setShowPriceChartModal] = useState(false);
  const [selectedPriceStockName, setSelectedPriceStockName] = useState('');
  const [showNewsModal, setShowNewsModal] = useState(false);
  const [selectedNewsStockName, setSelectedNewsStockName] = useState('');
  const [priceDomain, setPriceDomain] = useState(null);

  const [showOHLCChart, setShowOHLCChart] = useState(false);


  const toggleChartType = () => {
    setShowOHLCChart(!showOHLCChart);
  };


  const parseAndFormatDate = (dateString) => {
    // Parse the date string using the correct format
    const parsedDate = parse(dateString, "yyyy-MM-dd hh:mm:ss a", new Date());
  
    // Format the date to "MMM do yyyy hh:mm:ssaa"
    // For example, "Jan 15th 2024 11:38:11AM"
    return format(parsedDate, "MMM do yyyy hh:mm:ssaa");
  };


  const generatePieChartData = (profile) => {
    const profileData = riskProfiles[profile];
    return Object.keys(profileData).map((key) => ({
      name: key,
      value: profileData[key],
    }));
  };


  const portfolioValues = chartData.map(item => item.MoneyInPortfolio);
  const minY = Math.min(...portfolioValues) * 0.95; // 5% padding below min
  const maxY = Math.max(...portfolioValues) * 1.05; // 5% padding above max

  // Then store minY and maxY in the state to use them later in rendering the chart
  const [domain, setDomain] = useState([minY, maxY]);


  useEffect(() => {
    const checkScrolling = () => {
      const container = stockListRef.current;
      if (container) {
        const isScrollNeeded = container.scrollWidth > container.clientWidth;
        setIsScrollingNeeded(isScrollNeeded);
      }
    };
  
    // Run on mount and whenever the number of stocks changes
    checkScrolling();
  }, [stocks, filterAssetType]); // Dependency array ensures effect is run when stocks or filterAssetType changes

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
      const cashResponse = await axios.get(`http://localhost:5000/get_current_cash?paperTradingPortfolioName=paper_trading_stage_3&paperTradingTemplateName=${selectedProfile}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setCurrentCash(cashResponse.data.current_cash_value);
      console.log("current_cash_value: ", cashResponse.data.current_cash_value)
    } catch (error) {
      console.error('Error fetching current cash:', error);
    }
  };

  const fetchChartData = async (profile) => {
    try {
      const response = await axios.get(`http://localhost:5000/get_paper_portfolio_data?paperTradingPortfolioName=paper_trading_stage_3&paperTradingTemplateName=${profile}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.data) {
        setProfitOrLoss(response.data.profitOrLoss);
        setPortfolioStdDev(response.data.portfolioStdDev); // Set the portfolio standard deviation
        setCagr(response.data.cagr); // Set the CAGR
        setPortfolioReturn(response.data.portfolioReturn);
        console.log("portfolioValueOverTime: ", response.data.portfolioValueOverTime)
        console.log("moneyInPortfolio: ", response.data.moneyInPortfolio)
        console.log("portfolioReturn: ", response.data.portfolioReturn)
        processChartData(response.data.portfolioValueOverTime, response.data.moneyInPortfolio);
        const newAssetClassPercentages = processPieChartData(response.data.currentAssets, profile);
        setCurrentAssets(response.data.currentAssets);
        setCurrentAssetClassPercentages(newAssetClassPercentages); // Updated after processing pie chart data
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


  const processPieChartData = (currentAssets, profile) => {
    const profileAllocation = riskProfiles[profile]; // Assuming direct object access
    console.log("profile: ", profile)
    console.log("Target template: ", profileAllocation);

    console.log("currentAssets: ", currentAssets)

    const groupedByAssetClass = currentAssets.reduce((acc, asset) => {
        const quantity = asset.quantity || 0;
        let relevantAssetClasses = asset.portfolio_asset_types.filter(ac => profileAllocation.hasOwnProperty(ac));

        if (relevantAssetClasses.length === 0) { // If no relevant classes, consider all
            relevantAssetClasses = asset.portfolio_asset_types;
        }

        const divisionQuantity = quantity / relevantAssetClasses.length;

        relevantAssetClasses.forEach(assetClass => {
            acc[assetClass] = (acc[assetClass] || 0) + divisionQuantity;
        });

        return acc;
    }, {});

    console.log("groupedByAssetClass: ", groupedByAssetClass);

    const totalValue = Object.values(groupedByAssetClass).reduce((acc, value) => acc + value, 0);

    const assetClassPercentages = Object.entries(groupedByAssetClass).reduce((acc, [name, value]) => {
        acc[name] = ((value / totalValue) * 100).toFixed(2) + '%';
        return acc;
    }, {});

    console.log("Asset Class Percentages: ", assetClassPercentages);

    const pieData = Object.entries(assetClassPercentages).map(([name, percentage]) => ({
        name,
        value: parseFloat(percentage)
    }));

    console.log("pieData: ", pieData);

    // Assume setPieChartData is a function to update the state
    setPieChartData(pieData);

    return assetClassPercentages;
  };

  // Event handler for when an asset class slice is hovered
  const handleMouseEnter = (_, index) => {
    const assetClass = pieChartData[index].name;

    // Find the current assets that belong to this asset class
    const currentAssetDetails = currentAssets.filter(asset => 
        // Check if asset.portfolio_asset_types array contains the assetClass
        asset.portfolio_asset_types && asset.portfolio_asset_types.includes(assetClass)
    )
    .map(asset => ({
        name: asset.symbol, // Assuming 'symbol' is the name of the stock
        value: asset.quantity,
        // Optionally, add other details from the asset, like invested_cash, etc.
    }));

    console.log("currentAssetDetails: ", currentAssetDetails);
    setHoveredAssetClassDetails(currentAssetDetails);
  };

  // Event handler for when the mouse leaves an asset class slice
  const handleMouseLeave = () => {
    setHoveredAssetClassDetails(null);
  };

  const getChatGPTAdvice = async (data) => {
    try {
      const response = await axios.post('http://localhost:5000/chatgpt_advice_stage_3', data, {
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

  // Fetch current cash and chart data only after selecting a profile
  useEffect(() => {
    if (selectedProfile) {
        fetchStockData();
        fetchCurrentCash();
        fetchChartData();
    }
  }, [selectedProfile]);

  useEffect(() => {
    if (selectedProfile) {
      setAvailableStocks(filterStocksByProfile(stocks, selectedProfile));
    }
    console.log("selectedProfile: ", selectedProfile)
  }, [selectedProfile, stocks]);


  const fetchStockData = async () => {
    try {
      const response = await axios.get('http://localhost:5000/get_stock_data_stage_3', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      // Ensure the response is an array before setting the state
      const data = Array.isArray(response.data) ? response.data : [];
      const groupedStocks = groupStocksByAssetClass(data);
      setStocks(groupedStocks);
    } catch (error) {
      console.error('Error fetching stock data:', error);
      // Set stocks to an empty array in case of error
      setStocks([]);
    }
  };

  const groupStocksByAssetClass = (stocks) => {
    const grouped = stocks.reduce((groupedStocks, stock) => {
      (groupedStocks[stock.assetClass] = groupedStocks[stock.assetClass] || []).push(stock);
      return groupedStocks;
    }, {});
    
    // Flatten the grouped object into an array
    return Object.values(grouped).flat();
  };


  const filterStocksByProfile = (stocks, profile) => {
    const filteredStocks = {};
    const profileAllocation = riskProfiles[profile];
    Object.keys(profileAllocation).forEach(assetClass => {
      filteredStocks[assetClass] = stocks[assetClass] || [];
    });
    return filteredStocks;
  };

  const handleProfileSelection = async (profile) => {
    setSelectedProfile(profile);
    setAvailableStocks(filterStocksByProfile(stocks, profile));
    setRiskProfileChartData(generatePieChartData(profile));
    
    // Reset states
    setSelectedStock(null);
    setChartData([]);
    setPieChartData([]);
    setNewsData([]);
    setProfitOrLoss(0);
    setPortfolioReturn(0);
    setCagr(0)
    setPortfolioStdDev(0)
    setCurrentCash(0);
    setErrorMessage('');
    setCurrentAssetClassPercentages({});
    
    // Close any open modals
    setShowAdviceModal(false);
    setShowPriceChartModal(false);
    setShowNewsModal(false);
  
    // Fetch new data for the selected profile
    await fetchChartData(profile);
  };
  

  const formatDate = (tickItem) => {
    const date = new Date(tickItem);
    return format(date, 'MMM d');
  };

  const selectStock = (stock) => {
    setSelectedStock(stock);
    console.log("selectedStock: ", stock)
    setQuantity(0);
    setErrorMessage('');
  };

  const viewPriceChart = async (stockSymbol, stockName, event) => {
    event.stopPropagation();
    try {
      const response = await axios.get(`http://localhost:5000/get_price_chart/${stockSymbol}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      console.log("priceChartData: ", response.data)
      setPriceChartData(response.data); // Update the state with chart data
      setSelectedPriceStockName(stockName)
      setShowPriceChartModal(true); // Show the price chart modal
    } catch (error) {
      console.error('Error fetching price chart:', error);
    }
  };


  useEffect(() => {
    if (priceChartData.length) {
      // Extract price values from the priceChartData
      const priceValues = priceChartData.map(item => item.Close);
      let minY = Math.min(...priceValues) * 0.95; // 5% padding below min
      let maxY = Math.max(...priceValues) * 1.05; // 5% padding above max
  
      // Rounding to two decimal places
      minY = parseFloat(minY.toFixed(2));
      maxY = parseFloat(maxY.toFixed(2));
  
      setPriceDomain([minY, maxY]);
    }
  }, [priceChartData]); // This effect should run whenever priceChartData changes
  
  const viewPastNews = async (stockSymbol, stockName, event) => {
    event.stopPropagation();
    try {
      const response = await axios.get(`http://localhost:5000/get_news/${stockSymbol}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setNewsData(response.data); // Update the state with news data
      setSelectedNewsStockName(stockName);
      console.log("news: ", response.data)
      setShowNewsModal(true); // Show the news modal
    } catch (error) {
      console.error('Error fetching news:', error);
    }
  };


  const handleTransaction = async () => {
    // Identify the asset type of the selected stock
    let assetType = '';

    console.log("availableStocks: ", availableStocks)
    console.log("selectedStock: ", selectedStock)
  
    const transactionDetails = {
        stockSymbol: selectedStock.symbol,
        stockName: selectedStock.name,
        quantity: parseInt(quantity),
        transactionType,
        totalAmount: selectedStock.price * parseInt(quantity),
        paperTradingPortfolioName: "paper_trading_stage_3",
        paperTradingTemplateName: selectedProfile,
        assetType: selectedStock.assetClass, // Add asset type to transaction details
        portfolioAssetTypes: selectedStock.portfolioAssetTypes
    };

    console.log("transactionDetails: ", transactionDetails)
  
    try {
        // Execute the transaction
        const response = await axios.post('http://localhost:5000/execute_transaction_paper_trading', transactionDetails, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        fetchCurrentCash();
        setErrorMessage('');

        // Update current assets after the transaction
        let updatedAssets = [...currentAssets];
        const assetIndex = updatedAssets.findIndex(asset => asset.symbol === selectedStock.symbol);

        if (assetIndex >= 0) {
          if (transactionType === 'buy') {
            updatedAssets[assetIndex].quantity += parseInt(quantity);
          } else {
            updatedAssets[assetIndex].quantity -= parseInt(quantity);
          }
        } else if (transactionType === 'buy') {
          updatedAssets.push({
            symbol: selectedStock.symbol,
            quantity: parseInt(quantity),
            invested_cash: selectedStock.price * parseInt(quantity),
            asset_type: selectedStock.assetClass, // Adjust based on your data structure          
            portfolio_asset_types: selectedStock.portfolioAssetTypes

          });
        }

        setCurrentAssets(updatedAssets);
        // Process and calculate the new asset class percentages
        const newAssetClassPercentages = processPieChartData(updatedAssets, selectedProfile);

        console.log("newAssetClassPercentages: ", newAssetClassPercentages)

  
        // Fetch stock data for all stocks
        const stockDataResponse = await axios.get('http://localhost:5000/get_stock_data_stage_3', {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
  
        // Find the selected stock's additional data
        const selectedStockData = stockDataResponse.data.find(stock => stock.symbol === selectedStock.symbol);
  
        // Prepare data for ChatGPT advice request
        const chatGPTData = {
            userActions: `User ${transactionType} ${quantity} shares of ${selectedStock.symbol} (${selectedStock.portfolioAssetTypes}) at a price of $${selectedStock.price} per share with a daily change of ${selectedStock.dailyChange}%, a moving average of $${selectedStockData.movingAverage}, RSI of ${selectedStockData.rsi}, MACD of ${selectedStockData.macd}, and MACD Signal of ${selectedStockData.macdSignal}.`,
            paperTradingPortfolioName: "paper_trading_stage_3",
            paperTradingTemplateName: selectedProfile,
            allStocksData: stockDataResponse.data, // Include data about all stocks
            currentAssetClassPercentages: newAssetClassPercentages,
            expectedStdDevRange: RISK_PROFILE_PORTFOLIO_INFO[selectedProfile]?.portfolio_std_dev_range,
            expectedCAGRRange: RISK_PROFILE_PORTFOLIO_INFO[selectedProfile]?.portfolio_compound_annual_return_range
            // add the current std dev, current cagr
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
  console.log("lastPortfolioValue: ", lastPortfolioValue)


  const CustomToolPietip = ({ active, payload, label, assetDetails }) => {
    if (active && payload && payload.length) {
      // If assetDetails is set, show detailed information
      if (assetDetails) {
        return (
          <div className="custom-tooltip" style={{ backgroundColor: 'rgb(0,13,26,0.9)', padding: '10px', borderRadius: '5px', border: '0.1px solid #676767', textAlign: 'left' }}>
            <ul style={{ listStyleType: 'none', padding: 0, margin: 0 }}>
              {assetDetails.map((detail, index) => (
                <li key={index} style={{ color: '#989898', fontSize: '1.1em', marginBottom: '4px', fontWeight: '400' }}>
                  {detail.name} : {detail.value} share/s 
                </li>
              ))}
            </ul>
          </div>
        );
      } else {
        // Default tooltip content when no asset is hovered
        return (
          <div className="custom-tooltip" style={{ backgroundColor: 'white', padding: '10px', border: '1px solid #ccc' }}>
            <p className="label" style={{ color: '#989898' }}>{`${label}: ${payload[0].value}%`}</p>
          </div>
        );
      }
    }
  
    return null;
  };


  const isActualWithinExpected = (actualValue, expectedRange) => {
    const [minRange, maxRange] = expectedRange.split('-').map(val => parseFloat(val));
    const actual = parseFloat(actualValue);
    if (actual >= minRange && actual <= maxRange) {
      return 'within-range';
    } else {
      return 'outside-range';
    }
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
                <p className="label" style={{ marginBottom: '5px' , color: "#989898"}}>{`${formatDate(label)}`}</p>
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

  const handleQuestionClick = (message) => {
    setShowChatbot(true); // Open the chatbot
    setAutoMessage(message); // Set the message to be sent automatically
};


useEffect(() => {
  if (chartData.length) {
    const portfolioValues = chartData.map(item => item.MoneyInPortfolio);
    let minY = Math.min(...portfolioValues);
    let maxY = Math.max(...portfolioValues);

    // Apply padding
    minY -= (maxY - minY) * 0.05;
    maxY += (maxY - minY) * 0.05;

    // Round minY and maxY to nicer numbers
    minY = Math.floor(minY / 100) * 100; // Example of rounding down to the nearest 100
    maxY = Math.ceil(maxY / 100) * 100; // Example of rounding up to the nearest 100

    setDomain([minY, maxY]);
  }
}, [chartData]); // Dependency array to ensure effect runs when chartData changes

  const CustomPriceTooltip = ({ active, payload, label }) => {
    // Function to format the date
    const formatDate = (dateString) => {
      // Assuming date is in ISO format, adjust as needed
      const date = parseISO(dateString);
      return format(date, 'MMM dd yyyy'); // Format updated to "Dec 18 2023"
    };
  
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip" style={{ backgroundColor: 'rgb(0,13,26,0.8)', padding: '10px', borderRadius: '5px', border: '0.1px solid #676767', textAlign: 'left' }}>
          <p className="label" style={{ marginBottom: '5px', color: "#989898" }}>{`${formatDate(label)}`}</p>
          {payload.map((entry, index) => (
            <p key={`item-${index}`} className="intro" style={{ marginBottom: '5px' }}>
              <span style={{ marginRight: '10px', color: entry.color }}>{entry.name}:</span>
              <span style={{color: entry.color }}>{entry.value.toFixed(2)}</span>
            </p>
          ))}
        </div>
      );
    }
  
    return null;
  };

  return (
    <div className="paper-trading-stage3">
      <h1>Welcome to <bold>Portfolio Contruction</bold></h1>
      <p className='welcome-bottom'>Learn to diversify your Portfolio according to your risk profile!</p>
      <div className="template-selection">
        <h2>Select a Portfolio Template:</h2>
        <div className='template-selection-buttons-container'>
          {Object.keys(riskProfiles).map(profile => (
            <button
              key={profile}
              onClick={() => handleProfileSelection(profile)}
              className={selectedProfile === profile ? 'selected-template' : ''}
            >
              {profile} Portfolio
            </button>
          ))}
        </div>
      </div>
      {selectedProfile && (
        <>
        <div className="pie-charts-container">
          <div className="risk-profile-pie-chart-container">
            {/* <h3>{selectedProfile} Portfolio Distribution</h3> */}
            <h3 className="chart-title">Target Portfolio:</h3>
            <PieChart width={700} height={450} margin={{ top: 20, right: 30, left: 100, bottom: 5 }}>
              <Pie
                data={riskProfileChartData}
                cx={250}
                cy={250}
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                stroke="#000d1a"
              >
                {riskProfileChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={assetTypeColors[entry.name].color || '#d1d1d1'} />
                ))}
              </Pie>
              <Tooltip />
              {/* <Legend /> */}
            </PieChart>
            <div className='target-portfolio-info'>
              <h3><i className="material-icons clickable-icon" style={{fontSize:"1.2em", cursor:"pointer"}} onClick={() => handleQuestionClick(`Can you explain more about the ${RISK_PROFILE_PORTFOLIO_INFO[selectedProfile]?.name} portfolio?`)}>help_outline</i> {RISK_PROFILE_PORTFOLIO_INFO[selectedProfile]?.name}</h3>
              <p>{RISK_PROFILE_PORTFOLIO_INFO[selectedProfile]?.description}</p>
              <a href={RISK_PROFILE_PORTFOLIO_INFO[selectedProfile]?.url} target="_blank" rel="noopener noreferrer">Learn More</a>
            </div>
          </div>
          <div className="current-asset-pie-chart-container">
            {pieChartData.length > 0 ? ( // Check if pieChartData has items
            <>
            <h3 className="chart-title">Current Portfolio:</h3>
            <PieChart width={700} height={450} margin={{ top: 20, right: 30, left: 100, bottom: 5 }}>
              <Pie
                data={pieChartData}
                cx={250}
                cy={250}
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                stroke="#000d1a"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                {pieChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={assetTypeColors[entry.name].color || '#d1d1d1'} />
                ))}
              </Pie>
              <Tooltip content={<CustomToolPietip assetDetails={hoveredAssetClassDetails} />}/>
            </PieChart>
            <div className="portfolio-metrics-container">
          <div className="diversification-check-title">Comparing Target vs. Actual Portfolio Performance</div>
          <div className="expected-metrics">
            <div className="portfolio-metrics">
              <p className="portfolio-metrics-label">Expected Portfolio Std Dev</p>
              <p className="portfolio-metrics-value">{RISK_PROFILE_PORTFOLIO_INFO[selectedProfile]?.portfolio_std_dev_range}</p>
            </div>
            <div className="portfolio-metrics">
              <p className="portfolio-metrics-label">Expected Portfolio CAGR</p>
              <p className="portfolio-metrics-value">{RISK_PROFILE_PORTFOLIO_INFO[selectedProfile]?.portfolio_compound_annual_return_range}</p>
            </div>
          </div>
          <div className="actual-metrics">
            <div className="portfolio-metrics">
              <p className="portfolio-metrics-label">Actual Portfolio Std Dev</p>
              {/* <p className="portfolio-metrics-value">{portfolioStdDev ? `${(portfolioStdDev * 100).toFixed(2)}%` : 'N/A'}</p> */}
              <p className={`portfolio-metrics-value ${
                isActualWithinExpected(portfolioStdDev, RISK_PROFILE_PORTFOLIO_INFO[selectedProfile]?.portfolio_std_dev_range)
              }`}>
                {portfolioStdDev ? `${(portfolioStdDev * 100).toFixed(2)}%` : 'N/A'}
              </p>
            </div>
            <div className="portfolio-metrics">
              <p className="portfolio-metrics-label">Actual Portfolio CAGR</p>
              <p className={`portfolio-metrics-value ${
                isActualWithinExpected(cagr, RISK_PROFILE_PORTFOLIO_INFO[selectedProfile]?.portfolio_compound_annual_return_range)
              }`}>
                {cagr ? `${(cagr * 100).toFixed(2)}%` : 'N/A'}
              </p>
              {/* <p className="portfolio-metrics-value">{cagr ? `${(cagr * 100).toFixed(2)}%` : 'N/A'}</p> */}
            </div>
          </div>
        </div>
            </>
          ) : (
            <p className="no-portfolio-message">No current portfolio yet!</p> // Message displayed when no data
          )}

          </div>
        </div>
        

        <div className="cash-value-container">
          <div className="current-cash-profit-loss-container">
          <div className="current-cash-container">
            <p className="current-cash-label">Virtual Current Cash:<i className="material-icons clickable-icon" onClick={() => handleQuestionClick('What does Virtual cash in a paper trading environment mean?')}>help_outline</i></p>
            <p className="current-cash-value">${currentCash.toFixed(2)}</p>
          </div>
          <div className="profit-loss-container">
            <p className="profit-loss-label">Profit or Loss:<i className="material-icons clickable-icon" onClick={() => handleQuestionClick('What does Profit and Loss mean?')}>help_outline</i></p>
            <p className={`value-box ${profitOrLoss >= 0 ? 'positive-value' : 'negative-value'}`}>
              ${profitOrLoss.toFixed(2)}
            </p>
          </div>
          </div>
          <div className="portfolio-value-return-container">
          <div className="portfolio-value-container">
            <p className="portfolio-value-label">Portfolio Value:<i className="material-icons clickable-icon" onClick={() => handleQuestionClick('What does Portfolio value of a portfolio mean?')}>help_outline</i></p>
            <p className="portfolio-value">${lastPortfolioValue.toFixed(2)}</p>
            <div className="portfolio-return-container">
              <p className="portfolio-return-label">All-time returns:<i className="material-icons clickable-icon" onClick={() => handleQuestionClick('What does All-time returns mean?')}>help_outline</i></p>
              <p className={`portfolio-return-value ${portfolioReturn >= 0 ? 'positive-return' : 'negative-return'}`}>
                {portfolioReturn.toFixed(2)}%
              </p>
            </div>
          </div>
        </div>
        </div>
      {errorMessage && <p className="error-message">{errorMessage}</p>}



      {showPriceChartModal && (
        <div className="modal-overlay">
            <div className="price-chart-modal">
                <button onClick={() => setShowPriceChartModal(false)} className="close-modal-btn">
                    <span className="material-icons-outlined">close</span>
                </button>
                <h1>{`${showOHLCChart ? "OHLC" : "Price"} Chart: ${selectedPriceStockName}`}</h1>
                
                {showOHLCChart ? (
                    <CandlestickChart data={priceChartData} width={600} height={300}/>
                ) : (
                    // Original price chart content
                    <ComposedChart width={600} height={300} data={priceChartData}>
                        <defs>
                            <linearGradient id="colorPv" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#8884d8" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid stroke="none"/>
                        <XAxis dataKey="Date" tickFormatter={formatDate}/>
                        <YAxis domain={priceDomain} />
                        <Tooltip content={<CustomPriceTooltip />}/>
                        <Legend />
                        <Area type="monotone" dataKey="Close" name="Price" dot={false} stroke="#8884d8" fillOpacity={1} fill="url(#colorPv)" />
                    </ComposedChart>
                )}
                <button onClick={toggleChartType} className="toggle-chart-btn">
                    {showOHLCChart ? "Show Price Chart" : "Show OHLC Chart"}
                </button>
            </div>
        </div>
      )}


      {showNewsModal && (
        <div className="modal-overlay">
          <div className="news-modal">
            <h2 className='news-header'>{`Daily News for ${selectedNewsStockName}`}</h2>
            <button onClick={() => setShowNewsModal(false)} className="close-modal-btn"><span class="material-icons-outlined">close</span></button>
            <div className="news-content">
              {newsData.length > 0 ? (
                newsData.map((newsItem, index) => (
                  <>
                  <div key={index} className="news-item">
                    <p className="news-date">{parseAndFormatDate(newsItem.date)}</p>
                    <h3 className="news-headline">{newsItem.headline}</h3>
                    <p className="news-summary">{newsItem.summary}</p>
                    <a href={newsItem.url} target="_blank" rel="noopener noreferrer" className="news-link">Read More</a>
                  </div>
                  </>
                ))
              ) : (
                <p className="no-news-message">No news for today.</p> // Display this message if no news items are found
              )}
            </div>
          </div>
        </div>
      )}

      {chartData.length > 0 && (
        <div className="charts-container">
          <div className="chart-container">
            <h2 className='chart-header'>Portfolio Value and Net Deposits Over Time</h2>
              <ComposedChart width={1300} height={500} data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <defs>
                      <linearGradient id="colorPv" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#8884d8" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                      </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tickFormatter={formatDate} dy={10}/>
                  <YAxis domain={domain} orientation="right" tickFormatter={(value) => `$${value.toFixed(0)}`} dx={5} tickCount={5}/>
                  <CartesianGrid stroke="none" />
                  <Tooltip content={<CustomTooltip />}/>
                  <Legend wrapperStyle={{ paddingTop: '20px' }}/>
                  <Area type="monotone" dataKey="PortfolioValue" name="Portfolio Value" stroke="#8884d8" fillOpacity={1} fill="url(#colorPv)" />
                  <Line type="monotone" dataKey="MoneyInPortfolio" name="Net Deposits" stroke="#82ca9d" dot={false} strokeWidth={2} strokeDasharray="5 5"/>
              </ComposedChart>
            </div>
        </div>
      )}

      <h2 className='stocks-header'>Select stocks: </h2>

      <div className="filter-selection">
        <select value={filterAssetType} onChange={(e) => setFilterAssetType(e.target.value)}>
          <option value="All">All</option>
          <option value="Total Stock Market">Total Stock Market</option>
          <option value="Long Term Bonds">Long Term Bonds</option>
          <option value="Cash and Cash Equivalents">Cash and Cash Equivalents</option>
          <option value="Gold">Gold</option>
          <option value="Emerging Markets">Emerging Markets</option>
          <option value="International Small Cap Value">International Small Cap Value</option>
          <option value="Small Cap Value">Small Cap Value</option>
          <option value="Intermediate Bonds">Intermediate Bonds</option>
          <option value="International Stocks">International Stocks</option>
          <option value="Real Estate">Real Estate</option>
          <option value="Commodities">Commodities</option>
          {/* ...add other asset types as needed */}
        </select>
      </div>       

      <div className="stock-list-controls">
        {/* <button onClick={() => scrollStockList('left')} className="scroll-btn">&lt;</button> */}
        {isScrollingNeeded && (
          <button onClick={() => scrollStockList('left')} className="scroll-btn">&lt;</button>
        )}
        <div className="stock-list-container" ref={stockListRef}>
          <div className="stock-list">
            {stocks.filter((stock) => filterAssetType === 'All' || stock.portfolioAssetTypes.includes(filterAssetType))
            .map(stock => (
              <div key={stock.symbol} className="stock-item" onClick={() => selectStock(stock)}>
                <div className="stock-info">
                  <h2>{stock.name}</h2>
                  <h3>{stock.symbol}</h3>
                  {stock.portfolioAssetTypes.map((type, index) => (
                    <div key={index} style={{
                      backgroundColor: assetTypeColors[type]?.transparent ?? 'rgba(209, 209, 209, 0.3)',// Default color if type not found, with transparency
                      color: assetTypeColors[type]?.color ?? '#ffffff', // Extract RGB from RGBA and set full opacity for text
                      padding: '5px 10px', // Adjust padding as needed
                      borderRadius: '5px',
                      marginTop: '5px',
                      marginBottom: '5px', // Add bottom margin if needed
                      textAlign: 'center',
                      display: 'inline-block', // This makes the container only as wide as its content
                      marginLeft: '5px', // Add left margin between types if displayed inline
                      fontSize: '0.8em', // Adjust font size as needed
                    }}>
                      {type}
                    </div>
                  ))}
                  <p><span className="label">Price:</span> <span className="value">${stock.price}</span></p>
                  <p><span className="label">Daily Change:</span> <span className={`value ${stock.dailyChange >= 0 ? 'positive-value' : 'negative-value'}`}>{stock.dailyChange}%</span></p>
                  <p><span className="label">Moving Average:</span> <span className="value-rest">${stock.movingAverage}</span></p>
                  <p><span className="label">RSI:</span> <span className="value-rest">{stock.rsi}</span></p>
                  <p><span className="label">MACD:</span> <span className="value-rest">${stock.macd}</span></p>
                  <p><span className="label">MACD Signal:</span> <span className="value-rest">${stock.macdSignal}</span></p>
                  <div className="button-container">
                    <button onClick={(e) => viewPriceChart(stock.symbol, stock.name, e)}>View Price Chart</button>
                    <button onClick={(e) => viewPastNews(stock.symbol, stock.name, e)}>View Daily News</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* <button onClick={() => scrollStockList('right')} className="scroll-btn">&gt;</button> */}
        {isScrollingNeeded && (
          <button onClick={() => scrollStockList('right')} className="scroll-btn">&gt;</button>
        )}
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
          <h2 className='advice-header'>{`WealthWiseAdvisor's Advice`}</h2>
            {/* <p className="chatgpt-advice">{chatGPTAdvice}</p> */}
            <div style={{fontFamily: 'Poppins'}} dangerouslySetInnerHTML={{ __html: chatGPTAdvice }} />
            <button onClick={() => setShowAdviceModal(false)} className="close-advice-btn"><span class="material-icons-outlined">close</span></button>
          </div>
        </div>
      )}
      </>
      )}

    {showChatbot && <ChatBot closeChatbot={() => setShowChatbot(false)} autoSendMessage={autoMessage} />}
    </div>
  );
};

export default PaperTradingStage3;