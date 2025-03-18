// GameLogic.js
export const GRID_SIZE = 8; // Taille de la grille
export const CANDY_TYPES = 8; // Nombre de types de bonbons
export const CANDY_COLORS = [
  '#FF0000',  // Rouge
  '#FF8C00',  // Orange
  '#FFC107',  // Jaune
  '#008000',  // Vert
  '#0000FF',  // Bleu
  '#800080',  // Violet
  '#FF1493',  // Rose
  '#A52A2A',  // Marron
];
export const INITIAL_PROGRESS = 50;
export const PROGRESS_DECREMENT_INTERVAL = 3000;
export const FALL_DELAY = 200;
export const INACTIVITY_TIMEOUT = 3000;
export const INITIAL_ATTEMPTS = 5;

// Génère une grille initiale sans alignements
export const generateGrid = () => {
  let newGrid;
  do {
    newGrid = [];
    for (let i = 0; i < GRID_SIZE; i++) {
      const row = [];
      for (let j = 0; j < GRID_SIZE; j++) {
        row.push(Math.floor(Math.random() * CANDY_TYPES));
      }
      newGrid.push(row);
    }
  } while (checkAlignments(newGrid).length > 0);
  return newGrid;
};

// Vérifie les alignements horizontaux et verticaux
export const checkAlignments = (grid) => {
  const alignments = [];
  const visited = new Set();

  const processStreak = (streak, direction) => {
    if (streak.length >= 3) {
      streak.forEach(pos => visited.add(`${pos.row},${pos.col}`));
      alignments.push({
        cells: [...streak],
        direction
      });
    }
  };

  const checkLine = (startRow, startCol, rowDelta, colDelta, direction) => {
    let currentStreak = [];
    let currentType = null;

    for (let i = 0; i < GRID_SIZE; i++) {
      const row = startRow + i * rowDelta;
      const col = startCol + i * colDelta;

      if (grid[row][col] === currentType && grid[row][col] !== null) {
        currentStreak.push({ row, col });
      } else {
        processStreak(currentStreak, direction);
        currentStreak = [{ row, col }];
        currentType = grid[row][col];
      }
    }
    processStreak(currentStreak, direction);
  };

  for (let i = 0; i < GRID_SIZE; i++) {
    checkLine(i, 0, 0, 1, 'horizontal');
  }

  for (let j = 0; j < GRID_SIZE; j++) {
    checkLine(0, j, 1, 0, 'vertical');
  }

  return alignments;
};

// Calcul du score basé sur la longueur de l'alignement
export const calculateScore = (length, level) => {
  if (length > 2)
    switch (length) {
      case 3: return 50 * level;
      case 4: return 150 * level;
      default: return 500 * level;
    };
};

// Supprime les alignements et retourne la nouvelle grille et le score gagné
export const removeAlignments = (grid, alignments, setScore, setLevel, setProgress) => {
  let newGrid = JSON.parse(JSON.stringify(grid));
  let points = 0;

  alignments.forEach(({ cells }) => {
    const length = cells.length;
    points += calculateScore(length);

    cells.forEach(({ row, col }) => {
      if (newGrid[row][col] !== null) {
        newGrid[row][col] = null;
      }
    });
  });

  // Mise à jour du score
  setScore(prevScore => {
    const newScore = prevScore + points;

    // Calcul du niveau basé sur le score total
    const newLevel = Math.floor(newScore / 100) + 1;

    // Calcul de la progression en fonction du score actuel par rapport au niveau suivant
    const progressPercentage = (newScore / (newLevel * 100)) * 100;

    // Mise à jour du niveau et de la progression
    setLevel(newLevel);
    setProgress(progressPercentage);

    return newScore;
  });

  return { newGrid, points };
};

// Fait tomber les bonbons pour remplir les cases vides avec un délai
export const dropCandies = (grid, callback) => {
  const newGrid = JSON.parse(JSON.stringify(grid));

  let hasChanges = false;

  for (let j = 0; j < GRID_SIZE; j++) {
    let emptyRow = GRID_SIZE - 1;
    for (let i = GRID_SIZE - 1; i >= 0; i--) {
      if (newGrid[i][j] !== null) {
        if (emptyRow !== i) {
          newGrid[emptyRow][j] = newGrid[i][j];
          newGrid[i][j] = null;
          hasChanges = true;
        }
        emptyRow--;
      }
    }
  }

  if (hasChanges) {
    setTimeout(() => {
      callback(newGrid);
    }, FALL_DELAY);
  } else {
    callback(newGrid);
  }
};

// Remplit les cases vides avec de nouveaux bonbons
export const fillEmptySpaces = (grid, callback) => {
  const newGrid = JSON.parse(JSON.stringify(grid));

  for (let i = 0; i < GRID_SIZE; i++) {
    for (let j = 0; j < GRID_SIZE; j++) {
      if (newGrid[i][j] === null) {
        newGrid[i][j] = Math.floor(Math.random() * CANDY_TYPES);
      }
    }
  }

  setTimeout(() => {
    callback(newGrid);
  }, FALL_DELAY);
};

// Fonction pour trouver un coup possible
export const findPossibleMove = (grid) => {
  for (let i = GRID_SIZE - 1; i >= 0; i--) {
    for (let j = 0; j < GRID_SIZE - 1; j++) {
      const testGrid = JSON.parse(JSON.stringify(grid));
      [testGrid[i][j], testGrid[i][j + 1]] = [testGrid[i][j + 1], testGrid[i][j]];

      if (checkAlignments(testGrid).length > 0) {
        return {
          from: { row: i, col: j },
          to: { row: i, col: j + 1 },
        };
      }
    }
  }

  for (let j = 0; j < GRID_SIZE; j++) {
    for (let i = GRID_SIZE - 1; i > 0; i--) {
      const testGrid = JSON.parse(JSON.stringify(grid));
      [testGrid[i][j], testGrid[i - 1][j]] = [testGrid[i - 1][j], testGrid[i][j]];

      if (checkAlignments(testGrid).length > 0) {
        return {
          from: { row: i, col: j },
          to: { row: i - 1, col: j },
        };
      }
    }
  }

  return null;
};