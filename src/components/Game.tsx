/**
 * ChromaSnake Game Component
 * 
 * This component implements the main game logic for the ChromaSnake game.
 * The game is structured in a modular way:
 * - Constants are defined in src/constants.ts
 * - Level definitions are in src/data/levels.ts
 * - Game utilities are in src/utils/gameUtils.ts
 * - Score tracking is handled by src/utils/ScoreTracker.ts
 * 
 * Each level has its own obstacle pattern and food requirements.
 */
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  GestureResponderEvent,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

// Add TypeScript interface for window object
declare global {
  interface Window {
    ReactNativeWebView?: {
      postMessage(message: string): void;
    };
  }
}

// Import constants and types
import { 
  GRID_WIDTH, 
  GRID_HEIGHT, 
  CELL_SIZE, 
  COLORS, 
  DIRECTIONS, 
  BASE_SPEED, 
  TOTAL_LEVELS 
} from '../constants';

// Import level data and utilities
import levels, { 
  getLevelById, 
  getLevelCount, 
  Obstacle 
} from '../data/levels';

import { 
  getRandomPosition,
  calculatePointsForFood
} from '../utils/gameUtils';

// Import ScoreTracker
import ScoreTracker from '../utils/ScoreTracker';

// Game constants
// const GRID_SIZE = 20;
// const GRID_WIDTH = Math.floor(Dimensions.get("window").width / CELL_SIZE);
// const GRID_HEIGHT = Math.floor(
//   (Dimensions.get("window").height * 0.8) / CELL_SIZE
// );

// Base speed and level configuration
// const BASE_SPEED = 200; // 200ms between moves
// const TOTAL_LEVELS = 10;

// Colors
// const COLORS = {
//   RED: "#FF0000",
//   ORANGE: "#FFA500",
//   YELLOW: "#FFFF00",
//   GREEN: "#00FF00",
//   BLUE: "#0000FF",
//   GREY: "#808080",
//   BLACK: "#000000",
// };

// Directions
// const DIRECTIONS = {
//   UP: { x: 0, y: -1 },
//   DOWN: { x: 0, y: 1 },
//   LEFT: { x: -1, y: 0 },
//   RIGHT: { x: 1, y: 0 },
// };

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
    { x: 2, y: 1 },  // Head at (2,1)
    { x: 1, y: 1 },  // Body at (1,1)
    { x: 0, y: 1 },  // Tail at (0,1)
  ],
  food: { x: 10, y: 10, color: COLORS.RED },
  direction: "RIGHT",
  score: 0,
  gameOver: false,
  snakeColor: COLORS.RED,
  showRules: true,
  level: 1,
  levelComplete: false,
  remainingFood: getLevelById(1).requiredFood,
  overlayStyle: {} as React.CSSProperties,
  lives: 3,
  levelStartScore: 0, // Track score at the start of each level
};

// Type definition for obstacles is now imported from src/data/levels.ts

// Add new Level interface
interface Level {
  requiredFood: number;
  obstacles: number;
}

// Generate obstacles based on level
// This function is now defined in src/data/levels.ts as part of each level's configuration
// const generateObstacles = (level: number = 1): Obstacle[] => { ... }

// Helper function to add a 2x2 block at specified position
// This function is now defined in src/data/levels.ts
// const addBlockAtPosition = (obstacles: Obstacle[], startX: number, startY: number) => { ... }

export default function Game() {
  const [gameState, setGameState] = useState({ ...initialState });
  const [highScore, setHighScore] = useState(0);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]); // Start with empty obstacles
  const [levelSpeed, setLevelSpeed] = useState(BASE_SPEED); // Track the current level's speed
  const gameLoopInterval = useRef<NodeJS.Timeout | null>(null);
  const scoreTracker = useRef(new ScoreTracker());

  // Track the last time we updated the game state
  const lastUpdateTime = useRef(0);
  const animationFrameId = useRef<number | null>(null);

  // Load high score and initialize obstacles on mount
  useEffect(() => {
    loadHighScore();
    // Initialize obstacles based on level 1
    const initialObstacles = getLevelById(1).generateObstacles();
    console.log('Initializing obstacles:', initialObstacles.length);
    setObstacles(initialObstacles);
    // Set initial level speed
    setLevelSpeed(getLevelById(1).getSpeed());
  }, []);

  // Add effect to log obstacles changes
  useEffect(() => {
    console.log('Obstacles updated:', obstacles.length);
  }, [obstacles]);

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

  // Handle game over
  const handleGameOver = () => {
    console.log('Handling game over');
    // Cancel animation frame
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    
    // Update game state to show game over
    setGameState(currentState => ({
      ...currentState,
      gameOver: true,
    }));
  };

  // Game loop and moveSnake function reorganized to avoid circular dependencies
  const moveSnake = () => {
    setGameState(currentGameState => {
      // If game is already over, don't process any more moves
      if (currentGameState.gameOver) {
        return currentGameState;
      }

      const newSnake = [...currentGameState.snake];
      const head = { ...newSnake[0] };
      const direction = DIRECTIONS[currentGameState.direction as keyof typeof DIRECTIONS];

      // Calculate new head position
      head.x += direction.x;
      head.y += direction.y;

      // Wrap the snake around the grid edges
      head.x = (head.x + GRID_WIDTH) % GRID_WIDTH;
      head.y = (head.y + GRID_HEIGHT) % GRID_HEIGHT;

      // Add new head to snake for collision checks
      newSnake.unshift(head);

      // Check collision with self (excluding the tail)
      const selfCollision = newSnake.slice(1, -1).some(
        (segment) => segment.x === head.x && segment.y === head.y
      );

      // Check collision with obstacles
      const obstacleCollision = obstacles.some(
        (obstacle) => obstacle.x === head.x && obstacle.y === head.y
      );

      // If collision detected, handle lives and game over
      if (selfCollision || obstacleCollision) {
        // Cancel animation frame immediately
        if (animationFrameId.current) {
          cancelAnimationFrame(animationFrameId.current);
          animationFrameId.current = null;
        }

        // Clear any lingering interval
        if (gameLoopInterval.current) {
          clearInterval(gameLoopInterval.current);
          gameLoopInterval.current = null;
        }

        // Reset timer reference
        lastUpdateTime.current = 0;

        const newLives = currentGameState.lives - 1;
        const isGameOver = newLives <= 0;

        // Reset score to levelStartScore and update ScoreTracker
        scoreTracker.current.setScore(currentGameState.levelStartScore);

        return {
          ...currentGameState,
          snake: newSnake,
          gameOver: true,
          lives: newLives,
          score: currentGameState.levelStartScore // Always reset to level start score
        };
      }

      // Check if food is eaten
      if (head.x === currentGameState.food.x && head.y === currentGameState.food.y) {
        const levelComplete = scoreTracker.current.incrementFoodEaten();
        const remainingFood = scoreTracker.current.getRemainingFood();

        // Handle level completion
        if (levelComplete) {
          return {
            ...currentGameState,
            snake: newSnake,
            snakeColor: currentGameState.food.color,
            levelComplete: true,
            score: scoreTracker.current.getCurrentScore(),
            remainingFood: 0,
            lives: 3, // Reset lives for new level
            levelStartScore: scoreTracker.current.getCurrentScore(), // Update level start score
            overlayStyle: {
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 999,
            } as React.CSSProperties,
          };
        }

        // Continue game with new food
        return {
          ...currentGameState,
          snake: newSnake,
          snakeColor: currentGameState.food.color,
          food: {
            ...getRandomPosition(obstacles, newSnake),
            color: Object.values(COLORS).filter(
              (c) => c !== COLORS.GREY && c !== COLORS.BLACK
            )[Math.floor(Math.random() * 5)],
          },
          score: scoreTracker.current.getCurrentScore(),
          remainingFood,
        };
      }

      // Snake continues moving without eating
        newSnake.pop();
        return {
        ...currentGameState,
          snake: newSnake,
        };
    });
  };

  // Game loop function that uses the moveSnake function
  const gameLoop = (timestamp: number) => {
    // If game is over, stop immediately and clean up
    if (gameState.gameOver) {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }
    if (gameLoopInterval.current) {
      clearInterval(gameLoopInterval.current);
        gameLoopInterval.current = null;
      }
      lastUpdateTime.current = 0;
      return;
    }

    if (!lastUpdateTime.current) lastUpdateTime.current = timestamp;
    
    const elapsed = timestamp - lastUpdateTime.current;
    
    // Only update game state if enough time has passed (level-specific speed)
    if (elapsed > levelSpeed) {
      moveSnake();
      lastUpdateTime.current = timestamp;
    }
    
    // Continue the game loop only if the game is still running
    if (!gameState.gameOver && !gameState.levelComplete) {
      animationFrameId.current = requestAnimationFrame(gameLoop);
    } else {
      // If game is over or level complete, ensure animation frame is canceled
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }
      if (gameLoopInterval.current) {
        clearInterval(gameLoopInterval.current);
        gameLoopInterval.current = null;
      }
      lastUpdateTime.current = 0;
    }
  };

  // Set up the game loop using requestAnimationFrame
  useEffect(() => {
    // Don't start game loop if showing rules screen
    if (gameState.showRules) {
      // Cancel any existing animation frame
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }
      return;
    }
    
    // Stop any existing animation frame
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    
    // Clear any existing interval just in case
    if (gameLoopInterval.current) {
      clearInterval(gameLoopInterval.current);
      gameLoopInterval.current = null;
    }

    // Reset the last update time
    lastUpdateTime.current = 0;
    
    // Only start the game loop if the game is actively running
    if (!gameState.gameOver && !gameState.levelComplete) {
      console.log(`Starting game loop for level ${gameState.level} at speed ${levelSpeed}ms`);
      animationFrameId.current = requestAnimationFrame(gameLoop);
    }

    // Cleanup function to ensure animation frame is cancelled
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
        console.log(`Stopping game loop for level ${gameState.level}`);
      }
    };
  }, [gameState.gameOver, gameState.levelComplete, gameState.level, levelSpeed, gameState.showRules]); // Include showRules in dependencies

  // Handle level completion and advance to next level
  const handleLevelComplete = () => {
    // Cancel any animation frame
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    
    // Clear any lingering interval as a backup
    if (gameLoopInterval.current) {
      clearInterval(gameLoopInterval.current);
      gameLoopInterval.current = null;
    }
    
    // Reset timer references
    lastUpdateTime.current = 0;
    
    // Store the current score before advancing level
    const currentScore = scoreTracker.current.getCurrentScore();
    
    scoreTracker.current.advanceToNextLevel();
    const nextLevel = scoreTracker.current.getCurrentLevel();
    
    // Get the next level configuration
    const nextLevelConfig = getLevelById(nextLevel);
    
    console.log(`Advancing to level ${nextLevel} with speed ${nextLevelConfig.getSpeed()}ms`);
    
    // Update the level speed
    setLevelSpeed(nextLevelConfig.getSpeed());
    
    // Get obstacles for the next level
    const nextLevelObstacles = nextLevelConfig.generateObstacles();
    setObstacles(nextLevelObstacles);
    
    // Initial snake position for the next level - starting at top left corner
    const initialSnake = [
      { x: 2, y: 1 },  // Head at (2,1)
      { x: 1, y: 1 },  // Body at (1,1)
      { x: 0, y: 1 },  // Tail at (0,1)
    ];
    
    setGameState({
      ...initialState,
      showRules: false,
      level: nextLevel,
      remainingFood: scoreTracker.current.getRemainingFood(),
      score: currentScore,
      levelStartScore: currentScore, // Set the level start score to current score
      snake: initialSnake,
      food: { 
        // Use the entire snake for position exclusion
        ...getRandomPosition(nextLevelObstacles, initialSnake),
        color: Object.values(COLORS).filter(
          (c) => c !== COLORS.GREY && c !== COLORS.BLACK
        )[Math.floor(Math.random() * 5)],
      },
      levelComplete: false,
      lives: 3, // Reset lives for new level
    });
    
    // Use setTimeout to ensure state has been updated before starting the game loop
    setTimeout(() => {
      if (animationFrameId.current === null) {
        console.log("Starting game loop after level completion");
        animationFrameId.current = requestAnimationFrame(gameLoop);
      }
    }, 50);
  };

  // Handle gesture-based direction changes
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
      <View style={styles.redLine} />
      <View style={styles.rulesContainer}>
        <Text style={[styles.rulesText]}>THREE ATTEMPTS PER LEVEL!</Text>
        <Text style={[styles.rulesText]}>COLLECT FRUIT TO ADVANCE!</Text>
        <Text style={[styles.rulesText]}>HIT BLOCKS - LOSE LIVES!</Text>
        <View style={styles.redLine} />
        <View style={styles.levelGrid}>
          {levels.map((level) => (
            <TouchableOpacity
              key={level.id}
              style={styles.levelCard}
              onPress={() => resetGame(level.id)}
            >
              <Text style={styles.levelCardTitle}>{level.id}</Text>
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

  // Retry screen component when lives are lost
  const RetryScreen = () => {
    return (
      <View style={styles.gameOver}>
        <Text style={[styles.gameOverText, { fontSize: 36 }]}>Life Lost!</Text>
        <Text style={[styles.scoreText, { marginTop: 15, color: COLORS.YELLOW }]}>
          {gameState.lives} {gameState.lives === 1 ? 'Life' : 'Lives'} Remaining
        </Text>
        <Text style={[styles.scoreText, { marginTop: 15 }]}>Level {gameState.level}</Text>
        <TouchableOpacity 
          style={[styles.replayButton, { marginTop: 30, backgroundColor: COLORS.GREEN }]}
          onPress={() => {
            // Reset snake position but keep score and level
            const levelConfig = getLevelById(gameState.level);
            const initialSnake = [
              { x: 2, y: 1 },
              { x: 1, y: 1 },
              { x: 0, y: 1 },
            ];
            
            // Reset the remaining food count in the score tracker
            scoreTracker.current.setLevel(gameState.level);
            
            setGameState(prev => ({
              ...prev,
              snake: initialSnake,
              direction: "RIGHT",
              gameOver: false,
              remainingFood: levelConfig.requiredFood,
              food: {
                ...getRandomPosition(obstacles, initialSnake),
                color: Object.values(COLORS).filter(
                  (c) => c !== COLORS.GREY && c !== COLORS.BLACK
                )[Math.floor(Math.random() * 5)],
              },
              score: prev.levelStartScore, // Reset to start of level score
            }));

            // Restart game loop
            if (animationFrameId.current === null) {
              lastUpdateTime.current = 0;
              animationFrameId.current = requestAnimationFrame(gameLoop);
            }
          }}
        >
          <Text style={[styles.replayText, { color: COLORS.BLACK }]}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Game Over screen component
  const GameOverScreen = () => {
    // Send final scores to React Native app when component mounts
    useEffect(() => {
      // Only send if we're in a WebView environment
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'FINAL_SCORES',
          scores: {
            level: gameState.level,
            totalFruit: gameState.score,
            timestamp: new Date().toISOString()
          }
        }));
      }
    }, []); // Empty dependency array ensures this runs once when game over screen mounts

    return (
      <View style={styles.gameOver}>
        <Text style={styles.gameOverText}>You've Been Eliminated!</Text>
        <Text style={styles.scoreText}>Level {gameState.level} Failed</Text>
        <Text style={[styles.scoreText, { marginTop: 15 }]}>Total Fruit Collected: {gameState.score}</Text>
        <Text style={[styles.scoreText, { color: COLORS.YELLOW, marginTop: 15 }]}>Position: X</Text>
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
  };

  // Level complete screen component
  const LevelCompleteScreen = () => {
    const nextLevel = gameState.level + 1;
    const hasNextLevel = nextLevel <= getLevelCount();
    const nextLevelConfig = hasNextLevel ? getLevelById(nextLevel) : null;
    
    return (
      <View style={styles.levelComplete}>
        <Text style={styles.levelCompleteText}>Level {gameState.level}{"\n"}Complete!</Text>
        <Text style={[styles.scoreText, { color: COLORS.GREEN }]}>Total Fruit: {gameState.score}</Text>
        
        {hasNextLevel ? (
          <>
            <Text style={[styles.rulesText, { marginTop: 20, marginBottom: 20, color: COLORS.GREEN }]}>
              Next Level: Collect {nextLevelConfig?.requiredFood} Fruit
            </Text>
            <TouchableOpacity
              style={styles.nextLevelButton}
              onPress={handleLevelComplete}
            >
              <Text style={styles.nextLevelText}>Start Level {nextLevel}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.replayButton, { marginTop: 20, backgroundColor: COLORS.RED }]}
              onPress={() => {
                setGameState({
                  ...initialState,
                  showRules: true,
                });
              }}
            >
              <Text style={[styles.replayText, { color: COLORS.WHITE }]}>Return to Menu</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={[styles.rulesText, { color: COLORS.GREEN }]}>
              You've Mastered All Levels!
            </Text>
            <Text style={[styles.scoreText, { color: COLORS.GREEN, fontSize: 24 }]}>
              Final Score: {gameState.score}
            </Text>
            <TouchableOpacity
              style={[styles.replayButton, { marginTop: 30, backgroundColor: COLORS.RED }]}
              onPress={() => {
                setGameState({
                  ...initialState,
                  showRules: true,
                });
              }}
            >
              <Text style={[styles.replayText, { color: COLORS.WHITE }]}>Return to Menu</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    );
  };

  // Reset game function with level selection
  const resetGame = (selectedLevel: number = 1) => {
    // Cancel any animation frame
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    
    // Clear any lingering interval as a backup
    if (gameLoopInterval.current) {
      clearInterval(gameLoopInterval.current);
      gameLoopInterval.current = null;
    }
    
    // Reset timer references
    lastUpdateTime.current = 0;
    
    // Get the selected level configuration
    const levelConfig = getLevelById(selectedLevel);
    
    console.log(`Resetting game for level ${selectedLevel} with speed ${levelConfig.getSpeed()}ms`);
    
    // Update the level speed
    setLevelSpeed(levelConfig.getSpeed());
    
    scoreTracker.current.reset(selectedLevel);
    
    // Get obstacles for the selected level
    const levelObstacles = levelConfig.generateObstacles();
    setObstacles(levelObstacles);
    
    // Initial snake position - starting at top left corner
    const initialSnake = [
      { x: 2, y: 1 },  // Head at (2,1)
      { x: 1, y: 1 },  // Body at (1,1)
      { x: 0, y: 1 },  // Tail at (0,1)
    ];
    
    // Make sure food doesn't spawn on obstacles or the snake
    const initialFood = {
      ...getRandomPosition(levelObstacles, initialSnake),
      color: Object.values(COLORS).filter(
        (c) => c !== COLORS.GREY && c !== COLORS.BLACK
      )[Math.floor(Math.random() * 5)],
    };
    
    // First update the game state
    setGameState({
      ...initialState,
      showRules: false, // Ensure rules aren't showing
      level: selectedLevel,
      remainingFood: levelConfig.requiredFood,
      snake: initialSnake,
      food: initialFood,
      lives: 3, // Reset lives
      levelStartScore: 0, // Reset level start score
      score: 0, // Reset score when starting from a new level
    });
    
    // CRITICAL FIX: Force start the game loop after a short delay to ensure state is updated
    setTimeout(() => {
      // Double-check that no animation frame is running
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      
      // Start a new game loop
      console.log(`Explicitly starting game loop for level ${selectedLevel}`);
      lastUpdateTime.current = 0; // Reset time again to be safe
      animationFrameId.current = requestAnimationFrame(gameLoop);
    }, 100); // Slightly longer delay to ensure state updates have processed
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      {gameState.showRules ? (
        <RulesScreen />
      ) : (
        <>
          <View style={styles.headerContainer}>
            <View style={styles.scoreContainer}>
              <View style={styles.levelScoreContainer}>
                <Text style={[styles.scoreLabel, { color: COLORS.YELLOW }]}>L E V E L</Text>
                <View style={styles.levelDisplay}>
                  <Text style={[styles.levelNumber, { color: COLORS.YELLOW }]}>{gameState.level}</Text>
                  <Text style={[styles.levelNumber, { color: COLORS.YELLOW, marginHorizontal: 8 }]}>•</Text>
                  <Text style={[styles.scoreValue, { fontSize: 16 }]}>
                    {gameState.score} pts
                  </Text>
                </View>
              </View>
              <View style={styles.scoreItem}>
                <Text style={[styles.scoreLabel, { color: COLORS.GREEN }]}>TARGET</Text>
                <View style={styles.targetContainer}>
                  <Text style={styles.scoreValue}>{gameState.remainingFood}</Text>
                  <View style={[styles.targetBlock, { backgroundColor: gameState.snakeColor }]} />
                </View>
              </View>
              <View style={styles.scoreItem}>
                <Text style={[styles.scoreLabel, { color: COLORS.RED }]}>LIVES</Text>
                <Text style={[styles.scoreValue, { letterSpacing: 4 }]}>
                  {Array(3).fill('♡').map((heart, index) => (
                    <Text key={index} style={{ color: index < gameState.lives ? COLORS.RED : 'rgba(255,0,0,0.3)' }}>
                      {heart}
                    </Text>
                  ))}
                </Text>
              </View>
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
              {gameState.lives > 0 ? <RetryScreen /> : <GameOverScreen />}
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
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  scoreContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    width: "100%",
  },
  levelScoreContainer: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: 5,
    borderRadius: 4,
    minWidth: 120,
  },
  levelDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelNumber: {
    fontSize: 28,
    fontWeight: "bold",
    fontFamily: "monospace",
    color: COLORS.YELLOW,
    textShadowColor: "rgba(255, 255, 0, 0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  scoreItem: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 100,
  },
  scoreLabel: {
    fontSize: 14,
    fontWeight: "bold",
    fontFamily: "monospace",
    textTransform: "uppercase",
    letterSpacing: 2,
    marginBottom: 4,
  },
  scoreValue: {
    color: COLORS.ORANGE,
    fontSize: 24,
    fontWeight: "bold",
    fontFamily: "monospace",
    textTransform: "uppercase",
    letterSpacing: 2,
    minWidth: 60,
    textAlign: 'center',
  },
  scoreText: {
    color: COLORS.ORANGE,
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: "monospace",
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  levelNameText: {
    color: COLORS.YELLOW,
    fontSize: 22,
    fontWeight: "bold",
    fontFamily: "monospace",
    textTransform: "uppercase",
    letterSpacing: 2,
    marginVertical: 5,
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
    padding: 10,
    paddingTop: "5%",
  },
  rulesTitle: {
    color: COLORS.RED,
    fontSize: 36,
    fontWeight: "bold",
    fontFamily: "monospace",
    textTransform: "uppercase",
    letterSpacing: 3,
    textShadowColor: "rgba(255, 0, 0, 0.75)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 1,
    marginBottom: 10,
    textAlign: "center",
  },
  snakeArt: {
    color: COLORS.GREEN,
    fontSize: 16,
    fontFamily: "monospace",
    marginBottom: 15,
    textAlign: "center",
    textShadowColor: "rgba(0, 255, 0, 0.75)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  rulesContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
    width: "100%",
    paddingHorizontal: 15,
  },
  rulesText: {
    color: COLORS.GREEN,
    fontSize: 18,
    fontFamily: "monospace",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 10,
    textShadowColor: "rgba(0, 255, 0, 0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
    textAlign: "center",
    width: "100%",
  },
  redLine: {
    width: '90%',
    height: 3,
    backgroundColor: COLORS.RED,
    marginVertical: 15,
    alignSelf: 'center',
    shadowColor: COLORS.RED,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 999,
    position: 'relative',
    borderRadius: 1,
  },
  playButton: {
    backgroundColor: COLORS.GREEN,
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 0,
    borderWidth: 3,
    borderColor: "#00FF00",
    borderBottomColor: "#008000",
    borderRightColor: "#008000",
  },
  playButtonText: {
    color: COLORS.BLACK,
    fontSize: 24,
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
    gap: 6,
    marginVertical: 15,
    paddingHorizontal: 8,
  },
  levelCard: {
    backgroundColor: COLORS.ORANGE,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 0,
    borderWidth: 2,
    borderColor: "#FFC04D",
    borderBottomColor: "#CC8400",
    borderRightColor: "#CC8400",
    margin: 3,
  },
  levelCardTitle: {
    color: COLORS.BLACK,
    fontSize: 20,
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
  targetContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 0,
  },
  targetBlock: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.2)",
    marginLeft: -2,
  },
});
