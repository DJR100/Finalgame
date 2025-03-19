import { BASE_SPEED } from '../constants';
import { getLevelById, getLevelCount } from '../data/levels';

// ScoreTracker class to keep score reliably
export default class ScoreTracker {
  private currentScore: number;
  private highScore: number;
  private foodEatenCount: number;
  private currentLevel: number;
  private remainingFoodInLevel: number;
  private totalFoodEaten: number;
  private baseLevelScore: number;  // Track the minimum score required to reach current level
  private currentAttemptScore: number;  // Track fruit eaten in current attempt

  constructor() {
    this.currentScore = 0;
    this.highScore = 0;
    this.foodEatenCount = 0;
    this.currentLevel = 1;
    this.remainingFoodInLevel = getLevelById(1).requiredFood;
    this.totalFoodEaten = 0;
    this.baseLevelScore = 0;
    this.currentAttemptScore = 0;
  }

  setLevel(level: number) {
    this.currentLevel = level;
    this.remainingFoodInLevel = getLevelById(level).requiredFood;
    this.foodEatenCount = 0;
    this.baseLevelScore = this.getMinimumScoreForLevel(level);
    this.currentAttemptScore = 0;
    this.totalFoodEaten = this.baseLevelScore;  // Reset to base score for this level
  }

  incrementFoodEaten() {
    this.foodEatenCount++;
    this.currentAttemptScore++;
    this.totalFoodEaten = this.baseLevelScore + this.currentAttemptScore;
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
      this.foodEatenCount = 0;
      this.baseLevelScore = this.totalFoodEaten;  // New base score includes all fruit eaten
      this.currentAttemptScore = 0;
    }
  }

  getCurrentLevel() {
    return this.currentLevel;
  }

  getRemainingFood() {
    return this.remainingFoodInLevel;
  }

  getSpeedForCurrentLevel() {
    return getLevelById(this.currentLevel).getSpeed();
  }

  getCurrentScore() {
    return this.totalFoodEaten;
  }

  getHighScore() {
    return this.highScore;
  }

  // Get the score for the current attempt (used for game over)
  getCurrentAttemptScore() {
    return this.currentAttemptScore;
  }

  // Get the base score for the current level
  getBaseLevelScore() {
    return this.baseLevelScore;
  }

  setScore(score: number) {
    // Reset to the base score for current level
    this.totalFoodEaten = this.baseLevelScore;
    this.currentAttemptScore = 0;
    this.foodEatenCount = 0;
    this.remainingFoodInLevel = getLevelById(this.currentLevel).requiredFood;
  }

  reset(selectedLevel: number = 1) {
    this.currentLevel = selectedLevel;
    this.remainingFoodInLevel = getLevelById(selectedLevel).requiredFood;
    this.foodEatenCount = 0;
    this.baseLevelScore = this.getMinimumScoreForLevel(selectedLevel);
    this.currentAttemptScore = 0;
    this.totalFoodEaten = this.baseLevelScore;
  }

  // Helper method to calculate minimum score required to reach a level
  private getMinimumScoreForLevel(level: number): number {
    let minimumScore = 0;
    for (let i = 1; i < level; i++) {
      minimumScore += getLevelById(i).requiredFood;
    }
    return minimumScore;
  }
} 