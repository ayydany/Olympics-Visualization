# Design Spec: Repository Restructuring & Modernization

**Date:** 2026-03-30
**Topic:** Repository Restructuring
**Status:** Approved (Pending Implementation)

## 1. Goal
Transform the "Olympics Visualization" repository into a professional, modern React/Vite/TypeScript portfolio piece by flattening the directory structure, removing legacy code, and modernizing data handling.

## 2. Structural Changes
The current nested structure (`/olympics-visualization/...`) will be flattened to the repository root.

### Target Directory Layout
```text
/ (Project Root)
├── docs/
│   └── superpowers/
│       ├── plans/ (Migration and restructuring plans)
│       └── specs/ (Design specifications)
├── public/
│   ├── data/ (CSV/JSON datasets)
│   ├── favicon.ico
│   └── manifest.json
├── src/
│   ├── app/ (Core App component, global styles, providers)
│   ├── components/ (Shared UI components)
│   ├── features/
│   │   └── dashboard/ (Visualizations and dashboard-specific logic)
│   ├── stores/ (Zustand state management)
│   ├── types/ (TypeScript definitions)
│   └── utils/ (API/Fetching utilities, formatters)
├── .gitignore
├── CNAME (Preserved for GitHub Pages)
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md (Modern version)
```

## 3. Implementation Details

### 3.1 Legacy Cleanup
- **Delete:** Root `index.html`, `js/` directory, and `res/` directory.
- **Delete:** Subfolder `.git` (if any, though it seems to be one repo).
- **Merge Assets:** Ensure any required assets in root `res/` (like `back.svg`) are replaced by modern equivalents (already verified: `Bubblechart.tsx` uses a text arrow).

### 3.2 Data Modernization
- **Move Data:** All files from `src/data/` will move to `public/data/`.
- **Async Fetching:** 
    - Implement a `useData` hook or utility in `src/utils/api.ts` to fetch these files at runtime.
    - This keeps the initial bundle small and allows for future dynamic data loading.
    - Supported formats: `.json` (native fetch) and `.csv` (using `d3.csv`).

### 3.3 Configuration Flattening
- All configuration files (`package.json`, `vite.config.ts`, `tsconfig.json`, `eslint.config.mjs`, etc.) will move from `olympics-visualization/` to the project root.
- Path aliases in `tsconfig.json` and `vite.config.ts` will be updated to reflect the new root-relative paths.

## 4. Migration Steps (Draft)
1. Move `olympics-visualization/` contents to a temporary location or use `git mv`.
2. Delete legacy root files.
3. Place React files into the root.
4. Move data files to `public/data/`.
5. Update imports and data loading logic.
6. Verify build and dev server.

## 5. Success Criteria
- [ ] Application runs via `npm run dev` at the root.
- [ ] Data is loaded asynchronously from `/data/*.csv`.
- [ ] No legacy jQuery/D3-script files remain in the project.
- [ ] Project structure is clean and follows modern React conventions.
