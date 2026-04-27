import { useState, useEffect, useRef } from 'react'

const GAMES = [
  { id: 'sudoku', name: 'Sudoku Zen 6x6', icon: 'fa-table-cells', color: 'var(--cyan)', desc: 'Fast-paced logic training with 6x6 grids.' },
  { id: 'chess', name: 'Grandmaster Chess', icon: 'fa-chess', color: 'var(--purple)', desc: 'Strategic mastery against a computer opponent.' },
  { id: 'crossword', name: 'LexiCross', icon: 'fa-font', color: 'var(--emerald)', desc: 'Boost your vocabulary with daily word grids.' }
]

const playSound = (type) => {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)()
        const osc = ctx.createOscillator(); const gain = ctx.createGain(); osc.connect(gain); gain.connect(ctx.destination)
        if (type === 'click') {
            osc.type = 'sine'; osc.frequency.setValueAtTime(440, ctx.currentTime); osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1)
            gain.gain.setValueAtTime(0.1, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1); osc.start(); osc.stop(ctx.currentTime + 0.1)
        } else if (type === 'win') {
            [523.25, 659.25, 783.99, 1046.50].forEach((f, i) => {
                const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(f, ctx.currentTime + i * 0.1); g.connect(ctx.destination); o.connect(g)
                g.gain.setValueAtTime(0.1, ctx.currentTime + i * 0.1); g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.1 + 0.5); o.start(ctx.currentTime + i * 0.1); o.stop(ctx.currentTime + i * 0.1 + 0.5)
            })
        }
    } catch(e) {}
}

export default function Games() {
  const [activeGame, setActiveGame] = useState(null)
  return (
    <div className="fade-in">
      <div className="page-header"><div><h2>Mind Relief Hub</h2><p>Take a break, sharpen your mind, and recharge your focus.</p></div></div>
      {!activeGame ? (
        <div className="grid-3" style={{ marginTop: 20 }}>
          {GAMES.map(game => (
            <div key={game.id} className="card hover-glow" onClick={() => setActiveGame(game.id)} style={{ cursor: 'pointer', textAlign: 'center', border: `1px solid ${game.color}33`, padding: '40px 20px' }}>
              <div style={{ width: 90, height: 90, borderRadius: '24px', background: `${game.color}11`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 25px', fontSize: '2.8rem', color: game.color, border: `2px solid ${game.color}44`, boxShadow: `0 0 30px ${game.color}22`, transform: 'rotate(-5deg)' }}><i className={`fas ${game.icon}`}></i></div>
              <h3 style={{ fontSize: '1.5rem', marginBottom: 12, fontWeight: 900 }}>{game.name}</h3><p style={{ color: 'var(--text2)', fontSize: '.95rem', lineHeight: 1.5, marginBottom: 25 }}>{game.desc}</p>
              <button className="btn" style={{ width: '100%', background: 'var(--glass)', border: `1px solid ${game.color}66`, color: game.color, fontWeight: 800 }}>LAUNCH GAME</button>
            </div>
          ))}
        </div>
      ) : (
        <div className="card arcade-container" style={{ minHeight: '750px', display: 'flex', flexDirection: 'column', padding: '0', overflow: 'hidden', border: `1px solid ${GAMES.find(g => g.id === activeGame).color}33` }}>
          <div style={{ padding: '25px 35px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
            <button onClick={() => setActiveGame(null)} className="btn hover-scale" style={{ background: 'var(--bg2)', padding: '10px 20px', borderRadius: 12 }}><i className="fas fa-chevron-left" style={{marginRight: 10}}></i> EXIT HUB</button>
            <div style={{ textAlign: 'center' }}><h2 style={{ color: GAMES.find(g => g.id === activeGame).color, fontSize: '1.8rem', fontWeight: 900, textShadow: `0 0 25px ${GAMES.find(g => g.id === activeGame).color}66`, margin: 0 }}>{GAMES.find(g => g.id === activeGame).name.toUpperCase()}</h2><div style={{ width: 40, height: 4, background: GAMES.find(g => g.id === activeGame).color, margin: '8px auto 0', borderRadius: 10 }}></div></div>
            <div style={{ width: 140 }}></div>
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0f', position: 'relative', overflow: 'hidden' }}>
             <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '120%', height: '120%', background: `radial-gradient(circle at 50% 50%, ${GAMES.find(g => g.id === activeGame).color}08 0%, transparent 70%)`, pointerEvents: 'none' }}></div>
            {activeGame === 'sudoku' && <Sudoku6x6 />}
            {activeGame === 'chess' && <ChessGame />}
            {activeGame === 'crossword' && <LexiCross />}
          </div>
        </div>
      )}
    </div>
  )
}

function LexiCross() {
  const puzzles = [
    {
      grid: [
        ['P', 'Y', 'T', 'H', 'O', 'N'],
        ['R', '.', 'A', '.', 'U', '.'],
        ['O', 'F', 'S', 'E', 'T', 'S'],
        ['G', '.', 'K', '.', 'P', '.'],
        ['R', 'E', 'A', 'C', 'T', 'S'],
        ['A', '.', 'S', '.', 'S', '.']
      ],
      clues: {
          across: [
              { n: 1, r: 0, c: 0, l: 6, q: "A powerful programming language (and a snake)." },
              { n: 2, r: 2, c: 0, l: 6, q: "Positions relative to a starting point." },
              { n: 3, r: 4, c: 0, l: 6, q: "Responds to a stimulus or chemical change." }
          ],
          down: [
              { n: 1, r: 0, c: 0, l: 6, q: "Series of instructions for a computer." },
              { n: 4, r: 0, c: 2, l: 6, q: "Small duties or chores assigned." },
              { n: 5, r: 0, c: 4, l: 6, q: "Exits from a building or stage." }
          ]
      }
    }
  ]

  const [puzzle] = useState(puzzles[0])
  const [userGrid, setUserGrid] = useState(puzzle.grid.map(row => row.map(cell => cell === '.' ? '.' : '')))
  const [selected, setSelected] = useState([0, 0]) // [r, c]
  const [direction, setDirection] = useState('across')
  const [win, setWin] = useState(false)

  const handleCellClick = (r, c) => {
    if (puzzle.grid[r][c] === '.') return
    if (selected[0] === r && selected[1] === c) {
        setDirection(direction === 'across' ? 'down' : 'across')
    } else {
        setSelected([r, c])
    }
  }

  const handleKeyDown = (e) => {
    if (win) return
    const [r, c] = selected
    if (e.key.length === 1 && e.key.match(/[a-z]/i)) {
        const newGrid = [...userGrid.map(row => [...row])]
        newGrid[r][c] = e.key.toUpperCase()
        setUserGrid(newGrid)
        playSound('click')
        // Advance
        if (direction === 'across' && c < 5 && puzzle.grid[r][c+1] !== '.') setSelected([r, c+1])
        else if (direction === 'down' && r < 5 && puzzle.grid[r+1][c] !== '.') setSelected([r+1, c])
        checkWin(newGrid)
    } else if (e.key === 'Backspace') {
        const newGrid = [...userGrid.map(row => [...row])]
        newGrid[r][c] = ''
        setUserGrid(newGrid)
    }
  }

  const checkWin = (grid) => {
      const isComplete = grid.every((row, r) => row.every((cell, c) => cell === puzzle.grid[r][c]))
      if (isComplete) { setWin(true); playSound('win') }
  }

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selected, direction, win])

  const getCellNum = (r, c) => {
      const a = puzzle.clues.across.find(cl => cl.r === r && cl.c === c)
      const d = puzzle.clues.down.find(cl => cl.r === r && cl.c === c)
      return a ? a.n : (d ? d.n : null)
  }

  return (
    <div style={{ display: 'flex', gap: 40, padding: 40, width: '100%', maxWidth: 1000 }}>
        {/* Grid Area */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 60px)', background: '#1a1a2e', padding: 10, borderRadius: 15, boxShadow: '0 20px 50px rgba(0,0,0,0.5)', height: 'fit-content', position: 'relative' }}>
            {userGrid.map((row, r) => row.map((cell, c) => {
                const isBlack = cell === '.'
                const isSelected = selected[0] === r && selected[1] === c
                const num = getCellNum(r, c)
                return (
                    <div 
                        key={`${r}-${c}`}
                        onClick={() => handleCellClick(r, c)}
                        style={{ 
                            width: 60, height: 60, background: isBlack ? '#000' : (isSelected ? 'rgba(16, 185, 129, 0.2)' : '#fff'),
                            border: '1px solid #ddd', cursor: isBlack ? 'default' : 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '1.5rem', fontWeight: 900, color: '#1a1a2e', position: 'relative'
                        }}
                    >
                        {num && <span style={{ position: 'absolute', top: 2, left: 4, fontSize: '.65rem', color: '#1a1a2e' }}>{num}</span>}
                        {!isBlack && cell}
                    </div>
                )
            }))}
            {win && (
                <div className="fade-in" style={{ position: 'absolute', inset: -10, background: 'rgba(5, 46, 22, 0.9)', backdropFilter: 'blur(10px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: 20, zIndex: 10, border: '2px solid var(--emerald)', boxShadow: '0 0 50px var(--emerald)' }}>
                    <i className="fas fa-medal" style={{fontSize: '4rem', color: 'var(--yellow)', marginBottom: 20}}></i>
                    <h2 style={{color: '#fff', fontSize: '2rem', fontWeight: 900}}>GRID MASTER</h2>
                    <p style={{color: 'var(--emerald)', fontWeight: 800}}>ALL WORDS CORRECT</p>
                    <button className="btn btn-primary" onClick={() => window.location.reload()} style={{marginTop: 20}}>NEXT PUZZLE</button>
                </div>
            )}
        </div>

        {/* Clues Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.05)', padding: 25, borderRadius: 20, border: '1px solid var(--emerald-dim)' }}>
                <h3 style={{ color: 'var(--emerald)', marginBottom: 15, fontSize: '1.2rem', fontWeight: 900, display: 'flex', alignItems: 'center' }}>
                    <i className="fas fa-arrows-left-right" style={{marginRight: 12}}></i> ACROSS
                </h3>
                {puzzle.clues.across.map(cl => (
                    <div key={cl.n} style={{ padding: '12px 0', borderBottom: '1px solid rgba(16, 185, 129, 0.1)', color: direction === 'across' && selected[0] === cl.r ? '#fff' : 'var(--text2)', opacity: direction === 'across' && selected[0] === cl.r ? 1 : 0.6 }}>
                        <span style={{ fontWeight: 900, color: 'var(--emerald)', marginRight: 10 }}>{cl.n}.</span> {cl.q}
                    </div>
                ))}
            </div>

            <div style={{ background: 'rgba(16, 185, 129, 0.05)', padding: 25, borderRadius: 20, border: '1px solid var(--emerald-dim)' }}>
                <h3 style={{ color: 'var(--emerald)', marginBottom: 15, fontSize: '1.2rem', fontWeight: 900, display: 'flex', alignItems: 'center' }}>
                    <i className="fas fa-arrows-up-down" style={{marginRight: 12}}></i> DOWN
                </h3>
                {puzzle.clues.down.map(cl => (
                    <div key={cl.n} style={{ padding: '12px 0', borderBottom: '1px solid rgba(16, 185, 129, 0.1)', color: direction === 'down' && selected[1] === cl.c ? '#fff' : 'var(--text2)', opacity: direction === 'down' && selected[1] === cl.c ? 1 : 0.6 }}>
                        <span style={{ fontWeight: 900, color: 'var(--emerald)', marginRight: 10 }}>{cl.n}.</span> {cl.q}
                    </div>
                ))}
            </div>
            <p style={{fontSize: '.85rem', color: 'var(--text3)', fontStyle: 'italic', textAlign: 'center'}}>Tap a square to change direction. Use your keyboard to type!</p>
        </div>
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
  const [seconds, setSeconds] = useState(0)
  const [highScores, setHighScores] = useState(() => {
    const saved = localStorage.getItem('taskora_sudoku_scores'); return saved ? JSON.parse(saved) : { easy: null, medium: null, hard: null }
  })
  const timerRef = useRef(null)
  const formatTime = (s) => { if (s === null) return '--:--'; const mins = Math.floor(s / 60), secs = s % 60; return `${mins}:${secs < 10 ? '0' : ''}${secs}` }
  const generatePuzzle = (diff) => {
    let solved = [[1,2,3,4,5,6],[4,5,6,1,2,3],[2,3,1,5,6,4],[5,6,4,2,3,1],[3,1,2,6,4,5],[6,4,5,3,1,2]]
    for (let i = 0; i < 3; i++) if (Math.random() > 0.5) { const r1 = i*2, r2 = i*2+1; const temp = solved[r1]; solved[r1] = solved[r2]; solved[r2] = temp }
    for (let i = 0; i < 2; i++) if (Math.random() > 0.5) { const c1 = i*3, c2 = i*3 + (Math.floor(Math.random()*2)+1)%3; for(let r=0; r<6; r++) { const temp = solved[r][c1]; solved[r][c1] = solved[r][c2]; solved[r][c2] = temp } }
    const cellsToRemove = diff === 'easy' ? 12 : (diff === 'medium' ? 18 : 24), newGrid = solved.map(row => [...row]), initCells = []
    let removed = 0; while (removed < cellsToRemove) { const r = Math.floor(Math.random()*6), c = Math.floor(Math.random()*6); if (newGrid[r][c] !== 0) { newGrid[r][c] = 0; removed++ } }
    for(let r=0; r<6; r++) for(let c=0; c<6; c++) if(newGrid[r][c] !== 0) initCells.push(`${r}-${c}`)
    setGrid(newGrid); setInitial(initCells); setWin(false); setSelected([null, null]); setInvalidCells([]); setGlowingGroups({ rows: [], cols: [], boxes: [] }); setSeconds(0)
    if (timerRef.current) clearInterval(timerRef.current); timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000)
  }
  useEffect(() => { generatePuzzle(difficulty); return () => clearInterval(timerRef.current) }, [difficulty])
  useEffect(() => {
    const handleKeyDown = (e) => { if (win || selected[0] === null) return; if (e.key >= '1' && e.key <= '6') handleNumberClick(parseInt(e.key)); if (e.key === 'Backspace' || e.key === '0') handleNumberClick(0) }
    window.addEventListener('keydown', handleKeyDown); return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selected, win])
  const validateGrid = (newGrid) => {
    const invalid = [], newGlow = { rows: [], cols: [], boxes: [] }
    for (let r = 0; r < 6; r++) { const counts = {}, vals = []; for (let c = 0; c < 6; c++) { const val = newGrid[r][c]; if (val !== 0) { counts[val] = (counts[val] || 0) + 1; vals.push(val) } }; if (new Set(vals).size === 6) newGlow.rows.push(r); for (let c = 0; c < 6; c++) if (newGrid[r][c] !== 0 && counts[newGrid[r][c]] > 1) invalid.push(`${r}-${c}`) }
    for (let c = 0; c < 6; c++) { const counts = {}, vals = []; for (let r = 0; r < 6; r++) { const val = newGrid[r][c]; if (val !== 0) { counts[val] = (counts[val] || 0) + 1; vals.push(val) } }; if (new Set(vals).size === 6) newGlow.cols.push(c); for (let r = 0; r < 6; r++) if (newGrid[r][c] !== 0 && counts[newGrid[r][c]] > 1) invalid.push(`${r}-${c}`) }
    for (let b = 0; b < 6; b++) { const rStart = Math.floor(b / 2) * 2, cStart = (b % 2) * 3, counts = {}, vals = []; for (let r = rStart; r < rStart + 2; r++) for (let c = cStart; c < cStart + 3; c++) { const val = newGrid[r][c]; if (val !== 0) { counts[val] = (counts[val] || 0) + 1; vals.push(val) } }; if (new Set(vals).size === 6) newGlow.boxes.push(b); for (let r = rStart; r < rStart + 2; r++) for (let c = cStart; c < cStart + 3; c++) if (newGrid[r][c] !== 0 && counts[newGrid[r][c]] > 1) invalid.push(`${r}-${c}`) }
    setInvalidCells([...new Set(invalid)]); setGlowingGroups(newGlow); setTimeout(() => setGlowingGroups({ rows: [], cols: [], boxes: [] }), 1200)
    if (invalid.length > invalidCells.length) playSound('error'); let filled = true; for(let r=0; r<6; r++) for(let c=0; c<6; c++) if(newGrid[r][c] === 0) filled = false
    if (filled && invalid.length === 0) { setWin(true); clearInterval(timerRef.current); playSound('win'); const currentBest = highScores[difficulty]; if (currentBest === null || seconds < currentBest) { const updated = { ...highScores, [difficulty]: seconds }; setHighScores(updated); localStorage.setItem('taskora_sudoku_scores', JSON.stringify(updated)) } }
  }
  const handleCellClick = (r, c) => !initial.includes(`${r}-${c}`) && setSelected([r, c])
  const handleNumberClick = (num) => { if (selected[0] !== null) { const newGrid = grid.map(row => [...row]); newGrid[selected[0]][selected[1]] = num; setGrid(newGrid); validateGrid(newGrid); if (num !== 0 && !invalidCells.includes(`${selected[0]}-${selected[1]}`)) playSound('click') } }
  const isCellInGlowingGroup = (r, c) => glowingGroups.rows.includes(r) || glowingGroups.cols.includes(c) || glowingGroups.boxes.includes(Math.floor(r/2)*2+Math.floor(c/3))
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 25, padding: '30px', width: '100%', maxWidth: 800 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, width: '100%', maxWidth: 500 }}><div style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: 20, border: '1px solid var(--border)', textAlign: 'center' }}><div style={{fontSize: '.75rem', color: 'var(--text3)', fontWeight: 800, letterSpacing: 1, marginBottom: 5}}>TIMER</div><div style={{fontSize: '1.8rem', fontWeight: 900, color: 'var(--cyan)', fontFamily: 'monospace'}}>{formatTime(seconds)}</div></div><div style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: 20, border: '1px solid var(--border)', textAlign: 'center' }}><div style={{fontSize: '.75rem', color: 'var(--text3)', fontWeight: 800, letterSpacing: 1, marginBottom: 5}}>{difficulty.toUpperCase()} BEST</div><div style={{fontSize: '1.8rem', fontWeight: 900, color: 'var(--yellow)', fontFamily: 'monospace'}}>{formatTime(highScores[difficulty])}</div></div></div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 15, width: '100%', maxWidth: 500, background: 'var(--bg2)', padding: '15px', borderRadius: 25, border: '1px solid var(--border)' }}><div style={{ flex: 1 }}><select className="form-input" value={difficulty} onChange={(e) => setDifficulty(e.target.value)} style={{ background: 'transparent', border: 'none', fontWeight: 800, color: 'var(--cyan)', height: '40px' }}><option value="easy">EASY MODE</option><option value="medium">MEDIUM MODE</option><option value="hard">HARD MODE</option></select></div><button className="btn btn-primary" onClick={() => generatePuzzle(difficulty)} style={{ height: 40, padding: '0 25px', borderRadius: 15 }}><i className="fas fa-rotate" style={{marginRight: 8}}></i> NEW GRID</button></div>
      <div style={{ position: 'relative' }}><div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 65px)', border: '6px solid #1a1a2e', borderRadius: 20, overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', background: '#0f0f1a' }}>{grid.map((row, r) => row.map((cell, c) => { const isInitial = initial.includes(`${r}-${c}`), isSelected = selected[0] === r && selected[1] === c, isInvalid = invalidCells.includes(`${r}-${c}`), isGlowing = isCellInGlowingGroup(r, c); return ( <div key={`${r}-${c}`} onClick={() => handleCellClick(r, c)} style={{ width: 65, height: 65, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: isInitial ? 'default' : 'pointer', background: isInvalid ? 'rgba(239, 68, 68, 0.4)' : (isGlowing ? 'rgba(0, 243, 255, 0.4)' : (isSelected ? 'rgba(0, 243, 255, 0.2)' : 'transparent')), fontSize: '1.8rem', fontWeight: 900, color: isInvalid ? '#ff4d4d' : (isInitial ? '#fff' : 'var(--cyan)'), borderRight: (c + 1) % 3 === 0 ? '4px solid #1a1a2e' : '1px solid #1e1e30', borderBottom: (r + 1) % 2 === 0 ? '4px solid #1a1a2e' : '1px solid #1e1e30', transition: 'all 0.3s', transform: isSelected || isGlowing ? 'scale(1.08)' : 'none', boxShadow: isGlowing ? '0 0 25px var(--cyan)' : 'none', zIndex: isSelected || isGlowing ? 2 : 1 }}>{cell !== 0 ? cell : ''}</div> ) }))}</div>{win && ( <div className="fade-in" style={{ position: 'absolute', inset: -20, background: 'rgba(5, 5, 10, 0.95)', backdropFilter: 'blur(15px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: 30, zIndex: 10, border: '2px solid var(--cyan)', boxShadow: '0 0 60px var(--cyan-dim)' }}><div style={{ width: 100, height: 100, background: 'var(--grad-cyan)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 25, boxShadow: '0 0 40px var(--cyan)' }}><i className="fas fa-check" style={{fontSize: '3.5rem', color: '#000'}}></i></div><h2 style={{color: '#fff', fontSize: '2.5rem', fontWeight: 900}}>LEVEL COMPLETE</h2><div style={{ display: 'flex', gap: 30, margin: '20px 0' }}><div style={{textAlign: 'center'}}><p style={{fontSize: '.8rem', color: 'var(--text3)'}}>TIME</p><h3 style={{fontSize: '1.8rem', color: 'var(--cyan)'}}>{formatTime(seconds)}</h3></div><div style={{textAlign: 'center'}}><p style={{fontSize: '.8rem', color: 'var(--text3)'}}>BEST</p><h3 style={{fontSize: '1.8rem', color: 'var(--yellow)'}}>{formatTime(highScores[difficulty])}</h3></div></div>{seconds === highScores[difficulty] && <div className="pulse" style={{ color: 'var(--yellow)', fontWeight: 900, marginBottom: 25 }}>🏆 NEW RECORD SET! 🏆</div>}<button className="btn btn-primary" onClick={() => generatePuzzle(difficulty)} style={{ padding: '15px 40px', borderRadius: 20 }}>PLAY NEXT</button></div> )}</div>
      <div style={{ display: 'flex', gap: 15, flexWrap: 'wrap', justifyContent: 'center', background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: 30, border: '1px solid var(--border)' }}>{[1,2,3,4,5,6].map(num => ( <button key={num} onClick={() => handleNumberClick(num)} className="btn hover-glow" style={{ width: 65, height: 65, borderRadius: 20, padding: 0, justifyContent: 'center', fontSize: '1.8rem', fontWeight: 900, background: 'var(--bg2)', border: '2px solid var(--cyan)', color: 'var(--cyan)' }}>{num}</button> ))}<button onClick={() => handleNumberClick(0)} className="btn" style={{ width: 100, height: 65, borderRadius: 20, border: '2px solid var(--red)', color: '#ff4d4d', background: 'rgba(239, 68, 68, 0.05)', fontWeight: 800 }}>ERASE</button></div>
      <p style={{fontSize: '.8rem', color: 'var(--text3)', fontStyle: 'italic'}}>PC Tip: Use numbers 1-6 on your keyboard to play faster!</p>
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
  const [board, setBoard] = useState(initialBoard); const [selected, setSelected] = useState(null); const [turn, setTurn] = useState('white'); const [validMoves, setValidMoves] = useState([]); const [capturedWhite, setCapturedWhite] = useState([]); const [capturedBlack, setCapturedBlack] = useState([]); const [gameOver, setGameOver] = useState(null)
  const isWhitePiece = (piece) => piece && piece === piece.toUpperCase(); const isBlackPiece = (piece) => piece && piece === piece.toLowerCase()
  const getValidMoves = (r, c, b) => {
    const piece = b[r][c]; if (!piece) return []; const type = piece.toLowerCase(), isWhite = isWhitePiece(piece), moves = []
    const addMove = (nr, nc) => { if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) { const target = b[nr][nc]; if (!target || (isWhite ? isBlackPiece(target) : isWhitePiece(target))) { moves.push(`${nr}-${nc}`); return !target } } return false }
    if (type === 'p') { const dir = isWhite ? -1 : 1, startRow = isWhite ? 6 : 1; if (b[r + dir] && !b[r + dir][c]) { moves.push(`${r + dir}-${c}`); if (r === startRow && !b[r + 2 * dir][c]) moves.push(`${r + 2 * dir}-${c}`) }; [c - 1, c + 1].forEach(nc => { if (nc >= 0 && nc < 8 && b[r + dir] && b[r + dir][nc]) { const target = b[r + dir][nc]; if (isWhite ? isBlackPiece(target) : isWhitePiece(target)) moves.push(`${r + dir}-${nc}`) } }) }
    else if (type === 'n') [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]].forEach(([dr, dc]) => addMove(r + dr, c + dc))
    else if (type === 'r' || type === 'q') [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(([dr, dc]) => { let nr = r + dr, nc = c + dc; while (addMove(nr, nc)) { nr += dr; nc += dc } })
    if (type === 'b' || type === 'q') [[-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(([dr, dc]) => { let nr = r + dr, nc = c + dc; while (addMove(nr, nc)) { nr += dr; nc += dc } })
    else if (type === 'k') for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) if (dr !== 0 || dc !== 0) addMove(r + dr, c + dc)
    return moves
  }
  const makeMove = (sr, sc, tr, tc) => {
    if (gameOver) return; const target = board[tr][tc]
    if (target) { if (isWhitePiece(target)) setCapturedWhite(prev => [...prev, target]); else setCapturedBlack(prev => [...prev, target]); if (target.toLowerCase() === 'k') setGameOver(isWhitePiece(target) ? 'black' : 'white') }
    const newBoard = board.map(row => [...row]); newBoard[tr][tc] = board[sr][sc]; newBoard[sr][sc] = null; setBoard(newBoard); setTurn(turn === 'white' ? 'black' : 'white'); setSelected(null); setValidMoves([])
  }
  useEffect(() => { if (turn === 'black' && !gameOver) { setTimeout(() => { const allMoves = []; for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) { const p = board[r][c]; if (p && isBlackPiece(p)) { const ms = getValidMoves(r, c, board); ms.forEach(m => allMoves.push({ s: [r, c], t: m.split('-').map(Number) })) } } if (allMoves.length > 0) { const move = allMoves[Math.floor(Math.random() * allMoves.length)]; makeMove(move.s[0], move.s[1], move.t[0], move.t[1]) } }, 800) } }, [turn, gameOver])
  const handleCellClick = (r, c) => { if (turn !== 'white' || gameOver) return; const piece = board[r][c]; if (selected) { if (validMoves.includes(`${r}-${c}`)) makeMove(selected[0], selected[1], r, c); else { setSelected(null); setValidMoves([]) } } else if (piece && isWhitePiece(piece)) { setSelected([r, c]); setValidMoves(getValidMoves(r, c, board)) } }
  const getPieceIcon = (piece, size = '1.8rem', colorOverride = null) => { if (!piece) return null; const color = colorOverride || (piece === piece.toUpperCase() ? '#fff' : '#8b5cf6'), type = piece.toLowerCase(); let icon = ''; switch(type) { case 'r': icon = 'fa-chess-rook'; break; case 'n': icon = 'fa-chess-knight'; break; case 'b': icon = 'fa-chess-bishop'; break; case 'q': icon = 'fa-chess-queen'; break; case 'k': icon = 'fa-chess-king'; break; case 'p': icon = 'fa-chess-pawn'; break }; return <i className={`fas ${icon}`} style={{ color, filter: 'drop-shadow(0 0 5px rgba(0,0,0,0.5))', fontSize: size }}></i> }
  const CapturedArea = ({ pieces, title }) => ( <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 60, alignItems: 'center', background: 'rgba(0,0,0,0.3)', padding: 10, borderRadius: 12, border: '1px solid var(--border)' }}><div style={{ fontSize: '.7rem', color: 'var(--text3)', fontWeight: 800 }}>{title}</div><div style={{ display: 'flex', flexDirection: 'column', gap: 5, maxHeight: 400, flexWrap: 'wrap' }}>{pieces.map((p, i) => <div key={i}>{getPieceIcon(p, '1.2rem')}</div>)}</div></div> )
  return ( <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, width: '100%', padding: 30 }}><div style={{ display: 'flex', gap: 20, alignItems: 'center', background: 'rgba(0,0,0,0.4)', padding: '10px 30px', borderRadius: 40, border: '1px solid var(--purple)' }}><div style={{ color: turn === 'white' ? 'var(--purple)' : 'var(--text3)', fontWeight: 800, fontSize: '1.2rem', textShadow: turn === 'white' ? '0 0 10px var(--purple)' : 'none' }}>PLAYER</div><div style={{ color: 'var(--text3)' }}>VS</div><div style={{ color: turn === 'black' ? 'var(--purple)' : 'var(--text3)', fontWeight: 800, fontSize: '1.2rem', textShadow: turn === 'black' ? '0 0 10px var(--purple)' : 'none' }}>TASKORA AI</div></div><div style={{ display: 'flex', gap: 30, alignItems: 'flex-start' }}><CapturedArea pieces={capturedWhite} title="LOST" /><div style={{ position: 'relative' }}><div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 60px)', border: '6px solid #1a1a2e', borderRadius: 15, overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>{board.map((row, r) => row.map((piece, c) => { const isBlackCell = (r + c) % 2 === 1, isSelected = selected && selected[0] === r && selected[1] === c, isValid = validMoves.includes(`${r}-${c}`); return ( <div key={`${r}-${c}`} onClick={() => handleCellClick(r, c)} style={{ width: 60, height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: isSelected ? 'rgba(139, 92, 246, 0.4)' : (isBlackCell ? '#1e1b2e' : '#3c366b'), fontSize: '1.8rem', position: 'relative' }}> {isValid && <div style={{ position: 'absolute', width: 15, height: 15, borderRadius: '50%', background: 'rgba(139, 92, 246, 0.5)' }}></div>} {getPieceIcon(piece)} </div> ) }))}</div>{gameOver && ( <div className="fade-in" style={{ position: 'absolute', inset: -15, background: 'rgba(5, 5, 10, 0.95)', backdropFilter: 'blur(15px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: 20, zIndex: 10, border: '2px solid var(--purple)', boxShadow: '0 0 60px var(--purple-dim)' }}><i className={`fas ${gameOver === 'white' ? 'fa-crown' : 'fa-skull-crossbones'}`} style={{fontSize: '4rem', color: gameOver === 'white' ? 'var(--yellow)' : 'var(--red)', marginBottom: 20}}></i><h2 style={{color: '#fff', fontSize: '2.5rem', fontWeight: 900}}>{gameOver === 'white' ? 'VICTORY!' : 'GAME OVER'}</h2><p style={{color: 'var(--text2)', marginBottom: 20}}>{gameOver === 'white' ? 'You defeated the Taskora AI.' : 'The AI has claimed your kingdom.'}</p><button className="btn btn-primary" onClick={() => {setBoard(initialBoard); setTurn('white'); setGameOver(null); setCapturedWhite([]); setCapturedBlack([]); setSelected(null); setValidMoves([])}}>REMATCH</button></div> )}</div><CapturedArea pieces={capturedBlack} title="ENEMY LOST" /></div><button className="btn" onClick={() => {setBoard(initialBoard); setTurn('white'); setGameOver(null); setCapturedWhite([]); setCapturedBlack([]); setSelected(null); setValidMoves([])}} style={{ background: 'rgba(139, 92, 246, 0.1)', color: 'var(--purple)', border: '1px solid var(--purple)', marginTop: 10 }}><i className="fas fa-rotate" style={{marginRight: 8}}></i> RESET BOARD</button></div> )
}
