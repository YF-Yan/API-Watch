const { noBalanceApi } = require("./_util");

/** Google AI Studio / Gemini 无钱包余额概念，校验密钥即可。 */
async function fetchBalance(apiKey) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error?.message || `HTTP ${res.status}`);
  }
  if (!data.models?.length) {
    throw new Error("密钥似乎无效或无可用模型");
  }
  return noBalanceApi("USD", "密钥有效；Gemini 为额度制，请到 Google AI Studio 查看");
}

module.exports = {
  name: "Gemini",
  icon: "icons/gemini.png",
  fetchBalance,
};
