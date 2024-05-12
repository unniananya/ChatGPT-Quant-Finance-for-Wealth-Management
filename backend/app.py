import openai
import numpy as np
from llm import financial_analyst
from flask import Flask, request, jsonify, make_response, session
from flask_cors import CORS, cross_origin
from flask_pymongo import PyMongo
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.exceptions import HTTPException
from bson.objectid import ObjectId
from scipy.stats import gmean
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from transformers import GPTNeoForCausalLM, GPT2Tokenizer
# from models import db, User, Response, Transaction, PortfolioReturn, PortfolioValue
from models import (
    create_user, get_user, check_user_password, create_response,
    create_portfolio, create_transaction, create_portfolio_value,
    create_portfolio_return, create_user_goals, get_all_current_user_goals, get_all_successful_user_goals, get_all_failed_user_goals,
    create_chat_message, get_user_chat_messages, create_learn_progress, 
    create_quiz_results, get_user_chat_messages_by_content, update_learn_progress,
    delete_chat_messages_by_content, get_past_quiz_questions_for_all_quizzes, create_paper_trading_portfolio,
    create_user_paper_trading_actions, create_template_chat
)
from portfolio import portfolio_optimization, getSP500returns, update_portfolio_metrics
from celery import Celery
from datetime import timedelta
import logging
import jwt
import datetime
from werkzeug.utils import secure_filename
import os
from bson import json_util, ObjectId
import json
import vonage
from forecast import get_latest_news, get_daily_news, predict
import finnhub
import re
import tiktoken
import yfinance as yf
import pandas as pd
from dateutil.relativedelta import relativedelta
import pytz
from requests.exceptions import HTTPError
import traceback
import requests
import time
import os
openai_api_key = os.getenv('OPENAI_API_KEY')

from PatternPy.tradingpatterns.tradingpatterns import detect_head_shoulder, detect_multiple_tops_bottoms, calculate_support_resistance, detect_triangle_pattern, detect_wedge, detect_channel, detect_double_top_bottom, detect_trendline, find_pivots

# logging.basicConfig(filename='logfile.txt', level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')

UPLOAD_FOLDER = 'uploads'  # Folder where the profile pictures will be saved
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

openai.api_key = openai_api_key

vonage_client = vonage.Client(
   key=VONAGE_KEY, secret= VONAGE_SECRET
)

finnhub_client = finnhub.Client(api_key="FINNHUB_API")
FINNHUB_API_KEY = FINNHUB_API
FINNHUB_BASE_URL = 'https://finnhub.io/api/v1'

app = Flask(__name__, static_url_path='/uploads', static_folder='uploads')
# app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///fyp.db'
# app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = SECRET_KEY

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

app.config['MONGO_URI'] = 'mongodb+srv://unniananya:Yayaya021.@cluster0.0zxo4wb.mongodb.net/fyp?retryWrites=true&w=majority'  # Add your MongoDB Atlas connection string here
mongo = PyMongo(app)


# Initialize the database with the app
# db.init_app(app)

CORS(app)

MAX_TOKEN_LIMIT = 16385 


PORTFOLIO_DESCRIPTION = {
    "7Twelve Portfolio": {
        "description": "A diversified portfolio that spreads investments across 12 different asset classes aiming for a balance between growth and income. Suitable for medium to long-term investors with moderate risk tolerance. Ideal for those seeking broad market exposure and those with an intermediate level of investment knowledge.",
        "url": "https://portfoliocharts.com/portfolios/7twelve-portfolio/"
    },
    "All Seasons Portfolio": {
        "description": "Designed to perform well across various economic conditions with a mix of stocks, bonds, commodities, and Treasury Inflation-Protected Securities (TIPS). Good for investors with a low to moderate risk tolerance and a long-term investment horizon.",
        "url": "https://portfoliocharts.com/portfolios/all-seasons-portfolio/"
    },
    "Classic 60-40 Portfolio": {
        "description": "A traditional portfolio with 60% allocated to stocks for growth and 40% to bonds for income and stability. Best for investors with a moderate risk tolerance and a medium to long-term horizon.",
        "url": "https://portfoliocharts.com/portfolios/classic-60-40-portfolio/"
    },
    "Coffeehouse Portfolio": {
        "description": "Focuses on diversification across several asset classes including stocks and bonds, with a tilt towards value investing. Suitable for investors looking for a mix of growth and income with a moderate risk tolerance.",
        "url": "https://portfoliocharts.com/portfolios/coffeehouse-portfolio/"
    },
    "Core Four Portfolio": {
        "description": "A simple, low-cost portfolio that includes domestic and international stocks, bonds, and real estate. It's designed for investors who prefer a straightforward approach with broad market exposure.",
        "url": "https://portfoliocharts.com/portfolios/core-four-portfolio/"
    },
    "Global Market Portfolio": {
        "description": "Mimics the global investment market composition, suitable for investors seeking exposure to both domestic and international equities and bonds. Ideal for those with moderate to high risk tolerance and a long-term perspective.",
        "url": "https://portfoliocharts.com/portfolios/global-market-portfolio/"
    },
    "Golden Butterfly Portfolio": {
        "description": "Balances growth and safety by dividing investments among stocks, bonds, and gold. Suitable for investors looking for protection against inflation and recessions while still aiming for growth.",
        "url": "https://portfoliocharts.com/portfolios/golden-butterfly-portfolio/"
    },
    "Ideal Index Portfolio": {
        "description": "Built entirely with index funds to capture market returns at a low cost. Best for investors who prefer a passive management strategy and have a long-term investment horizon.",
        "url": "https://portfoliocharts.com/portfolios/ideal-index-portfolio/"
    },
    "Ivy Portfolio": {
        "description": "Mimics the diversified, alternative investment strategies of Ivy League endowments. Suitable for sophisticated investors seeking growth with a balanced approach to risk through diversification across asset classes.",
        "url": "https://portfoliocharts.com/portfolios/ivy-portfolio/"
    },
    "Larry Portfolio": {
        "description": "Focuses on small-cap and value stocks with a significant allocation to fixed income. Designed for investors with a lower risk tolerance who seek higher returns through factor investing.",
        "url": "https://portfoliocharts.com/portfolios/larry-portfolio/"
    },
    "No-Brainer Portfolio": {
        "description": "An equally weighted portfolio of four broad asset classes. Simple and straightforward, suitable for beginners with a long-term investment horizon and moderate risk tolerance.",
        "url": "https://portfoliocharts.com/portfolios/no-brainer-portfolio/"
    },
    "Permanent Portfolio": {
        "description": "Aims to provide stability and growth regardless of market conditions by equally dividing assets among stocks, bonds, cash, and gold. Suitable for conservative investors with a long-term horizon.",
        "url": "https://portfoliocharts.com/portfolios/permanent-portfolio/"
    },
    "Pinwheel Portfolio": {
        "description": "Diversifies across various asset classes and economic sectors to achieve growth and income. Ideal for investors with a medium to long-term horizon and a moderate risk tolerance.",
        "url": "https://portfoliocharts.com/portfolios/pinwheel-portfolio/"
    },
    "Sandwich Portfolio": {
        "description": "Not a standard portfolio concept, this term might be used for portfolios that layer different strategies or asset classes. It could be tailored based on individual investor preferences, risk tolerance, and goals.",
        "url": "https://portfoliocharts.com/portfolios/sandwich-portfolio/"
    },
    "Swensen Portfolio": {
        "description": "Inspired by Yale's endowment, this portfolio diversifies across domestic and international equities, real estate, and bonds. Suitable for investors with a moderate to high risk tolerance and a long-term investment goal.",
        "url": "https://portfoliocharts.com/portfolios/swensen-portfolio/"
    },
    "Three-Fund Portfolio": {
        "description": "Consists of three broad index funds covering U.S. stocks, international stocks, and U.S. bonds. Ideal for investors seeking simplicity and broad market exposure with a long-term perspective.",
        "url": "https://portfoliocharts.com/portfolios/three-fund-portfolio/"
    },
    "Total Stock Market Portfolio": {
        "description": "Invests entirely in a total stock market fund for maximum growth potential. Best suited for investors with a high risk tolerance and a long-term investment horizon.",
        "url": "https://portfoliocharts.com/portfolios/total-stock-market-portfolio/"
    },
    "Ultimate Buy and Hold Portfolio": {
        "description": "Diversifies across global asset classes to reduce risk and improve returns. Suitable for long-term investors with a moderate to high risk tolerance looking for growth and income.",
        "url": "https://portfoliocharts.com/portfolios/ultimate-buy-and-hold-portfolio/"
    },
    "Weird Portfolio": {
        "description": "A conceptual portfolio not based on standard investment principles. It could be designed for investors with specific, unconventional investment preferences and a high tolerance for risk.",
        "url": "https://portfoliocharts.com/portfolios/weird-portfolio/"
    }
}

FINANCE_TOPICS = {
    "Fundamental Analysis": {
        "Understanding Financial Statements": "Grasp the basics of income statements, balance sheets, and cash flow statements.",
        "Financial Ratios": "Learn about ratios like P/E, Debt-to-Equity, ROE, etc.",
        "Company Analysis": "Analyze a company's business model, competitive advantage, and management.",
        "Industry Analysis": "Understand the industry dynamics in which companies operate.",
        "Economic Indicators": "Learn about GDP, inflation, interest rates, and their impact on markets.",
        "Revenue and Profit Analysis": "Evaluate a company's revenue streams and profitability.",
        "Valuation Techniques": "Understand DCF, comparative valuation, etc.",
        "Risk Analysis": "Assess business and financial risks.",
        "Forecasting and Projections": "Learn to project future performance.",
        "Investment Thesis Development": "Develop a rationale for investment decisions."
    },
    "Technical Analysis": {
        "Price Charts and Patterns": "Understand basic chart types and patterns.",
        "Technical Indicators": "Learn about MACD, RSI, moving averages, etc.",
        "Trend Analysis": "Identify and analyze market trends.",
        "Trading Volumes and Market Sentiment": "Understand their implications.",
        "Support and Resistance Levels": "Identify key price levels.",
        "Candlestick Patterns": "Learn to interpret candlestick formations.",
        "Time Frames and Trading Styles": "Differentiate between day trading, swing trading, etc.",
        "Risk Management in Trading": "Learn about stop-loss, position sizing.",
        "Algorithmic Trading Basics": "Understand the basics of trading algorithms.",
        "Backtesting Strategies": "Test trading strategies against historical data."
    },
    "Portfolio Theory": {
        "Modern Portfolio Theory (MPT)": "Understand risk-return trade-off.",
        "Asset Allocation": "Learn about diversification across asset classes.",
        "Portfolio Optimization": "Understand how to maximize returns for a given risk level.",
        "Correlation Between Assets": "Learn how different assets interact.",
        "Risk Management": "Understand different types of investment risk.",
        "Performance Measurement": "Learn about Sharpe ratio, alpha, beta.",
        "Rebalancing Strategies": "Understand when and how to rebalance a portfolio.",
        "Tax Considerations in Investing": "Understand tax implications of trading.",
        "Behavioral Finance": "Understand how psychology affects investment decisions.",
        "Alternative Investments": "Explore real estate, commodities, etc."
    },
    "Macroeconomics": {
        "Supply and Demand Fundamentals": "Understand basic economic principles.",
        "Monetary Policy": "Learn about central banks and interest rates.",
        "Fiscal Policy": "Understand government spending and taxation.",
        "Economic Cycles": "Learn about boom and bust cycles.",
        "International Trade and Forex": "Understand how global trade affects markets.",
        "Inflation and Deflation": "Learn about their causes and effects.",
        "Employment and Labor Market": "Understand their impact on the economy.",
        "Commodities and Natural Resources": "Learn about their role in the economy.",
        "Economic Indicators and Reports": "Understand reports like unemployment rates, CPI.",
        "Global Economic Events": "Understand how events like recessions impact markets."
    },
    "Personal Finance and Wealth Management": {
        "Budgeting and Saving": "Learn the basics of personal budgeting.",
        "Understanding Credit and Loans": "Learn about credit scores, types of loans.",
        "Insurance and Risk Management": "Understand different types of insurance.",
        "Retirement Planning": "Basics of pensions, 401(k)s, IRAs.",
        "Tax Planning": "Understand how to manage taxes effectively.",
        "Estate Planning": "Basics of wills, trusts, and estate management.",
        "Investment Vehicles": "Learn about stocks, bonds, mutual funds, ETFs.",
        "Wealth Accumulation Strategies": "Understand different strategies for growing wealth.",
        "Financial Goal Setting and Planning": "Set and plan for financial goals.",
        "Holistic Wealth Management": "Learn to manage all aspects of your financial life."
    }
}


CONTENT_TO_TOPIC_MAP = {
    "Understanding Financial Statements": "Fundamental Analysis",
    "Financial Ratios": "Fundamental Analysis",
    "Company Analysis": "Fundamental Analysis",
    "Industry Analysis": "Fundamental Analysis",
    "Economic Indicators": "Fundamental Analysis",
    "Revenue and Profit Analysis": "Fundamental Analysis",
    "Valuation Techniques": "Fundamental Analysis",
    "Risk Analysis": "Fundamental Analysis",
    "Forecasting and Projections": "Fundamental Analysis",
    "Investment Thesis Development": "Fundamental Analysis",

    "Price Charts and Patterns": "Technical Analysis",
    "Technical Indicators": "Technical Analysis",
    "Trend Analysis": "Technical Analysis",
    "Trading Volumes and Market Sentiment": "Technical Analysis",
    "Support and Resistance Levels": "Technical Analysis",
    "Candlestick Patterns": "Technical Analysis",
    "Time Frames and Trading Styles": "Technical Analysis",
    "Risk Management in Trading": "Technical Analysis",
    "Algorithmic Trading Basics": "Technical Analysis",
    "Backtesting Strategies": "Technical Analysis",

    "Modern Portfolio Theory (MPT)": "Portfolio Theory",
    "Asset Allocation": "Portfolio Theory",
    "Portfolio Optimization": "Portfolio Theory",
    "Correlation Between Assets": "Portfolio Theory",
    "Risk Management": "Portfolio Theory",
    "Performance Measurement": "Portfolio Theory",
    "Rebalancing Strategies": "Portfolio Theory",
    "Tax Considerations in Investing": "Portfolio Theory",
    "Behavioral Finance": "Portfolio Theory",
    "Alternative Investments": "Portfolio Theory",

    "Supply and Demand Fundamentals": "Macroeconomics",
    "Monetary Policy": "Macroeconomics",
    "Fiscal Policy": "Macroeconomics",
    "Economic Cycles": "Macroeconomics",
    "International Trade and Forex": "Macroeconomics",
    "Inflation and Deflation": "Macroeconomics",
    "Employment and Labor Market": "Macroeconomics",
    "Commodities and Natural Resources": "Macroeconomics",
    "Economic Indicators and Reports": "Macroeconomics",
    "Global Economic Events": "Macroeconomics",

    "Budgeting and Saving": "Personal Finance and Wealth Management",
    "Understanding Credit and Loans": "Personal Finance and Wealth Management",
    "Insurance and Risk Management": "Personal Finance and Wealth Management",
    "Retirement Planning": "Personal Finance and Wealth Management",
    "Tax Planning": "Personal Finance and Wealth Management",
    "Estate Planning": "Personal Finance and Wealth Management",
    "Investment Vehicles": "Personal Finance and Wealth Management",
    "Wealth Accumulation Strategies": "Personal Finance and Wealth Management",
    "Financial Goal Setting and Planning": "Personal Finance and Wealth Management",
    "Holistic Wealth Management": "Personal Finance and Wealth Management"
}

# STOCKS_STAGE_1_2 = ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "META", "JNJ", "JPM", "V", "PG", "NVDA", "DIS", "NFLX"]

STOCKS_STAGE_1_2 = [
    {"name": "Apple Inc.", "symbol": "AAPL"},
    {"name": "Microsoft Corporation", "symbol": "MSFT"},
    {"name": "Alphabet Inc.", "symbol": "GOOGL"},
    {"name": "Amazon.com, Inc.", "symbol": "AMZN"},
    {"name": "Tesla, Inc.", "symbol": "TSLA"},
    {"name": "Meta Platforms, Inc.", "symbol": "META"},
    {"name": "Johnson & Johnson", "symbol": "JNJ"},
    {"name": "JPMorgan Chase & Co.", "symbol": "JPM"},
    {"name": "Visa Inc.", "symbol": "V"},
    {"name": "Procter & Gamble Company", "symbol": "PG"},
    {"name": "NVIDIA Corporation", "symbol": "NVDA"},
    {"name": "The Walt Disney Company", "symbol": "DIS"},
    {"name": "Netflix, Inc.", "symbol": "NFLX"}
]

STOCKS_STAGE_3 = {
    "Stocks": {
        "Apple Inc.": "AAPL",
        "Microsoft Corporation": "MSFT",
        "Coca-Cola Company": "KO"
    },
    "Bonds": {
        "U.S. Treasury Bonds": "TLT",
        "Corporate Bonds": "LQD",
        "Municipal Bonds": "MUB",
        "something": "FRCCL"
    },
    "Cash and Cash Equivalents": {
        "Fidelity Money Market Fund": "SPRXX", 
        "Short-term Treasury Bills": "SHV"
    },
    "Real Estate": {
        "Real Estate Investment Trusts": "VNQ"
    },
    "Commodities": {
        "Gold": "GLD",
        "Oil": "USO",
        "Agricultural Products": "DBA"
    }
}


PORTFOLIO_ALLOCATIONS = {
    "7Twelve Portfolio": "{'Large Cap Blend': '12.5%', 'Small Cap Blend': '12.5%', 'International Stocks': '8.3%', 'Emerging Markets': '8.3%', 'Intermediate Bonds': '17%', 'International Bonds': '8.3%', 'Cash and Cash Equivalents': '8.3%', 'Commodities': '16.6%', 'Real Estate': '8.3%'}",
    "All Seasons Portfolio": "{'Total Stock Market': '30%', 'Long Term Bonds': '40%', 'Intermediate Bonds': '15%', 'Commodities': '7.5%', 'Gold': '7.5%'}",
    "Classic 60-40 Portfolio": "{'Total Stock Market': '60%', 'Intermediate Bonds': '40%'}",
    "Coffeehouse Portfolio": "{'Large Cap Blend': '10%', 'Large Cap Value': '10%', 'Small Cap Blend': '10%', 'Small Cap Value': '10%', 'International Stocks': '10%', 'Intermediate Bonds': '40%', 'Real Estate': '10%'}",
    "Core Four Portfolio": "{'Total Stock Market': '48%', 'International Stocks': '24%', 'Intermediate Bonds': '20%', 'Real Estate': '8%'}",
    "Global Market Portfolio": "{'World Developed Stocks': '45%', 'Emerging Markets': '5%', 'Intermediate Bonds': '44%', 'Real Estate': '4%', 'Gold': '2%'}",
    "Golden Butterfly Portfolio": "{'Total Stock Market': '20%', 'Small Cap Value': '20%', 'Long Term Bonds': '20%', 'Short Term Bonds': '20%', 'Gold': '20%'}",
    "Ideal Index Portfolio": "{'Large Cap Blend': '6.25%', 'Large Cap Value': '9.25%', 'Small Cap Growth': '6.25%', 'Small Cap Value': '9.25%', 'International Stocks': '31%', 'Short Term Bonds': '30%', 'Real Estate': '8%'}",
    "Ivy Portfolio": "{'Total Stock Market': '20%', 'International Stocks': '20%', 'Intermediate Bonds': '20%', 'Commodities': '20%', 'Real Estate': '20%'}",
    "Larry Portfolio": "{'Small Cap Value': '15%', 'International Small Cap Value': '7.5%', 'Emerging Markets': '7.5%', 'Intermediate Bonds': '70%'}",
    "No-Brainer Portfolio": "{'Large Cap Blend': '25%', 'Small Cap Blend': '25%', 'International Stocks': '25%', 'Short Term Bonds': '25%'}",
    "Permanent Portfolio": "{'Total Stock Market': '25%', 'Long Term Bonds': '25%', 'Cash and Cash Equivalents': '25%', 'Gold': '25%'}",
    "Pinwheel Portfolio": "{'Total Stock Market': '15%', 'Small Cap Value': '10%', 'International Stocks': '15%', 'Emerging Markets': '10%', 'Intermediate Bonds': '15%', 'Cash and Cash Equivalents': '10%', 'Real Estate': '15%', 'Gold': '10%'}",
    "Sandwich Portfolio": "{'Large Cap Blend': '20%', 'Small Cap Blend': '8%', 'International Stocks': '6%', 'International Small Cap Blend': '10%', 'Emerging Markets': '6%', 'Intermediate Bonds': '30%', 'International Bonds': '11%', 'Cash and Cash Equivalents': '4%', 'Real Estate': '5%'}",
    "Swensen Portfolio": "{'Total Stock Market': '30%', 'International Stocks': '15%', 'Emerging Markets': '5%', 'Intermediate Bonds': '30%', 'Real Estate': '20%'}",
    "Three-Fund Portfolio": "{'Total Stock Market': '48%', 'International Stocks': '12%', 'Intermediate Bonds': '40%'}",
    "Total Stock Market Portfolio": "{'Total Stock Market': '100%'}",
    "Ultimate Buy and Hold Portfolio": "{'Large Cap Blend': '6%', 'Large Cap Value': '6%', 'Small Cap Blend': '6%', 'Small Cap Value': '6%', 'International Large Cap Blend': '6%', 'International Large Cap Value': '6%', 'International Small Cap Blend': '6%', 'International Small Cap Value': '6%', 'Emerging Markets': '6%', 'Intermediate Bonds': '20%', 'Short Term Bonds': '20%', 'Real Estate': '6%'}",
    "Weird Portfolio": "{'Small Cap Value': '20%', 'International Small Cap Blend': '20%', 'Long Term Bonds': '20%', 'Real Estate': '20%', 'Gold': '20%'}",
}


# RISK_PROFILES = {
#     "Conservative": "Stocks: 20%, Bonds: 80%",
#     "Moderate": "Stocks: 40%, Bonds: 30%, Cash and Cash Equivalents: 20%, Real Estate: 10%",
#     "Aggressive": "Stocks: 75%, Bonds: 10%, Cash and Cash Equivalents: 5%, Real Estate: 10%"
# }


RISK_PROFILES = {
    "Conservative": "Total Stock Market: 20%, Long Term Bonds: 80%",
    "Moderately Conservative": "Small Cap Value: 15%, International Small Cap Value: 7.5%, Emerging Markets: 7.5%, Intermediate Bonds: 70%",
    "Moderate": "Total Stock Market: 60%, Intermediate Bonds: 40%",
    "Moderately Aggressive": "Total Stock Market: 20%, International Stocks: 20%, Intermediate Bonds: 20%, Commodities: 20%, Real Estate: 20%",
    "Aggressive": "Total Stock Market: 100%"
}


@app.errorhandler(HTTPException)
def handle_exception(e):
    """Return JSON instead of HTML for HTTP errors."""
    response = e.get_response()
    # Replace the body with JSON
    response.data = jsonify({
        "code": e.code,
        "name": e.name,
        "description": e.description,
    })
    response.content_type = "application/json"
    response = jsonify({'error': 'Internal Server Error', 'message': str(e)})
    response.status_code = 500  # Or another appropriate status code
    return response

def delete_later():
    user_id = "657030a446050bf277393dad"
    topic_name = 'Price Charts and Patterns'
    all_past_questions = get_past_quiz_questions_for_all_quizzes(mongo, user_id, topic_name)
    return all_past_questions


def get_token_from_header():
    authorization_header = request.headers.get('Authorization')
    if not authorization_header or 'Bearer ' not in authorization_header:
        return None
    return authorization_header.split("Bearer ")[1]



@app.route('/get-user-watchlist', methods=['GET'])
def get_user_watchlist():
    token = get_token_from_header()
    if not token:
        return jsonify({"error": "Invalid Authorization header format"}), 401

    try:
        data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token has expired"}), 401
    except jwt.InvalidTokenError as e:
        return jsonify({"error": str(e)}), 401

    user_id = ObjectId(data['user_id'])
    user = mongo.db.users.find_one({"_id": user_id})
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Retrieve the watchlist from the user document, defaulting to an empty list if not found
    watchlist = user.get('watchlist', [])
    
    return jsonify({'watchlist': watchlist})


@app.route('/remove-from-watchlist', methods=['POST'])
def remove_from_watchlist():
    token = get_token_from_header()
    if not token:
        return jsonify({"error": "Invalid Authorization header format"}), 401

    try:
        data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token has expired"}), 401
    except jwt.InvalidTokenError as e:
        return jsonify({"error": str(e)}), 401

    user_id = ObjectId(data['user_id'])
    stock_symbol = request.json.get('stockSymbol')

    if not stock_symbol:
        return jsonify({"error": "Stock symbol is required"}), 400

    # Adjust the update query to match objects by the 'symbol' field inside the 'watchlist' array
    result = mongo.db.users.update_one(
        {"_id": user_id},
        {"$pull": {"watchlist": {"symbol": stock_symbol}}}
    )

    if result.modified_count == 0:
        return jsonify({"error": "Stock symbol not found in watchlist or other error occurred"}), 404

    return jsonify({"message": "Stock symbol removed from watchlist successfully"}), 200


@app.route('/project_future_portfolio_values3', methods=['GET'])
def project_future_portfolio_values3():

    collection = mongo.db["portfolio_returns"]

    token = get_token_from_header()
    try:
        data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token has expired"}), 401
    
    user_id = data['user_id']
    portfolio_name = request.args.get('portfolio_name')
    
    portfolio_data = collection.find_one(
        {"user_id": user_id, "portfolio_name": portfolio_name},
        {"portfolio_hist_return": 1, "current_portfolio_value": 1}
    )
    
    if not portfolio_data:
        return jsonify({"error": "Portfolio not found"}), 404
    
    # The Black-Litterman model would be applied here to adjust the expected returns based on market data and investor's views.
    # For simplicity, we're using historical returns to project future values.
    
    # Extract return values from the portfolio_hist_return list of dictionaries
    hist_returns = [item['return'] for item in portfolio_data.get("portfolio_hist_return", [])]
    current_value = portfolio_data.get("current_portfolio_value", 0)
    
    if not hist_returns:
        return jsonify({"error": "No historical returns found"}), 404
    
    # Calculate mean and standard deviation of historical returns
    mean_return = np.mean(hist_returns)
    std_dev_return = np.std(hist_returns)
    
    # Monte Carlo simulation
    time_horizon = 180  # Projecting for 6 months
    simulations = 10000
    future_values = []
    for _ in range(simulations):
        random_walk = np.random.normal(mean_return, std_dev_return, time_horizon)
        cumulative_returns = np.cumprod(1 + random_walk)
        future_values.append(current_value * cumulative_returns[-1])

    # Calculate projected values with percentiles for each day
    projections = []
    for day in range(1, time_horizon + 1):
        daily_values = [current_value * np.cumprod(1 + np.random.normal(mean_return, std_dev_return, day))[-1] for _ in range(simulations)]
        lower_bound = np.percentile(daily_values, 50)
        upper_bound = np.percentile(daily_values, 95)
        
        future_date = datetime.datetime.now() + timedelta(days=day)
        projections.append({
            "date": future_date.strftime("%Y-%m-%d"),
            "range": [lower_bound, upper_bound]
        })

    print("projections: ", projections)

    return jsonify(projections)


def monte_carlo_projection(current_value, mean, std, days, simulations):
    # Generate future returns for each simulation
    daily_returns = np.random.normal(mean, std, (days, simulations))
    cumulative_returns = np.cumprod(1 + daily_returns, axis=0)
    
    # Calculate the portfolio value for each day and simulation
    future_portfolio_values = current_value * cumulative_returns
    
    # Extract the 5th and 95th percentiles for each day to get the projection range
    lower_bounds = np.percentile(future_portfolio_values, 5, axis=1)
    upper_bounds = np.percentile(future_portfolio_values, 95, axis=1)
    
    return lower_bounds, upper_bounds

@app.route('/project_future_portfolio_values2', methods=['GET'])
def project_future_portfolio_values2():

    collection = mongo.db["portfolio_returns"]

    token = get_token_from_header()
    try:
        data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token has expired"}), 401
    
    user_id = data['user_id']
    portfolio_name = request.args.get('portfolio_name')
    
    portfolio_data = collection.find_one(
        {"user_id": user_id, "portfolio_name": portfolio_name},
        {"portfolio_hist_return": 1, "current_portfolio_value": 1}
    )
    
    if not portfolio_data:
        return jsonify({"error": "Portfolio not found"}), 404
    
    hist_returns = [item['return'] for item in portfolio_data.get("portfolio_hist_return", [])]
    current_value = portfolio_data.get("current_portfolio_value", 0)
    
    mean_return = np.mean(hist_returns)
    std_dev_return = np.std(hist_returns)
    
    time_horizon = 365  # Days to project into the future
    simulations = 1000  # Number of simulated paths
    
    lower_bounds, upper_bounds = monte_carlo_projection(
        current_value, mean_return, std_dev_return, time_horizon, simulations
    )
    
    projections = [{
        "date": (datetime.datetime.now() + timedelta(days=day)).strftime("%Y-%m-%d"),
        "range": [float(lower_bounds[day]), float(upper_bounds[day])]
    } for day in range(time_horizon)]
    
    return jsonify(projections)


def generate_features_targets(hist_returns, window_size=5):
    """
    Generate features and targets for the model based on historical returns.
    Each feature set consists of 'window_size' consecutive returns, with the next return as the target.
    """
    X, y = [], []
    for i in range(len(hist_returns) - window_size):
        X.append(hist_returns[i:i+window_size])
        y.append(hist_returns[i+window_size])
    return np.array(X), np.array(y)

def predict_future_returns(model, last_returns, n_days=180):
    """
    Predict future returns for 'n_days' using the trained model and the most recent returns.
    """
    predictions = []
    current_features = last_returns
    for _ in range(n_days):
        # Predict the next return
        next_return = model.predict([current_features])[0]
        predictions.append(next_return)
        
        # Update the features for the next prediction
        current_features = np.roll(current_features, -1)
        current_features[-1] = next_return
    return predictions

@app.route('/project_future_portfolio_values1', methods=['GET'])
def project_future_portfolio_values1():
    collection = mongo.db["portfolio_returns"]

    # user_id = "657030a446050bf277393dad"
    token = get_token_from_header()
    try:
        data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token has expired"}), 401

    user_id = data['user_id']
    portfolio_name = request.args.get('portfolio_name')
    # portfolio_name = "automated"
    
    # Retrieve portfolio historical returns and current value
    portfolio_data = collection.find_one({"user_id": user_id, "portfolio_name": portfolio_name}, 
                                          {"portfolio_hist_return": 1, "current_portfolio_value": 1})
    
    if not portfolio_data:
        return {"error": "Portfolio not found"}

    
    # Extract return values from the portfolio_hist_return list of dictionaries
    hist_returns = [item['return'] for item in portfolio_data.get("portfolio_hist_return", []) if 'return' in item]
    current_value = portfolio_data.get("current_portfolio_value", 0)
    print("current_value: ", current_value)
    # Split the historical returns into features and targets
    window_size = 5  # Using 5 previous returns to predict the next one
    X, y = generate_features_targets(hist_returns, window_size=window_size)
    
    # Split the data into training and testing sets
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Initialize and train the Random Forest model
    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)
    
    # Use the most recent returns as the initial features for future predictions
    last_returns = X[-1]
    
    # Predict future returns for the next 6 months (approximately 180 days)
    future_returns = predict_future_returns(model, last_returns, n_days=180)
    
    # Project future portfolio values
    future_dates = [datetime.datetime.now() + timedelta(days=i) for i in range(1, 181)]
    future_values = [current_value * (1 + r) for r in np.cumprod(np.array(future_returns) + 1) - 1]
    
    # Approximate upper and lower bounds (this is a simplified approach)
    # In practice, you may use bootstrapping or other methods to estimate prediction intervals
    std_dev = np.std(future_returns)
    upper_bounds = [v * (1 + std_dev) for v in future_values]
    lower_bounds = [v * (1 - std_dev) for v in future_values]
    
    projections = [{
        "date": date.strftime("%Y-%m-%d"),
        "range": [lower, upper]
        # "upper_range_value": upper
    } for date, lower, upper in zip(future_dates, lower_bounds, upper_bounds)]
    
    return jsonify(projections)

@app.route('/project_future_portfolio_values', methods=['GET'])
def project_future_portfolio_values():
    collection = mongo.db["portfolio_returns"]
    token = get_token_from_header()
    try:
        data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token has expired"}), 401
    user_id = data['user_id']
    portfolio_name = request.args.get('portfolio_name')
    portfolio_data = collection.find_one({"user_id": user_id, "portfolio_name": portfolio_name}, {"portfolio_hist_return": 1, "current_portfolio_value": 1})
    if not portfolio_data:
        return jsonify({"error": "Portfolio not found"}), 404
    hist_returns = [item['return'] for item in portfolio_data.get("portfolio_hist_return", []) if 'return' in item]
    current_value = portfolio_data.get("current_portfolio_value", 0)
    if not hist_returns:
        return jsonify({"error": "No historical returns found"}), 404

    # Use geometric mean for the mean return calculation, adjusted for inflation and market growth
    inflation_rate = -0.005  # Assuming an annual inflation rate of 2%
    # market_growth_adjustment = 0.01  # Adjusting mean return for expected market growth
    mean_return = gmean([1 + r for r in hist_returns]) - 1 - inflation_rate
    std_dev_return = np.std(hist_returns)
    
    num_simulations = 10000  # Number of Monte Carlo simulations
    num_years = 30  # Number of years to project
    
    projections = []
    percentiles_data = []  # To store 25th and 50th percentiles
    for year in range(1, num_years + 1):
        future_date = datetime.datetime.now() + timedelta(days=(year - 1) * 365)
        
        simulated_end_values = []
        for _ in range(num_simulations):
            # Simulate the returns for each year
            annual_returns = np.random.normal(mean_return, std_dev_return, year)
            # Calculate the compounded portfolio value
            compounded_value = current_value * np.prod(1 + annual_returns)
            compounded_value = max(compounded_value, 0)  # Ensure non-negative values
            simulated_end_values.append(compounded_value)
        
        # Calculate percentiles to get a range
        lower_bound, upper_bound, median_value, percentile_25 = calculate_percentiles(simulated_end_values)
        
        projections.append({"date": future_date.strftime("%Y-%m-%d"), "range": [lower_bound, upper_bound]})
        percentiles_data.append({"date": future_date.strftime("%Y-%m-%d"), "percentile_25": percentile_25, "median": median_value})
    
    return jsonify({"projections": projections, "percentiles_data": percentiles_data})

def calculate_percentiles(values):
    lower_bound = np.percentile(values, 5)  # 5th percentile
    upper_bound = np.percentile(values, 95)  # 95th percentile
    median_value = np.percentile(values, 50)  # 50th percentile
    percentile_25 = np.percentile(values, 25)  # 25th percentile
    return max(lower_bound, 0), max(upper_bound, 0), max(median_value, 0), max(percentile_25, 0)


@app.route('/chatgpt_advice', methods=['POST'])
def chatgpt_advice():
    token = get_token_from_header()
    try:
        data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token has expired"}), 401

    user_id = data['user_id']
    portfolio_name = request.json.get('portfolioName')
    # paper_trading_template_name = request.json.get('paperTradingTemplateName')
    # all_stocks_data = request.json.get('allStocksData', [])
    current_asset_class_percentages = request.json.get('currentAssetClassPercentages', [])
    target_profile = request.json.get('targetProfile', [])

    print("target_profile: ", target_profile)

    # Format the current asset class percentages for the message
    # current_asset_class_percentages_str = ', '.join([f"{asset_class}: {percentage}%" for asset_class, percentage in current_asset_class_percentages.items()])
    # Adjusted to handle array of objects
    total_value = sum(asset['value'] for asset in current_asset_class_percentages)
    current_asset_class_percentages_str = ', '.join(
        [f"{asset['name']}: {((asset['value'] / total_value) * 100) if total_value > 0 else 0:.2f}%" for asset in current_asset_class_percentages]
    )
    print("current_asset_class_percentages_str: ", current_asset_class_percentages_str)

    # stocks_info_str = ', '.join([
    #     f"{stock['symbol']} (Asset Class: {stock['assetClass']}, Price: ${stock['price']}, Daily Change: {stock['dailyChange']}%, "
    #     f"Moving Average: ${stock['movingAverage']}, RSI: {stock['rsi']}, "
    #     f"MACD: {stock['macd']}, MACD Signal: {stock['macdSignal']})"
    #     for stock in all_stocks_data
    # ])
    # print("stocks_info_str: ", stocks_info_str)

    # Fetch all user actions from the database
    user_actions_collection = mongo.db.user_portfolio_actions
    user_actions_doc = user_actions_collection.find_one(
        {"user_id": user_id, "portfolio_name": portfolio_name}
    )

    if user_actions_doc:
        user_actions = user_actions_doc['user_actions']
    else:
        user_actions = []
        # Create a new document if it does not exist
        user_actions_collection.insert_one({"user_id": user_id, "portfolio_name": portfolio_name, "user_actions": user_actions})

    # Add the current action to the user_actions list
    current_action = request.json.get('userActions')
    current_action_entry = {"date": datetime.datetime.now(), "action": current_action}
    user_actions.append(current_action_entry)

    # Update the user_actions in the database
    user_actions_collection.update_one(
        {"user_id": user_id, "portfolio_name": portfolio_name},
        {"$push": {"user_actions": current_action_entry}}
    )

    # Reverse the order of user actions so the latest comes first
    user_actions = user_actions[::-1]

    # Format all actions into a string for ChatGPT
    actions_str = ' '.join([f"On {action['date'].strftime('%Y-%m-%d %H:%M:%S')} user did: {action['action']}" for action in user_actions])

    print("actions: ", actions_str)


    # Fetch the user's current assets from the paper trading portfolio
    portfolio_collection = mongo.db.portfolios
    user_portfolio_doc = portfolio_collection.find_one(
        {"user_id": user_id, "portfolio_name": portfolio_name}
    )

    weights = user_portfolio_doc.get('weights', [])
    weights_str = ', '.join([f"{asset['symbol']} ({asset['quantity']} shares)" for asset in weights])

    # System prompt for ChatGPT
    system_prompt = (
        "You are an AI financial advisor. "
        "Provide suggestions and advice based on the user's paper stock trading actions, "
        "current asset allocation, and their target risk profile "
        "to help them align their portfolio accordingly. "
        "Please give your answer as a html document while ensuring the color of the text is white except for h1 and h2 which is #0066cd "
        # "Please also no need to give an overall title for the answer, however subtitles are fine"
        "Please ensure that the font size of h1 is always 1.2em and bold, font size of h2 is 1.1em and bold and font size of p is 1em and not bold and the rest is 1em and not bold. "
        "Add some margin on top for all h1 and h2. "
    )

    # Generate the message for ChatGPT based on user actions, stock data, and risk profile
    user_message = (
        f"The user's actions in the stock trading app include: {actions_str}. "
        f"Their current asset allocation is: {current_asset_class_percentages_str}. "
        f"The user's target risk profile needs an allocation of {target_profile}. "
        f"What advice would you offer to help the user achieve this target allocation? "
        f"Based on these actions, current market trends, and the target risk profile, "
        f"which specific stocks would you recommend buying or selling and why? "
        f"For your reference, the user currently holds the following stocks: {weights_str}."
    )

    print("user_message: ", user_message)

    response = openai.ChatCompletion.create(
        model="gpt-3.5-turbo-1106",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message}
        ]
    )
    return jsonify({"advice": response.choices[0].message['content']})


@app.route('/get_selected_stock_info', methods=['GET'])
def get_selected_stock_info():
    symbol = request.args.get('symbol')  # Get the 'symbol' query parameter
    if not symbol:
        return jsonify({"error": "Stock symbol is required"}), 400
    print("Symbol type", type(symbol))

    try:
        ticker = yf.Ticker(symbol)
        # Fetch historical data for the last 60 days to calculate indicators
        hist = ticker.history(period="60d")

        print("hist: ", hist)

        if not hist.empty:
            last_quote = hist.tail(1)['Close'].iloc[0]
            prev_close = hist.iloc[-2]['Close']

            # Calculate technical indicators
            hist['SMA_20'] = hist['Close'].rolling(window=20).mean()
            # hist['RSI'] = hist['Close'].rolling(window=14).apply(lambda x: pd.Series(x).pct_change().add(1).cumprod().iloc[-1])
            hist['RSI'] = calculate_rsi(hist['Close'], window=14)
            hist = calculate_macd(hist)  # Ensure you have defined 'calculate_macd' elsewhere

            moving_average = hist.iloc[-1]['SMA_20']
            rsi = hist.iloc[-1]['RSI']
            macd = hist.iloc[-1]['MACD']
            macd_signal = hist.iloc[-1]['MACD_Signal']

            # Query MongoDB for the stock's portfolio_asset_types
            # Ensure your MongoDB client is correctly initialized and 'mongo' is defined
            stock_doc = mongo.db.stocks.find_one({"symbol": symbol}, {"portfolio_asset_types": 1})

            stock_info = {
                # "name": ticker.info['longName'] if 'longName' in ticker.info else 'N/A',  # Fetch name from yfinance
                "symbol": symbol,
                "price": round(last_quote, 2),
                "dailyChange": round((last_quote - prev_close) / prev_close * 100, 2),
                "movingAverage": round(moving_average, 2),
                "rsi": round(rsi, 2), # Ensure RSI value is not empty
                "macd": round(macd, 2),
                "macdSignal": round(macd_signal, 2),
                "portfolioAssetTypes": stock_doc['portfolio_asset_types'] if stock_doc else None
            }

            return jsonify(stock_info)
        else:
            return jsonify({"error": f"No historical data found for {symbol}"}), 404
    except Exception as e:
        print(f"Error retrieving data for {symbol}: {e}")
        return jsonify({"error": "An error occurred while processing your request"}), 500


@app.route('/get_portfolio_weights_data', methods=['GET'])
def get_portfolio_weights_data():
    token = get_token_from_header()  # Replace with your method to extract token from header
    try:
        data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token has expired"}), 401

    user_id = data['user_id']
    portfolio_name = request.args.get('portfolioName')

    portfolio_collection = mongo.db.portfolios
    portfolio_returns_collection = mongo.db.portfolio_returns

    portfolio = portfolio_collection.find_one({"user_id": user_id, "portfolio_name": portfolio_name})
    portfolio_return = portfolio_returns_collection.find_one({"user_id": user_id, "portfolio_name": portfolio_name})

    if not portfolio:
        return jsonify({"error": "Portfolio not found"}), 404
    
    if not portfolio_return:
        return jsonify({"error": "Portfolio not found"}), 404

    current_assets = portfolio.get("weights", [])
    template = portfolio.get("template", [])
    account_balance = portfolio.get("account_balance", 0)
    current_portfolio_value = portfolio_return.get("current_portfolio_value", 0)
    if current_portfolio_value is None:
        current_portfolio_value = 0

    # print("current_assets: ", current_assets)

    # Prepare the response data
    response_data = {
        "currentAssets": current_assets,
        "template": template,
        "accountBalance": account_balance,
        "portfolioValue": current_portfolio_value,
    }

    print("response_data: ", response_data)

    return jsonify(response_data)


@app.route('/execute_transaction', methods=['POST'])
def execute_transaction():
    token = get_token_from_header()  # Extract the token from the header
    try:
        data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token has expired"}), 401

    user_id = data['user_id']
    request_data = request.get_json()
    if not request_data:
        return jsonify({"error": "No data provided"}), 400

    stock_symbol = request_data.get('stockSymbol')
    stock_name = request_data.get('stockName')
    quantity = request_data.get('quantity')
    transaction_type = request_data.get('transactionType')
    total_amount = request_data.get('totalAmount')
    asset_type = request_data.get('assetType', 'Stocks')
    portfolio_name = request_data.get('portfolioName')
    portfolio_asset_types = request_data.get('portfolioAssetTypes')

    print("portfolio_name: ", portfolio_name)

    print("portfolio_portfolio_asset_typesname: ", portfolio_asset_types)

    if not all([stock_symbol, quantity, transaction_type, total_amount]):
        return jsonify({"error": "Missing required transaction details"}), 400

    # Function to get current market price
    def get_current_market_price(symbol):
        ticker = yf.Ticker(symbol)
        hist = ticker.history(period="1d")
        if not hist.empty:
            return hist.tail(1)['Close'].iloc[0]
        else:
            return None


    portfolios_collection = mongo.db.portfolios
    user_portfolio_doc = portfolios_collection.find_one({"user_id": user_id, "portfolio_name": portfolio_name})

    portfolio_return_collection = mongo.db.portfolio_returns
    user_portfolio_returns_doc = portfolio_return_collection.find_one({"user_id": user_id, "portfolio_name": portfolio_name})

    initial_deposit = user_portfolio_doc.get('initial_deposit', -1)

    if initial_deposit == -1:
        return jsonify({"error": "Need to deposit money into Portfolio"}), 400

    account_balance = user_portfolio_doc.get('account_balance', 0)


    money_in_portfolio = user_portfolio_returns_doc.get('money_in_portfolio', [])
    last_money_in_portfolio = money_in_portfolio[-1]["amount"] if money_in_portfolio else 0
    weights = user_portfolio_returns_doc.get('portfolio_weights', [])

    print("weights: ", weights)
    print("total_amount: ", total_amount)
    print("transaction_type: ", transaction_type)


    def find_stock(symbol):
        for asset in weights:
            if asset['symbol'] == symbol:
                return asset
        return None

    if transaction_type == 'buy':
        print("account_balance: ", account_balance)
        print("total_amount: ", total_amount)
        if account_balance >= total_amount:
            account_balance -= total_amount
            new_money_in_portfolio = last_money_in_portfolio + total_amount
            print("new_money_in_portfolio: ", new_money_in_portfolio)
            money_in_portfolio.append({"date": datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S'), "amount": new_money_in_portfolio})
            create_transaction(mongo, user_id, portfolio_name, -total_amount, 'buy stocks')
            asset = find_stock(stock_symbol)
            print("asset: ", asset)
            if asset:
                asset['quantity'] += quantity  # Assuming 'quantity' temporarily represents weight
                asset['invested_cash'] += total_amount
            else:
                weights.append({
                    "symbol": stock_symbol, 
                    "name": stock_name,
                    "asset_type": asset_type, # need to change to portfolio_asset_types
                    "portfolio_asset_types": portfolio_asset_types,
                    "quantity": quantity,  # Temporary use of 'quantity'
                    "invested_cash": total_amount
                })
        else:
            return jsonify({"error": "Insufficient funds"}),
    elif transaction_type == 'sell':
        asset = find_stock(stock_symbol)
        if asset and asset['quantity'] >= quantity:
            sell_ratio = quantity / asset['quantity']
            cash_from_sale = asset['invested_cash'] * sell_ratio
            asset['quantity'] -= quantity
            asset['invested_cash'] -= cash_from_sale
            new_money_in_portfolio = last_money_in_portfolio - cash_from_sale
            account_balance += cash_from_sale
            money_in_portfolio.append({"date": datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S'), "amount": new_money_in_portfolio})
            create_transaction(mongo, user_id, portfolio_name, cash_from_sale, 'sell stocks')
            if asset['quantity'] == 0:
                weights.remove(asset)
        else:
            return jsonify({"error": "Insufficient stock quantity"}), 400


    user_portfolio_doc['weights'] = weights
    user_portfolio_returns_doc['portfolio_weights'] = weights

    # Calculate the current portfolio value
    current_portfolio_value = 0
    for asset in user_portfolio_doc['weights']:
        current_market_price = get_current_market_price(asset['symbol'])
        if current_market_price is not None:
            asset_value = current_market_price * asset['quantity']
            current_portfolio_value += asset_value

    # Update the latest value in portfolio value over time
    portfolio_value_over_time = user_portfolio_returns_doc.get('portfolio_value_over_time', [])
    if portfolio_value_over_time:
        # Update the value of the most recent entry
        print("yes inside now")
        portfolio_value_over_time[-1]['value'] = current_portfolio_value
    else:
        # If no entries, add the first entry
        print("not inside now")
        portfolio_value_over_time.append({"date": datetime.datetime.today().strftime('%Y-%m-%d'), "value": current_portfolio_value})
    # Update the document in the database
    portfolios_collection.update_one(
        {"user_id": user_id, "portfolio_name": portfolio_name},
        {"$set": {
            # "current_cash_value": current_cash, 
            "weights": weights,
            "initial_deposit": initial_deposit,
            "account_balance": account_balance
        }}
    )

    portfolio_return_collection.update_one(
        {"user_id": user_id, "portfolio_name": portfolio_name},
        {"$set": {
            # "current_cash_value": current_cash, 
            "portfolio_weights": weights,
            "money_in_portfolio": money_in_portfolio,
            "portfolio_value_over_time": portfolio_value_over_time,  # Assuming this field is updated elsewhere
            "profit_or_loss": current_portfolio_value - new_money_in_portfolio  # Assuming 'current_portfolio_value' is calculated elsewhere
        }}
    )

    return jsonify({"success": True, "weights": weights})

def calculate_rsi(data, window=14):
    delta = data.diff(1)
    gain = (delta.where(delta > 0, 0)).rolling(window=window).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=window).mean()

    rs = gain / loss
    rsi = 100 - (100 / (1 + rs))
    return rsi

@app.route('/get_stock_details', methods=['GET'])
def get_stock_details():
    symbol = request.args.get('symbol', '').strip().upper()
    name = request.args.get('name', '').strip().upper()
    print("name: ", name)
    if not symbol:
        return jsonify({"error": "No symbol provided"}), 400

    try:
        ticker = yf.Ticker(symbol)
        # Fetch historical data for the last 60 days to calculate indicators
        hist = ticker.history(period="60d")

        if not hist.empty:
            last_quote = hist.tail(1)['Close'].iloc[0]
            prev_close = hist.iloc[-2]['Close']

            # Calculate technical indicators
            hist['SMA_20'] = hist['Close'].rolling(window=20).mean()
            # hist['RSI'] = hist['Close'].rolling(window=14).apply(lambda x: pd.Series(x).pct_change().add(1).cumprod().iloc[-1])
            hist['RSI'] = calculate_rsi(hist['Close'], window=14)
            # Assume calculate_macd is a defined function
            hist = calculate_macd(hist)

            moving_average = hist.iloc[-1]['SMA_20']
            rsi = hist.iloc[-1]['RSI']
            macd = hist.iloc[-1]['MACD']
            macd_signal = hist.iloc[-1]['MACD_Signal']

            # Query MongoDB for the stock's portfolio_asset_types
            stock_doc = mongo.db.stocks.find_one({"symbol": symbol}, {"portfolio_asset_types": 1})

            # print("stock_doc: ", stock_doc)

            stock_info = {
                "symbol": symbol,
                "name": name,
                "price": round(last_quote, 2),
                "dailyChange": round((last_quote - prev_close) / prev_close * 100, 2),
                "movingAverage": round(moving_average, 2),
                "rsi": round(rsi, 2), # Ensure RSI value is not empty
                "macd": round(macd, 2),
                "macdSignal": round(macd_signal, 2),
                "portfolioAssetTypes": stock_doc['portfolio_asset_types'] if stock_doc else None
            }

            print("stock_info: ", stock_info)
            return jsonify(stock_info)
    except Exception as e:
        print(f"Error retrieving data for {symbol}: {e}")
        return jsonify({"error": f"Failed to retrieve data for {symbol}"}), 500



@app.route('/search_stocks', methods=['GET'])
def search_stocks():
    query = request.args.get('query', '').strip()
    asset_class_filter = request.args.get('asset_class', '').strip()

    search_conditions = {}

    # Check if query is provided and add regex search conditions
    if query:
        regex_query = {'$regex': '^' +query, '$options': 'i'}  # Case-insensitive search
        search_conditions['$or'] = [
            {'symbol': regex_query},
            {'name': regex_query}
        ]

    # Check if asset class filter is provided and it's not 'Any'
    if asset_class_filter and asset_class_filter.lower() != 'any':
        asset_classes_list = asset_class_filter.split(',')
        search_conditions['portfolio_asset_types'] = {'$in': asset_classes_list}

    # If neither query nor asset_class_filter is provided, return an error
    if not query and not asset_class_filter:
        return jsonify({"error": "No search query or asset class provided"}), 400

    try:
        search_results = mongo.db.stocks.find(search_conditions)

        # Convert the search results into a list of dictionaries
        stocks = [{
            'symbol': stock.get('symbol', ''),
            'name': stock.get('name', ''),
            'type': stock.get('type', ''),
            'portfolio_asset_types': stock.get('portfolio_asset_types', ['Unknown'])
        } for stock in search_results]

        # print("stocks: ", stocks)

        return jsonify(stocks)
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": "Failed to search stock information", "details": str(e)}), 500
    
@app.route('/get_user_portfolios', methods=['GET'])
def get_user_portfolios():
    token = get_token_from_header()
    try:
        data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token has expired"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"error": "Invalid token"}), 401

    user_id = data['user_id']

    portfolio_collection = mongo.db.portfolios
    user_portfolios = portfolio_collection.find(
        {"user_id": user_id}
    )

    # Convert the cursor to a list of dicts
    portfolios_list = list(user_portfolios)

    # Remove the MongoDB '_id' as it is not JSON serializable
    for portfolio in portfolios_list:
        portfolio.pop('_id', None)

    return jsonify(portfolios_list), 200


@app.route('/get_user_portfolios_not_auto', methods=['GET'])
def get_user_portfolios_not_auto():
    token = get_token_from_header()
    try:
        data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token has expired"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"error": "Invalid token"}), 401

    user_id = data['user_id']

    portfolio_collection = mongo.db.portfolios
    user_portfolios = portfolio_collection.find(
        {"user_id": user_id, "portfolio_name": {"$ne": "automated"}}
    )

    # Convert the cursor to a list of dicts
    portfolios_list = list(user_portfolios)

    # Remove the MongoDB '_id' as it is not JSON serializable
    for portfolio in portfolios_list:
        portfolio.pop('_id', None)

    return jsonify(portfolios_list), 200

@app.route('/delete_portfolio', methods=['DELETE'])
def delete_portfolio():
    token = get_token_from_header()
    try:
        data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token has expired"}), 401

    user_id = data['user_id']
    portfolio_name = request.json.get('portfolioName')

    # Deleting from the 'portfolios' collection
    mongo.db.portfolios.delete_one({"user_id": user_id, "portfolio_name": portfolio_name})

    # Deleting from the 'portfolio_returns' collection
    mongo.db.portfolio_returns.delete_many({"user_id": user_id, "portfolio_name": portfolio_name})

    # Deleting from the 'template_chat' collection
    mongo.db.template_chat.delete_many({"user_id": user_id, "portfolio_name": portfolio_name})

    return jsonify({"message": "Portfolio and related data deleted successfully"}), 200

@app.route('/check_portfolio_name', methods=['POST'])
def check_portfolio_name():
    token = get_token_from_header()
    try:
        data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token has expired"}), 401

    user_id = data['user_id']
    portfolio_name = request.json.get('portfolioName')

    portfolio_collection = mongo.db.portfolios
    existing_portfolio = portfolio_collection.find_one({"user_id": user_id, "portfolio_name": portfolio_name})

    if existing_portfolio:
        return jsonify({"isUnique": False})
    else:
        return jsonify({"isUnique": True})

@app.route('/create_new_portfolio', methods=['POST'])
def create_new_portfolio():
    token = get_token_from_header()
    try:
        data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token has expired"}), 401

    user_id = data['user_id']
    portfolio_name = request.json.get('portfolioName')

    # Check if portfolio already exists
    portfolio_collection = mongo.db.portfolios
    existing_portfolio = portfolio_collection.find_one({"user_id": user_id, "portfolio_name": portfolio_name})

    if existing_portfolio:
        return jsonify({"error": "Portfolio already exists"}), 409

    # Create a new portfolio with empty weights
    new_portfolio = {
        "user_id": user_id,
        "date_updated": datetime.datetime.now(),
        "portfolio_name": portfolio_name,
        "template": "no template",
        "summary": "no summary",
        "initial_deposit": -1.0,
        "account_balance": 0.0,
        "weights": []
    }

    portfolio_collection.insert_one(new_portfolio)

    portfolio_return_collection = mongo.db.portfolio_returns

    new_portfolio_returns = {
        "user_id": user_id,
        "date": datetime.datetime.now(),
        "portfolio_name": portfolio_name,
        "portfolio_return": None,
        "portfolio_stddev": None,
        "sharpe_ratio": None,
        "money_in_portfolio": [],
        "portfolio_weights": [],
        "portfolio_hist_return": [],
        "portfolio_value_over_time": [],
        "current_portfolio_value": None,
        "profit_or_loss": None
    }

    portfolio_return_collection.insert_one(new_portfolio_returns)

    return jsonify({"message": "Portfolio created successfully"}), 201

def update_template_chat(mongo, user_id, portfolio_name, chat_messages):
    template_chat_collection = mongo.db.template_chat
    
    # Retrieve the existing document for the user and portfolio
    existing_doc = template_chat_collection.find_one({"user_id": user_id, "portfolio_name": portfolio_name})

    if existing_doc:
        # Append new messages to the existing 'chat_messages' array
        updated_chat_messages = existing_doc['chat_messages'] + chat_messages
        template_chat_collection.update_one(
            {"_id": existing_doc['_id']},
            {"$set": {"chat_messages": updated_chat_messages}}
        )
    else:
        # If no existing document, create a new one
        template_chat_doc = {
            "user_id": user_id,
            "portfolio_name": portfolio_name,
            "chat_messages": chat_messages
        }
        template_chat_collection.insert_one(template_chat_doc)



@app.route('/gettemplate1', methods=['POST'])
def gettemplate1():
    token = get_token_from_header()
    try:
        data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token has expired"}), 401

    user_id = data['user_id']
    print(user_id)

    if 'conversation_history' not in session:
        session['conversation_history'] = []

    user_message = request.json.get('prompt')
    portfolio_name = request.json.get('portfolioName')
    timestamp = datetime.datetime.now()

    # Retrieve past conversation history from MongoDB
    past_conversation = get_past_conversation(mongo, user_id, portfolio_name)

    formatted_past_conversation = [
        {"role": "user", "content": msg["user"]} for msg in past_conversation if "user" in msg
    ] + [
        {"role": "assistant", "content": msg["assistant"]} for msg in past_conversation if "assistant" in msg
    ]

    print("formatted_past_conversation: ", formatted_past_conversation)

    # Add user message with timestamp
    session['conversation_history'].append({"date": timestamp, "user": user_message})


    portfolio_options_string = "\n".join(
    [f"- {name}: {info['description']} More info: {info['url']}" 
     for name, info in PORTFOLIO_DESCRIPTION.items()]
    )

    system_message = (
    "You are a financial advisor AI designed to help users choose the best investment portfolio "
    "from a predefined list based on their preferences, risk tolerance, and investment goals. "
    "Your task is to analyze the user's investment preferences "
    "based on the past conversation. Engage with the user to gather any additional information "
    "you might need." + "\n\nPast conversation for reference: \n" + str(formatted_past_conversation) +
    "\n\nOnce you have sufficient information, recommend one of the following portfolios: "
    f"\n{portfolio_options_string}"
    "\n\nProvide a brief 'Summary' section highlighting key user preferences like risk tolerance, "
    "investment goals (e.g., income generation, capital growth), time frame, and any specific interests. "
    "Then, make your portfolio recommendation based on this summary, without needing to specify asset allocation percentages."
    "\n Please make sure to strictly follow the below template and dont give any additional explanations. "
    "\n\nExample of Final Response:\n"
    "Summary:\n"
    "- Risk Tolerance: Medium\n"
    "- Investment Goals: Capital Growth\n"
    "- Time Frame: 10 years\n"
    "- Specific Interests: International Markets\n\n"
    "Asset Allocation:\n"
    "Core Four Portfolio"
    )

    print("system_message: " , system_message)

    response = openai.ChatCompletion.create(
        model="gpt-4-0613",
        messages=[
            {"role": "system", "content": system_message},
            {"role": "user", "content": user_message}
        ]
    )

    ai_response = response.choices[0].message['content'] if response.choices else "I am not sure how to respond to that."

    # Add assistant message with the same timestamp
    session['conversation_history'].append({"date": timestamp, "assistant": ai_response})

    # Call the function to update the MongoDB document
    update_template_chat(
        mongo,
        user_id,
        portfolio_name,
        session['conversation_history']
    )

    print("ai_response: ", ai_response)


    # Check if the AI response is in the desired final format
    if is_final_response_format(ai_response):
        # Extract summary and asset allocation from ai_response
        summary, asset_allocation = extract_summary_and_allocation(ai_response)

        print("summary: ", summary)
        print("asset_allocation: ", asset_allocation)
        portfolio_description = PORTFOLIO_DESCRIPTION.get(asset_allocation, {"description": "Portfolio description not found", "url": "#"})
        portfolio_description["name"] = asset_allocation
        print("portfolio_description: ", portfolio_description)

        portfolio_value = PORTFOLIO_ALLOCATIONS.get(asset_allocation, "Portfolio not found")

        print("portfolio_value: ", portfolio_value)

        # Fetch the portfolio document or create a new one
        portfolio_collection = mongo.db.portfolios
        portfolio_doc = portfolio_collection.find_one(
            {"user_id": user_id, "portfolio_name": portfolio_name}
        )

        if portfolio_doc:
            # Update the existing document
            portfolio_collection.update_one(
                {"user_id": user_id, "portfolio_name": portfolio_name},
                {"$set": {
                    "summary": summary, 
                    "template": portfolio_value,
                    "portfolio_description": {
                    "name": asset_allocation,
                    "description": portfolio_description['description'],
                    "url": portfolio_description['url']
                    }
                }}
            )
        else:
            # Create a new document
            portfolio_collection.insert_one({
                "user_id": user_id,
                "date_updated": datetime.datetime.now(),
                "portfolio_name": portfolio_name,
                "template": portfolio_value,
                "summary": summary,
                "initial_deposit": -1.0,
                "account_balance": 0.0,
                "weights": [],
                "portfolio_description": {
                    "name": asset_allocation,
                    "description": portfolio_description['description'],
                    "url": portfolio_description['url']
                }
            })

            portfolio_return_collection = mongo.db.portfolio_returns

            new_portfolio_returns = {
                "user_id": user_id,
                "date": datetime.datetime.now(),
                "portfolio_name": portfolio_name,
                "portfolio_return": None,
                "portfolio_stddev": None,
                "sharpe_ratio": None,
                "money_in_portfolio": [],
                "portfolio_weights": [],
                "portfolio_hist_return": [],
                "portfolio_value_over_time": [],
                "current_portfolio_value": None,
                "profit_or_loss": None
            }

            portfolio_return_collection.insert_one(new_portfolio_returns)

        response_data = {
        "message": "finished",
        "asset_allocation": portfolio_value,  # Include the asset allocation data
        "portfolio_description": portfolio_description
        }
        return jsonify(response_data)
    else:
        return jsonify(ai_response)
    


@app.route('/gettemplate', methods=['POST'])
def gettemplate():
    token = get_token_from_header()
    try:
        data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token has expired"}), 401

    user_id = data['user_id']
    print(user_id)

    if 'conversation_history' not in session:
        session['conversation_history'] = []

    user_message = request.json.get('prompt')
    portfolio_name = request.json.get('portfolioName')
    timestamp = datetime.datetime.now()

    # Retrieve past conversation history from MongoDB
    past_conversation = get_past_conversation(mongo, user_id, portfolio_name)

    formatted_past_conversation = [
        {"role": "user", "content": msg["user"]} for msg in past_conversation if "user" in msg
    ] + [
        {"role": "assistant", "content": msg["assistant"]} for msg in past_conversation if "assistant" in msg
    ]

    print("formatted_past_conversation: ", formatted_past_conversation)

    # Add user message with timestamp
    session['conversation_history'].append({"date": timestamp, "user": user_message})

    system_message = (
    "You are a financial advisor AI. Your task is to analyze the user's investment preferences "
    "based on the past conversation. Engage with the user to gather any additional information "
    "you might need." + "\n\nPast conversation for reference: \n" + str(formatted_past_conversation) +
    "\nOnce you have sufficient information to make an informed suggestion, "
    "first provide a brief 'Summary' section highlighting key preferences of the user, such as risk tolerance, "
    "investment goals (e.g., income generation, capital growth), time frame, and specific interests like ESG investments."
    "\nThen, respond with the user's portfolio allocation in a dictionary format. "
    "The asset classes to choose from are 'Stocks', 'Bonds', 'Cash and Cash Equivalents', 'Real Estate', and 'Commodities'. "
    "\n\nIMPORTANT: Your final response should start with the 'Summary' and then only include the dictionary of asset classes and percentages, without any additional explanation or details. "
    "For example, your final response should be exactly in this format: "
    "\n\nExample of Final Response:\n"
    "Summary:\n"
    "- Risk Tolerance: Low\n"
    "- Investment Goals: Income Generation\n"
    "- Time Frame: 5 years\n"
    "- Specific Interests: ESG Investments\n"
    "- Other special requirements: Would like Crypto\n\n"
    "Asset Allocation:\n"
    "{" + "\n"
    "    'Asset Class 1': 'Percentage 1',\n"
    "    'Asset Class 2': 'Percentage 2',\n"
    "    'Asset Class 3': 'Percentage 3'\n"
    "}"
    )

    print("system_message: " , system_message)

    response = openai.ChatCompletion.create(
        model="gpt-4-0613",
        messages=[
            {"role": "system", "content": system_message},
            {"role": "user", "content": user_message}
        ]
    )

    ai_response = response.choices[0].message['content'] if response.choices else "I am not sure how to respond to that."

    # Add assistant message with the same timestamp
    session['conversation_history'].append({"date": timestamp, "assistant": ai_response})

    # Call the function to update the MongoDB document
    update_template_chat(
        mongo,
        user_id,
        portfolio_name,
        session['conversation_history']
    )

    print("ai_response: ", ai_response)


    # Check if the AI response is in the desired final format
    if is_final_response_format(ai_response):
        # Extract summary and asset allocation from ai_response
        summary, asset_allocation = extract_summary_and_allocation(ai_response)

        print("summary: ", summary)
        print("asset_allocation: ", asset_allocation)

        # Fetch the portfolio document or create a new one
        portfolio_collection = mongo.db.portfolios
        portfolio_doc = portfolio_collection.find_one(
            {"user_id": user_id, "portfolio_name": portfolio_name}
        )

        if portfolio_doc:
            # Update the existing document
            portfolio_collection.update_one(
                {"user_id": user_id, "portfolio_name": portfolio_name},
                {"$set": {"summary": summary, "template": asset_allocation}}
            )
        else:
            # Create a new document
            portfolio_collection.insert_one({
                "user_id": user_id,
                "date_updated": datetime.datetime.now(),
                "portfolio_name": portfolio_name,
                "template": asset_allocation,
                "summary": summary,
                "initial_deposit": -1.0,
                "account_balance": 0.0,
                "weights": {}
            })

            portfolio_return_collection = mongo.db.portfolio_returns

            new_portfolio_returns = {
                "user_id": user_id,
                "date": datetime.datetime.now(),
                "portfolio_name": portfolio_name,
                "portfolio_return": None,
                "portfolio_stddev": None,
                "sharpe_ratio": None,
                "money_in_portfolio": [],
                "portfolio_weights": [],
                "portfolio_hist_return": [],
                "portfolio_value_over_time": [],
                "current_portfolio_value": None,
                "profit_or_loss": None
            }

            portfolio_return_collection.insert_one(new_portfolio_returns)

        response_data = {
        "message": "finished",
        "asset_allocation": asset_allocation  # Include the asset allocation data
        }
        return jsonify(response_data)
    else:
        return jsonify(ai_response)



    # return jsonify(ai_response)


def extract_summary_and_allocation(response):
    # Assuming the response is a string containing 'Summary:\n' followed by the summary
    # and 'Asset Allocation:\n' followed by the asset allocation in dictionary format.

    # Split the response into parts
    parts = response.split("\n\n")

    # Initialize summary and asset allocation
    summary = ""
    asset_allocation = ""

    # Extract summary
    for part in parts:
        print("part: ", part)
        if part.startswith("Summary:"):
            summary = part.split("\n", 1)[1]  # Get everything after "Summary:\n"

        if part.startswith("Asset Allocation:"):
            print("part_asset: ", part)
            # Extracting the asset allocation dictionary as a string
            asset_allocation = part.split("\n", 1)[1]

    return summary, asset_allocation

def is_final_response_format(response):
    
    # Attempt to parse the response
    print("response_data: ", response)

    # Check for the existence of 'Summary' and 'Asset Allocation'
    if 'Summary' in response and 'Asset Allocation' in response:
        # Further checks can be added here to validate the format
        return True
    else:
        # If response is not a valid JSON, it's not in the final format
        return False

    return False


def get_past_conversation(mongo, user_id, portfolio_name):
    # Retrieve the document from MongoDB
    template_chat_doc = mongo.db.template_chat.find_one({"user_id": user_id, "portfolio_name": portfolio_name})
    return template_chat_doc['chat_messages'] if template_chat_doc else []

@app.route('/chatgpt_advice_stage_3', methods=['POST'])
def chatgpt_advice_stage_3():
    token = get_token_from_header()
    try:
        data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token has expired"}), 401

    user_id = data['user_id']
    paper_trading_portfolio_name = request.json.get('paperTradingPortfolioName')
    paper_trading_template_name = request.json.get('paperTradingTemplateName')
    all_stocks_data = request.json.get('allStocksData', [])
    current_asset_class_percentages = request.json.get('currentAssetClassPercentages', [])
    expected_portfolio_std_dev_range = request.json.get('expectedStdDevRange', 0)
    expected_cagr_range = request.json.get('expectedCAGRRange', 0)

    print("expected_portfolio_std_dev_range: ", expected_portfolio_std_dev_range)
    print("expected_cagr_range: ", expected_cagr_range)

    # Get the target risk profile percentages
    target_profile = RISK_PROFILES.get(paper_trading_template_name, "")
    print("target_profile: ", target_profile)

    # Format the current asset class percentages for the message
    current_asset_class_percentages_str = ', '.join([f"{asset_class}: {percentage}%" for asset_class, percentage in current_asset_class_percentages.items()])
    print("current_asset_class_percentages_str: ", current_asset_class_percentages_str)

    print("all_stocks_data: ", all_stocks_data)

    stocks_info_str = ', '.join([
        f"{stock['symbol']} (Asset Classes: {stock['portfolioAssetTypes']}, Price: ${stock['price']}, Daily Change: {stock['dailyChange']}%, "
        f"Moving Average: ${stock['movingAverage']}, RSI: {stock['rsi']}, "
        f"MACD: {stock['macd']}, MACD Signal: {stock['macdSignal']})"
        for stock in all_stocks_data
    ])
    print("stocks_info_str: ", stocks_info_str)

    # Fetch all user actions from the database
    user_actions_collection = mongo.db.user_paper_trading_actions
    user_actions_doc = user_actions_collection.find_one(
        {"user_id": user_id, "paper_trading_portfolio_name": paper_trading_portfolio_name, "paper_trading_template_name": paper_trading_template_name}
    )

    if user_actions_doc:
        user_actions = user_actions_doc['user_actions']
    else:
        user_actions = []
        # Create a new document if it does not exist
        user_actions_collection.insert_one({"user_id": user_id, "paper_trading_portfolio_name": paper_trading_portfolio_name, "paper_trading_template_name": paper_trading_template_name, "user_actions": user_actions})

    # Add the current action to the user_actions list
    current_action = request.json.get('userActions')
    current_action_entry = {"date": datetime.datetime.now(), "action": current_action}
    user_actions.append(current_action_entry)

    # Update the user_actions in the database
    user_actions_collection.update_one(
        {"user_id": user_id, "paper_trading_portfolio_name": paper_trading_portfolio_name, "paper_trading_template_name": paper_trading_template_name},
        {"$push": {"user_actions": current_action_entry}}
    )

    # Reverse the order of user actions so the latest comes first
    user_actions = user_actions[::-1]

    # Format all actions into a string for ChatGPT
    actions_str = ' '.join([f"On {action['date'].strftime('%Y-%m-%d %H:%M:%S')} user did: {action['action']}" for action in user_actions])

    print("actions: ", actions_str)


    # Fetch the user's current assets from the paper trading portfolio
    paper_trading_portfolio_collection = mongo.db.paper_trading_portfolio
    user_portfolio_doc = paper_trading_portfolio_collection.find_one(
        {"user_id": user_id, "portfolio_name": paper_trading_portfolio_name, "portfolio_template": paper_trading_template_name}
    )

    current_assets = user_portfolio_doc.get('current_assets', [])
    current_assets_str = ', '.join([f"{asset['symbol']} [Asset Classes: {asset['portfolio_asset_types']}] ({asset['quantity']} shares)" for asset in current_assets])

    # System prompt for ChatGPT
    system_prompt = (
        "You are an AI financial advisor. "
        "Provide suggestions and advice based on the user's paper stock trading actions, "
        "current asset allocation, and their target risk profile "
        "to help them align their portfolio accordingly."
        "Please give your answer as a html document while ensuring the color of the text is white except for h1 and h2 which is #0066cd "
        "Please ensure that the font size of h1 is always 1em and bold, font size of h2 is 0.9em and bold and font size of p is 0.9em and not bold and the rest is 0.8em and not bold. "
        "Add some margin on top for all h1 and h2. "
        "Again please ensure all the font sizes for h1, h2 and p are correct. "
    )

    # Generate the message for ChatGPT based on user actions, stock data, and risk profile
    user_message = (
        f"The user's actions in the stock trading app include: {actions_str}. "
        f"Their current asset allocation is: {current_asset_class_percentages_str}. "
        f"The user's target risk profile is '{paper_trading_template_name}', which suggests an allocation of {target_profile}. "
        f"What advice would you offer to help the user achieve this target allocation? "
        f"Based on these actions, current market trends, and the target risk profile, "
        f"which one or two stocks from the following list would you recommend buying or selling and why? "
        f"Stocks: {stocks_info_str}. "
        f"For your reference, the user currently holds the following stocks: {current_assets_str}."
    )

    print("user_message: ", user_message)

    diversification_score = get_diversification_score_from_chatgpt(paper_trading_template_name, target_profile, current_asset_class_percentages_str, stocks_info_str)

    print("diversification_score: ", diversification_score)

    # Check if the user_portfolio_doc exists
    if user_portfolio_doc:
        # Update or insert the diversification_score field
        paper_trading_portfolio_collection.update_one(
            {"user_id": user_id, "portfolio_name": paper_trading_portfolio_name, "portfolio_template": paper_trading_template_name},
            {"$set": {"diversification_score": diversification_score}},
            upsert=True  # This ensures that if the document doesn't exist, it will be inserted
        )

    response = openai.ChatCompletion.create(
        model="gpt-3.5-turbo-1106",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message}
        ]
    )
    return jsonify({"advice": response.choices[0].message['content']})

def get_diversification_score_from_chatgpt(paper_trading_template_name, target_profile, current_asset_class_percentages_str, stocks_info_str):
    # System prompt for ChatGPT
    system_prompt = (
        "You are an AI financial advisor. Calculate a diversification score out of 10 for the user's portfolio. "
        "Consider how closely the portfolio aligns with the target profile template, sector diversity, "
        "and geographical diversity of the stocks in the portfolio. Please make sure to only respond with the diversification score."
        "\n\nExample of Final Response:\n"
        "5"
    )


    # Prepare the message for ChatGPT
    user_message = (
        f"The user's target risk profile is '{paper_trading_template_name}', which suggests an allocation of {target_profile}. "
        f"Their current asset allocation is: {current_asset_class_percentages_str}. "
        f"The user's portfolio consists of the following stocks and their details: "
        f"{stocks_info_str}"
        f"Based on this information, calculate the diversification score of the user's portfolio out of 10, "
        f"taking into account alignment with the target profile, sector diversity, and geographical diversity."
    )

    response = openai.ChatCompletion.create(
        model="gpt-3.5-turbo-1106",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message}
        ]
    )

    # Extract and return the diversification score from ChatGPT's response
    score = response.choices[0].message['content']
    print("Diversification advice: ", score)
    return score

@app.route('/get_stock_data_stage_3', methods=['GET'])
def get_stock_data_stage_3():
    stock_data = []

    for asset_class, stocks in STOCKS_STAGE_3.items():
        for stock_name, symbol in stocks.items():
            try:
                ticker = yf.Ticker(symbol)
                # Fetch historical data for the last 60 days to calculate indicators
                hist = ticker.history(period="60d")

                if not hist.empty:
                    last_quote = hist.tail(1)['Close'].iloc[0]
                    prev_close = hist.iloc[-2]['Close']

                    # Calculate technical indicators
                    hist['SMA_20'] = hist['Close'].rolling(window=20).mean()
                    # hist['RSI'] = hist['Close'].rolling(window=14).apply(lambda x: pd.Series(x).pct_change().add(1).cumprod().iloc[-1])
                    hist['RSI'] = calculate_rsi(hist['Close'], window=14)
                    hist = calculate_macd(hist)

                    moving_average = hist.iloc[-1]['SMA_20']
                    rsi = hist.iloc[-1]['RSI']
                    macd = hist.iloc[-1]['MACD']
                    macd_signal = hist.iloc[-1]['MACD_Signal']

                    # Query MongoDB for the stock's portfolio_asset_types
                    stock_doc = mongo.db.stocks.find_one({"symbol": symbol}, {"portfolio_asset_types": 1, "name": 1})

                    print("stock_doc: ", stock_doc)

                    stock_info = {
                        "assetClass": asset_class,
                        "symbol": symbol,
                        "name": stock_doc['name'],
                        "price": round(last_quote, 2),
                        "dailyChange": round((last_quote - prev_close) / prev_close * 100, 2),
                        "movingAverage": round(moving_average, 2),
                        "rsi": round(rsi, 2), # Ensure RSI value is not empty
                        "macd": round(macd, 2),
                        "macdSignal": round(macd_signal, 2),
                        "portfolioAssetTypes": stock_doc['portfolio_asset_types'] if stock_doc else None
                    }
                    stock_data.append(stock_info)
            except Exception as e:
                print(f"Error retrieving data for {stock_name} ({symbol}): {e}")

    return jsonify(stock_data)

@app.route('/chatgpt_advice_stage_2', methods=['POST'])
def chatgpt_advice_stage_2():
    token = get_token_from_header()
    try:
        data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token has expired"}), 401

    user_id = data['user_id']
    paper_trading_portfolio_name = request.json.get('paperTradingPortfolioName')
    paper_trading_template_name = request.json.get('paperTradingTemplateName')
    all_stocks_data = request.json.get('allStocksData', [])

    stocks_info_str = ', '.join([
        f"{stock['symbol']} (Price: ${stock['price']}, Daily Change: {stock['dailyChange']}%, "
        f"Moving Average: ${stock['movingAverage']}, RSI: {stock['rsi']}, "
        f"MACD: {stock['macd']}, MACD Signal: {stock['macdSignal']})"
        for stock in all_stocks_data
    ])
    print("stocks_info_str: ", stocks_info_str)

    # Fetch all user actions from the database
    user_actions_collection = mongo.db.user_paper_trading_actions
    user_actions_doc = user_actions_collection.find_one(
        {"user_id": user_id, "paper_trading_portfolio_name": paper_trading_portfolio_name, "paper_trading_template_name": paper_trading_template_name}
    )

    if user_actions_doc:
        user_actions = user_actions_doc['user_actions']
    else:
        user_actions = []
        # Create a new document if it does not exist
        user_actions_collection.insert_one({"user_id": user_id, "paper_trading_portfolio_name": paper_trading_portfolio_name, "paper_trading_template_name": paper_trading_template_name, "user_actions": user_actions})

    # Add the current action to the user_actions list
    current_action = request.json.get('userActions')
    current_action_entry = {"date": datetime.datetime.now(), "action": current_action}
    user_actions.append(current_action_entry)

    # Update the user_actions in the database
    user_actions_collection.update_one(
        {"user_id": user_id, "paper_trading_portfolio_name": paper_trading_portfolio_name, "paper_trading_template_name": paper_trading_template_name},
        {"$push": {"user_actions": current_action_entry}}
    )

    # Reverse the order of user actions so the latest comes first
    user_actions = user_actions[::-1]

    # Format all actions into a string for ChatGPT
    actions_str = ' '.join([f"On {action['date'].strftime('%Y-%m-%d %H:%M:%S')} user did: {action['action']}" for action in user_actions])

    print("actions: ", actions_str)


    # Fetch the user's current assets from the paper trading portfolio
    paper_trading_portfolio_collection = mongo.db.paper_trading_portfolio
    user_portfolio_doc = paper_trading_portfolio_collection.find_one(
        {"user_id": user_id, "portfolio_name": paper_trading_portfolio_name, "portfolio_template": paper_trading_template_name}
    )

    current_assets = user_portfolio_doc.get('current_assets', [])
    current_assets_str = ', '.join([f"{asset['symbol']} ({asset['quantity']} shares)" for asset in current_assets])

    # System prompt for ChatGPT
    system_prompt = (
        "You are an AI financial advisor. "
        "Provide suggestions and advice based on the user's paper stock trading actions "
        "to help them make better investment decisions."
    )

    # Generate the message for ChatGPT based on user actions and stock data
    user_message = (
        f"The user's actions in the stock trading app include: {actions_str}. "
        f"What advice would you offer? Based on these actions and the current market trends, "
        f"which one or two stocks from the following list would you recommend buying or selling and why? "
        f"Stocks: {stocks_info_str}. "
        f"For your reference, the user currently holds the following stocks: {current_assets_str}. "
    )

    print("user_message: ", user_message)

    response = openai.ChatCompletion.create(
        model="gpt-3.5-turbo-1106",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message}
        ]
    )
    return jsonify({"advice": response.choices[0].message['content']})

@app.route('/get_news/<stockSymbol>', methods=['GET'])
def get_news(stockSymbol):
    news_items = get_daily_news(stockSymbol, finnhub_client)
    return jsonify(news_items)


def format_recommendation(raw_recommendation):
    # Define section headers to look for
    sections = {
        "Positive Developments": [],
        "Potential Concerns": [],
        "Prediction & Analysis": []
    }

    # Current section holder
    current_section = None

    # Iterate over each line and categorize into sections
    for line in raw_recommendation.split('\n'):
        # Check if the line is a section header
        if any(header in line for header in sections.keys()):
            current_section = line.replace(":", "").replace("[", "").replace("]", "")
        # If it's not a header and we're in a section, add the line to that section
        elif current_section and line.strip():
            sections[current_section].append(line.strip())

    return sections

@app.route('/get_recommendation/<stockSymbol>', methods=['GET'])
def get_recommendation(stockSymbol):
    raw_recommendation = predict(stockSymbol, 3, False)
    print("raw_recommendation: ", raw_recommendation)

    formatted_sections = format_recommendation(raw_recommendation)

    print("formatted_sections: ", formatted_sections)


    return jsonify(formatted_sections)
    # return formatted_sections

@app.route('/get_technical_analysis/<stockSymbol>', methods=['GET'])
def get_technical_analysis(stockSymbol):
    today = datetime.datetime.today()
    last_month = today - timedelta(days=30)
    data = yf.download(stockSymbol, start=last_month.strftime('%Y-%m-%d'), end=today.strftime('%Y-%m-%d'))
    df = data
    df = detect_head_shoulder(df)
    df['head_shoulder_pattern'] = df['head_shoulder_pattern'].fillna(0)
    df.reset_index(inplace=True)  # Reset the index to convert the Date index into a column
    df['Date'] = df['Date'].dt.strftime('%Y-%m-%d')  # Format the Date column to a string that can be JSON serialized
    # result = df.to_dict(orient='records')
    # Create a list of dictionaries with only 'Date' and 'Close' for each row in the DataFrame
    result = [{'Date': row['Date'], 'Close': round(row['Close'], 2), 'head_shoulder_pattern': row['head_shoulder_pattern']} for _, row in df.iterrows()]
    print(result)
    print(type(result))
    return jsonify(result)
    # return result


@app.route('/get_technical2_analysis/<stockSymbol>', methods=['GET'])
def get_technical2_analysis(stockSymbol):
    today = datetime.datetime.today()
    last_month = today - timedelta(days=30)
    data = yf.download(stockSymbol, start=last_month.strftime('%Y-%m-%d'), end=today.strftime('%Y-%m-%d'))
    df = data
    df = detect_triangle_pattern(df)
    df['triangle_pattern'] = df['triangle_pattern'].fillna(0)
    df.reset_index(inplace=True)  # Reset the index to convert the Date index into a column
    df['Date'] = df['Date'].dt.strftime('%Y-%m-%d')  # Format the Date column to a string that can be JSON serialized
    # result = df.to_dict(orient='records')
    # Create a list of dictionaries with only 'Date' and 'Close' for each row in the DataFrame
    result = [{'Date': row['Date'], 'Close': round(row['Close'], 2), 'triangle_pattern': row['triangle_pattern']} for _, row in df.iterrows()]
    print(result)
    print(type(result))
    return jsonify(result)
    # return result


@app.route('/get_technical3_analysis/<stockSymbol>', methods=['GET'])
def get_technical3_analysis(stockSymbol):
    today = datetime.datetime.today()
    last_month = today - timedelta(days=30)
    data = yf.download(stockSymbol, start=last_month.strftime('%Y-%m-%d'), end=today.strftime('%Y-%m-%d'))
    df = data
    df = detect_wedge(df)
    df['wedge_pattern'] = df['wedge_pattern'].fillna(0)
    df.reset_index(inplace=True)  # Reset the index to convert the Date index into a column
    df['Date'] = df['Date'].dt.strftime('%Y-%m-%d')  # Format the Date column to a string that can be JSON serialized
    # result = df.to_dict(orient='records')
    # Create a list of dictionaries with only 'Date' and 'Close' for each row in the DataFrame
    result = [{'Date': row['Date'], 'Close': round(row['Close'], 2), 'wedge_pattern': row['wedge_pattern']} for _, row in df.iterrows()]
    print(result)
    print(type(result))
    return jsonify(result)
    # return result

@app.route('/get_technical4_analysis/<stockSymbol>', methods=['GET'])
def get_technical4_analysis(stockSymbol):
    today = datetime.datetime.today()
    last_month = today - timedelta(days=30)
    data = yf.download(stockSymbol, start=last_month.strftime('%Y-%m-%d'), end=today.strftime('%Y-%m-%d'))
    df = data
    df = detect_channel(df)
    df['channel_pattern'] = df['channel_pattern'].fillna(0)
    df.reset_index(inplace=True)  # Reset the index to convert the Date index into a column
    df['Date'] = df['Date'].dt.strftime('%Y-%m-%d')  # Format the Date column to a string that can be JSON serialized
    # result = df.to_dict(orient='records')
    # Create a list of dictionaries with only 'Date' and 'Close' for each row in the DataFrame
    result = [{'Date': row['Date'], 'Close': round(row['Close'], 2), 'channel_pattern': row['channel_pattern']} for _, row in df.iterrows()]
    print(result)
    print(type(result))
    return jsonify(result)

@app.route('/get_technical5_analysis/<stockSymbol>', methods=['GET'])
def get_technical5_analysis(stockSymbol):
    today = datetime.datetime.today()
    last_month = today - timedelta(days=30)
    data = yf.download(stockSymbol, start=last_month.strftime('%Y-%m-%d'), end=today.strftime('%Y-%m-%d'))
    df = data
    df = detect_double_top_bottom(df)
    df['double_pattern'] = df['double_pattern'].fillna(0)
    df.reset_index(inplace=True)  # Reset the index to convert the Date index into a column
    df['Date'] = df['Date'].dt.strftime('%Y-%m-%d')  # Format the Date column to a string that can be JSON serialized
    # result = df.to_dict(orient='records')
    # Create a list of dictionaries with only 'Date' and 'Close' for each row in the DataFrame
    result = [{'Date': row['Date'], 'Close': round(row['Close'], 2), 'double_pattern': row['double_pattern']} for _, row in df.iterrows()]
    print(result)
    print(type(result))
    return jsonify(result)


def calculate_macd(df, fast_period=12, slow_period=26, signal_period=9):
    df['EMA_fast'] = df['Close'].ewm(span=fast_period, adjust=False).mean()
    df['EMA_slow'] = df['Close'].ewm(span=slow_period, adjust=False).mean()
    df['MACD'] = df['EMA_fast'] - df['EMA_slow']
    df['MACD_Signal'] = df['MACD'].ewm(span=signal_period, adjust=False).mean()
    return df

@app.route('/get_stock_data_stage_2', methods=['GET'])
def get_stock_data_stage_2():
    stock_data = []

    for stock_dict in STOCKS_STAGE_1_2:
        symbol = stock_dict['symbol']
        try:
            ticker = yf.Ticker(symbol)
            print("Symbol type", type(symbol))
            # Fetch historical data for the last 60 days to calculate indicators
            hist = ticker.history(period="60d")

            if not hist.empty:
                last_quote = hist.tail(1)['Close'].iloc[0]
                prev_close = hist.iloc[-2]['Close']

                # Calculate technical indicators
                hist['SMA_20'] = hist['Close'].rolling(window=20).mean()
                # hist['RSI'] = hist['Close'].rolling(window=14).apply(lambda x: pd.Series(x).pct_change().add(1).cumprod().iloc[-1])
                hist['RSI'] = calculate_rsi(hist['Close'], window=14)
                hist = calculate_macd(hist)

                moving_average = hist.iloc[-1]['SMA_20']
                rsi = hist.iloc[-1]['RSI']
                macd = hist.iloc[-1]['MACD']
                macd_signal = hist.iloc[-1]['MACD_Signal']

                # Query MongoDB for the stock's portfolio_asset_types
                stock_doc = mongo.db.stocks.find_one({"symbol": symbol}, {"portfolio_asset_types": 1})

                # print("stock_doc: ", stock_doc)


                stock_info = {
                    "name": stock_dict['name'],
                    "symbol": symbol,
                    "price": round(last_quote, 2),
                    "dailyChange": round((last_quote - prev_close) / prev_close * 100, 2),
                    "movingAverage": round(moving_average, 2),
                    "rsi": round(rsi, 2),
                    "macd": round(macd, 2),
                    "macdSignal": round(macd_signal, 2),
                    "portfolioAssetTypes": stock_doc['portfolio_asset_types'] if stock_doc else None
                }
                stock_data.append(stock_info)
        except Exception as e:
            print(f"Error retrieving data for {symbol}: {e}")

    return jsonify(stock_data)

@app.route('/get_price_chart/<stockSymbol>', methods=['GET'])
def get_price_chart(stockSymbol):
    try:
        # Calculate the date for one month ago
        one_month_ago = datetime.datetime.now() - timedelta(days=30)

        # Fetch historical data for the last month
        ticker = yf.Ticker(stockSymbol)
        hist = ticker.history(start=one_month_ago.strftime('%Y-%m-%d'))

        # Prepare the data for the chart
        chart_data = [{"Date": index.strftime('%Y-%m-%d'), "Close": round(row['Close'], 2), "Open": round(row['Open'], 2), "High": round(row['High'], 2), "Low": round(row['Low'], 2), "Volume": row['Volume']} for index, row in hist.iterrows()]
        print(type(chart_data))
        return jsonify(chart_data)
        # return chart_data
    except Exception as e:
        print(f"Error retrieving price chart for {stockSymbol}: {e}")
        return jsonify({"error": "Failed to retrieve data"}), 500

@app.route('/chatgpt_advice_stage_1', methods=['POST'])
def chatgpt_advice_stage_1():
    token = get_token_from_header()
    try:
        data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token has expired"}), 401

    user_id = data['user_id']
    paper_trading_portfolio_name = request.json.get('paperTradingPortfolioName')
    paper_trading_template_name = request.json.get('paperTradingTemplateName')
    all_stocks_data = request.json.get('allStocksData', [])

    # Format the stocks data into a readable string
    stocks_info_str = ', '.join([f"{stock['symbol']} (Current Price: ${stock['price']}, Daily Change for Today: {stock['dailyChange']}%)" for stock in all_stocks_data])
    print("stocks_info_str: ", stocks_info_str)

    # Fetch all user actions from the database
    user_actions_collection = mongo.db.user_paper_trading_actions
    user_actions_doc = user_actions_collection.find_one(
        {"user_id": user_id, "paper_trading_portfolio_name": paper_trading_portfolio_name, "paper_trading_template_name": paper_trading_template_name}
    )

    if user_actions_doc:
        user_actions = user_actions_doc['user_actions']
    else:
        user_actions = []
        # Create a new document if it does not exist
        user_actions_collection.insert_one({"user_id": user_id, "paper_trading_portfolio_name": paper_trading_portfolio_name, "paper_trading_template_name": paper_trading_template_name, "user_actions": user_actions})

    # Add the current action to the user_actions list
    current_action = request.json.get('userActions')
    current_action_entry = {"date": datetime.datetime.now(), "action": current_action}
    user_actions.append(current_action_entry)

    # Update the user_actions in the database
    user_actions_collection.update_one(
        {"user_id": user_id, "paper_trading_portfolio_name": paper_trading_portfolio_name, "paper_trading_template_name": paper_trading_template_name},
        {"$push": {"user_actions": current_action_entry}}
    )

    # Reverse the order of user actions so the latest comes first
    user_actions = user_actions[::-1]

    # Format all actions into a string for ChatGPT
    actions_str = ' '.join([f"On {action['date'].strftime('%Y-%m-%d %H:%M:%S')} user did: {action['action']}" for action in user_actions])

    print("actions: ", actions_str)


    # Fetch the user's current assets from the paper trading portfolio
    paper_trading_portfolio_collection = mongo.db.paper_trading_portfolio
    user_portfolio_doc = paper_trading_portfolio_collection.find_one(
        {"user_id": user_id, "portfolio_name": paper_trading_portfolio_name, "portfolio_template": paper_trading_template_name}
    )

    current_assets = user_portfolio_doc.get('current_assets', [])
    current_assets_str = ', '.join([f"{asset['symbol']} ({asset['quantity']} shares)" for asset in current_assets])

    # System prompt for ChatGPT
    system_prompt = (
        "You are an AI financial advisor. "
        "Provide suggestions and advice based on the user's paper stock trading actions "
        "to help them make better investment decisions."
    )

    # Generate the message for ChatGPT based on user actions and stock data
    user_message = (
        f"The user's actions in the stock trading app include: {actions_str}. "
        f"What advice would you offer? Based on these actions and the current market trends, "
        f"which one or two stocks from the following list would you recommend buying or selling and why? "
        f"Stocks: {stocks_info_str}. "
        f"For your reference, the user currently holds the following stocks: {current_assets_str}. "
    )

    print("user_message: ", user_message)

    response = openai.ChatCompletion.create(
        model="gpt-3.5-turbo-1106",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message}
        ]
    )
    return jsonify({"advice": response.choices[0].message['content']})

@app.route('/get_paper_portfolio_data', methods=['GET'])
def get_paper_portfolio_data():
    token = get_token_from_header()  # Replace with your method to extract token from header
    try:
        data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token has expired"}), 401

    user_id = data['user_id']

    # Retrieve paperTradingPortfolioName from query parameters
    paper_trading_portfolio_name = request.args.get('paperTradingPortfolioName')
    print("paper_trading_portfolio_name: ", paper_trading_portfolio_name)
    paper_trading_template_name = request.args.get('paperTradingTemplateName')
    print("paper_trading_template_name: ", paper_trading_template_name)

    paper_trading_portfolio_collection = mongo.db.paper_trading_portfolio

    # Fetch the user's portfolio using both user_id and paperTradingPortfolioName
    portfolio_query = {"user_id": user_id}
    if paper_trading_portfolio_name:
        portfolio_query["portfolio_name"] = paper_trading_portfolio_name
    if paper_trading_template_name:
        portfolio_query["portfolio_template"] = paper_trading_template_name

    portfolio = paper_trading_portfolio_collection.find_one(portfolio_query)

    if not portfolio:
        return jsonify({"error": "Portfolio not found"}), 404

    # Extract portfolio value over time and money in the portfolio
    portfolio_value_over_time = portfolio.get("portfolio_value_over_time", [])
    money_in_portfolio = portfolio.get("money_in_portfolio", [])
    current_assets = portfolio.get("current_assets", [])
    profit_or_loss = portfolio.get("profit_or_loss", [])
    portfolio_return = portfolio.get("portfolio_all_time_returns", 0)
    portfolio_stddev = portfolio.get("portfolio_stddev", [])
    cagr = portfolio.get("cagr", [])

    # Prepare the response data
    response_data = {
        "portfolioValueOverTime": portfolio_value_over_time,
        "moneyInPortfolio": money_in_portfolio,
        "currentAssets": current_assets,
        "profitOrLoss": profit_or_loss,
        "portfolioReturn": portfolio_return,
        "portfolioStdDev": portfolio_stddev,
        "cagr": cagr
    }

    return jsonify(response_data)

@app.route('/execute_transaction_paper_trading', methods=['POST'])
def execute_transaction_paper_trading():
    token = get_token_from_header()  # Replace with your method to extract token from header
    try:
        data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token has expired"}), 401

    user_id = data['user_id']
    request_data = request.get_json()
    if not request_data:
        return jsonify({"error": "No data provided"}), 400

    stock_symbol = request_data.get('stockSymbol')
    stock_name = request_data.get('stockName')
    quantity = request_data.get('quantity')
    transaction_type = request_data.get('transactionType')
    total_amount = request_data.get('totalAmount')
    asset_type = request_data.get('assetType', 'Stocks')
    paper_trading_portfolio_name = request_data.get('paperTradingPortfolioName')
    paper_trading_template_name = request_data.get('paperTradingTemplateName')

    portfolio_asset_types = request_data.get('portfolioAssetTypes')

    print("paper_trading_portfolio_name: ", paper_trading_portfolio_name)

    print("portfolio_asset_types: ", portfolio_asset_types)

    if not all([stock_symbol, quantity, transaction_type, total_amount]):
        return jsonify({"error": "Missing required transaction details"}), 400
    
    # Function to get current market price
    def get_current_market_price(symbol):
        ticker = yf.Ticker(symbol)
        hist = ticker.history(period="1d")
        if not hist.empty:
            return hist.tail(1)['Close'].iloc[0]
        else:
            return None

    paper_trading_portfolio_collection = mongo.db.paper_trading_portfolio
    # Find the user's portfolio based on both user_id and paper_trading_portfolio_name
    user_portfolio_doc = paper_trading_portfolio_collection.find_one({"user_id": user_id, "portfolio_name": paper_trading_portfolio_name, "portfolio_template": paper_trading_template_name})

    if not user_portfolio_doc:
        user_portfolio_doc = create_paper_trading_portfolio(mongo, user_id, str(paper_trading_portfolio_name), paper_trading_template_name, 10000, 0, [], [], 0, 0, 0, 0, [])
        user_portfolio_doc = paper_trading_portfolio_collection.find_one({"user_id": user_id, "portfolio_name": paper_trading_portfolio_name, "portfolio_template": paper_trading_template_name})

    current_cash = user_portfolio_doc['current_cash_value']
    money_in_portfolio = user_portfolio_doc.get('money_in_portfolio', [])
    # Modify the logic for updating 'money_in_portfolio'
    last_money_in_portfolio = money_in_portfolio[-1]["amount"] if money_in_portfolio else 0
    current_assets = user_portfolio_doc.get('current_assets', [])

    def find_stock(symbol):
        for asset in current_assets:
            if asset['symbol'] == symbol:
                return asset
        return None

    if transaction_type == 'buy':
        if current_cash >= total_amount:
            current_cash -= total_amount
            new_money_in_portfolio = last_money_in_portfolio + total_amount
            money_in_portfolio.append({"date": datetime.datetime.today().strftime('%Y-%m-%d %H:%M:%S'), "amount": new_money_in_portfolio})
            # money_in_portfolio.append({"date": datetime.datetime.today().strftime('%Y-%m-%d %H:%M:%S'), "amount": total_amount})
            asset = find_stock(stock_symbol)
            if asset:
                asset['quantity'] += quantity
                asset['invested_cash'] += total_amount
            else:
                current_assets.append({
                    "symbol": stock_symbol, 
                    "name": stock_name,
                    "asset_type": asset_type,
                    "portfolio_asset_types": portfolio_asset_types,
                    "quantity": quantity,
                    "invested_cash": total_amount
                })
        else:
            return jsonify({"error": "Insufficient funds"}), 400
    elif transaction_type == 'sell':
        asset = find_stock(stock_symbol)
        if asset and asset['quantity'] >= quantity:
            sell_ratio = quantity / asset['quantity']
            cash_from_sale = asset['invested_cash'] * sell_ratio
            current_cash += cash_from_sale
            asset['quantity'] -= quantity
            asset['invested_cash'] -= cash_from_sale
            new_money_in_portfolio = last_money_in_portfolio - cash_from_sale
            money_in_portfolio.append({"date": datetime.datetime.today().strftime('%Y-%m-%d %H:%M:%S'), "amount": new_money_in_portfolio})
            # money_in_portfolio.append({"date": datetime.datetime.today().strftime('%Y-%m-%d'), "amount": -cash_from_sale})
            if asset['quantity'] == 0:
                current_assets.remove(asset)
        else:
            return jsonify({"error": "Insufficient stock quantity"}), 400
        
    user_portfolio_doc['current_assets'] = current_assets

    # Calculate the current portfolio value
    current_portfolio_value = 0
    for asset in user_portfolio_doc['current_assets']:
        current_market_price = get_current_market_price(asset['symbol'])
        if current_market_price is not None:
            asset_value = current_market_price * asset['quantity']
            current_portfolio_value += asset_value

    # Update the latest value in portfolio value over time
    portfolio_value_over_time = user_portfolio_doc.get('portfolio_value_over_time', [])
    if portfolio_value_over_time:
        # Update the value of the most recent entry
        print("yes inside now")
        portfolio_value_over_time[-1]['value'] = current_portfolio_value
    else:
        # If no entries, add the first entry
        print("not inside now")
        portfolio_value_over_time.append({"date": datetime.datetime.today().strftime('%Y-%m-%d'), "value": current_portfolio_value})
    
    # Update the database with the new values
    paper_trading_portfolio_collection.update_one(
        {"user_id": user_id, "portfolio_name": paper_trading_portfolio_name,"portfolio_template": paper_trading_template_name},
        {"$set": {
            "current_cash_value": current_cash, 
            "current_assets": current_assets,
            "money_in_portfolio": money_in_portfolio,
            "portfolio_value_over_time": portfolio_value_over_time,  # Update the portfolio value over time
            "profit_or_loss": current_portfolio_value - new_money_in_portfolio
        }}
    )

    return jsonify({"success": True, "current_cash": current_cash, "current_assets": current_assets})


@app.route('/get_current_cash', methods=['GET'])
def get_current_cash():
    token = get_token_from_header()
    try:
        data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token has expired"}), 401
    
    user_id = data['user_id']
    paper_trading_portfolio_name = request.args.get('paperTradingPortfolioName')
    paper_trading_template_name = request.args.get('paperTradingTemplateName')
    print("paper_trading_template_name: ", paper_trading_template_name)

    paper_trading_portfolio_collection = mongo.db.paper_trading_portfolio
    # Find the portfolio using both user_id and paperTradingPortfolioName
    user_portfolio = paper_trading_portfolio_collection.find_one({"user_id": user_id, "portfolio_name": paper_trading_portfolio_name, "portfolio_template": paper_trading_template_name})

    if user_portfolio:
        return jsonify({"current_cash_value": user_portfolio['current_cash_value']})
    else:
        # Handle the case where the portfolio is not found
        return jsonify({"current_cash_value": 10000})

@app.route('/get_stock_data_stage_1', methods=['GET'])
def get_stock_data_stage_1():
    stock_data = []

    for stock_dict in STOCKS_STAGE_1_2:  # Now stock_dict is a dictionary
        symbol = stock_dict['symbol']  # Access the symbol from the dictionary
        try:
            ticker = yf.Ticker(symbol)
            # Fetch historical data for the last two days
            hist = ticker.history(period="2d")

            if not hist.empty and len(hist) > 1:
                last_quote = hist.tail(1)['Close'].iloc[0]
                prev_close = hist.tail(2).head(1)['Close'].iloc[0]

                stock_info = {
                    "name": stock_dict['name'],  # Include the name field
                    "symbol": symbol,  # Use the symbol for the stock
                    "price": round(last_quote, 2),
                    "dailyChange": round((last_quote - prev_close) / prev_close * 100, 2)
                }
                stock_data.append(stock_info)
        except Exception as e:
            print(f"Error retrieving data for {symbol}: {e}")

    return jsonify(stock_data)

def send_notification_news():

    news_item = get_latest_news("AAPL",finnhub_client)
    # Format the message
    message = f"News Update ({news_item['date']}): {news_item['headline']} - {news_item['summary']}"

    # Check if message exceeds SMS character limit
    if len(message) > 160:
        # Truncate the message to fit within an SMS, keeping the most important info
        message = message[:157] + "..."
    vonage_client.sms.send_message({"from": "Vonage APIs", "to": "6585263637", "text": message})

def send_notification_technical():

    # Load data for the stock
    last_month = datetime.datetime.today() - timedelta(days=30)
    today = datetime.datetime.today().strftime('%Y-%m-%d')
    data = yf.download("NVDA", start=last_month.strftime('%Y-%m-%d'), end=today)
    
    # Run the detection functions
    df_head_shoulder = detect_head_shoulder(data.copy())
    df_triangle = detect_triangle_pattern(data.copy())
    df_wedge = detect_wedge(data.copy())
    df_channel = detect_channel(data.copy())
    df_double_top_bottom = detect_double_top_bottom(data.copy())

    # Get the last available date from the index
    last_date = data.index[-1].strftime('%Y-%m-%d')

    # Get the pattern data for the last available date
    pattern_head_shoulder = df_head_shoulder.loc[last_date, 'head_shoulder_pattern'] if last_date in df_head_shoulder.index and pd.notna(df_head_shoulder.loc[last_date, 'head_shoulder_pattern']) else None
    pattern_triangle = df_triangle.loc[last_date, 'triangle_pattern'] if last_date in df_triangle.index and pd.notna(df_triangle.loc[last_date, 'triangle_pattern']) else None
    pattern_wedge = df_wedge.loc[last_date, 'wedge_pattern'] if last_date in df_wedge.index and pd.notna(df_wedge.loc[last_date, 'wedge_pattern']) else None
    pattern_channel = df_channel.loc[last_date, 'channel_pattern'] if last_date in df_channel.index and pd.notna(df_channel.loc[last_date, 'channel_pattern']) else None
    pattern_double_top_bottom = df_double_top_bottom.loc[last_date, 'double_pattern'] if last_date in df_double_top_bottom.index and pd.notna(df_double_top_bottom.loc[last_date, 'double_pattern']) else None

    # Prepare the message based on the patterns detected
    patterns_detected = []
    if pattern_head_shoulder:
        patterns_detected.append(f"Head and Shoulder Pattern: {pattern_head_shoulder}")
    if pattern_triangle:
        patterns_detected.append(f"Triangle Pattern: {pattern_triangle}")
    if pattern_wedge:
        patterns_detected.append(f"Wedge Pattern: {pattern_wedge}")
    if pattern_channel:
        patterns_detected.append(f"Channel Pattern: {pattern_channel}")
    if pattern_double_top_bottom:
        patterns_detected.append(f"Double Top Bottom Pattern: {pattern_double_top_bottom}")

    # If any patterns are detected, send the message
    if patterns_detected:
        print("patterns_detected: ", patterns_detected)
        message = f"Patterns detected for NVDA on {last_date}: " + ", ".join(patterns_detected)
        # Check if message exceeds SMS character limit
        if len(message) > 160:
            # Truncate the message to fit within an SMS, keeping the most important info
            message = message[:157] + "..."
        vonage_client.sms.send_message({
            "from": "Vonage APIs", 
            "to": "6585263637", 
            "text": message
        })

@app.route('/get_new_convo_starter/<topic>/<content>', methods=['POST'])
def get_new_convo_starter(topic, content):
    token = get_token_from_header()
    try:
        data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token has expired"}), 401
    
    user_id = data['user_id']

    # user_id = "657030a446050bf277393dad"

    chat_collection = mongo.db.chat_messages
    conversations = chat_collection.find({"user_id": user_id, "content": content})

    # Format past interactions for the GPT-3.5 prompt
    formatted_past_messages = []
    # may need summarizing if too long??????? DONE
    for msg in conversations:
        # Assuming each message in past_interactions has 'role' and 'message' fields
        formatted_past_messages.append({"role": msg['sender'], "content": msg['message']})

    explanation = FINANCE_TOPICS[topic][content]

    if len(formatted_past_messages) == 0:
        print("No")
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo-1106",
            messages=[
                    {
                    "role": "system",
                    "content": f"You are an educational AI specialized in financial literacy. You aim is to teach a beginner about the concept of " + str(content) + " such that the beginner will learn to " + str(explanation)
                    },
                    {
                    "role": "user",
                    "content": f"Please explain the topic of " + str(content) + " to a beginner in this topic in detail, and also prompt the user to ask further questions about this topic by giving examples."
                    }
            ]
        )
    else:
        print("Yes")
        message = f"These are the past interactions of the user with the system. Please look at these past interactions of the user on the topic of " + str(content) + " to start a new conversation on a different concept on this topic or continue an existing topic previously discussed by the user if you feel the user needs more help to understand this. These are the past conversation of the user for your reference: \n" + str(formatted_past_messages) 
        encoding = tiktoken.encoding_for_model("gpt-3.5-turbo-1106")
        token_count = len(encoding.encode(message))

        if token_count > MAX_TOKEN_LIMIT:
            summary = summarize_conversation_with_chatgpt(formatted_past_messages)
            summarized_message = f"These are the past interactions of the user with the system. Please look at these past interactions of the user on the topic of " + str(content) + " to start a new conversation on a different concept on this topic or continue an existing topic previously discussed by the user if you feel the user needs more help to understand this. These are the past conversation of the user for your reference: \n" + str(summary) 
            print("Summarized message: ",summarized_message)
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo-1106",
                messages=[
                        {
                        "role": "system",
                        "content": f"You are an educational AI specialized in financial literacy. You aim is to teach a beginner about the concept of " + str(content) + " such that the beginner will learn to " + str(explanation) 
                        },
                        {
                        "role": "user",
                        "content": summarized_message
                        }
                ]
            )
        else:
            print("Message: ",message )
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo-1106",
                messages=[
                        {
                        "role": "system",
                        "content": f"You are an educational AI specialized in financial literacy. You aim is to teach a beginner about the concept of " + str(content) + " such that the beginner will learn to " + str(explanation) 
                        },
                        {
                        "role": "user",
                        "content": message
                        }
                ]
            )
    return jsonify(response.choices[0].message['content'])

def summarize_conversation_with_chatgpt(conversations):
    # Convert the list of conversation objects to a string with each message on a new line
    conversation_texts = ["{}: {}".format(msg['role'].title(), msg['content']) for msg in conversations]
    
    # Initialize an empty string for the final summary
    final_summary = ""
    chunk_size = 800  # Adjust as needed based on your prompt size and token limits
    chunk_summaries = []

    # Process each chunk of the conversation
    for i in range(0, len(conversation_texts), chunk_size):
        chunk = "\n".join(conversation_texts[i:i + chunk_size])
        prompt = (
            "The following is a series of messages between a user and an AI discussing financial topics. "
            "Summarize the key points of this part of the conversation, highlighting the main topics discussed and the sentiment or understanding shown by the user.\n\n"
            f"{chunk}\n\n"
            "Summary:"
        )

        # Call the OpenAI API to summarize the chunk
        response = openai.Completion.create(
            model="text-davinci-003",
            prompt=prompt,
            max_tokens=512  # Limiting to get a concise summary for each chunk
        )

        # Append the chunk summary to the list
        chunk_summaries.append(response.choices[0].text.strip())

    # Combine chunk summaries
    combined_summary = " ".join(chunk_summaries)

    # Check if combined summary exceeds token limit
    if len(combined_summary) > MAX_TOKEN_LIMIT:
        # Further summarize the combined summary
        further_summary_prompt = (
            "Summarize the following text into a detailed summary that captures the most important points:\n\n"
            f"{combined_summary}\n\n"
            "Summary:"
        )

        further_summary_response = openai.Completion.create(
            model="text-davinci-003",
            prompt=further_summary_prompt,
            max_tokens=4096  # Additional limit for further summarization
        )

        final_summary = further_summary_response.choices[0].text.strip()
    else:
        final_summary = combined_summary

    return final_summary
    

@app.route('/get_first_unfinished_content/<topic>', methods=['GET'])
def get_first_unfinished_content(topic):
    token = get_token_from_header()
    try:
        data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token has expired"}), 401
    
    user_id = data['user_id']
    learn_progress_collection = mongo.db.learn_progress

    # Query to find the first unfinished content for the given topic, ordered by rank
    unfinished_content = learn_progress_collection.find_one(
        {"topic": topic, "user_id": user_id, "finished": "No"},
        sort=[("rank", 1)]
    )

    print("unfinished_content: ", unfinished_content)

    if unfinished_content:
        return jsonify({
            "success": True,
            "content": unfinished_content["content"],
            "rank": unfinished_content["rank"]
        }), 200
    else:
        return jsonify({"success": False, "message": "No unfinished content found for this topic."}), 404


@app.route('/add_message_chat', methods=['POST'])
def add_message_chat():
    token = get_token_from_header()
    try:
        data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token has expired"}), 401
    
    user_id = data['user_id']

    data = request.get_json()
    sender = data.get('sender')
    message = data.get('message')
    topic = data.get('topic')
    content = data.get('content')

    if not user_id or not sender or not message:
        return jsonify({"error": "Missing data for user_id, sender, or message"}), 400

    inserted_id = create_chat_message(mongo, user_id, topic, content, sender, message)
    return jsonify({"status": "success", "inserted_id": str(inserted_id)}), 200

@app.route('/get_user_messages', methods=['GET'])
def get_user_messages():
    token = get_token_from_header()
    if not token:
        return jsonify({"error": "Invalid Authorization header format"}), 401

    try:
        data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token has expired"}), 401
    
    user_id = data['user_id']

    try:
        messages = get_user_chat_messages(mongo, user_id)
        messages_json = json.loads(json_util.dumps(messages))
        # print(messages_json)
        return jsonify({"status": "success", "messages": messages_json}), 200
    except Exception as e:
        print(e)  # For debugging purposes
        return jsonify({"error": "Error fetching messages"}), 500

    
def parse_quiz(response_text):
    lines = response_text.split('\n')
    quiz = []
    current_topic = None
    question = {}
    options = {}

    print("Lines: ", lines)

    for line in lines:
        print("Line:",line)
        if line.startswith('Topic:'):
            if question and current_topic:
                question['options'] = options
                if quiz and quiz[-1]['topic'] == current_topic:
                    quiz[-1]['questions'].append(question)
                else:
                    quiz.append({'topic': current_topic, 'questions': [question]})
                question = {}
                options = {}
            current_topic = line.split(': ')[1].strip()
            print(f"Current Topic: {current_topic}")

        elif line.startswith('Question') and current_topic:
            if question:
                question['options'] = options
                if quiz and quiz[-1]['topic'] == current_topic:
                    quiz[-1]['questions'].append(question)
                else:
                    quiz.append({'topic': current_topic, 'questions': [question]})
            question = {'question': line.split(': ')[1].strip()}
            options = {}

        elif line.startswith(('A)', 'B)', 'C)', 'D)')) and current_topic:
            option_key = line[0]
            options[option_key] = line[3:].strip()

        elif line.startswith('Correct Answer:') and current_topic:
            question['correct_answer'] = line.split(': ')[1].strip()

        elif line.startswith('Explanation:') and current_topic:
            question['explanation'] = line.split(': ')[1].strip()

    if question and options and current_topic:
        question['options'] = options
        if quiz and quiz[-1]['topic'] == current_topic:
            quiz[-1]['questions'].append(question)
        else:
            quiz.append({'topic': current_topic, 'questions': [question]})

    # Print the number of topics and the number of questions in each topic
    print(f"Total Number of Topics: {len(quiz)}")
    for topic in quiz:
        print(f"Topic '{topic['topic']}' has {len(topic['questions'])} questions.")

    return quiz

def separate_messages(past_messages):
    # Initialize dictionaries to hold messages and contents
    messages_dict = {
        "past_messages_1": [],
        "past_messages_2": [],
        "past_messages_3": [],
        "past_messages_4": [],
        "past_messages_5": []
    }
    content_dict = {
        "content_1": None,
        "content_2": None,
        "content_3": None,
        "content_4": None,
        "content_5": None
    }

    # List to track unique contents
    unique_contents = []

    for message in past_messages:
        content = message.get('content')
        print(content)
        
        if content not in unique_contents and len(unique_contents) < 5:
            unique_contents.append(content)
            print("Unique Contents: ", unique_contents)
        
        if content in unique_contents:
            index = unique_contents.index(content) + 1
            print("Index: ", index)
            messages_dict[f"past_messages_{index}"].append(message)
            content_dict[f"content_{index}"] = content

    return messages_dict, content_dict

@app.route('/chatgptmakequiz', methods=['POST'])
def chatgptmakequiz():
    token = get_token_from_header()
    if not token:
        return jsonify({"error": "Invalid Authorization header format"}), 401

    try:
        data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token has expired"}), 401

    user_id = data['user_id']

    # user_id = "657030a446050bf277393dad"

    past_messages = get_user_chat_messages(mongo, user_id)
    
    
    # print(past_messages)
    messages_dict, content_dict = separate_messages(past_messages)

    # Accessing the lists and content variables
    past_messages_1 = messages_dict["past_messages_1"]
    past_messages_2 = messages_dict["past_messages_2"]
    past_messages_3 = messages_dict["past_messages_3"]
    past_messages_4 = messages_dict["past_messages_4"]
    past_messages_5 = messages_dict["past_messages_5"]

    content_1 = content_dict["content_1"]
    content_2 = content_dict["content_2"]
    content_3 = content_dict["content_3"]
    content_4 = content_dict["content_4"]
    content_5 = content_dict["content_5"]

    # Retrieve past questions for each content
    past_questions_dict = {
        content_1: get_past_quiz_questions_for_all_quizzes(mongo, user_id, content_1),
        content_2: get_past_quiz_questions_for_all_quizzes(mongo, user_id, content_2),
        content_3: get_past_quiz_questions_for_all_quizzes(mongo, user_id, content_3),
        content_4: get_past_quiz_questions_for_all_quizzes(mongo, user_id, content_4),
        content_5: get_past_quiz_questions_for_all_quizzes(mongo, user_id, content_5),
    }

    print("past_questions_dict;",past_questions_dict)

    # Format past interactions for the GPT-3.5 prompt
    formatted_past_messages_1 = []
    for msg in past_messages_1:
        # Assuming each message in past_interactions has 'role' and 'message' fields
        formatted_past_messages_1.append({"role": msg['sender'], "content": msg['message']})
    
    # Format past interactions for the GPT-3.5 prompt
    formatted_past_messages_2 = []
    for msg in past_messages_2:
        # Assuming each message in past_interactions has 'role' and 'message' fields
        formatted_past_messages_2.append({"role": msg['sender'], "content": msg['message']})

    # Format past interactions for the GPT-3.5 prompt
    formatted_past_messages_3 = []
    for msg in past_messages_3:
        # Assuming each message in past_interactions has 'role' and 'message' fields
        formatted_past_messages_3.append({"role": msg['sender'], "content": msg['message']})
    
    # Format past interactions for the GPT-3.5 prompt
    formatted_past_messages_4 = []
    for msg in past_messages_4:
        # Assuming each message in past_interactions has 'role' and 'message' fields
        formatted_past_messages_4.append({"role": msg['sender'], "content": msg['message']})

    # Format past interactions for the GPT-3.5 prompt
    formatted_past_messages_5 = []
    for msg in past_messages_5:
        # Assuming each message in past_interactions has 'role' and 'message' fields
        formatted_past_messages_5.append({"role": msg['sender'], "content": msg['message']})

    # message = f"These are the past interactions of the user with the system on the topic " + str(content_1) +".\n" +str(formatted_past_messages_1) + "\n These are the past interactions of the user with the system on the topic " + str(content_2) +".\n" +str(formatted_past_messages_2) + "\n These are the past interactions of the user with the system on the topic " + str(content_3) +".\n" +str(formatted_past_messages_3) + "\n These are the past interactions of the user with the system on the topic " + str(content_4) +".\n" +str(formatted_past_messages_4) + "\n These are the past interactions of the user with the system on the topic " + str(content_5) +".\n" +str(formatted_past_messages_5) + "\n Please look at these past interactions and create 5 multiple-choice questions on each of the five topics"

    # message_1 = f"Please create the 5 mcq questions on the five topics of " + str(content_1) + ", " + str(content_2) + ", " + str(content_3) + ", " + str(content_4) + ", and " + str(content_5)
    
    
    # message = "These are the past interactions of the user with the system. Please look at these past interactions and create 10 multiple-choice questions on finance concepts you think the user still needs work on.\n" + str(formatted_past_messages) 

    # Craft the message to the AI
    message_1 = f"Please create 5 new multiple-choice questions on the topics of {content_1}, {content_2}, {content_3}, {content_4}, and {content_5}."
    avoid_instructions_list = []

    # Check for each content if there are past questions to avoid
    for content_name, past_questions in past_questions_dict.items():
        if past_questions:  # If there are past questions for this content
            questions_text = ", ".join([f"'{q}'" for q in past_questions])  # Directly use the question text
            avoid_instructions_list.append(f"For {content_name} avoid using these questions: {questions_text}")

    # Craft the message to the AI
    message_1 = f"Please create 5 new multiple-choice questions on the topics of {content_1}, {content_2}, {content_3}, {content_4}, and {content_5}.\n"
    if avoid_instructions_list:  # If there are any instructions to avoid past questions
        message_1 += "\n\n" + "\n".join(avoid_instructions_list)
    else:
        message_1 += "without any specific restrictions."

    # No need for the globals() function
    # Append the list of content names to the message
    # content_names = [content_1, content_2, content_3, content_4, content_5]
    # message_1 += f"{', '.join(content_names)}."
        
    print("message_1: ", message_1)

    response = openai.ChatCompletion.create(
        model="gpt-3.5-turbo-1106",
        messages=[
                {
                "role": "system",
                "content":f"You are an educational AI specialized in financial literacy. Your task is to create a comprehensive quiz to educate a beginner in finance about essential concepts across five key topics: " + str(content_1) + ", " + str(content_2) + ", " + str(content_3) + ", " + str(content_4) + ", and " + str(content_5) + ".\n\nFor each of these topics, generate 5 multiple-choice questions. Each question should have 4 options (labeled A to D), with one correct answer. Additionally, after each question, reveal the correct answer and provide a brief explanation as to why it is correct. Structure your response for easy parsing, following this format:\n\nTopic: " + str(content_1) + "\nQuestion 1: [Question text]\nA) [Option A]\nB) [Option B]\nC) [Option C]\nD) [Option D]\nCorrect Answer: [Correct option letter]\nExplanation: [Brief explanation]\n\n... [Continue for remaining questions under " + str(content_1) + "]\n\nTopic: " + str(content_2) + "\n... [Follow the same structure for " + str(content_2) + " questions]\n\nTopic: " + str(content_3) + "\n... [Follow the same structure for " + str(content_3) + " questions]\n\nTopic: " + str(content_4) + "\n... [Follow the same structure for " + str(content_4) + " questions]\n\nTopic: " + str(content_5) + "\n... [Follow the same structure for " + str(content_5) + " questions]\n\nEnsure that the questions cover a range of basic to intermediate concepts in each topic to provide a well-rounded understanding of financial literacy."
                },
                {
                "role": "user",
                "content": message_1
                }
        ]
    )
    print("Response: ", response)
    answer = response.choices[0].message['content']
    parsed_quiz = parse_quiz(answer)
    print("parsed quiz: ", parsed_quiz)
    # return parsed_quiz
    return jsonify(parsed_quiz)
    # return message_1

@app.route('/store_quiz_result', methods=['POST'])
def store_quiz_result():
    token = get_token_from_header()
    if not token:
        return jsonify({"error": "Invalid Authorization header format"}), 401

    try:
        data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token has expired"}), 401

    user_id = data['user_id']

    quiz_results = request.json.get('result')
    if not quiz_results:
        return jsonify({"error": "No quiz results provided"}), 400

    try:
        inserted_id = create_quiz_results(mongo, user_id, quiz_results)
        # Separate quiz results by topic and call update_after_quiz
        separated_results = separate_quiz_results_by_topic(quiz_results)
        for topic, results in separated_results.items():
            print("Results: ", results)
            update_after_quiz(user_id, results)
        
        return jsonify({"message": "Quiz result stored successfully", "inserted_id": str(1)}), 200
    except Exception as e:
        print(e)
        return jsonify({"error": "Error storing quiz result"}), 500
    
def separate_quiz_results_by_topic(quiz_results):
    results_by_topic = {}
    for result in quiz_results:
        topic = result['topic']
        if topic not in results_by_topic:
            results_by_topic[topic] = []
        results_by_topic[topic].append(result)
    return results_by_topic

def update_after_quiz(user_id, quiz_results_based_on_topic):
    # Extract the list of questions from the quiz results
    questions = quiz_results_based_on_topic[0].get('questions', [])

    content_name = quiz_results_based_on_topic[0]['topic']
    # Check if all questions are answered correctly
    all_correct = all(q.get('isCorrect') for q in questions)

    if all_correct:
        past_messages = get_user_chat_messages_by_content(mongo, user_id, content_name)

        # Format past interactions for the GPT-3.5 prompt
        formatted_past_messages = []
        # may need summarizing if too long??????? DONE
        for msg in past_messages:
            # Assuming each message in past_interactions has 'role' and 'message' fields
            formatted_past_messages.append({"role": msg['sender'], "content": msg['message']})

        message = f"Considering the user has passed all the 5 Multiple Choice Questions on the topic of " + str(content_name) + ", please look at these past interactions of the user with the system on the topic of " + str(content_name)+ " and assess whether the user is knowledgeable enough to pass this topic. Please answer (Yes/No). These are the past interactions of the user on the topic of " +str(content_name) + " for your reference: \n" + str(formatted_past_messages) 
        encoding = tiktoken.encoding_for_model("gpt-3.5-turbo-1106")
        token_count = len(encoding.encode(message))

        if token_count > MAX_TOKEN_LIMIT:
            summary = summarize_quiz_conversation_with_chatgpt(formatted_past_messages)
            message = f"Considering the user has passed all the 5 Multiple Choice Questions on the topic of {content_name}, please look at these summarized past interactions of the user with the system on the topic of {content_name} and assess whether the user is knowledgeable enough to pass this topic. Please answer (Yes/No).\n\n{summary}"
        
        
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo-1106",  # This model corresponds to GPT-3.5
            messages=[
                {"role": "system", "content": f"You are an educational AI specialized in financial literacy. Based on the performance on the five Multiple Choice Questions on the topic of " + str(content_name) + " as well as the users past ineractions with the system on the topic, assess whether you think the user is good enough to pass this topic. Please answer only (Yes/No). Please put more importance on the user's performance on the five MCQ questions before answering the question." },
                {"role": "user", "content": message}
            ]
        )

        print("Response: ", response.choices[0].message['content'])
        answer = response.choices[0].message['content']

        if answer == "Yes":
            topic_name = CONTENT_TO_TOPIC_MAP[content_name]
            updated_count = update_learn_progress(mongo, user_id, topic_name, content_name)
            deleted_count = delete_chat_messages_by_content(mongo, user_id, content_name)

        
        print(f"All answers are correct for the topic: {quiz_results_based_on_topic[0]['topic']}")
        # Implement additional actions if all answers are correct
    else:
        print(f"Not all answers are correct for the topic: {quiz_results_based_on_topic[0]['topic']}")
        # Implement actions for when not all answers are correct

def summarize_quiz_conversation_with_chatgpt(conversations):
    # Convert the list of conversation objects to a string with each message on a new line
    conversation_texts = ["{}: {}".format(msg['role'].title(), msg['content']) for msg in conversations]
    
    final_summary = ""
    chunk_size = 800  # Adjust based on the average size of your messages

    for i in range(0, len(conversation_texts), chunk_size):
        chunk = "\n".join(conversation_texts[i:i + chunk_size])
        prompt = (
            "The following is a series of messages between a user and an AI discussing financial topics. "
            "Provide a summary highlighting the main topics discussed, user's understanding, and areas where the user showed confusion or lack of knowledge.\n\n"
            f"{chunk}\n\n"
            "Summary:"
        )

        response = openai.Completion.create(
            model="text-davinci-003",
            prompt=prompt,
            max_tokens=512
        )

        final_summary += response.choices[0].text.strip() + " "

    if len(final_summary) > MAX_TOKEN_LIMIT:
        further_summary_prompt = (
            "Summarize the following text into a concise overview, focusing on the key themes and user's understanding:\n\n"
            f"{final_summary}\n\n"
            "Concise Summary:"
        )

        further_summary_response = openai.Completion.create(
            model="text-davinci-003",
            prompt=further_summary_prompt,
            max_tokens=512
        )

        final_summary = further_summary_response.choices[0].text.strip()

    return final_summary

@app.route('/learnchatgptask', methods=['POST'])
def learnchatgptask():
    message = request.json['prompt']

    response = openai.ChatCompletion.create(
        model="gpt-3.5-turbo-1106",  # This model corresponds to GPT-3.5
        messages=[
            {"role": "system", "content": "You are an educational AI specialized in financial literacy. Your task is to teach a beginner in finance the essential concepts needed to understand the stock market and eventually build an investment portfolio."},
            {"role": "user", "content": message}
        ]
    )
    return jsonify(response.choices[0].message['content'])

def parse_financial_topics(response_text):
    # Split the text into sections based on the pattern "\n\n<digit>. "
    sections = re.split(r'\n\n\d+\.\s', response_text)
    topics = []

    for section in sections[1:]:  # Skip the first section which is the introduction
        topic_info = {}
        
        # Split the section into lines
        lines = section.split('\n')
        
        # Extracting Topic Name
        topic_info['Topic Name'] = lines[0].split(': ')[1]

        # Extracting Current Understanding
        topic_info['Current Understanding'] = lines[1].split(': ')[1]

        # Extracting Concepts to Explore
        concepts_to_explore = []
        capture = False
        for line in lines:
            if line.strip() == 'Concepts to Explore:':
                capture = True
                continue
            if capture and line.startswith('- '):
                concepts_to_explore.append(line[2:].strip())
        
        topic_info['Concepts to Explore'] = concepts_to_explore

        topics.append(topic_info)

    return topics


# @app.route('/chatgptreport', methods=['POST'])
def chatgptreport():
    token = get_token_from_header()
    if not token:
        return jsonify({"error": "Invalid Authorization header format"}), 401

    try:
        data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token has expired"}), 401

    user_id = data['user_id']

    # user_id = '657030a446050bf277393dad'

    past_messages = get_user_chat_messages(mongo, user_id)

    # Format past interactions for the GPT-3.5 prompt
    formatted_past_messages = []
    # may need summarizing if too long???????
    for msg in past_messages:
        # Assuming each message in past_interactions has 'role' and 'message' fields
        formatted_past_messages.append({"role": msg['sender'], "content": msg['message']})

    message = "These are the past interactions of the user with the system. Please look at these past interactions and identify 5 key topics in finance the user needs to explore.\n" + str(formatted_past_messages) 

    response = openai.ChatCompletion.create(
        model="gpt-3.5-turbo-1106",  # This model corresponds to GPT-3.5
        messages=[
            {"role": "system", "content": "You are an educational AI specialized in financial literacy. Based on the user's past interactions, identify 5 key topics in finance that the user should explore to become more knowledgeable and eventually build their own investment portfolio. For each topic, provide the user's current understanding and suggest specific concepts they should learn. Format the response as follows:\n\n 1. Topic Name: [First Topic]\n Current Understanding: [User's current understanding level of the topic]\n Concepts to Explore:\n - Concept 1: [First concept to explore]\n - Concept 2: [Second concept to explore]\n - Concept 3: [Third concept to explore]\n\n 2. Topic Name: [Second Topic]\n Current Understanding: [User's current understanding level of the topic]\n Concepts to Explore:\n  - Concept 1: [First concept to explore]\n - Concept 2: [Second concept to explore]\n - Concept 3: [Third concept to explore]\n\n 3. Topic Name: [Third Topic]\n Current Understanding: [User's current understanding level of the topic]\n Concepts to Explore:\n - Concept 1: [First concept to explore]\n - Concept 2: [Second concept to explore]\n - Concept 3: [Third concept to explore]\n\n 4. Topic Name: [Fourth Topic]\n Current Understanding: [User's current understanding level of the topic]\n Concepts to Explore:\n  - Concept 1: [First concept to explore]\n - Concept 2: [Second concept to explore]\n - Concept 3: [Third concept to explore]\n\n 5. Topic Name: [Fifth Topic]\n Current Understanding: [User's current understanding level of the topic]\n Concepts to Explore:\n - Concept 1: [First concept to explore]\n - Concept 2: [Second concept to explore]\n - Concept 3: [Third concept to explore]"},
            {"role": "user", "content": message}
        ]
    )

    parsed_report = parse_financial_topics(response.choices[0].message['content'])
    return parsed_report
    # return response.choices[0].message['content']

@app.route('/add_goal', methods=['POST'])
def add_goal():
    token = get_token_from_header()
    if not token:
        return jsonify({"error": "Invalid Authorization header format"}), 401

    try:
        data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token has expired"}), 401
    
    user_id = data['user_id']

    data = request.get_json()
    name = data.get('name')
    amount = data.get('amount')
    target_date = data.get('target_date')
    priority = data.get('priority')
    amount_progress = 0

    # Call to the MongoDB function to create a goal with target_date
    inserted_id = create_user_goals(mongo, user_id, name, float(amount), target_date, priority, amount_progress)
    return jsonify({"status": "success", "inserted_id": str(inserted_id)}), 201

@app.route('/delete_goal/<goal_id>', methods=['DELETE'])
def delete_goal(goal_id):
    user_goals_collection = mongo.db.user_goals

    # Delete the goal
    delete_result = user_goals_collection.delete_one({"_id": ObjectId(goal_id)})

    if delete_result.deleted_count:
        return jsonify({"status": "success", "deleted_id": goal_id}), 200
    else:
        return jsonify({"status": "failure", "reason": "No match found"}), 404
    
@app.route('/edit_goal/<goal_id>', methods=['PUT'])
def edit_goal(goal_id):
    data = request.json
    user_goals_collection = mongo.db.user_goals

    # Define the fields that can be updated
    allowed_fields = {'name', 'amount', 'target_date', 'priority'}
    
    # Filter the incoming data to include only the allowed fields
    update_data = {field: data[field] for field in allowed_fields if field in data}

    # Update the goal
    updated_result = user_goals_collection.update_one(
        {"_id": ObjectId(goal_id)},
        {"$set": update_data}
    )

    if updated_result.matched_count:
        return jsonify({"status": "success", "updated_id": goal_id}), 200
    else:
        return jsonify({"status": "failure", "reason": "No match found"}), 404
    
@app.route('/get_current_user_goals', methods=['GET'])
def get_current_user_goals():
    token = get_token_from_header()
    if not token:
        return jsonify({"error": "Invalid Authorization header format"}), 401

    try:
        data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token has expired"}), 401
    
    user_id = data['user_id']

    try:
        goals = get_all_current_user_goals(mongo, user_id)

        # Convert MongoDB documents to a JSON-friendly format
        goals_json = json.loads(json_util.dumps(goals))
        print(goals_json)
        return jsonify(goals_json)

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    

@app.route('/get_successful_user_goals', methods=['GET'])
def get_successful_user_goals():
    token = get_token_from_header()
    if not token:
        return jsonify({"error": "Invalid Authorization header format"}), 401

    try:
        data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token has expired"}), 401
    
    user_id = data['user_id']

    try:
        goals = get_all_successful_user_goals(mongo, user_id)

        # Convert MongoDB documents to a JSON-friendly format
        goals_json = json.loads(json_util.dumps(goals))
        print(goals_json)
        return jsonify(goals_json)

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@app.route('/get_failed_user_goals', methods=['GET'])
def get_failed_user_goals():
    token = get_token_from_header()
    if not token:
        return jsonify({"error": "Invalid Authorization header format"}), 401

    try:
        data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token has expired"}), 401
    
    user_id = data['user_id']

    try:
        goals = get_all_failed_user_goals(mongo, user_id)

        # Convert MongoDB documents to a JSON-friendly format
        goals_json = json.loads(json_util.dumps(goals))
        print(goals_json)
        return jsonify(goals_json)

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    

def latest_net_deposits(user_id):
    # Query the transactions collection
    transactions = list(mongo.db.transactions.find({"user_id": str(user_id)}).sort("timestamp", 1))

    # Calculate the running total after each transaction
    net_deposits = 0
    for transaction in transactions:
        net_deposits += transaction.get("amount", 0)


    # Return the latest net deposits value
    return net_deposits

def allocate_to_goals(mongo, user_id, total_gains):
    user_goals_collection = mongo.db.user_goals
    user_goals = list(user_goals_collection.find({"user_id": user_id, "completed": "No"}))

    # Calculate total weight
    total_weight = sum([(goal['amount'] / (datetime.datetime.strptime(goal['target_date'], '%Y-%m-%d') - datetime.datetime.now()).days) for goal in user_goals if datetime.datetime.strptime(goal['target_date'], '%Y-%m-%d') > datetime.datetime.now()])

    # Allocate gains to each goal
    for goal in user_goals:
        if datetime.datetime.strptime(goal['target_date'], '%Y-%m-%d') > datetime.datetime.now():
            weight = (goal['amount']/ (datetime.datetime.strptime(goal['target_date'], '%Y-%m-%d') - datetime.datetime.now()).days) / total_weight
            allocation = total_gains * weight
        else:
            allocation = 0  # No allocation if the target date has passed

        # Update goal progress
        latest_progress = goal['progress'][-1] if goal['progress'] else {"amount_progress": 0, "progress_percentage": 0}
        new_amount_progress = latest_progress['amount_progress'] + allocation
        new_progress_percentage = (new_amount_progress / goal['amount']) * 100

        # Update goal state based on progress and target date
        if datetime.datetime.strptime(goal['target_date'], '%Y-%m-%d') <= datetime.datetime.now():
            if new_amount_progress >= goal['amount']:
                goal['state'] = "Successful"
                goal['completed'] = "Yes"
                goal['date_completed'] = datetime.datetime.now()
            else:
                goal['state'] = "Failed"
                goal['completed'] = "Yes"
                goal['date_completed'] = datetime.datetime.now()
        else:
            if new_amount_progress >= goal['amount']:
                goal['state'] = "Successful"  # Goal achieved before the target date
                goal['completed'] = "Yes"
                goal['date_completed'] = datetime.datetime.now()

        # Update goal document in the database
        user_goals_collection.update_one(
            {"_id": goal['_id']},
            {
                "$set": {
                    "state": goal['state'],
                    "completed": goal['completed'],
                    "date_completed": goal['date_completed']
                },
                "$push": {
                    "progress": {
                        "date": datetime.datetime.now(),
                        "amount_progress": new_amount_progress,
                        "progress_percentage": new_progress_percentage
                    }
                }
            }
        )

# Function to calculate portfolio metrics including initial account balance
def calculate_portfolio_metrics(user_id, portfolio_name):
    # Assuming 'mongo' is your MongoDB client instance connected appropriately
    collection = mongo.db.portfolios
    returns_collection = mongo.db.portfolio_returns

    print("inside calculate_portfolio_metrics")
    
    # Retrieve user's portfolio and returns information
    portfolio = collection.find_one({"user_id": user_id, "portfolio_name": portfolio_name})
    returns_info = returns_collection.find_one({"user_id": user_id, "portfolio_name": portfolio_name})
    
    # Use the latest entry in 'money_in_portfolio' for the total investment
    if returns_info and "money_in_portfolio" in returns_info and returns_info["money_in_portfolio"]:
        latest_investment_entry = returns_info["money_in_portfolio"][-1]  # Assuming the array is ordered by date
        initial_investment = latest_investment_entry["amount"]
    else:
        initial_investment = 0
    
    
    start_date = "2022-01-01"
    end_date = datetime.datetime.now().strftime('%Y-%m-%d')

    portfolio_weights = portfolio['weights']
    symbols = [item['symbol'] for item in portfolio_weights]
    quantities = {item['symbol']: item['quantity'] for item in portfolio_weights}   
    
    # symbols = list(portfolio['weights'].keys())
    # quantities = {item['symbol']: item['quantity'] for item in portfolio['weights']}
    data = yf.download(symbols, start=start_date, end=end_date)['Adj Close']
    
    latest_prices = data.iloc[-1]
    portfolio_values = {symbol: quantities[symbol] * latest_prices.get(symbol, 0) for symbol in symbols}
    current_portfolio_value = sum(portfolio_values.values())

    # Update the portfolio_value_over_time
    existing_portfolio_value_over_time = returns_info.get("portfolio_value_over_time", []) if returns_info else []
    existing_portfolio_value_over_time.append({
        "date": datetime.datetime.now().strftime('%Y-%m-%d'),
        "value": current_portfolio_value
    })
    
    returns = data.pct_change().dropna()
    weights_array = np.array([quantities[symbol] for symbol in symbols])  # Changes: Constructing weights array for dot product
    portfolio_returns = np.dot(returns.fillna(0).values, weights_array)  # Changes: Dot product to calculate portfolio returns
    # portfolio_returns = np.dot(returns.fillna(0).values, np.array(list(portfolio['weights'].values())))

    # Additional step to fetch benchmark returns
    benchmark_data = yf.download('SPY', start=start_date, end=end_date)['Adj Close']
    benchmark_returns = benchmark_data.pct_change().dropna()


    # Calculate covariance between portfolio returns and benchmark returns
    cov_matrix = np.cov(portfolio_returns, benchmark_returns)
    portfolio_benchmark_covariance = cov_matrix[0, 1]
    
    # Calculate the variance of the benchmark returns
    benchmark_variance = np.var(benchmark_returns)
    
    # Calculate portfolio beta
    portfolio_beta = portfolio_benchmark_covariance / benchmark_variance
    
    portfolio_hist_return = [{"date": date.strftime('%Y-%m-%d'), "return": ret} for date, ret in zip(returns.index, portfolio_returns)]
    
    portfolio_return = np.mean(portfolio_returns) * 252
    portfolio_stddev = np.std(portfolio_returns) * np.sqrt(252)
    risk_free_rate = 0.02
    sharpe_ratio = (portfolio_return - risk_free_rate) / portfolio_stddev
    profit_or_loss = current_portfolio_value - initial_investment


    portfolio_all_time_returns = (current_portfolio_value - initial_investment) / initial_investment if initial_investment else 0
    
    # Update the database
    returns_collection.update_one(
        {"user_id": user_id, "portfolio_name": portfolio_name},
        {"$set": {
            "portfolio_return": portfolio_return,
            "portfolio_all_time_returns": portfolio_all_time_returns,
            "portfolio_stddev": portfolio_stddev,
            "sharpe_ratio": sharpe_ratio,
            "portfolio_hist_return": portfolio_hist_return,
            "portfolio_value_over_time": existing_portfolio_value_over_time,
            "current_portfolio_value": current_portfolio_value,
            "profit_or_loss": profit_or_loss,
            "portfolio_beta": portfolio_beta
        }},
        upsert=True
    )
    
    return {
        "portfolio_return": portfolio_return,
        "portfolio_all_time_returns": portfolio_all_time_returns,
        "portfolio_stddev": portfolio_stddev,
        "sharpe_ratio": sharpe_ratio,
        "portfolio_hist_return": portfolio_hist_return,
        "portfolio_value_over_time": existing_portfolio_value_over_time,
        "current_portfolio_value": current_portfolio_value,
        "profit_or_loss": profit_or_loss,
        "portfolio_beta": portfolio_beta
    }


def run_portfolio_optimization(user_id, portfolio_name):
    with app.app_context():
        try:
            print("Entered the run_portfolio_optimization task.")

            # Determine the optimization function based on portfolio_name
            if portfolio_name == "automated":
                # Run the portfolio optimization for automated portfolio
                print("Doing automated stuff")
                result = portfolio_optimization(user_id)
            else:
                # Calculate portfolio metrics for non-automated portfolio
                print("Doing other portfolio stuff: ", portfolio_name)
                result = calculate_portfolio_metrics(user_id, portfolio_name)

            print("Optimization/Calculation result:", result)

            # Calculate total gains for automated portfolios
            net_deposits = latest_net_deposits(user_id)
            print("net_deposits: ", net_deposits)
            total_gains = result['current_portfolio_value'] - net_deposits
            print("total_gains: ", total_gains)

            # Allocate gains to user's goals for automated portfolios
            # allocate_to_goals(mongo, user_id, total_gains)
            print("Finished allocation for all portfolios")

            return result
        except Exception as e:
            logging.error("Error in run_portfolio_optimization: %s", str(e))
            return {"error": str(e)}
        
def run_paper_trading_portfolio_optimization(user_id, paper_trading_portfolio_name):
    with app.app_context():
        print("Inside run_portfolio_optimization")
        try:
            logging.info("Entered the run_portfolio_optimization task.")
            # Fetch the user based on user_id
            # user_id = ObjectId(user_id)  # Convert user_id to ObjectId
            # user = mongo.db.users.find_one({'_id': user_id})
            # if not user:
            #     return {"error": "User not found"}
            
            # logging.info("Queried user: %s", user)

            # Assuming portfolio_optimization is a function you have defined
            secret_key = app.config['SECRET_KEY']
            logging.info("secret key and starting function: %s", secret_key)
            print("Running Portfolio")
            result = update_portfolio_metrics(user_id, paper_trading_portfolio_name)
            print("Finished Paper Trading Portfolio")
            logging.info("Portfolio optimization result: %s", result)
            return result
        except Exception as e:
            logging.error("Error in update_portfolio_metrics: %s", str(e))
            return {"error": str(e)}

@app.route('/deposit-money', methods=['POST'])
def deposit_money():
    token = get_token_from_header()
    if not token:
        return jsonify({"error": "Invalid Authorization header format"}), 401

    try:
        data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token has expired"}), 401

    user_id = data['user_id']

    data = request.get_json()
    amount = float(data.get('amount'))
    # portfolio_name = "automated"

    portfolio_name = data.get('portfolioName')

    portfolio = mongo.db.portfolios.find_one({"user_id": user_id, "portfolio_name": portfolio_name})
    if not portfolio:
        return jsonify({'error': 'Portfolio not found'}), 404
    
   


    # Convert current time to desired format
    current_time = datetime.datetime.now(pytz.utc).strftime("%Y-%m-%d %H:%M:%S.%f")

    # check if user has made initial deposit
    if portfolio.get('initial_deposit', -1.0) == -1.0:
        mongo.db.portfolios.update_one({"user_id": user_id, "portfolio_name": portfolio_name}, {'$set': {'initial_deposit': amount}})
        mongo.db.portfolios.update_one({"user_id": user_id, "portfolio_name": portfolio_name}, {'$inc': {'account_balance': amount}})
        
        # Update the portfolio_return collection for new users
        # mongo.db.portfolio_returns.update_one(
        #     {'user_id': user_id, "portfolio_name": portfolio_name},
        #     {'$set': {'current_portfolio_value': amount, 'portfolio_value_over_time': [{'date': current_time, 'value': amount}]}},
        #     upsert=True
        # )
    else:
        # Update account balance
        mongo.db.portfolios.update_one({"user_id": user_id, "portfolio_name": portfolio_name}, {'$inc': {'account_balance': amount}})
        
        # Update the portfolio_return collection for existing users
        latest_portfolio_return = mongo.db.portfolio_returns.find_one({'user_id': user_id, "portfolio_name": portfolio_name})
        if latest_portfolio_return:
            new_value = latest_portfolio_return.get('current_portfolio_value', 0) + amount
            new_portfolio_value_over_time = latest_portfolio_return.get('portfolio_value_over_time', [])
            new_portfolio_value_over_time.append({'date': current_time, 'value': new_value})
            
            # mongo.db.portfolio_returns.update_one(
            #     {'user_id': user_id, "portfolio_name": portfolio_name},
            #     {'$set': {'current_portfolio_value': new_value, 'portfolio_value_over_time': new_portfolio_value_over_time}}
            # )
        else:
            # In case no portfolio_return document exists
            # mongo.db.portfolio_returns.insert_one(
            #     {'user_id': user_id, "portfolio_name": portfolio_name, 'current_portfolio_value': amount, 'portfolio_value_over_time': [{'date': current_time, 'value': amount}]}
            # )
            mongo.db.portfolio_returns.insert_one(
                {'user_id': user_id, "portfolio_name": portfolio_name}
            )

    # Create a new Transaction entry for deposit
    create_transaction(mongo, user_id, portfolio_name, amount, 'deposit')

    # Add a task to run portfolio optimization immediately
    # Here, you would need to integrate your portfolio optimization logic
    # run_portfolio_optimization(user_id)

    return jsonify({'message': 'Amount deposited successfully', 'new_balance': portfolio['account_balance']}), 200



@app.route('/signup', methods=['POST'])
def signup():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    first_name = data.get('first_name')
    last_name = data.get('last_name')
    date_of_birth = data.get('date_of_birth')
    email = data.get('email')
    phone_no = data.get('phone_no')

    # Validate required fields
    if not all([username, password, first_name, last_name, date_of_birth, email, phone_no]):
        return jsonify({"error": "Missing required fields."}), 400
    
    # Check if user already exists
    if get_user(mongo, username):
        return jsonify({"error": "Username already exists. Please choose a different one."}), 400

    # Create new user
    user_id = create_user(mongo, username, password, first_name, last_name, date_of_birth, email, phone_no)

    # Generate a token for the new user
    token = jwt.encode(
        {'user_id': str(user_id), 'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)},
        app.config['SECRET_KEY'], algorithm="HS256"
    )

    # Initialize learning progress for each topic
    for topic, contents in FINANCE_TOPICS.items():
        rank = 1
        for content_title in contents.keys():
            create_learn_progress(mongo, str(user_id), topic, content_title, rank)
            rank += 1

    return jsonify({'token': token}), 201


@app.route('/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    print(username)
    print(password)

    if not check_user_password(mongo, username, password):
        return make_response('Invalid credentials', 401)

    user = get_user(mongo, username)


    if user:
        token = jwt.encode(
            {'user_id': str(user['_id']), 'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)},
            app.config['SECRET_KEY'], algorithm="HS256"
        )
        return jsonify({'token': token}), 200
    else:
        return make_response('User not found', 404)

# @app.route('/ask', methods=['POST'])
# def ask():
#     message = request.json['prompt']


#     response = openai.ChatCompletion.create(
#         model="gpt-3.5-turbo-1106",  # This model corresponds to GPT-3.5
#         messages=[
#             {"role": "system", "content": "You are a financial expert knowledgeable about investments, banking, and other financial topics."},
#             {"role": "user", "content": message}
#         ]
#     )
    
#     return jsonify(response.choices[0].message['content'])

@app.route('/ask', methods=['POST'])
def ask():
    user_message = request.json['prompt']

    # First, check if the message is about stocks or investment.
    pre_analysis_response = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "system", "content": "Determine if the user's query is asking for advice on buying or selling a specific stock and/or requesting news about a specific stock and/or inquiring about the stock performance of a specific stock and/or seeking financial statements of a specific company. Provide only 'Yes.' or 'No.' as an answer."},
            {"role": "user", "content": user_message}
        ]
    )

    pre_analysis_answer = pre_analysis_response.choices[0].message['content']

    print("pre_analysis_answer: ", pre_analysis_answer)

    if pre_analysis_answer == 'Yes.':
        print("Yes we are inside")
        # If the pre-analysis determines the query is about stock, use financial_analyst.
        analysis = financial_analyst(user_message)
        return jsonify(analysis)
    else:
        # If not about stock, proceed with general conversation.
        print("No we are not")
        general_response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo-1106",  # Adjust model as needed
            messages=[
                {"role": "system", "content": "You are a financial expert knowledgeable about investments, banking, and other financial topics."},
                {"role": "user", "content": user_message}
            ]
        )
        return jsonify(general_response.choices[0].message['content'])



@app.route('/submit-score', methods=['POST'])
def submit_score():
    token = get_token_from_header()
    if not token:
        return jsonify({"error": "Invalid Authorization header format"}), 401

    try:
        data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token has expired"}), 401

    score = request.json['score']
    user_id = data['user_id']

    try:
        create_response(mongo, user_id, score)
    except Exception as e:
        return jsonify({"error": "Database error: " + str(e)}), 500

    return jsonify({'message': 'Score saved successfully!'}), 200


@app.route('/get-scores', methods=['GET'])
def get_scores():
    token = get_token_from_header()
    if not token:
        return jsonify({"error": "Invalid Authorization header format"}), 401

    try:
        data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token has expired"}), 401

    user_id = data['user_id']
    responses = mongo.db.responses.find({"user_id": user_id})
    output = [response['score'] for response in responses]
    return jsonify({'scores': output})


@app.route('/optimize-portfolio', methods=['GET'])
def optimize_portfolio():
    token = get_token_from_header()
    if not token:
        return jsonify({"error": "Invalid Authorization header format"}), 401

    try:
        data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token has expired"}), 401

    user_id = data['user_id']
    portfolio_name = request.args.get('portfolio_name')

    print("portfolio_name: ", portfolio_name)
    # Query MongoDB for the latest PortfolioReturn record for the user
    latest_result = mongo.db.portfolio_returns.find_one(
        {"user_id": str(user_id), "portfolio_name": portfolio_name},
        sort=[("date", -1)]
    )

    if not latest_result:
        return jsonify({"error": "No portfolio optimization results available."}), 400
    
    # Query the transactions collection
    transactions = list(mongo.db.transactions.find({"user_id": str(user_id), "portfolio_name": portfolio_name}).sort("timestamp", 1))

    # Calculate the running total after each transaction
    running_total = 0
    transaction_history = []
    for transaction in transactions:
        # running_total += transaction.get("amount", 0) if transaction.get("type") == "deposit" else -transaction.get("amount", 0)
        amount = transaction.get("amount", 0)
        running_total += amount 
        transaction_history.append({
            "date": transaction.get("timestamp").strftime('%Y-%m-%d %H:%M:%S'),
            "amount": running_total
        })

    # print(transaction_history)
    # print(latest_result.get("portfolio_value_over_time"))

    # Convert the result to a dictionary or JSON format
    result = {
        "Selected Portfolio Return": latest_result.get("portfolio_return",0),
        "Selected Portfolio All Time Return": latest_result.get("portfolio_all_time_return",0),
        "Selected Portfolio Risk": latest_result.get("portfolio_stddev",0),
        "Selected Portfolio Sharpe Ratio": latest_result.get("sharpe_ratio",0),
        "Selected Portfolio Weights": latest_result.get("portfolio_weights",0),
        "Selected Portfolio Historical Returns": latest_result.get("portfolio_hist_return",0),
        "Portfolio Value Over Time": latest_result.get("portfolio_value_over_time",0),
        "Current Portfolio Value": latest_result.get("current_portfolio_value",0),
        "Profit or Loss": latest_result.get("profit_or_loss",0),
        "Money in Portfolio": latest_result.get("money_in_portfolio", []),
        'Selected Portfolio Beta': latest_result.get("portfolio_beta", 0),
        "Transaction History": transaction_history
    }

    print("result: ", result)

    return jsonify(result), 200


def optimize_portfolio1(portfolio_name):
    user_id = "657030a446050bf277393dad"
    # Query MongoDB for the latest PortfolioReturn record for the user
    latest_result = mongo.db.portfolio_returns.find_one(
        {"user_id": str(user_id), "portfolio_name": portfolio_name},
        sort=[("date", -1)]
    )

    if not latest_result:
        return jsonify({"error": "No portfolio optimization results available."}), 400
    
    # Query the transactions collection
    transactions = list(mongo.db.transactions.find({"user_id": str(user_id), "portfolio_name": portfolio_name}).sort("timestamp", 1))

    # Calculate the running total after each transaction
    running_total = 0
    transaction_history = []
    for transaction in transactions:
        # running_total += transaction.get("amount", 0) if transaction.get("type") == "deposit" else -transaction.get("amount", 0)
        amount = transaction.get("amount", 0)
        running_total += amount 
        transaction_history.append({
            "date": transaction.get("timestamp").strftime('%Y-%m-%d %H:%M:%S'),
            "running_total": running_total
        })

    # print(transaction_history)
    print(latest_result.get("portfolio_value_over_time"))

    # Convert the result to a dictionary or JSON format
    result = {
        "Selected Portfolio Return": latest_result.get("portfolio_return"),
        "Selected Portfolio Risk": latest_result.get("portfolio_stddev"),
        "Selected Portfolio Sharpe Ratio": latest_result.get("sharpe_ratio"),
        "Selected Portfolio Weights": latest_result.get("portfolio_weights"),
        "Selected Portfolio Historical Returns": latest_result.get("portfolio_hist_return"),
        "Portfolio Value Over Time": latest_result.get("portfolio_value_over_time"),
        "Current Portfolio Value": latest_result.get("current_portfolio_value"),
        "Profit or Loss": latest_result.get("profit_or_loss"),
        "Transaction History": transaction_history
    }

    return result


@app.route('/sp500-historical-returns', methods=['GET'])
def get_sp500_data():
    try:

        returns = getSP500returns()

        return jsonify(returns), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    

@app.route('/withdraw-money', methods=['POST'])
def withdraw_money():
    token = get_token_from_header()
    if not token:
        return jsonify({"error": "Invalid Authorization header format"}), 401

    try:
        data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token has expired"}), 401

    user_id = data['user_id']


    data = request.get_json()
    amount = float(data.get('amount'))

    # portfolio_name = "automated"
    portfolio_name = data.get('portfolioName')

    portfolio = mongo.db.portfolios.find_one({"user_id": user_id, "portfolio_name": portfolio_name})
    if not portfolio:
        return jsonify({'error': 'Portfolio not found'}), 404

    if portfolio.get('account_balance', 0) < amount:
        return jsonify({'error': 'Insufficient funds'}), 400

    # Update the user's account balance
    mongo.db.portfolios.update_one({"user_id": user_id, "portfolio_name": portfolio_name}, {'$inc': {'account_balance': -amount}})

    # Create a new Transaction entry for withdrawal
    create_transaction(mongo, user_id, portfolio_name, -amount, 'withdrawal')

    # Convert current time to desired format
    current_time = datetime.datetime.now(pytz.utc).strftime("%Y-%m-%d %H:%M:%S.%f")

    # Fetch the latest portfolio value for the user and update
    latest_portfolio_return = mongo.db.portfolio_returns.find_one({"user_id": user_id, "portfolio_name": portfolio_name})
    if latest_portfolio_return:
        new_value = latest_portfolio_return.get('current_portfolio_value', 0) - amount
        new_portfolio_value_over_time = latest_portfolio_return.get('portfolio_value_over_time', [])
        new_portfolio_value_over_time.append({'date': current_time, 'value': new_value})

        # mongo.db.portfolio_returns.update_one(
        #     {"user_id": user_id, "portfolio_name": portfolio_name},
        #     {'$set': {
        #         'current_portfolio_value': new_value, 
        #         'portfolio_value_over_time': new_portfolio_value_over_time
        #     }}
        # )

    updated_portfolio = mongo.db.portfolios.find_one({"user_id": user_id, "portfolio_name": portfolio_name})
    return jsonify({'message': 'Amount withdrawn successfully', 'new_balance': updated_portfolio['account_balance']}), 200

# View Transactions
@app.route('/transactions', methods=['GET'])
def view_transactions():
    token = get_token_from_header()
    if not token:
        return jsonify({"error": "Invalid Authorization header format"}), 401

    try:
        data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token has expired"}), 401

    user_id = ObjectId(data['user_id'])
    transactions = mongo.db.transactions.find({"user_id": str(user_id)}).sort("timestamp", -1)
    results = [{"id": str(t["_id"]), "amount": t["amount"], "timestamp": t["timestamp"], "type": t["type"]} for t in transactions]
    return jsonify(results)


# Get User Info
@app.route('/get-user-info', methods=['GET'])
def get_user_info():
    token = get_token_from_header()
    if not token:
        return jsonify({"error": "Invalid Authorization header format"}), 401

    try:
        data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token has expired"}), 401

    user_id = ObjectId(data['user_id'])
    user = mongo.db.users.find_one({"_id": user_id})
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Check if profile_pic exists and is not empty, otherwise set default URL
    profile_pic_url = user.get('profile_pic')
    if not profile_pic_url:
        profile_pic_url = 'uploads/blank_profile_pic.jpg'
    else:
        profile_pic_url = profile_pic_url.replace('\\', '/')

    return jsonify({'username': user.get('username'), 'firstName':user.get('first_name'), 'lastName':user.get('last_name'), 'dateOfBirth':user.get('date_of_birth'), 'email':user.get('email'), 'phoneNo':user.get('phone_no'), 'profile_pic': profile_pic_url})


@app.route('/update-user-info', methods=['PUT'])
def update_user_info():
    token = get_token_from_header()
    if not token:
        return jsonify({"error": "Invalid Authorization header format"}), 401

    try:
        data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token has expired"}), 401

    user_id = ObjectId(data['user_id'])
    user = mongo.db.users.find_one({"_id": user_id})
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    update_data = request.json
    
    # Update user information
    mongo.db.users.update_one({'_id': user_id}, {'$set': update_data})
    
    return jsonify({'message': 'User information updated successfully'})

# Change Password
@app.route('/change-password', methods=['POST'])
def change_password():
    token = get_token_from_header()
    if not token:
        return jsonify({"error": "Invalid Authorization header format"}), 401

    try:
        data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token has expired"}), 401

    user_id = ObjectId(data['user_id'])
    data = request.get_json()
    old_password = data.get('old_password')
    new_password = data.get('new_password')

    user = mongo.db.users.find_one({"_id": user_id})
    if not user:
        return jsonify({'error': 'User not found'}), 404

    if check_password_hash(user['password_hash'], old_password):
        new_hashed_password = generate_password_hash(new_password, method='pbkdf2:sha256')
        mongo.db.users.update_one({'_id': user_id}, {'$set': {'password_hash': new_hashed_password}})
        return jsonify({'message': 'Password updated successfully'}), 200
    else:
        return jsonify({'error': 'Incorrect password'}), 400
    
# Function to check if the file has a valid extension
def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route('/upload-profile-pic', methods=['POST'])
def upload_profile_pic():
    token = get_token_from_header()
    if not token:
        return jsonify({"error": "Invalid Authorization header format"}), 401

    try:
        data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token has expired"}), 401

    user_id = ObjectId(data['user_id'])
    user = mongo.db.users.find_one({"_id": user_id})
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], str(user_id) + '_' + filename)
        file.save(file_path)

        # Update the user's profile picture in MongoDB
        mongo.db.users.update_one({'_id': user_id}, {'$set': {'profile_pic': file_path}})

        return jsonify({'message': 'File uploaded successfully', 'file_path': file_path}), 200
    else:
        return jsonify({'error': 'File type not allowed'}), 400


@app.route('/get-initial-deposit', methods=['GET'])
def get_initial_deposit_info():
    token = get_token_from_header()
    if not token:
        return jsonify({"error": "Invalid Authorization header format"}), 401

    try:
        data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token has expired"}), 401

    user_id = data['user_id']
    portfolio_name = request.args.get('portfolio_name')  # Get the 'symbol' query parameter
    # portfolio_name = "automated"

    # Query MongoDB for the user's automated portfolio
    portfolio = mongo.db.portfolios.find_one({"user_id": user_id, "portfolio_name": portfolio_name})
    if not portfolio:
        initial_deposit = -1.0
    
    # Extract the initial deposit from the portfolio
    initial_deposit = portfolio.get('initial_deposit', -1.0)

    # Query MongoDB for the portfolio returns of the user
    portfolio_returns = mongo.db.portfolio_returns.find_one({"user_id": user_id, "portfolio_name": portfolio_name})
    if not portfolio_returns:
        return jsonify({'error': 'No portfolio returns record found'}), 404
        # return jsonify({'initialDeposit': initial_deposit})

    portfolio_value_over_time = portfolio_returns.get('portfolio_value_over_time', [])
    if not portfolio_value_over_time:
        return jsonify({'error': 'No portfolio value over time data found'}), 404
        # return jsonify({'initialDeposit': initial_deposit})

    # Extract the first and latest portfolio value entries
    first_entry = portfolio_value_over_time[0] if len(portfolio_value_over_time) > 0 else None
    latest_entry = portfolio_value_over_time[-1] if len(portfolio_value_over_time) > 0 else None

    if not first_entry or not latest_entry:
        return jsonify({'error': 'No valid portfolio records found'}), 404
        # return jsonify({'initialDeposit': initial_deposit})

    latest_portfolio_value = latest_entry.get('value', -1.0)

    # Check if the first entry date is today's date
    today_date_str = datetime.datetime.now().strftime("%Y-%m-%d")
    if first_entry['date'].startswith(today_date_str):
        return jsonify({
            'initialDeposit': initial_deposit, 
            'portfolioValue': latest_portfolio_value
        })

    return jsonify({'initialDeposit': initial_deposit})

if __name__ == '__main__':
    with app.app_context():  # This ensures that we are running within the app's context
        # db.create_all()  # Creates the tables
        app.run(debug=True, port=5000)
        # app.run(host='0.0.0.0', port=80)
