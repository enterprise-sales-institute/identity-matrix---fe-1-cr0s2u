/// <reference types="vite/client" />

/**
 * Type definitions for environment variables used in the Identity Matrix web application
 * @version Vite 4.3.9
 */
interface ImportMetaEnv {
  /** Base API URL for backend services */
  readonly VITE_API_URL: string;
  
  /** WebSocket URL for real-time updates */
  readonly VITE_WS_URL: string;
  
  /** Current application environment */
  readonly VITE_APP_ENV: 'development' | 'staging' | 'production';
  
  /** Vite mode (development/production) */
  readonly MODE: string;
  
  /** Base URL for the application */
  readonly BASE_URL: string;
  
  /** Flag indicating production mode */
  readonly PROD: boolean;
  
  /** Flag indicating development mode */
  readonly DEV: boolean;
  
  /** Flag indicating server-side rendering */
  readonly SSR: boolean;
}

/**
 * Augment the ImportMeta interface to include env
 */
interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/**
 * Type declarations for static asset imports
 */
declare module '*.svg' {
  const content: string;
  export default content;
}

declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.jpg' {
  const content: string;
  export default content;
}

declare module '*.jpeg' {
  const content: string;
  export default content;
}

declare module '*.gif' {
  const content: string;
  export default content;
}

declare module '*.webp' {
  const content: string;
  export default content;
}

declare module '*.ico' {
  const content: string;
  export default content;
}

declare module '*.woff' {
  const content: string;
  export default content;
}

declare module '*.woff2' {
  const content: string;
  export default content;
}

declare module '*.ttf' {
  const content: string;
  export default content;
}

declare module '*.eot' {
  const content: string;
  export default content;
}