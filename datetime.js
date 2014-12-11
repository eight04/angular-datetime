"use strict";

angular.module("datetime", []).factory("datetime", function($locale){

	function isNumber(str) {
		var charCode = str.charCodeAt(0);
		if (charCode >= 48 && charCode <= 57) {
			return true;
		}
		return false;
	}

	function getInteger(string, startPoint, minLength, maxLength) {
		var i;
		for (i = 0; i < minLength; i++) {
			if (!isNumber(string[startPoint + i])) {
				return null;
			}
		}
		for (; i < maxLength; i++) {
			if (!isNumber(string[startPoint + i])) {
				break;
			}
		}
		return string.substr(startPoint, i);
	}

	function getMatch(string, pattern, pos) {
		var i = 0;
		while (i + pos < string.length && i < pattern.length && string[pos + i].toUpperCase() == pattern[i].toUpperCase()) {
			i++;
		}
		return string.substr(pos, i);
	}

	function getTimezone(date) {
		var tz = date.getTimezoneOffset(), text = "";
		text += tz <= 0 ? "+" : "-";
		text += zpad(Math.floor(Math.abs(tz) / 60), 2);
		text += zpad(Math.abs(tz) % 60, 2);
		return text;
	}

	// Fetch date and time formats from $locale service
	var formats = $locale.DATETIME_FORMATS;

	// Valid format tokens. 1=sss, 2=''
	var tokenRE = /yyyy|yy|y|M{1,4}|dd?|EEEE?|HH?|hh?|mm?|ss?|([.,])sss|a|Z|ww|w|'(([^']+|'')*)'/g;

	var node = {
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
			select: formats.DAY
		},
		"EEE": {
			name: "day",
			type: "select",
			select: formats.SHORTDAY
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
		"milliPrefix": {
			name: "milliPrefix",
			type: "regex",
			regex: /[,.]/
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
		"string": {
			name: "string",
			type: "static"
		}
	};

	function zpad(n, len){
		n = n.toString();
		if (n.length >= len) {
			return n;
		}
		return Array(len - n.length + 1).join("0") + n;
	}

	function limitLength(str, len) {
		if (str.length <= len) {
			return str;
		}
		return str.substr(str.length - len);
	}

	function increase(){
		if (this.type == "select") {
			if (this.realValue == null) {
				this.realValue = 1;
			} else {
				this.realValue = this.realValue % this.select.length + 1;
			}
			this.value = this.select[this.realValue - 1];
			return;
		} else if (this.type == "number") {
			if (this.realValue == null || this.realValue >= this.max) {
				this.realValue = this.min;
			} else {
				this.realValue += 1;
			}
			this.value = zpad(this.realValue, this.minLength);
		}
	}

	function decrease(){
		if (this.type == "select") {
			if (this.realValue == null) {
				this.realValue = this.select.length;
			} else {
				this.realValue = (this.realValue - 1) || this.select.length;
			}
			this.value = this.select[this.realValue - 1];
			return;
		} else if (this.type == "number") {
			if (!this.realValue || this.realValue <= this.min) {
				this.realValue = this.max;
			} else {
				this.realValue -= 1;
			}
			this.value = zpad(this.realValue, this.minLength);
		}
	}

	function set(value){
		var i;
		if (this.type == "select") {
			if (typeof value == "string") {
				for (i = 0; i < this.select.length; i++) {
					if (this.select[i] == value) {
						value = i;
						break;
					}
				}
				if (i == this.select.length) {
					throw "Can't find select matching " + value;
				}
			}
			this.realValue = value;
			this.value = this.select[value - 1];

		} else if (this.type == "number") {
			this.realValue = value;
			this.value = limitLength(zpad(value, this.minLength), this.maxLength);

		} else if (this.type == "regex") {
			if (!this.regex.test(value)) {
				throw "Regex " + this.regex.pattern + " dosn't match value " + value;
			}
			this.realValue = value;
			this.value = value;
		}
	}

	function createNode(name, value){
		return {
			offset: null,
			name: node[name].name,
			type: node[name].type,
			minLength: node[name].minLength,
			maxLength: node[name].maxLength,
			min: node[name].min,
			max: node[name].max,
			select: node[name].select,
			regex: node[name].regex,
			value: value,
			realValue: null,
			increase: increase,
			decrease: decrease,
			set: set
		};
	}

	function getParser(format) {
		var nodes = [],
			match,
			pos = 0;

		if (formats[format]) {
			format = formats[format];
		}

		// Parse format to nodes
		while (true) {
			match = tokenRE.exec(format);

			if (!match) {
				if (pos < format.length) {
					nodes.push(createNode("string", format.substring(pos)));
				}
				break;
			}

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

		// Build relationship between nodes
		var i;
		for (i = 0; i < nodes.length; i++) {
			nodes[i].next = nodes[i + 1] || null;
			nodes[i].prev = nodes[i - 1] || null;
		}

		// Create parser
		var parser = {
			parse: function(val){
				var i, j, pos, m, match, value;

				pos = 0;
				for (i = 0; i < nodes.length; i++) {
					var p = nodes[i];

					switch (p.type) {
						case "static":
							if (val.lastIndexOf(p.value, pos) != pos) {
								throw ['Pattern value mismatch', p, val, pos];
							}
							p.offset = pos;
							pos += p.value.length;
							break;

						case "number":
							// Fail when meeting .sss
							value = getInteger(val, pos, p.minLength, p.maxLength);
							if (value == null) {
								throw "Invalid number";
							}
							p.offset = pos;
							p.realValue = +value;
							p.value = value;
							pos += p.value.length;
							break;

						case "select":
							match = "";
							for (j = 0; j < p.select.length; j++) {
								m = getMatch(val, p.select[j], pos);
								if (m && m.length > match.length) {
									value = j;
									match = m;
								}
							}
//							console.log(match, match && p.select[value]);
							if (!match) {
								throw "Invalid select";
							}
							p.offset = pos;
							p.value = match;
							p.realValue = value + 1;
							pos += p.value.length;
							break;

						case "regex":
							m = p.regex.exec(val.substr(pos));
							if (!m || m.index != 0) {
								throw "Regex doesn't match";
							}
							p.offset = pos;
							p.value = m[0];
							p.realValue = m[0];
							pos += p.value.length;
							break;
					}
				}
			},
			setDate: function(date) {
				var i, p;
				this.date = date;
				for (i = 0; i < this.nodes.length; i++) {
					p = this.nodes[i];
					switch (p.name) {
						case "year":
							p.set(date.getFullYear());
							break;

						case "month":
							p.set(date.getMonth() + 1);
							break;

						case "date":
							p.set(date.getDate());
							break;

						case "day":
							p.set((date.getDay() + 1) % 7 || 7);
							break;

						case "hour":
							p.set(date.getHours());
							break;

						case "minute":
							p.set(date.getMinutes());
							break;

						case "second":
							p.set(date.getSeconds());
							break;

						case "millisecond":
							p.set(date.getMilliseconds());
							break;

						case "ampm":
							p.set(date.getHours() < 12 ? 1 : 2);
							break;

						case "hour12":
							p.set(date.getHours() % 12 || 12);
							break;

						case "timezone":
							p.set(getTimezone(date));
					}
				}

				// Re-calc offset
				var pos = 0;
				for (i = 0; i < this.nodes.length; i++) {
					this.nodes[i].offset = pos;
					pos += this.nodes[i].value.length;
				}
			},
			format: format,
			nodes: nodes,
			getNodeFromPos: function(pos, pos2){
				var i, p, q;

				if (!pos) {
					return nodes[0];
				}
				for (i = 0; i < nodes.length; i++) {
					p = nodes[i].offset;
					q = nodes[i].offset + nodes[i].value.length;

					if (p < pos && q > pos && p < pos2 && q > pos2) {
						return nodes[i];
					} else if (nodes[i].type != "static" && (p <= pos && pos <= q && p <= pos2 && pos2 <= q)) {
						return nodes[i];
					}
				}

				return nodes[i - 1];
			},
			getDate: function(){
				var ampm, hour12, i, p, value, now = this.date;
				for (i = 0; i < this.nodes.length; i++) {
					p = this.nodes[i];
					switch (p.name) {
						case "year":
							now.setFullYear(p.realValue);
							break;

						case "month":
							now.setMonth(p.realValue - 1);
							break;

						case "date":
							now.setDate(p.realValue);
							break;

						case "hour":
							now.setHours(p.realValue);
							break;

						case "minute":
							now.setMinutes(p.realValue);
							break;

						case "second":
							now.setSeconds(p.realValue);
							break;

						case "millisecond":
							now.setMilliseconds(p.realValue);
							break;

						case "ampm":
							ampm = p;
							break;

						case "hour12":
							hour12 = p;
							break;
					}
				}
				if (ampm && hour12) {
					if (ampm.realValue == 1) {
						value = hour12.realValue % 12;
					} else {
						value = hour12.realValue % 12 + 12;
					}
					now.setHours(value);
				}

				return now;
			},
			getText: function(){
				var i, text = "";
				for (i = 0; i < this.nodes.length; i++) {
					text += this.nodes[i].value;
				}
				return text;
			},
			date: new Date()
		};

		return parser;
	}

	return getParser;

}).directive("datetime", function(datetime){

	function getInputSelection(input) {
		if (input.selectionStart != undefined && input.selectionEnd != undefined) {
			return {
				start: input.selectionStart,
				end: input.selectionEnd
			};
		}
		if (document.selection) {
			var bookmark = document.selection.createRange().getBookmark();
			var range = input.createTextRange();
			var range2 = range.duplicate();
			range.moveToBookmark(bookmark);
			range2.setEndPoint("EndToStart", range);

			var start = range2.text.length;
			var end = start + range.text.length;
			return {
				start: start,
				end: end
			};
		}
	}

	function setInputSelection(input, range) {
		if (input.setSelectionRange) {
			input.setSelectionRange(range.start, range.end);
		} else if (input.createTextRange) {
			var select = input.createTextRange();
			select.moveStart("character", range.start);
			select.collapse();
			select.moveEnd("character", range.end - range.start);
			select.select();
		}
	}

	function selectNode(input, node) {
		setInputSelection(input, {
			start: node.offset,
			end: node.offset + node.value.length
		});
	}

	function printable(keyCode) {
		var valid =
			(keyCode > 47 && keyCode < 58)   || // number keys
			keyCode == 32 || keyCode == 13   || // spacebar & return key(s) (if you want to allow carriage returns)
			(keyCode > 64 && keyCode < 91)   || // letter keys
			(keyCode > 95 && keyCode < 112)  || // numpad keys
			(keyCode > 185 && keyCode < 193) || // ;=,-./` (in order)
			(keyCode > 218 && keyCode < 223) || // [\]' (in order)
			keyCode == 8 || // Backspace
			keyCode == 46;	// Delete

		return valid;
	}

	function numberKey(keyCode) {
		return keyCode > 47 && keyCode < 58 || keyCode > 95 && keyCode < 112;
	}

	function makeRealValue(parser) {
		var i, p, pos = 0;
		for (i = 0; i < parser.nodes.length; i++) {
			p = parser.nodes[i];
			p.set(p.realValue);
			p.offset = pos;
			pos += p.value.length;
		}
	}

	return {
		restrict: "A",
		require: "ngModel",
		link: function(scope, element, attrs, ngModel){
			var parser = datetime(attrs.datetime), node;

			ngModel.$render = function(){
				var selection = getInputSelection(element[0]);
				element.val(ngModel.$viewValue);
				setInputSelection(element[0], selection);
			};

			element.on("$destroy", function(){
				parser = null;
			});

			ngModel.$parsers.push(function(viewValue){
				if (!parser) {
					return undefined;
				}
				try {
					parser.parse(viewValue);
				} catch (e) {
					return undefined;
				}
				// Create new date to make Angular notice the different...
				return new Date(parser.getDate().getTime());
			});

			ngModel.$formatters.push(function(modelValue){
				if (!modelValue) {
					return undefined;
				}
				parser.setDate(modelValue);
				return parser.getText();
			});

			element.on("focus keydown click", function(e){
				var selection = getInputSelection(e.target);
				node = parser.getNodeFromPos(selection.start, selection.end);

				if (e.type == "focus" || e.type == "click") {
					e.preventDefault();
					selectNode(e.target, node);
				}

				if (e.type == "keydown") {

					if (e.keyCode == 37) {
						// left
						e.preventDefault();

						var pre = node.prev;
						while (pre && pre.type == "static") {
							pre = pre.prev;
						}

						if (pre) {
							selectNode(e.target, pre);
						} else {
							selectNode(e.target, node);
						}
					} else if (e.keyCode == 39) {
						// right
						e.preventDefault();

						var next = node.next;
						while (next && next.type == "static") {
							next = next.next;
						}

						if (next) {
							selectNode(e.target, next);
						} else {
							selectNode(e.target, node);
						}
					} else if (e.keyCode == 38) {
						// up
						e.preventDefault();
						scope.$evalAsync(function(){
							node.increase();
							ngModel.$setViewValue(parser.getText());
							ngModel.$render();
							selectNode(element[0], node);
						});

					} else if (e.keyCode == 40) {
						// down
						e.preventDefault();
						scope.$evalAsync(function(){
							node.decrease();
							ngModel.$setViewValue(parser.getText());
							ngModel.$render();
							selectNode(element[0], node);
						});

					} else if (node.type == "static" || node.type == "regex") {
						// Key list from stackoverflow: http://x.co/606xD
						if (printable(e.keyCode)) {
							e.preventDefault();
						}
					} else if (node.type == "number") {
						if (printable(e.keyCode) && !numberKey(e.keyCode)) {
							e.preventDefault();
						}
					} else if (node.type == "select") {
						if (printable(e.keyCode)) {
							scope.$evalAsync(function(){
								makeRealValue(parser);
								ngModel.$setViewValue(parser.getText());
								ngModel.$render();
							});
						}
					}
				}
			});
		}
	};
});

/*

some operation:

left:
	on select -> select pre word
	on word left bound -> go to pre word

right:
	on select -> select next word
	on word right bound -> go to next word

up:
	on word -> add word value

down:
	on word -> minor word value

focus:
	on word -> select word

click:
	on select -> deselect

	on word -> select word

back:
	on word ->
		word is number ->
			in word -> remove one digit
			on word left bound -> set to zero, select word
		word is string -> remove word

insert:
	on select whole word ->
		word is number -> remove word, move to word right bound, insert
		word is string -> remove word, insert

	on select part ->
		word is number -> remove select, move to select left bound, insert
		word is string -> remove select, move to select left bound, insert

	on word right bound ->
		word is number -> remove word left bound, insert

	word is number -> remove a character, move right

	word is string -> insert

	*/


// document.addEventListener("DOMContentLoaded", function(){
	// var element = document.querySelector(".datetime");

	// element.addEventListener("focus", datetime);
	// element.addEventListener("keydown", datetime);
// });
