import React from 'react';
import { useLocation } from 'react-router-dom';
import './styles/FloatingChatbotButton.css';

const FloatingChatbotButton = ({ onClick }) => {
  const location = useLocation();

  // Do not display the button on the LearnChat page
  if (location.pathname === '/learn-chat') {
    return null;
  }
  return (
    <button className="floating-btn" onClick={onClick}>
      How can I help you?
    </button>
  );
};

export default FloatingChatbotButton;