// Surge 自动切换出站模式脚本
// [Script]
// 自动切换出站模式 = type=event,event-name=network-changed,script-path=https://raw.githubusercontent.com/Squarelan/Proxy-Configuration/main/Tasks/Surge/Auto-switch-config.js

const STORAGE_KEY = {
  CURRENT_WIFI_SSID: 'current_wifi_ssid',
  LAST_SWITCH_TIME: 'last_switch_time',
  SWITCH_COUNT: 'switch_count'
};

const DEFAULT_CONFIG = {
  wifiDirectList: ['钵钵鸡-5G'],
  enableSwitch: true,
  showNotification: true
};

function getConfig() {
  try {
    const wifiListStr = $persistentStore.read('wifi_direct_list');
    const enableSwitch = $persistentStore.read('enable_switch');
    const showNotification = $persistentStore.read('show_notification');
    
    return {
      wifiDirectList: wifiListStr 
        ? wifiListStr.split('\n').map(s => s.trim()).filter(s => s)
        : DEFAULT_CONFIG.wifiDirectList,
      enableSwitch: enableSwitch !== 'false' && enableSwitch !== false,
      showNotification: showNotification !== 'false' && showNotification !== false
    };
  } catch (e) {
    return DEFAULT_CONFIG;
  }
}

const config = getConfig();

$notification.post(
  'Surge 自动切换',
  '脚本已执行',
  `启用状态: ${config.enableSwitch}, WiFi: ${$network.wifi.ssid || '无'}`
);

if (!config.enableSwitch) {
  $done();
  return;
}

if (wifiChanged()) {
  const wifiSSID = $network.wifi.ssid || '移动网络';
  const isDirectWifi = config.wifiDirectList.includes($network.wifi.ssid);
  const mode = isDirectWifi ? 'direct' : 'rule';
  
  $notification.post(
    'Surge 出站切换',
    `即将切换到 ${mode} 模式`,
    `WiFi: ${wifiSSID}, 直连列表: ${config.wifiDirectList.join(', ')}`
  );
  
  try {
    // 尝试切换
    $surge.setOutboundMode(mode);
    
    $notification.post(
      'Surge 出站切换',
      '✅ 切换成功',
      `已切换为 ${mode === 'direct' ? '直连' : '规则'} 模式`
    );
    
    const now = new Date().toLocaleString();
    $persistentStore.write(now, STORAGE_KEY.LAST_SWITCH_TIME);
    const count = parseInt($persistentStore.read(STORAGE_KEY.SWITCH_COUNT) || '0') + 1;
    $persistentStore.write(count.toString(), STORAGE_KEY.SWITCH_COUNT);
  } catch (e) {
    $notification.post(
      'Surge 出站切换',
      '❌ 切换失败',
      `错误: ${e.message}`
    );
  }
}

function wifiChanged() {
  const currentWifiSSID = $persistentStore.read(STORAGE_KEY.CURRENT_WIFI_SSID);
  const changed = currentWifiSSID !== $network.wifi.ssid;
  if (changed) {
    $persistentStore.write($network.wifi.ssid, STORAGE_KEY.CURRENT_WIFI_SSID);
  }
  return changed;
}

$done();
