const { requestJson } = require("./_util");

async function fetchBalance(apiKey) {
  const data = await requestJson("https://api.moonshot.cn/v1/users/me/balance", { apiKey });
  if (data.code != null && data.code !== 0) {
    throw new Error(data.message || data.msg || `查询失败 code=${data.code}`);
  }
  const info = data.data || data;
  const balance = parseFloat(info.available_balance);
  if (Number.isNaN(balance)) throw new Error("余额格式异常");
  return {
    balance,
    unit: "CNY",
    voucher: parseFloat(info.voucher_balance || 0),
    cash: parseFloat(info.cash_balance || 0),
  };
}

module.exports = {
  name: "Kimi",
  icon: "icons/kimi.png",
  fetchBalance,
};
