"use strict";

function getInteger(string, startPoint, minLength, maxLength) {
	var i;
	for (i = 0; i < minLength; i++) {
		if (isNaN(string[startPoint + i])) {
			return null;
		}
	}
	for (; i < maxLength; i++) {
		if (isNaN(string[startPoint + i])) {
			break;
		}
	}
	return +string.substr(startPoint, i);
}

function getMatch(string, pattern, pos) {
	var i = 0;
	while (i + pos < string.length && i < pattern.length && string[pos + i].toUpperCase() == pattern[i].toUpperCase()) {
		i++;
	}
	return string.substr(pos, i);
}

function selectNode(input, node) {
	input.setSelectionRange(node.offset, node.next ? node.next.offset : input.value.length);
}

angular.module("datetime", []).factory("datetimeParser", function($locale){
	function escapeRE(str){
		return str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
	}

	// Fetch date and time formats from $locale service
	var formats = $locale.DATETIME_FORMATS;

	// Build regex matches
	var re = {
		AMPMS: angular.copy(formats.DAY),
		DAY: angular.copy(formats.DAY),
		MONTH: angular.copy(formats.MONTH),
		SHORTDAY: angular.copy(formats.SHORTDAY),
		SHORTMONTH: angular.copy(formats.SHORTMONTH)
	};
	var key, i;
	for (key in re) {
		for (i = 0; i < re[key].length; i++) {
			re[key][i] = escapeRE(re[key][i]);
		}
		re[key] = new RegExp(re[key].join("|"));
	}
	// Arrays of month and day names
//	 var monthNames = datetimeFormats.MONTH,
//		 monthShortNames = datetimeFormats.SHORTMONTH,
//		 dayNames = datetimeFormats.DAY,
//		 dayShortNames = datetimeFormats.SHORTDAY;


	// Valid format tokens. 1=sss, 2=''
	var tokenRE = /yyyy|yy|y|M{1,4}|dd?|EEEE?|HH?|hh?|mm?|ss?|[.,](sss)|a|Z|ww|w|'(([^']+|'')*)'/g;

	var node = {
		"y": {
			minLength: 1,
			maxLength: 4,
			name: "year",
			type: "number"
		},
		"yy": {
			minLength: 2,
			maxLength: 2,
			name: "year",
			type: "number"
		},
		"yyyy": {
			minLength: 4,
			maxLength: 4,
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
			type: "number"
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
			name: "week",
			type: "number"
		},
		"w": {
			minLength: 1,
			maxLength: 2,
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

	function increase(){
		if (this.type == "string") {
			return;
		}
		if (this.type == "select") {
			if (this.realValue == null) {
				this.realValue = this.select.length - 1;
			}
			this.realValue = (this.realValue + 1) % this.select.length;
			this.value = this.select[this.realValue];
			return;
		}
		if (this.type == "number") {
			this.realValue -= 1;
			this.value = this.realValue.toString();
		}
	}

	function decrease(){
		if (this.type == "string") {
			return;
		}
		if (this.type == "select") {
			if (this.realValue == null) {
				this.realValue = 0;
			}
			this.realValue = (this.realValue - 1 + this.select.length) % this.select.length;
			this.value = this.select[this.realValue];
			return;
		}
		if (this.type == "number") {
			this.realValue += 1;
			this.value = this.realValue.toString();
		}
	}

	function set(value){
		var i;
		if (this.type == "string") {
			return;
		}
		if (typeof value == "string") {
			if (this.type != "select") {
				throw "You can't use set string value on numeric node";
			}

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
		if (this.type == "select") {
			this.realValue = value;
			this.value = this.select[value];
		} else if (this.type == "number") {
			this.realValue = value;
			this.value = value.toString();
		} else {
			throw "Unknown node type " + this.type;
		}
	}

	function createNode(name, value){
		return {
			offset: null,
			name: node[name].name,
			type: node[name].type,
			minLength: node[name].minLength,
			maxLength: node[name].maxLength,
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

		// Parse format to nodes
		while (true) {
			match = tokenRE.exec(format);

			if (!match) {
				if (pos < format.length) {
					nodes.push(createNode("string", format.substring(pos)))
				}
				break;
			}

			if (match.index > pos) {
				nodes.push(craeteNode("string", format.substring(pos, match.index)));
				pos = match.index;
			}

			if (match.index == pos) {
				if (match[1]) {
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
			parse: function(val, defaultDate){
				var now = new Date(defaultDate.getTime()),
					year = now.getFullYear(),
					month = now.getMonth() + 1,
					date = now.getDate(),
					hh = now.getHours(),
					mm = now.getMinutes(),
					ss = now.getSeconds(),
					sss = now.getMilliseconds(),
					i, j, pos;

				pos = 0;
				for (i = 0; i < nodes.length; i++) {
					var p = nodes[i];

					switch (p.type) {
						case "static":
							if (val.lastIndexOf(p.value, pos) != pos) {
								throw 'Pattern value mismatch';
							}
							p.offset = pos;
							pos += p.value.length;
							break;

						case "number":
							value = getInteger(val, pos, p.minLength, p.maxLength);
							if (value == null) {
								throw "Invalid number";
							}
							p.realValue = value;
							p.value = value.toString();
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
							if (!match) {
								throw "Invalid select";
							}
							p.value = match;
							p.realValue = value;
							break;

						case "Z":
							parsedZ = true;

							if (val[pos] === 'Z') {
								z = 0;

								pos += 1;
							} else if (val[pos + 3] === ':') {
								var tzStr = val.substr(pos, 6);

								z = (parseInt(tzStr.substr(0, 3), 10) * 60) + parseInt(tzStr.substr(4, 2), 10);

								pos += 6;
							} else {
								var tzStr = val.substring(pos, 5);

								z = (parseInt(tzStr.substr(0, 3), 10) * 60) + parseInt(tzStr.substr(3, 2), 10);

								pos += 5;
							}

							if (z > 720 || z < -720) {
								throw 'Invalid timezone';
							}
							break;
					}
				}

				now.setFullYear(year);
				now.setMonth(month * 1 - 1);
				now.setDate(date);
				now.setHours(hh);
				now.setMinutes(mm);
				now.setSeconds(ss);
				now.setMilliseconds(sss);

				return now;
			},
			format: format,
			nodes: nodes,
			getNodeFromPos: function(pos){
				var i;

				for (i = 0; i < nodes.length; i++) {
					if (nodes[i].offset > pos) {
						return nodes[i].prev;
					}
				}

				return nodes[i - 1];
			},
			date: new Date()
		};

		// console.log("parser", init);

		return parser;
	}

	return getParser;

}).directive("datetime", function(datetimeParser, $filter){
	return {
		restrict: "A",
		require: "ngModel",
		link: function(scope, element, attrs, ngModel){
			var parser = null;

			ngModel.$render = function(){
				// console.log("render");
				element.val(ngModel.$modelValue && parser ? $filter("date")(ngModel.$modelValue, parser.format) : undefined);
				parser.parse(element.val());
			};

			attrs.$observe("datetime", function(value){
				parser = datetimeParser(value);
				ngModel.$render();
			});

			element.on("$destroy", function(){
				parser = null;
			});

			ngModel.$parsers.push(function(viewValue){
				// console.log(viewValue);

				if (!parser) {
					return undefined;
				}

				try {
					return parser.parse(viewValue);
				} catch (e) {
					// console.log(e);
					return undefined;
				}
			});

			// ngModel.$formatters.push(function(modelValue){
				// return $filter("date")(modelValue);
			// });

			element.on("change focus keydown click", function(e){
				var node = parser.getNodeFromPos(e.target.selectionStart);

				selectNode(e.target, node);

				if (e.type == "keydown") {
					if (e.keyCode == 37) {
						// left
						e.preventDefault();

						var pre = node.prev;
						while (pre && pre.type == "string") {
							pre = pre.prev;
						}

						if (pre) {
							selectNode(e.target, pre);
							return;
						}
					} else if (e.keyCode == 39) {
						// right
						e.preventDefault();

						var node = node.next;
						while (node && node.type == "string") {
							node = node.next;
						}

						if (node) {
							selectNode(e.target, node);
							return;
						}
					} else if (e.keyCode == 38) {
						// up
						node.increase();
					} else if (e.keyCode == 40) {
						// down
						node.decrease();
					} else if (node.type == "string") {
						e.preventDefault();
						return;
					} else {
						// insert
						e.preventDefault();
					}
				}

				// console.log(e);
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



var datetime = {
	handleEvent: function(e){
		if (e.type == "focus") {

		} else if (e.type == "keydown") {
		}
		console.log(e);
	}
};

// document.addEventListener("DOMContentLoaded", function(){
	// var element = document.querySelector(".datetime");

	// element.addEventListener("focus", datetime);
	// element.addEventListener("keydown", datetime);
// });

