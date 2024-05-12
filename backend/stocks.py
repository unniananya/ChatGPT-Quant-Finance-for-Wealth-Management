from app import mongo
import requests
import time
import openai
FINNHUB_API_KEY = FINNHUB_API
FINNHUB_BASE_URL = 'https://finnhub.io/api/v1'



def get_unique_asset_classes():
    try:
        # Use the distinct method to find all unique assetClass values
        unique_asset_classes = mongo.db.stocks.distinct("assetClass")
        return unique_asset_classes
    except Exception as e:
        print(f"An error occurred: {e}")
        return []

def insert_stock_info(FINNHUB_API_KEY):
    url = "https://finnhub.io/api/v1/stock/symbol"
    params = {
        "exchange": "US",  # Modify this to your target exchange if needed
        "token": FINNHUB_API_KEY
    }
    
    response = requests.get(url, params=params)
    if response.status_code == 200:
        stocks = response.json()
        # Filter out to only include necessary fields
        filtered_stocks = [
            {"symbol": stock["symbol"], "name": stock.get("description", ""), "type": stock.get("type", "")}
            for stock in stocks
        ]
        
        # Insert filtered stock information into MongoDB collection
        if filtered_stocks:  # Ensure there's data to insert
            mongo.db.stocks.insert_many(filtered_stocks)
            print(f"Inserted {len(filtered_stocks)} records into the database.")
        else:
            print("No data to insert.")
    else:
        print("Failed to fetch data:", response.status_code)

def insert_commodity_info():
    api_key = "ZR1u6YqX7FqZEoonsZRcZIbYu4PmP8fD"
    url = "https://financialmodelingprep.com/api/v3/symbol/available-commodities"
    params = {"apikey": api_key}
    
    response = requests.get(url, params=params)
    if response.status_code == 200:
        commodities = response.json()
        # Initialize a list to hold commodities that don't exist in the DB
        new_commodities = []
        for commodity in commodities:
            # Check if the commodity symbol already exists in the collection
            exists = mongo.db.stocks.find_one({"symbol": commodity["symbol"]})
            if not exists:
                # If it doesn't exist, prepare it for insertion
                new_commodity = {"symbol": commodity["symbol"], "name": commodity["name"], "type": "Commodities"}
                new_commodities.append(new_commodity)
        
        # Insert new commodities into MongoDB collection
        if new_commodities:  # Ensure there's new data to insert
            mongo.db.stocks.insert_many(new_commodities)
            print(f"Inserted {len(new_commodities)} new commodity records into the database.")
        else:
            print("No new commodities to insert or all commodities already exist in the database.")
    else:
        print(f"Failed to fetch data: {response.status_code}")

def insert_cryptocurrency_info():
    api_key = "ZR1u6YqX7FqZEoonsZRcZIbYu4PmP8fD"
    url = "https://financialmodelingprep.com/api/v3/symbol/available-cryptocurrencies"
    params = {"apikey": api_key}
    
    response = requests.get(url, params=params)
    if response.status_code == 200:
        cryptocurrencies = response.json()
        # Initialize a list to hold cryptocurrencies that don't exist in the DB
        new_cryptocurrencies = []
        for cryptocurrency in cryptocurrencies:
            # Check if the cryptocurrency symbol already exists in the collection
            exists = mongo.db.stocks.find_one({"symbol": cryptocurrency["symbol"]})
            if not exists:
                # If it doesn't exist, prepare it for insertion
                new_cryptocurrency = {
                    "symbol": cryptocurrency["symbol"],
                    "name": cryptocurrency["name"],
                    "type": "Cryptocurrencies"
                }
                new_cryptocurrencies.append(new_cryptocurrency)
        
        # Insert new cryptocurrencies into MongoDB collection
        if new_cryptocurrencies:  # Ensure there's new data to insert
            mongo.db.stocks.insert_many(new_cryptocurrencies)
            print(f"Inserted {len(new_cryptocurrencies)} new cryptocurrency records into the database.")
        else:
            print("No new cryptocurrencies to insert or all cryptocurrencies already exist in the database.")
    else:
        print(f"Failed to fetch data: {response.status_code}")


def insert_etf_info():
    api_key = "ZR1u6YqX7FqZEoonsZRcZIbYu4PmP8fD"
    url = "https://financialmodelingprep.com/api/v3/etf/list"
    params = {"apikey": api_key}
    
    response = requests.get(url, params=params)
    if response.status_code == 200:
        etfs = response.json()
        # Initialize a list to hold ETFs that don't exist in the DB
        new_etfs = []
        for etf in etfs:
            # Check if the ETF symbol already exists in the collection
            exists = mongo.db.stocks.find_one({"symbol": etf["symbol"]})
            if not exists:
                # If it doesn't exist, prepare it for insertion
                new_etf = {
                    "symbol": etf["symbol"],
                    "name": etf["name"],
                    "type": "ETFs"
                }
                new_etfs.append(new_etf)
        
        # Insert new ETFs into MongoDB collection
        if new_etfs:  # Ensure there's new data to insert
            mongo.db.stocks.insert_many(new_etfs)
            print(f"Inserted {len(new_etfs)} new ETF records into the database.")
        else:
            print("No new ETFs to insert or all ETFs already exist in the database.")
    else:
        print(f"Failed to fetch data: {response.status_code}")

def update_asset_class():
    # Fetch all documents from the collection
    documents = mongo.db.stocks.find()

    for doc in documents:
        # Initialize asset_class as 'Others' by default
        asset_class = 'Others'
        
        # Safely get the document's type
        doc_type = doc.get('type')
        
        # Define a safe way to access the name, defaulting to an empty string if None
        doc_name = doc.get('name') if doc.get('name') is not None else ''
        
        if doc_type in ['Common Stock', 'Preference', 'ADR', 'GDR', 'NY Reg Shrs', 'Foreign Sh.', 'NVDR', 'CDI', 'Dutch Cert', 'Savings Share', 'Tracking Stk', 'Equity WRT']:
            asset_class = 'Stocks'
        elif doc_type == 'Cryptocurrencies':
            asset_class = 'Cryptocurrencies'
        elif doc_type == 'Commodities':
            asset_class = 'Commodities'
        elif doc_type in ['Receipt', 'Right']:
            asset_class = 'Cash and Cash Equivalents'
        elif doc_type == 'REIT':
            asset_class = 'Real Estate'
        elif doc_type in ['Closed-End Fund', 'Open-End Fund', 'ETP', 'Ltd Part', 'Misc.', 'Stapled Security', 'Royalty Trst', 'SDR', 'Unit', '', None]:
            asset_class = 'Others'
        elif doc_type == 'ETFs':
            # Check if 'Bond' or 'Bonds' is in the name, handling NoneType safely
            if 'Bond' in doc_name or 'Bonds' in doc_name:
                asset_class = 'Bonds'
            else:
                asset_class = 'Stocks'

        # Update the document with the determined asset_class
        mongo.db.stocks.update_one(
            {"_id": doc["_id"]},
            {"$set": {"asset_class": asset_class}}
        )
        print(f"Updated document {doc['_id']} with asset_class '{asset_class}'.")

def remove_documents_with_none_fields():
    # Define the query to match documents with any of the specified fields set to None
    query = {
        "$or": [
            {"name": None},
            {"symbol": None},
            {"type": None},
            {"asset_class": None}
        ]
    }
    
    # Perform the deletion operation
    result = mongo.db.stocks.delete_many(query)
    
    # Print out the result of the deletion operation
    print(f"Deleted {result.deleted_count} documents with None in 'name', 'symbol', 'type', or 'asset_class'.")


def classify_etf(etf_symbol, etf_name):
    # Define your system message that explains the task to the model with specific output format instructions
    system_message = """
    The following is a list of ETF categories: International Stocks, Emerging Markets, Intermediate Bonds, International Bonds, Cash, Commodities, REITs, Total Stock Market, Long Term Bonds, Short Term Bonds, Gold, Large Cap Value, Small Cap Value, International Large Cap Value, International Large Cap Blend, International Small Cap Value, International Small Cap Blend, Small Cap Growth, International Stocks, International Bonds, World Developed Stocks, Emerging Market Stocks, World Developed Intermediate Bonds, Cash.
    
    Determine which category or categories the given ETF belongs to based on its symbol and name. Provide the categories as a list separated by commas. For example, if an ETF falls under both 'Large Cap Blend' and 'International Bonds', you should respond with: Large Cap Blend, International Bonds. You can have just one category or more than 1 seperated by commas. If it does not fit any category, respond with: Other.
    """

    # User message would be the ETF symbol and name
    user_message = f"ETF Symbol: {etf_symbol}, ETF Name: {etf_name}"

    try:

        # Using OpenAI's API to classify the ETF
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo-0125",
            messages=[
                {"role": "system", "content": system_message},
                {"role": "user", "content": user_message}
            ]
        )

        # Assuming the response returns a string of categories, we need to parse it into a list
        categories_str = response.choices[0].message['content'].strip()
        # Split the categories by comma and strip whitespace
        categories_list = [category.strip() for category in categories_str.split(',')]
        return categories_list
    
    except openai.error.RateLimitError as e:
        print(f"Rate limit reached. Sleeping for 60 seconds. {str(e)}")
        print("etf_symbol: ", etf_symbol)
        time.sleep(60)  # Sleep for 60 seconds before retrying
        return classify_etf(etf_symbol, etf_name)  # Recursively retry the request after the wait


    # Function to get all ETFs, classify them, and update the documents
def update_etf_classifications():
    stocks_collection = mongo.db.stocks
    etfs = stocks_collection.find({"type": "ETFs"})  # Query to find all ETFs in the collection

    for etf in etfs:
        symbol = etf['symbol']
        name = etf['name']
        # Classify the ETF
        asset_types = classify_etf(symbol, name)
        # Update the ETF document with the classification list
        stocks_collection.update_one(
            {"_id": etf['_id']}, 
            {"$set": {"portfolio_asset_types": asset_types}}
        )

def update_etf_classifications1():
    stocks_collection = mongo.db.stocks
    # Query to find all ETFs that do not have the 'portfolio_asset_types' field
    etfs = stocks_collection.find({"type": "ETFs", "portfolio_asset_types": {"$exists": False}})

    for etf in etfs:
        symbol = etf['symbol']
        name = etf['name']
        # Classify the ETF
        asset_types = classify_etf(symbol, name)
        print("asset_types: ", asset_types)
        # Update the ETF document with the classification list
        stocks_collection.update_one(
            {"_id": etf['_id']}, 
            {"$set": {"portfolio_asset_types": asset_types}}
        )
        time.sleep(1)  # Sleep for 1 second to avoid hitting the rate limit


def classify_others(symbol, name, type):
    # Define your system message that explains the task to the model with specific output format instructions
    system_message = """
    The following is a list of categories: International Stocks, Emerging Markets, Intermediate Bonds, International Bonds, Cash, Commodities, REITs, Total Stock Market, Long Term Bonds, Short Term Bonds, Gold, Large Cap Value, Small Cap Value, International Large Cap Value, International Large Cap Blend, International Small Cap Value, International Small Cap Blend, Small Cap Growth, International Stocks, International Bonds, World Developed Stocks, Emerging Market Stocks, World Developed Intermediate Bonds, Cash.
    
    Determine which category or categories the given asset belongs to based on its symbol and name. Provide the categories as a list separated by commas. For example, if it falls under both 'Large Cap Blend' and 'International Bonds', you should respond with: Large Cap Blend, International Bonds. You can have just one category or more than 1 seperated by commas. If it does not fit any category, respond only with: Other.
    """

    # User message would be the ETF symbol and name
    user_message = f"Asset Symbol: {symbol}, Asset Name: {name}, Asset Type: {type}"

    try:

        # Using OpenAI's API to classify the ETF
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo-0125",
            messages=[
                {"role": "system", "content": system_message},
                {"role": "user", "content": user_message}
            ]
        )

        # Assuming the response returns a string of categories, we need to parse it into a list
        categories_str = response.choices[0].message['content'].strip()
        # Split the categories by comma and strip whitespace
        categories_list = [category.strip() for category in categories_str.split(',')]
        return categories_list
    
    except openai.error.RateLimitError as e:
        print(f"Rate limit reached. Sleeping for 60 seconds. {str(e)}")
        print("symbol: ", symbol)
        time.sleep(60)  # Sleep for 60 seconds before retrying
        return classify_others(symbol, name, type)  # Recursively retry the request after the wait

def update_others_classifications():
    stocks_collection = mongo.db.stocks
    # Query to find all ETFs that do not have the 'portfolio_asset_types' field
    etfs = stocks_collection.find({"asset_class": "Others", "portfolio_asset_types": {"$exists": False}})

    for etf in etfs:
        symbol = etf['symbol']
        name = etf['name']
        type = etf['type']
        # Classify the ETF
        asset_types = classify_others(symbol, name, type)
        print("asset_types: ", asset_types)
        # Update the ETF document with the classification list
        stocks_collection.update_one(
            {"_id": etf['_id']}, 
            {"$set": {"portfolio_asset_types": asset_types}}
        )
        time.sleep(1)  # Sleep for 1 second to avoid hitting the rate limit


def classify_stocks(symbol, name, type):
    # Define your system message that explains the task to the model with specific output format instructions
    system_message = """
    The following is a list of Stock categories: International Stocks, Emerging Markets, Cash, US Stock, Large Cap Value, Small Cap Value, International Large Cap Value, International Large Cap Blend, International Small Cap Value, International Small Cap Blend, Small Cap Growth, World Developed Stocks.
    
    Determine which category or categories the given Stock belongs to based on its symbol and name. Provide the categories as a list separated by commas. For example, if an Stock falls under both 'Emerging Markets' and 'International Stocks', you should respond with: Emerging Markets, International Stocks. You can have just one category or more than 1 seperated by commas. If it does not fit any category, respond only with: US Stock.
    """

    # User message would be the ETF symbol and name
    user_message = f"Stock Symbol: {symbol}, Stock Name: {name}, Stock Type: {type}"

    try:

        # Using OpenAI's API to classify the ETF
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo-0125",
            messages=[
                {"role": "system", "content": system_message},
                {"role": "user", "content": user_message}
            ]
        )

        # Assuming the response returns a string of categories, we need to parse it into a list
        categories_str = response.choices[0].message['content'].strip()
        # Split the categories by comma and strip whitespace
        categories_list = [category.strip() for category in categories_str.split(',')]
        return categories_list
    
    except openai.error.RateLimitError as e:
        print(f"Rate limit reached. Sleeping for 60 seconds. {str(e)}")
        print("stock_symbol: ", symbol)
        time.sleep(60)  # Sleep for 60 seconds before retrying
        return classify_stocks(symbol, name, type)  # Recursively retry the request after the wait


def update_stocks_classifications():
    stocks_collection = mongo.db.stocks
    # Query to find all ETFs that do not have the 'portfolio_asset_types' field
    etfs = stocks_collection.find({"asset_class": "Stocks", "portfolio_asset_types": {"$exists": False}})

    for etf in etfs:
        symbol = etf['symbol']
        name = etf['name']
        type = etf['type']
        # Classify the ETF
        asset_types = classify_stocks(symbol, name, type)
        print("asset_types: ", asset_types)
        # Update the ETF document with the classification list
        stocks_collection.update_one(
            {"_id": etf['_id']}, 
            {"$set": {"portfolio_asset_types": asset_types}}
        )
        time.sleep(1)  # Sleep for 1 second to avoid hitting the rate limit

def print_stocks_with_asset_type(asset_type_member):
    # Query for stocks that contain the specified member in their portfolio_asset_types
    stocks = mongo.db.stocks.find({
        "portfolio_asset_types": asset_type_member
    })

    # Print the symbol, name, type, and asset class of each stock
    for stock in stocks:
        symbol = stock.get('symbol', 'N/A')
        name = stock.get('name', 'N/A')
        stock_type = stock.get('type', 'N/A')
        asset_class = stock.get('asset_class', 'N/A')
        print(f"Symbol: {symbol}, Name: {name}, Type: {stock_type}, Asset Class: {asset_class}")

def get_unique_portfolio_asset_types():
    stocks_collection = mongo.db.stocks

    # Initialize a set to store unique asset types
    unique_asset_types = set()

    # Query the collection for all documents with the 'portfolio_asset_types' field
    results = stocks_collection.find({'portfolio_asset_types': {'$exists': True}}, {'portfolio_asset_types': 1})

    # Iterate over the query results and update the set with unique asset types
    for document in results:
        if 'portfolio_asset_types' in document:
            unique_asset_types.update(document['portfolio_asset_types'])

    # Convert the set to a list and return it
    return list(unique_asset_types)


def clean_portfolio_asset_types():
    # Dictionary to map incorrect values to corrected ones
    corrections = {
        # "Gold.": "Gold",
        # "International Stocks.": "International Stocks",
        # "Social": "ESG",
        # "Commodites": "Commodities",
        # "Use specific sector not listed": "Other",
        # "Preferred Stock": "Total Stock Market",
        # "Intermediate Bonds.": "Intermediate Bonds",
        # "REITs": "Real Estate",
        # "U.S. Stock": "Total Stock Market",
        # "International Large Cap Blend.": "International Large Cap Blend",
        # "which represents ownership in the shares of a foreign company trading on US financial markets. In this case": "International Stocks",
        # "International Stocks\n\nThe given stock symbol and name belong to the category of International Stocks.": "International Stocks",
        # "International Stocks\n\nNote: ADR stands for American Depositary Receipt": "International Stocks",
        # "Silver": "Commodities",
        # "Emerging Markets.": "Emerging Markets",
        # '"SHALY" (SHANGRI-LA ASIA LTD SPON ADR) falls under the category of International Stocks.': "International Stocks",
        # "World Developed Stocks.": "World Developed Stocks",
        # "Short Term Bonds.": "Short Term Bonds",
        # "this asset falls under: Other.": "Other",
        # "US Stock.": "Total Stock Market",
        # "Real Estate Investment Trusts (REITs)": "Real Estate",
        # "International Bonds.": "International Bonds",
        # "Socially responsible investing is typically associated with the ESG (Environmental": "ESG",
        # "Commodities.": "Commodities",
        # "Emerging Market Stocks": "Emerging Markets",
        # "REIT": "Real Estate",
        # "Other.": "Other",
        # "ESG (Ethically Conscious)": "ESG",
        # "_US Stock": "Total Stock Market",
        # "Cash": "Cash and Cash Equivalents",
        # "ADR": "Other",
        # "Cash.": "Cash and Cash Equivalents",
        # "US Stock": "Total Stock Market",
        # "World Kinect Corp would fall under the category of World Developed Stocks.": "World Developed Stocks",
        # "and Governance) category. Therefore": "Other",
        # "US Stocks": "Total Stock Market",
        # "Global X SuperDividend ETF falls under the category: Emerging Markets.": "Emerging Markets",
        # "Categorized as: US Stock": "Total Stock Market",
        # "World Developed Intermediate Bonds": "Intermediate Bonds",
        # "Technology": "Technology Stocks",
        # "High Yield Bonds": "Other"
        "Global": "World Developed Stocks",
        "Adulting Bonds": "Long Term Bonds",
        "Corporate Bonds": "Intermediate Bonds",
        "Value Stocks": "Emerging Markets",
        "European Stocks": "Small Cap Blend",
        "Large Cap": "Large Cap Blend",
        "Mid Cap Stocks": "Total Stock Market",
        "Large Cap Stocks": "Large Cap Blend",
        "Technology Stocks": "World Developed Stocks",
        "Dividend Stocks": "Emerging Markets",
        "International Mid Cap Blend": "World Developed Stocks",
        "International Large Cap Growth": "Large Cap Growth",
        "International Small Cap Growth": "Small Cap Growth",
        "Small Cap Stocks": "Small Cap Blend",
        "High Yield Bonds": "Other"

    }

    # Query all documents in the collection
    stocks = mongo.db.stocks.find()

    # Iterate over all documents
    for stock in stocks:
        # Check if the portfolio_asset_types field exists
        if 'portfolio_asset_types' in stock:
            updated_asset_types = []
            # Iterate over all types in portfolio_asset_types
            for asset_type in stock['portfolio_asset_types']:
                # Check if the asset type needs to be corrected
                if asset_type in corrections:
                    updated_asset_types.append(corrections[asset_type])
                else:
                    updated_asset_types.append(asset_type)

            # Update the document with corrected portfolio_asset_types
            mongo.db.stocks.update_one(
                {'_id': stock['_id']},
                {'$set': {'portfolio_asset_types': updated_asset_types}}
            )


def find_symbols_without_portfolio_asset_types():
    coll = mongo.db.stocks

    # Query to find documents where `portfolio_asset_types` does not exist
    query = {'portfolio_asset_types': {'$exists': False}}
    
    # Find the documents and return only the 'symbol' field
    documents = coll.find(query, {'symbol': 1, '_id': 0})

    # Extract the symbols from the documents
    symbols = [doc['symbol'] for doc in documents]

    return symbols


def update_portfolio_asset_types():
    # Connect to the MongoDB database
    coll = mongo.db.stocks

    # Define the asset classes you want to check for
    asset_classes = ['Cryptocurrencies', 'Commodities', 'Real Estate', 'Cash and Cash Equivalents']

    # Iterate over the asset classes and update documents
    for asset_class in asset_classes:
        # Find documents where the asset_class matches and update them
        coll.update_many(
            {'asset_class': asset_class},
            {'$addToSet': {'portfolio_asset_types': asset_class}}
        )
