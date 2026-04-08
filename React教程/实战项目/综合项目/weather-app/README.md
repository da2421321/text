# 天气预报应用

## 项目简介

实时天气查询应用，支持城市搜索、天气展示、未来预报和收藏城市功能。

## 技术栈

- React 18
- TypeScript
- Axios（HTTP 请求）
- React Router 6
- Context API
- 天气 API（如 OpenWeatherMap / WeatherAPI）

## 功能特性

- [x] 城市搜索
- [x] 当前天气展示（温度、湿度、风速、天气状况）
- [x] 未来7天天气预报
- [x] 24小时逐时预报
- [x] 收藏城市
- [x] 温度单位切换（摄氏/华氏）
- [x] 天气图标展示
- [x] 加载状态和错误处理
- [ ] 地图展示
- [ ] 空气质量指数
- [ ] 天气预警通知

## 项目结构

```
weather-app/
├── src/
│   ├── api/
│   │   └── weather.ts
│   ├── components/
│   │   ├── SearchBar.tsx
│   │   ├── CurrentWeather.tsx
│   │   ├── HourlyForecast.tsx
│   │   ├── DailyForecast.tsx
│   │   ├── WeatherCard.tsx
│   │   └── FavoriteCities.tsx
│   ├── context/
│   │   └── WeatherContext.tsx
│   ├── hooks/
│   │   └── useWeather.ts
│   ├── types/
│   │   └── index.ts
│   ├── utils/
│   │   └── formatters.ts
│   ├── App.tsx
│   └── main.tsx
├── package.json
└── README.md
```

## 类型定义

```typescript
interface CurrentWeather {
  temp: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  condition: string;
  icon: string;
  uvIndex: number;
  visibility: number;
  pressure: number;
}

interface HourlyForecast {
  time: string;
  temp: number;
  icon: string;
  condition: string;
}

interface DailyForecast {
  date: string;
  high: number;
  low: number;
  condition: string;
  icon: string;
  precipitation: number;
}

interface CityWeather {
  name: string;
  country: string;
  current: CurrentWeather;
  hourly: HourlyForecast[];
  daily: DailyForecast[];
  lastUpdated: string;
}
```

## 运行项目

```bash
npm install
npm run dev
```

## 核心代码

### weather.ts（API）

```typescript
import axios from 'axios';

const API_KEY = 'your-api-key'; // WeatherAPI / OpenWeatherMap
const BASE_URL = 'https://api.weatherapi.com/v1';

const api = axios.create({
  baseURL: BASE_URL,
  params: { key: API_KEY },
});

export async function getCurrentWeather(city: string) {
  const response = await api.get('/forecast.json', {
    params: { q: city, days: 7, aqi: 'no' },
  });
  return response.data;
}

export async function searchCities(query: string) {
  const response = await api.get('/search.json', {
    params: { q: query },
  });
  return response.data;
}
```

### useWeather.ts

```tsx
import { useState, useEffect, useCallback } from 'react';
import { getCurrentWeather, searchCities } from '../api/weather';
import { CityWeather } from '../types';

export function useWeather() {
  const [weather, setWeather] = useState<CityWeather | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('favoriteCities');
    if (saved) setFavorites(JSON.parse(saved));
  }, []);

  const fetchWeather = useCallback(async (city: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCurrentWeather(city);
      setWeather({
        name: data.location.name,
        country: data.location.country,
        current: {
          temp: data.current.temp_c,
          feelsLike: data.current.feelslike_c,
          humidity: data.current.humidity,
          windSpeed: data.current.wind_kph,
          condition: data.current.condition.text,
          icon: data.current.condition.icon,
          uvIndex: data.current.uv,
          visibility: data.current.vis_km,
          pressure: data.current.pressure_mb,
        },
        hourly: data.forecast.forecastday[0].hour.map((h: any) => ({
          time: h.time,
          temp: h.temp_c,
          icon: h.condition.icon,
          condition: h.condition.text,
        })),
        daily: data.forecast.forecastday.map((d: any) => ({
          date: d.date,
          high: d.day.maxtemp_c,
          low: d.day.mintemp_c,
          condition: d.day.condition.text,
          icon: d.day.condition.icon,
          precipitation: d.day.daily_chance_of_rain,
        })),
        lastUpdated: data.current.last_updated,
      });
    } catch (err) {
      setError('无法获取天气数据，请检查城市名称或网络连接');
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleFavorite = useCallback((cityName: string) => {
    setFavorites(prev => {
      const newFavorites = prev.includes(cityName)
        ? prev.filter(c => c !== cityName)
        : [...prev, cityName];
      localStorage.setItem('favoriteCities', JSON.stringify(newFavorites));
      return newFavorites;
    });
  }, []);

  return { weather, loading, error, favorites, fetchWeather, toggleFavorite };
}
```

### CurrentWeather.tsx

```tsx
function CurrentWeather({ data, unit, onToggleFavorite, isFavorite }: {
  data: CityWeather;
  unit: 'C' | 'F';
  onToggleFavorite: () => void;
  isFavorite: boolean;
}) {
  return (
    <div className="current-weather">
      <div className="weather-header">
        <div>
          <h2>{data.name}, {data.country}</h2>
          <p>{data.current.condition}</p>
        </div>
        <button
          className={`favorite-btn ${isFavorite ? 'active' : ''}`}
          onClick={onToggleFavorite}
        >
          {isFavorite ? '★' : '☆'}
        </button>
      </div>

      <div className="temp-display">
        <img src={data.current.icon} alt={data.current.condition} />
        <span className="temp">
          {unit === 'C' ? Math.round(data.current.temp) : Math.round(data.current.temp * 9 / 5 + 32)}
          °{unit}
        </span>
      </div>

      <div className="weather-details">
        <div className="detail-item">
          <span>体感</span>
          <span>{unit === 'C' ? data.current.feelsLike : Math.round(data.current.feelsLike * 9 / 5 + 32)}°</span>
        </div>
        <div className="detail-item">
          <span>湿度</span>
          <span>{data.current.humidity}%</span>
        </div>
        <div className="detail-item">
          <span>风速</span>
          <span>{data.current.windSpeed} km/h</span>
        </div>
        <div className="detail-item">
          <span>紫外线</span>
          <span>{data.current.uv}</span>
        </div>
      </div>
    </div>
  );
}
```
