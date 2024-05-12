import React from 'react';
import ChatBot from './ChatBot'; // Import your ChatBot component

const ChatBotPage = () => {
    return (
        <div>
            {/* <h1>Welcome to the Chatbot</h1> */}
            <ChatBot additionalClass="chatbot-page" />
        </div>
    );
}

export default ChatBotPage;