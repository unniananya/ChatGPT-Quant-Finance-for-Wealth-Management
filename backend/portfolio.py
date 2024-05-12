import jwt
import yfinance as yf
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
# from models import db, Response, Portfolio, Transaction, User, PortfolioValue, PortfolioReturn
from models import (
    create_user, get_user, check_user_password, create_response,
    create_portfolio, create_transaction, create_portfolio_value,
    create_portfolio_return
)
import json
import logging
from pypfopt import EfficientFrontier, expected_returns, risk_models, objective_functions
from pymongo import MongoClient
from bson.objectid import ObjectId
import numpy_financial as npf
# from pandas_datareader import data as pdr


# yf.pdr_override()

# Initialize the MongoClient and connect to your MongoDB server
# client = MongoClient("mongodb+srv://unniananya:Yayaya021.@cluster0.0zxo4wb.mongodb.net/fyp?retryWrites=true&w=majority")
# db = client["fyp"]


# logging.basicConfig(filename='logfile.txt', level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')


def get_risk_free_rate():
    # Fetch data for the 3-month T-bill
    tbill_3month = yf.Ticker("^IRX")
    history = tbill_3month.history(period="1d")
    
    # The risk-free rate is typically annualized
    # Given that ^IRX gives daily yield in percent, we can just use the most recent value
    risk_free_rate = history['Close'].iloc[-1] / 100

    return risk_free_rate


# def get_user_scores_from_token(user_id, secret_key):
#     """
#     Given a token, retrieve the user's scores from the database.
#     """
#     # try:
#     #     data = jwt.decode(token, secret_key, algorithms=["HS256"])
#     # except jwt.ExpiredSignatureError:
#     #     raise ValueError("Token has expired")
#     # except jwt.InvalidTokenError:
#     #     raise ValueError("Invalid token")

#     scores = Response.query.filter_by(user_id=user_id).all()
    
#     if not scores:
#         raise ValueError("No scores found for user")

#     return [response.score for response in scores]

def get_user_scores_from_token(user_id):
    """
    Given a user_id, retrieve the user's scores from the MongoDB database.
    """
    # Assuming the JWT decoding and validation part is handled elsewhere
    # try:
    #     data = jwt.decode(token, secret_key, algorithms=["HS256"])
    # except jwt.ExpiredSignatureError:
    #     raise ValueError("Token has expired")
    # except jwt.InvalidTokenError:
    #     raise ValueError("Invalid token")

    # Select the database and collection you want to work with
    client = MongoClient("mongodb+srv://unniananya:Yayaya021.@cluster0.0zxo4wb.mongodb.net/fyp?retryWrites=true&w=majority")
    db = client["fyp"]
    response_collection = db["responses"]
    print(response_collection)

    # Query the responses collection for a single document associated with the user_id
    response = response_collection.find_one({"user_id": user_id})

    if response:
        score = response.get('score')  # Use .get() to safely access the field
        # Now 'score' contains the score value
        print("Score:", score)
        client.close()
        return score
    else:
        # Handle the case where there is no response for the user_id
        print("No response found for user")
        client.close()


def get_investment_type(asset, investment_map):
    for investment_type, assets in investment_map.items():
        if asset in assets:
            # Now 'assets' is a dictionary where the key is the symbol, 
            # so we check if 'asset' (the symbol) is one of the keys
            return investment_type
    return "Unknown"

def get_asset_name_from_symbol(symbol, investment_map):
    for category, assets in investment_map.items():
        if symbol in assets:
            return assets[symbol]  # Return the name of the asset
    return "Unknown Symbol"  # Return this if the symbol isn't found

def getSP500returns():

    # Fetch historical data
    data1 = yf.download('^GSPC', start="2020-01-01", end=datetime.today().strftime('%Y-%m-%d'))['Adj Close']

    # Calculate daily returns
    returns1 = data1.pct_change().dropna()

    result1 = [{"date": str(index.date()), "return": value} for index, value in returns1.items()]

    return result1


# def download_stock_data(symbols):
#     stock_data = {}
#     for symbol in symbols:
#         try:
#             data = pdr.get_data_yahoo(symbol, start="2022-01-01", end=datetime.today().strftime('%Y-%m-%d'))
#             stock_data[symbol] = data['Adj Close']
#         except Exception as e:
#             print(f"Failed to download {symbol}: {str(e)}")
#     return pd.DataFrame(stock_data)


def portfolio_optimization(user_id):
    print("Inside Portfolio function")
    # Get the user's risk score
    try:
        risk_score = get_user_scores_from_token(user_id)
    except ValueError as e:
        return {"error": str(e)}
    
    client = MongoClient("mongodb+srv://unniananya:Yayaya021.@cluster0.0zxo4wb.mongodb.net/fyp?retryWrites=true&w=majority")
    db = client["fyp"]
    print("db:", db)

    today = datetime.today()
    start_week = today - timedelta(days=today.weekday())
    end_week = start_week + timedelta(days=6)
    print("start week:")
    print("end week:")

    obj_user_id = ObjectId(user_id)

    # Assuming 'db' is your MongoDB database instance
    portfolio_collection = db.portfolios
    
    # Query for the specific portfolio using user_id and portfolio_name
    portfolio = portfolio_collection.find_one({"user_id": user_id, "portfolio_name": "automated"})
    
    if not portfolio:
        print("Portfolio not found")
        return {"error": "Portfolio not found"}
    
    # Fetch initial_deposit and account_balance from the portfolio document
    initial_deposit = portfolio.get("initial_deposit", 0.0)
    account_balance = portfolio.get("account_balance", 0.0)
    
    print(f"initial_deposit: {initial_deposit}")
    print(f"account_balance: {account_balance}")


    portfolio_return_collection = db.portfolio_returns
    portfolio_return = portfolio_return_collection.find_one({"user_id": user_id, "portfolio_name": "automated"})
    
    if portfolio_return and "portfolio_value_over_time" in portfolio_return:
        portfolio_value_over_time = portfolio_return["portfolio_value_over_time"]
    else:
        portfolio_value_over_time = [{"date": str(today), "value": initial_deposit}]


    print("portfolio_value_over_time week: %s", portfolio_value_over_time)

    investment_map = {
        'Equities (Stocks)': {
            'SPY': 'SPDR S&P 500 ETF TRUST',
            'IVV': 'ISHARES CORE S&P 500 ETF',
            'MDY': 'SPDR S&P MIDCAP 400 ETF TRUST',
            'IJH': 'ISHARES CORE S&P MID-CAP ETF',
            'IWM': 'ISHARES RUSSELL 2000 ETF',
            'IJR': 'ISHARES CORE S&P SMALL-CAP ETF',
            'EFA': 'ISHARES MSCI EAFE ETF',
            'VEA': 'VANGUARD FTSE DEVELOPED MARKETS ETF',
            'EEM': 'ISHARES MSCI EMERGING MARKETS ETF',
            'VWO': 'VANGUARD FTSE EMERGING MARKETS ETF',
            'ACWI': 'ISHARES MSCI ACWI ETF',
            # 'CSPX': 'ISHARES CORE S&P 500 UCITS ETF',
            # 'CSUS': 'ISHARES CORE S&P U.S. GROWTH ETF',
            # 'EDMU': 'ISHARES EDGE MSCI USA MOMENTUM FACTOR ETF',
            # 'IUIT': 'ISHARES S&P 500 GROWTH ETF',
            'SPMV': 'SPDR S&P 500 MOMENTUM ETF',
            'EXCH': 'ISHARES NASDAQ US BIOTECHNOLOGY ETF'
        },
        'International/Regional Equities': {
            'AIA': 'ISHARES ASIA 50 ETF',
            'EWJ': 'ISHARES MSCI JAPAN ETF',
            'FXI': 'ISHARES CHINA LARGE-CAP ETF',
            'VGK': 'VANGUARD FTSE EUROPE ETF'
        },
        'Bonds': {
            'TLT': 'ISHARES 20+ YEAR TREASURY BOND ETF',
            'IEI': 'ISHARES 3-7 YEAR TREASURY BOND ETF',
            'LQD': 'ISHARES IBOXX $ INVESTMENT GRADE CORPORATE BOND ETF',
            'HYG': 'ISHARES IBOXX $ HIGH YIELD CORPORATE BOND ETF',
            'JNK': 'SPDR BLOOMBERG BARCLAYS HIGH YIELD BOND ETF',
            'BWX': 'SPDR BLOOMBERG BARCLAYS INTERNATIONAL TREASURY BOND ETF',
            'EMB': 'ISHARES JP MORGAN USD EMERGING MARKETS BOND ETF',
            'BNDX': 'VANGUARD TOTAL INTERNATIONAL BOND ETF'
        },
        'Fixed Income': {
            # 'CBU7': 'ISHARES USD CORPORATE BOND UCITS ETF',
            # 'IBTU': 'ISHARES CORE EURO CORPORATE BOND UCITS ETF',
            # 'IDTL': 'ISHARES $ TREASURY BOND 20+YEAR UCITS ETF',
            # 'IDTP': 'ISHARES $ TIPS 0-5 UCITS ETF',
            # 'IEMB': 'ISHARES J.P. MORGAN EM BOND UCITS ETF',
            # 'IMBS': 'ISHARES MORTGAGE BACKED SECURITIES UCITS ETF',
            'EMCR': 'EMERGING MARKETS CORPORATE BOND ETF',
            'FLOT': 'ISHARES FLOATING RATE BOND ETF',
            # 'IHYU': 'ISHARES EURO HIGH YIELD CORPORATE BOND UCITS ETF',
            # 'LQDE': 'ISHARES EURO CORPORATE BOND LARGE CAP UCITS ETF',
            # 'IUAG': 'ISHARES CORE U.S. AGGREGATE BOND ETF'
        },
        'Alternative Investments': {
            'VNQ': 'VANGUARD REAL ESTATE ETF',
            'IYR': 'ISHARES U.S. REAL ESTATE ETF',
            'DBC': 'INVESCO DB COMMODITY INDEX TRACKING FUND',
            'GSG': 'ISHARES S&P GSCI COMMODITY-INDEXED TRUST',
            'GLD': 'SPDR GOLD TRUST',
            'IAU': 'ISHARES GOLD TRUST',
            'SLV': 'ISHARES SILVER TRUST',
            'PALL': 'ABERDEEN STANDARD PHYSICAL PALLADIUM SHARES ETF',
            'QAI': 'IQ HEDGE MULTI-STRATEGY TRACKER ETF',
            # 'IGLN': 'ISHARES PHYSICAL GOLD ETC'
        },
        'Cash or Cash Equivalents': {
            'SHY': 'ISHARES 1-3 YEAR TREASURY BOND ETF',
            'BIL': 'SPDR BLOOMBERG BARCLAYS 1-3 MONTH T-BILL ETF'
        },
        'Sector-specific ETFs': {
            'XLK': 'TECHNOLOGY SELECT SECTOR SPDR FUND',
            'XLV': 'HEALTH CARE SELECT SECTOR SPDR FUND',
            'XLF': 'FINANCIAL SELECT SECTOR SPDR FUND'
        }
    }
    # Financial calculations
    # assets = [
    # 'SPY', 'IVV', 'MDY', 'IJH', 'IWM', 'IJR', 'EFA', 'VEA', 'EEM', 'VWO', 'ACWI',
    # 'TLT', 'IEI', 'LQD', 'HYG', 'JNK', 'BWX', 'EMB', 'BNDX', 'VNQ', 'IYR', 'DBC', 
    # 'GSG', 'GLD', 'IAU', 'SLV', 'PALL', 'QAI', 'SHY', 'BIL', 'XLK', 'XLV', 'XLF', 
    # 'VGK', 'AIA', 'EWJ', 'FXI', 'CSPX', 'CSUS', 'EDMU', 'IUIT', 'SPMV', 'EXCH', 
    # 'CBU7', 'IBTU', 'IDTL', 'IDTP', 'IEMB', 'IMBS', 'EMCR', 'FLOT', 'IHYU', 'LQDE', 'IUAG', 'IGLN'
    # ]  

    assets = [
    'SPY', 'IVV', 'MDY', 'IJH', 'IWM', 'IJR', 'EFA', 'VEA', 'EEM', 'VWO', 'ACWI',
    'TLT', 'IEI', 'LQD', 'HYG', 'JNK', 'BWX', 'EMB', 'BNDX', 'VNQ', 'IYR', 'DBC', 
    'GSG', 'GLD', 'IAU', 'SLV', 'PALL', 'QAI', 'SHY', 'BIL', 'XLK', 'XLV', 'XLF', 
    'VGK', 'AIA', 'EWJ', 'FXI', 'SPMV', 'EXCH', 
    'EMCR', 'FLOT'
    ]   
    data = yf.download(assets, start="2022-01-01", end=today.strftime('%Y-%m-%d'))['Adj Close']
    # data = download_stock_data(assets)
    returns = data.ffill().pct_change().dropna()

    # Normalize the risk score between 0 and 1
    min_score = 20
    max_score = 69
    normalized_score = (risk_score - min_score) / (max_score - min_score)

    # Portfolio optimization
    avg_score = 37
    std_dev_score = 6.40
    average_volatility = 0.10 + (avg_score - min_score) * (0.20 - 0.10) / (max_score - min_score)
    volatility_range = 0.025 * (std_dev_score / 6.40)
    target_volatility = average_volatility - volatility_range/2 + normalized_score * volatility_range

    ef = EfficientFrontier(expected_returns.mean_historical_return(data), risk_models.sample_cov(data))
    ef.add_objective(objective_functions.L2_reg)  # Regularization to prevent overfitting
    ef.efficient_risk(target_volatility)
    optimal_weights = ef.clean_weights()

    # MongoDB operations for portfolio
    portfolio_collection = db.portfolios
    existing_portfolio = portfolio_collection.find_one({"user_id": user_id, "portfolio_name": "automated"})

    # weights_data = [{"asset": asset, "weight": weight} for asset, weight in optimal_weights.items()]
    # After modification:
    weights_data = []
    for asset, weight in optimal_weights.items():
        if weight > 0:  # Check if the weight is greater than 0
            investment_type = get_investment_type(asset, investment_map)
            stock_name = get_asset_name_from_symbol(asset, investment_map)
            weights_data.append({
                "asset": asset, 
                "name": stock_name,
                "weight": weight,
                "investment_type": investment_type
            })
    portfolio_doc = {
        "user_id": user_id,
        "date_updated": today,
        "weights": weights_data
    }

    if not existing_portfolio:
        portfolio_doc["portfolio_name"] = "automated"
        portfolio_collection.insert_one(portfolio_doc)
    else:
        # portfolio_collection.update_one({"user_id": user_id}, {"$set": portfolio_doc})
        portfolio_collection.update_one({"user_id": user_id, "portfolio_name": "automated"}, {"$set": portfolio_doc})

    # Calculate daily portfolio returns based on weights
    weights = np.array([optimal_weights[asset] for asset in assets])
    daily_portfolio_returns = (returns * weights).sum(axis=1)
    daily_portfolio_return_today = daily_portfolio_returns.iloc[-1]

    # Update the portfolio value
    last_value = portfolio_value_over_time[-1]["value"]
    last_value = last_value * (1 + daily_portfolio_return_today)
    portfolio_value_over_time.append({"date": str(today), "value": last_value})

    
    # Portfolio return calculations
    portfolio_return = np.sum(expected_returns.mean_historical_return(data) * weights)
    portfolio_stddev = np.sqrt(np.dot(weights.T, np.dot(risk_models.sample_cov(data), weights)))
    risk_free_rate = 0.02  # Example risk-free rate
    sharpe_ratio = (portfolio_return - risk_free_rate) / portfolio_stddev
    portfolio_hist_return = [{"date": index.strftime('%Y-%m-%d'), "return": value} for index, value in daily_portfolio_returns.items()]


    benchmark_data = yf.download('SPY', start="2022-01-01", end=today.strftime('%Y-%m-%d'))['Adj Close']
    benchmark_returns = benchmark_data.pct_change().dropna()

    cov_matrix = np.cov(daily_portfolio_returns, benchmark_returns)
    covariance = cov_matrix[0, 1]
    # benchmark_returns = yf.download('SPY', start="2022-01-01", end=today.strftime('%Y-%m-%d'))['Adj Close'].pct_change().dropna()
    # covariance = np.cov(daily_portfolio_returns, benchmark_returns)[0, 1]
    variance = np.var(benchmark_returns)
    portfolio_beta = covariance / variance

    # Here, add the calculation for all-time returns
    portfolio_all_time_returns = (last_value - account_balance) / account_balance if account_balance else 0

    # Update or insert portfolio return in MongoDB
    portfolio_return_collection = db.portfolio_returns
    portfolio_return_doc = {
        "user_id": user_id,
        "date": today,
        "portfolio_name": "automated",
        "portfolio_return": portfolio_return,
        "portfolio_all_time_return": portfolio_all_time_returns,
        "portfolio_stddev": portfolio_stddev,
        "sharpe_ratio": sharpe_ratio,
        "portfolio_weights": weights_data,
        "portfolio_hist_return": portfolio_hist_return,
        "portfolio_value_over_time": portfolio_value_over_time,
        "current_portfolio_value": last_value,
        "profit_or_loss": last_value - account_balance,
        "portfolio_beta": portfolio_beta
    }

    # portfolio_return_collection.update_one({"user_id": user_id}, {"$set": portfolio_return_doc}, upsert=True)
    portfolio_return_collection.update_one({"user_id": user_id, "portfolio_name": "automated"}, {"$set": portfolio_return_doc}, upsert=True)

    print("Finished Portfolio function")
    print(portfolio_return)

    client.close()
    return {
        "portfolio_return": portfolio_return,
        "portfolio_all_time_return": portfolio_all_time_returns,
        "portfolio_stddev": portfolio_stddev,
        "sharpe_ratio": sharpe_ratio,
        "portfolio_weights": weights_data,
        "portfolio_hist_return": portfolio_hist_return,
        "portfolio_value_over_time": portfolio_value_over_time,
        "current_portfolio_value": last_value,
        "profit_or_loss": last_value - account_balance,
        "portfolio_beta": portfolio_beta
    }

def get_current_prices(symbols):
    """
    Fetch current prices for a list of symbols.
    :param symbols: List of asset symbols.
    :return: Dictionary of symbols to their current prices.
    """
    prices = {}
    for symbol in symbols:
        ticker = yf.Ticker(symbol)
        hist = ticker.history(period="1d")
        prices[symbol] = hist['Close'].iloc[-1]  # Assuming the latest closing price is the current price
    return prices

def update_portfolio_metrics(user_id, paper_trading_portfolio_name):
    print("Inside Paper Portfolio function")
    client = MongoClient("mongodb+srv://unniananya:Yayaya021.@cluster0.0zxo4wb.mongodb.net/fyp?retryWrites=true&w=majority")
    db = client["fyp"]
    paper_trading_portfolio_collection = db.paper_trading_portfolio

    # Fetching portfolio based on both user_id and paper_trading_portfolio_name
    user_portfolio = paper_trading_portfolio_collection.find_one({"user_id": user_id, "portfolio_name": paper_trading_portfolio_name})
    if not user_portfolio:
        print("User portfolio not found")
        client.close()
        return {"error": "User portfolio not found"}

    current_assets = user_portfolio.get('current_assets', [])
    symbols = [asset['symbol'] for asset in current_assets]


    # Assuming 'money_in_portfolio' is stored within user_portfolio document
    money_in_portfolio = user_portfolio.get('money_in_portfolio', [])
    if money_in_portfolio:
        # Extract the amount from the last object in the 'money_in_portfolio' list
        net_portfolio_deposit = money_in_portfolio[-1].get('amount', 0)
        print("New portfolio deposit:", net_portfolio_deposit)
    else:
        net_portfolio_deposit = 0
        print("No deposit records found.")

    creation_date_str = user_portfolio['money_in_portfolio'][0]['date']
    creation_date = datetime.strptime(creation_date_str, '%Y-%m-%d %H:%M:%S')
    # creation_date = creation_date.strftime('%Y-%m-%d')
    print("creation_date: ", creation_date)

    # Fetch current prices for all symbols
    current_prices = get_current_prices(symbols)

    # Calculate total value based on current prices and quantities
    total_value = sum(asset['quantity'] * current_prices[asset['symbol']] for asset in current_assets if asset['symbol'] in current_prices)

    # Assuming weights based on current value for each asset
    asset_weights = {asset['symbol']: (asset['quantity'] * current_prices[asset['symbol']]) / total_value for asset in current_assets}

    # Fetch historical data for symbols to calculate returns and volatility
    start_date = datetime.today() - timedelta(days=365 * 5)  # 5 years lookback
    end_date = datetime.today()
    data = yf.download(symbols, start=start_date, end=end_date)['Adj Close']
    returns = data.pct_change().dropna()
    print("returns: ", returns)


    # Calculate portfolio metrics based on the new methodology
    portfolio_returns = np.sum(returns.mean() * 252 * list(asset_weights.values()))  # Annualized expected portfolio return
    portfolio_variance = np.dot(list(asset_weights.values()), np.dot(returns.cov() * 252, list(asset_weights.values())))
    portfolio_stddev = np.sqrt(portfolio_variance)  # Annualized portfolio standard deviation
    risk_free_rate = 0.02  # Placeholder for risk-free rate
    sharpe_ratio = (portfolio_returns - risk_free_rate) / portfolio_stddev if portfolio_stddev else 0
    print("sharpe_ratio: ", sharpe_ratio)
    

    # Update or insert portfolio metrics in MongoDB
    today_str = datetime.today().strftime('%Y-%m-%d')
    portfolio_value_over_time = user_portfolio.get('portfolio_value_over_time', [])
    portfolio_value_over_time.append({"date": today_str, "value": total_value})
    print("portfolio_value_over_time: ", portfolio_value_over_time)

    # Calculate CAGR
    years = (datetime.today() - creation_date).days / 365.25
    if years > 0:
        cagr = ((total_value / net_portfolio_deposit) ** (1 / years)) - 1
    else:
        cagr = 0
    
    print("cagr: ", cagr)

    # Here, add the calculation for all-time returns
    portfolio_all_time_returns = (total_value - net_portfolio_deposit) / net_portfolio_deposit if net_portfolio_deposit else 0

    paper_trading_portfolio_collection.update_one(
        {"user_id": user_id, "portfolio_name": paper_trading_portfolio_name},
        {"$set": {
            "current_portfolio_value": total_value,
            "portfolio_return": portfolio_returns,
            "portfolio_all_time_returns": portfolio_all_time_returns,
            "portfolio_stddev": portfolio_stddev,
            "sharpe_ratio": sharpe_ratio,
            "portfolio_value_over_time": portfolio_value_over_time,
            "profit_or_loss": total_value - net_portfolio_deposit,
            "cagr": cagr
        }},
        upsert=True
    )

    client.close()
    print("Finished Paper Portfolio function")

    return {
        "success": True,
        "current_portfolio_value": total_value,
        "portfolio_return": portfolio_returns,
        "portfolio_all_time_returns": portfolio_all_time_returns,
        "portfolio_stddev": portfolio_stddev,
        "sharpe_ratio": sharpe_ratio,
        "profit_or_loss": total_value - net_portfolio_deposit,
        "cagr": cagr
    }