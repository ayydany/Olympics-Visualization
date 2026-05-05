import React, { useEffect, useMemo, useState, useRef } from "react";
import * as d3 from "d3";
import { Responsive as ResponsiveGridLayout } from "react-grid-layout";
import type { ResponsiveLayouts } from "react-grid-layout";
import { 
  Menu, 
  MenuItem, 
  FormControlLabel, 
  Checkbox, 
  Box, 
  Button,
  Typography,
  Tooltip as MuiTooltip
} from "@mui/material";
import { Settings as SettingsIcon, OpenWith as ReorderIcon } from "@mui/icons-material";

import Header from "@/features/dashboard/components/Header";
import Bubblechart from "@/features/dashboard/components/Bubblechart";
import Linechart from "@/features/dashboard/components/Linechart";
import PopulationEfficiencyChart from "@/features/dashboard/components/PopulationEfficiencyChart";
import Scatterplot from "@/features/dashboard/components/Scatterplot";
import StackedMedalBars from "@/features/dashboard/components/StackedMedalBars";
import Worldmap from "@/features/dashboard/components/Worldmap";
import Tooltip from "@/components/Tooltip";
import { fetchData } from "@/utils/api";
import useYearStore from "@/stores/useYearStore";
import { OlympicRow, DictionaryEntry, PopulationRow, TooltipState, WorldGeo } from "@/types";

import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import "./Dashboard.css";

const MainComponent: React.FC = () => {
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const [gridWidth, setGridWidth] = useState(1200);
  const [dictionaryData, setDictionaryData] = useState<DictionaryEntry[] | null>(null);
  const [countryData, setCountyData] = useState<OlympicRow[] | null>(null);
  const [populationData, setPopulationData] = useState<PopulationRow[] | null>(null);
  const [worldGeo, setWorldGeo] = useState<WorldGeo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isResizing, setIsResizing] = useState(false);
  const [isReorderMode, setIsReorderMode] = useState(false);
  
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const openMenu = Boolean(anchorEl);

  const [visibleCharts, setVisibleCharts] = useState({
    worldmap: true,
    bubblechart: true,
    scatterplot: true,
    linechart: true,
    stackedMedals: true,
    populationEfficiency: true,
  });

  const [tooltipState, setTooltipState] = useState<TooltipState>({
    show: false,
    content: "",
    x: 0,
    y: 0,
  });

  const updateTooltipState = React.useCallback((state: TooltipState | ((prev: TooltipState) => TooltipState)) => {
    setTooltipState(state);
  }, []);

  const setDefaultCountries = useYearStore((state) => state.setDefaultCountries);
  const countrySelection = useYearStore((state) => state.countrySelection);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!gridContainerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width } = entries[0].contentRect;
      setGridWidth(width);
    });
    observer.observe(gridContainerRef.current);
    return () => observer.disconnect();
  }, []);

  const loadData = async () => {
    try {
      const data = await fetchData();
      setDictionaryData(data.dictionary);
      setCountyData(data.country);
      setPopulationData(data.population);
      setWorldGeo(data.worldGeo);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (dictionaryData && countrySelection.length === 0) {
      const france = dictionaryData.find((d) => d.CountryName === "France");
      if (france) {
        setDefaultCountries([france.CountryCode]);
      } else {
        const defaultCodes = dictionaryData.slice(0, 2).map((d) => d.CountryCode);
        setDefaultCountries(defaultCodes);
      }
    }
  }, [countrySelection.length, dictionaryData, setDefaultCountries]);

  const readyData = useMemo(() => {
    if (!dictionaryData || !countryData || !populationData || !worldGeo) {
      return null;
    }
    return { dictionaryData, countryData, populationData, worldGeo };
  }, [dictionaryData, countryData, populationData, worldGeo]);

  const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const toggleChart = (id: keyof typeof visibleCharts) => {
    setVisibleCharts(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const initialLayouts: ResponsiveLayouts = {
    lg: [
      { i: "worldmap", x: 0, y: 0, w: 6, h: 15, static: false },
      { i: "bubblechart", x: 6, y: 0, w: 6, h: 15, static: false },
      { i: "scatterplot", x: 0, y: 15, w: 6, h: 15, static: false },
      { i: "linechart", x: 6, y: 15, w: 6, h: 15, static: false },
      { i: "stackedMedals", x: 0, y: 30, w: 6, h: 13, static: false },
      { i: "populationEfficiency", x: 6, y: 30, w: 6, h: 13, static: false },
    ],
    md: [
      { i: "worldmap", x: 0, y: 0, w: 5, h: 15, static: false },
      { i: "bubblechart", x: 5, y: 0, w: 5, h: 15, static: false },
      { i: "scatterplot", x: 0, y: 15, w: 5, h: 15, static: false },
      { i: "linechart", x: 5, y: 15, w: 5, h: 15, static: false },
      { i: "stackedMedals", x: 0, y: 30, w: 5, h: 13, static: false },
      { i: "populationEfficiency", x: 5, y: 30, w: 5, h: 13, static: false },
    ],
    sm: [
      { i: "worldmap", x: 0, y: 0, w: 6, h: 12, static: false },
      { i: "bubblechart", x: 0, y: 12, w: 6, h: 12, static: false },
      { i: "scatterplot", x: 0, y: 24, w: 6, h: 12, static: false },
      { i: "linechart", x: 0, y: 36, w: 6, h: 12, static: false },
      { i: "stackedMedals", x: 0, y: 48, w: 6, h: 11, static: false },
      { i: "populationEfficiency", x: 0, y: 59, w: 6, h: 11, static: false },
    ],
    xs: [
      { i: "worldmap", x: 0, y: 0, w: 4, h: 10, static: false },
      { i: "bubblechart", x: 0, y: 10, w: 4, h: 10, static: false },
      { i: "scatterplot", x: 0, y: 20, w: 4, h: 10, static: false },
      { i: "linechart", x: 0, y: 30, w: 4, h: 10, static: false },
      { i: "stackedMedals", x: 0, y: 40, w: 4, h: 10, static: false },
      { i: "populationEfficiency", x: 0, y: 50, w: 4, h: 10, static: false },
    ],
    xss: [
      { i: "worldmap", x: 0, y: 0, w: 2, h: 10, static: false },
      { i: "bubblechart", x: 0, y: 10, w: 2, h: 10, static: false },
      { i: "scatterplot", x: 0, y: 20, w: 2, h: 10, static: false },
      { i: "linechart", x: 0, y: 30, w: 2, h: 10, static: false },
      { i: "stackedMedals", x: 0, y: 40, w: 2, h: 10, static: false },
      { i: "populationEfficiency", x: 0, y: 50, w: 2, h: 10, static: false },
    ],
  };

  const filteredLayouts = useMemo(() => {
    const newLayouts: ResponsiveLayouts = {};
    Object.keys(initialLayouts).forEach(bp => {
      newLayouts[bp] = (initialLayouts[bp] ?? []).filter(
        item => visibleCharts[item.i as keyof typeof visibleCharts]
      );
    });
    return newLayouts;
  }, [visibleCharts]);

  return (
    <div className="main-container flex flex-col h-screen bg-ctp-base text-ctp-text overflow-hidden relative">
      <Header dictionaryData={dictionaryData} />
      
      <Box sx={{ position: 'fixed', top: 12, right: 12, left: 'auto', zIndex: 2000, display: 'flex', gap: 1 }}>
        <MuiTooltip title={isReorderMode ? "Exit Reorder Mode" : "Reorder Visualizations"}>
          <Button
            onClick={() => {
              setIsReorderMode((current) => !current);
              setTooltipState({ show: false, content: "", x: 0, y: 0 });
            }}
            aria-pressed={isReorderMode}
            startIcon={<ReorderIcon />}
            variant={isReorderMode ? "contained" : "outlined"}
            sx={{
              minHeight: 40,
              borderRadius: '12px',
              backgroundColor: isReorderMode ? 'primary.main' : 'background.paper',
              boxShadow: 4,
              fontWeight: 800,
              px: 1.5,
              '&:hover': {
                backgroundColor: isReorderMode ? 'primary.dark' : 'action.hover',
                transform: 'scale(1.1)'
              },
              transition: 'all 0.2s ease'
            }}
          >
            {isReorderMode ? "Done" : "Reorder"}
          </Button>
        </MuiTooltip>
        <MuiTooltip title="Configure Visualizations">
          <Button
            onClick={handleMenuClick}
            startIcon={<SettingsIcon />}
            variant={openMenu ? "contained" : "outlined"}
            sx={{ 
              minHeight: 40,
              borderRadius: '12px',
              backgroundColor: openMenu ? 'primary.main' : 'background.paper',
              boxShadow: 4,
              fontWeight: 800,
              px: 1.5,
              '&:hover': { backgroundColor: 'action.hover', transform: 'scale(1.1)' },
              transition: 'all 0.2s ease'
            }}
          >
            Settings
          </Button>
        </MuiTooltip>
        
        <Menu
          anchorEl={anchorEl}
          open={openMenu}
          onClose={handleMenuClose}
          PaperProps={{
            sx: {
              backgroundColor: 'rgba(24, 24, 37, 0.95)',
              backdropFilter: 'blur(12px)',
              border: '1px solid',
              borderColor: 'primary.main',
              borderRadius: '16px',
              mt: 1.5,
              minWidth: 220,
              boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
            }
          }}
        >
          <Box sx={{ px: 2, py: 1 }}>
            <Typography variant="overline" sx={{ fontWeight: 900, opacity: 0.6, letterSpacing: 2 }}>
              Visible Charts
            </Typography>
          </Box>
          {Object.entries({
            worldmap: "World Map",
            bubblechart: "Bubble Chart",
            scatterplot: "Scatter Plot",
            linechart: "Line Chart",
            stackedMedals: "Medal Bars",
            populationEfficiency: "Population Efficiency"
          }).map(([id, label]) => (
            <MenuItem key={id} sx={{ py: 0.5 }}>
              <FormControlLabel
                control={
                  <Checkbox 
                    checked={visibleCharts[id as keyof typeof visibleCharts]} 
                    onChange={() => toggleChart(id as keyof typeof visibleCharts)}
                    size="small"
                  />
                }
                label={
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {label}
                  </Typography>
                }
                sx={{ width: '100%', mr: 0 }}
              />
            </MenuItem>
          ))}
        </Menu>
      </Box>

      <div ref={gridContainerRef} className="flex-grow overflow-y-auto bg-ctp-crust p-2 relative">
        {isLoading && <div className="p-3 text-ctp-subtext0 font-medium text-center mt-10">Loading dataset...</div>}
        {readyData && (
          <ResponsiveGridLayout
            className="layout"
            layouts={filteredLayouts}
            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xss: 0 }}
            cols={{ lg: 12, md: 10, sm: 6, xs: 4, xss: 2 }}
            rowHeight={20}
            width={gridWidth}
            dragConfig={{ enabled: isReorderMode, threshold: 3 }}
            margin={[10, 10]}
            onResizeStart={() => setIsResizing(true)}
            onResizeStop={() => setIsResizing(false)}
          >
            {visibleCharts.worldmap && (
              <div key="worldmap" className={`vis-cell group ${isReorderMode ? "is-reordering" : ""}`}>
                <div className="viz-content w-full h-full pointer-events-auto">
                  <Worldmap dictionaryData={readyData.dictionaryData} setTooltipState={updateTooltipState} worldGeo={readyData.worldGeo} isResizing={isResizing} />
                </div>
              </div>
            )}
            {visibleCharts.bubblechart && (
              <div key="bubblechart" className={`vis-cell group ${isReorderMode ? "is-reordering" : ""}`}>
                <div className="viz-content w-full h-full pointer-events-auto">
                  <Bubblechart countryData={readyData.countryData} dictionaryData={readyData.dictionaryData} setTooltipState={updateTooltipState} isResizing={isResizing} />
                </div>
              </div>
            )}
            {visibleCharts.scatterplot && (
              <div key="scatterplot" className={`vis-cell group ${isReorderMode ? "is-reordering" : ""}`}>
                <div className="viz-content w-full h-full pointer-events-auto">
                  <Scatterplot countryData={readyData.countryData} populationData={readyData.populationData} dictionaryData={readyData.dictionaryData} setTooltipState={updateTooltipState} isResizing={isResizing} />
                </div>
              </div>
            )}
            {visibleCharts.linechart && (
              <div key="linechart" className={`vis-cell group ${isReorderMode ? "is-reordering" : ""}`}>
                <div className="viz-content w-full h-full pointer-events-auto">
                  <Linechart countryData={readyData.countryData} dictionaryData={readyData.dictionaryData} setTooltipState={updateTooltipState} isResizing={isResizing} />
                </div>
              </div>
            )}
            {visibleCharts.stackedMedals && (
              <div key="stackedMedals" className={`vis-cell group ${isReorderMode ? "is-reordering" : ""}`}>
                <div className="viz-content w-full h-full pointer-events-auto">
                  <StackedMedalBars countryData={readyData.countryData} dictionaryData={readyData.dictionaryData} setTooltipState={updateTooltipState} isResizing={isResizing} />
                </div>
              </div>
            )}
            {visibleCharts.populationEfficiency && (
              <div key="populationEfficiency" className={`vis-cell group ${isReorderMode ? "is-reordering" : ""}`}>
                <div className="viz-content w-full h-full pointer-events-auto">
                  <PopulationEfficiencyChart countryData={readyData.countryData} populationData={readyData.populationData} dictionaryData={readyData.dictionaryData} setTooltipState={updateTooltipState} isResizing={isResizing} />
                </div>
              </div>
            )}
          </ResponsiveGridLayout>
        )}
      </div>
      <Tooltip {...tooltipState} />
    </div>
  );
};

export default MainComponent;
