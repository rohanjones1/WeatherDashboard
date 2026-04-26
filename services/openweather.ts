import axios from "axios";
import type {
  GeocodingResult,
  CurrentWeatherResponse,
  ForecastResponse,
  ForecastListItem,
  WeatherApiResponse,
} from "../types/weather";

const BASE_URL = "https://api.openweathermap.org";

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
 * Convert a city name to geographic coordinates using the OpenWeather
 * Geocoding API.
 */
export async function geocodeCity(city: string): Promise<GeocodingResult> {
  const { data } = await axios.get<GeocodingResult[]>(
    `${BASE_URL}/geo/1.0/direct`,
    { params: { q: city, limit: 1, appid: getApiKey() } },
  );

  if (!data.length) {
    throw new GeocodingError(`City not found: ${city}`);
  }
  return data[0];
}

/**
 * Group 3-hour forecast entries by calendar date and pick the daily
 * high, low, and most frequent condition for each day.
 */
function aggregateDaily(list: ForecastListItem[]): { day: string; high: number; low: number; condition: string }[] {
  const buckets = new Map<string, ForecastListItem[]>();

  for (const entry of list) {
    const dateKey = new Date(entry.dt * 1000).toLocaleDateString("en-US", {
      weekday: "short",
    });
    const bucket = buckets.get(dateKey);
    if (bucket) {
      bucket.push(entry);
    } else {
      buckets.set(dateKey, [entry]);
    }
  }

  const days: { day: string; high: number; low: number; condition: string }[] = [];

  for (const [dayName, entries] of buckets) {
    let high = -Infinity;
    let low = Infinity;
    const conditionCounts = new Map<string, number>();

    for (const e of entries) {
      if (e.main.temp_max > high) high = e.main.temp_max;
      if (e.main.temp_min < low) low = e.main.temp_min;
      const desc = e.weather[0].description;
      conditionCounts.set(desc, (conditionCounts.get(desc) || 0) + 1);
    }

    let condition = "";
    let maxCount = 0;
    for (const [desc, count] of conditionCounts) {
      if (count > maxCount) {
        maxCount = count;
        condition = desc;
      }
    }

    days.push({ day: dayName, high: Math.round(high), low: Math.round(low), condition });
  }

  return days.slice(0, 5);
}

/**
 * Fetch current conditions from /data/2.5/weather and a 5-day forecast
 * from /data/2.5/forecast, then reshape the result to our API contract.
 */
export async function getWeather(city: string): Promise<WeatherApiResponse> {
  const location = await geocodeCity(city);
  const params = {
    lat: location.lat,
    lon: location.lon,
    units: "metric",
    appid: getApiKey(),
  };

  const [currentRes, forecastRes] = await Promise.all([
    axios.get<CurrentWeatherResponse>(`${BASE_URL}/data/2.5/weather`, { params }),
    axios.get<ForecastResponse>(`${BASE_URL}/data/2.5/forecast`, { params }),
  ]);

  const current = currentRes.data;
  const forecast = aggregateDaily(forecastRes.data.list);

  return {
    city: location.name,
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
