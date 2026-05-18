// Custom theme for typedoc-plugin-markdown.
//
// Override individual partials to wrap the default theme's bare-text bits in
// HTML elements with classes the Docusaurus CSS can target. Each override is
// a one-liner: call the original partial, then transform the string.
//
// Reference for available partials:
//   node_modules/typedoc-plugin-markdown/dist/theme/markdown-theme-context.d.ts
//
// Only wrap block-level partials (whole sections). Inline partials
// (memberTitle, declarationTitle, signatureTitle, ...) get spliced into
// headings or other partials' output, so wrapping them in a <div> would
// inject block-level HTML inside an inline context and break rendering.

import { MarkdownPageEvent, MarkdownTheme, MarkdownThemeContext } from 'typedoc-plugin-markdown';

/**
 * Wrap a partial so its output passes through `implementation` before being
 * emitted. The original `this`-binding has to be done by the caller.
 *
 * @template T
 * @param {T} original  Bound partial function.
 * @param {(md: string) => string} implementation  Transform applied to the output.
 * @returns {T}
 */
const extendsPartial = (original, implementation) => {
  return (...args) => {
    const md = original(...args);
    if (!md) return md;
    return implementation(md);
  };
};

class CustomThemeContext extends MarkdownThemeContext {
  constructor(theme, page, options) {
    super(theme, page, options);

    const wrap = (key, klass = key) => {
      const original = this.partials[key]?.bind(this);
      if (!original) return;
      // `\n\n` around the inner content lets MDX continue to parse the
      // markdown inside the div as block content.
      this.partials[key] = extendsPartial(
        original,
        (md) => `<div class="api-${klass}">\n\n${md}\n\n</div>`
      );
    };

    // Whitelist of block-level partials worth styling. Add entries as the
    // need arises; check the partials' output before adding to make sure
    // wrapping is safe.
    wrap('sources');
    wrap('inheritance');
    wrap('hierarchy');
    wrap('parametersList', 'parameters');
    wrap('parametersTable', 'parameters');
    wrap('propertiesTable', 'properties');
    // The `> **Name**\<T\>(...): T` blockquote at the top of a member page.
    // declarationTitle: type aliases / variables. signatureTitle: function
    // and method overloads.
    wrap('declarationTitle', 'signature');
    wrap('signatureTitle', 'signature');
  }
}

class CustomMarkdownTheme extends MarkdownTheme {
  getRenderContext(page) {
    return new CustomThemeContext(this, page, this.application.options);
  }
}

/**
 * Map a generated page's filename back to its npm package.
 *
 * Pages live under `docs/api/<dir>/<kind>/<name>.md` where `<dir>` is the
 * `excludeScopesInPaths`-stripped scope (e.g. `core`, `di`, `state`,
 * `angular-adapter`). Index/landing pages are skipped.
 */
const packageForPage = (filename) => {
  if (!filename) return undefined;
  const norm = filename.replace(/\\/g, '/');
  const m = norm.match(/\/api\/([^/]+)\/(?:functions|variables|classes|interfaces|type-aliases)\//);
  if (!m) return undefined;
  return `@react-logic/${m[1]}`;
};

/** @param {import('typedoc').Application} app */
export function load(app) {
  app.renderer.defineTheme('react-logic-md', CustomMarkdownTheme);

  app.renderer.on(MarkdownPageEvent.END, (page) => {
    if (!page.contents) return;
    const pkg = packageForPage(page.filename);
    if (!pkg) return;
    // Inject "Imported from `@react-logic/...`" right after the H1 so it
    // shows up at the top of the rendered page, replacing the per-package
    // grouping the sidebar used to provide.
    page.contents = page.contents.replace(
      /^(#\s[^\n]+\n)/,
      `$1\n<div class="api-package">Imported from <code>${pkg}</code></div>\n\n`
    );
  });
}
