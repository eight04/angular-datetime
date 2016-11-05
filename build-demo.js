var fs = require("fs");

fs.readFile("example/demo.html", "utf8", function(err, data) {
	if (err) throw err;
	data = data.replace(/\/1\.2\.\d+\/angular\.js/, "/1.5.8/angular.js");
	fs.writeFile("example/demo-1.5.html", data, function(err) {
		if (err) throw err;
	});
});