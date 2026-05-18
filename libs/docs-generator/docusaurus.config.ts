import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';
import { themes as prismThemes } from 'prism-react-renderer';

const config: Config = {
  title: 'react-logic',
  tagline: 'Class-based logic + DI for React',
  favicon: 'img/logo.svg',

  url: process.env.DOCS_SITE_URL?.trim() || 'http://localhost:3000',
  baseUrl: process.env.DOCS_BASE_URL?.trim() || '/',
  trailingSlash: false,

  organizationName: 'roypeled',
  projectName: 'react-logic',

  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',

  presets: [
    [
      'classic',
      {
        docs: {
          // Docs live under /docs/* so the React landing page at pages/index.tsx
          // can own `/`.
          routeBasePath: 'docs',
          sidebarPath: './sidebars.ts',
          // Live `docs/` is the in-progress "Next" version. Snapshots in
          // `versioned_docs/` are cut per major release via
          // `npm run docs:version <X.0.0>` from this lib.
          includeCurrentVersion: true,
          lastVersion: '0.1.1',
          versions: {
            current: { label: 'Next', path: 'next' },
          },
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  plugins: [
    // Resolve @react-logic/* to source via the custom exports condition,
    // matching what vite/vitest do. Without this, webpack bundles stale
    // dist/ output — breaks live reload and source maps in the demo.
    () => ({
      name: 'react-logic-resolve-source',
      configureWebpack: () => ({
        resolve: {
          conditionNames: ['@react-logic/source', '...'],
        },
      }),
    }),
    [
      'docusaurus-plugin-typedoc',
      {
        plugin: ['./typedoc-plugin.mjs'],
        theme: 'react-logic-md',
        entryPoints: [
          '../di/src/index.ts',
          '../core/src/index.ts',
          '../state/src/index.ts',
          '../utils/src/index.ts',
          '../angular-adapter/src/index.ts',
        ],
        tsconfig: './tsconfig.typedoc.json',
        out: 'docs/api',
        entryPointStrategy: 'expand',
        excludeInternal: true,
        excludePrivate: true,
        excludeProtected: true,
        // Strip inherited members that resolve to TypeScript's lib.*.d.ts —
        // otherwise our `Error` subclasses get docs for `stack`, `cause`,
        // `message` etc. inherited from the built-in `Error`.
        excludeExternals: true,
        exclude: ['**/*.spec.ts', '**/*.spec.tsx'],
        // The default title is `{kind}: {name}`, where `name` carries escaped
        // generics like `LogicClass\<T\>`. Those escapes leak into places that
        // don't run markdown (browser tab, breadcrumb). Strip the generics
        // entirely from the title — the full signature is in the page body.
        pageTitleTemplates: {
          member: ({ kind, rawName }: { kind: string; rawName: string }) =>
            `${kind}: ${rawName.replace(/<.*$/, '')}`,
        },
        // One file per export — the right-hand TOC then shows the per-export
        // outline (signature, parameters, properties, etc.).
        outputFileStrategy: 'members',
        // Drop the kind-based grouping (Functions / Variables / Classes /
        // Type Aliases / Interfaces) — `export const inject = ...` is a
        // "Variable" even though it's callable. Use `@category` JSDoc tags
        // (Hooks / Errors / Adapter / ...) instead, surfaced in the left
        // sidebar tree.
        excludeGroups: true,
        categorizeByGroup: false,
        // Order categories by importance instead of alphabetically. The
        // listed names come first in this order; `*` is the wildcard for
        // every other category (those fall back to alphabetical).
        categoryOrder: ['State', 'Hooks', 'Components', '*'],
        // The `@module` tags name modules `@react-logic/<lib>`. The leading
        // `@` collides with Docusaurus's `@site/` path alias when resolving
        // imports — so strip the scope from output paths while keeping it in
        // sidebar labels.
        excludeScopesInPaths: true,
      },
    ],
  ],

  // Single source of truth for repo links. The `<SourceLink>` component
  // reads this via `useDocusaurusContext().siteConfig.customFields.repoUrl`.
  customFields: {
    repoUrl: 'https://github.com/roypeled/react-logic',
    npmUrl: 'https://www.npmjs.com/package/@react-logic/react-logic',
  },

  themeConfig: {
    navbar: {
      title: 'react-logic',
      logo: { alt: 'react-logic', src: 'img/logo.svg' },
      items: [
        { type: 'docSidebar', sidebarId: 'mainSidebar', position: 'left', label: 'Docs' },
        { type: 'docsVersionDropdown', position: 'right' },
        { href: 'https://www.npmjs.com/package/@react-logic/react-logic', label: 'npm', position: 'right' },
        { href: 'https://github.com/roypeled/react-logic', label: 'GitHub', position: 'right' },
      ],
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
