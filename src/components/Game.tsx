import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Text,
  GestureResponderEvent,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

// Game constants
const GRID_SIZE = 20;
const CELL_SIZE = Math.floor(Dimensions.get("window").width / GRID_SIZE);
const GRID_WIDTH = Math.floor(Dimensions.get("window").width / CELL_SIZE);
const GRID_HEIGHT = Math.floor(
  (Dimensions.get("window").height * 0.8) / CELL_SIZE
);

// Base speed and level configuration
const BASE_SPEED = 200; // 200ms between moves
const TOTAL_LEVELS = 10;

// Colors
const COLORS = {
  RED: "#FF0000",
  ORANGE: "#FFA500",
  YELLOW: "#FFFF00",
  GREEN: "#00FF00",
  BLUE: "#0000FF",
  GREY: "#808080",
  BLACK: "#000000",
};

// Directions
const DIRECTIONS = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
};

// Add levels configuration
const LEVELS: Level[] = [
  { requiredFood: 3, obstacles: 0 },     // Level 1: No obstacles, need 3 food
  { requiredFood: 4, obstacles: 3 },     // Level 2: 3 obstacles, need 4 food
  { requiredFood: 5, obstacles: 5 },     // Level 3: 5 obstacles, need 5 food
  { requiredFood: 6, obstacles: 8 },     // Level 4: 8 obstacles, need 6 food
  { requiredFood: 7, obstacles: 12 },    // Level 5: 12 obstacles, need 7 food
  { requiredFood: 8, obstacles: 12 },    // Level 6: 12 obstacles, need 8 food
  { requiredFood: 9, obstacles: 12 },    // Level 7: 12 obstacles, need 9 food
  { requiredFood: 10, obstacles: 12 },   // Level 8: 12 obstacles, need 10 food
  { requiredFood: 11, obstacles: 12 },   // Level 9: 12 obstacles, need 11 food
  { requiredFood: 12, obstacles: 12 },   // Level 10: 12 obstacles, need 12 food
];

// Initial game state
const initialState = {
  snake: [
    { x: 5, y: 5 },
    { x: 4, y: 5 },
    { x: 3, y: 5 },
  ],
  food: { x: 10, y: 10, color: COLORS.RED },
  direction: "RIGHT",
  speed: BASE_SPEED,
  score: 0,
  gameOver: false,
  snakeColor: COLORS.RED,
  showRules: true,
  level: 1,
  levelComplete: false,
  remainingFood: LEVELS[0].requiredFood,
};

// Type definition for obstacles
type Obstacle = {
  x: number;
  y: number;
};

// Add new Level interface
interface Level {
  requiredFood: number;
  obstacles: number;
}

// Generate obstacles based on level
const generateObstacles = (level: number = 1): Obstacle[] => {
  const obstacles: Obstacle[] = [];
  
  // Define standardized patterns for levels
  // Each level will have a predictable pattern that builds upon previous levels
  switch (level) {
    case 1: // Level 1: Center block
      addBlockAtPosition(obstacles, Math.floor(GRID_WIDTH / 2) - 1, Math.floor(GRID_HEIGHT / 2) - 1);
      break;
      
    case 2: // Level 2: Center + top-bottom
      addBlockAtPosition(obstacles, Math.floor(GRID_WIDTH / 2) - 1, Math.floor(GRID_HEIGHT / 2) - 1);
      addBlockAtPosition(obstacles, Math.floor(GRID_WIDTH / 2) - 1, Math.floor(GRID_HEIGHT / 4) - 1);
      addBlockAtPosition(obstacles, Math.floor(GRID_WIDTH / 2) - 1, Math.floor(GRID_HEIGHT * 0.75) - 1);
      break;
      
    case 3: // Level 3: Center cross pattern
      addBlockAtPosition(obstacles, Math.floor(GRID_WIDTH / 2) - 1, Math.floor(GRID_HEIGHT / 2) - 1);
      addBlockAtPosition(obstacles, Math.floor(GRID_WIDTH / 2) - 1, Math.floor(GRID_HEIGHT / 4) - 1);
      addBlockAtPosition(obstacles, Math.floor(GRID_WIDTH / 2) - 1, Math.floor(GRID_HEIGHT * 0.75) - 1);
      addBlockAtPosition(obstacles, Math.floor(GRID_WIDTH / 4) - 1, Math.floor(GRID_HEIGHT / 2) - 1);
      addBlockAtPosition(obstacles, Math.floor(GRID_WIDTH * 0.75) - 1, Math.floor(GRID_HEIGHT / 2) - 1);
      break;
      
    case 4: // Level 4: Grid of 4 evenly spaced blocks
      addBlockAtPosition(obstacles, Math.floor(GRID_WIDTH * 0.25) - 1, Math.floor(GRID_HEIGHT * 0.25) - 1);
      addBlockAtPosition(obstacles, Math.floor(GRID_WIDTH * 0.25) - 1, Math.floor(GRID_HEIGHT * 0.75) - 1);
      addBlockAtPosition(obstacles, Math.floor(GRID_WIDTH * 0.75) - 1, Math.floor(GRID_HEIGHT * 0.25) - 1);
      addBlockAtPosition(obstacles, Math.floor(GRID_WIDTH * 0.75) - 1, Math.floor(GRID_HEIGHT * 0.75) - 1);
      break;
      
    case 5: // Level 5: X pattern
      addBlockAtPosition(obstacles, Math.floor(GRID_WIDTH * 0.25) - 1, Math.floor(GRID_HEIGHT * 0.25) - 1);
      addBlockAtPosition(obstacles, Math.floor(GRID_WIDTH * 0.25) - 1, Math.floor(GRID_HEIGHT * 0.75) - 1);
      addBlockAtPosition(obstacles, Math.floor(GRID_WIDTH * 0.75) - 1, Math.floor(GRID_HEIGHT * 0.25) - 1);
      addBlockAtPosition(obstacles, Math.floor(GRID_WIDTH * 0.75) - 1, Math.floor(GRID_HEIGHT * 0.75) - 1);
      addBlockAtPosition(obstacles, Math.floor(GRID_WIDTH * 0.5) - 1, Math.floor(GRID_HEIGHT * 0.5) - 1);
      break;
      
    case 6: // Level 6: Border pattern - top and bottom
      for (let x = 2; x < GRID_WIDTH - 2; x += 3) {
        addBlockAtPosition(obstacles, x, 1);
        addBlockAtPosition(obstacles, x, GRID_HEIGHT - 3);
      }
      break;
      
    case 7: // Level 7: Border pattern - left and right
      for (let y = 2; y < GRID_HEIGHT - 2; y += 3) {
        addBlockAtPosition(obstacles, 1, y);
        addBlockAtPosition(obstacles, GRID_WIDTH - 3, y);
      }
      // Add center obstacle
      addBlockAtPosition(obstacles, Math.floor(GRID_WIDTH / 2) - 1, Math.floor(GRID_HEIGHT / 2) - 1);
      break;
      
    case 8: // Level 8: Symmetrical H pattern
      // Vertical bars
      for (let y = Math.floor(GRID_HEIGHT * 0.25); y <= Math.floor(GRID_HEIGHT * 0.75); y += 3) {
        addBlockAtPosition(obstacles, Math.floor(GRID_WIDTH * 0.25) - 1, y);
        addBlockAtPosition(obstacles, Math.floor(GRID_WIDTH * 0.75) - 1, y);
      }
      // Horizontal bar
      for (let x = Math.floor(GRID_WIDTH * 0.25) - 1; x <= Math.floor(GRID_WIDTH * 0.75) - 1; x += 3) {
        addBlockAtPosition(obstacles, x, Math.floor(GRID_HEIGHT / 2) - 1);
      }
      break;
      
    case 9: // Level 9: Maze-like pattern
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
      break;
      
    case 10: // Level 10: Final boss - spiral pattern
      // Create a spiral pattern
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
        // Left inner
        ...Array.from({length: Math.floor(GRID_HEIGHT * 0.4)}, (_, i) => ({
          x: Math.floor(GRID_WIDTH * 0.2),
          y: Math.floor(GRID_HEIGHT * 0.8) - i
        })),
        // Top inner
        ...Array.from({length: Math.floor(GRID_WIDTH * 0.4)}, (_, i) => ({
          x: Math.floor(GRID_WIDTH * 0.2) + i,
          y: Math.floor(GRID_HEIGHT * 0.4)
        })),
        // Right inner
        ...Array.from({length: Math.floor(GRID_HEIGHT * 0.2)}, (_, i) => ({
          x: Math.floor(GRID_WIDTH * 0.6),
          y: Math.floor(GRID_HEIGHT * 0.4) + i
        })),
      ];
      
      // Add spiral obstacles (thinned out to allow movement)
      spiralPositions.forEach((pos, index) => {
        if (index % 3 === 0) { // Only place every third block to create passageways
          obstacles.push({ x: pos.x, y: pos.y });
        }
      });
      break;
      
    default:
      // Fallback for any level beyond 10
      // Create a cross pattern that scales with level
      addBlockAtPosition(obstacles, Math.floor(GRID_WIDTH / 2) - 1, Math.floor(GRID_HEIGHT / 2) - 1);
      for (let i = 1; i <= Math.min(5, level); i++) {
        // Add blocks in a cross pattern radiating from center
        addBlockAtPosition(obstacles, Math.floor(GRID_WIDTH / 2) - 1 + (i * 3), Math.floor(GRID_HEIGHT / 2) - 1);
        addBlockAtPosition(obstacles, Math.floor(GRID_WIDTH / 2) - 1 - (i * 3), Math.floor(GRID_HEIGHT / 2) - 1);
        addBlockAtPosition(obstacles, Math.floor(GRID_WIDTH / 2) - 1, Math.floor(GRID_HEIGHT / 2) - 1 + (i * 3));
        addBlockAtPosition(obstacles, Math.floor(GRID_WIDTH / 2) - 1, Math.floor(GRID_HEIGHT / 2) - 1 - (i * 3));
      }
      break;
  }
  
  return obstacles;
};

// Helper function to add a 2x2 block at specified position
const addBlockAtPosition = (obstacles: Obstacle[], startX: number, startY: number) => {
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

// Get a random position on the grid (avoiding obstacles and snake)
const getRandomPosition = (obstacles: Obstacle[] = [], snake: {x: number, y: number}[] = []): { x: number; y: number } => {
  let position: { x: number; y: number } = {
    x: Math.floor(Math.random() * GRID_WIDTH),
    y: Math.floor(Math.random() * GRID_HEIGHT),
  };
  
  // Try to find a valid position (not on obstacle or snake)
  let attempts = 0;
  const MAX_ATTEMPTS = 100; // Prevent infinite loop
  
  while (attempts < MAX_ATTEMPTS) {
    position = {
      x: Math.floor(Math.random() * GRID_WIDTH),
      y: Math.floor(Math.random() * GRID_HEIGHT),
    };
    
    // Check if position overlaps with any obstacle
    const onObstacle = obstacles.some(
      obstacle => obstacle.x === position.x && obstacle.y === position.y
    );
    
    // Check if position overlaps with snake
    const onSnake = snake.some(
      segment => segment.x === position.x && segment.y === position.y
    );
    
    // If position is valid, break the loop
    if (!onObstacle && !onSnake) {
      break;
    }
    
    attempts++;
  }
  
  // If we couldn't find a position after max attempts, find the first available position
  if (attempts >= MAX_ATTEMPTS) {
    for (let x = 0; x < GRID_WIDTH; x++) {
      for (let y = 0; y < GRID_HEIGHT; y++) {
        const candidatePosition = { x, y };
        
        // Check if this position is free
        const onObstacle = obstacles.some(
          obstacle => obstacle.x === x && obstacle.y === y
        );
        
        const onSnake = snake.some(
          segment => segment.x === x && segment.y === y
        );
        
        if (!onObstacle && !onSnake) {
          return candidatePosition;
        }
      }
    }
  }
  
  return position;
};

// ScoreTracker class to keep score reliably
class ScoreTracker {
  private currentScore: number;
  private highScore: number;
  private foodEatenCount: number;
  private currentLevel: number;
  private remainingFoodInLevel: number;

  constructor() {
    this.currentScore = 0;
    this.highScore = 0;
    this.foodEatenCount = 0;
    this.currentLevel = 1;
    this.remainingFoodInLevel = LEVELS[0].requiredFood;
  }

  setLevel(level: number) {
    this.currentLevel = level;
    this.remainingFoodInLevel = LEVELS[level - 1].requiredFood;
  }

  incrementFoodEaten() {
    this.foodEatenCount++;
    this.remainingFoodInLevel--;
    
    // Check if level is complete
    if (this.remainingFoodInLevel === 0 && this.currentLevel < TOTAL_LEVELS) {
      return true; // Indicates level complete
    }
    return false;
  }

  advanceToNextLevel() {
    if (this.currentLevel < TOTAL_LEVELS) {
      this.currentLevel++;
      this.remainingFoodInLevel = LEVELS[this.currentLevel - 1].requiredFood;
    }
  }

  getCurrentLevel() {
    return this.currentLevel;
  }

  getRemainingFood() {
    return this.remainingFoodInLevel;
  }

  getSpeedForCurrentLevel() {
    // Return constant base speed for all levels
    return BASE_SPEED;
  }

  getCurrentScore() {
    return this.foodEatenCount;
  }

  getHighScore() {
    return this.highScore;
  }

  reset(selectedLevel: number = 1) {
    this.currentScore = 0;
    this.foodEatenCount = 0;
    this.setLevel(selectedLevel);
  }
}

// Helper function to calculate points when food is eaten
function calculatePointsForFood(
  food: { x: number; y: number; color: string },
  snakeLength: number
) {
  // For simplicity, each food gives 10 points.
  return 10;
}

export default function Game() {
  const [gameState, setGameState] = useState({ ...initialState });
  const [highScore, setHighScore] = useState(0);
  const [obstacles, setObstacles] = useState(generateObstacles(1)); // Start with level 1 obstacles
  const gameLoopInterval = useRef<NodeJS.Timeout | null>(null);
  const scoreTracker = useRef(new ScoreTracker());

  // Load high score on mount
  useEffect(() => {
    loadHighScore();
  }, []);

  const loadHighScore = async () => {
    try {
      const savedScore = await AsyncStorage.getItem("highScore");
      if (savedScore) setHighScore(parseInt(savedScore));
    } catch (error) {
      console.error("Error loading high score:", error);
    }
  };

  const saveHighScore = async (score: number) => {
    try {
      if (score > highScore) {
        await AsyncStorage.setItem("highScore", score.toString());
        setHighScore(score);
      }
    } catch (error) {
      console.error("Error saving high score:", error);
    }
  };

  // Main game loop: move the snake and handle food consumption
  const moveSnake = () => {
    setGameState((prevState) => {
      const newSnake = [...prevState.snake];
      const head = { ...newSnake[0] };
      const direction =
        DIRECTIONS[prevState.direction as keyof typeof DIRECTIONS];

      head.x += direction.x;
      head.y += direction.y;

      // Wrap the snake around the grid edges
      head.x = (head.x + GRID_WIDTH) % GRID_WIDTH;
      head.y = (head.y + GRID_HEIGHT) % GRID_HEIGHT;

      // Check collision with self (excluding the tail which will move)
      // We use slice(0, -1) to exclude the tail piece that will be removed
      const selfCollision = newSnake.slice(0, -1).some(
        (segment) => segment.x === head.x && segment.y === head.y
      );

      // Check collision with obstacles - use strict equality for coordinates
      const obstacleCollision = obstacles.some(
        (obstacle) => obstacle.x === head.x && obstacle.y === head.y
      );

      // Trigger game over if any collision is detected
      if (selfCollision || obstacleCollision) {
        handleGameOver();
        return prevState;
      }

      newSnake.unshift(head);

      // If food is eaten
      if (head.x === prevState.food.x && head.y === prevState.food.y) {
        const levelComplete = scoreTracker.current.incrementFoodEaten();
        const remainingFood = scoreTracker.current.getRemainingFood();

        // Immediately stop the game if level is complete
        if (levelComplete) {
          if (gameLoopInterval.current) {
            clearInterval(gameLoopInterval.current);
          }
          return {
            ...prevState,
            snake: newSnake,
            snakeColor: prevState.food.color,
            levelComplete: true,
            score: scoreTracker.current.getCurrentScore(),
            remainingFood: 0,
            // Add a style property to ensure the level complete screen appears on top
            overlayStyle: {
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 999,
            },
          };
        }

        // Continue game if level not complete
        return {
          ...prevState,
          snake: newSnake,
          snakeColor: prevState.food.color,
          food: {
            ...getRandomPosition(obstacles, newSnake.slice(1)),
            color: Object.values(COLORS).filter(
              (c) => c !== COLORS.GREY && c !== COLORS.BLACK
            )[Math.floor(Math.random() * 5)],
          },
          score: scoreTracker.current.getCurrentScore(),
          remainingFood,
        };
      }

      // Snake continues moving
        newSnake.pop();
        return {
          ...prevState,
          snake: newSnake,
        };
    });
  };

  // Set up the game loop using a ref-managed interval.
  useEffect(() => {
    if (gameLoopInterval.current) {
      clearInterval(gameLoopInterval.current);
    }
    // Only start the game loop if the game is actively running
    if (!gameState.gameOver && !gameState.levelComplete) {
      // Always use BASE_SPEED instead of gameState.speed to ensure consistent speed
      gameLoopInterval.current = setInterval(moveSnake, BASE_SPEED);
    }
    return () => {
      if (gameLoopInterval.current) {
        clearInterval(gameLoopInterval.current);
      }
    };
  }, [gameState.gameOver, gameState.levelComplete]); // Remove gameState.speed from dependencies

  // Handle game over: clear the interval and update high score
  const handleGameOver = () => {
    if (gameLoopInterval.current) {
      clearInterval(gameLoopInterval.current);
    }
    const finalScore = scoreTracker.current.getCurrentScore();

    setGameState((prev) => ({
      ...prev,
      gameOver: true,
      score: finalScore,
    }));

    // Update high score if needed
    if (finalScore > highScore) {
      saveHighScore(finalScore);
    }
  };

  // Simplified reset game function
  const resetGame = (selectedLevel: number = 1) => {
    scoreTracker.current.reset(selectedLevel);
    const levelObstacles = generateObstacles(selectedLevel);
    setObstacles(levelObstacles);
    
    // Initial snake position
    const initialSnake = [
      { x: 5, y: 5 },
      { x: 4, y: 5 },
      { x: 3, y: 5 },
    ];
    
    // Make sure food doesn't spawn on obstacles or the snake
    const initialFood = {
      ...getRandomPosition(levelObstacles, initialSnake),
      color: Object.values(COLORS).filter(
        (c) => c !== COLORS.GREY && c !== COLORS.BLACK
      )[Math.floor(Math.random() * 5)],
    };
    
    setGameState({
      ...initialState,
      showRules: false,
      level: selectedLevel,
      speed: BASE_SPEED, // Constant speed for all levels
      remainingFood: LEVELS[selectedLevel - 1].requiredFood,
      snake: initialSnake,
      food: initialFood,
    });
  };

  // Handler for level selection
  const handleLevelSelect = (level: number) => (_: GestureResponderEvent) => {
    resetGame(level);
  };

  // Handle gesture-based direction changes.
  const handleGesture = (direction: string) => {
    const opposites = {
      UP: "DOWN",
      DOWN: "UP",
      LEFT: "RIGHT",
      RIGHT: "LEFT",
    };

    setGameState((prevState) => {
      if (
        prevState.direction === opposites[direction as keyof typeof opposites]
      ) {
        return prevState;
      }
      return { ...prevState, direction };
    });
  };

  const startGame = () => {
    setGameState((prev) => ({ ...prev, showRules: false }));
  };

  // Swipe gesture handling (only allowing 90-degree turns)
  const swipeGesture = Gesture.Pan().onEnd((event) => {
    const { translationX, translationY } = event;
    if (Math.abs(translationX) > Math.abs(translationY) * 2) {
      if (gameState.direction === "UP" || gameState.direction === "DOWN") {
        handleGesture(translationX > 0 ? "RIGHT" : "LEFT");
      }
    } else if (Math.abs(translationY) > Math.abs(translationX) * 2) {
      if (gameState.direction === "LEFT" || gameState.direction === "RIGHT") {
        handleGesture(translationY > 0 ? "DOWN" : "UP");
      }
    }
  });

  // Rules screen component with level selection
  const RulesScreen = () => (
    <View style={styles.rulesScreen}>
      <Text style={styles.rulesTitle}>CHROMA{"\n"}SNAKE</Text>
      <Text style={styles.snakeArt}>
        {"    ┌──┐     \n"}
        {"    │··│     \n"}
        {"    └┐ │     \n"}
        {"     │ │     \n"}
        {"     │ └┐    \n"}
        {"     └─ ┘    \n"}
      </Text>
      <View style={styles.rulesContainer}>
        <Text style={[styles.rulesText, { color: COLORS.RED }]}>ONE ATTEMPT PER LEVEL!</Text>
        <Text style={[styles.rulesText, { color: COLORS.RED }]}>AVOID BLOCKS OR START OVER!</Text>
        
        <View style={styles.levelGrid}>
          {LEVELS.map((_, index) => (
            <TouchableOpacity
              key={index}
              style={styles.levelCard}
              onPress={() => resetGame(index + 1)}
            >
              <Text style={styles.levelCardTitle}>{index + 1}</Text>
            </TouchableOpacity>
          ))}
      </View>
      </View>
      <TouchableOpacity 
        style={styles.playButton} 
        onPress={() => {
          resetGame(1);
        }}
      >
        <Text style={styles.playButtonText}>START FROM LEVEL 1</Text>
      </TouchableOpacity>
    </View>
  );

  // Add level completion handler
  const handleLevelComplete = () => {
    scoreTracker.current.advanceToNextLevel();
    const nextLevel = scoreTracker.current.getCurrentLevel();
    setObstacles(generateObstacles(nextLevel)); // Update obstacles for the next level
    
    setGameState({
      ...initialState,
      showRules: false,
      level: nextLevel,
      speed: BASE_SPEED, // Use constant base speed directly
      remainingFood: scoreTracker.current.getRemainingFood(),
      score: scoreTracker.current.getCurrentScore(),
      snake: [
        { x: 5, y: 5 },
        { x: 4, y: 5 },
        { x: 3, y: 5 },
      ],
      food: { 
        ...getRandomPosition(generateObstacles(nextLevel), [
          { x: 5, y: 5 },
          { x: 4, y: 5 },
          { x: 3, y: 5 },
        ]), // Use new obstacles for food position
        color: Object.values(COLORS).filter(
          (c) => c !== COLORS.GREY && c !== COLORS.BLACK
        )[Math.floor(Math.random() * 5)],
      },
      levelComplete: false,
    });
  };

  // Game Over screen component
  const GameOverScreen = () => (
    <View style={styles.gameOver}>
      <Text style={styles.gameOverText}>Game Over!</Text>
      <Text style={styles.scoreText}>Level {gameState.level} Failed</Text>
      <Text style={styles.scoreText}>Fruit Collected: {gameState.score}</Text>
      <Text style={[styles.rulesText, { color: COLORS.RED, marginTop: 20 }]}>
        You've been eliminated!
      </Text>
      <TouchableOpacity 
        style={[styles.replayButton, { marginTop: 30 }]}
        onPress={() => {
          setGameState({
            ...initialState,
            showRules: true,
          });
        }}
      >
        <Text style={styles.replayText}>Return to Menu</Text>
      </TouchableOpacity>
    </View>
  );

  // Level complete screen component
  const LevelCompleteScreen = () => (
    <View style={styles.levelComplete}>
      <Text style={styles.levelCompleteText}>Level {gameState.level} Complete!</Text>
      <Text style={styles.scoreText}>Fruit Collected: {LEVELS[gameState.level - 1].requiredFood}</Text>
      <Text style={styles.scoreText}>Total Progress: {gameState.score}/{LEVELS.slice(0, gameState.level).reduce((acc, level) => acc + level.requiredFood, 0)}</Text>
      {gameState.level < TOTAL_LEVELS ? (
        <>
          <Text style={[styles.rulesText, { marginTop: 20, marginBottom: 20, color: COLORS.GREEN }]}>
            Level {gameState.level + 1} Unlocked!
        </Text>
          <Text style={[styles.rulesText, { marginBottom: 20 }]}>
            Next Challenge: Collect {LEVELS[gameState.level].requiredFood} Fruit
          </Text>
          <TouchableOpacity
            style={styles.nextLevelButton}
            onPress={handleLevelComplete}
          >
            <Text style={styles.nextLevelText}>Start Level {gameState.level + 1}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.replayButton, { marginTop: 20, backgroundColor: COLORS.BLUE }]}
            onPress={() => {
              setGameState({
                ...initialState,
                showRules: true,
              });
            }}
          >
            <Text style={styles.replayText}>Return to Menu</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.gameCompleteText}>Game Complete!</Text>
          <Text style={[styles.rulesText, { color: COLORS.GREEN }]}>
            You've Mastered All Levels!
          </Text>
          <Text style={styles.scoreText}>Total Fruit: {gameState.score}</Text>
          <TouchableOpacity
            style={[styles.replayButton, { marginTop: 30 }]}
            onPress={() => {
              setGameState({
                ...initialState,
                showRules: true,
              });
            }}
          >
            <Text style={styles.replayText}>Return to Menu</Text>
          </TouchableOpacity>
        </>
      )}
      </View>
    );

  return (
    <GestureHandlerRootView style={styles.container}>
      {gameState.showRules ? (
        <RulesScreen />
      ) : (
        <>
          <View style={styles.headerContainer}>
            <View style={styles.scoreContainer}>
              <Text style={styles.scoreText}>LEVEL: {gameState.level}</Text>
              <Text style={styles.scoreText}>FRUIT NEEDED: {gameState.remainingFood}</Text>
              <Text style={styles.scoreText}>COLLECTED: {gameState.score}</Text>
            </View>
          </View>
          <GestureDetector gesture={swipeGesture}>
            <View
              style={[styles.gameBoard, { borderColor: gameState.snakeColor }]}
            >
              {gameState.snake.map((segment, index) => (
                <View
                  key={index}
                  style={[
                    styles.cell,
                    {
                      left: segment.x * CELL_SIZE,
                      top: segment.y * CELL_SIZE,
                      backgroundColor: gameState.snakeColor,
                    },
                  ]}
                />
              ))}
              <View
                style={[
                  styles.cell,
                  {
                    left: gameState.food.x * CELL_SIZE,
                    top: gameState.food.y * CELL_SIZE,
                    backgroundColor: gameState.food.color,
                  },
                ]}
              />
              {obstacles.map((obstacle, index) => (
                <View
                  key={`obstacle-${index}`}
                  style={[
                    styles.cell,
                    {
                      left: obstacle.x * CELL_SIZE,
                      top: obstacle.y * CELL_SIZE,
                      backgroundColor: COLORS.GREY,
                    },
                  ]}
                />
              ))}
            </View>
          </GestureDetector>
          {gameState.gameOver && (
            <View style={[styles.overlay, styles.gameOver]}>
              <GameOverScreen />
            </View>
          )}
          {gameState.levelComplete && !gameState.gameOver && (
            <View style={[styles.overlay, styles.levelComplete]}>
              <LevelCompleteScreen />
            </View>
          )}
        </>
      )}
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BLACK,
    alignItems: "center",
    justifyContent: "center",
  },
  headerContainer: {
    width: "100%",
    paddingHorizontal: 10,
    paddingTop: 5,
    paddingBottom: 2,
  },
  scoreContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
  scoreText: {
    color: COLORS.ORANGE,
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: "monospace",
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  gameBoard: {
    width: GRID_WIDTH * CELL_SIZE,
    height: GRID_HEIGHT * CELL_SIZE,
    borderWidth: 4,
    position: "relative",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderStyle: "solid",
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    position: "absolute",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.2)",
  },
  gameOver: {
    position: "absolute",
    backgroundColor: "rgba(0,0,0,0.95)",
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  gameOverText: {
    color: COLORS.RED,
    fontSize: 48,
    fontWeight: "bold",
    fontFamily: "monospace",
    textTransform: "uppercase",
    letterSpacing: 4,
    textShadowColor: "rgba(255, 0, 0, 0.75)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 1,
    marginBottom: 20,
  },
  replayButton: {
    backgroundColor: COLORS.ORANGE,
    padding: 15,
    borderRadius: 0,
    marginTop: 20,
    borderWidth: 4,
    borderColor: "#FFC04D",
    borderBottomColor: "#CC8400",
    borderRightColor: "#CC8400",
    minWidth: 200,
    alignItems: "center",
  },
  replayText: {
    color: COLORS.BLACK,
    fontSize: 20,
    fontWeight: "bold",
    fontFamily: "monospace",
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  rulesScreen: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    backgroundColor: COLORS.BLACK,
    padding: 15,
    paddingTop: "10%",
  },
  rulesTitle: {
    color: COLORS.RED,
    fontSize: 48,
    fontWeight: "bold",
    fontFamily: "monospace",
    textTransform: "uppercase",
    letterSpacing: 4,
    textShadowColor: "rgba(255, 0, 0, 0.75)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 1,
    marginBottom: 15,
    textAlign: "center",
  },
  snakeArt: {
    color: COLORS.GREEN,
    fontSize: 20,
    fontFamily: "monospace",
    marginBottom: 20,
    textAlign: "center",
    textShadowColor: "rgba(0, 255, 0, 0.75)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  rulesContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    width: "100%",
    paddingHorizontal: 20,
  },
  rulesText: {
    color: COLORS.ORANGE,
    fontSize: 24,
    fontFamily: "monospace",
    textTransform: "uppercase",
    letterSpacing: 2,
    marginBottom: 15,
    textShadowColor: "rgba(255, 165, 0, 0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
    textAlign: "center",
    width: "100%",
  },
  playButton: {
    backgroundColor: COLORS.GREEN,
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 0,
    borderWidth: 4,
    borderColor: "#00FF00",
    borderBottomColor: "#008000",
    borderRightColor: "#008000",
  },
  playButtonText: {
    color: COLORS.BLACK,
    fontSize: 32,
    fontWeight: "bold",
    fontFamily: "monospace",
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  levelComplete: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.BLACK,
    padding: 15,
  },
  levelCompleteText: {
    color: COLORS.RED,
    fontSize: 48,
    fontWeight: "bold",
    fontFamily: "monospace",
    textTransform: "uppercase",
    letterSpacing: 4,
    textShadowColor: "rgba(255, 0, 0, 0.75)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 1,
    marginBottom: 20,
    textAlign: "center",
  },
  nextLevelButton: {
    backgroundColor: COLORS.GREEN,
    padding: 15,
    borderRadius: 0,
    borderWidth: 4,
    borderColor: "#00FF00",
    borderBottomColor: "#008000",
    borderRightColor: "#008000",
  },
  nextLevelText: {
    color: COLORS.BLACK,
    fontSize: 20,
    fontWeight: "bold",
    fontFamily: "monospace",
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  gameCompleteText: {
    color: COLORS.RED,
    fontSize: 48,
    fontWeight: "bold",
    fontFamily: "monospace",
    textTransform: "uppercase",
    letterSpacing: 4,
    textShadowColor: "rgba(255, 0, 0, 0.75)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 1,
    marginBottom: 20,
    textAlign: "center",
  },
  levelGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    gap: 8,
    marginVertical: 20,
    paddingHorizontal: 10,
  },
  levelCard: {
    backgroundColor: COLORS.ORANGE,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 0,
    borderWidth: 3,
    borderColor: "#FFC04D",
    borderBottomColor: "#CC8400",
    borderRightColor: "#CC8400",
    margin: 4,
  },
  levelCardTitle: {
    color: COLORS.BLACK,
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  levelCardInfo: {
    color: COLORS.BLACK,
    fontSize: 14,
    fontFamily: 'monospace',
    textAlign: 'center',
    marginVertical: 2,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
});
