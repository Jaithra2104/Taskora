import { useState } from 'react'

const GAMES = [
  { id: 'sudoku', name: 'Sudoku Zen', icon: 'fa-table-cells', color: 'var(--cyan)', desc: 'Sharpen your logic with classic 9x9 puzzles.' },
  { id: 'chess', name: 'Grandmaster Chess', icon: 'fa-chess', color: 'var(--purple)', desc: 'Strategic mastery for the sharpest minds.' },
  { id: 'crossword', name: 'LexiCross', icon: 'fa-font', color: 'var(--emerald)', desc: 'Boost your vocabulary with daily word grids.' }
]

export default function Games() {
  const [activeGame, setActiveGame] = useState(null)

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h2>Mind Relief Hub</h2>
          <p>Take a break, sharpen your mind, and recharge your focus.</p>
        </div>
      </div>

      {!activeGame ? (
        <div className="grid-3" style={{ marginTop: 20 }}>
          {GAMES.map(game => (
            <div 
              key={game.id} 
              className="card hover-glow" 
              onClick={() => setActiveGame(game.id)}
              style={{ cursor: 'pointer', textAlign: 'center', border: `1px solid ${game.color}33` }}
            >
              <div style={{ 
                width: 80, height: 80, borderRadius: '50%', background: `${game.color}11`, 
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
                fontSize: '2.5rem', color: game.color, border: `2px solid ${game.color}44`,
                boxShadow: `0 0 20px ${game.color}22`
              }}>
                <i className={`fas ${game.icon}`}></i>
              </div>
              <h3 style={{ fontSize: '1.4rem', marginBottom: 10 }}>{game.name}</h3>
              <p style={{ color: 'var(--text2)', fontSize: '.9rem' }}>{game.desc}</p>
              <button className="btn" style={{ marginTop: 20, background: 'var(--glass)', border: `1px solid ${game.color}66`, color: game.color }}>
                PLAY NOW
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="card" style={{ minHeight: '600px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <button onClick={() => setActiveGame(null)} className="btn" style={{ background: 'var(--bg2)', padding: '8px 16px' }}>
              <i className="fas fa-arrow-left"></i> BACK TO HUB
            </button>
            <h3 style={{ color: GAMES.find(g => g.id === activeGame).color }}>
              <i className={`fas ${GAMES.find(g => g.id === activeGame).icon}`}></i> {GAMES.find(g => g.id === activeGame).name}
            </h3>
            <div style={{ width: 100 }}></div>
          </div>
          
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg2)', borderRadius: 12, border: '1px solid var(--border)' }}>
            {activeGame === 'sudoku' && <SudokuGame />}
            {activeGame === 'chess' && <div className="text-center"><i className="fas fa-chess-knight" style={{fontSize: '4rem', color: 'var(--purple)', marginBottom: 20}}></i><p>Chess Engine Loading... <br/><span style={{fontSize: '.8rem', color: 'var(--text3)'}}>Multiplayer Chess Module coming soon!</span></p></div>}
            {activeGame === 'crossword' && <div className="text-center"><i className="fas fa-font" style={{fontSize: '4rem', color: 'var(--emerald)', marginBottom: 20}}></i><p>LexiCross Daily Grid<br/><span style={{fontSize: '.8rem', color: 'var(--text3)'}}>New puzzles arrive every 24 hours.</span></p></div>}
          </div>
        </div>
      )}
    </div>
  )
}

function SudokuGame() {
  const [grid, setGrid] = useState([
    [5, 3, 0, 0, 7, 0, 0, 0, 0],
    [6, 0, 0, 1, 9, 5, 0, 0, 0],
    [0, 9, 8, 0, 0, 0, 0, 6, 0],
    [8, 0, 0, 0, 6, 0, 0, 0, 3],
    [4, 0, 0, 8, 0, 3, 0, 0, 1],
    [7, 0, 0, 0, 2, 0, 0, 0, 6],
    [0, 6, 0, 0, 0, 0, 2, 8, 0],
    [0, 0, 0, 4, 1, 9, 0, 0, 5],
    [0, 0, 0, 0, 8, 0, 0, 7, 9]
  ])

  const [selected, setSelected] = useState([null, null])

  const handleCellClick = (r, c) => setSelected([r, c])

  const handleNumberClick = (num) => {
    if (selected[0] !== null) {
      const newGrid = [...grid]
      newGrid[selected[0]][selected[1]] = num
      setGrid(newGrid)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 30, padding: 20 }}>
      <div style={{ 
        display: 'grid', gridTemplateColumns: 'repeat(9, 45px)', border: '3px solid var(--cyan)', 
        boxShadow: '0 0 30px var(--cyan-dim)' 
      }}>
        {grid.map((row, r) => row.map((cell, c) => (
          <div 
            key={`${r}-${c}`}
            onClick={() => handleCellClick(r, c)}
            style={{ 
              width: 45, height: 45, display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid var(--border)', cursor: 'pointer',
              background: selected[0] === r && selected[1] === c ? 'var(--cyan-dim)' : 'transparent',
              fontSize: '1.2rem', fontWeight: 600, color: cell === 0 ? 'var(--cyan)' : 'var(--text1)',
              borderRight: (c + 1) % 3 === 0 ? '2px solid var(--cyan)' : '1px solid var(--border)',
              borderBottom: (r + 1) % 3 === 0 ? '2px solid var(--cyan)' : '1px solid var(--border)'
            }}
          >
            {cell !== 0 ? cell : ''}
          </div>
        )))}
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        {[1,2,3,4,5,6,7,8,9].map(num => (
          <button 
            key={num} 
            onClick={() => handleNumberClick(num)}
            className="btn"
            style={{ width: 40, height: 40, padding: 0, justifyContent: 'center', border: '1px solid var(--cyan)' }}
          >
            {num}
          </button>
        ))}
        <button 
          onClick={() => handleNumberClick(0)}
          className="btn"
          style={{ width: 60, height: 40, padding: 0, justifyContent: 'center', border: '1px solid var(--red)' }}
        >
          CLEAR
        </button>
      </div>
    </div>
  )
}
