window.onload = onWindowLoad

const GARDEN_WIDTH = 33
const GARDEN_HEIGHT = 30

const CELL_EMPTY = 'cell_empty'
const CELL_SNAKE = 'cell_snake'
const CELL_FOOD = 'cell_food'

const SNAKE_DIRECTION_RIGHT = 'snake_direction_right'
const SNAKE_DIRECTION_LEFT = 'snake_direction_left'
const SNAKE_DIRECTION_UP = 'snake_direction_up'
const SNAKE_DIRECTION_DOWN = 'snake_direction_down'

const HIGH_SCORE_LOCAL_STORAGE_KEY = 'high_score'

let movementSpeed = 10
let snakeDirection = null
let score = 0
let highScore = 0

let futureJob
let isPlaying = false
let isPaused = false

function onRetryClick() {
    if (isPlaying) {
        return
    }

    createNewGame()
}

function createNewGame() {
    const gardenElement = document.getElementById('garden')

    resetState()
    const garden = createGardenData(GARDEN_WIDTH, GARDEN_HEIGHT)
    const snake = createSnakeData()
    startGame(gardenElement, garden, snake)
}

function resetState() {
    movementSpeed = 10
    snakeDirection = null
    score = 0
    renderScore()
    isPaused = false
}

function onWindowLoad() {
    loadHighScore()
    setKeyboardListener()

    const gardenElement = document.getElementById('garden')
    createGarden(gardenElement)
    createNewGame()
}

function loadHighScore() {
    const highScoreFromLocalStorage = localStorage.getItem(HIGH_SCORE_LOCAL_STORAGE_KEY)
    if (highScoreFromLocalStorage) {
        highScore = Number(highScoreFromLocalStorage)
        renderHighScore()
    }
}

function renderHighScore() {
    document.getElementById('high-score').innerHTML = highScore
}

function saveNewHighScore(newHighScore) {
    localStorage.setItem(HIGH_SCORE_LOCAL_STORAGE_KEY, newHighScore.toString())
}

function renderScore() {
    document.getElementById('current-score').innerHTML = score.toString()
}

function setKeyboardListener() {
    document.addEventListener('keydown', e => {
        if (e.code === 'ArrowDown' || e.code === 'KeyS') {
            if (!isPaused && snakeDirection !== SNAKE_DIRECTION_UP && snakeDirection !== SNAKE_DIRECTION_DOWN) {
                snakeDirection = SNAKE_DIRECTION_DOWN
                refreshJob()
            }
        } else if (e.code === 'ArrowUp' || e.code === 'KeyW') {
            if (!isPaused && snakeDirection !== SNAKE_DIRECTION_UP && snakeDirection !== SNAKE_DIRECTION_DOWN) {
                snakeDirection = SNAKE_DIRECTION_UP
                refreshJob()
            }
        } else if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
            if (snakeDirection == null) {
                // Prevent going left in the beginning
                return
            }
            if (!isPaused && snakeDirection !== SNAKE_DIRECTION_LEFT && snakeDirection !== SNAKE_DIRECTION_RIGHT) {
                snakeDirection = SNAKE_DIRECTION_LEFT
                refreshJob()
            }
        } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
            if (!isPaused && snakeDirection !== SNAKE_DIRECTION_LEFT && snakeDirection !== SNAKE_DIRECTION_RIGHT) {
                snakeDirection = SNAKE_DIRECTION_RIGHT
                refreshJob()
            }
        } else if (e.code === 'Space') {
            if (!isPlaying) {
                return;
            }
            if (isPaused) {
                resumeGame()
            } else {
                pauseGame()
            }
        }
    })
}

function refreshJob() {
    const [timeout, job] = futureJob
    if (timeout != null) {
        clearTimeout(timeout)
    }
    job()
}

function resumeGame() {
    const [, job] = futureJob
    runDelayed(job)
    isPaused = false
    document.getElementById('paused').classList.add('hidden')
    document.getElementById('paused').classList.remove('visible')
}

function pauseGame() {
    const [timeout, job] = futureJob
    if (timeout != null) {
        clearTimeout(timeout)
    }
    futureJob = [null, job]
    isPaused = true
    document.getElementById('paused').classList.add('visible')
    document.getElementById('paused').classList.remove('hidden')
}

function createGardenData(width, height) {
    const garden = []
    for (let i = 0; i < width; i++) {
        const row = []
        for (let j = 0; j < height; j++) {
            row.push(CELL_EMPTY)
        }
        garden.push(row)
    }

    return garden
}

function createGarden(gardenElement) {
    function createGardenRow() {
        const cell = document.createElement('div')
        cell.classList.add('garden-row')
        return cell
    }

    function createGardenCell() {
        const cell = document.createElement('div')
        cell.classList.add('garden-cell')
        return cell
    }

    for (let rowIndex = 0; rowIndex < GARDEN_WIDTH; rowIndex++) {
        const row = createGardenRow()
        for (let cellIndex = 0; cellIndex < GARDEN_HEIGHT; cellIndex++) {
            row.appendChild(createGardenCell())
        }
        gardenElement.appendChild(row)
    }
}

function createSnakeData() {
    return [[3, 3], [3, 2], [3, 1]]
}

function getRandomInt(min, max) {
    return Math.round(Math.random() * max)
}

function createFoodData(garden, snakeData) {
    let foodRow, foodCol
    while (true) {
        foodRow = getRandomInt(0, garden.length - 1)
        foodCol = getRandomInt(0, garden[0].length - 1)
        const inSnake = snakeData.find(d => d[0] === foodRow && d[1] === foodCol) != null
        if (!inSnake) {
            break
        }
    }

    return [foodRow, foodCol]
}

function startGame(gardenElement, garden, snakeData) {
    isPlaying = true
    document.getElementById('game-over-span').classList.remove('visible')
    document.getElementById('game-over-span').classList.add('hidden')
    document.getElementById('paused').classList.remove('visible')
    document.getElementById('paused').classList.add('hidden')
    document.getElementById('retry-button').classList.add('disabled')
    const foodData = createFoodData(garden, snakeData)
    refreshGardenData(garden, snakeData, foodData)
    renderGarden(gardenElement, garden)
    addSnakeHead(gardenElement, snakeData, SNAKE_DIRECTION_RIGHT)
    runGame(gardenElement, garden, snakeData, foodData)
}

function moveSnake(snakeData, snakeDirection, foodData, onFoodEaten) {
    const snakeHead = [...snakeData[0]]
    if (snakeDirection === SNAKE_DIRECTION_RIGHT) {
        snakeHead[1]++
    } else if (snakeDirection === SNAKE_DIRECTION_LEFT) {
        snakeHead[1]--
    } else if (snakeDirection === SNAKE_DIRECTION_UP) {
        snakeHead[0]--
    } else if (snakeDirection === SNAKE_DIRECTION_DOWN) {
        snakeHead[0]++
    }

    if (snakeHead[0] === foodData[0] && snakeHead[1] === foodData[1]) {
        onFoodEaten()
    } else {
        snakeData.pop()
    }

    const headInsideSnake = snakeData.find(d => d[0] === snakeHead[0] && d[1] === snakeHead[1]) != null
    if (headInsideSnake) {
        return true
    }

    snakeData.unshift(snakeHead)

    return false
}

function refreshGardenData(garden, snake, food) {
    for (let rowIndex = 0; rowIndex < garden.length; rowIndex++) {
        for (let colIndex = 0; colIndex < garden[rowIndex].length; colIndex++) {
            garden[rowIndex][colIndex] = CELL_EMPTY
        }
    }

    let hitBorder = false
    for (const [snakeRow, snakeCol] of snake) {
        if (snakeRow >= garden.length || snakeRow < 0) {
            hitBorder = true
            continue
        }
        if (snakeCol >= garden[snakeRow].length || snakeCol < 0) {
            hitBorder = true
            continue
        }
        garden[snakeRow][snakeCol] = CELL_SNAKE
    }

    const [foodRow, foodCol] = food
    garden[foodRow][foodCol] = CELL_FOOD

    return hitBorder
}

function renderGarden(gardenElement, garden) {
    for (let rowIndex = 0; rowIndex < garden.length; rowIndex++) {
        const row = gardenElement.children[rowIndex]
        for (let cellIndex = 0; cellIndex < garden[rowIndex].length; cellIndex++) {
            const cell = row.children[cellIndex]
            const cellData = garden[rowIndex][cellIndex]
            if (cellData === CELL_EMPTY) {
                cell.classList.remove('snake-cell')
                cell.classList.remove('food-cell')
            } else if (cellData === CELL_SNAKE) {
                cell.classList.add('snake-cell')
                cell.classList.remove('food-cell')
            } else if (cellData === CELL_FOOD) {
                cell.classList.remove('snake-cell')
                cell.classList.add('food-cell')
            }
        }
    }
}

function removeSnakeHead(gardenElement, snakeData) {
    const headParent = gardenElement.children[snakeData[0][0]].children[snakeData[0][1]]
    headParent.classList.remove('snake-head-cell-container')
    if (headParent.children.length > 0) {
        headParent.removeChild(headParent.children[0])
    }
}

function addSnakeHead(gardenElement, snakeData, snakeDirection) {
    const head = document.createElement('div')
    head.classList.add('snake-head-cell')
    if (snakeDirection === SNAKE_DIRECTION_RIGHT) {
        head.classList.add('snake-head-cell-right')
    } else if (snakeDirection === SNAKE_DIRECTION_LEFT) {
        head.classList.add('snake-head-cell-left')
    } else if (snakeDirection === SNAKE_DIRECTION_UP) {
        head.classList.add('snake-head-cell-up')
    } else if (snakeDirection === SNAKE_DIRECTION_DOWN) {
        head.classList.add('snake-head-cell-down')
    }

    const headParent = gardenElement.children[snakeData[0][0]].children[snakeData[0][1]]
    headParent.classList.add('snake-head-cell-container')
    headParent.appendChild(head)
}

function runDelayed(fn) {
    futureJob = [setTimeout(fn, 1000 / movementSpeed), fn]
}

function waitForRun(fn) {
    futureJob = [null, fn]
}

function runGame(gardenElement, garden, snakeData, foodData) {
    if (snakeDirection == null) {
        waitForRun(() => runGame(gardenElement, garden, snakeData, foodData))
        return
    }

    let newFoodData = foodData
    removeSnakeHead(gardenElement, snakeData)
    const hitSnake = moveSnake(snakeData, snakeDirection, foodData, () => {
        score++
        renderScore()
        if (score > highScore) {
            highScore = score
            saveNewHighScore(highScore)
            renderHighScore()
        }
        if (snakeData.length === GARDEN_WIDTH * GARDEN_HEIGHT) {
            alert('wow!')
            return
        }
        newFoodData = createFoodData(garden, snakeData)
        movementSpeed *= 1.01
    })
    const hitBorder = refreshGardenData(garden, snakeData, newFoodData)
    if (hitSnake || hitBorder) {
        isPlaying = false
        document.getElementById('game-over-span').classList.remove('hidden')
        document.getElementById('game-over-span').classList.add('visible')
        document.getElementById('retry-button').classList.remove('disabled')
        return;
    }
    addSnakeHead(gardenElement, snakeData, snakeDirection)
    renderGarden(gardenElement, garden)
    runDelayed(() => runGame(gardenElement, garden, snakeData, newFoodData))
}
