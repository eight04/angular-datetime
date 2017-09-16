import re from "rollup-plugin-re";
import commonjs from "rollup-plugin-commonjs";
import babel from "rollup-plugin-babel";
import uglify from "rollup-plugin-uglify";

export default {
	input: "index.js",
	output: {
		file: "dist/datetime.js",
		format: "iife"
	},
	globals: {
		angular: "angular",
		"custom-input": "customInput",
		"custom-input/lib/utils": "customInput.utils"
	},
	plugins: [re({
		patterns: [{
			// https://github.com/rollup/rollup-plugin-commonjs/issues/188
			match: /index\.js/,
			test: /require\((.+?)\)/g,
			replace: "import $1"
		}]
	}), commonjs(), babel(), uglify()]
};
