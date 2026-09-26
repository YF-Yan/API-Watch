const deepseek = require("./deepseek");
const openai = require("./openai");
const anthropic = require("./anthropic");
const gemini = require("./gemini");
const qwen = require("./qwen");
const moonshot = require("./moonshot");
const doubao = require("./doubao");

const PROVIDERS = {
  deepseek,
  openai,
  anthropic,
  gemini,
  qwen,
  moonshot,
  doubao,
};

async function fetchBalance(provider, apiKey) {
  const impl = PROVIDERS[provider];
  if (!impl) {
    throw new Error(`${provider} 暂未接入`);
  }
  return impl.fetchBalance(apiKey);
}

function listProviders() {
  return Object.keys(PROVIDERS).map((id) => ({
    id,
    name: PROVIDERS[id].name,
    icon: PROVIDERS[id].icon,
  }));
}

module.exports = { fetchBalance, listProviders, PROVIDERS };
