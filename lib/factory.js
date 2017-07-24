angular.module("datetime").factory("datetime", function($locale, datetimePlaceholder){
	var { TextParser, utils: { num2str } } = require("custom-input");
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
			extract: d => {
				// year might be negative
				var v = d.getFullYear() % 10000;
				return v >= 0 ? v : 0;
			},
			restore: (d, v) => d.setFullYear(v),
			add: (d, v) => d.setFullYear(d.getFullYear() + v),
			prior: 7
		},
		yearShort: {
			extract: d => {
				var v = d.getFullYear() % 100;
				return v >= 0 ? v : v + 100;
			},
			restore: (d, v) => d.setFullYear(v),
			add: (d, v) => d.setFullYear(d.getFullYear() + v),
			prior: 7
		},
		month: {
			extract: d => d.getMonth() + 1,
			restore: (d, v) => {
				// http://stackoverflow.com/questions/14680396/the-date-getmonth-method-has-bug
				d.setMonth(v - 1);
				// handle date overflow
				if (d.getMonth() == v) {
					d.setDate(0);
				}
			},
			add: (d, v) => {
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
			extract: d => d.getDate(),
			restore: (d, v, p) => {
				// handle overflowed day
				var oldMonth = d.getMonth();
				d.setDate(v);
				if (d.getMonth() != oldMonth && v <= 31) {
					var monthNodes = p.getNodes("month");
					if (monthNodes && monthNodes.every(n => n.empty)) {
						d.setDate(v);
					}
				}
			},
			add(d, v, p) {
				this.restore(d, d.getDate() + v, p);
			},
			prior: 4
		},
		day: {
			extract: d => d.getDay() || 7,
			restore: setDay,
			add: (d, v) => d.setDate(d.getDate() + v),
			prior: 4
		},
		hour: {
			extract: d => d.getHours(),
			restore: (d, v) => d.setHours(v),
			add: (d, v) => d.setHours(d.getHours() + v),
			prior: 2
		},
		hour12: {
			extract: d => d.getHours() % 12 || 12,
			restore: setHour12,
			add: (d, v) => d.setHours(d.getHours() + v),
			prior: 2
		},
		ampm: {
			extract: d => d.getHours() < 12 ? 1 : 2,
			restore: setAmpm,
			add: (d, v) => d.setHours(d.getHours() + v * 12),
			prior: 3
		},
		minute: {
			extract: d => d.getMinutes(),
			restore: (d, v) => d.setMinutes(v),
			add: (d, v) => d.setMinutes(d.getMinutes() + v),
			prior: 0
		},
		second: {
			extract: d => d.getSeconds(),
			restore: (d, v) => d.setSeconds(v),
			add: (d, v) => d.setSeconds(d.getSeconds() + v),
			prior: 1
		},
		millisecond: {
			extract: d => d.getMilliseconds(),
			restore: (d, v) => d.setMilliseconds(v),
			add: (d, v) => d.setMilliseconds(d.getMilliseconds() + v),
			prior: 1
		},
		week: {
			extract: getWeek,
			restore: (d, v) => d.setDate(d.getDate() + (v - getWeek(d)) * 7),
			add: (d, v) => d.setDate(d.getDate() + v * 7),
			prior: 6
		}
	};
	
	// setup placeholder
	for (var name in nameConf) {
		nameConf[name].placeholder = datetimePlaceholder[name];
	}
	
	// setup tokens
	for (var tk of Object.values(definedTokens)) {
		if (nameConf[tk.name]) {
			angular.extend(tk, nameConf[tk.name]);
		}
	}
	
	var SYS_TIMEZONE = (function(){
		var offset = -(new Date).getTimezoneOffset(),
			sign = offset >= 0 ? "+" : "-",
			absOffset = Math.abs(offset),
			hour = Math.floor(absOffset / 60),
			min = absOffset % 60;
		return sign + num2str(hour, 2, 2) + num2str(min, 2, 2);
	})();

	// Push Sunday to the end
	function fixDay(days) {
		var s = [], i;
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
			
		while ((match = tokenRE.exec(format))) {
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
		if ((hour < 12) == (ampm > 1)) {
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
			sig = (timezone[0] + "1"),
			offset = (hour * 60 + min) * sig;
			
		return new Date(date.getTime() + (offset - -date.getTimezoneOffset()) * 60 * 1000);
	}
	
	function deoffset(date, timezone) {
		timezone = removeColon(timezone);
		var hour = +timezone.substr(1, 2),
			min = +timezone.substr(3, 2),
			sig = (timezone[0] + "1"),
			offset = (hour * 60 + min) * sig;
		
		return new Date(date.getTime() + (-date.getTimezoneOffset() - offset) * 60 * 1000);
	}
	
	class DatetimeParser {
		// Apply timezone offset
		constructor(tp) {
			this.tp = tp;
			this.timezone = SYS_TIMEZONE;
			this.timezoneNodes = this.tp.nodes.filter(n => n.token.name == "timezone");
		}
		parse(text) {
			this.tp.parse(text);
			return this;
		}
		getText() {
			return this.tp.getText();
		}
		setDate(date, ignoreEmpty) {
			this.tp.setValue(offset(date, this.timezone), ignoreEmpty);
			return this;
		}
		getDate() {
			return deoffset(this.tp.getValue(), this.timezone);
		}
		setTimezone(timezone = SYS_TIMEZONE) {
			if (timezone == this.timezone) {
				return;
			}
			var date = this.getDate();
			this.timezone = timezone;
			for (var n of this.timezoneNodes) {
				if (n.token.colon) {
					n.token.value = insertColon(timezone);
				} else {
					n.token.value = removeColon(timezone);
				}
			}
			return this.setDate(date, false);
		}
		isEmpty() {
			return this.tp.isEmpty.apply(this.tp, arguments);
		}
		isInit() {			
			return this.tp.isInit.apply(this.tp, arguments);
		}
		unset() {
			this.tp.unset();
			return this;
		}
	}
	
	function createParser(format) {
		var tokens = createTokens(formats[format] || format),
			yearCheck;
			
		if (tokens.some(t => t.name == "yearShort")) {
			yearCheck = function(fn) {
				return function(d) {
					fn.apply(this, arguments);
					var y = d.getFullYear();
					if (y < 0) {
						d.setFullYear(y + 100);
					}
				};
			};
		} else {
			yearCheck = function(fn) {
				return function(d) {
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
		
		for (var tk of tokens) {
			if (tk.add) {
				tk.add = yearCheck(tk.add);
			}
			if (tk.restore) {
				tk.restore = yearCheck(tk.restore);
			}
		}
		
		var tp = new TextParser({
			tokens: tokens,
			value: new Date,
			copyValue: o => new Date(o.getTime())
		});
		
		return new DatetimeParser(tp);
	}

	return createParser;
});
