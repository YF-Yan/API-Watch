const { requestJson, noBalanceApi } = require("./_util");

/**
 * 通义千问 / DashScope
 * 尝试费用余额接口；失败则用 compatible-mode 校验密钥。
 */
async function fetchBalance(apiKey) {
  const candidates = [
    "https://dashscope.aliyuncs.com/api/v1/fees/balance",
    "https://dashscope.aliyuncs.com/api/v1/account/balance",
  ];

  for (const url of candidates) {
    try {
      const data = await requestJson(url, { apiKey });
      const raw =
        data?.data?.balance ??
        data?.data?.available_balance ??
        data?.balance ??
        data?.available_balance ??
        data?.output?.balance;
      const balance = parseFloat(raw);
      if (!Number.isNaN(balance)) {
        return { balance, unit: "CNY" };
      }
    } catch (_) {
      /* try next */
    }
  }

  await requestJson("https://dashscope.aliyuncs.com/compatible-mode/v1/models", { apiKey });
  return noBalanceApi("CNY", "密钥有效；通义余额请到 DashScope 控制台查看");
}

module.exports = {
  name: "通义千问",
  icon: "icons/qwen.png",
  fetchBalance,
};
