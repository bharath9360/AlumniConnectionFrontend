// src/components/cards/StatCard.js
import React from 'react';

const StatCard = ({ value, label }) => (
  <div className="col-md-4 text-center my-3">
    <h2 className="display-4 fw-bold">{value}</h2>
    <p className="lead">{label}</p>
  </div>
);
export default StatCard;