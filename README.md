# Olympics Visualization

A modern, interactive data visualization dashboard for Summer Olympics historical data (1896 - 2012). The app is now a fully TypeScript React/Vite project with high-performance D3.js visualizations, shared state, responsive layouts, and runtime CSV/JSON data loading.

This visualization was initially developed as a project for the Masters Course Information Visualization at Lisbon Técnico but turned into sort of a hobby of mine.

## Features

- **Interactive World Map:** Custom D3.js Mercator projection with zoom/pan and country selection.
- **Dynamic Bubble Chart:** Force-directed simulation to explore medals by Sport, Discipline, and Event.
- **Comparative Trends:** Line charts and scatter plots with synchronized multi-country selection (up to 4).
- **Stacked Medal Bars:** Gold, silver, and bronze composition for selected countries across the active year and sport filters.
- **Population Efficiency:** Medal output normalized by average population, shown as medals per million people.
- **Reorderable Dashboard:** Toggle reorder mode to move and resize visualizations in a responsive grid.
- **Modern UI:** Built with Material UI and styled using the elegant Catppuccin color palette.
- **Responsive Layout:** Dynamic grid system powered by `react-grid-layout`.
- **Asynchronous Data:** High-performance runtime fetching of CSV/JSON datasets.

## Tech Stack

- **Framework:** [React 18](https://react.dev/) with 100% [TypeScript](https://www.typescriptlang.org/) application code
- **Build Tool:** [Vite](https://vitejs.dev/)
- **Visualization:** [D3.js](https://d3js.org/) for SVG rendering, force simulation, axes, scales, maps, and transitions
- **State Management:** [Zustand](https://github.com/pmndrs/zustand)
- **UI Components:** [Material UI](https://mui.com/)
- **Grid Layout:** [React Grid Layout](https://github.com/STRML/react-grid-layout)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/), component CSS, and [Catppuccin](https://catppuccin.com/)
- **Deployment:** GitHub Pages via GitHub Actions, with custom domain support

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/) or [Bun](https://bun.sh/)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/ayydany/Olympics-Visualization.git
   cd Olympics-Visualization
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

### Building for Production

To create an optimized production build:
```bash
npm run build
```

With Bun:
```bash
bun run build
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---
Made with ❤️ by [ayydany](https://ayydany.com)
