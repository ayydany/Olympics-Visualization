import React, { useEffect, useMemo, useState } from "react";
import * as d3 from "d3";

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

import "./MainComponent.css";

const MainComponent = () => {
  // Define state to hold data
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
  const setDefaultCountries = useYearStore((state) => state.setDefaultCountries);
  const countrySelection = useYearStore((state) => state.countrySelection);

  // Fetch data when component mounts
  useEffect(() => {
    fetchData();
  }, []);

  // Function to fetch data
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
        setIsLoading(false); // Mark loading as complete
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        setIsLoading(false); // Mark loading as complete (even if there's an error)
      });
  };

  // Set default country selection once dictionary data is present
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

  return (
    <div className="main-container container-fluid h-100 d-flex flex-column p-0">
      <Header title="Header" dictionaryData={dictionaryData} />
      <div className="visualizations-container">
        {isLoading && <div className="p-3">Loading data...</div>}
        {visReady && (
          <>
            <div className="vis-cell">
              <Worldmap
                dictionaryData={dictionaryData}
                setTooltipState={setTooltipState}
              />
            </div>
            <div className="vis-cell">
              <Bubblechart
                countryData={countryData}
                dictionaryData={dictionaryData}
                setTooltipState={setTooltipState}
              />
            </div>
            <div className="vis-cell">
              <Scatterplot
                countryData={countryData}
                populationData={populationData}
                setTooltipState={setTooltipState}
              />
            </div>
            <div className="vis-cell">
              <Linechart
                countryData={countryData}
                setTooltipState={setTooltipState}
              />
            </div>
          </>
        )}
      </div>
      <Tooltip {...tooltipState} />
    </div>
  );
};

export default MainComponent;
