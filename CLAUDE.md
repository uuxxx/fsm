# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

`@uuxxx/fsm` — a lightweight, type-safe finite state machine library for TypeScript/JavaScript. Published to npm with two entry points: `@uuxxx/fsm` (core) and `@uuxxx/fsm/history-plugin`.

## Commands

- **Install**: `pnpm install --frozen-lockfile`
- **Build**: `pnpm build` (Rolldown → `dist/`)
- **Test**: `pnpm test` (Vitest with globals enabled)
- **Lint**: `pnpm lint` (oxlint with type-aware rules)
- **Format**: `pnpm fmt` (oxfmt, write) / `pnpm fmt:check` (check only)
- **Type check**: `pnpm check:types` (tsc --noEmit)
- **Run single test file**: `pnpm vitest run test/transitions.test.ts`

Pre-commit/pre-push hooks (via lefthook) run type check, lint, format check, and tests in parallel.

## Architecture

### Core (`lib/core/`)

Functional, modular design — each concern is a separate factory function, composed together in `makeFsm()`:

- **`fsm.ts`** — `makeFsm(config)` factory. Creates the FSM instance by composing transitions, events, and plugins. Maintains mutable state, emits `init` on creation.
- **`transitions.ts`** — `makeTransitionMethods()` builds typed methods from transition config. Supports static (`to: 'state'`), dynamic (`to: (...args) => state`), async, wildcard (`from: '*'`), and multi-source (`from: ['a', 'b']`) transitions. Validates from/to states, prevents circular and concurrent transitions, integrates lifecycle hooks with veto capability.
- **`eventEmitter.ts`** — Wraps `@uuxxx/utils/event-emitter`. Events: `init`, `onBeforeTransition` (cancelable), `onAfterTransition`, `error`, `warn`.
- **`plugins.ts`** — `makePluginsMethods()` registers plugins. Each plugin receives an API (`init`, `onBeforeTransition`, `onAfterTransition`, `state`, `allStates`) and returns `{ name, api }`. Plugin methods are merged onto the FSM instance under `fsm[pluginName].method()`.

### Types (`lib/types/`)

Heavy use of mapped types and generics. `Methods<TState, TTransitions, TPlugins>` is the merged return type of `makeFsm()` — transition methods are auto-generated from config keys with correct signatures inferred. Depends on utility types from `@uuxxx/utils`.

### Plugins (`lib/plugins/`)

- **History plugin** (`history.ts`) — tracks state history with back/forward navigation. Exported separately via `lib/history-plugin.ts`.

### External dependency

`@uuxxx/utils` provides type guards, event emitter, utility types (`KeyOf`, `Entries`, `Rec`), and functional helpers (`tap`, `noop`).

## Build

Rolldown with two entry points (`lib/index.ts`, `lib/history-plugin.ts`) → ES2015 minified modules + `.d.ts` files. Uses SWC3 for minification and `rolldown-plugin-dts` for type generation.

## Release

Changesets-based: create changeset → CI creates version PR → merge triggers npm publish via GitHub Actions. CI tests against Node 20, 22, 24.
