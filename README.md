# Mill Probe Studio

[![codecov](https://codecov.io/gh/JerrettDavis/MillProbeStudio/graph/badge.svg?token=U1R3CDU1B0)](https://codecov.io/gh/JerrettDavis/MillProbeStudio)

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

### Release Management

This project uses [semantic-release](https://semantic-release.gitbook.io/) for automated versioning and changelog generation based on [Conventional Commits](https://conventionalcommits.org/).

```bash
# Create a release (dry run)
npm run release:dry-run

# Create a release
npm run release
```

**Commit Message Format:**
- `feat:` - New features (minor version bump)
- `fix:` - Bug fixes (patch version bump)  
- `feat!:` or `BREAKING CHANGE:` - Breaking changes (major version bump)
- `docs:`, `style:`, `refactor:`, `test:`, `chore:` - No version bump

### Deployment

The application is automatically deployed to GitHub Pages when code is pushed to the main branch. The deployment process:

1. Runs all tests and ensures they pass
2. Builds the production bundle
3. Deploys to GitHub Pages
4. Creates releases based on conventional commits

---

