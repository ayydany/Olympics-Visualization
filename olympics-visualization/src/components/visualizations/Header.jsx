import React, { useRef, useEffect, useMemo } from "react";
import * as d3 from "d3";
import useYearStore from "../../store/useYearStore";
import "./Header.css";

const Header = ({ dictionaryData }) => {
  const svgRef = useRef();
  const yearFilter = useYearStore((state) => state.yearFilter);
  const setYearFilter = useYearStore((state) => state.setYearFilter);
  const years = useYearStore((state) => state.years);
  const currentState = useYearStore((state) => state.currentState);
  const sportFilter = useYearStore((state) => state.sportFilter);
  const disciplineFilter = useYearStore((state) => state.disciplineFilter);
  const eventFilter = useYearStore((state) => state.eventFilter);
  const countrySelection = useYearStore((state) => state.countrySelection);

  const dictionaryMap = useMemo(() => {
    if (!dictionaryData) return {};
    return dictionaryData.reduce((acc, entry) => {
      acc[entry.CountryCode] = entry.CountryName;
      return acc;
    }, {});
  }, [dictionaryData]);

  const labelText = useMemo(() => {
    const countriesText =
      countrySelection && countrySelection.length > 0
        ? countrySelection
            .map((code) => dictionaryMap[code] || code)
            .join(", ")
        : "every country";

    let filterLabel = "every Event";
    if (currentState === 1) filterLabel = sportFilter;
    if (currentState === 2) filterLabel = disciplineFilter;
    if (currentState === 3) filterLabel = eventFilter;

    return `${countriesText} on ${filterLabel}`;
  }, [
    countrySelection,
    currentState,
    dictionaryMap,
    disciplineFilter,
    eventFilter,
    sportFilter,
  ]);

  useEffect(() => {
    var rect = svgRef.current.getBoundingClientRect();

    // array containing the years in which summer olympics occurred
    const margin = { top: 10, right: 50, bottom: 10, left: 30 },
      width = rect.width,
      height = rect.height;

    const slider = d3
      .select(svgRef.current)
      .append("g")
      .attr("class", "slider")
      .attr("transform", "translate(15,15)");

    const xScale = d3
      .scaleLinear()
      .domain([0, years.length - 1])
      .range([0, width - margin.left])
      .clamp(true);

    let selectedHandle = null;

    // make an SVG Container
    slider
      .append("line")
      .attr("class", "track")
      .attr("x1", xScale.range()[0])
      .attr("x2", xScale.range()[1])
      .select(function () {
        return this.parentNode.appendChild(this.cloneNode(true));
      })
      .attr("class", "track-inset")
      .select(function () {
        return this.parentNode.appendChild(this.cloneNode(true));
      })
      .attr("class", "track-overlay")
      .call(
        d3
          .drag()
          .on("drag", (event, d) => {
            let target = round(xScale.invert(event.x));
            if (selectedHandle === null) {
              Math.abs(target - xScale.invert(handle1.attr("cx"))) <
              Math.abs(target - xScale.invert(handle2.attr("cx")))
                ? (selectedHandle = handle1)
                : (selectedHandle = handle2);
            }
            moveHandle(target);
          })
          .on("end", (d) => {
            // reset radius of selected handle
            handle1.attr("r", 8);
            handle2.attr("r", 8);

            // if both handles are the same year make them bigger
            if (handle1.attr("cx") === handle2.attr("cx")) {
              handle1.attr("r", 12);
              handle2.attr("r", 12);
            }

            selectedHandle = null;

            // update global time variable
            const firstIndex = round(xScale.invert(handle1.attr("cx")));
            const secondIndex = round(xScale.invert(handle2.attr("cx")));
            const startYear =
              years[Math.min(Math.round(firstIndex), Math.round(secondIndex))];
            const endYear =
              years[Math.max(Math.round(firstIndex), Math.round(secondIndex))];
            setYearFilter({
              start: startYear,
              end: endYear,
            });
          })
      );

    slider
      .insert("g", ".track-overlay")
      .attr("class", "ticks unselectable")
      .attr("transform", "translate(0," + 20 + ")")
      .selectAll("text")
      .data(xScale.ticks(years.length - 1))
      .enter()
      .append("text")
      .attr("x", xScale)
      .attr("text-anchor", "middle")
      .text((d) => years[d]);

    const handle1 = slider
      .insert("circle", ".track-overlay")
      .attr("class", "handle")
      .attr("r", 8)
      .attr("cx", xScale(0));

    const handle2 = slider
      .insert("circle", ".track-overlay")
      .attr("class", "handle")
      .attr("r", 8)
      .attr("cx", xScale(years.length - 1));

    function moveHandle(target) {
      selectedHandle.attr("r", 10).attr("cx", xScale(target));
    }

    function round(xScale) {
      xScale = xScale % 1 >= 0.5 ? Math.ceil(xScale) : Math.floor(xScale);
      return xScale;
    }

    // Cleanup function
    return () => {
      // Remove appended HTML when component unmounts
      if (svgRef.current) {
        svgRef.current.innerHTML = "";
      }
    };
  }, []);

  return (
    <div id="header" className="w-full flex flex-col md:flex-row items-center md:items-end justify-between px-6 py-4 bg-ctp-mantle border-b border-ctp-surface0 shadow-lg">
      <div className="flex flex-col items-start w-full md:w-1/2">
        <span id="statelabel" className="text-2xl font-extrabold tracking-tight text-ctp-text leading-tight unselectable mb-1">
          {labelText}
        </span>
        <span className="text-sm font-medium text-ctp-subtext0 unselectable">
          Summer Olympics Data Visualization • {yearFilter.start} - {yearFilter.end}
        </span>
      </div>
      <div className="flex flex-col items-center w-full md:w-1/2 mt-4 md:mt-0">
        <svg id="timeslider" ref={svgRef} className="w-full max-w-[600px] h-[40px]" />
        <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-ctp-surface2 mt-1 unselectable">
          Olympics Visualization - Made with ❤️
        </span>
      </div>
    </div>
  );
};

export default Header;
