# Changelog

All notable changes to this project will be documented in this file. See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## 2.0.0 (2025-06-25)

* Merge branch 'main' of https://github.com/JerrettDavis/MillProbeStudio ([b14f046](https://github.com/JerrettDavis/MillProbeStudio/commit/b14f046))
* fix: improve GitHub Pages deployment in release workflow ([c5a8504](https://github.com/JerrettDavis/MillProbeStudio/commit/c5a8504))
* feat: add drawer component and vaul dependency ([976962b](https://github.com/JerrettDavis/MillProbeStudio/commit/976962b))
* feat: add minimize/maximize functionality to Camera Views ([f65db6d](https://github.com/JerrettDavis/MillProbeStudio/commit/f65db6d))
* feat: redesign visualization controls with bottom drawers ([30db43a](https://github.com/JerrettDavis/MillProbeStudio/commit/30db43a))


### BREAKING CHANGE

* Visualization tab UI replaced with drawer-based controls

## 1.0.0 (2025-06-25)

* fix: resolve all ESLint errors and warnings ([2868945](https://github.com/JerrettDavis/MillProbeStudio/commit/2868945))
* fix: resolve semantic-release dependency conflicts ([e3573ff](https://github.com/JerrettDavis/MillProbeStudio/commit/e3573ff))
* fix: resolve TypeScript build error in useCameraControls hook ([f07d228](https://github.com/JerrettDavis/MillProbeStudio/commit/f07d228))
* fix: resolve unit test failures in SequenceVisualization tests ([f99645b](https://github.com/JerrettDavis/MillProbeStudio/commit/f99645b))
* build: add semantic-release and commitlint dependencies ([4d13d5b](https://github.com/JerrettDavis/MillProbeStudio/commit/4d13d5b))
* build: optimize bundle splitting and build configuration ([e58b3b2](https://github.com/JerrettDavis/MillProbeStudio/commit/e58b3b2))
* ci: add comprehensive CI/CD pipeline with semantic versioning ([89df92f](https://github.com/JerrettDavis/MillProbeStudio/commit/89df92f))
* refactor: adopt functional programming patterns and improve code organization ([87fa60f](https://github.com/JerrettDavis/MillProbeStudio/commit/87fa60f))
* feat: add comprehensive camera system tests and license ([831de44](https://github.com/JerrettDavis/MillProbeStudio/commit/831de44))
* feat: comprehensive 3D visualization and camera system improvements ([d16a8f2](https://github.com/JerrettDavis/MillProbeStudio/commit/d16a8f2))
* feat: move initial probe position from machine settings to probe sequence ([064c1cb](https://github.com/JerrettDavis/MillProbeStudio/commit/064c1cb))
* feat: refactor 3D visualization system with modular architecture ([82df119](https://github.com/JerrettDavis/MillProbeStudio/commit/82df119))
* Add comprehensive React Three Fiber (R3F) tests using @react-three/test-renderer ([412cf5b](https://github.com/JerrettDavis/MillProbeStudio/commit/412cf5b))
* Add debug files to .gitignore ([ecea89c](https://github.com/JerrettDavis/MillProbeStudio/commit/ecea89c))
* Initial commit: Mill Probe Stage application ([47bf5db](https://github.com/JerrettDavis/MillProbeStudio/commit/47bf5db))
* test: implement comprehensive test coverage for Mill Probe Studio ([fb3d908](https://github.com/JerrettDavis/MillProbeStudio/commit/fb3d908))


### BREAKING CHANGE

* Initial probe position is now configured in the ProbeSequence component instead of MachineSettings
* Machine3DVisualization component API has changed to use new modular prop structure
* None - this is purely additive test coverage

Closes: Test coverage implementation
Refs: #test-coverage-improvement
* Refactored component interfaces to use functional patterns
* SequenceVisualization component API updated to accept machineSettings and probeSequenceSettings instead of machineSettingsUnits

## [Unreleased]

### Added
- Initial CI/CD pipeline with semantic versioning
- Automated testing and coverage reporting
- GitHub Pages deployment
- Conventional commit linting

### Changed
- Project structure reorganized for better CI/CD integration

### Fixed
- N/A

---

*This changelog is automatically generated based on conventional commits.*
