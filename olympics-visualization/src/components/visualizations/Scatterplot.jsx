import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import useYearStore from "../../store/useYearStore";
import "./Scatterplot.css";

const Scatterplot = ({ countryData, populationData, dictionaryData, setTooltipState }) => {
  const svgRef = useRef();
  const yearFilter = useYearStore((state) => state.yearFilter);
  const countrySelection = useYearStore((state) => state.countrySelection);
  const currentState = useYearStore((state) => state.currentState);
  const sportFilter = useYearStore((state) => state.sportFilter);
  const disciplineFilter = useYearStore((state) => state.disciplineFilter);
  const eventFilter = useYearStore((state) => state.eventFilter);
  const getCountryColor = useYearStore((state) => state.getCountryColor);

  useEffect(() => {
    if (!countryData || !populationData || !countrySelection.length) return;
    const container = svgRef.current;
    const rect = container.getBoundingClientRect();
    const width = rect.width || 600;
    const height = rect.height || 250;
    const margin = { top: 30, right: 30, bottom: 40, left: 60 };

    const populationMap = new Map();
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
      .filter((d) => countrySelection.includes(d.code))
      .map((d) => ({ ...d, isSelected: true }))
      .concat(
        processedAll
          .filter((d) => !countrySelection.includes(d.code))
          .slice(0, 0)
      );

    if (!processedData.length) {
      return;
    }

    const xDomain =
      d3.extent(processedAll, (d) => d.population) || [0, 1];
    const yDomain =
      d3.extent(processedAll, (d) => d.medals) || [0, 1];

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

    const maxMedalsSelected =
      d3.max(processedData, (d) => d.medals) || 1;
    const radiusScale = d3
      .scaleSqrt()
      .domain([0, maxMedalsSelected])
      .range([8, 18]);

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
      .call(d3.axisBottom(xScale).tickFormat(d3.format("~s")));

    yAxisGroup.transition(transition).call(d3.axisLeft(yScale));

    // Style Axes for Catppuccin
    xAxisGroup.selectAll("path, line").attr("stroke", "#585b70"); // Surface2
    xAxisGroup.selectAll("text").attr("fill", "#bac2de"); // Subtext1
    yAxisGroup.selectAll("path, line").attr("stroke", "#585b70"); // Surface2
    yAxisGroup.selectAll("text").attr("fill", "#bac2de"); // Subtext1

    svg
      .selectAll(".x-axis-label")
      .data([null])
      .join("text")
      .attr("class", "axislabel unselectable x-axis-label")
      .attr("transform", `translate(${width / 2},${height - 5})`)
      .style("text-anchor", "middle")
      .style("fill", "#cdd6f4") // Text
      .text("Population");

    svg
      .selectAll(".y-axis-label")
      .data([null])
      .join("text")
      .attr("class", "axislabel unselectable y-axis-label")
      .attr("transform", "rotate(-90)")
      .attr("y", 15)
      .attr("x", 0 - height / 2)
      .style("text-anchor", "middle")
      .style("fill", "#cdd6f4") // Text
      .text("Medals");

    const dots = svg.selectAll(".dot").data(processedData, (d) => d.code);

    dots
      .enter()
      .append("circle")
      .attr("class", "dot")
      .attr("r", (d) => radiusScale(d.medals))
      .attr("cx", (d) => xScale(d.population))
      .attr("cy", (d) => yScale(d.medals))
      .attr("stroke", "#11111b") // Crust
      .attr("fill", (d) => d.color)
      .attr("opacity", 0)
      .transition(transition)
      .attr("opacity", 1);

    dots
      .transition(transition)
      .attr("cx", (d) => xScale(d.population))
      .attr("cy", (d) => yScale(d.medals))
      .attr("fill", (d) => d.color)
      .attr("opacity", 1);

    dots.exit().transition(transition).attr("r", 0).remove();

    svg.selectAll(".dot")
      .on("mouseover", (event, d) => {
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
          .duration(750)
          .ease(d3.easeElastic)
          .attr("r", (d) => radiusScale(d.medals) + 4)
          .attr("stroke", "#cdd6f4"); // Text
      })
      .on("mouseout", (event) => {
        setTooltipState((prev) => ({ ...prev, show: false }));
        d3.select(event.currentTarget)
          .transition()
          .duration(750)
          .ease(d3.easeElastic)
          .attr("r", (d) => radiusScale(d.medals))
          .attr("stroke", "#11111b"); // Crust
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
  ]);

  return (
    <div id="scatterplot">
      <svg ref={svgRef} width="100%" height="100%" />
    </div>
  );
};

export default Scatterplot;
