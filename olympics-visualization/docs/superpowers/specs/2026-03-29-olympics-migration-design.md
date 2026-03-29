# Olympics Visualization Migration Design

**Date:** 2026-03-29
**Topic:** Migration from Pure JS/D3 to React/Bun

## Overview
This document outlines the design for the migration of the Olympics Visualization project from a pure JS/jQuery/D3 implementation to a modern React-based application using Vite (and Bun). The goal is to preserve all original functionality (hatching, selection logic, transitions) while gaining the benefits of React's state management and component structure.

## Core Mandates
- **Preservation:** Faithful port of original D3 logic, especially for the custom World Map and Bubble Chart interactions.
- **Responsiveness:** Maintain a modern, responsive layout using React and CSS Grid/Flexbox.
- **Visual Richness:** Enhance tooltips and labels to match or exceed the original's aesthetic quality.

## Architecture

### 1. State Management (Zustand)
Global state will be managed by `useYearStore.js` to handle:
- `yearFilter`: { start, end }
- `countrySelection`: Array of up to 4 country codes.
- `filters`: current Sport, Discipline, and Event levels.
- `currentState`: Numerical level of drill-down (0: All, 1: Sport, 2: Discipline, 3: Event).

### 2. Main Layout (`MainComponent.jsx`)
- Fetches all necessary data (`dictionary.csv`, `summer_year_country_event.csv`, `world_population_full.csv`) once on mount.
- Renders the `Header` and a container for all visualizations.
- Manages the loading state and initial selection (e.g., France).

### 3. Visualizations (D3 + React Hooks)
Each visualization will follow a pattern:
- Use a `ref` for its SVG/container.
- Use `useEffect` to handle D3 initialization and updates when relevant state changes.
- Avoid unnecessary D3 re-renders by using surgical updates where possible.

#### Worldmap (`Worldmap.jsx`)
- **Projection:** Custom D3 Mercator projection.
- **Features:** Zoom/pan (via `d3-zoom`), hatching for non-selectable countries (diagonal pattern), tooltips on hover.
- **Interactions:**
    - Click to toggle country selection.
    - `Ctrl + Click` to clear other selections and focus on one country.
    - Responsive resizing.

#### Bubblechart (`Bubblechart.jsx`)
- **Layout:** D3 force simulation (`forceCollide`, `forceCenter`).
- **Drill-down:** Clicking a bubble advances the `currentState` and updates filters (Sport -> Discipline -> Event).
- **Navigation:** "Back" button to return to higher levels.

#### Scatterplot & Linechart
- Port existing D3 transition logic for smooth updates when years or countries change.
- Use `d3-axis` for responsive axes.

### 4. Tooltips (React Portals)
- Replace `d3-tip` with a unified React Tooltip component.
- The tooltip will be rendered into a portal at the document body level.
- Stylized with medal icons (🥇🥈🥉) and consistent colors matching the original's richness.

## Implementation Phases

### Phase 1: Infrastructure & Data
- Verify all CSV and JSON data are correctly loaded and parsed.
- Ensure `useYearStore` has all necessary actions and state.

### Phase 2: World Map & Selection
- Rebuild `Worldmap.jsx` with custom D3 Mercator and zoom.
- Implement hatching and `Ctrl + Click` selection logic.

### Phase 3: Charts & Interactions
- Refine `Bubblechart`, `Linechart`, and `Scatterplot`.
- Implement React-based tooltips for all charts.

### Phase 4: Polish & Validation
- Ensure responsive resizing works correctly for all charts.
- Match original font and color themes.
- Final validation against original requirements.

## Testing Strategy
- **Visual Regression:** Manually compare React version vs original JS version for behavioral consistency.
- **State Integrity:** Verify that changing filters in one chart correctly propagates to all others.
- **Responsiveness:** Test on various screen sizes.

## Future Visualization Suggestions (Roadmap)
1.  **Medal Tally Leaderboard (Horizontal Bar Chart):**
    - **Purpose:** Show the top 10 countries by total medal count dynamically based on the current year and sport filters.
    - **Interaction:** Clicking a bar filters the entire dashboard to that country.
2.  **Sunburst Partition:**
    - **Purpose:** Represent the hierarchy of Sport -> Discipline -> Event in a single circular view.
    - **Interaction:** Hover over segments to see medal distributions; click to "zoom" into a category.
3.  **Streamgraph:**
    - **Purpose:** Visualize medal trends over time for multiple countries simultaneously, highlighting dominance shifts.
    - **Interaction:** Hover to highlight a country's "stream" and see exact counts per year.

---
*Status: Approved*
