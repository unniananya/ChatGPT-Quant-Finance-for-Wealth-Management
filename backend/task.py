from app import run_portfolio_optimization, run_paper_trading_portfolio_optimization
# from portfolio import get_user_scores_from_token, portfolio_optimization
import logging
from flask_pymongo import MongoClient


def get_valid_portfolio_details():
    # Initialize MongoDB connection
    client = MongoClient("MONGODB_CONNECT")
    db = client["fyp"]
    collection = db["portfolios"]  # Adjusted to the portfolios collection

    # Define the query condition (initial_deposit is not -1 and weights array is not empty)
    query = {"$and": [{"initial_deposit": {"$ne": -1}}, {"weights": {"$ne": [], "$exists": True}}]}

    # Retrieve user_ids and portfolio_names that meet the condition
    portfolios = collection.find(query, projection=["user_id", "portfolio_name"])

    # Process the query result to extract user IDs and portfolio names
    user_portfolio_details = [{"user_id": portfolio["user_id"], "portfolio_name": portfolio["portfolio_name"]} for portfolio in portfolios]

    # Close the MongoDB connection
    client.close()

    return user_portfolio_details


def get_user_ids_with_valid_initial_amount():
    # Initialize MongoDB connection
    client = MongoClient("MONGODB_CONNECT")
    db = client["fyp"]
    collection = db["users"]

    # Define the query condition (initial amount is not -1)
    query = {"initial_deposit": {"$ne": -1}}

    # Retrieve user IDs that meet the condition
    user_ids = [user["_id"] for user in collection.find(query, projection=["_id"])]

    # Close the MongoDB connection
    client.close()

    return user_ids


def get_all_paper_trading_user_ids_and_portfolio_names():
    # Initialize MongoDB connection
    client = MongoClient("MONGODB_CONNECT")
    db = client["fyp"]
    collection = db["paper_trading_portfolio"]

    # Use MongoDB aggregation to group by user_id and portfolio_name
    pipeline = [
        {"$group": {"_id": {"user_id": "$user_id", "portfolio_name": "$portfolio_name"}}},
        {"$project": {"user_id": "$_id.user_id", "portfolio_name": "$_id.portfolio_name", "_id": 0}}
    ]
    result = list(collection.aggregate(pipeline))

    # Close the MongoDB connection
    client.close()

    return result

if __name__ == "__main__":
    logging.info('Script started')

    all_paper_user_ids_names = get_all_paper_trading_user_ids_and_portfolio_names()

    # Use the get_valid_portfolio_details function and run portfolio optimization for each
    valid_portfolios = get_valid_portfolio_details()

    for portfolio in valid_portfolios:
        print("User ID:", portfolio['user_id'])
        print("Portfolio Name:", portfolio['portfolio_name'])
        run_portfolio_optimization(portfolio['user_id'], portfolio['portfolio_name'])

    for user_portfolio in all_paper_user_ids_names:
        user_id = user_portfolio['user_id']
        portfolio_name = user_portfolio['portfolio_name']
        
        print(f"User ID: {user_id}, Paper Portfolio Name: {portfolio_name}")
        print(type(user_id))

        run_paper_trading_portfolio_optimization(user_id, portfolio_name)
