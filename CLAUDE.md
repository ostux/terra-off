# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Vue 3 application using the latest release candidate with Vite, TypeScript, Pinia for state management, Vue Router, and Tailwind CSS v4. The project uses Bun as the package manager and runtime.

## Mandatory Rules

### Component Architecture
- **Views must be minimal**: Views should be as small as possible and composed from reusable components
- **Component reusability is critical**: Create reusable and configurable components wherever possible to maintain code quality
- **Structured component organization**: Components must be organized in structured folders, NOT all in a single flat folder

### Code Standards
- **Tailwind v4 syntax only**: Always use Tailwind CSS v4 syntax for all styling
- **TypeScript required**: All code must be written in TypeScript
- **Type-check before completion**: `bun run type-check` MUST pass before any task is considered complete
- **Use Bun exclusively**: Always use `bun` commands, NEVER use `npm`

### Localization
- **vue-i18n for translations**: The application uses vue-i18n for internationalization
- **Use Composition API**: Always use `useI18n()` composable in components, NOT the legacy `$t` global property
- **Only maintain English in development**: Only update `src/assets/lang/en-GB.json` during development
- **Other languages synced on request**: Language files other than en-GB are synchronized separately on request
- **No untranslated text in components**: HTML components CANNOT contain hardcoded/untranslated text
- **Use vue-i18n pluralization**: Pluralization MUST use vue-i18n's built-in pluralization feature, NOT multiple separate keys

## Development Commands

```bash
# Install dependencies
bun install

# Development server with hot reload
bun dev

# Build for production (runs type-check + build-only in parallel)
bun run build

# Type checking only
bun run type-check

# Build without type checking
bun run build-only

# Preview production build
bun run preview

# Run unit tests (Vitest)
bun test:unit

# Lint (runs both oxlint and eslint sequentially)
bun lint

# Format code (Prettier)
bun run format
```

## Architecture

### Vue Setup
- Using Vue 3 Release Candidate (`"vue": "rc"`)
- Composition API pattern for components and stores (see `src/stores/counter.ts`)
- Single File Components with `<script setup lang="ts">`

### State Management
- Pinia stores using Composition API style with `defineStore()`
- Stores located in `src/stores/`

### Routing
- Vue Router v5 with web history mode
- Router configuration in `src/router/index.ts`

### Internationalization
- vue-i18n v11 with Composition API (legacy mode disabled)
- Translation files in `src/assets/lang/` with en-GB as the master schema
- Type declarations in `env.d.ts` extend from en-GB.json for full type safety
- **Usage pattern:**
  ```vue
  <script setup lang="ts">
  import { useI18n } from 'vue-i18n';

  const { t } = useI18n();
  </script>

  <template>
    <p>{{ t('message.hello') }}</p>
  </template>
  ```
- Use vue-i18n pluralization syntax (e.g., `t('items', count)`) instead of multiple keys
- Other composable properties available: `d` (dates), `n` (numbers), `locale` (reactive locale)

### Styling
- Tailwind CSS v4 with Vite plugin (`@tailwindcss/vite`)
- Global styles in `src/main.css` and `src/assets/scss/index.scss`
- SCSS support via `sass-embedded`

### Path Aliases
- `@` → `src/` (configured in `vite.config.ts`)

### Linting Strategy
- Two-stage linting: oxlint runs first (fast), then ESLint
- oxlint configured via `.oxlintrc.json`
- ESLint flat config with Vue + TypeScript support
- Prettier for formatting (semi, single quotes, 100 char width)

### Testing
- Vitest with jsdom environment
- Test files in `src/__tests__/`
- Vue Test Utils for component testing

## Node Version Requirements

Requires Node.js `^22.18.0 || >=24.12.0`
