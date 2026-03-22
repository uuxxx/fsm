# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Code guidelines

- Always use utilities from `@uuxxx/utils` (`guard`, `tap`, `noop`, `wait`, `Rec`, `KeyOf`, `Entries`, etc.) and `@uuxxx/utils/event-emitter` instead of writing local duplicates. Do not add helpers that replicate functionality already provided by `@uuxxx/utils`.
- Always cover new or changed functionality with tests. When adding a feature, write tests that verify the happy path and relevant edge cases. When modifying existing behavior, update or add tests to reflect the changes. Do not consider a task complete until tests pass.

## Project

pnpm monorepo with four packages:

- `@uuxxx/fsm` (`packages/core/`) — lightweight, type-safe finite state machine library for TypeScript/JavaScript
- `@uuxxx/fsm-plugins` (`packages/plugins/`) — official plugins (history). Each plugin lives in its own directory and builds to a separate file. Sub-path exports: `@uuxxx/fsm-plugins/history`
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

Each plugin lives in its own directory (`lib/<name>/index.ts`) and builds to a separate output file (`dist/<name>.js`).

- **History plugin** (`history/index.ts`) — read-only state history tracking with pointer-based back/forward navigation. `back()`/`forward()` move the pointer but do not change FSM state.

### External dependency: `@uuxxx/utils`

Source: https://github.com/uuxxx/utils

#### `@uuxxx/utils` (main entry point)

**Functions:**

- **`guard`** — object with type-guard predicates:
  - `guard.nlx(value): value is null`
  - `guard.ulx(value): value is undefined`
  - `guard.nil(value): value is undefined | null`
  - `guard.not.nlx<T>(value): value is Exclude<T, null>`
  - `guard.not.ulx<T>(value): value is Exclude<T, undefined>`
  - `guard.not.nil<T>(value): value is Exclude<T, undefined | null>`
  - `guard.array<T>(value): value is T[]`
  - `guard.string(value): value is string`
  - `guard.function(value): value is AnyFn`
  - `guard.promise<T>(value): value is Promise<T>`
  - `guard.boolean(value): value is boolean`
  - `guard.false(value): value is false`
  - `guard.true(value): value is true`
- **`noop`** — `() => void`, no-operation function.
- **`tap`** — `<T>(value: T) => T`, identity function.
- **`wait`** — `(delay: number) => Promise<void>`, setTimeout wrapper.

**Types:**

- **`AnyFn`** — `(...args: any[]) => any`
- **`Noop`** — `() => void`
- **`Rec<T = unknown>`** — `Record<string, T>`
- **`Key`** — `string | number | symbol`
- **`Vdx<T>`** — `T | void`
- **`Ulx<T>`** — `T | undefined`
- **`KeyOf<T extends Rec>`** — `keyof T`
- **`ValueOf<T extends Rec>`** — `T[KeyOf<T>]`
- **`EmptyArray`** — `[]`
- **`Entries<T extends Rec>`** — union of `[K, T[K]]` tuples for each property in `T`

#### `@uuxxx/utils/event-emitter` (sub-path export)

- **`makeEventEmitter<T extends Rec<AnyFn>>()`** — factory creating a typed event emitter. `T` is an event map (keys = event names, values = listener signatures). Returns `EventEmitter<T>`.
- **`EventEmitter<T>`** interface:
  - `listen<K>(id: K, listener: T[K]) => Noop` — subscribe; returns unsubscribe function.
  - `unlisten(id: KeyOf<T>, listener: Noop) => void` — remove a specific listener.
  - `emit<K>(id: K, ...args: Parameters<T[K]>) => Array<ReturnType<T[K]>>` — emit event; returns array of non-undefined return values.
  - `unlistenAll(id: KeyOf<T>) => void` — remove all listeners for an event.

## Build

Each package uses Rolldown → ES2015 minified modules + `.d.ts` files. Uses SWC3 for minification and `rolldown-plugin-dts` for type generation. `pnpm -r build` respects topological order (core builds first, then plugins/react/vue).

## Release

Changesets-based: create changeset → CI creates version PR → merge triggers npm publish via GitHub Actions. CI tests against Node 20, 22, 24. React and Vue packages are currently in changesets `ignore` list (not yet published).
