import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import CodeBlock from '@theme/CodeBlock';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import styles from './index.module.css';
import { GrungeBackgroundOnly } from './GrungeBackground';

const features = [
  'Component logic separated from the render cycle',
  'True reactive state based on signals',
  'Shared functionality with dependency injection'
];

const SNIPPET = `class Counter {
  count = state(0);
  doubled = computedState(() => this.count() * 2);
  inc() { this.count(this.count() + 1); }
}

const App = () => {
  const c = useLogic(Counter);
  return (
    <button onClick={() => c.inc()}>
      {c.count()} × 2 = {c.doubled()}
    </button>
  );
};`;

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
        <GrungeBackgroundOnly className={styles.grungeBg}></GrungeBackgroundOnly>
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
        <div className={styles.snippet}>
          <CodeBlock language="tsx" showLineNumbers={false}>
            {SNIPPET}
          </CodeBlock>
        </div>
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
