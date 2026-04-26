import axios from "axios";
import type {
  CurrentWeatherResponse,
  ForecastResponse,
  ForecastDay,
  WeatherApiResponse,
} from "../types/weather";

const BASE_URL = "https://api.openweathermap.org/data/2.5";

function getApiKey(): string {
  const key = process.env.OPENWEATHER_API_KEY;
  if (!key) {
    throw new Error(
      "Missing OPENWEATHER_API_KEY environment variable. " +
        "Get one at https://openweathermap.org/api and add it to your .env file.",
    );
  }
  return key;
}

/**
 * Fetch current weather conditions for a city using the free-tier
 * /data/2.5/weather endpoint.
 */
async function fetchCurrentWeather(
  city: string,
): Promise<CurrentWeatherResponse> {
  const { data } = await axios.get<CurrentWeatherResponse>(
    `${BASE_URL}/weather`,
    { params: { q: city, units: "metric", appid: getApiKey() } },
  );
  return data;
}

/**
 * Fetch the 5-day / 3-hour forecast for a city using the free-tier
 * /data/2.5/forecast endpoint, then aggregate into daily summaries.
 */
async function fetchForecast(city: string): Promise<ForecastDay[]> {
  const { data } = await axios.get<ForecastResponse>(
    `${BASE_URL}/forecast`,
    { params: { q: city, units: "metric", appid: getApiKey() } },
  );

  const dailyMap = new Map<
    string,
    { high: number; low: number; condition: string; dayName: string }
  >();

  for (const entry of data.list) {
    const date = new Date(entry.dt * 1000);
    const dateKey = date.toISOString().slice(0, 10);
    const dayName = date.toLocaleDateString("en-US", { weekday: "short" });

    const existing = dailyMap.get(dateKey);
    if (existing) {
      existing.high = Math.max(existing.high, entry.main.temp_max);
      existing.low = Math.min(existing.low, entry.main.temp_min);
    } else {
      dailyMap.set(dateKey, {
        high: entry.main.temp_max,
        low: entry.main.temp_min,
        condition: entry.weather[0].description,
        dayName,
      });
    }
  }

  return Array.from(dailyMap.values())
    .slice(0, 5)
    .map((d) => ({
      day: d.dayName,
      high: Math.round(d.high),
      low: Math.round(d.low),
      condition: d.condition,
    }));
}

/**
 * Get current conditions and a 5-day forecast for a city, shaped to
 * match the existing frontend contract.
 */
export async function getWeather(city: string): Promise<WeatherApiResponse> {
  const [current, forecast] = await Promise.all([
    fetchCurrentWeather(city),
    fetchForecast(city),
  ]);

  return {
    city: current.name,
    temperature: Math.round(current.main.temp),
    condition: current.weather[0].description,
    humidity: current.main.humidity,
    forecast,
  };
}

/** Thrown when the geocoding step cannot resolve a city name. */
export class GeocodingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GeocodingError";
  }
}
