import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './styles/LearnChat.css'; // Assumed CSS file, adjust path as necessary

const topics = [
    "Fundamental Analysis", 
    "Technical Analysis", 
    "Portfolio Theory", 
    "Macroeconomics", 
    "Personal Finance and Wealth Management"
];

function LearnChat() {
    const [userInput, setUserInput] = useState('');
    const [chatHistory, setChatHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedContent, setSelectedContent] = useState('');
    const [selectedTopic, setSelectedTopic] = useState('');
    const [topicSelected, setTopicSelected] = useState(false);
    const messagesEndRef = useRef(null);
    const [topicsSelected, setTopicsSelected] = useState(new Set());
    const [showQuizModal, setShowQuizModal] = useState(false);
    const [quizData, setQuizData] = useState([]);
    const [loadingQuiz, setLoadingQuiz] = useState(false);
    const [userQuizAnswers, setUserQuizAnswers] = useState({});
    const [quizSubmitted, setQuizSubmitted] = useState(false);
    const [contentProgress, setContentProgress] = useState({});
    const [currentQuizTopicIndex, setCurrentQuizTopicIndex] = useState(0);
    // State to store user's profile picture URL
    const [userProfilePic, setUserProfilePic] = useState('');
    const isTopicSelected = (topic) => {
        return topicsSelected.has(topic);
    };

    // Fetch user's profile picture
    useEffect(() => {
        const fetchUserInfo = async () => {
            try {
                const response = await axios.get('http://localhost:5000/get-user-info', {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });
                setUserProfilePic(response.data);
            } catch (error) {
                console.error("Error fetching user info:", error);
            }
        };

        fetchUserInfo();

        console.log("userProfilePic: ", userProfilePic)
    }, []);


    useEffect(() => {
        // Fetch past messages when the component mounts
        const fetchPastMessages = async () => {
            try {
                const response = await axios.get('http://localhost:5000/get_user_messages', {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                if (response.data && response.data.messages) {
                    // Assuming each message object has 'sender' and 'message' fields
                    const formattedMessages = response.data.messages.map(msg => ({
                        role: msg.sender === 'user' ? 'user' : 'assistant', // Adjust based on your actual data structure
                        message: msg.message
                    }));
                    setChatHistory(formattedMessages);
                }
            } catch (error) {
                console.error("Error fetching past messages:", error);
            }
        };

        fetchPastMessages();

        const storedSelectedTopic = localStorage.getItem('currentSelectedTopic');
        if (storedSelectedTopic) {
            setSelectedTopic(storedSelectedTopic);
            setTopicSelected(true);
        }

        // Load selected topics from local storage
        const storedTopics = JSON.parse(localStorage.getItem('selectedTopics')) || [];
        setTopicsSelected(new Set(storedTopics));

        // Set topicSelected based on storedTopics
        setTopicSelected(storedTopics.length > 0);
    }, []);

    useEffect(() => {
        // Fetch the first unfinished content for each topic
        const fetchContentProgress = async () => {
            setIsLoading(true);
            try {
                const contentResults = {};
                for (const topic of topics) {
                    const response = await axios.get(`http://localhost:5000/get_first_unfinished_content/${topic}`, {
                        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                    });
                    // if (response.data && response.data.success) {
                    //     contentResults[topic] = response.data.content;
                    // }

                    if (response.data && response.data.success) {
                        setContentProgress(prev => ({
                            ...prev,
                            [topic]: {
                                content: response.data.content,
                                rank: response.data.rank,
                                total: 10 // Assuming the total number of contents is 10
                            }
                        }));
                    }
                }
            } catch (error) {
                console.error("Error fetching first unfinished content:", error);
            } finally {
                setIsLoading(false);
            }
        };

        if (Object.keys(contentProgress).length === 0) {
            fetchContentProgress(); // Call only if unfinishedContent is empty
        }
    }, []); // Empty dependency array to ensure this runs only once


    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [chatHistory]);

    const handleTopicSelection = async (topic) => {
        setIsLoading(true); // Start loading
        setTopicSelected(true);
        setSelectedTopic(topic);
        localStorage.setItem('currentSelectedTopic', topic); // Store the current selected topic
        const selectedTopicContent = contentProgress[topic]?.content;
        if (selectedTopicContent) {
            setSelectedContent(selectedTopicContent);
            const updatedTopicsSelected = new Set(topicsSelected.add(topic));
            setTopicsSelected(updatedTopicsSelected);
    
            // Save the updated selected topics set to local storage
            localStorage.setItem('selectedTopics', JSON.stringify(Array.from(updatedTopicsSelected)));
    
            try {
                const response = await axios.post(`http://localhost:5000/get_new_convo_starter/${topic}/${selectedTopicContent}`, {}, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                if (response.data) {
                    const systemMessage = { role: 'assistant', message: response.data };
                    setChatHistory(prevChatHistory => [...prevChatHistory, systemMessage]);
                    const messageData = {
                        topic: topic,
                        content: selectedTopicContent,
                        sender: 'assistant',
                        message: response.data
                    };
                    await axios.post('http://localhost:5000/add_message_chat', messageData, {
                        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                    });
                }
            } catch (error) {
                console.error("Error during conversation starter fetch or message sending:", error);
            } finally {
                setIsLoading(false); // Stop loading regardless of success or failure
            }
        } else {
            console.error("Content not found for topic:", topic);
            setIsLoading(false);
        }
    };

    const handleStartQuiz = async () => {
        setShowQuizModal(true);
        setLoadingQuiz(true);
        setIsLoading(true);
        setQuizSubmitted(false); // Reset quiz submission state
    
        // Reset user answers
        const initialAnswers = {};
        quizData.forEach(topic => {
            topic.questions.forEach((question, index) => {
                initialAnswers[`${topic.topic}-${index}`] = '';
            });
        });
        setUserQuizAnswers(initialAnswers);
    
        try {
            const response = await axios.post('http://localhost:5000/chatgptmakequiz', {}, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
    
            if (response.data) {
                setQuizData(response.data);
            }
        } catch (error) {
            console.error("Error fetching the quiz:", error);
        } finally {
            setIsLoading(false);
            setLoadingQuiz(false);
        }
    };

    const handleAnswerChange = (topic, questionIndex, answer) => {
        setUserQuizAnswers(prev => ({ ...prev, [`${topic}-${questionIndex}`]: answer }));
    };
    
    const handleSubmitQuiz = async () => {
        // Process quiz answers to match the backend structure
        const quizResults = quizData.map(topic => ({
          topic: topic.topic,
          questions: topic.questions.map((question, index) => ({
            questionText: question.question,
            options: question.options,
            correctAnswer: question.correct_answer,
            userAnswer: userQuizAnswers[`${topic.topic}-${index}`],
            isCorrect: userQuizAnswers[`${topic.topic}-${index}`] === question.correct_answer,
            explanation: question.explanation
          }))
        }));
    
        try {
            await axios.post('http://localhost:5000/store_quiz_result', { result: quizResults }, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setQuizSubmitted(true);
        } catch (error) {
            console.error("Error submitting quiz results:", error);
        }
    };

    const handleSendMessage = async (message, sender) => {

        if (!topicSelected) {
            console.warn("No topic selected. Message not sent.");
            return;
        }

        const messageData = {
            topic: selectedTopic,
            content: selectedContent,
            sender: sender,
            message: message,
            // If you have content title as well, include it here
        };

        try {
            await axios.post('http://localhost:5000/add_message_chat', messageData, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
        } catch (error) {
            console.error("Error sending message:", error);
        }
    };

    const handleAsk = async () => {
        if (!userInput.trim()) return;
        if (topicsSelected.size === 0) {
            alert("Please select a topic first.");
            return;
        }

        setIsLoading(true);
        const requestOptions = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: userInput })
        };

        try {
            const response = await fetch('http://localhost:5000/learnchatgptask', requestOptions);
            if (response.ok) {
                const data = await response.json();
                const newChatHistory = [...chatHistory, 
                    { role: 'user', message: userInput },
                    { role: 'assistant', message: data }
                ];
                setChatHistory(newChatHistory);
                setUserInput('');

                await handleSendMessage(userInput, 'user');
                await handleSendMessage(data, 'assistant');
            } else {
                console.error("Failed to fetch response from backend");
            }
        } catch (error) {
            console.error("Error:", error);
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <div className="learn-chat-container">
        <div className="left-container"> {/* New container for the left side */}
            <div className='topic-header'>
                <h1 className="main-heading">Master Key Finance Concepts</h1>
                <h2 className="sub-heading">Discuss all five with WealthWiseMentor to unlock your quiz.</h2>
            </div>
        <div className="topic-selection-container">
            {topics.map((topic, index) => (
                <div key={index} className="topic-container"> {/* New container */}
                <button onClick={() => handleTopicSelection(topic)} className={`topic-button ${topic === selectedTopic ? 'current-selected' :isTopicSelected(topic) ? 'selected' : ''}`}>
                    {topic}
                
                <div className="unfinished-content">
                    {contentProgress[topic]?.content}
                </div>
                <div className="progress-bar-container">
                    {[...Array(contentProgress[topic]?.total || 0)].map((_, i) => (
                    <div key={i} className={`progress-bar-segment ${i < contentProgress[topic]?.rank ? 'filled' : ''}`}></div>
                    ))}
                </div>
                </button>
                </div>
            ))}
        </div>
        <div className='start-quiz'>
        <button 
                onClick={handleStartQuiz} 
                disabled={topicsSelected.size !== topics.length}
                className="start-quiz-button"
            >
                Start Quiz
        </button>
        </div>
        </div>
        <div className="right-container"> {/* New container for the chat interface */}
        <div className="chat-interface-container">
            <div className="chat-interface-header">
                <span className="material-icons-outlined robot-icon">smart_toy</span>  
                <div className="title-container">
                    <span className="chat-interface-title">WealthWiseMentor -  Empowering Your Financial Independence!</span>
                    <span className="online-text">Online</span> {/* Add this line */}
                </div>
            </div>
            <div className="chat-interface-messages">
            {chatHistory.map((chatItem, index) => (
                <div key={index} className={`chat-message-row ${chatItem.role}-row`}>
                    {chatItem.role === 'assistant' && (
                    <span className="material-icons-outlined robot-icon">smart_toy</span>
                    )}
                    <div className={`chat-message-item ${chatItem.role}-message`}>
                    <span className="message-content">{chatItem.message}</span>
                    {/* {chatItem.role === 'assistant' ? (
                            <div dangerouslySetInnerHTML={{ __html: chatItem.message }} />
                        ) : (
                            <span className="message-content">{chatItem.message}</span>
                    )} */}
                    </div>
                    {chatItem.role === 'user' && userProfilePic && (
                    <img 
                        src={`http://localhost:5000/${userProfilePic.profile_pic}`}
                        alt='User'
                        className='user-profile-pic'
                    />
                    )}
                </div>
                ))}
                <div ref={messagesEndRef}></div>
            </div>
            <div className="chat-interface-input-area">
                <input
                    value={userInput}
                    onChange={e => setUserInput(e.target.value)}
                    placeholder="Type your question..."
                    disabled={!topicSelected || isLoading}
                />
                <button onClick={handleAsk} disabled={!topicSelected || isLoading} className="send-button">
                    <div className="button-content-wrapper">
                        {!isLoading ? (
                            <span className="material-icons send">send</span>
                        ) : (
                            <span className="material-icons loading-icon">autorenew</span>
                        )}
                    </div>
                </button>
            </div>
        </div>


        {showQuizModal && (
        <div className="modal-overlay">
            <div className="quiz-modal">
                <button
                    onClick={() => setShowQuizModal(false)}
                    className="close-quiz-btn"
                >
                    <span class="material-icons-outlined">close</span>
                </button>
                <h2 className='quiz-heading'>Finance Mastery Quiz</h2>
                {loadingQuiz ? (
                    <div className="quiz-loading">Loading quiz...</div>
                ) : (
                    <>
                        <div>
                            <h3 className='quiz-question-title'>{quizData[currentQuizTopicIndex].topic}</h3>
                            {quizData[currentQuizTopicIndex].questions.map((question, qIndex) => (
                                <div key={qIndex} className="quiz-question-container">
                                    <p className='quiz-question'>{question.question}</p>
                                    {/* {Object.entries(question.options).map(([key, value]) => (
                                        <div 
                                            key={key} 
                                            className={`quiz-option ${userQuizAnswers[`${quizData[currentQuizTopicIndex].topic}-${qIndex}`] === key ? 'selected-option' : ''}`}
                                            onClick={() => handleAnswerChange(quizData[currentQuizTopicIndex].topic, qIndex, key)}
                                        >
                                            {value}
                                        </div>
                                    ))} */}
                                    {Object.entries(question.options).map(([key, value]) => (
                                        <div 
                                            key={key} 
                                            className={`quiz-option ${userQuizAnswers[`${quizData[currentQuizTopicIndex].topic}-${qIndex}`] === key ? (quizSubmitted ? (question.correct_answer === key ? 'correct-answer' : 'wrong-answer') : 'selected-option') : ''}`}
                                            onClick={() => handleAnswerChange(quizData[currentQuizTopicIndex].topic, qIndex, key)}
                                        >
                                            {value}
                                        </div>
                                    ))}
                                    {quizSubmitted && (
                                        <div className="quiz-results">
                                            <p className='quiz-results-exp'>Your Answer: {userQuizAnswers[`${quizData[currentQuizTopicIndex].topic}-${qIndex}`]}</p>
                                            <p className='quiz-results-exp'>Correct Answer: {question.correct_answer}</p>
                                            <p className='quiz-results-exp'>Explanation: {question.explanation}</p>
                                            {/* <p>
                                                {userQuizAnswers[`${quizData[currentQuizTopicIndex].topic}-${qIndex}`] ===
                                                question.correct_answer
                                                    ? "Correct"
                                                    : "Incorrect"}
                                            </p> */}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Navigation buttons */}
                        <div className="quiz-navigation-buttons">
                            <button
                                onClick={() => setCurrentQuizTopicIndex(Math.max(currentQuizTopicIndex - 1, 0))}
                                disabled={currentQuizTopicIndex === 0}
                                className="quiz-modal-button"
                            >
                                <span class="material-icons-outlined">chevron_left</span>
                            </button>
                            
                            <button
                                onClick={() => setCurrentQuizTopicIndex(Math.min(currentQuizTopicIndex + 1, quizData.length - 1))}
                                disabled={currentQuizTopicIndex === quizData.length - 1}
                                className="quiz-modal-button"
                            >
                                <span class="material-icons-outlined">chevron_right</span>
                            </button>
                        </div>

                        {/* Submit button is now shown only after navigating through all topics */}
                        {currentQuizTopicIndex === quizData.length - 1 && !quizSubmitted && (
                            <div className="submit-quiz-container">
                                <button
                                    onClick={handleSubmitQuiz}
                                    disabled={loadingQuiz}
                                    className="quiz-modal-button submit-quiz-button"
                                >
                                    Submit Quiz
                                </button>
                            </div>
                        )}
                        
                    </>
                )}
            </div>
        </div>
    )}


        {/* {showQuizModal && (
            <div className="modal-overlay">
            <div className="quiz-modal">
                <h2>Quiz</h2>
                {loadingQuiz ? (
                <div className="quiz-loading">Loading quiz...</div>
                ) : (
                <>
                    {quizData.map((topic, index) => (
                    <div key={index}>
                        <h3>{topic.topic}</h3>
                        {topic.questions.map((question, qIndex) => (
                        <div key={qIndex} className="quiz-question">
                            <p>{question.question}</p>
                            {Object.entries(question.options).map(([key, value]) => (
                            <div key={key}>
                                <label className="custom-radio-button">
                                <input
                                    type="radio"
                                    name={`${topic.topic}-${qIndex}`}
                                    value={key}
                                    onChange={() =>
                                    handleAnswerChange(
                                        topic.topic,
                                        qIndex,
                                        key
                                    )
                                    }
                                    disabled={quizSubmitted}
                                />
                                <span></span>
                                </label>
                                {value}
                            </div>
                            ))}
                            {quizSubmitted && (
                            <div className="quiz-results">
                                <p>Your Answer: {userQuizAnswers[`${topic.topic}-${qIndex}`]}</p>
                                <p>Correct Answer: {question.correct_answer}</p>
                                <p>{question.explanation}</p>
                                <p>
                                {userQuizAnswers[`${topic.topic}-${qIndex}`] ===
                                question.correct_answer
                                    ? "Correct"
                                    : "Incorrect"}
                                </p>
                            </div>
                            )}
                        </div>
                        ))}
                    </div>
                    ))}
                    {!quizSubmitted && (
                    <button
                        onClick={handleSubmitQuiz}
                        disabled={loadingQuiz}
                        className="quiz-modal-button"
                    >
                        Submit Quiz
                    </button>
                    )}
                    <button
                    onClick={() => setShowQuizModal(false)}
                    className="quiz-modal-button"
                    >
                    Close Quiz
                    </button>
                </>
                )}
            </div>
            </div>
        )} */}
    </div>
    </div>
    );
}

export default LearnChat;