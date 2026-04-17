# Changelog

All notable changes to this project will be documented in this file. See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## <small>1.3.1 (2026-04-17)</small>

* fix: add --legacy-peer-deps to npm install in CI workflows ([3dc3228](https://github.com/JerrettDavis/MillProbeStudio/commit/3dc3228))
* fix: add --legacy-peer-deps to semantic-release install in CI ([33c3ce5](https://github.com/JerrettDavis/MillProbeStudio/commit/33c3ce5))
* fix: clean up lint errors in StockControls and VirtualMillSimulationBridge ([d03ecdb](https://github.com/JerrettDavis/MillProbeStudio/commit/d03ecdb))
* fix: Correct bounding box in CustomModelCollision.isPointInside ([e3851ef](https://github.com/JerrettDavis/MillProbeStudio/commit/e3851ef))
* fix: extract useVirtualMillContext hook to separate file ([0a4c29c](https://github.com/JerrettDavis/MillProbeStudio/commit/0a4c29c))
* fix: remove stale probeSequence prop from SimulationControls test ([cc81d9c](https://github.com/JerrettDavis/MillProbeStudio/commit/cc81d9c))
* fix: resolve test pollution in App.test.tsx ([83017fa](https://github.com/JerrettDavis/MillProbeStudio/commit/83017fa))
* fix: StockControls reset returns to home position [0,0,0] ([4c489ba](https://github.com/JerrettDavis/MillProbeStudio/commit/4c489ba))
* fix: updated probing simulation contact point ([6e8ae49](https://github.com/JerrettDavis/MillProbeStudio/commit/6e8ae49))
* Merge branch 'main' of https://github.com/JerrettDavis/MillProbeStudio into feature/add-probing-visu ([db09df0](https://github.com/JerrettDavis/MillProbeStudio/commit/db09df0))
* Merge pull request #2 from JerrettDavis/copilot/fix-deps-update-workflow ([0bd5b47](https://github.com/JerrettDavis/MillProbeStudio/commit/0bd5b47)), closes [#2](https://github.com/JerrettDavis/MillProbeStudio/issues/2)
* Merge pull request #2 from JerrettDavis/copilot/fix-deps-update-workflow ([d641621](https://github.com/JerrettDavis/MillProbeStudio/commit/d641621)), closes [#2](https://github.com/JerrettDavis/MillProbeStudio/issues/2)
* Merge pull request #3 from JerrettDavis/feature/add-probing-visualizations ([e2fd4b8](https://github.com/JerrettDavis/MillProbeStudio/commit/e2fd4b8)), closes [#3](https://github.com/JerrettDavis/MillProbeStudio/issues/3)
* chore: chugging through the refactor logic to move this to a virtual mill ([d1dfeb5](https://github.com/JerrettDavis/MillProbeStudio/commit/d1dfeb5))
* chore: correcting linting, tests, etc ([d58e262](https://github.com/JerrettDavis/MillProbeStudio/commit/d58e262))
* chore: remove debug scripts from codebase ([15d7c44](https://github.com/JerrettDavis/MillProbeStudio/commit/15d7c44))
* chore: wiring up virtual mill to simulation ([dbe5b6d](https://github.com/JerrettDavis/MillProbeStudio/commit/dbe5b6d))
* chore: working through the simulation and visualization logic ([5f6eadf](https://github.com/JerrettDavis/MillProbeStudio/commit/5f6eadf))
* ci: fix dependency-updates workflow step ordering ([811472a](https://github.com/JerrettDavis/MillProbeStudio/commit/811472a))
* ci: fix dependency-updates workflow step ordering ([461c5bd](https://github.com/JerrettDavis/MillProbeStudio/commit/461c5bd))

## 1.3.0 (2025-06-27)

* fix: corrected building and linting issue with test file ([2264303](https://github.com/JerrettDavis/MillProbeStudio/commit/2264303))
* fix: corrected spacial movement for move gizmo. Stock now follows direction of travel in 3D space is ([0b6ffe7](https://github.com/JerrettDavis/MillProbeStudio/commit/0b6ffe7))
* Merge pull request #1 from JerrettDavis/feature/add-stl-uploading ([fc0cee6](https://github.com/JerrettDavis/MillProbeStudio/commit/fc0cee6)), closes [#1](https://github.com/JerrettDavis/MillProbeStudio/issues/1)
* feat: added the ability to upload a custom model to the visualizer for the stock. ([ad37872](https://github.com/JerrettDavis/MillProbeStudio/commit/ad37872))
* feat: implementing base tool-based movement system for the stock, probe, and stage. ([6778e2f](https://github.com/JerrettDavis/MillProbeStudio/commit/6778e2f))
* feat: updated rotational and movement gizmos to more closely align with environment movements. Fixed ([3ed44e4](https://github.com/JerrettDavis/MillProbeStudio/commit/3ed44e4))
* test: added more test coverage acorss the app ([1cdc019](https://github.com/JerrettDavis/MillProbeStudio/commit/1cdc019))
* ci: updated ci/cd badge and corrected codecov jobs. ([86ed4c0](https://github.com/JerrettDavis/MillProbeStudio/commit/86ed4c0))
* ci: updated step names for clarity ([73f6480](https://github.com/JerrettDavis/MillProbeStudio/commit/73f6480))

## 1.2.0 (2025-06-26)

* chore: fixed linting issues. ([153be2e](https://github.com/JerrettDavis/MillProbeStudio/commit/153be2e))
* feat: implement centralized state management with zustand and enhance camera controls ([fed4468](https://github.com/JerrettDavis/MillProbeStudio/commit/fed4468))

## 1.1.0 (2025-06-26)

* fix: correct test failures after machine configuration refactor ([0d11b1b](https://github.com/JerrettDavis/MillProbeStudio/commit/0d11b1b))
* fix: corrected z-ordering for visualziation and moved control buttons out of the view. Corrected man ([3dc528e](https://github.com/JerrettDavis/MillProbeStudio/commit/3dc528e))
* feat: add machine orientation and stage dimensions to machine settings ([86f4632](https://github.com/JerrettDavis/MillProbeStudio/commit/86f4632))
* feat: enhance UI/UX with improved navigation and responsive design ([9b5dd3b](https://github.com/JerrettDavis/MillProbeStudio/commit/9b5dd3b))
* ci: added codecov bundler plugin and test actions ([023046f](https://github.com/JerrettDavis/MillProbeStudio/commit/023046f))
* ci: corrected bundle name ([ac4148e](https://github.com/JerrettDavis/MillProbeStudio/commit/ac4148e))
* Merge branch 'main' of https://github.com/JerrettDavis/MillProbeStudio ([c1cc240](https://github.com/JerrettDavis/MillProbeStudio/commit/c1cc240))

## 1.0.0 (2025-06-26)

* ci: add codecov configuration file ([119d324](https://github.com/JerrettDavis/MillProbeStudio/commit/119d324))
* ci: add comprehensive CI/CD pipeline with semantic versioning ([89df92f](https://github.com/JerrettDavis/MillProbeStudio/commit/89df92f))
* ci: combined release management workflow into ci-cd pipeline ([3a11b4b](https://github.com/JerrettDavis/MillProbeStudio/commit/3a11b4b))
* ci: removed unneceesary deploy notification ([c4db4b6](https://github.com/JerrettDavis/MillProbeStudio/commit/c4db4b6))
* ci: updated the ci pipeline to correct for the npm ci bug ([73ed58b](https://github.com/JerrettDavis/MillProbeStudio/commit/73ed58b))
* chore: cleaned up project for publish ([6f27872](https://github.com/JerrettDavis/MillProbeStudio/commit/6f27872))
* chore: remove obsolete COVERAGE.md file ([ac00998](https://github.com/JerrettDavis/MillProbeStudio/commit/ac00998))
* chore: removed a duplicate line from the readme and added a screenshot. ([b07f00e](https://github.com/JerrettDavis/MillProbeStudio/commit/b07f00e))
* chore: reset version to 0.0.1 and clean changelog for fresh start ([d216789](https://github.com/JerrettDavis/MillProbeStudio/commit/d216789))
* chore(release): v1.0.0 [skip ci] ([986ba23](https://github.com/JerrettDavis/MillProbeStudio/commit/986ba23))
* chore(release): v1.0.1 [skip ci] ([660b26d](https://github.com/JerrettDavis/MillProbeStudio/commit/660b26d))
* chore(release): v2.0.0 [skip ci] ([425f28b](https://github.com/JerrettDavis/MillProbeStudio/commit/425f28b))
* Add comprehensive React Three Fiber (R3F) tests using @react-three/test-renderer ([412cf5b](https://github.com/JerrettDavis/MillProbeStudio/commit/412cf5b))
* Add debug files to .gitignore ([ecea89c](https://github.com/JerrettDavis/MillProbeStudio/commit/ecea89c))
* Initial commit: Mill Probe Stage application ([47bf5db](https://github.com/JerrettDavis/MillProbeStudio/commit/47bf5db))
* Merge branch 'main' of https://github.com/JerrettDavis/MillProbeStudio ([b14f046](https://github.com/JerrettDavis/MillProbeStudio/commit/b14f046))
* Merge branch 'main' of https://github.com/JerrettDavis/MillProbeStudio ([cb8b7ea](https://github.com/JerrettDavis/MillProbeStudio/commit/cb8b7ea))
* fix: configure correct base path for GitHub Pages deployment ([27ceca6](https://github.com/JerrettDavis/MillProbeStudio/commit/27ceca6))
* fix: improve GitHub Pages deployment in release workflow ([c5a8504](https://github.com/JerrettDavis/MillProbeStudio/commit/c5a8504))
* fix: resolve all ESLint errors and warnings ([2868945](https://github.com/JerrettDavis/MillProbeStudio/commit/2868945))
* fix: resolve semantic-release dependency conflicts ([e3573ff](https://github.com/JerrettDavis/MillProbeStudio/commit/e3573ff))
* fix: resolve TypeScript build error in useCameraControls hook ([f07d228](https://github.com/JerrettDavis/MillProbeStudio/commit/f07d228))
* fix: resolve unit test failures in SequenceVisualization tests ([f99645b](https://github.com/JerrettDavis/MillProbeStudio/commit/f99645b))
* feat: add comprehensive camera system tests and license ([831de44](https://github.com/JerrettDavis/MillProbeStudio/commit/831de44))
* feat: add drawer component and vaul dependency ([976962b](https://github.com/JerrettDavis/MillProbeStudio/commit/976962b))
* feat: add minimize/maximize functionality to Camera Views ([f65db6d](https://github.com/JerrettDavis/MillProbeStudio/commit/f65db6d))
* feat: comprehensive 3D visualization and camera system improvements ([d16a8f2](https://github.com/JerrettDavis/MillProbeStudio/commit/d16a8f2))
* feat: move initial probe position from machine settings to probe sequence ([064c1cb](https://github.com/JerrettDavis/MillProbeStudio/commit/064c1cb))
* feat: redesign visualization controls with bottom drawers ([30db43a](https://github.com/JerrettDavis/MillProbeStudio/commit/30db43a))
* feat: refactor 3D visualization system with modular architecture ([82df119](https://github.com/JerrettDavis/MillProbeStudio/commit/82df119))
* build: add semantic-release and commitlint dependencies ([4d13d5b](https://github.com/JerrettDavis/MillProbeStudio/commit/4d13d5b))
* build: optimize bundle splitting and build configuration ([e58b3b2](https://github.com/JerrettDavis/MillProbeStudio/commit/e58b3b2))
* refactor: adopt functional programming patterns and improve code organization ([87fa60f](https://github.com/JerrettDavis/MillProbeStudio/commit/87fa60f))
* test: implement comprehensive test coverage for Mill Probe Studio ([fb3d908](https://github.com/JerrettDavis/MillProbeStudio/commit/fb3d908))


### BREAKING CHANGE

* Initial probe position is now configured in the ProbeSequence component instead of MachineSettings
* Machine3DVisualization component API has changed to use new modular prop structure
* None - this is purely additive test coverage

Closes: Test coverage implementation
Refs: #test-coverage-improvement
* Refactored component interfaces to use functional patterns
* SequenceVisualization component API updated to accept machineSettings and probeSequenceSettings instead of machineSettingsUnits
* Visualization tab UI replaced with drawer-based controls

# Changelog

All notable changes to this project will be documented in this file. See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

<!-- This file will be automatically generated when the first release is created -->
