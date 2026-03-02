/**
 * 🔤 FINANÇAS PRO GOLD - TYPOGRAPHY
 * Sistema de tipografia e tamanhos de fonte
 */

export const fontSizes = {
    xs: 10,
    sm: 12,
    base: 14,
    md: 14,
    lg: 16,
    xl: 18,
    '2xl': 20,
    '3xl': 24,
    '4xl': 28,
    '5xl': 32,
    '6xl': 40,
    '7xl': 48,
};

export const fontWeights = {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
};

export const lineHeights = {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
    loose: 2,
};

// Estilos de texto pré-definidos
export const textStyles = {
    // Headings
    h1: {
        fontSize: fontSizes['5xl'],
        fontWeight: fontWeights.bold,
        lineHeight: lineHeights.tight,
    },
    h2: {
        fontSize: fontSizes['4xl'],
        fontWeight: fontWeights.bold,
        lineHeight: lineHeights.tight,
    },
    h3: {
        fontSize: fontSizes['3xl'],
        fontWeight: fontWeights.semibold,
        lineHeight: lineHeights.tight,
    },
    h4: {
        fontSize: fontSizes['2xl'],
        fontWeight: fontWeights.semibold,
        lineHeight: lineHeights.normal,
    },
    h5: {
        fontSize: fontSizes.xl,
        fontWeight: fontWeights.medium,
        lineHeight: lineHeights.normal,
    },
    h6: {
        fontSize: fontSizes.lg,
        fontWeight: fontWeights.medium,
        lineHeight: lineHeights.normal,
    },

    // Body
    bodyLarge: {
        fontSize: fontSizes.lg,
        fontWeight: fontWeights.normal,
        lineHeight: lineHeights.normal,
    },
    body: {
        fontSize: fontSizes.base,
        fontWeight: fontWeights.normal,
        lineHeight: lineHeights.normal,
    },
    bodySmall: {
        fontSize: fontSizes.sm,
        fontWeight: fontWeights.normal,
        lineHeight: lineHeights.normal,
    },

    // Especiais
    caption: {
        fontSize: fontSizes.xs,
        fontWeight: fontWeights.normal,
        lineHeight: lineHeights.normal,
    },
    button: {
        fontSize: fontSizes.base,
        fontWeight: fontWeights.semibold,
        lineHeight: lineHeights.tight,
    },
    label: {
        fontSize: fontSizes.sm,
        fontWeight: fontWeights.medium,
        lineHeight: lineHeights.normal,
    },

    // Valores monetários
    currency: {
        fontSize: fontSizes['4xl'],
        fontWeight: fontWeights.bold,
        lineHeight: lineHeights.tight,
    },
    currencySmall: {
        fontSize: fontSizes.xl,
        fontWeight: fontWeights.semibold,
        lineHeight: lineHeights.tight,
    },
};

export default {
    fontSizes,
    fontWeights,
    lineHeights,
    textStyles,
};
