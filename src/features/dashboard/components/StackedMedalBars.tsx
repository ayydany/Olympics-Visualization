import React, { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import useYearStore from "@/stores/useYearStore";
import { DictionaryEntry, OlympicRow, TooltipStateSetter } from "@/types";
import "./StackedMedalBars.css";

interface StackedMedalBarsProps {
  countryData: OlympicRow[];
  dictionaryData: DictionaryEntry[];
  setTooltipState: TooltipStateSetter;
  isResizing: boolean;
}

interface MedalBarDatum {
  code: string;
  name: string;
  gold: number;
  silver: number;
  bronze: number;
  total: number;
}

type MedalKey = "gold" | "silver" | "bronze";

const medalKeys: MedalKey[] = ["gold", "silver", "bronze"];
const medalLabels: Record<MedalKey, string> = {
  gold: "Gold",
  silver: "Silver",
  bronze: "Bronze",
};
const medalColors: Record<MedalKey, string> = {
  gold: "#f9e2af",
  silver: "#bac2de",
  bronze: "#fab387",
};

const StackedMedalBars: React.FC<StackedMedalBarsProps> = ({
  countryData,
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
    const margin = { top: 44, right: 28, bottom: 56, left: 54 };

    const filtered = countryData.filter((d) => {
      if (!countrySelection.includes(d.Country)) return false;
      if (d.Year < yearFilter.start || d.Year > yearFilter.end) return false;
      if (currentState === 1 && d.Sport !== sportFilter) return false;
      if (currentState === 2 && d.Discipline !== disciplineFilter) return false;
      if (currentState === 3 && d.Event !== eventFilter) return false;
      return true;
    });

    const totals = d3.rollup(
      filtered,
      (values) => ({
        gold: d3.sum(values, (d) => d.GoldCount),
        silver: d3.sum(values, (d) => d.SilverCount),
        bronze: d3.sum(values, (d) => d.BronzeCount),
      }),
      (d) => d.Country
    );

    const data: MedalBarDatum[] = countrySelection.map((code) => {
      const medals = totals.get(code) ?? { gold: 0, silver: 0, bronze: 0 };
      return {
        code,
        name: countryNames.get(code) ?? code,
        ...medals,
        total: medals.gold + medals.silver + medals.bronze,
      };
    });

    const svg = d3.select(svgRef.current).attr("width", width).attr("height", height);
    let gMain = svg.select<SVGGElement>(".main-g");
    if (gMain.empty()) {
      gMain = svg.append("g").attr("class", "main-g");
      gMain.append("g").attr("class", "xAxis unselectable");
      gMain.append("g").attr("class", "yAxis unselectable");
      gMain.append("text").attr("class", "axislabel y-axis-label unselectable");
      gMain.append("g").attr("class", "bars-layer");
      gMain.append("g").attr("class", "legend unselectable");
    }

    const xScale = d3
      .scaleBand<string>()
      .domain(data.map((d) => d.code))
      .range([margin.left, width - margin.right])
      .padding(0.28);

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.total) || 1])
      .nice()
      .range([height - margin.bottom, margin.top]);

    const stack = d3.stack<MedalBarDatum>().keys(medalKeys);
    const stacked = stack(data);
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
      .select<SVGTextElement>(".y-axis-label")
      .attr("transform", "rotate(-90)")
      .attr("y", 16)
      .attr("x", -height / 2)
      .style("text-anchor", "middle")
      .text("Medals");

    const layers = gMain
      .select<SVGGElement>(".bars-layer")
      .selectAll<SVGGElement, d3.Series<MedalBarDatum, MedalKey>>(".stack-layer")
      .data(stacked, (series) => series.key);

    layers.exit().remove();

    const layerEnter = layers
      .enter()
      .append("g")
      .attr("class", "stack-layer")
      .attr("fill", (series) => medalColors[series.key as MedalKey]);

    const layerMerge = layerEnter.merge(layers as any);

    layerMerge
      .attr("fill", (series) => medalColors[series.key as MedalKey])
      .selectAll<SVGRectElement, d3.SeriesPoint<MedalBarDatum>>("rect")
      .data((series) => series, (point) => point.data.code)
      .join(
        (enter) =>
          enter
            .append("rect")
            .attr("x", (point) => xScale(point.data.code) ?? 0)
            .attr("width", xScale.bandwidth())
            .attr("y", yScale(0))
            .attr("height", 0),
        (update) => update,
        (exit) => exit.transition(transition).attr("y", yScale(0)).attr("height", 0).remove()
      )
      .on("mouseover", (event, point) => {
        const key = ((event.currentTarget.parentNode as SVGGElement & {
          __data__: d3.Series<MedalBarDatum, MedalKey>;
        }).__data__.key) as MedalKey;
        setTooltipState({
          show: true,
          x: event.pageX,
          y: event.pageY,
          content: `<strong>${point.data.name}</strong><br/>
                    ${medalLabels[key]}: ${point.data[key]}<br/>
                    Total: ${point.data.total}`,
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
      .attr("x", (point) => xScale(point.data.code) ?? 0)
      .attr("width", xScale.bandwidth())
      .attr("y", (point) => yScale(point[1]))
      .attr("height", (point) => Math.max(0, yScale(point[0]) - yScale(point[1])));

    const legend = gMain
      .select<SVGGElement>(".legend")
      .attr("transform", `translate(${margin.left},18)`)
      .selectAll<SVGGElement, MedalKey>(".legend-item")
      .data(medalKeys);

    const legendEnter = legend.enter().append("g").attr("class", "legend-item");
    legendEnter.append("rect").attr("width", 10).attr("height", 10).attr("rx", 2);
    legendEnter.append("text").attr("x", 16).attr("y", 9).style("font-size", "11px");

    legendEnter
      .merge(legend)
      .attr("transform", (_, index) => `translate(${index * 78},0)`)
      .call((selection) => {
        selection.select("rect").attr("fill", (key) => medalColors[key]);
        selection.select("text").text((key) => medalLabels[key]);
      });

    legend.exit().remove();
  }, [
    countryData,
    countryNames,
    countrySelection,
    currentState,
    dimensions,
    disciplineFilter,
    eventFilter,
    setTooltipState,
    sportFilter,
    yearFilter,
  ]);

  return (
    <div id="stacked-medal-bars" className="w-full h-full relative overflow-hidden bg-transparent">
      <svg ref={svgRef} className="w-full h-full block" />
    </div>
  );
};

export default StackedMedalBars;
