import React, { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import worldGeo from "../../data/simple_map.json";
import useYearStore from "../../store/useYearStore";
import "./Worldmap.css";

const Worldmap = ({ dictionaryData, setTooltipState }) => {
  const svgRef = useRef(null);
  const gRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const countrySelection = useYearStore((state) => state.countrySelection);
  const toggleCountry = useYearStore((state) => state.toggleCountry);
  const getCountryColor = useYearStore((state) => state.getCountryColor);

  const nameToCode = useMemo(() => {
    if (!dictionaryData) return {};
    return dictionaryData.reduce((acc, entry) => {
      acc[entry.CountryName] = entry.CountryCode;
      return acc;
    }, {});
  }, [dictionaryData]);

  // Handle Resize
  useEffect(() => {
    const parent = svgRef.current?.parentElement;
    if (!parent) return;

    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width, height } = entries[0].contentRect;
      setDimensions({ width, height });
    });

    resizeObserver.observe(parent);
    return () => resizeObserver.disconnect();
  }, []);

  // Main D3 Rendering
  useEffect(() => {
    if (dimensions.width === 0 || dimensions.height === 0) return;

    const svg = d3.select(svgRef.current);
    const g = d3.select(gRef.current);

    // Setup projection
    const projection = d3.geoMercator()
      .scale(dimensions.width / 6.2)
      .translate([dimensions.width / 2, dimensions.height / 1.5]);

    const path = d3.geoPath().projection(projection);

    // Define diagonalHatch pattern in <defs>
    if (svg.select("defs").empty()) {
      const defs = svg.append("defs");
      const pattern = defs.append("pattern")
        .attr("id", "diagonalHatch")
        .attr("patternUnits", "userSpaceOnUse")
        .attr("width", 4)
        .attr("height", 4);
      
      pattern.append("path")
        .attr("d", "M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2")
        .attr("stroke", "#666")
        .attr("stroke-width", 0.5);
    }

    // Zoom setup
    const zoom = d3.zoom()
      .scaleExtent([1, 8])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);

    // Update / Render paths
    const countries = g.selectAll(".country")
      .data(worldGeo.features);

    countries.enter()
      .append("path")
      .attr("class", "country")
      .merge(countries)
      .attr("d", path)
      .attr("fill", (d) => {
        const code = nameToCode[d.properties.name_long] || nameToCode[d.properties.name];
        if (!code) return "url(#diagonalHatch)";
        if (countrySelection.includes(code)) {
          return getCountryColor(code);
        }
        return "#A8A39D";
      })
      .classed("country-selectable", (d) => !!(nameToCode[d.properties.name_long] || nameToCode[d.properties.name]))
      .classed("country-unselectable", (d) => !(nameToCode[d.properties.name_long] || nameToCode[d.properties.name]))
      .on("mouseover", function(event, d) {
        const name = d.properties.name_long || d.properties.name;
        const code = nameToCode[name];
        if (!code) return;

        d3.select(this).style("stroke", "#fff").style("stroke-width", 1);
        
        setTooltipState({
          show: true,
          content: `<strong>${name}</strong>`,
          x: event.pageX,
          y: event.pageY
        });
      })
      .on("mousemove", (event) => {
        setTooltipState(prev => ({
          ...prev,
          x: event.pageX,
          y: event.pageY
        }));
      })
      .on("mouseout", function() {
        d3.select(this).style("stroke", "#333").style("stroke-width", 0.5);
        setTooltipState({ show: false, content: "", x: 0, y: 0 });
      })
      .on("click", (event, d) => {
        const code = nameToCode[d.properties.name_long] || nameToCode[d.properties.name];
        if (!code) return;
        
        toggleCountry(code, event.ctrlKey || event.metaKey);
      });

    countries.exit().remove();

  }, [dimensions, nameToCode, countrySelection, getCountryColor, toggleCountry, setTooltipState]);

  return (
    <div id="worldmap">
      <svg ref={svgRef}>
        <g ref={gRef} />
      </svg>
    </div>
  );
};

export default Worldmap;
