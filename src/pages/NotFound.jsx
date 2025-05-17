"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Link } from "react-router-dom"

// Snake game constants
const GRID_SIZE = 20
const CELL_SIZE = 20
const GAME_SPEED_INITIAL = 150
const DIRECTIONS = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
}

const NotFound = () => {
  const [gameStarted, setGameStarted] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [score, setScore] = useState(0)
  const [snake, setSnake] = useState([{ x: 10, y: 10 }])
  const [food, setFood] = useState({ x: 5, y: 5 })
  const [direction, setDirection] = useState(DIRECTIONS.RIGHT)
  const [gameSpeed, setGameSpeed] = useState(GAME_SPEED_INITIAL)
  const lastDirectionRef = useRef(DIRECTIONS.RIGHT)
  const gameLoopRef = useRef(null)

  // Generate random food position
  const generateFood = useCallback(() => {
    const newFood = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    }

    // Make sure food doesn't spawn on snake
    const isOnSnake = snake.some((segment) => segment.x === newFood.x && segment.y === newFood.y)
    if (isOnSnake) return generateFood()

    return newFood
  }, [snake])

  // Initialize the game
  const startGame = useCallback(() => {
    setSnake([{ x: 10, y: 10 }])
    setFood(generateFood())
    setDirection(DIRECTIONS.RIGHT)
    lastDirectionRef.current = DIRECTIONS.RIGHT
    setScore(0)
    setGameOver(false)
    setGameStarted(true)
    setGameSpeed(GAME_SPEED_INITIAL)
  }, [generateFood])

  // Game loop
  const moveSnake = useCallback(() => {
    if (!gameStarted || gameOver) return

    setSnake((prevSnake) => {
      // Create new head based on current direction
      const head = prevSnake[0]
      const newHead = {
        x: head.x + direction.x,
        y: head.y + direction.y,
      }

      // Check for collisions with walls
      if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
        setGameOver(true)
        setGameStarted(false)
        return prevSnake
      }

      // Check for collisions with self
      const selfCollision = prevSnake.some((segment) => segment.x === newHead.x && segment.y === newHead.y)
      if (selfCollision) {
        setGameOver(true)
        setGameStarted(false)
        return prevSnake
      }

      // Create new snake array
      const newSnake = [newHead, ...prevSnake]

      // Check if snake ate food
      if (newHead.x === food.x && newHead.y === food.y) {
        setScore((prevScore) => prevScore + 10)
        setFood(generateFood())
        setGameSpeed((prevSpeed) => Math.max(50, prevSpeed - 5))
      } else {
        // Remove tail if no food was eaten
        newSnake.pop()
      }

      return newSnake
    })

    // Update last direction
    lastDirectionRef.current = direction
  }, [direction, food, gameOver, gameStarted, generateFood])

  // Handle keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!gameStarted) return

      // Prevent reversing direction
      switch (e.key) {
        case "ArrowUp":
          if (lastDirectionRef.current !== DIRECTIONS.DOWN) {
            setDirection(DIRECTIONS.UP)
          }
          break
        case "ArrowDown":
          if (lastDirectionRef.current !== DIRECTIONS.UP) {
            setDirection(DIRECTIONS.DOWN)
          }
          break
        case "ArrowLeft":
          if (lastDirectionRef.current !== DIRECTIONS.RIGHT) {
            setDirection(DIRECTIONS.LEFT)
          }
          break
        case "ArrowRight":
          if (lastDirectionRef.current !== DIRECTIONS.LEFT) {
            setDirection(DIRECTIONS.RIGHT)
          }
          break
        default:
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [gameStarted])

  // Game loop interval
  useEffect(() => {
    if (gameStarted && !gameOver) {
      gameLoopRef.current = setInterval(moveSnake, gameSpeed)
    }

    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current)
      }
    }
  }, [gameStarted, gameOver, moveSnake, gameSpeed])

  // Handle touch controls for mobile
  const handleTouchControl = (newDirection) => {
    if (!gameStarted || gameOver) return

    // Prevent reversing direction
    if (
      (newDirection === DIRECTIONS.UP && lastDirectionRef.current !== DIRECTIONS.DOWN) ||
      (newDirection === DIRECTIONS.DOWN && lastDirectionRef.current !== DIRECTIONS.UP) ||
      (newDirection === DIRECTIONS.LEFT && lastDirectionRef.current !== DIRECTIONS.RIGHT) ||
      (newDirection === DIRECTIONS.RIGHT && lastDirectionRef.current !== DIRECTIONS.LEFT)
    ) {
      setDirection(newDirection)
    }
  }

  // Render game board
  const renderBoard = () => {
    const board = Array(GRID_SIZE)
      .fill()
      .map(() => Array(GRID_SIZE).fill("empty"))

    // Add snake to board
    snake.forEach((segment, index) => {
      if (segment.x >= 0 && segment.x < GRID_SIZE && segment.y >= 0 && segment.y < GRID_SIZE) {
        board[segment.y][segment.x] = index === 0 ? "head" : "body"
      }
    })

    // Add food to board
    if (food.x >= 0 && food.x < GRID_SIZE && food.y >= 0 && food.y < GRID_SIZE) {
      board[food.y][food.x] = "food"
    }

    return (
      <div className="border-4 border-gray-700 bg-gray-900 rounded-md overflow-hidden">
        {board.map((row, y) => (
          <div key={y} className="flex">
            {row.map((cell, x) => (
              <div
                key={`${y}-${x}`}
                className={`
                  ${
                    cell === "empty"
                      ? "bg-gray-800"
                      : cell === "head"
                        ? "bg-emerald-500"
                        : cell === "body"
                          ? "bg-emerald-400"
                          : "bg-red-500 rounded-full"
                  } 
                  border border-gray-900 transition-colors
                `}
                style={{ width: CELL_SIZE, height: CELL_SIZE }}
              />
            ))}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-8 bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <div className="w-full max-w-4xl mx-auto">
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-8xl md:text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-600 mb-4">
            404
          </h1>
          <p className="text-2xl md:text-3xl font-light mb-4">Oops! You're lost in cyberspace</p>
          <p className="text-gray-400 text-center mb-6 max-w-md mx-auto">
            The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
          </p>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-center gap-8 mb-8">
          <div className="text-center md:text-left">
            <h2 className="text-2xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-300">
              Find your way back with Snake!
            </h2>
            <p className="text-gray-300 mb-6 max-w-md">
              While you're here, guide the snake to collect the red apples. Use arrow keys to change direction.
            </p>

            <div className="flex flex-col gap-4">
              <div className="flex justify-center md:justify-start gap-4">
                {!gameStarted ? (
                  <button
                    onClick={startGame}
                    className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-md transition-all duration-300 transform hover:scale-105 shadow-lg"
                  >
                    {gameOver ? "Play Again" : "Start Game"}
                  </button>
                ) : (
                  <button
                    onClick={() => setGameStarted(false)}
                    className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors duration-300"
                  >
                    Pause
                  </button>
                )}

                <Link
                  to="/"
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors duration-300 flex items-center"
                >
                  Go Home
                </Link>
              </div>

              {gameStarted && (
                <div className="mt-4 text-xl font-bold">
                  Score: {score} | Length: {snake.length}
                </div>
              )}
            </div>

            {/* Mobile controls */}
            <div className="md:hidden mt-6 grid grid-cols-3 gap-2 max-w-xs mx-auto">
              <div></div>
              <button className="bg-gray-700 p-3 rounded-md" onClick={() => handleTouchControl(DIRECTIONS.UP)}>
                ↑
              </button>
              <div></div>
              <button className="bg-gray-700 p-3 rounded-md" onClick={() => handleTouchControl(DIRECTIONS.LEFT)}>
                ←
              </button>
              <div className="bg-gray-700 p-3 rounded-md opacity-50"></div>
              <button className="bg-gray-700 p-3 rounded-md" onClick={() => handleTouchControl(DIRECTIONS.RIGHT)}>
                →
              </button>
              <div></div>
              <button className="bg-gray-700 p-3 rounded-md" onClick={() => handleTouchControl(DIRECTIONS.DOWN)}>
                ↓
              </button>
              <div></div>
            </div>
          </div>

          <div className="relative">
            {renderBoard()}

            {!gameStarted && (
              <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center">
                <div className="text-center p-4 rounded-md">
                  {gameOver ? (
                    <div className="animate-bounce">
                      <p className="text-2xl font-bold mb-2">Game Over!</p>
                      <p className="text-xl">Score: {score}</p>
                      <p className="text-lg">Snake Length: {snake.length}</p>
                    </div>
                  ) : (
                    <p className="text-xl font-bold">Press Start</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="text-center text-gray-500 text-sm mt-auto">
        <p>Controls: Use arrow keys to change direction</p>
        <p className="mt-1">Collect red apples to grow your snake and increase your score</p>
      </div>
    </div>
  )
}

export default NotFound
