const args = {};
$argument.split("&").forEach(p => {
  const index = p.indexOf("=");
  const key = p.substring(0, index);
  const value = p.substring(index + 1);
  args[key] = decodeURIComponent(value);
});

function getResetInfo(resetDay) {
  if (!resetDay || resetDay === '') return "";
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
    $httpClient.get({ url, headers: { "User-Agent": "Quantumult%20X/1.5.2" } }, (err, resp) => {
      if (err || !resp || resp.status !== 200) {
        resolve(null);
        return;
      }

      const data = {};
      const headerKey = Object.keys(resp.headers).find(k => k.toLowerCase() === "subscription-userinfo");
      if (headerKey && resp.headers[headerKey]) {
        resp.headers[headerKey].split(";").forEach(p => {
          const [k, v] = p.trim().split("=");
          if (k && v) data[k] = parseInt(v);
        });
      }

      const used = (data.upload || 0) + (data.download || 0);
      const total = data.total || 0;
      const percent = total > 0 ? Math.round((used / total) * 100) : 0;

      const lines = [
        `已用：${percent}%`,
        `流量：${(used / 1024 / 1024 / 1024).toFixed(2)} GB｜${(total / 1024 / 1024 / 1024).toFixed(2)} GB`
      ];

      if (data.expire) {
        const d = new Date(data.expire * 1000);
        lines.push(`到期：${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}号`);
      }

      if (resetDay) {
        lines.push(getResetInfo(resetDay));
      }

      resolve(lines.join("\n"));
    });
  });
}

(async () => {
  const url = args.url;
  const title = args.title || "订阅流量";
  const resetDay = args.resetDay;
  const icon = args.icon || "antenna.radiowaves.left.and.right.circle.fill";
  const iconColor = args.iconColor || "#00E28F";

  // 检查是否填写了订阅地址
  if (!url || url.trim() === '') {
    $done({
      title: "未配置",
      content: "请在模块参数中填写订阅地址",
      icon: "questionmark.circle",
      "icon-color": "#999999"
    });
    return;
  }

  // 获取订阅信息
  const content = await fetchInfo(url, resetDay ? parseInt(resetDay) : null);

  if (!content) {
    $done({
      title: title,
      content: "订阅请求失败\n请检查订阅地址是否正确",
      icon: "exclamationmark.triangle.fill",
      "icon-color": "#FF9500"
    });
    return;
  }

  $done({
    title: title,
    content: content,
    icon: icon,
    "icon-color": iconColor
  });
})();
