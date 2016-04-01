angular.module("datetime").factory("datetime", function($locale){
	// Fetch date and time formats from $locale service
	var formats = $locale.DATETIME_FORMATS;
	// Valid format tokens. 1=sss, 2=''
	var tokenRE = /yyyy|yy|y|M{1,4}|dd?|EEEE?|HH?|hh?|mm?|ss?|([.,])sss|a|Z{1,2}|ww|w|'(([^']+|'')*)'/g;
	// Token definition
	var definedTokens = {
		"y": {
			minLength: 1,
			maxLength: 4,
			min: 1,
			max: 9999,
			name: "year",
			type: "number"
		},
		"yy": {
			minLength: 2,
			maxLength: 2,
			min: 1,
			max: 99,
			name: "year",
			type: "number"
		},
		"yyyy": {
			minLength: 4,
			maxLength: 4,
			min: 1,
			max: 9999,
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
			min: 1,
			max: 12,
			name: "month",
			type: "number"
		},
		"M": {
			minLength: 1,
			maxLength: 2,
			min: 1,
			max: 12,
			name: "month",
			type: "number"
		},
		"dd": {
			minLength: 2,
			maxLength: 2,
			min: 1,
			max: 31,
			name: "date",
			type: "number"
		},
		"d": {
			minLength: 1,
			maxLength: 2,
			min: 1,
			max: 31,
			name: "date",
			type: "number"
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
			min: 0,
			max: 23,
			name: "hour",
			type: "number"
		},
		"H": {
			minLength: 1,
			maxLength: 2,
			min: 0,
			max: 23,
			name: "hour",
			type: "number"
		},
		"hh": {
			minLength: 2,
			maxLength: 2,
			min: 1,
			max: 12,
			name: "hour12",
			type: "number"
		},
		"h": {
			minLength: 1,
			maxLength: 2,
			min: 1,
			max: 12,
			name: "hour12",
			type: "number"
		},
		"mm": {
			minLength: 2,
			maxLength: 2,
			min: 0,
			max: 59,
			name: "minute",
			type: "number"
		},
		"m": {
			minLength: 1,
			maxLength: 2,
			min: 0,
			max: 59,
			name: "minute",
			type: "number"
		},
		"ss": {
			minLength: 2,
			maxLength: 2,
			min: 0,
			max: 59,
			name: "second",
			type: "number"
		},
		"s": {
			minLength: 1,
			maxLength: 2,
			min: 0,
			max: 59,
			name: "second",
			type: "number"
		},
		"sss": {
			minLength: 3,
			maxLength: 3,
			min: 0,
			max: 999,
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
			min: 0,
			max: 53,
			name: "week",
			type: "number"
		},
		"w": {
			minLength: 1,
			maxLength: 2,
			min: 0,
			max: 53,
			name: "week",
			type: "number"
		},
		"Z": {
			name: "timezone",
			type: "regex",
			regex: /[+-]\d{4}/
		},
		"ZZ": {
			name: "timezoneWithColon",
			type: "regex",
			regex: /[+-]\d{2}:\d{2}/
		},
		"string": {
			name: "string",
			type: "static"
		}
	};
	
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

	// Use localizable formats
	function getFormat(format) {
		return formats[format] || format;
	}

	function createNode(token, value) {
		return {
			token: definedTokens[token],
			value: value,
			viewValue: value || "",
			offset: 0,
			next: null,
			prev: null,
			id: null
		};
	}

	// Parse format to nodes
	function createNodes(format) {
		var nodes = [],
			pos = 0,
			match;

		while ((match = tokenRE.exec(format))) {

			if (match.index > pos) {
				nodes.push(createNode("string", format.substring(pos, match.index)));
				pos = match.index;
			}

			if (match.index == pos) {
				if (match[1]) {
					nodes.push(createNode("string", match[1]));
					nodes.push(createNode("sss"));
				} else if (match[2]) {
					nodes.push(createNode("string", match[2].replace("''", "'")));
				} else {
					nodes.push(createNode(match[0]));
				}
				pos = tokenRE.lastIndex;
			}
		}

		if (pos < format.length) {
			nodes.push(createNode("string", format.substring(pos)));
		}

		// Build relationship between nodes
		var i;
		for (i = 0; i < nodes.length; i++) {
			nodes[i].next = nodes[i + 1] || null;
			nodes[i].prev = nodes[i - 1] || null;
			nodes[i].id = i;
		}

		return nodes;
	}

	function getInteger(str, pos) {
		str = str.substring(pos);
		var match = str.match(/^\d+/);
		return match && match[0];
	}

	function getMatch(str, pos, pattern) {
		var i = 0,
			strQ = str.toUpperCase(),
			patternQ = pattern.toUpperCase();

		while (strQ[pos + i] && strQ[pos + i] == patternQ[i]) {
			i++;
		}

		return str.substr(pos, i);
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

	function num2str(num, minLength, maxLength) {
		var i;
		num = "" + num;
		if (num.length > maxLength) {
			num = num.substr(num.length - maxLength);
		} else if (num.length < minLength) {
			for (i = num.length; i < minLength; i++) {
				num = "0" + num;
			}
		}
		return num;
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

	function setText(node, date, token, timezone) {
		switch (token.name) {
			case "year":
				node.value = date.getFullYear();
				// it is possible
				if (node.value < 0) {
					node.value = 0;
				}
				break;
			case "month":
				node.value = date.getMonth() + 1;
				break;
			case "date":
				node.value = date.getDate();
				break;
			case "day":
				node.value = date.getDay() || 7;
				break;
			case "hour":
				node.value = date.getHours();
				break;
			case "hour12":
				node.value = date.getHours() % 12 || 12;
				break;
			case "ampm":
				node.value = date.getHours() < 12 ? 1 : 2;
				break;
			case "minute":
				node.value = date.getMinutes();
				break;
			case "second":
				node.value = date.getSeconds();
				break;
			case "millisecond":
				node.value = date.getMilliseconds();
				break;
			case "week":
				node.value = getWeek(date);
				break;
			case "timezone":
				node.value = removeColon(timezone || SYS_TIMEZONE);
				break;
			case "timezoneWithColon":
				node.value = insertColon(timezone || SYS_TIMEZONE);
				break;
		}

		switch (token.type) {
			case "number":
				node.viewValue = num2str(node.value, token.minLength, token.maxLength);
				break;
			case "select":
				node.viewValue = token.select[node.value - 1];
				break;
			default:
				node.viewValue = node.value + "";
		}
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

	function setDate(date, value, token) {
		switch (token.name) {
			case "year":
				date.setFullYear(value);
				break;
			case "month":
				// http://stackoverflow.com/questions/14680396/the-date-getmonth-method-has-bug
				date.setMonth(value - 1);
				// handle date overflow
				if (date.getMonth() == value) {
					date.setDate(0);
				}
				break;
			case "date":
				date.setDate(value);
				break;
			case "day":
				setDay(date, value);
				break;
			case "hour":
				date.setHours(value);
				break;
			case "hour12":
				setHour12(date, value);
				break;
			case "ampm":
				setAmpm(date, value);
				break;
			case "minute":
				date.setMinutes(value);
				break;
			case "second":
				date.setSeconds(value);
				break;
			case "millisecond":
				date.setMilliseconds(value);
				break;
			case "week":
				date.setDate(date.getDate() + (value - getWeek(date)) * 7);
				break;
		}

		if (date.getFullYear() < 0) {
			date.setFullYear(0);
		}
	}

	// Re-calculate offset
	function calcOffset(nodes) {
		var i, offset = 0;
		for (i = 0; i < nodes.length; i++) {
			nodes[i].offset = offset;
			offset += nodes[i].viewValue.length;
		}
	}

	// Parse text[pos:] by node.token definition. Extract result into node.value, node.viewValue
	function parseNode(node, text, pos) {
		var p = node, m, match, value, j;
		switch (p.token.type) {
			case "static":
				if (text.lastIndexOf(p.value, pos) != pos) {
					throw {
						code: "TEXT_MISMATCH",
						message: "Pattern value mismatch",
						text: text,
						node: p,
						pos: pos
					};
				}
				break;

			case "number":
				// Fail when meeting .sss
				value = getInteger(text, pos);
				if (value == null) {
					throw {
						code: "NUMBER_MISMATCH",
						message: "Invalid number",
						text: text,
						node: p,
						pos: pos
					};
				}
				if (value.length < p.token.minLength) {
					throw {
						code: "NUMBER_TOOSHORT",
						message: "The length of number is too short",
						text: text,
						node: p,
						pos: pos,
						match: value
					};
				}

				if (value.length > p.token.maxLength) {
					value = value.substr(0, p.token.maxLength);
				}

				if (+value < p.token.min) {
					throw {
						code: "NUMBER_TOOSMALL",
						message: "The number is too small",
						text: text,
						node: p,
						pos: pos,
						match: value
					};
				}

				if (value.length > p.token.minLength && value[0] == "0") {
					throw {
						code: "LEADING_ZERO",
						message: "The number has too many leading zero",
						text: text,
						node: p,
						pos: pos,
						match: value,
						properValue: num2str(+value, p.token.minLength, p.token.maxLength)
					};
				}

				// if (+value > p.token.max) {
					// throw {
						// code: "NUMBER_TOOLARGE",
						// message: "The number is too large",
						// text: text,
						// node: p,
						// pos: pos,
						// match: value,
						// properValue: num2str(p.token.max, p.token.minLength, p.token.maxLength)
					// };
				// }

				p.value = +value;
				p.viewValue = value;
				break;

			case "select":
				match = "";
				for (j = 0; j < p.token.select.length; j++) {
					m = getMatch(text, pos, p.token.select[j]);
					if (m && m.length > match.length) {
						value = j;
						match = m;
					}
				}
				if (!match) {
					throw {
						code: "SELECT_MISMATCH",
						message: "Invalid select",
						text: text,
						node: p,
						pos: pos
					};
				}

				if (match != p.token.select[value]) {
					throw {
						code: "SELECT_INCOMPLETE",
						message: "Incomplete select",
						text: text,
						node: p,
						pos: pos,
						match: match,
						selected: p.token.select[value]
					};
				}

				p.value = value + 1;
				p.viewValue = match;
				break;

			case "regex":
				m = node.token.regex.exec(text.substr(pos));
				if (!m || m.index != 0) {
					throw {
						code: "REGEX_MISMATCH",
						message: "Regex doesn't match",
						text: text,
						node: p,
						pos: pos
					};
				}
				p.value = m[0];
				p.viewValue = m[0];
				break;
		}
	}

	function addDate(date, token, diff) {
		var value;
		switch (token.name) {
			case "year":
				date.setFullYear(date.getFullYear() + diff);
				break;
			case "month":
				value = date.getMonth() + diff;
				date.setMonth(value);
				// date overflow
				if (date.getMonth() == value + 1) {
					date.setDate(0);
				}
				break;
			case "date":
			case "day":
				date.setDate(date.getDate() + diff);
				break;
			case "hour":
			case "hour12":
				date.setHours(date.getHours() + diff);
				break;
			case "ampm":
				date.setHours(date.getHours() + diff * 12);
				break;
			case "minute":
				date.setMinutes(date.getMinutes() + diff);
				break;
			case "second":
				date.setSeconds(date.getSeconds() + diff);
				break;
			case "millisecond":
				date.setMilliseconds(date.getMilliseconds() + diff);
				break;
			case "week":
				date.setDate(date.getDate() + diff * 7);
				break;
		}
	}
	
	// Main parsing loop. Loop through nodes, parse text, update date model.
	function parseLoop(nodes, text, date) {
		var i, pos, errorBuff, oldViewValue, dateBuff;

		pos = 0;
		// baseDate = new Date(date.getTime());

		for (i = 0; i < nodes.length; i++) {
			oldViewValue = nodes[i].viewValue;
			try {
				parseNode(nodes[i], text, pos);
			} catch (err) {
				if (err.code == "NUMBER_TOOSHORT" || err.code == "NUMBER_TOOSMALL" || err.code == "LEADING_ZERO") {
					errorBuff = err;
					pos += err.match.length;
					continue;
				} else {
					throw err;
				}
			}
			pos += nodes[i].viewValue.length;
			
			if (oldViewValue != nodes[i].viewValue) {
				// Buff date
				if (nodes[i].token.name == "date") {
					dateBuff = nodes[i];
				} else {
					setDate(date, nodes[i].value, nodes[i].token);
				}
			}
		}
		
		if (text.length > pos) {
			throw {
				code: "TEXT_TOOLONG",
				message: "Text is too long",
				text: text,
				pos: pos
			};
		}

		if (errorBuff) {
			throw errorBuff;
		}
		
		if (dateBuff) {
			setDate(date, dateBuff.value, dateBuff.token);
		}
	}
	
	function deOffsetDate(date, timezone) {
		timezone = removeColon(timezone);
		var hour = +timezone.substr(1, 2),
			min = +timezone.substr(3, 2),
			sig = (timezone[0] + "1"),
			offset = (hour * 60 + min) * sig;
		
		return new Date(date.getTime() + (-date.getTimezoneOffset() - offset) * 60 * 1000);
	}
	
	function offsetDate(date, timezone) {
		timezone = removeColon(timezone);
		var hour = +timezone.substr(1, 2),
			min = +timezone.substr(3, 2),
			sig = (timezone[0] + "1"),
			offset = (hour * 60 + min) * sig;
			
		return new Date(date.getTime() + (offset - -date.getTimezoneOffset()) * 60 * 1000);
	}

	function updateText(nodes, date, timezone){
		var i, node;
		for (i = 0; i < nodes.length; i++) {
			node = nodes[i];

			setText(node, date, node.token, timezone);
		}
		calcOffset(nodes);
	}
	
	function createParser(format) {

		format = getFormat(format);

		var nodes = createNodes(format);

		var parser = {
			parse: function(text) {
				var oldDate = parser.date,
					date = new Date(oldDate.getTime()),
					oldText = parser.getText(),
					newText;

				if (!text) {
					throw {
						code: "EMPTY",
						message: "The input is empty",
						oldText: oldText
					};
				}

				try {
					parseLoop(parser.nodes, text, date);
					updateText(parser.nodes, date, parser.timezoneNode && parser.timezoneNode.viewValue);
					newText = parser.getText();
					if (text != newText) {
						throw {
							code: "INCONSISTENT_INPUT",
							message: "Successfully parsed but the output text doesn't match the input",
							text: text,
							oldText: oldText,
							properText: newText
						};
					}
				} catch (err) {
					// Should we reset date object if failed to parse?
					// parser.setDate(oldDate);
					updateText(parser.nodes, oldDate, parser.timezone);
					throw err;
				}
				
				// check if Z token exists
				if (parser.timezoneNode) {
					parser.setTimezone(parser.timezoneNode.viewValue);
				}

				// de-offset and save to model
				parser.date = date;
				if (parser.timezone) {
					parser.model = deOffsetDate(date, parser.timezone);
				} else {
					parser.model = new Date(date.getTime());
				}
				
				return parser;
			},
			nodeParseValue: function(node, text) {
				var date = parser.date,
					oldValue = node.value,
					oldViewValue = node.viewValue;
				try {
					parseNode(node, text, 0);
					calcOffset(parser.nodes);
				} catch (err) {
					node.value = oldValue;
					node.viewValue = oldViewValue;
					throw err;
				}
				setDate(date, node.value, node.token);
				updateText(parser.nodes, date, parser.timezone);
				if (parser.timezone) {
					parser.model = deOffsetDate(date, parser.timezone);
				} else {
					parser.model = new Date(date.getTime());
				}
				return parser;
			},
			nodeAddValue: function(node, diff) {
				var date = parser.date;
				addDate(date, node.token, diff);
				updateText(parser.nodes, date, parser.timezone);
				if (parser.timezone) {
					parser.model = deOffsetDate(date, parser.timezone);
				} else {
					parser.model = new Date(date.getTime());
				}
				return parser;
			},
			setDate: function(date){
				parser.model = new Date(date.getTime());
				if (parser.timezone) {
					parser.date = offsetDate(date, parser.timezone);
				} else {
					parser.date = new Date(date.getTime());
				}
				updateText(parser.nodes, parser.date, parser.timezone);
				return parser;
			},
			getDate: function(){
				return parser.model;
			},
			getText: function(timezone){
				// FIXME: getting text from different timezone shouldn't change original text.
				if (timezone) {
					updateText(parser.nodes, offsetDate(parser.model, timezone), timezone);
				}
				var i, text = "";
				for (i = 0; i < parser.nodes.length; i++) {
					text += parser.nodes[i].viewValue;
				}
				return text;
			},
			setTimezone: function(timezone){
				if (timezone && timezone != parser.timezone) {
					parser.timezone = timezone;
					parser.date = offsetDate(parser.model, timezone);
					updateText(parser.nodes, parser.date, timezone);
				}
			},
			date: null,
			model: null,
			format: format,
			nodes: nodes,
			timezone: null,
			timezoneNode: null
		};

		// get timezone node
		var node = parser.nodes[0];
		while (node) {
			if (node.token.name == "timezone" || node.token.name == "timezoneWithColon") {
				parser.timezoneNode = node;
				break;
			}
			node = node.next;
		}
		
		parser.setDate(new Date());
		
		return parser;
	}

	return createParser;
});
