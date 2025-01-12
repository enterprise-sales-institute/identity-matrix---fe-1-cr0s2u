import { createGlobalStyle } from 'styled-components'; // v5.x
import { normalize } from 'styled-normalize'; // v8.x
import { colors, typography } from './variables.styles';
import { headingStyles, bodyStyles, codeStyles } from './typography.styles';

/**
 * Creates optimized @font-face declarations for required fonts
 * Implements font-display: swap for performance
 */
const createFontFaces = () => `
  /* Inter for headings - v3.19 */
  @font-face {
    font-family: 'Inter';
    font-style: normal;
    font-weight: 400;
    font-display: swap;
    src: url('/fonts/inter-v3-latin-regular.woff2') format('woff2'),
         url('/fonts/inter-v3-latin-regular.woff') format('woff');
    unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
  }
  @font-face {
    font-family: 'Inter';
    font-style: normal;
    font-weight: 600;
    font-display: swap;
    src: url('/fonts/inter-v3-latin-600.woff2') format('woff2'),
         url('/fonts/inter-v3-latin-600.woff') format('woff');
    unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
  }
  @font-face {
    font-family: 'Inter';
    font-style: normal;
    font-weight: 700;
    font-display: swap;
    src: url('/fonts/inter-v3-latin-700.woff2') format('woff2'),
         url('/fonts/inter-v3-latin-700.woff') format('woff');
    unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
  }

  /* Roboto for body text - v27 */
  @font-face {
    font-family: 'Roboto';
    font-style: normal;
    font-weight: 400;
    font-display: swap;
    src: url('/fonts/roboto-v27-latin-regular.woff2') format('woff2'),
         url('/fonts/roboto-v27-latin-regular.woff') format('woff');
    unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
  }

  /* Fira Code for code blocks - v5 */
  @font-face {
    font-family: 'Fira Code';
    font-style: normal;
    font-weight: 400;
    font-display: swap;
    src: url('/fonts/fira-code-v5-latin-regular.woff2') format('woff2'),
         url('/fonts/fira-code-v5-latin-regular.woff') format('woff');
    unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
  }
`;

const GlobalStyles = createGlobalStyle`
  ${normalize}
  ${createFontFaces()}

  :root {
    /* Theme-aware color variables */
    --color-primary: ${colors.primary};
    --color-background: ${colors.background.light};
    --color-text: ${colors.text.light};
    --color-border: ${colors.border.light};
    --color-input: ${colors.inputBackground.light};
    --color-hover: ${colors.hover.light};

    /* Typography variables */
    --font-heading: ${typography.fontFamilyHeading};
    --font-body: ${typography.fontFamilyBody};
    --font-code: ${typography.fontFamilyCode};
  }

  /* Dark theme overrides */
  [data-theme='dark'] {
    --color-background: ${colors.background.dark};
    --color-text: ${colors.text.dark};
    --color-border: ${colors.border.dark};
    --color-input: ${colors.inputBackground.dark};
    --color-hover: ${colors.hover.dark};
  }

  /* Base HTML element styles */
  html {
    box-sizing: border-box;
    font-size: 16px;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-size-adjust: 100%;
    scroll-behavior: smooth;
  }

  *, *::before, *::after {
    box-sizing: inherit;
    margin: 0;
    padding: 0;
  }

  body {
    ${bodyStyles.regular}
    background-color: var(--color-background);
    color: var(--color-text);
    transition: background-color 0.3s ease, color 0.3s ease;
    min-height: 100vh;
    overflow-x: hidden;
  }

  /* Typography styles */
  h1 { ${headingStyles.h1} }
  h2 { ${headingStyles.h2} }
  h3 { ${headingStyles.h3} }
  h4 { ${headingStyles.h4} }

  p { 
    margin-bottom: 1rem;
    max-width: 70ch;
  }

  code {
    ${codeStyles.inline}
  }

  pre code {
    ${codeStyles.block}
  }

  /* Link styles */
  a {
    color: var(--color-primary);
    text-decoration: none;
    transition: color 0.2s ease;

    &:hover {
      color: var(--color-hover);
    }
  }

  /* Focus styles for accessibility */
  :focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }

  /* Selection styles */
  ::selection {
    background-color: var(--color-primary);
    color: #ffffff;
  }

  /* Print styles */
  @media print {
    body {
      background: white;
      color: black;
    }

    a {
      color: black;
      text-decoration: underline;
    }

    @page {
      margin: 2cm;
    }
  }

  /* Reduced motion preferences */
  @media (prefers-reduced-motion: reduce) {
    * {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }
`;

export default GlobalStyles;