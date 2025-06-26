# Contributing to Mill Probe Studio

We love your input! We want to make contributing to Mill Probe Studio as easy and transparent as possible, whether it's:

- Reporting a bug
- Discussing the current state of the code
- Submitting a fix
- Proposing new features
- Becoming a maintainer

## 🚀 **Getting Started**

### Development Environment Setup

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/MillProbeStudio.git
   cd MillProbeStudio
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Start the development server**:
   ```bash
   npm run dev
   ```
5. **Run tests** to ensure everything works:
   ```bash
   npm test
   ```

### Development Workflow

1. **Create a branch** for your work:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. **Make your changes** following our coding standards
3. **Add tests** for new functionality
4. **Run the test suite**:
   ```bash
   npm test
   npm run lint
   ```
5. **Commit your changes** using [Conventional Commits](#commit-message-format)
6. **Push to your fork** and submit a pull request

## 📝 **Commit Message Format**

We use [Conventional Commits](https://conventionalcommits.org/) for automatic semantic versioning and changelog generation.

### Format
```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `build`: Changes that affect the build system or external dependencies
- `ci`: Changes to our CI configuration files and scripts
- `chore`: Other changes that don't modify src or test files

### Examples
```bash
feat: add 3D probe path visualization
fix: resolve G-code parsing issue with comments
docs: update README with new installation steps
feat!: redesign machine settings API

BREAKING CHANGE: machine settings now use different parameter names
```

## 🧪 **Testing Guidelines**

- **Write tests** for all new features and bug fixes
- **Maintain test coverage** above 80% for new code
- **Use descriptive test names** that explain what is being tested
- **Follow the AAA pattern**: Arrange, Act, Assert

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests with UI
npm run test:ui
```

### Test Structure
```typescript
describe('Component/Function Name', () => {
  it('should do something specific when condition is met', () => {
    // Arrange
    const input = 'test input';
    
    // Act
    const result = functionUnderTest(input);
    
    // Assert
    expect(result).toBe('expected output');
  });
});
```

## 🎨 **Code Style Guidelines**

We use automated tools to maintain consistent code style:

- **ESLint** for JavaScript/TypeScript linting
- **Prettier** for code formatting (integrated with ESLint)
- **TypeScript** for type safety

### Key Principles
- **Use TypeScript** for all new code
- **Prefer functional components** with hooks
- **Use descriptive variable names**
- **Keep functions small and focused**
- **Add JSDoc comments** for complex functions
- **Prefer composition over inheritance**

### Example Code Style
```typescript
interface ProbeOperation {
  id: string;
  position: Position3D;
  description?: string;
}

/**
 * Generates G-code for a probe operation
 * @param operation - The probe operation to convert
 * @returns Formatted G-code string
 */
const generateProbeGCode = (operation: ProbeOperation): string => {
  const { position, description = 'Probe operation' } = operation;
  
  return [
    `G0 X${position.x} Y${position.y} Z${position.z}`,
    `G31 Z${position.z - 10} F100`,
    'G0 Z5'
  ].join('\n');
};
```

## 🐛 **Bug Reports**

We use GitHub Issues to track bugs. Report a bug by [opening a new issue](https://github.com/JerrettDavis/MillProbeStudio/issues).

### Great Bug Reports Include:
- **Clear title** summarizing the issue
- **Step-by-step reproduction** instructions
- **Expected vs actual behavior**
- **Screenshots** if applicable
- **Environment details** (OS, browser, Node.js version)
- **Error messages** and stack traces

### Bug Report Template
```markdown
**Describe the bug**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected behavior**
A clear and concise description of what you expected to happen.

**Screenshots**
If applicable, add screenshots to help explain your problem.

**Environment:**
 - OS: [e.g. Windows 10, macOS 12.1]
 - Browser: [e.g. Chrome 95, Firefox 94]
 - Node.js: [e.g. 18.12.0]
 - npm: [e.g. 9.1.0]

**Additional context**
Add any other context about the problem here.
```

## 💡 **Feature Requests**

We use GitHub Discussions for feature requests and general discussion.

### Great Feature Requests Include:
- **Clear problem statement** you're trying to solve
- **Proposed solution** with implementation details
- **Alternatives considered**
- **Use cases** and examples
- **Backward compatibility** considerations

## 🔄 **Pull Request Process**

1. **Update documentation** for any new features
2. **Add tests** that cover your changes
3. **Ensure the test suite passes** locally
4. **Update the README.md** if needed
5. **Follow the commit message format**
6. **Request review** from maintainers

### Pull Request Template
```markdown
## Description
Brief description of changes made.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] This change requires a documentation update

## Testing
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
- [ ] I have run the linter and fixed all issues

## Screenshots (if appropriate)
Add screenshots to help explain your changes.

## Checklist
- [ ] My code follows the style guidelines of this project
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
```

## 📚 **Documentation**

- **Code documentation** using JSDoc for complex functions
- **README updates** for new features or installation changes
- **Wiki updates** for architectural changes
- **Inline comments** for complex business logic

## 🏆 **Recognition**

Contributors who make significant improvements will be:
- **Added to the contributors list** in the README
- **Mentioned in release notes**
- **Given commit access** for regular contributors
- **Invited to join** the core team

## 📞 **Questions?**

- **GitHub Discussions** for general questions
- **GitHub Issues** for bug reports
- **Email** [jd@jdhpro.com](mailto:jd@jdhpro.com) for sensitive issues

## 📄 **License**

By contributing, you agree that your contributions will be licensed under the same [PolyForm Noncommercial License 1.0.0](LICENSE.md) as the project.

---

Thank you for contributing to Mill Probe Studio! 🎉
