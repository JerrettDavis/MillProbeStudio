# Mill Probe Studio

[![codecov](https://codecov.io/gh/JerrettDavis/MillProbeStudio/graph/badge.svg?token=U1R3CDU1B0)](https://codecov.io/gh/JerrettDavis/MillProbeStudio)
[![CI/CD](https://github.com/JerrettDavis/MillProbeStudio/workflows/CI%2FCD/badge.svg)](https://github.com/JerrettDavis/MillProbeStudio/actions)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://reactjs.org/)
[![License](https://img.shields.io/badge/License-PolyForm%20Noncommercial-blue.svg)](LICENSE.md)

**A modern web application for creating, managing, and visualizing CNC mill probe sequences with intelligent G-code generation.**

Mill Probe Studio is a comprehensive tool designed for CNC machinists and engineers to streamline the probing workflow. Create precise probe sequences with visual feedback, import existing G-code for analysis, and generate optimized probe routines with automatic comment extraction and intelligent movement planning.

![Mill Probe Studio Screenshot](https://raw.githubusercontent.com/JerrettDavis/MillProbeStudio/refs/heads/main/public/visualization_ss.png)

## 🎯 **Key Features**

- **📐 Probe Sequence Management**: Define and configure multi-axis probe operations with precision
- **📄 G-code Import/Export**: Parse existing G-code and generate new probe sequences
- **💬 Intelligent Comment Extraction**: Automatically use G-code comments for move descriptions
- **⚙️ Machine Settings**: Configure probe parameters, feeds, speeds, and coordinate systems
- **🎨 3D Visualization**: Preview probe operations in an interactive 3D environment
- **🔄 Real-time Updates**: See changes instantly with live sequence visualization
- **🎯 Precision Control**: Fine-tune probe positions with sub-millimeter accuracy
- **📊 Analytics Dashboard**: Monitor probe sequence efficiency and optimization

## 🚀 **Quick Start**

### Online Demo
Try Mill Probe Studio instantly in your browser:
**[🔗 Live Demo](https://jerrettdavis.github.io/MillProbeStudio/)**

### Local Development

#### Prerequisites

- **Node.js** 18+ 
- **npm** 9+
- Modern browser with WebGL support

#### Installation

```bash
# Clone the repository
git clone https://github.com/JerrettDavis/MillProbeStudio.git
cd MillProbeStudio

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) to view the application.

## 📖 **Usage Examples**

### Creating a Basic Probe Sequence

1. **Configure Machine Settings**: Set your machine's coordinate system and probe parameters
2. **Define Probe Operations**: Add probe points with specific coordinates and descriptions
3. **Visualize**: Use the 3D viewer to verify probe positions and paths
4. **Generate G-code**: Export optimized G-code ready for your CNC machine

### Importing Existing G-code

```gcode
G0 X-50 Y-75 Z-10 (Move to first probe position)
G31 Z-25 F100 (Probe down to surface)
G0 Z-10 (Retract probe)
```

The application automatically extracts comments and converts them into meaningful operation descriptions.

## 🛠️ **Development**

### Development Scripts

```bash
# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Run linting and fix issues
npm run lint

# Preview production build locally
npm run preview
```

### Testing

This project uses **Vitest** for testing with comprehensive coverage reporting.

```bash
# Run all tests
npm test

# Run tests in watch mode (development)
npm run test:watch

# Run tests with interactive UI
npm run test:ui

# Generate and view coverage report
npm run test:coverage
npm run coverage:open
```

### 🏗️ **Project Structure**

```
src/
├── components/          # React components
│   ├── __tests__/      # Component tests
│   ├── ui/             # Reusable UI components
│   └── visualization/   # 3D visualization components
├── utils/              # Utility functions
│   ├── __tests__/      # Utility tests
│   ├── gcodeParser.ts  # G-code parsing logic
│   └── gcodeGenerator.ts # G-code generation
├── types/              # TypeScript type definitions
├── hooks/              # Custom React hooks
├── contexts/           # React context providers
└── lib/                # Shared utilities and configurations
```

## 🧪 **Technology Stack**

- **⚛️ React 19** - Modern UI framework with concurrent features
- **📘 TypeScript** - Type-safe development
- **⚡ Vite** - Lightning-fast build tool and dev server
- **🧪 Vitest** - Next-generation testing framework
- **🎨 TailwindCSS** - Utility-first CSS framework
- **🧩 Shadcn/ui** - Beautiful, accessible ui components
- **🔘 Radix UI** - Accessible component primitives
- **🎭 React Testing Library** - Simple and complete testing utilities
- **🌐 Three.js** - 3D graphics and visualization
- **📦 React Three Fiber** - React renderer for Three.jsa

## 🤝 **Contributing**

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass (`npm test`)
6. Commit using [Conventional Commits](https://conventionalcommits.org/)
7. Push to your branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

### Commit Message Format

We use [Conventional Commits](https://conventionalcommits.org/) for automatic semantic versioning:

- `feat:` - New features (minor version bump)
- `fix:` - Bug fixes (patch version bump)  
- `feat!:` or `BREAKING CHANGE:` - Breaking changes (major version bump)
- `docs:`, `style:`, `refactor:`, `test:`, `chore:` - No version bump

## 📋 **License**

This project is licensed under the [PolyForm Noncommercial License 1.0.0](LICENSE.md).

**Summary**: Free for personal, educational, and non-commercial research use. Commercial use requires a separate license.

For commercial licensing inquiries, contact: **[jd@jdhpro.com](mailto:jd@jdhpro.com)**

## 🏢 **Enterprise & Commercial Use**

Mill Probe Studio is available for commercial licensing. Enterprise features include:

- Priority support and maintenance
- Custom integrations and modifications  
- On-premise deployment options
- Advanced analytics and reporting
- Custom machine profiles and configurations

Contact [JDH Productions LLC](mailto:jd@jdhpro.com) for commercial licensing.

## 🐛 **Issues & Support**

- **Bug Reports**: [GitHub Issues](https://github.com/JerrettDavis/MillProbeStudio/issues)
- **Feature Requests**: [GitHub Discussions](https://github.com/JerrettDavis/MillProbeStudio/discussions)
- **Documentation**: [Wiki](https://github.com/JerrettDavis/MillProbeStudio/wiki)

## 🙏 **Acknowledgments**

- Built with [React](https://reactjs.org/) and [TypeScript](https://www.typescriptlang.org/)
- UI components from [Shadcn/UI](https://ui.shadcn.com/)
- 3D visualization powered by [Three.js](https://threejs.org/)
- Styling with [TailwindCSS](https://tailwindcss.com/)

---

**Made with ❤️ by [JDH Productions LLC](https://jdhpro.com)**

