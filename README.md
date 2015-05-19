angular-datetime
================
This module includes a datetime directive and a parser service.

From 0.x to 1.0
---------------
* Added Karma test.
* Changed source structure.
* Now you can chain parser's methods.
* Parsing error won't mess up modelValue anymore.

Features
--------
* This module includes:
	- A directive adding `type=datetime` behavior to `input[text]`:
		- Use date object as modelValue.
		- Use arrow keys to move on different part of datestring.
		- Use arrow keys to increase/decrease value.
		- Typeahead. Ex. "se" -> "September".
	- A parser, which can parse date string into date object with defined format.
	- A formatter, which can convert date object into date string without Angular builtin date filter.
* Support IE8.

Demo
----
Check out the [Demo page][demo].

[demo]: https://rawgit.com/eight04/angular-datetime/master/demo.html

Install
-------
Bower:

	bower install angular-datetime --save

Usage examples
--------------
### datetime service ###
```Javascript
// Setup dependency
angular.module("myApp", ["datetime"]);

// Use datetime parser
angular.controller("myController", function(datetime){
	// Create a parser
	var parser = datetime("yyyy-MM-dd");

	// Set to current date
	parser.setDate(new Date);
	parser.getText();	// -> "2015-01-30"

	// Parse a date string
	parser.parse("2015-01-30");
	parser.getDate();	// -> DateTime object

	// Other properties
	parser.format;	// -> "yyyy-MM-dd"

	// Catch the parsing error
	try {
		parser.parse("2015-123-456");
	} catch (err) {
		console.log(err);	// -> {code: "...", message: "...", ...}
	}
});
```
### datetime directive ###
```
<input type="text" datetime="yyyy-MM-dd" ng-model="myDate">
```

Known Issue
-----------
* Prevent keydown to restrict editing static node doesn't work well with chinese IME.
* 2 digit year 'yy' is ambiguous when converting datestring back to date object (Ex. 14 -> 2014, 1914, ...). You should avoid it.
* Parser don't know how to parse datestring if some pattern are duplicate in datetime formats. (Ex. parsing "1989-1999" with "yyyy-yyyy" is undefined behavior.)
	- Maybe we could add priority to each node, so the parser will know which value to use.
