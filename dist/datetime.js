(function(angular) {
    "use strict";
    angular.module("datetime", []), angular.module("datetime").constant("datetimePlaceholder", {
        year: "(year)",
        yearShort: "(year)",
        month: "(month)",
        date: "(date)",
        day: "(day)",
        hour: "(hour)",
        hour12: "(hour12)",
        minute: "(minute)",
        second: "(second)",
        millisecond: "(millisecond)",
        ampm: "(AM/PM)",
        week: "(week)"
    });
    var _module_ = {
        exports: {}
    };
    (function(EventLite) {
        if ("undefined" !== typeof _module_) _module_.exports = EventLite;
        var LISTENERS = "listeners";
        var methods = {
            on: function on(type, func) {
                return getListeners(this, type).push(func), this;
            },
            once: function once(type, func) {
                var that = this;
                return wrap.originalListener = func, getListeners(that, type).push(wrap), that;
                function wrap() {
                    off.call(that, type, wrap), func.apply(this, arguments);
                }
            },
            off: off,
            emit: function emit(type, value) {
                var that = this;
                var listeners = getListeners(that, type, true);
                if (!listeners) return false;
                var arglen = arguments.length;
                if (1 === arglen) listeners.forEach(function zeroarg(func) {
                    func.call(that);
                }); else if (2 === arglen) listeners.forEach(function onearg(func) {
                    func.call(that, value);
                }); else {
                    var args = Array.prototype.slice.call(arguments, 1);
                    listeners.forEach(function moreargs(func) {
                        func.apply(that, args);
                    });
                }
                return !!listeners.length;
            }
        };
        function mixin(target) {
            for (var key in methods) target[key] = methods[key];
            return target;
        }
        function off(type, func) {
            var listners;
            if (!arguments.length) delete this[LISTENERS]; else if (!func) {
                if (listners = this[LISTENERS], listners) if (delete listners[type], !Object.keys(listners).length) return off.call(this);
            } else if (listners = getListeners(this, type, true), listners) {
                if (listners = listners.filter(function ne(test) {
                    return test !== func && test.originalListener !== func;
                }), !listners.length) return off.call(this, type);
                this[LISTENERS][type] = listners;
            }
            return this;
        }
        function getListeners(that, type, readonly) {
            if (readonly && !that[LISTENERS]) return;
            var listeners = that[LISTENERS] || (that[LISTENERS] = {});
            return listeners[type] || (listeners[type] = []);
        }
        mixin(EventLite.prototype), EventLite.mixin = mixin;
    })(function EventLite() {
        if (!(this instanceof EventLite)) return new EventLite();
    });
    var Emitter = _module_.exports;
    var _export_num2str_ = function(num, minLength, maxLength) {
        var i;
        if (num = "" + num, num.length > maxLength) num = num.substr(num.length - maxLength); else if (num.length < minLength) for (i = num.length; i < minLength; i++) num = "0" + num;
        return num;
    };
    var _typeof = "function" === typeof Symbol && "symbol" === typeof Symbol.iterator ? function(obj) {
        return typeof obj;
    } : function(obj) {
        return obj && "function" === typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
    };
    var classCallCheck = function(instance, Constructor) {
        if (!(instance instanceof Constructor)) throw new TypeError("Cannot call a class as a function");
    };
    var inherits = function(subClass, superClass) {
        if ("function" !== typeof superClass && null !== superClass) throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
        if (subClass.prototype = Object.create(superClass && superClass.prototype, {
            constructor: {
                value: subClass,
                enumerable: false,
                writable: true,
                configurable: true
            }
        }), superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
    };
    var possibleConstructorReturn = function(self, call) {
        if (!self) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
        return call && ("object" === typeof call || "function" === typeof call) ? call : self;
    };
    function getMatch(str, pos, pattern) {
        var i = 0, strQ = str.toUpperCase(), patternQ = pattern.toUpperCase();
        while (strQ[pos + i] && strQ[pos + i] == patternQ[i]) i++;
        return str.substr(pos, i);
    }
    function getInteger(str, pos) {
        str = str.substring(pos);
        var match = str.match(/^\d+/);
        return match && match[0];
    }
    function parseNode(text, token, pos) {
        var result = parseToken(text, token, pos);
        if (result.err && "static" != token.type && text.startsWith(token.placeholder, pos) && (result.err > 1 || result.viewValue.length <= token.placeholder.length)) return {
            empty: true,
            viewValue: token.placeholder
        };
        return result;
    }
    function parseToken(text, token, pos) {
        var m, match, value, j;
        if ("static" == token.type) {
            if (!text.startsWith(token.value, pos)) return {
                err: 2,
                code: "TEXT_MISMATCH",
                message: "Pattern value mismatch"
            };
            return {
                viewValue: token.value
            };
        }
        if ("number" == token.type) {
            if (value = getInteger(text, pos), null == value) return {
                err: 1,
                code: "NUMBER_MISMATCH",
                message: "Invalid number",
                viewValue: ""
            };
            if (value.length < token.minLength) return {
                err: 1,
                code: "NUMBER_TOOSHORT",
                message: "The length of number is too short",
                value: +value,
                viewValue: value,
                properValue: _export_num2str_(+value, token.minLength, token.maxLength)
            };
            if (value.length > token.maxLength) value = value.substr(0, token.maxLength);
            if (+value < token.min) return {
                err: 1,
                code: "NUMBER_TOOSMALL",
                message: "The number is too small",
                value: +value,
                viewValue: value,
                properValue: _export_num2str_(token.min, token.minLength, token.maxLength)
            };
            if (value.length > token.minLength && "0" == value[0]) return {
                err: 1,
                code: "LEADING_ZERO",
                message: "The number has too many leading zero",
                value: +value,
                viewValue: value,
                properValue: _export_num2str_(+value, token.minLength, token.maxLength)
            };
            if (+value > token.max) return {
                err: 1,
                code: "NUMBER_TOOLARGE",
                message: "The number is too large",
                value: +value,
                viewValue: value,
                properValue: _export_num2str_(token.max, token.minLength, token.maxLength)
            };
            return {
                value: +value,
                viewValue: value
            };
        }
        if ("select" == token.type) {
            for (match = "", j = 0; j < token.select.length; j++) if (m = getMatch(text, pos, token.select[j]), 
            m && m.length > match.length) value = j, match = m;
            if (!match) return {
                err: 1,
                code: "SELECT_MISMATCH",
                message: "Invalid select",
                viewValue: ""
            };
            if (match != token.select[value]) return {
                err: 1,
                code: "SELECT_INCOMPLETE",
                message: "Incomplete select",
                value: value + 1,
                viewValue: match,
                selected: token.select[value]
            };
            return {
                value: value + 1,
                viewValue: match
            };
        }
        throw "Unknown token type: " + token.type;
    }
    function parseNodes(nodes, text) {
        var node, r, pos = 0, result = [];
        var _iterator = nodes, _isArray = Array.isArray(_iterator), _i = 0;
        for (_iterator = _isArray ? _iterator : _iterator[Symbol.iterator](); ;) {
            if (_isArray) {
                if (_i >= _iterator.length) break;
                node = _iterator[_i++];
            } else {
                if (_i = _iterator.next(), _i.done) break;
                node = _i.value;
            }
            if (r = parseNode(text, node.token, pos), r.node = node, r.pos = pos, r.token = node.token, 
            r.err >= 2) throw r.text = text, r;
            pos += r.viewValue.length, result.push(r);
        }
        var last = result[result.length - 1];
        if (last.pos + last.viewValue.length < text.length) throw {
            code: "TEXT_TOOLONG",
            message: "Text is too long",
            text: text
        };
        return result;
    }
    function formatNode(value, token) {
        if ("static" == token.type) return {
            viewValue: token.value
        };
        var v = token.extract(value);
        if ("number" == token.type) return {
            value: v,
            viewValue: _export_num2str_(v, token.minLength, token.maxLength)
        };
        if ("select" == token.type) return {
            value: v,
            viewValue: token.select[v - 1]
        };
        throw "Unknown type to format: " + token.type;
    }
    function formatNodes(value, nodes, ignoreEmpty) {
        var r, node, result = [];
        var _iterator2 = nodes, _isArray2 = Array.isArray(_iterator2), _i2 = 0;
        for (_iterator2 = _isArray2 ? _iterator2 : _iterator2[Symbol.iterator](); ;) {
            if (_isArray2) {
                if (_i2 >= _iterator2.length) break;
                node = _iterator2[_i2++];
            } else {
                if (_i2 = _iterator2.next(), _i2.done) break;
                node = _i2.value;
            }
            if (r = formatNode(value, node.token), "static" != node.token.type && node.empty && !ignoreEmpty) r.value = null, 
            r.viewValue = node.token.placeholder;
            result.push(r);
        }
        return result;
    }
    var Node = function() {
        function Node(parser, token) {
            classCallCheck(this, Node), this.parser = parser, this.token = token, this.value = null, 
            this.viewValue = token.value, this.offset = 0, this.next = null, this.prev = null, 
            this.nextEdit = null, this.prevEdit = null, this.empty = true;
        }
        return Node.prototype.unset = function unset() {
            if ("static" == this.token.type || this.parser.noEmpty) return;
            this.empty = true, this.parser.setValue(this.parser.value, false);
        }, Node.prototype.parse = function parse(text) {
            var pos = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
            var result = parseNode(text, this.token, pos);
            if (result.err) throw result.node = this, result.token = this.token, result;
            if (this.parser.noEmpty && result.empty) throw {
                code: "NOT_INIT_FORBIDDEN",
                message: "Empty node is forbidden",
                node: this
            };
            if (result.empty) return void this.unset();
            this.empty = false;
            var value = restoreValue(this.parser.copyValue(this.parser.value), this.token, result.value, this.parser);
            this.parser.setValue(value, false);
        }, Node.prototype.add = function add(diff) {
            var nodeValue, value = this.parser.copyValue(this.parser.value);
            var min, max;
            if (this.empty = false, value = addValue(value, this.token, diff, this.parser), 
            nodeValue = this.token.extract(value), "number" == this.token.type) min = this.token.min, 
            max = this.token.max; else if ("select" == this.token.type) min = 1, max = this.token.select.length;
            if (nodeValue < min) value = restoreValue(value, this.token, min, this.parser);
            if (nodeValue > max) value = restoreValue(value, this.token, max, this.parser);
            this.parser.setValue(value, false);
        }, Node;
    }();
    function addValue(o, tk, v, p) {
        if ("object" == ("undefined" === typeof o ? "undefined" : _typeof(o))) return tk.add(o, v, p), 
        o; else return tk.add(o, v, p);
    }
    function restoreValue(o, tk, v, p) {
        if ("object" == ("undefined" === typeof o ? "undefined" : _typeof(o))) return tk.restore(o, v, p), 
        o; else return tk.restore(o, v, p);
    }
    function createNodes(parser, tokens) {
        var tk, i, edit, nodes = [];
        var _iterator3 = tokens, _isArray3 = Array.isArray(_iterator3), _i3 = 0;
        for (_iterator3 = _isArray3 ? _iterator3 : _iterator3[Symbol.iterator](); ;) {
            if (_isArray3) {
                if (_i3 >= _iterator3.length) break;
                tk = _iterator3[_i3++];
            } else {
                if (_i3 = _iterator3.next(), _i3.done) break;
                tk = _i3.value;
            }
            nodes.push(new Node(parser, tk));
        }
        for (i = 0; i < nodes.length; i++) nodes[i].next = nodes[i + 1] || null, nodes[i].prev = nodes[i - 1] || null;
        for (edit = null, i = 0; i < nodes.length; i++) if (nodes[i].prevEdit = edit, "static" != nodes[i].token.type) edit = nodes[i];
        for (edit = null, i = nodes.length - 1; i >= 0; i--) if (nodes[i].nextEdit = edit, 
        "static" != nodes[i].token.type) edit = nodes[i];
        return nodes;
    }
    function nocopy(o) {
        return o;
    }
    function createNameMap(nodes) {
        var map = new Map();
        var _iterator4 = nodes, _isArray4 = Array.isArray(_iterator4), _i4 = 0;
        for (_iterator4 = _isArray4 ? _iterator4 : _iterator4[Symbol.iterator](); ;) {
            var _ref;
            if (_isArray4) {
                if (_i4 >= _iterator4.length) break;
                _ref = _iterator4[_i4++];
            } else {
                if (_i4 = _iterator4.next(), _i4.done) break;
                _ref = _i4.value;
            }
            var node = _ref;
            var l = map.get(node.token.name);
            if (!l) l = [], map.set(node.token.name, l);
            l.push(node);
        }
        return map;
    }
    var TextParser = function(_Emitter) {
        function TextParser() {
            classCallCheck(this, TextParser);
            var _this = possibleConstructorReturn(this, _Emitter.call(this));
            return _this._constructor.apply(_this, arguments), _this.initialize(), _this;
        }
        return inherits(TextParser, _Emitter), TextParser.prototype._constructor = function _constructor(_ref2) {
            var tokens = _ref2.tokens, _ref2$noEmpty = _ref2.noEmpty, noEmpty = _ref2$noEmpty === undefined ? false : _ref2$noEmpty, value = _ref2.value, text = _ref2.text, _ref2$copyValue = _ref2.copyValue, copyValue = _ref2$copyValue === undefined ? nocopy : _ref2$copyValue;
            if (!tokens || !tokens.length) throw new Error("option.tokens is required");
            this.tokens = tokens, this.nodes = createNodes(this, tokens), this.nameMap = createNameMap(this.nodes), 
            this.value = value, this.text = text, this.noEmpty = noEmpty, this.copyValue = copyValue, 
            this.err = false;
        }, TextParser.prototype.initialize = function initialize() {
            this.setValue(this.value);
        }, TextParser.prototype.parse = function parse(text) {
            if (!text) throw {
                code: "EMPTY",
                message: "The input is empty",
                oldText: this.text
            };
            var result, i;
            result = parseNodes(this.nodes, text);
            var comparer, changed = [];
            if (this.err) comparer = parseNodes(this.nodes, this.text); else comparer = this.nodes;
            for (i = 0; i < result.length; i++) if (!result[i].empty && result[i].viewValue != comparer[i].viewValue) result[i].token = this.nodes[i].token, 
            changed.push(result[i]);
            var empties = result.filter(function(r) {
                return r.empty;
            }), errors = result.filter(function(r) {
                return r.err;
            });
            for (i = 0; i < result.length; i++) this.nodes[i].value = result[i].value, this.nodes[i].viewValue = result[i].viewValue, 
            this.nodes[i].offset = result[i].pos, this.nodes[i].empty = result[i].empty;
            if (errors.length) throw this.err = true, errors[0]; else this.err = false;
            changed.sort(function(a, b) {
                if (b.empty) return -1;
                if (a.empty) return 1;
                return (b.token.prior || 0) - (a.token.prior || 0);
            });
            var c, value = this.copyValue(this.value);
            var _iterator5 = changed, _isArray5 = Array.isArray(_iterator5), _i5 = 0;
            for (_iterator5 = _isArray5 ? _iterator5 : _iterator5[Symbol.iterator](); ;) {
                if (_isArray5) {
                    if (_i5 >= _iterator5.length) break;
                    c = _iterator5[_i5++];
                } else {
                    if (_i5 = _iterator5.next(), _i5.done) break;
                    c = _i5.value;
                }
                value = restoreValue(value, c.token, c.value, this);
            }
            var newText = formatNodes(value, result).map(function(r) {
                return r.viewValue;
            }).join("");
            if (text != newText) throw this.err = true, {
                code: "INCONSISTENT_INPUT",
                message: "Successfully parsed but the output text doesn't match the input",
                text: text,
                oldText: this.text,
                properText: newText
            };
            if (this.text = text, this.value = value, this.emit("change", this.value), empties.length) throw {
                code: "NOT_INIT",
                message: "Some nodes are empty",
                text: text,
                node: empties[0]
            };
            return this;
        }, TextParser.prototype.setValue = function setValue(value) {
            var ignoreEmpty = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
            var result = formatNodes(value, this.nodes, ignoreEmpty);
            var i, pos = 0, text = "";
            for (i = 0; i < result.length; i++) this.nodes[i].value = result[i].value, this.nodes[i].viewValue = result[i].viewValue, 
            this.nodes[i].offset = pos, this.nodes[i].empty = ignoreEmpty ? false : this.nodes[i].empty, 
            pos += this.nodes[i].viewValue.length, text += this.nodes[i].viewValue;
            return this.value = value, this.text = text, this.emit("change", this.value), this;
        }, TextParser.prototype.isEmpty = function isEmpty(text) {
            var result;
            if (text) try {
                result = parseNodes(this.nodes, text);
            } catch (err) {
                return false;
            } else result = this.nodes;
            var i;
            for (i = 0; i < result.length; i++) if ("static" != this.nodes[i].token.type && !result[i].empty) return false;
            return true;
        }, TextParser.prototype.isInit = function isInit() {
            var node;
            var _iterator6 = this.nodes, _isArray6 = Array.isArray(_iterator6), _i6 = 0;
            for (_iterator6 = _isArray6 ? _iterator6 : _iterator6[Symbol.iterator](); ;) {
                if (_isArray6) {
                    if (_i6 >= _iterator6.length) break;
                    node = _iterator6[_i6++];
                } else {
                    if (_i6 = _iterator6.next(), _i6.done) break;
                    node = _i6.value;
                }
                if ("static" != node.token.type && node.empty) return false;
            }
            return true;
        }, TextParser.prototype.unset = function unset() {
            var node;
            var _iterator7 = this.nodes, _isArray7 = Array.isArray(_iterator7), _i7 = 0;
            for (_iterator7 = _isArray7 ? _iterator7 : _iterator7[Symbol.iterator](); ;) {
                if (_isArray7) {
                    if (_i7 >= _iterator7.length) break;
                    node = _iterator7[_i7++];
                } else {
                    if (_i7 = _iterator7.next(), _i7.done) break;
                    node = _i7.value;
                }
                node.empty = true;
            }
            return this.setValue(this.value, false), this;
        }, TextParser.prototype.getText = function getText() {
            return this.text;
        }, TextParser.prototype.getValue = function getValue() {
            return this.value;
        }, TextParser.prototype.getNodes = function getNodes(name) {
            if (name) return this.nameMap.get(name);
            return this.nodes;
        }, TextParser;
    }(Emitter);
    function findNearestNode(i, nodes) {
        if (!nodes.length) return;
        var _matchNodes$map = matchNodes(nodes, i).map(function(r) {
            return r.node;
        }), left = _matchNodes$map[0], right = _matchNodes$map[1];
        if (left == right) return left;
        if (i - left.offset - left.viewValue.length <= right.offset - i) return left;
        return right;
    }
    function matchNodes(nodes, start) {
        var end = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : start;
        var node, left, right;
        var _iterator = nodes, _isArray = Array.isArray(_iterator), _i = 0;
        for (_iterator = _isArray ? _iterator : _iterator[Symbol.iterator](); ;) {
            if (_isArray) {
                if (_i >= _iterator.length) break;
                node = _iterator[_i++];
            } else {
                if (_i = _iterator.next(), _i.done) break;
                node = _i.value;
            }
            if (node.offset <= start) left = {
                node: node,
                pos: start - node.offset
            };
            if (node.offset + node.viewValue.length >= end && !right) right = {
                node: node,
                pos: end - node.offset
            };
        }
        if (!right) {
            var last = nodes[nodes.length - 1];
            right = {
                node: last,
                pos: last.viewValue.length
            };
        }
        if (!left) {
            var first = nodes[0];
            left = {
                node: first,
                pos: 0
            };
        }
        if (left.pos > left.node.viewValue.length) left.pos = left.node.viewValue.length;
        return [ left, right ];
    }
    var Selection = function() {
        function Selection(element, nodes) {
            classCallCheck(this, Selection), this.el = element, this.nodes = nodes, this.range = {
                node: findNearestNode(0, this.nodes),
                start: 0,
                end: "end"
            };
        }
        return Selection.prototype.selectNearestNode = function selectNearestNode() {
            var range = this.el.getSelection();
            if (!range) return;
            this.select({
                node: findNearestNode(range.start, this.nodes),
                start: 0,
                end: "end"
            });
        }, Selection.prototype.select = function select(range) {
            if (range = Object.assign(this.range, range), range.node) this.el.setSelection(range.node.offset + range.start, range.node.offset + ("end" == range.end ? range.node.viewValue.length : range.end));
        }, Selection.prototype.hasNext = function hasNext() {
            if (this.range.node) return this.range.node.nextEdit;
        }, Selection.prototype.hasPrev = function hasPrev() {
            if (this.range.node) return this.range.node.prevEdit;
        }, Selection.prototype.selectNext = function selectNext() {
            var node = this.hasNext(), range = {
                start: 0,
                end: "end"
            };
            if (node) range.node = node;
            this.select(range);
        }, Selection.prototype.selectPrev = function selectPrev() {
            var node = this.hasPrev(), range = {
                start: 0,
                end: "end"
            };
            if (node) range.node = node;
            this.select(range);
        }, Selection.prototype.get = function get$$1() {
            if (!this.nodes.length) return;
            var range = this.el.getSelection();
            if (!range) return;
            var _matchNodes = matchNodes(this.nodes, range.start, range.end), left = _matchNodes[0], right = _matchNodes[1];
            if (left.node == right.node) this.range = {
                node: left.node,
                start: left.pos,
                end: right.pos
            };
        }, Selection.prototype.atNodeEnd = function atNodeEnd() {
            if (!this.range.node) return;
            this.get();
            var len = this.range.node.viewValue.length, max = this.range.node.token.maxLength, start = "end" == this.range.start ? len : this.range.start, end = "end" == this.range.end ? len : this.range.end;
            return start == end && start == (null != max ? max : len) || !len;
        }, Selection.prototype.atNodeStart = function atNodeStart() {
            if (!this.range.node) return;
            this.get();
            var len = this.range.node.viewValue.length, start = "end" == this.range.start ? len : this.range.start, end = "end" == this.range.end ? len : this.range.end;
            return start == end && 0 == start;
        }, Selection;
    }();
    var InputMask = function(_Emitter) {
        function InputMask() {
            classCallCheck(this, InputMask);
            var _this = possibleConstructorReturn(this, _Emitter.call(this));
            return _this._constructor.apply(_this, arguments), _this.initialize(), _this;
        }
        return inherits(InputMask, _Emitter), InputMask.prototype._constructor = function _constructor(element, textParser) {
            var separators = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : "";
            this.el = element, this.tp = textParser, this.separators = separators, this.sel = new Selection(element, textParser.getNodes().filter(function(n) {
                return "static" != n.token.type;
            }));
        }, InputMask.prototype.initialize = function initialize() {
            var _this2 = this;
            this.el.on("mousedown", function() {
                _this2.mousedown = true;
            }), this.el.on("focus", function() {
                if (_this2.mousedown) return;
                setTimeout(function() {
                    _this2.sel.select({
                        start: 0,
                        end: "end"
                    });
                });
            }), this.el.on("click", function() {
                _this2.mousedown = false, _this2.sel.selectNearestNode();
            }), this.el.on("input", function() {
                _this2.digest(null, _this2.el.val());
            }), this.el.on("keydown", function(e) {
                if (e.altKey || e.ctrlKey) return;
                if (37 == e.keyCode || 9 == e.keyCode && e.shiftKey && _this2.sel.hasPrev()) e.preventDefault(), 
                _this2.tryFixingError(), _this2.sel.selectPrev(); else if (39 == e.keyCode || 9 == e.keyCode && !e.shiftKey && _this2.sel.hasNext()) e.preventDefault(), 
                _this2.tryFixingError(), _this2.sel.selectNext(); else if (38 == e.keyCode) {
                    if (e.preventDefault(), _this2.sel.selectNearestNode(), _this2.sel.range.node) _this2.sel.range.node.add(1);
                    _this2.val(_this2.tp.getText()), _this2.sel.select({
                        start: 0,
                        end: "end"
                    });
                } else if (40 == e.keyCode) {
                    if (e.preventDefault(), _this2.sel.selectNearestNode(), _this2.sel.range.node) _this2.sel.range.node.add(-1);
                    _this2.val(_this2.tp.getText()), _this2.sel.select({
                        start: 0,
                        end: "end"
                    });
                } else if (36 == e.keyCode || 35 == e.keyCode) setTimeout(function() {
                    return _this2.sel.selectNearestNode();
                }); else if (46 == e.keyCode) {
                    if (_this2.sel.atNodeEnd()) e.preventDefault(), _this2.tryFixingError(), _this2.sel.selectNext();
                } else if (8 == e.keyCode) if (_this2.sel.atNodeStart()) e.preventDefault(), _this2.tryFixingError(), 
                _this2.sel.selectPrev();
            }), this.el.on("keypress", function(e) {
                var charCode = null == e.charCode ? e.keyCode : e.charCode, key = String.fromCharCode(charCode), separators = _this2.separators, node = _this2.sel.range.node;
                if (node && node.next && "static" == node.next.token.type) separators += node.next.viewValue[0];
                if (separators.includes(key)) return e.preventDefault(), _this2.tryFixingError(), 
                void _this2.sel.selectNext();
                setTimeout(function() {
                    if (_this2.sel.atNodeEnd() && _this2.sel.range.node.viewValue) _this2.tryFixingError(), 
                    _this2.sel.selectNext();
                });
            }), this.el.on("blur", function() {
                setTimeout(function() {
                    _this2.tryFixingError();
                });
            }), this.tp.on("change", function() {
                if (!_this2.err && !_this2.inDigest) _this2.val(_this2.tp.getText()), _this2.sel.select();
            });
            var text = this.el.val();
            if (text) this.digest(null, text, true); else this.val(this.tp.getText());
        }, InputMask.prototype.errorViewLength = function errorViewLength() {
            if (this.err && null != this.err.viewValue) return this.err.viewValue.length;
            return undefined;
        }, InputMask.prototype.val = function val(text) {
            if (this.el.val() != text) this.el.val(text);
            this.err = null;
        }, InputMask.prototype.tryFixingError = function tryFixingError() {
            if (!this.err) return;
            if (this.err.properValue) this.digest(this.err.node, this.err.properValue, true); else if (this.err.node) this.err.node.unset(), 
            this.digest(null, this.tp.getText());
        }, InputMask.prototype.digest = function digest(node, text, fixErr) {
            var range, digest = 10;
            this.inDigest = true;
            while (digest--) {
                this.err = null;
                try {
                    if (node) node.parse(text); else this.tp.parse(text);
                } catch (err) {
                    if (this.emit("digest", err), this.sel.get(), "NOT_INIT" == err.code) break;
                    if (this.err = err, !fixErr && ("NUMBER_TOOSHORT" == err.code || "NUMBER_TOOSMALL" == err.code || "NUMBER_MISMATCH" == err.code || "SELECT_MISMATCH" == err.code || "LEADING_ZERO" == err.code)) break;
                    if ("SELECT_INCOMPLETE" == err.code) {
                        node = err.node, text = err.selected, range = {
                            end: "end"
                        };
                        continue;
                    }
                    if (null != err.properValue) node = err.node, text = err.properValue; else if (null != err.properText) node = null, 
                    text = err.properText; else {
                        if ("EMPTY" == err.code) this.tp.unset();
                        if (err.node) err.node.unset();
                        node = null, text = this.tp.getText(), range = {
                            start: 0,
                            end: "end"
                        };
                    }
                    continue;
                }
                break;
            }
            if (!this.err) if (this.val(this.tp.getText()), digest < 9) this.sel.select(range);
            if (this.inDigest = false, digest < 0) throw new Error("InputMask.digest crashed! Infinite loop on " + text);
        }, InputMask;
    }(Emitter);
    var _export_TextParser_ = TextParser;
    var _export_InputMask_ = InputMask;
    function init($locale, datetimePlaceholder) {
        var formats = $locale.DATETIME_FORMATS;
        var tokenRE = /yyyy|yy|y|M{1,4}|dd?|EEEE?|HH?|hh?|mm?|ss?|([.,])sss|a|Z{1,2}|ww|w|'(([^']+|'')*)'/g;
        var definedTokens = {
            y: {
                minLength: 1,
                maxLength: 4,
                max: 9999,
                min: 0,
                name: "year",
                type: "number"
            },
            yy: {
                minLength: 2,
                maxLength: 2,
                name: "yearShort",
                type: "number"
            },
            yyyy: {
                minLength: 4,
                maxLength: 4,
                max: 9999,
                min: 0,
                name: "year",
                type: "number"
            },
            MMMM: {
                name: "month",
                type: "select",
                select: formats.MONTH
            },
            MMM: {
                name: "month",
                type: "select",
                select: formats.SHORTMONTH
            },
            MM: {
                minLength: 2,
                maxLength: 2,
                name: "month",
                type: "number"
            },
            M: {
                minLength: 1,
                maxLength: 2,
                name: "month",
                type: "number",
                min: 1
            },
            dd: {
                minLength: 2,
                maxLength: 2,
                name: "date",
                type: "number"
            },
            d: {
                minLength: 1,
                maxLength: 2,
                name: "date",
                type: "number",
                min: 1
            },
            EEEE: {
                name: "day",
                type: "select",
                select: fixDay(formats.DAY)
            },
            EEE: {
                name: "day",
                type: "select",
                select: fixDay(formats.SHORTDAY)
            },
            HH: {
                minLength: 2,
                maxLength: 2,
                name: "hour",
                type: "number"
            },
            H: {
                minLength: 1,
                maxLength: 2,
                name: "hour",
                type: "number"
            },
            hh: {
                minLength: 2,
                maxLength: 2,
                name: "hour12",
                type: "number"
            },
            h: {
                minLength: 1,
                maxLength: 2,
                name: "hour12",
                type: "number"
            },
            mm: {
                minLength: 2,
                maxLength: 2,
                name: "minute",
                type: "number"
            },
            m: {
                minLength: 1,
                maxLength: 2,
                name: "minute",
                type: "number"
            },
            ss: {
                minLength: 2,
                maxLength: 2,
                name: "second",
                type: "number"
            },
            s: {
                minLength: 1,
                maxLength: 2,
                name: "second",
                type: "number"
            },
            sss: {
                minLength: 3,
                maxLength: 3,
                name: "millisecond",
                type: "number"
            },
            a: {
                name: "ampm",
                type: "select",
                select: formats.AMPMS
            },
            ww: {
                minLength: 2,
                maxLength: 2,
                max: 53,
                name: "week",
                type: "number"
            },
            w: {
                minLength: 1,
                maxLength: 2,
                max: 53,
                name: "week",
                type: "number"
            },
            Z: {
                name: "timezone",
                type: "static"
            },
            ZZ: {
                name: "timezone",
                type: "static",
                colon: true
            },
            string: {
                name: "string",
                type: "static"
            }
        };
        var nameConf = {
            year: {
                extract: function(d) {
                    var v = d.getFullYear() % 1e4;
                    return v >= 0 ? v : 0;
                },
                restore: function(d, v) {
                    return d.setFullYear(v);
                },
                add: function(d, v) {
                    return d.setFullYear(d.getFullYear() + v);
                },
                prior: 7
            },
            yearShort: {
                extract: function(d) {
                    var v = d.getFullYear() % 100;
                    return v >= 0 ? v : v + 100;
                },
                restore: function(d, v) {
                    return d.setFullYear(v);
                },
                add: function(d, v) {
                    return d.setFullYear(d.getFullYear() + v);
                },
                prior: 7
            },
            month: {
                extract: function(d) {
                    return d.getMonth() + 1;
                },
                restore: function(d, v) {
                    if (d.setMonth(v - 1), d.getMonth() == v) d.setDate(0);
                },
                add: function(d, v) {
                    if (v = d.getMonth() + v, d.setMonth(v), d.getMonth() == v + 1) d.setDate(0);
                },
                prior: 5
            },
            date: {
                extract: function(d) {
                    return d.getDate();
                },
                restore: function(d, v, p) {
                    var oldMonth = d.getMonth();
                    if (d.setDate(v), d.getMonth() != oldMonth && v <= 31) {
                        var monthNodes = p.getNodes("month");
                        if (monthNodes && monthNodes.every(function(n) {
                            return n.empty;
                        })) d.setDate(v);
                    }
                },
                add: function(d, v, p) {
                    this.restore(d, d.getDate() + v, p);
                },
                prior: 4
            },
            day: {
                extract: function(d) {
                    return d.getDay() || 7;
                },
                restore: function setDay(date, day) {
                    var month = date.getMonth(), diff = day - (date.getDay() || 7);
                    if (date.setDate(date.getDate() + diff), date.getMonth() != month) if (diff > 0) date.setDate(date.getDate() - 7); else date.setDate(date.getDate() + 7);
                },
                add: function(d, v) {
                    return d.setDate(d.getDate() + v);
                },
                prior: 4
            },
            hour: {
                extract: function(d) {
                    return d.getHours();
                },
                restore: function(d, v) {
                    return d.setHours(v);
                },
                add: function(d, v) {
                    return d.setHours(d.getHours() + v);
                },
                prior: 2
            },
            hour12: {
                extract: function(d) {
                    return d.getHours() % 12 || 12;
                },
                restore: function setHour12(date, hour) {
                    if (hour %= 12, date.getHours() >= 12) hour += 12;
                    date.setHours(hour);
                },
                add: function(d, v) {
                    return d.setHours(d.getHours() + v);
                },
                prior: 2
            },
            ampm: {
                extract: function(d) {
                    return d.getHours() < 12 ? 1 : 2;
                },
                restore: function setAmpm(date, ampm) {
                    var hour = date.getHours();
                    if (hour < 12 == ampm > 1) date.setHours((hour + 12) % 24);
                },
                add: function(d, v) {
                    return d.setHours(d.getHours() + 12 * v);
                },
                prior: 3
            },
            minute: {
                extract: function(d) {
                    return d.getMinutes();
                },
                restore: function(d, v) {
                    return d.setMinutes(v);
                },
                add: function(d, v) {
                    return d.setMinutes(d.getMinutes() + v);
                },
                prior: 0
            },
            second: {
                extract: function(d) {
                    return d.getSeconds();
                },
                restore: function(d, v) {
                    return d.setSeconds(v);
                },
                add: function(d, v) {
                    return d.setSeconds(d.getSeconds() + v);
                },
                prior: 1
            },
            millisecond: {
                extract: function(d) {
                    return d.getMilliseconds();
                },
                restore: function(d, v) {
                    return d.setMilliseconds(v);
                },
                add: function(d, v) {
                    return d.setMilliseconds(d.getMilliseconds() + v);
                },
                prior: 1
            },
            week: {
                extract: getWeek,
                restore: function(d, v) {
                    return d.setDate(d.getDate() + 7 * (v - getWeek(d)));
                },
                add: function(d, v) {
                    return d.setDate(d.getDate() + 7 * v);
                },
                prior: 6
            }
        };
        for (var name in nameConf) nameConf[name].placeholder = datetimePlaceholder[name];
        var _iterator = Object.values(definedTokens), _isArray = Array.isArray(_iterator), _i = 0;
        for (_iterator = _isArray ? _iterator : _iterator[Symbol.iterator](); ;) {
            var _ref;
            if (_isArray) {
                if (_i >= _iterator.length) break;
                _ref = _iterator[_i++];
            } else {
                if (_i = _iterator.next(), _i.done) break;
                _ref = _i.value;
            }
            var tk = _ref;
            if (nameConf[tk.name]) angular.extend(tk, nameConf[tk.name]);
        }
        var SYS_TIMEZONE = function() {
            var offset = -new Date().getTimezoneOffset(), sign = offset >= 0 ? "+" : "-", absOffset = Math.abs(offset), hour = Math.floor(absOffset / 60), min = absOffset % 60;
            return sign + _export_num2str_(hour, 2, 2) + _export_num2str_(min, 2, 2);
        }();
        function fixDay(days) {
            var i, s = [];
            for (i = 1; i < days.length; i++) s.push(days[i]);
            return s.push(days[0]), s;
        }
        function createTokens(format) {
            var match, tokens = [], pos = 0;
            while (match = tokenRE.exec(format)) {
                if (match.index > pos) tokens.push(angular.extend({
                    value: format.substring(pos, match.index)
                }, definedTokens.string)), pos = match.index;
                if (match.index == pos) {
                    if (match[1]) tokens.push(angular.extend({
                        value: match[1]
                    }, definedTokens.string)), tokens.push(definedTokens.sss); else if (match[2]) tokens.push(angular.extend({
                        value: match[2].replace("''", "'")
                    }, definedTokens.string)); else if ("timezone" == definedTokens[match[0]].name) {
                        var tz = SYS_TIMEZONE;
                        if (definedTokens[match[0]].colon) tz = insertColon(tz);
                        tokens.push(angular.extend({
                            value: tz
                        }, definedTokens[match[0]]));
                    } else tokens.push(definedTokens[match[0]]);
                    pos = tokenRE.lastIndex;
                }
            }
            if (pos < format.length) tokens.push(angular.extend({
                value: format.substring(pos)
            }, definedTokens.string));
            return tokens;
        }
        function getWeek(date) {
            var yearStart = new Date(date.getFullYear(), 0, 1);
            var weekStart = new Date(yearStart.getTime());
            if (weekStart.getDay() > 4) weekStart.setDate(weekStart.getDate() + (1 - weekStart.getDay()) + 7); else weekStart.setDate(weekStart.getDate() + (1 - weekStart.getDay()));
            var diff = date.getTime() - weekStart.getTime();
            return Math.floor(diff / (7 * 24 * 60 * 60 * 1e3));
        }
        function insertColon(timezone) {
            if (":" == timezone[3]) return timezone;
            return timezone.substr(0, 3) + ":" + timezone.substr(3, 2);
        }
        function removeColon(timezone) {
            if (":" != timezone[3]) return timezone;
            return timezone.substr(0, 3) + timezone.substr(4, 2);
        }
        function offset(date, timezone) {
            timezone = removeColon(timezone);
            var hour = +timezone.substr(1, 2), min = +timezone.substr(3, 2), sig = timezone[0] + "1", offset = (60 * hour + min) * sig;
            return new Date(date.getTime() + 60 * (offset - -date.getTimezoneOffset()) * 1e3);
        }
        function deoffset(date, timezone) {
            timezone = removeColon(timezone);
            var hour = +timezone.substr(1, 2), min = +timezone.substr(3, 2), sig = timezone[0] + "1", offset = (60 * hour + min) * sig;
            return new Date(date.getTime() + 60 * (-date.getTimezoneOffset() - offset) * 1e3);
        }
        var DatetimeParser = function() {
            function DatetimeParser(tp) {
                classCallCheck(this, DatetimeParser), this.tp = tp, this.timezone = SYS_TIMEZONE, 
                this.timezoneNodes = this.tp.nodes.filter(function(n) {
                    return "timezone" == n.token.name;
                });
            }
            return DatetimeParser.prototype.parse = function parse(text) {
                return this.tp.parse(text), this;
            }, DatetimeParser.prototype.getText = function getText() {
                return this.tp.getText();
            }, DatetimeParser.prototype.setDate = function setDate(date, ignoreEmpty) {
                return this.tp.setValue(offset(date, this.timezone), ignoreEmpty), this;
            }, DatetimeParser.prototype.getDate = function getDate() {
                return deoffset(this.tp.getValue(), this.timezone);
            }, DatetimeParser.prototype.setTimezone = function setTimezone() {
                var timezone = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : SYS_TIMEZONE;
                if (timezone == this.timezone) return;
                var date = this.getDate();
                this.timezone = timezone;
                var _iterator2 = this.timezoneNodes, _isArray2 = Array.isArray(_iterator2), _i2 = 0;
                for (_iterator2 = _isArray2 ? _iterator2 : _iterator2[Symbol.iterator](); ;) {
                    var _ref2;
                    if (_isArray2) {
                        if (_i2 >= _iterator2.length) break;
                        _ref2 = _iterator2[_i2++];
                    } else {
                        if (_i2 = _iterator2.next(), _i2.done) break;
                        _ref2 = _i2.value;
                    }
                    var n = _ref2;
                    if (n.token.colon) n.token.value = insertColon(timezone); else n.token.value = removeColon(timezone);
                }
                return this.setDate(date, false);
            }, DatetimeParser.prototype.isEmpty = function isEmpty() {
                return this.tp.isEmpty.apply(this.tp, arguments);
            }, DatetimeParser.prototype.isInit = function isInit() {
                return this.tp.isInit.apply(this.tp, arguments);
            }, DatetimeParser.prototype.unset = function unset() {
                return this.tp.unset(), this;
            }, DatetimeParser;
        }();
        return function createParser(format) {
            var yearCheck, tokens = createTokens(formats[format] || format);
            if (tokens.some(function(t) {
                return "yearShort" == t.name;
            })) yearCheck = function(fn) {
                return function(d) {
                    fn.apply(this, arguments);
                    var y = d.getFullYear();
                    if (y < 0) d.setFullYear(y + 100);
                };
            }; else yearCheck = function(fn) {
                return function(d) {
                    fn.apply(this, arguments);
                    var y = d.getFullYear();
                    if (y < 0) d.setFullYear(0);
                    if (y > 9999) d.setFullYear(9999);
                };
            };
            var _iterator3 = tokens, _isArray3 = Array.isArray(_iterator3), _i3 = 0;
            for (_iterator3 = _isArray3 ? _iterator3 : _iterator3[Symbol.iterator](); ;) {
                var _ref3;
                if (_isArray3) {
                    if (_i3 >= _iterator3.length) break;
                    _ref3 = _iterator3[_i3++];
                } else {
                    if (_i3 = _iterator3.next(), _i3.done) break;
                    _ref3 = _i3.value;
                }
                var tk = _ref3;
                if (tk.add) tk.add = yearCheck(tk.add);
                if (tk.restore) tk.restore = yearCheck(tk.restore);
            }
            var tp = new _export_TextParser_({
                tokens: tokens,
                value: new Date(),
                copyValue: function(o) {
                    return new Date(o.getTime());
                }
            });
            return new DatetimeParser(tp);
        };
    }
    function init$1(datetime, $log, $document) {
        var Element = function() {
            function Element(element, document) {
                classCallCheck(this, Element), this.el = element, this.doc = document;
            }
            return Element.prototype.on = function on(eventType, callback) {
                if ("input" == eventType) return;
                return this.el.on(eventType, callback);
            }, Element.prototype.getSelection = function getSelection() {
                var el = this.el[0], doc = this.doc;
                if (doc.activeElement != el) return;
                var start = el.selectionStart, end = el.selectionEnd;
                if (angular.isDefined(start) && angular.isDefined(end)) return {
                    start: start,
                    end: end
                };
                return this.getSelectionIE();
            }, Element.prototype.getSelectionIE = function getSelectionIE() {
                var el = this.el[0], doc = this.doc;
                var bookmark = doc.selection.createRange().getBookmark(), range = el.createTextRange(), range2 = range.duplicate();
                range.moveToBookmark(bookmark), range2.setEndPoint("EndToStart", range);
                var start = range2.text.length, end = start + range.text.length;
                return {
                    start: start,
                    end: end
                };
            }, Element.prototype.setSelection = function setSelection(start, end) {
                var el = this.el[0], doc = this.doc;
                if (doc.activeElement != el) return;
                if (el.setSelectionRange) el.setSelectionRange(start, end); else this.setSelectionIE(start, end);
            }, Element.prototype.setSelectionIE = function setSelectionIE(start, end) {
                var el = this.el[0], select = el.createTextRange();
                select.moveStart("character", start), select.collapse(), select.moveEnd("character", end - start), 
                select.select();
            }, Element.prototype.val = function val() {
                var _el;
                return (_el = this.el).val.apply(_el, arguments);
            }, Element;
        }();
        return {
            restrict: "A",
            require: "?ngModel",
            link: function linkFunc(scope, element, attrs, ngModel) {
                if (!ngModel) return false;
                attrs.ngTrim = "false";
                var isUtc, parser = datetime(attrs.datetime), modelParser = attrs.datetimeModel && datetime(attrs.datetimeModel), maskElement = new Element(element, $document[0]), mask = new _export_InputMask_(maskElement, parser.tp, attrs.datetimeSeparator);
                function setUtc(val) {
                    if (val && !isUtc) {
                        if (isUtc = true, parser.setTimezone("+0000"), modelParser) modelParser.setTimezone("+0000");
                    } else if (!val && isUtc) if (isUtc = false, parser.setTimezone(), modelParser) modelParser.setTimezone();
                }
                function setTimezone(val) {
                    if (parser.setTimezone(val), modelParser) modelParser.setTimezone(val);
                }
                if (mask.on("digest", function(err) {
                    if ("NOT_INIT" != err.code) ngModel.$setValidity("datetime", false);
                }), parser.tp.on("change", function() {
                    scope.$evalAsync(function() {
                        if (mask.err) return void ngModel.$setValidity("datetime", false);
                        if (parser.isInit() || parser.isEmpty()) ngModel.$setValidity("datetime", true); else ngModel.$setValidity("datetime", false);
                        if (parser.getText() != ngModel.$viewValue) ngModel.$setViewValue(parser.getText());
                    });
                }), angular.isDefined(attrs.datetimeUtc)) if (attrs.datetimeUtc.length > 0) scope.$watch(attrs.datetimeUtc, setUtc); else setUtc(true);
                if (angular.isDefined(attrs.datetimeTimezone)) if (/^[+-]\d{2}:?\d{2}$/.test(attrs.datetimeTimezone)) setTimezone(attrs.datetimeTimezone); else scope.$watch(attrs.datetimeTimezone, setTimezone);
                function validMin(value) {
                    if (ngModel.$isEmpty(value) || ngModel.$isEmpty(attrs.min)) return true;
                    if (!angular.isDate(value)) value = modelParser.getDate();
                    return value >= new Date(attrs.min);
                }
                function validMax(value) {
                    if (ngModel.$isEmpty(value) || ngModel.$isEmpty(attrs.max)) return true;
                    if (!angular.isDate(value)) value = modelParser.getDate();
                    return value <= new Date(attrs.max);
                }
                if (ngModel.$validators) ngModel.$validators.min = validMin, ngModel.$validators.max = validMax;
                function validMinMax(date) {
                    if (ngModel.$validate) ngModel.$validate(); else ngModel.$setValidity("min", validMin(date)), 
                    ngModel.$setValidity("max", validMax(date));
                    return !ngModel.$error.min && !ngModel.$error.max;
                }
                function validModelType(model) {
                    if (angular.isDate(model) && !modelParser) return true;
                    if (angular.isString(model) && modelParser) return true;
                    return false;
                }
                attrs.$observe("min", function() {
                    validMinMax(parser.getDate());
                }), attrs.$observe("max", function() {
                    validMinMax(parser.getDate());
                }), ngModel.$render = function() {}, ngModel.$isEmpty = function(value) {
                    if (!value) return true;
                    if ("string" == typeof value) return parser.isEmpty(value);
                    return false;
                }, ngModel.$parsers.unshift(function(viewValue) {
                    if (angular.isUndefined(viewValue)) viewValue = parser.getText();
                    if (!angular.isString(viewValue)) return viewValue;
                    if (mask.digest(null, viewValue), !parser.isInit()) return undefined;
                    var date = parser.getDate();
                    if (ngModel.$validate || validMinMax(date)) if (modelParser) return modelParser.setDate(date).getText(); else return new Date(date.getTime());
                    return undefined;
                }), ngModel.$formatters.push(function(modelValue) {
                    if (ngModel.$setValidity("datetime", true), !modelValue) return parser.unset(), 
                    scope.$evalAsync(function() {
                        ngModel.$setViewValue(parser.getText());
                    }), parser.getText();
                    if (!validModelType(modelValue)) return modelValue;
                    if (modelParser) modelValue = modelParser.parse(modelValue).getDate();
                    if (!ngModel.$validate) validMinMax(modelValue);
                    return parser.setDate(modelValue).getText();
                });
            },
            priority: 100
        };
    }
    angular.module("datetime").factory("datetime", init), init.$inject = [ "$locale", "datetimePlaceholder" ], 
    angular.module("datetime").directive("datetime", init$1), init$1.$inject = [ "datetime", "$log", "$document" ];
})(angular);
