# Olympics Visualization

An interactive, modern web application for visualizing historical Olympic Games data. This project provides deep insights into athlete demographics, participation trends, and medal distributions across different years and countries.

## 🚀 Features

- **Interactive World Map:** Visualize medal counts by country using an interactive map interface.
- **Bubble Chart:** Explore athlete demographics and medal distributions.
- **Line Chart:** Track participation and performance trends over the years.
- **Scatter Plot:** Analyze correlations between different athlete metrics.
- **Year Navigation:** Seamlessly switch between different Olympic years to see how the games have evolved.

## 🛠 Tech Stack

- **Frontend:** [React](https://reactjs.org/) (v18+) with [TypeScript](https://www.typescriptlang.org/)
- **Build Tool:** [Vite](https://vitejs.dev/)
- **Data Visualization:** [D3.js](https://d3js.org/) and [React Simple Maps](https://www.react-simple-maps.io/)
- **State Management:** [Zustand](https://github.com/pmndrs/zustand)
- **UI Library:** [Material UI (MUI)](https://mui.com/)
- **Styling:** CSS Modules and [Tailwind CSS](https://tailwindcss.com/)

## 📂 Project Structure

- `src/features/dashboard`: Core visualization components (Map, Charts, etc.)
- `src/stores`: Zustand store for global state management (e.g., year selection)
- `src/utils/api.ts`: Data loading and processing utilities
- `public/data`: Datasets used for visualizations (CSV and JSON)

## 🏁 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or bun

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

### Development

Run the development server:
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### Building for Production

Create an optimized production build:
```bash
npm run build
```

## 📜 License

This project is for educational and visualization purposes.
