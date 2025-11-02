// Surge 订阅流量查询脚本
const args = {};
if ($argument) {
  $argument.split("&").forEach(p => {
    const index = p.indexOf("=");
    if (index > 0) {
      const key = p.substring(0, index);
      const value = p.substring(index + 1);
      args[key] = decodeURIComponent(value);
    }
  });
}

function getResetInfo(resetDay) {
  if (!resetDay) return ""; 
  const today = new Date();
  const nowDay = today.getDate();
  const nowMonth = today.getMonth();
  const nowYear = today.getFullYear();
  let resetDate;
  if (nowDay < resetDay) {
    resetDate = new Date(nowYear, nowMonth, resetDay);
  } else {
    resetDate = new Date(nowYear, nowMonth + 1, resetDay);
  }
  const diff = Math.ceil((resetDate - today) / (1000 * 60 * 60 * 24));
  return `重置：${diff}天`;
}

function fetchInfo(url, resetDay) {
  return new Promise(resolve => {
    const options = {
      url: url,
      headers: {
        "User-Agent": "Surge/5.0.0"
      }
    };
    
    $httpClient.get(options, (error, response, data) => {
      if (error || !response || response.status !== 200) {
        resolve(`订阅请求失败，状态码：${response ? response.status : "请求错误"}`);
        return;
      }
      
      const info = {};
      const headers = response.headers || {};
      const headerKey = Object.keys(headers).find(k => k.toLowerCase() === "subscription-userinfo");
      
      if (headerKey && headers[headerKey]) {
        headers[headerKey].split(";").forEach(p => {
          const [k, v] = p.trim().split("=");
          if (k && v) info[k] = parseInt(v);
        });
      }
      
      const used = (info.upload || 0) + (info.download || 0);
      const total = info.total || 0;
      const percent = total > 0 ? Math.round((used / total) * 100) : 0;
      
      const lines = [
        `已用：${percent}%`,
        `流量：${(used / 1024 / 1024 / 1024).toFixed(2)} GB / ${(total / 1024 / 1024 / 1024).toFixed(2)} GB`
      ];
      
      if (info.expire) {
        const d = new Date(info.expire * 1000);
        lines.push(`到期：${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`);
      }
      
      if (resetDay) {
        const resetInfo = getResetInfo(resetDay);
        if (resetInfo) lines.push(resetInfo);
      }
      
      resolve(lines.join("\n"));
    });
  });
}

(async () => {
  const url = args.url;
  const title = args.title || "订阅流量";
  const resetDay = args.reset_day ? parseInt(args.reset_day) : null;
  const icon = args.icon || "antenna.radiowaves.left.and.right.circle.fill";
  const color = args.color || "#00E28F";
  
  if (!url) {
    $done({
      title: title,
      content: "未配置订阅链接",
      icon: icon,
      "icon-color": color
    });
    return;
  }
  
  const content = await fetchInfo(url, resetDay);
  
  $done({
    title: title,
    content: content,
    icon: icon,
    "icon-color": color
  });
})();
