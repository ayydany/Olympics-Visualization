import React, { useRef, useEffect, useMemo, useState } from "react";
import * as d3 from "d3";
import useYearStore from "@/stores/useYearStore";
import { DictionaryEntry } from "@/types";
import "./Header.css";

interface HeaderProps {
  dictionaryData: DictionaryEntry[] | null;
}

const Header: React.FC<HeaderProps> = ({ dictionaryData }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  
  const { 
    yearFilter, setYearFilter, years, 
    countrySelection, currentState, 
    sportFilter, disciplineFilter, eventFilter 
  } = useYearStore();

  const dictionaryMap = useMemo(() => {
    if (!dictionaryData) return {};
    return dictionaryData.reduce((acc: Record<string, string>, entry) => {
      acc[entry.CountryCode] = entry.CountryName;
      return acc;
    }, {});
  }, [dictionaryData]);

  const countriesText = useMemo(() => {
    const names = countrySelection.map((code) => dictionaryMap[code] || code);
    if (names.length === 0) return "Every country";
    if (names.length === 1) return names[0];
    const namesCopy = [...names];
    const last = namesCopy.pop();
    return `${namesCopy.join(", ")} and ${last}`;
  }, [countrySelection, dictionaryMap]);

  const filterLabel = useMemo(() => {
    if (currentState === 1) return sportFilter;
    if (currentState === 2) return disciplineFilter;
    if (currentState === 3) return eventFilter;
    return "All Sports";
  }, [currentState, sportFilter, disciplineFilter, eventFilter]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries?.length) return;
      setDimensions({ width: entries[0].contentRect.width, height: entries[0].contentRect.height });
    });
    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    if (dimensions.width === 0 || !svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 14, right: 25, bottom: 0, left: 15 };
    const width = dimensions.width;
    const sliderWidth = Math.max(0, width - margin.left - margin.right);
    
    const slider = svg.append("g").attr("transform", `translate(${margin.left}, ${margin.top})`);

    const xScale = d3.scaleLinear().domain([0, years.length - 1]).range([0, sliderWidth]).clamp(true);
    const startIdx = years.indexOf(yearFilter.start);
    const endIdx = years.indexOf(yearFilter.end);

    slider.append("line").attr("class", "track").attr("x1", 0).attr("x2", sliderWidth);
    const trackInset = slider.append("line").attr("class", "track-inset").attr("x1", xScale(startIdx)).attr("x2", xScale(endIdx));

    const handle1 = slider.append("circle").attr("class", "handle").attr("r", 7).attr("cx", xScale(startIdx));
    const handle2 = slider.append("circle").attr("class", "handle").attr("r", 7).attr("cx", xScale(endIdx));

    let selectedHandle: d3.Selection<SVGCircleElement, unknown, null, undefined> | null = null;

    slider.append("line").attr("class", "track-overlay").attr("x1", 0).attr("x2", sliderWidth)
      .call(d3.drag<SVGLineElement, unknown>()
        .on("drag", (event) => {
          let target = Math.round(xScale.invert(event.x));
          if (selectedHandle === null) {
            const d1 = Math.abs(target - xScale.invert(parseFloat(handle1.attr("cx"))));
            const d2 = Math.abs(target - xScale.invert(parseFloat(handle2.attr("cx"))));
            selectedHandle = d1 < d2 ? handle1 : handle2;
          }
          
          selectedHandle.attr("cx", xScale(target)).classed("active", true);
          
          const i1 = Math.round(xScale.invert(parseFloat(handle1.attr("cx"))));
          const i2 = Math.round(xScale.invert(parseFloat(handle2.attr("cx"))));
          trackInset.attr("x1", xScale(Math.min(i1, i2))).attr("x2", xScale(Math.max(i1, i2)));
        })
        .on("end", () => {
          if (selectedHandle) selectedHandle.classed("active", false);
          selectedHandle = null;

          const i1 = Math.round(xScale.invert(parseFloat(handle1.attr("cx"))));
          const i2 = Math.round(xScale.invert(parseFloat(handle2.attr("cx"))));
          setYearFilter({ start: years[Math.min(i1, i2)], end: years[Math.max(i1, i2)] });
        })
      );

    const tickStep = width < 600 ? 4 : width < 900 ? 2 : 1;
    slider.append("g").attr("class", "ticks unselectable")
      .attr("transform", "translate(0, 18)")
      .selectAll("text")
      .data(years.filter((_, i) => i % tickStep === 0))
      .enter()
      .append("text")
      .attr("x", d => xScale(years.indexOf(d)))
      .attr("text-anchor", "middle")
      .text(d => d);

  }, [dimensions, years, setYearFilter, yearFilter.start, yearFilter.end]);

  return (
    <header className="header-new w-full">
      <div className="title-row">
        <h1 className="title-text truncate">
          <span className="accent">{countriesText}</span> on <span className="accent">{filterLabel}</span> from <span className="accent">{yearFilter.start}</span> to <span className="accent">{yearFilter.end}</span>
        </h1>
      </div>
      <div ref={containerRef} className="slider-row">
        <svg ref={svgRef} className="slider-svg" width="100%" height="100%" />
      </div>
    </header>
  );
};

export default Header;
