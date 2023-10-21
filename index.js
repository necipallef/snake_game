window.onload = onWindowLoad

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

function onWindowLoad() {
    loadHighScore()
    setKeyboardListener()

    const gardenElement = document.getElementById('garden')
    const garden = createGardenData(33, 30)
    const snake = createSnakeData()
    startGame(gardenElement, garden, snake)
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
        if (e.code === 'ArrowDown') {
            if (snakeDirection !== SNAKE_DIRECTION_UP && snakeDirection !== SNAKE_DIRECTION_DOWN) {
                snakeDirection = SNAKE_DIRECTION_DOWN
                refreshJob()
            }
        } else if (e.code === 'ArrowUp') {
            if (snakeDirection !== SNAKE_DIRECTION_UP && snakeDirection !== SNAKE_DIRECTION_DOWN) {
                snakeDirection = SNAKE_DIRECTION_UP
                refreshJob()
            }
        } else if (e.code === 'ArrowLeft') {
            if (snakeDirection !== SNAKE_DIRECTION_LEFT && snakeDirection !== SNAKE_DIRECTION_RIGHT) {
                snakeDirection = SNAKE_DIRECTION_LEFT
                refreshJob()
            }
        } else if (e.code === 'ArrowRight') {
            if (snakeDirection !== SNAKE_DIRECTION_LEFT && snakeDirection !== SNAKE_DIRECTION_RIGHT) {
                snakeDirection = SNAKE_DIRECTION_RIGHT
                refreshJob()
            }
        }
    })
}

function refreshJob() {
    const [timeout, job] = futureJob
    clearTimeout(timeout)
    job()
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

function createGarden(gardenElement, garden) {
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

    for (let rowIndex = 0; rowIndex < garden.length; rowIndex++) {
        const row = createGardenRow()
        for (let cellIndex = 0; cellIndex < garden[rowIndex].length; cellIndex++) {
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
    createGarden(gardenElement, garden)
    const foodData = createFoodData(garden, snakeData)
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

function addSnakeHead(gardenElement, snakeData, snakeDirection){
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

function runGame(gardenElement, garden, snakeData, foodData) {
    if (snakeDirection == null) {
        refreshGardenData(garden, snakeData, foodData)
        renderGarden(gardenElement, garden)
        snakeDirection = SNAKE_DIRECTION_RIGHT
        addSnakeHead(gardenElement, snakeData, snakeDirection)
        runDelayed(() => runGame(gardenElement, garden, snakeData, foodData))
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
        newFoodData = createFoodData(garden, snakeData)
    })
    const hitBorder = refreshGardenData(garden, snakeData, newFoodData)
    if (hitSnake || hitBorder) {
        alert('game over')
        return;
    }
    addSnakeHead(gardenElement, snakeData, snakeDirection)
    renderGarden(gardenElement, garden)
    runDelayed(() => runGame(gardenElement, garden, snakeData, newFoodData))
}
