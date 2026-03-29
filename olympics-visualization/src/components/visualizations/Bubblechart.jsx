import React, { useRef, useEffect, useState } from "react";
import "./Bubblechart.css";
import * as d3 from "d3";
import useYearStore from "../../store/useYearStore";

const Bubblechart = ({ dictionaryData, countryData, setTooltipState }) => {
  const svgRef = useRef();
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const yearFilter = useYearStore((state) => state.yearFilter);
  const countrySelection = useYearStore((state) => state.countrySelection);
  const currentState = useYearStore((state) => state.currentState);
  const currentFilterKeyword = useYearStore(
    (state) => state.currentFilterKeyword
  );
  const sportFilter = useYearStore((state) => state.sportFilter);
  const disciplineFilter = useYearStore((state) => state.disciplineFilter);
  const eventFilter = useYearStore((state) => state.eventFilter);
  const setSelectedNode = useYearStore((state) => state.setSelectedNode);
  const advanceState = useYearStore((state) => state.advanceState);

  // Handle ResizeObserver
  useEffect(() => {
    const container = svgRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width, height } = entries[0].contentRect;
      setDimensions({ width, height });
    });

    resizeObserver.observe(container.parentElement);

    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    if (!dictionaryData || !countryData || dimensions.width === 0) {
      return;
    }

    const container = svgRef.current;
    if (!container) return;

    const { width, height } = dimensions;

    const filteredData = countryData.filter((d) => {
      if (
        countrySelection.length > 0 &&
        !countrySelection.includes(d.Country)
      ) {
        return false;
      }
      if (d.Year < yearFilter.start || d.Year > yearFilter.end) {
        return false;
      }
      if (currentState === 1 && d.Sport !== sportFilter) return false;
      if (currentState === 2 && d.Discipline !== disciplineFilter) return false;
      if (currentState === 3 && d.Event !== eventFilter) return false;
      return true;
    });

    const processedMap = d3.rollup(
      filteredData,
      (values) => {
        const totals = values.reduce(
          (acc, cur) => {
            acc.GoldCount += +cur.GoldCount;
            acc.SilverCount += +cur.SilverCount;
            acc.BronzeCount += +cur.BronzeCount;
            acc.TotalMedals +=
              +cur.GoldCount + +cur.SilverCount + +cur.BronzeCount;
            acc.Country = cur.Country;
            acc.Sport = cur.Sport;
            acc.Discipline = cur.Discipline;
            acc.Event = cur.Event;
            return acc;
          },
          {
            GoldCount: 0,
            SilverCount: 0,
            BronzeCount: 0,
            TotalMedals: 0,
            Country: null,
            Sport: null,
            Discipline: null,
            Event: null,
          }
        );
        return totals;
      },
      (d) => d[currentFilterKeyword]
    );

    const processedData = Array.from(processedMap, ([key, value]) => ({
      ...value,
      [currentFilterKeyword]: key,
    })).sort((a, b) => d3.descending(a.TotalMedals, b.TotalMedals));

    const radiusScale = d3
      .scaleSqrt()
      .domain([1, d3.max(processedData, (d) => d.TotalMedals || 1)])
      .range([16, 75 - processedData.length / 2]);

    // Catppuccin Accents
    const catppuccinAccents = [
      "#cba6f7", // mauve
      "#89b4fa", // blue
      "#a6e3a1", // green
      "#f9e2af", // yellow
      "#fab387", // peach
      "#f38ba8", // red
      "#f5c2e7", // pink
      "#94e2d5", // teal
      "#89dceb", // sky
      "#74c7ec", // sapphire
      "#b4befe", // lavender
      "#f2cdcd", // flamingo
    ];

    const colorScale = d3.scaleOrdinal()
      .domain(processedData.map((d) => d[currentFilterKeyword]))
      .range(catppuccinAccents);

    const svg = d3
      .select(container)
      .attr("width", width)
      .attr("height", height);

    svg.selectAll("*").remove();

    if (!processedData.length) {
      return;
    }

    const simulation = d3
      .forceSimulation(processedData)
      .force(
        "x",
        d3
          .forceX(width / 2)
          .strength(0.08)
      )
      .force(
        "y",
        d3
          .forceY(height / 2)
          .strength(0.08)
      )
      .force("charge", d3.forceManyBody().strength(-20))
      .force("center_force", d3.forceCenter(width / 2, height / 2))
      .force(
        "collide",
        d3
          .forceCollide()
          .strength(0.7)
          .radius((d) => radiusScale(d.TotalMedals) + 3)
      );

    const bubbleGroup = svg
      .selectAll(".bubble")
      .data(processedData)
      .enter()
      .append("g")
      .attr("class", "bubble");

    const showTooltip = (event, d) => {
      setTooltipState({
        show: true,
        x: event.pageX,
        y: event.pageY,
        content: `
          <center><strong>${d[currentFilterKeyword]}</strong></center>
          <center>
            <span style="color: #f9e2af"><strong>${d.GoldCount}</strong>🥇</span>
            <span style="color: #bac2de"><strong>${d.SilverCount}</strong>🥈</span>
            <span style="color: #fab387"><strong>${d.BronzeCount}</strong>🥉</span>
          </center>
          <center><strong>Total:</strong> ${d.TotalMedals}</center>
        `
      });
    };

    const hideTooltip = () => {
      setTooltipState((prev) => ({ ...prev, show: false }));
    };

    const bubble = bubbleGroup
      .append("circle")
      .attr("stroke-width", "1.5")
      .attr("stroke", "#11111b") // Crust
      .attr("fill", (d) => colorScale(d[currentFilterKeyword]))
      .attr("fill-opacity", 0.8)
      .on("mouseover", function (event, d) {
        showTooltip(event, d);
        d3.select(this)
          .transition()
          .duration(300)
          .ease(d3.easeCubicOut)
          .attr("r", radiusScale(d.TotalMedals) + 5)
          .attr("fill-opacity", 1)
          .attr("stroke", "#cdd6f4"); // Text
      })
      .on("mousemove", (event) => {
        setTooltipState((prev) => ({
          ...prev,
          x: event.pageX,
          y: event.pageY
        }));
      })
      .on("mouseout", function () {
        hideTooltip();
        d3.select(this)
          .transition()
          .duration(300)
          .ease(d3.easeCubicOut)
          .attr("r", (d) => radiusScale(d.TotalMedals))
          .attr("fill-opacity", 0.8)
          .attr("stroke", "#11111b"); // Crust
      })
      .on("click", (event, d) => {
        hideTooltip();
        setSelectedNode(d);
        advanceState(1);
      })
      .call(
        d3
          .drag()
          .on("start", (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on("end", (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
      );

    const labels = bubbleGroup
      .append("text")
      .attr("class", "label unselectable")
      .style("pointer-events", "none")
      .style("fill", "#11111b") // Crust for contrast
      .style("font-weight", "700")
      .style("text-anchor", "middle")
      .style("dominant-baseline", "central")
      .style("font-size", d => {
        const r = radiusScale(d.TotalMedals);
        return Math.min(r / 3.5, 14) + "px";
      })
      .text((d) => {
        const r = radiusScale(d.TotalMedals);
        const label = d[currentFilterKeyword];
        const maxChars = Math.floor(r / 3.2);
        if (r < 20) return "";
        if (label.length > maxChars) {
          return label.slice(0, Math.max(0, maxChars - 2)) + "...";
        }
        return label;
      });

    simulation.on("tick", () => {
      bubble
        .attr("cx", (d) => d.x)
        .attr("cy", (d) => d.y)
        .attr("r", (d) => radiusScale(d.TotalMedals));

      labels
        .attr("x", (d) => d.x)
        .attr("y", (d) => d.y);
    });

    return () => {
      svg.selectAll("*").remove();
    };
  }, [
    advanceState,
    countryData,
    countrySelection,
    currentFilterKeyword,
    currentState,
    disciplineFilter,
    eventFilter,
    setSelectedNode,
    sportFilter,
    yearFilter,
    dictionaryData,
    dimensions,
    setTooltipState,
  ]);

  return (
    <div id="bubblechart">
      <div
        id="back-icon-container"
        className={currentState > 0 ? "visible" : "hidden"}
        onClick={() => {
          setTooltipState((prev) => ({ ...prev, show: false }));
          advanceState(-1);
        }}
        role="button"
        aria-label="Go back"
      >
        <span className="back-icon-arrow">←</span>
        <div className="back-icon-text">
          <div className="back-title">Back</div>
          <div className="back-subtitle">
            {currentState === 3
              ? "Events"
              : currentState === 2
              ? "Disciplines"
              : "Sports"}
          </div>
        </div>
      </div>
      <svg ref={svgRef} width="100%" height="100%" />
    </div>
  );
};

export default Bubblechart;
