/** Response from GET /data/2.5/weather (free tier). */
export interface CurrentWeatherResponse {
  name: string;
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    humidity: number;
  };
  weather: { id: number; main: string; description: string; icon: string }[];
  wind: { speed: number };
}

/** A single 3-hour entry in the 5-day forecast response. */
export interface ForecastEntry {
  dt: number;
  main: {
    temp: number;
    temp_min: number;
    temp_max: number;
    humidity: number;
  };
  weather: { id: number; main: string; description: string; icon: string }[];
}

/** Response from GET /data/2.5/forecast (free tier). */
export interface ForecastResponse {
  city: { name: string; country: string };
  list: ForecastEntry[];
}

/** A single day in the 5-day forecast returned by our API. */
export interface ForecastDay {
  day: string;
  high: number;
  low: number;
  condition: string;
}

/** Response shape served by GET /api/weather (must match the frontend). */
export interface WeatherApiResponse {
  city: string;
  temperature: number;
  condition: string;
  humidity: number;
  forecast: ForecastDay[];
}
