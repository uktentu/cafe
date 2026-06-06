'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { X, Trophy, RotateCcw } from 'lucide-react'
import { m } from 'framer-motion'

// Reuse the PixelPlayer from MenuHero but we inline it here for direct control or import it.
// To keep it simple and perfectly synced, we'll draw it directly in SVG.
function GamePlayerSVG({ isWalking, isCrouching }: { isWalking: boolean; isCrouching: boolean }) {
  // If crouching, we shift everything down and compress the legs.
  const yOffset = isCrouching ? 4 : 0
  
  return (
    <svg viewBox="0 0 16 16" width="100%" height="100%" className="drop-shadow-[0_0_8px_var(--brand)]" style={{ transform: isCrouching ? 'scaleY(0.7) translateY(20%)' : 'none', transition: 'transform 0.1s' }}>
      <g transform={`translate(0, ${yOffset})`}>
        {/* Head */}
        <rect x="6" y="1" width="5" height="1" fill="#0f172a" />
        <rect x="5" y="2" width="1" height="1" fill="#0f172a" />
        <rect x="6" y="2" width="5" height="1" fill="#ef4444" />
        <rect x="4" y="2" width="2" height="1" fill="#ef4444" />
        <rect x="4" y="3" width="1" height="1" fill="#ef4444" />
        <rect x="6" y="3" width="5" height="3" fill="#fcd34d" />
        <rect x="9" y="3" width="1" height="1" fill="#0f172a" />
        <rect x="10" y="4" width="1" height="1" fill="#f59e0b" />
        {/* Body */}
        <rect x="6" y="6" width="5" height="3" fill="#fcd34d" />
        <rect x="7" y="6" width="2" height="2" fill="#f59e0b" />
        <rect x="6" y="9" width="5" height="2" fill="#1e3a8a" />
        <rect x="6" y="9" width="5" height="1" fill="#0f172a" />
        <rect x="8" y="9" width="1" height="1" fill="#eab308" />
        {/* Arm & Gun */}
        <rect x="7" y="6" width="4" height="2" fill="#fcd34d" />
        <rect x="11" y="5" width="1" height="3" fill="#4b5563" />
        <rect x="12" y="6" width="4" height="1" fill="#6b7280" />
        <rect x="12" y="7" width="3" height="1" fill="#4b5563" />
        <rect x="12" y="8" width="1" height="1" fill="#1f2937" />
        <rect x="16" y="6" width="1" height="1" fill="#ef4444" />
        {/* Legs */}
        {isWalking ? (
          <>
            <rect x="5" y="11" width="2" height="3" fill="#1e3a8a" />
            <rect x="4" y="13" width="2" height="1" fill="#7f1d1d" />
            <rect x="8" y="11" width="2" height="4" fill="#1e40af" />
            <rect x="8" y="14" width="3" height="1" fill="#7f1d1d" />
          </>
        ) : (
          <>
            <rect x="6" y="11" width="2" height="4" fill="#1e3a8a" />
            <rect x="5" y="14" width="3" height="1" fill="#7f1d1d" />
            <rect x="9" y="10" width="2" height="3" fill="#1e40af" />
            <rect x="9" y="13" width="3" height="1" fill="#7f1d1d" />
          </>
        )}
      </g>
    </svg>
  )
}

function PixelEnemySVG({ frame, type, hitTime }: { frame: number; type: string; hitTime: number }) {
  const isHit = hitTime > 0 && Date.now() - hitTime < 100
  let emoji = '👹'
  if (type === 'fast') emoji = '👺'
  if (type === 'tank') emoji = '🗿'
  if (type === 'jumper') emoji = '🦘'
  if (type === 'turtle') emoji = '🐢'
  if (type === 'crow') emoji = '🐦‍⬛'

  return (
    <div 
      className="w-full h-full flex items-center justify-center text-4xl lg:text-5xl"
      style={{
        filter: isHit ? 'brightness(200%)' : 'none',
        transform: type === 'crow' && frame % 2 === 0 ? 'translateY(-4px)' : 'none'
      }}
    >
      {emoji}
    </div>
  )
}

interface Particle { id: number; x: number; y: number; vx: number; vy: number; color: string; life: number; maxLife: number }
interface FloatingText { id: number; text: string; x: number; y: number; life: number; maxLife: number }
type EnemyType = 'normal' | 'fast' | 'tank' | 'jumper' | 'turtle' | 'crow'

interface Enemy {
  id: number
  type: EnemyType
  hp: number
  x: number
  y: number
  vx: number
  vy: number
  frame: number
  hitTime: number
}

interface GameState {
  player: { x: number; y: number; vx: number; vy: number; crouching: boolean; dead: boolean; doubleJumped: boolean; dashing: boolean; dashTime: number; dashCooldown: number }
  bullets: Array<{ id: number; x: number; y: number; vx: number }>
  enemies: Enemy[]
  particles: Particle[]
  floatingTexts: FloatingText[]
  score: number
  highScore: number
  gameOver: boolean
  lastFireTime: number
  screenShake: number
  lastSpawnTime: number
}

const MAX_SPEED = 8
const DASH_SPEED = 20
const DASH_DURATION = 150
const ACCEL = 1
const FRICTION = 0.8
const JUMP_FORCE = -15
const GRAVITY = 0.8
const BULLET_SPEED = 12
const ENEMY_SPEED = 3
const GROUND_Y = 0

export function ArcadeGameModal({ onClose }: { onClose: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const reqRef = useRef<number>()
  
  const [isIntro, setIsIntro] = useState(true)
  const [gameState, setGameState] = useState<GameState>({
    player: { x: 50, y: GROUND_Y, vx: 0, vy: 0, crouching: false, dead: false, doubleJumped: false, dashing: false, dashTime: 0, dashCooldown: 0 },
    bullets: [],
    enemies: [],
    particles: [],
    floatingTexts: [],
    score: 0,
    highScore: 0,
    gameOver: false,
    lastFireTime: 0,
    screenShake: 0,
    lastSpawnTime: 0
  })

  useEffect(() => {
    const hs = localStorage.getItem('arcade_highscore')
    if (hs) {
      setGameState(s => ({ ...s, highScore: parseInt(hs, 10) }))
    }
  }, [])

  // Inputs
  const keys = useRef({ left: false, right: false, up: false, down: false, fire: false, dash: false })
  const stateRef = useRef<GameState>(gameState)
  stateRef.current = gameState

  // Keyboard event listeners for a11y & physical keyboards
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.current.left = true
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.current.right = true
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') keys.current.up = true
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') keys.current.down = true
      if (e.key === ' ' || e.key === 'Enter') keys.current.fire = true
      if (e.key === 'Shift') keys.current.dash = true
    }
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.current.left = false
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.current.right = false
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') keys.current.up = false
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') keys.current.down = false
      if (e.key === ' ' || e.key === 'Enter') keys.current.fire = false
      if (e.key === 'Shift') keys.current.dash = false
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  // For animation frames (walking)
  const [frameTick, setFrameTick] = useState(0)

  const loop = useCallback(() => {
    reqRef.current = requestAnimationFrame(loop)
    if (stateRef.current.gameOver || isIntro) return

    const s = { ...stateRef.current }
    const p = { ...s.player }
    const now = Date.now()

    // Dynamic Spawner
    const spawnDelay = Math.max(500, 2000 - (s.score * 5))
    if (now - s.lastSpawnTime > spawnDelay) {
      const types: EnemyType[] = ['normal']
      if (s.score > 50) types.push('fast')
      if (s.score > 100) types.push('jumper', 'turtle')
      if (s.score > 200) types.push('tank', 'crow')
      
      const type = types[Math.floor(Math.random() * types.length)]
      let hp = 1
      let vx = ENEMY_SPEED
      let startY = GROUND_Y
      if (type === 'fast') vx = ENEMY_SPEED * 1.8
      if (type === 'tank') { hp = 3; vx = ENEMY_SPEED * 0.6 }
      if (type === 'turtle') vx = ENEMY_SPEED * 0.4
      if (type === 'crow') { vx = ENEMY_SPEED * 1.5; startY = GROUND_Y - 50 }
      
      s.enemies.push({ id: now, type, hp, x: window.innerWidth || 800, y: startY, vx, vy: 0, frame: 0, hitTime: 0 })
      s.lastSpawnTime = now
    }

    // Input Handling
    if (keys.current.left) { p.vx -= ACCEL }
    else if (keys.current.right) { p.vx += ACCEL }
    else {
      p.vx *= FRICTION
      if (Math.abs(p.vx) < 0.1) p.vx = 0
    }

    // Jump & Double Jump
    if (keys.current.up) {
      if (p.y === GROUND_Y) {
        p.vy = JUMP_FORCE
        p.doubleJumped = false
        // Dust particle
        s.particles.push({ id: Math.random(), x: p.x, y: GROUND_Y, vx: -2, vy: -1, color: '#9ca3af', life: 10, maxLife: 10 })
        s.particles.push({ id: Math.random(), x: p.x, y: GROUND_Y, vx: 2, vy: -1, color: '#9ca3af', life: 10, maxLife: 10 })
      } else if (!p.doubleJumped && p.vy > -5) {
        // Can double jump slightly after apex
        p.vy = JUMP_FORCE * 0.8
        p.doubleJumped = true
        // Double jump particles
        for(let i=0; i<4; i++) {
          s.particles.push({ id: Math.random(), x: p.x, y: p.y, vx: (Math.random()-0.5)*4, vy: Math.random()*2, color: '#60a5fa', life: 15, maxLife: 15 })
        }
      }
      keys.current.up = false // Require re-press
    }

    // Crouch
    p.crouching = keys.current.down && p.y === GROUND_Y

    // Dash (Sigma Dash)
    if (keys.current.dash && !p.dashing && now - p.dashCooldown > 1000) {
      p.dashing = true
      p.dashTime = now
      p.dashCooldown = now
      s.screenShake = 5
      keys.current.dash = false
    }

    if (p.dashing) {
      p.vx = (p.vx >= 0 ? 1 : -1) * DASH_SPEED
      p.vy = 0 // Freeze vertical
      if (now - p.dashTime > DASH_DURATION) {
        p.dashing = false
      }
      // Dash trail particles
      if (Math.random() > 0.5) {
        s.particles.push({ id: Math.random(), x: p.x, y: p.y - 20, vx: 0, vy: 0, color: '#3b82f6', life: 10, maxLife: 10 })
      }
    }

    // Physics
    p.vx = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, p.vx))
    p.x += p.vx
    
    if (!p.dashing) {
      p.vy += GRAVITY
      p.y += p.vy
    }

    // Floor collision
    if (p.y > GROUND_Y) {
      p.y = GROUND_Y
      p.vy = 0
    }

    // Fire bullets
    if (keys.current.fire && now - s.lastFireTime > 250 && !p.crouching) {
      s.bullets.push({ id: now, x: p.x + 20, y: p.y - 20, vx: BULLET_SPEED })
      s.lastFireTime = now
    }

    // Update bullets
    s.bullets = s.bullets.map(b => ({ ...b, x: b.x + b.vx })).filter(b => b.x < (window.innerWidth || 800) + 100)

    // Update Enemies & Collisions
    const newEnemies = []
    for (const e of s.enemies) {
      e.x -= e.vx
      
      if (e.type === 'jumper') {
        if (e.y === GROUND_Y && Math.random() < 0.02) {
          e.vy = -10
        }
        e.vy += GRAVITY
        e.y += e.vy
        if (e.y > GROUND_Y) {
          e.y = GROUND_Y
          e.vy = 0
        }
      }

      e.frame = Math.floor(now / 150) % 2

      // Check bullet hit
      s.bullets = s.bullets.filter(b => {
        let eTopB = e.y - 40
        let eBottomB = e.y + 10
        if (e.type === 'turtle') eTopB = e.y - 15
        if (e.type === 'crow') { eTopB = e.y - 20; eBottomB = e.y + 10 }

        const hitEnemy = b.x > e.x - 30 && b.x < e.x + 30 && b.y > eTopB && b.y < eBottomB
        if (hitEnemy) {
          e.hp -= 1
          e.hitTime = now
          if (e.hp <= 0) {
            const points = e.type === 'tank' ? 50 : 10
            s.score += points
            
            const memeWords = ["SKIBIDI", "W RIZZ", "SIGMA", "SHEESH", "NO CAP", "BET"]
            const memeText = e.type === 'tank' ? "L BOZO" : memeWords[Math.floor(Math.random() * memeWords.length)]
            
            s.floatingTexts.push({ id: Math.random(), text: `${memeText}`, x: e.x, y: e.y - 60, life: 30, maxLife: 30 })
            
            if (e.type === 'tank') s.screenShake = 15
            
            // Explosion particles
            const colors = ['#fcd34d', '#ef4444', '#1e3a8a', '#ffffff']
            for (let i = 0; i < 15; i++) {
              s.particles.push({
                id: Math.random(), x: e.x, y: e.y - 20,
                vx: (Math.random() - 0.5) * 12, vy: (Math.random() - 1) * 12,
                color: colors[Math.floor(Math.random() * colors.length)],
                life: 20 + Math.random() * 20, maxLife: 40
              })
            }
          }
        }
        return !hitEnemy
      })

      // Check player hit (Player and Enemy are centered at x)
      const playerHitBox = {
        left: p.x - 15, right: p.x + 15,
        top: p.y - (p.crouching ? 20 : 40), bottom: p.y
      }
      
      let eTop = e.y - 40
      let eBottom = e.y
      if (e.type === 'turtle') eTop = e.y - 15
      if (e.type === 'crow') { eTop = e.y - 20; eBottom = e.y + 10 }

      const enemyHitBox = {
        left: e.x - 15, right: e.x + 15,
        top: eTop, bottom: eBottom
      }
      
      const overlap = playerHitBox.left < enemyHitBox.right && 
                      playerHitBox.right > enemyHitBox.left && 
                      playerHitBox.top < enemyHitBox.bottom && 
                      playerHitBox.bottom > enemyHitBox.top

      if (overlap) {
        if (p.dashing) {
          // Sigma Dash Kill!
          e.hp = 0
          s.score += 100
          s.screenShake = 30
          s.floatingTexts.push({ id: Math.random(), text: "GYATT!", x: e.x, y: e.y - 60, life: 50, maxLife: 50 })
          
          const colors = ['#fcd34d', '#ef4444', '#1e3a8a', '#ffffff']
          for (let i = 0; i < 25; i++) {
            s.particles.push({
              id: Math.random(), x: e.x, y: e.y - 20,
              vx: (Math.random() - 0.5) * 16, vy: (Math.random() - 1) * 16,
              color: colors[Math.floor(Math.random() * colors.length)],
              life: 20 + Math.random() * 20, maxLife: 40
            })
          }
        } else if (e.hp > 0) {
          s.gameOver = true
          p.dead = true
          s.screenShake = 20
          if (s.score > s.highScore) {
            s.highScore = s.score
            localStorage.setItem('arcade_highscore', s.score.toString())
          }
        }
      }

      if (e.hp > 0 && e.x > -50) {
        newEnemies.push(e)
      }
    }
    s.enemies = newEnemies
    s.player = p

    // Physics for particles
    s.particles = s.particles.map(p => {
      p.x += p.vx
      p.y += p.vy
      p.vy += GRAVITY * 0.5
      p.life -= 1
      return p
    }).filter(p => p.life > 0)
    
    // Floating texts
    s.floatingTexts = s.floatingTexts.map(f => {
      f.y -= 1
      f.life -= 1
      return f
    }).filter(f => f.life > 0)

    if (s.screenShake > 0) s.screenShake -= 1

    setGameState(s)
  }, [isIntro])

  useEffect(() => {
    if (!isIntro) {
      reqRef.current = requestAnimationFrame(loop)
    }
    return () => {
      if (reqRef.current) cancelAnimationFrame(reqRef.current)
    }
  }, [loop, isIntro])

  // Walk cycle
  useEffect(() => {
    const int = setInterval(() => setFrameTick(f => f + 1), 150)
    return () => clearInterval(int)
  }, [])

  const restart = () => {
    setGameState(s => ({
      ...s,
      player: { x: 50, y: GROUND_Y, vx: 0, vy: 0, crouching: false, dead: false, doubleJumped: false, dashing: false, dashTime: 0, dashCooldown: 0 },
      bullets: [],
      enemies: [],
      particles: [],
      floatingTexts: [],
      score: 0,
      gameOver: false,
      lastFireTime: 0,
      screenShake: 0,
      lastSpawnTime: 0
    }))
  }

  if (typeof document === 'undefined') return null

  return createPortal(
    <m.div layoutId="arcade-game-container" className="fixed inset-0 z-[99999] bg-black text-white overflow-hidden arcade-font select-none touch-none flex flex-col" style={{ borderRadius: 0 }}>
      
      {/* Screen reader only instructions */}
      <div className="sr-only">
        Arcade Game. Use arrow keys or WASD to move. Press Space or Enter to fire. Press Shift to dash.
      </div>
      
      {/* Portrait Warning Overlay (Mobile only) */}
      <div className="hidden max-lg:portrait:flex absolute inset-0 z-[100000] bg-black flex-col items-center justify-center p-8 text-center">
         <h2 className="text-3xl lg:text-5xl text-yellow-400 mb-4 animate-pulse">ROTATE DEVICE 🔄</h2>
         <p className="text-lg lg:text-xl leading-relaxed">This game requires landscape mode.<br/>Turn your phone sideways to play!</p>
         <button onClick={onClose} className="mt-12 px-8 py-4 bg-neutral-800 active:bg-neutral-700 rounded-full font-bold tracking-widest uppercase">Close Game</button>
      </div>

      {/* Header Overlay */}
      <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between p-4 lg:p-6 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
        <div className="flex items-center gap-4 text-yellow-400 text-sm lg:text-xl font-bold tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            <span>{gameState.score.toString().padStart(5, '0')}</span>
          </div>
          <div className="flex items-center gap-2 text-neutral-400 text-xs lg:text-sm">
            <span>HI: {gameState.highScore.toString().padStart(5, '0')}</span>
          </div>
        </div>
        <button onClick={onClose} className="p-2 bg-neutral-800/80 rounded-full pointer-events-auto hover:bg-neutral-700 active:scale-95 transition-transform">
          <X className="h-6 w-6" />
        </button>
      </div>

      {/* Game Canvas / Arena */}
      <div 
        className="absolute inset-0 lg:relative lg:flex-1 bg-[#1e1b4b] overflow-hidden" 
        ref={containerRef}
        style={gameState.screenShake > 0 ? { transform: `translate(${(Math.random() - 0.5) * 10}px, ${(Math.random() - 0.5) * 10}px)` } : {}}
      >
        {/* Parallax Stars/Sky */}
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

        {/* Floor */}
        <div className="absolute bottom-0 inset-x-0 h-16 lg:h-24 border-t-4 border-[#166534]" style={{ background: 'repeating-linear-gradient(90deg, #15803d 0px, #15803d 10px, #166534 10px, #166534 20px)' }} />

        {/* Entities container aligned to ground */}
        <div className="absolute bottom-16 lg:bottom-24 inset-x-0 h-0">
          
          {/* Intro Sequence Overlay */}
          {isIntro && (
            <div 
              className="absolute w-64 lg:w-80 bottom-[60px] lg:bottom-[80px] bg-white text-black p-4 rounded-xl shadow-lg z-20"
              style={{ left: `${gameState.player.x - 20}px` }}
            >
              <div className="absolute -bottom-2 left-10 w-4 h-4 bg-white transform rotate-45" />
              <p className="text-sm lg:text-base mb-4 leading-relaxed font-bold tracking-wider">
                While your order is cooking fr fr, survive this no cap 💀
              </p>
              <button 
                onClick={() => setIsIntro(false)}
                className="w-full bg-blue-600 text-white font-bold py-2 rounded-lg hover:bg-blue-500 active:scale-95 transition-transform tracking-widest"
              >
                LET&apos;S GO
              </button>
            </div>
          )}

          {/* Player */}
          {!gameState.player.dead && (
            <div 
              className={`absolute w-12 h-12 lg:w-16 lg:h-16 -ml-6 -mt-12 lg:-mt-16 ${gameState.player.dashing ? 'opacity-50 drop-shadow-[0_0_15px_rgba(59,130,246,1)]' : ''}`}
              style={{ transform: `translate3d(${gameState.player.x}px, ${gameState.player.y}px, 0)` }}
            >
              <GamePlayerSVG isWalking={Math.abs(gameState.player.vx) > 0 && frameTick % 2 === 0} isCrouching={gameState.player.crouching} />
            </div>
          )}
          {gameState.player.dead && (
            <div 
              className="absolute w-12 h-12 lg:w-16 lg:h-16 -ml-6 -mt-12 lg:-mt-16 text-red-500 animate-pulse"
              style={{ transform: `translate3d(${gameState.player.x}px, ${GROUND_Y}px, 0) rotate(90deg)` }}
            >
              <GamePlayerSVG isWalking={false} isCrouching={false} />
            </div>
          )}

          {/* Enemies */}
          {gameState.enemies.map(e => (
            <div 
              key={e.id}
              className="absolute w-12 h-12 lg:w-16 lg:h-16 -ml-6 -mt-12 lg:-mt-16"
              style={{ transform: `translate3d(${e.x}px, ${e.y}px, 0)` }}
            >
              <PixelEnemySVG frame={e.frame} type={e.type} hitTime={e.hitTime} />
            </div>
          ))}

          {/* Particles */}
          {gameState.particles.map(p => (
            <div
              key={p.id}
              className="absolute w-2 h-2"
              style={{
                backgroundColor: p.color,
                transform: `translate3d(${p.x}px, ${p.y}px, 0)`,
                opacity: p.life / p.maxLife
              }}
            />
          ))}

          {/* Floating Texts */}
          {gameState.floatingTexts.map(f => (
            <div
              key={f.id}
              className="absolute text-yellow-400 font-bold"
              style={{
                transform: `translate3d(${f.x}px, ${f.y}px, 0)`,
                opacity: f.life / f.maxLife,
                textShadow: '0 0 5px red'
              }}
            >
              {f.text}
            </div>
          ))}

          {/* Bullets */}
          {gameState.bullets.map(b => (
            <div 
              key={b.id}
              className="absolute text-xl"
              style={{ transform: `translate3d(${b.x - 10}px, ${b.y - 10}px, 0)` }}
            >
              🔥
            </div>
          ))}
        </div>

        {/* Game Over Screen */}
        {gameState.gameOver && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-10 p-4">
            <h2 className="text-4xl lg:text-6xl text-red-500 mb-2 animate-pulse text-center">SKILL ISSUE 💀</h2>
            <p className="text-xl lg:text-2xl text-yellow-400 mb-8">FINAL SCORE: {gameState.score}</p>
            <button 
              onClick={restart}
              className="flex items-center gap-3 px-6 py-4 bg-white text-black hover:bg-neutral-200 active:scale-95 transition-transform"
            >
              <RotateCcw className="h-6 w-6" />
              <span className="text-xl tracking-widest uppercase">Retry</span>
            </button>
          </div>
        )}
      </div>

      {/* Controller Area */}
      <div className="absolute bottom-2 inset-x-2 flex items-end justify-between pointer-events-none z-20 lg:relative lg:inset-auto lg:bottom-auto lg:h-64 lg:bg-neutral-900 lg:border-t-4 lg:border-neutral-700 lg:items-center lg:px-24">
        {/* D-Pad */}
        <div className="relative w-24 h-24 sm:w-32 sm:h-32 opacity-60 pointer-events-auto lg:w-48 lg:h-48 lg:opacity-100">
          <div className="absolute inset-0 m-auto w-8 h-8 sm:w-12 sm:h-12 lg:w-16 lg:h-16 bg-neutral-800" />
          {/* UP */}
          <button 
            className="absolute top-0 inset-x-0 mx-auto w-8 h-8 sm:w-12 sm:h-12 lg:w-16 lg:h-16 bg-neutral-700 active:bg-neutral-500 rounded-t-lg"
            onPointerDown={() => keys.current.up = true}
            onPointerUp={() => keys.current.up = false}
            onPointerLeave={() => keys.current.up = false}
          />
          {/* DOWN */}
          <button 
            className="absolute bottom-0 inset-x-0 mx-auto w-8 h-8 sm:w-12 sm:h-12 lg:w-16 lg:h-16 bg-neutral-700 active:bg-neutral-500 rounded-b-lg"
            onPointerDown={() => keys.current.down = true}
            onPointerUp={() => keys.current.down = false}
            onPointerLeave={() => keys.current.down = false}
          />
          {/* LEFT */}
          <button 
            className="absolute left-0 inset-y-0 my-auto w-8 h-8 sm:w-12 sm:h-12 lg:w-16 lg:h-16 bg-neutral-700 active:bg-neutral-500 rounded-l-lg"
            onPointerDown={() => keys.current.left = true}
            onPointerUp={() => keys.current.left = false}
            onPointerLeave={() => keys.current.left = false}
          />
          {/* RIGHT */}
          <button 
            className="absolute right-0 inset-y-0 my-auto w-8 h-8 sm:w-12 sm:h-12 lg:w-16 lg:h-16 bg-neutral-700 active:bg-neutral-500 rounded-r-lg"
            onPointerDown={() => keys.current.right = true}
            onPointerUp={() => keys.current.right = false}
            onPointerLeave={() => keys.current.right = false}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 sm:gap-4 opacity-60 pointer-events-auto pb-2 pr-2 sm:pb-4 sm:pr-4 lg:gap-8 lg:opacity-100 lg:pb-0 lg:pr-0">
          {/* DASH Button */}
          <button 
            className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-full bg-blue-600 border-b-4 border-blue-800 active:border-b-0 active:translate-y-1 active:bg-blue-500 shadow-lg flex items-center justify-center transition-all"
            onPointerDown={() => keys.current.dash = true}
            onPointerUp={() => keys.current.dash = false}
            onPointerLeave={() => keys.current.dash = false}
          >
            <span className="text-[10px] sm:text-sm lg:text-lg font-bold tracking-widest">DASH</span>
          </button>

          {/* FIRE Button */}
          <button 
            className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-full bg-red-600 border-b-4 border-red-800 active:border-b-0 active:translate-y-1 active:bg-red-500 shadow-lg flex items-center justify-center transition-all"
            onPointerDown={() => keys.current.fire = true}
            onPointerUp={() => keys.current.fire = false}
            onPointerLeave={() => keys.current.fire = false}
          >
            <span className="text-sm sm:text-xl lg:text-2xl font-bold tracking-widest">FIRE</span>
          </button>
        </div>
      </div>
    </m.div>,
    document.body
  )
}
