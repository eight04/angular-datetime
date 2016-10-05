angular-datetime
================
This module includes a datetime directive and a parser service.

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

Date string format
------------------
Apart from [the formats provided officially](https://docs.angularjs.org/api/ng/filter/date), angular-datetime support some new tokens:

* ZZ - represent timezone with colon (e.g. +08:00)

Demo
----
* With Angular 1.2.x: <https://rawgit.com/eight04/angular-datetime/master/example/demo.html>
* With Angular 1.5.x: <https://rawgit.com/eight04/angular-datetime/master/example/demo-angular-1.5.html>

Install
-------
Bower:

	bower install angular-datetime --save
	
npm:

	npm install angular-datetime-input --save

Usage examples
--------------
### datetime service
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
	
	// Set working timezone. Changing timezone will not affect date object but
	// date string (i.e. parser.getText()).
	parser.setTimezone("+0800");

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
### datetime directive
Check demo page for live example.
```HTML
<input type="text" datetime="yyyy-MM-dd" ng-model="myDate">
<input type="text" datetime="yyyy-MM-dd" ng-model="myDate" required>
<input type="text" datetime="yyyy-MM-dd" ng-model="myDate" datetime-utc>
<input type="text" datetime="yyyy-MM-dd" ng-model="myDate" min="Jan 1, 1990" max="Dec 31, 2050">
<input type="text" datetime="yyyy-MM-dd" ng-model="myDate" datetime-model="yyyy-MM-ddTHH:mm:ss">
<input type="text" datetime="yyyy-MM-dd" ng-model="myDate" default="Jan 1, 2000">
<input type="text" datetime="dd.MM.yyyy" ng-model="myDate" datetime-separator=",">
```

Parsing errors
--------------
* TEXT_MISMATCH
* NUMBER_MISMATCH
* NUMBER_TOOSHORT
* NUMBER_TOOSMALL
* LEADING_ZERO
* SELECT_MISMATCH
* SELECT_INCOMPLETE
* REGEX_MISMATCH
* TEXT_TOOLONG
* INCONSISTENT_INPUT

Known issues
------------
* 2 digit year 'yy' is ambiguous when converting datestring back to date object (Ex. 14 -> 2014, 1914, ...). You should avoid it.

Todos
-----
* Errors throwed by angular-datetime should have its own type.
* Put some error handler into factory?
* Day node should give different proper values depends on month when NUMBER_TOOLARGE.

Changelog
---------
* 4.1.0 (Oct 5, 2016)
	- Refactor.
	- Fix day priority bug.
	- Add `parser.isEmpty`. Fix required issue.
* 4.0.0 (Sep 1, 2016)
	- Change how parser work. It can represent "undefined" node now.
	- Use tab key to navigate between different parts.
* 3.2.2 (Jun 30, 2016)
	- Return false if there is no ngModel.
* 3.2.1 (Jun 18, 2016)
	- Fix a bug that empty `min`, `max` cause invalid date.
* 3.2.0 (May 17, 2016)
	- Support dynamic datetime-utc. [#29](https://github.com/eight04/angular-datetime/issues/29)
* 3.1.1 (Apr 17, 2016)
	- Deploy to npmjs/angular-datetime-input.
	- Drop grunt.
* 3.1.0
    - Jump on the next segment on pressing next separator key. ([#26](https://github.com/eight04/angular-datetime/pull/26))
    - Add `datetime-separator` option.
	- Now it will try to fix NUMBER_TOOSHORT error when pressing left/right/separator key.
* 3.0.1 (Apr 9, 2016)
	- Fix validator and datetime-model bug. [#27](https://github.com/eight04/angular-datetime/issues/27)
* 3.0.0 (Apr 1, 2016)
	- Add token `ZZ`. [#24](https://github.com/eight04/angular-datetime/pull/24)
	- Fix datetime-utc issue. [#21](https://github.com/eight04/angular-datetime/issues/21)
	- Add `parser.setTimezone`. [#22](https://github.com/eight04/angular-datetime/issues/22)
	- Use PhantomJS for testing.
	- Change Angular dependency to ^1.2.0.
	- Fix [date overflow bug](http://stackoverflow.com/questions/14680396/the-date-getmonth-method-has-bug).
* 2.2.1 (Mar 31, 2016)
	- Fix reference error with "Z" token. See [#20](https://github.com/eight04/angular-datetime/pull/20)
* 2.2.0 (Feb 23, 2016)
	- Add new error type "LEADING_ZERO", "NUMBER_TOOSMALL".
	- Use the behavior introduced in #18.
	- Add `default` attribute.
* 2.1.0 (Jan 12, 2016)
	- Add `datetime-utc` option.
* 2.0.1 (Jan 1, 2016)
	- Add MIT License
* 2.0
	- Add `min`, `max`, `datetime-model` directive.
	- Support `$validators` in angular 1.3.x.
	- Update Eslint to 1.x.
	- Fix timezone token `Z`.
* 1.0
	- Added Karma test.
	- Changed source structure.
	- Now you can chain parser's methods.
	- Parsing error won't mess up modelValue anymore.

