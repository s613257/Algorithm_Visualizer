// 導覽列
const navButtons = document.querySelectorAll('.nav-btn');
const pages = document.querySelectorAll('.page-content');

// ======================================
// ---------------排序演算法---------------
// ======================================
// getElementById   是 一對一 的關係，選取一個元素時，請用 getElementById。
// querySelectorAll 是 一對多 的關係，選取一組元素時，請用 querySelectorAll。
const numInputs = document.querySelectorAll('.num-input');
const randomizeBtn = document.getElementById('randomizeBtn');
const algorithmButtons = document.querySelectorAll('.algo-btn');
const barsContainer = document.getElementById('barsContainer');
const completionMessage = document.getElementById('completionMessage');
const playBtn = document.getElementById('playBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const speedSlider = document.getElementById('speedSlider');
const resultDiv = document.getElementById('result');

let currentNumbers = []; // 用於保存當前輸入的數字
let animationSteps = []; // 儲存後端回傳的每一步陣列狀態
let animationSpeed = 500; // 毫秒
let animationIndex = 0;
let animationInterval = null;

// 監聽每個導覽按鈕的點擊事件
navButtons.forEach(button => {
    button.addEventListener('click', () => {
        // 取得按鈕的 data-page 屬性值，例如 'sort', 'search', 'clustering'
        const targetPageId = button.dataset.page;

        // 移除所有導覽按鈕的 active 類別
        navButtons.forEach(btn => btn.classList.remove('active'));

        // 移除所有內容頁面的 active 類別
        pages.forEach(page => page.classList.remove('active'));

        // 將 active 類別新增到被點擊的按鈕上
        button.classList.add('active');

        // 將 active 類別新增到對應的內容頁面上
        const targetPage = document.getElementById(`${targetPageId}-page`);
        if (targetPage) {
            targetPage.classList.add('active');
        }
    });
});

// --- 初始化長條圖 ---
function initializeBars(numbers) {
    barsContainer.innerHTML = ''; 
    numbers.forEach((num, index) => {
        const bar = document.createElement('div');
        bar.classList.add('bar');
        bar.style.height = `${num * 2}px`; 
        bar.style.order = index; // 保持原始順序
        bar.textContent = num; // 顯示數字
        barsContainer.appendChild(bar);
    });
    currentNumbers = [...numbers]; // 儲存初始狀態
}

// --- 隨機產生數字 ---
randomizeBtn.addEventListener('click', () => {
    const randomNumbers = Array.from({ length: 10 }, () => Math.floor(Math.random() * 100) + 1);
    numInputs.forEach((input, index) => {
        input.value = randomNumbers[index];
    });
    initializeBars(randomNumbers); // 重新初始化長條圖
    resetAnimation(); // 重設動畫狀態
});

// --- 監聽數字輸入變化 ---
numInputs.forEach(input => {
    input.addEventListener('change', () => {
        const numbers = Array.from(numInputs).map(input => parseInt(input.value, 10));
        initializeBars(numbers);
        resetAnimation();
    });
});

// --- 演算法按鈕點擊 ---
algorithmButtons.forEach(button => {
    button.addEventListener('click', () => {
        algorithmButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        const numbers = Array.from(numInputs).map(input => parseInt(input.value, 10));
        if (numbers.some(isNaN) || numbers.length === 0) {
            resultDiv.innerHTML = '<p style="color: red;">請輸入有效的數字！</p>';
            return;
        }
        
        const validNumbers = numbers.filter(num => num >= 0 && num <= 100);
        if (validNumbers.length !== numbers.length) {
             resultDiv.innerHTML = '<p style="color: red;">請確保數字在 0 到 100 之間！</p>';
             return;
        }

        initializeBars(numbers); // 確保顯示的是初始狀態
        resetAnimation(); // 重設動畫
        sendDataToBackend(numbers, button.dataset.algo);
    });
});

// --- 發送資料到後端 ---
async function sendDataToBackend(data, algorithmName) {
    try {
        resultDiv.innerHTML = '<p>正在處理中...</p>';
        algorithmButtons.forEach(btn => btn.disabled = true); // 禁用按鈕
        numInputs.forEach(input => input.disabled = true); // 禁用輸入

        const response = await fetch('/sort', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ numbers: data, algorithm: algorithmName })
        });

        if (!response.ok) {
            throw new Error('伺服器處理失敗');
        }

        const result = await response.json();
        
        // 保存動畫步驟和顯示結果資訊
        animationSteps = result.animation_steps;
        displayResultInfo(result, algorithmName);
        
        // 啟用動畫控制按鈕
        playBtn.disabled = false;
        resetBtn.disabled = false;
        pauseBtn.disabled = true;

    } catch (error) {
        resultDiv.innerHTML = `<p style="color: red;">發生錯誤：${error.message}</p>`;
    } finally {
        algorithmButtons.forEach(btn => btn.disabled = false); // 重新啟用按鈕
        numInputs.forEach(input => input.disabled = false); // 重新啟用輸入
    }
}

// --- 顯示結果資訊 ---
function displayResultInfo(result, algorithmName) {
    const complexityInfo = ALGORITHM_COMPLEXITY[algorithmName];
    const actualTimeComplexity = complexityInfo.time[result.time_complexity_type] || complexityInfo.time.average;

    resultDiv.innerHTML = `
        <h2>${algorithmName.toUpperCase()} 排序結果</h2>
        <div class="result-content">
            <div class="left-panel">
                <p><strong>原始數據：</strong> [${result.original_data.join(', ')}]</p>
                <p><strong>排序後：</strong> [${result.sorted_data.join(', ')}]</p>
                <p><strong>執行時間：</strong> ${result.time_taken.toFixed(6)} 微秒</p>
            </div>
            <div class="right-panel">
                <p><strong>時間複雜度：</strong> ${result.time_complexity_type} 情況 (${actualTimeComplexity})</p>
                <p><strong>空間複雜度：</strong> ${result.space_complexity}</p>
                <p><strong>比較次數：</strong> ${result.comparisons}</p>
                <p><strong>交換次數：</strong> ${result.swaps}</p>
            </div>
        </div>
    `;
}

// --- 動畫控制 ---
playBtn.addEventListener('click', playAnimation);
pauseBtn.addEventListener('click', pauseAnimation);
resetBtn.addEventListener('click', resetAnimation);
speedSlider.addEventListener('input', (e) => {
    animationSpeed = 5000 - e.target.value; // 滑桿值越大，速度越快
    if (animationInterval) { // 如果動畫正在播放，重新設定速度
        pauseAnimation();
        playAnimation();
    }
});

function playAnimation() {
    if (animationInterval) return; // 避免重複啟動

    playBtn.disabled = true;
    pauseBtn.disabled = false;
    completionMessage.classList.remove('show');

    animationInterval = setInterval(() => {
        if (animationIndex < animationSteps.length) {
            applyStep(animationSteps[animationIndex]);
            animationIndex++;
        } else {
            pauseAnimation();
            markSorted(); // 所有條狀圖標記為已排序
            completionMessage.textContent = '排序完成！';
            completionMessage.classList.add('show'); // 顯示訊息
        }
    }, animationSpeed);
}

function pauseAnimation() {
    clearInterval(animationInterval);
    animationInterval = null;
    playBtn.disabled = false;
    pauseBtn.disabled = true;
}

function resetAnimation() {
    pauseAnimation();
    animationIndex = 0;
    initializeBars(currentNumbers); // 恢復到初始狀態
    playBtn.disabled = false;
    pauseBtn.disabled = true;
    resultDiv.innerHTML = ''; // 清空結果區塊
    algorithmButtons.forEach(btn => btn.classList.remove('active')); // 移除按鈕active狀態
    completionMessage.classList.remove('show');
}

function applyStep(step) {
    const bars = document.querySelectorAll('.bar');
    const newOrder = step.array; // 獲取新順序的陣列

    // 重置所有條狀圖的顏色
    bars.forEach(bar => bar.classList.remove('compared', 'swapped', 'sorted', 'pivot', 'active'));

    newOrder.forEach((value, originalIndex) => {
        const bar = bars[originalIndex]; // 根據原始順序獲取 bar 元素
        bar.style.height = `${value * 2}px`;
        bar.textContent = value;
        // 根據 step 中的指標來設定顏色
        if (step.compared && (step.compared[0] === originalIndex || step.compared[1] === originalIndex)) {
            bar.classList.add('compared');
        }
        if (step.swapped && (step.swapped[0] === originalIndex || step.swapped[1] === originalIndex)) {
            bar.classList.add('swapped');
        }
        if (step.pivot === originalIndex) {
             bar.classList.add('pivot');
        }
        if (step.active && step.active.includes(originalIndex)) {
            bar.classList.add('active');
        }
    });

    // 標記已排序的元素
    if (step.sorted_indices) {
        step.sorted_indices.forEach(idx => {
            bars[idx].classList.add('sorted');
        });
    }
}

function markSorted() {
    const bars = document.querySelectorAll('.bar');
    bars.forEach(bar => bar.classList.add('sorted'));
}


// --- 初始載入 ---
window.addEventListener('load', () => {
    // 頁面載入時，根據預設輸入框的數字初始化長條圖
    const initialNumbers = Array.from(numInputs).map(input => parseInt(input.value, 10));
    initializeBars(initialNumbers);
});

// 複雜度資訊 (保留在前端，因為不需要從後端動態獲取)
const ALGORITHM_COMPLEXITY = {
    'bubble': {
        'time': { 'best': 'O(n)', 'average': 'O(n²)', 'worst': 'O(n²)' },
        'space': 'O(1)'
    },
    'insertion': {
        'time': { 'best': 'O(n)', 'average': 'O(n²)', 'worst': 'O(n²)' },
        'space': 'O(1)'
    },
    'selection': {
        'time': { 'best': 'O(n²)', 'average': 'O(n²)', 'worst': 'O(n²)' },
        'space': 'O(1)'
    },
    'quick': {
        'time': { 'best': 'O(n log n)', 'average': 'O(n log n)', 'worst': 'O(n²)' },
        'space': 'O(log n) to O(n)'
    },
    'merge': {
        'time': { 'best': 'O(n log n)', 'average': 'O(n log n)', 'worst': 'O(n log n)' },
        'space': 'O(n)'
    },
    'heap': {
        'time': { 'best': 'O(n log n)', 'average': 'O(n log n)', 'worst': 'O(n log n)' },
        'space': 'O(1)'
    }
};

// ======================================
// ---------------搜尋演算法---------------
// ======================================

// 獲取所有頁面容器
const bfsPage = document.getElementById('bfs-page');
const dfsPage = document.getElementById('dfs-page');
const showBfsBtn = document.getElementById('show-bfs-btn');
const showDfsBtn = document.getElementById('show-dfs-btn');

// 搜尋迷宮相關的按鈕和容器
const toggleSearchBtn = document.querySelector('.toggle-btn');
const collapsibleContent = document.querySelector('.collapsible-content');
const mainPages = document.querySelectorAll('.page-content');

// 迷宮容器與按鈕
const bfsMazeContainer = document.querySelector('#bfs-page .maze-container');
const dfsMazeContainer = document.querySelector('#dfs-page .maze-container');
const bfsStartBtn = document.getElementById('startSearchBtn');
const bfsResetBtn = document.getElementById('resetSearchBtn');
const bfsSpeedSlider = document.getElementById('searchSpeedSlider');
const dfsStartBtn = document.getElementById('startDfsBtn');
const dfsResetBtn = document.getElementById('resetDfsBtn');
const dfsSpeedSlider = document.getElementById('dfsSpeedSlider');

// 迷宮類型按鈕
const mazeTypeBtns = document.querySelectorAll('.maze-type-btn');

// 提示文字的元素
const mazeInfoText = document.getElementById('.maze-info-text');

// ============================================
// ----------------定義迷宮資料---------------
// ============================================

const allMazes = {
    'numbers': {
        'cat': {
            data: [
                [0, 1, 2, 4, 5, 8],
                [6, 4, 3, 3, 7, 9],
                [2, 5, 6, 7, 8, 3],
                [6, 7, 8, 9, 9, 9],
                [5, 5, 2, 5, 10, 0],
                [9, 7, 6, 3, 8, 5]
            ],
            startIcon: 'fa-solid fa-cat',
            endIcon: 'fa-solid fa-fish',
            startPos: { row: 0, col: 0 },
            endPos: { row: 4, col: 5 }
        },
        'bird': {
            data: [
                [3, 7, 2, 4, 5, 8],
                [0, 1, 2, 5, 7, 9],
                [4, 8, 3, 5, 6, 7],
                [6, 2, 4, 4, 9, 8],
                [5, 5, 5, 8, 9, 9],
                [9, 7, 6, 7, 10, 0]
            ],
            startIcon: 'fa-solid fa-kiwi-bird',
            endIcon: 'fa-solid fa-bugs',
            startPos: { row: 1, col: 0 },
            endPos: { row: 5, col: 5 }
        }
    },
    'wall': {
        'taxi': {
            data: [
                [0, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
                [1, 1, 1, 1, 0, 1, 0, 1, 0, 1],
                [1, 0, 0, 0, 0, 1, 0, 1, 0, 1],
                [1, 0, 1, 1, 1, 1, 0, 1, 0, 1],
                [1, 0, 1, 1, 0, 0, 0, 1, 0, 1],
                [1, 0, 1, 0, 1, 1, 1, 1, 0, 1],
                [1, 0, 1, 0, 0, 0, 0, 0, 0, 1],
                [1, 0, 1, 1, 1, 1, 1, 1, 1, 1],
                [1, 0, 0, 0, 0, 0, 0, 0, 0, 0]
            ],
            startIcon: 'fa-solid fa-taxi',
            endIcon: 'fa-solid fa-flag',
            startPos: { row: 0, col: 0 },
            endPos: { row: 9, col: 9 }
        },
        'airplane': {
            data: [
                [0, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                [0, 0, 0, 0, 1, 0, 0, 0, 1, 1],
                [1, 1, 1, 0, 1, 0, 1, 0, 1, 1],
                [1, 0, 0, 0, 0, 0, 1, 0, 1, 1],
                [1, 0, 1, 1, 1, 1, 1, 0, 1, 1],
                [1, 0, 1, 0, 0, 0, 0, 0, 1, 1],
                [1, 0, 1, 0, 1, 1, 1, 1, 1, 1],
                [1, 0, 1, 0, 1, 0, 0, 0, 0, 0],
                [1, 0, 1, 1, 1, 0, 1, 1, 1, 1],
                [1, 0, 0, 0, 0, 0, 0, 0, 0, 1]
            ],
            startIcon: 'fa-solid fa-plane',
            endIcon: 'fa-solid fa-flag',
            startPos: { row: 0, col: 0 },
            endPos: { row: 7, col: 9 }
        }
    }
};

// ============================================
// ----------------通用邏輯與狀態---------------
// ============================================
// 預設為數字迷宮
let currentMazeType = 'numbers'; 
// 用來記住每種迷宮的當前索引
const mazeIndexes = {
    'numbers': 0,  
    'wall': 0
};

// 顯示或隱藏可收合內容的函式
function toggleCollapsibleContent() {
    collapsibleContent.style.display = (collapsibleContent.style.display === 'none' || collapsibleContent.style.display === '') ? 'flex' : 'none';
    toggleSearchBtn.classList.toggle('active');
}

// 處理主要頁面切換的函式
function switchMainPage(pageToShowId) {
    mainPages.forEach(page => {
        page.style.display = 'none';
    });
    const targetPage = document.getElementById(pageToShowId);
    if (targetPage) {
        targetPage.style.display = 'block';
    }
}

// 顯示特定子頁面的函式 (處理 BFS/DFS)
function switchSubPage(pageToShow) {
    bfsPage.style.display = 'none';
    dfsPage.style.display = 'none';
    
    // 根據當前迷宮類型創建迷宮
    const currentMazeKeys = Object.keys(allMazes[currentMazeType]);
    const currentMazeKey = currentMazeKeys[mazeIndexes[currentMazeType]];

    // 預設顯示數字迷宮
    if (pageToShow === 'bfs') {
        bfsPage.style.display = 'block';
        createMaze('numbers', 'bfs-page'); 
    } else if (pageToShow === 'dfs') {
        dfsPage.style.display = 'block';
        createMaze('numbers', 'dfs-page'); 
    }
}

// 在頁面載入時，預設顯示排序頁面並創建 BFS 迷宮
document.addEventListener('DOMContentLoaded', () => {
    switchMainPage('sort-page');
    // 在切換到搜尋頁面時才建立迷宮，以確保容器存在
});

// 設置按鈕的事件監聽器
// 處理主要頁面切換
document.querySelectorAll('.nav-btn[data-page]').forEach(btn => {
    btn.addEventListener('click', () => {
        const pageId = btn.dataset.page + '-page';
        switchMainPage(pageId);
    });
});

// 處理搜尋主按鈕點擊事件
toggleSearchBtn.addEventListener('click', () => {
    toggleCollapsibleContent();
});

// 處理子頁面切換
showBfsBtn.addEventListener('click', () => {
    switchMainPage('search-page');
    switchSubPage('bfs');
});

showDfsBtn.addEventListener('click', () => {
    switchMainPage('search-page');
    switchSubPage('dfs');
});

// ============================================
// ----------------迷宮生成與操作---------------
// ============================================

/**
 * 根據迷宮類型和頁面 ID 創建迷宮
 * @param {string} mazeType - 迷宮類型 ('numbers' 或 'wall')
 * @param {string} pageId - 頁面 ID ('bfs-page' 或 'dfs-page')
 */
function createMaze(mazeType, pageId) {
    const container = document.querySelector(`#${pageId} .maze-container`);
    if (!container) return; // 確保容器存在
    container.innerHTML = ''; // 清空容器

    // 找到當前頁面的提示文字元素
    const infoTextElement = document.querySelector(`#${pageId} .maze-info-text`);
    
    // 根據迷宮類型更新提示文字
    if (infoTextElement) {
        if (mazeType === 'numbers') {
            infoTextElement.textContent = '跟著小動物，從數字 1 走到數字 10，找到食物吧！';
        } else if (mazeType === 'wall') {
            infoTextElement.textContent = '坐上交通工具，抵達終點吧！';
        }
    }
    
    const mazeKeys = Object.keys(allMazes[mazeType]);
    const currentMazeKey = mazeKeys[mazeIndexes[mazeType]];
    const mazeDataObj = allMazes[mazeType][currentMazeKey];
    
    const data = mazeDataObj.data;
    const startPos = mazeDataObj.startPos;
    const endPos = mazeDataObj.endPos;
    const startIconClasses = mazeDataObj.startIcon.split(' ');
    const endIconClasses = mazeDataObj.endIcon.split(' ');
    
    // 根據迷宮類型切換 CSS 類別
    container.classList.remove('number-maze', 'wall-maze');
    if (mazeType === 'numbers') {
        container.classList.add('number-maze');
    } else if (mazeType === 'wall') {
        container.classList.add('wall-maze');
    }
    
    for (let row = 0; row < data.length; row++) {
        for (let col = 0; col < data[row].length; col++) {
            const cell = document.createElement('div');
            cell.classList.add('maze-cell');
            cell.dataset.row = row;
            cell.dataset.col = col;
            const value = data[row][col];
            
            // 處理牆壁迷宮的牆壁
            if (mazeType === 'wall' && value === 1) {
                cell.classList.add('wall');
            } else {
                // 處理起點和終點的特殊圖示
                if (row === startPos.row && col === startPos.col) {
                    cell.innerHTML = `<i class="${startIconClasses.join(' ')}" style="color: #666;"></i>`;
                    cell.classList.add('start');
                } else if (row === endPos.row && col === endPos.col) {
                    cell.innerHTML = `<i class="${endIconClasses.join(' ')}" style="color: #666;"></i>`;
                    cell.classList.add('end');
                } else if (mazeType === 'numbers') {
                    // 數字迷宮的數字
                    cell.textContent = value;
                }
            }
            container.appendChild(cell);
        }
    }
}

// 換圖按鈕的通用點擊事件監聽器
document.querySelectorAll('#bfs-page .search-controls #resetSearchBtn, #dfs-page .search-controls #resetDfsBtn').forEach(btn => {
    btn.addEventListener('click', (event) => {
        const pageId = event.target.closest('.page-content').id;
        const currentMazeKeys = Object.keys(allMazes[currentMazeType]);
        mazeIndexes[currentMazeType] = (mazeIndexes[currentMazeType] + 1) % currentMazeKeys.length;
        createMaze(currentMazeType, pageId);
    });
});

// 處理迷宮類型按鈕點擊事件 (數字迷宮和牆壁迷宮)
mazeTypeBtns.forEach(btn => {
    btn.addEventListener('click', (event) => {
        // 從 data 屬性取得迷宮類型
        currentMazeType = btn.dataset.mazeType;
        const pageId = event.target.closest('.page-content').id;
        createMaze(currentMazeType, pageId);
    });
});

// ============================================
// ----------------搜尋演算法核心邏輯---------------
// ============================================

// 尋找迷宮路徑的 BFS 演算法 (維持不變)
async function bfsSearch(startPos, endPos, data) {
    const rows = data.length;
    const cols = data[0].length;
    const visited = new Set();
    const queue = [];
    const parentMap = new Map();
    const animationSteps = [];
    const startNodeKey = `${startPos.row}-${startPos.col}`;
    const endNodeKey = `${endPos.row}-${endPos.col}`;
    let pathFound = false;

    queue.push(startNodeKey);
    visited.add(startNodeKey);

    while (queue.length > 0) {
        const currentNodeKey = queue.shift();
        const [currentRow, currentCol] = currentNodeKey.split('-').map(Number);
        
        // 探索到的節點標記為 visited
        if (currentNodeKey !== startNodeKey) {
            animationSteps.push({ row: currentRow, col: currentCol, type: 'visited' });
        }

        if (currentNodeKey === endNodeKey) {
            pathFound = true;
            break;
        }
        
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        // 確保方向是隨機的，使動畫看起來更生動
        directions.sort(() => Math.random() - 0.5);

        for (const [dr, dc] of directions) {
            const newRow = currentRow + dr;
            const newCol = currentCol + dc;
            const newNodeKey = `${newRow}-${newCol}`;

            // 檢查邊界
            if (newRow >= 0 && newRow < rows && newCol >= 0 && newCol < cols) {
                const isVisited = visited.has(newNodeKey);
                const isWall = currentMazeType === 'wall' && data[newRow][newCol] === 1;
                const isCorrectNumber = currentMazeType === 'numbers' && data[newRow][newCol] === data[currentRow][currentCol] + 1;
                const isEndNode = newNodeKey === endNodeKey;

                // 判斷是否為有效路徑
                if ((currentMazeType === 'wall' && !isWall && !isVisited) || (currentMazeType === 'numbers' && (isCorrectNumber || isEndNode) && !isVisited)) {
                    visited.add(newNodeKey);
                    queue.push(newNodeKey);
                    parentMap.set(newNodeKey, currentNodeKey);
                    // 將成功探索的格子推入步驟，稍後用 'examined' 類別來標示
                    animationSteps.push({ row: newRow, col: newCol, type: 'examined' });
                } else if (!isVisited && !isEndNode) { 
                    // 新增判斷，如果遇到的是牆壁，推入 examined-wall 類型
                    // if (currentMazeType === 'wall' && isWall) {
                        animationSteps.push({ row: newRow, col: newCol, type: 'examined-wall' });
                    // } else {
                    //     // 其他無效路徑（例如數字迷宮中不連續的數字）則標記為 deadEnd
                    //     animationSteps.push({ row: newRow, col: newCol, type: 'deadEnd' });
                    // }
                }
            }
        }
    }

    if (pathFound) {
        let pathNodeKey = endNodeKey;
        const finalPath = [];
        while (pathNodeKey !== startNodeKey) {
            const [row, col] = pathNodeKey.split('-').map(Number);
            finalPath.unshift({ row, col, type: 'path' });
            pathNodeKey = parentMap.get(pathNodeKey);
        }
        animationSteps.push(...finalPath);
    }
    return animationSteps;
}


// 尋找迷宮路徑的 DFS 演算法
async function dfsSearch(startPos, endPos, data) {
    const rows = data.length;
    const cols = data[0].length;
    const stack = [];
    const visited = new Set();
    const parentMap = new Map();
    const animationSteps = [];
    let pathFound = false;

    const startNodeKey = `${startPos.row}-${startPos.col}`;
    const endNodeKey = `${endPos.row}-${endPos.col}`;
    
    // 堆疊中存儲的是 [節點, 鄰居索引]，以確保只探索一個方向
    stack.push({ nodeKey: startNodeKey, neighborIndex: 0 });

    while (stack.length > 0) {
        let { nodeKey, neighborIndex } = stack.pop();
        const [currentRow, currentCol] = nodeKey.split('-').map(Number);
        
        // 如果這個節點已經被訪問過，但不是終點，代表這是回溯，將其標記為回溯點
        if (visited.has(nodeKey) && nodeKey !== startNodeKey) {
            animationSteps.push({ row: currentRow, col: currentCol, type: 'deadEnd' });
            continue;
        }

        visited.add(nodeKey);
        
        // 在 DFS 中，找到終點時可以立即停止
        if (nodeKey === endNodeKey) {
            pathFound = true;
            break; // 找到終點，立即結束 while 迴圈
        }

        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        
        let foundNeighbor = false;
        // 從當前索引開始尋找下一個未訪問的鄰居
        for (let i = neighborIndex; i < directions.length; i++) {
            const [dr, dc] = directions[i];
            const newRow = currentRow + dr;
            const newCol = currentCol + dc;
            const newNodeKey = `${newRow}-${newCol}`;
            
            // 檢查邊界
            if (newRow >= 0 && newRow < rows && newCol >= 0 && newCol < cols) {
                const isVisited = visited.has(newNodeKey);
                const isWall = currentMazeType === 'wall' && data[newRow][newCol] === 1;
                const isCorrectNumber = currentMazeType === 'numbers' && data[newRow][newCol] === data[currentRow][currentCol] + 1;
                const isEndNode = newNodeKey === endNodeKey;

                // 檢查是否為有效路徑
                if ((currentMazeType === 'wall' && !isWall && !isVisited) || (currentMazeType === 'numbers' && (isCorrectNumber || isEndNode) && !isVisited)) {
                    // 找到有效鄰居，將當前節點推回堆疊，並記錄下一個要探索的鄰居索引
                    stack.push({ nodeKey: nodeKey, neighborIndex: i + 1 });
                    stack.push({ nodeKey: newNodeKey, neighborIndex: 0 });
                    parentMap.set(newNodeKey, nodeKey);
                    
                    // 標記為正在探索
                    animationSteps.push({ row: newRow, col: newCol, type: 'examined' });
                    foundNeighbor = true;

                    // 如果找到的是終點，立即停止尋找鄰居
                    if (isEndNode) {
                        pathFound = true;
                        break;
                    }
                } else if (!isVisited && !isEndNode) {
                    // 判斷是否為牆壁或數字不連續
                    const isInvalidPath = (currentMazeType === 'wall' && isWall) || (currentMazeType === 'numbers' && !isCorrectNumber);
                    if (isInvalidPath) {
                        // 如果是牆壁，標記為 examined-wall
                        // if (currentMazeType === 'wall' && isWall) {
                            animationSteps.push({ row: newRow, col: newCol, type: 'examined-wall' });
                        } else {
                            // 其他無效路徑（例如數字迷宮）標記為 deadEnd
                            animationSteps.push({ row: newRow, col: newCol, type: 'deadEnd' });
                        }
                    }
                }
            }
        // }
            
        
        // 如果找到了終點，結束 while 迴圈
        if (pathFound) {
            break;
        }
    }

    // 建構最終路徑
    if (pathFound) {
        let pathNodeKey = endNodeKey;
        const finalPath = [];
        while (pathNodeKey && pathNodeKey !== startNodeKey) {
            const [row, col] = pathNodeKey.split('-').map(Number);
            finalPath.unshift({ row, col, type: 'path' });
            pathNodeKey = parentMap.get(pathNodeKey);
        }
        animationSteps.push(...finalPath);
    }
    
    return animationSteps;
}

// 執行動畫的函式 (通用)
async function animateSearch(steps, pageId, speedSliderId) {
    const animationDelay = 2500 - document.getElementById(speedSliderId).value;
    const cells = document.querySelectorAll(`#${pageId} .maze-cell`);
    
    // 判斷當前是哪種演算法，這對於DFS的特殊處理很重要
    const isDfs = pageId === 'dfs-page';

    // 階段一：探索與死路動畫
    for (const step of steps) {
        if (step.type === 'path') {
            break; 
        }

        const cell = document.querySelector(`#${pageId} [data-row="${step.row}"][data-col="${step.col}"]`);
        if (!cell || cell.classList.contains('start') || cell.classList.contains('end')) {
            continue;
        }

        // 清除所有探索/死路的舊類別，準備顯示新狀態
        cell.classList.remove('visited', 'deadEnd', 'examined', 'examined-wall');

        if (step.type === 'examined' || step.type === 'visited') {
            // 探索中的格子，所有演算法都逐格顯示
            cell.classList.add('examined'); 
            await new Promise(resolve => setTimeout(resolve, animationDelay));
        } else if (step.type === 'examined-wall') {
            // 步驟一：顯示撞牆的紫色
            cell.classList.add('examined-wall');
            
            // 步驟二：延遲一下，讓使用者看到閃爍
            await new Promise(resolve => setTimeout(resolve, animationDelay));
            
            // 步驟三：移除紫色，恢復原狀
            cell.classList.remove('examined-wall');
        } else if (step.type === 'deadEnd') {
            // 步驟一：顯示死路的紅色
            cell.classList.add('deadEnd');
            
            // 步驟二：如果不是 DFS 牆壁迷宮的回溯，就延遲一下
            const isDfsWallMaze = isDfs && currentMazeType === 'wall';
            if (!isDfsWallMaze) {
            await new Promise(resolve => setTimeout(resolve, animationDelay));
            }   
        // 紅色的 deadEnd 狀態會保留，直到最終路徑出現
        }
    }
    
    // 階段二：最終路徑動畫 (保持不變)
    const pathDelay = animationDelay / 2;
    for (const step of steps) {
        if (step.type === 'path') {
            const cell = document.querySelector(`#${pageId} [data-row="${step.row}"][data-col="${step.col}"]`);
            if (cell) {
                cell.classList.remove('visited', 'examined', 'deadEnd', 'examined-wall'); 
                cell.classList.add('path');
            }
            await new Promise(resolve => setTimeout(resolve, pathDelay));
        }
    }
    
    // 階段三：放置最終的圖示 (保持不變)
    const mazeKeys = Object.keys(allMazes[currentMazeType]);
    const currentMazeKey = mazeKeys[mazeIndexes[currentMazeType]];
    const currentMaze = allMazes[currentMazeType][currentMazeKey];
    const endCell = document.querySelector(`#${pageId} [data-row="${currentMaze.endPos.row}"][data-col="${currentMaze.endPos.col}"]`);
    if (endCell) {
        endCell.innerHTML = '';
        endCell.classList.remove('end');
        
        let finalIcon;
        if (currentMazeType === 'numbers') {
            finalIcon = 'fa-solid fa-paw';
        } else if (currentMazeType === 'wall') {
            finalIcon = 'fa-solid fa-location-dot';
        }

        endCell.innerHTML = `<i class="${finalIcon}" style="color: #666;"></i>`;
        endCell.classList.add('finished-path');
    }
}


// 開始搜尋按鈕的通用點擊事件監聽器
document.querySelectorAll('#bfs-page .search-controls #startSearchBtn, #dfs-page .search-controls #startDfsBtn').forEach(btn => {
    btn.addEventListener('click', async (event) => {
        const pageId = event.target.closest('.page-content').id;
        const currentMazeKeys = Object.keys(allMazes[currentMazeType]);
        const currentMazeKey = currentMazeKeys[mazeIndexes[currentMazeType]];
        const currentMaze = allMazes[currentMazeType][currentMazeKey];
        
        // 清除舊的動畫樣式
        const cells = document.querySelectorAll(`#${pageId} .maze-cell`);
        cells.forEach(cell => {
            cell.classList.remove('visited', 'path', 'finished-path');
        });

        // 判斷是 BFS 還是 DFS 頁面並執行對應演算法
        // await 會先執行 bfsSearch 或 dfsSearch 函式完成並回傳結果，然後才會執行 animateSearch 負責播放動畫
        let steps;
        if (pageId === 'bfs-page') {
            steps = await bfsSearch(currentMaze.startPos, currentMaze.endPos, currentMaze.data);
            await animateSearch(steps, 'bfs-page', 'searchSpeedSlider');
        } else if (pageId === 'dfs-page') {
            steps = await dfsSearch(currentMaze.startPos, currentMaze.endPos, currentMaze.data);
            await animateSearch(steps, 'dfs-page', 'dfsSpeedSlider');
        }
    });
});


// ============================================
// ----------------分類與分群---------------
// ============================================
// 預先定義全域變數
const fileDropArea = document.querySelector('.file-drop-area');
const classificationBtn = document.querySelector('.classification-btn');
const clusteringBtn = document.querySelector('.clustering-btn');
const executeBtn = document.querySelector('.execute-btn');
const dataPreview = document.querySelector('.data-preview');
const analysisResults = document.querySelector('.analysis-results');
const accuracyInfo = document.querySelector('.accuracy-info');

const classificationSettings = document.getElementById('classification-settings');
const clusteringSettings = document.getElementById('clustering-settings');
const targetFieldInput = document.getElementById('target-field');
const clusterCountInput = document.getElementById('cluster-count');

let selectedFile = null;
let selectedAnalysisType = 'clustering'; // 預設為 '分群'
let myChart = null;
let targetFieldName = 'target_class'; // 預設值
let clusterCount = 3; // 預設值

document.addEventListener('DOMContentLoaded', () => {
    // 預設顯示分群設定，並將分群按鈕設為 active
    clusteringBtn.classList.add('active');
    clusteringSettings.style.display = 'block';

    // 監聽檔案拖放區域
    fileDropArea.addEventListener('dragover', (event) => {
        event.preventDefault();
        fileDropArea.style.borderColor = '#007bff';
        fileDropArea.style.backgroundColor = '#f0f8ff';
    });

    fileDropArea.addEventListener('dragleave', (event) => {
        fileDropArea.style.borderColor = '#ccc';
        fileDropArea.style.backgroundColor = '#fff';
    });

    fileDropArea.addEventListener('drop', (event) => {
        event.preventDefault();
        fileDropArea.style.borderColor = '#ccc';
        fileDropArea.style.backgroundColor = '#fff';

        const files = event.dataTransfer.files;

        if (files.length > 0) {
            console.log('檔案已成功拖放：', files[0].name);
            handleFile(files[0]);
        }
    });

    const targetFieldInput = document.getElementById('target-field');
    if (targetFieldInput) {
        targetFieldInput.addEventListener('change', (event) => {
            targetFieldName = event.target.value;
            console.log('目標欄位已更新為:', targetFieldName);
        });
    }
    
    function handleFile(file) {
        selectedFile = file;
        fileDropArea.innerHTML = `<p>已選擇檔案：${file.name}</p>`;
        console.log('檔案已成功選取:', file.name);

        // 讀取檔案內容並立即預覽資料
        const fileName = file.name.toLowerCase();
        
        // 讀取檔案內容並根據副檔名進行解析
        const reader = new FileReader();
        reader.onload = function(e) {
            const content = e.target.result;
            
            // 根據檔案類型選擇不同的解析方法
            if (fileName.endsWith('.json')) {
                try {
                    const parsedData = JSON.parse(content);
                    renderTablePreview(parsedData);
                } catch (error) {
                    console.error('解析 JSON 檔案失敗:', error);
                    dataPreview.innerHTML = '<p>無法預覽此檔案，請確保它是有效的 JSON 格式。</p>';
                }
            } else if (fileName.endsWith('.csv') || fileName.endsWith('.txt')) {
                // 使用 PapaParse 解析 CSV 檔案
                Papa.parse(content, {
                    header: true, // 將第一行作為欄位標題
                    dynamicTyping: true, // 自動轉換資料型態 (數字、布林值等)
                    complete: function(results) {
                        if (results.data && results.data.length > 0) {
                            renderTablePreview(results.data);
                        } else {
                            dataPreview.innerHTML = '<p>CSV 檔案無資料或解析失敗。</p>';
                        }
                    },
                    error: function(err) {
                        console.error('解析 CSV 檔案失敗:', err);
                        dataPreview.innerHTML = '<p>無法預覽此檔案，CSV 檔案格式可能有誤。</p>';
                    }
                });
            } else {
                // 處理其他檔案格式
                dataPreview.innerHTML = '<p>不支援此檔案格式，目前只支援 JSON 或 CSV 檔案。</p>';
            }
        };

        // 以文字形式讀取檔案
        reader.readAsText(file);
    }
});

// 監聽「分類」按鈕
classificationBtn.addEventListener('click', () => {
    selectedAnalysisType = 'classification';
    classificationBtn.classList.add('active');
    clusteringBtn.classList.remove('active');
    
    // 切換顯示設定
    classificationSettings.style.display = 'block';
    clusteringSettings.style.display = 'none';

    accuracyInfo.style.display = 'block';
    console.log('選擇了分類模式');
});

// 監聽「分群」按鈕
clusteringBtn.addEventListener('click', () => {
    selectedAnalysisType = 'clustering';
    clusteringBtn.classList.add('active');
    classificationBtn.classList.remove('active');

    // 切換顯示設定
    classificationSettings.style.display = 'none';
    clusteringSettings.style.display = 'block';

    accuracyInfo.style.display = 'none';
    console.log('選擇了分群模式');
});

// 監聽「執行分析」按鈕
executeBtn.addEventListener('click', async () => {
    if (!selectedFile) {
        alert('請先拖放一個檔案！');
        return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('type', selectedAnalysisType);

    if (selectedAnalysisType === 'classification') {
        // 在 FormData 中加入使用者設定的目標欄位名稱
        targetFieldName = targetFieldInput.value;
        formData.append('target_field', targetFieldName);
    } else if (selectedAnalysisType === 'clustering') {
        // 在 FormData 中加入使用者設定的集群數量
        clusterCount = clusterCountInput.value;
        formData.append('cluster_count', clusterCount);
    }

    try {
        const response = await fetch('/analyze', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error(`HTTP 錯誤! 狀態碼: ${response.status}`);
        }

        const result = await response.json();
        console.log('分析結果:', result);

        // 渲染分析結果與表格
        renderAnalysisResults(result);

    } catch (error) {
        console.error('分析失敗:', error);
        analysisResults.innerHTML = `<p>分析失敗: 不適合用這個方法!</p>`;
        accuracyInfo.style.display = 'none';
    }
});

// 【新函數】渲染資料預覽表格
function renderTablePreview(data) {
    // 檢查舊的 DataTables 實例是否存在並銷毀它，以避免重複初始化錯誤
    const existingTable = $('#my-data-table');
    if ($.fn.dataTable.isDataTable(existingTable)) {
        existingTable.DataTable().destroy();
    }

    // 如果資料是空的，則不渲染表格
    if (!data || data.length === 0) {
        dataPreview.innerHTML = '<p>檔案內容沒有可預覽的表格資料。</p>';
        return;
    }

    // 動態生成表格的 columns 設定
    const columns = Object.keys(data[0]).map(key => {

        // 排除 predicted_class 和 target_class 欄位
        if (key === 'predicted_class') {
            return null; // 返回 null 來跳過這個欄位
        }
        // 特別處理 is_train 欄位
        if (key === 'is_train') {
        return {
            title: '資料集', // 顯示中文標題
            data: key,
            render: function (data) {
            return data ? '訓練集' : '預測集'; // 根據布林值回傳中文
            }
        };
        }
        return {
        title: key,
        data: key,
        };
    }).filter(column => column !== null);

    // 在 dataPreview 容器中插入新的表格
    const tableHtml = `<table id="my-data-table" class="data-table display compact" style="width:100%"></table>`;
    dataPreview.innerHTML = tableHtml;

    // 在表格添加到 DOM 後立即初始化 DataTables
    $('#my-data-table').DataTable({
        data: data,
        columns: columns,
        responsive: true,
        pageLength: 6,
    });
}


// 【修改】渲染分析結果和圖表
function renderAnalysisResults(result) {
    const chartContainer = document.getElementById('results-chart-container');
    chartContainer.innerHTML = '<canvas id="myChart"></canvas>';

    // 確保表格容器存在且獨立
    const dataPreviewContainer = document.querySelector('.data-preview');
    if(result.analysis_type === 'classification'){
        dataPreviewContainer.innerHTML = ''; // 清空預覽區域，準備渲染新表格
    }
    
    // 【新增】顯示準確率
    if (result.analysis_type === 'classification') {
        accuracyInfo.style.display = 'block';
        accuracyInfo.innerHTML = `模型準確率：<strong>${(result.accuracy * 100).toFixed(2)}%</strong> (於測試集)`;
        renderTablePreview(result.results_table);
    } else {
        accuracyInfo.style.display = 'none';
        renderTablePreview(result.results_table);
    }
    
    // 渲染表格 (傳入後端回傳的完整表格資料)
    if(result.analysis_type === 'classification'){
        renderTablePreview(result.results_table_data);
    }
    
    // 渲染圖表
    renderChart(result);
}

// 自定義顏色集，類似 Seaborn 的 'viridis'
const colorPalette = [
    '#2980b9', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6', '#34495e', '#FDE725'
];

// 【修改】渲染圖表函式
function renderChart(result) {
    const ctx = document.getElementById('myChart').getContext('2d');
    
    // 銷毀舊的圖表實例以避免重複
    if (myChart) {
        myChart.destroy();
    }
    
    // 統一資料來源變數
    const dataForChart = result.analysis_type === 'clustering' ? result.results_table : result.results_table_data;

    // 檢查資料是否可用，如果沒有資料則直接返回
    if (!dataForChart || dataForChart.length === 0) {
        analysisResults.innerHTML = '<p>沒有可繪製圖表的資料。</p>';
        return;
    }

    // 動態取得數值型特徵
    const numericKeys = Object.keys(dataForChart[0]).filter(key => {
        // 排除分群或分類產生的額外欄位，並確保是數值型資料
        const excludedKeys = result.analysis_type === 'clustering' ? ['cluster'] : ['is_train', 'predicted_class'];
        return !excludedKeys.includes(key) && typeof dataForChart[0][key] === 'number';
    });

    if (numericKeys.length < 2) {
        analysisResults.innerHTML = '<p>資料中至少需要兩個數值欄位才能繪製散佈圖。</p>';
        return;
    }

    const xKey = numericKeys[0];
    const yKey = numericKeys[1];

    if (result.analysis_type === 'clustering') {
        // 分群模式下的圖表邏輯
        const groupedData = {};
        const centroidsData = {};

        dataForChart.forEach(row => {
            const cluster = row.cluster;
            if (!groupedData[cluster]) {
                groupedData[cluster] = [];
                centroidsData[cluster] = { xSum: 0, ySum: 0, count: 0 };
            }
            groupedData[cluster].push({ x: row[xKey], y: row[yKey] });
            centroidsData[cluster].xSum += row[xKey];
            centroidsData[cluster].ySum += row[yKey];
            centroidsData[cluster].count++;
        });

        const datasets = Object.keys(groupedData).map((cluster, index) => {
            return {
                label: `群集 ${cluster}`,
                backgroundColor: colorPalette[cluster % colorPalette.length],
                borderColor: colorPalette[cluster % colorPalette.length],
                data: groupedData[cluster],
                pointStyle: 'circle',
                radius: 5
            };
        });
        
        const centroidsDataset = {
            label: '中心點',
            backgroundColor: '#e74c3c',
            borderColor: '#e74c3c',
            data: Object.keys(centroidsData).map(cluster => {
                const centroid = centroidsData[cluster];
                return {
                    x: centroid.xSum / centroid.count,
                    y: centroid.ySum / centroid.count
                };
            }),
            pointStyle: 'crossRot',
            radius: 10,
            pointHoverRadius: 12
        };
        datasets.push(centroidsDataset);

        myChart = new Chart(ctx, {
            type: 'scatter',
            data: { datasets: datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'K-Means 分群結果散佈圖',
                        font: { size: 16 }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) { label += ': '; }
                                if (context.parsed.x !== null && context.parsed.y !== null) {
                                    label += `(${context.parsed.x.toFixed(2)}, ${context.parsed.y.toFixed(2)})`;
                                }
                                return label;
                            }
                        }
                    },
                    legend: {
                        labels: {
                            usePointStyle: true,
                            font: { size: 14 }
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'linear',
                        position: 'bottom',
                        title: {
                            display: true,
                            text: xKey,
                            font: { size: 14 }
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: yKey,
                            font: { size: 14 }
                        }
                    }
                }
            }
        });
    } else if (result.analysis_type === 'classification') {
        // 分類模式下的圖表邏輯
        const groupedData = {};
        const distinctClasses = [...new Set(dataForChart.map(row => row.predicted_class))].sort();

        dataForChart.forEach(row => {
            const predictedClass = row.predicted_class;
            if (!groupedData[predictedClass]) {
                groupedData[predictedClass] = [];
            }
            groupedData[predictedClass].push({ x: row[xKey], y: row[yKey] });
        });

        const datasets = distinctClasses.map((className, index) => {
            return {
                label: `預測類別: ${className}`,
                backgroundColor: colorPalette[index % colorPalette.length],
                borderColor: colorPalette[index % colorPalette.length],
                data: groupedData[className] || [],
                pointStyle: 'circle',
                radius: 5
            };
        });

        myChart = new Chart(ctx, {
            type: 'scatter',
            data: { datasets: datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: '決策樹分類結果散佈圖',
                        font: { size: 16 }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) { label += ': '; }
                                if (context.parsed.x !== null && context.parsed.y !== null) {
                                    label += `(${context.parsed.x.toFixed(2)}, ${context.parsed.y.toFixed(2)})`;
                                }
                                return label;
                            }
                        }
                    },
                    legend: {
                        labels: {
                            usePointStyle: true,
                            font: { size: 14 }
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'linear',
                        position: 'bottom',
                        title: {
                            display: true,
                            text: xKey,
                            font: { size: 14 }
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: yKey,
                            font: { size: 14 }
                        }
                    }
                }
            }
        });
    }
}


// ============================================
// ---------------- 筆記本功能實作 ----------------
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    // ... 保留你原有的主導覽和次導覽按鈕邏輯 ...
    const sidebarIcon = document.getElementById('notebook-icon');
    const mainNavButtons = document.querySelectorAll('.nav-btn');
    const subNavButtons = document.querySelectorAll('.sub-nav-btn');
    const classificationBtn = document.querySelectorAll('.classification-btn');
    const clusteringBtn = document.querySelectorAll('.clustering-btn');

    const notebookState = {
        'sort': false,
        'search': false,
        'clustering': false
    };

    mainNavButtons.forEach(button => {
        button.addEventListener('click', function() {
            mainNavButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            const pageId = this.getAttribute('data-page');

            document.querySelectorAll('.page-content').forEach(page => {
                page.style.display = 'none';
            });
            document.getElementById(`${pageId}-page`).style.display = 'block';

            if (!notebookState[pageId]) {
                sidebarIcon.classList.add('book-active');
            } else {
                sidebarIcon.classList.remove('book-active');
            }
        });
    });

    subNavButtons.forEach(button => {
        button.addEventListener('click', function() {
            const currentPage = document.querySelector('.nav-btn.active').getAttribute('data-page');
            if (currentPage === 'search' && !notebookState['search']) {
                sidebarIcon.classList.add('book-active');
            }
        });
    });

    classificationBtn.forEach(button => {
        button.addEventListener('click', function() {
            if (!notebookState['clustering']) {
                sidebarIcon.classList.add('book-active');
            }
        });
    });

    clusteringBtn.forEach(button => {
        button.addEventListener('click', function() {
            if (!notebookState['clustering']) {
                sidebarIcon.classList.add('book-active');
            }
        });
    });

    // 處理筆記本圖示點擊事件
    sidebarIcon.addEventListener('click', function() {
        const currentPage = document.querySelector('.nav-btn.active').getAttribute('data-page');
        if (currentPage) {
            notebookState[currentPage] = true;
        }
        sidebarIcon.classList.remove('book-active');

        let noteContent;
        if (currentPage === 'sort') {
            noteContent = document.getElementById('sort-note').innerHTML;
        } else if (currentPage === 'search') {
            noteContent = document.getElementById('search-note').innerHTML;
        } else if (currentPage === 'clustering') {
            noteContent = document.getElementById('MachineLearning-note').innerHTML;
        }

        Swal.fire({
            title: '我的演算法筆記',
            html: noteContent,
            confirmButtonText: '了解',
            background: '#fff',
            width: '90%',
            customClass: {
                popup: 'my-swal-popup-fullscreen'
            },
            // 在 SweetAlert2 彈出後執行
            didOpen: () => {
                const popup = Swal.getPopup(); // 取得彈出視窗的 DOM 元素
                if (popup) {
                    const noteNavButtons = popup.querySelectorAll('.note-navbar .nav-button');
                    
                    // 重新為彈出視窗內的按鈕添加點擊事件
                    noteNavButtons.forEach(button => {
                        button.addEventListener('click', function() {
                            // 移除所有按鈕的 active 狀態
                            noteNavButtons.forEach(btn => btn.classList.remove('active'));
                            // 將目前點擊的按鈕設為 active
                            this.classList.add('active');
                            
                            const targetId = this.getAttribute('data-target');
                            
                            // 隱藏所有筆記和圖片區塊
                            popup.querySelectorAll('.note-section').forEach(section => {
                                section.style.display = 'none';
                            });
                            popup.querySelectorAll('.image-section').forEach(section => {
                                section.style.display = 'none';
                            });
                            
                            // 顯示對應的筆記和圖片區塊
                            const textSection = popup.querySelector(`#${targetId}`);
                            const imageSection = popup.querySelector(`#${targetId}-image`);
                            if (textSection) {
                                textSection.style.display = 'block';
                            }
                            if (imageSection) {
                                imageSection.style.display = 'block';
                            }
                        });
                    });
                    
                    // 初始載入時，觸發第一個按鈕的點擊事件
                    const firstButton = noteNavButtons[0];
                    if (firstButton) {
                        firstButton.click();
                    }
                }
            }
        });
    });

    // 初始化頁面時，讓「排序」的筆記本亮起
    const sortBtn = document.querySelector('.nav-btn[data-page="sort"]');
    if (sortBtn) {
        sortBtn.click();
    }
});