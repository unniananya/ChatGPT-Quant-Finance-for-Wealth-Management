import React, { useState, useEffect, useRef, useMemo } from 'react';
import './styles/CreatePortfolio.css';
import chatbotLogo from './styles/images/chatbot.png';
import sendLogo from './styles/images/send.png';
import axios from 'axios'; // Make sure axios is installed and imported
import { LineChart, Line, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, Tooltip, Legend, ReferenceDot, Label, ComposedChart, Area } from 'recharts';
import { format, parseISO, parse } from 'date-fns';
import CandlestickChart from './CandlestickChart';
import { Link } from 'react-router-dom';
import ChatBot from './ChatBot';

const CreatePortfolio = () => {
    const [showChatBot, setShowChatBot] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [userInput, setUserInput] = useState('');
    const [chatHistory, setChatHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [portfolioName, setPortfolioName] = useState('');
    const [isPortfolioNameUnique, setIsPortfolioNameUnique] = useState(true);
    const [showAssetAllocationPage, setShowAssetAllocationPage] = useState(false);
    const [portfolios, setPortfolios] = useState([]); // State to store the list of portfolios
    const [selectedPortfolioDetails, setSelectedPortfolioDetails] = useState(null); // State to store the selected portfolio details
    const [showPopup, setShowPopup] = useState(false);
    const [allocationData, setAllocationData] = useState({});
    const [portfolioData, setPortfolioData] = useState({});
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [activePortfolio, setActivePortfolio] = useState(null);

    const [selectedPriceStockName, setSelectedPriceStockName] = useState('');
    const [selectedNewsStockName, setSelectedNewsStockName] = useState('');
    const [selectedRecommendationStockName, setSelectedRecommendationStockName] = useState('');

    const [chatGPTAdvice, setChatGPTAdvice] = useState(''); // State to store ChatGPT advice
    const [showAdviceModal, setShowAdviceModal] = useState(false);

    // New states for handling transactions
    const [stockDataResponse, setStockDataResponse] = useState(null);
    const [transactionStock, setTransactionStock] = useState(null); // State for the stock selected for a transaction
    const [quantity, setQuantity] = useState(1); // Default to 1 for better UX
    const [transactionType, setTransactionType] = useState('buy');
    const [errorMessage, setErrorMessage] = useState('');

    // New states for the stock list
    const [stocks, setStocks] = useState([]);
    const [selectedStock, setSelectedStock] = useState(null);
    const [selectedStockSymbol, setSelectedStockSymbol] = useState(null)
    const [currentPortfolioAssets, setCurrentPortfolioAssets] = useState([]);
    const [accountBalance, setAccountBalance] = useState(0);
    const [portfolioValue, setPortfolioValue] = useState(0);
    const [pieChartData, setPieChartData] = useState([]);

    const [selectedPortfolioTemplate, setSelectedPortfolioTemplate] = useState(null)

    const [selectedAssetClasses, setSelectedAssetClasses] = useState([]);

    const [showPriceChartModal, setShowPriceChartModal] = useState(false);
    const [showNewsModal, setShowNewsModal] = useState(false);

    const [priceChartData, setPriceChartData] = useState([]); // State to store price chart data
    const [newsData, setNewsData] = useState([]); // State to store news data

    const [showRecommendationModal, setShowRecommendationModal] = useState(false);
    const [recommendationData, setRecommendationData] = useState(null);

    const [showTechnicalChartModal, setShowTechnicalChartModal] = useState(false);
    const [technicalChartData, setTechnicalChartData] = useState([]); // State to store price chart data
    const [isTechnicalChart, setIsTechnicalChart] = useState(false);

    const [showChartModal, setShowChartModal] = useState(false);

    const [showTechnical2ChartModal, setShowTechnical2ChartModal] = useState(false);
    const [technical2ChartData, setTechnical2ChartData] = useState([]); // State to store price chart data
    const [isTechnical2Chart, setIsTechnical2Chart] = useState(false);


    const [showTechnical3ChartModal, setShowTechnical3ChartModal] = useState(false);
    const [technical3ChartData, setTechnical3ChartData] = useState([]); // State to store price chart data
    const [isTechnical3Chart, setIsTechnical3Chart] = useState(false);


    const [showTechnical4ChartModal, setShowTechnical4ChartModal] = useState(false);
    const [technical4ChartData, setTechnical4ChartData] = useState([]); // State to store price chart data
    const [isTechnical4Chart, setIsTechnical4Chart] = useState(false);

    const [showTechnical5ChartModal, setShowTechnical5ChartModal] = useState(false);
    const [technical5ChartData, setTechnical5ChartData] = useState([]); // State to store price chart data
    const [isTechnical5Chart, setIsTechnical5Chart] = useState(false);

    const [chartType, setChartType] = useState('price');

    const [showOHLCChart, setShowOHLCChart] = useState(false);

    const [showChatbot, setShowChatbot] = useState(false);
    const [autoMessage, setAutoMessage] = useState('');
    const [profilePicURL, setProfilePicURL] = useState('');

    useEffect(() => {
        const fetchUserInfo = async () => {
          try {
            const response = await axios.get('http://localhost:5000/get-user-info', {
              headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') },
            });
            if (response.data) {
              setProfilePicURL('http://localhost:5000/' + response.data.profile_pic);
            }
          } catch (error) {
            console.error("There was an error fetching user info:", error);
          }
        };
    
        fetchUserInfo();
    }, []);

    // Assuming profilePicURL is your state variable holding the profile picture URL
    const userMessageStyle = {
        backgroundImage: `url(${profilePicURL})`,
    };

    const handleQuestionClick = (message, event) => {
        event.stopPropagation();
        setShowChatbot(true); // Open the chatbot
        setAutoMessage(message); // Set the message to be sent automatically
    };


    const toggleChartType = () => {
        setShowOHLCChart(!showOHLCChart);
    };

    const clearSearchResults = () => {
        setSelectedStock(null);
    };

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
    
    
    
    


    const getChatGPTAdvice = async (data) => {
        try {
          const response = await axios.post('http://localhost:5000/chatgpt_advice', data, {
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




    const parseAndFormatDate = (dateString) => {
        // Parse the date string using the correct format
        const parsedDate = parse(dateString, "yyyy-MM-dd hh:mm:ss a", new Date());
      
        // Format the date to "MMM do yyyy hh:mm:ssaa"
        // For example, "Jan 15th 2024 11:38:11AM"
        return format(parsedDate, "MMM do yyyy hh:mm:ssaa");
    };

    // Modified function to handle stock selection for transactions
    const handleSelectStockForTransaction = (stock) => {
        setTransactionStock(stock);
        console.log("transactionStock: ", stock)
    };


    const handleShowForm = () => {
        setActivePortfolio(null);
        setSelectedPortfolioDetails(null);
        setShowForm(true);
    };


    // Function to toggle the search popup
    const toggleSearchPopup = () => {
        // If closing the search popup, reset selected asset classes
        if (isSearchOpen) {
            setSelectedAssetClasses([]); // Reset selected asset classes to initial state
        }
        setIsSearchOpen(!isSearchOpen);
    };

    const handlePortfolioNameChange = async (e) => {
        const newName = e.target.value;
        setPortfolioName(newName);
    
        // Check the uniqueness of the portfolio name if it's not empty
        if (newName.trim()) {
            const isUnique = await checkPortfolioName(newName);
            setIsPortfolioNameUnique(isUnique);
        } else {
            setIsPortfolioNameUnique(true); // Reset when the input is empty
        }
    };


    // Function to fetch the list of portfolios
    const fetchPortfolios = async () => {
        try {
            const response = await axios.get('http://localhost:5000/get_user_portfolios_not_auto', {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setPortfolios(response.data);
        } catch (error) {
            console.error('Error fetching portfolios:', error);
        }
    };

    // Call fetchPortfolios when the component mounts
    useEffect(() => {
        fetchPortfolios();
    }, []);

    const handleSelectPortfolio = async (portfolioName) => {
        const portfolioDetails = portfolios.find(p => p.portfolio_name === portfolioName);
        setSelectedPortfolioDetails(portfolioDetails);
        setActivePortfolio(portfolioName);
        console.log("portfolioDetails: ", portfolioDetails);
        setShowForm(true); // Show the form with the details of the selected portfolio
    
        // Call fetchCurrentPortfolioWeights and wait for pieChartData
        const pieChartData = await fetchCurrentPortfolioWeights(portfolioName, portfolioDetails);
        setPieChartData(pieChartData);
    
        // Return pieChartData so it can be used outside this function
        return pieChartData;
    };


    const checkPortfolioName = async (name) => {
        try {
            const response = await axios.post('http://localhost:5000/check_portfolio_name', 
                { portfolioName: name }, 
                {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                }
            );
            return response.data.isUnique;
        } catch (error) {
            console.error('Error checking portfolio name:', error);
            return false; // Assume not unique if there's an error
        }
    };


    const handleTemplateClick = () => {
        setShowChatBot(true); // This will open the chatbot when 'Template' is clicked
        setUseTemplate(true);
    };


    // New ref for the scrolling list
    const stockListRef = useRef(null);
    // Add this new state to manage the template selection
    const [useTemplate, setUseTemplate] = useState(null);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [chatHistory]);

    const handleCloseChatbot = () => {
        setShowChatBot(false);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !isLoading && userInput.trim()) {
            handleAsk();
        }
    };

    const handleCreatePortfolio = async () => {
        // Send request to create new portfolio without a template
        try {
            const response = await axios.post('http://localhost:5000/create_new_portfolio', 
                { portfolioName: portfolioName }, 
                {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                }
            );
            console.log(response.data);
            fetchPortfolios();
            // Handle response, e.g., navigate to a different page or show a success message
        } catch (error) {
            console.error('Error creating portfolio:', error);
        }
    };


    // Function to handle the "No Template" button click
    const handleNoTemplateClick = () => {
        setUseTemplate(false);
        handleCreatePortfolio(); // Call the create portfolio function directly
    };

    const handleAsk = async () => {
        if (!userInput.trim()) return;
    
        setIsLoading(true);
    
        try {
            const response = await axios.post('http://localhost:5000/gettemplate1', { prompt: userInput, portfolioName: portfolioName }, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
    
            if (response.data.message === "finished") {
                setShowAssetAllocationPage(true);
                setAllocationData(response.data.asset_allocation);
                setPortfolioData(response.data.portfolio_description)
                console.log("allocationData: ", response.data.asset_allocation)
                console.log("portfolio_description: ", response.data.portfolio_description)
                setShowPopup(true);
                setShowChatBot(false);
                fetchPortfolios();
            } else {
                setChatHistory(prevHistory => [...prevHistory, 
                    { role: 'user', message: userInput },
                    { role: 'assistant', message: response.data }
                ]);
            }
        } catch (error) {
            if (error.response && error.response.data) {
                console.error('Error:', error.response.data.error);
            } else {
                console.error('Error executing ask:', error);
            }
        } finally {
            setUserInput('');
            setIsLoading(false);
        }
    };


    // const handleDeletePortfolio = async () => {
    //     if (!portfolioName.trim()) {
    //         console.error('Please enter a portfolio name to delete.');
    //         return;
    //     }
    
    //     try {
    //         const response = await axios.delete('http://localhost:5000/delete_portfolio', {
    //             data: { portfolioName: portfolioName },  // Axios DELETE requests send data in the `data` field
    //             headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    //         });
    //         console.log(response.data);
    //         setShowForm(false);
    //         // Handle response, e.g., resetting form, showing a success message
    //     } catch (error) {
    //         console.error('Error deleting portfolio:', error);
    //     }
    // };


    const handleDeletePortfolio = async () => {
        // Use selectedPortfolioDetails if available; otherwise, fall back to portfolioName
        const portfolioNameToDelete = selectedPortfolioDetails?.portfolio_name || portfolioName;
    
        if (!portfolioNameToDelete.trim()) {
            console.error('No portfolio selected for deletion.');
            return;
        }
    
        try {
            const response = await axios.delete('http://localhost:5000/delete_portfolio', {
                data: { portfolioName: portfolioNameToDelete },
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            console.log(response.data);
            setShowForm(false);
            fetchPortfolios();
            // Additional logic after successful deletion
        } catch (error) {
            console.error('Error deleting portfolio:', error);
        }
    };

    
    // New useEffect to fetch stock data
    useEffect(() => {
        fetchStockData();
    }, []);

    // Function to fetch stock data
    const fetchStockData = async () => {
        try {
            const response = await axios.get('http://localhost:5000/get_stock_data_stage_3', {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setStocks(response.data);
            console.log("stocks: ", response.data)
        } catch (error) {
            console.error('Error fetching stock data:', error);
        }
    };

    // Function to scroll the stock list
    const scrollStockList = (direction) => {
        if (stockListRef.current) {
            const { scrollLeft, clientWidth } = stockListRef.current;
            const newScrollPosition = direction === 'left'
                ? scrollLeft - clientWidth
                : scrollLeft + clientWidth;
            stockListRef.current.scrollTo({ left: newScrollPosition, behavior: 'smooth' });
        }
    };


    const fetchCurrentPortfolioWeights = async (portfolioName, portfolioDetails) => {
        try {
          const response = await axios.get(`http://localhost:5000/get_portfolio_weights_data?portfolioName=${encodeURIComponent(portfolioName)}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          });
          setCurrentPortfolioAssets(response.data.currentAssets);
          setAccountBalance(response.data.accountBalance)
          setPortfolioValue(response.data.portfolioValue)
          const pieChartData = processPieChartData(response.data.currentAssets, portfolioDetails)
          setSelectedPortfolioTemplate(portfolioDetails.template)
          return pieChartData;
        } catch (error) {
          console.error('Error fetching current portfolio weights:', error);
        }
    };



    const processPieChartData = (currentAssets, portfolioDetails) => {
        console.log("currentAssets: ", currentAssets);
        console.log("Target template: ", portfolioDetails.template);
    
        // Parse the template string into an object
        const template = JSON.parse(portfolioDetails.template.replace(/'/g, '"'));
    
        // Group assets by class and sum their values based on the template
        const groupedByAssetClass = currentAssets.reduce((acc, asset) => {
            const quantity = asset.quantity || 0;
            if (asset.portfolio_asset_types && asset.portfolio_asset_types.length > 0) {
                // Filter asset classes that are in the template
                const relevantAssetClasses = asset.portfolio_asset_types.filter(ac => template[ac]);
                console.log("relevantAssetClasses: ", relevantAssetClasses)
                const divisionCount = relevantAssetClasses.length > 0 ? relevantAssetClasses.length : asset.portfolio_asset_types.length;
                const quantityPerClass = quantity / divisionCount;
                console.log("quantityPerClass: ", quantityPerClass)
    
                // If there are relevant asset classes, use them, otherwise, use all
                const assetClassesToUse = relevantAssetClasses.length > 0 ? relevantAssetClasses : asset.portfolio_asset_types;
                assetClassesToUse.forEach(assetClass => {
                    acc[assetClass] = (acc[assetClass] || 0) + quantityPerClass;
                });
            } else {
                // If no portfolio_asset_types, classify as 'Unknown'
                acc['Unknown'] = (acc['Unknown'] || 0) + quantity;
            }
            return acc;
        }, {});
    
        console.log("groupedByAssetClass: ", groupedByAssetClass);
    
        // Calculate total value of all assets
        const totalValue = Object.values(groupedByAssetClass).reduce((acc, quantity) => acc + quantity, 0);
        console.log("totalValue: ", totalValue)
    
        // Calculate and store percentage of each asset class
        const assetClassPercentages = {};
        Object.entries(groupedByAssetClass).forEach(([name, quantity]) => {
            assetClassPercentages[name] = ((quantity / totalValue) * 100).toFixed(2);
        });

        console.log("assetClassPercentages: ", assetClassPercentages);
    
        // Convert the grouped assets into pie chart data format
        const pieData = Object.entries(groupedByAssetClass).map(([name, quantity]) => ({
            name,
            value: quantity,
        }));
    
        setPieChartData(pieData);
        console.log("pieData: ", pieData);

        return pieData;
        // return assetClassPercentages;
    };

    const CustomTooltip = ({ active, payload, total }) => {
        if (active && payload && payload.length) {
          const value = payload[0].value; // get the value from the payload
          const percentage = ((value / total) * 100).toFixed(2); // calculate the percentage
          console.log("value: ", value)
          console.log("total: ", total)
      
          return (
            <div className="custom-tooltip">
              <p className="label">{`${payload[0].name} : ${percentage}%`}</p>
              {/* You can add more details here if you want */}
            </div>
          );
        }
      
        return null;
    };

    let totalValue = 0; // Default value in case pieChartData is empty

    if (pieChartData) {
        totalValue = pieChartData.reduce((acc, entry) => acc + entry.value, 0);
    }

    const parseAllocationData = () => {
        // Check if selectedPortfolioDetails is defined and has a template
        if (!selectedPortfolioDetails || !selectedPortfolioDetails.template || selectedPortfolioDetails.template === "no template") {
            // setisTemplatePortfolio(false)
            return [];
        }
    
        try {
            const correctedJSONString = selectedPortfolioDetails.template
                .replace(/'/g, '"')
                .replace(/\n/g, '')
                .replace(/\s+/g, ' ')
                .trim();
            // Check if the corrected string is "no template" after replacements, in case the API returns a quoted string
            if (correctedJSONString === "\"no template\"" || correctedJSONString.toLowerCase() === "no template") {
                return [];
            }
            const allocationDataParsed = JSON.parse(correctedJSONString);
            return Object.keys(allocationDataParsed).map((key) => ({
                name: key,
                value: Number(allocationDataParsed[key].replace('%', ''))
            }));
        } catch (error) {
            console.error("There was an error parsing the allocation data:", error);
            return [];
        }
    };
    
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8400C4'];
    

    const SearchPopup = ({ isOpen, closeSearch}) => {
        const [searchQuery, setSearchQuery] = useState('');
        const [searchResults, setSearchResults] = useState([]);
        const [selectedAssetClass, setSelectedAssetClass] = useState('Any');
        const [selectedTags, setSelectedTags] = useState([]);


        const handleAddTag = (newTag) => {
            if (newTag !== "Any" && !selectedTags.includes(newTag)) {
                setSelectedTags([...selectedTags, newTag]);
            }
        };
    
        const handleRemoveTag = (tagToRemove) => {
            setSelectedTags(selectedTags.filter(tag => tag !== tagToRemove));
        };


        const handleSelectStock = async (stock) => {
            try {
                console.log("stock name: ", stock.name)
                const response = await axios.get(`http://localhost:5000/get_stock_details?symbol=${encodeURIComponent(stock.symbol)}&name=${encodeURIComponent(stock.name)}`);
                setSelectedStock(response.data);
                console.log("Stock info: ", response.data)
                // You can now use this data to display detailed information in your UI
            } catch (error) {
                console.error('Error fetching stock details:', error);
            }
        };
    


        useEffect(() => {
            const fetchSearchResults = async () => {
                try {
                    // Construct the endpoint even if the searchQuery is empty but selectedAssetClasses are provided
                    // const assetClassesString = selectedAssetClasses.join(',');
                    // const queryParam = searchQuery.length > 0 ? `query=${encodeURIComponent(searchQuery)}` : '';
                    // const assetClassParam = selectedAssetClasses.length > 0 ? `&asset_class=${encodeURIComponent(assetClassesString)}` : '';

                    const assetClassesString = selectedTags.join(',');
                    const queryParam = searchQuery.length > 0 ? `query=${encodeURIComponent(searchQuery)}` : '';
                    const assetClassParam = selectedTags.length > 0 ? `&asset_class=${encodeURIComponent(assetClassesString)}` : '';
                    const endpoint = `http://localhost:5000/search_stocks?${queryParam}${assetClassParam}`;
        
                    // Only make the request if there's a search query or at least one asset class selected
                    if (searchQuery.length > 0 || selectedTags.length > 0) {
                        const response = await axios.get(endpoint);
                        setSearchResults(response.data);
                    } else {
                        setSearchResults([]);
                    }
                } catch (error) {
                    console.error('Error searching stocks:', error);
                    setSearchResults([]);
                }
            };
        
            fetchSearchResults();
        }, [searchQuery, selectedAssetClasses, selectedTags]);
    
        if (!isOpen) return null;
    
        return (
            <div className="search-overlay">
                <div className="search-popup">
                    <h2 className='search-heading'>Search stocks</h2>
                    <button onClick={closeSearch} className="close-search-btn">&times;</button>
                    <h3 className='search-name-heading'>Enter stock name or symbol</h3>
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Search name or symbol..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoFocus
                    />
                    <h3 className='filter-heading'>Filter based on asset class</h3>
                        <select
                            onChange={(e) => handleAddTag(e.target.value)}
                            className="asset-class-dropdown"
                        >
                        <option value="Any">Any</option>
                        <option value="Cash and Cash Equivalents">Cash and Cash Equivalents</option>
                        <option value="Large Cap Blend">Large Cap Blend</option>
                        <option value="Small Cap Value">Small Cap Value</option>
                        <option value="International Stocks">International Stocks</option>
                        <option value="World Developed Stocks">World Developed Stocks</option>
                        <option value="International Large Cap Blend">International Large Cap Blend</option>
                        <option value="Intermediate Bonds">Intermediate Bonds</option>
                        <option value="International Bonds">International Bonds</option>
                        <option value="Short Term Bonds">Short Term Bonds</option>
                        <option value="International Large Cap Value">International Large Cap Value</option>
                        <option value="Gold">Gold</option>
                        <option value="International Small Cap Blend">International Small Cap Blend</option>
                        <option value="Total Stock Market">Total Stock Market</option>
                        <option value="Small Cap Growth">Small Cap Growth</option>
                        <option value="Emerging Markets">Emerging Markets</option>
                        <option value="Large Cap Value">Large Cap Value</option>
                        <option value="International Small Cap Value">International Small Cap Value</option>
                        <option value="Real Estate">Real Estate</option>
                        <option value="Long Term Bonds">Long Term Bonds</option>
                        <option value="Small Cap Blend">Small Cap Blend</option>
                        <option value="Large Cap Growth">Large Cap Growth</option>
                        <option value="ESG">ESG</option>
                        <option value="Cryptocurrencies">Cryptocurrencies</option>
                        <option value="Commodities">Commodities</option>
                        <option value="Other">Other</option>
                    </select>
                    <div className="tags-container">
                        {selectedTags.map((tag, index) => (
                            <div key={index} 
                                className="tag" 
                                style={{
                                    backgroundColor: assetTypeColors[tag]?.transparent, 
                                    color: assetTypeColors[tag]?.color
                                }}>
                                {tag} <button onClick={() => handleRemoveTag(tag)} style={{color: assetTypeColors[tag]?.color}}><span class="material-icons-outlined">close</span></button>
                            </div>
                        ))}
                    </div>
                    <div className="search-results">
                        {searchResults.map((stock, index) => (
                            <div key={index} className="search-result-item" onClick={() => {
                                handleSelectStock(stock);
                                closeSearch();
                            }}>
                                <div className="search-stock-info">
                                    <div className="search-stock-name">{stock.name}</div>
                                    <div className="search-stock-symbol">{stock.symbol}</div>
                                </div>
                                <div className="asset-types-container">
                                    {stock.portfolio_asset_types && stock.portfolio_asset_types.map((type, typeIndex) => (
                                        <span key={typeIndex} 
                                            className="asset-type-box"
                                            style={{
                                                backgroundColor: assetTypeColors[type]?.transparent || 'rgba(255, 255, 255, 0.2)',
                                                color: assetTypeColors[type]?.color || '#ffffff'
                                            }}>
                                            {type}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };


    // Function to handle transactions
    const handleTransaction = async () => {
        if (!transactionStock || quantity <= 0) {
            setErrorMessage('Please enter a valid quantity.');
            return;
        }

        const transactionDetails = {
            stockSymbol: transactionStock.symbol,
            stockName: transactionStock.name,
            quantity: parseInt(quantity),
            transactionType,
            totalAmount: transactionStock.price * parseInt(quantity),
            portfolioName: selectedPortfolioDetails.portfolio_name,
            assetType: transactionStock.assetClass, // Add asset type to transaction details
            portfolioAssetTypes: transactionStock.portfolioAssetTypes
            // Include other details as needed for your backend API
        };

        try {

            console.log("transactionDetails: ", transactionDetails)
            // Assuming you have an API endpoint to handle transactions
            const response = await axios.post('http://localhost:5000/execute_transaction', transactionDetails, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            // Handle successful transaction here, e.g., fetching updated data
            console.log('Transaction successful', response.data);
            const pieData = await handleSelectPortfolio(selectedPortfolioDetails.portfolio_name)
            setTransactionStock(null); // Reset after successful transaction
            setErrorMessage('');

            const stockSymbol = transactionStock.symbol;

            const stockDataResponse = await axios.get(`http://localhost:5000/get_selected_stock_info?symbol=${stockSymbol}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });

            setStockDataResponse(stockDataResponse);

            console.log("stockDataResponse: ", stockDataResponse)

            console.log("macdSignal: ", stockDataResponse.data.macdSignal)

            // Prepare data for ChatGPT advice request
            const chatGPTData = {
                userActions: `User ${transactionType} ${quantity} shares of ${transactionStock.symbol} at a price of $${transactionStock.price} per share with a daily change of ${transactionStock.dailyChange}%, a moving average of $${stockDataResponse.data.movingAverage}, RSI of ${stockDataResponse.data.rsi}, MACD of ${stockDataResponse.data.macd}, and MACD Signal of ${stockDataResponse.data.macdSignal}.`,
                portfolioName: selectedPortfolioDetails.portfolio_name,
                // allStocksData: stockDataResponse.data, // Include data about all stocks
                currentAssetClassPercentages: pieData,
                targetProfile: selectedPortfolioDetails.template
            };
            console.log("chatGPTData: ", chatGPTData)
            getChatGPTAdvice(chatGPTData);
        } catch (error) {
            if (error.response && error.response.data && error.response.data.error) {
                // Backend specific error message
                setErrorMessage(error.response.data.error);
            } else {
                // Generic error message for other types of errors
                setErrorMessage('Transaction failed. Please try again.');
            }
        }
    };


    const handleDepositClick = () => {
        // Placeholder for your deposit logic
        console.log("Deposit Money button clicked!");
      
        // Example: Navigate to a deposit page or open a deposit modal
        // If you're using React Router for navigation, you might do something like:
        // history.push('/deposit');
        
        // If you're opening a modal directly in the component, you might set state to show the modal:
        // setShowDepositModal(true);
      }


    const ChartModal = ({
        showChartModal,
        priceChartData,
        technicalChartData,
        technical2ChartData, // Assuming you've prepared this state similarly
        technical3ChartData, // Add state for technical3 chart data
        technical4ChartData,
        technical5ChartData,
        setShowChartModal,
        isTechnicalChart,
        setIsTechnicalChart,
        viewTechnicalChart,
        viewTechnical2Chart, // New prop to fetch technical2 chart data
        viewTechnical3Chart, // New prop to fetch technical3 chart data
        viewTechnical4Chart,
        viewTechnical5Chart,
        currentStockSymbol,
        chartType, // 'price', 'technical', 'technical2'
        setChartType // Function to update chartType
      }) => {
        // Determine which chart data to use
        let chartData;
        switch (chartType) {
          case 'technical':
            chartData = technicalChartData;
            break;
          case 'technical2':
            chartData = technical2ChartData;
            break;
          case 'technical3':
            chartData = technical3ChartData; // Use technical3ChartData for 'technical3'
            break;
          case 'technical4':
            chartData = technical4ChartData; // Use technical3ChartData for 'technical3'
            break;
          case 'technical5':
            chartData = technical5ChartData; // Use technical3ChartData for 'technical3'
            break;
          default:
            chartData = priceChartData;
        }
      
        // Calculate min and max values for the Y-axis domain
        const closeValues = chartData.map(data => data.Close);
        const minY = Math.min(...closeValues);
        const maxY = Math.max(...closeValues);
      
        const padding = (maxY - minY) * 0.05; // 5% padding
        const domain = [minY - padding, maxY + padding];

        const maxCloseValue = Math.max(...closeValues);
        const minCloseValue = Math.min(...closeValues);
        const range = maxCloseValue - minCloseValue;

        // Function to "nice" a number up to a more readable value
        const niceInterval = (range, numIntervals) => {
        const rawInterval = range / numIntervals;
        const magnitude = Math.pow(10, Math.floor(Math.log10(rawInterval)));
        const normalizedInterval = rawInterval / magnitude;
        
        let niceFactor;
        if (normalizedInterval <= 1) {
            niceFactor = 1;
        } else if (normalizedInterval <= 2) {
            niceFactor = 2;
        } else if (normalizedInterval <= 5) {
            niceFactor = 5;
        } else {
            niceFactor = 10;
        }

        return niceFactor * magnitude;
        };

        const interval = niceInterval(range, 4); // Desired number of intervals is 4 for 5 ticks
        const niceMinY = Math.floor(minCloseValue / interval) * interval;
        const niceMaxY = Math.ceil(maxCloseValue / interval) * interval;

        // Ensure 5 ticks by calculating the step size and generating tick values
        const tickValues = Array.from({ length: 5 }, (_, index) => niceMinY + interval * index);

        

        const CustomPriceTooltip = ({ active, payload, label }) => {
            if (active && payload && payload.length) {
                const data = payload[0].payload; // Assuming the price is in the first payload
                const formattedDate = new Date(data.Date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                });
              return (
                <div style={{
                  backgroundColor: 'rgba(0, 26, 51, 0.8)',
                  padding: '10px',
                  borderRadius: '5px',
                  border: '0.1px solid #676767',
                  textAlign: 'left'
                }}>
                  <p style={{ color: '#989898', fontSize: '0.9em', fontWeight: '500' }}>{formattedDate}</p>
                  {/* <p style={{ color: '#8884d8', fontSize: '1em', fontWeight: '400' }}>{`Price: ${payload[0].value.toFixed(1)}`}</p> */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#8884d8', fontSize: '0.9em', fontWeight: '500', marginRight: '20px' }}>Price:</span>
                    <span style={{ color: '#8884d8', fontSize: '0.9em', fontWeight: '500' }}>{`$${payload[0].value.toFixed(1)}`}</span>
                </div>
                </div>
              );
            }
          
            return null;
        };
        

        const formatDate = (dateString) => {
            // Assuming date is in ISO format, adjust as needed
            const date = parseISO(dateString);
            return format(date, 'MMM dd'); // e.g., Dec 18 2023
        };

      
        const handleViewTechnicalChart = async () => {
          if (chartType !== 'technical') {
            await viewTechnicalChart(currentStockSymbol);
            setChartType('technical');
          }
        };
      
        const handleViewTechnical2Chart = async () => {
          if (chartType !== 'technical2') {
            await viewTechnical2Chart(currentStockSymbol);
            setChartType('technical2');
          }
        };

        const handleViewTechnical3Chart = async () => {
            if (chartType !== 'technical3') {
              await viewTechnical3Chart(currentStockSymbol); // Ensure this function is implemented to fetch technical3 data
              setChartType('technical3');
            }
        };

        const handleViewTechnical4Chart = async () => {
            if (chartType !== 'technical4') {
              await viewTechnical4Chart(currentStockSymbol); // Ensure this function is implemented to fetch technical3 data
              setChartType('technical4');
            }
        };

        const handleViewTechnical5Chart = async () => {
            if (chartType !== 'technical5') {
              await viewTechnical5Chart(currentStockSymbol); // Ensure this function is implemented to fetch technical3 data
              setChartType('technical5');
            }
        };
      
        const handleViewPriceChart = () => {
          if (chartType !== 'price') {
            setChartType('price');
          }
        };

        const handleViewOHLCChart = () => {
            if (chartType !== 'ohlc') {
              setChartType('ohlc');
            }
          };

          const getChartContainerStyle = (chartType) => {
            switch(chartType) {
              case 'technical':
              case 'technical2':
              case 'technical3':
              case 'technical4':
              case 'technical5':
                // Return styles that shift the chart to the left for technical charts
                return { marginRight: '200px' };
              default:
                // Return the default style for price and OHLC charts
                return {};
            }
          };
      
        return (
          showChartModal && Array.isArray(chartData) && (
            <div className="modal-overlay">
              <div className="price-chart-modal">
                <button onClick={() => setShowChartModal(false)} className="close-modal-btn"><span class="material-icons-outlined">close</span></button>
                <div className="pattern-button-container">
                {chartType !== 'price' && (
                  <button onClick={handleViewPriceChart} className="pattern-button">
                    View Price Chart
                  </button>
                )}
                {chartType !== 'ohlc' && (
                  <button onClick={handleViewOHLCChart} className="pattern-button">
                    View OHLC Chart
                  </button>
                )}
                {chartType !== 'technical' && (
                  <button onClick={handleViewTechnicalChart} className="pattern-button">
                    View Head and Shoulder Pattern
                  </button>
                )}
                {chartType !== 'technical2' && (
                  <button onClick={handleViewTechnical2Chart} className="pattern-button">
                    View Triangle Pattern
                  </button>
                )}
                {chartType !== 'technical3' && (
                  <button onClick={handleViewTechnical3Chart} className="pattern-button">
                     View Wedge Pattern
                  </button>
                )}
                {chartType !== 'technical4' && (
                  <button onClick={handleViewTechnical4Chart} className="pattern-button">
                     View Channel Pattern
                  </button>
                )}
                {chartType !== 'technical5' && (
                  <button onClick={handleViewTechnical5Chart} className="pattern-button">
                     View Double Top Bottom Pattern
                  </button>
                )}
                </div>
                <h1 className='pattern-heading'>{chartType === 'ohlc' ? `OHLC Chart: ${selectedPriceStockName}` : chartType === 'technical' ? `Head and Shoulder Pattern: ${selectedPriceStockName}` : chartType === 'technical2' ? `Triangle Pattern: ${selectedPriceStockName}` : chartType === 'technical3' ? `Wedge Pattern: ${selectedPriceStockName}` : chartType === 'technical4' ? `Channel Pattern: ${selectedPriceStockName}` : chartType === 'technical5' ? `Double Top Bottom Pattern: ${selectedPriceStockName}`: `Monthly Price Chart: ${selectedPriceStockName}`}</h1>
                {chartData.length > 0 && (
                <div className="chart-and-info-container">
                  <div className="price-chart-container">
                    {chartType === 'ohlc' ? (
                    // Render the OHLC chart when the chart type is 'ohlc'
                    <CandlestickChart data={chartData} width={800} height={300}/>
                    ) : (
                    <ComposedChart width={900} height={300} data={chartData} margin={{ top: 20, right: 30, left: 30, bottom: 5 }}>
                    <defs>
                      <linearGradient id="colorPv" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#8884d8" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke='none' />
                    <XAxis dataKey="Date" tickFormatter={formatDate} dy={10} interval={2}/>
                    <YAxis domain={[niceMinY, niceMaxY]} ticks={tickValues} orientation="right" tickFormatter={(value) =>`$${value.toFixed(0)}`} dx={5}/>
                    <Tooltip content={<CustomPriceTooltip />}/>
                    <Legend wrapperStyle={{ paddingTop: '10px' }}/>
                    <Area type="monotone" dataKey="Close" name="Price" dot={false} stroke="#8884d8" fillOpacity={1} fill="url(#colorPv)" />
                    {chartData.map((entry, index) => {
                    // Adjust the condition to check for the chart type and then decide which pattern to look for
                    let pattern = null;
                    let fill = null;
                    
                    if (chartType === 'technical' && (entry.head_shoulder_pattern === 'Head and Shoulder' || entry.head_shoulder_pattern === 'Inverse Head and Shoulder')) {
                        pattern = entry.head_shoulder_pattern;
                        fill = entry.head_shoulder_pattern === 'Inverse Head and Shoulder' ? 'green' : 'red';
                    } else if (chartType === 'technical2' && (entry.triangle_pattern === 'Descending Triangle' || entry.triangle_pattern === 'Ascending Triangle')) {
                        pattern = entry.triangle_pattern;
                        fill = entry.triangle_pattern === 'Ascending Triangle' ? 'green' : 'red'; // Assuming 'Multiple Bottom' is positive, similar logic to 'Inverse Head and Shoulder'
                    } else if (chartType === 'technical3' && (entry.wedge_pattern === 'Wedge Up' || entry.wedge_pattern === 'Wedge Down')) {
                        pattern = entry.wedge_pattern;
                        fill = entry.wedge_pattern === 'Wedge Down' ? 'green' : 'red'; // Assuming 'Wedge Down' is positive
                    } else if (chartType === 'technical4' && (entry.channel_pattern === 'Channel Up' || entry.channel_pattern === 'Channel Down')) {
                        pattern = entry.channel_pattern;
                        fill = entry.channel_pattern === 'Channel Up' ? 'green' : 'red'; // Assuming 'Channel Up' is positive
                    } else if (chartType === 'technical5' && (entry.double_pattern === 'Double Top' || entry.double_pattern === 'Double Bottom')) {
                        pattern = entry.double_pattern;
                        fill = entry.double_pattern === 'Double Bottom' ? 'green' : 'red'; // Assuming 'Double Down' is positive
                    }
                    if (pattern) {
                        return (
                        <ReferenceDot
                            key={`dot-${index}`}
                            x={entry.Date}
                            y={entry.Close}
                            r={5}
                            fill={fill}
                            stroke="none"
                        >
                            <Label
                            value={pattern}
                            position="top" // Adjust position as needed
                            offset={10}
                            style={{
                                fill: 'white',
                                fontSize: '0.75rem',
                                fontWeight: 'bold',
                                textShadow: '0px 0px 5px black'
                            }}
                            />
                        </ReferenceDot>
                        );
                    }
                    return null;
                    })}
                  </ComposedChart>
                )}
                </div>
                {chartType === 'technical' && (
                    <div className="chart-info">
                        <p><i className="material-icons clickable-icon" style={{fontSize:'1.3em'}}>help_outline</i> Head and Shoulders pattern: suggests a stock's price is likely to fall after a high point, with the peak flanked by two lower ones.</p>
                        <p><i className="material-icons clickable-icon" style={{fontSize:'1.3em'}}>help_outline</i> Inverse Head and Shoulders pattern: indicates a stock's price is likely to rise after a low point, with the dip flanked by two higher ones.</p>
                    </div>
                )}
                {chartType === 'technical2' && (
                    <div className="chart-info">
                        <p><i className="material-icons clickable-icon" style={{fontSize:'1.3em'}}>help_outline</i> Ascending Triangle: a bullish pattern with a flat top and rising bottom, indicating potential upward breakout.</p>
                        <p><i className="material-icons clickable-icon" style={{fontSize:'1.3em'}}>help_outline</i> Descending Triangle: a bearish pattern with a flat bottom and declining top, suggesting a downward breakout.</p>
                    </div>
                )}
                {chartType === 'technical3' && (
                    <div className="chart-info">
                        <p><i className="material-icons clickable-icon" style={{fontSize:'1.3em'}}>help_outline</i> Wedge Up: signals a bearish reversal after a rising pattern, predicting a potential price drop.</p>
                        <p><i className="material-icons clickable-icon" style={{fontSize:'1.3em'}}>help_outline</i> Wedge Down: indicates a bullish reversal following a falling pattern, hinting at an upcoming price rise.</p>
                    </div>
                )}
                {chartType === 'technical4' && (
                    <div className="chart-info">
                        <p><i className="material-icons clickable-icon" style={{fontSize:'1.3em'}}>help_outline</i> Channel Up: suggests a bullish trend with price moving within upward parallel lines.</p>
                        <p><i className="material-icons clickable-icon" style={{fontSize:'1.3em'}}>help_outline</i> Channel Down: points to a bearish trend as price moves within downward parallel lines.</p>
                    </div>
                )}
                {chartType === 'technical5' && (
                    <div className="chart-info">
                        <p><i className="material-icons clickable-icon" style={{fontSize:'1.3em'}}>help_outline</i> Double Top: a bearish reversal pattern with two peaks, indicating a potential sell-off.</p>
                        <p><i className="material-icons clickable-icon" style={{fontSize:'1.3em'}}>help_outline</i> Double Bottom: a bullish reversal pattern with two troughs, suggesting a buying opportunity.</p>
                    </div>
                )}
                {chartType === 'ohlc' && (
                    <div className="chart-info">
                        <p><i className="material-icons clickable-icon" style={{fontSize:'1.3em'}}>help_outline</i> OHLC Chart: shows price movement within a session, with Open-High-Low-Close points. A closing higher than opening suggests bullishness; the opposite indicates bearishness.</p>
                    </div>
                )}
                {chartType === 'price' && (
                    <div className="chart-info">
                        <p><i className="material-icons clickable-icon" style={{fontSize:'1.3em'}}>help_outline</i> Price Chart: reflects stock performance focusing on closing prices. Rising trends imply growth; falling trends signal decline.</p>
                    </div>
                )}
                </div>
                )}
              </div>
            </div>
          )
        );
    };



    
    const viewPriceChart = async (stockSymbol, stockName, event) => {
        event.stopPropagation();
        try {
          const response = await axios.get(`http://localhost:5000/get_price_chart/${stockSymbol}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          });
          setPriceChartData(response.data); // Update the state with chart data
          console.log("price data: ", response.data)
          setSelectedPriceStockName(stockName)
          setShowPriceChartModal(true); // Show the price chart modal
          setSelectedStockSymbol(stockSymbol)
          
          setIsTechnicalChart(false);
        } catch (error) {
          console.error('Error fetching price chart:', error);
        }
    };

    const viewTechnicalChart = async (stockSymbol, event) => {
        // event.stopPropagation();
        if (event) event.stopPropagation();
        try {
          const response = await axios.get(`http://localhost:5000/get_technical_analysis/${stockSymbol}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          });
          setTechnicalChartData(response.data); // Update the state with chart data
          console.log("technical analysis: ", response.data)
          setShowTechnicalChartModal(true); // Show the price chart modal
          setIsTechnicalChart(true); // Switch to technical chart
        //   setChartType('technical'); 
        } catch (error) {
          console.error('Error fetching price chart:', error);
        }
    };


    const viewTechnical2Chart = async (stockSymbol, event) => {
        // event.stopPropagation();
        if (event) event.stopPropagation();
        try {
          const response = await axios.get(`http://localhost:5000/get_technical2_analysis/${stockSymbol}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          });
          setTechnical2ChartData(response.data); // Update the state with chart data
          console.log("technical2 analysis: ", response.data)
          setShowTechnical2ChartModal(true); // Show the price chart modal
        } catch (error) {
          console.error('Error fetching price chart:', error);
        }
    };


    const viewTechnical3Chart = async (stockSymbol, event) => {
        // event.stopPropagation();
        if (event) event.stopPropagation();
        try {
          const response = await axios.get(`http://localhost:5000/get_technical3_analysis/${stockSymbol}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          });
          setTechnical3ChartData(response.data); // Update the state with chart data
          console.log("technical4 analysis: ", response.data)
          setShowTechnical3ChartModal(true); // Show the price chart modal
        } catch (error) {
          console.error('Error fetching price chart:', error);
        }
    };

    const viewTechnical4Chart = async (stockSymbol, event) => {
        // event.stopPropagation();
        if (event) event.stopPropagation();
        try {
          const response = await axios.get(`http://localhost:5000/get_technical4_analysis/${stockSymbol}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          });
          setTechnical4ChartData(response.data); // Update the state with chart data
          console.log("technical2 analysis: ", response.data)
          setShowTechnical4ChartModal(true); // Show the price chart modal
        } catch (error) {
          console.error('Error fetching price chart:', error);
        }
    };

    const viewTechnical5Chart = async (stockSymbol, event) => {
        // event.stopPropagation();
        if (event) event.stopPropagation();
        try {
          const response = await axios.get(`http://localhost:5000/get_technical5_analysis/${stockSymbol}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          });
          setTechnical5ChartData(response.data); // Update the state with chart data
          console.log("technical5 analysis: ", response.data)
          setShowTechnical5ChartModal(true); // Show the price chart modal
        } catch (error) {
          console.error('Error fetching price chart:', error);
        }
    };
      
    const viewPastNews = async (stockSymbol, stockName, event) => {
        event.stopPropagation();
        try {
          const response = await axios.get(`http://localhost:5000/get_news/${stockSymbol}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          });
          setNewsData(response.data); // Update the state with news data
          console.log("news: ", response.data)
          setSelectedNewsStockName(stockName);
          setShowNewsModal(true); // Show the news modal
        } catch (error) {
          console.error('Error fetching news:', error);
        }
    };

    const viewRecommendation = async (stockSymbol, stockName, event) => {
        event.stopPropagation();
        try {
            const response = await axios.get(`http://localhost:5000/get_recommendation/${stockSymbol}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setRecommendationData(response.data); // Update the state with recommendation data
            setSelectedRecommendationStockName(stockName);
            setShowRecommendationModal(true); // Show the recommendation modal
        } catch (error) {
            console.error('Error fetching recommendation:', error);
        }
    };



    // Example Transaction Modal component
    const TransactionModal = ({onClearErrorMessage}) => {
        if (!transactionStock) return null; // Don't render if no stock is selected

        const handleClose = () => {
            setTransactionStock(null); // Reset the selected transaction stock
            onClearErrorMessage(); // Clear the error message
        };

        return (
            <div className="modal-overlay">
                <div className="transaction-modal">
                    <h2>{transactionStock.name}</h2>
                    <p>{transactionStock.symbol}</p>
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
                        <span>${(transactionStock.price * quantity).toFixed(2)}</span>
                    </div>
                    <div className="transaction-modal-actions">
                        <button onClick={handleTransaction} className="execute-transaction-btn">Execute Trade</button>
                        <button onClick={handleClose} className="cancel-transaction-btn">Cancel</button>
                    </div>
                    </div>
            </div>
        );
    };



    const AllocationPopup = React.memo(({ allocationData, onClose }) => {
        // Memoize the data transformation so it only recalculates when allocationData changes
        const data = useMemo(() => {
            try {
                const correctedJSONString = allocationData
                    .replace(/'/g, '"')
                    .replace(/\n/g, '')
                    .replace(/\s+/g, ' ')
                    .trim();
                const allocationDataParsed = JSON.parse(correctedJSONString);
                return Object.keys(allocationDataParsed).map((key) => ({
                    name: key,
                    value: Number(allocationDataParsed[key].replace('%', ''))
                }));
            } catch (error) {
                console.error("There was an error parsing the allocation data:", error);
                return [];
            }
        }, [allocationData]);
    
        // Define colors for each slice
        const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8400C4'];
    
        return (
            <div className="popup">
                <div className="popup-inner">
                    <h2 className='popup-title'>WealthWiseAdvisor's Recommended Template</h2>
                    <h3 className='popup-subtitle'>Your requirements have been matched to the below template</h3>
                    <div className="popup-content">
                    <PieChart width={600} height={300} margin={{ top: 20, right: 0, left: 0, bottom: 5 }}>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            labelLine={false}
                            fill="#8884d8"
                            dataKey="value"
                            stroke="#000d1a"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        {/* <Tooltip /> */}
                        {/* <Legend /> */}
                    </PieChart>
                    <div className='popup-description'>
                        <p className='popup-des-title'>{portfolioData.name}: </p>
                        <p className='popup-des-subtitle'>{portfolioData.description}</p>
                        <a className='popup-des-link' href={portfolioData.url} target="_blank" rel="noopener noreferrer">Learn More</a>
                    </div>
                </div>
                    <button onClick={onClose} className='popup-close-modal-btn'><span class="material-icons-outlined">close</span></button>
                </div>
            </div>
        );
    });
    

    return (
        <div className="portfolio-page">
            <div className="left-section">
                <button className="create-portfolio-btn" onClick={handleShowForm}><i className="material-icons">add</i>Create Portfolio</button>
                <h2 className='choose-portfolio'>Click on one of your existing portfolios!</h2>
                <div className="portfolio-list">
                {portfolios.map((portfolio, index) => (
                    <button
                        key={index}
                        onClick={() => handleSelectPortfolio(portfolio.portfolio_name)}
                        className={`portfolio-btn ${activePortfolio === portfolio.portfolio_name ? 'active-portfolio-btn' : ''}`}
                    >
                        {portfolio.portfolio_name}
                    </button>
                ))}
                </div>
            </div>
            <div className="right-section">
            {showForm && selectedPortfolioDetails && (
                        <div>
                            <h2 className='portfolio-details-heading'>Craft Your Investment Journey with <strong>{selectedPortfolioDetails.portfolio_name}</strong></h2>
                            <div className="portfolio-details-header">
                            <h3 className='portfolio-details-subheading'>Explore and Shape Your Financial Future!</h3>
                                <button className="deposit-money-btn" onClick={handleDepositClick}><span className="material-icons-outlined">add</span>Deposit Money</button>
                            </div>
                            
                            <div className="portfolio-values-container">
                                <div className="portfolio-cash">
                                    <h2 className='portfolio-cash-heading'>Current cash in portfolio:<i className="material-icons clickable-icon" style={{cursor:"pointer"}} onClick={(e) => handleQuestionClick('What does the Current cash deposited in a portfolio account mean?', e)}>help_outline</i></h2>
                                    <h3 className='portfolio-cash-value'>${accountBalance.toFixed(2)}</h3>
                                </div>
                                <div className="portfolio-value">
                                    <h2 className='portfolio-cash-heading'>Current Portfolio Value:<i className="material-icons clickable-icon" style={{cursor:"pointer"}} onClick={(e) => handleQuestionClick('What does the Current portfolio value of a portfolio account mean?', e)}>help_outline</i></h2>
                                    <h3 className='portfolio-cash-value'>${portfolioValue.toFixed(2)}</h3>
                                </div>
                            </div>
                            <div className="charts-container">
                                <div className={`chart ${!pieChartData || pieChartData.length === 0 ? 'no-data' : ''}`}>
                                {pieChartData && pieChartData.length > 0 ? (
                                // <div className="chart">
                                <>
                                    <h3 className ="chart-title">Current Portfolio</h3>
                                    <PieChart width={400} height={400}>
                                        <Pie
                                            data={pieChartData}
                                            cx={200}
                                            cy={200}
                                            // labelLine={false}
                                            // label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                            outerRadius={100}
                                            fill="#8884d8"
                                            dataKey="value"
                                            stroke="#000d1a"
                                        >
                                            {pieChartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={assetTypeColors[entry.name].color || '#d1d1d1'} />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<CustomTooltip total={totalValue} />}/>
                                        <Legend />
                                    </PieChart>
                                    <div className="nav-buttons-container">
                                        <h3 className='nav-buttons-heading'>Click on the buttons below to learn more</h3>
                                    <Link to={`/dashboard/${activePortfolio}`} className="navigate-btn navigate-dashboard-btn">
                                        <i className="material-icons-outlined" style={{ verticalAlign: 'top', marginRight: '7px' }}>dashboard</i>
                                        View Dashboard
                                    </Link>

                                    <Link to={`/portfolio/overview/${activePortfolio}`} className="navigate-btn navigate-overview-btn">
                                        <i className="material-icons-outlined" style={{ verticalAlign: 'top', marginRight: '7px' }}>pie_chart_outline</i>
                                        View Portfolio
                                    </Link>
                                    </div>
                                    </>
                                ) : (
                                    <p className='no-current-title'>No current portfolio yet!</p>
                                )}
                                </div>
                                {selectedPortfolioDetails.template !== "no template" && (
                                    <div className="chart">
                                        <h3 className ="chart-title">Target Portfolio</h3>
                                        <PieChart width={400} height={400}>
                                            <Pie
                                                data={parseAllocationData()}
                                                cx={200}
                                                cy={200}
                                                outerRadius={100}
                                                fill="#8884d8"
                                                dataKey="value"
                                                stroke="#000d1a"
                                            >
                                                {parseAllocationData().map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={assetTypeColors[entry.name].color || '#d1d1d1'} />
                                                ))}
                                            </Pie>
                                            <Tooltip content={<CustomTooltip total={100} />}/>
                                            <Legend />
                                        </PieChart>
                                        <div className='target-portfolio-info'>
                                            <h3><i className="material-icons clickable-icon" style={{fontSize:"1.2em", cursor:"pointer"}} onClick={(e) => handleQuestionClick(`Can you explain more about the ${selectedPortfolioDetails.portfolio_description.name} portfolio?`, e)}>help_outline</i> {selectedPortfolioDetails.portfolio_description.name}</h3> 
                                            <p>{selectedPortfolioDetails.portfolio_description.description}</p>
                                            <a href={selectedPortfolioDetails.portfolio_description.url} target="_blank" rel="noopener noreferrer">Learn More</a>
                                        </div>
                                    </div>
                                )}
                            </div>
                        <div className="search-and-label-container">
                        <h2 className='buy-sell-heading'>Execute Buy and Sell Orders for Your Stocks!</h2>
                        <div className="buy-sell-container">
                            <h3 className='buy-sell-subheading'>You can either search for your desired stock or choose from the popular stocks below</h3>
                            <button onClick={toggleSearchPopup} className="search-btn"><span class="material-icons-outlined">search</span>Search</button>
                        </div>
                        {/* <h3 className='buy-sell-subheading'>You can either search for your desired stock or choose from the popular stocks below</h3> */}
                        {/* <label className="popular-stocks-label">Search Stocks:</label> */}
                        {/* <button onClick={toggleSearchPopup} className="search-btn"><span class="material-icons-outlined">search</span>Search</button> */}
                        {selectedStock && (
                            <div className="stock-list-container">
                                <div className='search-header'>
                                    <h3>Search Result:</h3>
                                    {/* <div className="search-header-spacer"></div>  */}
                                    <button className="clear-search-btn" onClick={clearSearchResults}>
                                        <span class="material-icons-outlined">close</span>
                                        Clear
                                    </button>
                                </div>
                                <div className="search-stock-item" onClick={() => handleSelectStockForTransaction(selectedStock)}>
                                    <h2>{selectedStock.name}</h2>
                                    <h3>{selectedStock.symbol}</h3>
                                    {selectedStock.portfolioAssetTypes.map((type, index) => (
                                        console.log("type: ", type),
                                        console.log("assetTypeColors[type].tranparent: ", assetTypeColors[type].transparent),
                                        <div key={index} style={{
                                        backgroundColor: assetTypeColors[type]?.transparent ?? 'rgba(209, 209, 209, 0.15)',// Default color if type not found, with transparency
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
                                    <div className="stock-info">
                                    <p>
                                        <span className="label">
                                            Price: 
                                            <i className="material-icons clickable-icon" 
                                            style={{ color: 'white', fontSize: '1.2em', cursor: 'pointer'}}
                                            onClick={(e) => handleQuestionClick(`What does Price of ${selectedStock.price} for stock ${selectedStock.name} mean?`, e)}>help_outline</i>
                                        </span>
                                        <span className="value">${selectedStock.price}</span>
                                    </p>
                                    <p>
                                        <span className="label">
                                            Daily Change: 
                                            <i className="material-icons clickable-icon" 
                                            style={{ color: 'white', fontSize: '1.2em', cursor: 'pointer'}}
                                            onClick={(e) => handleQuestionClick(`What does Daily Change of ${selectedStock.dailyChange}% in Price for stock ${selectedStock.name} mean?`, e)}>help_outline</i>
                                        </span>
                                        <span className={`value-stock ${selectedStock.dailyChange >= 0 ? 'positive-value' : 'negative-value'}`}>{selectedStock.dailyChange}%</span>
                                    </p>
                                    <p>
                                        <span className="label">
                                            Moving Average: 
                                            <i className="material-icons clickable-icon" 
                                            style={{ color: 'white', fontSize: '1.2em', cursor: 'pointer'}}
                                            onClick={(e) => handleQuestionClick(`What does Moving Average of ${selectedStock.movingAverage} for stock ${selectedStock.name} mean?`, e)}>help_outline</i>
                                        </span>
                                        <span className="value-rest">${selectedStock.movingAverage}</span>
                                    </p>
                                    <p>
                                        <span className="label">
                                            RSI: 
                                            <i className="material-icons clickable-icon" 
                                            style={{ color: 'white', fontSize: '1.2em', cursor: 'pointer'}}
                                            onClick={(e) => handleQuestionClick(`What does RSI of ${selectedStock.rsi} for stock ${selectedStock.name} mean?`, e)}>help_outline</i>
                                        </span>
                                        <span className="value-rest">{selectedStock.rsi}</span>
                                    </p>
                                    <p>
                                        <span className="label">
                                            MACD: 
                                            <i className="material-icons clickable-icon" 
                                            style={{ color: 'white', fontSize: '1.2em', cursor: 'pointer'}}
                                            onClick={(e) => handleQuestionClick(`What does MACD of ${selectedStock.macd} for stock ${selectedStock.name} mean?`, e)}>help_outline</i>
                                        </span>
                                        <span className="value-rest">{selectedStock.macd}</span>
                                    </p>
                                    <p>
                                        <span className="label">
                                            MACD Signal: 
                                            <i className="material-icons clickable-icon" 
                                            style={{ color: 'white', fontSize: '1.2em', cursor: 'pointer'}}
                                            onClick={(e) => handleQuestionClick(`What does MACD signal of ${selectedStock.macdSignal} for stock ${selectedStock.name} mean?`, e)}>help_outline</i>
                                        </span>
                                        <span className="value-rest">{selectedStock.macdSignal}</span>
                                    </p>
                                        <div className="button-container">
                                            <button onClick={(e) => viewPriceChart(selectedStock.symbol, selectedStock.name, e)}>View Price Chart</button>
                                            <button onClick={(e) => viewPastNews(selectedStock.symbol, selectedStock.name, e)}>View Daily News</button>
                                            <button onClick={(e) => viewRecommendation(selectedStock.symbol, selectedStock.name, e)}>View Analysis</button> {/* New button */}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <label className="popular-stocks-label">Popular Stocks:</label>
                        </div>
                        <div className="stock-list-controls">
                            <button type="button" onClick={() => scrollStockList('left')} className="scroll-btn">&lt;</button>
                            <div className="stock-list-container" ref={stockListRef}>
                                <div className="stock-list">
                                    {stocks.map((stock, index) => (
                                        <div key={index} className="stock-item" onClick={() =>  handleSelectStockForTransaction(stock)}>
                                            <h2>{stock.name}</h2>
                                            <h3>{stock.symbol}</h3>
                                            {stock.portfolioAssetTypes.map((type, index) => (
                                                console.log("type: ", type),
                                                console.log("assetTypeColors[type].tranparent: ", assetTypeColors[type].transparent),
                                                <div key={index} style={{
                                                backgroundColor: assetTypeColors[type]?.transparent ?? 'rgba(209, 209, 209, 0.15)',// Default color if type not found, with transparency
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
                                            <div className="stock-info">
                                            <p><span className="label">Price: <i className="material-icons clickable-icon" style={{ color: 'white', fontSize: '1.2em', cursor: 'pointer'}} onClick={(e) => handleQuestionClick(`What does Price of ${stock.price} for stock ${stock.name} mean?`,e)}>help_outline</i></span> <span className="value">${stock.price}</span></p>
                                            <p><span className="label">Daily Change: <i className="material-icons clickable-icon" style={{ color: 'white', fontSize: '1.2em', cursor: 'pointer'}} onClick={(e) => handleQuestionClick(`What does Daily Change of ${stock.dailyChange}% in Price for stock ${stock.name} mean?`,e)}>help_outline</i></span> <span className={`value-stock ${stock.dailyChange >= 0 ? 'positive-value' : 'negative-value'}`}>{stock.dailyChange}%</span></p>
                                            <p><span className="label">Moving Average: <i className="material-icons clickable-icon" style={{ color: 'white', fontSize: '1.2em', cursor: 'pointer'}} onClick={(e) => handleQuestionClick(`What does Moving Average of ${stock.movingAverage} for stock ${stock.name} mean?`,e)}>help_outline</i></span> <span className="value-rest">${stock.movingAverage}</span></p>
                                            <p><span className="label">RSI: <i className="material-icons clickable-icon" style={{ color: 'white', fontSize: '1.2em', cursor: 'pointer'}} onClick={(e) => handleQuestionClick(`What does RSI of ${stock.rsi} for stock ${stock.name} mean?`, e)}>help_outline</i></span> <span className="value-rest">{stock.rsi}</span></p>
                                            <p><span className="label">MACD: <i className="material-icons clickable-icon" style={{ color: 'white', fontSize: '1.2em', cursor: 'pointer'}} onClick={(e) => handleQuestionClick(`What does MACD of ${stock.macd} for stock ${stock.name} mean?`, e)}>help_outline</i></span> <span className="value-rest">{stock.macd}</span></p>
                                            <p><span className="label">MACD Signal: <i className="material-icons clickable-icon" style={{ color: 'white', fontSize: '1.2em', cursor: 'pointer'}} onClick={(e) => handleQuestionClick(`What does MACD signal of ${stock.macdSignal} for stock ${stock.name} mean?`, e)}>help_outline</i></span> <span className="value-rest">{stock.macdSignal}</span></p>
                                            <div className="button-container">
                                                <button onClick={(e) => viewPriceChart(stock.symbol, stock.name, e)}>View Price Chart</button>
                                                <button onClick={(e) => viewPastNews(stock.symbol, stock.name, e)}>View Daily News</button>
                                                <button onClick={(e) => viewRecommendation(stock.symbol, stock.name, e)}>View Analysis</button> {/* New button */}
                                            </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <button type="button" onClick={() => scrollStockList('right')} className="scroll-btn">&gt;</button>
                        </div>
                        <button type="button" className="submit-portfolio" onClick={handleDeletePortfolio}><span class="material-icons-outlined">delete</span>Delete Portfolio</button>
                    </div>
            )}
            {showForm && !selectedPortfolioDetails &&(
                <>
                <h2 className='create-portfolio-heading'>Create your own Portfolio</h2>
                <h3 className='create-portfolio-subheading'>Please enter your portfolio name first!</h3>
                <form className="portfolio-form">
                    <div className="form-group">
                        <label htmlFor="portfolioName">Portfolio Name:</label>
                        <input 
                            type="text" 
                            id="portfolioName" 
                            name="portfolioName" 
                            value={portfolioName}
                            onChange={handlePortfolioNameChange} // Updated to use the new handler
                        />
                        {!isPortfolioNameUnique && <div className="portfolio-error-message">Portfolio name already exists!</div>}
                    </div>

                    <div className="form-group">
                    <label className='template-portfolio'>Choose Your Portfolio Setup:</label>
                    <h2 className='template-setup'>Select 'Template' for guided portfolio creation with WealthAdvisor</h2>
                        <div className="template-options">
                            <button 
                                type="button"
                                // className={`template-option-button ${useTemplate === false ? 'selected' : ''} ${!portfolioName.trim() || !isPortfolioNameUnique ? 'disabled' : ''}`}
                                className={`template-option-button ${!portfolioName.trim() || !isPortfolioNameUnique ? 'disabled' : ''}`}
                                onClick={handleNoTemplateClick}
                                disabled={!portfolioName.trim() || !isPortfolioNameUnique}
                            >
                                No Template
                            </button>
                            <button 
                                type="button"
                                // className={`template-option-button ${useTemplate === false ? 'selected' : ''} ${!portfolioName.trim() || !isPortfolioNameUnique ? 'disabled' : ''}`}
                                className={`template-option-button ${!portfolioName.trim() || !isPortfolioNameUnique ? 'disabled' : ''}`}
                                onClick={handleTemplateClick} // Call the function to open the chatbot
                                disabled={!portfolioName.trim() || !isPortfolioNameUnique}
                            >
                                Template
                            </button>
                        </div>
                    </div>
                    {/* <button type="button" className="submit-portfolio" onClick={handleDeletePortfolio}><span class="material-icons-outlined">delete</span>Delete Portfolio</button> */}
                </form>
                </>
                )}
           
                {showChatBot && (
                <div className="new-chatbot-modal">
                    <div className="new-chat-container">
                    <div className="new-chat-header">
                        <img src={chatbotLogo} alt="Chatbot Logo" className="new-chat-logo" />
                        <div className='new-chat-title-div'>
                            <span className="new-chat-title">WealthWiseAdvisor</span>
                            <span className="new-chat-subtitle">Crafting Custom Portfolios for You!</span>
                        </div>
                        <button className="new-close-chatbot" onClick={handleCloseChatbot}>&times;</button>
                    </div>
                    <div className="new-messages">
                        {chatHistory.map((chatItem, index) => (
                        <div key={index} className={`message ${chatItem.role === 'user' ? 'new-user-message' : 'new-assistant-message'}`}
                        style={chatItem.role === 'user' ? { '--user-pic-url': `url(${profilePicURL})` } : {}}>
                            {chatItem.message}
                        </div>
                        ))}
                        <div ref={messagesEndRef}></div>
                    </div>
                    <div className="new-input-area">
                        {isLoading && (
                        <div className="new-loading-dots">
                            {/* Loading dots */}
                            <div className="new-dot"></div>
                            <div className="new-dot"></div>
                            <div className="new-dot"></div>
                        </div>
                        )}
                        <input
                        value={userInput}
                        onChange={e => setUserInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Enter your investment goal, e.g., 'Long-term low risk portfolio'"
                        disabled={isLoading}
                        />
                        <button onClick={handleAsk} disabled={isLoading || !userInput.trim()}>
                        <span class="material-icons-outlined">
                        send
                        </span>
                        {/* <img src={sendLogo} alt="Send" className="new-send-icon" /> */}
                        </button>
                    </div>
                    </div>
                </div>
                )}
            </div>
            {showPopup && (
            <AllocationPopup 
                allocationData={allocationData} 
                onClose={() => setShowPopup(false)} 
            />
            )}
            {isSearchOpen && (
                <SearchPopup isOpen={isSearchOpen} closeSearch={toggleSearchPopup}/>
            )}
            <TransactionModal onClearErrorMessage={() => setErrorMessage('')}/>


            <ChartModal
                showChartModal={showPriceChartModal}
                priceChartData={priceChartData}
                technicalChartData={technicalChartData}
                technical2ChartData={technical2ChartData}
                technical3ChartData={technical3ChartData}
                technical4ChartData={technical4ChartData}
                technical5ChartData={technical5ChartData}
                setShowChartModal={setShowPriceChartModal}
                isTechnicalChart={isTechnicalChart}
                setIsTechnicalChart={setIsTechnicalChart}
                viewTechnicalChart={viewTechnicalChart} // Assuming this function is defined in the parent component
                viewTechnical2Chart={viewTechnical2Chart}
                viewTechnical3Chart={viewTechnical3Chart}
                viewTechnical4Chart={viewTechnical4Chart}
                viewTechnical5Chart={viewTechnical5Chart}
                currentStockSymbol={selectedStockSymbol} // Assuming you have a way to track the selected stock symbol
                chartType={chartType}
                setChartType={setChartType}
            />


            {showAdviceModal && (
                <div className="modal-overlay">
                <div className="advice-modal">
                <h1 className='advice-header'>{`WealthWiseAdvisor's Advice`}</h1>
                    {/* <p className="chatgpt-advice">{chatGPTAdvice}</p> */}
                    <div style={{fontFamily: 'Poppins'}} dangerouslySetInnerHTML={{ __html: chatGPTAdvice }} />
                    <button onClick={() => setShowAdviceModal(false)} className="close-modal-btn"><span class="material-icons-outlined">close</span></button>
                </div>
                </div>
            )}

            {showNewsModal && (
                <div className="modal-overlay">
                <div className="news-modal">
                    <h2 className='news-header'>{`Daily News for ${selectedNewsStockName}`}</h2>
                    <h3 className='news-subheader'>Chronologically Arranged: Latest News First</h3>
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


            {showRecommendationModal && (
            <div className="modal-overlay">
                <div className="recommendation-modal"> {/* Adjust class name as needed */}
                <button onClick={() => setShowRecommendationModal(false)} className="close-modal-btn"><span class="material-icons-outlined">close</span></button>
                <h3 className='recommendation-header'>{`WealthWiseAdvisor's Analysis for ${selectedRecommendationStockName}`}</h3>
                <div className="recommendation-content">
                    {recommendationData && Object.entries(recommendationData).map(([sectionTitle, items], index) => (
                    <div key={index} className="recommendation-section">
                        <h4>{sectionTitle}</h4>
                        <ul>
                        {items.map((item, itemIndex) => (
                            <li key={itemIndex}>{item}</li> // Use <li> for list items
                        ))}
                        </ul>
                    </div>
                    ))}
                </div>
                </div>
            </div>
            )}

            {showChatbot && <ChatBot closeChatbot={() => setShowChatbot(false)} autoSendMessage={autoMessage} />}
        </div>
    );
};

export default CreatePortfolio;