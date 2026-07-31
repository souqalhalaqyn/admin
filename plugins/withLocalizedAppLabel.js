const { withDangerousMod } = require("expo/config-plugins");
const path = require("path");
const fs = require("fs");

module.exports = function withLocalizedAppLabel(config, { ar }) {
  if (!ar) return config;

  return withDangerousMod(config, [
    "android",
    async (config) => {
      const resDir = path.join(
        config.modRequest.platformProjectRoot,
        "app/src/main/res",
      );
      const valuesArDir = path.join(resDir, "values-ar");

      if (!fs.existsSync(valuesArDir)) {
        fs.mkdirSync(valuesArDir, { recursive: true });
      }

      fs.writeFileSync(
        path.join(valuesArDir, "strings.xml"),
        `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <string name="app_name">${ar}</string>\n</resources>\n`,
      );

      return config;
    },
  ]);
};
