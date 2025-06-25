# Mill Probe Studio

A React + TypeScript + Vite application for managing CNC mill probe sequences and G-code generation.

## Features

- **Probe Sequence Management**: Define and configure multi-axis probe operations
- **G-code Import/Export**: Parse existing G-code and generate new probe sequences
- **Comment Extraction**: Automatically use G-code comments for move descriptions
- **Machine Settings**: Configure probe parameters, feeds, speeds, and coordinates
- **Sequence Visualization**: Preview probe operations before execution

## Development

### Prerequisites

- Node.js 18+ 
- npm 9+

### Installation

```bash
npm install
```

### Development Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run linting
npm run lint

# Preview production build
npm run preview
```

### Testing

This project uses Vitest for testing with comprehensive coverage reporting.

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage

# Open coverage report in browser
npm run coverage:open

# Clean coverage files
npm run coverage:clean
```

### Test Coverage

Current coverage status:

- **Utils**: 98.75% (G-code parser and generator)
- **Components**: 38.76% (UI components)
- **Overall**: 46.54%

Coverage thresholds are set at 80% for:
- Lines
- Functions  
- Branches
- Statements

For detailed coverage information, see [COVERAGE.md](./COVERAGE.md).

### Project Structure

```
src/
├── components/          # React components
│   ├── __tests__/      # Component tests
│   └── ui/             # UI component library
├── utils/              # Utility functions
│   ├── __tests__/      # Utility tests
│   ├── gcodeParser.ts  # G-code parsing logic
│   └── gcodeGenerator.ts # G-code generation
├── types/              # TypeScript type definitions
└── lib/                # Shared utilities
```

### Key Technologies

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Vitest** - Testing framework with coverage
- **TailwindCSS** - Styling
- **Radix UI** - Accessible component primitives
- **React Testing Library** - Component testing

---

## Original Vite Template Information

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

### Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config({
  extends: [
    // Remove ...tseslint.configs.recommended and replace with this
    ...tseslint.configs.recommendedTypeChecked,
    // Alternatively, use this for stricter rules
    ...tseslint.configs.strictTypeChecked,
    // Optionally, add this for stylistic rules
    ...tseslint.configs.stylisticTypeChecked,
  ],
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config({
  plugins: {
    // Add the react-x and react-dom plugins
    'react-x': reactX,
    'react-dom': reactDom,
  },
  rules: {
    // other rules...
    // Enable its recommended typescript rules
    ...reactX.configs['recommended-typescript'].rules,
    ...reactDom.configs.recommended.rules,
  },
})
```
