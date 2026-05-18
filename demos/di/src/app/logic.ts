import {
  computedState,
  inject,
  state,
} from '@react-logic/react-logic';

export interface Item {
  id: number;
  label: string;
  price: number;
}

/**
 * Parent scope — shared by every shop. Holds the catalog of items and a
 * global tax rate. Both shops see the same items and reflect the same tax
 * when totals are computed; flipping the tax rate at the page level
 * re-renders both shop subtrees.
 */
export class CatalogService {
  items: readonly Item[] = [
    { id: 1, label: 'Espresso', price: 3 },
    { id: 2, label: 'Latte', price: 4 },
    { id: 3, label: 'Croissant', price: 5 },
  ];

  /** Reactive global — change at the page level, every shop reacts. */
  taxRate = state(0);

  /** Apply current tax rate to a subtotal. */
  withTax(subtotal: number): number {
    return Math.round(subtotal * (1 + this.taxRate()) * 100) / 100;
  }
}

/**
 * Per-shop scope — one instance per `<Injector provide={[CartStore]}>`
 * subtree. Reads from the parent `CatalogService` (which lives one scope
 * up) for tax-adjusted totals.
 */
export class CartStore {
  catalog = inject(CatalogService);
  items = state<Item[]>([]);
  count = computedState(() => this.items().length);
  subtotal = computedState(() =>
    this.items().reduce((sum, i) => sum + i.price, 0)
  );
  total = computedState(() => this.catalog.withTax(this.subtotal()));
  add(item: Item) { this.items([...this.items(), item]); }
  clear()         { this.items([]); }
}

export class HeaderLogic {
  cart = inject(CartStore);
}

export class ListLogic {
  cart = inject(CartStore);
  catalog = inject(CatalogService);
}

/** Page-level controls — lives outside any shop, mutates the parent
 *  `CatalogService` so all shops downstream re-render. */
export class TaxControls {
  catalog = inject(CatalogService);
  set(rate: number) { this.catalog.taxRate(rate); }
  current()         { return this.catalog.taxRate(); }
}
