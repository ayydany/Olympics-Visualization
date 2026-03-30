import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import useYearStore from "@/stores/useYearStore";
import { OlympicRow, DictionaryEntry, TooltipState } from "@/types";
import "./Scatterplot.css";

interface ScatterplotProps {
  countryData: OlympicRow[];
  populationData: any[];
  dictionaryData: DictionaryEntry[];
  setTooltipState: (state: TooltipState) => void;
}

const Scatterplot: React.FC<ScatterplotProps> = ({ countryData, populationData, dictionaryData, setTooltipState }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const yearFilter = useYearStore((state) => state.yearFilter);
  const countrySelection = useYearStore((state) => state.countrySelection);
  const currentState = useYearStore((state) => state.currentState);
  const sportFilter = useYearStore((state) => state.sportFilter);
  const disciplineFilter = useYearStore((state) => state.disciplineFilter);
  const eventFilter = useYearStore((state) => state.eventFilter);
  const getCountryColor = useYearStore((state) => state.getCountryColor);

  // Handle ResizeObserver
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
    if (!countryData || !populationData || !countrySelection.length || dimensions.width === 0 || !svgRef.current) return;
    
    const { width, height } = dimensions;
    const margin = { top: 30, right: 30, bottom: 40, left: 60 };

    const populationMap = new Map<string, number>();
    populationData.forEach((row) => {
      let total = 0;
      let count = 0;
      Object.entries(row).forEach(([year, value]) => {
        const yearNum = Number(year);
        if (!Number.isNaN(yearNum)) {
          if (yearNum >= yearFilter.start && yearNum <= yearFilter.end) {
            const parsed = Number(value);
            if (!Number.isNaN(parsed)) {
              total += parsed;
              count += 1;
            }
          }
        }
      });
      populationMap.set(
        row.CountryCode,
        count > 0 ? Math.round(total / count) : 0
      );
    });

    const medalsMap = d3.rollup(
      countryData.filter((d) => {
        if (d.Year < yearFilter.start || d.Year > yearFilter.end) return false;
        if (currentState === 1 && d.Sport !== sportFilter) return false;
        if (currentState === 2 && d.Discipline !== disciplineFilter)
          return false;
        if (currentState === 3 && d.Event !== eventFilter) return false;
        return true;
      }),
      (values) => ({
        gold: d3.sum(values, (d) => +d.GoldCount),
        silver: d3.sum(values, (d) => +d.SilverCount),
        bronze: d3.sum(values, (d) => +d.BronzeCount),
        total: d3.sum(
          values,
          (d) => +d.GoldCount + +d.SilverCount + +d.BronzeCount
        ),
      }),
      (d) => d.Country
    );

    const processedAll = Array.from(populationMap.entries()).map(
      ([code, population]) => {
        const medals = medalsMap.get(code) || {
          gold: 0,
          silver: 0,
          bronze: 0,
          total: 0,
        };
        const countryInfo = dictionaryData?.find((d) => d.CountryCode === code);
        return {
          code,
          name: countryInfo?.CountryName || code,
          population: population || 0,
          medals: medals.total,
          gold: medals.gold,
          silver: medals.silver,
          bronze: medals.bronze,
          color: getCountryColor(code),
        };
      }
    );

    const processedData = processedAll
      .filter((d) => countrySelection.includes(d.code));

    if (!processedData.length) {
      return;
    }

    const xDomain = d3.extent(processedAll, (d) => d.population) as [number, number] || [0, 1];
    const yDomain = d3.extent(processedAll, (d) => d.medals) as [number, number] || [0, 1];

    const xScale = d3
      .scaleLinear()
      .domain(xDomain[0] === xDomain[1] ? [0, xDomain[0] + 1] : xDomain)
      .nice()
      .range([margin.left, width - margin.right]);

    const yScale = d3
      .scaleLinear()
      .domain(yDomain[0] === yDomain[1] ? [0, yDomain[0] + 1] : yDomain)
      .nice()
      .range([height - margin.bottom, margin.top]);

    const maxMedalsSelected = d3.max(processedData, (d) => d.medals) || 1;
    const radiusScale = d3
      .scaleSqrt()
      .domain([0, maxMedalsSelected])
      .range([8, 18]);

    const svg = d3.select(svgRef.current);
    
    // Persistent layers
    let gMain = svg.select<SVGGElement>(".main-g");
    if (gMain.empty()) {
      gMain = svg.append("g").attr("class", "main-g");
      gMain.append("g").attr("class", "xAxis unselectable");
      gMain.append("g").attr("class", "yAxis unselectable");
      gMain.append("text").attr("class", "axislabel unselectable x-axis-label");
      gMain.append("text").attr("class", "axislabel unselectable y-axis-label");
      gMain.append("g").attr("class", "dots-layer");
    }

    const transition = svg.transition().duration(750).ease(d3.easeExpOut);

    const xAxisGroup = gMain.select<SVGGElement>(".xAxis")
      .attr("transform", `translate(0,${height - margin.bottom})`);

    const yAxisGroup = gMain.select<SVGGElement>(".yAxis")
      .attr("transform", `translate(${margin.left},0)`);

    xAxisGroup
      .transition(transition)
      .call(d3.axisBottom(xScale).tickFormat(d3.format("~s") as any));

    yAxisGroup.transition(transition).call(d3.axisLeft(yScale));

    // Style Axes for Catppuccin visibility
    xAxisGroup.selectAll("path, line").attr("stroke", "#9399b2");
    xAxisGroup.selectAll("text").attr("fill", "#cdd6f4");
    yAxisGroup.selectAll("path, line").attr("stroke", "#9399b2");
    yAxisGroup.selectAll("text").attr("fill", "#cdd6f4");

    gMain.select<SVGTextElement>(".x-axis-label")
      .attr("transform", `translate(${width / 2},${height - 5})`)
      .style("text-anchor", "middle")
      .style("fill", "#cdd6f4")
      .text("Population");

    gMain.select<SVGTextElement>(".y-axis-label")
      .attr("transform", "rotate(-90)")
      .attr("y", 15)
      .attr("x", 0 - height / 2)
      .style("text-anchor", "middle")
      .style("fill", "#cdd6f4")
      .text("Medals");

    const dotsLayer = gMain.select(".dots-layer");
    dotsLayer.selectAll<SVGCircleElement, any>(".dot")
      .data(processedData, (d) => d.code)
      .join(
        enter => enter.append("circle")
          .attr("class", "dot")
          .attr("r", (d) => radiusScale(d.medals))
          .attr("cx", (d) => xScale(d.population))
          .attr("cy", (d) => yScale(d.medals))
          .attr("stroke", "#11111b") // Crust
          .attr("fill", (d) => d.color)
          .attr("opacity", 0)
          .call(enter => enter.transition(transition).attr("opacity", 1)),
        update => update
          .call(update => update.transition(transition)
            .attr("cx", (d) => xScale(d.population))
            .attr("cy", (d) => yScale(d.medals))
            .attr("r", (d) => radiusScale(d.medals))
            .attr("fill", (d) => d.color)
            .attr("opacity", 1)),
        exit => exit.transition(transition).attr("r", 0).remove()
      );

    // Tooltips
    svg.selectAll(".dot")
      .on("mouseover", (event, d: any) => {
        setTooltipState({
          show: true,
          x: event.pageX,
          y: event.pageY,
          content: `<strong>${d.name}</strong><br/>
                    Population: ${d.population.toLocaleString()}<br/>
                    <center>
                      <span style="color: #f9e2af">🥇 ${d.gold}</span> | 
                      <span style="color: #bac2de">🥈 ${d.silver}</span> | 
                      <span style="color: #fab387">🥉 ${d.bronze}</span>
                    </center>
                    Total Medals: ${d.total}`,
        });
        d3.select(event.currentTarget)
          .transition()
          .duration(200)
          .attr("r", (d: any) => radiusScale(d.medals) + 4)
          .attr("stroke", "#cdd6f4");
      })
      .on("mousemove", (event) => {
        setTooltipState((prev: any) => ({
          ...prev,
          x: event.pageX,
          y: event.pageY
        }));
      })
      .on("mouseout", (event) => {
        setTooltipState({ show: false, content: "", x: 0, y: 0 });
        d3.select(event.currentTarget)
          .transition()
          .duration(200)
          .attr("r", (d: any) => radiusScale(d.medals))
          .attr("stroke", "#11111b");
      });
  }, [
    countryData,
    countrySelection,
    currentState,
    dictionaryData,
    disciplineFilter,
    eventFilter,
    getCountryColor,
    populationData,
    setTooltipState,
    sportFilter,
    yearFilter,
    dimensions,
  ]);

  return (
    <div id="scatterplot" className="w-full h-full relative overflow-hidden bg-transparent">
      <svg ref={svgRef} className="w-full h-full block" />
    </div>
  );
};

export default Scatterplot;
