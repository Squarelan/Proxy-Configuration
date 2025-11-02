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
try {
return decodeURIComponent(slice);
} catch {
return slice;
}
}

// 可能出现的键名集合
const NEXT_KEYS = ["url","reset_day","resetDay","title","icon","color","iconColor","URL","TITLE","ICON","COLOR"];
// 先尝试“定界抽取”URL
let url = extractArg(RAW_ARG, "url", NEXT_KEYS);
if (!url) url = extractArg(RAW_ARG, "URL", NEXT_KEYS);

// 再解析其它键（这些一般不会含 &，普通解析足够）
function parseLoose(raw) {
const out = {};
raw.split("&").filter(Boolean).forEach(kv => {
const [k, ...rest] = kv.split("=");
if (!k) return;
const v = rest.join("=");
try { out[k] = decodeURIComponent(v || ""); }
catch { out[k] = v || ""; }
});
return out;
}
const args = parseLoose(RAW_ARG);

// 兼容多种命名
const title = args.title || args.TITLE || "订阅流量";
const resetDayRaw = args.reset_day || args.resetDay || args.RESET_DAY || "";
const icon = args.icon || args.ICON || "antenna.radiowaves.left.and.right.circle.fill";
const iconColor = args.color || args.iconColor || args.COLOR || "#00E28F";

// 规范化 resetDay：1-31 的整数，否则为空
const resetDay = (() => {
const n = parseInt(String(resetDayRaw).trim(), 10);
return Number.isInteger(n) && n >= 1 && n <= 31 ? n : null;
})();

function getResetInfo(rd) {
if (!rd) return "";
const today = new Date();
const nowDay = today.getDate();
const nowMonth = today.getMonth();
const nowYear = today.getFullYear();
const resetDate = nowDay < rd ? new Date(nowYear, nowMonth, rd) : new Date(nowYear, nowMonth + 1, rd);
const diff = Math.ceil((resetDate - today) / (1000 * 60 * 60 * 24));
return 重置：${diff}天;
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

function parseSubInfoHeader(val) {
const data = {};
if (typeof val !== "string") return data;
val.split(";").forEach(p => {
const [k, v] = p.trim().split("=");
if (!k) return;
const key = k.trim();
const num = v !== undefined ? parseInt(String(v).trim(), 10) : NaN;
if (!Number.isNaN(num)) data[key] = num;
});
return data;
}

function fetchInfo(u, rd) {
return new Promise(resolve => {
if (!u || !u.trim()) return resolve(null);
$httpClient.get({ url: u, headers: { "User-Agent": "Surge Panel/1.0" } }, (err, resp) => {
if (err || !resp) return resolve(null);
const status = resp.status ?? resp.statusCode ?? 0;
if (status !== 200) return resolve(null);

  const sui = getHeaderCaseInsensitive(resp.headers, "subscription-userinfo");
  if (!sui) return resolve("未返回订阅信息头\n请检查订阅是否支持流量查询");

  const data = parseSubInfoHeader(sui);
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
  if (rd) lines.push(getResetInfo(rd));
  resolve(lines.join("\n"));
});

});
}

(async () => {
if (!url || url.trim() === "") {
$done({
title: "未配置",
content: "请在模块参数中填写订阅地址",
icon: "questionmark.circle",
"icon-color": "#999999"
});
return;
}

const content = await fetchInfo(url, resetDay);
if (!content) {
$done({
title,
content: "订阅请求失败\n请检查订阅地址是否正确",
icon: "exclamationmark.triangle.fill",
"icon-color": "#FF9500"
});
return;
}

$done({ title, content, icon, "icon-color": iconColor });
})();
