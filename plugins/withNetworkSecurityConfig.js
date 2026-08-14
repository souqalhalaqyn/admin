const { withAndroidManifest, withDangerousMod } = require("expo/config-plugins");
const path = require("path");
const fs = require("fs");

module.exports = function withNetworkSecurityConfig(config) {
  config = withAndroidManifest(config, (config) => {
    const application = config.modResults.manifest.application?.[0];
    if (!application) return config;
    application.$["android:networkSecurityConfig"] = "@xml/network_security_config";
    return config;
  });

  return withDangerousMod(config, [
    "android",
    async (config) => {
      const xmlDir = path.join(
        config.modRequest.platformProjectRoot,
        "app/src/main/res/xml",
      );
      if (!fs.existsSync(xmlDir)) {
        fs.mkdirSync(xmlDir, { recursive: true });
      }

      const filePath = path.join(xmlDir, "network_security_config.xml");
      const content =
        '<?xml version="1.0" encoding="utf-8"?>\n<network-security-config>\n    <domain-config cleartextTrafficPermitted="true">\n        <domain includeSubdomains="false">79.133.56.149</domain>\n    </domain-config>\n</network-security-config>\n';

      if (!fs.existsSync(filePath) || fs.readFileSync(filePath, "utf8") !== content) {
        fs.writeFileSync(filePath, content);
      }
      return config;
    },
  ]);
};
