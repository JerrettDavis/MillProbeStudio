# Code Coverage Guide

This project uses Vitest with V8 coverage provider for test coverage reporting.

## Coverage Scripts

### Basic Coverage Commands

```bash
# Run tests with coverage report
npm run test:coverage

# Run tests with coverage in watch mode
npm run test:coverage:watch

# Run tests with coverage and UI
npm run test:coverage:ui
```

### Coverage Reports

The coverage configuration generates three types of reports:

1. **Text Report** - Displayed in terminal after running tests
2. **JSON Report** - Machine-readable coverage data (`coverage/coverage-final.json`)
3. **HTML Report** - Interactive web-based report (`coverage/index.html`)

### Viewing HTML Coverage Report

Open the HTML report in your browser:
```bash
# Open coverage report (Windows)
start coverage/index.html

# Or navigate to the file manually and open it in your browser
```

## Coverage Configuration

### Current Thresholds

The project is configured with the following coverage thresholds:

- **Branches**: 80%
- **Functions**: 80% 
- **Lines**: 80%
- **Statements**: 80%

### Excluded Files

The following files/directories are excluded from coverage:

- `node_modules/`
- `src/setupTests.ts`
- `**/*.d.ts`
- `**/*.config.{js,ts}`
- `src/main.tsx`
- `src/vite-env.d.ts`
- `dist/`
- `coverage/`
- `**/__tests__/**`
- `**/*.test.{js,ts,tsx}`
- `**/*.spec.{js,ts,tsx}`
- `src/components/ui/**` (UI components are mostly style-focused)

### Including Files

Coverage is calculated for:
- `src/**/*.{js,ts,tsx}`

## Current Coverage Status

### High Coverage Areas ✅
- **src/utils**: 98.75% coverage
  - `gcodeGenerator.ts`: 99.15%
  - `gcodeParser.ts`: 98.57%
- **src/lib**: 100% coverage
  - `utils.ts`: 100%

### Areas Needing Improvement 🔄
- **src/components**: 31.65% coverage
  - `ProbeSequence.tsx`: 58.27% (partially tested)
  - Other components: 0% (not tested yet)
- **src/App.tsx**: 0% coverage
- **src/types**: 0% coverage (type definitions)

## Improving Coverage

### Priority Areas for Testing

1. **App.tsx** - Main application component
2. **Component testing** - Add tests for:
   - `GCodeImport.tsx`
   - `GCodeOutput.tsx` 
   - `MachineSettings.tsx`
   - `SequenceVisualization.tsx`
   - `mode-toggle.tsx`
   - `theme-provider.tsx`

### Testing Strategy

1. **Unit Tests** - Test individual functions and components
2. **Integration Tests** - Test component interactions
3. **End-to-End Tests** - Test complete user workflows

## Coverage Quality Guidelines

### What Makes Good Coverage

- **Meaningful Tests**: Tests should verify actual behavior, not just increase coverage numbers
- **Edge Cases**: Test error conditions, boundary values, and edge cases
- **User Workflows**: Test common user interactions and workflows
- **Error Handling**: Verify error states and error recovery

### What to Focus On

1. **Business Logic**: Core functionality like G-code parsing/generation
2. **User Interactions**: Form submissions, button clicks, data manipulation
3. **Error Conditions**: Invalid inputs, network failures, parsing errors
4. **State Management**: Component state changes and data flow

## Continuous Integration

Consider adding coverage checks to your CI/CD pipeline:

```yaml
# Example GitHub Actions step
- name: Test with Coverage
  run: npm run test:coverage
  
- name: Check Coverage Thresholds
  run: |
    if [ $(cat coverage/coverage-final.json | jq '.total.lines.pct') -lt 80 ]; then
      echo "Coverage below threshold"
      exit 1
    fi
```

## Coverage Report Analysis

### Reading the Coverage Report

- **% Stmts**: Percentage of statements executed
- **% Branch**: Percentage of branches (if/else, switch cases) tested
- **% Funcs**: Percentage of functions called
- **% Lines**: Percentage of lines executed
- **Uncovered Line #s**: Specific line numbers not covered by tests

### Using the HTML Report

The HTML report provides:
- File-by-file coverage breakdown
- Line-by-line coverage highlighting
- Interactive navigation
- Coverage trends over time

## Best Practices

1. **Write Tests First**: Consider test-driven development (TDD)
2. **Test Behavior, Not Implementation**: Focus on what the code does, not how
3. **Keep Tests Simple**: Each test should verify one specific behavior
4. **Use Descriptive Test Names**: Make it clear what each test verifies
5. **Test Edge Cases**: Don't just test the happy path
6. **Regular Coverage Review**: Check coverage reports regularly during development

## Troubleshooting

### Common Issues

1. **Low Coverage on UI Components**: Focus on testing component logic rather than styling
2. **Type Files Showing 0%**: Type definitions don't need coverage - they're excluded
3. **Coverage Dropping**: New code without tests - add tests for new functionality

### Getting Help

- Review existing tests in `src/**/__tests__/` for examples
- Check Vitest documentation: https://vitest.dev/guide/coverage.html
- Review React Testing Library docs: https://testing-library.com/docs/react-testing-library/intro/
