'use client'

import React, { useEffect, useRef, useState } from 'react'

export default function FallingBallGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const ballRef = useRef<{ dx: number }>({ dx: 0 })

  useEffect(() => {
    if (!canvasRef.current) return
    const canvas = canvasRef.current

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const ball = {
      x: canvas.width / 2,
      y: 30,
      radius: 15,
      dx: 0,
      dy: 2,
    }

    ballRef.current = ball

    window.startMovingLeft = () => {
      ball.dx = -5
    }

    window.startMovingRight = () => {
      ball.dx = 5
    }

    window.stopMoving = () => {
      ball.dx = 0
    }

    let holes: { x: number; width: number }[] = []
    let gameSpeed = 1

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

      ball.y += ball.dy * gameSpeed
      ball.x += ball.dx

      if (ball.x - ball.radius < 0 || ball.x + ball.radius > canvas.width) {
        ball.dx = 0
        ball.x = Math.max(ball.radius, Math.min(canvas.width - ball.radius, ball.x))
      }

      if (holes.length === 0) {
        createHole()
      }

      holes = holes.filter((hole) => {
        if (
          ball.y + ball.radius > canvas.height - 10 &&
          (ball.x - ball.radius < hole.x || ball.x + ball.radius > hole.x + hole.width)
        ) {
          setGameOver(true)
          return false
        }
        return true
      })

      if (ball.y - ball.radius > canvas.height) {
        ball.y = 30
        setScore((prevScore) => {
          const newScore = prevScore + 1
          gameSpeed = 1 + newScore * 0.1
          return newScore
        })
        createHole()
      }

      drawBall()
      drawHoles()

      if (!gameOver) {
        requestAnimationFrame(updateGame)
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft') {
        ball.dx = -5
      } else if (e.key === 'ArrowRight') {
        ball.dx = 5
      }
    }

    function handleKeyUp(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        ball.dx = 0
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    updateGame()

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('resize', resizeCanvas)
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
                onClick={() => window.location.reload()}
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
    startMovingLeft: () => void
    startMovingRight: () => void
    stopMoving: () => void
  }
}
