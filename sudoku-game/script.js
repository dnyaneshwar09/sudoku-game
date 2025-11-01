const SIZE = 9;
const boardEl = document.getElementById('board');
const mistakeEl = document.getElementById('mistakes');
const timerEl = document.getElementById('timer');
const difficultyEl = document.getElementById('difficulty');

let solution = [];
let puzzle = [];
let timerInterval = null;
let startTime = null;
let mistakes = 0;

const rand = a => Math.floor(Math.random() * a);
const copyGrid = g => g.map(r => r.slice());

function canPlace(grid, r, c, n) {
  for (let i = 0; i < 9; i++) if (grid[r][i] === n || grid[i][c] === n) return false;
  const br = Math.floor(r / 3) * 3, bc = Math.floor(c / 3) * 3;
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) if (grid[br + i][bc + j] === n) return false;
  return true;
}

function fillGrid(grid) {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (grid[r][c] === 0) {
        let nums = [1,2,3,4,5,6,7,8,9].sort(() => Math.random() - 0.5);
        for (let n of nums) {
          if (canPlace(grid, r, c, n)) {
            grid[r][c] = n;
            if (fillGrid(grid)) return true;
            grid[r][c] = 0;
          }
        }
        return false;
      }
    }
  }
  return true;
}

function generateSolved() {
  let g = Array.from({ length: 9 }, () => Array(9).fill(0));
  fillGrid(g);
  return g;
}

function makePuzzle(sol, holes) {
  let p = copyGrid(sol);
  let attempts = holes;
  while (attempts > 0) {
    let r = rand(9), c = rand(9);
    if (p[r][c] !== 0) { p[r][c] = 0; attempts--; }
  }
  return p;
}

function buildBoard() {
  boardEl.innerHTML = '';
  for (let r = 0; r < 9; r++) {
    const tr = document.createElement('tr');
    for (let c = 0; c < 9; c++) {
      const td = document.createElement('td');
      if (c % 3 === 2) td.classList.add('thick-right');
      if (r % 3 === 2) td.classList.add('thick-bottom');
      td.classList.add('cell');
      const inp = document.createElement('input');
      inp.type = 'text';
      inp.maxLength = 1;
      inp.dataset.r = r;
      inp.dataset.c = c;
      inp.autocomplete = 'off';
      inp.addEventListener('input', onInput);
      inp.addEventListener('keydown', onKeyDown);
      td.appendChild(inp);
      tr.appendChild(td);
    }
    boardEl.appendChild(tr);
  }
}

function render() {
  for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) {
    const inp = boardEl.rows[r].cells[c].firstChild;
    inp.classList.remove('fixed', 'conflict', 'correct-line');
    if (puzzle[r][c] !== 0) {
      inp.value = puzzle[r][c];
      inp.disabled = true;
      inp.classList.add('fixed');
    } else {
      inp.value = '';
      inp.disabled = false;
    }
  }
}

function getCurrentGrid() {
  return Array.from({ length: 9 }, (_, r) =>
    Array.from({ length: 9 }, (_, c) => {
      const v = boardEl.rows[r].cells[c].firstChild.value;
      return v === '' ? 0 : +v;
    })
  );
}

function onInput(e) {
  const inp = e.target;
  const r = +inp.dataset.r, c = +inp.dataset.c;
  const val = inp.value;
  if (!/^[1-9]$/.test(val)) { inp.value = ''; removeConflictIfAny(inp); removeLineHighlightIfBroken(r, c); return; }

  const v = +val;
  const wasWrong = inp.classList.contains('conflict');

  if (solution[r][c] === v) {
    inp.classList.remove('conflict');
    if (wasWrong) { mistakes = Math.max(0, mistakes - 1); updateMistakes(); }
    checkFullRowCol(r, c);
    if (isSolved()) finish(true);
  } else {
    if (!wasWrong) { mistakes++; updateMistakes(); }
    inp.classList.add('conflict');
    removeLineHighlightIfBroken(r, c);
  }
}

function removeConflictIfAny(inp) {
  if (inp.classList.contains('conflict')) {
    inp.classList.remove('conflict');
    mistakes = Math.max(0, mistakes - 1);
    updateMistakes();
  }
}

function onKeyDown(e) {
  if (e.key === 'Backspace' || e.key === 'Delete') {
    const inp = e.target;
    if (inp.classList.contains('conflict')) {
      inp.classList.remove('conflict');
      mistakes = Math.max(0, mistakes - 1);
      updateMistakes();
    }
    setTimeout(() => {
      const r = +inp.dataset.r, c = +inp.dataset.c;
      removeLineHighlightIfBroken(r, c);
    }, 0);
  }
}

function updateMistakes() { mistakeEl.textContent = mistakes; }

function checkFullRowCol(r, c) {
  let rowOk = true;
  for (let j = 0; j < 9; j++) {
    const val = +boardEl.rows[r].cells[j].firstChild.value;
    if (val !== solution[r][j]) { rowOk = false; break; }
  }
  if (rowOk) for (let j = 0; j < 9; j++) boardEl.rows[r].cells[j].firstChild.classList.add('correct-line');

  let colOk = true;
  for (let i = 0; i < 9; i++) {
    const val = +boardEl.rows[i].cells[c].firstChild.value;
    if (val !== solution[i][c]) { colOk = false; break; }
  }
  if (colOk) for (let i = 0; i < 9; i++) boardEl.rows[i].cells[c].firstChild.classList.add('correct-line');
}

function removeLineHighlightIfBroken(r, c) {
  let rowOk = true;
  for (let j = 0; j < 9; j++) {
    const val = +boardEl.rows[r].cells[j].firstChild.value;
    if (val !== solution[r][j]) { rowOk = false; break; }
  }
  if (!rowOk) for (let j = 0; j < 9; j++) boardEl.rows[r].cells[j].firstChild.classList.remove('correct-line');

  let colOk = true;
  for (let i = 0; i < 9; i++) {
    const val = +boardEl.rows[i].cells[c].firstChild.value;
    if (val !== solution[i][c]) { colOk = false; break; }
  }
  if (!colOk) for (let i = 0; i < 9; i++) boardEl.rows[i].cells[c].firstChild.classList.remove('correct-line');
}

function hint() {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const inp = boardEl.rows[r].cells[c].firstChild;
      if (inp.disabled) continue;
      const cur = inp.value === '' ? 0 : +inp.value;
      if (cur === 0 || cur !== solution[r][c]) {
        if (inp.classList.contains('conflict')) { mistakes = Math.max(0, mistakes - 1); updateMistakes(); }
        inp.value = solution[r][c];
        inp.classList.remove('conflict');
        inp.disabled = true;
        checkFullRowCol(r, c);
        return;
      }
    }
  }
  alert('No hints available — board looks correct or full!');
}

function checkBoard() {
  let anyWrong = false;
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const inp = boardEl.rows[r].cells[c].firstChild;
      if (inp.disabled) continue;
      const cur = inp.value === '' ? 0 : +inp.value;
      if (cur === 0 || cur !== solution[r][c]) {
        if (!inp.classList.contains('conflict')) { inp.classList.add('conflict'); mistakes++; updateMistakes(); }
        anyWrong = true;
        removeLineHighlightIfBroken(r, c);
      } else if (inp.classList.contains('conflict')) {
        inp.classList.remove('conflict');
        mistakes = Math.max(0, mistakes - 1);
        updateMistakes();
      }
    }
  }
  if (!anyWrong) {
    if (isSolved()) finish(true);
    else alert('No conflicts found — but board not fully filled.');
  } else alert('Some cells are incorrect — highlighted in red.');
}

function solve() {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const inp = boardEl.rows[r].cells[c].firstChild;
      inp.value = solution[r][c];
      inp.disabled = true;
      inp.classList.remove('conflict');
      inp.classList.add('correct-line');
    }
  }
  mistakes = 0; updateMistakes();
  finish(true);
}

function clearBoard() { newGame(); }

function startTimer() {
  clearInterval(timerInterval);
  startTime = Date.now();
  timerInterval = setInterval(() => {
    const s = Math.floor((Date.now() - startTime) / 1000);
    timerEl.innerText = String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
  }, 250);
}

function stopTimer() { clearInterval(timerInterval); timerInterval = null; }

function isSolved() {
  const cur = getCurrentGrid();
  for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) if (cur[r][c] !== solution[r][c]) return false;
  return true;
}

function finish(success) {
  stopTimer();
  if (success) setTimeout(() => alert(`🎉 Great! Puzzle solved! Time: ${timerEl.innerText} | Mistakes: ${mistakes}`), 150);
}

function newGame() {
  mistakes = 0; updateMistakes();
  timerEl.innerText = '00:00';
  solution = generateSolved();
  const holes = parseInt(difficultyEl.value, 10);
  puzzle = makePuzzle(solution, holes);
  buildBoard();
  render();
  startTimer();
}

document.getElementById('newBtn').addEventListener('click', newGame);
document.getElementById('hintBtn').addEventListener('click', hint);
document.getElementById('checkBtn').addEventListener('click', checkBoard);
document.getElementById('solveBtn').addEventListener('click', solve);
document.getElementById('clearBtn').addEventListener('click', clearBoard);

newGame();
