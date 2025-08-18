// 🍎 Apple-style тема для Vuetify

// import { ThemeDefinition } from 'vuetify'; // Используем any для совместимости

// Apple цветовая палитра
const appleColors = {
  // Основные цвета Apple
  blue: '#007AFF',
  blueDark: '#0056CC',
  blueLight: '#4DA6FF',
  
  green: '#34C759',
  greenDark: '#248A3D',
  greenLight: '#5DD579',
  
  red: '#FF3B30',
  redDark: '#D70015',
  redLight: '#FF6961',
  
  orange: '#FF9500',
  orangeDark: '#CC7700',
  orangeLight: '#FFB340',
  
  yellow: '#FFCC00',
  yellowDark: '#CC9900',
  yellowLight: '#FFD633',
  
  purple: '#AF52DE',
  purpleDark: '#8B3DBC',
  purpleLight: '#C266E8',
  
  pink: '#FF2D92',
  pinkDark: '#CC0066',
  pinkLight: '#FF5FA8',
  
  indigo: '#5856D6',
  indigoDark: '#3634A3',
  indigoLight: '#7D7AEA',
  
  teal: '#64D2FF',
  tealDark: '#0099CC',
  tealLight: '#8ADDFF',
  
  // Нейтральные цвета
  gray: '#8E8E93',
  gray2: '#AEAEB2',
  gray3: '#C7C7CC',
  gray4: '#D1D1D6',
  gray5: '#E5E5EA',
  gray6: '#F2F2F7',
};

// Светлая тема Apple
export const appleThemeLight: any = {
  dark: false,
  colors: {
    // Основные цвета
    primary: appleColors.blue,
    'primary-darken-1': appleColors.blueDark,
    'primary-lighten-1': appleColors.blueLight,
    
    secondary: appleColors.gray,
    'secondary-darken-1': appleColors.gray2,
    'secondary-lighten-1': appleColors.gray5,
    
    accent: appleColors.purple,
    'accent-darken-1': appleColors.purpleDark,
    'accent-lighten-1': appleColors.purpleLight,
    
    // Семантические цвета
    success: appleColors.green,
    'success-darken-1': appleColors.greenDark,
    'success-lighten-1': appleColors.greenLight,
    
    error: appleColors.red,
    'error-darken-1': appleColors.redDark,
    'error-lighten-1': appleColors.redLight,
    
    warning: appleColors.orange,
    'warning-darken-1': appleColors.orangeDark,
    'warning-lighten-1': appleColors.orangeLight,
    
    info: appleColors.teal,
    'info-darken-1': appleColors.tealDark,
    'info-lighten-1': appleColors.tealLight,
    
    // Фоновые цвета
    background: '#FFFFFF',
    surface: '#FFFFFF',
    'surface-variant': appleColors.gray6,
    'surface-bright': '#FFFFFF',
    'surface-light': appleColors.gray6,
    'surface-dark': appleColors.gray5,
    
    // Текстовые цвета - улучшенная читаемость
    'on-primary': '#FFFFFF',
    'on-secondary': '#1D1D1F',
    'on-accent': '#FFFFFF',
    'on-success': '#FFFFFF',
    'on-error': '#FFFFFF',
    'on-warning': '#FFFFFF',
    'on-info': '#FFFFFF',
    'on-background': '#000000',
    'on-surface': '#1D1D1F',
    'on-surface-variant': '#1D1D1F',
    
    // Дополнительные Apple цвета
    pink: appleColors.pink,
    indigo: appleColors.indigo,
    yellow: appleColors.yellow,
    
    // Границы и разделители
    outline: '#3C3C4329',
    'outline-variant': '#C6C6C8',
  },
};

// Темная тема Apple
export const appleThemeDark: any = {
  dark: true,
  colors: {
    // Основные цвета (более яркие для темной темы)
    primary: appleColors.blueLight,
    'primary-darken-1': appleColors.blue,
    'primary-lighten-1': '#66B2FF',
    
    secondary: appleColors.gray2,
    'secondary-darken-1': appleColors.gray,
    'secondary-lighten-1': appleColors.gray3,
    
    accent: appleColors.purpleLight,
    'accent-darken-1': appleColors.purple,
    'accent-lighten-1': '#D47CF0',
    
    // Семантические цвета
    success: appleColors.greenLight,
    'success-darken-1': appleColors.green,
    'success-lighten-1': '#7DE68A',
    
    error: appleColors.redLight,
    'error-darken-1': appleColors.red,
    'error-lighten-1': '#FF8A80',
    
    warning: appleColors.orangeLight,
    'warning-darken-1': appleColors.orange,
    'warning-lighten-1': '#FFC166',
    
    info: appleColors.tealLight,
    'info-darken-1': appleColors.teal,
    'info-lighten-1': '#99E5FF',
    
    // Фоновые цвета для темной темы
    background: '#000000',
    surface: '#1C1C1E',
    'surface-variant': '#2C2C2E',
    'surface-bright': '#2C2C2E',
    'surface-light': '#1C1C1E',
    'surface-dark': '#000000',
    
    // Текстовые цвета для темной темы
    'on-primary': '#000000',
    'on-secondary': '#FFFFFF',
    'on-accent': '#000000',
    'on-success': '#000000',
    'on-error': '#000000',
    'on-warning': '#000000',
    'on-info': '#000000',
    'on-background': '#FFFFFF',
    'on-surface': '#FFFFFF',
    'on-surface-variant': '#EBEBF5',
    
    // Дополнительные цвета для темной темы
    pink: appleColors.pinkLight,
    indigo: appleColors.indigoLight,
    yellow: appleColors.yellowLight,
    
    // Границы и разделители для темной темы
    outline: '#54545899',
    'outline-variant': '#38383A',
  },
};

// Настройки компонентов в Apple стиле
export const appleComponentDefaults = {
  VBtn: {
    style: [
      {
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
        fontWeight: 600,
        textTransform: 'none',
        letterSpacing: 'normal',
        borderRadius: '12px',
        boxShadow: '0 3px 6px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.23)',
        transition: 'all 0.15s ease-out',
      }
    ],
  },
  VCard: {
    style: [
      {
        borderRadius: '16px',
        border: '1px solid rgba(60, 60, 67, 0.16)',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
        backdropFilter: 'blur(20px)',
      }
    ],
  },
  VTextField: {
    style: [
      {
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
      }
    ],
    variant: 'outlined',
    color: 'primary',
  },
  VNavigationDrawer: {
    style: [
      {
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(60, 60, 67, 0.16)',
      }
    ],
  },
  VAppBar: {
    style: [
      {
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(60, 60, 67, 0.16)',
      }
    ],
  },
  VListItem: {
    style: [
      {
        borderRadius: '12px',
        margin: '2px 12px',
        transition: 'all 0.15s ease-out',
      }
    ],
  },
  VDialog: {
    style: [
      {
        borderRadius: '24px',
        backdropFilter: 'blur(20px)',
      }
    ],
  },
  VSnackbar: {
    style: [
      {
        borderRadius: '12px',
        backdropFilter: 'blur(20px)',
      }
    ],
  },
};

// Утилитарные функции
export const appleUtils = {
  // Генерация градиента в стиле Apple
  generateGradient: (color1: string, color2: string, angle = 135) => {
    return `linear-gradient(${angle}deg, ${color1} 0%, ${color2} 100%)`;
  },
  
  // Apple-style тень
  appleShadow: (level: 1 | 2 | 3 | 4 | 5) => {
    const shadows = {
      1: '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
      2: '0 3px 6px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.23)',
      3: '0 10px 20px rgba(0, 0, 0, 0.19), 0 6px 6px rgba(0, 0, 0, 0.23)',
      4: '0 14px 28px rgba(0, 0, 0, 0.25), 0 10px 10px rgba(0, 0, 0, 0.22)',
      5: '0 19px 38px rgba(0, 0, 0, 0.30), 0 15px 12px rgba(0, 0, 0, 0.22)',
    };
    return shadows[level];
  },
  
  // Apple-style размытие
  appleBlur: (level: 'light' | 'medium' | 'heavy') => {
    const blurs = {
      light: 'blur(20px)',
      medium: 'blur(40px)',
      heavy: 'blur(60px)',
    };
    return blurs[level];
  },
  
  // Проверка поддержки backdrop-filter
  supportsBackdropFilter: () => {
    return CSS.supports('backdrop-filter', 'blur(1px)') || 
           CSS.supports('-webkit-backdrop-filter', 'blur(1px)');
  },
  
  // Адаптивный blur с fallback
  adaptiveBlur: (fallbackBg: string) => {
    if (appleUtils.supportsBackdropFilter()) {
      return {
        backdropFilter: 'blur(20px)',
        background: 'rgba(255, 255, 255, 0.8)',
      };
    } else {
      return {
        background: fallbackBg,
      };
    }
  },
};

export default {
  light: appleThemeLight,
  dark: appleThemeDark,
  components: appleComponentDefaults,
  utils: appleUtils,
};
