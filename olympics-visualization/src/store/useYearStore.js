import { create } from "zustand";

const years = [
  1896, 1900, 1904, 1908, 1912, 1920, 1924, 1928, 1932, 1936, 1948, 1952, 1956,
  1960, 1964, 1968, 1972, 1976, 1980, 1984, 1988, 1992, 1996, 2000, 2004, 2008,
  2012,
];

const countryColors = ["#cba6f7", "#f9e2af", "#a6e3a1", "#89b4fa"];

const useYearStore = create((set, get) => ({
  years,
  yearFilter: {
    start: years[0],
    end: years[years.length - 1],
  },
  countrySelection: ["FRA"],
  selectedNode: null,
  currentState: 0,
  sportFilter: "All",
  disciplineFilter: "All",
  eventFilter: "All",
  currentFilterKeyword: "Sport",
  setYearFilter: (range) =>
    set(() => ({
      yearFilter: {
        start: range.start,
        end: range.end,
      },
    })),
  setDefaultCountries: (codes) =>
    set(() => ({
      countrySelection: codes.slice(0, 4),
    })),
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
  setSelectedNode: (node) => set(() => ({ selectedNode: node })),
  advanceState: (direction) =>
    set((state) => {
      const nextState = state.currentState + direction;
      if (nextState < 0 || nextState > 3) {
        return {};
      }

      let sportFilter = state.sportFilter;
      let disciplineFilter = state.disciplineFilter;
      let eventFilter = state.eventFilter;

      if (direction > 0 && state.selectedNode) {
        if (nextState === 1) {
          sportFilter = state.selectedNode.Sport || sportFilter;
        } else if (nextState === 2) {
          disciplineFilter = state.selectedNode.Discipline || disciplineFilter;
        } else if (nextState === 3) {
          eventFilter = state.selectedNode.Event || eventFilter;
        }
      }

      if (direction < 0) {
        if (nextState < 3) {
          eventFilter = "All";
        }
        if (nextState < 2) {
          disciplineFilter = "All";
        }
        if (nextState < 1) {
          sportFilter = "All";
        }
      }

      return {
        currentState: nextState,
        sportFilter,
        disciplineFilter,
        eventFilter,
        currentFilterKeyword:
          nextState === 0 ? "Sport" : nextState === 1 ? "Discipline" : "Event",
      };
    }),
  resetState: () =>
    set(() => ({
      currentState: 0,
      selectedNode: null,
      sportFilter: "All",
      disciplineFilter: "All",
      eventFilter: "All",
      currentFilterKeyword: "Sport",
    })),
  getCountryColor: (code) => {
    const selection = get().countrySelection;
    const idx = selection.indexOf(code);
    if (idx === -1) return "#313244"; // Surface0
    return countryColors[idx % countryColors.length];
  },
}));

export default useYearStore;
