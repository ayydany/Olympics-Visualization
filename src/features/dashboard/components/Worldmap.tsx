import React, { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import useYearStore from "@/stores/useYearStore";
import { DictionaryEntry, TooltipState } from "@/types";
import "./Worldmap.css";

interface WorldmapProps {
  dictionaryData: DictionaryEntry[];
  setTooltipState: (state: TooltipState | ((prev: TooltipState) => TooltipState)) => void;
  worldGeo: any;
}

const Worldmap: React.FC<WorldmapProps> = ({ dictionaryData, setTooltipState, worldGeo }) => {
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
      if (!entries || entries.length === 0) return;
      const { width, height } = entries[0].contentRect;
      setDimensions({ width, height });
    });

    resizeObserver.observe(container.parentElement!);

    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    if (dimensions.width === 0 || !svgRef.current || !gRef.current) return;

    const svg = d3.select(svgRef.current)
      .attr("width", dimensions.width)
      .attr("height", dimensions.height);
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
        .attr("stroke", "#45475a") // Surface1
        .attr("stroke-width", 0.5);
    }

    // Zoom setup
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 8])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);

    // Update / Render paths
    const countries = g.selectAll<SVGPathElement, any>(".country")
      .data((worldGeo as any).features);

    countries.enter()
      .append("path")
      .attr("class", "country")
      .merge(countries as any)
      .attr("d", path as any)
      .attr("fill", (d: any) => {
        const name = d.properties.name_long || d.properties.name;
        const code = nameToCode[name];
        if (!code) return "url(#diagonalHatch)";
        if (countrySelection.includes(code)) {
          return getCountryColor(code);
        }
        return "#6c7086"; // Overlay0
      })
      .attr("stroke", "#11111b") // Crust
      .attr("stroke-width", 0.5)
      .classed("country-selectable", (d: any) => {
        const name = d.properties.name_long || d.properties.name;
        return !!nameToCode[name];
      })
      .classed("country-unselectable", (d: any) => {
        const name = d.properties.name_long || d.properties.name;
        return !nameToCode[name];
      })
      .on("mouseover", function(event, d: any) {
        const name = d.properties.name_long || d.properties.name;
        const code = nameToCode[name];
        if (!code) return;

        d3.select(this).style("stroke", "#cdd6f4").style("stroke-width", 1); // Text
        
        setTooltipState({
          show: true,
          content: `<strong>${name}</strong>`,
          x: event.pageX,
          y: event.pageY
        });
      })
      .on("mousemove", (event) => {
        setTooltipState((prev: any) => ({
          ...prev,
          x: event.pageX,
          y: event.pageY
        }));
      })
      .on("mouseout", function() {
        d3.select(this).style("stroke", "#11111b").style("stroke-width", 0.5); // Crust
        setTooltipState({ show: false, content: "", x: 0, y: 0 });
      })
      .on("click", (event, d: any) => {
        const name = d.properties.name_long || d.properties.name;
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
