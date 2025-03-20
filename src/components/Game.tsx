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
  showLevelSelection: false,
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
  const [highestAchievedScore, setHighestAchievedScore] = useState(0);
  const [currentSessionHighScore, setCurrentSessionHighScore] = useState(0);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]); // Start with empty obstacles
  const [levelSpeed, setLevelSpeed] = useState(BASE_SPEED); // Track the current level's speed
  const gameLoopInterval = useRef<NodeJS.Timeout | null>(null);
  const scoreTracker = useRef(new ScoreTracker());

  // Track the last time we updated the game state
  const lastUpdateTime = useRef(0);
  const animationFrameId = useRef<number | null>(null);

  // Add a state variable to track if we're in a replay mode (scores not counted)
  const [isReplayMode, setIsReplayMode] = useState(false);

  // Add state variable to track if user has completed their first playthrough
  const [hasCompletedPlaythrough, setHasCompletedPlaythrough] = useState(false);

  // Add loading state to the component
  const [isLoading, setIsLoading] = useState(false);

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

        // Practice mode (replay) - just show game over screen and let user choose
        if (isReplayMode) {
        return {
            ...currentGameState,
          snake: newSnake,
            gameOver: true,
          };
        }
        
        // Normal mode - handle lives
        const newLives = currentGameState.lives - 1;
        const isGameOver = newLives <= 0;

        // On final game over, calculate true final score (base + current attempt)
        if (isGameOver && !isReplayMode) {
          const baseScore = scoreTracker.current.getBaseLevelScore();
          const finalAttemptScore = scoreTracker.current.getCurrentAttemptScore();
          const finalScore = baseScore + finalAttemptScore;
          setCurrentSessionHighScore(finalScore);
        } else {
          // Reset score to base level score if not game over
          scoreTracker.current.setScore(currentGameState.levelStartScore);
        }

        return {
          ...currentGameState,
          snake: newSnake,
          gameOver: true,
          lives: newLives,
          score: isGameOver ? 
            (isReplayMode ? 0 : scoreTracker.current.getBaseLevelScore() + scoreTracker.current.getCurrentAttemptScore()) : 
            scoreTracker.current.getBaseLevelScore()
        };
      }

      // Check if food is eaten
      if (head.x === currentGameState.food.x && head.y === currentGameState.food.y) {
        const levelComplete = scoreTracker.current.incrementFoodEaten();
        const remainingFood = scoreTracker.current.getRemainingFood();
        const newScore = scoreTracker.current.getCurrentScore();

        // Handle level completion
        if (levelComplete) {
          // Update session high score only when completing a level
          setCurrentSessionHighScore(newScore);
          
          return {
            ...currentGameState,
            snake: newSnake,
            snakeColor: currentGameState.food.color,
            levelComplete: true,
            score: newScore,
            remainingFood: 0,
            lives: 3,
            levelStartScore: newScore,
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
          score: newScore,
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

  // Start screen component
  const StartScreen = () => {
    return (
      <View style={styles.startScreen}>
        <Text style={styles.gameTitle}>LevelUp</Text>
      <Text style={styles.snakeArt}>
        {"    ┌──┐     \n"}
        {"    │··│     \n"}
        {"    └┐ │     \n"}
        {"     │ │     \n"}
        {"     │ └┐    \n"}
        {"     └─ ┘    \n"}
      </Text>
        <Text style={[styles.rulesText, { color: COLORS.GREEN, marginTop: 10 }]}>15 levels to beat!</Text>
        <Text style={styles.rulesText}>
          Swipe to Move the Snake
        </Text>
        <Text style={styles.rulesText}>
          Collect Fruit to Advance
        </Text>
        <Text style={styles.rulesText}>
          Avoid hitting Obstacles
        </Text>
        
        <TouchableOpacity
          style={[styles.startButton, { marginTop: 30 }]}
          onPress={() => {
            // Start a new game from level 1
            resetGame(1);
            // Ensure we're not in replay mode
            setIsReplayMode(false);
          }}
        >
          <Text style={styles.startButtonText}>Start from Level 1</Text>
        </TouchableOpacity>
      </View>
    );
  };

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
            // Reset snake position but keep score
            const levelConfig = getLevelById(gameState.level);
            const initialSnake = [
              { x: 2, y: 1 },
              { x: 1, y: 1 },
              { x: 0, y: 1 },
            ];
            
            // Reset only the remaining food count in the score tracker
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
              // Keep the current score instead of resetting to levelStartScore
              score: scoreTracker.current.getCurrentScore(),
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

  // Level Selection Screen for replays
  const LevelSelectionScreen = () => {
    // Simple array of level numbers
    const levelNumbers = Array.from({ length: 15 }, (_, i) => i + 1);

    const startLevel = (levelId: number) => {
      // First, properly cancel any ongoing animations
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }
      
      // Clear any lingering intervals
      if (gameLoopInterval.current) {
        clearInterval(gameLoopInterval.current);
        gameLoopInterval.current = null;
      }
      
      // Set replay mode
      setIsReplayMode(true);
      
      // Use a simple timeout to ensure state is updated before game starts
      setTimeout(() => {
        // Move directly to selected level
        const levelConfig = getLevelById(levelId);
        const levelObstacles = levelConfig.generateObstacles();
        
        // Set obstacles directly
        setObstacles(levelObstacles);
        
        // Set level speed
        setLevelSpeed(levelConfig.getSpeed());
        
        // Reset the score tracker
        scoreTracker.current.reset(levelId);
        
        // Initial snake position
        const initialSnake = [
          { x: 2, y: 1 },
          { x: 1, y: 1 },
          { x: 0, y: 1 },
        ];
        
        // Set game state
        setGameState({
          ...initialState,
          showRules: false,
          showLevelSelection: false,
          level: levelId,
          remainingFood: levelConfig.requiredFood,
          score: 0,
          levelStartScore: 0,
          snake: initialSnake,
          food: { 
            ...getRandomPosition(levelObstacles, initialSnake),
            color: Object.values(COLORS).filter(
              (c) => c !== COLORS.GREY && c !== COLORS.BLACK
            )[Math.floor(Math.random() * 5)],
          },
          lives: 3,
        });
        
        // Start game loop with a delay to ensure state is updated
        setTimeout(() => {
          // Double check animation frame is null
          if (animationFrameId.current) {
            cancelAnimationFrame(animationFrameId.current);
            animationFrameId.current = null;
          }
          
          console.log(`Starting game loop for level ${levelId}`);
          lastUpdateTime.current = 0;
          animationFrameId.current = requestAnimationFrame(gameLoop);
        }, 50);
      }, 10);
    };

    return (
      <View style={styles.levelSelection}>
        <Text style={styles.levelSelectionTitle}>Select Level</Text>
        <Text style={[styles.practiceText]}>Practice Mode - Scores Not Recorded</Text>
        
        <View style={styles.levelGrid}>
          {levelNumbers.map((levelId) => (
            <TouchableOpacity
              key={levelId}
              style={styles.levelCard}
              activeOpacity={0.5}
              onPress={() => startLevel(levelId)}
            >
              <Text style={styles.levelCardText}>{levelId}</Text>
            </TouchableOpacity>
          ))}
        </View>
        
        {!hasCompletedPlaythrough && (
          <TouchableOpacity 
          style={[
              styles.replayButton, 
              { marginTop: 30, backgroundColor: COLORS.GREEN }
            ]}
            activeOpacity={0.7}
            onPress={() => {
              // Cancel any existing animation frames
              if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
                animationFrameId.current = null;
              }
              // Go back to start screen only if user hasn't completed a playthrough
              setGameState({
                ...initialState,
                showRules: true,
              });
              // Reset replay mode for a potential new game
              setIsReplayMode(false);
            }}
          >
            <Text style={[styles.replayText, { color: COLORS.BLACK }]}>Return to Start</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // Level complete screen component
  const LevelCompleteScreen = () => {
    const nextLevel = gameState.level + 1;
    const hasNextLevel = nextLevel <= getLevelCount();
    const nextLevelConfig = hasNextLevel ? getLevelById(nextLevel) : null;

  return (
      <View style={styles.levelCompleteOverlay}>
        <View style={styles.levelComplete}>
          <Text style={styles.levelCompleteText}>Level Complete</Text>
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
                <Text style={[styles.replayText, { color: COLORS.WHITE }]}>Return Home</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    );
  };

  // Game Over screen component
  const GameOverScreen = () => {
    useEffect(() => {
      if (window.ReactNativeWebView && !isReplayMode) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'FINAL_SCORES',
          scores: {
            level: gameState.level,
            totalFruit: currentSessionHighScore,
            timestamp: new Date().toISOString()
          }
        }));
      }
      
      // Set that user has completed a playthrough
      setHasCompletedPlaythrough(true);
    }, []);

    return (
      <View style={styles.gameOver}>
        <Text style={styles.gameOverText}>You've Been Eliminated!</Text>
        <Text style={styles.scoreText}>Level {gameState.level} Failed</Text>
        <Text style={[styles.scoreText, { marginTop: 15 }]}>Total Fruit Collected: {currentSessionHighScore}</Text>
        <TouchableOpacity 
          style={[styles.replayButton, { marginTop: 30, backgroundColor: COLORS.RED }]}
          onPress={() => {
            setGameState({
              ...initialState,
              showLevelSelection: true,
              showRules: false,
            });
            setIsReplayMode(true);
          }}
        >
          <Text style={[styles.replayText, { color: COLORS.WHITE }]}>Home</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Reset game function with level selection - simplify to be more direct
  const resetGame = (selectedLevel: number = 1) => {
    console.log(`Starting resetGame for level ${selectedLevel}`);
    
    // Cancel any existing animation frames (again, for safety)
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
    
    // Reset the score tracker
    scoreTracker.current.reset(selectedLevel);
    
    // Get the level configuration
    const levelConfig = getLevelById(selectedLevel);
    
    // Get obstacles for the selected level
    const levelObstacles = levelConfig.generateObstacles();
    setObstacles(levelObstacles);
    
    // Set level speed
    setLevelSpeed(levelConfig.getSpeed());
    
    // Initial snake position
    const initialSnake = [
      { x: 2, y: 1 },
      { x: 1, y: 1 },
      { x: 0, y: 1 },
    ];
    
    console.log(`Setting game state for level ${selectedLevel}`);
    // Reset game state
    setGameState({
      ...initialState,
      showRules: false,
      showLevelSelection: false,
      level: selectedLevel,
      remainingFood: levelConfig.requiredFood,
      score: isReplayMode ? 0 : (selectedLevel > 1 ? scoreTracker.current.getBaseLevelScore() : 0),
      levelStartScore: isReplayMode ? 0 : (selectedLevel > 1 ? scoreTracker.current.getBaseLevelScore() : 0),
      snake: initialSnake,
      food: { 
        ...getRandomPosition(levelObstacles, initialSnake),
        color: Object.values(COLORS).filter(
          (c) => c !== COLORS.GREY && c !== COLORS.BLACK
        )[Math.floor(Math.random() * 5)],
      },
      lives: 3,
    });
    
    setCurrentSessionHighScore(0); // Reset session high score
    
    console.log(`Starting game loop for level ${selectedLevel}`);
    // Start the game loop
    setTimeout(() => {
      if (animationFrameId.current === null) {
        console.log(`Animation frame starting for level ${selectedLevel}`);
        lastUpdateTime.current = 0;
        animationFrameId.current = requestAnimationFrame(gameLoop);
      }
    }, 100);
  };

  // Add a dedicated function to return to level selection
  const returnToLevelSelection = () => {
    console.log("Returning to level selection screen");
    
    // Cancel any existing animation frames
    if (animationFrameId.current) {
      console.log("Cancelling animation frame before return to level selection");
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
    
    // Clear all game state properly
    setGameState({
      ...initialState,
      showLevelSelection: true,
      showRules: false,
    });
    
    // Ensure replay mode is set
    setIsReplayMode(true);
    
    // Reset obstacles to empty to avoid stale state
    setObstacles([]);
  };

  // Add a header component with a home button for practice mode
  const GameHeader = () => (
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
        {isReplayMode ? (
          <TouchableOpacity 
            style={styles.homeButton}
            onPress={returnToLevelSelection}
          >
            <Text style={[styles.homeButtonText]}>Home</Text>
          </TouchableOpacity>
        ) : (
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
        )}
      </View>
    </View>
  );

  // Add PracticeRetryScreen for replay mode
  const PracticeRetryScreen = () => {
    return (
      <View style={styles.gameOver}>
        <Text style={[styles.gameOverText, { fontSize: 36 }]}>Try Again!</Text>
        <Text style={[styles.scoreText, { marginTop: 15 }]}>Level {gameState.level}</Text>
        <View style={styles.practiceButtonsContainer}>
          <TouchableOpacity 
            style={[styles.replayButton, { backgroundColor: COLORS.GREEN }]}
            onPress={() => {
              // Retry the same level
              resetGame(gameState.level);
            }}
          >
            <Text style={[styles.replayText, { color: COLORS.BLACK }]}>Retry Level</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.replayButton, { backgroundColor: COLORS.RED, marginTop: 15 }]}
            onPress={returnToLevelSelection}
          >
            <Text style={[styles.replayText, { color: COLORS.WHITE }]}>Level Selection</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      {gameState.showRules && !hasCompletedPlaythrough ? (
        <StartScreen />
      ) : gameState.showLevelSelection || (gameState.showRules && hasCompletedPlaythrough) ? (
        <LevelSelectionScreen />
      ) : (
        <>
          <GameHeader />
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
          {gameState.gameOver && !isReplayMode && gameState.lives > 0 && <RetryScreen />}
          {gameState.gameOver && !isReplayMode && gameState.lives <= 0 && <GameOverScreen />}
          {gameState.gameOver && isReplayMode && <PracticeRetryScreen />}
          {gameState.levelComplete && <LevelCompleteScreen />}
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
    fontSize: 16,
    fontFamily: "monospace",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    textAlign: "center",
    width: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingVertical: 3,
    paddingHorizontal: 5,
    borderRadius: 2,
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
    flex: 0,
    width: '90%',
    maxWidth: 400,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.BLACK,
    padding: 20,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: COLORS.RED,
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
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 12,
    marginTop: 10,
    marginBottom: 10,
    width: "100%",
    maxWidth: 350,
  },
  levelCard: {
    width: 50,
    height: 50,
    backgroundColor: COLORS.YELLOW,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 5,
    borderWidth: 2,
    borderColor: "#FFD700",
    borderBottomColor: "#B8860B",
    borderRightColor: "#B8860B",
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
  startScreen: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    backgroundColor: COLORS.BLACK,
    padding: 10,
    paddingTop: "5%",
  },
  gameTitle: {
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
  startButton: {
    backgroundColor: COLORS.GREEN,
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 0,
    borderWidth: 3,
    borderColor: "#00FF00",
    borderBottomColor: "#008000",
    borderRightColor: "#008000",
  },
  startButtonText: {
    color: COLORS.BLACK,
    fontSize: 24,
    fontWeight: "bold",
    fontFamily: "monospace",
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  levelSelection: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    backgroundColor: COLORS.BLACK,
    padding: 10,
    paddingTop: "5%",
  },
  levelSelectionTitle: {
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
  levelCardText: {
    color: COLORS.BLACK,
    fontSize: 20,
    fontWeight: "bold",
    fontFamily: "monospace",
  },
  levelCompleteOverlay: {
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
  practiceText: {
    color: COLORS.RED,
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: "monospace",
    textAlign: "center",
    marginBottom: 20,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 3,
    textShadowColor: "rgba(0, 0, 0, 1)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  homeButton: {
    backgroundColor: COLORS.RED,
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: "#FF0000",
    borderBottomColor: "#800000",
    borderRightColor: "#800000",
    alignItems: "center",
    justifyContent: "center",
  },
  homeButtonText: {
    color: COLORS.WHITE,
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: "monospace",
    textTransform: "uppercase",
  },
  practiceButtonsContainer: {
    marginTop: 20,
    alignItems: "center",
    justifyContent: "center",
    width: "80%",
    maxWidth: 300,
  },
  levelCardDisabled: {
    opacity: 0.6,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 5,
  },
});
