async function requestJson(url, { apiKey, headers = {}, method = "GET", body } = {}) {
  const res = await fetch(url, {
    method,
    headers: {
      Accept: "application/json",
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  const text = await res.text();
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    const detail =
      data?.error?.message ||
      data?.message ||
      data?.msg ||
      data?.error ||
      (typeof data?.raw === "string" ? data.raw.slice(0, 160) : "") ||
      `HTTP ${res.status}`;
    const err = new Error(String(detail));
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

function noBalanceApi(unit, message) {
  return {
    balance: null,
    unit,
    ok: true,
    noBalanceApi: true,
    message: message || "密钥有效，余额请到控制台查看",
  };
}

module.exports = { requestJson, noBalanceApi };
