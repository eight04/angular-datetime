import cjs from "rollup-plugin-cjs-es";
import babel from "rollup-plugin-babel";
import {uglify} from "rollup-plugin-uglify";
import resolve from "rollup-plugin-node-resolve";

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
		babel(),
		uglify({
      // https://github.com/mishoo/UglifyJS2/issues/3197
			compress: {
        reduce_vars: false
      },
      ie8: true
		})
	]
};
