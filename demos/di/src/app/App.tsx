import { Injector, useLogic } from '@react-logic/react-logic';
import {
  CartStore,
  CatalogService,
  HeaderLogic,
  ListLogic,
  TaxControls,
} from './logic';
import styles from './styles.module.css';

const Header = () => {
  const logic = useLogic(HeaderLogic);
  return (
    <div className={styles.header}>
      <span>🛒 Cart</span>
      <span className={styles.headerBadge}>
        {logic.cart.count()} · ${logic.cart.total()}
      </span>
    </div>
  );
};

const List = () => {
  const logic = useLogic(ListLogic);
  return (
    <>
      <ul className={styles.list}>
        {logic.catalog.items.map((item) => (
          <li key={item.id}>
            <span>
              {item.label} <small>(${item.price})</small>
            </span>
            <button
              className={styles.btn}
              onClick={() => logic.cart.add(item)}
            >
              + Add
            </button>
          </li>
        ))}
      </ul>
      <button className={styles.clear} onClick={() => logic.cart.clear()}>
        Empty cart
      </button>
    </>
  );
};

const TaxBar = () => {
  const tax = useLogic(TaxControls);
  const presets = [0, 0.08, 0.17, 0.25];
  return (
    <div className={styles.taxBar}>
      <span className={styles.taxLabel}>Tax (parent scope):</span>
      {presets.map((rate) => (
        <button
          key={rate}
          className={
            rate === tax.current()
              ? `${styles.taxBtn} ${styles.taxBtnActive}`
              : styles.taxBtn
          }
          onClick={() => tax.set(rate)}
        >
          {Math.round(rate * 100)}%
        </button>
      ))}
    </div>
  );
};

const Shop = ({ label }: { label: string }) => (
  // A fresh <Injector> per shop scopes the CartStore — Shop A and B each
  // get their own instance. The Header/List inside each subtree resolves
  // through THIS scope only.
  <Injector provide={[CartStore]}>
    <section className={styles.shop}>
      <h2 className={styles.shopTitle}>{label}</h2>
      <Header />
      <List />
    </section>
  </Injector>
);

export const App = () => (
  // Outer Injector — `CatalogService` lives here. Both shops resolve it
  // through their own scope's parent, so they share the same instance.
  <Injector provide={[CatalogService]}>
    <main>
      <h1>Dependency injection demo</h1>
      <p className="subtitle">
        Outer <code>&lt;Injector&gt;</code> shares a <code>CatalogService</code>{' '}
        (catalog + tax rate). Each shop's inner <code>&lt;Injector&gt;</code>{' '}
        scopes a separate <code>CartStore</code>. Add to one cart — the
        other doesn't budge; change the tax — both totals update.
      </p>
      <TaxBar />
      <div className={styles.shopGrid}>
        <Shop label="Shop A" />
        <Shop label="Shop B" />
      </div>
      <p className={styles.hint}>
        Resolution walks up: <code>CartStore</code> resolves at the shop
        scope; <code>CartStore.catalog = inject(CatalogService)</code>{' '}
        walks one more level to the outer scope.
      </p>
    </main>
  </Injector>
);
