angular-datetime
================
This module includes a datetime directive and a parser service.

Features
--------
* This module includes:
	- A directive which can simulate datetime input within a text field.
	- A service which can convert a string of date into a Date object, and vice versa.
* IE8 is supported by transpiling through babel and using polyfill.

Dependencies
------------

* Angular 1.2+
* custom-input 0.2.0 - https://github.com/eight04/custom-input

Date string format
------------------
Apart from [the formats provided officially](https://docs.angularjs.org/api/ng/filter/date), angular-datetime support some new tokens:

* ZZ - represent timezone with colon (e.g. +08:00)

Demo
----
* With Angular 1.2.x: <https://rawgit.com/eight04/angular-datetime/master/example/demo.html>
* With Angular 1.5.x: <https://rawgit.com/eight04/angular-datetime/master/example/demo-1.5.html>

Installation
------------
Via npm:

```
npm install angular-datetime-input --save
```
```javascript
require("angular-datetime-input");
```
	
Or use pre-built dist:

```html
<!-- Don't forget to include custom-input -->
<script src="https://unpkg.com/custom-input@0.2.0/dist/custom-input.js"></script>
<script src="https://unpkg.com/angular-datetime@5.1.0/dist/angular-datetime.js"></script>
```

Example
-------
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
	parser.getDate();	// -> Date object
	
	// Set working timezone. Changing timezone will not affect date object but
	// date string (i.e. parser.getText()).
	parser.setTimezone("+0800");
	
	// Reset to default timezone.
	parser.setTimezone();

	// Catch the parsing error
	try {
		parser.parse("2015-123-456");
	} catch (err) {
		console.log(err);	// -> {code: "...", message: "...", ...}
	}
});
```

### datetime directive

Check out the [demo page](https://rawgit.com/eight04/angular-datetime/master/example/demo.html) for details.

```html
<input type="text" datetime="yyyy-MM-dd" ng-model="myDate">
<input type="text" datetime="yyyy-MM-dd" ng-model="myDate" required>
<input type="text" datetime="yyyy-MM-dd" ng-model="myDate" datetime-utc>
<input type="text" datetime="yyyy-MM-dd" ng-model="myDate" min="Jan 1, 1990" max="Dec 31, 2050">
<input type="text" datetime="yyyy-MM-dd" ng-model="myDate" datetime-model="yyyy-MM-ddTHH:mm:ss">
<input type="text" datetime="dd.MM.yyyy" ng-model="myDate" datetime-separator=",">
```

API reference
-------------

This module exports:

* `datetime` service - a function to create DatetimeParser object.
* `datetimePlaceholder` constant - a map that define the placeholder of each element.

#### datetimePlaceholder object

Just a plain object. Edit it in config phase to specify different placeholder.

Default value:

	{
		year: "(year)",
		yearShort: "(year)",
		month: "(month)",
		date: "(date)",
		day: "(day)",
		hour: "(hour)",
		hour12: "(hour12)",
		minute: "(minute)",
		second: "(second)",
		millisecond: "(millisecond)",
		ampm: "(AM/PM)",
		week: "(week)"
	}

#### datetime(format: String) => DatetimeParser

A function to construct a date parser. format is a string containing date definition tokens defined by Angular: https://docs.angularjs.org/api/ng/filter/date

#### DatetimeParser

A parser object which can convert String to Date and vice versa.

##### DatetimeParser.parse(text: String) => DatetimeParser

Parse text. This method might throw error.

##### DatetimeParser.getText() => String

Return formatted text.

##### DatetimeParser.setDate(date: Date) => DatetimeParser

Set date and conver date to text.

##### DatetimeParser.getDate() => Date

Return Date object.

These methods are usually used like:

	date = parser.parse(text).getDate();
	text = parser.setDate(date).getText();
	
##### DatetimeParser.setTimezone([timezone: String]) => DatetimeParser

Set the timezone of the parser. timezone is a string matching `/[+-]\d{4}/` or `/[+-]\d{2}:\d{2}/`.

If timezone is not provided, reset timezone to browser default.

Setting timezone doesn't affect model value but update text.

	time = parser.getDate().getTime();
	parser.setTimezone(newTimezone);
	time2 = parser.getDate().getTime();
	
	console.assert(time == time2);
	
##### DatetimeParser.isEmpty() => boolean

Return true if there is any empty element.

##### DatetimeParser.isInit() => boolean

Return true if all elements are set.

##### DatetimeParser.unset() => DatetimeParser

Set all elements to empty.

Known issues
------------
* 2 digit year 'yy' is ambiguous when converting datestring back to date object (Ex. 14 -> 2014, 1914, ...). You should avoid it.

Notes
-----
* Some info about getting selection range across all browsers:
	- https://github.com/acdvorak/jquery.caret
	- http://stackoverflow.com/questions/19814465/is-it-possible-to-insert-text-in-textarea-and-update-undo-redo-queue

Changelog
---------
* 5.1.0 (Mar 9, 2017)
	- Switch to browserify.
	- Drop karma, switch to mocha + jsdom.
	- **Update custom-input to 0.2.0.**
	- Now this package is requirable, perhaps it works better in different bundlers.
* 5.0.0 (Dec 23, 2016)
	- Rewritten in ES6.
		- The core part of the parser and the input mask are pulled out as [custom-input](https://github.com/eight04/custom-input)
		- Support IE8 by transpiling through babel and using polyfill for missing functions.
	- Add constant `datetimePlaceholder`.
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

