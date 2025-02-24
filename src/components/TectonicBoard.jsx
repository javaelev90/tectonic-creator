import './TectonicBoard.css';
import PropTypes from 'prop-types';
import { useState } from 'react';

const HASH_PREFIX = 'TC_'; // Tectonic Creator prefix

TectonicBoard.propTypes = {
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired
};

function TectonicBoard({
  width,
  height
}) {
  const [isDrawing, setIsDrawing] = useState(false);
  const [editingAreaIndex, setEditingAreaIndex] = useState(null);
  const [currentArea, setCurrentArea] = useState([]);
  const [areas, setAreas] = useState([]);
  const [numbers, setNumbers] = useState({});
  const [mode, setMode] = useState('draw'); 
  const [selectedNumber, setSelectedNumber] = useState(null);
  const [sharedUrl, setSharedUrl] = useState('');
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

  const setNumber = (x, y, value) => {
    setNumbers({
      ...numbers,
      [`${x},${y}`]: value
    });
  };

  const handleTileHover = (x, y) => {
    if (isDrawing && mode === 'draw') {
      const newArea = editingAreaIndex !== null ? [...areas[editingAreaIndex]] : [...currentArea];
      
      // Don't add if tile exists or is in another area
      const tileExists = newArea.some(coord => coord.x === x && coord.y === y);
      const isInOtherArea = areas.some((area, index) => 
        index !== editingAreaIndex && area.some(coord => coord.x === x && coord.y === y)
      );

      if (!tileExists && !isInOtherArea && newArea.length < 5) {
        handleTileAction(x, y);
      }
    }
  };

  const handleTileClick = (x, y) => {
    if (mode === 'draw') {
      const newArea = editingAreaIndex !== null ? [...areas[editingAreaIndex]] : [...currentArea];
      const existingTileIndex = newArea.findIndex(coord => coord.x === x && coord.y === y);
      
      const isInOtherArea = areas.some((area, index) => 
        index !== editingAreaIndex && area.some(coord => coord.x === x && coord.y === y)
      );

      if (existingTileIndex !== -1) {
        // Remove the tile if it exists in current area
        if (editingAreaIndex !== null) {
          const newAreas = [...areas];
          newAreas[editingAreaIndex] = newArea.filter((_, i) => i !== existingTileIndex);
          if (newAreas[editingAreaIndex].length === 0) {
            newAreas.splice(editingAreaIndex, 1);
            setEditingAreaIndex(null);
          }
          setAreas(newAreas);
        } else {
          setCurrentArea(newArea.filter((_, i) => i !== existingTileIndex));
        }
      } else if (!isInOtherArea && newArea.length < 5) {
        handleTileAction(x, y);
      }
    } else if (mode === 'number' && selectedNumber !== null) {
      // If clicking on a tile with the same number, clear it
      if (numbers[`${x},${y}`] === selectedNumber.toString()) {
        setNumber(x, y, '');
      } else {
        setNumber(x, y, selectedNumber.toString());
      }
    }
  };

  const handleTileAction = (x, y) => {
    if (mode === 'draw') {
      const newArea = editingAreaIndex !== null ? [...areas[editingAreaIndex]] : [...currentArea];
      
      // Don't add more tiles if we already have 5
      if (newArea.length >= 5) {
        return;
      }

      const updatedArea = [...newArea, { x, y }];
      
      if (editingAreaIndex !== null) {
        const newAreas = [...areas];
        newAreas[editingAreaIndex] = updatedArea;
        setAreas(newAreas);
      } else {
        setCurrentArea(updatedArea);
      }
    }
  };

  const startDrawing = (x, y) => {
    setIsDrawing(true);
    if (mode === 'draw') {
      handleTileClick(x, y);
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };


  const handleMouseEvent = (x, y, eventType) => {
    
    if(mode === 'number' && selectedNumber !== null && eventType === 'click') {
      if(numbers[`${x},${y}`] === selectedNumber.toString()) {
        setNumber(x, y, '');
      } else {
        setNumber(x, y, selectedNumber.toString());
      }
    }
    if(mode === 'draw') {
      if (eventType === 'down') {
        setJustReleasedMouse(false);
        startDrawing(x, y);
      } else if (eventType === 'enter') {
        handleTileHover(x, y);
      } else if (eventType === 'up') {
        setJustReleasedMouse(true);
        stopDrawing();
      } else if (eventType === 'click') {  
        if (!justReleasedMouse) {
          handleTileClick(x, y);
        }
        setJustReleasedMouse(false);
      }
    }
  };

  const createBoardHash = () => {
    // Optimize the board data structure
    const boardData = {
      w: width,  // shorter key names
      h: height,
      a: areas.map(area => area.map(coord => [coord.x, coord.y])), // compress coordinates to arrays
      n: Object.entries(numbers).reduce((acc, [key, value]) => {
        const [x, y] = key.split(',');
        acc.push([parseInt(x), parseInt(y), parseInt(value)]); // compress number data
        return acc;
      }, [])
    };
    
    const minifiedJson = JSON.stringify(boardData);
    const hash = HASH_PREFIX + btoa(minifiedJson)
      .replace(/=/g, '') // Remove padding equals signs
      .replace(/\+/g, '-') // Replace URL-unsafe characters
      .replace(/\//g, '_');
    
    const url = `${window.location.origin}/tectonic/${hash}`;
    
    try {
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(url);
        } else {
            const textArea = document.createElement('textarea');
            textArea.value = url;
            textArea.style.position = 'fixed';
            textArea.style.opacity = '0';
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
        }
    } catch (err) {
        console.error('Failed to copy URL:', err);
    }
    
    return url;
  };


  const finishBoard = () => {
    const url = createBoardHash();
    setSharedUrl(url);
  };

  const copyToClipboard = () => {
    try {
        if (navigator.clipboard && window.isSecureContext) {
            // Use the Clipboard API if available
            navigator.clipboard.writeText(sharedUrl);
        } else {
            // Fallback for older browsers or non-HTTPS
            const textArea = document.createElement('textarea');
            textArea.value = sharedUrl;
            textArea.style.position = 'fixed';  // Avoid scrolling to bottom
            textArea.style.opacity = '0';
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
        }
    } catch (err) {
        console.error('Failed to copy URL:', err);
    }
  };

  const finalizeArea = () => {
    if (editingAreaIndex !== null) {
      setEditingAreaIndex(null);
    } else if (currentArea.length > 0) {
      setAreas([...areas, currentArea]);
      setCurrentArea([]);
    }
    setMode('draw');  // Switch back to draw mode
  };

  const startEditingArea = (index) => {
    setEditingAreaIndex(index);
    setMode('draw');
  };

  const deleteArea = (index) => {
    setAreas(areas.filter((_, i) => i !== index));
    if (editingAreaIndex === index) {
      setEditingAreaIndex(null);
    }
  };

  const areAllTilesInAreas = () => {
    const totalTiles = width * height;
    const tilesInAreas = areas.reduce((count, area) => count + area.length, 0);
    return tilesInAreas === totalTiles;
  };

  return (
    <div className="tectonic-board-container">
      <div 
        className="tectonic-board"
        onMouseLeave={stopDrawing}
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
      <div className="controls">
        <div className="controls-group">
          <div className="draw-controls">
            <button 
              onClick={() => {
                setMode('draw');
                setSelectedNumber(null);
              }}
              className={`draw-button ${mode === 'draw' ? 'active' : ''}`}
              title="Draw Area"
            >
              <span>🎨</span>
              Draw Area
            </button>
            <button 
              onClick={finalizeArea}
              disabled={currentArea.length === 0 && editingAreaIndex === null}
              className="finalize-button action-button"
              title="Finalize Area"
            >
              <span>✅</span>
              {editingAreaIndex !== null ? 'Done Editing' : 'Finalize Area'}
            </button>
          </div>
          <div className="number-buttons-group">
            {[1, 2, 3, 4, 5].map(num => (
              <button
                key={num}
                onClick={() => {
                  setMode('number');
                  setSelectedNumber(num);
                }}
                className={`number-button ${mode === 'number' && selectedNumber === num ? 'active' : ''}`}
              >
                {num}
              </button>
            ))}
          </div>
        </div>
        <button 
          onClick={finishBoard}
          className="finish-button"
          title="Finish & Share"
          disabled={!areAllTilesInAreas()}
        >
          <span>🔗</span>
          Share Puzzle
        </button>
        {sharedUrl && (
          <div className="shared-url-container">
            <input 
              type="text" 
              value={sharedUrl} 
              readOnly 
              className="shared-url-input"
            />
            <button 
              onClick={copyToClipboard}
              className="copy-button"
              title="Copy to clipboard"
            >
              📋
            </button>
          </div>
        )}
      </div>
      <div className="areas-list">
        <h3>Choose an Area to edit</h3>
        {areas.map((area, index) => (
          <div 
            key={index} 
            className={`area-item ${editingAreaIndex === index ? 'editing' : ''}`}
          >
            <span onClick={() => startEditingArea(index)}>
              Area {index + 1} ({area.length} tiles)
            </span>
            <button 
              className="delete-button"
              onClick={() => deleteArea(index)}
              title="Delete area"
            >
              🗑️
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TectonicBoard; 