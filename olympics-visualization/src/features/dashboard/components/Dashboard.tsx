import React, { useEffect, useMemo, useState, useRef } from "react";
import * as d3 from "d3";
import { Responsive as ResponsiveGridLayout, Layouts } from "react-grid-layout";

import Header from "./Header";
import Bubblechart from "./Bubblechart";
import Linechart from "./Linechart";
import Scatterplot from "./Scatterplot";
import Worldmap from "./Worldmap";
import Tooltip from "@/components/Tooltip";
import dictionaryDataCsv from "@/data/dictionary.csv";
import countryDataCsv from "@/data/summer_year_country_event.csv";
import populationCsv from "@/data/world_population_full.csv";
import useYearStore from "@/stores/useYearStore";
import { OlympicRow, DictionaryEntry, TooltipState } from "@/types";

import "/node_modules/react-grid-layout/css/styles.css";
import "/node_modules/react-resizable/css/styles.css";
import "./Dashboard.css";

const MainComponent: React.FC = () => {
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const [gridWidth, setGridWidth] = useState(1200);
  const [dictionaryData, setDictionaryData] = useState<DictionaryEntry[] | null>(null);
  const [countryData, setCountyData] = useState<OlympicRow[] | null>(null);
  const [populationData, setPopulationData] = useState<any[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [visibleCharts, setVisibleCharts] = useState({
    worldmap: true,
    bubblechart: true,
    scatterplot: true,
    linechart: true,
  });

  const [tooltipState, setTooltipState] = useState<TooltipState>({
    show: false,
    content: "",
    x: 0,
    y: 0,
  });

  const updateTooltipState = React.useCallback((state: TooltipState) => {
    setTooltipState(state);
  }, []);

  const setDefaultCountries = useYearStore((state) => state.setDefaultCountries);
  const countrySelection = useYearStore((state) => state.countrySelection);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!gridContainerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width } = entries[0].contentRect;
      setGridWidth(width);
    });
    observer.observe(gridContainerRef.current);
    return () => observer.disconnect();
  }, []);

  const fetchData = () => {
    Promise.all([
      d3.csv(dictionaryDataCsv),
      d3.csv(countryDataCsv),
      d3.csv(populationCsv),
    ])
      .then(([dictionary, country, population]) => {
        const parsedCountry: OlympicRow[] = (country as any[]).map((d) => ({
          ...d,
          Year: +d.Year,
          GoldCount: +d.GoldCount,
          SilverCount: +d.SilverCount,
          BronzeCount: +d.BronzeCount,
          TotalMedals: +d.GoldCount + +d.SilverCount + +d.BronzeCount,
        }));

        setDictionaryData(dictionary as unknown as DictionaryEntry[]);
        setCountyData(parsedCountry);
        setPopulationData(population);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        setIsLoading(false);
      });
  };

  useEffect(() => {
    if (dictionaryData && countrySelection.length === 0) {
      const france = dictionaryData.find((d) => d.CountryName === "France");
      if (france) {
        setDefaultCountries([france.CountryCode]);
      } else {
        const defaultCodes = dictionaryData.slice(0, 2).map((d) => d.CountryCode);
        setDefaultCountries(defaultCodes);
      }
    }
  }, [countrySelection.length, dictionaryData, setDefaultCountries]);

  const visReady = useMemo(() => {
    return dictionaryData && countryData && populationData;
  }, [dictionaryData, countryData, populationData]);

  const toggleChart = (id: keyof typeof visibleCharts) => {
    setVisibleCharts(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const initialLayouts: Layouts = {
    lg: [
      { i: "worldmap", x: 0, y: 0, w: 6, h: 15 },
      { i: "bubblechart", x: 6, y: 0, w: 6, h: 15 },
      { i: "scatterplot", x: 0, y: 15, w: 6, h: 15 },
      { i: "linechart", x: 6, y: 15, w: 6, h: 15 },
    ],
    md: [
      { i: "worldmap", x: 0, y: 0, w: 5, h: 15 },
      { i: "bubblechart", x: 5, y: 0, w: 5, h: 15 },
      { i: "scatterplot", x: 0, y: 15, w: 5, h: 15 },
      { i: "linechart", x: 5, y: 15, w: 5, h: 15 },
    ],
    sm: [
      { i: "worldmap", x: 0, y: 0, w: 6, h: 12 },
      { i: "bubblechart", x: 0, y: 12, w: 6, h: 12 },
      { i: "scatterplot", x: 0, y: 24, w: 6, h: 12 },
      { i: "linechart", x: 0, y: 36, w: 6, h: 12 },
    ],
    xs: [
      { i: "worldmap", x: 0, y: 0, w: 4, h: 10 },
      { i: "bubblechart", x: 0, y: 10, w: 4, h: 10 },
      { i: "scatterplot", x: 0, y: 20, w: 4, h: 10 },
      { i: "linechart", x: 0, y: 30, w: 4, h: 10 },
    ],
    xss: [
      { i: "worldmap", x: 0, y: 0, w: 2, h: 10 },
      { i: "bubblechart", x: 0, y: 10, w: 2, h: 10 },
      { i: "scatterplot", x: 0, y: 20, w: 2, h: 10 },
      { i: "linechart", x: 0, y: 30, w: 2, h: 10 },
    ],
  };

  const filteredLayouts = useMemo(() => {
    const newLayouts: Layouts = {};
    Object.keys(initialLayouts).forEach(bp => {
      newLayouts[bp] = initialLayouts[bp].filter(item => visibleCharts[item.i as keyof typeof visibleCharts]);
    });
    return newLayouts;
  }, [visibleCharts]);

  return (
    <div className="main-container flex flex-col h-screen bg-ctp-base text-ctp-text overflow-hidden relative">
      <Header dictionaryData={dictionaryData} />
      
      {/* Selector Menu Button - Absolute Top Right */}
      <div className="fixed top-2 right-2 z-[2000]">
        <button 
          onClick={() => setShowMenu(!showMenu)}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-ctp-mantle/80 backdrop-blur-md border border-ctp-surface1 text-ctp-mauve shadow-2xl hover:bg-ctp-surface0 hover:scale-110 transition-all duration-300 group"
          title="Toggle Visualizations"
        >
          <span className={`text-2xl transition-transform duration-700 ${showMenu ? 'rotate-180' : 'group-hover:rotate-90'}`}>⚙</span>
        </button>
        
        {showMenu && (
          <div className="absolute right-0 mt-3 w-56 bg-ctp-mantle/95 backdrop-blur-xl border border-ctp-mauve/20 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-4 flex flex-col gap-3 animate-in fade-in slide-in-from-top-4 duration-200">
            <div className="text-xs font-black uppercase tracking-[0.2em] text-ctp-subtext0 mb-1 px-1 opacity-60">Visible Charts</div>
            {Object.entries({
              worldmap: "World Map",
              bubblechart: "Bubble Chart",
              scatterplot: "Scatter Plot",
              linechart: "Line Chart"
            }).map(([id, label]) => (
              <label key={id} className="flex items-center justify-between cursor-pointer group px-3 py-2 rounded-xl hover:bg-ctp-mauve/10 transition-all duration-200">
                <span className={`text-sm font-bold tracking-tight ${visibleCharts[id as keyof typeof visibleCharts] ? 'text-ctp-text' : 'text-ctp-subtext1'}`}>{label}</span>
                <div className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={visibleCharts[id as keyof typeof visibleCharts]} 
                    onChange={() => toggleChart(id as keyof typeof visibleCharts)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-ctp-surface1 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-ctp-mauve"></div>
                </div>
              </label>
            ))}
          </div>
        )}
      </div>

      <div ref={gridContainerRef} className="flex-grow overflow-y-auto bg-ctp-crust p-2 relative">
        {isLoading && <div className="p-3 text-ctp-subtext0 font-medium text-center mt-10">Loading dataset...</div>}
        {visReady && (
          <ResponsiveGridLayout
            className="layout"
            layouts={filteredLayouts}
            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xss: 0 }}
            cols={{ lg: 12, md: 10, sm: 6, xs: 4, xss: 2 }}
            rowHeight={20}
            width={gridWidth}
            draggableHandle=".drag-handle"
            margin={[10, 10]}
          >
            {visibleCharts.worldmap && (
              <div key="worldmap" className="vis-cell group">
                <div className="drag-handle absolute top-3 right-3 w-8 h-8 bg-ctp-surface0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-move z-[100] flex items-center justify-center text-xl text-ctp-teal shadow-xl border border-ctp-teal/30" style={{ top: '12px', right: '12px', left: 'auto' }}>
                  <span className="leading-none pointer-events-none">⊹</span>
                </div>
                <Worldmap dictionaryData={dictionaryData!} setTooltipState={updateTooltipState} />
              </div>
            )}
            {visibleCharts.bubblechart && (
              <div key="bubblechart" className="vis-cell group">
                <div className="drag-handle absolute top-3 right-3 w-8 h-8 bg-ctp-surface0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-move z-[100] flex items-center justify-center text-xl text-ctp-teal shadow-xl border border-ctp-teal/30" style={{ top: '12px', right: '12px', left: 'auto' }}>
                  <span className="leading-none pointer-events-none">⊹</span>
                </div>
                <Bubblechart countryData={countryData!} dictionaryData={dictionaryData!} setTooltipState={updateTooltipState} />
              </div>
            )}
            {visibleCharts.scatterplot && (
              <div key="scatterplot" className="vis-cell group">
                <div className="drag-handle absolute top-3 right-3 w-8 h-8 bg-ctp-surface0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-move z-[100] flex items-center justify-center text-xl text-ctp-teal shadow-xl border border-ctp-teal/30" style={{ top: '12px', right: '12px', left: 'auto' }}>
                  <span className="leading-none pointer-events-none">⊹</span>
                </div>
                <Scatterplot countryData={countryData!} populationData={populationData!} dictionaryData={dictionaryData!} setTooltipState={updateTooltipState} />
              </div>
            )}
            {visibleCharts.linechart && (
              <div key="linechart" className="vis-cell group">
                <div className="drag-handle absolute top-3 right-3 w-8 h-8 bg-ctp-surface0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-move z-[100] flex items-center justify-center text-xl text-ctp-teal shadow-xl border border-ctp-teal/30" style={{ top: '12px', right: '12px', left: 'auto' }}>
                  <span className="leading-none pointer-events-none">⊹</span>
                </div>
                <Linechart countryData={countryData!} dictionaryData={dictionaryData!} setTooltipState={updateTooltipState} />
              </div>
            )}
          </ResponsiveGridLayout>
        )}
      </div>
      <Tooltip {...tooltipState} />
    </div>
  );
};

export default MainComponent;
