var params = {};
if (typeof $argument !== 'undefined' && $argument) {
  params = getParams($argument);
}
var cityId = params.cityId || "101020100";
var mode = params.mode || "panel";
var apiUrl = "http://t.weather.sojson.com/api/weather/city/" + cityId;

$httpClient.get(apiUrl, function(error, response, data) {
  if (error) {
    if (mode === "notify") {
      $notification.post("天气通知", "请求失败", String(error));
    } else {
      $done({
        title: "天气面板",
        content: "请求失败：" + String(error),
        icon: "cloud.fill",
        "icon-color": "#ff9500"
      });
    }
    $done();
    return;
  }

  try {
    var weatherData = JSON.parse(data);
    var cityInfo = weatherData.cityInfo;
    var currentWeather = weatherData.data.forecast[0];
    
    if (mode === "notify") {
      // 通知模式 - 简化内容
      var title = cityInfo.city + " - 天气";
      var subtitle = currentWeather.low + "°/" + currentWeather.high + "° " + currentWeather.type;
      var body = "湿度" + weatherData.data.shidu + " | 风力" + currentWeather.fl + " | " + weatherData.data.quality;
      
      $notification.post(title, subtitle, body, {"open-url": "weather://"});
    } else {
      // Panel 模式 - 详细内容
      var message = "📍城市：" + cityInfo.city + "\n"
        + "🕰更新：" + cityInfo.updateTime + "\n"
        + "🌤天气：" + currentWeather.type + "\n"
        + "🌡温度：" + currentWeather.low + "° ~ " + currentWeather.high + "°\n"
        + "💧湿度：" + weatherData.data.shidu + "\n"
        + "💨空气质量：" + weatherData.data.quality + "\n"
        + "☁️PM2.5：" + weatherData.data.pm25 + "\n"
        + "☁️PM10：" + weatherData.data.pm10 + "\n"
        + "🪁风向：" + currentWeather.fx + "\n"
        + "🌪风力：" + currentWeather.fl + "\n"
        + "🌅日出：" + currentWeather.sunrise + "\n"
        + "🌇日落：" + currentWeather.sunset + "\n"
        + "🏷提示：" + currentWeather.notice;

      $done({
        title: "今日天气",
        content: message,
        icon: "sun.max.fill",
        "icon-color": "#ffc400"
      });
    }
  } catch (e) {
    if (mode === "notify") {
      $notification.post("天气通知", "解析失败", String(e));
    } else {
      $done({
        title: "天气面板",
        content: "解析失败：" + String(e),
        icon: "cloud.fill",
        "icon-color": "#ff9500"
      });
    }
  }
  
  $done();
});

function getParams(param) {
  var result = {};
  var pairs = param.split("&");
  for (var i = 0; i < pairs.length; i++) {
    var pair = pairs[i].split("=");
    result[pair[0]] = decodeURIComponent(pair[1]);
  }
  return result;
}
