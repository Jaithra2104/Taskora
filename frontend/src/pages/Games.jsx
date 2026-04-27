import { useState, useEffect } from 'react'

const GAMES = [
  { id: 'sudoku', name: 'Sudoku Zen 6x6', icon: 'fa-table-cells', color: 'var(--cyan)', desc: 'Fast-paced logic training with 6x6 grids.' },
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
        <div className="card" style={{ minHeight: '650px', display: 'flex', flexDirection: 'column', padding: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
            <button onClick={() => setActiveGame(null)} className="btn" style={{ background: 'var(--bg2)', padding: '10px 20px' }}>
              <i className="fas fa-arrow-left" style={{marginRight: 8}}></i> BACK TO HUB
            </button>
            <h2 style={{ color: GAMES.find(g => g.id === activeGame).color, fontSize: '1.8rem', fontWeight: 900, textShadow: `0 0 20px ${GAMES.find(g => g.id === activeGame).color}66` }}>
              <i className={`fas ${GAMES.find(g => g.id === activeGame).icon}`} style={{marginRight: 12}}></i> 
              {GAMES.find(g => g.id === activeGame).name}
            </h2>
            <div style={{ width: 140 }}></div>
          </div>
          
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.2)', borderRadius: 20, border: '1px solid var(--border)', position: 'relative', overflow: 'hidden' }}>
             {/* Background glow effect */}
             <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '300px', height: '300px', background: GAMES.find(g => g.id === activeGame).color, filter: 'blur(150px)', opacity: 0.1, pointerEvents: 'none' }}></div>
             
            {activeGame === 'sudoku' && <Sudoku6x6 />}
            {activeGame === 'chess' && <ChessGame />}
            {activeGame === 'crossword' && <div className="text-center" style={{position: 'relative'}}><i className="fas fa-font" style={{fontSize: '5rem', color: 'var(--emerald)', marginBottom: 20, filter: 'drop-shadow(0 0 15px var(--emerald))'}}></i><p style={{fontSize: '1.2rem', fontWeight: 700}}>LexiCross Daily Grid</p><p style={{fontSize: '.9rem', color: 'var(--text3)'}}>New puzzles arrive every 24 hours.</p></div>}
          </div>
        </div>
      )}
    </div>
  )
}

function Sudoku6x6() {
  const [difficulty, setDifficulty] = useState('easy')
  const [grid, setGrid] = useState(Array(6).fill().map(() => Array(6).fill(0)))
  const [initial, setInitial] = useState([])
  const [selected, setSelected] = useState([null, null])
  const [win, setWin] = useState(false)

  const generatePuzzle = (diff) => {
    // Basic 6x6 Sudoku Generator logic (simplified for demonstration)
    const base = [
      [1, 2, 3, 4, 5, 6],
      [4, 5, 6, 1, 2, 3],
      [2, 3, 1, 5, 6, 4],
      [5, 6, 4, 2, 3, 1],
      [3, 1, 2, 6, 4, 5],
      [6, 4, 5, 3, 1, 2]
    ]
    // Randomize slightly
    const shuffled = [...base].sort(() => Math.random() - 0.5)
    
    // Remove cells based on difficulty
    const cellsToRemove = diff === 'easy' ? 12 : (diff === 'medium' ? 18 : 24)
    const newGrid = shuffled.map(row => [...row])
    const initCells = []
    
    let removed = 0
    while (removed < cellsToRemove) {
      const r = Math.floor(Math.random() * 6)
      const c = Math.floor(Math.random() * 6)
      if (newGrid[r][c] !== 0) {
        newGrid[r][c] = 0
        removed++
      }
    }

    for(let r=0; r<6; r++) {
      for(let c=0; c<6; c++) {
        if(newGrid[r][c] !== 0) initCells.push(`${r}-${c}`)
      }
    }

    setGrid(newGrid)
    setInitial(initCells)
    setWin(false)
    setSelected([null, null])
  }

  useEffect(() => {
    generatePuzzle(difficulty)
  }, [difficulty])

  const handleCellClick = (r, c) => {
    if (initial.includes(`${r}-${c}`)) return
    setSelected([r, c])
  }

  const handleNumberClick = (num) => {
    if (selected[0] !== null) {
      const newGrid = grid.map(row => [...row])
      newGrid[selected[0]][selected[1]] = num
      setGrid(newGrid)
      checkWin(newGrid)
    }
  }

  const checkWin = (currentGrid) => {
    // Very simple check: no zeros
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 6; c++) {
        if (currentGrid[r][c] === 0) return
      }
    }
    setWin(true)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 30, padding: 20, width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 20, width: '100%', maxWidth: 400 }}>
         <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
            <label className="form-label" style={{fontSize: '.8rem'}}>DIFFICULTY</label>
            <select 
              className="form-input" 
              value={difficulty} 
              onChange={(e) => setDifficulty(e.target.value)}
              style={{ background: 'var(--bg2)', cursor: 'pointer' }}
            >
              <option value="easy">Easy (Warmup)</option>
              <option value="medium">Medium (Focus)</option>
              <option value="hard">Hard (Genius)</option>
            </select>
         </div>
         <button className="btn" onClick={() => generatePuzzle(difficulty)} style={{ alignSelf: 'flex-end', height: 45, background: 'var(--cyan-dim)', color: 'var(--cyan)' }}>
            <i className="fas fa-rotate"></i> RESET
         </button>
      </div>

      <div style={{ position: 'relative' }}>
        <div style={{ 
          display: 'grid', gridTemplateColumns: 'repeat(6, 60px)', 
          border: '4px solid var(--cyan)', borderRadius: 12, overflow: 'hidden',
          boxShadow: '0 0 50px rgba(0, 243, 255, 0.15)',
          background: 'rgba(0,0,0,0.3)'
        }}>
          {grid.map((row, r) => row.map((cell, c) => {
            const isInitial = initial.includes(`${r}-${c}`)
            const isSelected = selected[0] === r && selected[1] === c
            return (
              <div 
                key={`${r}-${c}`}
                onClick={() => handleCellClick(r, c)}
                style={{ 
                  width: 60, height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: isInitial ? 'default' : 'pointer',
                  background: isSelected ? 'rgba(0, 243, 255, 0.2)' : 'transparent',
                  fontSize: '1.6rem', fontWeight: 800, 
                  color: isInitial ? 'var(--text1)' : 'var(--cyan)',
                  borderRight: (c + 1) % 3 === 0 ? '3px solid var(--cyan)' : '1px solid var(--border)',
                  borderBottom: (r + 1) % 2 === 0 ? '3px solid var(--cyan)' : '1px solid var(--border)',
                  transition: 'all 0.2s',
                  transform: isSelected ? 'scale(1.05)' : 'none',
                  zIndex: isSelected ? 2 : 1
                }}
              >
                {cell !== 0 ? cell : ''}
              </div>
            )
          }))}
        </div>
        
        {win && (
          <div className="fade-in" style={{ position: 'absolute', inset: -10, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: 20, zIndex: 10, border: '2px solid var(--emerald)', boxShadow: '0 0 40px var(--emerald-dim)' }}>
            <i className="fas fa-trophy" style={{fontSize: '4rem', color: 'var(--yellow)', marginBottom: 20}}></i>
            <h2 style={{color: 'var(--emerald)', fontSize: '2rem', fontWeight: 900}}>ZEN ACHIEVED!</h2>
            <p style={{color: 'var(--text2)', marginBottom: 20}}>You solved the puzzle.</p>
            <button className="btn btn-primary" onClick={() => generatePuzzle(difficulty)}>PLAY AGAIN</button>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        {[1,2,3,4,5,6].map(num => (
          <button 
            key={num} 
            onClick={() => handleNumberClick(num)}
            className="btn hover-glow"
            style={{ 
                width: 55, height: 55, borderRadius: 12, padding: 0, justifyContent: 'center', 
                fontSize: '1.4rem', fontWeight: 800, background: 'var(--bg2)', 
                border: '2px solid var(--cyan)', color: 'var(--cyan)' 
            }}
          >
            {num}
          </button>
        ))}
        <button 
          onClick={() => handleNumberClick(0)}
          className="btn"
          style={{ width: 80, height: 55, padding: 0, justifyContent: 'center', border: '2px solid var(--red)', color: 'var(--red)', background: 'rgba(239, 68, 68, 0.1)' }}
        >
          <i className="fas fa-eraser" style={{marginRight: 8}}></i> CLEAR
        </button>
      </div>
    </div>
  )
}

function ChessGame() {
  const initialBoard = [
    ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
    ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
    ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
  ]

  const [board, setBoard] = useState(initialBoard)
  const [selected, setSelected] = useState(null)
  const [turn, setTurn] = useState('white') // 'white' or 'black'

  const getPieceIcon = (piece) => {
    if (!piece) return null
    const color = piece === piece.toUpperCase() ? '#fff' : '#8b5cf6'
    const type = piece.toLowerCase()
    let icon = ''
    switch(type) {
      case 'r': icon = 'fa-chess-rook'; break
      case 'n': icon = 'fa-chess-knight'; break
      case 'b': icon = 'fa-chess-bishop'; break
      case 'q': icon = 'fa-chess-queen'; break
      case 'k': icon = 'fa-chess-king'; break
      case 'p': icon = 'fa-chess-pawn'; break
    }
    return <i className={`fas ${icon}`} style={{ color, filter: 'drop-shadow(0 0 5px rgba(0,0,0,0.5))' }}></i>
  }

  const handleCellClick = (r, c) => {
    const piece = board[r][c]
    
    if (selected) {
      // Move logic
      const [sr, sc] = selected
      if (sr === r && sc === c) {
        setSelected(null)
        return
      }

      // Very basic move execution
      const newBoard = board.map(row => [...row])
      newBoard[r][c] = board[sr][sc]
      newBoard[sr][sc] = null
      setBoard(newBoard)
      setSelected(null)
      setTurn(turn === 'white' ? 'black' : 'white')
    } else {
      if (!piece) return
      const isWhite = piece === piece.toUpperCase()
      if ((isWhite && turn === 'white') || (!isWhite && turn === 'black')) {
        setSelected([r, c])
      }
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 30, width: '100%' }}>
      <div style={{ background: 'var(--bg2)', padding: '10px 20px', borderRadius: 12, border: '1px solid var(--purple)', boxShadow: '0 0 15px var(--purple-dim)' }}>
        <h4 style={{ color: 'var(--purple)', margin: 0, fontSize: '1rem', fontWeight: 900 }}>
          {turn.toUpperCase()}'S TURN
        </h4>
      </div>

      <div style={{ 
        display: 'grid', gridTemplateColumns: 'repeat(8, 55px)', 
        border: '5px solid #2d1b4e', borderRadius: 10, overflow: 'hidden',
        boxShadow: '0 0 40px rgba(139, 92, 246, 0.2)'
      }}>
        {board.map((row, r) => row.map((piece, c) => {
          const isBlackCell = (r + c) % 2 === 1
          const isSelected = selected && selected[0] === r && selected[1] === c
          return (
            <div 
              key={`${r}-${c}`}
              onClick={() => handleCellClick(r, c)}
              style={{ 
                width: 55, height: 55, display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
                background: isSelected ? 'rgba(139, 92, 246, 0.4)' : (isBlackCell ? '#1e1b2e' : '#3c366b'),
                fontSize: '1.8rem',
                transition: 'all 0.1s'
              }}
            >
              {getPieceIcon(piece)}
            </div>
          )
        }))}
      </div>

      <button className="btn" onClick={() => {setBoard(initialBoard); setTurn('white'); setSelected(null)}} style={{ background: 'rgba(139, 92, 246, 0.1)', color: 'var(--purple)', border: '1px solid var(--purple)' }}>
        RESTART MATCH
      </button>
    </div>
  )
}
