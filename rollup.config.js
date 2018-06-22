import cjs from "rollup-plugin-cjs-es";
import babel from "rollup-plugin-babel";
import {uglify} from "rollup-plugin-uglify";
import resolve from "rollup-plugin-node-resolve";

var babelOptions = Object.assign(
	JSON.parse(require("fs").readFileSync(".babelrc", "utf8")),
	{babelrc: false}
);

export default {
	input: "index.js",
	output: {
		file: "dist/datetime.js",
		format: "iife",
		globals: {angular: "angular"},
		sourcemap: false
	},
	external: ["angular"],
	plugins: [
		resolve(),
		cjs({nested: true}),
		babel(babelOptions),
		uglify({ie8: true})
	]
};
