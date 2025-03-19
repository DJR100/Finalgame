import { GRID_WIDTH, GRID_HEIGHT, BASE_SPEED } from '../constants';

// Type definitions
export interface LevelConfig {
  id: number;
  name: string;
  requiredFood: number;
  description: string;
  generateObstacles: () => Obstacle[];
  getSpeed: () => number; // Returns speed in milliseconds (lower = faster)
}

export type Obstacle = {
  x: number;
  y: number;
};

// Helper function to add a 2x2 block at specified position
export const addBlockAtPosition = (obstacles: Obstacle[], startX: number, startY: number) => {
  // Ensure coordinates are within boundaries
  if (startX < 0 || startX >= GRID_WIDTH - 1 || startY < 0 || startY >= GRID_HEIGHT - 1) {
    return; // Skip if outside grid
  }
  
  // Add a 2x2 block of obstacles
  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 2; j++) {
      obstacles.push({
        x: startX + i,
        y: startY + j,
      });
    }
  }
};

// Define each level individually
const levels: LevelConfig[] = [
  // Level 1: Training Grounds (No obstacles, need 3 food)
  {
    id: 1,
    name: "Training Grounds",
    requiredFood: 3,
    description: "Get used to the controls. Collect 3 fruit to advance.",
    generateObstacles: () => {
      return []; // No obstacles
    },
    getSpeed: () => BASE_SPEED - 10// Standard speed (200ms)
  },
  
  // Level 2: First Blocks (A few obstacles, need 4 food)
  {
    id: 2,
    name: "First Blocks",
    requiredFood: 4,
    description: "Watch out for blocks! Collect 4 fruit to advance.",
    generateObstacles: () => {
      let obstacles: Obstacle[] = [];
      
      // Add a few obstacles in the corners
      addBlockAtPosition(obstacles, Math.floor(GRID_WIDTH * 0.25) - 1, Math.floor(GRID_HEIGHT * 0.25) - 1);
      addBlockAtPosition(obstacles, Math.floor(GRID_WIDTH * 0.75) - 1, Math.floor(GRID_HEIGHT * 0.75) - 1);
      
      return obstacles;
    },
    getSpeed: () => BASE_SPEED - 20// Standard speed (200ms)
    // For customization later, you could use: getSpeed: () => BASE_SPEED - 20 // Slightly faster (180ms)
  },
  
  // Level 3: Four Corners (Obstacles in corners, need 5 food)
  {
    id: 3,
    name: "Four Corners", 
    requiredFood: 5,
    description: "Navigate the corners. Collect 5 fruit to advance.",
    generateObstacles: () => {
      let obstacles: Obstacle[] = [];
      
      // Add obstacles in all four corners
      addBlockAtPosition(obstacles, Math.floor(GRID_WIDTH * 0.25) - 1, Math.floor(GRID_HEIGHT * 0.25) - 1);
      addBlockAtPosition(obstacles, Math.floor(GRID_WIDTH * 0.25) - 1, Math.floor(GRID_HEIGHT * 0.75) - 1);
      addBlockAtPosition(obstacles, Math.floor(GRID_WIDTH * 0.75) - 1, Math.floor(GRID_HEIGHT * 0.25) - 1);
      addBlockAtPosition(obstacles, Math.floor(GRID_WIDTH * 0.75) - 1, Math.floor(GRID_HEIGHT * 0.75) - 1);
      
      return obstacles;
    },
    getSpeed: () => BASE_SPEED -30// Standard speed (200ms)
    // For customization later, you could use: getSpeed: () => BASE_SPEED - 40 // Faster (160ms)
  },
  
  // Level 4: Four corners plus center
  {
    id: 4,
    name: "Four Corners Plus",
    requiredFood: 6,
    description: "Blocks in corners and center. Collect 6 fruit to advance.",
    generateObstacles: () => {
      const obstacles: Obstacle[] = [];
      // Add obstacles in all four corners
      addBlockAtPosition(obstacles, Math.floor(GRID_WIDTH * 0.25) - 1, Math.floor(GRID_HEIGHT * 0.25) - 1);
      addBlockAtPosition(obstacles, Math.floor(GRID_WIDTH * 0.25) - 1, Math.floor(GRID_HEIGHT * 0.75) - 1);
      addBlockAtPosition(obstacles, Math.floor(GRID_WIDTH * 0.75) - 1, Math.floor(GRID_HEIGHT * 0.25) - 1);
      addBlockAtPosition(obstacles, Math.floor(GRID_WIDTH * 0.75) - 1, Math.floor(GRID_HEIGHT * 0.75) - 1);
      // Add center block
      addBlockAtPosition(obstacles, Math.floor(GRID_WIDTH * 0.5) - 1, Math.floor(GRID_HEIGHT * 0.5) - 1);
      
      return obstacles;
    },
    getSpeed: () => BASE_SPEED - 40// Standard speed (200ms)
    // For customization later, you could use: getSpeed: () => BASE_SPEED - 50 // Faster (150ms)
  },
  
  // Level 5: Zigzag Corridor
  {
    id: 5,
    name: "Zigzag Corridor",
    requiredFood: 7,
    description: "Navigate a zigzag path. Collect 7 fruit to advance.",
    generateObstacles: () => {
      const obstacles: Obstacle[] = [];
      
      // Create a zigzag corridor that forces player to navigate carefully
      // Left barrier
      for (let y = 2; y < Math.floor(GRID_HEIGHT * 0.4); y += 2) {
        addBlockAtPosition(obstacles, Math.floor(GRID_WIDTH * 0.33) - 1, y);
      }
      
      // Middle barriers
      for (let y = Math.floor(GRID_HEIGHT * 0.4); y < Math.floor(GRID_HEIGHT * 0.6); y += 2) {
        addBlockAtPosition(obstacles, Math.floor(GRID_WIDTH * 0.5) - 1, y);
      }
      
      // Right barrier - using addBlockAtPosition to create proper 2x2 blocks like the left side
      const rightBarrierX = Math.floor(GRID_WIDTH * 0.66) - 1;
      for (let y = Math.floor(GRID_HEIGHT * 0.6); y < GRID_HEIGHT - 2; y += 2) {
        addBlockAtPosition(obstacles, rightBarrierX, y);
      }
      
      // Add horizontal barriers to make navigation harder
      addBlockAtPosition(obstacles, Math.floor(GRID_WIDTH * 0.2) - 1, Math.floor(GRID_HEIGHT * 0.3) - 1);
      
      // Connection from right barrier to a 2x2 block
      // Get the appropriate Y position where we want to add the connection
      const connectionY = Math.floor(GRID_HEIGHT * 0.7);
      
      // Add the 2x2 block to the right of the right barrier, connected to it
      addBlockAtPosition(obstacles, rightBarrierX + 2, connectionY);
      
      return obstacles;
    },
    getSpeed: () => BASE_SPEED - 50// Standard speed (200ms)
    // For customization later, you could use: getSpeed: () => BASE_SPEED - 60 // Faster (140ms)
  },
  
  // Level 6: Spiral Path
  {
    id: 6,
    name: "Spiral Path",
    requiredFood: 8,
    description: "Navigate a spiral path. Collect 8 fruit to advance.",
    generateObstacles: () => {
      const obstacles: Obstacle[] = [];
      // Create a simplified spiral pattern (easier version of level 10)
      const spiralPositions = [
        // Outer border - top
        ...Array.from({length: Math.floor(GRID_WIDTH * 0.8)}, (_, i) => ({
          x: Math.floor(GRID_WIDTH * 0.1) + i,
          y: Math.floor(GRID_HEIGHT * 0.2)
        })),
        // Right side
        ...Array.from({length: Math.floor(GRID_HEIGHT * 0.6)}, (_, i) => ({
          x: Math.floor(GRID_WIDTH * 0.8),
          y: Math.floor(GRID_HEIGHT * 0.2) + i
        })),
        // Bottom
        ...Array.from({length: Math.floor(GRID_WIDTH * 0.6)}, (_, i) => ({
          x: Math.floor(GRID_WIDTH * 0.8) - i,
          y: Math.floor(GRID_HEIGHT * 0.8)
        })),
        // Left inner partial wall (with large gap to make it easier)
        ...Array.from({length: Math.floor(GRID_HEIGHT * 0.3)}, (_, i) => ({
          x: Math.floor(GRID_WIDTH * 0.2),
          y: Math.floor(GRID_HEIGHT * 0.8) - i
        })),
      ];
      
      // Add spiral obstacles but make more gaps (every other block)
      spiralPositions.forEach((pos, index) => {
        if (index % 2 === 0) { // More frequent gaps than level 10
          obstacles.push({ x: pos.x, y: pos.y });
        }
      });
      return obstacles;
    },
    getSpeed: () => BASE_SPEED - 60// Standard speed (200ms)
    // For customization later, you could use: getSpeed: () => BASE_SPEED - 70 // Faster (130ms)
  },
  
  // Level 7: Maze Chambers
  {
    id: 7,
    name: "Maze Chambers",
    requiredFood: 9,
    description: "Navigate through maze chambers. Collect 9 fruit to advance.",
    generateObstacles: () => {
      const obstacles: Obstacle[] = [];
      
      // Create vertical dividers that split the screen into chambers
      for (let x = Math.floor(GRID_WIDTH * 0.33); x <= Math.floor(GRID_WIDTH * 0.66); x += Math.floor(GRID_WIDTH * 0.33)) {
        for (let y = 2; y < GRID_HEIGHT - 2; y++) {
          // Skip certain areas to create passages between chambers
          if ((y > Math.floor(GRID_HEIGHT * 0.3) && y < Math.floor(GRID_HEIGHT * 0.4)) ||
              (y > Math.floor(GRID_HEIGHT * 0.6) && y < Math.floor(GRID_HEIGHT * 0.7))) {
            continue;
          }
          obstacles.push({ x, y });
        }
      }
      
      // Create horizontal barriers in each chamber
      // Left chamber
      for (let x = 2; x < Math.floor(GRID_WIDTH * 0.33) - 2; x++) {
        obstacles.push({ x, y: Math.floor(GRID_HEIGHT * 0.5) });
      }
      
      // Middle chamber
      for (let x = Math.floor(GRID_WIDTH * 0.33) + 2; x < Math.floor(GRID_WIDTH * 0.66) - 2; x++) {
        if (x % 3 === 0) { // Make some gaps
          continue;
        }
        obstacles.push({ x, y: Math.floor(GRID_HEIGHT * 0.3) });
        obstacles.push({ x, y: Math.floor(GRID_HEIGHT * 0.7) });
      }
      
      // Right chamber
      for (let x = Math.floor(GRID_WIDTH * 0.66) + 2; x < GRID_WIDTH - 2; x++) {
        obstacles.push({ x, y: Math.floor(GRID_HEIGHT * 0.5) });
      }
      
      return obstacles;
    },
    getSpeed: () => BASE_SPEED - 70// Standard speed (200ms)
    // For customization later, you could use: getSpeed: () => BASE_SPEED - 80 // Faster (120ms)
  },
  
  // Level 8: H Pattern
  {
    id: 8,
    name: "H Pattern",
    requiredFood: 10,
    description: "Navigate the H-shaped obstacles. Collect 10 fruit to advance.",
    generateObstacles: () => {
      const obstacles: Obstacle[] = [];
      
      // Get position of left column
      const leftColumnX = Math.floor(GRID_WIDTH * 0.25) - 1;
      const rightColumnX = Math.floor(GRID_WIDTH * 0.75) - 1;
      
      // Left vertical bar - evenly spaced blocks
      for (let y = Math.floor(GRID_HEIGHT * 0.25); y <= Math.floor(GRID_HEIGHT * 0.75); y += 3) {
        addBlockAtPosition(obstacles, leftColumnX, y);
      }
      
      // Right vertical bar - matching the left exactly for symmetry
      for (let y = Math.floor(GRID_HEIGHT * 0.25); y <= Math.floor(GRID_HEIGHT * 0.75); y += 3) {
        addBlockAtPosition(obstacles, rightColumnX, y);
      }
      
      // Middle horizontal bar - extended to touch the left column
      const midY = Math.floor(GRID_HEIGHT * 0.5) - 1;
      // Start from the left column + 2 (to touch the 2x2 block)
      const startX = leftColumnX + 2;
      const endX = Math.floor(GRID_WIDTH * 0.65);
      
      // Create the horizontal middle section (extended to touch the left column, 2 blocks wide)
      for (let x = startX; x <= endX; x++) {
        obstacles.push({ x, y: midY });
        obstacles.push({ x, y: midY + 1 }); // Second row to make it 2 blocks wide
      }
      
      return obstacles;
    },
    getSpeed: () => BASE_SPEED -80// Standard speed (200ms)
    // For customization later, you could use: getSpeed: () => BASE_SPEED - 90 // Faster (110ms)
  },
  
  // Level 9: Mini Maze
  {
    id: 9,
    name: "Mini Maze",
    requiredFood: 11,
    description: "Navigate a mini maze. Collect 11 fruit to advance.",
    generateObstacles: () => {
      const obstacles: Obstacle[] = [];
      // Create a symmetrical maze pattern
      // Vertical dividers
      for (let y = 2; y < GRID_HEIGHT - 2; y += 2) {
        if (y % 4 === 0) continue; // Skip every other row for pathways
        addBlockAtPosition(obstacles, Math.floor(GRID_WIDTH / 3) - 1, y);
        addBlockAtPosition(obstacles, Math.floor(GRID_WIDTH * 2/3) - 1, y);
      }
      // Horizontal dividers
      for (let x = 2; x < GRID_WIDTH - 2; x += 2) {
        if (x % 4 === 0) continue; // Skip every other column for pathways
        addBlockAtPosition(obstacles, x, Math.floor(GRID_HEIGHT / 3) - 1);
        addBlockAtPosition(obstacles, x, Math.floor(GRID_HEIGHT * 2/3) - 1);
      }
      return obstacles;
    },
    getSpeed: () => BASE_SPEED - 90// Standard speed (200ms)
    // For customization later, you could use: getSpeed: () => BASE_SPEED - 100 // Very fast (100ms)
  },
  
  // Level 10: Maze Master (final challenge)
  {
    id: 10,
    name: "Maze Master",
    requiredFood: 12,
    description: "Navigate the ultimate box maze. Collect 12 fruit to complete the game!",
    generateObstacles: () => {
      const obstacles: Obstacle[] = [];
      
      // Create a box-based maze with strategic gaps
      // Outer box
      const outerMargin = 4;
      // Top and bottom walls
      for (let x = outerMargin; x < GRID_WIDTH - outerMargin; x++) {
        if (x === Math.floor(GRID_WIDTH / 2)) continue; // Gap in middle
        obstacles.push({ x, y: outerMargin });
        obstacles.push({ x, y: GRID_HEIGHT - outerMargin - 1 });
      }
      
      // Left and right walls
      for (let y = outerMargin; y < GRID_HEIGHT - outerMargin; y++) {
        obstacles.push({ x: outerMargin, y });
        obstacles.push({ x: GRID_WIDTH - outerMargin - 1, y });
      }
      
      // Inner box
      const innerMargin = 8;
      // Top and bottom walls with different gaps
      for (let x = innerMargin; x < GRID_WIDTH - innerMargin; x++) {
        if (x === Math.floor(GRID_WIDTH / 2) - 3) continue; // Left gap
        if (x === Math.floor(GRID_WIDTH / 2) + 3) continue; // Right gap
        obstacles.push({ x, y: innerMargin });
        obstacles.push({ x, y: GRID_HEIGHT - innerMargin - 1 });
      }
      
      // Left and right walls with gaps
      for (let y = innerMargin; y < GRID_HEIGHT - innerMargin; y++) {
        if (y === Math.floor(GRID_HEIGHT / 2)) continue; // Gap in middle
        obstacles.push({ x: innerMargin, y });
        obstacles.push({ x: GRID_WIDTH - innerMargin - 1, y });
      }
      
      // Add more barriers for the ultimate challenge
      addBlockAtPosition(obstacles, Math.floor(GRID_WIDTH * 0.3) - 1, Math.floor(GRID_HEIGHT * 0.3) - 1);
      addBlockAtPosition(obstacles, Math.floor(GRID_WIDTH * 0.7) - 1, Math.floor(GRID_HEIGHT * 0.7) - 1);
      addBlockAtPosition(obstacles, Math.floor(GRID_WIDTH * 0.7) - 1, Math.floor(GRID_HEIGHT * 0.3) - 1);
      
      return obstacles;
    },
    getSpeed: () => BASE_SPEED -100// Standard speed (200ms)
    // For customization later, you could use: getSpeed: () => BASE_SPEED - 120 // Super fast (80ms)
  },

  // Level 11: Double Box Maze
  {
    id: 11,
    name: "Double Box Maze",
    requiredFood: 13,
    description: "Navigate through nested box mazes. Collect 13 fruit to advance.",
    generateObstacles: () => {
      const obstacles: Obstacle[] = [];
      
      // Outer box parameters
      const outerMargin = 3;
      const innerMargin = 7;
      
      // Create outer box
      for (let x = outerMargin; x < GRID_WIDTH - outerMargin; x++) {
        // Leave gaps in the middle of each wall
        if (x !== Math.floor(GRID_WIDTH / 2)) {
          obstacles.push({ x, y: outerMargin });
          obstacles.push({ x, y: GRID_HEIGHT - outerMargin - 1 });
        }
      }
      for (let y = outerMargin; y < GRID_HEIGHT - outerMargin; y++) {
        obstacles.push({ x: outerMargin, y });
        obstacles.push({ x: GRID_WIDTH - outerMargin - 1, y });
      }
      
      // Create inner box with offset gaps
      for (let x = innerMargin; x < GRID_WIDTH - innerMargin; x++) {
        if (x !== Math.floor(GRID_WIDTH / 2) - 2) {
          obstacles.push({ x, y: innerMargin });
          obstacles.push({ x, y: GRID_HEIGHT - innerMargin - 1 });
        }
      }
      for (let y = innerMargin; y < GRID_HEIGHT - innerMargin; y++) {
        if (y !== Math.floor(GRID_HEIGHT / 2) + 2) {
          obstacles.push({ x: innerMargin, y });
          obstacles.push({ x: GRID_WIDTH - innerMargin - 1, y });
        }
      }
      
      // Add diagonal barriers
      addBlockAtPosition(obstacles, Math.floor(GRID_WIDTH * 0.25), Math.floor(GRID_HEIGHT * 0.25));
      addBlockAtPosition(obstacles, Math.floor(GRID_WIDTH * 0.75) - 2, Math.floor(GRID_HEIGHT * 0.75) - 2);
      
      return obstacles;
    },
    getSpeed: () => BASE_SPEED - 110
  },

  // Level 12: Triple Box Challenge
  {
    id: 12,
    name: "Triple Box Challenge",
    requiredFood: 14,
    description: "Master three concentric box mazes. Collect 14 fruit to advance.",
    generateObstacles: () => {
      const obstacles: Obstacle[] = [];
      
      // Three boxes with different margins
      const margins = [3, 6, 9];
      
      margins.forEach((margin, index) => {
        // Create horizontal walls with gaps
        for (let x = margin; x < GRID_WIDTH - margin; x++) {
          if (x !== Math.floor(GRID_WIDTH / 2) + index - 1) {
            obstacles.push({ x, y: margin });
            obstacles.push({ x, y: GRID_HEIGHT - margin - 1 });
          }
        }
        
        // Create vertical walls with offset gaps
        for (let y = margin; y < GRID_HEIGHT - margin; y++) {
          if (y !== Math.floor(GRID_HEIGHT / 2) - index + 1) {
            obstacles.push({ x: margin, y });
            obstacles.push({ x: GRID_WIDTH - margin - 1, y });
          }
        }
      });
      
      return obstacles;
    },
    getSpeed: () => BASE_SPEED - 120
  },

  // Level 13: Cross Box Maze
  {
    id: 13,
    name: "Cross Box Maze",
    requiredFood: 15,
    description: "Navigate through a complex cross-box labyrinth. Collect 15 fruit to advance.",
    generateObstacles: () => {
      const obstacles: Obstacle[] = [];
      
      // Create main box with strategic gaps
      const margin = 3;
      for (let x = margin; x < GRID_WIDTH - margin; x++) {
        if (x !== Math.floor(GRID_WIDTH * 0.25) && x !== Math.floor(GRID_WIDTH * 0.75)) {
          obstacles.push({ x, y: margin });
          obstacles.push({ x, y: GRID_HEIGHT - margin - 1 });
        }
      }
      for (let y = margin; y < GRID_HEIGHT - margin; y++) {
        if (y !== Math.floor(GRID_HEIGHT * 0.25) && y !== Math.floor(GRID_HEIGHT * 0.75)) {
          obstacles.push({ x: margin, y });
          obstacles.push({ x: GRID_WIDTH - margin - 1, y });
        }
      }
      
      // Create inner cross pattern with gaps
      const mid = Math.floor(GRID_WIDTH / 2);
      const crossWidth = 2; // Width of cross arms
      
      // Horizontal cross arm
      for (let x = margin + 3; x < GRID_WIDTH - margin - 3; x++) {
        if (Math.abs(x - mid) > 1) { // Gap in middle
          for (let dy = 0; dy < crossWidth; dy++) {
            obstacles.push({ x, y: mid + dy - 1 });
          }
        }
      }
      
      // Vertical cross arm
      for (let y = margin + 3; y < GRID_HEIGHT - margin - 3; y++) {
        if (Math.abs(y - Math.floor(GRID_HEIGHT / 2)) > 1) { // Gap in middle
          for (let dx = 0; dx < crossWidth; dx++) {
            obstacles.push({ x: mid + dx - 1, y });
          }
        }
      }
      
      // Add corner mazes in each quadrant
      const quadrants = [
        { x: margin + 2, y: margin + 2 },
        { x: GRID_WIDTH - margin - 5, y: margin + 2 },
        { x: margin + 2, y: GRID_HEIGHT - margin - 5 },
        { x: GRID_WIDTH - margin - 5, y: GRID_HEIGHT - margin - 5 }
      ];
      
      quadrants.forEach(pos => {
        // Create 2x2 block with a single entry point
        addBlockAtPosition(obstacles, pos.x, pos.y);
        // Add additional barriers around the block
        obstacles.push({ x: pos.x - 1, y: pos.y + 1 });
        obstacles.push({ x: pos.x + 2, y: pos.y + 1 });
      });
      
      return obstacles;
    },
    getSpeed: () => BASE_SPEED - 130
  },

  // Level 14: Maze Chambers Elite
  {
    id: 14,
    name: "Maze Chambers Elite",
    requiredFood: 16,
    description: "Master the ultimate chamber system. Collect 16 fruit to advance.",
    generateObstacles: () => {
      const obstacles: Obstacle[] = [];
      
      // Create outer frame with specific entry points
      const margin = 3;
      // Top and bottom walls with gaps
      for (let x = margin; x < GRID_WIDTH - margin; x++) {
        if (x !== Math.floor(GRID_WIDTH * 0.25) && x !== Math.floor(GRID_WIDTH * 0.75)) {
          obstacles.push({ x, y: margin });
          obstacles.push({ x, y: GRID_HEIGHT - margin - 1 });
        }
      }
      // Side walls with gaps
      for (let y = margin; y < GRID_HEIGHT - margin; y++) {
        if (y !== Math.floor(GRID_HEIGHT * 0.25) && y !== Math.floor(GRID_HEIGHT * 0.75)) {
          obstacles.push({ x: margin, y });
          obstacles.push({ x: GRID_WIDTH - margin - 1, y });
        }
      }
      
      // Create complex chamber system
      const thirds = Math.floor(GRID_WIDTH / 3);
      
      // Vertical chamber dividers with staggered gaps
      for (let y = margin + 2; y < GRID_HEIGHT - margin - 2; y++) {
        if (y % 5 !== 0) { // Create gaps every 5 blocks
          obstacles.push({ x: thirds, y });
          if (y % 3 !== 0) { // Different gap pattern for second divider
            obstacles.push({ x: thirds * 2, y });
          }
        }
      }
      
      // Horizontal barriers in each chamber with strategic gaps
      const chamberYs = [
        Math.floor(GRID_HEIGHT * 0.25),
        Math.floor(GRID_HEIGHT * 0.5),
        Math.floor(GRID_HEIGHT * 0.75)
      ];
      
      chamberYs.forEach((y, index) => {
        for (let x = margin + 2; x < GRID_WIDTH - margin - 2; x++) {
          // Skip positions to create gaps
          if (x === thirds + 1 || x === thirds * 2 - 1) continue;
          if (x % (4 + index) !== 0) { // Variable gap patterns for each level
            obstacles.push({ x, y });
          }
        }
      });
      
      // Add strategic 2x2 blocks in each chamber
      const blockPositions = [
        { x: Math.floor(GRID_WIDTH * 0.2), y: Math.floor(GRID_HEIGHT * 0.3) },
        { x: Math.floor(GRID_WIDTH * 0.5), y: Math.floor(GRID_HEIGHT * 0.4) },
        { x: Math.floor(GRID_WIDTH * 0.8), y: Math.floor(GRID_HEIGHT * 0.6) },
        { x: Math.floor(GRID_WIDTH * 0.3), y: Math.floor(GRID_HEIGHT * 0.7) }
      ];
      
      blockPositions.forEach(pos => {
        addBlockAtPosition(obstacles, pos.x, pos.y);
      });
      
      return obstacles;
    },
    getSpeed: () => BASE_SPEED - 140
  },

  // Level 15: Ultimate Labyrinth
  {
    id: 15,
    name: "Ultimate Labyrinth",
    requiredFood: 17,
    description: "Master the final challenge. Collect 17 fruit to become a legend!",
    generateObstacles: () => {
      const obstacles: Obstacle[] = [];
      
      // Create complex nested structure
      const margins = [2, 5, 8];
      margins.forEach((margin, index) => {
        // Create box outline
        for (let x = margin; x < GRID_WIDTH - margin; x++) {
          if ((x + index) % 3 !== 0) { // Create patterned gaps
            obstacles.push({ x, y: margin });
            obstacles.push({ x, y: GRID_HEIGHT - margin - 1 });
          }
        }
        for (let y = margin; y < GRID_HEIGHT - margin; y++) {
          if ((y + index) % 3 !== 0) { // Create patterned gaps
            obstacles.push({ x: margin, y });
            obstacles.push({ x: GRID_WIDTH - margin - 1, y });
          }
        }
      });
      
      // Add diagonal barriers
      const positions = [0.25, 0.5, 0.75];
      positions.forEach(pos => {
        addBlockAtPosition(
          obstacles,
          Math.floor(GRID_WIDTH * pos) - 1,
          Math.floor(GRID_HEIGHT * pos) - 1
        );
      });
      
      // Add central cross
      const mid = Math.floor(GRID_WIDTH / 2);
      for (let i = 4; i < GRID_WIDTH - 4; i++) {
        if (Math.abs(i - mid) > 1) { // Leave small gap in middle
          obstacles.push({ x: i, y: mid });
          obstacles.push({ x: mid, y: i });
        }
      }
      
      return obstacles;
    },
    getSpeed: () => BASE_SPEED - 150
  },
];

// Export functions to work with levels
export const getLevelById = (id: number): LevelConfig => {
  const level = levels.find(level => level.id === id);
  if (!level) {
    throw new Error(`Level ${id} not found`);
  }
  return level;
};

export const getLevelCount = (): number => levels.length;
export const getAllLevels = (): LevelConfig[] => [...levels];
export const getRequiredFoodForLevel = (level: number): number => {
  return getLevelById(level).requiredFood;
};

export default levels;