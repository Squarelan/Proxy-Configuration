// Surge 自动切换出站模式脚本
// [Script]
// 自动切换出站模式 = type=event,event-name=network-changed,script-path=https://raw.githubusercontent.com/Squarelan/Proxy-Configuration/main/Tasks/Surge/Auto-switch-config.js

const CURRENT_WIFI_SSID_KEY = 'current_wifi_ssid';

// 读取 BoxJS 配置，失败则使用默认值
let wifiDirectList = ['钵钵鸡-5G'];
try {
  const wifiListStr = $persistentStore.read('wifi_direct_list');
  if (wifiListStr) {
    wifiDirectList = wifiListStr.split('\n').map(s => s.trim()).filter(s => s);
  }
} catch (e) {
  // 使用默认值
}

// 读取启用开关
let enableSwitch = true;
try {
  const val = $persistentStore.read('enable_switch');
  if (val === 'false' || val === false) {
    enableSwitch = false;
  }
} catch (e) {
  // 使用默认值
}

if (!enableSwitch) {
  $done();
  return;
}

if (wifiChanged()) {
  const mode = wifiDirectList.includes($network.wifi.ssid)
    ? 'direct'
    : 'rule';
  
  $surge.setOutboundMode(mode);
  $notification.post(
    'Surge 出站切换',
    `网络已切换到 ${$network.wifi.ssid || '移动网络'}`,
    `已切换为 ${mode === 'direct' ? '直连' : '规则'} 模式`
  );
}

function wifiChanged() {
  const currentWifiSSid = $persistentStore.read(CURRENT_WIFI_SSID_KEY);
  const changed = currentWifiSSid !== $network.wifi.ssid;
  if (changed) {
    $persistentStore.write($network.wifi.ssid, CURRENT_WIFI_SSID_KEY);
  }
  return changed;
}

$done();
