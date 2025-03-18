// styles.js
import { StyleSheet, Dimensions } from 'react-native';
import { GRID_SIZE } from '../core/GameLogic';

export const styles = StyleSheet.create({
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
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
    width: "60%",
    alignSelf: "center",
  },
  restartButton: {
    backgroundColor: "green",
    padding: 10,
    borderRadius: 5,
    marginHorizontal: 10,
  },
  pauseButton: {
    backgroundColor: "#ffc107",
    padding: 10,
    borderRadius: 5,
    marginHorizontal: 10,
  },
  restartText: {
    color: 'white',
    fontSize: 18,
  },
  pauseText: {
    color: 'white',
    fontSize: 18,
  },
  hintFaded: {
    backgroundColor: 'white',
  },
});