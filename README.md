angular-datetime
================
A 3rd-party implement of Angular date parser, which can parse date string into date object.

Demo
----
(Demo page)[1]

[1]: https://rawgit.com/eight04/angular-datetime/master/example/example.html

Todos
-----
* Need a better node structure.
* <del>Fix millisecond problem.</del>
* <del>Support localizable formats.</del>
* Add validator.
* Support day (EEEE, EEE).
* Support week (ww, w).
* <del>Should make weekdays static.</del> Use increase/decrease method?
* Doesn't update model correctly with duplicate node name.
* Use dynamic date limit (min, max) depend on month.
* <del>Don't disable all keys on static node.</del>
* Remove regex type?

Known Issue
-----------
* Prevent keydown to restrict editing static node doesn't work well with chinese IME.
