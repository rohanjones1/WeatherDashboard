/** Coordinates returned by the OpenWeather Geocoding API. */
export interface GeocodingResult {
  name: string;
  lat: number;
  lon: number;
  country: string;
  state?: string;
}

/** Shape of the response from /data/2.5/weather. */
export interface CurrentWeatherResponse {
  name: string;
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
    temp_min: number;
    temp_max: number;
  };
  weather: { id: number; main: string; description: string; icon: string }[];
  wind: { speed: number };
}

/** A single 3-hour entry from /data/2.5/forecast. */
export interface ForecastListItem {
  dt: number;
  main: {
    temp: number;
    temp_min: number;
    temp_max: number;
  };
  weather: { id: number; main: string; description: string; icon: string }[];
}

/** Shape of the response from /data/2.5/forecast. */
export interface ForecastResponse {
  list: ForecastListItem[];
  city: {
    name: string;
    country: string;
  };
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
