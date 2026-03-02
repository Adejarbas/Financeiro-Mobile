/**
 * 📏 FINANÇAS PRO GOLD - SPACING & LAYOUT
 * Sistema de espaçamento e dimensões
 */

export const spacing = {
    // Espaçamento base
    xs: 4,
    sm: 8,
    md: 12,
    base: 16,
    lg: 20,
    xl: 24,
    '2xl': 32,
    '3xl': 40,
    '4xl': 48,
    '5xl': 64,

    // Padding específico de componentes
    cardPadding: 16,
    screenPadding: 20,
    modalPadding: 24,
    buttonPadding: 12,

    // Margens
    sectionMargin: 24,
    itemMargin: 12,
};

export const borderRadius = {
    none: 0,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    full: 9999,

    // Específicos
    card: 16,
    button: 12,
    input: 12,
    modal: 20,
    badge: 8,
};

export const shadows = {
    none: {
        shadowColor: 'transparent',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0,
        shadowRadius: 0,
        elevation: 0,
    },
    sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
    },
    lg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 6,
    },
    xl: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 8,
    },
    // Sombra dourada para botões primários
    gold: {
        shadowColor: '#D4AF37',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
};

export const dimensions = {
    // Dimensões de tela
    screenWidth: '100%',
    screenHeight: '100%',

    // Componentes
    buttonHeight: 48,
    buttonHeightSm: 40,
    buttonHeightLg: 56,

    inputHeight: 48,
    inputHeightSm: 40,

    cardMinHeight: 120,

    iconSm: 16,
    iconMd: 20,
    iconLg: 24,
    iconXl: 32,

    avatarSm: 32,
    avatarMd: 40,
    avatarLg: 56,
    avatarXl: 80,

    // FAB (Floating Action Button)
    fabSize: 56,
    fabBottom: 20,
    fabRight: 20,
};

export default {
    spacing,
    borderRadius,
    shadows,
    dimensions,
};
