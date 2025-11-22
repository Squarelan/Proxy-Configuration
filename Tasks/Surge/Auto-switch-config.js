// Surge 自动切换出站模式脚本
// [Script]
// 自动切换出站模式 = type=event,event-name=network-changed,script-path=https://raw.githubusercontent.com/Squarelan/Proxy-Configuration/main/Tasks/Surge/Auto-switch-config.js

const CURRENT_WIFI_SSID_KEY = 'current_wifi_ssid';

// 读取 WiFi 直连列表（来自 BoxJS 或默认值）
let WIFI_DONT_NEED_PROXYS = ['钵钵鸡-5G'];
const wifiListStr = $persistentStore.read('wifi_direct_list');
if (wifiListStr) {
  WIFI_DONT_NEED_PROXYS = wifiListStr.split('\n').map(s => s.trim()).filter(s => s);
}

// 读取是否显示通知
let showNotification = true;
try {
  const val = $persistentStore.read('show_notification');
  if (val === 'false' || val === false) {
    showNotification = false;
  }
} catch (e) {
  showNotification = true;
}

if (wifiChanged()) {
  const mode = WIFI_DONT_NEED_PROXYS.includes($network.wifi.ssid)
    ? 'direct'
    : 'rule';
  $surge.setOutboundMode(mode);
  
  // 只在启用通知时才显示
  if (showNotification) {
    $notification.post(
      'Surge 出站切换',
      `网络已切换到 ${$network.wifi.ssid || '移动网络'}`,
      `已切换为 ${mode === 'direct' ? '直连' : '规则'} 模式`
    );
  }
}

function wifiChanged() {
  const currentWifiSSid = $persistentStore.read(CURRENT_WIFI_SSID_KEY);
  const changed = currentWifiSSid !== $network.wifi.ssid;
  changed && $persistentStore.write($network.wifi.ssid, CURRENT_WIFI_SSID_KEY);
  return changed;
}

$done();
