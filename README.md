angular-datetime
================
This module includes a datetime directive which implements datetime control behavior, also includes a datetime parser which can parse date object to date string or date string to date object.

Demo
----
[Demo page][1]

[1]: https://rawgit.com/eight04/angular-datetime/master/example/example.html

Todos
-----
* Add validator.
* Support day (EEEE, EEE).
* Support week (ww, w).
* Doesn't update model correctly with duplicate node name.
* Use dynamic date limit (min, max) depend on month.
* Link date and weekday.

Known Issue
-----------
* Prevent keydown to restrict editing static node doesn't work well with chinese IME.
* Use Tab key to navigate between inputs will auto select text in Chrome.
