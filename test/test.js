/* eslint-env jasmine */

var formats = [
	"yyyy-MM-dd HH:mm:ss",
	"medium",
	"short",
	"fullDate",
	"longDate",
	"mediumDate",
	"shortDate",
	"mediumTime",
	"shortTime",
	",sss .sss",
	"yyyy-MM-dd"
];

describe("datetime service", function(){

	angular.forEach(formats, function(format){
		describe("Format: " + format, function(){
			var datetime, $date, parser, date, viewValue, modelValue;

			beforeEach(angular.mock.module("datetime"));

			beforeEach(angular.mock.inject(function(_datetime_, $filter){
				datetime = _datetime_;
				$date = $filter("date");
			}));

			it("test viewValue", function(){
				parser = datetime(format);
				date = new Date();

				parser.setDate(date);
				viewValue = parser.getText();

				expect(viewValue).toEqual($date(date, format));
			});

			it("test modelValue", function(){
				parser.parse(viewValue);
				modelValue = parser.getDate();

				// 'yy' is ambigous in shortDate/short
				if (format == "shortDate" || format == "short") {
					modelValue.setFullYear(date.getFullYear());
				}

				expect(modelValue.getTime()).toEqual(date.getTime());
			});
		});
	});

	describe("test duplicate name and state change", function(){

		var datetime, parser;

		beforeEach(angular.mock.module("datetime"));

		beforeEach(angular.mock.inject(function(_datetime_){
			datetime = _datetime_;
		}));

		it("create parser", function(){
			parser = datetime("yyyy-yyyy");
			parser.parse("2000-2000");
		});

		it("operate on right hand", function(){
			parser.parse("2000-2001");

			expect(parser.getText()).toEqual("2001-2001");
		});

		it("operate on left hand", function(){
			parser.parse("2002-2001");

			expect(parser.getText()).toEqual("2002-2002");
		});

	});
});
