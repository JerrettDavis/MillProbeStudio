# CI/CD Pipeline Documentation

## Overview

This project uses a comprehensive CI/CD pipeline that automatically builds, tests, and releases your application using semantic versioning based on conventional commits.

## Workflows

### 1. CI/CD Pipeline (`ci-cd.yml`)

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main` branch

**Jobs:**
- **Test**: Runs linting, tests, and generates coverage reports
- **Build**: Creates production build artifacts
- **Release**: Automatically creates releases using semantic versioning (main branch only)
- **Deploy**: Deploys to GitHub Pages (main branch only)

### 2. Pull Request Checks (`pull-request.yml`)

**Triggers:**
- Pull requests to `main` or `develop` branches

**Features:**
- Validates conventional commit messages
- Runs full test suite with coverage
- Posts coverage report as PR comment
- Validates build process

### 3. Dependency Updates (`dependency-updates.yml`)

**Triggers:**
- Weekly schedule (Mondays at 9 AM UTC)
- Manual trigger

**Features:**
- Automatically updates npm dependencies
- Runs security audit fixes
- Creates PR with updated dependencies

### 4. Release Management (`release-management.yml`)

**Triggers:**
- After successful CI/CD pipeline completion

**Features:**
- Creates deployment notifications
- Updates project documentation

## Conventional Commits

This project follows the [Conventional Commits](https://conventionalcommits.org/) specification for automatic semantic versioning.

### Commit Types

- `feat`: A new feature (triggers minor version bump)
- `fix`: A bug fix (triggers patch version bump)
- `perf`: Performance improvements (triggers patch version bump)
- `BREAKING CHANGE`: Breaking changes (triggers major version bump)
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Test-related changes
- `build`: Build system changes
- `ci`: CI/CD changes
- `chore`: Other changes

### Examples

```bash
# Feature (minor version bump: 1.0.0 → 1.1.0)
git commit -m "feat: add 3D probe visualization"

# Bug fix (patch version bump: 1.1.0 → 1.1.1)
git commit -m "fix: resolve G-code parsing error"

# Breaking change (major version bump: 1.1.1 → 2.0.0)
git commit -m "feat!: redesign machine settings API"
# or
git commit -m "feat: redesign API

BREAKING CHANGE: machine settings now use different parameter names"

# Documentation (no version bump)
git commit -m "docs: update README with new features"
```

## Setup Requirements

### GitHub Repository Settings

1. **Enable GitHub Pages:**
   - Go to Settings → Pages
   - Source: GitHub Actions

2. **Configure Branch Protection (Recommended):**
   - Go to Settings → Branches
   - Add rule for `main` branch:
     - Require status checks to pass
     - Require branches to be up to date
     - Include administrators

### GitHub Secrets (Optional)

- `CODECOV_TOKEN`: For enhanced coverage reporting (optional)
- `NPM_TOKEN`: If you plan to publish to npm (currently disabled)

### Local Development Setup

1. **Install commitlint (optional but recommended):**
   ```bash
   npm install -g @commitlint/cli @commitlint/config-conventional
   ```

2. **Install husky for git hooks (optional):**
   ```bash
   npm install --save-dev husky
   npm pkg set scripts.prepare="husky install"
   npm run prepare
   npx husky add .husky/commit-msg 'npx --no -- commitlint --edit ${1}'
   ```

## Versioning Strategy

The project uses semantic versioning (SemVer) with the following rules:

- **Major version** (X.0.0): Breaking changes
- **Minor version** (0.X.0): New features (backward compatible)
- **Patch version** (0.0.X): Bug fixes and improvements

### Release Process

1. **Development**: Create feature branches from `develop`
2. **Pull Request**: Open PR to `main` with conventional commit messages
3. **Review**: Code review and automatic checks
4. **Merge**: Merge to `main` triggers automatic release
5. **Deploy**: Automatic deployment to GitHub Pages

### Manual Release

If needed, you can trigger a manual release:

```bash
npm run release:dry-run  # Preview what would be released
npm run release          # Create actual release (only on main branch)
```

## Monitoring and Debugging

### Check Workflow Status

- Go to Actions tab in your GitHub repository
- View logs for failed workflows
- Check artifact downloads for build outputs

### Common Issues

1. **Tests failing**: Check test logs in Actions tab
2. **Build errors**: Review build logs and dependencies
3. **Release not created**: Ensure commits follow conventional format
4. **Deployment failed**: Check GitHub Pages settings

### Coverage Reports

- Coverage reports are automatically generated and uploaded
- PR comments show coverage status
- Artifacts contain detailed HTML coverage reports

## Best Practices

1. **Always use conventional commits** for automatic versioning
2. **Write descriptive commit messages** for better release notes
3. **Keep PRs focused** on single features or fixes
4. **Add tests** for new features
5. **Update documentation** when adding features
6. **Review coverage reports** to maintain code quality

## Troubleshooting

### Semantic Release Not Working

- Ensure commit messages follow conventional format
- Check that you're on the `main` branch
- Verify GitHub token permissions

### Build Failures

- Check Node.js version compatibility
- Verify all dependencies are properly installed
- Review build logs for specific error messages

### Test Failures

- Run tests locally: `npm run test`
- Check coverage requirements in workflow
- Ensure all new code has appropriate tests
