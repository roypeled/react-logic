import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';
import { themes as prismThemes } from 'prism-react-renderer';

const config: Config = {
  title: 'react-logic',
  tagline: 'Class-based logic + DI for React',
  favicon: 'img/logo.svg',

  url: 'https://example.com',
  baseUrl: '/',
  trailingSlash: false,

  organizationName: 'react-logic',
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
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  plugins: [
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
    repoUrl: 'https://github.com/your-org/react-logic',
  },

  themeConfig: {
    navbar: {
      title: 'react-logic',
      logo: { alt: 'react-logic', src: 'img/logo.svg' },
      items: [
        { type: 'docSidebar', sidebarId: 'mainSidebar', position: 'left', label: 'Docs' },
        { href: 'https://github.com/', label: 'GitHub', position: 'right' },
      ],
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
