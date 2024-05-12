import React from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import Overview from './Overview'; // Import the Overview component
import Assets from './Assets'; // You would create this
import Projections from './Projections'; // And this
import './styles/Portfolio.css'; // Your CSS file for styling

const Portfolio = () => {
  return (
    <div className="portfolio-container">
      <nav className="portfolio-nav">
        <NavLink to="/portfolio/overview" className={({ isActive }) => isActive ? 'active' : ''}>Overview</NavLink>
        <NavLink to="/portfolio/assets" className={({ isActive }) => isActive ? 'active' : ''}>Assets</NavLink>
        <NavLink to="/portfolio/projections" className={({ isActive }) => isActive ? 'active' : ''}>Projections</NavLink>
      </nav>
      <Routes>
        <Route path="overview" element={<Overview />} />
        <Route path="assets" element={<Assets />} />
        <Route path="projections" element={<Projections />} />
        <Route index element={<Overview />} />
      </Routes>
    </div>
  );
};

export default Portfolio;