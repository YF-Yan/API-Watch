const { requestJson, noBalanceApi } = require("./_util");

/**
 * 豆包 / 火山方舟
 * 普通 API Key 通常无余额接口，校验后提示控制台。
 */
async function fetchBalance(apiKey) {
  try {
    // 部分账号可用的推理接入点列表（不保证）
    await requestJson("https://ark.cn-beijing.volces.com/api/v3/models", { apiKey });
    return noBalanceApi("CNY", "密钥有效；豆包余额请到火山引擎控制台查看");
  } catch (err) {
    // 401/403 说明密钥格式到达了服务端
    if (err.status === 401 || err.status === 403) {
      throw new Error(err.message || "API Key 无效");
    }
    // 404/其他：仍可能是有效 key，但无 models 列表权限
    if (apiKey && apiKey.length > 8) {
      return noBalanceApi("CNY", "已保存密钥；豆包余额请到火山引擎控制台查看");
    }
    throw err;
  }
}

module.exports = {
  name: "豆包",
  icon: "icons/doubao.png",
  fetchBalance,
};
