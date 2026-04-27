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
        if (type === 'click') { osc.type = 'sine'; osc.frequency.setValueAtTime(440, ctx.currentTime); osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1); gain.gain.setValueAtTime(0.1, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1); osc.start(); osc.stop(ctx.currentTime + 0.1) }
        else if (type === 'success') { osc.type = 'triangle'; osc.frequency.setValueAtTime(660, ctx.currentTime); osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.2); gain.gain.setValueAtTime(0.1, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2); osc.start(); osc.stop(ctx.currentTime + 0.2) }
        else if (type === 'win') { [523.25, 659.25, 783.99, 1046.50].forEach((f, i) => { const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(f, ctx.currentTime + i * 0.1); g.connect(ctx.destination); o.connect(g); g.gain.setValueAtTime(0.1, ctx.currentTime + i * 0.1); g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.1 + 0.5); o.start(ctx.currentTime + i * 0.1); o.stop(ctx.currentTime + i * 0.1 + 0.5) }) }
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
    { grid: [['P','Y','T','H','O','N'],['R','.','A','.','U','.'],['O','F','S','E','T','S'],['G','.','K','.','P','.'],['R','E','A','C','T','S'],['A','.','S','.','S','.']], clues: { across: [{ n: 1, r: 0, c: 0, q: "A snake-named programming language.", h: "Created by Guido van Rossum.", w: "PYTHON" }, { n: 2, r: 2, c: 0, q: "Index relative to an array start.", h: "Used in low-level memory addressing.", w: "OFSETS" }, { n: 3, r: 4, c: 0, q: "Handles state in modern UI apps.", h: "A popular JS library name starting with R.", w: "REACTS" }], down: [{ n: 1, r: 0, c: 0, q: "Series of instructions for PC.", h: "What developers write all day.", w: "PROGRA" }, { n: 4, r: 0, c: 2, q: "Small pieces of work for a CPU.", h: "Another name for processes/threads.", w: "TASKS" }, { n: 5, r: 0, c: 4, q: "How data leaves a system.", h: "Opposite of inputs.", w: "OUTPUT" }] } },
    { grid: [['B','I','N','A','R','Y'],['I','.','E','.','O','.'],['K','E','R','N','E','L'],['E','.','V','.','B','.'],['S','O','E','X','O','T'],['.','.','R','.','T','.']], clues: { across: [{ n: 1, r: 0, c: 0, q: "Base-2 numbering system.", h: "Only 0s and 1s.", w: "BINARY" }, { n: 2, r: 2, c: 0, q: "The core of an OS.", h: "Think Linux or Windows heart.", w: "KERNEL" }, { n: 3, r: 4, c: 0, q: "Beyond normal, strange logic.", h: "Not common or standard.", w: "SOEXOT" }], down: [{ n: 1, r: 0, c: 0, q: "Fastest way to travel on two wheels.", h: "Not a car, but a motor...", w: "BIKES" }, { n: 4, r: 0, c: 2, q: "Never ending, like a loop.", h: "Opposite of finite.", w: "NEVER" }, { n: 5, r: 0, c: 4, q: "Automated machine or script.", h: "Short for robot.", w: "ROBOT" }] } }
  ]

  const [puzzle, setPuzzle] = useState(() => puzzles[Math.floor(Math.random() * puzzles.length)])
  const [userGrid, setUserGrid] = useState(puzzle.grid.map(row => row.map(cell => cell === '.' ? '.' : '')))
  const [selected, setSelected] = useState([0, 0])
  const [direction, setDirection] = useState('across')
  const [win, setWin] = useState(false)
  const [hintUsed, setHintUsed] = useState(false)
  const [revealUsed, setRevealUsed] = useState(false)
  const [currentHint, setCurrentHint] = useState(null)
  const [solvedWords, setSolvedWords] = useState([])
  const [popper, setPopper] = useState(false)

  const handleCellClick = (r, c) => { if (puzzle.grid[r][c] === '.') return; if (selected[0] === r && selected[1] === c) setDirection(direction === 'across' ? 'down' : 'across'); else setSelected([r, c]) }

  const handleKeyDown = (e) => {
    if (win) return; const [r, c] = selected
    if (e.key.length === 1 && e.key.match(/[a-z0-9]/i)) {
        const newGrid = [...userGrid.map(row => [...row])]
        newGrid[r][c] = e.key.toUpperCase(); setUserGrid(newGrid); playSound('click')
        if (direction === 'across' && c < 5 && puzzle.grid[r][c+1] !== '.') setSelected([r, c+1])
        else if (direction === 'down' && r < 5 && puzzle.grid[r+1][c] !== '.') setSelected([r+1, c])
        checkProgress(newGrid)
    } else if (e.key === 'Backspace') { const newGrid = [...userGrid.map(row => [...row])]; newGrid[r][c] = ''; setUserGrid(newGrid) }
  }

  const checkProgress = (grid) => {
      let newlySolved = false
      puzzle.clues.across.forEach(cl => {
          if (!solvedWords.includes(`A-${cl.n}`)) {
              let word = ""; for(let i=0; i<6; i++) { if(puzzle.grid[cl.r][i] !== '.') word += grid[cl.r][i] }
              if (word === cl.w) { triggerPopper(); setSolvedWords(prev => [...prev, `A-${cl.n}`]); newlySolved = true }
          }
      })
      puzzle.clues.down.forEach(cl => {
          if (!solvedWords.includes(`D-${cl.n}`)) {
              let word = ""; for(let i=0; i<6; i++) { if(puzzle.grid[i] && puzzle.grid[i][cl.c] !== '.') word += grid[i][cl.c] }
              if (word === cl.w) { triggerPopper(); setSolvedWords(prev => [...prev, `D-${cl.n}`]); newlySolved = true }
          }
      })
      if (grid.every((row, r) => row.every((cell, c) => cell === puzzle.grid[r][c]))) { setWin(true); playSound('win') }
  }

  const triggerPopper = () => { setPopper(true); playSound('success'); setTimeout(() => setPopper(false), 2000) }

  useEffect(() => { window.addEventListener('keydown', handleKeyDown); return () => window.removeEventListener('keydown', handleKeyDown) }, [selected, direction, win, solvedWords])

  const useHint = () => {
    if (hintUsed) return; setHintUsed(true)
    const clue = direction === 'across' ? puzzle.clues.across.find(cl => cl.r === selected[0]) : puzzle.clues.down.find(cl => cl.c === selected[1])
    if (clue) setCurrentHint(clue.h)
  }

  const useReveal = () => { if (revealUsed) return; setRevealUsed(true); const [r, c] = selected; const newGrid = [...userGrid.map(row => [...row])]; newGrid[r][c] = puzzle.grid[r][c]; setUserGrid(newGrid); checkProgress(newGrid) }

  const getCellNum = (r, c) => { const a = puzzle.clues.across.find(cl => cl.r === r && cl.c === c); const d = puzzle.clues.down.find(cl => cl.r === r && cl.c === c); return a ? a.n : (d ? d.n : null) }

  return (
    <div style={{ display: 'flex', gap: 30, padding: 30, width: '100%', maxWidth: 1100 }}>
        {/* Particle Popper Effect Overlay */}
        {popper && (
            <div className="fade-in" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', pointerEvents: 'none', zIndex: 100, fontSize: '3rem' }}>
                🎉🥳✨
            </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 60px)', background: '#1a1a2e', padding: 10, borderRadius: 15, boxShadow: '0 20px 50px rgba(0,0,0,0.5)', height: 'fit-content', position: 'relative' }}>
                {userGrid.map((row, r) => row.map((cell, c) => {
                    const isBlack = cell === '.', isSelected = selected[0] === r && selected[1] === c, num = getCellNum(r, c)
                    return ( <div key={`${r}-${c}`} onClick={() => handleCellClick(r, c)} style={{ width: 60, height: 60, background: isBlack ? '#000' : (isSelected ? 'rgba(16, 185, 129, 0.2)' : '#fff'), border: '1px solid #ddd', cursor: isBlack ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 900, color: '#1a1a2e', position: 'relative', transition: 'all 0.2s' }}> {num && <span style={{ position: 'absolute', top: 2, left: 4, fontSize: '.65rem', color: '#1a1a2e' }}>{num}</span>} {!isBlack && cell} </div> )
                }))}
                {win && (
                    <div className="fade-in" style={{ position: 'absolute', inset: -10, background: 'rgba(5, 46, 22, 0.9)', backdropFilter: 'blur(10px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: 20, zIndex: 10, border: '2px solid var(--emerald)', boxShadow: '0 0 50px var(--emerald)' }}>
                        <i className="fas fa-medal" style={{fontSize: '4rem', color: 'var(--yellow)', marginBottom: 20}}></i>
                        <h2 style={{color: '#fff', fontSize: '2.5rem', fontWeight: 900}}>GRID MASTER</h2>
                        <button className="btn btn-primary" onClick={() => window.location.reload()} style={{marginTop: 20}}>NEW PUZZLE</button>
                    </div>
                )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
                <button className="btn" onClick={useHint} disabled={hintUsed} style={{ background: hintUsed ? 'var(--bg2)' : 'rgba(16, 185, 129, 0.1)', color: 'var(--emerald)', border: '1px solid var(--emerald)', opacity: hintUsed ? 0.5 : 1 }}><i className="fas fa-lightbulb" style={{marginRight: 8}}></i> HINT {hintUsed ? '(USED)' : '(1 LEFT)'}</button>
                <button className="btn" onClick={useReveal} disabled={revealUsed} style={{ background: revealUsed ? 'var(--bg2)' : 'rgba(239, 68, 68, 0.1)', color: 'var(--red)', border: '1px solid var(--red)', opacity: revealUsed ? 0.5 : 1 }}><i className="fas fa-eye" style={{marginRight: 8}}></i> REVEAL {revealUsed ? '(USED)' : '(1 LEFT)'}</button>
            </div>
            {currentHint && !win && <div className="fade-in" style={{ background: 'var(--bg2)', padding: 15, borderRadius: 12, borderLeft: '4px solid var(--emerald)', fontSize: '.9rem' }}><strong style={{color: 'var(--emerald)'}}>PRO TIP:</strong> {currentHint}</div>}
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20, maxHeight: 500, overflowY: 'auto', paddingRight: 10 }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.05)', padding: 25, borderRadius: 20, border: '1px solid var(--emerald-dim)' }}>
                <h3 style={{ color: 'var(--emerald)', marginBottom: 15, fontSize: '1.2rem', fontWeight: 900 }}><i className="fas fa-arrows-left-right" style={{marginRight: 12}}></i> ACROSS</h3>
                {puzzle.clues.across.map(cl => (
                    <div key={cl.n} style={{ padding: '12px 0', borderBottom: '1px solid rgba(16, 185, 129, 0.1)', color: direction === 'across' && selected[0] === cl.r ? '#fff' : (solvedWords.includes(`A-${cl.n}`) ? 'var(--emerald)' : 'var(--text2)'), opacity: direction === 'across' && selected[0] === cl.r ? 1 : 0.6, fontSize: '.95rem' }}>
                        <span style={{ fontWeight: 900, color: 'var(--emerald)', marginRight: 10 }}>{cl.n}.</span> {cl.q} {solvedWords.includes(`A-${cl.n}`) && <i className="fas fa-check-circle" style={{marginLeft: 8}}></i>}
                    </div>
                ))}
            </div>
            <div style={{ background: 'rgba(16, 185, 129, 0.05)', padding: 25, borderRadius: 20, border: '1px solid var(--emerald-dim)' }}>
                <h3 style={{ color: 'var(--emerald)', marginBottom: 15, fontSize: '1.2rem', fontWeight: 900 }}><i className="fas fa-arrows-up-down" style={{marginRight: 12}}></i> DOWN</h3>
                {puzzle.clues.down.map(cl => (
                    <div key={cl.n} style={{ padding: '12px 0', borderBottom: '1px solid rgba(16, 185, 129, 0.1)', color: direction === 'down' && selected[1] === cl.c ? '#fff' : (solvedWords.includes(`D-${cl.n}`) ? 'var(--emerald)' : 'var(--text2)'), opacity: direction === 'down' && selected[1] === cl.c ? 1 : 0.6, fontSize: '.95rem' }}>
                        <span style={{ fontWeight: 900, color: 'var(--emerald)', marginRight: 10 }}>{cl.n}.</span> {cl.q} {solvedWords.includes(`D-${cl.n}`) && <i className="fas fa-check-circle" style={{marginLeft: 8}}></i>}
                    </div>
                ))}
            </div>
        </div>
    </div>
  )
}

function Sudoku6x6() {
  const [difficulty, setDifficulty] = useState('easy'); const [grid, setGrid] = useState(Array(6).fill().map(() => Array(6).fill(0))); const [initial, setInitial] = useState([]); const [selected, setSelected] = useState([null, null]); const [invalidCells, setInvalidCells] = useState([]); const [glowingGroups, setGlowingGroups] = useState({ rows: [], cols: [], boxes: [] }); const [win, setWin] = useState(false); const [seconds, setSeconds] = useState(0); const [highScores, setHighScores] = useState(() => { const saved = localStorage.getItem('taskora_sudoku_scores'); return saved ? JSON.parse(saved) : { easy: null, medium: null, hard: null } }); const timerRef = useRef(null)
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
  useEffect(() => { const h = (e) => { if (win || selected[0] === null) return; if (e.key >= '1' && e.key <= '6') handleNumberClick(parseInt(e.key)); if (e.key === 'Backspace' || e.key === '0') handleNumberClick(0) }; window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h) }, [selected, win])
  const validateGrid = (newGrid) => {
    const inv = [], g = { rows: [], cols: [], boxes: [] }
    for (let r = 0; r < 6; r++) { const counts = {}, vals = []; for (let c = 0; c < 6; c++) { const val = newGrid[r][c]; if (val !== 0) { counts[val] = (counts[val] || 0) + 1; vals.push(val) } }; if (new Set(vals).size === 6) g.rows.push(r); for (let c = 0; c < 6; c++) if (newGrid[r][c] !== 0 && counts[newGrid[r][c]] > 1) inv.push(`${r}-${c}`) }
    for (let c = 0; c < 6; c++) { const counts = {}, vals = []; for (let r = 0; r < 6; r++) { const val = newGrid[r][c]; if (val !== 0) { counts[val] = (counts[val] || 0) + 1; vals.push(val) } }; if (new Set(vals).size === 6) g.cols.push(c); for (let r = 0; r < 6; r++) if (newGrid[r][c] !== 0 && counts[newGrid[r][c]] > 1) inv.push(`${r}-${c}`) }
    for (let b = 0; b < 6; b++) { const rStart = Math.floor(b / 2) * 2, cStart = (b % 2) * 3, counts = {}, vals = []; for (let r = rStart; r < rStart + 2; r++) for (let c = cStart; c < cStart + 3; c++) { const val = newGrid[r][c]; if (val !== 0) { counts[val] = (counts[val] || 0) + 1; vals.push(val) } }; if (new Set(vals).size === 6) g.boxes.push(b); for (let r = rStart; r < rStart + 2; r++) for (let c = cStart; c < cStart + 3; c++) if (newGrid[r][c] !== 0 && counts[newGrid[r][c]] > 1) inv.push(`${r}-${c}`) }
    setInvalidCells([...new Set(inv)]); setGlowingGroups(g); setTimeout(() => setGlowingGroups({ rows: [], cols: [], boxes: [] }), 1200)
    if (inv.length > invalidCells.length) playSound('error'); let f = true; for(let r=0; r<6; r++) for(let c=0; c<6; c++) if(newGrid[r][c] === 0) f = false
    if (f && inv.length === 0) { setWin(true); clearInterval(timerRef.current); playSound('win'); const cb = highScores[difficulty]; if (cb === null || seconds < cb) { const u = { ...highScores, [difficulty]: seconds }; setHighScores(u); localStorage.setItem('taskora_sudoku_scores', JSON.stringify(u)) } }
  }
  const handleCellClick = (r, c) => !initial.includes(`${r}-${c}`) && setSelected([r, c])
  const handleNumberClick = (num) => { if (selected[0] !== null) { const n = grid.map(row => [...row]); n[selected[0]][selected[1]] = num; setGrid(n); validateGrid(n); if (num !== 0 && !invalidCells.includes(`${selected[0]}-${selected[1]}`)) playSound('click') } }
  const isCellInGlowingGroup = (r, c) => glowingGroups.rows.includes(r) || glowingGroups.cols.includes(c) || glowingGroups.boxes.includes(Math.floor(r/2)*2+Math.floor(c/3))
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 25, padding: '30px', width: '100%', maxWidth: 800 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, width: '100%', maxWidth: 500 }}><div style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: 20, border: '1px solid var(--border)', textAlign: 'center' }}><div style={{fontSize: '.75rem', color: 'var(--text3)', fontWeight: 800, letterSpacing: 1, marginBottom: 5}}>TIMER</div><div style={{fontSize: '1.8rem', fontWeight: 900, color: 'var(--cyan)', fontFamily: 'monospace'}}>{formatTime(seconds)}</div></div><div style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: 20, border: '1px solid var(--border)', textAlign: 'center' }}><div style={{fontSize: '.75rem', color: 'var(--text3)', fontWeight: 800, letterSpacing: 1, marginBottom: 5}}>{difficulty.toUpperCase()} BEST</div><div style={{fontSize: '1.8rem', fontWeight: 900, color: 'var(--yellow)', fontFamily: 'monospace'}}>{formatTime(highScores[difficulty])}</div></div></div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 15, width: '100%', maxWidth: 500, background: 'var(--bg2)', padding: '15px', borderRadius: 25, border: '1px solid var(--border)' }}><div style={{ flex: 1 }}><select className="form-input" value={difficulty} onChange={(e) => setDifficulty(e.target.value)} style={{ background: 'transparent', border: 'none', fontWeight: 800, color: 'var(--cyan)', height: '40px' }}><option value="easy">EASY MODE</option><option value="medium">MEDIUM MODE</option><option value="hard">HARD MODE</option></select></div><button className="btn btn-primary" onClick={() => generatePuzzle(difficulty)} style={{ height: 40, padding: '0 25px', borderRadius: 15 }}><i className="fas fa-rotate" style={{marginRight: 8}}></i> NEW GRID</button></div>
      <div style={{ position: 'relative' }}><div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 65px)', border: '6px solid #1a1a2e', borderRadius: 20, overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', background: '#0f0f1a' }}>{grid.map((row, r) => row.map((cell, c) => { const isInitial = initial.includes(`${r}-${c}`), isSelected = selected[0] === r && selected[1] === c, isInv = invalidCells.includes(`${r}-${c}`), isG = isCellInGlowingGroup(r, c); return ( <div key={`${r}-${c}`} onClick={() => handleCellClick(r, c)} style={{ width: 65, height: 65, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: isInitial ? 'default' : 'pointer', background: isInv ? 'rgba(239, 68, 68, 0.4)' : (isG ? 'rgba(0, 243, 255, 0.4)' : (isSelected ? 'rgba(0, 243, 255, 0.2)' : 'transparent')), fontSize: '1.8rem', fontWeight: 900, color: isInv ? '#ff4d4d' : (isInitial ? '#fff' : 'var(--cyan)'), borderRight: (c + 1) % 3 === 0 ? '4px solid #1a1a2e' : '1px solid #1e1e30', borderBottom: (r + 1) % 2 === 0 ? '4px solid #1a1a2e' : '1px solid #1e1e30', transition: 'all 0.3s', transform: isSelected || isG ? 'scale(1.08)' : 'none', boxShadow: isG ? '0 0 25px var(--cyan)' : 'none', zIndex: isSelected || isG ? 2 : 1 }}>{cell !== 0 ? cell : ''}</div> ) }))}</div>{win && ( <div className="fade-in" style={{ position: 'absolute', inset: -20, background: 'rgba(5, 5, 10, 0.95)', backdropFilter: 'blur(15px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: 30, zIndex: 10, border: '2px solid var(--cyan)', boxShadow: '0 0 60px var(--cyan-dim)' }}><div style={{ width: 100, height: 100, background: 'var(--grad-cyan)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 25, boxShadow: '0 0 40px var(--cyan)' }}><i className="fas fa-check" style={{fontSize: '3.5rem', color: '#000'}}></i></div><h2 style={{color: '#fff', fontSize: '2.5rem', fontWeight: 900}}>LEVEL COMPLETE</h2><div style={{ display: 'flex', gap: 30, margin: '20px 0' }}><div style={{textAlign: 'center'}}><p style={{fontSize: '.8rem', color: 'var(--text3)'}}>TIME</p><h3 style={{fontSize: '1.8rem', color: 'var(--cyan)'}}>{formatTime(seconds)}</h3></div><div style={{textAlign: 'center'}}><p style={{fontSize: '.8rem', color: 'var(--text3)'}}>BEST</p><h3 style={{fontSize: '1.8rem', color: 'var(--yellow)'}}>{formatTime(highScores[difficulty])}</h3></div></div>{seconds === highScores[difficulty] && <div className="pulse" style={{ color: 'var(--yellow)', fontWeight: 900, marginBottom: 25 }}>🏆 NEW RECORD SET! 🏆</div>}<button className="btn btn-primary" onClick={() => generatePuzzle(difficulty)} style={{ padding: '15px 40px', borderRadius: 20 }}>PLAY NEXT</button></div> )}</div>
      <div style={{ display: 'flex', gap: 15, flexWrap: 'wrap', justifyContent: 'center', background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: 30, border: '1px solid var(--border)' }}>{[1,2,3,4,5,6].map(num => ( <button key={num} onClick={() => handleNumberClick(num)} className="btn hover-glow" style={{ width: 65, height: 65, borderRadius: 20, padding: 0, justifyContent: 'center', fontSize: '1.8rem', fontWeight: 900, background: 'var(--bg2)', border: '2px solid var(--cyan)', color: 'var(--cyan)' }}>{num}</button> ))}<button onClick={() => handleNumberClick(0)} className="btn" style={{ width: 100, height: 65, borderRadius: 20, border: '2px solid var(--red)', color: '#ff4d4d', background: 'rgba(239, 68, 68, 0.05)', fontWeight: 800 }}>ERASE</button></div>
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
  const isWhitePiece = (p) => p && p === p.toUpperCase(); const isBlackPiece = (p) => p && p === p.toLowerCase()
  const gvm = (r, c, b) => {
    const p = b[r][c]; if (!p) return []; const t = p.toLowerCase(), iw = isWhitePiece(p), ms = []
    const am = (nr, nc) => { if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) { const target = b[nr][nc]; if (!target || (iw ? isBlackPiece(target) : isWhitePiece(target))) { ms.push(`${nr}-${nc}`); return !target } } return false }
    if (t === 'p') { const d = iw ? -1 : 1, sr = iw ? 6 : 1; if (b[r+d] && !b[r+d][c]) { ms.push(`${r+d}-${c}`); if (r === sr && !b[r+2*d][c]) ms.push(`${r+2*d}-${c}`) }; [c-1, c+1].forEach(nc => { if (nc >= 0 && nc < 8 && b[r+d] && b[r+d][nc]) { const target = b[r+d][nc]; if (iw ? isBlackPiece(target) : isWhitePiece(target)) ms.push(`${r+d}-${nc}`) } }) }
    else if (t === 'n') [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]].forEach(([dr,dc]) => am(r+dr, c+dc))
    else if (t === 'r' || t === 'q') [[-1,0],[1,0],[0,-1],[0,1]].forEach(([dr,dc]) => { let nr=r+dr, nc=c+dc; while (am(nr,nc)) { nr+=dr; nc+=dc } })
    if (t === 'b' || t === 'q') [[-1,-1],[-1,1],[1,-1],[1,1]].forEach(([dr,dc]) => { let nr=r+dr, nc=c+dc; while (am(nr,nc)) { nr+=dr; nc+=dc } })
    else if (t === 'k') for (let dr=-1; dr<=1; dr++) for (let dc=-1; dc<=1; dc++) if (dr!==0 || dc!==0) am(r+dr, c+dc)
    return ms
  }
  const makeMove = (sr, sc, tr, tc) => { if (gameOver) return; const target = board[tr][tc]; if (target) { if (isWhitePiece(target)) setCapturedWhite(prev => [...prev, target]); else setCapturedBlack(prev => [...prev, target]); if (target.toLowerCase() === 'k') setGameOver(isWhitePiece(target) ? 'black' : 'white') }; const n = board.map(row => [...row]); n[tr][tc] = board[sr][sc]; n[sr][sc] = null; setBoard(n); setTurn(turn === 'white' ? 'black' : 'white'); setSelected(null); setValidMoves([]) }
  useEffect(() => { if (turn === 'black' && !gameOver) { setTimeout(() => { const ams = []; for (let r=0; r<8; r++) for (let c=0; c<8; c++) { const p = board[r][c]; if (p && isBlackPiece(p)) { const ms = gvm(r, c, board); ms.forEach(m => ams.push({ s: [r,c], t: m.split('-').map(Number) })) } } if (ams.length > 0) { const m = ams[Math.floor(Math.random() * ams.length)]; makeMove(m.s[0], m.s[1], m.t[0], m.t[1]) } }, 800) } }, [turn, gameOver])
  const hcc = (r, c) => { if (turn !== 'white' || gameOver) return; const p = board[r][c]; if (selected) { if (validMoves.includes(`${r}-${c}`)) makeMove(selected[0], selected[1], r, c); else { setSelected(null); setValidMoves([]) } } else if (p && isWhitePiece(p)) { setSelected([r,c]); setValidMoves(gvm(r, c, board)) } }
  const gpi = (p, s = '1.8rem', co = null) => { if (!p) return null; const color = co || (p === p.toUpperCase() ? '#fff' : '#8b5cf6'), t = p.toLowerCase(); let icon = ''; switch(t) { case 'r': icon = 'fa-chess-rook'; break; case 'n': icon = 'fa-chess-knight'; break; case 'b': icon = 'fa-chess-bishop'; break; case 'q': icon = 'fa-chess-queen'; break; case 'k': icon = 'fa-chess-king'; break; case 'p': icon = 'fa-chess-pawn'; break }; return <i className={`fas ${icon}`} style={{ color, filter: 'drop-shadow(0 0 5px rgba(0,0,0,0.5))', fontSize: s }}></i> }
  const ca = ({ pieces, title }) => ( <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 60, alignItems: 'center', background: 'rgba(0,0,0,0.3)', padding: 10, borderRadius: 12, border: '1px solid var(--border)' }}><div style={{ fontSize: '.7rem', color: 'var(--text3)', fontWeight: 800 }}>{title}</div><div style={{ display: 'flex', flexDirection: 'column', gap: 5, maxHeight: 400, flexWrap: 'wrap' }}>{pieces.map((p, i) => <div key={i}>{gpi(p, '1.2rem')}</div>)}</div></div> )
  return ( <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, width: '100%', padding: 30 }}><div style={{ display: 'flex', gap: 20, alignItems: 'center', background: 'rgba(0,0,0,0.4)', padding: '10px 30px', borderRadius: 40, border: '1px solid var(--purple)' }}><div style={{ color: turn === 'white' ? 'var(--purple)' : 'var(--text3)', fontWeight: 800, fontSize: '1.2rem', textShadow: turn === 'white' ? '0 0 10px var(--purple)' : 'none' }}>PLAYER</div><div style={{ color: 'var(--text3)' }}>VS</div><div style={{ color: turn === 'black' ? 'var(--purple)' : 'var(--text3)', fontWeight: 800, fontSize: '1.2rem', textShadow: turn === 'black' ? '0 0 10px var(--purple)' : 'none' }}>TASKORA AI</div></div><div style={{ display: 'flex', gap: 30, alignItems: 'flex-start' }}>{ca({pieces:capturedWhite, title:"LOST"})} <div style={{ position: 'relative' }}><div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 60px)', border: '6px solid #1a1a2e', borderRadius: 15, overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>{board.map((row, r) => row.map((piece, c) => { const ibc = (r+c)%2===1, isel = selected && selected[0]===r && selected[1]===c, iv = validMoves.includes(`${r}-${c}`); return ( <div key={`${r}-${c}`} onClick={() => hcc(r, c)} style={{ width: 60, height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: isel ? 'rgba(139, 92, 246, 0.4)' : (ibc ? '#1e1b2e' : '#3c366b'), fontSize: '1.8rem', position: 'relative' }}> {iv && <div style={{ position: 'absolute', width: 15, height: 15, borderRadius: '50%', background: 'rgba(139, 92, 246, 0.5)' }}></div>} {gpi(piece)} </div> ) }))}</div>{gameOver && ( <div className="fade-in" style={{ position: 'absolute', inset: -15, background: 'rgba(5, 5, 10, 0.95)', backdropFilter: 'blur(15px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: 20, zIndex: 10, border: '2px solid var(--purple)', boxShadow: '0 0 60px var(--purple-dim)' }}><i className={`fas ${gameOver === 'white' ? 'fa-crown' : 'fa-skull-crossbones'}`} style={{fontSize: '4rem', color: gameOver === 'white' ? 'var(--yellow)' : 'var(--red)', marginBottom: 20}}></i><h2 style={{color: '#fff', fontSize: '2.5rem', fontWeight: 900}}>{gameOver === 'white' ? 'VICTORY!' : 'GAME OVER'}</h2><button className="btn btn-primary" onClick={() => {setBoard(initialBoard); setTurn('white'); setGameOver(null); setCapturedWhite([]); setCapturedBlack([]); setSelected(null); setValidMoves([])}}>REMATCH</button></div> )}</div> {ca({pieces:capturedBlack, title:"ENEMY LOST"})} </div><button className="btn" onClick={() => {setBoard(initialBoard); setTurn('white'); setGameOver(null); setCapturedWhite([]); setCapturedBlack([]); setSelected(null); setValidMoves([])}} style={{ background: 'rgba(139, 92, 246, 0.1)', color: 'var(--purple)', border: '1px solid var(--purple)', marginTop: 10 }}><i className="fas fa-rotate" style={{marginRight: 8}}></i> RESET BOARD</button> </div> )
}
