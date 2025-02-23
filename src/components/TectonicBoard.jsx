import './TectonicBoard.css';
import PropTypes from 'prop-types';
import { useState } from 'react';

TectonicBoard.propTypes = {
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  areas: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.object)).isRequired,
  currentArea: PropTypes.arrayOf(PropTypes.object).isRequired,
  editingAreaIndex: PropTypes.number,
  numbers: PropTypes.object.isRequired,
  onTileHover: PropTypes.func.isRequired,
  onNumberInput: PropTypes.func.isRequired,
  onMouseDown: PropTypes.func.isRequired,
  onMouseUp: PropTypes.func.isRequired,
  mode: PropTypes.string.isRequired,
  onTileClick: PropTypes.func.isRequired,
  isReadOnly: PropTypes.bool,
  selectedNumber: PropTypes.number,
};

function TectonicBoard({
  width,
  height,
  areas,
  currentArea,
  editingAreaIndex,
  numbers,
  onTileHover,
  onMouseDown,
  onMouseUp,
  mode,
  onTileClick,
  isReadOnly = false,
  selectedNumber,
  onNumberInput,
}) {
  const [justReleasedMouse, setJustReleasedMouse] = useState(false);

  const getAreaIndex = (x, y) => {
    return areas.findIndex(area =>
      area.some(coord => coord.x === x && coord.y === y)
    );
  };

  const isInCurrentArea = (x, y) => {
    if (editingAreaIndex !== null) {
      return areas[editingAreaIndex].some(coord => coord.x === x && coord.y === y);
    }
    return currentArea.some(coord => coord.x === x && coord.y === y);
  };

  const isSameArea = (x1, y1, x2, y2) => {
    const areaIndex = getAreaIndex(x1, y1);
    return areaIndex !== -1 && areaIndex === getAreaIndex(x2, y2);
  };

  const handleMouseEvent = (x, y, eventType) => {
    if (isReadOnly) return;
    
    if(mode === 'number' && selectedNumber !== null && eventType === 'click') {
      if(numbers[`${x},${y}`] === selectedNumber.toString()) {
        onNumberInput(x, y, '');
      } else {
        onNumberInput(x, y, selectedNumber.toString());
      }
    }
    if(mode === 'draw') {
      if (eventType === 'down') {
        setJustReleasedMouse(false);
        onMouseDown(x, y);
      } else if (eventType === 'enter') {
        onTileHover(x, y);
      } else if (eventType === 'up') {
        setJustReleasedMouse(true);
        onMouseUp();
      } else if (eventType === 'click') {  
        if (!justReleasedMouse) {
          onTileClick(x, y);
        }
        setJustReleasedMouse(false);
      }
    }
  };

  return (
    <div 
      className="tectonic-board"
      onMouseLeave={onMouseUp}
    >
      {Array.from({ length: height }, (_, y) => (
        <div key={y} className="board-row">
          {Array.from({ length: width }, (_, x) => {
            const areaIndex = getAreaIndex(x, y);
            const isCurrentAreaTile = isInCurrentArea(x, y);
            const number = numbers[`${x},${y}`];
            
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
                  ${isCurrentAreaTile ? 'current-area' : ''}
                  ${mode === 'draw' ? 'draw-mode' : 'number-mode'}
                  ${sameAreaAbove ? 'same-area-above' : ''}
                  ${sameAreaBelow ? 'same-area-below' : ''}
                  ${sameAreaLeft ? 'same-area-left' : ''}
                  ${sameAreaRight ? 'same-area-right' : ''}
                `}
                onClick={() => handleMouseEvent(x, y, 'click')}
                onMouseDown={() => handleMouseEvent(x, y, 'down')}
                onMouseUp={() => handleMouseEvent(x, y, 'up')}
                onMouseEnter={() => handleMouseEvent(x, y, 'enter')}
              >
                <div className="number">
                  {number || ''}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

export default TectonicBoard; 