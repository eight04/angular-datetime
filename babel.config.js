const presets = [
  [
    "@babel/env",
    {
      targets: {
        ie: 8
      },
      loose: true,
      modules: false,
      exclude: ["transform-function-name"]
    }
  ]
];

module.exports = {presets};
