const nextConfig = require("eslint-config-next");

module.exports = [
  {
    ignores: ["node_modules/**", ".next/**"],
  },
  ...(Array.isArray(nextConfig) ? nextConfig : [nextConfig]),
];
