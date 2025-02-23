import { useState, useEffect } from 'react';
import BoardSetup from './components/BoardSetup';
import TectonicBoard from './components/TectonicBoard';
import GameBoard from './components/GameBoard';
import Header from './components/Header';
import './App.css';

function App() {
  const [boardConfig, setBoardConfig] = useState(null);
  const [areas, setAreas] = useState([]);
  const [currentArea, setCurrentArea] = useState([]);
  const [numbers, setNumbers] = useState({});
  const [isDrawing, setIsDrawing] = useState(false);
  const [mode, setMode] = useState('draw'); // 'draw', 'number', or 'erase'
  const [editingAreaIndex, setEditingAreaIndex] = useState(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [selectedNumber, setSelectedNumber] = useState(null);
  const [sharedUrl, setSharedUrl] = useState('');

  useEffect(() => {
    // Check for hash in URL
    const path = window.location.pathname;
    const match = path.match(/\/tectonic\/(.+)$/);
    if (match) {
      const hash = match[1];  // Get the hash part after /tectonic/
      try {
        const boardData = decodeBoardHash(hash);
        setBoardConfig({ width: boardData.width, height: boardData.height });
        setAreas(boardData.areas);
        setNumbers(boardData.numbers || {});
        setIsReadOnly(true);
      } catch (e) {
        console.error(e,'Invalid board hash');
      }
    }
  }, []);

  const createBoardHash = () => {
    // Optimize the board data structure
    const boardData = {
      w: boardConfig.width,  // shorter key names
      h: boardConfig.height,
      a: areas.map(area => area.map(coord => [coord.x, coord.y])), // compress coordinates to arrays
      n: Object.entries(numbers).reduce((acc, [key, value]) => {
        const [x, y] = key.split(',');
        acc.push([parseInt(x), parseInt(y), parseInt(value)]); // compress number data
        return acc;
      }, [])
    };
    
    // Use a more compact JSON format
    const minifiedJson = JSON.stringify(boardData);
    const hash = btoa(minifiedJson)
      .replace(/=/g, '') // Remove padding equals signs
      .replace(/\+/g, '-') // Replace URL-unsafe characters
      .replace(/\//g, '_');
    
    const url = `${window.location.origin}/tectonic/${hash}`;
    navigator.clipboard.writeText(url);
    return url;
  };

  const decodeBoardHash = (hash) => {
    // Add back padding if needed
    hash = hash.replace(/-/g, '+').replace(/_/g, '/');
    const padding = hash.length % 4;
    if (padding) {
      hash += '='.repeat(4 - padding);
    }
    
    const data = JSON.parse(atob(hash));
    return {
      width: data.w,
      height: data.h,
      areas: data.a.map(area => area.map(([x, y]) => ({x, y}))),
      numbers: data.n.reduce((acc, [x, y, value]) => {
        acc[`${x},${y}`] = value.toString();
        return acc;
      }, {})
    };
  };

  const finishBoard = () => {
    const url = createBoardHash();
    setSharedUrl(url);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sharedUrl);
  };

  const handleBoardSetup = (width, height) => {
    setBoardConfig({ width, height });
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

  const setNumber = (x, y, value) => {
    setNumbers({
      ...numbers,
      [`${x},${y}`]: value
    });
  };

  const areAllTilesInAreas = () => {
    const totalTiles = boardConfig.width * boardConfig.height;
    const tilesInAreas = areas.reduce((count, area) => count + area.length, 0);
    return tilesInAreas === totalTiles;
  };

  return (
    <div className="App">
      <Header />
      {!boardConfig ? (
        <BoardSetup onSetup={handleBoardSetup} />
      ) : (
        <div className="puzzle-creator">
          {!isReadOnly ? (
            <>
              <div className="puzzle-workspace">
                <div className="puzzle-content">
                  <TectonicBoard
                    width={boardConfig.width}
                    height={boardConfig.height}
                    areas={areas}
                    currentArea={currentArea}
                    editingAreaIndex={editingAreaIndex}
                    numbers={numbers}
                    onTileHover={handleTileHover}
                    onTileClick={handleTileClick}
                    onNumberInput={setNumber}
                    onMouseDown={startDrawing}
                    onMouseUp={stopDrawing}
                    mode={isReadOnly ? 'number' : mode}
                    isReadOnly={isReadOnly}
                    isDrawing={isDrawing}
                    selectedNumber={selectedNumber}
                  />
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
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM21.41 6.34l-3.75-3.75-2.53 2.54 3.75 3.75 2.53-2.54z" fill="currentColor"/>
                        </svg>
                        Draw Area
                      </button>
                      <button 
                        onClick={finalizeArea}
                        disabled={currentArea.length === 0 && editingAreaIndex === null}
                        className="finalize-button action-button"
                        title="Finalize Area"
                      >
                        <span>✓</span>
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
                    className="finish-button action-button"
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
            </>
          ) : (
            <GameBoard
              width={boardConfig.width}
              height={boardConfig.height}
              areas={areas}
              numbers={numbers}
              onNumberSet={setNumber}
            />
          )}
        </div>
      )}
    </div>
  );
}

export default App; 