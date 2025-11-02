const args = (() => {
const raw = $argument || "";
const out = {};
raw.split("&").filter(Boolean).forEach(kv => {
const [k, ...rest] = kv.split("=");
if (!k) return;
const v = rest.join("="); // 兼容 value 中含 '='
try {
out[k] = decodeURIComponent(v || "");
} catch {
out[k] = v || "";
}
});
return out;
})();

// 兼容多种命名
const url = args.url || args.URL || "";
const title = args.title || args.TITLE || "订阅流量";
const resetDayRaw = args.reset_day || args.resetDay || args.RESET_DAY || "";
const icon = args.icon || args.ICON || "antenna.radiowaves.left.and.right.circle.fill";
const iconColor = args.color || args.iconColor || args.COLOR || "#00E28F";

// 规范化 resetDay：1-31 的整数，否则为空
const resetDay = (() => {
const n = parseInt(String(resetDayRaw).trim(), 10);
return Number.isInteger(n) && n >= 1 && n <= 31 ? n : null;
})();

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
// 形如: upload=123; download=456; total=789; expire=1700000000
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

function fetchInfo(url, resetDay) {
return new Promise(resolve => {
if (!url || !url.trim()) return resolve(null);

$httpClient.get(
  { url, headers: { "User-Agent": "Surge Panel/1.0" } },
  (err, resp /*, body */) => {
    if (err || !resp) return resolve(null);

    const status = typeof resp.status === "number" ? resp.status
                  : typeof resp.statusCode === "number" ? resp.statusCode
                  : 0;
    if (status !== 200) return resolve(null);

    const h = resp.headers || {};
    const sui = getHeaderCaseInsensitive(h, "subscription-userinfo");
    if (!sui) {
      // 没有提供订阅信息头
      return resolve("未返回订阅信息头\n请检查订阅是否支持流量查询");
    }

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

    if (resetDay) {
      lines.push(getResetInfo(resetDay));
    }

    resolve(lines.join("\n"));
  }
);

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
