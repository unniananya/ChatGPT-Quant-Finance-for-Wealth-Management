import os
import requests
import json
import yfinance as yf
from yahooquery import Ticker
import finnhub
from datetime import date, datetime, timedelta
import openai
import os
openai_api_key = os.getenv('OPENAI_API_KEY')

openai.api_key = openai_api_key

finnhub_client = finnhub.Client(api_key="cka1fipr01qq65jklghgcka1fipr01qq65jklgi0")

def get_company_news(company_ticker):
    current_time = datetime.now()
    start_time = current_time - timedelta(days=1) 
    start_date = start_time.strftime('%Y-%m-%d')
    end_date = current_time.strftime('%Y-%m-%d')

    latest_news = finnhub_client.company_news(company_ticker, _from=start_date, to=end_date)

    return latest_news



def write_news_to_file(news, filename):
    with open(filename, 'w') as file:
        for news_item in news:
            if news_item is not None:
                title = news_item.get('headline', 'No title')
                link = news_item.get('url', 'No link')
                date = news_item.get('datetime', 'No date')
                date = datetime.fromtimestamp(date).strftime('%Y-%m-%d %I:%M:%S %p')
                file.write(f"Title: {title}\n")
                file.write(f"Link: {link}\n")
                file.write(f"Date: {date}\n\n")



def get_stock_evolution(company_name, period="1y"):
    # Get the stock information
    stock = yf.Ticker(company_name)

    # Get historical market data
    hist = stock.history(period=period)

    # Convert the DataFrame to a string with a specific format
    data_string = hist.to_string()

    # Append the string to the "investment.txt" file
    with open("investment.txt", "a") as file:
        file.write(f"\nStock Evolution for {company_name}:\n")
        file.write(data_string)
        file.write("\n")

    # Return the DataFrame
    return hist


def get_financial_statements(ticker):
    # Create a Ticker object
    company = Ticker(ticker)

    # Get financial data
    balance_sheet = company.balance_sheet().to_string()
    cash_flow = company.cash_flow(trailing=False).to_string()
    income_statement = company.income_statement().to_string()
    valuation_measures = str(company.valuation_measures)  # This one might already be a dictionary or string

    # Write data to file
    with open("investment.txt", "a") as file:
        file.write("\nBalance Sheet\n")
        file.write(balance_sheet)
        file.write("\nCash Flow\n")
        file.write(cash_flow)
        file.write("\nIncome Statement\n")
        file.write(income_statement)
        file.write("\nValuation Measures\n")
        file.write(valuation_measures)




def get_data(company_name, company_ticker, period="1y", filename="investment.txt"):
    # news = get_company_news(company_name)
    news = get_company_news(company_ticker)
    if news:
        write_news_to_file(news, filename)
    else:
        print("No news found.")

    hist = get_stock_evolution(company_ticker)

    get_financial_statements(company_ticker)

    return hist


def financial_analyst(request):
    print(f"Received request: {request}")
    response = openai.ChatCompletion.create(
        model="gpt-3.5-turbo-0613",
        messages=[{
            "role":
            "user",
            "content":
            f"Given the user request, what is the company name and the company stock ticker ?: {request}?"
        }],
        functions=[{
            "name": "get_data",
            "description":
            "Get financial data on a specific company for investment purposes",
            "parameters": {
                "type": "object",
                "properties": {
                    "company_name": {
                        "type":
                        "string",
                        "description":
                        "The name of the company",
                    },
                    "company_ticker": {
                        "type":
                        "string",
                        "description":
                        "the ticker of the stock of the company"
                    },
                    "period": {
                        "type": "string",
                        "description": "The period of analysis"
                    },
                    "filename": {
                        "type": "string",
                        "description": "the filename to store data"
                    }
                },
                "required": ["company_name", "company_ticker"],
            },
        }],
        function_call={"name": "get_data"},
    )

    message = response["choices"][0]["message"]

    if message.get("function_call"):
        # Parse the arguments from a JSON string to a Python dictionary
        arguments = json.loads(message["function_call"]["arguments"])
        print(arguments)
        company_name = arguments["company_name"]
        company_ticker = arguments["company_ticker"]

        # Parse the return value from a JSON string to a Python dictionary
        hist = get_data(company_name, company_ticker)
        # print(hist)

        with open("investment.txt", "r") as file:
            content = file.read()[:14000]

        second_response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo-16k",
            messages=[
                {
                    "role": "user",
                    "content": request
                },
                message,
                {
                    "role": "system",
                    "content": """write a detailed investment thesis to answer
                    the user request as a html document. Please make sure the font family is always 'Poppins', sans-serif and the color of the text is always white and the font size of h1 is always 1.2em and bold, font size of h2 is 1.1em and bold and font size of p is 1em and not bold. Do not add any image links in the html document. And please put all links inside the <a> component. Provide numbers to justify
                    your assertions, a lot ideally. Always provide
                    a recommendation to buy the stock of the company
                    or not given the information available."""
                },
                {
                    "role": "assistant",
                    "content": content,
                },
            ],
        )

        return second_response["choices"][0]["message"]["content"]
    