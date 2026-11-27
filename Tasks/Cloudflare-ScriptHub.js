// 用于提供 $httpClient、$notification 和 $done 的代理客户端定时任务。
// 每组按 DustinWin/BestCF 的列表顺序取首个有效 IPv4。
(async () => {
  const releaseUrl = "https://github.com/DustinWin/BestCF/releases/download/bestcf/";
  const lists = [
    ["📡 电信推荐", "ctcc-ip.txt"],
    ["📱 移动推荐", "cmcc-ip.txt"],
    ["📶 联通推荐", "cucc-ip.txt"],
    ["🌐 综合推荐", "bestcf-ip.txt"],
  ];

  function getList(file) {
    return new Promise((resolve, reject) => {
      $httpClient.get({ url: releaseUrl + file }, (error, response, body) => {
        if (error) {
          reject(new Error(error.message || String(error)));
          return;
        }

        const status = Number(response?.status ?? response?.statusCode);
        if (status !== 200) {
          reject(new Error(Number.isFinite(status) ? `HTTP ${status}` : "响应缺少 HTTP 状态码"));
          return;
        }

        if (typeof body !== "string") {
          reject(new Error("响应正文格式无效"));
          return;
        }
        resolve(body);
      });
    });
  }

  function firstIPv4(text) {
    for (const line of text.split("\n")) {
      const address = line.split("#", 1)[0].trim();
      if (/^(?:\d{1,3}\.){3}\d{1,3}$/.test(address) &&
          address.split(".").every((octet) => Number(octet) <= 255)) {
        return address;
      }
    }
  }

  async function getRecommendation([label, file]) {
    try {
      const address = firstIPv4(await getList(file));
      return `${label}：${address || "列表没有有效 IPv4"}`;
    } catch (error) {
      return `${label}：获取失败（${error.message}）`;
    }
  }

  try {
    const recommendations = await Promise.all(lists.map(getRecommendation));
    const message = ["三网优选IP已筛选（BestCF 公开列表）：", ...recommendations].join("\n");
    console.log(message);
    $notification.post("Cloudflare 优选IP", "", message);
  } finally {
    $done({});
  }
})();
