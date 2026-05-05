import React, { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import useYearStore from "@/stores/useYearStore";
import { DictionaryEntry, TooltipStateSetter, WorldFeature, WorldGeo } from "@/types";
import "./Worldmap.css";

interface WorldmapProps {
  dictionaryData: DictionaryEntry[];
  setTooltipState: TooltipStateSetter;
  worldGeo: WorldGeo;
  isResizing: boolean;
}

const Worldmap: React.FC<WorldmapProps> = ({ dictionaryData, setTooltipState, worldGeo, isResizing }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const gRef = useRef<SVGGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const countrySelection = useYearStore((state) => state.countrySelection);
  const getCountryColor = useYearStore((state) => state.getCountryColor);
  const toggleCountry = useYearStore((state) => state.toggleCountry);

  const nameToCode = useMemo(() => {
    return dictionaryData.reduce((acc: Record<string, string>, d) => {
      acc[d.CountryName] = d.CountryCode;
      return acc;
    }, {});
  }, [dictionaryData]);

  useEffect(() => {
    const container = svgRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0 || isResizing) return;
      const { width, height } = entries[0].contentRect;
      setDimensions({ width, height });
    });

    if (container.parentElement) {
      resizeObserver.observe(container.parentElement);
    }

    return () => resizeObserver.disconnect();
  }, [isResizing]);

  useEffect(() => {
    if (dimensions.width === 0 || !svgRef.current || !gRef.current) return;

    const svg = d3.select(svgRef.current)
      .attr("width", dimensions.width)
      .attr("height", dimensions.height);
    const g = d3.select(gRef.current);

    const projection = d3.geoMercator()
      .scale(dimensions.width / 6.2)
      .translate([dimensions.width / 2, dimensions.height / 1.5]);

    const path = d3.geoPath<WorldFeature>().projection(projection);

    if (svg.select("defs").empty()) {
      const defs = svg.append("defs");
      const pattern = defs.append("pattern")
        .attr("id", "diagonalHatch")
        .attr("patternUnits", "userSpaceOnUse")
        .attr("width", 4)
        .attr("height", 4);
      
      pattern.append("path")
        .attr("d", "M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2")
        .attr("stroke", "#45475a")
        .attr("stroke-width", 0.5);
    }

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 8])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);

    g.selectAll<SVGPathElement, WorldFeature>(".country")
      .data(worldGeo.features)
      .join("path")
      .attr("class", "country")
      .attr("d", path)
      .attr("fill", (d) => {
        const name = d.properties.name_long || d.properties.name;
        if (!name) return "url(#diagonalHatch)";
        const code = nameToCode[name];
        if (!code) return "url(#diagonalHatch)";
        if (countrySelection.includes(code)) {
          return getCountryColor(code);
        }
        return "#6c7086";
      })
      .attr("stroke", "#11111b")
      .attr("stroke-width", 0.5)
      .classed("country-selectable", (d) => {
        const name = d.properties.name_long || d.properties.name;
        return !!name && !!nameToCode[name];
      })
      .classed("country-unselectable", (d) => {
        const name = d.properties.name_long || d.properties.name;
        return !name || !nameToCode[name];
      })
      .on("mouseover", function(event, d) {
        const name = d.properties.name_long || d.properties.name;
        if (!name) return;
        const code = nameToCode[name];
        if (!code) return;

        d3.select(this).style("stroke", "#cdd6f4").style("stroke-width", 1);
        
        setTooltipState({
          show: true,
          content: `<strong>${name}</strong>`,
          x: event.pageX,
          y: event.pageY
        });
      })
      .on("mousemove", (event) => {
        setTooltipState((prev) => ({
          ...prev,
          x: event.pageX,
          y: event.pageY
        }));
      })
      .on("mouseout", function() {
        d3.select(this).style("stroke", "#11111b").style("stroke-width", 0.5);
        setTooltipState({ show: false, content: "", x: 0, y: 0 });
      })
      .on("click", (event, d) => {
        const name = d.properties.name_long || d.properties.name;
        if (!name) return;
        const code = nameToCode[name];
        if (!code) return;
        toggleCountry(code, event.ctrlKey);
      });

  }, [dimensions, nameToCode, countrySelection, getCountryColor, toggleCountry, setTooltipState]);

  return (
    <div id="worldmap" className="w-full h-full relative overflow-hidden bg-ctp-mantle">
      <svg ref={svgRef}>
        <g ref={gRef} />
      </svg>
    </div>
  );
};

export default Worldmap;
