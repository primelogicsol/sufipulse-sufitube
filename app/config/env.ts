const getEnvVar = (key: string, fallback: string = '') => {
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key] || fallback;
  }
  return fallback;
};

export const ENV = {
  API_URL: getEnvVar('NEXT_PUBLIC_API_URL', 'http://localhost:5000/api'),
  YOUTUBE_API_KEY: getEnvVar('NEXT_PUBLIC_YOUTUBE_API_KEY', ''),
  SUPABASE_URL: getEnvVar('NEXT_PUBLIC_SUPABASE_URL', ''),
  SUPABASE_ANON_KEY: getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY', ''),
} as const;
