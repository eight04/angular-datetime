/* global angular */
/* eslint eqeqeq: 0, quotes: 0, no-multi-str: 0 */

angular.module("datetime", []).factory("datetimeParser", function(){
	// var cache = {};
	
	function getParser(format) {
		var nodes = [];
		
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
		
		for (i = 0; i < nodes.length; i++) {
			nodes[i].next = nodes[i + 1] || null;
			nodes[i].prev = nodes[i - 1] || null;
		}
		
		var init = {
			parse: function(val){
				for (i = 0; i < nodes.length; i++) {
					var p = nodes[i];
					
					switch (p.type) {
						case "string":
							if (val.lastIndexOf(p.value, pos) != pos) {
								throw 'Pattern value mismatch';
							}
							p.offset = pos;
							pos += p.value.length;
							break;
						
						case "yyyy":
							year = dateParserHelpers.getInteger(val, pos, 4, 4);
							if (year === null) {
								throw 'Invalid year';
							}
							p.offset = pos;
							p.value = year;
							pos += p.value.length;
							break;
							
						case "yy":
							year = dateParserHelpers.getInteger(val, pos, 2, 2);
							if (year === null) {
								throw 'Invalid year';
							}
							p.offset = pos;
							p.value = year;
							pos += p.value.length;
							break;
							
						case "y":
							year = dateParserHelpers.getInteger(val, pos, 2, 4);
							if (year === null) {
								throw 'Invalid year';
							}
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
							
						case "MM":
							for (j = 0; j < monthShortNames.length; j++) {
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
							month = dateParserHelpers.getInteger(val, pos, p.type.length, 2);

							if (month === null || (month < 1) || (month > 12)) {
								throw 'Invalid month';
							}

							p.offset = pos;
							p.value = month;
							pos += p.value.length;
							break;
							
						case "dd":
						case "d":
							date = dateParserHelpers.getInteger(val, pos, p.type.length, 2);
							
							if (date === null || (date < 1) || (date > 31)) {
								throw 'Invalid date';
							}

							p.offset = pos;
							p.value = date;
							pos += p.value.length;
							break;
							
						case "HH":
						case "H":
							hh = dateParserHelpers.getInteger(val, pos, p.type.length, 2);

							if (hh === null || (hh < 0) || (hh > 23)) {
								throw 'Invalid hours';
							}

							p.offset = pos;
							p.value = hh;
							pos += p.value.length;
							break;
							
						case "hh":
						case "h":
							hh = dateParserHelpers.getInteger(val, pos, p.type.length, 2);

							if (hh === null || (hh < 1) || (hh > 12)) {
								throw 'Invalid hours';
							}

							p.offset = pos;
							p.value = hh;
							pos += p.value.length;
							break;
							
						case "mm":
						case "m":
							mm = dateParserHelpers.getInteger(val, pos, p.type.length, 2);

							if (mm === null || (mm < 0) || (mm > 59)) {
								throw 'Invalid minutes';
							}

							p.offset = pos;
							p.value = mm;
							pos += p.value.length;
							break;
							
						case "ss":
						case "s":
							ss = dateParserHelpers.getInteger(val, pos, p.type.length, 2);

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
				
				if (pos < nodes[i - 1].value.length + nodes[i - 1].offset) {
					return nodes[i - 1];
				}
				
				return null;
			}
		};
		
		return init;
	}
	
	return getParser;
	
}).directive("datetime", function(datetimeParser){
	ng-focus: 
		node = parser.getNodeFromPos(caret)
		select(node.offset, node.next.offset)
		
	ng-keydown:
		node = parser.getNodeFromPos(caret)
		if node.type == string 
			preventdefault
			
		if 
	return {
		restrict: "A",
		require: "ngModel",
		link: function(scope, element, attrs, ngModel){
			var parser = null;
			
			ngModel.$render = function(){
				element.val(ngModel.$modelValue && parser ? dateFilter(ngModel.$modelValue, parser.format) : undefined);
				scope.ngModel = ngModel.$modelValue;
			};
			
			attrs.$observe("datetime", function(value){
				parser = datetimeParser(value);
			});
			
			element.on("$destroy", function(){
				parser = null;
			});
			
			element.on("")
		}
	};
});



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
		