import React, { useRef, useEffect, useState } from "react";
import "./Bubblechart.css";
import * as d3 from "d3";
import useYearStore from "@/stores/useYearStore";
import { DictionaryEntry, OlympicRow, TooltipState } from "@/types";

interface BubblechartProps {
  dictionaryData: DictionaryEntry[];
  countryData: OlympicRow[];
  setTooltipState: (state: TooltipState) => void;
}

const Bubblechart: React.FC<BubblechartProps> = ({ dictionaryData, countryData, setTooltipState }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const yearFilter = useYearStore((state) => state.yearFilter);
  const countrySelection = useYearStore((state) => state.countrySelection);
  const currentState = useYearStore((state) => state.currentState);
  const currentFilterKeyword = useYearStore(
    (state) => state.currentFilterKeyword
  ) as keyof OlympicRow;
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

    resizeObserver.observe(container.parentElement!);

    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    if (!dictionaryData || !countryData || dimensions.width === 0 || !svgRef.current) {
      return;
    }

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
            Country: "" as string | null,
            Sport: "" as string | null,
            Discipline: "" as string | null,
            Event: "" as string | null,
          }
        );
        return totals;
      },
      (d) => d[currentFilterKeyword] as string
    );

    const processedData = Array.from(processedMap, ([key, value]) => ({
      ...value,
      [currentFilterKeyword]: key,
    })).sort((a, b) => d3.descending(a.TotalMedals, b.TotalMedals));

    const radiusScale = d3
      .scaleSqrt()
      .domain([1, d3.max(processedData, (d) => d.TotalMedals || 1)!])
      .range([16, 75 - processedData.length / 2]);

    // Catppuccin Accents
    const catppuccinAccents = [
      "#cba6f7", "#89b4fa", "#a6e3a1", "#f9e2af", "#fab387", "#f38ba8", 
      "#f5c2e7", "#94e2d5", "#89dceb", "#74c7ec", "#b4befe", "#f2cdcd",
    ];

    const colorScale = d3.scaleOrdinal<string>()
      .domain(processedData.map((d) => d[currentFilterKeyword] as string))
      .range(catppuccinAccents);

    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height);

    // Persistent layers
    let gBubbles = svg.select<SVGGElement>(".bubbles-g");
    if (gBubbles.empty()) {
      gBubbles = svg.append("g").attr("class", "bubbles-g");
    }

    if (!processedData.length) {
      gBubbles.selectAll(".bubble-g").remove();
      return;
    }

    const simulation = d3
      .forceSimulation(processedData as any)
      .force("x", d3.forceX(width / 2).strength(0.08))
      .force("y", d3.forceY(height / 2).strength(0.08))
      .force("charge", d3.forceManyBody().strength(-20))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide().strength(0.7).radius((d: any) => radiusScale(d.TotalMedals) + 3));

    const bubbleNodes = gBubbles.selectAll<SVGGElement, any>(".bubble-g")
      .data(processedData, d => d[currentFilterKeyword] as string)
      .join(
        enter => {
          const g = enter.append("g").attr("class", "bubble-g");
          g.append("circle")
            .attr("class", "bubble-circle")
            .attr("stroke-width", "1.5")
            .attr("stroke", "#11111b")
            .attr("fill-opacity", 0.8)
            .attr("r", 0);
          g.append("text")
            .attr("class", "label unselectable")
            .style("pointer-events", "none")
            .style("fill", "#11111b")
            .style("font-weight", "700")
            .style("text-anchor", "middle")
            .style("dominant-baseline", "central");
          return g;
        }
      );

    bubbleNodes.select<SVGCircleElement>(".bubble-circle")
      .transition().duration(750)
      .attr("r", d => radiusScale(d.TotalMedals))
      .attr("fill", d => colorScale(d[currentFilterKeyword] as string));

    bubbleNodes.select<SVGTextElement>("text")
      .style("font-size", d => {
        const r = radiusScale(d.TotalMedals);
        return Math.min(r / 3.5, 14) + "px";
      })
      .text((d) => {
        const r = radiusScale(d.TotalMedals);
        const label = d[currentFilterKeyword] as string;
        const maxChars = Math.floor(r / 3.2);
        if (r < 20) return "";
        if (label.length > maxChars) {
          return label.slice(0, Math.max(0, maxChars - 2)) + "...";
        }
        return label;
      });

    const showTooltip = (event: any, d: any) => {
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
      setTooltipState({ show: false, content: "", x: 0, y: 0 });
    };

    bubbleNodes.select(".bubble-circle")
      .style("cursor", "pointer") // Add pointer cursor
      .on("mouseover", function (event, d) {
        showTooltip(event, d);
        d3.select(this)
          .transition()
          .duration(300)
          .attr("r", radiusScale(d.TotalMedals) + 5)
          .attr("fill-opacity", 1)
          .attr("stroke", "#cdd6f4");
      })
      .on("mousemove", (event) => {
        setTooltipState((prev: any) => ({
          ...prev,
          x: event.pageX,
          y: event.pageY
        }));
      })
      .on("mouseout", function (event, d) {
        hideTooltip();
        d3.select(this)
          .transition()
          .duration(300)
          .attr("r", radiusScale(d.TotalMedals))
          .attr("fill-opacity", 0.8)
          .attr("stroke", "#11111b");
      })
      .on("click", (event, d) => {
        hideTooltip();
        setSelectedNode(d as unknown as OlympicRow);
        advanceState(1);
      })
      .call(
        d3
          .drag<SVGCircleElement, any>()
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
          }) as any
      );

    simulation.on("tick", () => {
      bubbleNodes.attr("transform", d => `translate(${d.x},${d.y})`);
    });

    return () => {
      simulation.stop();
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
    <div id="bubblechart" className="w-full h-full relative">
      <div
        id="back-icon-container"
        className={currentState > 0 ? "visible" : "hidden"}
        onClick={() => {
          setTooltipState({ show: false, content: "", x: 0, y: 0 });
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
