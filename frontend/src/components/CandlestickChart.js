import React from 'react';
import ReactApexChart from 'react-apexcharts';
import './styles/CandlestickChart.css';

const CandlestickChart = ({ data , width, height}) => {
  const series = [{
    data: data.map(item => {
      const candleData = {
        x: new Date(item.Date),
        y: [item.Open, item.High, item.Low, item.Close]
      };

      // Log the individual candle data
      console.log(candleData);

      return candleData;
    })
  }];

  const options = {
    chart: {
      type: 'candlestick',
      height: 350
    },
    title: {
      text: 'CandleStick Chart',
      align: 'left'
    },
    xaxis: {
      type: 'datetime'
    },
    yaxis: {
      tooltip: {
        enabled: true
      }
    },
    tooltip: {
      theme: 'dark', // Assuming a dark theme for better visibility
      style: {
        fontSize: '12px',
        fontFamily: 'Poppins', // Set the font family to Poppins
      },
      custom: ({ series, seriesIndex, dataPointIndex, w }) => {
        const o = w.globals.seriesCandleO[seriesIndex][dataPointIndex];
        const h = w.globals.seriesCandleH[seriesIndex][dataPointIndex];
        const l = w.globals.seriesCandleL[seriesIndex][dataPointIndex];
        const c = w.globals.seriesCandleC[seriesIndex][dataPointIndex];
        return (
          '<div class="custom-candle-tooltip">' +
          `<div class="tooltip-row"><span class="label">Open:</span><span class="value">$${o}</span></div>` +
          `<div class="tooltip-row"><span class="label">High:</span><span class="value">$${h}</span></div>` +
          `<div class="tooltip-row"><span class="label">Low:</span><span class="value">$${l}</span></div>` +
          `<div class="tooltip-row"><span class="label">Close:</span><span class="value">$${c}</span></div>` +
          '</div>'
        );
      }
    }
  };

  return (
    <ReactApexChart options={options} series={series} type="candlestick" width={width} height={height} />
  );
};

export default CandlestickChart;