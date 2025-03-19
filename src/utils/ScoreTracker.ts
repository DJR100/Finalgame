import { BASE_SPEED } from '../constants';
import { getLevelById, getLevelCount } from '../data/levels';

// ScoreTracker class to keep score reliably
export default class ScoreTracker {
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
    this.remainingFoodInLevel = getLevelById(1).requiredFood;
  }

  setLevel(level: number) {
    this.currentLevel = level;
    this.remainingFoodInLevel = getLevelById(level).requiredFood;
  }

  incrementFoodEaten() {
    this.foodEatenCount++;
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