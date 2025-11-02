const RAW_ARG = $argument || "";

// 从原始 $argument 中按键名安全抽取值（允许值中包含 &）
function extractArg(raw, key, nextKeys) {
  const startTag = key + "=";
  const i = raw.indexOf(startTag);
  if (i === -1) return "";
  const start = i + startTag.length;
  let end = raw.length;
  for (const nk of nextKeys) {
    const j = raw.indexOf("&" + nk + "=", start);
    if (j !== -1) end = Math.min(end, j);
  }
  const slice = raw.slice(start, end);
  try { return decodeURIComponent(slice); } catch { return slice; }
}

// 松散解析其它参数（非 URL）
function parseLoose(raw) {
  const out = {};
  raw.split("&").filter(Boolean).forEach(kv => {
    const [k, ...rest] = kv.split("=");
    if (!k) return;
    const v = rest.join("=");
    try { out[k] = decodeURIComponent(v || ""); } catch { out[k] = v || ""; }
  });
  return out;
}

const args = parseLoose(RAW_ARG);

function getResetInfo(resetDay) {
  if (!resetDay) return ""; 
  const today = new Date();
  const nowDay = today.getDate();
  const nowMonth = today.getMonth();
  const nowYear = today.getFullYear();
  
  const resetDate = nowDay < resetDay 
    ? new Date(nowYear, nowMonth, resetDay)
    : new Date(nowYear, nowMonth + 1, resetDay);
  
  const diff = Math.ceil((resetDate - today) / (1000 * 60 * 60 * 24));
  return `重置：${diff}天`;
}

function humanGB(bytes) {
  return (bytes / 1024 / 1024 / 1024).toFixed(2) + " GB";
}

function getHeaderCaseInsensitive(headers, target) {
  if (!headers) return undefined;
  const keys = Object.keys(headers);
  const hit = keys.find(k => k.toLowerCase() === target.toLowerCase());
  return hit ? headers[hit] : undefined;
}

// 跟随重定向最多 3 次
function httpGetFollow(url, headers, maxRedirect = 3) {
  return new Promise(resolve => {
    const tryGet = (link, left) => {
      $httpClient.get({ url: link, headers }, (err, resp) => {
        if (err || !resp) return resolve({ err: true, msg: "请求错误" });
        const status = resp.status ?? resp.statusCode ?? 0;
        
        if ([301, 302, 303, 307, 308].includes(status) && left > 0) {
          const loc = getHeaderCaseInsensitive(resp.headers, "location");
          if (loc) return tryGet(loc, left - 1);
        }
        
        resolve({ resp, status });
      });
    };
    tryGet(url, maxRedirect);
  });
}

async function fetchInfo(url, resetDay) {
  if (!url || url.trim() === "") return null;
  
  const headers = { "User-Agent": "Quantumult X/1.5.2 (iPhone; iOS 14.0; Scale/3.00)" };
  const result = await httpGetFollow(url, headers, 3);
  
  if (!result || result.err) {
    return `订阅请求失败：${result.msg || "网络错误"}`;
  }
  
  const { resp, status } = result;
  if (status !== 200) {
    return `订阅请求失败，状态码：${status}`;
  }
  
  const sui = getHeaderCaseInsensitive(resp.headers, "subscription-userinfo");
  if (!sui) {
    return "未返回订阅信息\n请检查链接是否支持流量查询";
  }
  
  const data = {};
  sui.split(";").forEach(p => {
    const [k, v] = p.trim().split("=");
    if (k && v) data[k] = parseInt(v);
  });
  
  const used = (data.upload || 0) + (data.download || 0);
  const total = data.total || 0;
  const percent = total > 0 ? Math.round((used / total) * 100) : 0;
  
  const lines = [
    `已用：${percent}%`,
    `流量：${humanGB(used)}｜${humanGB(total)}`
  ];
  
  if (data.expire) {
    const d = new Date(data.expire * 1000);
    lines.push(`到期：${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}号`);
  }
  
  if (resetDay) {
    lines.push(getResetInfo(resetDay));
  }
  
  return lines.join("\n");
}

(async () => {
  const panels = [];
  
  for (let i = 1; i <= 10; i++) {
    const NEXT_KEYS = [`url${i}`, `title${i}`, `resetDay${i}`];
    
    // 定界提取 URL（支持未编码的链接）
    const url = extractArg(RAW_ARG, `url${i}`, NEXT_KEYS);
    
    // 强化空值检查：只有 URL 真正有内容才处理
    if (!url || url.trim() === "") continue;
    
    const title = args[`title${i}`] || "";
    const resetDay = args[`resetDay${i}`] ? parseInt(args[`resetDay${i}`]) : null;
    
    const content = await fetchInfo(url, resetDay);
    if (!content) continue; // 跳过返回 null 的情况
    
    // 只有填写了标题才显示"机场：xxx"前缀
    if (title && title.trim() !== "") {
      panels.push(`机场：${title}\n${content}`);
    } else {
      panels.push(content);
    }
  }
  
  // 如果所有订阅都未填写，显示提示
  if (panels.length === 0) {
    $done({
      title: "未配置",
      content: "请在模块参数中填写至少一个订阅地址",
      icon: "questionmark.circle",
      "icon-color": "#999999"
    });
    return;
  }
  
  $done({
    title: "订阅流量",
    content: panels.join("\n\n"),
    icon: "antenna.radiowaves.left.and.right.circle.fill",
    "icon-color": "#00E28F"
  });
})();
