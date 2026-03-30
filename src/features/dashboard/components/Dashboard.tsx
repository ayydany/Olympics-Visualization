import React, { useEffect, useMemo, useState, useRef } from "react";
import * as d3 from "d3";
import { Responsive as ResponsiveGridLayout, Layouts } from "react-grid-layout";
import { 
  IconButton, 
  Menu, 
  MenuItem, 
  FormControlLabel, 
  Checkbox, 
  Box, 
  Typography,
  Tooltip as MuiTooltip
} from "@mui/material";
import { Settings as SettingsIcon, DragIndicator as DragIcon } from "@mui/icons-material";

import Header from "@/features/dashboard/components/Header";
import Bubblechart from "@/features/dashboard/components/Bubblechart";
import Linechart from "@/features/dashboard/components/Linechart";
import Scatterplot from "@/features/dashboard/components/Scatterplot";
import Worldmap from "@/features/dashboard/components/Worldmap";
import Tooltip from "@/components/Tooltip";
import { fetchData } from "@/utils/api";
import useYearStore from "@/stores/useYearStore";
import { OlympicRow, DictionaryEntry, TooltipState } from "@/types";

import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import "./Dashboard.css";

const MainComponent: React.FC = () => {
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const [gridWidth, setGridWidth] = useState(1200);
  const [dictionaryData, setDictionaryData] = useState<DictionaryEntry[] | null>(null);
  const [countryData, setCountyData] = useState<OlympicRow[] | null>(null);
  const [populationData, setPopulationData] = useState<any[] | null>(null);
  const [worldGeo, setWorldGeo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const openMenu = Boolean(anchorEl);

  const [visibleCharts, setVisibleCharts] = useState({
    worldmap: true,
    bubblechart: true,
    scatterplot: true,
    linechart: true,
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

  const visReady = useMemo(() => {
    return dictionaryData && countryData && populationData && worldGeo;
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

  const initialLayouts: Layouts = {
    lg: [
      { i: "worldmap", x: 0, y: 0, w: 6, h: 15 },
      { i: "bubblechart", x: 6, y: 0, w: 6, h: 15 },
      { i: "scatterplot", x: 0, y: 15, w: 6, h: 15 },
      { i: "linechart", x: 6, y: 15, w: 6, h: 15 },
    ],
    md: [
      { i: "worldmap", x: 0, y: 0, w: 5, h: 15 },
      { i: "bubblechart", x: 5, y: 0, w: 5, h: 15 },
      { i: "scatterplot", x: 0, y: 15, w: 5, h: 15 },
      { i: "linechart", x: 5, y: 15, w: 5, h: 15 },
    ],
    sm: [
      { i: "worldmap", x: 0, y: 0, w: 6, h: 12 },
      { i: "bubblechart", x: 0, y: 12, w: 6, h: 12 },
      { i: "scatterplot", x: 0, y: 24, w: 6, h: 12 },
      { i: "linechart", x: 0, y: 36, w: 6, h: 12 },
    ],
    xs: [
      { i: "worldmap", x: 0, y: 0, w: 4, h: 10 },
      { i: "bubblechart", x: 0, y: 10, w: 4, h: 10 },
      { i: "scatterplot", x: 0, y: 20, w: 4, h: 10 },
      { i: "linechart", x: 0, y: 30, w: 4, h: 10 },
    ],
    xss: [
      { i: "worldmap", x: 0, y: 0, w: 2, h: 10 },
      { i: "bubblechart", x: 0, y: 10, w: 2, h: 10 },
      { i: "scatterplot", x: 0, y: 20, w: 2, h: 10 },
      { i: "linechart", x: 0, y: 30, w: 2, h: 10 },
    ],
  };

  const filteredLayouts = useMemo(() => {
    const newLayouts: Layouts = {};
    Object.keys(initialLayouts).forEach(bp => {
      newLayouts[bp] = initialLayouts[bp].filter(item => visibleCharts[item.i as keyof typeof visibleCharts]);
    });
    return newLayouts;
  }, [visibleCharts]);

  return (
    <div className="main-container flex flex-col h-screen bg-ctp-base text-ctp-text overflow-hidden relative">
      <Header dictionaryData={dictionaryData} />
      
      {/* MUI Settings Menu - Absolute Top Right */}
      <Box sx={{ position: 'fixed', top: 12, right: 12, left: 'auto', zIndex: 2000 }}>
        <MuiTooltip title="Configure Visualizations">
          <IconButton 
            onClick={handleMenuClick}
            sx={{ 
              backgroundColor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: 4,
              '&:hover': { backgroundColor: 'action.hover', transform: 'scale(1.1)' },
              transition: 'all 0.2s ease'
            }}
          >
            <SettingsIcon color="primary" />
          </IconButton>
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
            linechart: "Line Chart"
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
        {visReady && (
          <ResponsiveGridLayout
            className="layout"
            layouts={filteredLayouts}
            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xss: 0 }}
            cols={{ lg: 12, md: 10, sm: 6, xs: 4, xss: 2 }}
            rowHeight={20}
            width={gridWidth}
            draggableHandle=".drag-handle"
            margin={[10, 10]}
          >
            {visibleCharts.worldmap && (
              <div key="worldmap" className="vis-cell group">
                <div className="drag-handle absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all cursor-grab active:cursor-grabbing z-[100] flex items-center justify-center text-ctp-mauve/50 hover:text-ctp-mauve hover:scale-125" style={{ top: '16px', right: '16px', left: 'auto' }}>
                  <DragIcon sx={{ fontSize: 24 }} />
                </div>
                <Worldmap dictionaryData={dictionaryData!} setTooltipState={updateTooltipState} worldGeo={worldGeo!} />
              </div>
            )}
            {visibleCharts.bubblechart && (
              <div key="bubblechart" className="vis-cell group">
                <div className="drag-handle absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all cursor-grab active:cursor-grabbing z-[100] flex items-center justify-center text-ctp-mauve/50 hover:text-ctp-mauve hover:scale-125" style={{ top: '16px', right: '16px', left: 'auto' }}>
                  <DragIcon sx={{ fontSize: 24 }} />
                </div>
                <Bubblechart countryData={countryData!} dictionaryData={dictionaryData!} setTooltipState={updateTooltipState} />
              </div>
            )}
            {visibleCharts.scatterplot && (
              <div key="scatterplot" className="vis-cell group">
                <div className="drag-handle absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all cursor-grab active:cursor-grabbing z-[100] flex items-center justify-center text-ctp-mauve/50 hover:text-ctp-mauve hover:scale-125" style={{ top: '16px', right: '16px', left: 'auto' }}>
                  <DragIcon sx={{ fontSize: 24 }} />
                </div>
                <Scatterplot countryData={countryData!} populationData={populationData!} dictionaryData={dictionaryData!} setTooltipState={updateTooltipState} />
              </div>
            )}
            {visibleCharts.linechart && (
              <div key="linechart" className="vis-cell group">
                <div className="drag-handle absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all cursor-grab active:cursor-grabbing z-[100] flex items-center justify-center text-ctp-mauve/50 hover:text-ctp-mauve hover:scale-125" style={{ top: '16px', right: '16px', left: 'auto' }}>
                  <DragIcon sx={{ fontSize: 24 }} />
                </div>
                <Linechart countryData={countryData!} dictionaryData={dictionaryData!} setTooltipState={updateTooltipState} />
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
