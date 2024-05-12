import React, { useState, useEffect, useRef } from 'react';
import './styles/ChatBot.css';
import chatbotLogo from './styles/images/chatbot.png';
import sendLogo from './styles/images/send.png';

function ChatBot({ closeChatbot, additionalClass, autoSendMessage }) {
    const [userInput, setUserInput] = useState('');
    const [chatHistory, setChatHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (autoSendMessage) {
            setUserInput(autoSendMessage);
            // Call handleAsk only if autoSendMessage is provided.
            if (autoSendMessage.trim()) {
                handleAsk();
            }
        }
    }, [autoSendMessage]);

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [chatHistory]);

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !isLoading && userInput.trim()) {
            handleAsk();
        }
    };

    const handleAsk = async () => {
        if (!userInput.trim()) return;

        setIsLoading(true);

        const requestOptions = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: userInput })
        };

        try {
            const response = await fetch('http://localhost:5000/ask', requestOptions);
            if (response.ok) {
                const data = await response.json();
                setChatHistory(prevHistory => [...prevHistory, 
                    { role: 'user', message: userInput },
                    { role: 'assistant', message: data }
                ]);
            } else {
                console.error("Failed to fetch response from backend");
            }
        } catch (error) {
            console.error("Error:", error);
        } finally {
            setUserInput('');
            setIsLoading(false);
        }
    };

    return (
        <div className={`chat-container ${additionalClass ? additionalClass : ''}`}>
            <div className="chat-header">
                <img src={chatbotLogo} alt="Chatbot Logo" className="chat-logo" />
                <span className="chat-title">WealthWiseAdvisor</span>
                <button className="close-chatbot" onClick={closeChatbot}>&times;</button>
            </div>
            <div className="messages">
                {chatHistory.map((chatItem, index) => (
                    <div key={index} className={`message ${chatItem.role}-message`}>
                        {/* {chatItem.message} */}
                        {chatItem.role === 'assistant' ? (
                            <div dangerouslySetInnerHTML={{ __html: chatItem.message }} />
                        ) : (
                            chatItem.message
                        )}
                    </div>
                ))}
                <div ref={messagesEndRef}></div>
            </div>
            <div className="input-area">
                {isLoading && (
                    <div className="loading-dots">
                        <div className="dot"></div>
                        <div className="dot"></div>
                        <div className="dot"></div>
                    </div>
                )}
                <input
                    value={userInput}
                    onChange={e => setUserInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="How can I help you?"
                    disabled={isLoading}
                />
                <button onClick={handleAsk} disabled={isLoading || !userInput.trim()}>
                    <img src={sendLogo} alt="Send" className="send-icon" />
                </button>
            </div>
        </div>
    );
}

export default ChatBot;