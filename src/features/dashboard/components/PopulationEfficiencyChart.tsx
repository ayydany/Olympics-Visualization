import React, { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import useYearStore from "@/stores/useYearStore";
import { DictionaryEntry, OlympicRow, TooltipStateSetter } from "@/types";
import "./PopulationEfficiencyChart.css";

interface PopulationRow {
  CountryCode: string;
  [year: string]: string | number;
}

interface PopulationEfficiencyChartProps {
  countryData: OlympicRow[];
  populationData: PopulationRow[];
  dictionaryData: DictionaryEntry[];
  setTooltipState: TooltipStateSetter;
  isResizing: boolean;
}

interface EfficiencyDatum {
  code: string;
  name: string;
  medals: number;
  population: number;
  efficiency: number;
  color: string;
}

const PopulationEfficiencyChart: React.FC<PopulationEfficiencyChartProps> = ({
  countryData,
  populationData,
  dictionaryData,
  setTooltipState,
  isResizing,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const yearFilter = useYearStore((state) => state.yearFilter);
  const countrySelection = useYearStore((state) => state.countrySelection);
  const currentState = useYearStore((state) => state.currentState);
  const sportFilter = useYearStore((state) => state.sportFilter);
  const disciplineFilter = useYearStore((state) => state.disciplineFilter);
  const eventFilter = useYearStore((state) => state.eventFilter);
  const getCountryColor = useYearStore((state) => state.getCountryColor);

  const countryNames = useMemo(() => {
    return new Map(dictionaryData.map((entry) => [entry.CountryCode, entry.CountryName]));
  }, [dictionaryData]);

  useEffect(() => {
    const container = svgRef.current;
    if (!container?.parentElement) return;

    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries.length || isResizing) return;
      const { width, height } = entries[0].contentRect;
      setDimensions({ width, height });
    });

    resizeObserver.observe(container.parentElement);
    return () => resizeObserver.disconnect();
  }, [isResizing]);

  useEffect(() => {
    if (!svgRef.current || dimensions.width === 0 || countrySelection.length === 0) return;

    const { width, height } = dimensions;
    const margin = { top: 34, right: 28, bottom: 58, left: 64 };

    const populationByCountry = new Map<string, number>();
    populationData.forEach((row) => {
      let total = 0;
      let count = 0;
      Object.entries(row).forEach(([year, value]) => {
        const yearNum = Number(year);
        if (Number.isNaN(yearNum) || yearNum < yearFilter.start || yearNum > yearFilter.end) return;
        const parsed = Number(value);
        if (Number.isNaN(parsed)) return;
        total += parsed;
        count += 1;
      });
      populationByCountry.set(row.CountryCode, count > 0 ? total / count : 0);
    });

    const filtered = countryData.filter((d) => {
      if (!countrySelection.includes(d.Country)) return false;
      if (d.Year < yearFilter.start || d.Year > yearFilter.end) return false;
      if (currentState === 1 && d.Sport !== sportFilter) return false;
      if (currentState === 2 && d.Discipline !== disciplineFilter) return false;
      if (currentState === 3 && d.Event !== eventFilter) return false;
      return true;
    });

    const medalsByCountry = d3.rollup(
      filtered,
      (values) => d3.sum(values, (d) => d.TotalMedals),
      (d) => d.Country
    );

    const data: EfficiencyDatum[] = countrySelection
      .map((code) => {
        const medals = medalsByCountry.get(code) ?? 0;
        const population = populationByCountry.get(code) ?? 0;
        return {
          code,
          name: countryNames.get(code) ?? code,
          medals,
          population,
          efficiency: population > 0 ? medals / (population / 1_000_000) : 0,
          color: getCountryColor(code),
        };
      })
      .sort((a, b) => d3.descending(a.efficiency, b.efficiency));

    const svg = d3.select(svgRef.current).attr("width", width).attr("height", height);
    let gMain = svg.select<SVGGElement>(".main-g");
    if (gMain.empty()) {
      gMain = svg.append("g").attr("class", "main-g");
      gMain.append("g").attr("class", "xAxis unselectable");
      gMain.append("g").attr("class", "yAxis unselectable");
      gMain.append("text").attr("class", "axislabel x-axis-label unselectable");
      gMain.append("text").attr("class", "axislabel y-axis-label unselectable");
      gMain.append("g").attr("class", "bars-layer");
    }

    const xScale = d3
      .scaleBand<string>()
      .domain(data.map((d) => d.code))
      .range([margin.left, width - margin.right])
      .padding(0.32);

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.efficiency) || 1])
      .nice()
      .range([height - margin.bottom, margin.top]);

    const transition: any = svg.transition().duration(650).ease(d3.easeExpOut);
    const xAxis = d3.axisBottom(xScale).tickFormat((code) => {
      const name = countryNames.get(code) ?? code;
      return name.length > 12 ? `${name.slice(0, 10)}...` : name;
    });

    gMain
      .select<SVGGElement>(".xAxis")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .transition(transition)
      .call(xAxis as any);

    gMain
      .select<SVGGElement>(".yAxis")
      .attr("transform", `translate(${margin.left},0)`)
      .transition(transition)
      .call(d3.axisLeft(yScale).ticks(5) as any);

    gMain
      .select<SVGTextElement>(".x-axis-label")
      .attr("transform", `translate(${width / 2},${height - 8})`)
      .style("text-anchor", "middle")
      .text("Selected countries");

    gMain
      .select<SVGTextElement>(".y-axis-label")
      .attr("transform", "rotate(-90)")
      .attr("y", 16)
      .attr("x", -height / 2)
      .style("text-anchor", "middle")
      .text("Medals per 1M people");

    gMain
      .select<SVGGElement>(".bars-layer")
      .selectAll<SVGRectElement, EfficiencyDatum>(".efficiency-bar")
      .data(data, (d) => d.code)
      .join(
        (enter) =>
          enter
            .append("rect")
            .attr("class", "efficiency-bar")
            .attr("rx", 5)
            .attr("x", (d) => xScale(d.code) ?? 0)
            .attr("width", xScale.bandwidth())
            .attr("y", yScale(0))
            .attr("height", 0),
        (update) => update,
        (exit) => exit.transition(transition).attr("y", yScale(0)).attr("height", 0).remove()
      )
      .attr("fill", (d) => d.color)
      .on("mouseover", (event, d) => {
        setTooltipState({
          show: true,
          x: event.pageX,
          y: event.pageY,
          content: `<strong>${d.name}</strong><br/>
                    Medals: ${d.medals}<br/>
                    Avg population: ${Math.round(d.population).toLocaleString()}<br/>
                    Medals per 1M: ${d.efficiency.toFixed(2)}`,
        });
        d3.select(event.currentTarget).attr("stroke", "#cdd6f4").attr("stroke-width", 1.5);
      })
      .on("mousemove", (event) => {
        setTooltipState((prev) => ({ ...prev, x: event.pageX, y: event.pageY }));
      })
      .on("mouseout", (event) => {
        setTooltipState({ show: false, content: "", x: 0, y: 0 });
        d3.select(event.currentTarget).attr("stroke", null);
      })
      .transition(transition)
      .attr("x", (d) => xScale(d.code) ?? 0)
      .attr("width", xScale.bandwidth())
      .attr("y", (d) => yScale(d.efficiency))
      .attr("height", (d) => Math.max(0, yScale(0) - yScale(d.efficiency)));
  }, [
    countryData,
    countryNames,
    countrySelection,
    currentState,
    dimensions,
    disciplineFilter,
    eventFilter,
    getCountryColor,
    populationData,
    setTooltipState,
    sportFilter,
    yearFilter,
  ]);

  return (
    <div id="population-efficiency-chart" className="w-full h-full relative overflow-hidden bg-transparent">
      <svg ref={svgRef} className="w-full h-full block" />
    </div>
  );
};

export default PopulationEfficiencyChart;
