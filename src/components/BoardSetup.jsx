import { useState } from 'react';
import PropTypes from 'prop-types';
import './BoardSetup.css';

BoardSetup.propTypes = {
  onSetup: PropTypes.func.isRequired
};

function BoardSetup({ onSetup }) {
  const [width, setWidth] = useState(4);
  const [height, setHeight] = useState(4);

  return (
    <div className="board-setup">
      <h2>Create New Puzzle Board</h2>
      <div className="dimension-selector">
        <div className="dimension-group">
          <label>Width</label>
          <div className="slider-container">
            <input
              type="range"
              min="3"
              max="10"
              value={width}
              onChange={(e) => setWidth(parseInt(e.target.value))}
              className="slider"
            />
            <span className="slider-value">{width}</span>
          </div>
        </div>
        <div className="dimension-group">
          <label>Height</label>
          <div className="slider-container">
            <input
              type="range"
              min="3"
              max="10"
              value={height}
              onChange={(e) => setHeight(parseInt(e.target.value))}
              className="slider"
            />
            <span className="slider-value">{height}</span>
          </div>
        </div>
      </div>
      <button 
        className="create-button"
        onClick={() => onSetup(width, height)}
      >
        Create Board
      </button>
    </div>
  );
}

export default BoardSetup; 