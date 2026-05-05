import * as d3 from "d3";
import { DictionaryEntry, OlympicsData, OlympicRow, PopulationRow, WorldGeo } from "@/types";

export const fetchData = async (): Promise<OlympicsData> => {
  const [dictionary, country, population, worldGeo] = await Promise.all([
    d3.csv("/data/dictionary.csv", (row): DictionaryEntry => ({
      CountryName: row.CountryName ?? "",
      CountryCode: row.CountryCode ?? "",
    })),
    d3.csv("/data/summer_year_country_event.csv", (row): OlympicRow => {
      const gold = Number(row.GoldCount ?? 0);
      const silver = Number(row.SilverCount ?? 0);
      const bronze = Number(row.BronzeCount ?? 0);
      return {
        Country: row.Country ?? "",
        Year: Number(row.Year ?? 0),
        Sport: row.Sport ?? "",
        Discipline: row.Discipline ?? "",
        Event: row.Event ?? "",
        GoldCount: gold,
        SilverCount: silver,
        BronzeCount: bronze,
        TotalMedals: gold + silver + bronze,
      };
    }),
    d3.csv("/data/world_population_full.csv", (row): PopulationRow => {
      const parsed: PopulationRow = { CountryCode: row.CountryCode ?? "" };
      Object.entries(row).forEach(([key, value]) => {
        if (key !== "CountryCode" && value !== undefined) {
          parsed[key] = value;
        }
      });
      return parsed;
    }),
    d3.json<WorldGeo>("/data/simple_map.json"),
  ]);

  if (!worldGeo) {
    throw new Error("Failed to load world map data");
  }

  return {
    dictionary,
    country,
    population,
    worldGeo,
  };
};
