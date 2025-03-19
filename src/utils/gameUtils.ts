import { GRID_WIDTH, GRID_HEIGHT } from '../constants';
import { Obstacle } from '../data/levels';

// Get a random position on the grid (avoiding obstacles and snake)
export const getRandomPosition = (
  obstacles: Obstacle[] = [], 
  snake: {x: number, y: number}[] = []
): { x: number; y: number } => {
  // Validate grid boundaries
  if (GRID_WIDTH <= 0 || GRID_HEIGHT <= 0) {
    console.error("Invalid grid dimensions:", GRID_WIDTH, GRID_HEIGHT);
    return { x: 1, y: 1 }; // Safe fallback
  }

  // Track available positions to ensure we find one
  const availablePositions: {x: number, y: number}[] = [];
  
  // First, build a list of all valid positions
  for (let x = 0; x < GRID_WIDTH; x++) {
    for (let y = 0; y < GRID_HEIGHT; y++) {
      // Ensure position is within valid bounds
      if (x < 0 || x >= GRID_WIDTH || y < 0 || y >= GRID_HEIGHT) {
        continue;
      }

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
  
  // Log available positions for debugging
  console.log(`Found ${availablePositions.length} available positions for food`);
  
  // If we have available positions, pick one randomly
  if (availablePositions.length > 0) {
    const randomIndex = Math.floor(Math.random() * availablePositions.length);
    const position = availablePositions[randomIndex];
    console.log("Spawning food at:", position.x, position.y);
    return position;
  }
  
  // Emergency fallback - find first valid position
  console.warn("No random position found, using fallback search");
  for (let x = 1; x < GRID_WIDTH - 1; x++) {
    for (let y = 1; y < GRID_HEIGHT - 1; y++) {
      const onObstacle = obstacles.some(
        obstacle => obstacle.x === x && obstacle.y === y
      );
      
      const onSnake = snake.some(
        segment => segment.x === x && segment.y === y
      );
      
      if (!onObstacle && !onSnake) {
        console.log("Using fallback food position at:", x, y);
        return { x, y };
      }
    }
  }
  
  // Absolute last resort - find a guaranteed safe spot
  console.error("CRITICAL: Could not find any valid food position!");
  // Try the center area first
  const centerX = Math.floor(GRID_WIDTH / 2);
  const centerY = Math.floor(GRID_HEIGHT / 2);
  
  // Spiral out from center until we find a valid position
  for (let radius = 1; radius < Math.max(GRID_WIDTH, GRID_HEIGHT); radius++) {
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dy = -radius; dy <= radius; dy++) {
        const x = centerX + dx;
        const y = centerY + dy;
        
        // Validate position
        if (x < 0 || x >= GRID_WIDTH || y < 0 || y >= GRID_HEIGHT) {
          continue;
        }
        
        const onObstacle = obstacles.some(
          obstacle => obstacle.x === x && obstacle.y === y
        );
        
        const onSnake = snake.some(
          segment => segment.x === x && segment.y === y
        );
        
        if (!onObstacle && !onSnake) {
          console.log("Using emergency center-spiral food position at:", x, y);
          return { x, y };
        }
      }
    }
  }
  
  // If all else fails, return a position that's guaranteed to be in bounds
  return { x: 1, y: 1 };
};

// Helper function to calculate points when food is eaten
export const calculatePointsForFood = (
  food: { x: number; y: number; color: string },
  snakeLength: number
): number => {
  // For simplicity, each food gives 10 points.
  return 10;
}; 