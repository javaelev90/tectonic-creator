import './Header.css';

function Header() {
  const handleNewPuzzle = () => {
    window.location.href = '/tectonic/';
  };

  return (
    <header className="app-header">
      <div className="app-header-content">
        <h1>Tectonic Puzzle</h1>
        <button 
          onClick={handleNewPuzzle}
          className="new-puzzle-button"
        >
          Create New Puzzle
        </button>
      </div>
    </header>
  );
}

export default Header; 