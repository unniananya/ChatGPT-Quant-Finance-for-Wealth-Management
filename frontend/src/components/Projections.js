import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ComposedChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Line } from 'recharts';
import { format, parseISO } from 'date-fns';
import './styles/Projections.css';
const token = localStorage.getItem('token');

const Projections = () => {
    const [data, setData] = useState([]);
    const token = localStorage.getItem('token');
    const [userPortfolios, setUserPortfolios] = useState([]);
    const [selectedPortfolioName, setSelectedPortfolioName] = useState('');


    const calculateNiceIntervals = (data, maxTicks = 5) => {
        // Combine all relevant values to consider the entire range
        const allValues = data.reduce((acc, item) => {
            acc.push(item.median, item.percentile_25);
            if (Array.isArray(item.range)) {
                acc.push(item.range[0], item.range[1]);
            }
            return acc;
        }, []);
    
        const minValue = Math.min(...allValues);
        const maxValue = Math.max(...allValues);
        let range = maxValue - minValue;
    
        // Enhance interval selection to ensure it generates a maximum of 5 "nice" ticks
        let tickStep = range / (maxTicks - 1);
        let magnitude = Math.pow(10, Math.floor(Math.log10(tickStep)));
        let residual = tickStep / magnitude;
        
        // Adjust residual to find a "nice" interval
        if (residual > 5) {
            tickStep = 10 * magnitude;
        } else if (residual > 2) {
            tickStep = 5 * magnitude;
        } else if (residual > 1) {
            tickStep = 2 * magnitude;
        } else {
            tickStep = magnitude;
        }
    
        // Calculate and return the "nice" ticks
        const ticks = [];
        let currentTick = Math.floor(minValue / tickStep) * tickStep;
        while (currentTick <= maxValue) {
            ticks.push(currentTick);
            currentTick += tickStep;
        }
    
        // Ensure the last tick covers the maximum value if not already included
        if (ticks[ticks.length - 1] < maxValue) {
            ticks.push(currentTick);
        }
    
        return ticks.slice(0, maxTicks); // Ensure only up to maxTicks are returned
    };

    useEffect(() => {
        const fetchPortfolios = async () => {
            try {
                const response = await axios.get('http://localhost:5000/get_user_portfolios', {
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                if (response.status === 200) {
                    setUserPortfolios(response.data);
                    if(response.data.length > 0){
                        // Automatically select the first portfolio if not already selected
                        setSelectedPortfolioName(response.data[0].portfolio_name);
                    }
                } else {
                    console.error('Failed to fetch portfolios.');
                }
            } catch (err) {
                console.error('An error occurred fetching portfolios:', err.message);
            }
        };

        fetchPortfolios();
    }, [token]);


    const formatDate = (dateString) => {
        // Assuming date is in ISO format, adjust as needed
        const date = parseISO(dateString);
        return format(date, 'MMM dd, yyyy'); // e.g., Dec 18 2023
    };


    const CustomTooltip = ({ active, payload, label }) => {
        // Function to format the date
        const formatDate = (dateString) => {
            const date = parseISO(dateString);
            return format(date, 'MMM dd, yyyy'); // e.g., Dec 18 2023
        };
    
        if (active && payload && payload.length) {
            // Extract data safely
            const rangeData = payload.find(entry => entry.dataKey === 'range');
            const medianData = payload.find(entry => entry.dataKey === 'median');
            const percentile25Data = payload.find(entry => entry.dataKey === 'percentile_25');
    
            // Calculate display values for range
            let rangeValues;
            if (rangeData && Array.isArray(rangeData.value)) {
                rangeValues = {
                    lower: rangeData.value[0] ? `>$${rangeData.value[0].toFixed(2)}` : "N/A",
                    upper: rangeData.value[1] ? `>$${rangeData.value[1].toFixed(2)}` : "N/A"
                };
            }
    
            return (
                <div className="custom-tooltip" style={{ backgroundColor: 'rgb(0,13,26,0.8)', padding: '10px', borderRadius: '5px', border: '0.1px solid #676767', color: '#fff', textAlign: 'left'}}>
                    {/* Date with specific color */}
                    <p className="label" style={{ color: '#fff', fontSize:'1.1em' }}>{`${formatDate(label)}`}</p>
                    {/* "Chance of having at least" text in grey */}
                    <p style={{ marginBottom: '5px', color: '#808080', fontSize: '1em' }}>Chance of having at least</p>
                    {rangeValues && (
                        <>
                            <p style={{ marginBottom: '5px', fontSize:'1.1em' }}>
                                <span style={{ marginRight: '100px', color: rangeData.color }}>5%:</span>
                                {/* Ensure color matches stroke color */}
                                <span style={{ float: 'right', color: rangeData.color }}>{rangeValues.upper}</span>
                            </p>
                        </>
                    )}
                    {medianData && (
                        <p style={{ marginBottom: '5px', fontSize:'1.1em' }}>
                            <span style={{ marginRight: '100px', color: medianData.color }}>50%:</span>
                            <span style={{ float: 'right', color: medianData.color }}> {medianData.value ? `>$${medianData.value.toFixed(2)}` : "N/A"}</span>
                        </p>
                    )}
                    {percentile25Data && (
                        <p style={{ marginBottom: '5px', fontSize:'1.1em' }}>
                            <span style={{ marginRight: '100px', color: percentile25Data.color }}>75%:</span>
                            <span style={{ float: 'right', color: percentile25Data.color }}> {percentile25Data.value ? `>$${percentile25Data.value.toFixed(2)}` : "N/A"}</span>
                        </p>
                    )}
                    {rangeValues && (
                        <>
                            <p style={{ marginBottom: '5px', fontSize:'1.1em' }}>
                                <span style={{ marginRight: '100px', color: rangeData.color }}>95%:</span>
                                <span style={{ float: 'right', color: rangeData.color }}>{rangeValues.lower}</span>
                            </p>
                        </>
                    )}

                </div>
            );
        }
    
        return null;
    };
    

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get(`http://localhost:5000/project_future_portfolio_values?portfolio_name=${selectedPortfolioName}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
    
                // Assuming the backend returns data in the structure { projections: [], percentiles_data: [] }
                const { projections, percentiles_data } = response.data;
    
                // Combine projections and percentiles data
                const combinedData = projections.map(proj => {
                    const percentileData = percentiles_data.find(p => p.date === proj.date);
                    return { ...proj, ...percentileData };
                });
    
                setData(combinedData);
            } catch (error) {
                console.error("Error fetching projection data:", error);
            }
        };
    
        fetchData();
    }, [token, selectedPortfolioName]);

    return (
        <div className='projections-container'>
            <div className="portfolio-selector">
                <select value={selectedPortfolioName} onChange={(e) => setSelectedPortfolioName(e.target.value)}>
                    <option value="">Select a portfolio</option>
                    {userPortfolios.map((portfolio, index) => (
                        <option key={index} value={portfolio.portfolio_name}>{portfolio.portfolio_name}</option>
                    ))}
                </select>
            </div>
            <h2 className='chart-header'>Projected Portfolio Values for the next 30 years</h2>
            <ComposedChart
                width={1230}
                height={450}
                data={data}
                margin={{ top: 20, right: 20, bottom: 20, left: 50 }}
            >
                <CartesianGrid stroke="#676767" vertical={false}/>
                <XAxis dataKey="date" tickFormatter={formatDate} dy={10} interval={2}/>
                <YAxis 
                  type="number" 
                  domain={['dataMin', 'dataMax']} 
                  orientation="right" 
                  tickFormatter={(value) => `$${value.toFixed(0)}`}
                  ticks={calculateNiceIntervals(data)}
                  dx={5}
                />
                <Tooltip content={<CustomTooltip />}/>
                <Line type="monotone" dataKey="median" stroke="#82ca9d" name="50%" dot={false} strokeWidth={2} strokeDasharray="5 5"/>
                <Line type="monotone" dataKey="percentile_25" stroke="#ffc658" name="75%" dot={false} strokeWidth={2} strokeDasharray="5 5"/>
                <Area type="monotone" dataKey="range" fill="#8884d8" stroke="#8884d8" fillOpacity={0.3} name="5% to 95%" />
            </ComposedChart>
        </div>
    );
};

export default Projections;
