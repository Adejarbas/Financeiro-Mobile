/**
 * 🎨 FINANÇAS PRO GOLD - THEME EXPORT
 * Exportação centralizada do design system
 */

import colors from './colors';
import { spacing, borderRadius, shadows, dimensions } from './spacing';
import { fontSizes, fontWeights, lineHeights, textStyles } from './typography';

export const theme = {
    colors,
    spacing,
    borderRadius,
    shadows,
    dimensions,
    fontSizes,
    fontWeights,
    lineHeights,
    textStyles,
};

export type Theme = typeof theme;

export default theme;
