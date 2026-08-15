declare module "react-snake-lib" {
  import type { CSSProperties, FC } from "react";

  export interface SnakeProps {
    width?: string;
    height?: string;
    bgColor?: string;
    borderColor?: string;
    innerBorderColor?: string;
    size?: number;
    snakeColor?: string;
    snakeHeadColor?: string;
    snakeSpeed?: number;
    appleColor?: string;
    borderRadius?: number;
    snakeHeadRadius?: number;
    borderWidth?: number;
    shakeBoard?: boolean;
    boxShadow?: string;
    noWall?: boolean;
    startButtonStyle?: CSSProperties;
    startButtonHoverStyle?: CSSProperties;
    startGameText?: string;
    onGameOver?: () => void;
    onGameStart?: () => void;
    onScoreChange?: (score: number) => void;
  }

  export const Snake: FC<SnakeProps>;
}
