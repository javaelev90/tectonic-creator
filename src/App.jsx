import { useState, useEffect } from 'react';
import BoardSetup from './components/BoardSetup';
import TectonicBoard from './components/TectonicBoard';
import GameBoard from './components/GameBoard';
import Header from './components/Header';
import './App.css';

const HASH_PREFIX = 'TC_'; // Tectonic Creator prefix

function App() {
  const [boardConfig, setBoardConfig] = useState(null);
  const [areas, setAreas] = useState([]);
  const [numbers, setNumbers] = useState({});
  const [isReadOnly, setIsReadOnly] = useState(false);


  useEffect(() => {
    // Check for hash in URL
    const path = window.location.pathname;
    const match = path.match(/\/tectonic\/(TC_.+)$/);
    
    // Only try to decode if we have a match and hash
    if (match && match[1]) {
      try {
        const hash = match[1];
        const boardData = decodeBoardHash(hash);
        setBoardConfig({ width: boardData.width, height: boardData.height });
        setAreas(boardData.areas);
        setNumbers(boardData.numbers || {});
        setIsReadOnly(true);
      } catch (e) {
        console.error('Invalid board hash:', e);
      }
    }
  }, []);

  
  const decodeBoardHash = (hash) => {
    // Only decode if it starts with our prefix
    if (!hash.startsWith(HASH_PREFIX)) {
      throw new Error('Invalid board hash format');
    }
    
    // Remove the prefix before decoding
    hash = hash.slice(HASH_PREFIX.length);
    
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

  

  const handleBoardSetup = (width, height) => {
    setBoardConfig({ width, height });
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
                  />
                </div>
              </div>
            </>
          ) : (
            <GameBoard
              width={boardConfig.width}
              height={boardConfig.height}
              areas={areas}
              initialNumbers={numbers}
            />
          )}
        </div>
      )}
    </div>
  );
}

export default App; 