import { useState, useEffect } from 'react'

const GAMES = [
  { id: 'sudoku', name: 'Sudoku Zen 6x6', icon: 'fa-table-cells', color: 'var(--cyan)', desc: 'Fast-paced logic training with 6x6 grids.' },
  { id: 'chess', name: 'Grandmaster Chess', icon: 'fa-chess', color: 'var(--purple)', desc: 'Strategic mastery against a computer opponent.' },
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
        <div className="card" style={{ minHeight: '700px', display: 'flex', flexDirection: 'column', padding: '30px' }}>
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
  const [invalidCells, setInvalidCells] = useState([])
  const [glowingGroups, setGlowingGroups] = useState({ rows: [], cols: [], boxes: [] })
  const [win, setWin] = useState(false)

  const generatePuzzle = (diff) => {
    const base = [
      [1, 2, 3, 4, 5, 6], [4, 5, 6, 1, 2, 3], [2, 3, 1, 5, 6, 4],
      [5, 6, 4, 2, 3, 1], [3, 1, 2, 6, 4, 5], [6, 4, 5, 3, 1, 2]
    ]
    const shuffled = [...base].sort(() => Math.random() - 0.5)
    const cellsToRemove = diff === 'easy' ? 12 : (diff === 'medium' ? 18 : 24)
    const newGrid = shuffled.map(row => [...row])
    const initCells = []
    let removed = 0
    while (removed < cellsToRemove) {
      const r = Math.floor(Math.random() * 6), c = Math.floor(Math.random() * 6)
      if (newGrid[r][c] !== 0) { newGrid[r][c] = 0; removed++ }
    }
    for(let r=0; r<6; r++) for(let c=0; c<6; c++) if(newGrid[r][c] !== 0) initCells.push(`${r}-${c}`)
    setGrid(newGrid); setInitial(initCells); setWin(false); setSelected([null, null]); setInvalidCells([]); setGlowingGroups({ rows: [], cols: [], boxes: [] })
  }

  useEffect(() => generatePuzzle(difficulty), [difficulty])

  const validateGrid = (newGrid) => {
    const invalid = []
    const newGlow = { rows: [], cols: [], boxes: [] }

    // Check Rows
    for (let r = 0; r < 6; r++) {
      const counts = {}, vals = []
      for (let c = 0; c < 6; c++) {
        const val = newGrid[r][c]
        if (val !== 0) {
          counts[val] = (counts[val] || 0) + 1
          vals.push(val)
        }
      }
      if (new Set(vals).size === 6) newGlow.rows.push(r)
      for (let c = 0; c < 6; c++) {
        if (newGrid[r][c] !== 0 && counts[newGrid[r][c]] > 1) invalid.push(`${r}-${c}`)
      }
    }

    // Check Cols
    for (let c = 0; c < 6; c++) {
      const counts = {}, vals = []
      for (let r = 0; r < 6; r++) {
        const val = newGrid[r][c]
        if (val !== 0) {
          counts[val] = (counts[val] || 0) + 1
          vals.push(val)
        }
      }
      if (new Set(vals).size === 6) newGlow.cols.push(c)
      for (let r = 0; r < 6; r++) {
        if (newGrid[r][c] !== 0 && counts[newGrid[r][c]] > 1) invalid.push(`${r}-${c}`)
      }
    }

    // Check Boxes (2x3)
    for (let b = 0; b < 6; b++) {
      const rStart = Math.floor(b / 2) * 2
      const cStart = (b % 2) * 3
      const counts = {}, vals = []
      for (let r = rStart; r < rStart + 2; r++) {
        for (let c = cStart; c < cStart + 3; c++) {
          const val = newGrid[r][c]
          if (val !== 0) {
            counts[val] = (counts[val] || 0) + 1
            vals.push(val)
          }
        }
      }
      if (new Set(vals).size === 6) newGlow.boxes.push(b)
      for (let r = rStart; r < rStart + 2; r++) {
        for (let c = cStart; c < cStart + 3; c++) {
          if (newGrid[r][c] !== 0 && counts[newGrid[r][c]] > 1) invalid.push(`${r}-${c}`)
        }
      }
    }

    setInvalidCells([...new Set(invalid)])
    setGlowingGroups(newGlow)
    
    // Clear glow after 1.5s
    setTimeout(() => setGlowingGroups({ rows: [], cols: [], boxes: [] }), 1500)

    if (newGlow.rows.length + newGlow.cols.length + newGlow.boxes.length > 0) {
        // Only win if entire grid is filled and valid
        let filled = true
        for(let r=0; r<6; r++) for(let c=0; c<6; c++) if(newGrid[r][c] === 0) filled = false
        if (filled && invalid.length === 0) setWin(true)
    }
  }

  const handleCellClick = (r, c) => !initial.includes(`${r}-${c}`) && setSelected([r, c])
  
  const handleNumberClick = (num) => {
    if (selected[0] !== null) {
      const newGrid = grid.map(row => [...row])
      newGrid[selected[0]][selected[1]] = num
      setGrid(newGrid); validateGrid(newGrid)
    }
  }

  const isCellInGlowingGroup = (r, c) => {
    if (glowingGroups.rows.includes(r)) return true
    if (glowingGroups.cols.includes(c)) return true
    const b = Math.floor(r / 2) * 2 + Math.floor(c / 3)
    if (glowingGroups.boxes.includes(b)) return true
    return false
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 30, padding: 20, width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 20, width: '100%', maxWidth: 400 }}>
         <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
            <label className="form-label" style={{fontSize: '.8rem'}}>DIFFICULTY</label>
            <select className="form-input" value={difficulty} onChange={(e) => setDifficulty(e.target.value)} style={{ background: 'var(--bg2)', cursor: 'pointer' }}>
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 60px)', border: '4px solid var(--cyan)', borderRadius: 12, overflow: 'hidden', boxShadow: '0 0 50px rgba(0, 243, 255, 0.15)', background: 'rgba(0,0,0,0.3)' }}>
          {grid.map((row, r) => row.map((cell, c) => {
            const isInitial = initial.includes(`${r}-${c}`)
            const isSelected = selected[0] === r && selected[1] === c
            const isInvalid = invalidCells.includes(`${r}-${c}`)
            const isGlowing = isCellInGlowingGroup(r, c)
            
            return (
              <div 
                key={`${r}-${c}`} 
                onClick={() => handleCellClick(r, c)} 
                style={{ 
                    width: 60, height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    cursor: isInitial ? 'default' : 'pointer', 
                    background: isInvalid ? 'rgba(239, 68, 68, 0.4)' : (isGlowing ? 'rgba(0, 243, 255, 0.4)' : (isSelected ? 'rgba(0, 243, 255, 0.2)' : 'transparent')), 
                    fontSize: '1.6rem', fontWeight: 800, 
                    color: isInvalid ? 'var(--red)' : (isInitial ? 'var(--text1)' : 'var(--cyan)'), 
                    borderRight: (c + 1) % 3 === 0 ? '3px solid var(--cyan)' : '1px solid var(--border)', 
                    borderBottom: (r + 1) % 2 === 0 ? '3px solid var(--cyan)' : '1px solid var(--border)', 
                    transition: 'all 0.3s', 
                    transform: isSelected || isGlowing ? 'scale(1.05)' : 'none', 
                    boxShadow: isGlowing ? '0 0 20px var(--cyan)' : 'none',
                    zIndex: isSelected || isGlowing ? 2 : 1 
                }}>
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
          <button key={num} onClick={() => handleNumberClick(num)} className="btn hover-glow" style={{ width: 55, height: 55, borderRadius: 12, padding: 0, justifyContent: 'center', fontSize: '1.4rem', fontWeight: 800, background: 'var(--bg2)', border: '2px solid var(--cyan)', color: 'var(--cyan)' }}>
            {num}
          </button>
        ))}
        <button onClick={() => handleNumberClick(0)} className="btn" style={{ width: 80, height: 55, padding: 0, justifyContent: 'center', border: '2px solid var(--red)', color: 'var(--red)', background: 'rgba(239, 68, 68, 0.1)' }}>
          <i className="fas fa-eraser" style={{marginRight: 8}}></i> CLEAR
        </button>
      </div>
    </div>
  )
}

function ChessGame() {
  const initialBoard = [
    ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'], ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
    [null, null, null, null, null, null, null, null], [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null], [null, null, null, null, null, null, null, null],
    ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'], ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
  ]

  const [board, setBoard] = useState(initialBoard)
  const [selected, setSelected] = useState(null)
  const [turn, setTurn] = useState('white')
  const [validMoves, setValidMoves] = useState([])
  const [capturedWhite, setCapturedWhite] = useState([])
  const [capturedBlack, setCapturedBlack] = useState([])
  const [gameOver, setGameOver] = useState(null)

  const isWhitePiece = (piece) => piece && piece === piece.toUpperCase()
  const isBlackPiece = (piece) => piece && piece === piece.toLowerCase()

  const getValidMoves = (r, c, b) => {
    const piece = b[r][c]
    if (!piece) return []
    const type = piece.toLowerCase(), isWhite = isWhitePiece(piece), moves = []
    const addMove = (nr, nc) => {
      if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
        const target = b[nr][nc]
        if (!target || (isWhite ? isBlackPiece(target) : isWhitePiece(target))) {
          moves.push(`${nr}-${nc}`); return !target
        }
      }
      return false
    }
    if (type === 'p') {
      const dir = isWhite ? -1 : 1, startRow = isWhite ? 6 : 1
      if (b[r + dir] && !b[r + dir][c]) {
        moves.push(`${r + dir}-${c}`)
        if (r === startRow && !b[r + 2 * dir][c]) moves.push(`${r + 2 * dir}-${c}`)
      }
      [c - 1, c + 1].forEach(nc => {
        if (nc >= 0 && nc < 8 && b[r + dir] && b[r + dir][nc]) {
          const target = b[r + dir][nc]
          if (isWhite ? isBlackPiece(target) : isWhitePiece(target)) moves.push(`${r + dir}-${nc}`)
        }
      })
    } else if (type === 'n') {
      [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]].forEach(([dr, dc]) => addMove(r + dr, c + dc))
    } else if (type === 'r' || type === 'q') {
      [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(([dr, dc]) => {
        let nr = r + dr, nc = c + dc; while (addMove(nr, nc)) { nr += dr; nc += dc }
      })
    }
    if (type === 'b' || type === 'q') {
      [[-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(([dr, dc]) => {
        let nr = r + dr, nc = c + dc; while (addMove(nr, nc)) { nr += dr; nc += dc }
      })
    } else if (type === 'k') {
      for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) if (dr !== 0 || dc !== 0) addMove(r + dr, c + dc)
    }
    return moves
  }

  const makeMove = (sr, sc, tr, tc) => {
    if (gameOver) return
    const target = board[tr][tc]
    if (target) {
      if (isWhitePiece(target)) setCapturedWhite(prev => [...prev, target])
      else setCapturedBlack(prev => [...prev, target])
      if (target.toLowerCase() === 'k') setGameOver(isWhitePiece(target) ? 'black' : 'white')
    }
    const newBoard = board.map(row => [...row])
    newBoard[tr][tc] = board[sr][sc]; newBoard[sr][sc] = null
    setBoard(newBoard); setTurn(turn === 'white' ? 'black' : 'white'); setSelected(null); setValidMoves([])
  }

  useEffect(() => {
    if (turn === 'black' && !gameOver) {
      setTimeout(() => {
        const allMoves = []
        for (let r = 0; r < 8; r++) {
          for (let c = 0; c < 8; c++) {
            const p = board[r][c]
            if (p && isBlackPiece(p)) {
              const ms = getValidMoves(r, c, board)
              ms.forEach(m => allMoves.push({ s: [r, c], t: m.split('-').map(Number) }))
            }
          }
        }
        if (allMoves.length > 0) {
          const move = allMoves[Math.floor(Math.random() * allMoves.length)]
          makeMove(move.s[0], move.s[1], move.t[0], move.t[1])
        }
      }, 800)
    }
  }, [turn, gameOver])

  const handleCellClick = (r, c) => {
    if (turn !== 'white' || gameOver) return
    const piece = board[r][c]
    if (selected) {
      if (validMoves.includes(`${r}-${c}`)) makeMove(selected[0], selected[1], r, c)
      else { setSelected(null); setValidMoves([]) }
    } else if (piece && isWhitePiece(piece)) {
      setSelected([r, c]); setValidMoves(getValidMoves(r, c, board))
    }
  }

  const getPieceIcon = (piece, size = '1.8rem', colorOverride = null) => {
    if (!piece) return null
    const color = colorOverride || (piece === piece.toUpperCase() ? '#fff' : '#8b5cf6')
    const type = piece.toLowerCase()
    let icon = ''
    switch(type) {
      case 'r': icon = 'fa-chess-rook'; break; case 'n': icon = 'fa-chess-knight'; break
      case 'b': icon = 'fa-chess-bishop'; break; case 'q': icon = 'fa-chess-queen'; break
      case 'k': icon = 'fa-chess-king'; break; case 'p': icon = 'fa-chess-pawn'; break
    }
    return <i className={`fas ${icon}`} style={{ color, filter: 'drop-shadow(0 0 5px rgba(0,0,0,0.5))', fontSize: size }}></i>
  }

  const CapturedArea = ({ pieces, title }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 60, alignItems: 'center', background: 'rgba(0,0,0,0.3)', padding: 10, borderRadius: 12, border: '1px solid var(--border)' }}>
      <div style={{ fontSize: '.7rem', color: 'var(--text3)', fontWeight: 800 }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, maxHeight: 400, flexWrap: 'wrap' }}>
        {pieces.map((p, i) => <div key={i}>{getPieceIcon(p, '1.2rem')}</div>)}
      </div>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, width: '100%', padding: 20 }}>
      <div style={{ display: 'flex', gap: 20, alignItems: 'center', background: 'rgba(0,0,0,0.4)', padding: '10px 30px', borderRadius: 40, border: '1px solid var(--purple)' }}>
        <div style={{ color: turn === 'white' ? 'var(--purple)' : 'var(--text3)', fontWeight: 800, fontSize: '1.2rem', textShadow: turn === 'white' ? '0 0 10px var(--purple)' : 'none' }}>PLAYER</div>
        <div style={{ color: 'var(--text3)' }}>VS</div>
        <div style={{ color: turn === 'black' ? 'var(--purple)' : 'var(--text3)', fontWeight: 800, fontSize: '1.2rem', textShadow: turn === 'black' ? '0 0 10px var(--purple)' : 'none' }}>TASKORA AI</div>
      </div>
      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
        <CapturedArea pieces={capturedWhite} title="LOST" />
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 55px)', border: '5px solid #2d1b4e', borderRadius: 10, overflow: 'hidden', boxShadow: '0 0 40px rgba(139, 92, 246, 0.2)' }}>
            {board.map((row, r) => row.map((piece, c) => {
              const isBlackCell = (r + c) % 2 === 1, isSelected = selected && selected[0] === r && selected[1] === c, isValid = validMoves.includes(`${r}-${c}`)
              return (
                <div key={`${r}-${c}`} onClick={() => handleCellClick(r, c)} style={{ width: 55, height: 55, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: isSelected ? 'rgba(139, 92, 246, 0.4)' : (isBlackCell ? '#1e1b2e' : '#3c366b'), fontSize: '1.8rem', position: 'relative' }}>
                  {isValid && <div style={{ position: 'absolute', width: 15, height: 15, borderRadius: '50%', background: 'rgba(139, 92, 246, 0.5)' }}></div>}
                  {getPieceIcon(piece)}
                </div>
              )
            }))}
          </div>
          {gameOver && (
            <div className="fade-in" style={{ position: 'absolute', inset: -10, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: 12, zIndex: 10, border: '2px solid var(--purple)', boxShadow: '0 0 50px var(--purple-dim)' }}>
              <i className={`fas ${gameOver === 'white' ? 'fa-crown' : 'fa-skull-crossbones'}`} style={{fontSize: '4rem', color: gameOver === 'white' ? 'var(--yellow)' : 'var(--red)', marginBottom: 20}}></i>
              <h2 style={{color: '#fff', fontSize: '2.2rem', fontWeight: 900}}>{gameOver === 'white' ? 'VICTORY!' : 'GAME OVER'}</h2>
              <p style={{color: 'var(--text2)', marginBottom: 20}}>{gameOver === 'white' ? 'You defeated the Taskora AI.' : 'The AI has claimed your kingdom.'}</p>
              <button className="btn btn-primary" onClick={() => {setBoard(initialBoard); setTurn('white'); setGameOver(null); setCapturedWhite([]); setCapturedBlack([]); setSelected(null); setValidMoves([])}}>REMATCH</button>
            </div>
          )}
        </div>
        <CapturedArea pieces={capturedBlack} title="ENEMY LOST" />
      </div>
      <button className="btn" onClick={() => {setBoard(initialBoard); setTurn('white'); setGameOver(null); setCapturedWhite([]); setCapturedBlack([]); setSelected(null); setValidMoves([])}} style={{ background: 'rgba(139, 92, 246, 0.1)', color: 'var(--purple)', border: '1px solid var(--purple)', marginTop: 10 }}>
        <i className="fas fa-rotate" style={{marginRight: 8}}></i> RESET BOARD
      </button>
    </div>
  )
}
