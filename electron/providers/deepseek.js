/**
 * DeepSeek 余额查询
 * GET https://api.deepseek.com/user/balance
 * Authorization: Bearer <API_KEY>
 */
async function fetchBalance(apiKey) {
  const res = await fetch("https://api.deepseek.com/user/balance", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    let detail = "";
    try {
      const body = await res.json();
      detail = body.error?.message || body.message || JSON.stringify(body);
    } catch {
      detail = await res.text();
    }
    throw new Error(detail || `HTTP ${res.status}`);
  }

  const data = await res.json();
  const infos = data.balance_infos || [];
  const cny = infos.find((x) => x.currency === "CNY") || infos[0];
  if (!cny) {
    throw new Error("未返回余额信息");
  }

  const balance = parseFloat(cny.total_balance);
  if (Number.isNaN(balance)) {
    throw new Error("余额格式异常");
  }

  return {
    balance,
    unit: cny.currency || "CNY",
    available: !!data.is_available,
    granted: parseFloat(cny.granted_balance || "0"),
    toppedUp: parseFloat(cny.topped_up_balance || "0"),
  };
}

module.exports = {
  name: "DeepSeek",
  icon: "icons/deepseek.png",
  fetchBalance,
};
