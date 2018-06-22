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
		uglify({
			ie8: true,
			compress: {
				arguments: false,
				booleans: false,
				collapse_vars: false,
				comparisons: false,
				conditionals: false,
				dead_code: false,
				evaluate: false,
				hoist_props: false,
				if_return: false,
				inline: false,
				join_vars: false,
				keep_fnames: true,
				loops: false,
				negate_iife: false,
				properties: false,
				reduce_funcs: false,
				// reduce_vars: false
			},
			mangle: false,
			output: {
				beautify: true
			}
		})
	]
};
