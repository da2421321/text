<template>
  <div class="snake-page">
    <section class="snake-panel">
      <header class="snake-header">
        <h1 class="snake-title">Snake</h1>
        <div class="snake-meta">
          <span>Score: {{ gameState.score }}</span>
          <span>Status: {{ statusText }}</span>
        </div>
      </header>

      <div class="snake-board" :style="boardStyle">
        <div
          v-for="cell in cells"
          :key="cell.key"
          class="snake-cell"
          :class="`is-${cell.type}`"
        />
      </div>

      <div class="snake-actions">
        <button type="button" class="snake-btn" @click="togglePause" :disabled="isFinished">
          {{ pauseButtonText }}
        </button>
        <button type="button" class="snake-btn" @click="restartGame">Restart</button>
      </div>

      <p class="snake-help">Use Arrow keys or WASD. Press Space to pause/resume.</p>

      <div class="snake-controls" aria-label="On-screen controls">
        <button type="button" class="snake-control up" @click="handleDirectionInput('UP')">▲</button>
        <button type="button" class="snake-control left" @click="handleDirectionInput('LEFT')">◀</button>
        <button type="button" class="snake-control down" @click="handleDirectionInput('DOWN')">▼</button>
        <button type="button" class="snake-control right" @click="handleDirectionInput('RIGHT')">▶</button>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { canTurn, createInitialGameState, stepGame } from '@/utils/snakeGame'

const TICK_INTERVAL = 180
const KEY_TO_DIRECTION = {
  ArrowUp: 'UP',
  ArrowDown: 'DOWN',
  ArrowLeft: 'LEFT',
  ArrowRight: 'RIGHT',
  w: 'UP',
  W: 'UP',
  s: 'DOWN',
  S: 'DOWN',
  a: 'LEFT',
  A: 'LEFT',
  d: 'RIGHT',
  D: 'RIGHT'
}

const gameState = ref(createInitialGameState())
const pendingDirection = ref(null)
let timerId = null

const boardStyle = computed(() => ({
  gridTemplateColumns: `repeat(${gameState.value.width}, 1fr)`,
  gridTemplateRows: `repeat(${gameState.value.height}, 1fr)`
}))

const statusText = computed(() => {
  switch (gameState.value.status) {
    case 'paused':
      return 'Paused'
    case 'gameOver':
      return 'Game Over'
    case 'won':
      return 'You Win'
    default:
      return 'Running'
  }
})

const isFinished = computed(() => ['gameOver', 'won'].includes(gameState.value.status))

const pauseButtonText = computed(() =>
  gameState.value.status === 'paused' ? 'Resume' : 'Pause'
)

const cells = computed(() => {
  const bodySet = new Set(gameState.value.snake.map((segment) => `${segment.x},${segment.y}`))
  const head = gameState.value.snake[0]
  const headKey = head ? `${head.x},${head.y}` : ''
  const foodKey = gameState.value.food ? `${gameState.value.food.x},${gameState.value.food.y}` : ''
  const nextCells = []

  for (let y = 0; y < gameState.value.height; y += 1) {
    for (let x = 0; x < gameState.value.width; x += 1) {
      const key = `${x},${y}`
      let type = 'empty'

      if (key === foodKey) {
        type = 'food'
      }

      if (bodySet.has(key)) {
        type = key === headKey ? 'head' : 'snake'
      }

      nextCells.push({ key, type })
    }
  }

  return nextCells
})

const stopLoop = () => {
  if (timerId !== null) {
    clearInterval(timerId)
    timerId = null
  }
}

const tick = () => {
  gameState.value = stepGame(gameState.value, pendingDirection.value)
  pendingDirection.value = null

  if (gameState.value.status !== 'running') {
    stopLoop()
  }
}

const startLoop = () => {
  if (timerId !== null || gameState.value.status !== 'running') {
    return
  }

  timerId = setInterval(tick, TICK_INTERVAL)
}

const resumeGame = () => {
  if (gameState.value.status !== 'paused') {
    return
  }

  gameState.value = {
    ...gameState.value,
    status: 'running'
  }
  startLoop()
}

const togglePause = () => {
  if (isFinished.value) {
    return
  }

  if (gameState.value.status === 'running') {
    gameState.value = {
      ...gameState.value,
      status: 'paused'
    }
    stopLoop()
    return
  }

  resumeGame()
}

const restartGame = () => {
  stopLoop()
  pendingDirection.value = null
  gameState.value = createInitialGameState()
  startLoop()
}

const queueDirection = (direction) => {
  const activeDirection = pendingDirection.value || gameState.value.direction
  if (canTurn(activeDirection, direction, gameState.value.snake.length)) {
    pendingDirection.value = direction
  }
}

const handleDirectionInput = (direction) => {
  if (isFinished.value) {
    return
  }

  if (gameState.value.status === 'paused') {
    resumeGame()
  }

  queueDirection(direction)
}

const handleKeyDown = (event) => {
  if (event.code === 'Space') {
    event.preventDefault()
    togglePause()
    return
  }

  if (event.key === 'Enter') {
    restartGame()
    return
  }

  const direction = KEY_TO_DIRECTION[event.key]
  if (!direction) {
    return
  }

  event.preventDefault()
  handleDirectionInput(direction)
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
  startLoop()
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeyDown)
  stopLoop()
})
</script>

<style scoped>
.snake-page {
  height: 100%;
  overflow: auto;
  padding: 16px;
  background: #f5f5f5;
}

.snake-panel {
  width: min(480px, 100%);
  margin: 0 auto;
  padding: 16px;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  background: #ffffff;
}

.snake-header {
  margin-bottom: 12px;
}

.snake-title {
  margin: 0;
  font-size: 20px;
  line-height: 1.2;
}

.snake-meta {
  margin-top: 6px;
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  color: #595959;
}

.snake-board {
  display: grid;
  width: 100%;
  aspect-ratio: 1 / 1;
  border: 1px solid #d9d9d9;
  background: #fafafa;
}

.snake-cell {
  border: 1px solid #f0f0f0;
}

.snake-cell.is-snake {
  background: #95de64;
}

.snake-cell.is-head {
  background: #52c41a;
}

.snake-cell.is-food {
  background: #f5222d;
}

.snake-actions {
  margin-top: 12px;
  display: flex;
  gap: 8px;
}

.snake-btn {
  padding: 6px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
}

.snake-btn:disabled {
  color: #bfbfbf;
  cursor: not-allowed;
}

.snake-help {
  margin-top: 10px;
  font-size: 12px;
  color: #8c8c8c;
}

.snake-controls {
  margin-top: 12px;
  display: grid;
  grid-template-columns: repeat(3, 44px);
  grid-template-rows: repeat(3, 44px);
  gap: 6px;
  justify-content: center;
}

.snake-control {
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background: #fff;
  font-size: 16px;
  cursor: pointer;
}

.snake-control.up {
  grid-column: 2;
  grid-row: 1;
}

.snake-control.left {
  grid-column: 1;
  grid-row: 2;
}

.snake-control.down {
  grid-column: 2;
  grid-row: 3;
}

.snake-control.right {
  grid-column: 3;
  grid-row: 2;
}
</style>



