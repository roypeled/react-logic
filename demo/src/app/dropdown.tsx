import { useLogic } from '@react-logic/core';
import { computedState, state } from '@react-logic/state';
import React, { useEffect, useRef } from 'react';
import { effect } from '@react-logic/state';

const list = [
  { id: '1', label: 'Apple' },
  { id: '2', label: 'Banana' },
  { id: '3', label: 'Cherry' },
  { id: '4', label: 'Date' },
  { id: '5', label: 'Elderberry' },
  { id: '6', label: 'Fig' },
  { id: '7', label: 'Grape' },
  { id: '8', label: 'Honeydew' },
  { id: '9', label: 'Kiwi' },
  { id: '10', label: 'Lemon' },
  { id: '11', label: 'Mango' },
  { id: '12', label: 'Nectarine' },
  { id: '13', label: 'Orange' },
  { id: '14', label: 'Papaya' },
  { id: '15', label: 'Quince' },
  { id: '16', label: 'Raspberry' },
  { id: '17', label: 'Strawberry' },
  { id: '18', label: 'Tangerine' },
  { id: '19', label: 'Ugli Fruit' },
  { id: '20', label: 'Watermelon' }
];

class DropdownLogic {
  // Configurable list of items
  private items = state(list);

  private selectedIndex = state(-1);
  private regexFilter = computedState(() => this.filter().trim() ? new RegExp(this.filter(), 'i') : null);

  open = state(false);
  highlightedIndex = state(-1);
  filter = state('');

  filteredItems = computedState(() => {
    const gx = this.regexFilter();
    return gx ? this.items().filter((i) => gx.test(i.label)) : this.items();
  });

  selectedItem = computedState(() => {
    return this.filteredItems()[this.selectedIndex()] || null;
  });

  constructor() {
    effect(() => {
      // Reset highlighted index when menu is opened or filter changes
      this.open();
      this.filter();

      this.highlightedIndex(0);
    });
  }

  openMenu() {
    this.open(true);
  }

  closeMenu() {
    this.open(false);
  }

  toggle() {
    this.open() ? this.closeMenu() : this.openMenu();
  }

  setFilter(v: string) {
    this.filter(v);
  }

  highlightNext() {
    this.setHighlightedIndex(this.highlightedIndex() + 1);
  }

  highlightPrev() {
    this.setHighlightedIndex(this.highlightedIndex() - 1);
  }

  private setHighlightedIndex(idx: number) {
    const list = this.filteredItems();
    const next = Math.max(Math.min(idx, list.length - 1), 0);
    this.highlightedIndex(next);
  }

  selectHighlighted() {
    const idx = this.highlightedIndex();
    if (idx < 0) return;
    this.selectedIndex(idx);
    this.closeMenu();
  }

  selectIndex(idx:number) {
    this.selectedIndex(idx);
    this.highlightedIndex(idx);
    this.closeMenu();
  }

  onDown() {
    if (!this.open()) this.openMenu();
    else this.highlightNext();
  }

  onUp() {
    if (!this.open()) this.openMenu();
    else this.highlightPrev();
  }
}

export default function Dropdown() {
  const logic = useLogic(DropdownLogic);

  const list = logic.filteredItems();
  const highlighted = logic.highlightedIndex();
  const selected = logic.selectedItem();

  const onKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        logic.onDown();
        break;
      case 'ArrowUp':
        e.preventDefault();
        logic.onUp();
        break;
      case 'Enter':
        e.preventDefault();
        logic.selectHighlighted();
        break;
      case 'Escape':
        e.preventDefault();
        logic.closeMenu();
        break;
      default:
        break;
    }
  };

  return (
    <div style={{ maxWidth: 320 }}>
      <label htmlFor="dropdown-input" style={{ display: 'block', fontWeight: 600 }}>
        Choose a fruit
      </label>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          id="dropdown-input"
          type="text"
          placeholder="Type to filter..."
          value={logic.filter()}
          onChange={(e) => logic.setFilter(e.target.value)}
          onFocus={() => logic.openMenu()}
          onKeyDown={(e) => onKeyDown(e)}
          style={{ flex: 1 }}
        />
        <button type="button" onClick={() => logic.toggle()} aria-label="Toggle dropdown">
          {logic.open() ? '▲' : '▼'}
        </button>
      </div>

      {selected && (
        <p style={{ margin: '8px 0 0', color: '#555' }}>Selected: {selected.label}</p>
      )}

      {logic.open() && (
        <ul
          style={{
            marginTop: 8,
            padding: 0,
            listStyle: 'none',
            border: '1px solid #ddd',
            borderRadius: 4,
            maxHeight: 180,
            overflowY: 'auto'
          }}
        >
          {list.length === 0 && (
            <li style={{ padding: '8px 12px', color: '#999' }}>No results</li>
          )}
          {list.map((item, idx) =>
            <DropdownItem
              item={item}
              isHighlighted={idx === highlighted}
              onSelect={() => logic.selectIndex(idx)}
              onOver={() => logic.highlightedIndex(idx)}></DropdownItem>
          )}
        </ul>
      )}
    </div>
  );
}

const DropdownItem = ({ item, isHighlighted, onOver, onSelect }: {
  item: { id: string, label: string },
  isHighlighted: boolean,
  onOver: () => void,
  onSelect: () => void,
}) => {
  const ref = useRef<HTMLLIElement | null>(null);

  // Scroll highlighted item into view when it changes
  useEffect(() => {
    if (!isHighlighted) return;
    ref.current?.scrollIntoView({ block: 'nearest' });
  },  [isHighlighted, ref]);

  return (
    <li
      ref={ref}
      key={item.id}
      onMouseEnter={onOver}
      onMouseDown={(e) => {
        // Prevent input blur on click
        e.preventDefault();
      }}
      onClick={onSelect}
      style={{
        padding: '8px 12px',
        background: isHighlighted ? '#eef6ff' : 'white',
        cursor: 'pointer'
      }}
    >
      {item.label}
    </li>
  );
};

