# Olympics Visualization

An interactive dashboard for exploring Summer Olympics data from 1896 to 2012.

This visualization was initially developed as a project for the Masters Course Information Visualization at Lisbon Técnico but turned into sort of a hobby of mine.

The project has changed quite a bit since the first version. It is now a 100% TypeScript app built with React, Vite, and D3.js, with the data loaded from CSV/JSON files at runtime. The goal is still simple: make it easy to move between countries, years, sports, and medal breakdowns without losing the bigger picture.

## Features

- **World map:** Select countries directly from a D3-rendered map with zoom and pan support.
- **Bubble chart:** Explore medals by sport, discipline, and event through a force-based view.
- **Line and scatter charts:** Compare selected countries across years and medal totals.
- **Stacked medal bars:** See gold, silver, and bronze composition for the active country, year, and sport filters.
- **Population efficiency:** Compare medal output normalized by average population.
- **Responsive dashboard:** Move and resize visualizations through a grid layout built for desktop and smaller screens.
- **Runtime data loading:** Load the Olympics, population, and world map datasets from public CSV/JSON files.

## Tech Stack

- **Framework:** [React 18](https://react.dev/) with 100% [TypeScript](https://www.typescriptlang.org/) application code
- **Build Tool:** [Vite](https://vitejs.dev/)
- **Visualization:** [D3.js](https://d3js.org/) for SVG rendering, force simulation, axes, scales, maps, and transitions
- **State Management:** [Zustand](https://github.com/pmndrs/zustand)
- **UI Components:** [Material UI](https://mui.com/)
- **Grid Layout:** [React Grid Layout](https://github.com/STRML/react-grid-layout)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/), component CSS, and [Catppuccin](https://catppuccin.com/)
- **Tooling:** Bun and npm scripts for local development, testing, and production builds
- **Deployment:** GitHub Pages through GitHub Actions

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
Made with love by [ayydany](https://ayydany.com)
