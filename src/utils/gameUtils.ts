import { GRID_WIDTH, GRID_HEIGHT } from '../constants';
import { Obstacle } from '../data/levels';

// Get a random position on the grid (avoiding obstacles and snake)
export const getRandomPosition = (
  obstacles: Obstacle[] = [], 
  snake: {x: number, y: number}[] = []
): { x: number; y: number } => {
  // Track available positions to ensure we find one
  const availablePositions: {x: number, y: number}[] = [];
  
  // First, build a list of all valid positions
  for (let x = 0; x < GRID_WIDTH; x++) {
    for (let y = 0; y < GRID_HEIGHT; y++) {
      // Check if position is valid (not on obstacle or snake)
      const onObstacle = obstacles.some(
        obstacle => obstacle.x === x && obstacle.y === y
      );
      
      const onSnake = snake.some(
        segment => segment.x === x && segment.y === y
      );
      
      // If position is valid, add it to available positions
      if (!onObstacle && !onSnake) {
        availablePositions.push({ x, y });
      }
    }
  }
  
  // If we have available positions, pick one randomly
  if (availablePositions.length > 0) {
    const randomIndex = Math.floor(Math.random() * availablePositions.length);
    return availablePositions[randomIndex];
  }
  
  // Emergency fallback - this should never happen if the game is designed correctly
  // but we provide a valid position just in case
  // Find first empty spot starting from top-left
  for (let x = 0; x < GRID_WIDTH; x++) {
    for (let y = 0; y < GRID_HEIGHT; y++) {
      const onObstacle = obstacles.some(
        obstacle => obstacle.x === x && obstacle.y === y
      );
      
      const onSnake = snake.some(
        segment => segment.x === x && segment.y === y
      );
      
      if (!onObstacle && !onSnake) {
        console.log("Found emergency food position at", x, y);
        return { x, y };
      }
    }
  }
  
  // Absolute last resort - should never reach here
  // Create coordinates in a safe area at the center of the board
  const safeX = Math.floor(GRID_WIDTH / 2);
  const safeY = Math.floor(GRID_HEIGHT / 2);
  console.warn("ERROR: Could not find any valid food position! Using fallback position.");
  return { x: safeX, y: safeY };
};

// Helper function to calculate points when food is eaten
export const calculatePointsForFood = (
  food: { x: number; y: number; color: string },
  snakeLength: number
): number => {
  // For simplicity, each food gives 10 points.
  return 10;
}; 