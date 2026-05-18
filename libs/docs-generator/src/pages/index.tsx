import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import CodeBlock from '@theme/CodeBlock';
import Layout from '@theme/Layout';
import { computedState, inject, state, useLogic } from '@react-logic/react-logic';
import { fetchState } from '@react-logic/utils';
import styles from './index.module.css';
import { GrungeCanvas } from '../components/GrungeCanvas';

const features = [
  'Component logic separated from the render cycle',
  'True reactive state based on signals',
  'Shared functionality with dependency injection'
];

const currentYear = new Date().getFullYear();
const YEARS = new Array(5).fill(0).map((_, i) => currentYear - i).reverse();
const defaultYear = YEARS.at(-1) ?? currentYear;

const SNIPPET_LOGIC = `// Top Wikipedia articles for a chosen year in a specific day

class ItemsService {
  data = fetchState((year = '${defaultYear}') => getUrl(year));

  items = computedState(() => this.data()?.items.at(0)?.articles ?? []);
}

class ItemsLogic {
  service = inject(ItemsService);

  filtered = computedState((q = '') => {
    const gx = new RegExp(q, 'i');
    return this.service.items().filter(a => gx.test(a.article));
  });
}

const App = () => {
  const l = useLogic(ItemsLogic);
  return (
    <div>
      <select onChange={e => l.service.data.fetch(e.target.value)}>
        { YEARS.map(y => <option key={y}>{y}</option>) }
      </select>
      <input onChange={e => l.filtered(e.target.value)} />
      <ul>
        { l.filtered().map(a => <li key={a.rank}>{a.article}</li>) }
      </ul>
    </div>
  );
};`;

const SNIPPET_REACT = `// Top Wikipedia articles for a chosen year in a specific day

const cache = new Map();

const App = () => {
  const [year, setYear] = useState('${defaultYear}');
  const [items, setItems] = useState(() => cache.get('${defaultYear}') ?? []);
  const [query, setQuery] = useState('');

  const regex = useMemo(
    () => new RegExp(query, 'i'),
    [query]
  );

  useEffect(() => {
    if (cache.has(year)) { setItems(cache.get(year)); return; }
    const controller = new AbortController();
    (async () => {
      try {
        const r = await fetch(getUrl(year), { signal: controller.signal });
        const data = await r.json();
        const next = data.items.at(0)?.articles ?? [];
        cache.set(year, next);
        setItems(next);
      } catch (e) {
        if (e.name === 'AbortError') return;
        throw e;
      }
    })();
    return () => controller.abort();
  }, [year]);

  const filtered = useMemo(
    () => items.filter(a => regex.test(a.article)),
    [items, regex]
  );

  return (
    <div>
      <select onChange={e => setYear(e.target.value)}>
        { YEARS.map(y => <option key={y}>{y}</option> )}
      </select>
      <input onChange={e => setQuery(e.target.value)} />
      <ul>
        {filtered.map(a => <li key={a.rank}>{a.article}</li>)}
      </ul>
    </div>
  );
};`;

// Wikimedia "top pageviews" REST endpoint. Year drives the URL; the
// fetchState wrapper aborts the in-flight request when the user picks a
// different year. Month/day are fixed to 04-08 (NA solar eclipse in 2024)
// so the same path probes each year's same-date top articles.

const wikiUrl = (year: number) =>
  `https://wikimedia.org/api/rest_v1/metrics/pageviews/top/en.wikipedia/all-access/${year}/01/01`;
const isBrowser = typeof window !== 'undefined';

interface WikiArticle {
  article: string;
  views: number;
  rank: number;
}
interface WikiResponse {
  items: Array<{ articles: WikiArticle[] }>;
}

class ItemsService {
  data = fetchState<(year?: number) => string | null, WikiResponse>(
    (year = defaultYear) => (isBrowser ? wikiUrl(year) : null)
  );

  // Surface the article list (dropping Main_Page / Special: / Wikipedia:).
  // The wrapped state is { loading, failed, result? } — pull articles from
  // the result branch, treat loading/failed as empty.
  articles = computedState(() => {
    const s = this.data();
    // 'result' narrows to the success variant — covers idle/loading/failed
    // in one fall-through.
    const items =
      'result' in s ? s.result.items.at(0)?.articles ?? [] : [];
    return items.filter(
      (a) => !/^(Main_Page|Special:|Wikipedia:)/.test(a.article)
    );
  });
}

class ItemsLogic {
  service = inject(ItemsService);
  filtered = computedState((q) => {
    const regex = new RegExp(q ?? '', 'i');
    return this.service.articles().filter((a) => regex.test(a.article));
  });
}

const WikiList = () => {
  const l = useLogic(ItemsLogic);
  const filtered = l.filtered();
  return (
    <>
      <select
        className={styles.demoInput}
        defaultValue={defaultYear}
        onChange={(e) => l.service.data.fetch(Number(e.target.value))}
      >
        {YEARS.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
      <input
        className={styles.demoInput}
        placeholder="filter…"
        onChange={(e) => l.filtered(e.target.value)}
      />
      <ul className={styles.demoList}>
        {filtered.length === 0 ? (
          <li className={styles.demoEmpty}>no matches</li>
        ) : (
          filtered
            .map((a) => <li key={a.article}>{a.article.replace(/_/g, ' ')}</li>)
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
      <div className={styles.example}>
        <div className={styles.snippet}>
          <CodeBlock language="jsx" showLineNumbers={false} className={styles.codeBlockContainer}>
            {showLogic ? SNIPPET_LOGIC : SNIPPET_REACT}
          </CodeBlock>
        </div>
        <aside className={styles.demo}>
          <div className={styles.demoLabel}>{'// LIVE'}</div>
          <WikiList />
        </aside>
        <nav className={styles.menu}>
          <p className={styles.menuPitch}>
            {showLogic ? (
              <>
                Cancellable fetch. Cached. Filtered.
                <br />
                <strong>Twenty-ish lines.</strong>
              </>
            ) : (
              <>
                Three hooks. Manual abort. A Map for cache.
                <br />
                <strong>Try it the other way.</strong>
              </>
            )}
          </p>
          <button
            type="button"
            className={styles.menuButton}
            onClick={() => mode.useReactLogic(!showLogic)}
          >
            {showLogic ? '// try react without logic' : '// try with react-logic'}
          </button>
        </nav>
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
