module.exports = function(grunt) {

	// Project configuration.
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		bump: {
			options: {
				files: ["package.json", "bower.json"],
				updateConfigs: ["pkg"],
				commitFiles: ["package.json", "bower.json"],
				pushTo: "origin"
			}
		}
	});

	// Load the plugin that provides the "uglify" task.
	grunt.loadNpmTasks('grunt-bump');

	// Default task(s).
//	grunt.registerTask('dist', ["clean", "less", "dist-js"]);
//	grunt.registerTask('dist-js', ["copy", "ngtemplates"]);

};
