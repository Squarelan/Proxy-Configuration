const args = {};
$argument.split("&").forEach(p => {
  const index = p.indexOf("=");
  const key = p.substring(0, index);
  const value = p.substring(index + 1);
  args[key] = decodeURIComponent(value);
});

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
    $httpClient.get({ url, headers: { "User-Agent": "Quantumult%20X/1.5.2" } }, (err, resp) => {
      if (err || !resp || resp.status !== 200) {
        resolve(`订阅请求失败，状态码：${resp ? resp.status : "请求错误"}`);
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
  for (let i = 1; i <= 5; i++) {
    const urlKey = `url${i}`;
    const titleKey = `title${i}`;
    const resetKey = `resetDay${i}`;
    const iconKey = `icon${i}`;
    const colorKey = `iconColor${i}`;

    const url = args[urlKey];
    const title = args[titleKey];
    const reset = args[resetKey];
    const icon = args[iconKey] || "antenna.radiowaves.left.and.right.circle.fill";
    const color = args[colorKey] || "#00E28F";

    if (url && title) {
      const content = await fetchInfo(url, reset ? parseInt(reset) : null);
      $done({
        title: title,
        content: content,
        icon: icon,
        "icon-color": color
      });
      return;
    }
  }

  $done({
    title: "订阅流量",
    content: "未填写有效订阅信息",
    icon: "xmark.circle",
    "icon-color": "#CCCCCC"
  });
})();
