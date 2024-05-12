import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, Cell, PieChart, Pie, LineChart, Line } from 'recharts';


const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#FF8888', '#66D8D8', '#A28BE6', '#FFD700', '#32CD32'];


const PortfolioCharts = ({ data, historicalData, sp500Data }) => {

    // const combinedData = historicalData.map(portfolioPoint => {
    //     const correspondingSP500Point = sp500Data.find(spPoint => spPoint.date === portfolioPoint.date);
    //     return {
    //         ...portfolioPoint,
    //         sp500Return: correspondingSP500Point?.return
    //     };
    // });

    // Step 1: Get the date of 3 months ago from the current date
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    // Step 2: Filter your data
    const filteredHistoricalData = historicalData.filter(point => new Date(point.date) >= threeMonthsAgo);
    const filteredSP500Data = sp500Data.filter(point => new Date(point.date) >= threeMonthsAgo);

    const combinedData = filteredHistoricalData.map(portfolioPoint => {
        const correspondingSP500Point = filteredSP500Data.find(spPoint => spPoint.date === portfolioPoint.date);
        return {
            ...portfolioPoint,
            sp500Return: correspondingSP500Point?.return
        };
    });


    return (
        <div>
            {/* Bar Chart for Portfolio Weights */}
            {/* <BarChart width={600} height={300} data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="asset" /> 
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="weight" fill="#82ca9d" />
            </BarChart> */}

            {/* Pie Chart for Portfolio Weights */}
            <PieChart width={400} height={400}>
                <Pie
                    data={data}
                    dataKey="weight"
                    nameKey="asset"  // assuming this is the name of the asset
                    cx="50%"
                    cy="50%"
                    outerRadius={150}
                    fill="#82ca9d"
                >
                    {
                        data.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)
                    }
                </Pie>
                <Tooltip />
                <Legend />
            </PieChart>
            
            {/* You can add other charts (like line or pie) for Return, Risk, and Sharpe Ratio here */}


            <LineChart width={1000} height={600} data={combinedData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="return" stroke="#82ca9d" name="Portfolio Return" activeDot={{ r: 8 }} />
                <Line type="monotone" dataKey="sp500Return" stroke="#8884d8" name="S&P 500 Benchmark" />
            </LineChart>
            
        </div>
    );
}

export default PortfolioCharts;