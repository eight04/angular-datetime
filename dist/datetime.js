"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

angular.module("datetime", ["custom-input"]);

angular.module("datetime").constant("datetimePlaceholder", {
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
});

angular.module("datetime").directive("datetime", ["datetime", "$log", "$document", "customInput", function (datetime, $log, $document, customInput) {
	var InputMask = customInput.InputMask;

	var Element = function () {
		function Element(element, document) {
			_classCallCheck(this, Element);

			this.el = element;
			this.doc = document;
			this.handler = {};
		}

		Element.prototype.on = function on(eventType, callback) {
			// use ngModel.parser to execute digest
			if (eventType == "input") return;

			return this.el.on(eventType, callback);
		};

		Element.prototype.getSelection = function getSelection() {
			var el = this.el[0],
			    doc = this.doc;

			if (doc.activeElement != el) return;

			var start = el.selectionStart,
			    end = el.selectionEnd;

			if (start != undefined && end != undefined) {
				return { start: start, end: end };
			}
			return this.getSelectionIE();
		};

		Element.prototype.getSelectionIE = function getSelectionIE() {
			var el = this.el[0],
			    doc = this.doc;

			var bookmark = doc.selection.createRange().getBookmark(),
			    range = el.createTextRange(),
			    range2 = range.duplicate();

			range.moveToBookmark(bookmark);
			range2.setEndPoint("EndToStart", range);

			var start = range2.text.length,
			    end = start + range.text.length;

			return { start: start, end: end };
		};

		Element.prototype.setSelection = function setSelection(start, end) {
			var el = this.el[0],
			    doc = this.doc;

			if (doc.activeElement != el) return;

			if (el.setSelectionRange) {
				el.setSelectionRange(start, end);
			} else {
				this.setSelectionIE(start, end);
			}
		};

		Element.prototype.setSelectionIE = function setSelectionIE(start, end) {
			var el = this.el[0],
			    select = el.createTextRange();

			select.moveStart("character", start);
			select.collapse();
			select.moveEnd("character", end - start);
			select.select();
		};

		Element.prototype.val = function val(value) {
			return this.el.val(value);
		};

		return Element;
	}();

	function linkFunc(scope, element, attrs, ngModel) {

		if (!ngModel) {
			return false;
		}

		attrs.ngTrim = "false";

		var parser = datetime(attrs.datetime),
		    modelParser = attrs.datetimeModel && datetime(attrs.datetimeModel),
		    maskElement = new Element(element, $document[0]),
		    mask = new InputMask(maskElement, parser.tp, attrs.datetimeSeparator),
		    isUtc;

		mask.on("error", function (err) {
			if (err.code != "NOT_INIT") {
				ngModel.$setValidity("datetime", false);
			}
		});

		parser.tp.on("change", function () {
			scope.$evalAsync(function () {
				if (mask.err) {
					ngModel.$setValidity("datetime", false);
					return;
				}

				if (parser.isInit() || parser.isEmpty()) {
					ngModel.$setValidity("datetime", true);
				} else {
					ngModel.$setValidity("datetime", false);
				}

				if (parser.getText() != ngModel.$viewValue) {
					ngModel.$setViewValue(parser.getText());
				}
			});
		});

		function setUtc(val) {
			if (val && !isUtc) {
				isUtc = true;
				parser.setTimezone("+0000");
				if (modelParser) {
					modelParser.setTimezone("+0000");
				}
			} else if (!val && isUtc) {
				isUtc = false;
				parser.setTimezone();
				if (modelParser) {
					modelParser.setTimezone();
				}
			}
		}

		if (angular.isDefined(attrs.datetimeUtc)) {
			if (attrs.datetimeUtc.length > 0) {
				scope.$watch(attrs.datetimeUtc, setUtc);
			} else {
				setUtc(true);
			}
		}

		function validMin(value) {
			if (ngModel.$isEmpty(value) || ngModel.$isEmpty(attrs.min)) {
				return true;
			}
			if (!angular.isDate(value)) {
				value = modelParser.getDate();
			}
			return value >= new Date(attrs.min);
		}

		function validMax(value) {
			if (ngModel.$isEmpty(value) || ngModel.$isEmpty(attrs.max)) {
				return true;
			}
			if (!angular.isDate(value)) {
				value = modelParser.getDate();
			}
			return value <= new Date(attrs.max);
		}

		if (ngModel.$validators) {
			ngModel.$validators.min = validMin;
			ngModel.$validators.max = validMax;
		}

		attrs.$observe("min", function () {
			validMinMax(parser.getDate());
		});

		attrs.$observe("max", function () {
			validMinMax(parser.getDate());
		});

		ngModel.$render = function () {
			// let mask do render stuff?
			// element.val(ngModel.$viewValue || "");
		};

		ngModel.$isEmpty = function (value) {
			if (!value) {
				return true;
			}
			if (typeof value == "string") {
				return parser.isEmpty(value);
			}
			return false;
		};

		function validMinMax(date) {
			if (ngModel.$validate) {
				ngModel.$validate();
			} else {
				ngModel.$setValidity("min", validMin(date));
				ngModel.$setValidity("max", validMax(date));
			}
			return !ngModel.$error.min && !ngModel.$error.max;
		}

		ngModel.$parsers.push(function (viewValue) {
			// You will get undefined when input is required and model get unset
			if (angular.isUndefined(viewValue)) {
				viewValue = parser.getText();
			}

			mask.digest(null, viewValue);

			if (!parser.isInit()) {
				return undefined;
			}

			var date = parser.getDate();

			if (ngModel.$validate || validMinMax(date)) {
				if (modelParser) {
					return modelParser.setDate(date).getText();
				} else {
					// Create new date to make Angular notice the difference.
					return new Date(date.getTime());
				}
			}

			return undefined;
		});

		ngModel.$formatters.push(function (modelValue) {

			ngModel.$setValidity("datetime", true);
			if (!ngModel.$validate) {
				validMinMax(modelValue);
			}

			if (!modelValue) {
				parser.unset();
				// FIXME: input will be cleared if modelValue is empty and the input is required. This is a temporary fix.
				scope.$evalAsync(function () {
					ngModel.$setViewValue(parser.getText());
				});
				return parser.getText();
			}

			if (modelParser) {
				modelValue = modelParser.parse(modelValue).getDate();
			}

			return parser.setDate(modelValue).getText();
		});
	}

	return {
		restrict: "A",
		require: "?ngModel",
		link: linkFunc
	};
}]);

angular.module("datetime").factory("datetime", ["$locale", "datetimePlaceholder", "customInput", function ($locale, datetimePlaceholder, customInput) {
	var TextParser = customInput.TextParser,
	    num2str = customInput.utils.num2str;
	// Fetch date and time formats from $locale service

	var formats = $locale.DATETIME_FORMATS;
	// Valid format tokens. 1=sss, 2=''
	var tokenRE = /yyyy|yy|y|M{1,4}|dd?|EEEE?|HH?|hh?|mm?|ss?|([.,])sss|a|Z{1,2}|ww|w|'(([^']+|'')*)'/g;
	// Token definition
	var definedTokens = {
		"y": {
			minLength: 1,
			maxLength: 4,
			max: 9999,
			min: 0,
			name: "year",
			type: "number"
		},
		"yy": {
			minLength: 2,
			maxLength: 2,
			name: "yearShort",
			type: "number"
		},
		"yyyy": {
			minLength: 4,
			maxLength: 4,
			max: 9999,
			min: 0,
			name: "year",
			type: "number"
		},
		"MMMM": {
			name: "month",
			type: "select",
			select: formats.MONTH
		},
		"MMM": {
			name: "month",
			type: "select",
			select: formats.SHORTMONTH
		},
		"MM": {
			minLength: 2,
			maxLength: 2,
			name: "month",
			type: "number"
		},
		"M": {
			minLength: 1,
			maxLength: 2,
			name: "month",
			type: "number",
			min: 1
		},
		"dd": {
			minLength: 2,
			maxLength: 2,
			name: "date",
			type: "number"
		},
		"d": {
			minLength: 1,
			maxLength: 2,
			name: "date",
			type: "number",
			min: 1
		},
		"EEEE": {
			name: "day",
			type: "select",
			select: fixDay(formats.DAY)
		},
		"EEE": {
			name: "day",
			type: "select",
			select: fixDay(formats.SHORTDAY)
		},
		"HH": {
			minLength: 2,
			maxLength: 2,
			name: "hour",
			type: "number"
		},
		"H": {
			minLength: 1,
			maxLength: 2,
			name: "hour",
			type: "number"
		},
		"hh": {
			minLength: 2,
			maxLength: 2,
			name: "hour12",
			type: "number"
		},
		"h": {
			minLength: 1,
			maxLength: 2,
			name: "hour12",
			type: "number"
		},
		"mm": {
			minLength: 2,
			maxLength: 2,
			name: "minute",
			type: "number"
		},
		"m": {
			minLength: 1,
			maxLength: 2,
			name: "minute",
			type: "number"
		},
		"ss": {
			minLength: 2,
			maxLength: 2,
			name: "second",
			type: "number"
		},
		"s": {
			minLength: 1,
			maxLength: 2,
			name: "second",
			type: "number"
		},
		"sss": {
			minLength: 3,
			maxLength: 3,
			name: "millisecond",
			type: "number"
		},
		"a": {
			name: "ampm",
			type: "select",
			select: formats.AMPMS
		},
		"ww": {
			minLength: 2,
			maxLength: 2,
			max: 53,
			name: "week",
			type: "number"
		},
		"w": {
			minLength: 1,
			maxLength: 2,
			max: 53,
			name: "week",
			type: "number"
		},
		"Z": {
			name: "timezone",
			type: "static"
		},
		"ZZ": {
			name: "timezone",
			type: "static",
			colon: true
		},
		"string": {
			name: "string",
			type: "static"
		}
	};

	var nameConf = {
		year: {
			extract: function extract(d) {
				// year might be negative
				var v = d.getFullYear() % 10000;
				return v >= 0 ? v : 0;
			},
			restore: function restore(d, v) {
				return d.setFullYear(v);
			},
			add: function add(d, v) {
				return d.setFullYear(d.getFullYear() + v);
			},
			prior: 7
		},
		yearShort: {
			extract: function extract(d) {
				var v = d.getFullYear() % 100;
				return v >= 0 ? v : v + 100;
			},
			restore: function restore(d, v) {
				return d.setFullYear(v);
			},
			add: function add(d, v) {
				return d.setFullYear(d.getFullYear() + v);
			},
			prior: 7
		},
		month: {
			extract: function extract(d) {
				return d.getMonth() + 1;
			},
			restore: function restore(d, v) {
				// http://stackoverflow.com/questions/14680396/the-date-getmonth-method-has-bug
				d.setMonth(v - 1);
				// handle date overflow
				if (d.getMonth() == v) {
					d.setDate(0);
				}
			},
			add: function add(d, v) {
				v = d.getMonth() + v;
				d.setMonth(v);
				// date overflow
				if (d.getMonth() == v + 1) {
					d.setDate(0);
				}
			},
			prior: 5
		},
		date: {
			extract: function extract(d) {
				return d.getDate();
			},
			restore: function restore(d, v) {
				return d.setDate(v);
			},
			add: function add(d, v) {
				return d.setDate(d.getDate() + v);
			},
			prior: 4
		},
		day: {
			extract: function extract(d) {
				return d.getDay() || 7;
			},
			restore: setDay,
			add: function add(d, v) {
				return d.setDate(d.getDate() + v);
			},
			prior: 4
		},
		hour: {
			extract: function extract(d) {
				return d.getHours();
			},
			restore: function restore(d, v) {
				return d.setHours(v);
			},
			add: function add(d, v) {
				return d.setHours(d.getHours() + v);
			},
			prior: 2
		},
		hour12: {
			extract: function extract(d) {
				return d.getHours() % 12 || 12;
			},
			restore: setHour12,
			add: function add(d, v) {
				return d.setHours(d.getHours() + v);
			},
			prior: 2
		},
		ampm: {
			extract: function extract(d) {
				return d.getHours() < 12 ? 1 : 2;
			},
			restore: setAmpm,
			add: function add(d, v) {
				return d.setHours(d.getHours() + v * 12);
			},
			prior: 3
		},
		minute: {
			extract: function extract(d) {
				return d.getMinutes();
			},
			restore: function restore(d, v) {
				return d.setMinutes(v);
			},
			add: function add(d, v) {
				return d.setMinutes(d.getMinutes() + v);
			},
			prior: 0
		},
		second: {
			extract: function extract(d) {
				return d.getSeconds();
			},
			restore: function restore(d, v) {
				return d.setSeconds(v);
			},
			add: function add(d, v) {
				return d.setSeconds(d.getSeconds() + v);
			},
			prior: 1
		},
		millisecond: {
			extract: function extract(d) {
				return d.getMilliseconds();
			},
			restore: function restore(d, v) {
				return d.setMilliseconds(v);
			},
			add: function add(d, v) {
				return d.setMilliseconds(d.getMilliseconds() + v);
			},
			prior: 1
		},
		week: {
			extract: getWeek,
			restore: function restore(d, v) {
				return d.setDate(d.getDate() + (v - getWeek(d)) * 7);
			},
			add: function add(d, v) {
				return d.setDate(d.getDate() + v * 7);
			},
			prior: 6
		}
	};

	// setup placeholder
	for (var name in nameConf) {
		nameConf[name].placeholder = datetimePlaceholder[name];
	}

	// setup tokens
	for (var _iterator = Object.values(definedTokens), _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
		var _ref;

		if (_isArray) {
			if (_i >= _iterator.length) break;
			_ref = _iterator[_i++];
		} else {
			_i = _iterator.next();
			if (_i.done) break;
			_ref = _i.value;
		}

		var tk = _ref;

		if (nameConf[tk.name]) {
			angular.extend(tk, nameConf[tk.name]);
		}
	}

	var SYS_TIMEZONE = function () {
		var offset = -new Date().getTimezoneOffset(),
		    sign = offset >= 0 ? "+" : "-",
		    absOffset = Math.abs(offset),
		    hour = Math.floor(absOffset / 60),
		    min = absOffset % 60;
		return sign + num2str(hour, 2, 2) + num2str(min, 2, 2);
	}();

	// Push Sunday to the end
	function fixDay(days) {
		var s = [],
		    i;
		for (i = 1; i < days.length; i++) {
			s.push(days[i]);
		}
		s.push(days[0]);
		return s;
	}

	// Split format into multiple tokens
	function createTokens(format) {
		var tokens = [],
		    pos = 0,
		    match;

		while (match = tokenRE.exec(format)) {
			if (match.index > pos) {
				// doesn't match any token, static string
				tokens.push(angular.extend({
					value: format.substring(pos, match.index)
				}, definedTokens.string));
				pos = match.index;
			}

			if (match.index == pos) {
				if (match[1]) {
					// sss
					tokens.push(angular.extend({
						value: match[1]
					}, definedTokens.string));
					tokens.push(definedTokens.sss);
				} else if (match[2]) {
					// escaped string
					tokens.push(angular.extend({
						value: match[2].replace("''", "'")
					}, definedTokens.string));
				} else if (definedTokens[match[0]].name == "timezone") {
					// static timezone
					var tz = SYS_TIMEZONE;
					if (definedTokens[match[0]].colon) {
						tz = insertColon(tz);
					}
					tokens.push(angular.extend({
						value: tz
					}, definedTokens[match[0]]));
				} else {
					// other tokens
					tokens.push(definedTokens[match[0]]);
				}
				pos = tokenRE.lastIndex;
			}
		}

		if (pos < format.length) {
			tokens.push(angular.extend({
				value: format.substring(pos)
			}, definedTokens.string));
		}

		return tokens;
	}

	function getWeek(date) {
		var yearStart = new Date(date.getFullYear(), 0, 1);

		var weekStart = new Date(yearStart.getTime());

		if (weekStart.getDay() > 4) {
			weekStart.setDate(weekStart.getDate() + (1 - weekStart.getDay()) + 7);
		} else {
			weekStart.setDate(weekStart.getDate() + (1 - weekStart.getDay()));
		}
		var diff = date.getTime() - weekStart.getTime();

		return Math.floor(diff / (7 * 24 * 60 * 60 * 1000));
	}

	// set the proper date value matching the weekday
	function setDay(date, day) {
		// we don't want to change month when changing date
		var month = date.getMonth(),
		    diff = day - (date.getDay() || 7);
		// move to correct date
		date.setDate(date.getDate() + diff);
		// check month
		if (date.getMonth() != month) {
			if (diff > 0) {
				date.setDate(date.getDate() - 7);
			} else {
				date.setDate(date.getDate() + 7);
			}
		}
	}

	function setHour12(date, hour) {
		hour = hour % 12;
		if (date.getHours() >= 12) {
			hour += 12;
		}
		date.setHours(hour);
	}

	function setAmpm(date, ampm) {
		var hour = date.getHours();
		if (hour < 12 == ampm > 1) {
			date.setHours((hour + 12) % 24);
		}
	}

	function insertColon(timezone) {
		if (timezone[3] == ":") {
			return timezone;
		}
		return timezone.substr(0, 3) + ":" + timezone.substr(3, 2);
	}

	function removeColon(timezone) {
		if (timezone[3] != ":") {
			return timezone;
		}
		return timezone.substr(0, 3) + timezone.substr(4, 2);
	}

	function offset(date, timezone) {
		timezone = removeColon(timezone);
		var hour = +timezone.substr(1, 2),
		    min = +timezone.substr(3, 2),
		    sig = timezone[0] + "1",
		    offset = (hour * 60 + min) * sig;

		return new Date(date.getTime() + (offset - -date.getTimezoneOffset()) * 60 * 1000);
	}

	function deoffset(date, timezone) {
		timezone = removeColon(timezone);
		var hour = +timezone.substr(1, 2),
		    min = +timezone.substr(3, 2),
		    sig = timezone[0] + "1",
		    offset = (hour * 60 + min) * sig;

		return new Date(date.getTime() + (-date.getTimezoneOffset() - offset) * 60 * 1000);
	}

	var DatetimeParser = function () {
		// Apply timezone offset
		function DatetimeParser(tp) {
			_classCallCheck(this, DatetimeParser);

			this.tp = tp;
			this.timezone = SYS_TIMEZONE;
			this.timezoneNodes = this.tp.nodes.filter(function (n) {
				return n.token.name == "timezone";
			});
		}

		DatetimeParser.prototype.parse = function parse(text) {
			this.tp.parse(text);
			return this;
		};

		DatetimeParser.prototype.getText = function getText() {
			return this.tp.getText();
		};

		DatetimeParser.prototype.setDate = function setDate(date, ignoreEmpty) {
			this.tp.setValue(offset(date, this.timezone), ignoreEmpty);
			return this;
		};

		DatetimeParser.prototype.getDate = function getDate() {
			return deoffset(this.tp.getValue(), this.timezone);
		};

		DatetimeParser.prototype.setTimezone = function setTimezone() {
			var timezone = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : SYS_TIMEZONE;

			if (timezone == this.timezone) {
				return;
			}
			var date = this.getDate();
			this.timezone = timezone;
			for (var _iterator2 = this.timezoneNodes, _isArray2 = Array.isArray(_iterator2), _i2 = 0, _iterator2 = _isArray2 ? _iterator2 : _iterator2[Symbol.iterator]();;) {
				var _ref2;

				if (_isArray2) {
					if (_i2 >= _iterator2.length) break;
					_ref2 = _iterator2[_i2++];
				} else {
					_i2 = _iterator2.next();
					if (_i2.done) break;
					_ref2 = _i2.value;
				}

				var n = _ref2;

				if (n.token.colon) {
					n.token.value = insertColon(timezone);
				} else {
					n.token.value = removeColon(timezone);
				}
			}
			return this.setDate(date, false);
		};

		DatetimeParser.prototype.isEmpty = function isEmpty() {
			return this.tp.isEmpty.apply(this.tp, arguments);
		};

		DatetimeParser.prototype.isInit = function isInit() {
			return this.tp.isInit.apply(this.tp, arguments);
		};

		DatetimeParser.prototype.unset = function unset() {
			this.tp.unset();
			return this;
		};

		return DatetimeParser;
	}();

	function createParser(format) {
		var tokens = createTokens(formats[format] || format),
		    yearCheck;

		if (tokens.some(function (t) {
			return t.name == "yearShort";
		})) {
			yearCheck = function yearCheck(fn) {
				return function (d) {
					fn.apply(this, arguments);
					var y = d.getFullYear();
					if (y < 0) {
						d.setFullYear(y + 100);
					}
				};
			};
		} else {
			yearCheck = function yearCheck(fn) {
				return function (d) {
					fn.apply(this, arguments);
					var y = d.getFullYear();
					if (y < 0) {
						d.setFullYear(0);
					}
					if (y > 9999) {
						d.setFullYear(9999);
					}
				};
			};
		}

		for (var _iterator3 = tokens, _isArray3 = Array.isArray(_iterator3), _i3 = 0, _iterator3 = _isArray3 ? _iterator3 : _iterator3[Symbol.iterator]();;) {
			var _ref3;

			if (_isArray3) {
				if (_i3 >= _iterator3.length) break;
				_ref3 = _iterator3[_i3++];
			} else {
				_i3 = _iterator3.next();
				if (_i3.done) break;
				_ref3 = _i3.value;
			}

			var tk = _ref3;

			if (tk.add) {
				tk.add = yearCheck(tk.add);
			}
			if (tk.restore) {
				tk.restore = yearCheck(tk.restore);
			}
		}

		var tp = new TextParser({
			tokens: tokens,
			value: new Date(),
			copyValue: function copyValue(o) {
				return new Date(o.getTime());
			}
		});

		return new DatetimeParser(tp);
	}

	return createParser;
}]);

