import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';

const GRID_SIZE = 8; // Taille de la grille
const CANDY_TYPES = 5; // Nombre de types de bonbons
const CANDY_COLORS = ['red', 'green', 'blue', 'yellow', 'purple']; // Couleurs
const INITIAL_PROGRESS = 50; // Barre à 50% au début
const PROGRESS_DECREMENT_INTERVAL = 3000; // 3 secondes
const FALL_DELAY = 200; // Délai de chute
const INACTIVITY_TIMEOUT = 3000; // 3 secondes d'inactivité
const HINT_DURATION = 2000; // Durée d'affichage du hint
const INITIAL_ATTEMPTS = 5; // Nombre d'essais initial

const CandyCrushGame = () => {
  const [grid, setGrid] = useState(generateGrid());
  const [score, setScore] = useState(0);
  const [progress, setProgress] = useState(INITIAL_PROGRESS);
  const [level, setLevel] = useState(1);
  const [isGameOver, setIsGameOver] = useState(false);
  const [selectedCell, setSelectedCell] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [hintCells, setHintCells] = useState(null);
  const [lastInteraction, setLastInteraction] = useState(Date.now());
  const [inactivityTimer, setInactivityTimer] = useState(null);
  const [isHintVisible, setIsHintVisible] = useState(true);
  const [attempts, setAttempts] = useState(INITIAL_ATTEMPTS); // Nouveau state pour les essais

  // Génère une grille initiale sans alignements
  function generateGrid() {
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
  }

  // Vérifie les alignements horizontaux et verticaux
  function checkAlignments(grid) {
    const alignments = [];
    const visited = new Set(); // Pour éviter de compter deux fois les mêmes cases

    // Vérifie les alignements horizontaux
    for (let i = 0; i < GRID_SIZE; i++) {
      let currentStreak = [];
      let currentType = null;

      for (let j = 0; j < GRID_SIZE; j++) {
        const key = `${i},${j}`;
        if (grid[i][j] === currentType && grid[i][j] !== null) {
          currentStreak.push({ row: i, col: j });
        } else {
          if (currentStreak.length >= 3) {
            currentStreak.forEach(pos => visited.add(`${pos.row},${pos.col}`));
            alignments.push({
              cells: [...currentStreak],
              direction: 'horizontal'
            });
          }
          currentStreak = [{ row: i, col: j }];
          currentType = grid[i][j];
        }
      }
      // Vérifier la dernière séquence de la ligne
      if (currentStreak.length >= 3) {
        currentStreak.forEach(pos => visited.add(`${pos.row},${pos.col}`));
        alignments.push({
          cells: [...currentStreak],
          direction: 'horizontal'
        });
      }
    }

    // Vérifie les alignements verticaux
    for (let j = 0; j < GRID_SIZE; j++) {
      let currentStreak = [];
      let currentType = null;

      for (let i = 0; i < GRID_SIZE; i++) {
        const key = `${i},${j}`;
        if (grid[i][j] === currentType && grid[i][j] !== null) {
          currentStreak.push({ row: i, col: j });
        } else {
          if (currentStreak.length >= 3) {
            currentStreak.forEach(pos => visited.add(`${pos.row},${pos.col}`));
            alignments.push({
              cells: [...currentStreak],
              direction: 'vertical'
            });
          }
          currentStreak = [{ row: i, col: j }];
          currentType = grid[i][j];
        }
      }
      // Vérifier la dernière séquence de la colonne
      if (currentStreak.length >= 3) {
        currentStreak.forEach(pos => visited.add(`${pos.row},${pos.col}`));
        alignments.push({
          cells: [...currentStreak],
          direction: 'vertical'
        });
      }
    }

    return alignments;
  }

  // Calcul du score basé sur la longueur de l'alignement
  const calculateScore = (length) => {
    switch (length) {
      case 3: return 50 * level;
      case 4: return 150 * level;
      default: return 500 * level;
    }
  };

  // Supprime les alignements et retourne la nouvelle grille et le score gagné
  function removeAlignments(grid, alignments) {
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
      
      // Si le niveau a changé, mettre à jour le niveau et la progression
      if (newLevel !== level) {
        const progressPercentage = (newScore % 100);
        setProgress(progressPercentage);
        setLevel(newLevel);
      } else {
        // Sinon, ajouter simplement à la progression actuelle
        setProgress(prevProgress => {
          const newProgress = Math.min(prevProgress + (points % 100), 100);
          return newProgress;
        });
      }
      
      return newScore;
    });

    return { newGrid, points };
  }

  // Fait tomber les bonbons pour remplir les cases vides avec un délai
  const dropCandies = (grid, callback) => {
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
        setGrid(newGrid);
        callback(newGrid);
      }, FALL_DELAY);
    } else {
      callback(newGrid);
    }
  };

  // Remplit les cases vides avec de nouveaux bonbons
  const fillEmptySpaces = (grid, callback) => {
    const newGrid = JSON.parse(JSON.stringify(grid));

    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        if (newGrid[i][j] === null) {
          newGrid[i][j] = Math.floor(Math.random() * CANDY_TYPES);
        }
      }
    }

    setTimeout(() => {
      setGrid(newGrid);
      callback(newGrid);
    }, FALL_DELAY);
  };

  // Vérifie les alignements et met à jour la grille, le score reset le timer avant hint
  const handleAlignments = (grid) => {
    let currentGrid = JSON.parse(JSON.stringify(grid));
    let totalPoints = 0;

    const processAlignments = () => {
      const alignments = checkAlignments(currentGrid);
      if (alignments.length === 0) {
        setIsAnimating(false);
        return;
      }

      const { newGrid, points } = removeAlignments(currentGrid, alignments);
      totalPoints += points;

      dropCandies(newGrid, (droppedGrid) => {
        fillEmptySpaces(droppedGrid, (filledGrid) => {
          currentGrid = filledGrid;
          processAlignments();
        });
      });
    };

    setIsAnimating(true);
    processAlignments();
  };

  // Gère le clic sur une case
  const handleCellClick = (row, col) => {
    if (isAnimating || isGameOver) return;
    resetInactivityTimer();
    
    if (selectedCell === null) {
      setSelectedCell({ row, col });
    } else if (selectedCell.row === row && selectedCell.col === col) {
      setSelectedCell(null);
    } else {
      const { row: selectedRow, col: selectedCol } = selectedCell;
      if (
        (Math.abs(row - selectedRow) === 1 && col === selectedCol) ||
        (Math.abs(col - selectedCol) === 1 && row === selectedRow)
      ) {
        const newGrid = JSON.parse(JSON.stringify(grid));
        const temp = newGrid[row][col];
        newGrid[row][col] = newGrid[selectedRow][selectedCol];
        newGrid[selectedRow][selectedCol] = temp;

        const alignments = checkAlignments(newGrid);
        if (alignments.length > 0) {
          setGrid(newGrid);
          setHintCells(null);
          handleAlignments(newGrid);
        } else {
          // Décrémenter le nombre d'essais pour une mauvaise permutation
          setAttempts(prevAttempts => {
            const newAttempts = prevAttempts - 1;
            if (newAttempts <= 0) {
              setIsGameOver(true);
            }
            return newAttempts;
          });
          
          // Animation de retour à la position initiale
          setTimeout(() => {
            setGrid(grid);
          }, 300);
        }
      }
      setSelectedCell(null);
    }
  };

  // Fonction pour trouver un coup possible
  const findPossibleMove = () => {
    // Test horizontal
    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE - 1; j++) {
        const testGrid = JSON.parse(JSON.stringify(grid));
        [testGrid[i][j], testGrid[i][j + 1]] = [testGrid[i][j + 1], testGrid[i][j]];

        if (checkAlignments(testGrid).length > 0) {
          return {
            from: { row: i, col: j },
            to: { row: i, col: j + 1 }
          };
        }
      }
    }

    // Test vertical
    for (let i = 0; i < GRID_SIZE - 1; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        const testGrid = JSON.parse(JSON.stringify(grid));
        [testGrid[i][j], testGrid[i + 1][j]] = [testGrid[i + 1][j], testGrid[i][j]];

        if (checkAlignments(testGrid).length > 0) {
          return {
            from: { row: i, col: j },
            to: { row: i + 1, col: j }
          };
        }
      }
    }
    return null;
  };

  // Gère le timer d'inactivité
  const resetInactivityTimer = () => {
    setLastInteraction(Date.now());

    if (inactivityTimer) {
      clearTimeout(inactivityTimer);
    }

    const timer = setTimeout(() => {
      if (!isGameOver && !isAnimating && !hintCells) {
        const move = findPossibleMove();
        if (move) {
          setHintCells(move);
        }
      }
    }, INACTIVITY_TIMEOUT);

    setInactivityTimer(timer);
  };

  // Timer et décrémentation de la progression
  useEffect(() => {
    const progressTimer = setInterval(() => {
      setProgress(prevProgress => {
        const newProgress = prevProgress - level;
        if (newProgress <= 0) {
          setIsGameOver(true);
          clearInterval(progressTimer);
          return 0;
        }
        return newProgress;
      });
    }, PROGRESS_DECREMENT_INTERVAL);

    return () => clearInterval(progressTimer);
  }, [level]);

  // Initialisation du timer d'inactivité
  useEffect(() => {
    resetInactivityTimer();
  }, [grid, isGameOver, isAnimating]);

  // Nettoyage du timer lors du démontage du composant
  useEffect(() => {
    return () => {
      if (inactivityTimer) {
        clearTimeout(inactivityTimer);
      }
    };
  }, []);

  // Animation du hint
  useEffect(() => {
    if (hintCells) {
      const interval = setInterval(() => {
        setIsHintVisible(prev => !prev);
      }, 600); // Vitesse de clignotement
      return () => clearInterval(interval);
    }
  }, [hintCells]);

  // Redémarrage du jeu
  const restartGame = () => {
    setGrid(generateGrid());
    setScore(0);
    setProgress(INITIAL_PROGRESS);
    setLevel(1);
    setIsGameOver(false);
    setSelectedCell(null);
    setHintCells(null);
    setAttempts(INITIAL_ATTEMPTS); // Réinitialiser les essais
  };

  return (
    <View style={styles.container}>
      <View style={styles.statusContainer}>
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: `${progress}%` }]} />
          <Text style={styles.progressText}>Level {level}</Text>
        </View>

        <View style={styles.scoreContainer}>
          <View style={styles.progressBar}>
            <Text style={styles.scoreText}>{score}</Text>
          </View>
        </View>
        
        {/* Affichage des essais restants */}
        <View style={styles.attemptsContainer}>
          <Text style={styles.attemptsText}>Attempts: {attempts}</Text>
        </View>
      </View>

      {isGameOver && <Text style={styles.gameOver}>Game Over!</Text>}

      <View style={styles.grid}>
        {grid.map((row, i) => (
          <View key={i} style={styles.row}>
            {row.map((candy, j) => (
              <TouchableOpacity
                key={`${i}-${j}`}
                style={[
                  styles.candy,
                  { backgroundColor: CANDY_COLORS[candy] },
                  selectedCell && selectedCell.row === i && selectedCell.col === j && styles.selected,
                  hintCells && (
                    (hintCells.from.row === i && hintCells.from.col === j) ||
                    (hintCells.to.row === i && hintCells.to.col === j)
                  ) && [styles.hint, !isHintVisible && styles.hintFaded]
                ]}
                onPress={() => handleCellClick(i, j)}
                disabled={isAnimating || isGameOver}
              />
            ))}
          </View>
        ))}
      </View>

      {isGameOver && (
        <TouchableOpacity style={styles.restartButton} onPress={restartGame}>
          <Text style={styles.restartText}>Restart</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  statusContainer: {
    width: '90%',
    marginBottom: 20,
  },
  progressBarContainer: {
    height: 30,
    backgroundColor: '#ddd',
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 15,
  },
  progressText: {
    position: 'absolute',
    width: '100%',
    textAlign: 'center',
    lineHeight: 30,
    color: '#fff',
    fontWeight: 'bold',
  },
  scoreContainer: {
    height: 30,
    backgroundColor: '#ddd',
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 10,
  },
  scoreText: {
    textAlign: 'center',
    lineHeight: 30,
    color: '#fff',
    fontWeight: 'bold',
  },
  attemptsContainer: {
    height: 30,
    backgroundColor: '#ddd',
    borderRadius: 15,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  attemptsText: {
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#333',
  },
  gameOver: {
    fontSize: 30,
    fontWeight: 'bold',
    color: 'red',
    marginBottom: 20,
  },
  grid: {
    borderWidth: 1,
    borderColor: '#ccc',
  },
  row: {
    flexDirection: 'row',
  },
  candy: {
    width: Dimensions.get('window').width / GRID_SIZE - 10,
    height: Dimensions.get('window').width / GRID_SIZE - 10,
    margin: 2,
    borderRadius: 8,
  },
  selected: {
    borderWidth: 3,
    borderColor: 'black',
  },
  restartButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#4CAF50',
    borderRadius: 5,
  },
  restartText: {
    color: 'white',
    fontSize: 18,
  },
  hint: {
    borderWidth: 4,
    borderColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
    elevation: 8,
  },
  hintFaded: {
    borderColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
  }
});

export default CandyCrushGame;