var params = {};
if (typeof $argument !== 'undefined' && $argument) {
  params = getParams($argument);
}
var cityId = params.cityId || "101190401";
var mode = params.mode || "panel";
var apiUrl = "http://t.weather.sojson.com/api/weather/city/" + cityId;

$httpClient.get(apiUrl, function(error, response, data) {
  if (error) {
    console.log(error);
    $done();
    return;
  }

  var weatherData = JSON.parse(data);
  if (weatherData.status !== 200) {
    console.log("请求失败，状态码：" + weatherData.status);
    $done();
    return;
  }

  var cityInfo = weatherData.cityInfo;
  var currentWeather = weatherData.data.forecast[0];
  
  if (mode === "notify") {
    // 通知模式
    var subtitle = currentWeather.low + "°/" + currentWeather.high + "° " + currentWeather.type;
    var body = "湿度" + weatherData.data.shidu + " | 风力" + currentWeather.fl + " | " + weatherData.data.quality;
    
    $notification.post(
      cityInfo.city + " - 天气",
      subtitle,
      body,
      {"open-url": "weather://"}
    );
  } else {
    // Panel 模式
    var message = "📍城市：" + cityInfo.city + "\n🕰︎更新时间：" + cityInfo.updateTime + " \n🌤︎天气：" + currentWeather.type + "\n🌡︎温度：" + currentWeather.low + "  " + currentWeather.high + "\n💧湿度：" + weatherData.data.shidu + "\n💨空气质量：" + weatherData.data.quality + "\n☁️PM2.5：" + weatherData.data.pm25 + "\n☁️PM10：" + weatherData.data.pm10 + "\n🪁风向：" + currentWeather.fx + "\n🌪️风力：" + currentWeather.fl + "\n🌅日出时间：" + currentWeather.sunrise + "\n🌇日落时间：" + currentWeather.sunset + "\n🏷︎Tips：" + currentWeather.notice;

    var body = {
      title: "今日天气",
      content: message,
      cityId: params.cityId,
      icon: params.icon || "sun.max.fill",
      "icon-color": params.color || "#ffc400"
    };
    $done(body);
  }
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
