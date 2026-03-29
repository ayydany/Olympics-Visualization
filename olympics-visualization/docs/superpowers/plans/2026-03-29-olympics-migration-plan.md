# Olympics Visualization Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the Olympics visualization to React with full original D3 functionality and React Portals for tooltips.

**Architecture:** Component-based visualizations using D3 for rendering and Zustand for state. Custom D3 Mercator for map control. React Portals for consistent tooltips.

**Tech Stack:** React, D3, Zustand, Vite, Vitest, Bootstrap, react-simple-maps (to be replaced with custom D3 in Worldmap).

---

### Task 1: Setup Vitest & Test Infrastructure

**Files:**
- Modify: `olympics-visualization/package.json`
- Create: `olympics-visualization/vitest.config.js`
- Modify: `olympics-visualization/src/App.test.js`

- [ ] **Step 1: Install Vitest**

Run: `npm install -D vitest @vitest/ui jsdom @testing-library/react @testing-library/jest-dom`

- [ ] **Step 2: Create `vitest.config.js`**

```javascript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
  },
});
```

- [ ] **Step 3: Update `package.json` scripts**

Update "test": `"vitest"`

- [ ] **Step 4: Update `App.test.js` to something meaningful**

```javascript
import { render, screen } from '@testing-library/react';
import App from './App';
import { expect, test } from 'vitest';

test('renders app header subtitle', () => {
  render(<App />);
  const subtitle = screen.getByText(/Olympics Visualization - Made with ❤️/i);
  expect(subtitle).toBeInTheDocument();
});
```

- [ ] **Step 5: Run tests and verify they pass**

Run: `npm test`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add olympics-visualization/package.json olympics-visualization/vitest.config.js olympics-visualization/src/App.test.js
git commit -m "chore: setup vitest and basic test"
```

---

### Task 2: Update `useYearStore.js` for Selection Logic

**Files:**
- Modify: `olympics-visualization/src/store/useYearStore.js`
- Create: `olympics-visualization/src/store/useYearStore.test.js`

- [ ] **Step 1: Write failing tests for `toggleCountry` with Ctrl-click behavior**

```javascript
import { renderHook, act } from '@testing-library/react';
import useYearStore from './useYearStore';
import { expect, test, describe, beforeEach } from 'vitest';

describe('useYearStore', () => {
  beforeEach(() => {
    act(() => {
      useYearStore.getState().resetState();
      useYearStore.getState().setDefaultCountries(['FRA']);
    });
  });

  test('toggleCountry should add a country if not selected', () => {
    act(() => {
      useYearStore.getState().toggleCountry('USA');
    });
    expect(useYearStore.getState().countrySelection).toContain('USA');
  });

  test('toggleCountry with isCtrlKey should clear other selections', () => {
    act(() => {
      useYearStore.getState().toggleCountry('USA', true);
    });
    expect(useYearStore.getState().countrySelection).toEqual(['USA']);
  });
});
```

- [ ] **Step 2: Update `toggleCountry` implementation**

```javascript
  toggleCountry: (code, isCtrlKey = false) =>
    set((state) => {
      if (isCtrlKey) {
        return { countrySelection: [code] };
      }
      if (state.countrySelection.includes(code)) {
        return {
          countrySelection: state.countrySelection.filter((c) => c !== code),
        };
      }
      if (state.countrySelection.length >= 4) {
        return {};
      }
      return { countrySelection: [...state.countrySelection, code] };
    }),
```

- [ ] **Step 3: Run tests and verify they pass**

Run: `npm test src/store/useYearStore.test.js`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add olympics-visualization/src/store/useYearStore.js olympics-visualization/src/store/useYearStore.test.js
git commit -m "feat: add Ctrl-click logic to useYearStore"
```

---

### Task 3: Create React Tooltip Portal

**Files:**
- Create: `olympics-visualization/src/components/common/Tooltip.jsx`
- Create: `olympics-visualization/src/components/common/Tooltip.css`
- Modify: `olympics-visualization/src/components/main/MainComponent.jsx`

- [ ] **Step 1: Create `Tooltip.jsx`**

```javascript
import React from 'react';
import ReactDOM from 'react-dom';
import './Tooltip.css';

const Tooltip = ({ show, content, x, y }) => {
  if (!show) return null;

  return ReactDOM.createPortal(
    <div 
      className="custom-tooltip show" 
      style={{ left: x + 12, top: y - 12 }}
    >
      <div className="tooltip-inner" dangerouslySetInnerHTML={{ __html: content }} />
    </div>,
    document.body
  );
};

export default Tooltip;
```

- [ ] **Step 2: Create `Tooltip.css`**

```css
.custom-tooltip {
    position: absolute;
    z-index: 1070;
    pointer-events: none;
    max-width: 200px;
}

.custom-tooltip .tooltip-inner {
    padding: 0.5rem 0.8rem;
    color: #fff;
    text-align: center;
    background-color: rgba(0, 0, 0, 0.9);
    border-radius: 0.4rem;
    font-size: 0.875rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
}

.custom-tooltip .tooltip-inner center {
    margin: 4px 0;
}
```

- [ ] **Step 3: Update `MainComponent.jsx` to manage tooltip state**

Add `tooltipState`: `{ show, content, x, y }` and pass `setTooltipState` to children if needed (or use store). Let's use store for tooltips too.

- [ ] **Step 4: Commit**

```bash
git add olympics-visualization/src/components/common/Tooltip.jsx olympics-visualization/src/components/common/Tooltip.css
git commit -m "feat: add React Portal-based Tooltip component"
```

---

### Task 4: Rebuild Worldmap with D3 Mercator

**Files:**
- Modify: `olympics-visualization/src/components/visualizations/Worldmap.jsx`
- Modify: `olympics-visualization/src/components/visualizations/Worldmap.css`

- [ ] **Step 1: Replace implementation with Custom D3 Mercator**

Port logic from `js/worldmap.js`:
- `d3.geoMercator()` projection.
- `d3.zoom()` for pan/zoom.
- `diagonalHatch` pattern definition.
- Custom path rendering with D3.

- [ ] **Step 2: Implement Hatching Pattern**

Define the SVG `<defs>` with the pattern at the top level of the map SVG.

- [ ] **Step 3: Handle resize responsiveness**

Add window resize listener or use `ResizeObserver`.

- [ ] **Step 4: Commit**

```bash
git add olympics-visualization/src/components/visualizations/Worldmap.jsx olympics-visualization/src/components/visualizations/Worldmap.css
git commit -m "feat: rebuild Worldmap with custom D3 Mercator and hatching"
```

---

### Task 5: Refine Bubblechart Interaction

**Files:**
- Modify: `olympics-visualization/src/components/visualizations/Bubblechart.jsx`

- [ ] **Step 1: Refine Tooltip Content**

Format tooltip HTML to match original (medal icons with colors).

- [ ] **Step 2: Refine Force Simulation Strength**

Adjust `forceManyBody` and `collide` to match original's "feel".

- [ ] **Step 3: Commit**

```bash
git add olympics-visualization/src/components/visualizations/Bubblechart.jsx
git commit -m "refactor: refine Bubblechart interaction and tooltip"
```

---

### Task 4: Polish Scatterplot & Linechart

**Files:**
- Modify: `olympics-visualization/src/components/visualizations/Scatterplot.jsx`
- Modify: `olympics-visualization/src/components/visualizations/Linechart.jsx`

- [ ] **Step 1: Use shared Tooltip component**

- [ ] **Step 2: Ensure transitions match original animation time (750ms)**

- [ ] **Step 3: Commit**

```bash
git add olympics-visualization/src/components/visualizations/Scatterplot.jsx olympics-visualization/src/components/visualizations/Linechart.jsx
git commit -m "refactor: polish Scatterplot and Linechart transitions"
```
