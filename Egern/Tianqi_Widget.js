/**
 * 今日天气 - Egern 小组件
 *
 * 参考：
 * - Surge 面板脚本：JS/tianqi.js
 * - Egern 小组件示例：Weather_Widget.JS
 *
 * 环境变量：
 * - CITY_ID：城市代码，默认 101020100（上海）
 * - REFRESH_MINUTES：建议刷新间隔（分钟），默认 30
 */

const DEFAULT_CITY_ID = '101020100';
const DEFAULT_REFRESH_MINUTES = 30;

export default async function(ctx) {
  const env = ctx.env || {};
  const widgetFamily = ctx.widgetFamily || 'systemMedium';
  const cityId = String(env.CITY_ID || env.cityId || DEFAULT_CITY_ID).trim() || DEFAULT_CITY_ID;
  const refreshMinutes = parsePositiveInt(
    env.REFRESH_MINUTES || env.refreshMinutes,
    DEFAULT_REFRESH_MINUTES,
    5,
    720,
  );

  try {
    const weather = await fetchWeather(ctx, cityId);
    const refreshAfter = nextRefreshISO(refreshMinutes);

    if (isAccessoryFamily(widgetFamily)) {
      return renderAccessory(weather, widgetFamily, refreshAfter);
    }

    if (widgetFamily === 'systemSmall') {
      return renderSmall(weather, refreshAfter);
    }

    if (widgetFamily === 'systemLarge' || widgetFamily === 'systemExtraLarge') {
      return renderLarge(weather, refreshAfter);
    }

    return renderMedium(weather, refreshAfter);
  } catch (error) {
    console.error(error);
    return renderError(`天气加载失败\n${String(error.message || error).slice(0, 60)}`);
  }
}

async function fetchWeather(ctx, cityId) {
  const url = `http://t.weather.sojson.com/api/weather/city/${encodeURIComponent(cityId)}`;
  const resp = await ctx.http.get(url, { timeout: 8_000 });
  const data = await resp.json();

  if (Number(data?.status) !== 200) {
    throw new Error(`接口返回 ${data?.status ?? '未知状态'}`);
  }

  const cityInfo = data.cityInfo || {};
  const payload = data.data || {};
  const forecast = Array.isArray(payload.forecast) ? payload.forecast : [];
  const today = forecast[0];

  if (!today) {
    throw new Error('未获取到天气数据');
  }

  return {
    cityId,
    city: cityInfo.city || cityId,
    parent: cityInfo.parent || '',
    updateTime: cityInfo.updateTime || '',
    currentTemp: payload.wendu || '--',
    humidity: payload.shidu || '--',
    quality: payload.quality || '--',
    pm25: stringifyValue(payload.pm25),
    pm10: stringifyValue(payload.pm10),
    tips: today.notice || payload.ganmao || '--',
    today: normalizeForecast(today),
    forecast: forecast.slice(0, 3).map(normalizeForecast),
  };
}

function normalizeForecast(item = {}) {
  return {
    date: item.ymd || '',
    week: item.week || '',
    sunrise: item.sunrise || '--',
    sunset: item.sunset || '--',
    weather: item.type || '--',
    windDir: item.fx || '--',
    windLevel: item.fl || '--',
    low: extractTemperature(item.low),
    high: extractTemperature(item.high),
    lowText: item.low || '--',
    highText: item.high || '--',
  };
}

function renderSmall(weather, refreshAfter) {
  const theme = getTheme(weather.today.weather);

  return {
    type: 'widget',
    url: weatherURL(weather.cityId),
    refreshAfter,
    padding: [4, 14, 10, 14],
    gap: 2,
    backgroundGradient: theme.backgroundGradient,
    children: [
      createTopInsetSection({
        type: 'stack',
        direction: 'row',
        alignItems: 'start',
        gap: 6,
        children: [
          {
            type: 'stack',
            flex: 1,
            children: [
              {
                type: 'text',
                text: weather.city,
                font: { size: 'subheadline', weight: 'bold' },
                textColor: '#FFFFFF',
                maxLines: 1,
                minScale: 0.7,
              },
            ],
          },
          { type: 'spacer' },
          {
            type: 'text',
            text: weather.updateTime || '实时',
            font: { size: 'caption2', weight: 'medium' },
            textColor: '#FFFFFFCC',
            maxLines: 1,
          },
        ],
      }, 3, 21),
      {
        type: 'stack',
        direction: 'row',
        alignItems: 'start',
        gap: 10,
        children: [
          {
            type: 'image',
            src: `sf-symbol:${theme.icon}`,
            width: 30,
            height: 30,
            color: theme.iconColor,
          },
          {
            type: 'stack',
            direction: 'column',
            gap: 1,
            flex: 1,
            children: [
              {
                type: 'text',
                text: `${weather.currentTemp}°`,
                font: { size: 27, weight: 'bold' },
                textColor: '#FFFFFF',
              },
              {
                type: 'text',
                text: weather.today.weather,
                font: { size: 'footnote', weight: 'medium' },
                textColor: '#FFFFFFE6',
                maxLines: 1,
                minScale: 0.7,
              },
            ],
          },
        ],
      },
      {
        type: 'stack',
        direction: 'column',
        gap: 4,
        children: [
          createMiniInfo('thermometer.medium', `${weather.today.low}° ~ ${weather.today.high}°`),
          createMiniInfo('humidity.fill', weather.humidity),
          createMiniInfo('wind', `${weather.today.windDir} ${weather.today.windLevel}`),
        ],
      },
    ],
  };
}

function renderMedium(weather, refreshAfter) {
  const theme = getTheme(weather.today.weather);

  return {
    type: 'widget',
    url: weatherURL(weather.cityId),
    refreshAfter,
    padding: [4, 14, 10, 14],
    gap: 2,
    backgroundGradient: theme.backgroundGradient,
    children: [
      createTopInsetSection({
        type: 'stack',
        direction: 'row',
        alignItems: 'start',
        gap: 6,
        children: [
          {
            type: 'text',
            text: weather.city,
            flex: 1,
            font: { size: 'headline', weight: 'bold' },
            textColor: '#FFFFFF',
            maxLines: 1,
            minScale: 0.7,
          },
          { type: 'spacer' },
          {
            type: 'text',
            text: weather.updateTime ? `更新 ${weather.updateTime}` : '实时天气',
            font: { size: 'caption2', weight: 'medium' },
            textColor: '#FFFFFFCC',
            maxLines: 1,
            minScale: 0.8,
          },
        ],
      }, 4, 26),
      {
        type: 'stack',
        direction: 'row',
        alignItems: 'start',
        gap: 10,
        children: [
          {
            type: 'image',
            src: `sf-symbol:${theme.icon}`,
            width: 46,
            height: 46,
            color: theme.iconColor,
          },
          {
            type: 'stack',
            direction: 'column',
            gap: 1,
            flex: 1,
            children: [
              {
                type: 'text',
                text: `${weather.currentTemp}°C`,
                font: { size: 29, weight: 'bold' },
                textColor: '#FFFFFF',
              },
              {
                type: 'text',
                text: weather.today.weather,
                font: { size: 'footnote', weight: 'medium' },
                textColor: '#FFFFFFE6',
                maxLines: 1,
                minScale: 0.7,
              },
              {
                type: 'text',
                text: `${weather.today.low}° / ${weather.today.high}°`,
                font: { size: 'caption1', weight: 'medium' },
                textColor: '#FFFFFFCC',
                maxLines: 1,
              },
            ],
          },
          {
            type: 'stack',
            direction: 'column',
            alignItems: 'end',
            gap: 1,
            children: [
              createBadge('空气', weather.quality, getQualityColor(weather.quality)),
              createBadge('PM2.5', weather.pm25, '#FFFFFFCC'),
            ],
          },
        ],
      },
      {
        type: 'stack',
        direction: 'row',
        gap: 8,
        children: [
          createInfoCard('humidity.fill', '湿度', weather.humidity, '#5AC8FA'),
          createInfoCard('wind', '风向', weather.today.windDir, '#C084FC'),
          createInfoCard('gauge.medium', '风力', weather.today.windLevel, '#F59E0B'),
        ],
      },
    ],
  };
}

function renderLarge(weather, refreshAfter) {
  const theme = getTheme(weather.today.weather);
  const forecastItems = weather.forecast.slice(0, 3);

  return {
    type: 'widget',
    url: weatherURL(weather.cityId),
    refreshAfter,
    padding: [4, 18, 12, 18],
    gap: 3,
    backgroundGradient: theme.backgroundGradient,
    children: [
      createTopInsetSection({
        type: 'stack',
        direction: 'row',
        alignItems: 'start',
        children: [
          {
            type: 'text',
            text: weather.city,
            font: { size: 'title3', weight: 'bold' },
            textColor: '#FFFFFF',
            maxLines: 1,
            minScale: 0.7,
          },
          { type: 'spacer' },
          {
            type: 'text',
            text: weather.updateTime ? `更新 ${weather.updateTime}` : '实时天气',
            font: { size: 'caption2', weight: 'medium' },
            textColor: '#FFFFFFCC',
            maxLines: 1,
            minScale: 0.8,
          },
        ],
      }, 4, 28),
      {
        type: 'stack',
        direction: 'row',
        alignItems: 'start',
        gap: 12,
        children: [
          {
            type: 'image',
            src: `sf-symbol:${theme.icon}`,
            width: 54,
            height: 54,
            color: theme.iconColor,
          },
          {
            type: 'stack',
            direction: 'column',
            gap: 1,
            flex: 1,
            children: [
              {
                type: 'text',
                text: `${weather.currentTemp}°C`,
                font: { size: 31, weight: 'bold' },
                textColor: '#FFFFFF',
              },
              {
                type: 'text',
                text: `${weather.today.weather} · ${weather.today.low}° / ${weather.today.high}°`,
                font: { size: 'footnote', weight: 'medium' },
                textColor: '#FFFFFFE6',
                maxLines: 1,
                minScale: 0.7,
              },
              {
                type: 'text',
                text: `空气 ${weather.quality} · 湿度 ${weather.humidity}`,
                font: { size: 'caption1', weight: 'medium' },
                textColor: '#FFFFFFCC',
                maxLines: 1,
                minScale: 0.7,
              },
            ],
          },
        ],
      },
      {
        type: 'stack',
        direction: 'row',
        gap: 8,
        children: [
          createInfoCard('sunrise.fill', '日出', weather.today.sunrise, '#FDBA74'),
          createInfoCard('sunset.fill', '日落', weather.today.sunset, '#FB7185'),
          createInfoCard('aqi.medium', 'PM2.5', weather.pm25, '#5EEAD4'),
          createInfoCard('aqi.low', 'PM10', weather.pm10, '#93C5FD'),
        ],
      },
      {
        type: 'stack',
        direction: 'column',
        gap: 8,
        padding: 10,
        backgroundColor: '#FFFFFF10',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#FFFFFF22',
        shadowColor: '#00000030',
        shadowRadius: 8,
        shadowOffset: { x: 0, y: 2 },
        children: [
          {
            type: 'text',
            text: '未来天气',
            font: { size: 'footnote', weight: 'semibold' },
            textColor: '#FFFFFFCC',
          },
          ...forecastItems.map((item) => ({
            type: 'stack',
            direction: 'row',
            alignItems: 'center',
            gap: 8,
            children: [
              {
                type: 'stack',
                width: 52,
                children: [
                  {
                    type: 'text',
                    text: item.week || '--',
                    font: { size: 'callout', weight: 'medium' },
                    textColor: '#FFFFFF',
                    maxLines: 1,
                    minScale: 0.7,
                  },
                ],
              },
              forecastIcon(item.weather),
              {
                type: 'text',
                text: item.weather,
                flex: 1,
                font: { size: 'callout' },
                textColor: '#FFFFFFE6',
                maxLines: 1,
                minScale: 0.7,
              },
              {
                type: 'text',
                text: `${item.low}° / ${item.high}°`,
                font: { size: 'callout', weight: 'medium' },
                textColor: '#FFFFFFCC',
                maxLines: 1,
              },
            ],
          })),
        ],
      },
      {
        type: 'text',
        text: `提示：${weather.tips}`,
        font: { size: 'footnote' },
        textColor: '#FFFFFFCC',
        maxLines: 2,
        minScale: 0.75,
      },
    ],
  };
}

function renderAccessory(weather, family, refreshAfter) {
  const theme = getTheme(weather.today.weather);
  const base = {
    type: 'widget',
    url: weatherURL(weather.cityId),
    refreshAfter,
  };

  if (family === 'accessoryInline') {
    return {
      ...base,
      children: [
        {
          type: 'text',
          text: `${weather.city} ${weather.currentTemp}° · ${weather.today.weather}`,
          font: { size: 'caption1', weight: 'medium' },
          maxLines: 1,
          minScale: 0.6,
        },
      ],
    };
  }

  if (family === 'accessoryCircular') {
    return {
      ...base,
      padding: 6,
      gap: 2,
      children: [
        {
          type: 'image',
          src: `sf-symbol:${theme.icon}`,
          width: 24,
          height: 24,
          color: theme.iconColor,
        },
        {
          type: 'text',
          text: `${weather.currentTemp}°`,
          font: { size: 'headline', weight: 'bold' },
          textAlign: 'center',
        },
      ],
    };
  }

  return {
    ...base,
    padding: 10,
    gap: 4,
    children: [
      {
        type: 'stack',
        direction: 'row',
        alignItems: 'center',
        gap: 6,
        children: [
          {
            type: 'image',
            src: `sf-symbol:${theme.icon}`,
            width: 18,
            height: 18,
            color: theme.iconColor,
          },
          {
            type: 'text',
            text: weather.city,
            font: { size: 'headline', weight: 'semibold' },
            maxLines: 1,
            minScale: 0.7,
          },
          { type: 'spacer' },
          {
            type: 'text',
            text: `${weather.currentTemp}°`,
            font: { size: 'headline', weight: 'bold' },
          },
        ],
      },
      {
        type: 'text',
        text: `${weather.today.weather} · ${weather.today.low}°/${weather.today.high}° · ${weather.quality}`,
        font: { size: 'caption1', weight: 'medium' },
        maxLines: 1,
        minScale: 0.6,
      },
    ],
  };
}

function renderError(message) {
  return {
    type: 'widget',
    padding: 16,
    backgroundColor: { light: '#FFFFFF', dark: '#1C1C1E' },
    children: [
      {
        type: 'text',
        text: '今日天气',
        font: { size: 'headline', weight: 'bold' },
      },
      {
        type: 'text',
        text: message,
        font: { size: 'footnote' },
        textColor: { light: '#FF3B30', dark: '#FF453A' },
        maxLines: 3,
        minScale: 0.7,
      },
    ],
  };
}

function createMiniInfo(icon, value) {
  return {
    type: 'stack',
    direction: 'row',
    alignItems: 'center',
    gap: 6,
    children: [
      {
        type: 'image',
        src: `sf-symbol:${icon}`,
        width: 12,
        height: 12,
        color: '#FFFFFFCC',
      },
      {
        type: 'text',
        text: value,
        font: { size: 'caption1', weight: 'medium' },
        textColor: '#FFFFFFE6',
        maxLines: 1,
        minScale: 0.7,
      },
    ],
  };
}

function createInfoCard(icon, label, value, iconColor) {
  return {
    type: 'stack',
    direction: 'column',
    gap: 3,
    flex: 1,
    padding: [7, 8],
    backgroundColor: '#FFFFFF12',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FFFFFF2E',
    shadowColor: '#00000033',
    shadowRadius: 8,
    shadowOffset: { x: 0, y: 2 },
    children: [
      {
        type: 'stack',
        direction: 'row',
        alignItems: 'center',
        gap: 5,
        children: [
          {
            type: 'image',
            src: `sf-symbol:${icon}`,
            width: 12,
            height: 12,
            color: iconColor,
          },
          {
            type: 'text',
            text: label,
            font: { size: 'caption2', weight: 'medium' },
            textColor: '#FFFFFFB3',
            maxLines: 1,
            minScale: 0.7,
          },
        ],
      },
      {
        type: 'text',
        text: value,
        font: { size: 'footnote', weight: 'semibold' },
        textColor: '#FFFFFF',
        maxLines: 1,
        minScale: 0.65,
      },
    ],
  };
}

function createBadge(label, value, color) {
  return {
    type: 'stack',
    direction: 'column',
    alignItems: 'end',
    gap: 0,
    children: [
      {
        type: 'text',
        text: label,
        font: { size: 'caption2', weight: 'medium' },
        textColor: '#FFFFFF99',
        maxLines: 1,
      },
      {
        type: 'text',
        text: value,
        font: { size: 'subheadline', weight: 'bold' },
        textColor: color,
        maxLines: 1,
        minScale: 0.7,
      },
    ],
  };
}

function createTopInsetSection(content, topInset, height) {
  return {
    type: 'stack',
    direction: 'column',
    height,
    children: [
      { type: 'spacer', length: topInset },
      content,
    ],
  };
}

function forecastIcon(weatherText) {
  const theme = getTheme(weatherText);
  return {
    type: 'image',
    src: `sf-symbol:${theme.icon}`,
    width: 18,
    height: 18,
    color: theme.iconColor,
  };
}

function getTheme(weatherText = '') {
  const text = String(weatherText);

  if (/(雷|暴雨)/.test(text)) {
    return {
      icon: 'cloud.bolt.rain.fill',
      iconColor: '#FDE68A',
      backgroundGradient: verticalGradient(['#2F2469', '#7E6DE6', '#46389E', '#150E2E'], [0, 0.32, 0.6, 1]),
    };
  }

  if (/(雪|冰雹)/.test(text)) {
    return {
      icon: 'cloud.snow.fill',
      iconColor: '#E0F2FE',
      backgroundGradient: verticalGradient(['#6E8CA6', '#E8F4FC', '#BFD4E4', '#4B5E72'], [0, 0.32, 0.6, 1]),
    };
  }

  if (/(雨|阵雨|雷阵雨)/.test(text)) {
    return {
      icon: 'cloud.rain.fill',
      iconColor: '#BCDCFF',
      backgroundGradient: verticalGradient(['#2E5CB8', '#A8CBFA', '#5B8FE6', '#1E3C8A'], [0, 0.32, 0.6, 1]),
    };
  }

  if (/(雾|霾|扬沙|浮尘|沙尘)/.test(text)) {
    return {
      icon: 'sun.haze.fill',
      iconColor: '#FDE68A',
      backgroundGradient: verticalGradient(['#6A6D67', '#E0E1DC', '#AEB0AA', '#393B38'], [0, 0.32, 0.6, 1]),
    };
  }

  if (/(阴|多云)/.test(text)) {
    return {
      icon: /晴/.test(text) ? 'cloud.sun.fill' : 'cloud.fill',
      iconColor: '#E2E8F0',
      backgroundGradient: verticalGradient(['#41566A', '#B0C3D5', '#7E96AA', '#303E4C'], [0, 0.32, 0.6, 1]),
    };
  }

  return {
    icon: 'sun.max.fill',
    iconColor: '#FDE68A',
    backgroundGradient: verticalGradient(['#A84E20', '#FFD489', '#F6A94F', '#9E3F1E'], [0, 0.32, 0.6, 1]),
  };
}

function getQualityColor(quality = '') {
  const text = String(quality);
  if (/优/.test(text)) return '#4ADE80';
  if (/良/.test(text)) return '#FACC15';
  if (/轻度/.test(text)) return '#FB923C';
  if (/中度/.test(text)) return '#F97316';
  if (/重度|严重/.test(text)) return '#F43F5E';
  return '#FFFFFFCC';
}

function verticalGradient(colors, stops) {
  return {
    type: 'linear',
    colors,
    stops,
    startPoint: { x: 0.5, y: 0 },
    endPoint: { x: 0.5, y: 1 },
  };
}

function weatherURL(cityId) {
  return `https://www.weather.com.cn/weather1d/${cityId}.shtml`;
}

function nextRefreshISO(minutes) {
  return new Date(Date.now() + minutes * 60 * 1000).toISOString();
}

function extractTemperature(input) {
  const match = String(input || '').match(/-?\d+/);
  return match ? match[0] : '--';
}

function parsePositiveInt(value, fallback, min, max) {
  const num = Number.parseInt(String(value ?? ''), 10);
  if (Number.isNaN(num)) return fallback;
  return Math.min(max, Math.max(min, num));
}

function stringifyValue(value) {
  return value === undefined || value === null || value === '' ? '--' : String(value);
}

function isAccessoryFamily(family) {
  return String(family).startsWith('accessory');
}
