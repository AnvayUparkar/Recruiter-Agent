import { colors } from "./colors";
import { spacing } from "./spacing";
import { typography } from "./typography";
import { shadows } from "./shadows";
import { radii } from "./radii";
import { zIndex } from "./zIndex";
import { motion } from "./motion";

export const themeTokens = {
  colors,
  spacing,
  typography,
  shadows,
  radii,
  zIndex,
  motion,
} as const;

export type ThemeTokens = typeof themeTokens;
export default themeTokens;
