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

    return (
      <>
        <span className="text-ctp-mauve">{countriesText}</span>
        <span className="text-ctp-subtext1"> on </span>
        <span className="text-ctp-yellow">{filterLabel}</span>
      </>
    );
  }, [
    countrySelection,
    currentState,
    dictionaryMap,
    disciplineFilter,
    eventFilter,
    sportFilter,
  ]);

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

    const margin = { top: 15, right: 30, bottom: 15, left: 30 };
    const width = dimensions.width;
    
    const slider = svg
      .append("g")
      .attr("class", "slider")
      .attr("transform", `translate(${margin.left}, 15)`);

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

    const trackOverlay = slider
      .append("line")
      .attr("class", "track-overlay")
      .attr("x1", xScale.range()[0])
      .attr("x2", xScale.range()[1])
      .call(
        d3
          .drag()
          .on("drag", (event) => {
            let target = round(xScale.invert(event.x));
            if (selectedHandle === null) {
              const h1Dist = Math.abs(target - xScale.invert(handle1.attr("cx")));
              const h2Dist = Math.abs(target - xScale.invert(handle2.attr("cx")));
              selectedHandle = h1Dist < h2Dist ? handle1 : handle2;
            }
            moveHandle(target);
          })
          .on("end", () => {
            handle1.attr("r", 8).classed("active", false);
            handle2.attr("r", 8).classed("active", false);

            if (handle1.attr("cx") === handle2.attr("cx")) {
              handle1.attr("r", 10);
              handle2.attr("r", 10);
            }

            selectedHandle = null;

            const idx1 = round(xScale.invert(handle1.attr("cx")));
            const idx2 = round(xScale.invert(handle2.attr("cx")));
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
      .attr("transform", "translate(0, 22)")
      .selectAll("text")
      .data(years.filter((_, i) => i % tickStep === 0))
      .enter()
      .append("text")
      .attr("x", (d) => xScale(years.indexOf(d)))
      .attr("text-anchor", "middle")
      .text((d) => d);

    const handle1 = slider
      .append("circle")
      .attr("class", "handle")
      .attr("r", 8)
      .attr("cx", xScale(startIdx));

    const handle2 = slider
      .append("circle")
      .attr("class", "handle")
      .attr("r", 8)
      .attr("cx", xScale(endIdx));

    let selectedHandle = null;

    function moveHandle(target) {
      selectedHandle.attr("r", 10).attr("cx", xScale(target)).classed("active", true);
      
      // Update inset track
      const idx1 = round(xScale.invert(handle1.attr("cx")));
      const idx2 = round(xScale.invert(handle2.attr("cx")));
      trackInset.attr("x1", xScale(Math.min(idx1, idx2)))
                .attr("x2", xScale(Math.max(idx1, idx2)));
    }

    function round(val) {
      return Math.round(val);
    }

  }, [dimensions, years, setYearFilter, yearFilter.start, yearFilter.end]);

  return (
    <header className="w-full bg-ctp-mantle border-b border-ctp-surface0 shadow-2xl z-50">
      <div className="max-w-[1600px] mx-auto flex flex-col lg:flex-row items-center lg:items-center justify-between px-8 py-6 gap-6">
        
        {/* Left: Title Section */}
        <div className="flex flex-col items-center lg:items-start text-center lg:text-left min-w-[40%]">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tighter text-ctp-text leading-none mb-2 drop-shadow-sm">
            {labelText}
          </h1>
          <p className="text-base md:text-lg font-bold text-ctp-subtext0 uppercase tracking-widest opacity-80">
            Summer Olympics Visualization <span className="mx-2 text-ctp-surface2">•</span> {yearFilter.start} - {yearFilter.end}
          </p>
        </div>

        {/* Right: Slider Section */}
        <div className="flex flex-col items-center w-full lg:w-1/2 max-w-[800px]">
          <div ref={containerRef} className="w-full h-[60px] flex items-center justify-center">
            <svg ref={svgRef} className="w-full h-full overflow-visible" />
          </div>
          <div className="flex justify-between w-full px-8 -mt-2">
             <span className="text-[10px] uppercase tracking-[0.3em] font-black text-ctp-surface2 unselectable">
               Drag to filter years
             </span>
             <span className="text-[10px] uppercase tracking-[0.3em] font-black text-ctp-surface2 unselectable">
               Olympics Dashboard
             </span>
          </div>
        </div>

      </div>
    </header>
  );
};

export default Header;
