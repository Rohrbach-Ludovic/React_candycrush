import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';

const GRID_SIZE = 8; // Taille de la grille
const CANDY_TYPES = 5; // Nombre de types de bonbons
const CANDY_COLORS = ['red', 'green', 'blue', 'yellow', 'purple']; // Couleurs
const TIME_LIMIT = 60; // Timer initial
const TIME_BONUS = 10; // Bonus de temps si alignement
const FALL_DELAY = 200; // Délai de chute

const CandyCrushGame = () => {
  const [grid, setGrid] = useState(generateGrid());
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [isGameOver, setIsGameOver] = useState(false);
  const [selectedCell, setSelectedCell] = useState(null); 
  const [isAnimating, setIsAnimating] = useState(false); 

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

  // Détecte les alignements horizontaux et verticaux
  function checkAlignments(grid) {
    const alignments = [];

    // Vérifie les alignements horizontaux
    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE - 2; j++) {
        if (
          grid[i][j] !== null &&
          grid[i][j] === grid[i][j + 1] &&
          grid[i][j] === grid[i][j + 2]
        ) {
          alignments.push({ row: i, col: j, direction: 'horizontal' });
        }
      }
    }

    // Vérifie les alignements verticaux
    for (let j = 0; j < GRID_SIZE; j++) {
      for (let i = 0; i < GRID_SIZE - 2; i++) {
        if (
          grid[i][j] !== null &&
          grid[i][j] === grid[i + 1][j] &&
          grid[i][j] === grid[i + 2][j]
        ) {
          alignments.push({ row: i, col: j, direction: 'vertical' });
        }
      }
    }

    return alignments;
  }

  // Supprime les alignements et retourne la nouvelle grille et le score gagné
  function removeAlignments(grid, alignments) {
    let newGrid = JSON.parse(JSON.stringify(grid));
    let points = 0;

    alignments.forEach(({ row, col, direction }) => {
      if (direction === 'horizontal') {
        for (let k = 0; k < 3; k++) {
          if (newGrid[row][col + k] !== null) {
            newGrid[row][col + k] = null;
            points += 10;
          }
        }
      } else if (direction === 'vertical') {
        for (let k = 0; k < 3; k++) {
          if (newGrid[row + k][col] !== null) {
            newGrid[row + k][col] = null;
            points += 10;
          }
        }
      }
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
      // Met à jour la grille avec un délai pour l'animation
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

    // Met à jour la grille avec un délai pour l'animation
    setTimeout(() => {
      setGrid(newGrid);
      callback(newGrid);
    }, FALL_DELAY);
  };

  // Vérifie les alignements et met à jour la grille, le score et le timer
  const handleAlignments = (grid) => {
    let currentGrid = JSON.parse(JSON.stringify(grid));
    let totalPoints = 0;

    const processAlignments = () => {
      const alignments = checkAlignments(currentGrid);
      if (alignments.length === 0) {
        setIsAnimating(false); // Fin de l'animation
        return;
      }

      const { newGrid, points } = removeAlignments(currentGrid, alignments);
      totalPoints += points;
      setScore((prevScore) => prevScore + points);
      setTimeLeft((prevTime) => prevTime + TIME_BONUS);

      // Fait tomber les bonbons et remplit les cases vides
      dropCandies(newGrid, (droppedGrid) => {
        fillEmptySpaces(droppedGrid, (filledGrid) => {
          currentGrid = filledGrid;
          processAlignments(); // Vérifie à nouveau les alignements
        });
      });
    };

    setIsAnimating(true); 
    processAlignments();
  };

  // Gère le clic sur une case
  const handleCellClick = (row, col) => {
    if (isAnimating) return; 

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

        // Vérifier les alignements après l'échange
        const alignments = checkAlignments(newGrid);
        if (alignments.length > 0) {
          setGrid(newGrid);
          handleAlignments(newGrid);
        } else {
         
          setGrid(grid);
        }
      }
      setSelectedCell(null);
    }
  };

  // Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime === 0) {
          clearInterval(timer);
          setIsGameOver(true);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Redémarre le jeu
  const restartGame = () => {
    setGrid(generateGrid());
    setScore(0);
    setTimeLeft(TIME_LIMIT);
    setIsGameOver(false);
    setSelectedCell(null);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.score}>Score: {score}</Text>
      <Text style={styles.timer}>Time Left: {timeLeft}</Text>
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
                ]}
                onPress={() => handleCellClick(i, j)}
                disabled={isAnimating} // Désactive les interactions pendant l'animation
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
  score: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  timer: {
    fontSize: 20,
    marginBottom: 20,
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
    backgroundColor: 'blue',
    borderRadius: 5,
  },
  restartText: {
    color: 'white',
    fontSize: 18,
  },
});

export default CandyCrushGame;