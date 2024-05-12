from flask import Flask
from flask_pymongo import PyMongo
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy.dialects.postgresql import JSON

def create_user(mongo, username, password, first_name, last_name, date_of_birth, email, phone_no):
    user_collection = mongo.db.users
    user = {
        "username": username,
        "password_hash": generate_password_hash(password),
        "first_name": first_name,
        "last_name": last_name,
        "date_of_birth": date_of_birth,
        "email": email,
        "phone_no": phone_no,
        "initial_deposit": -1.0,
        "account_balance": 0.0,
        "profile_pic": None
    }
    return user_collection.insert_one(user).inserted_id

def get_user(mongo, username):
    user_collection = mongo.db.users
    return user_collection.find_one({"username": username})

def check_user_password(mongo, username, password):
    user = get_user(mongo, username)
    if user and check_password_hash(user["password_hash"], password):
        return True
    return False

# def create_response(mongo, user_id, score):
#     response_collection = mongo.db.responses
#     response = {
#         "user_id": user_id,
#         "score": score
#     }
#     return response_collection.insert_one(response).inserted_id


def create_response(mongo, user_id, score):
    response_collection = mongo.db.responses
    response = {
        "user_id": user_id,
        "score": score
    }
    # Update the document with the new score, or insert a new document if one doesn't exist
    result = response_collection.update_one(
        {"user_id": user_id},  # Query to find the document
        {"$set": response},    # Update the score or set it if the document is new
        upsert=True            # If the document doesn't exist, insert it
    )
    # If it was an upsert and a new document was created, return the new id
    if result.upserted_id:
        return result.upserted_id
    else:
        # Otherwise, return the match count (which should be 1 if the document existed)
        return result.matched_count

def create_portfolio(mongo, user_id, portfolio_name, weights):
    portfolio_collection = mongo.db.portfolios
    portfolio = {
        "user_id": user_id,
        "date_updated": datetime.now(),
        "portfolio_name": portfolio_name,
        "template": "no template",
        "summary": "no summary",
        "initial_deposit": -1.0,
        "account_balance": 0.0,
        "weights": weights
    }
    return portfolio_collection.insert_one(portfolio).inserted_id

def create_transaction(mongo, user_id, portfolio_name, amount, transaction_type):
    transaction_collection = mongo.db.transactions
    transaction = {
        "user_id": user_id,
        "portfolio_name": portfolio_name,
        "amount": amount,
        "timestamp": datetime.now(),
        "type": transaction_type
    }
    return transaction_collection.insert_one(transaction).inserted_id


# delete later no use
def create_portfolio_value(mongo, user_id, value):
    portfolio_value_collection = mongo.db.portfolio_values
    portfolio_value = {
        "user_id": user_id,
        "date": datetime.now(),
        "value": value
    }
    return portfolio_value_collection.insert_one(portfolio_value).inserted_id


def create_user_goals(mongo, user_id, name, amount, target_date, priority, amount_progress):
    user_goals_collection = mongo.db.user_goals
    progress_percentage = (float(amount_progress) / float(amount)) * 100  # Calculate the percentage progress

    user_goals = {
        "user_id": user_id,
        "date": datetime.now(),
        "name": name,
        "amount": amount,
        "target_date": target_date,
        # "repeated": repeated,
        "priority": priority,
        "progress": [
            {
                "date": datetime.now(),
                "amount_progress": amount_progress,
                "progress_percentage": progress_percentage
            }
        ],
        "completed": "No",
        "date_completed": None,
        "state": "In Progress"
    }
    return user_goals_collection.insert_one(user_goals).inserted_id

def get_all_current_user_goals(mongo, user_id):
    user_goals_collection = mongo.db.user_goals  # Assuming 'goals' is your collection name
    user_goals = user_goals_collection.find({"user_id": user_id, "completed": "No"})
    return list(user_goals)

def get_all_successful_user_goals(mongo, user_id):
    user_goals_collection = mongo.db.user_goals  # Assuming 'goals' is your collection name
    user_goals = user_goals_collection.find({"user_id": user_id, "completed": "Yes", "state": "Successful"})
    return list(user_goals)

def get_all_failed_user_goals(mongo, user_id):
    user_goals_collection = mongo.db.user_goals  # Assuming 'goals' is your collection name
    user_goals = user_goals_collection.find({"user_id": user_id, "completed": "Yes", "state": "Failed"})
    return list(user_goals)

def create_portfolio_return(mongo, user_id, portfolio_name, portfolio_return, portfolio_stddev, sharpe_ratio, 
                            portfolio_weights, portfolio_hist_return, portfolio_value_over_time,
                            current_portfolio_value, profit_or_loss):
    portfolio_return_collection = mongo.db.portfolio_returns
    portfolio_return_doc = {
        "user_id": user_id,
        "date": datetime.now(),
        "portfolio_name": portfolio_name,
        "portfolio_return": portfolio_return,
        "portfolio_stddev": portfolio_stddev,
        "sharpe_ratio": sharpe_ratio,
        "portfolio_weights": portfolio_weights,
        "portfolio_hist_return": portfolio_hist_return,
        "portfolio_value_over_time": portfolio_value_over_time,
        "current_portfolio_value": current_portfolio_value,
        "profit_or_loss": profit_or_loss
    }
    return portfolio_return_collection.insert_one(portfolio_return_doc).inserted_id


def create_chat_message(mongo, user_id, topic, content, sender, message):
    chat_collection = mongo.db.chat_messages  # This collection will store individual chat messages
    chat_message = {
        "user_id": user_id,
        "date": datetime.now(),
        "topic": topic,
        "content": content,
        "sender": sender,  # 'user' for the user, 'system' for ChatGPT or system messages
        "message": message
    }
    return chat_collection.insert_one(chat_message).inserted_id

def delete_chat_messages_by_content(mongo, user_id, content):
    chat_collection = mongo.db.chat_messages
    delete_result = chat_collection.delete_many({"user_id": user_id, "content": content})
    return delete_result.deleted_count  # Returns the count of documents deleted

def get_user_chat_messages(mongo, user_id):
    chat_collection = mongo.db.chat_messages
    chats = chat_collection.find({"user_id": user_id})
    return list(chats)
    # return list(chat_collection.find({"user_id": user_id}).sort("date", 1))

def get_user_chat_messages_by_content(mongo, user_id, content_name):
    chat_collection = mongo.db.chat_messages
    # Filter by user_id and content_name
    chats = chat_collection.find({"user_id": user_id, "content": content_name})
    return list(chats)

def create_learn_progress(mongo, user_id, topic, content, rank):
    learn_progress_collection = mongo.db.learn_progress
    learn_progress = {
        "user_id": user_id,
        "topic": topic,
        "content": content,
        "rank": rank,
        "finished": "No",
        "finished_date": None
    }
    return learn_progress_collection.insert_one(learn_progress).inserted_id

def update_learn_progress(mongo, user_id, topic, content):
    learn_progress_collection = mongo.db.learn_progress
    update_result = learn_progress_collection.update_one(
        {"user_id": user_id, "topic": topic, "content": content},
        {"$set": {"finished": "Yes", "finished_date": datetime.now()}}
    )
    return update_result.modified_count  # Returns the count of documents modified



def create_paper_trading_portfolio(mongo, user_id, portfolio_name, portfolio_template, current_cash_value, current_portfolio_value, money_in_portfolio, portfolio_value_over_time, portfolio_return, portfolio_stddev, sharpe_ratio, profit_or_loss, current_assets):
    paper_trading_portfolio_collection = mongo.db.paper_trading_portfolio
    paper_trading_portfolio_doc = {
        "user_id": user_id,
        "date": datetime.now(),
        "portfolio_name": portfolio_name,
        "portfolio_template": portfolio_template, 
        "current_cash_value": current_cash_value,
        "current_portfolio_value": current_portfolio_value,
        "money_in_portfolio": money_in_portfolio, #array
        "portfolio_value_over_time": portfolio_value_over_time, #array
        "portfolio_return": portfolio_return,
        "portfolio_stddev": portfolio_stddev,
        "sharpe_ratio": sharpe_ratio,
        "profit_or_loss": profit_or_loss,
        "current_assets": current_assets #array
    }
    return paper_trading_portfolio_collection.insert_one(paper_trading_portfolio_doc).inserted_id

def create_user_portfolio_actions(mongo, user_id, portfolio_name, user_actions):
    user_portfolio_actions_collection = mongo.db.user_portfolio_actions
    user_portfolio_actions_doc = {
        "user_id": user_id,
        "portfolio_name" : portfolio_name,
        "date": datetime.now(),
        "user_actions": user_actions
    }
    return user_portfolio_actions_collection.insert_one(user_portfolio_actions_doc).inserted_id


def create_user_paper_trading_actions(mongo, user_id, paper_trading_portfolio_name, paper_trading_template_name, user_actions):
    user_paper_trading_actions_collection = mongo.db.user_paper_trading_actions
    user_paper_trading_actions_doc = {
        "user_id": user_id,
        "paper_trading_portfolio_name" : paper_trading_portfolio_name,
        "paper_trading_template_name" : paper_trading_template_name,
        "date": datetime.now(),
        "user_actions": user_actions
    }
    return user_paper_trading_actions_collection.insert_one(user_paper_trading_actions_doc).inserted_id

def create_user_paper_trading_actions1(mongo, user_id, paper_trading_portfolio_name, action):
    user_paper_trading_actions_collection = mongo.db.user_paper_trading_actions
    action_doc = {"date": datetime.datetime.now(), "action": action}
    user_paper_trading_actions_collection.update_one(
        {"user_id": user_id, "paper_trading_portfolio_id": paper_trading_portfolio_name},
        {"$push": {"user_actions": action_doc}},
        upsert=True
    )

def create_quiz_results(mongo, user_id, quiz_results):
    quiz_collection = mongo.db.quiz
    quiz_doc = {
        "user_id": user_id,
        "date": datetime.now(),
        "quiz_results": quiz_results  # This now contains detailed information for each question
    }
    return quiz_collection.insert_one(quiz_doc).inserted_id

def get_past_quiz_questions_for_all_quizzes(mongo, user_id, topic_name):
    # Access the quiz collection
    quiz_collection = mongo.db.quiz

    # Find all quiz documents for the user
    quiz_documents_cursor = quiz_collection.find({"user_id": user_id})

    # Convert the cursor to a list to avoid exhausting it
    quiz_documents = list(quiz_documents_cursor)

    # print("quiz_documents", quiz_documents)

    # Initialize an empty list to hold all past questions for the given topic
    all_past_questions_texts = []

    # Loop through each quiz document
    for quiz_doc in quiz_documents:
        # Loop through the quiz results array in the document
        for result in quiz_doc.get("quiz_results", []):
            # Check if the topic matches the topic we are looking for
            if result.get("topic") == topic_name:
                # Extract the questions for this topic and add only the questionText to the list
                all_past_questions_texts.extend(
                    question['questionText'] for question in result.get("questions", [])
                )

    # Return the list of all past question texts for the topic
    return all_past_questions_texts


def create_template_chat(mongo, user_id, portfolio_name, chat_message):
    template_chat_collection = mongo.db.template_chat
    template_chat_doc = {
        "user_id": user_id,
        "portfolio_name": portfolio_name,
        "chat_message": chat_message  # This now contains all the user and assistant messages cronologically
    }
    return template_chat_collection.insert_one(template_chat_doc).inserted_id
