import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './styles/Questionnaire.css';
import axios from 'axios';


const questions = [
  {
    text: "In general, how would your best friend describe you as a risk taker?",
    options: ["A real gambler", "Willing to take risks after completing adequate research", "Cautious", "A real risk avoider"]
  },
  {
    text: "You are on a TV game show and can choose one of the following. Which would you take?",
    options: ["$1,000 in cash", "A 50% chance at winning $5,000", "A 25% chance at winning $10,000", "A 5% chance at winning $100,000"]
  },
  {
    text: "You have just finished saving for a “once-in-a-lifetime” vacation. Three weeks before you plan to leave, you lose your job. You would:",
    options: ["Cancel the vacation", "Take a much more modest vacation", "Go as scheduled, reasoning that you need the time to prepare for a job search", "Extend your vacation, because this might be your last chance to go first-class"]
  },
  {
    text: "How would you respond to the following statement? “It’s hard for me to pass up a bargain.” ",
    options: ["Very true", "Sometimes true", "Not at all true"]
  },
  {
    text: "If you unexpectedly received $20,000 to invest, what would you do?",
    options: ["Deposit it in a bank account, money market account, or an insured CD", "Invest it in safe high quality bonds or bond mutual funds", "Invest it in stocks or stock mutual funds"]
  },
  {
    text: "In terms of experience, how comfortable are you investing in stocks or stock mutual funds?",
    options: ["Not at all comfortable", "Somewhat comfortable", "Very comfortable"]
  },
  {
    text: "Which situation would make you the happiest?",
    options: ["You win $50,000 in a publisher’s contest", "You inherit $50,000 from a rich relative", "You earn $50,000 by risking $1,000 in the options market", "Any of the above—after all, you’re happy with the $50,000"]
  },
  {
    text: "When you think of the word “risk” which of the following words comes to mind first?",
    options: ["Loss", "Uncertainty", "Opportunity", "Thrill"]
  },
  {
    text: "You inherit a mortgage-free house worth $80,000. The house is in a nice neighborhood, and you believe that it should increase in value faster than inflation. Unfortunately, the house needs repairs. If rented today, the house would bring in $600 monthly, but if updates and repairs were made, the house would rent for $800 per month. To finance the repairs you’ll need to take out a mortgage on the property. You would:",
    options: ["Sell the house", "Rent the house as is", "Remodel and update the house, and then rent it"]
  },
  {
    text: "In your opinion, is it more important to be protected from rising consumer prices (inflation) or to maintain the safety of your money from loss or theft?",
    options: ["Much more important to secure the safety of my money", "Much more important to be protected from rising prices (inflation)"]
  },
  {
    text: "You’ve just taken a job at a small fast growing company. After your first year you are offered the following bonus choices. Which one would you choose?",
    options: ["A five year employment contract", "A $25,000 bonus", "Stock in the company currently worth $25,000 with the hope of selling out later at a large profit"]
  },
  {
    text: "Some experts are predicting prices of assets such as gold, jewels, collectibles, and real estate (hard assets) to increase in value; bond prices may fall, however, experts tend to agree that government bonds are relatively safe. Most of your investment assets are now in high interest government bonds. What would you do?",
    options: ["Hold the bonds", "Sell the bonds, put half the proceeds into money market accounts, and the other half into hard assets", "Sell the bonds and put the total proceeds into hard assets", "Sell the bonds, put all the money into hard assets, and borrow additional money to buy more"]
  },
  {
    text: "Assume you are going to buy a home in the next few weeks. Your strategy would probably be:",
    options: ["To buy an affordable house where you can make monthly payments comfortably", "To stretch a bit financially to buy the house you really want", "To buy the most expensive house you can qualify for", "To borrow money from friends and relatives so you can qualify for a bigger mortgage"]
  },
  {
    text: "Given the best and worst case returns of the four investment choices below, which would you prefer?",
    options: ["$200 gain best case; $0 gain/loss worst case", "$800 gain best case; $200 loss worst case", "$2,600 gain best case; $800 loss worst case", "$4,800 gain best case; $2,400 loss worst case"]
  },
  {
    text: "Assume that you are applying for a mortgage. Interest rates have been coming down over the past few months. There’s the possibility that this trend will continue. But some economists are predicting rates to increase. You have the option of locking in your mortgage interest rate or letting it float. If you lock in, you will get the current rate, even if interest rates go up. If the rates go down, you’ll have to settle for the higher locked in rate. You plan to live in the house for at least three years. What would you do?",
    options: ["Definitely lock in the interest rate", "Probably lock in the interest rate", "Probably let the interest rate float", "Definitely let the interest rate float"]
  },
  {
    text: "In addition to whatever you own, you have been given $1,000. You are now asked to choose between:",
    options: ["A sure gain of $500", "A 50% chance to gain $1,000 and a 50% chance to gain nothing"]
  },
  {
    text: "In addition to whatever you own, you have been given $2,000. You are now asked to choose between:",
    options: ["A sure loss of $500", "A 50% chance to lose $1,000 and a 50% chance to lose nothing"]
  },
  {
    text: "Suppose a relative left you an inheritance of $100,000, stipulating in the will that you invest ALL the money in ONE of the following choices. Which one would you select?",
    options: ["A savings account or money market mutual fund", "A mutual fund that owns stocks and bonds", "A portfolio of 15 common stocks", "Commodities like gold, silver, and oil"]
  },
  {
    text: "If you had to invest $20,000, which of the following investment choices would you find most appealing?",
    options: ["60% in low-risk investments 30% in medium-risk investments 10% in high-risk investments", "30% in low-risk investments 40% in medium-risk investments 30% in high-risk investments", "10% in low-risk investments 40% in medium-risk investments 50% in high-risk investments"]
  },
  {
    text: "Your trusted friend and neighbor, an experienced geologist, is putting together a group of investors to fund an exploratory gold mining venture. The venture could pay back 50 to 100 times the investment if successful. If the mine is a bust, the entire investment is worthless. Your friend estimates the chance of success is only 20%. If you had the money, how much would you invest?",
    options: ["Nothing", "One month’s salary", "Three month’s salary", "Six month’s salary"]
  }
  // ... Add all other questions here in similar format
];

function Questionnaire({ onCompletion }) {
  const [responses, setResponses] = useState({});
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const navigate = useNavigate();

  const getProgressBarColor = (progress) => {
    if (progress < 14.3) return '#7cbeff'; // Light blue for the first question#00BFFF
    if (progress < 28.6) return '#41a0ff'; // Sky blue
    if (progress < 42.9) return '#0683ff'; // Dodger blue
    if (progress < 57.1) return '#005bb7'; // Azure blue
    if (progress < 71.4) return '#4169E1'; // Royal blue
    if (progress < 85.7) return '#005bb7'; // Blue
    if (progress < 100) return "#004890"
    return '#003468'; // Dark blue for the last question
  };


  const handleChange = (qIdx, optionIdx) => {
    setResponses(prevResponses => ({ ...prevResponses, [qIdx]: optionIdx }));
    nextQuestion();
  };

  const nextQuestion = () => {
    if (currentQuestionIdx < questions.length - 1) {
        setCurrentQuestionIdx(prevIndex => prevIndex + 1);
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIdx > 0) {
        setCurrentQuestionIdx(prevIndex => prevIndex - 1);
    }
  };

  const handleSubmit = async () => {

    // Check if the number of responses matches the number of questions
    if (Object.keys(responses).length !== questions.length) {
      alert("Please complete the questionnaire before submitting.");
      return;
    }

    const score = calculateScore(responses);
    const token = localStorage.getItem('token'); // Get the JWT token from local storage

    if (!token) {
      alert("Not authenticated. Please log in.");
      return;
    }

    try {
      const response = await axios.post('http://localhost:5000/submit-score', { responses, score }, {
        headers: {
          'Authorization': `Bearer ${token}` // Set the JWT token in the request headers
        }
      });
    // alert(response.data.message);
        if (response.status === 200) {
          onCompletion(true);  // <-- Here's where you call it!
          navigate('/dashboard');
        }
    // navigate('/dashboard');
    } catch (err) {
      alert("Error submitting the questionnaire!");
    }
  };

  // const progress = ((currentQuestionIdx + 1) / questions.length) * 100;
  const progress = (Object.keys(responses).length / questions.length) * 100;

  return (
    <div className='risk-container'>
    <h2 className='risk-header'>Risk Assessment for Tailored Investing!</h2>
    <h3 className='risk-subheader'>Let's tailor your investment strategy. Please answer the following questions.</h3>
    <div className="questionnaire-container">
        {/* Progress bar */}
        <div className="progress-bar">
          <div className="progress" style={{ width: `${progress}%`, backgroundColor: getProgressBarColor(progress) }}></div>
        </div>
        {/* Navigation buttons */}
        {/* <div className="navigation-buttons">
            <button className="prev-btn" onClick={() => setCurrentQuestionIdx(prev => prev - 1)} disabled={currentQuestionIdx === 0}><span class="material-icons-outlined">chevron_left</span></button>
            <button className="next-btn" onClick={() => setCurrentQuestionIdx(prev => prev + 1)} disabled={currentQuestionIdx === questions.length - 1}><span class="material-icons-outlined">chevron_right</span></button>
        </div> */}
        <div className="question-flex-container">
        <button className="prev-btn" onClick={previousQuestion} disabled={currentQuestionIdx === 0}>
            <span className="material-icons-outlined">chevron_left</span>
        </button>
        <div className="question-container">
            <p className="question">{questions[currentQuestionIdx].text}</p>
            {questions[currentQuestionIdx].options.map((option, optionIdx) => {
                const inputId = `question-${currentQuestionIdx}-option-${optionIdx}`;
                return (
                    <div key={optionIdx} className="option-container">
                        <input 
                            type="radio" 
                            id={inputId} 
                            name={`question-${currentQuestionIdx}`}
                            value={option}
                            className="radio-input"
                            checked={responses[currentQuestionIdx] === optionIdx}
                            onChange={() => handleChange(currentQuestionIdx, optionIdx)}
                        />
                        <label className="radio-label" htmlFor={inputId}>{option}</label>
                    </div>
                );
            })}
        </div>
        <button className="next-btn" onClick={nextQuestion} disabled={currentQuestionIdx === questions.length - 1}>
            <span className="material-icons-outlined">chevron_right</span>
        </button>
      </div>

        
        {currentQuestionIdx === questions.length - 1 && (
          <div className="submit-btn-container">
            <button className="submit-btn" onClick={handleSubmit}>Submit</button>
          </div>
        )}
    </div>
    </div>
   );
}

const calculateScore = (responses) => {
  const scores = [
    [ 4, 3, 2, 1 ],
    [ 1, 2, 3, 4 ],
    [ 1, 2, 3, 4 ],
    [ 1, 2, 3 ],
    [ 1, 2, 3 ],
    [ 1, 2, 3 ],
    [ 2, 1, 3, 1 ],
    [ 1, 2, 3, 4 ],
    [ 1, 2, 3 ],
    [ 1, 3 ],
    [ 1, 2, 3 ],
    [ 1, 2, 3, 4 ],
    [ 1, 2, 3, 4 ],
    [ 1, 2, 3, 4 ],
    [ 1, 2, 2, 3 ],
    [ 1, 3 ],
    [ 1, 3 ],
    [ 1, 2, 3, 4 ],
    [ 1, 2, 3 ],
    [ 1, 2, 3, 4 ]
    // ... Add all other score mappings here
  ];

  let totalScore = 0;
  for (let qIdx in responses) {
    const optionIdx = responses[qIdx];
    totalScore += scores[qIdx][optionIdx];
  }

  return totalScore;
};

export default Questionnaire;