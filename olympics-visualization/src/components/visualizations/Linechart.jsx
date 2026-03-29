import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import useYearStore from "../../store/useYearStore";
import "./Linechart.css";

const Linechart = ({ countryData, dictionaryData, setTooltipState }) => {
  const svgRef = useRef();
  const years = useYearStore((state) => state.years);
  const filteredYears = useYearStore((state) => state.filteredYears());
  const yearFilter = useYearStore((state) => state.yearFilter);
  const countrySelection = useYearStore((state) => state.countrySelection);
  const currentState = useYearStore((state) => state.currentState);
  const sportFilter = useYearStore((state) => state.sportFilter);
  const disciplineFilter = useYearStore((state) => state.disciplineFilter);
  const eventFilter = useYearStore((state) => state.eventFilter);
  const getCountryColor = useYearStore((state) => state.getCountryColor);

  useEffect(() => {
    if (!countryData || !countrySelection.length) return;

    const container = svgRef.current;
    const rect = container.getBoundingClientRect();
    const width = rect.width || 800;
    const height = rect.height || 300;
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
      const perYear = totalsByCountry.get(code) || new Map();
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
      .scalePoint()
      .domain(activeYears)
      .range([margin.left, width - margin.right]);

    const yMax = d3.max(filledSeries, (series) =>
      d3.max(series.values, (v) => v.total)
    );
    if (yMax === undefined) {
      return;
    }

    const yScale = d3
      .scaleLinear()
      .domain([0, yMax || 1])
      .nice()
      .range([height - margin.bottom, margin.top]);

    const line = d3
      .line()
      .x((d) => xScale(d.year))
      .y((d) => yScale(d.total))
      .curve(d3.curveMonotoneX);

    const svg = d3
      .select(container)
      .attr("width", width)
      .attr("height", height);

    const transition = svg.transition().duration(750).ease(d3.easeExpOut);

    const xAxisGroup = svg
      .selectAll(".xAxis")
      .data([null])
      .join("g")
      .attr("class", "xAxis unselectable")
      .attr("transform", `translate(0,${height - margin.bottom})`);

    const yAxisGroup = svg
      .selectAll(".yAxis")
      .data([null])
      .join("g")
      .attr("class", "yAxis unselectable")
      .attr("transform", `translate(${margin.left},0)`);

    xAxisGroup
      .transition(transition)
      .call(
        d3
          .axisBottom(xScale)
          .tickValues(activeYears.filter((_, i) => i % 2 === 0))
      );

    yAxisGroup.transition(transition).call(d3.axisLeft(yScale));

    svg
      .selectAll(".x-axis-label")
      .data([null])
      .join("text")
      .attr("class", "axislabel unselectable x-axis-label")
      .attr("transform", `translate(${width / 2},${height - 5})`)
      .style("text-anchor", "middle")
      .text("Years");

    svg
      .selectAll(".y-axis-label")
      .data([null])
      .join("text")
      .attr("class", "axislabel unselectable y-axis-label")
      .attr("transform", "rotate(-90)")
      .attr("y", 15)
      .attr("x", 0 - height / 2)
      .style("text-anchor", "middle")
      .text("Medals");

    const pathData = filledSeries.map((series, idx) => ({
      id: idx,
      series,
      values: series.values.filter(
        (v) => v.year >= yearFilter.start && v.year <= yearFilter.end
      ),
    }));

    const paths = svg.selectAll(".line").data(pathData, (d) => d.id);

    paths
      .enter()
      .append("path")
      .attr("class", (d) => `line id${d.id}`)
      .attr("stroke", (d) => d.series.color)
      .attr("fill", "none")
      .attr("d", (d) => line(d.values))
      .attr("opacity", 0)
      .transition(transition)
      .attr("opacity", 1);

    paths
      .transition(transition)
      .attr("stroke", (d) => d.series.color)
      .attr("d", (d) => line(d.values));

    paths.exit().transition(transition).attr("opacity", 0).remove();

    const maxTotal = d3.max(pathData, (d) =>
      d3.max(d.values, (v) => v.total)
    );
    const radiusScale = d3
      .scaleSqrt()
      .domain([0, maxTotal || 1])
      .range([4, 10]);

    const dotsData = pathData.flatMap((d) =>
      d.values.map((v) => ({
        ...v,
        color: d.series.color,
        id: d.id,
        r: radiusScale(v.total),
      }))
    );

    const dots = svg.selectAll(".dot").data(
      dotsData,
      (d) => `${d.id}-${d.year}`
    );

    dots
      .enter()
      .append("circle")
      .attr("class", (d) => `dot id${d.id}`)
      .attr("fill", (d) => d.color)
      .attr("cx", (d) => xScale(d.year))
      .attr("cy", (d) => yScale(0))
      .attr("r", 0)
      .attr("stroke", "#333")
      .transition(transition)
      .attr("cy", (d) => yScale(d.total))
      .attr("r", (d) => d.r);

    dots
      .transition(transition)
      .attr("fill", (d) => d.color)
      .attr("cx", (d) => xScale(d.year))
      .attr("cy", (d) => yScale(d.total))
      .attr("r", (d) => d.r);

    dots.exit().transition(transition).attr("r", 0).remove();

    svg.selectAll(".dot")
      .on("mouseover", (event, d) => {
        setTooltipState({
          show: true,
          x: event.pageX,
          y: event.pageY,
          content: `<strong>${d.countryName} (${d.year})</strong><br/>
                    <center>🥇 ${d.gold} | 🥈 ${d.silver} | 🥉 ${d.bronze}</center>
                    Total Medals: ${d.total}`,
        });
        d3.select(event.currentTarget)
          .transition()
          .duration(750)
          .ease(d3.easeElastic)
          .attr("r", d.r + 3)
          .attr("stroke", "#fff");
      })
      .on("mouseout", (event) => {
        setTooltipState((prev) => ({ ...prev, show: false }));
        d3.select(event.currentTarget)
          .transition()
          .duration(750)
          .ease(d3.easeElastic)
          .attr("r", (d) => d.r)
          .attr("stroke", "#333");
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
  ]);

  return (
    <div id="linechart">
      <svg ref={svgRef} width="100%" height="100%" />
    </div>
  );
};

export default Linechart;
