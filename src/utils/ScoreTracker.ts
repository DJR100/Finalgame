import { BASE_SPEED } from '../constants';
import { getLevelById, getLevelCount } from '../data/levels';

// ScoreTracker class to keep score reliably
export default class ScoreTracker {
  private currentScore: number;
  private highScore: number;
  private foodEatenCount: number;
  private currentLevel: number;
  private remainingFoodInLevel: number;
  private totalFoodEaten: number;  // New field to track total food eaten across all levels

  constructor() {
    this.currentScore = 0;
    this.highScore = 0;
    this.foodEatenCount = 0;
    this.currentLevel = 1;
    this.remainingFoodInLevel = getLevelById(1).requiredFood;
    this.totalFoodEaten = 0;  // Initialize total food count
  }

  setLevel(level: number) {
    this.currentLevel = level;
    this.remainingFoodInLevel = getLevelById(level).requiredFood;
    // Don't reset foodEatenCount or totalFoodEaten when changing levels
  }

  incrementFoodEaten() {
    this.foodEatenCount++;
    this.totalFoodEaten++;  // Increment total food count
    this.remainingFoodInLevel--;
    
    // Check if level is complete
    if (this.remainingFoodInLevel === 0 && this.currentLevel < getLevelCount()) {
      return true; // Indicates level complete
    }
    return false;
  }

  advanceToNextLevel() {
    if (this.currentLevel < getLevelCount()) {
      this.currentLevel++;
      this.remainingFoodInLevel = getLevelById(this.currentLevel).requiredFood;
      // Keep the foodEatenCount and totalFoodEaten as is
    }
  }

  getCurrentLevel() {
    return this.currentLevel;
  }

  getRemainingFood() {
    return this.remainingFoodInLevel;
  }

  getSpeedForCurrentLevel() {
    // Return the level-specific speed
    return getLevelById(this.currentLevel).getSpeed();
  }

  getCurrentScore() {
    return this.totalFoodEaten;  // Return total food eaten instead of current level's food
  }

  getHighScore() {
    return this.highScore;
  }

  setScore(score: number) {
    this.totalFoodEaten = score;
    this.foodEatenCount = 0;  // Reset food eaten in current level
    this.remainingFoodInLevel = getLevelById(this.currentLevel).requiredFood;  // Reset remaining food
  }

  reset(selectedLevel: number = 1) {
    // Only reset the level-specific counters
    this.currentLevel = selectedLevel;
    this.remainingFoodInLevel = getLevelById(selectedLevel).requiredFood;
    this.foodEatenCount = 0;
    
    if (selectedLevel === 1) {
      // Only reset total score if starting from level 1
      this.totalFoodEaten = 0;
      this.currentScore = 0;
    }
  }
} 