declare global {
  interface Window {
    env: {
      [key: string]: string;
    };
  }
}

export const useEnvVar = (key: string): string => {
  if (import.meta.env.MODE === 'development') {
    return import.meta.env[key] || '';
  }

  if (typeof window !== 'undefined' && window.env && window.env[key]) {
    return window.env[key];
  }

  return import.meta.env[key] || '';
};