'use client'

import React, { useEffect, useRef, useState } from 'react'

interface Ball {
  x: number
  y: number
  radius: number
  dx: number
  dy: number
}

interface GameState {
  speed: number
}

export default function FallingBallGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const ballRef = useRef<Ball>({ x: 0, y: 30, radius: 15, dx: 0, dy: 2 })
  const gameLoopRef = useRef<number>()
  const gameStateRef = useRef<GameState>({ speed: 1 })

  function onGameOver() {
    if (window.GameChannel) {
      window.GameChannel.postMessage('GAME_OVER')
    }
  }

  function onScoreIncrease() {
    if (window.GameChannel) {
      window.GameChannel.postMessage('SCORE_INCREASE')
    }
  }

  function resetGame() {
    // Cancel any existing game loop
    if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current)
      gameLoopRef.current = undefined
    }

    setGameOver(false)
    setScore(0)
    // Reset game speed
    gameStateRef.current.speed = 1

    if (canvasRef.current) {
      const canvas = canvasRef.current
      ballRef.current = {
        x: canvas.width / 2,
        y: 30,
        radius: 15,
        dx: 0,
        dy: 2,
      }
      startGame()
    }
  }

  // Define window functions once when component mounts
  useEffect(() => {
    window.startMovingLeft = () => {
      ballRef.current.dx = -5
    }

    window.startMovingRight = () => {
      ballRef.current.dx = 5
    }

    window.stopMoving = () => {
      ballRef.current.dx = 0
    }

    // Clean up window functions on unmount
    return () => {
      delete window.startMovingLeft
      delete window.startMovingRight
      delete window.stopMoving
    }
  }, [])

  function startGame() {
    if (!canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const ball = ballRef.current
    let holes: { x: number; width: number }[] = []
    const gameState = gameStateRef.current

    const holeWidth = Math.min(100, canvas.width / 4)
    function createHole() {
      const holeX = Math.random() * (canvas.width - holeWidth)
      holes = [{ x: holeX, width: holeWidth }]
    }

    createHole()

    function drawBall() {
      if (!ctx) return
      ctx.beginPath()
      ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2)
      ctx.fillStyle = '#0000FF'
      ctx.fill()
      ctx.closePath()
    }

    function drawHoles() {
      if (!ctx) return
      ctx.fillStyle = '#000000'
      holes.forEach((hole) => {
        ctx.fillRect(0, canvas.height - 10, hole.x, 10)
        ctx.fillRect(hole.x + hole.width, canvas.height - 10, canvas.width - hole.x - hole.width, 10)
      })
    }

    function updateGame() {
      if (!ctx || !canvas) return

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      ball.y += ball.dy * gameState.speed
      ball.x += ball.dx

      if (ball.x - ball.radius < 0 || ball.x + ball.radius > canvas.width) {
        ball.dx = 0
        ball.x = Math.max(ball.radius, Math.min(canvas.width - ball.radius, ball.x))
      }

      // Check for collision with barriers
      if (
        ball.y + ball.radius > canvas.height - 10 &&
        (ball.x - ball.radius < holes[0].x || ball.x + ball.radius > holes[0].x + holes[0].width)
      ) {
        setGameOver(true)
        onGameOver()
        if (gameLoopRef.current) {
          cancelAnimationFrame(gameLoopRef.current)
          gameLoopRef.current = undefined
        }
        return
      }

      // Ball passed through the hole successfully
      if (ball.y - ball.radius > canvas.height) {
        ball.y = 30
        setScore((prevScore) => {
          onScoreIncrease()
          const newScore = prevScore + 1
          gameState.speed = 1 + newScore * 0.1
          return newScore
        })
        createHole()
      }

      drawBall()
      drawHoles()

      if (!gameOver) {
        gameLoopRef.current = requestAnimationFrame(updateGame)
      }
    }

    // Start the game loop
    gameLoopRef.current = requestAnimationFrame(updateGame)

    // Return cleanup function
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current)
        gameLoopRef.current = undefined
      }
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      // Reset ball position when canvas is resized
      ballRef.current.x = canvas.width / 2
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft') {
        ballRef.current.dx = -5
      } else if (e.key === 'ArrowRight') {
        ballRef.current.dx = 5
      }
    }

    function handleKeyUp(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        ballRef.current.dx = 0
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    // Only start the game if it's not game over
    if (!gameOver) {
      const cleanup = startGame()
      return () => {
        cleanup?.()
        window.removeEventListener('keydown', handleKeyDown)
        window.removeEventListener('keyup', handleKeyUp)
        window.removeEventListener('resize', resizeCanvas)
        if (gameLoopRef.current) {
          cancelAnimationFrame(gameLoopRef.current)
          gameLoopRef.current = undefined
        }
      }
    }
  }, [gameOver])

  return (
    <div className="flex flex-col items-center justify-center h-screen max-h-screen bg-gray-100 overflow-hidden">
      <h1 className="text-4xl font-bold mb-4">Falling Ball Game</h1>
      <div className="relative w-full h-full">
        <canvas ref={canvasRef} className="border-2 border-gray-300 bg-white" />
        {gameOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="text-white text-center">
              <h2 className="text-3xl font-bold mb-4">Game Over</h2>
              <p className="text-xl">Your score: {score}</p>
              <button
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                onClick={resetGame}
              >
                Play Again
              </button>
            </div>
          </div>
        )}
      </div>
      <p className="mt-4 text-xl font-semibold">Score: {score}</p>
      <p className="mt-2 text-gray-600">Use left and right arrow keys to move the ball</p>
    </div>
  )
}

declare global {
  interface Window {
    startMovingLeft?: () => void
    startMovingRight?: () => void
    stopMoving?: () => void
    GameChannel?: { postMessage: (message: string) => void }
  }
}
