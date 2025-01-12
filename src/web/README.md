# Identity Matrix Frontend

A modern, enterprise-grade visitor tracking and lead generation platform built with React 18 and TypeScript.

## Overview

Identity Matrix is a web-based platform that helps businesses de-anonymize website traffic and convert visitors into actionable leads. The frontend application provides an intuitive interface for visitor tracking, lead management, and CRM integration.

### Key Features

- Real-time visitor tracking and analytics
- Lead de-anonymization and enrichment
- CRM integration management
- Team collaboration tools
- Dark/light theme support
- Responsive design

## Technology Stack

### Core Dependencies
- React 18.x - Modern UI development
- TypeScript 4.9.x - Type-safe JavaScript
- Redux 4.x - State management
- React Router 6.x - Application routing
- Material UI 5.x - UI component library
- Styled Components 5.x - Component styling

### Supporting Libraries
- Redux Toolkit 1.9.x - Simplified Redux setup
- RTK Query 1.9.x - API data fetching
- React Hook Form 7.x - Form management
- Chart.js 4.x - Data visualization
- Day.js 1.11.x - Date handling
- Socket.io-client 4.x - Real-time updates

### Development Tools
- Vite 4.x - Build tooling
- Jest 29.x - Testing framework
- React Testing Library 13.x - Component testing
- ESLint 8.x - Code linting
- Prettier - Code formatting

## Getting Started

### Prerequisites

- Node.js (v18.x or higher)
- npm (v8.x or higher)
- Git (v2.x or higher)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-org/identity-matrix.git
cd identity-matrix/src/web
```

2. Install dependencies:
```bash
npm install
```

3. Copy environment template:
```bash
cp .env.example .env
```

4. Configure environment variables in `.env`

### Available Scripts

```bash
npm run dev        # Start development server
npm run build      # Build production bundle
npm run preview    # Preview production build
npm run test       # Run test suite
npm run lint       # Run ESLint
npm run format     # Run Prettier
```

## Project Structure

```
src/
├── components/    # Reusable UI components
│   ├── atoms/    # Basic building blocks
│   ├── molecules/# Composite components
│   ├── organisms/# Complex components
│   └── templates/# Page layouts
├── pages/        # Route components
├── store/        # Redux store configuration
├── services/     # API and WebSocket services
├── theme/        # Theme configuration
├── utils/        # Helper functions
└── types/        # TypeScript definitions
```

## Development Guidelines

### Code Style

- Follow TypeScript best practices
- Use functional components with hooks
- Implement proper error boundaries
- Follow atomic design principles
- Document components with JSDoc

### Component Development

- Create reusable, single-responsibility components
- Implement proper prop-types and interfaces
- Follow Material UI theming guidelines
- Ensure accessibility compliance
- Include unit tests

### State Management

- Use Redux for global state
- Implement RTK Query for API calls
- Handle loading and error states
- Implement proper type safety
- Cache API responses appropriately

### Testing Requirements

- Maintain >80% test coverage
- Include unit tests for components
- Test error scenarios
- Mock external dependencies
- Test accessibility compliance

## Theme Configuration

### Color Palette

```typescript
const theme = {
  primary: '#813efb',
  dark: {
    background: '#1a1a1a',
    text: '#ffffff'
  },
  light: {
    background: '#ffffff',
    text: '#000000'
  }
}
```

### Typography

- Headings: Inter
- Body: Roboto
- Code: Fira Code

### Spacing

- Base unit: 8px
- Grid: 12-column system
- Breakpoints:
  - Mobile: 320px
  - Tablet: 768px
  - Desktop: 1024px

## API Integration

### Authentication

- JWT-based authentication
- Token refresh mechanism
- Secure token storage
- Session management

### Real-time Updates

- WebSocket connection for live data
- Automatic reconnection
- Event-based updates
- Connection state management

## Browser Support

- Chrome 83+
- Firefox 78+
- Safari 13+
- Edge 84+
- Mobile Safari iOS 13+
- Chrome Mobile 83+

## Contributing

1. Follow Git branch naming convention
2. Create feature branches from develop
3. Submit PRs with detailed descriptions
4. Ensure all tests pass
5. Follow code review process

## License

Copyright © 2023 Identity Matrix. All rights reserved.