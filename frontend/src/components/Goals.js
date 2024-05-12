import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './styles/Goals.css';

const Goals = () => {
    const [currentView, setCurrentView] = useState('current'); // 'current', 'successful', 'failed'
    const [showForm, setShowForm] = useState(false);
    const [feedback, setFeedback] = useState({ message: '', type: '' });
    const [selectedGoal, setSelectedGoal] = useState(null);
    const [goals, setGoals] = useState([]);
    const [goal, setGoal] = useState({
        name: '',
        amount: '',
        target_date: '',
        priority: 1,
    });

    // Changed useEffect to include currentView as a dependency
    useEffect(() => {
        fetchGoals();
    }, [currentView]); // Added currentView as a dependency

    const fetchGoals = async () => {
        let endpoint = '';
        switch(currentView) {
            case 'current':
                endpoint = 'get_current_user_goals';
                break;
            case 'successful':
                endpoint = 'get_successful_user_goals';
                break;
            case 'failed':
                endpoint = 'get_failed_user_goals';
                break;
            default:
                // Handle unexpected currentView values
                return;
        }

        try {
            const response = await axios.get(`http://localhost:5000/${endpoint}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setGoals(response.data);
            console.log("goals:", response.data)
        } catch (error) {
            console.error(`Error fetching ${currentView} goals:`, error);
        }
    };

    const handleInputChange = (e) => {
        setGoal({ ...goal, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            let response;
            if (selectedGoal) {
                // Update existing goal
                response = await axios.put(`http://localhost:5000/edit_goal/${selectedGoal._id.$oid}`, goal, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
            } else {
                // Add new goal
                response = await axios.post('http://localhost:5000/add_goal', goal, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
            }
            setFeedback({ message: 'Goal successfully processed!', type: 'success' });
            setShowForm(false);
            setSelectedGoal(null);
            fetchGoals();
        } catch (error) {
            console.error(error);
            setFeedback({ message: 'Failed to process goal. Please try again.', type: 'error' });
        }
        setTimeout(clearFeedback, 5000);
    };

    const clearFeedback = () => {
        setFeedback({ message: '', type: '' });
    };

    const handleGoalClick = (goalToEdit) => {
        if (goalToEdit) {
            setSelectedGoal(goalToEdit);
            setGoal({
                name: goalToEdit.name,
                amount: goalToEdit.amount,
                target_date: goalToEdit.target_date.split('T')[0], 
                priority: goalToEdit.priority,
            });
        } else {
            if (goals.length >= 3) {
                setFeedback({ message: 'You can only have up to three goals.', type: 'error' });
                setTimeout(clearFeedback, 5000);
                return;
            }
            setSelectedGoal(null);
            setGoal({ name: '', amount: '', target_date: '', priority: '1' });
        }
        setShowForm(true);
    };

    const handleDeleteGoal = async (goalId) => {
        try {
            await axios.delete(`http://localhost:5000/delete_goal/${goalId}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            fetchGoals();
            setShowForm(false);
            setSelectedGoal(null);
        } catch (error) {
            console.error('Error deleting goal:', error);
        }
    };

    function formatDate(dateString) {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    }

    const updateView = (view) => {
        setSelectedGoal(null);
        setShowForm(false);
        setCurrentView(view);
    };  

    // Add the renderButton function
    const renderButton = (text, view) => {
        return (
            <button onClick={() => updateView(view)} 
                    className={`nav-button ${currentView === view ? 'active' : ''}`}>
                {text}
            </button>
        );
    };

    return (
        <div className="goals-container">
            <div className="goals-list">
            {/* <div className="goal-navigation">
                <button onClick={() => updateView('current')} className={`nav-button ${currentView === 'current' ? 'active' : ''}`}>Current Goals</button>
                <button onClick={() => updateView('successful')} className={`nav-button ${currentView === 'successful' ? 'active' : ''}`}>Successful Goals</button>
                <button onClick={() => updateView('failed')} className={`nav-button ${currentView === 'failed' ? 'active' : ''}`}>Failed Goals</button>
            </div> */}
            <div className="goal-navigation">
                {renderButton('Current Goals', 'current')}
                {renderButton('Successful Goals', 'successful')}
                {renderButton('Failed Goals', 'failed')}
            </div>
                {currentView === 'current' && (
                    <div className="add-goal-container">
                        <button onClick={() => handleGoalClick(null)} className="add-goal-button"><i className="material-icons">add</i>Add Goal</button>
                        {feedback.message && (
                            <div className={`feedback-message ${feedback.type}`}>
                                {feedback.message}
                            </div>
                        )}
                    </div>
                )}
                {goals.map(goal => (
                    <div key={goal._id.$oid} className="goal-item" onClick={() => handleGoalClick(goal)}>
                        <div className="goal-header">
                            <p className="goal-name">{goal.name}</p>
                            <p className="goal-date">{formatDate(goal.target_date)}</p>
                        </div>
                        <div className="progress-wrapper">
                            <div className="progress-container">
                                <div className="progress-bar" style={{ width: `${goal.progress && goal.progress.length > 0 ? goal.progress[goal.progress.length - 1].progress_percentage.toFixed(1) : 0}%` }}>
                                <span className="progress-amount">${goal.progress && goal.progress.length > 1 ? goal.progress[goal.progress.length - 1].amount_progress.toFixed(2) : 'N/A'}</span>
                                </div>
                            </div>
                            <div className="progress-percentage-outside">
                                {goal.progress && goal.progress.length > 0 ? goal.progress[goal.progress.length - 1].progress_percentage.toFixed(1) : 'N/A'}%
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            <div className="goal-details">
                {showForm ? (
                    <div className="add-goal-form">
                        <form onSubmit={handleSubmit}>
                            <label htmlFor="name">Goal Name:</label>
                            <div className="input-icon-wrapper">
                                <input type="text" id="name" name="name" value={goal.name} onChange={handleInputChange} />
                                <i className="material-icons-outlined input-icon">flag</i>
                            </div>
                            
                            <label htmlFor="amount">Target Amount:</label>
                            <div className="input-icon-wrapper">
                                <input type="number" id="amount" name="amount" value={goal.amount} onChange={handleInputChange} />
                                <i className="material-icons-outlined input-icon">payments</i>
                            </div>
                            
                            <label htmlFor="target_date">Target Date:</label>
                            <div className="input-icon-wrapper">
                                <input type="date" id="target_date" name="target_date" value={goal.target_date} onChange={handleInputChange} />
                                <i className="material-icons input-icon date-icon">calendar_today</i>
                            </div>
                            
                            
                            <label htmlFor="priority">Priority (1-Highest, 5-Lowest):</label>
                            <div className="input-icon-wrapper">
                                <input type="number" id="priority" name="priority" min="1" max="5" value={goal.priority} onChange={handleInputChange} />
                                <i className="material-icons-outlined input-icon date-icon">star_rate</i>
                            </div>
                            <div className="button-container">
                                {currentView === 'current' && (
                                    <button type="submit">Save Goal</button>
                                )}
                                {selectedGoal && (
                                    <button type="button" onClick={() => handleDeleteGoal(selectedGoal._id.$oid)}>
                                        Delete Goal
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                ) : (
                    <div>Select a goal to see the details or click 'Add Goal' to add a new goal.</div>
                )}
            </div>
        </div>
    );

    
};

export default Goals;