import commonjs from "rollup-plugin-commonjs";
import babel from "rollup-plugin-babel";
import uglify from "rollup-plugin-uglify";
import resolve from "rollup-plugin-node-resolve";

var babelOptions = Object.assign(
	JSON.parse(require("fs").readFileSync(".babelrc", "utf8")),
	{babelrc: false}
);

export default {
	input: "bundle.js",
	output: {
		file: "dist/datetime.js",
		format: "iife"
	},
	external: ["angular"],
	globals: {angular: "angular"},
	plugins: [
		resolve(),
		commonjs(),
		babel(babelOptions),
		// https://github.com/rollup/rollup/issues/1595
		{
			name: "rollup-plugin-trim-async-generator",
			transform(code, id) {
				if (id != "\0babelHelpers") return;
				return code.replace(/export var asyncGenerator[\s\S]*?}\(\);/, "");
			}
		},
		uglify({ie8: true})
	]
};
