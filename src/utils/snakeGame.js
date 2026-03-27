export const BOARD_WIDTH = 16
export const BOARD_HEIGHT = 16
export const INITIAL_SNAKE_LENGTH = 3

export const DIRECTIONS = Object.freeze({
  UP: Object.freeze({ x: 0, y: -1 }),
  DOWN: Object.freeze({ x: 0, y: 1 }),
  LEFT: Object.freeze({ x: -1, y: 0 }),
  RIGHT: Object.freeze({ x: 1, y: 0 })
})

const OPPOSITE_DIRECTIONS = Object.freeze({
  UP: 'DOWN',
  DOWN: 'UP',
  LEFT: 'RIGHT',
  RIGHT: 'LEFT'
})

const toCellKey = (point) => `${point.x},${point.y}`

const isSamePoint = (a, b) => a.x === b.x && a.y === b.y

const isOutOfBounds = (point, width, height) =>
  point.x < 0 || point.y < 0 || point.x >= width || point.y >= height

export const canTurn = (currentDirection, nextDirection, snakeLength) => {
  if (!nextDirection || !DIRECTIONS[nextDirection]) {
    return false
  }

  if (!currentDirection || !DIRECTIONS[currentDirection]) {
    return true
  }

  if (nextDirection === currentDirection) {
    return false
  }

  if (snakeLength <= 1) {
    return true
  }

  return OPPOSITE_DIRECTIONS[currentDirection] !== nextDirection
}

export const createInitialSnake = ({
  width = BOARD_WIDTH,
  height = BOARD_HEIGHT,
  length = INITIAL_SNAKE_LENGTH
} = {}) => {
  const safeLength = Math.max(1, Math.min(length, width))
  const centerY = Math.floor(height / 2)
  const headX = Math.max(safeLength - 1, Math.floor(width / 2))
  const snake = []

  for (let i = 0; i < safeLength; i += 1) {
    snake.push({ x: headX - i, y: centerY })
  }

  return snake
}

export const spawnFood = (snake, width, height, randomFn = Math.random) => {
  const occupied = new Set(snake.map(toCellKey))
  const emptyCells = []

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const cell = { x, y }
      if (!occupied.has(toCellKey(cell))) {
        emptyCells.push(cell)
      }
    }
  }

  if (!emptyCells.length) {
    return null
  }

  const randomIndex = Math.floor(randomFn() * emptyCells.length)
  const clampedIndex = Math.min(Math.max(0, randomIndex), emptyCells.length - 1)
  return emptyCells[clampedIndex]
}

export const createInitialGameState = (
  {
    width = BOARD_WIDTH,
    height = BOARD_HEIGHT,
    snake = createInitialSnake({ width, height }),
    direction = 'RIGHT',
    score = 0,
    status = 'running'
  } = {},
  randomFn = Math.random
) => {
  const food = spawnFood(snake, width, height, randomFn)

  return {
    width,
    height,
    snake,
    direction,
    food,
    score,
    status
  }
}

export const stepGame = (state, queuedDirection, randomFn = Math.random) => {
  if (state.status !== 'running') {
    return state
  }

  const nextDirection = canTurn(state.direction, queuedDirection, state.snake.length)
    ? queuedDirection
    : state.direction
  const vector = DIRECTIONS[nextDirection]
  const head = state.snake[0]
  const nextHead = { x: head.x + vector.x, y: head.y + vector.y }

  if (isOutOfBounds(nextHead, state.width, state.height)) {
    return {
      ...state,
      direction: nextDirection,
      status: 'gameOver'
    }
  }

  const eatsFood = Boolean(state.food) && isSamePoint(nextHead, state.food)
  const collisionBody = eatsFood ? state.snake : state.snake.slice(0, -1)
  const hasSelfCollision = collisionBody.some((segment) => isSamePoint(segment, nextHead))

  if (hasSelfCollision) {
    return {
      ...state,
      direction: nextDirection,
      status: 'gameOver'
    }
  }

  const nextSnake = [nextHead, ...state.snake]
  let nextScore = state.score
  let nextFood = state.food
  let nextStatus = 'running'

  if (eatsFood) {
    nextScore += 1
    nextFood = spawnFood(nextSnake, state.width, state.height, randomFn)

    if (!nextFood) {
      nextStatus = 'won'
    }
  } else {
    nextSnake.pop()
  }

  return {
    ...state,
    snake: nextSnake,
    direction: nextDirection,
    food: nextFood,
    score: nextScore,
    status: nextStatus
  }
}
