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
Check the [Demo page][demo] for usage example.

[demo]: https://rawgit.com/eight04/angular-datetime/master/demo.html

Install
-------
Bower:

	bower install angular-datetime --save

Todos
-----
* Add validator.
* Support week (ww, w).
* Doesn't update model correctly with duplicate node name.
* Use dynamic date limit (min, max) depend on month.
* Make day editable. (How?)

Known Issue
-----------
* Prevent keydown to restrict editing static node doesn't work well with chinese IME.
* Use Tab key to navigate between inputs will auto select text in Chrome.
* Angular use dirty check to detect model change, we have to create a new date object everytime the view change. Perhaps there is a way to tell Angular to update view manually.
* 2 digit year ('yy') is ambiguous when converting date string back to date object (Ex. 14 -> 2014, 1914, ...). You have better avoid that.
