angular-datetime
================
This module includes a datetime directive and a parser service.

Features
--------
* A Datetime directive which add type=datetime behavior to input[text].
* A parser, which can parse date string into date object with defined format.
* A formatter, which can convert date object into date string without Angular builtin date filter.
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
	} catch (e) {
		console.log(e);	// -> ["Pattern value mismatch", ... ]
	}
});
```
### datetime directive ###
```
<input type="text" datetime="yyyy-MM-dd" ng-model="myDate">
```

Todos
-----
* Support week (ww, w).
* Use dynamic date limit (min, max) depend on month.
* Make day editable. (How?)

Known Issue
-----------
* Prevent keydown to restrict editing static node doesn't work well with chinese IME.
* Use Tab key to navigate between inputs will auto select text in Chrome.
* Angular use dirty check to detect model change, we have to create a new date object everytime the view change. Perhaps there is a way to tell Angular to update view manually.
* 2 digit year ('yy') is ambiguous when converting date string back to date object (Ex. 14 -> 2014, 1914, ...). It's better to avoid it.
