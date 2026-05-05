import type * as d3 from "d3";

export type CountryCode = string;

export interface OlympicRow {
  Country: CountryCode;
  Year: number;
  Sport: string;
  Discipline: string;
  Event: string;
  GoldCount: number;
  SilverCount: number;
  BronzeCount: number;
  TotalMedals: number;
}

export interface DictionaryEntry {
  CountryName: string;
  CountryCode: CountryCode;
}

export interface PopulationRow {
  CountryCode: CountryCode;
  [year: string]: string | number;
}

export interface WorldFeature {
  type: "Feature";
  properties: {
    name?: string;
    name_long?: string;
  };
  geometry: d3.GeoGeometryObjects;
}

export interface WorldGeo {
  type: "FeatureCollection";
  features: WorldFeature[];
}

export interface OlympicsData {
  dictionary: DictionaryEntry[];
  country: OlympicRow[];
  population: PopulationRow[];
  worldGeo: WorldGeo;
}

export interface YearFilter {
  start: number;
  end: number;
}

export interface TooltipState {
  show: boolean;
  content: string;
  x: number;
  y: number;
}

export type TooltipStateSetter = (
  state: TooltipState | ((prev: TooltipState) => TooltipState)
) => void;
