# Design Spec: Task 4 - Final Polishing & Verification

**Goal:** Modernize the project documentation, update project metadata, and verify the build.

## 1. README.md Modernization

The current `README.md` is a Create React App boilerplate. I will replace it with a modern version that accurately reflects the current state of the project (Vite, D3, TS, etc.).

### Proposed Content:
- **Title:** Olympics Visualization
- **Description:** An interactive dashboard for exploring historical Olympics data.
- **Key Features:**
    - World Map of medal counts.
    - Bubble charts for athlete demographics.
    - Line charts for participation trends.
    - Scatter plots for performance metrics.
- **Tech Stack:**
    - **Frontend:** React, Vite, TypeScript.
    - **Data Visualization:** D3.js, React Simple Maps.
    - **State Management:** Zustand.
    - **UI Library:** Material UI (MUI).
    - **Styling:** CSS Modules, Tailwind CSS.
- **Getting Started:**
    ```bash
    npm install
    npm run dev
    ```
- **Building for Production:**
    ```bash
    npm run build
    ```

## 2. package.json Updates

Update the root `package.json` to reflect the final project state.

### Changes:
- **name:** "olympics-visualization" (already set, will confirm).
- **version:** "1.0.0" (to mark the completion of the modernization).
- **description:** "Interactive Olympics Data Visualization dashboard built with React, D3.js, and TypeScript."

## 3. Verification Strategy

- Run `npm run build` to ensure the project bundles correctly without errors.
- Check that the build output (dist/ folder) is generated.

## 4. Commitment

- `git add .`
- `git commit -m "docs: add modern README and final project cleanup"`
