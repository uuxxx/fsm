# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

pnpm monorepo with four packages:

- `@uuxxx/fsm` (`packages/core/`) — lightweight, type-safe finite state machine library for TypeScript/JavaScript
- `@uuxxx/fsm-plugins` (`packages/plugins/`) — official plugins (history plugin with back/forward navigation)
- `@uuxxx/fsm-react` (`packages/react/`) — React bindings (stub)
- `@uuxxx/fsm-vue` (`packages/vue/`) — Vue bindings (stub)

## Commands

- **Install**: `pnpm install --frozen-lockfile`
- **Build**: `pnpm build` (builds all packages in topological order via `pnpm -r build`)
- **Test**: `pnpm test` (Vitest with globals enabled, discovers tests across all packages)
- **Lint**: `pnpm lint` (oxlint with type-aware rules, runs from root)
- **Format**: `pnpm fmt` (oxfmt, write) / `pnpm fmt:check` (check only)
- **Type check**: `pnpm check:types` (runs `tsc --noEmit` per package via `pnpm -r check:types`)
- **Run single test file**: `pnpm vitest run packages/core/test/transitions.test.ts`

Pre-commit/pre-push hooks (via lefthook) run type check, lint, format check, and tests in parallel.

## Architecture

### Core (`packages/core/lib/`)

Functional, modular design — each concern is a separate factory function, composed together in `makeFsm()`:

- **`fsm.ts`** — `makeFsm(config)` factory. Creates the FSM instance by composing transitions, events, and plugins. Maintains mutable state, emits `init` on creation.
- **`transitions.ts`** — `makeTransitionMethods()` builds typed methods from transition config. Supports static (`to: 'state'`), dynamic (`to: (...args) => state`), async, wildcard (`from: '*'`), and multi-source (`from: ['a', 'b']`) transitions. Validates from/to states, prevents circular and concurrent transitions, integrates lifecycle hooks with veto capability.
- **`eventEmitter.ts`** — Wraps `@uuxxx/utils/event-emitter`. Events: `init`, `onBeforeTransition` (cancelable), `onAfterTransition`, `error`, `warn`.
- **`plugins.ts`** — `makePluginsMethods()` registers plugins. Each plugin receives an API (`init`, `onBeforeTransition`, `onAfterTransition`, `state`, `allStates`) and returns `{ name, api }`. Plugin methods are merged onto the FSM instance under `fsm[pluginName].method()`.

### Types (`packages/core/lib/types/`)

Heavy use of mapped types and generics. `Methods<TState, TTransitions, TPlugins>` is the merged return type of `makeFsm()` — transition methods are auto-generated from config keys with correct signatures inferred. Depends on utility types from `@uuxxx/utils`.

### Plugins (`packages/plugins/lib/`)

- **History plugin** (`history.ts`) — tracks state history with back/forward navigation. Published as `@uuxxx/fsm-plugins`.

### External dependency

`@uuxxx/utils` provides type guards, event emitter, utility types (`KeyOf`, `Entries`, `Rec`), and functional helpers (`tap`, `noop`).

## Build

Each package uses Rolldown → ES2015 minified modules + `.d.ts` files. Uses SWC3 for minification and `rolldown-plugin-dts` for type generation. `pnpm -r build` respects topological order (core builds first, then plugins/react/vue).

## Release

Changesets-based: create changeset → CI creates version PR → merge triggers npm publish via GitHub Actions. CI tests against Node 20, 22, 24. React and Vue packages are currently in changesets `ignore` list (not yet published).
