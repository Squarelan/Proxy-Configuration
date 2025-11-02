const RAW_ARG = $argument || "";

// 提取原始参数里某个键的值（允许值中包含未编码的 & 或 =）
function extractArg(raw, key, nextKeys) {
const tag = key + "=";
const i = raw.indexOf(tag);
if (i === -1) return "";
const start = i + tag.length;
let end = raw.length;
for (const nk of nextKeys) {
const j = raw.indexOf("&" + nk + "=", start);
if (j !== -1) end = Math.min(end, j);
}
const slice = raw.slice(start, end);
try { return decodeURIComponent(slice); } catch { return slice; }
}

// 将 $argument 松散解析为对象（不保证 URL 完整性，仅供非 URL 键）
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

function normResetDay(v) {
const n = parseInt(String(v || "").trim(), 10);
return Number.isInteger(n) && n >= 1 && n <= 31 ? n : null;
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

function humanGB(bytes) {
return (bytes / 1024 / 1024 / 1024).toFixed(2) + " GB";
}

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

// 跟随重定向最多 3 次
function httpGetFollow(u, headers, maxRedirect = 3) {
return new Promise(resolve => {
const tryGet = (link, left) => {
$httpClient.get({ url: link, headers }, (err, resp) => {
if (err || !resp) return resolve({ err: true });
const status = resp.status ?? resp.statusCode ?? 0;
if ([301, 302, 303, 307, 308].includes(status) && left > 0) {
const loc = getHeaderCaseInsensitive(resp.headers, "location");
if (loc) return tryGet(loc, left - 1);
}
resolve({ resp, status });
});
};
tryGet(u, maxRedirect);
});
}

async function fetchInfo(u, rd) {
if (!u || !u.trim()) return { ok: false, reason: "未填写订阅地址" };
const headers = { "User-Agent": "Quantumult X/1.5.2 (iPhone; iOS 14.0; Scale/3.00)" };
const result = await httpGetFollow(u, headers, 3);
if (!result || result.err || !result.resp) return { ok: false, reason: "请求失败" };

const { resp, status } = result;
if (status !== 200) return { ok: false, reason: 状态码 ${status} };

const sui = getHeaderCaseInsensitive(resp.headers, "subscription-userinfo");
if (!sui) return { ok: false, reason: "未返回 subscription-userinfo 响应头" };

const data = parseSubInfoHeader(sui);
const used = (data.upload || 0) + (data.download || 0);
const total = data.total || 0;
const percent = total > 0 ? Math.round((used / total) * 100) : 0;

const lines = [
已用：${percent}%,
流量：${humanGB(used)}｜${humanGB(total)}
];

if (data.expire) {
const d = new Date(data.expire * 1000);
lines.push(到期：${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}号);
}
if (rd) lines.push(getResetInfo(rd));

return { ok: true, text: lines.join("\n") };
}

// 单订阅渲染
async function renderSingle() {
// 允许两种命名：url/reset_day/resetDay/title/icon/color/iconColor
const NEXT_KEYS = ["url","reset_day","resetDay","title","icon","color","iconColor","URL","TITLE","ICON","COLOR"];
let url = extractArg(RAW_ARG, "url", NEXT_KEYS) || extractArg(RAW_ARG, "URL", NEXT_KEYS);

const title = args.title || args.TITLE || "订阅流量";
const icon = args.icon || args.ICON || "antenna.radiowaves.left.and.right.circle.fill";
const iconColor = args.color || args.iconColor || args.COLOR || "#00E28F";
const resetDay = normResetDay(args.reset_day || args.resetDay || args.RESET_DAY);

if (!url || url.trim() === "") {
$done({ title: "未配置", content: "请在模块参数中填写订阅地址", icon: "questionmark.circle", "icon-color": "#999999" });
return;
}

const res = await fetchInfo(url, resetDay);
if (!res.ok) {
$done({ title, content: 订阅请求失败\n${res.reason}, icon: "exclamationmark.triangle.fill", "icon-color": "#FF9500" });
return;
}
$done({ title, content: res.text, icon, "icon-color": iconColor });
}

// 多订阅聚合渲染（url1..url10 等）
async function renderAggregate() {
const pieces = [];
for (let i = 1; i <= 10; i++) {
// 为每个 i 定界抽取 urli，防止未编码 & 断裂
const NEXT_KEYS_I = [url${i}, resetDay${i}, title${i}, icon${i}, color${i}];
let ui = extractArg(RAW_ARG, url${i}, NEXT_KEYS_I);
if (!ui) continue;

const ti = args[`title${i}`] || `订阅${i}`;
const rdi = normResetDay(args[`resetDay${i}`]);
const ri = await fetchInfo(ui, rdi);
const text = ri.ok ? ri.text : `订阅请求失败\n${ri.reason}`;
pieces.push(`机场：${ti}\n${text}`);

}

if (pieces.length === 0) {
$done({ title: "未配置", content: "请在模块参数中填写至少一个订阅地址", icon: "questionmark.circle", "icon-color": "#999999" });
return;
}

$done({
title: "订阅流量",
content: pieces.join("\n\n"),
icon: "antenna.radiowaves.left.and.right.circle.fill",
"icon-color": "#00E28F"
});
}

(async () => {
// 如果检测到 url1/url2... 则走聚合模式；否则走单订阅模式
const hasAggregate = /\burl[1-9]\d*=/.test(RAW_ARG);
if (hasAggregate) {
await renderAggregate();
} else {
await renderSingle();
}
})();
