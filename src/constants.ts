import { Dimensions } from "react-native";

// Game grid and size constants
export const GRID_SIZE = 20;
export const CELL_SIZE = Math.floor(Dimensions.get("window").width / GRID_SIZE);
export const GRID_WIDTH = Math.floor(Dimensions.get("window").width / CELL_SIZE);
export const GRID_HEIGHT = Math.floor(
  (Dimensions.get("window").height * 0.8) / CELL_SIZE
);

// Game settings
export const BASE_SPEED = 200; // 200ms between moves
export const TOTAL_LEVELS = 15;

// Colors
export const COLORS = {
  RED: "#FF0000",
  ORANGE: "#FFA500",
  YELLOW: "#FFFF00",
  GREEN: "#00FF00",
  BLUE: "#0000FF",
  GREY: "#808080",
  BLACK: "#000000",
};

// Directions
export const DIRECTIONS = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
}; 