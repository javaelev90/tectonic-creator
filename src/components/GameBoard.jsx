import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import './GameBoard.css';
import confetti from 'canvas-confetti';

GameBoard.propTypes = {
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  areas: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.object)).isRequired,
  numbers: PropTypes.object.isRequired,
  onNumberSet: PropTypes.func.isRequired,
};

function GameBoard({ width, height, areas, numbers, onNumberSet }) {
  const [selectedNumber, setSelectedNumber] = useState(null);
  const [initialNumbers] = useState({...numbers}); // Store initial numbers
  const [isWon, setIsWon] = useState(false);

  const checkWinCondition = useCallback(() => {
    // Check if all areas are filled
    for (const area of areas) {
      const areaNumbers = area.map(coord => numbers[`${coord.x},${coord.y}`]);
      if (areaNumbers.includes(undefined) || areaNumbers.includes('')) {
        return false;
      }
      
      // Check if area has unique numbers 1-5
      const uniqueNumbers = new Set(areaNumbers);
      if (uniqueNumbers.size !== areaNumbers.length) {
        return false;
      }
      // Check if all numbers are between 1 and area size
      const areaSize = area.length;
      if (!Array.from(uniqueNumbers).every(num => {
        const n = parseInt(num);
        return n >= 1 && n <= areaSize;
      })) {
        return false;
      }
    }

    // Check for adjacent same numbers
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const currentNum = numbers[`${x},${y}`];
        if (!currentNum) continue;

        // Check right
        if (x < width - 1 && numbers[`${x+1},${y}`] === currentNum) {
          return false;
        }
        // Check down
        if (y < height - 1 && numbers[`${x},${y+1}`] === currentNum) {
          return false;
        }
        // Check diagonal down-right
        if (x < width - 1 && y < height - 1 && numbers[`${x+1},${y+1}`] === currentNum) {
          return false;
        }
        // Check diagonal down-left
        if (x > 0 && y < height - 1 && numbers[`${x-1},${y+1}`] === currentNum) {
          return false;
        }
      }
    }

    return true;
  }, [areas, numbers, width, height]);

  useEffect(() => {
    if (checkWinCondition()) {
      setIsWon(true);
    }
  }, [numbers, checkWinCondition]);

  const getAreaIndex = (x, y) => {
    return areas.findIndex(area =>
      area.some(coord => coord.x === x && coord.y === y)
    );
  };

  const isSameArea = (x1, y1, x2, y2) => {
    const areaIndex = getAreaIndex(x1, y1);
    return areaIndex !== -1 && areaIndex === getAreaIndex(x2, y2);
  };

  const handleTileClick = (x, y) => {
    if (isWon || initialNumbers[`${x},${y}`]) {
      return;
    }

    if (selectedNumber === 'erase') {
      onNumberSet(x, y, '');
    } else if (selectedNumber !== null) {
      onNumberSet(x, y, selectedNumber.toString());
    }
  };

  const triggerWinAnimation = () => {
    // Fire confetti from both sides
    const count = 200;
    const defaults = {
      origin: { y: 0.7 },
      spread: 80,
      ticks: 100,
    };

    function fire(particleRatio, opts) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      });
    }

    fire(0.25, {
      spread: 26,
      startVelocity: 55,
      origin: { x: 0.2 },
    });
    fire(0.25, {
      spread: 26,
      startVelocity: 55,
      origin: { x: 0.8 },
    });

    fire(0.2, {
      spread: 60,
      origin: { x: 0.5 },
    });
  };

  useEffect(() => {
    if (isWon) {
      triggerWinAnimation();
    }
  }, [isWon]);

  const isLargeBoard = width > 6 || height > 6;

  return (
    <div className="game-board-container">
      {isWon && (
        <div className="win-message">
          🎉 Puzzle Solved! 🎉
        </div>
      )}
      <div className="number-selector">
        {[1, 2, 3, 4, 5].map(num => (
          <button
            key={num}
            className={`number-button ${selectedNumber === num ? 'selected' : ''}`}
            onClick={() => setSelectedNumber(num)}
          >
            {num}
          </button>
        ))}
        <button
          className={`number-button eraser ${selectedNumber === 'erase' ? 'selected' : ''}`}
          onClick={() => setSelectedNumber('erase')}
          title="Eraser"
        >
          ✕
        </button>
      </div>
      
      <div className={`game-board ${isLargeBoard ? 'large-board' : ''}`}>
        {Array.from({ length: height }, (_, y) => (
          <div key={y} className="board-row">
            {Array.from({ length: width }, (_, x) => {
              const areaIndex = getAreaIndex(x, y);
              const number = numbers[`${x},${y}`];
              const isInitialNumber = initialNumbers[`${x},${y}`];
              
              // Check all adjacent tiles
              const sameAreaAbove = y > 0 && isSameArea(x, y, x, y - 1);
              const sameAreaBelow = y < height - 1 && isSameArea(x, y, x, y + 1);
              const sameAreaLeft = x > 0 && isSameArea(x, y, x - 1, y);
              const sameAreaRight = x < width - 1 && isSameArea(x, y, x + 1, y);

              return (
                <div
                  key={`${x}-${y}`}
                  className={`board-tile 
                    ${areaIndex !== -1 ? 'area-' + (areaIndex % 8) : ''} 
                    ${sameAreaAbove ? 'same-area-above' : ''}
                    ${sameAreaBelow ? 'same-area-below' : ''}
                    ${sameAreaLeft ? 'same-area-left' : ''}
                    ${sameAreaRight ? 'same-area-right' : ''}
                    ${selectedNumber !== null && !isInitialNumber ? 'clickable' : ''}
                  `}
                  onClick={() => handleTileClick(x, y)}
                >
                  {number && (
                    <span 
                      className={`number ${isInitialNumber ? 'initial' : ''}`}
                      data-number={number}
                    >
                      {number}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export default GameBoard; 