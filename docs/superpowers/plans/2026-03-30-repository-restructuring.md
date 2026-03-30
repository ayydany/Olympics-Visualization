# Repository Restructuring & Modernization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Flatten the repository structure, remove legacy code, and modernize data handling to create a professional React/Vite portfolio piece.

**Architecture:** Single-level Vite project structure with feature-based organization. Data moved to `public/` and fetched asynchronously via a dedicated API utility.

**Tech Stack:** React, Vite, TypeScript, D3.js, Zustand, Material UI.

---

### Task 1: Cleanup Legacy Root Files

**Files:**
- Delete: `index.html` (root)
- Delete: `js/` (root)
- Delete: `res/` (root)
- Delete: `README.md` (root - will be replaced)

- [ ] **Step 1: Delete legacy root files**

Run: `rm -rf index.html js/ res/ README.md`

- [ ] **Step 2: Verify deletion**

Run: `ls -F`
Expected: `js/`, `res/`, `index.html`, `README.md` are gone. `olympics-visualization/` and `CNAME` remain.

- [ ] **Step 3: Commit cleanup**

```bash
git add .
git commit -m "chore: remove legacy root files"
```

---

### Task 2: Flatten Project Structure

**Files:**
- Move: Contents of `olympics-visualization/` to root `.`

- [ ] **Step 1: Move files from subfolder to root**

Run: `mv olympics-visualization/* olympics-visualization/.* . 2>/dev/null || true`
*Note: We use a pattern to include hidden files like .gitignore.*

- [ ] **Step 2: Remove empty subfolder**

Run: `rmdir olympics-visualization`

- [ ] **Step 3: Update `.gitignore`**

Ensure `node_modules`, `dist`, and other Vite/React defaults are ignored at the root level.

- [ ] **Step 4: Update path aliases in `tsconfig.json`**

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

- [ ] **Step 5: Update path aliases in `vite.config.ts`**

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

- [ ] **Step 6: Commit flattening**

```bash
git add .
git commit -m "chore: flatten project structure to root"
```

---

### Task 3: Modernize Data Handling (Async Fetch)

**Files:**
- Create: `src/utils/api.ts`
- Modify: `src/features/dashboard/components/Dashboard.tsx`
- Move: `src/data/*` to `public/data/`

- [ ] **Step 1: Move data files to `public/`**

Run: `mkdir -p public/data && mv src/data/* public/data/ && rmdir src/data`

- [ ] **Step 2: Create `src/utils/api.ts`**

```typescript
import * as d3 from "d3";
import { OlympicRow, DictionaryEntry } from "@/types";

export const fetchData = async () => {
  const [dictionary, country, population] = await Promise.all([
    d3.csv("/data/dictionary.csv"),
    d3.csv("/data/summer_year_country_event.csv"),
    d3.csv("/data/world_population_full.csv"),
  ]);

  const parsedCountry: OlympicRow[] = (country as any[]).map((d) => ({
    ...d,
    Year: +d.Year,
    GoldCount: +d.GoldCount,
    SilverCount: +d.SilverCount,
    BronzeCount: +d.BronzeCount,
    TotalMedals: +d.GoldCount + +d.SilverCount + +d.BronzeCount,
  }));

  return {
    dictionary: dictionary as unknown as DictionaryEntry[],
    country: parsedCountry,
    population: population as any[],
  };
};
```

- [ ] **Step 3: Update `Dashboard.tsx` to use async API**

Remove imports:
```typescript
import dictionaryDataCsv from "@/data/dictionary.csv";
import countryDataCsv from "@/data/summer_year_country_event.csv";
import populationCsv from "@/data/world_population_full.csv";
```

Update `fetchData` function:
```typescript
import { fetchData as apiFetchData } from "@/utils/api";

// ... inside MainComponent
const fetchData = async () => {
  try {
    const { dictionary, country, population } = await apiFetchData();
    setDictionaryData(dictionary);
    setCountyData(country);
    setPopulationData(population);
    setIsLoading(false);
  } catch (error) {
    console.error("Error fetching data:", error);
    setIsLoading(false);
  }
};
```

- [ ] **Step 4: Commit data modernization**

```bash
git add .
git commit -m "feat: modernize data handling with async fetching from public folder"
```

---

### Task 4: Final Polishing & Verification

**Files:**
- Create: `README.md` (root)
- Modify: `package.json`

- [ ] **Step 1: Create a modern `README.md`**

Describe the project, tech stack, and how to run it at the root.

- [ ] **Step 2: Clean up `package.json` name**

Ensure `"name": "olympics-visualization"` or similar is appropriate for the root.

- [ ] **Step 3: Verify build and dev server**

Run: `npm install && npm run dev`
Expected: Application opens and functions correctly.

- [ ] **Step 4: Final commit**

```bash
git add .
git commit -m "docs: add modern README and final project cleanup"
```
