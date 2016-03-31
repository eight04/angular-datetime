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
	"yyyy-MM-dd",
	"Z"
];

describe("datetime service", function(){

	angular.forEach(formats, function(format){
		describe("Format: " + format, function(){
			var datetime, $date, parser, date, viewValue, modelValue,
				$rootScope, element;

			beforeEach(angular.mock.module("datetime"));

			beforeEach(angular.mock.inject(function(_datetime_, $filter){
				datetime = _datetime_;
				$date = $filter("date");
			}));

			beforeEach(angular.mock.inject(function($compile, _$rootScope_){
				$rootScope = _$rootScope_;
				element = $compile("<input type='text' datetime='{{format}}' ng-model='date'>")($rootScope);
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
			try {
				parser.parse("2000-2001");
			} catch (er) {
				expect(er.properText).toEqual("2001-2001");
			}
		});

		it("operate on left hand", function(){
			try {
				parser.parse("2001-2000");
			} catch (er) {
				expect(er.properText).toEqual("2001-2001");
			}
		});

		it("Tuesday, May 19, 2015", function(){
			parser = datetime("fullDate");
			parser.parse("Tuesday, May 5, 2015");
			try {
				parser.parse("Tuesday, May 1, 2015");
			} catch (er) {
				expect(er.properText).toEqual("Friday, May 1, 2015");
			}
			parser.parse("Friday, May 1, 2015");
			try {
				parser.parse("Friday, May 19, 2015");
			} catch (er) {
				expect(er.properText).toEqual("Tuesday, May 19, 2015");
			}
			parser.parse("Tuesday, May 19, 2015");

			expect(parser.getText()).toEqual("Tuesday, May 19, 2015");
			
			try {
				parser.parse("Monday, May 19, 2015");
			} catch (er) {
				expect(er.properText).toEqual("Monday, May 18, 2015");
			}
			
			parser.parse("Monday, May 18, 2015");

			parser.parse("Sunday, May 17, 2015");
			parser.parse("Sunday, May 17, 2015");
		});

	});

	describe("test initial value", function(){

		var datetime, parser, date, $date;

		it("Create parser", function(){
			angular.mock.module("datetime");
			angular.mock.inject(function(_datetime_, $filter){
				datetime = _datetime_;
				$date = $filter("date");
			});
			parser = datetime("fullDate");
			date = new Date(parser.date.getTime());
		});

		it("getDate should match current date", function(){
			expect(parser.getDate().getTime()).toEqual(date.getTime());
		});

		it("getText", function(){
			expect(parser.getText()).toEqual($date(date, "fullDate"));
		});
	});
});

describe("datetime directive", function(){
	var $rootScope, $date, $compile;
	
	beforeEach(angular.mock.module("datetime"));
	
	beforeEach(angular.mock.inject(function(_$compile_, _$rootScope_, $filter){
		$rootScope = _$rootScope_;
		$date = $filter("date");
		$compile = _$compile_;
	}));
	
	angular.forEach(formats, function(format){
		it(format, function(){
			$rootScope.format = format;
			$rootScope.date = new Date;
			
			var element = $compile("<input type='text' datetime='{{format}}' ng-model='date'>")($rootScope);
			
			$rootScope.$digest();
			
			expect(element.val()).toEqual($date($rootScope.date, format));
		});
	});
	
	it("timezone and utc", function(){
		$rootScope.date = new Date;
		
		var element = $compile("<input type='text' datetime='Z' ng-model='date' datetime-utc>")($rootScope);
		
		$rootScope.$digest();
		
		expect(element.val()).toEqual("+0000");
	});
});
