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
