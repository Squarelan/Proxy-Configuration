//Surge 自动切换出站模式脚本

//[Script]
//自动切换出站模式 = type=event,event-name=network-changed,script-path=https://raw.githubusercontent.com/Squarelan/Proxy-Configuration/main/Tasks/Surge/Auto-switch-config.js

const WIFI_DONT_NEED_PROXYS = ['钵钵鸡-5G'];
const CURRENT_WIFI_SSID_KEY = 'current_wifi_ssid';

if (wifiChanged()) {
  const mode = WIFI_DONT_NEED_PROXYS.includes($network.wifi.ssid)
    ? 'direct'
    : 'rule';
  $surge.setOutboundMode(mode);
  $notification.post(
    'Surge',
    `WiFi 已切换到 ${$network.wifi.ssid || '手机网络'}`,
    `已切换为 ${mode === 'direct' ? '直连' : '规则'} 模式`
  );
}

function wifiChanged() {
  const currentWifiSSid = $persistentStore.read(CURRENT_WIFI_SSID_KEY);
  const changed = currentWifiSSid !== $network.wifi.ssid;
  changed && $persistentStore.write($network.wifi.ssid, CURRENT_WIFI_SSID_KEY);
  return changed;
}

$done();
