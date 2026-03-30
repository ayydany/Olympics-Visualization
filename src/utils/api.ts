import * as d3 from "d3";
import { OlympicRow, DictionaryEntry } from "@/types";

export const fetchData = async () => {
  const [dictionary, country, population, worldGeo] = await Promise.all([
    d3.csv("/data/dictionary.csv"),
    d3.csv("/data/summer_year_country_event.csv"),
    d3.csv("/data/world_population_full.csv"),
    d3.json("/data/simple_map.json"),
  ]);

  const parsedCountry: OlympicRow[] = (country as any[]).map((d) => ({
    ...d,
    Year: +d.Year,
    GoldCount: +d.GoldCount,
    SilverCount: +d.SilverCount,
    BronzeCount: +d.BronzeCount,
    TotalMedals: +d.GoldCount + +d.SilverCount + +d.BronzeCount,
  }));

  return {
    dictionary: dictionary as unknown as DictionaryEntry[],
    country: parsedCountry,
    population: population as any[],
    worldGeo: worldGeo as any,
  };
};
