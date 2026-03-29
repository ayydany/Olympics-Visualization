import React, { useRef, useEffect, useMemo, useState } from "react";
import * as d3 from "d3";
import useYearStore from "../../store/useYearStore";
import "./Header.css";

const Header = ({ dictionaryData }) => {
  const svgRef = useRef();
  const containerRef = useRef();
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  
  const yearFilter = useYearStore((state) => state.yearFilter);
  const setYearFilter = useYearStore((state) => state.setYearFilter);
  const years = useYearStore((state) => state.years);
  const countrySelection = useYearStore((state) => state.countrySelection);
  const currentState = useYearStore((state) => state.currentState);
  const sportFilter = useYearStore((state) => state.sportFilter);
  const disciplineFilter = useYearStore((state) => state.disciplineFilter);
  const eventFilter = useYearStore((state) => state.eventFilter);

  const dictionaryMap = useMemo(() => {
    if (!dictionaryData) return {};
    return dictionaryData.reduce((acc, entry) => {
      acc[entry.CountryCode] = entry.CountryName;
      return acc;
    }, {});
  }, [dictionaryData]);

  const labelText = useMemo(() => {
    const names = countrySelection.map((code) => dictionaryMap[code] || code);
    let countriesText = "";
    
    if (names.length === 0) {
      countriesText = "Every country";
    } else if (names.length === 1) {
      countriesText = names[0];
    } else {
      const namesCopy = [...names];
      const last = namesCopy.pop();
      countriesText = `${namesCopy.join(", ")} and ${last}`;
    }

    let filterLabel = "All Sports";
    if (currentState === 1) filterLabel = sportFilter;
    if (currentState === 2) filterLabel = disciplineFilter;
    if (currentState === 3) filterLabel = eventFilter;

    return (
      <h1 className="text-xl md:text-2xl lg:text-3xl font-black tracking-tight text-ctp-text whitespace-nowrap overflow-hidden text-ellipsis px-2">
        <span className="text-ctp-mauve">{countriesText}</span>
        <span className="text-ctp-subtext1"> on </span>
        <span className="text-ctp-peach">{filterLabel}</span>
        <span className="text-ctp-subtext1"> from </span>
        <span className="text-ctp-yellow">{yearFilter.start}</span>
        <span className="text-ctp-subtext1"> to </span>
        <span className="text-ctp-yellow">{yearFilter.end}</span>
      </h1>
    );
  }, [countrySelection, dictionaryMap, yearFilter, currentState, sportFilter, disciplineFilter, eventFilter]);

  // Handle ResizeObserver for the slider container
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width, height } = entries[0].contentRect;
      setDimensions({ width, height });
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    if (dimensions.width === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 10, right: 30, bottom: 10, left: 30 };
    const width = dimensions.width;
    
    const slider = svg
      .append("g")
      .attr("class", "slider")
      .attr("transform", `translate(${margin.left}, 10)`);

    const sliderWidth = width - margin.left - margin.right;

    const xScale = d3
      .scaleLinear()
      .domain([0, years.length - 1])
      .range([0, sliderWidth])
      .clamp(true);

    // Initial handle positions based on store
    const startIdx = years.indexOf(yearFilter.start);
    const endIdx = years.indexOf(yearFilter.end);

    // Track
    slider
      .append("line")
      .attr("class", "track")
      .attr("x1", xScale.range()[0])
      .attr("x2", xScale.range()[1]);

    const trackInset = slider
      .append("line")
      .attr("class", "track-inset")
      .attr("x1", xScale(startIdx))
      .attr("x2", xScale(endIdx));

    const handle1 = slider
      .append("circle")
      .attr("class", "handle")
      .attr("r", 7)
      .attr("cx", xScale(startIdx));

    const handle2 = slider
      .append("circle")
      .attr("class", "handle")
      .attr("r", 7)
      .attr("cx", xScale(endIdx));

    let selectedHandle = null;

    const trackOverlay = slider
      .append("line")
      .attr("class", "track-overlay")
      .attr("x1", xScale.range()[0])
      .attr("x2", xScale.range()[1])
      .call(
        d3
          .drag()
          .on("drag", (event) => {
            let target = Math.round(xScale.invert(event.x));
            if (selectedHandle === null) {
              const h1Dist = Math.abs(target - xScale.invert(handle1.attr("cx")));
              const h2Dist = Math.abs(target - xScale.invert(handle2.attr("cx")));
              selectedHandle = h1Dist < h2Dist ? handle1 : handle2;
            }
            
            selectedHandle.attr("cx", xScale(target)).classed("active", true);
            
            // Update inset track
            const idx1 = Math.round(xScale.invert(handle1.attr("cx")));
            const idx2 = Math.round(xScale.invert(handle2.attr("cx")));
            trackInset.attr("x1", xScale(Math.min(idx1, idx2)))
                      .attr("x2", xScale(Math.max(idx1, idx2)));
          })
          .on("end", () => {
            handle1.classed("active", false);
            handle2.classed("active", false);
            selectedHandle = null;

            const idx1 = Math.round(xScale.invert(handle1.attr("cx")));
            const idx2 = Math.round(xScale.invert(handle2.attr("cx")));
            const startYear = years[Math.min(idx1, idx2)];
            const endYear = years[Math.max(idx1, idx2)];
            
            setYearFilter({ start: startYear, end: endYear });
          })
      );

    // Ticks - filter to avoid overlap
    const tickStep = dimensions.width < 600 ? 4 : dimensions.width < 900 ? 2 : 1;
    
    slider
      .append("g")
      .attr("class", "ticks unselectable")
      .attr("transform", "translate(0, 20)")
      .selectAll("text")
      .data(years.filter((_, i) => i % tickStep === 0))
      .enter()
      .append("text")
      .attr("x", (d) => xScale(years.indexOf(d)))
      .attr("text-anchor", "middle")
      .text((d) => d);

  }, [dimensions, years, setYearFilter, yearFilter.start, yearFilter.end]);

  return (
    <header className="w-full bg-ctp-mantle border-b border-ctp-surface0 shadow-lg z-50 px-12 py-2 flex flex-col gap-1">
      <div className="flex items-center justify-start overflow-hidden">
        {labelText}
      </div>
      <div ref={containerRef} className="w-full h-[40px]">
        <svg ref={svgRef} className="w-full h-full overflow-visible" />
      </div>
    </header>
  );
};

export default Header;
