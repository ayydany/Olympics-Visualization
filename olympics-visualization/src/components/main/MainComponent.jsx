import React, { useEffect, useMemo, useState } from "react";
import * as d3 from "d3";
import { Responsive, WidthProvider } from "react-grid-layout/legacy";

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

const ResponsiveGridLayout = WidthProvider(Responsive);

const MainComponent = () => {
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
      { i: "worldmap", x: 0, y: 0, w: 6, h: 2 },
      { i: "bubblechart", x: 6, y: 0, w: 6, h: 2 },
      { i: "scatterplot", x: 0, y: 2, w: 6, h: 2 },
      { i: "linechart", x: 6, y: 2, w: 6, h: 2 },
    ],
  };

  return (
    <div className="main-container flex flex-col h-screen bg-ctp-base text-ctp-text overflow-hidden">
      <Header title="Header" dictionaryData={dictionaryData} />
      <div className="flex-grow overflow-y-auto bg-ctp-crust p-2">
        {isLoading && <div className="p-3 text-ctp-subtext0 font-medium">Loading dataset...</div>}
        {visReady && (
          <ResponsiveGridLayout
            className="layout"
            layouts={layouts}
            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xss: 0 }}
            cols={{ lg: 12, md: 10, sm: 6, xs: 4, xss: 2 }}
            rowHeight={300}
            draggableHandle=".drag-handle"
          >
            <div key="worldmap" className="vis-cell group">
              <div className="drag-handle absolute top-0 left-0 right-0 h-6 bg-ctp-surface0 opacity-0 group-hover:opacity-100 transition-opacity cursor-move z-10 flex items-center justify-center text-[10px] text-ctp-subtext1 uppercase tracking-widest font-bold">World Map</div>
              <Worldmap dictionaryData={dictionaryData} setTooltipState={updateTooltipState} />
            </div>
            <div key="bubblechart" className="vis-cell group">
              <div className="drag-handle absolute top-0 left-0 right-0 h-6 bg-ctp-surface0 opacity-0 group-hover:opacity-100 transition-opacity cursor-move z-10 flex items-center justify-center text-[10px] text-ctp-subtext1 uppercase tracking-widest font-bold">Bubble Chart</div>
              <Bubblechart countryData={countryData} dictionaryData={dictionaryData} setTooltipState={updateTooltipState} />
            </div>
            <div key="scatterplot" className="vis-cell group">
              <div className="drag-handle absolute top-0 left-0 right-0 h-6 bg-ctp-surface0 opacity-0 group-hover:opacity-100 transition-opacity cursor-move z-10 flex items-center justify-center text-[10px] text-ctp-subtext1 uppercase tracking-widest font-bold">Scatter Plot</div>
              <Scatterplot countryData={countryData} populationData={populationData} dictionaryData={dictionaryData} setTooltipState={updateTooltipState} />
            </div>
            <div key="linechart" className="vis-cell group">
              <div className="drag-handle absolute top-0 left-0 right-0 h-6 bg-ctp-surface0 opacity-0 group-hover:opacity-100 transition-opacity cursor-move z-10 flex items-center justify-center text-[10px] text-ctp-subtext1 uppercase tracking-widest font-bold">Line Chart</div>
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
