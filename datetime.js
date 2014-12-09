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
	return string.substr(startPoint, i);
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


	// Valid format tokens
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
		"string": {
			name: "string",
			type: "static"
		}
	};

	function increase(){
		if (this.type == "string") {
			return;
		}
		if (this.type == "EEEE" || this.type == "EEE") {
			// this.value =
		}
		if (this.type == "MMMM" || this.type == "MMM") {

		}
	}

	function decrease(){

	}

	function set(){

	}

	function createNode(name, value){
		return {
			name: node[name].name,
			type: node[name].type,
			minLenth: node[name].minLength,
			maxLength: node[name].maxLength,
			select: node[name].select,
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
					nodes.push({
						type: "string",
						value: format.substring(pos),
						offset: null
					});
				}
				break;
			}

			if (match.index > pos) {
				nodes.push({
					type: "string",
					value: format.substring(pos, match.index),
					offset: null
				});
				pos = match.index;
			}

			if (match.index == pos) {
				if (match[1]) {
					nodes.push({
						type: "sss",
						value: null,
						offset: null
					});
				} else if (match[2]) {
					nodes.push({
						type: "string",
						value: match[1].replace("''", "'"),
						offset: null
					});
				} else {
					nodes.push({
						type: match[0],
						value: null,
						offset: null
					});
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

		// Create match object
		var init = {
			parse: function(val){
				var now = this.date = new Date(this.date.getTime()),
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

					// console.log(p);

					switch (p.type) {
						case "string":
							if (val.lastIndexOf(p.value, pos) != pos) {
								throw 'Pattern value mismatch';
							}
							p.offset = pos;
							pos += p.value.length;
							break;

						case "yyyy":
							year = val.substr(pos, 4);
							if (isNaN(year)) {
								throw 'Invalid year';
							}
							p.offset = pos;
							p.value = year;
							pos += p.value.length;
							break;

						case "yy":
							year = val.substr(pos, 2);
							if (isNaN(year)) {
								throw 'Invalid year';
							}
							p.offset = pos;
							p.value = year;
							pos += p.value.length;
							break;

						case "y":
							year = val.substr(pos, 4).match(/^\d\d+/);
							if (year === null) {
								throw 'Invalid year';
							}
							year = year[0];
							p.offset = pos;
							p.value = year;
							pos += p.value.length;
							break;

						case "MMMM":
							for (j = 0; j < monthNames.length; j++) {
								if (val.lastIndexOf(monthNames[j], pos) == pos) {
									month = i + 1;
									p.offset = pos;
									p.value = monthNames[j];
									pos += p.value.length;
									break;
								}
							}

							if (!month) {
								throw 'Invalid month';
							}
							break;

						case "MMM":
							match = "";
							for (j = 0; j < monthShortNames.length; j++) {
								m = getMatch(val, monthShortNames[j], pos);
								if (m && m.length > match.length){
									month = j + 1;
									match = m;
								}
							}

							if (!match) {
								throw 'Invalid month';
							}

							p.offset = pos;
							p.value = match;
							pos += p.value.length;

							break;

						case "EEEE":
						case "EEE":
							for (j = 0; j < dayNames.length; j++) {
								if (val.lastIndexOf(dayNames[j], pos) == pos) {
									p.offset = pos;
									p.value = dayNames[j];
									pos += p.value.length;
									break;
								}
							}
							break;

						case "MM":
						case "M":
							month = getInteger(val, pos, p.type.length, 2);

							if (month === null || (month < 1) || (month > 12)) {
								throw 'Invalid month';
							}

							p.offset = pos;
							// console.log(month);
							p.value = month;
							pos += p.value.length;
							break;

						case "dd":
						case "d":
							date = getInteger(val, pos, p.type.length, 2);

							if (date === null || (date < 1) || (date > 31)) {
								throw 'Invalid date';
							}

							p.offset = pos;
							p.value = date;
							pos += p.value.length;
							break;

						case "HH":
						case "H":
							hh = getInteger(val, pos, p.type.length, 2);

							if (hh === null || (hh < 0) || (hh > 23)) {
								throw 'Invalid hours';
							}

							p.offset = pos;
							p.value = hh;
							pos += p.value.length;
							break;

						case "hh":
						case "h":
							hh = getInteger(val, pos, p.type.length, 2);

							if (hh === null || (hh < 1) || (hh > 12)) {
								throw 'Invalid hours';
							}

							p.offset = pos;
							p.value = hh;
							pos += p.value.length;
							break;

						case "mm":
						case "m":
							mm = getInteger(val, pos, p.type.length, 2);

							if (mm === null || (mm < 0) || (mm > 59)) {
								throw 'Invalid minutes';
							}

							p.offset = pos;
							p.value = mm;
							pos += p.value.length;
							break;

						case "ss":
						case "s":
							ss = getInteger(val, pos, p.type.length, 2);

							if (ss === null || (ss < 0) || (ss > 59)) {
								throw 'Invalid seconds';
							}

							p.offset = pos;
							p.value = ss;
							pos += p.value.length;
							break;

						case "sss":
							sss = val.substr(pos, 4);

							// if (sss === null || (sss < 0) || (sss > 999)) {
									// throw 'Invalid milliseconds';
								// }

							p.offset = pos;
							p.value = sss;
							pos += p.value.length;
							break;

						case "a":
							var a = val.substr(pos, 2).toLowerCase();
							if (a == 'am') {
								ampm = 'AM';
							} else if (a == 'pm') {
								ampm = 'PM';
							} else {
								throw 'Invalid AM/PM';
							}

							p.offset = pos;
							p.value = ampm;
							pos += p.value.length;
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

		return init;
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

