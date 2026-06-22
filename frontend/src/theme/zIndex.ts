export const zIndex = {
  base: 0,
  dropdown: 10,
  sticky: 20,
  fixed: 30,
  overlay: 40,
  modal: 50,
  drawer: 55,
  popover: 60,
  tooltip: 70,
  toast: 85,
} as const;

export type ThemeZIndex = typeof zIndex;
export default zIndex;
