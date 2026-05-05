import React, { useEffect, useRef, useState, useMemo } from "react";
import * as d3 from "d3";
import useYearStore from "@/stores/useYearStore";
import { DictionaryEntry, OlympicRow, TooltipStateSetter } from "@/types";
import "./Linechart.css";

interface LinechartProps {
  countryData: OlympicRow[];
  dictionaryData: DictionaryEntry[];
  setTooltipState: TooltipStateSetter;
  isResizing: boolean;
}

interface MedalTotals {
  gold: number;
  silver: number;
  bronze: number;
  total: number;
}

interface LinePoint extends MedalTotals {
  year: number;
  countryName: string;
}

interface DotPoint extends LinePoint {
  color: string;
  countryCode: string;
  r: number;
}

const Linechart: React.FC<LinechartProps> = ({ countryData, dictionaryData, setTooltipState, isResizing }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const years = useYearStore((state) => state.years);
  const yearFilter = useYearStore((state) => state.yearFilter);
  const countrySelection = useYearStore((state) => state.countrySelection);
  const currentState = useYearStore((state) => state.currentState);
  const sportFilter = useYearStore((state) => state.sportFilter);
  const disciplineFilter = useYearStore((state) => state.disciplineFilter);
  const eventFilter = useYearStore((state) => state.eventFilter);
  const getCountryColor = useYearStore((state) => state.getCountryColor);

  const filteredYears = useMemo(() => {
    return years.filter(
      (year) => year >= yearFilter.start && year <= yearFilter.end
    );
  }, [years, yearFilter]);

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
    if (!countryData || !countrySelection.length || dimensions.width === 0) return;

    const { width, height } = dimensions;
    const margin = { top: 30, right: 40, bottom: 40, left: 50 };

    const filtered = countryData.filter((d) => {
      if (!countrySelection.includes(d.Country)) return false;
      if (d.Year < yearFilter.start || d.Year > yearFilter.end) return false;
      if (currentState === 1 && d.Sport !== sportFilter) return false;
      if (currentState === 2 && d.Discipline !== disciplineFilter) return false;
      if (currentState === 3 && d.Event !== eventFilter) return false;
      return true;
    });

    const totalsByCountry = d3.rollup(
      filtered,
      (values) =>
        d3.rollup(
          values,
          (leaves) => ({
            gold: d3.sum(leaves, (d) => +d.GoldCount),
            silver: d3.sum(leaves, (d) => +d.SilverCount),
            bronze: d3.sum(leaves, (d) => +d.BronzeCount),
            total: d3.sum(
              leaves,
              (d) => +d.GoldCount + +d.SilverCount + +d.BronzeCount
            ),
          }),
          (d) => d.Year
        ),
      (d) => d.Country
    );

    const filledSeries = countrySelection.map((code) => {
      const perYear = totalsByCountry.get(code) || new Map<number, MedalTotals>();
      const countryInfo = dictionaryData?.find((d) => d.CountryCode === code);
      const values = years.map((year) => {
        const medals = perYear.get(year) || {
          gold: 0,
          silver: 0,
          bronze: 0,
          total: 0,
        };
        return {
          year,
          ...medals,
          countryName: countryInfo?.CountryName || code,
        };
      });
      return { country: code, values, color: getCountryColor(code) };
    });

    const activeYears =
      filteredYears && filteredYears.length ? filteredYears : years;

    const xScale = d3
      .scalePoint<number>()
      .domain(activeYears)
      .range([margin.left, width - margin.right]);

    const yMax = d3.max(filledSeries, (series) =>
      d3.max(series.values, (v) => v.total)
    );
    
    const yScale = d3
      .scaleLinear()
      .domain([0, yMax || 1])
      .nice()
      .range([height - margin.bottom, margin.top]);

    const line = d3
      .line<LinePoint>()
      .x((d) => xScale(d.year) ?? margin.left)
      .y((d) => yScale(d.total))
      .curve(d3.curveMonotoneX);

    const svg = d3.select(svgRef.current);
    
    let gMain = svg.select<SVGGElement>(".main-g");
    if (gMain.empty()) {
      gMain = svg.append("g").attr("class", "main-g");
      gMain.append("g").attr("class", "xAxis unselectable");
      gMain.append("g").attr("class", "yAxis unselectable");
      gMain.append("text").attr("class", "axislabel unselectable x-axis-label");
      gMain.append("text").attr("class", "axislabel unselectable y-axis-label");
      gMain.append("g").attr("class", "lines-layer");
      gMain.append("g").attr("class", "dots-layer");
    }

    const transition: any = svg.transition().duration(750).ease(d3.easeExpOut);

    const xAxisGroup = gMain.select(".xAxis")
      .attr("transform", `translate(0,${height - margin.bottom})`);

    const yAxisGroup = gMain.select(".yAxis")
      .attr("transform", `translate(${margin.left},0)`);

    xAxisGroup
      .transition(transition)
      .call(
        d3
          .axisBottom(xScale)
          .tickValues(activeYears.filter((_, i) => i % 2 === 0)) as any
      );

    yAxisGroup.transition(transition).call(d3.axisLeft(yScale) as any);

    xAxisGroup.selectAll("path, line").attr("stroke", "#9399b2");
    xAxisGroup.selectAll("text").attr("fill", "#cdd6f4");
    yAxisGroup.selectAll("path, line").attr("stroke", "#9399b2");
    yAxisGroup.selectAll("text").attr("fill", "#cdd6f4");

    gMain.select(".x-axis-label")
      .attr("transform", `translate(${width / 2},${height - 5})`)
      .style("text-anchor", "middle")
      .style("fill", "#cdd6f4")
      .text("Years");

    gMain.select(".y-axis-label")
      .attr("transform", "rotate(-90)")
      .attr("y", 15)
      .attr("x", 0 - height / 2)
      .style("text-anchor", "middle")
      .style("fill", "#cdd6f4")
      .text("Medals");

    const pathData = filledSeries.map((series, idx) => ({
      id: idx,
      series,
      values: series.values.filter(
        (v) => v.year >= yearFilter.start && v.year <= yearFilter.end
      ),
    }));

    const linesLayer = gMain.select<SVGGElement>(".lines-layer");
    linesLayer.selectAll<SVGPathElement, (typeof pathData)[number]>(".line")
      .data(pathData, (d) => d.series.country)
      .join(
        enter => enter.append("path")
          .attr("class", "line")
          .attr("fill", "none")
          .attr("stroke-width", 2)
          .attr("stroke", d => d.series.color)
          .attr("opacity", 0)
          .attr("d", d => line(d.values) ?? "")
          .call(enter => enter.transition(transition).attr("opacity", 1)),
        update => update
          .call(update => update.transition(transition)
            .attr("stroke", d => d.series.color)
            .attr("d", d => line(d.values) ?? "")),
        exit => exit.transition(transition).attr("opacity", 0).remove()
      );

    const maxTotal = d3.max(pathData, (d) => d3.max(d.values, (v) => v.total)) || 1;
    const radiusScale = d3.scaleSqrt().domain([0, maxTotal]).range([4, 10]);

    const dotsData: DotPoint[] = pathData.flatMap((d) =>
      d.values.map((v) => ({
        ...v,
        color: d.series.color,
        countryCode: d.series.country,
        r: radiusScale(v.total),
      }))
    );

    const dotsLayer = gMain.select<SVGGElement>(".dots-layer");
    dotsLayer.selectAll<SVGCircleElement, DotPoint>(".dot")
      .data(dotsData, (d) => `${d.countryCode}-${d.year}`)
      .join(
        enter => enter.append("circle")
          .attr("class", "dot")
          .attr("fill", d => d.color)
          .attr("cx", d => xScale(d.year) ?? margin.left)
          .attr("cy", d => yScale(0))
          .attr("r", 0)
          .attr("stroke", "#11111b")
          .call(enter => enter.transition(transition)
            .attr("cy", d => yScale(d.total))
            .attr("r", d => d.r)),
        update => update
          .call(update => update.transition(transition)
            .attr("fill", d => d.color)
            .attr("cx", d => xScale(d.year) ?? margin.left)
            .attr("cy", d => yScale(d.total))
            .attr("r", d => d.r)),
        exit => exit.transition(transition).attr("r", 0).remove()
      );

    svg.selectAll<SVGCircleElement, DotPoint>(".dot")
      .on("mouseover", (event, d) => {
        setTooltipState({
          show: true,
          x: event.pageX,
          y: event.pageY,
          content: `<strong>${d.countryName} (${d.year})</strong><br/>
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
          .attr("r", d.r + 3)
          .attr("stroke", "#cdd6f4");
      })
      .on("mousemove", (event) => {
        setTooltipState((prev) => ({
          ...prev,
          x: event.pageX,
          y: event.pageY
        }));
      })
      .on("mouseout", (event, d) => {
        setTooltipState((prev) => ({ ...prev, show: false }));
        d3.select(event.currentTarget)
          .transition()
          .duration(200)
          .attr("r", d.r)
          .attr("stroke", "#11111b");
      });

  }, [
    countryData,
    countrySelection,
    currentState,
    dictionaryData,
    disciplineFilter,
    eventFilter,
    filteredYears,
    getCountryColor,
    setTooltipState,
    sportFilter,
    yearFilter,
    years,
    dimensions,
  ]);

  return (
    <div id="linechart" className="w-full h-full relative overflow-hidden bg-transparent">
      <svg ref={svgRef} className="w-full h-full block" />
    </div>
  );
};

export default Linechart;
