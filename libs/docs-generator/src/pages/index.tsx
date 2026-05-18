import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from 'react';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import CodeBlock from '@theme/CodeBlock';
import Layout from '@theme/Layout';
import { useLogic } from '@react-logic/core';
import { inject } from '@react-logic/di';
import { asyncState, computedState, state } from '@react-logic/state';
import styles from './index.module.css';
import { GrungeBackgroundOnly } from './GrungeBackground';
import { GrungeCanvas } from '../components/GrungeCanvas';

const features = [
  'Component logic separated from the render cycle',
  'True reactive state based on signals',
  'Shared functionality with dependency injection'
];

const SNIPPET_LOGIC = `class ItemsService {
  items = asyncState(() => fetch('/items.json').then(r => r.json());
}

class ItemsLogic {
  service = inject(ItemsService);
  query = state('');
  regex = computedState(() => new RegExp(this.query(), 'i'));
  filtered = computedState(() => {
    const items = this.service.items();
    const regex = this.regex();
    if (!items) return [];
    return items.filter(i => regex.test(i.name));
  });
}

const App = () => {
  const l = useLogic(ItemsLogic);
  const onChange = e => l.query(e.target.value)
  return (
    <div>
      <input value={l.query()} onChange={onChange} />
      <ul>{l.filtered().map(i => <li key={i.id}>{i.name}</li>)}</ul>
    </div>
  );
};`;

const SNIPPET_REACT = `const App = () => {
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState('');

  const regex = useMemo(
    () => new RegExp(query, 'i'),
    [query]
  );

  useEffect(() => {
    let cancelled = false;
    fetch('/items.json')
      .then(r => r.json())
      .then(data => {
        if (cancelled) return;
        setItems(data);
      })
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(
    () => items.filter((i) => regex.test(i.name)),
    [items, regex]
  );

  const onChange = useCallback(
    e => setQuery(e.target.value),
    []
  );

  return (
    <div>
      <input value={query} onChange={onChange} />
      <ul>{filtered.map((i) => <li key={i.id}>{i.name}</li>)}</ul>
    </div>
  );
};`;

type Item = { id: number; name: string };

// Runtime equivalents of SNIPPET_LOGIC. Same shape — JS in the snippet,
// typed here. The fetch hits /demo-items.json (served from `static/`).
const ITEMS_URL = '/demo-items.json';
const isBrowser = typeof window !== 'undefined';

class ItemsService {
  items = asyncState(async () => {
    // SSR can't fetch with a relative URL — skip on the server.
    if (!isBrowser) return [] as Item[];
    const r = await fetch(ITEMS_URL);
    return (await r.json()) as Item[];
  });
}

class ItemsLogic {
  service = inject(ItemsService);
  query = state('');
  regex = computedState(() => new RegExp(this.query(), 'i'));
  filtered = computedState(() =>{
    const items = this.service.items();
    if (!items) return [];
    return items.filter(i => this.regex().test(i.name));
  });
}

const LiveCounter = () => {
  const l = useLogic(ItemsLogic);
  const filtered = l.filtered();
  return (
    <>
      <input
        className={styles.demoInput}
        placeholder="filter…"
        value={l.query()}
        onChange={(e) => l.query(e.target.value)}
      />
      <ul className={styles.demoList}>
        {filtered.length === 0 ? (
          <li className={styles.demoEmpty}>no matches</li>
        ) : (
          filtered.slice(0, 6).map((i) => <li key={i.id}>{i.name}</li>)
        )}
      </ul>
    </>
  );
};

class DemoMode {
  useReactLogic = state(true);
  toggle() {
    this.useReactLogic(!this.useReactLogic());
  }
}

const Example = () => {
  const mode = useLogic(DemoMode);
  const showLogic = mode.useReactLogic();
  return (
    <section className={styles.exampleWrap}>
      <nav className={styles.exampleTabs} role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={showLogic}
          onClick={() => mode.useReactLogic(true)}
          className={`${styles.exampleTab} ${showLogic ? styles.exampleTabActive : ''}`}
        >
          {'// with react-logic'}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={!showLogic}
          onClick={() => mode.useReactLogic(false)}
          className={`${styles.exampleTab} ${!showLogic ? styles.exampleTabActive : ''}`}
        >
          {'// react without logic'}
        </button>
      </nav>
      <div className={styles.example}>
        <div className={styles.snippet}>
          <CodeBlock language="jsx" showLineNumbers={false}>
            {showLogic ? SNIPPET_LOGIC : SNIPPET_REACT}
          </CodeBlock>
        </div>
        <aside className={styles.demo}>
          <div className={styles.demoLabel}>{'// LIVE'}</div>
          <LiveCounter />
        </aside>
      </div>
    </section>
  );
};

const random = () => Math.round(Math.random() * 40);

const randomAmount = () => ({ style: {
  ['--amount']: random() + '%',
    width: '200px'
  } });

export default function Home() {
  const { siteConfig } = useDocusaurusContext();

  return (
    <Layout title={siteConfig.title} description={siteConfig.tagline}>
      <header className={styles.hero}>
        <GrungeCanvas className={styles.grungeBg} />
        <div className={styles.logo} >
        </div>
        <div className={styles.logoBg} ></div>
        <h1 className={styles.title}>{siteConfig.title}</h1>
        <p className={styles.tagline}>
          A simple <em>logic</em> management library for React
        </p>
        <ul className={styles.features}>
          {features.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
        <Example />
        <div className={styles.actions}>
          <Link className="button button--primary button--lg" {...randomAmount()} to="/docs/getting-started">
            Get Started
          </Link>
          <Link
            className="button button--secondary button--lg reverse" {...randomAmount()}
            href="https://github.com/"
          >
            GitHub
          </Link>
        </div>
      </header>
    </Layout>
  );
}
