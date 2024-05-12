import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer,Sector } from 'recharts';
import axios from 'axios';
import './styles/Assets.css';
import { useParams } from 'react-router-dom';



const assetTypeColors = {
  'Cash and Cash Equivalents': { color: '#00dbff', transparent: 'rgba(0, 219, 255, 0.15)' }, // Cooler Bright Sky Blue
  'Large Cap Blend': { color: '#00ffea', transparent: 'rgba(0, 255, 234, 0.15)' }, // Cooler Bright Turquoise
  'Small Cap Value': { color: '#ffe600', transparent: 'rgba(255, 230, 0, 0.15)' }, // Cooler Bright Yellow
  'International Stocks': { color: '#ff7855', transparent: 'rgba(255, 120, 85, 0.15)' }, // Cooler Bright Orange
  'World Developed Stocks': { color: '#a8fc50', transparent: 'rgba(168, 252, 80, 0.15)' }, // Cooler Lime Green
  'International Large Cap Blend': { color: '#b2a3fa', transparent: 'rgba(178, 163, 250, 0.15)' }, // Cooler Soft Purple
  'Intermediate Bonds': { color: '#1bfc30', transparent: 'rgba(27, 252, 48, 0.15)' }, // Cooler Neon Green
  'International Bonds': { color: '#a264ed', transparent: 'rgba(162, 100, 237, 0.15)' }, // Cooler Bright Purple
  'Short Term Bonds': { color: '#00f5e1', transparent: 'rgba(0, 245, 225, 0.15)' }, // Cooler Bright Aqua
  'International Large Cap Value': { color: '#ff3b80', transparent: 'rgba(255, 59, 128, 0.15)' }, // Cooler Bright Pink
  'Gold': { color: '#fcff40', transparent: 'rgba(252, 255, 64, 0.15)' }, // Cooler Electric Yellow
  'International Small Cap Blend': { color: '#ff9600', transparent: 'rgba(255, 150, 0, 0.15)' }, // Cooler Bright Orange
  'Total Stock Market': { color: '#709bff', transparent: 'rgba(112, 155, 255, 0.15)' }, // Cooler Soft Blue
  'Small Cap Growth': { color: '#ff4088', transparent: 'rgba(255, 64, 136, 0.15)' }, // Cooler Bright Pink
  'Emerging Markets': { color: '#ff6a1a', transparent: 'rgba(255, 106, 26, 0.15)' }, // Cooler Bright Orange
  'Large Cap Value': { color: '#00ffa1', transparent: 'rgba(0, 255, 161, 0.15)' }, // Cooler Bright Green
  'International Small Cap Value': { color: '#c27dff', transparent: 'rgba(194, 125, 255, 0.15)' }, // Cooler Light Purple
  'Real Estate': { color: '#4de1ff', transparent: 'rgba(77, 225, 255, 0.15)' }, // Cooler Bright Sky Blue
  'Long Term Bonds': { color: '#ff68c6', transparent: 'rgba(255, 104, 198, 0.15)' }, // Cooler Bright Pink
  'Small Cap Blend': { color: '#ffea00', transparent: 'rgba(255, 234, 0, 0.15)' }, // Cooler Bright Yellow
  'Large Cap Growth': { color: '#ce00ff', transparent: 'rgba(206, 0, 255, 0.15)' }, // Cooler Bright Purple
  'ESG': { color: '#3ca9ff', transparent: 'rgba(60, 169, 255, 0.15)' }, // Cooler Bright Blue
  'Cryptocurrencies': { color: '#ffdf70', transparent: 'rgba(255, 223, 112, 0.15)' }, // Cooler Golden Yellow
  'Commodities': { color: '#00ffff', transparent: 'rgba(0, 255, 255, 0.15)' }, // Cyan
  'Other': { color: '#ffa500', transparent: 'rgba(255, 165, 0, 0.15)' }, // Cooler Bright Orange
};


const renderActiveShape = (props) => {
  const {
    cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload
  } = props;

  return (
    <Sector
      cx={cx}
      cy={cy}
      innerRadius={innerRadius}
      outerRadius={outerRadius + 10} // Make the active segment slightly larger
      startAngle={startAngle}
      endAngle={endAngle}
      fill={fill}
      stroke={'#000d1a'} // Sets the border color
      strokeWidth={2} // Sets the border width
    />
  );
};


const CustomCenteredLabel = ({ cx, cy, activeIndex, data, color }) => {
  if (activeIndex === -1 || !data || !data[activeIndex]) {
    return null;
  }

  return (
    <text x={cx} y={cy - 20} textAnchor="middle" dominantBaseline="central">
      <tspan fontSize="18px" fill="#989898">{data[activeIndex].symbol}</tspan>
      <tspan x={cx} y={cy + 20} fontSize="28px" fontWeight="500" fill={color}>{`${data[activeIndex].value.toFixed(2)}%`}</tspan>
    </text>
  );
};

const Assets = () => {
  const [data, setData] = useState([]);
  const [activeAssetDetails, setActiveAssetDetails] = useState(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [error, setError] = useState(null);
  const token = localStorage.getItem('token');
  const [userPortfolios, setUserPortfolios] = useState([]);
  const [selectedPortfolioName, setSelectedPortfolioName] = useState('');
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [lastSelectedAssetClassSymbol, setLastSelectedAssetClassSymbol] = useState("");
  const [lastSelectedAssetClassWeight, setLastSelectedAssetClassWeight] = useState("");
  const [selectedColor, setSelectedColor] = useState('');

  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const [stockDetails, setStockDetails] = useState({});


  const handlePortfolioChange = (e) => {
    setSelectedPortfolioName(e.target.value);
    setActiveAssetDetails(null) // Reset the last selected asset class name
    // Any other logic you want to perform when portfolio changes
  };
  

  // Fetch stock details function
  const fetchStockDetails = async (assetSymbol, assetName) => {
    try {
      const response = await axios.get(`http://localhost:5000/get_stock_details?symbol=${assetSymbol}&name=${assetName}`);
      if (response.status === 200) {
        setStockDetails(response.data);
        setIsPopupVisible(true); // Show the popup with fetched data
      } else {
        console.error('Failed to fetch stock details.');
      }
    } catch (error) {
      console.error('Error fetching stock details:', error);
    }
  };


  // Handle portfolio option click
  const handleAssetOptionClick = (assetSymbol, assetName) => {
    fetchStockDetails(assetSymbol, assetName); // Fetch and show stock details in popup
  };


  const StockDetailsPopup = ({ details, onClose }) => (
    <div className="modal-overlay">
      <div className="asset-details-modal">
        <button onClick={onClose} className="close-modal-btn">
          <span className="material-icons-outlined">close</span>
        </button>
          <div className="stock-item">
            <div className="stock-info">
              <h2>{details.name}</h2>
              <h3>{details.symbol}</h3>
              {details.portfolioAssetTypes.map((type, index) => (
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
                  fontSize: '0.9em', // Adjust font size as needed
                }}>
                  {type}
                </div>
              ))}
              {/* Add asset types if available in your details */}
              <p><span className="label">Price:</span> <span className="value">${details.price}</span></p>
              <p><span className="label">Daily Change:</span> <span className={`value ${details.dailyChange >= 0 ? 'positive-value' : 'negative-value'}`}>{details.dailyChange}%</span></p>
              <p><span className="label">Moving Average:</span> <span className="value-rest">${details.movingAverage}</span></p>
              <p><span className="label">RSI:</span> <span className="value-rest">{details.rsi}</span></p>
              <p><span className="label">MACD:</span> <span className="value-rest">${details.macd}</span></p>
              <p><span className="label">MACD Signal:</span> <span className="value-rest">${details.macdSignal}</span></p>
              {/* Include any other details you wish to show */}
            </div>
          </div>
      </div>
    </div>
  );


  useEffect(() => {
    const fetchPortfolios = async () => {
      try {
        const response = await axios.get('http://localhost:5000/get_user_portfolios', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (response.status === 200) {
          setUserPortfolios(response.data);
          // Optionally set the first portfolio as the selected one by default
          // if(response.data.length > 0 && !selectedPortfolioName) {
          //   setSelectedPortfolioName(response.data[0].portfolio_name);
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
  

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A83731', '#5A3E9D', '#2C6E49', '#76323F', '#656D4A', '#0D3B66'];

  const fetchPortfolioData = async (portfolioName) => {
    try {
      // const portfolioName = "automated"
      const response = await axios.get(`http://localhost:5000/get_portfolio_weights_data?portfolioName=${portfolioName}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 200 && response.data['currentAssets'].length > 0) {
        setIsDataLoaded(true);
        if (portfolioName == 'automated') {
          const selectedWeights = response.data['currentAssets'];
          console.log("weights: ", response.data['currentAssets'])
          const assetDetails = {}; // Store detailed information for each asset type

          if (Array.isArray(selectedWeights)) {
            const cumulativeWeights = {};

            selectedWeights.forEach(asset => {
              const weight = parseFloat(asset.weight) * 100;
              const label = asset.investment_type;
              const symbol = asset.asset;
              const name = asset.name;

              if (cumulativeWeights.hasOwnProperty(label)) {
                cumulativeWeights[label] += weight;
              } else {
                cumulativeWeights[label] = weight;
              }

              if (!assetDetails[label]) {
                assetDetails[label] = [];
              }
              assetDetails[label].push({ symbol, name, weight }); // Add asset details for the tooltip
            });

            console.log("asset details: ", assetDetails);

            const transformedData = Object.keys(cumulativeWeights).map((key, index) => ({
              symbol: key,
              value: cumulativeWeights[key],
              details: assetDetails[key], // Include the detailed information
              fill: COLORS[index % COLORS.length]
            }));

            console.log("transformedData: ", transformedData)

            setData(transformedData);
          } else {
            setError('Invalid portfolio data format.');
          }
      } else {
          const currentAssets = response.data['currentAssets'];
          const portfolioDetails = { template: response.data['template'] };
          // Parse the template string into an object
          const template = JSON.parse(portfolioDetails.template.replace(/'/g, '"'));
          const assetDetails = {};

          const groupedByAssetClass = currentAssets.reduce((acc, asset) => {
              const quantity = asset.quantity;
              // Filter asset classes included in the template
              const relevantAssetClasses = asset.portfolio_asset_types.filter(type => template[type]);

              // Determine division count based on whether any asset classes match the template
              const divisionCount = relevantAssetClasses.length > 0 ? relevantAssetClasses.length : asset.portfolio_asset_types.length;
              
              // Use relevant asset classes if available; otherwise, use all asset types
              const assetClassesToUse = relevantAssetClasses.length > 0 ? relevantAssetClasses : asset.portfolio_asset_types;

              assetClassesToUse.forEach(type => {
                  const quantityPerType = quantity / divisionCount;
                  
                  if (!acc[type]) {
                      acc[type] = 0;
                      assetDetails[type] = [];
                  }
                  acc[type] += quantityPerType;

                  assetDetails[type].push({
                      symbol: asset.symbol,
                      name: asset.name,
                      quantity: quantityPerType
                  });
              });

              return acc;
          }, {});

          // Calculate total quantity for normalization
          const totalQuantity = Object.values(groupedByAssetClass).reduce((acc, quantity) => acc + quantity, 0);

          // Transform data for pie chart
          const transformedData = Object.entries(groupedByAssetClass).map(([key, quantity]) => ({
              symbol: key,
              value: (quantity / totalQuantity) * 100, // Convert to percentage of total
              details: assetDetails[key].map(detail => ({
                  symbol: detail.symbol,
                  name: detail.name,
                  weight: ((detail.quantity / quantity)) * (quantity / totalQuantity) * 100 // Convert to percentage of its class
              })),
              fill: COLORS[Object.keys(groupedByAssetClass).indexOf(key) % COLORS.length] // Assign color
          }));

          setData(transformedData);

          console.log("transformedData: ", transformedData)
      }

      } else {
        setIsDataLoaded(false);
        // setError('Failed to fetch portfolio data.');
      }
    } catch (err) {
      setError('An error occurred while fetching portfolio data.');
      console.error('Error fetching portfolio data:', err);
    }
  };


  useEffect(() => {
    // Make sure to only fetch portfolio data if a portfolio name is selected
    if (selectedPortfolioName) {
      fetchPortfolioData(selectedPortfolioName);
    }
  }, [token, selectedPortfolioName]); // Add selectedPortfolioName to the dependency array

  const onPieEnter = (data, index) => {
    setActiveIndex(index);
    console.log("data index:", data)
    setActiveAssetDetails(data.details); // Set the active asset details
    setLastSelectedAssetClassSymbol(data.symbol);
    setLastSelectedAssetClassWeight(data.percent);
    setSelectedColor(data.fill);
  };

  if (error) {
    return <div>Error: {error}</div>;
  }


  const assetDetailsContent = isDataLoaded ? (
    activeAssetDetails && activeAssetDetails.length > 0 ? (
      <>
        <div className="asset-table-header" style={{ color: selectedColor }}>
          {lastSelectedAssetClassSymbol} : {(lastSelectedAssetClassWeight * 100).toFixed(2)}%
        </div>
        {activeAssetDetails.map((detail, index) => (
          <div className="asset-table-row" key={index} onClick={() => handleAssetOptionClick(detail.symbol, detail.name)} style={{ cursor: 'pointer' }}>
            <div className="asset-name">{detail.name}</div>
            <div className="asset-symbol">{detail.symbol}</div> {/* Add this line */}
            <div className="asset-weight">{detail.weight.toFixed(2)}%</div>
          </div>
        ))}
      </>
    ) : (
      <div className="asset-details-placeholder">Please select an asset</div>
    )
  ) : (
    <div className="asset-details-placeholder"></div>
  );

  return (
    <div className='assets-container'>
      <div className="portfolio-selector">
        <select value={selectedPortfolioName} onChange={handlePortfolioChange}>
          <option value="">Select a portfolio</option>
          {userPortfolios.map((portfolio, index) => (
            <option key={index} value={portfolio.portfolio_name}>{portfolio.portfolio_name}</option>
          ))}
        </select>
      </div>
      {selectedPortfolioName ? (
            isDataLoaded ? (
        <div className="assets-chart-container">
          <h2 className='assets-header'>Assets Breakdown</h2>
          <ResponsiveContainer width='100%' height={500}>
            <PieChart>
              <Pie
                activeIndex={activeIndex}
                activeShape={renderActiveShape} // Use the custom active shape
                data={data}
                cx="50%"
                cy="50%"
                innerRadius="60%"
                outerRadius="80%"
                fill="#8884d8"
                dataKey="value"
                onMouseEnter={onPieEnter}
                onMouseLeave={() => setActiveIndex(-1)}
                isAnimationActive={true}
                animationDuration={500} // duration of the animation
                label={activeIndex >= 0 ? <CustomCenteredLabel activeIndex={activeIndex} data={data} color={data[activeIndex].fill}/> : null}
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.fill} 
                    stroke={'#000d1a'} // Sets the border color
                    strokeWidth={2} // Sets the border width
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

        </div>
      ) : (
        <div className="message-container">
            Please make an initial deposit before accessing the Assets page.
        </div>
    )
) : (
    <div className="message-container">
        Please select a portfolio to view details.
    </div>
)}
      <div className="asset-details-container">
        {assetDetailsContent}
      </div>
      {isPopupVisible && <StockDetailsPopup details={stockDetails} onClose={() => setIsPopupVisible(false)} />}
    </div>
  );
};

export default Assets;