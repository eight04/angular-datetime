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
		if (!node || node.token.mutable) {
			return node;
		}
		if (!direction) {
			direction = "next";
		}
		return node[direction + "Edit"];
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

	function closerNode(range, next, prev) {
		var offset = range.node.offset + range.start,
			disNext = next.offset - offset,
			disPrev = offset - (prev.offset + prev.viewValue.length);

		return disNext <= disPrev ? next : prev;
	}

	function createRange(element, nodes) {
		var prev, next, range;

		range = getRange(element, nodes);

		if (!range.node.token.mutable) {
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
		if (ngModel === null) {
			return false;
		}

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
			},
			lastError, isUtc;
			
		function updateView() {
			ngModel.$setViewValue(parser.getText());
			ngModel.$render();
		}
		
		function setUtc(val) {
			if (val && !isUtc) {
				isUtc = true;
				parser.setTimezone("+0000");
				if (modelParser) {
					modelParser.setTimezone("+0000");
				}
				scope.$evalAsync(updateView);
			} else if (!val && isUtc) {
				isUtc = false;
				parser.setTimezone(null);
				if (modelParser) {
					modelParser.setTimezone(null);
				}
				scope.$evalAsync(updateView);
			}
		}

		if (angular.isDefined(attrs.datetimeUtc)) {
			if (attrs.datetimeUtc.length > 0) {
				scope.$watch(attrs.datetimeUtc, setUtc);
			} else {
				setUtc(true);
			}
		}

		var validMin = function(value) {
			if (ngModel.$isEmpty(value) || ngModel.$isEmpty(attrs.min)) {
				return true;
			}
			if (!angular.isDate(value)) {
				value = modelParser.getDate();
			}
			return value >= new Date(attrs.min);
		};

		var validMax = function(value) {
			if (ngModel.$isEmpty(value) || ngModel.$isEmpty(attrs.max)) {
				return true;
			}
			if (!angular.isDate(value)) {
				value = modelParser.getDate();
			}
			return value <= new Date(attrs.max);
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
		
		ngModel.$isEmpty = function(value) {
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

		ngModel.$parsers.push(function(viewValue){
			lastError = null;

			try {
				parser.parse(viewValue);
			} catch (err) {
				if (err.code == "NOT_INIT" || err.code == "EMPTY") {
					if (parser.isEmpty()) {
						ngModel.$setValidity("datetime", true);
					} else {
						ngModel.$setValidity("datetime", false);
					}
					return undefined;
				}
				
				lastError = err;
				
				$log.error(err);

				ngModel.$setValidity("datetime", false);
				
				if (err.code == "NUMBER_TOOSHORT" || err.code == "NUMBER_TOOSMALL" && err.viewValue.length < err.node.token.maxLength) {
					errorRange.node = err.node;
					errorRange.start = 0;
					errorRange.end = err.viewValue.length;
				} else if (err.code != "NOT_INIT" && err.code != "EMPTY") {
					if (err.code == "LEADING_ZERO") {
						viewValue = viewValue.substr(0, err.pos) + err.properValue + viewValue.substr(err.pos + err.viewValue.length);
						if (err.viewValue.length >= err.node.token.maxLength) {
							selectRange(range, "next");
						} else {
							range.start += err.properValue.length - err.viewValue.length + 1;
							range.end = range.start;
						}
					} else if (err.code == "SELECT_INCOMPLETE") {
						parser.nodeParseValue(range.node, err.selected);
						viewValue = parser.getText();
						range.start = err.viewValue.length;
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
						if (err.node) {
							err.node.unset();
						}
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

			ngModel.$setValidity("datetime", true);

			if (!modelValue) {
				parser.unset();
				// FIXME: input will be cleared if modelValue is empty and the input is required. This is a temporary fix.
				scope.$evalAsync(function(){
					ngModel.$setViewValue(parser.getText());
					ngModel.$render();
				});
				return parser.getText();
			}

			if (modelParser) {
				modelValue = modelParser.parse(modelValue).getDate();
			}

			return parser.setDate(modelValue).getText();
		});
		
		function tryFixingLastError() {
			if (lastError.properValue) {
				parser.nodeParseValue(lastError.node, lastError.properValue);
				ngModel.$setViewValue(parser.getText());
				ngModel.$render();
				scope.$apply();
				return true;
			}
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
							if (!lastError) {
								selectRange(range);
							} else {
								selectRange(errorRange);
							}
						});
					}
					break;
				case "keydown":
					if (e.altKey || e.ctrlKey) {
						break;
					}
					if (e.keyCode == 37 || e.keyCode == 9 && e.shiftKey && range.node.prevEdit) {
						// Left, Shift + Tab
						e.preventDefault();
						if (!lastError || tryFixingLastError()) {
							selectRange(range, "prev");							
						} else {
							selectRange(errorRange);
						}
					} else if (e.keyCode == 39 || e.keyCode == 9 && !e.shiftKey && range.node.nextEdit) {
						// Right, Tab
						e.preventDefault();
						if (!lastError || tryFixingLastError()) {
							selectRange(range, "next");
						} else {
							selectRange(errorRange);
						}
					} else if (e.keyCode == 38) {
						// Up
						e.preventDefault();
						parser.nodeAddValue(range.node, 1);
						ngModel.$setViewValue(parser.getText());
						range.start = 0;
						range.end = "end";
						ngModel.$render();
						scope.$apply();
					} else if (e.keyCode == 40) {
						// Down
						e.preventDefault();
						parser.nodeAddValue(range.node, -1);
						ngModel.$setViewValue(parser.getText());
						range.start = 0;
						range.end = "end";
						ngModel.$render();
						scope.$apply();
					} else if (e.keyCode == 36) {
						// Home
						e.preventDefault();
						if (lastError) {
							selectRange(errorRange);
						} else {
							selectRange(range, "prev", true);
						}
					} else if (e.keyCode == 35) {
						// End
						e.preventDefault();
						if (lastError) {
							selectRange(errorRange);
						} else {
							selectRange(range, "next", true);
						}
					}
					break;

				case "click":
					e.preventDefault();
					waitForClick = false;
					if (!lastError) {
						range = createRange(element, parser.nodes);
						selectRange(range);
					} else {
						selectRange(errorRange);
					}
					break;

				case "keypress":
					var separators = attrs.datetimeSeparator || "",
						key = String.fromCharCode(e.keyCode || e.which);
					// check for separator only when there is a next node which is static string
					if (range.node.next && range.node.next.token.type === "static") {
						separators += range.node.next.viewValue[0];
					}

					if (separators.indexOf(key) >= 0) {
						e.preventDefault();
						if (!lastError || tryFixingLastError()) {
							selectRange(range, "next");
						} else {
							selectRange(errorRange);
						}
					}
					else if (isPrintableKey(e)) {
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
