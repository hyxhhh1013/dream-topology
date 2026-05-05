// Application-wide constants

export const APP_NAME = '梦境拓扑';
export const APP_DESCRIPTION = 'AI 驱动的梦境分析与潜意识拓扑平台';

// Navigation
export const NAV_ITEMS = [
  { key: 'capture', label: '捕获', icon: 'Mic' },
  { key: 'topology', label: '拓扑', icon: 'Network' },
  { key: 'insights', label: '洞察', icon: 'BookOpen' },
  { key: 'settings', label: '设置', icon: 'Settings' },
] as const;

// Theme
export const THEME = {
  DARK_BG: '#1C1E21',
  LIGHT_BG: '#F0F2F5',
  ACCENT_COLOR: '#0064E0',
  ACCENT_BLUE: '#007AFF',
} as const;

// Timing
export const TOAST_DURATION = 2500;
export const MOBILE_NAV_VISIBLE_DURATION = 2200;
export const ANIMATION_DURATION = 0.2;

// Breakpoints
export const BREAKPOINTS = {
  MOBILE_MAX_WIDTH: 768,
} as const;

// LocalStorage keys
export const STORAGE_KEYS = {
  ANONYMOUS_USER_ID: 'dream_topology_anonymous_user_id',
  CURRENT_USER: 'dream_topology_current_user',
  AUTH_TOKEN: 'dream_topology_auth_token',
  USERS_DB: 'dream_topology_users',
  THEME: 'dream_topology_theme',
} as const;

// Default values
export const DEFAULTS = {
  TEMPERATURE_FALLBACK: 24.5,
  GEOLOCATION_TIMEOUT: 5000,
} as const;
