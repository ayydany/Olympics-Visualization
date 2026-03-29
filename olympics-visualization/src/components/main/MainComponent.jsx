import React, { useEffect, useMemo, useState, useRef } from "react";
import * as d3 from "d3";
import { Responsive as ResponsiveGridLayout } from "react-grid-layout";

import Header from "../visualizations/Header";
import Bubblechart from "../visualizations/Bubblechart";
import Linechart from "../visualizations/Linechart";
import Scatterplot from "../visualizations/Scatterplot";
import Worldmap from "../visualizations/Worldmap";
import Tooltip from "../common/Tooltip";
import dictionaryDataCsv from "../../data/dictionary.csv";
import countryDataCsv from "../../data/summer_year_country_event.csv";
import populationCsv from "../../data/world_population_full.csv";
import useYearStore from "../../store/useYearStore";

import "/node_modules/react-grid-layout/css/styles.css";
import "/node_modules/react-resizable/css/styles.css";
import "./MainComponent.css";

const MainComponent = () => {
  const gridContainerRef = useRef();
  const [gridWidth, setGridWidth] = useState(1200);
  const [dictionaryData, setDictionaryData] = useState(null);
  const [countryData, setCountyData] = useState(null);
  const [populationData, setPopulationData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tooltipState, setTooltipState] = useState({
    show: false,
    content: "",
    x: 0,
    y: 0,
  });

  const updateTooltipState = React.useCallback((state) => {
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
        const parsedCountry = country.map((d) => ({
          ...d,
          Year: +d.Year,
          GoldCount: +d.GoldCount,
          SilverCount: +d.SilverCount,
          BronzeCount: +d.BronzeCount,
          TotalMedals: +d.GoldCount + +d.SilverCount + +d.BronzeCount,
        }));

        setDictionaryData(dictionary);
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

  const layouts = {
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

  return (
    <div className="main-container flex flex-col h-screen bg-ctp-base text-ctp-text overflow-hidden">
      <Header title="Header" dictionaryData={dictionaryData} />
      <div ref={gridContainerRef} className="flex-grow overflow-y-auto bg-ctp-crust p-2 relative">
        {isLoading && <div className="p-3 text-ctp-subtext0 font-medium text-center mt-10">Loading dataset...</div>}
        {visReady && (
          <ResponsiveGridLayout
            className="layout"
            layouts={layouts}
            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xss: 0 }}
            cols={{ lg: 12, md: 10, sm: 6, xs: 4, xss: 2 }}
            rowHeight={20}
            width={gridWidth}
            draggableHandle=".drag-handle"
            margin={[10, 10]}
          >
            <div key="worldmap" className="vis-cell group">
              <div className="drag-handle absolute top-3 right-3 w-8 h-8 bg-ctp-surface0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-move z-[100] flex items-center justify-center text-xl text-ctp-teal shadow-xl border border-ctp-teal/30" style={{ top: '12px', right: '12px', left: 'auto' }}>
                <span className="leading-none pointer-events-none">⊹</span>
              </div>
              <Worldmap dictionaryData={dictionaryData} setTooltipState={updateTooltipState} />
            </div>
            <div key="bubblechart" className="vis-cell group">
              <div className="drag-handle absolute top-3 right-3 w-8 h-8 bg-ctp-surface0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-move z-[100] flex items-center justify-center text-xl text-ctp-teal shadow-xl border border-ctp-teal/30" style={{ top: '12px', right: '12px', left: 'auto' }}>
                <span className="leading-none pointer-events-none">⊹</span>
              </div>
              <Bubblechart countryData={countryData} dictionaryData={dictionaryData} setTooltipState={updateTooltipState} />
            </div>
            <div key="scatterplot" className="vis-cell group">
              <div className="drag-handle absolute top-3 right-3 w-8 h-8 bg-ctp-surface0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-move z-[100] flex items-center justify-center text-xl text-ctp-teal shadow-xl border border-ctp-teal/30" style={{ top: '12px', right: '12px', left: 'auto' }}>
                <span className="leading-none pointer-events-none">⊹</span>
              </div>
              <Scatterplot countryData={countryData} populationData={populationData} dictionaryData={dictionaryData} setTooltipState={updateTooltipState} />
            </div>
            <div key="linechart" className="vis-cell group">
              <div className="drag-handle absolute top-3 right-3 w-8 h-8 bg-ctp-surface0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-move z-[100] flex items-center justify-center text-xl text-ctp-teal shadow-xl border border-ctp-teal/30" style={{ top: '12px', right: '12px', left: 'auto' }}>
                <span className="leading-none pointer-events-none">⊹</span>
              </div>
              <Linechart countryData={countryData} dictionaryData={dictionaryData} setTooltipState={updateTooltipState} />
            </div>
          </ResponsiveGridLayout>
        )}
      </div>
      <Tooltip {...tooltipState} />
    </div>
  );
};

export default MainComponent;
