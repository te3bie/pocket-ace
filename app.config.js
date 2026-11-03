// Keep local/native builds at the root; Pages exports use the repository subpath.
module.exports = ({ config }) => ({
  ...config,
  experiments: {
    ...config.experiments,
    baseUrl: process.env.POCKETACE_BASE_PATH || "",
  },
});
