angular.module("datetime").directive("datetime", function(datetime, $log, $document){
	var { InputMask } = require("custom-input");

	class Element {
		constructor(element, document) {
			this.el = element;
			this.doc = document;
			this.handler = {};
		}
		on(eventType, callback) {
			// use ngModel.parser to execute digest
			if (eventType == "input") return;

			return this.el.on(eventType, callback);
		}
		getSelection() {
			var el = this.el[0],
				doc = this.doc;

			if (doc.activeElement != el) return;

			var start = el.selectionStart,
				end = el.selectionEnd;

			if (start != undefined && end != undefined) {
				return { start, end };
			}
			return this.getSelectionIE();
		}
		getSelectionIE() {
			var el = this.el[0],
				doc = this.doc;

			var bookmark = doc.selection.createRange().getBookmark(),
				range = el.createTextRange(),
				range2 = range.duplicate();

			range.moveToBookmark(bookmark);
			range2.setEndPoint("EndToStart", range);

			var start = range2.text.length,
				end = start + range.text.length;

			return { start, end };
		}
		setSelection(start, end) {
			var el = this.el[0],
				doc = this.doc;

			if (doc.activeElement != el) return;
			
			if (el.setSelectionRange) {
				el.setSelectionRange(start, end);
			} else {
				this.setSelectionIE(start, end);
			}
		}
		setSelectionIE(start, end) {
			var el = this.el[0],
				select = el.createTextRange();

			select.moveStart("character", start);
			select.collapse();
			select.moveEnd("character", end - start);
			select.select();
		}
		val(...args) {
			return this.el.val(...args);
		}
	}

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

		mask.on("digest", err => {
			if (err.code != "NOT_INIT") {
				ngModel.$setValidity("datetime", false);
			}
		});

		parser.tp.on("change", () => {
			scope.$evalAsync(() => {
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

		attrs.$observe("min", function(){
			validMinMax(parser.getDate());
		});

		attrs.$observe("max", function(){
			validMinMax(parser.getDate());
		});

		ngModel.$render = function(){
			// let mask do render stuff?
			// element.val(ngModel.$viewValue || "");
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

		ngModel.$parsers.unshift(function(viewValue){
			// You will get undefined when input is required and model get unset
			if (angular.isUndefined(viewValue)) {
				viewValue = parser.getText();
			}
			
			if (!angular.isString(viewValue)) {
				// let unknown value pass through
				return viewValue;
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
		
		function validModelType(model) {
			if (angular.isDate(model) && !modelParser) {
				return true;
			}
			if (angular.isString(model) && modelParser) {
				return true;
			}
			return false;
		}

		ngModel.$formatters.push(function(modelValue){
			
			// formatter clean the error
			ngModel.$setValidity("datetime", true);
			
			// handle empty value
			if (!modelValue) {
				parser.unset();
				// FIXME: input will be cleared if modelValue is empty and the input is required. This is a temporary fix.
				scope.$evalAsync(() => {
					ngModel.$setViewValue(parser.getText());
				});
				return parser.getText();
			}
			
			// let unknown model type pass through
			if (!validModelType(modelValue)) {
				return modelValue;
			}

			if (modelParser) {
				modelValue = modelParser.parse(modelValue).getDate();
			}
			
			if (!ngModel.$validate) {
				validMinMax(modelValue);
			}

			return parser.setDate(modelValue).getText();
		});
	}

	return {
		restrict: "A",
		require: "?ngModel",
		link: linkFunc,
		priority: 100
	};
});
