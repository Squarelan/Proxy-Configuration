var params = {};
if (typeof $argument !== 'undefined' && $argument) {
  params = getParams($argument);
}
var cityId = params.cityId || "101020100";
var apiUrl = "http://t.weather.sojson.com/api/weather/city/" + cityId;

$httpClient.get(apiUrl, function(error, response, data) {
  if (error) {
    $notification.post("天气通知", "请求失败", String(error));
    $done();
    return;
  }

  try {
    var weatherData = JSON.parse(data);
    var cityInfo = weatherData.cityInfo;
    var currentWeather = weatherData.data.forecast[0];
    
    var title = cityInfo.city + " - 天气";
    var subtitle = currentWeather.low + "°/" + currentWeather.high + "° " + currentWeather.type;
    var body = "湿度" + weatherData.data.shidu + " | 风力" + currentWeather.fl + " | " + weatherData.data.quality;
    
    $notification.post(title, subtitle, body, {"open-url": "weather://"});
  } catch (e) {
    $notification.post("天气通知", "解析失败", String(e));
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
