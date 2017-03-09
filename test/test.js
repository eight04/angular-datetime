/* eslint-env browser */
require("jsdom-global")();

var {describe, it, beforeEach, afterEach} = require("mocha"),
	assert = require("assert");

// setup angular
require("angular/angular");
global.angular = window.angular;

// setup mocha for angular mock
window.mocha = true;
window.beforeEach = beforeEach;
window.afterEach = afterEach;
require("angular-mocks");

var {module, inject} = window;
	
require("../index");

var FORMATS = [
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

function insertColon(timezone) {
	if (timezone[3] == ":") {
		return timezone;
	}
	return timezone.substr(0, 3) + ":" + timezone.substr(3, 2);
}

function randomTimezone(){
	var offset = Math.floor(Math.random() * 24 * 60) - 12 * 60,
		sign = offset >= 0 ? "+" : "-",
		absOffset = Math.abs(offset),
		hour = Math.floor(absOffset / 60),
		min = absOffset % 60,
		text = sign + padStart(hour, 2, "0") + padStart(min, 2, "0");
	return {
		time: offset * 60 * 1000,
		text: text
	};
}

function padStart(text, n, pad = " ") {
	text = String(text);
	if (n > text.length) {
		text = pad
			.repeat(Math.ceil((n - text.length) / pad.length))
			.slice(0, n - text.length) + text;
	}
	return text;
}

describe("datetime service", () => {
	var datetime, $date;
	
	beforeEach(module("datetime"));
	beforeEach(inject(function(_datetime_, $filter) {
		datetime = _datetime_;
		$date = $filter("date");
	}));
	
	FORMATS.forEach(format => {
		it(`Format: ${format}`, () => {
			var parser = datetime(format),
				date = new Date,
				text, model;
			
			text = parser.setDate(date).getText();
			assert.equal(text, $date(date, format));
			model = parser.parse(text).getDate();
			// 'yy' is ambigous in shortDate/short
			if (format == "shortDate" || format == "short") {
				assert.equal(model.getFullYear() % 100, date.getFullYear() % 100);
				model.setFullYear(date.getFullYear());
			}
			assert.equal(model.getTime(), date.getTime());
		});
	});


	it("duplicate tokens", () => {
		var parser = datetime("yyyy-yyyy");
		parser.parse("2000-2000");
		
		assert.throws(
			() => parser.parse("2000-2001"),
			err => err.properText == "2001-2001"
		);
		
		assert.throws(
			() => parser.parse("2001-2000"),
			err => err.properText == "2001-2001"
		);
	});
	
	it("tokens affect each others", () => {
		var parser = datetime("fullDate");
		parser.parse("Tuesday, May 5, 2015");
		assert.throws(
			() => parser.parse("Tuesday, May 1, 2015"),
			err => err.properText == "Friday, May 1, 2015"
		);
		parser.parse("Friday, May 1, 2015");
		assert.throws(
			() => parser.parse("Friday, May 19, 2015"),
			err => err.properText == "Tuesday, May 19, 2015"
		);
		parser.parse("Tuesday, May 19, 2015");
		assert.equal(parser.getText(), "Tuesday, May 19, 2015");
		assert.throws(
			() => parser.parse("Monday, May 19, 2015"),
			err => err.properText == "Monday, May 18, 2015"
		);
		parser.parse("Monday, May 18, 2015");
		parser.parse("Sunday, May 17, 2015");
		parser.parse("Sunday, May 17, 2015");			
	});

	it("31 date overflow", () => {
		var parser = datetime("medium");
		
		parser.parse("Mar 31, 2016 6:19:20 PM");
		parser.parse("Apr 1, 2016 10:42:20 AM");
	});

	it("initial value", () => {
		var parser = datetime("fullDate"),
			date = new Date;
			
		assert.ok(date.getTime() - parser.getDate().getTime() < 10);
		assert.equal(parser.getText(), $date(parser.getDate(), "fullDate"));
	});
	
	it("timezone: utc time + offset should always equal on same date", () => {
		var parser = datetime("medium"),
			r1 = randomTimezone(),
			r2 = randomTimezone(),
			text = parser.getText(),
			t1, t2;
			
		parser.setTimezone(r1.text);
		parser.parse(text);
		t1 = parser.getDate().getTime();
		
		parser.setTimezone(r2.text);
		parser.parse(text);
		t2 = parser.getDate().getTime();
		
		assert.equal(t1 + r1.time, t2 + r2.time);
	});
	
	it("ZZ token", () => {
		var parser = datetime("ZZ");
		
		assert.equal(parser.getText(), insertColon($date(parser.getDate(), "Z")));
	});

});

describe("datetime directive", function(){
	var $rootScope, $date, $compile;
	
	beforeEach(module("datetime"));
	beforeEach(inject(function(_$compile_, _$rootScope_, $filter){
		$rootScope = _$rootScope_;
		$date = $filter("date");
		$compile = _$compile_;
	}));
	
	FORMATS.forEach(format => {
		it(`Format: ${format}`, function(){
			$rootScope.format = format;
			$rootScope.date = new Date;
			
			var element = $compile("<input type='text' datetime='{{format}}' ng-model='date'>")($rootScope);

			$rootScope.$digest();
			
			assert.equal(element.val(), $date($rootScope.date, format));
		});
	});
	
	it("timezone and utc", function(){
		$rootScope.date = new Date;
		
		var element = $compile("<input type='text' datetime='Z' ng-model='date' datetime-utc>")($rootScope);
		
		$rootScope.$digest();
		
		assert.equal(element.val(), "+0000");
	});
	
	it("dynamic datetime-utc", function(){
		var date = $rootScope.date = new Date;
		$rootScope.utc = true;
		
		var element = $compile("<input type='text' datetime='Z' ng-model='date' datetime-utc='utc'>")($rootScope);
		
		$rootScope.$digest();
				
		assert.equal(element.val(), "+0000");
		
		$rootScope.utc = false;
		
		$rootScope.$digest();
		
		assert.equal(element.val(), $date(date, "Z"));
	});

	it("datetime-model", function(){
		var date = new Date;
		$rootScope.dateString = $date(date, "yyyy-MM-dd HH:mm:ss");
		var element = $compile("<input type='text' datetime='medium' datetime-model='yyyy-MM-dd HH:mm:ss' ng-model='dateString'>")($rootScope);
		
		$rootScope.$digest();
		
		assert.equal(element.val(), $date(date, "medium"));
	});
	
	it("min & max", function(){
		$rootScope.min = "2000-01-01";
		$rootScope.max = "2020-01-01";
		
		var element = $compile("<input type='text' datetime='yyyy-MM-dd HH:mm:ss' ng-model='date' min='{{min}}' max='{{max}}'>")($rootScope);
		
		$rootScope.$digest();
		
		element.val("1999-01-01 00:00:00").triggerHandler("input");
		$rootScope.$digest();
		assert.equal(element.hasClass("ng-invalid-min"), true);
		
		element.val("2016-06-18 22:59:00").triggerHandler("input");
		$rootScope.$digest();
		assert.equal(element.hasClass("ng-invalid"), false);
		
		element.val("2021-01-01 00:00:00").triggerHandler("input");
		$rootScope.$digest();
		assert.equal(element.hasClass("ng-invalid-max"), true);
		
		$rootScope.min = null;
		$rootScope.max = null;
		$rootScope.$digest();
		assert.equal(element.hasClass("ng-invalid"), false);
	});
});
