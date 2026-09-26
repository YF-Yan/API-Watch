const { requestJson, noBalanceApi } = require("./_util");

/** Anthropic 无公开余额 API，校验密钥后提示去控制台。 */
async function fetchBalance(apiKey) {
  await requestJson("https://api.anthropic.com/v1/models", {
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
  });
  return noBalanceApi("USD", "密钥有效；Claude 余额请到 Anthropic 控制台查看");
}

module.exports = {
  name: "Claude",
  icon: "icons/claude.png",
  fetchBalance,
};
