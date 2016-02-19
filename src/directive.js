angular.module("datetime").directive("datetime", function(datetime, $log, $document){
	var doc = $document[0];

	function getInputSelectionIE(input) {
		var bookmark = doc.selection.createRange().getBookmark();
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

	function getInputSelection(input) {
		input = input[0];

		if (input.selectionStart != undefined && input.selectionEnd != undefined) {
			return {
				start: input.selectionStart,
				end: input.selectionEnd
			};
		}

		if (doc.selection) {
			return getInputSelectionIE(input);
		}
	}

	function getInitialNode(nodes) {
		return getNode(nodes[0]);
	}

	function setInputSelectionIE(input, range) {
		var select = input.createTextRange();
		select.moveStart("character", range.start);
		select.collapse();
		select.moveEnd("character", range.end - range.start);
		select.select();
	}

	function setInputSelection(input, range) {
		input = input[0];

		if (input.setSelectionRange) {
			input.setSelectionRange(range.start, range.end);
		} else if (input.createTextRange) {
			setInputSelectionIE(input, range);
		}
	}

	function getNode(node, direction) {
		if (!direction) {
			direction = "next";
		}
		while (node && (node.token.type == "static" || node.token.type == "regex")) {
			node = node[direction];
		}
		return node;
	}

	function addDate(date, token, diff) {
		switch (token.name) {
			case "year":
				date.setFullYear(date.getFullYear() + diff);
				break;
			case "month":
				date.setMonth(date.getMonth() + diff);
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

	function getLastNode(node, direction) {
		var lastNode;

		do {
			lastNode = node;
			node = getNode(node[direction], direction);
		} while (node);

		return lastNode;
	}

	function selectRange(range, direction, toEnd) {
		if (!range.node) {
			return;
		}
		if (direction) {
			range.start = 0;
			range.end = "end";
			if (toEnd) {
				range.node = getLastNode(range.node, direction);
			} else {
				range.node = getNode(range.node[direction], direction) || range.node;
			}
		}
		setInputSelection(range.element, {
			start: range.start + range.node.offset,
			end: range.end == "end" ? range.node.offset + range.node.viewValue.length : range.end + range.node.offset
		});
	}

	function isStatic(node) {
		return node.token.type == "static" || node.token.type == "regex";
	}

	function closerNode(range, next, prev) {
		var offset = range.node.offset + range.start,
			disNext = next.offset - offset,
			disPrev = offset - (prev.offset + prev.viewValue.length);

		return disNext <= disPrev ? next : prev;
	}

	function createRange(element, nodes) {
		var prev, next, range;

		range = getRange(element, nodes);

		if (isStatic(range.node)) {
			next = getNode(range.node, "next");
			prev = getNode(range.node, "prev");

			if (!next && !prev) {
				range.node = nodes[0];
				range.end = 0;
			} else if (!next || !prev) {
				range.node = next || prev;
			} else {
				range.node = closerNode(range, next, prev);
			}
		}

		range.start = 0;
		range.end = "end";

		return range;
	}

	function getRange(element, nodes, node) {
		var selection = getInputSelection(element), i, range;
		for (i = 0; i < nodes.length; i++) {
			if (!range && nodes[i].offset + nodes[i].viewValue.length >= selection.start || i == nodes.length - 1) {
				range = {
					element: element,
					node: nodes[i],
					start: selection.start - nodes[i].offset,
					end: selection.start - nodes[i].offset
				};
				break;
			}
		}

		if (node && range.node.next == node && range.start + range.node.offset == range.node.next.offset) {
			range.node = range.node.next;
			range.start = range.end = 0;
		}

		return range;
	}

	function isRangeCollapse(range) {
		return range.start == range.end ||
			range.start == range.node.viewValue.length && range.end == "end";
	}

	function isRangeAtEnd(range) {
		var maxLength, length;
		if (!isRangeCollapse(range)) {
			return false;
		}
		maxLength = range.node.token.maxLength;
		length = range.node.viewValue.length;
		if (maxLength && length < maxLength) {
			return false;
		}
		return range.start == length;
	}

	function isPrintableKey(e) {
		var keyCode = e.charCode || e.keyCode;
		return keyCode >= 48 && keyCode <= 57 ||
			keyCode >= 65 && keyCode <= 90 ||
			keyCode >= 97 && keyCode <= 122;
	}

	function linkFunc(scope, element, attrs, ngModel) {
		var parser = datetime(attrs.datetime),
			modelParser = attrs.datetimeModel && datetime(attrs.datetimeModel),
			range = {
				element: element,
				node: getInitialNode(parser.nodes),
				start: 0,
				end: "end"
			},
			errorRange = {
				element: element,
				node: null,
				start: 0,
				end: 0
			};

		var validMin = function(value) {
			return ngModel.$isEmpty(value) || angular.isUndefined(attrs.min) || value >= new Date(attrs.min);
		};

		var validMax = function(value) {
			return ngModel.$isEmpty(value) || angular.isUndefined(attrs.max) || value <= new Date(attrs.max);
		};

		if (ngModel.$validators) {
			ngModel.$validators.min = validMin;
			ngModel.$validators.max = validMax;
		}

		attrs.$observe("min", function(){
			validMinMax(parser.getDate());
		});

		attrs.$observe("max", function(){
			validMinMax(parser.getDate());
		});

		ngModel.$render = function(){
			element.val(ngModel.$viewValue || "");
			if (doc.activeElement == element[0]) {
				selectRange(range);
			}
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

		ngModel.$parsers.push(function(viewValue){
			// Handle empty string
			if (!viewValue && angular.isUndefined(attrs.required)) {
				// Reset range
				range.node = getInitialNode(parser.nodes);
				range.start = 0;
				range.end = "end";
				ngModel.$setValidity("datetime", true);
				return null;
			}

			try {
				parser.parse(viewValue);
			} catch (err) {
				$log.error(err);

				ngModel.$setValidity("datetime", false);

				if (err.code == "NUMBER_TOOSHORT" || err.code == "NUMBER_TOOSMALL" && err.match.length < err.node.token.maxLength) {
					errorRange.node = err.node;
					errorRange.start = 0;
					errorRange.end = err.match.length;
				} else {
					if (err.code == "LEADING_ZERO") {
						viewValue = viewValue.substr(0, err.pos) + err.properValue + viewValue.substr(err.pos + err.match.length);
						if (err.match.length >= err.node.token.maxLength) {
							selectRange(range, "next");
						} else {
							range.start += err.properValue.length - err.match.length + 1;
							range.end = range.start;
						}
					} else if (err.code == "SELECT_INCOMPLETE") {
						parser.parseNode(range.node, err.selected);
						viewValue = parser.getText();
						range.start = err.match.length;
						range.end = "end";
					} else if (err.code == "INCONSISTENT_INPUT") {
						viewValue = err.properText;
						range.start++;
						range.end = range.start;
					// } else if (err.code == "NUMBER_TOOLARGE") {
						// viewValue = viewValue.substr(0, err.pos) + err.properValue + viewValue.substr(err.pos + err.match.length);
						// range.start = 0;
						// range.end = "end";
					} else {
						viewValue = parser.getText();
						range.start = 0;
						range.end = "end";
					}
					scope.$evalAsync(function(){
						if (viewValue == ngModel.$viewValue) {
							throw "angular-datetime crashed!";
						}
						ngModel.$setViewValue(viewValue);
						ngModel.$render();
					});
				}

				return undefined;
			}

			ngModel.$setValidity("datetime", true);

			if (ngModel.$validate || validMinMax(parser.getDate())) {
				var date = parser.getDate();

				if (angular.isDefined(attrs.datetimeUtc)) {
					date = new Date(date.getTime() + date.getTimezoneOffset() * 60 * 1000);
				}

				if (modelParser) {
					return modelParser.setDate(date).getText();
				} else {
					// Create new date to make Angular notice the difference.
					return new Date(date.getTime());
				}
			}

			return undefined;
		});

		ngModel.$formatters.push(function(modelValue){

			if (!modelValue) {
				ngModel.$setValidity("datetime", angular.isUndefined(attrs.required));
				return "";
			}

			ngModel.$setValidity("datetime", true);

			if (modelParser) {
				modelValue = modelParser.parse(modelValue).getDate();
			}

			if (angular.isDefined(attrs.datetimeUtc)) {
				modelValue = new Date(modelValue.getTime() + modelValue.getTimezoneOffset() * 60 * 1000);
			}

			return parser.setDate(modelValue).getText();
		});

		function addNodeValue(node, diff) {
			var date, viewValue;

			date = new Date(parser.date.getTime());
			addDate(date, node.token, diff);
			parser.setDate(date);
			viewValue = parser.getText();
			ngModel.$setViewValue(viewValue);

			range.start = 0;
			range.end = "end";
			ngModel.$render();

			scope.$apply();
		}

		var waitForClick;
		element.on("focus keydown keypress mousedown click", function(e){
			switch (e.type) {
				case "mousedown":
					waitForClick = true;
					break;
				case "focus":
					e.preventDefault();

					// Init value on focus
					if (!ngModel.$viewValue) {
						if (angular.isDefined(attrs["default"])) {
							parser.setDate(new Date(attrs["default"]));
						}
						ngModel.$setViewValue(parser.getText());
						ngModel.$render();
						scope.$apply();
					}

					if (!waitForClick) {
						setTimeout(function(){
							if (!ngModel.$error.datetime) {
								selectRange(range);
							} else {
								selectRange(errorRange);
							}
						});
					}
					break;
				case "keydown":
					switch (e.keyCode) {
						case 37:
							// Left
							e.preventDefault();
							if (!ngModel.$error.datetime) {
								selectRange(range, "prev");
							} else {
								selectRange(errorRange);
							}
							break;
						case 39:
							// Right
							e.preventDefault();
							if (!ngModel.$error.datetime) {
								selectRange(range, "next");
							} else {
								selectRange(errorRange);
							}
							break;
						case 38:
							// Up
							e.preventDefault();
							addNodeValue(range.node, 1);
							break;
						case 40:
							// Down
							e.preventDefault();
							addNodeValue(range.node, -1);
							break;
						case 36:
							// Home
							e.preventDefault();
							if (ngModel.$error.datetime) {
								selectRange(errorRange);
							} else {
								selectRange(range, "prev", true);
							}
							break;
						case 35:
							// End
							e.preventDefault();
							if (ngModel.$error.datetime) {
								selectRange(errorRange);
							} else {
								selectRange(range, "next", true);
							}
							break;
					}
					break;

				case "click":
					e.preventDefault();
					waitForClick = false;
					if (!ngModel.$error.datetime) {
						range = createRange(element, parser.nodes);
						selectRange(range);
					} else {
						selectRange(errorRange);
					}
					break;

				case "keypress":
					if (isPrintableKey(e)) {
						setTimeout(function(){
							range = getRange(element, parser.nodes, range.node);
							if (isRangeAtEnd(range)) {
								range.node = getNode(range.node.next) || range.node;
								range.start = 0;
								range.end = "end";
								selectRange(range);
							}
						});
					}
					break;

			}
		});

	}

	return {
		restrict: "A",
		require: "?ngModel",
		link: linkFunc
	};
});
