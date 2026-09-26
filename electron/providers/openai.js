const { requestJson, noBalanceApi } = require("./_util");

/**
 * OpenAI 已逐步关闭普通 API Key 的账单接口。
 * 优先尝试 credit_grants；失败则校验密钥有效性。
 */
async function fetchBalance(apiKey) {
  try {
    const data = await requestJson(
      "https://api.openai.com/dashboard/billing/credit_grants",
      { apiKey }
    );
    const total = parseFloat(data.total_available ?? data.total_granted);
    if (!Number.isNaN(total)) {
      return { balance: total, unit: "USD" };
    }
  } catch (_) {
    /* fall through */
  }

  try {
    const data = await requestJson(
      "https://api.openai.com/v1/dashboard/billing/credit_grants",
      { apiKey }
    );
    const total = parseFloat(data.total_available ?? data.total_granted);
    if (!Number.isNaN(total)) {
      return { balance: total, unit: "USD" };
    }
  } catch (_) {
    /* fall through */
  }

  // validate key
  await requestJson("https://api.openai.com/v1/models", { apiKey });
  return noBalanceApi("USD", "密钥有效；OpenAI 未向普通 Key 开放余额接口");
}

module.exports = {
  name: "OpenAI",
  icon: "icons/openai.png",
  fetchBalance,
};
