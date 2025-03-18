// CandyCrushGame.js
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { styles } from './assets/styles';
import {
  GRID_SIZE,
  CANDY_TYPES,
  CANDY_COLORS,
  INITIAL_PROGRESS,
  PROGRESS_DECREMENT_INTERVAL,
  FALL_DELAY,
  INACTIVITY_TIMEOUT,
  INITIAL_ATTEMPTS,
  generateGrid,
  checkAlignments,
  calculateScore,
  removeAlignments,
  dropCandies,
  fillEmptySpaces,
  findPossibleMove,
} from './core/GameLogic';

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
  const [attempts, setAttempts] = useState(INITIAL_ATTEMPTS);
  const [isPaused, setIsPaused] = useState(false);
  const progressTimerRef = useRef(null);

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
          setAttempts(prevAttempts => {
            const newAttempts = prevAttempts - 1;
            if (newAttempts <= 0) {
              setIsGameOver(true);
            }
            return newAttempts;
          });

          setTimeout(() => {
            setGrid(grid);
          }, 300);
        }
      }
      setSelectedCell(null);
    }
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

      const { newGrid, points } = removeAlignments(currentGrid, alignments, setScore, setLevel, setProgress);
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

  // Gère le timer d'inactivité
  const resetInactivityTimer = () => {
    setLastInteraction(Date.now());

    if (inactivityTimer) {
      clearTimeout(inactivityTimer);
    }

    const timer = setTimeout(() => {
      if (!isGameOver && !isAnimating && !hintCells) {
        const move = findPossibleMove(grid);
        if (move) {
          setHintCells(move);
        }
      }
    }, INACTIVITY_TIMEOUT);

    setInactivityTimer(timer);
  };

  // Timer et décrémentation de la progression
  useEffect(() => {
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }

    if (!isPaused && !isGameOver) {
      progressTimerRef.current = setInterval(() => {
        setProgress((prevProgress) => {
          if (prevProgress <= 0) {
            clearInterval(progressTimerRef.current);
            progressTimerRef.current = null;
            setIsGameOver(true);
            return 0;
          }
          return prevProgress - level;
        });
      }, PROGRESS_DECREMENT_INTERVAL);
    }

    return () => {
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }
    };
  }, [isPaused, isGameOver, level]);

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
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [hintCells]);

  // Redémarrage du jeu
  const restartGame = () => {
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }

    setGrid(generateGrid());
    setScore(0);
    setProgress(INITIAL_PROGRESS);
    setLevel(1);
    setIsGameOver(false);
    setSelectedCell(null);
    setHintCells(null);
    setAttempts(INITIAL_ATTEMPTS);
    setIsPaused(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.statusContainer}>
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: `${progress}%` }]} />
          <Text style={styles.progressText}>{progress.toFixed(2)}%</Text>
        </View>

        <View style={styles.scoreContainer}>
          <View style={styles.progressBar}>
            <Text style={styles.scoreText}>{score}</Text>
          </View>
        </View>

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
                  { backgroundColor: CANDY_COLORS[candy], opacity: isPaused ? 0 : 1 },
                  selectedCell && selectedCell.row === i && selectedCell.col === j && styles.selected,
                  hintCells && (
                    (hintCells.from.row === i && hintCells.from.col === j) ||
                    (hintCells.to.row === i && hintCells.to.col === j)
                  ) && [styles.hint, !isHintVisible && styles.hintFaded],
                ]}
                onPress={() => handleCellClick(i, j)}
                disabled={isAnimating || isGameOver || isPaused}
              />
            ))}
          </View>
        ))}
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.restartButton} onPress={restartGame}>
          <Text style={styles.restartText}>Restart</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.pauseButton}
          onPress={() => {
            setIsPaused((prev) => !prev);
          }}
        >
          <Text style={styles.pauseText}>{isPaused ? 'Resume' : 'Pause'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default CandyCrushGame;