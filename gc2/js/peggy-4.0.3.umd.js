(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.peggy = factory());
})(this, (function () { 'use strict';

	var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

	function getDefaultExportFromCjs (x) {
		return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
	}

	var GrammarLocation$4 = (function () {
	    function GrammarLocation(source, start) {
	        this.source = source;
	        this.start = start;
	    }
	    GrammarLocation.prototype.toString = function () {
	        return String(this.source);
	    };
	    GrammarLocation.prototype.offset = function (loc) {
	        return {
	            line: loc.line + this.start.line - 1,
	            column: (loc.line === 1)
	                ? loc.column + this.start.column - 1
	                : loc.column,
	            offset: loc.offset + this.start.offset,
	        };
	    };
	    GrammarLocation.offsetStart = function (range) {
	        if (range.source && (typeof range.source.offset === "function")) {
	            return range.source.offset(range.start);
	        }
	        return range.start;
	    };
	    GrammarLocation.offsetEnd = function (range) {
	        if (range.source && (typeof range.source.offset === "function")) {
	            return range.source.offset(range.end);
	        }
	        return range.end;
	    };
	    return GrammarLocation;
	}());
	var grammarLocation = GrammarLocation$4;

	var __extends = (commonjsGlobal && commonjsGlobal.__extends) || (function () {
	    var extendStatics = function (d, b) {
	        extendStatics = Object.setPrototypeOf ||
	            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
	            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
	        return extendStatics(d, b);
	    };
	    return function (d, b) {
	        if (typeof b !== "function" && b !== null)
	            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
	        extendStatics(d, b);
	        function __() { this.constructor = d; }
	        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	    };
	})();
	var GrammarLocation$3 = grammarLocation;
	var setProtoOf = Object.setPrototypeOf
	    || ({ __proto__: [] } instanceof Array
	        && function (d, b) {
	            d.__proto__ = b;
	        })
	    || function (d, b) {
	        for (var p in b) {
	            if (Object.prototype.hasOwnProperty.call(b, p)) {
	                d[p] = b[p];
	            }
	        }
	    };
	var GrammarError$3 = (function (_super) {
	    __extends(GrammarError, _super);
	    function GrammarError(message, location, diagnostics) {
	        var _this = _super.call(this, message) || this;
	        setProtoOf(_this, GrammarError.prototype);
	        _this.name = "GrammarError";
	        _this.location = location;
	        if (diagnostics === undefined) {
	            diagnostics = [];
	        }
	        _this.diagnostics = diagnostics;
	        _this.stage = null;
	        _this.problems = [["error", message, location, diagnostics]];
	        return _this;
	    }
	    GrammarError.prototype.toString = function () {
	        var str = _super.prototype.toString.call(this);
	        if (this.location) {
	            str += "\n at ";
	            if ((this.location.source !== undefined)
	                && (this.location.source !== null)) {
	                str += "".concat(this.location.source, ":");
	            }
	            str += "".concat(this.location.start.line, ":").concat(this.location.start.column);
	        }
	        for (var _i = 0, _a = this.diagnostics; _i < _a.length; _i++) {
	            var diag = _a[_i];
	            str += "\n from ";
	            if ((diag.location.source !== undefined)
	                && (diag.location.source !== null)) {
	                str += "".concat(diag.location.source, ":");
	            }
	            str += "".concat(diag.location.start.line, ":").concat(diag.location.start.column, ": ").concat(diag.message);
	        }
	        return str;
	    };
	    GrammarError.prototype.format = function (sources) {
	        var srcLines = sources.map(function (_a) {
	            var source = _a.source, text = _a.text;
	            return ({
	                source: source,
	                text: (text !== null && text !== undefined)
	                    ? String(text).split(/\r\n|\n|\r/g)
	                    : [],
	            });
	        });
	        function entry(location, indent, message) {
	            if (message === void 0) { message = ""; }
	            var str = "";
	            var src = srcLines.find(function (_a) {
	                var source = _a.source;
	                return source === location.source;
	            });
	            var s = location.start;
	            var offset_s = GrammarLocation$3.offsetStart(location);
	            if (src) {
	                var e = location.end;
	                var line = src.text[s.line - 1];
	                var last = s.line === e.line ? e.column : line.length + 1;
	                var hatLen = (last - s.column) || 1;
	                if (message) {
	                    str += "\nnote: ".concat(message);
	                }
	                str += "\n --> ".concat(location.source, ":").concat(offset_s.line, ":").concat(offset_s.column, "\n").concat("".padEnd(indent), " |\n").concat(offset_s.line.toString().padStart(indent), " | ").concat(line, "\n").concat("".padEnd(indent), " | ").concat("".padEnd(s.column - 1)).concat("".padEnd(hatLen, "^"));
	            }
	            else {
	                str += "\n at ".concat(location.source, ":").concat(offset_s.line, ":").concat(offset_s.column);
	                if (message) {
	                    str += ": ".concat(message);
	                }
	            }
	            return str;
	        }
	        function formatProblem(severity, message, location, diagnostics) {
	            if (diagnostics === void 0) { diagnostics = []; }
	            var maxLine = -Infinity;
	            if (location) {
	                maxLine = diagnostics.reduce(function (t, _a) {
	                    var location = _a.location;
	                    return Math.max(t, GrammarLocation$3.offsetStart(location).line);
	                }, location.start.line);
	            }
	            else {
	                maxLine = Math.max.apply(null, diagnostics.map(function (d) { return d.location.start.line; }));
	            }
	            maxLine = maxLine.toString().length;
	            var str = "".concat(severity, ": ").concat(message);
	            if (location) {
	                str += entry(location, maxLine);
	            }
	            for (var _i = 0, diagnostics_1 = diagnostics; _i < diagnostics_1.length; _i++) {
	                var diag = diagnostics_1[_i];
	                str += entry(diag.location, maxLine, diag.message);
	            }
	            return str;
	        }
	        return this.problems
	            .filter(function (p) { return p[0] !== "info"; })
	            .map(function (p) { return formatProblem.apply(void 0, p); }).join("\n\n");
	    };
	    return GrammarError;
	}(Error));
	var grammarError = GrammarError$3;

	var __spreadArray$4 = (commonjsGlobal && commonjsGlobal.__spreadArray) || function (to, from, pack) {
	    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
	        if (ar || !(i in from)) {
	            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
	            ar[i] = from[i];
	        }
	    }
	    return to.concat(ar || Array.prototype.slice.call(from));
	};
	var visitor$d = {
	    build: function (functions) {
	        function visit(node) {
	            var args = [];
	            for (var _i = 1; _i < arguments.length; _i++) {
	                args[_i - 1] = arguments[_i];
	            }
	            return functions[node.type].apply(functions, __spreadArray$4([node], args, false));
	        }
	        function visitNop() {
	        }
	        function visitExpression(node) {
	            var args = [];
	            for (var _i = 1; _i < arguments.length; _i++) {
	                args[_i - 1] = arguments[_i];
	            }
	            return visit.apply(void 0, __spreadArray$4([node.expression], args, false));
	        }
	        function visitChildren(property) {
	            return function (node) {
	                var args = [];
	                for (var _i = 1; _i < arguments.length; _i++) {
	                    args[_i - 1] = arguments[_i];
	                }
	                node[property].forEach(function (child) { return visit.apply(void 0, __spreadArray$4([child], args, false)); });
	            };
	        }
	        var DEFAULT_FUNCTIONS = {
	            grammar: function (node) {
	                var args = [];
	                for (var _i = 1; _i < arguments.length; _i++) {
	                    args[_i - 1] = arguments[_i];
	                }
	                for (var _a = 0, _b = node.imports; _a < _b.length; _a++) {
	                    var imp = _b[_a];
	                    visit.apply(void 0, __spreadArray$4([imp], args, false));
	                }
	                if (node.topLevelInitializer) {
	                    if (Array.isArray(node.topLevelInitializer)) {
	                        for (var _c = 0, _d = node.topLevelInitializer; _c < _d.length; _c++) {
	                            var tli = _d[_c];
	                            visit.apply(void 0, __spreadArray$4([tli], args, false));
	                        }
	                    }
	                    else {
	                        visit.apply(void 0, __spreadArray$4([node.topLevelInitializer], args, false));
	                    }
	                }
	                if (node.initializer) {
	                    if (Array.isArray(node.initializer)) {
	                        for (var _e = 0, _f = node.initializer; _e < _f.length; _e++) {
	                            var init = _f[_e];
	                            visit.apply(void 0, __spreadArray$4([init], args, false));
	                        }
	                    }
	                    else {
	                        visit.apply(void 0, __spreadArray$4([node.initializer], args, false));
	                    }
	                }
	                node.rules.forEach(function (rule) { return visit.apply(void 0, __spreadArray$4([rule], args, false)); });
	            },
	            grammar_import: visitNop,
	            top_level_initializer: visitNop,
	            initializer: visitNop,
	            rule: visitExpression,
	            named: visitExpression,
	            choice: visitChildren("alternatives"),
	            action: visitExpression,
	            sequence: visitChildren("elements"),
	            labeled: visitExpression,
	            text: visitExpression,
	            simple_and: visitExpression,
	            simple_not: visitExpression,
	            optional: visitExpression,
	            zero_or_more: visitExpression,
	            one_or_more: visitExpression,
	            repeated: function (node) {
	                var args = [];
	                for (var _i = 1; _i < arguments.length; _i++) {
	                    args[_i - 1] = arguments[_i];
	                }
	                if (node.delimiter) {
	                    visit.apply(void 0, __spreadArray$4([node.delimiter], args, false));
	                }
	                return visit.apply(void 0, __spreadArray$4([node.expression], args, false));
	            },
	            group: visitExpression,
	            semantic_and: visitNop,
	            semantic_not: visitNop,
	            rule_ref: visitNop,
	            library_ref: visitNop,
	            literal: visitNop,
	            class: visitNop,
	            any: visitNop,
	        };
	        Object.keys(DEFAULT_FUNCTIONS).forEach(function (type) {
	            if (!Object.prototype.hasOwnProperty.call(functions, type)) {
	                functions[type] = DEFAULT_FUNCTIONS[type];
	            }
	        });
	        return visit;
	    },
	};
	var visitor_1 = visitor$d;

	var visitor$c = visitor_1;
	function combinePossibleArrays(a, b) {
	    if (!(a && b)) {
	        return a || b;
	    }
	    var aa = Array.isArray(a) ? a : [a];
	    aa.push(b);
	    return aa;
	}
	var asts$8 = {
	    findRule: function (ast, name) {
	        for (var i = 0; i < ast.rules.length; i++) {
	            if (ast.rules[i].name === name) {
	                return ast.rules[i];
	            }
	        }
	        return undefined;
	    },
	    indexOfRule: function (ast, name) {
	        for (var i = 0; i < ast.rules.length; i++) {
	            if (ast.rules[i].name === name) {
	                return i;
	            }
	        }
	        return -1;
	    },
	    alwaysConsumesOnSuccess: function (ast, node) {
	        function consumesTrue() { return true; }
	        function consumesFalse() { return false; }
	        var consumes = visitor$c.build({
	            choice: function (node) {
	                return node.alternatives.every(consumes);
	            },
	            sequence: function (node) {
	                return node.elements.some(consumes);
	            },
	            simple_and: consumesFalse,
	            simple_not: consumesFalse,
	            optional: consumesFalse,
	            zero_or_more: consumesFalse,
	            repeated: function (node) {
	                var min = node.min ? node.min : node.max;
	                if (min.type !== "constant" || min.value === 0) {
	                    return false;
	                }
	                if (consumes(node.expression)) {
	                    return true;
	                }
	                if (min.value > 1 && node.delimiter && consumes(node.delimiter)) {
	                    return true;
	                }
	                return false;
	            },
	            semantic_and: consumesFalse,
	            semantic_not: consumesFalse,
	            rule_ref: function (node) {
	                var rule = asts$8.findRule(ast, node.name);
	                return rule ? consumes(rule) : undefined;
	            },
	            library_ref: function () {
	                return false;
	            },
	            literal: function (node) {
	                return node.value !== "";
	            },
	            class: consumesTrue,
	            any: consumesTrue,
	        });
	        return consumes(node);
	    },
	    combine: function (asts) {
	        return asts.reduce(function (combined, ast) {
	            combined.topLevelInitializer = combinePossibleArrays(combined.topLevelInitializer, ast.topLevelInitializer);
	            combined.initializer = combinePossibleArrays(combined.initializer, ast.initializer);
	            combined.rules = combined.rules.concat(ast.rules);
	            return combined;
	        });
	    },
	};
	var asts_1 = asts$8;

	function addImportedRules$1(ast) {
	    var libraryNumber = 0;
	    for (var _i = 0, _a = ast.imports; _i < _a.length; _i++) {
	        var imp = _a[_i];
	        for (var _b = 0, _c = imp.what; _b < _c.length; _b++) {
	            var what = _c[_b];
	            var original = undefined;
	            switch (what.type) {
	                case "import_binding_all":
	                    continue;
	                case "import_binding_default":
	                    break;
	                case "import_binding":
	                    original = what.binding;
	                    break;
	                case "import_binding_rename":
	                    original = what.rename;
	                    break;
	                default:
	                    throw new TypeError("Unknown binding type");
	            }
	            ast.rules.push({
	                type: "rule",
	                name: what.binding,
	                nameLocation: what.location,
	                expression: {
	                    type: "library_ref",
	                    name: original,
	                    library: imp.from.module,
	                    libraryNumber: libraryNumber,
	                    location: what.location,
	                },
	                location: imp.from.location,
	            });
	        }
	        libraryNumber++;
	    }
	}
	var addImportedRules_1 = addImportedRules$1;

	var visitor$b = visitor_1;
	function findLibraryNumber(ast, name) {
	    var libraryNumber = 0;
	    for (var _i = 0, _a = ast.imports; _i < _a.length; _i++) {
	        var imp = _a[_i];
	        for (var _b = 0, _c = imp.what; _b < _c.length; _b++) {
	            var what = _c[_b];
	            if ((what.type === "import_binding_all") && (what.binding === name)) {
	                return libraryNumber;
	            }
	        }
	        libraryNumber++;
	    }
	    return -1;
	}
	function fixLibraryNumbers$1(ast, _options, session) {
	    var check = visitor$b.build({
	        library_ref: function (node) {
	            if (node.libraryNumber === -1) {
	                node.libraryNumber = findLibraryNumber(ast, node.library);
	                if (node.libraryNumber === -1) {
	                    session.error("Unknown module \"".concat(node.library, "\""), node.location);
	                }
	            }
	        },
	    });
	    check(ast);
	}
	var fixLibraryNumbers_1 = fixLibraryNumbers$1;

	var opcodes = {
	    PUSH: 0,
	    PUSH_EMPTY_STRING: 35,
	    PUSH_UNDEFINED: 1,
	    PUSH_NULL: 2,
	    PUSH_FAILED: 3,
	    PUSH_EMPTY_ARRAY: 4,
	    PUSH_CURR_POS: 5,
	    POP: 6,
	    POP_CURR_POS: 7,
	    POP_N: 8,
	    NIP: 9,
	    APPEND: 10,
	    WRAP: 11,
	    TEXT: 12,
	    PLUCK: 36,
	    IF: 13,
	    IF_ERROR: 14,
	    IF_NOT_ERROR: 15,
	    IF_LT: 30,
	    IF_GE: 31,
	    IF_LT_DYNAMIC: 32,
	    IF_GE_DYNAMIC: 33,
	    WHILE_NOT_ERROR: 16,
	    MATCH_ANY: 17,
	    MATCH_STRING: 18,
	    MATCH_STRING_IC: 19,
	    MATCH_CHAR_CLASS: 20,
	    MATCH_REGEXP: 20,
	    ACCEPT_N: 21,
	    ACCEPT_STRING: 22,
	    FAIL: 23,
	    LOAD_SAVED_POS: 24,
	    UPDATE_SAVED_POS: 25,
	    CALL: 26,
	    RULE: 27,
	    LIBRARY_RULE: 41,
	    SILENT_FAILS_ON: 28,
	    SILENT_FAILS_OFF: 29,
	    SOURCE_MAP_PUSH: 37,
	    SOURCE_MAP_POP: 38,
	    SOURCE_MAP_LABEL_PUSH: 39,
	    SOURCE_MAP_LABEL_POP: 40,
	};
	var opcodes_1 = opcodes;

	var __assign$1 = (commonjsGlobal && commonjsGlobal.__assign) || function () {
	    __assign$1 = Object.assign || function(t) {
	        for (var s, i = 1, n = arguments.length; i < n; i++) {
	            s = arguments[i];
	            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
	                t[p] = s[p];
	        }
	        return t;
	    };
	    return __assign$1.apply(this, arguments);
	};
	var Intern$1 = (function () {
	    function Intern(options) {
	        this.options = __assign$1({ stringify: String, convert: function (x) { return ((x)); } }, options);
	        this.items = [];
	        this.offsets = Object.create(null);
	    }
	    Intern.prototype.add = function (input) {
	        var c = this.options.convert(input);
	        if (!c) {
	            return -1;
	        }
	        var s = this.options.stringify(c);
	        var num = this.offsets[s];
	        if (num === undefined) {
	            num = this.items.push(c) - 1;
	            this.offsets[s] = num;
	        }
	        return num;
	    };
	    Intern.prototype.get = function (i) {
	        return this.items[i];
	    };
	    Intern.prototype.map = function (fn) {
	        return this.items.map(fn);
	    };
	    return Intern;
	}());
	var intern = Intern$1;

	var visitor$a = visitor_1;
	var asts$7 = asts_1;
	var GrammarError$2 = grammarError;
	var ALWAYS_MATCH$1 = 1;
	var SOMETIMES_MATCH$1 = 0;
	var NEVER_MATCH$1 = -1;
	function inferenceMatchResult$1(ast) {
	    function sometimesMatch(node) { return (node.match = SOMETIMES_MATCH$1); }
	    function alwaysMatch(node) {
	        inference(node.expression);
	        return (node.match = ALWAYS_MATCH$1);
	    }
	    function inferenceExpression(node) {
	        return (node.match = inference(node.expression));
	    }
	    function inferenceElements(elements, forChoice) {
	        var length = elements.length;
	        var always = 0;
	        var never = 0;
	        for (var i = 0; i < length; ++i) {
	            var result = inference(elements[i]);
	            if (result === ALWAYS_MATCH$1) {
	                ++always;
	            }
	            if (result === NEVER_MATCH$1) {
	                ++never;
	            }
	        }
	        if (always === length) {
	            return ALWAYS_MATCH$1;
	        }
	        if (forChoice) {
	            return never === length ? NEVER_MATCH$1 : SOMETIMES_MATCH$1;
	        }
	        return never > 0 ? NEVER_MATCH$1 : SOMETIMES_MATCH$1;
	    }
	    var inference = visitor$a.build({
	        rule: function (node) {
	            var oldResult = undefined;
	            var count = 0;
	            if (typeof node.match === "undefined") {
	                node.match = SOMETIMES_MATCH$1;
	                do {
	                    oldResult = node.match;
	                    node.match = inference(node.expression);
	                    if (++count > 6) {
	                        throw new GrammarError$2("Infinity cycle detected when trying to evaluate node match result", node.location);
	                    }
	                } while (oldResult !== node.match);
	            }
	            return node.match;
	        },
	        named: inferenceExpression,
	        choice: function (node) {
	            return (node.match = inferenceElements(node.alternatives, true));
	        },
	        action: inferenceExpression,
	        sequence: function (node) {
	            return (node.match = inferenceElements(node.elements, false));
	        },
	        labeled: inferenceExpression,
	        text: inferenceExpression,
	        simple_and: inferenceExpression,
	        simple_not: function (node) {
	            return (node.match = -inference(node.expression));
	        },
	        optional: alwaysMatch,
	        zero_or_more: alwaysMatch,
	        one_or_more: inferenceExpression,
	        repeated: function (node) {
	            var match = inference(node.expression);
	            var dMatch = node.delimiter ? inference(node.delimiter) : NEVER_MATCH$1;
	            var min = node.min ? node.min : node.max;
	            if (min.type !== "constant" || node.max.type !== "constant") {
	                return (node.match = SOMETIMES_MATCH$1);
	            }
	            if (node.max.value === 0
	                || (node.max.value !== null && min.value > node.max.value)) {
	                return (node.match = NEVER_MATCH$1);
	            }
	            if (match === NEVER_MATCH$1) {
	                return (node.match = min.value === 0 ? ALWAYS_MATCH$1 : NEVER_MATCH$1);
	            }
	            if (match === ALWAYS_MATCH$1) {
	                if (node.delimiter && min.value >= 2) {
	                    return (node.match = dMatch);
	                }
	                return (node.match = ALWAYS_MATCH$1);
	            }
	            if (node.delimiter && min.value >= 2) {
	                return (node.match = dMatch === NEVER_MATCH$1 ? NEVER_MATCH$1 : SOMETIMES_MATCH$1);
	            }
	            return (node.match = min.value === 0 ? ALWAYS_MATCH$1 : SOMETIMES_MATCH$1);
	        },
	        group: inferenceExpression,
	        semantic_and: sometimesMatch,
	        semantic_not: sometimesMatch,
	        rule_ref: function (node) {
	            var rule = asts$7.findRule(ast, node.name);
	            if (!rule) {
	                return SOMETIMES_MATCH$1;
	            }
	            return (node.match = inference(rule));
	        },
	        library_ref: function () {
	            return 0;
	        },
	        literal: function (node) {
	            var match = node.value.length === 0 ? ALWAYS_MATCH$1 : SOMETIMES_MATCH$1;
	            return (node.match = match);
	        },
	        class: function (node) {
	            var match = node.parts.length === 0 ? NEVER_MATCH$1 : SOMETIMES_MATCH$1;
	            return (node.match = match);
	        },
	        any: sometimesMatch,
	    });
	    inference(ast);
	}
	inferenceMatchResult$1.ALWAYS_MATCH = ALWAYS_MATCH$1;
	inferenceMatchResult$1.SOMETIMES_MATCH = SOMETIMES_MATCH$1;
	inferenceMatchResult$1.NEVER_MATCH = NEVER_MATCH$1;
	var inferenceMatchResult_1 = inferenceMatchResult$1;

	var __spreadArray$3 = (commonjsGlobal && commonjsGlobal.__spreadArray) || function (to, from, pack) {
	    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
	        if (ar || !(i in from)) {
	            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
	            ar[i] = from[i];
	        }
	    }
	    return to.concat(ar || Array.prototype.slice.call(from));
	};
	var asts$6 = asts_1;
	var op$1 = opcodes_1;
	var visitor$9 = visitor_1;
	var Intern = intern;
	var _a$1 = inferenceMatchResult_1, ALWAYS_MATCH = _a$1.ALWAYS_MATCH, SOMETIMES_MATCH = _a$1.SOMETIMES_MATCH, NEVER_MATCH = _a$1.NEVER_MATCH;
	function generateBytecode$1(ast, options) {
	    var literals = new Intern();
	    var classes = new Intern({
	        stringify: JSON.stringify,
	        convert: function (node) { return ({
	            value: node.parts,
	            inverted: node.inverted,
	            ignoreCase: node.ignoreCase,
	        }); },
	    });
	    var expectations = new Intern({
	        stringify: JSON.stringify,
	    });
	    var importedNames = new Intern();
	    var functions = [];
	    var locations = [];
	    function addFunctionConst(predicate, params, node) {
	        var func = {
	            predicate: predicate,
	            params: params,
	            body: node.code,
	            location: node.codeLocation,
	        };
	        var pattern = JSON.stringify(func);
	        var index = functions.findIndex(function (f) { return JSON.stringify(f) === pattern; });
	        return index === -1 ? functions.push(func) - 1 : index;
	    }
	    function addLocation(location) {
	        return locations.push(location) - 1;
	    }
	    function cloneEnv(env) {
	        var clone = {};
	        Object.keys(env).forEach(function (name) {
	            clone[name] = env[name];
	        });
	        return clone;
	    }
	    function buildSequence(first) {
	        var args = [];
	        for (var _i = 1; _i < arguments.length; _i++) {
	            args[_i - 1] = arguments[_i];
	        }
	        return first.concat.apply(first, args);
	    }
	    function buildCondition(match, condCode, thenCode, elseCode) {
	        if (match === ALWAYS_MATCH) {
	            return thenCode;
	        }
	        if (match === NEVER_MATCH) {
	            return elseCode;
	        }
	        return condCode.concat([thenCode.length, elseCode.length], thenCode, elseCode);
	    }
	    function buildLoop(condCode, bodyCode) {
	        return condCode.concat([bodyCode.length], bodyCode);
	    }
	    function buildCall(functionIndex, delta, env, sp) {
	        var params = Object.keys(env).map(function (name) { return sp - env[name]; });
	        return [op$1.CALL, functionIndex, delta, params.length].concat(params);
	    }
	    function buildSimplePredicate(expression, negative, context) {
	        var match = expression.match || 0;
	        return buildSequence([op$1.PUSH_CURR_POS], [op$1.SILENT_FAILS_ON], generate(expression, {
	            sp: context.sp + 1,
	            env: cloneEnv(context.env),
	            action: null,
	        }), [op$1.SILENT_FAILS_OFF], buildCondition(negative ? -match : match, [negative ? op$1.IF_ERROR : op$1.IF_NOT_ERROR], buildSequence([op$1.POP], [negative ? op$1.POP : op$1.POP_CURR_POS], [op$1.PUSH_UNDEFINED]), buildSequence([op$1.POP], [negative ? op$1.POP_CURR_POS : op$1.POP], [op$1.PUSH_FAILED])));
	    }
	    function buildSemanticPredicate(node, negative, context) {
	        var functionIndex = addFunctionConst(true, Object.keys(context.env), node);
	        return buildSequence([op$1.UPDATE_SAVED_POS], buildCall(functionIndex, 0, context.env, context.sp), buildCondition(node.match || 0, [op$1.IF], buildSequence([op$1.POP], negative ? [op$1.PUSH_FAILED] : [op$1.PUSH_UNDEFINED]), buildSequence([op$1.POP], negative ? [op$1.PUSH_UNDEFINED] : [op$1.PUSH_FAILED])));
	    }
	    function buildAppendLoop(expressionCode) {
	        return buildLoop([op$1.WHILE_NOT_ERROR], buildSequence([op$1.APPEND], expressionCode));
	    }
	    function unknownBoundary(boundary) {
	        var b = (boundary);
	        return new Error("Unknown boundary type \"".concat(b.type, "\" for the \"repeated\" node"));
	    }
	    function buildRangeCall(boundary, env, sp, offset) {
	        switch (boundary.type) {
	            case "constant":
	                return { pre: [], post: [], sp: sp };
	            case "variable":
	                boundary.sp = offset + sp - env[boundary.value];
	                return { pre: [], post: [], sp: sp };
	            case "function": {
	                boundary.sp = offset;
	                var functionIndex = addFunctionConst(true, Object.keys(env), { code: boundary.value, codeLocation: boundary.codeLocation });
	                return {
	                    pre: buildCall(functionIndex, 0, env, sp),
	                    post: [op$1.NIP],
	                    sp: sp + 1,
	                };
	            }
	            default:
	                throw unknownBoundary(boundary);
	        }
	    }
	    function buildCheckMax(expressionCode, max) {
	        if (max.value !== null) {
	            var checkCode = max.type === "constant"
	                ? [op$1.IF_GE, max.value]
	                : [op$1.IF_GE_DYNAMIC, max.sp || 0];
	            return buildCondition(SOMETIMES_MATCH, checkCode, [op$1.PUSH_FAILED], expressionCode);
	        }
	        return expressionCode;
	    }
	    function buildCheckMin(expressionCode, min) {
	        var checkCode = min.type === "constant"
	            ? [op$1.IF_LT, min.value]
	            : [op$1.IF_LT_DYNAMIC, min.sp || 0];
	        return buildSequence(expressionCode, buildCondition(SOMETIMES_MATCH, checkCode, [op$1.POP, op$1.POP_CURR_POS,
	            op$1.PUSH_FAILED], [op$1.NIP]));
	    }
	    function buildRangeBody(delimiterNode, expressionMatch, expressionCode, context, offset) {
	        if (delimiterNode) {
	            return buildSequence([op$1.PUSH_CURR_POS], generate(delimiterNode, {
	                sp: context.sp + offset + 1,
	                env: cloneEnv(context.env),
	                action: null,
	            }), buildCondition(delimiterNode.match || 0, [op$1.IF_NOT_ERROR], buildSequence([op$1.POP], expressionCode, buildCondition(-expressionMatch, [op$1.IF_ERROR], [op$1.POP,
	                op$1.POP_CURR_POS,
	                op$1.PUSH_FAILED], [op$1.NIP])), [op$1.NIP]));
	        }
	        return expressionCode;
	    }
	    function wrapGenerators(generators) {
	        if (options && options.output === "source-and-map") {
	            Object.keys(generators).forEach(function (name) {
	                var generator = generators[name];
	                generators[name] = function (node) {
	                    var args = [];
	                    for (var _i = 1; _i < arguments.length; _i++) {
	                        args[_i - 1] = arguments[_i];
	                    }
	                    var generated = generator.apply(void 0, __spreadArray$3([node], args, false));
	                    if (generated === undefined || !node.location) {
	                        return generated;
	                    }
	                    return buildSequence([
	                        op$1.SOURCE_MAP_PUSH,
	                        addLocation(node.location),
	                    ], generated, [
	                        op$1.SOURCE_MAP_POP,
	                    ]);
	                };
	            });
	        }
	        return visitor$9.build(generators);
	    }
	    var generate = wrapGenerators({
	        grammar: function (node) {
	            node.rules.forEach(generate);
	            node.literals = literals.items;
	            node.classes = classes.items;
	            node.expectations = expectations.items;
	            node.importedNames = importedNames.items;
	            node.functions = functions;
	            node.locations = locations;
	        },
	        rule: function (node) {
	            node.bytecode = generate(node.expression, {
	                sp: -1,
	                env: {},
	                pluck: [],
	                action: null,
	            });
	        },
	        named: function (node, context) {
	            var match = node.match || 0;
	            var nameIndex = (match === NEVER_MATCH)
	                ? -1
	                : expectations.add({ type: "rule", value: node.name });
	            return buildSequence([op$1.SILENT_FAILS_ON], generate(node.expression, context), [op$1.SILENT_FAILS_OFF], buildCondition(match, [op$1.IF_ERROR], [op$1.FAIL, nameIndex], []));
	        },
	        choice: function (node, context) {
	            function buildAlternativesCode(alternatives, context) {
	                var match = alternatives[0].match || 0;
	                var first = generate(alternatives[0], {
	                    sp: context.sp,
	                    env: cloneEnv(context.env),
	                    action: null,
	                });
	                if (match === ALWAYS_MATCH) {
	                    return first;
	                }
	                return buildSequence(first, alternatives.length > 1
	                    ? buildCondition(SOMETIMES_MATCH, [op$1.IF_ERROR], buildSequence([op$1.POP], buildAlternativesCode(alternatives.slice(1), context)), [])
	                    : []);
	            }
	            return buildAlternativesCode(node.alternatives, context);
	        },
	        action: function (node, context) {
	            var env = cloneEnv(context.env);
	            var emitCall = node.expression.type !== "sequence"
	                || node.expression.elements.length === 0;
	            var expressionCode = generate(node.expression, {
	                sp: context.sp + (emitCall ? 1 : 0),
	                env: env,
	                action: node,
	            });
	            var match = node.expression.match || 0;
	            var functionIndex = emitCall && match !== NEVER_MATCH
	                ? addFunctionConst(false, Object.keys(env), node)
	                : -1;
	            return emitCall
	                ? buildSequence([op$1.PUSH_CURR_POS], expressionCode, buildCondition(match, [op$1.IF_NOT_ERROR], buildSequence([op$1.LOAD_SAVED_POS, 1], buildCall(functionIndex, 1, env, context.sp + 2)), []), [op$1.NIP])
	                : expressionCode;
	        },
	        sequence: function (node, context) {
	            function buildElementsCode(elements, context) {
	                if (elements.length > 0) {
	                    var processedCount = node.elements.length - elements.length + 1;
	                    return buildSequence(generate(elements[0], {
	                        sp: context.sp,
	                        env: context.env,
	                        pluck: context.pluck,
	                        action: null,
	                    }), buildCondition(elements[0].match || 0, [op$1.IF_NOT_ERROR], buildElementsCode(elements.slice(1), {
	                        sp: context.sp + 1,
	                        env: context.env,
	                        pluck: context.pluck,
	                        action: context.action,
	                    }), buildSequence(processedCount > 1 ? [op$1.POP_N, processedCount] : [op$1.POP], [op$1.POP_CURR_POS], [op$1.PUSH_FAILED])));
	                }
	                else {
	                    if (context.pluck && context.pluck.length > 0) {
	                        return buildSequence([op$1.PLUCK, node.elements.length + 1, context.pluck.length], context.pluck.map(function (eSP) { return context.sp - eSP; }));
	                    }
	                    if (context.action) {
	                        var functionIndex = addFunctionConst(false, Object.keys(context.env), context.action);
	                        return buildSequence([op$1.LOAD_SAVED_POS, node.elements.length], buildCall(functionIndex, node.elements.length + 1, context.env, context.sp));
	                    }
	                    else {
	                        return buildSequence([op$1.WRAP, node.elements.length], [op$1.NIP]);
	                    }
	                }
	            }
	            return buildSequence([op$1.PUSH_CURR_POS], buildElementsCode(node.elements, {
	                sp: context.sp + 1,
	                env: context.env,
	                pluck: [],
	                action: context.action,
	            }));
	        },
	        labeled: function (node, context) {
	            var env = context.env;
	            var label = node.label;
	            var sp = context.sp + 1;
	            if (label) {
	                env = cloneEnv(context.env);
	                context.env[label] = sp;
	            }
	            if (node.pick) {
	                context.pluck.push(sp);
	            }
	            var expression = generate(node.expression, {
	                sp: context.sp,
	                env: env,
	                action: null,
	            });
	            if (label && node.labelLocation && options && options.output === "source-and-map") {
	                return buildSequence([
	                    op$1.SOURCE_MAP_LABEL_PUSH,
	                    sp,
	                    literals.add(label),
	                    addLocation(node.labelLocation),
	                ], expression, [op$1.SOURCE_MAP_LABEL_POP, sp]);
	            }
	            return expression;
	        },
	        text: function (node, context) {
	            return buildSequence([op$1.PUSH_CURR_POS], generate(node.expression, {
	                sp: context.sp + 1,
	                env: cloneEnv(context.env),
	                action: null,
	            }), buildCondition(node.match || 0, [op$1.IF_NOT_ERROR], buildSequence([op$1.POP], [op$1.TEXT]), [op$1.NIP]));
	        },
	        simple_and: function (node, context) {
	            return buildSimplePredicate(node.expression, false, context);
	        },
	        simple_not: function (node, context) {
	            return buildSimplePredicate(node.expression, true, context);
	        },
	        optional: function (node, context) {
	            return buildSequence(generate(node.expression, {
	                sp: context.sp,
	                env: cloneEnv(context.env),
	                action: null,
	            }), buildCondition(-(node.expression.match || 0), [op$1.IF_ERROR], buildSequence([op$1.POP], [op$1.PUSH_NULL]), []));
	        },
	        zero_or_more: function (node, context) {
	            var expressionCode = generate(node.expression, {
	                sp: context.sp + 1,
	                env: cloneEnv(context.env),
	                action: null,
	            });
	            return buildSequence([op$1.PUSH_EMPTY_ARRAY], expressionCode, buildAppendLoop(expressionCode), [op$1.POP]);
	        },
	        one_or_more: function (node, context) {
	            var expressionCode = generate(node.expression, {
	                sp: context.sp + 1,
	                env: cloneEnv(context.env),
	                action: null,
	            });
	            return buildSequence([op$1.PUSH_EMPTY_ARRAY], expressionCode, buildCondition(node.expression.match || 0, [op$1.IF_NOT_ERROR], buildSequence(buildAppendLoop(expressionCode), [op$1.POP]), buildSequence([op$1.POP], [op$1.POP], [op$1.PUSH_FAILED])));
	        },
	        repeated: function (node, context) {
	            var min = node.min ? node.min : node.max;
	            var hasMin = min.type !== "constant" || min.value > 0;
	            var hasBoundedMax = node.max.type !== "constant" && node.max.value !== null;
	            var offset = hasMin ? 2 : 1;
	            var minCode = node.min
	                ? buildRangeCall(node.min, context.env, context.sp, 2 + (node.max.type === "function" ? 1 : 0))
	                : { pre: [], post: [], sp: context.sp };
	            var maxCode = buildRangeCall(node.max, context.env, minCode.sp, offset);
	            var firstExpressionCode = generate(node.expression, {
	                sp: maxCode.sp + offset,
	                env: cloneEnv(context.env),
	                action: null,
	            });
	            var expressionCode = node.delimiter !== null
	                ? generate(node.expression, {
	                    sp: maxCode.sp + offset + 1,
	                    env: cloneEnv(context.env),
	                    action: null,
	                })
	                : firstExpressionCode;
	            var bodyCode = buildRangeBody(node.delimiter, node.expression.match || 0, expressionCode, context, offset);
	            var checkMaxCode = buildCheckMax(bodyCode, node.max);
	            var firstElemCode = hasBoundedMax
	                ? buildCheckMax(firstExpressionCode, node.max)
	                : firstExpressionCode;
	            var mainLoopCode = buildSequence(hasMin ? [op$1.PUSH_CURR_POS] : [], [op$1.PUSH_EMPTY_ARRAY], firstElemCode, buildAppendLoop(checkMaxCode), [op$1.POP]);
	            return buildSequence(minCode.pre, maxCode.pre, hasMin
	                ? buildCheckMin(mainLoopCode, min)
	                : mainLoopCode, maxCode.post, minCode.post);
	        },
	        group: function (node, context) {
	            return generate(node.expression, {
	                sp: context.sp,
	                env: cloneEnv(context.env),
	                action: null,
	            });
	        },
	        semantic_and: function (node, context) {
	            return buildSemanticPredicate(node, false, context);
	        },
	        semantic_not: function (node, context) {
	            return buildSemanticPredicate(node, true, context);
	        },
	        rule_ref: function (node) {
	            return [op$1.RULE, asts$6.indexOfRule(ast, node.name)];
	        },
	        library_ref: function (node) {
	            return [
	                op$1.LIBRARY_RULE,
	                node.libraryNumber,
	                importedNames.add(node.name),
	            ];
	        },
	        literal: function (node) {
	            if (node.value.length > 0) {
	                var match = node.match || 0;
	                var needConst = match === SOMETIMES_MATCH
	                    || (match === ALWAYS_MATCH && !node.ignoreCase);
	                var stringIndex = needConst
	                    ? literals.add(node.ignoreCase ? node.value.toLowerCase() : node.value)
	                    : -1;
	                var expectedIndex = (match !== ALWAYS_MATCH)
	                    ? expectations.add({
	                        type: "literal",
	                        value: node.value,
	                        ignoreCase: node.ignoreCase,
	                    })
	                    : -1;
	                return buildCondition(match, node.ignoreCase
	                    ? [op$1.MATCH_STRING_IC, stringIndex]
	                    : [op$1.MATCH_STRING, stringIndex], node.ignoreCase
	                    ? [op$1.ACCEPT_N, node.value.length]
	                    : [op$1.ACCEPT_STRING, stringIndex], [op$1.FAIL, expectedIndex]);
	            }
	            return [op$1.PUSH_EMPTY_STRING];
	        },
	        class: function (node) {
	            var match = node.match || 0;
	            var classIndex = match === SOMETIMES_MATCH ? classes.add(node) : -1;
	            var expectedIndex = (match !== ALWAYS_MATCH)
	                ? expectations.add({
	                    type: "class",
	                    value: node.parts,
	                    inverted: node.inverted,
	                    ignoreCase: node.ignoreCase,
	                })
	                : -1;
	            return buildCondition(match, [op$1.MATCH_CHAR_CLASS, classIndex], [op$1.ACCEPT_N, 1], [op$1.FAIL, expectedIndex]);
	        },
	        any: function (node) {
	            var match = node.match || 0;
	            var expectedIndex = (match !== ALWAYS_MATCH)
	                ? expectations.add({
	                    type: "any",
	                })
	                : -1;
	            return buildCondition(match, [op$1.MATCH_ANY], [op$1.ACCEPT_N, 1], [op$1.FAIL, expectedIndex]);
	        },
	    });
	    generate(ast);
	}
	var generateBytecode_1 = generateBytecode$1;

	var sourceMap = {};

	var sourceMapGenerator = {};

	var base64Vlq = {};

	var base64$3 = {};

	/* -*- Mode: js; js-indent-level: 2; -*- */

	/*
	 * Copyright 2011 Mozilla Foundation and contributors
	 * Licensed under the New BSD license. See LICENSE or:
	 * http://opensource.org/licenses/BSD-3-Clause
	 */

	const intToCharMap = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".split(
	  ""
	);

	/**
	 * Encode an integer in the range of 0 to 63 to a single base 64 digit.
	 */
	base64$3.encode = function(number) {
	  if (0 <= number && number < intToCharMap.length) {
	    return intToCharMap[number];
	  }
	  throw new TypeError("Must be between 0 and 63: " + number);
	};

	/* -*- Mode: js; js-indent-level: 2; -*- */

	/*
	 * Copyright 2011 Mozilla Foundation and contributors
	 * Licensed under the New BSD license. See LICENSE or:
	 * http://opensource.org/licenses/BSD-3-Clause
	 *
	 * Based on the Base 64 VLQ implementation in Closure Compiler:
	 * https://code.google.com/p/closure-compiler/source/browse/trunk/src/com/google/debugging/sourcemap/Base64VLQ.java
	 *
	 * Copyright 2011 The Closure Compiler Authors. All rights reserved.
	 * Redistribution and use in source and binary forms, with or without
	 * modification, are permitted provided that the following conditions are
	 * met:
	 *
	 *  * Redistributions of source code must retain the above copyright
	 *    notice, this list of conditions and the following disclaimer.
	 *  * Redistributions in binary form must reproduce the above
	 *    copyright notice, this list of conditions and the following
	 *    disclaimer in the documentation and/or other materials provided
	 *    with the distribution.
	 *  * Neither the name of Google Inc. nor the names of its
	 *    contributors may be used to endorse or promote products derived
	 *    from this software without specific prior written permission.
	 *
	 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
	 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
	 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
	 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
	 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
	 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
	 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
	 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
	 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
	 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
	 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
	 */

	const base64$2 = base64$3;

	// A single base 64 digit can contain 6 bits of data. For the base 64 variable
	// length quantities we use in the source map spec, the first bit is the sign,
	// the next four bits are the actual value, and the 6th bit is the
	// continuation bit. The continuation bit tells us whether there are more
	// digits in this value following this digit.
	//
	//   Continuation
	//   |    Sign
	//   |    |
	//   V    V
	//   101011

	const VLQ_BASE_SHIFT = 5;

	// binary: 100000
	const VLQ_BASE = 1 << VLQ_BASE_SHIFT;

	// binary: 011111
	const VLQ_BASE_MASK = VLQ_BASE - 1;

	// binary: 100000
	const VLQ_CONTINUATION_BIT = VLQ_BASE;

	/**
	 * Converts from a two-complement value to a value where the sign bit is
	 * placed in the least significant bit.  For example, as decimals:
	 *   1 becomes 2 (10 binary), -1 becomes 3 (11 binary)
	 *   2 becomes 4 (100 binary), -2 becomes 5 (101 binary)
	 */
	function toVLQSigned(aValue) {
	  return aValue < 0 ? (-aValue << 1) + 1 : (aValue << 1) + 0;
	}

	/**
	 * Returns the base 64 VLQ encoded value.
	 */
	base64Vlq.encode = function base64VLQ_encode(aValue) {
	  let encoded = "";
	  let digit;

	  let vlq = toVLQSigned(aValue);

	  do {
	    digit = vlq & VLQ_BASE_MASK;
	    vlq >>>= VLQ_BASE_SHIFT;
	    if (vlq > 0) {
	      // There are still more digits in this value, so we must make sure the
	      // continuation bit is marked.
	      digit |= VLQ_CONTINUATION_BIT;
	    }
	    encoded += base64$2.encode(digit);
	  } while (vlq > 0);

	  return encoded;
	};

	var util$3 = {};

	/* -*- Mode: js; js-indent-level: 2; -*- */

	/*
	 * Copyright 2011 Mozilla Foundation and contributors
	 * Licensed under the New BSD license. See LICENSE or:
	 * http://opensource.org/licenses/BSD-3-Clause
	 */

	/**
	 * This is a helper function for getting values from parameter/options
	 * objects.
	 *
	 * @param args The object we are extracting values from
	 * @param name The name of the property we are getting.
	 * @param defaultValue An optional value to return if the property is missing
	 * from the object. If this is not specified and the property is missing, an
	 * error will be thrown.
	 */
	function getArg(aArgs, aName, aDefaultValue) {
	  if (aName in aArgs) {
	    return aArgs[aName];
	  } else if (arguments.length === 3) {
	    return aDefaultValue;
	  }
	  throw new Error('"' + aName + '" is a required argument.');
	}
	util$3.getArg = getArg;

	const supportsNullProto = (function() {
	  const obj = Object.create(null);
	  return !("__proto__" in obj);
	})();

	function identity(s) {
	  return s;
	}

	/**
	 * Because behavior goes wacky when you set `__proto__` on objects, we
	 * have to prefix all the strings in our set with an arbitrary character.
	 *
	 * See https://github.com/mozilla/source-map/pull/31 and
	 * https://github.com/mozilla/source-map/issues/30
	 *
	 * @param String aStr
	 */
	function toSetString(aStr) {
	  if (isProtoString(aStr)) {
	    return "$" + aStr;
	  }

	  return aStr;
	}
	util$3.toSetString = supportsNullProto ? identity : toSetString;

	function fromSetString(aStr) {
	  if (isProtoString(aStr)) {
	    return aStr.slice(1);
	  }

	  return aStr;
	}
	util$3.fromSetString = supportsNullProto ? identity : fromSetString;

	function isProtoString(s) {
	  if (!s) {
	    return false;
	  }

	  const length = s.length;

	  if (length < 9 /* "__proto__".length */) {
	    return false;
	  }

	  /* eslint-disable no-multi-spaces */
	  if (
	    s.charCodeAt(length - 1) !== 95 /* '_' */ ||
	    s.charCodeAt(length - 2) !== 95 /* '_' */ ||
	    s.charCodeAt(length - 3) !== 111 /* 'o' */ ||
	    s.charCodeAt(length - 4) !== 116 /* 't' */ ||
	    s.charCodeAt(length - 5) !== 111 /* 'o' */ ||
	    s.charCodeAt(length - 6) !== 114 /* 'r' */ ||
	    s.charCodeAt(length - 7) !== 112 /* 'p' */ ||
	    s.charCodeAt(length - 8) !== 95 /* '_' */ ||
	    s.charCodeAt(length - 9) !== 95 /* '_' */
	  ) {
	    return false;
	  }
	  /* eslint-enable no-multi-spaces */

	  for (let i = length - 10; i >= 0; i--) {
	    if (s.charCodeAt(i) !== 36 /* '$' */) {
	      return false;
	    }
	  }

	  return true;
	}

	function strcmp(aStr1, aStr2) {
	  if (aStr1 === aStr2) {
	    return 0;
	  }

	  if (aStr1 === null) {
	    return 1; // aStr2 !== null
	  }

	  if (aStr2 === null) {
	    return -1; // aStr1 !== null
	  }

	  if (aStr1 > aStr2) {
	    return 1;
	  }

	  return -1;
	}

	/**
	 * Comparator between two mappings with inflated source and name strings where
	 * the generated positions are compared.
	 */
	function compareByGeneratedPositionsInflated(mappingA, mappingB) {
	  let cmp = mappingA.generatedLine - mappingB.generatedLine;
	  if (cmp !== 0) {
	    return cmp;
	  }

	  cmp = mappingA.generatedColumn - mappingB.generatedColumn;
	  if (cmp !== 0) {
	    return cmp;
	  }

	  cmp = strcmp(mappingA.source, mappingB.source);
	  if (cmp !== 0) {
	    return cmp;
	  }

	  cmp = mappingA.originalLine - mappingB.originalLine;
	  if (cmp !== 0) {
	    return cmp;
	  }

	  cmp = mappingA.originalColumn - mappingB.originalColumn;
	  if (cmp !== 0) {
	    return cmp;
	  }

	  return strcmp(mappingA.name, mappingB.name);
	}
	util$3.compareByGeneratedPositionsInflated = compareByGeneratedPositionsInflated;

	// We use 'http' as the base here because we want URLs processed relative
	// to the safe base to be treated as "special" URLs during parsing using
	// the WHATWG URL parsing. This ensures that backslash normalization
	// applies to the path and such.
	const PROTOCOL = "http:";
	const PROTOCOL_AND_HOST = `${PROTOCOL}//host`;

	/**
	 * Make it easy to create small utilities that tweak a URL's path.
	 */
	function createSafeHandler(cb) {
	  return input => {
	    const type = getURLType(input);
	    const base = buildSafeBase(input);
	    const url = new URL(input, base);

	    cb(url);

	    const result = url.toString();

	    if (type === "absolute") {
	      return result;
	    } else if (type === "scheme-relative") {
	      return result.slice(PROTOCOL.length);
	    } else if (type === "path-absolute") {
	      return result.slice(PROTOCOL_AND_HOST.length);
	    }

	    // This assumes that the callback will only change
	    // the path, search and hash values.
	    return computeRelativeURL(base, result);
	  };
	}

	function withBase(url, base) {
	  return new URL(url, base).toString();
	}

	function buildUniqueSegment(prefix, str) {
	  let id = 0;
	  do {
	    const ident = prefix + id++;
	    if (str.indexOf(ident) === -1) return ident;
	  } while (true);
	}

	function buildSafeBase(str) {
	  const maxDotParts = str.split("..").length - 1;

	  // If we used a segment that also existed in `str`, then we would be unable
	  // to compute relative paths. For example, if `segment` were just "a":
	  //
	  //   const url = "../../a/"
	  //   const base = buildSafeBase(url); // http://host/a/a/
	  //   const joined = "http://host/a/";
	  //   const result = relative(base, joined);
	  //
	  // Expected: "../../a/";
	  // Actual: "a/"
	  //
	  const segment = buildUniqueSegment("p", str);

	  let base = `${PROTOCOL_AND_HOST}/`;
	  for (let i = 0; i < maxDotParts; i++) {
	    base += `${segment}/`;
	  }
	  return base;
	}

	const ABSOLUTE_SCHEME = /^[A-Za-z0-9\+\-\.]+:/;
	function getURLType(url) {
	  if (url[0] === "/") {
	    if (url[1] === "/") return "scheme-relative";
	    return "path-absolute";
	  }

	  return ABSOLUTE_SCHEME.test(url) ? "absolute" : "path-relative";
	}

	/**
	 * Given two URLs that are assumed to be on the same
	 * protocol/host/user/password build a relative URL from the
	 * path, params, and hash values.
	 *
	 * @param rootURL The root URL that the target will be relative to.
	 * @param targetURL The target that the relative URL points to.
	 * @return A rootURL-relative, normalized URL value.
	 */
	function computeRelativeURL(rootURL, targetURL) {
	  if (typeof rootURL === "string") rootURL = new URL(rootURL);
	  if (typeof targetURL === "string") targetURL = new URL(targetURL);

	  const targetParts = targetURL.pathname.split("/");
	  const rootParts = rootURL.pathname.split("/");

	  // If we've got a URL path ending with a "/", we remove it since we'd
	  // otherwise be relative to the wrong location.
	  if (rootParts.length > 0 && !rootParts[rootParts.length - 1]) {
	    rootParts.pop();
	  }

	  while (
	    targetParts.length > 0 &&
	    rootParts.length > 0 &&
	    targetParts[0] === rootParts[0]
	  ) {
	    targetParts.shift();
	    rootParts.shift();
	  }

	  const relativePath = rootParts
	    .map(() => "..")
	    .concat(targetParts)
	    .join("/");

	  return relativePath + targetURL.search + targetURL.hash;
	}

	/**
	 * Given a URL, ensure that it is treated as a directory URL.
	 *
	 * @param url
	 * @return A normalized URL value.
	 */
	const ensureDirectory = createSafeHandler(url => {
	  url.pathname = url.pathname.replace(/\/?$/, "/");
	});

	/**
	 * Normalize a given URL.
	 * * Convert backslashes.
	 * * Remove any ".." and "." segments.
	 *
	 * @param url
	 * @return A normalized URL value.
	 */
	const normalize = createSafeHandler(url => {});
	util$3.normalize = normalize;

	/**
	 * Joins two paths/URLs.
	 *
	 * All returned URLs will be normalized.
	 *
	 * @param aRoot The root path or URL. Assumed to reference a directory.
	 * @param aPath The path or URL to be joined with the root.
	 * @return A joined and normalized URL value.
	 */
	function join(aRoot, aPath) {
	  const pathType = getURLType(aPath);
	  const rootType = getURLType(aRoot);

	  aRoot = ensureDirectory(aRoot);

	  if (pathType === "absolute") {
	    return withBase(aPath, undefined);
	  }
	  if (rootType === "absolute") {
	    return withBase(aPath, aRoot);
	  }

	  if (pathType === "scheme-relative") {
	    return normalize(aPath);
	  }
	  if (rootType === "scheme-relative") {
	    return withBase(aPath, withBase(aRoot, PROTOCOL_AND_HOST)).slice(
	      PROTOCOL.length
	    );
	  }

	  if (pathType === "path-absolute") {
	    return normalize(aPath);
	  }
	  if (rootType === "path-absolute") {
	    return withBase(aPath, withBase(aRoot, PROTOCOL_AND_HOST)).slice(
	      PROTOCOL_AND_HOST.length
	    );
	  }

	  const base = buildSafeBase(aPath + aRoot);
	  const newPath = withBase(aPath, withBase(aRoot, base));
	  return computeRelativeURL(base, newPath);
	}
	util$3.join = join;

	/**
	 * Make a path relative to a URL or another path. If returning a
	 * relative URL is not possible, the original target will be returned.
	 * All returned URLs will be normalized.
	 *
	 * @param aRoot The root path or URL.
	 * @param aPath The path or URL to be made relative to aRoot.
	 * @return A rootURL-relative (if possible), normalized URL value.
	 */
	function relative(rootURL, targetURL) {
	  const result = relativeIfPossible(rootURL, targetURL);

	  return typeof result === "string" ? result : normalize(targetURL);
	}
	util$3.relative = relative;

	function relativeIfPossible(rootURL, targetURL) {
	  const urlType = getURLType(rootURL);
	  if (urlType !== getURLType(targetURL)) {
	    return null;
	  }

	  const base = buildSafeBase(rootURL + targetURL);
	  const root = new URL(rootURL, base);
	  const target = new URL(targetURL, base);

	  try {
	    new URL("", target.toString());
	  } catch (err) {
	    // Bail if the URL doesn't support things being relative to it,
	    // For example, data: and blob: URLs.
	    return null;
	  }

	  if (
	    target.protocol !== root.protocol ||
	    target.user !== root.user ||
	    target.password !== root.password ||
	    target.hostname !== root.hostname ||
	    target.port !== root.port
	  ) {
	    return null;
	  }

	  return computeRelativeURL(root, target);
	}

	var arraySet = {};

	/* -*- Mode: js; js-indent-level: 2; -*- */

	/*
	 * Copyright 2011 Mozilla Foundation and contributors
	 * Licensed under the New BSD license. See LICENSE or:
	 * http://opensource.org/licenses/BSD-3-Clause
	 */

	/**
	 * A data structure which is a combination of an array and a set. Adding a new
	 * member is O(1), testing for membership is O(1), and finding the index of an
	 * element is O(1). Removing elements from the set is not supported. Only
	 * strings are supported for membership.
	 */
	let ArraySet$1 = class ArraySet {
	  constructor() {
	    this._array = [];
	    this._set = new Map();
	  }

	  /**
	   * Static method for creating ArraySet instances from an existing array.
	   */
	  static fromArray(aArray, aAllowDuplicates) {
	    const set = new ArraySet();
	    for (let i = 0, len = aArray.length; i < len; i++) {
	      set.add(aArray[i], aAllowDuplicates);
	    }
	    return set;
	  }

	  /**
	   * Return how many unique items are in this ArraySet. If duplicates have been
	   * added, than those do not count towards the size.
	   *
	   * @returns Number
	   */
	  size() {
	    return this._set.size;
	  }

	  /**
	   * Add the given string to this set.
	   *
	   * @param String aStr
	   */
	  add(aStr, aAllowDuplicates) {
	    const isDuplicate = this.has(aStr);
	    const idx = this._array.length;
	    if (!isDuplicate || aAllowDuplicates) {
	      this._array.push(aStr);
	    }
	    if (!isDuplicate) {
	      this._set.set(aStr, idx);
	    }
	  }

	  /**
	   * Is the given string a member of this set?
	   *
	   * @param String aStr
	   */
	  has(aStr) {
	    return this._set.has(aStr);
	  }

	  /**
	   * What is the index of the given string in the array?
	   *
	   * @param String aStr
	   */
	  indexOf(aStr) {
	    const idx = this._set.get(aStr);
	    if (idx >= 0) {
	      return idx;
	    }
	    throw new Error('"' + aStr + '" is not in the set.');
	  }

	  /**
	   * What is the element at the given index?
	   *
	   * @param Number aIdx
	   */
	  at(aIdx) {
	    if (aIdx >= 0 && aIdx < this._array.length) {
	      return this._array[aIdx];
	    }
	    throw new Error("No element indexed by " + aIdx);
	  }

	  /**
	   * Returns the array representation of this set (which has the proper indices
	   * indicated by indexOf). Note that this is a copy of the internal array used
	   * for storing the members so that no one can mess with internal state.
	   */
	  toArray() {
	    return this._array.slice();
	  }
	};
	arraySet.ArraySet = ArraySet$1;

	var mappingList = {};

	/* -*- Mode: js; js-indent-level: 2; -*- */

	/*
	 * Copyright 2014 Mozilla Foundation and contributors
	 * Licensed under the New BSD license. See LICENSE or:
	 * http://opensource.org/licenses/BSD-3-Clause
	 */

	const util$2 = util$3;

	/**
	 * Determine whether mappingB is after mappingA with respect to generated
	 * position.
	 */
	function generatedPositionAfter(mappingA, mappingB) {
	  // Optimized for most common case
	  const lineA = mappingA.generatedLine;
	  const lineB = mappingB.generatedLine;
	  const columnA = mappingA.generatedColumn;
	  const columnB = mappingB.generatedColumn;
	  return (
	    lineB > lineA ||
	    (lineB == lineA && columnB >= columnA) ||
	    util$2.compareByGeneratedPositionsInflated(mappingA, mappingB) <= 0
	  );
	}

	/**
	 * A data structure to provide a sorted view of accumulated mappings in a
	 * performance conscious manner. It trades a negligible overhead in general
	 * case for a large speedup in case of mappings being added in order.
	 */
	let MappingList$1 = class MappingList {
	  constructor() {
	    this._array = [];
	    this._sorted = true;
	    // Serves as infimum
	    this._last = { generatedLine: -1, generatedColumn: 0 };
	  }

	  /**
	   * Iterate through internal items. This method takes the same arguments that
	   * `Array.prototype.forEach` takes.
	   *
	   * NOTE: The order of the mappings is NOT guaranteed.
	   */
	  unsortedForEach(aCallback, aThisArg) {
	    this._array.forEach(aCallback, aThisArg);
	  }

	  /**
	   * Add the given source mapping.
	   *
	   * @param Object aMapping
	   */
	  add(aMapping) {
	    if (generatedPositionAfter(this._last, aMapping)) {
	      this._last = aMapping;
	      this._array.push(aMapping);
	    } else {
	      this._sorted = false;
	      this._array.push(aMapping);
	    }
	  }

	  /**
	   * Returns the flat, sorted array of mappings. The mappings are sorted by
	   * generated position.
	   *
	   * WARNING: This method returns internal data without copying, for
	   * performance. The return value must NOT be mutated, and should be treated as
	   * an immutable borrow. If you want to take ownership, you must make your own
	   * copy.
	   */
	  toArray() {
	    if (!this._sorted) {
	      this._array.sort(util$2.compareByGeneratedPositionsInflated);
	      this._sorted = true;
	    }
	    return this._array;
	  }
	};

	mappingList.MappingList = MappingList$1;

	/* -*- Mode: js; js-indent-level: 2; -*- */

	/*
	 * Copyright 2011 Mozilla Foundation and contributors
	 * Licensed under the New BSD license. See LICENSE or:
	 * http://opensource.org/licenses/BSD-3-Clause
	 */

	const base64VLQ = base64Vlq;
	const util$1 = util$3;
	const ArraySet = arraySet.ArraySet;
	const MappingList = mappingList.MappingList;

	/**
	 * An instance of the SourceMapGenerator represents a source map which is
	 * being built incrementally. You may pass an object with the following
	 * properties:
	 *
	 *   - file: The filename of the generated source.
	 *   - sourceRoot: A root for all relative URLs in this source map.
	 */
	let SourceMapGenerator$1 = class SourceMapGenerator {
	  constructor(aArgs) {
	    if (!aArgs) {
	      aArgs = {};
	    }
	    this._file = util$1.getArg(aArgs, "file", null);
	    this._sourceRoot = util$1.getArg(aArgs, "sourceRoot", null);
	    this._skipValidation = util$1.getArg(aArgs, "skipValidation", false);
	    this._sources = new ArraySet();
	    this._names = new ArraySet();
	    this._mappings = new MappingList();
	    this._sourcesContents = null;
	  }

	  /**
	   * Creates a new SourceMapGenerator based on a SourceMapConsumer
	   *
	   * @param aSourceMapConsumer The SourceMap.
	   */
	  static fromSourceMap(aSourceMapConsumer) {
	    const sourceRoot = aSourceMapConsumer.sourceRoot;
	    const generator = new SourceMapGenerator({
	      file: aSourceMapConsumer.file,
	      sourceRoot
	    });
	    aSourceMapConsumer.eachMapping(function(mapping) {
	      const newMapping = {
	        generated: {
	          line: mapping.generatedLine,
	          column: mapping.generatedColumn
	        }
	      };

	      if (mapping.source != null) {
	        newMapping.source = mapping.source;
	        if (sourceRoot != null) {
	          newMapping.source = util$1.relative(sourceRoot, newMapping.source);
	        }

	        newMapping.original = {
	          line: mapping.originalLine,
	          column: mapping.originalColumn
	        };

	        if (mapping.name != null) {
	          newMapping.name = mapping.name;
	        }
	      }

	      generator.addMapping(newMapping);
	    });
	    aSourceMapConsumer.sources.forEach(function(sourceFile) {
	      let sourceRelative = sourceFile;
	      if (sourceRoot != null) {
	        sourceRelative = util$1.relative(sourceRoot, sourceFile);
	      }

	      if (!generator._sources.has(sourceRelative)) {
	        generator._sources.add(sourceRelative);
	      }

	      const content = aSourceMapConsumer.sourceContentFor(sourceFile);
	      if (content != null) {
	        generator.setSourceContent(sourceFile, content);
	      }
	    });
	    return generator;
	  }

	  /**
	   * Add a single mapping from original source line and column to the generated
	   * source's line and column for this source map being created. The mapping
	   * object should have the following properties:
	   *
	   *   - generated: An object with the generated line and column positions.
	   *   - original: An object with the original line and column positions.
	   *   - source: The original source file (relative to the sourceRoot).
	   *   - name: An optional original token name for this mapping.
	   */
	  addMapping(aArgs) {
	    const generated = util$1.getArg(aArgs, "generated");
	    const original = util$1.getArg(aArgs, "original", null);
	    let source = util$1.getArg(aArgs, "source", null);
	    let name = util$1.getArg(aArgs, "name", null);

	    if (!this._skipValidation) {
	      this._validateMapping(generated, original, source, name);
	    }

	    if (source != null) {
	      source = String(source);
	      if (!this._sources.has(source)) {
	        this._sources.add(source);
	      }
	    }

	    if (name != null) {
	      name = String(name);
	      if (!this._names.has(name)) {
	        this._names.add(name);
	      }
	    }

	    this._mappings.add({
	      generatedLine: generated.line,
	      generatedColumn: generated.column,
	      originalLine: original && original.line,
	      originalColumn: original && original.column,
	      source,
	      name
	    });
	  }

	  /**
	   * Set the source content for a source file.
	   */
	  setSourceContent(aSourceFile, aSourceContent) {
	    let source = aSourceFile;
	    if (this._sourceRoot != null) {
	      source = util$1.relative(this._sourceRoot, source);
	    }

	    if (aSourceContent != null) {
	      // Add the source content to the _sourcesContents map.
	      // Create a new _sourcesContents map if the property is null.
	      if (!this._sourcesContents) {
	        this._sourcesContents = Object.create(null);
	      }
	      this._sourcesContents[util$1.toSetString(source)] = aSourceContent;
	    } else if (this._sourcesContents) {
	      // Remove the source file from the _sourcesContents map.
	      // If the _sourcesContents map is empty, set the property to null.
	      delete this._sourcesContents[util$1.toSetString(source)];
	      if (Object.keys(this._sourcesContents).length === 0) {
	        this._sourcesContents = null;
	      }
	    }
	  }

	  /**
	   * Applies the mappings of a sub-source-map for a specific source file to the
	   * source map being generated. Each mapping to the supplied source file is
	   * rewritten using the supplied source map. Note: The resolution for the
	   * resulting mappings is the minimium of this map and the supplied map.
	   *
	   * @param aSourceMapConsumer The source map to be applied.
	   * @param aSourceFile Optional. The filename of the source file.
	   *        If omitted, SourceMapConsumer's file property will be used.
	   * @param aSourceMapPath Optional. The dirname of the path to the source map
	   *        to be applied. If relative, it is relative to the SourceMapConsumer.
	   *        This parameter is needed when the two source maps aren't in the same
	   *        directory, and the source map to be applied contains relative source
	   *        paths. If so, those relative source paths need to be rewritten
	   *        relative to the SourceMapGenerator.
	   */
	  applySourceMap(aSourceMapConsumer, aSourceFile, aSourceMapPath) {
	    let sourceFile = aSourceFile;
	    // If aSourceFile is omitted, we will use the file property of the SourceMap
	    if (aSourceFile == null) {
	      if (aSourceMapConsumer.file == null) {
	        throw new Error(
	          "SourceMapGenerator.prototype.applySourceMap requires either an explicit source file, " +
	            'or the source map\'s "file" property. Both were omitted.'
	        );
	      }
	      sourceFile = aSourceMapConsumer.file;
	    }
	    const sourceRoot = this._sourceRoot;
	    // Make "sourceFile" relative if an absolute Url is passed.
	    if (sourceRoot != null) {
	      sourceFile = util$1.relative(sourceRoot, sourceFile);
	    }
	    // Applying the SourceMap can add and remove items from the sources and
	    // the names array.
	    const newSources =
	      this._mappings.toArray().length > 0 ? new ArraySet() : this._sources;
	    const newNames = new ArraySet();

	    // Find mappings for the "sourceFile"
	    this._mappings.unsortedForEach(function(mapping) {
	      if (mapping.source === sourceFile && mapping.originalLine != null) {
	        // Check if it can be mapped by the source map, then update the mapping.
	        const original = aSourceMapConsumer.originalPositionFor({
	          line: mapping.originalLine,
	          column: mapping.originalColumn
	        });
	        if (original.source != null) {
	          // Copy mapping
	          mapping.source = original.source;
	          if (aSourceMapPath != null) {
	            mapping.source = util$1.join(aSourceMapPath, mapping.source);
	          }
	          if (sourceRoot != null) {
	            mapping.source = util$1.relative(sourceRoot, mapping.source);
	          }
	          mapping.originalLine = original.line;
	          mapping.originalColumn = original.column;
	          if (original.name != null) {
	            mapping.name = original.name;
	          }
	        }
	      }

	      const source = mapping.source;
	      if (source != null && !newSources.has(source)) {
	        newSources.add(source);
	      }

	      const name = mapping.name;
	      if (name != null && !newNames.has(name)) {
	        newNames.add(name);
	      }
	    }, this);
	    this._sources = newSources;
	    this._names = newNames;

	    // Copy sourcesContents of applied map.
	    aSourceMapConsumer.sources.forEach(function(srcFile) {
	      const content = aSourceMapConsumer.sourceContentFor(srcFile);
	      if (content != null) {
	        if (aSourceMapPath != null) {
	          srcFile = util$1.join(aSourceMapPath, srcFile);
	        }
	        if (sourceRoot != null) {
	          srcFile = util$1.relative(sourceRoot, srcFile);
	        }
	        this.setSourceContent(srcFile, content);
	      }
	    }, this);
	  }

	  /**
	   * A mapping can have one of the three levels of data:
	   *
	   *   1. Just the generated position.
	   *   2. The Generated position, original position, and original source.
	   *   3. Generated and original position, original source, as well as a name
	   *      token.
	   *
	   * To maintain consistency, we validate that any new mapping being added falls
	   * in to one of these categories.
	   */
	  _validateMapping(aGenerated, aOriginal, aSource, aName) {
	    // When aOriginal is truthy but has empty values for .line and .column,
	    // it is most likely a programmer error. In this case we throw a very
	    // specific error message to try to guide them the right way.
	    // For example: https://github.com/Polymer/polymer-bundler/pull/519
	    if (
	      aOriginal &&
	      typeof aOriginal.line !== "number" &&
	      typeof aOriginal.column !== "number"
	    ) {
	      throw new Error(
	        "original.line and original.column are not numbers -- you probably meant to omit " +
	          "the original mapping entirely and only map the generated position. If so, pass " +
	          "null for the original mapping instead of an object with empty or null values."
	      );
	    }

	    if (
	      aGenerated &&
	      "line" in aGenerated &&
	      "column" in aGenerated &&
	      aGenerated.line > 0 &&
	      aGenerated.column >= 0 &&
	      !aOriginal &&
	      !aSource &&
	      !aName
	    ) ; else if (
	      aGenerated &&
	      "line" in aGenerated &&
	      "column" in aGenerated &&
	      aOriginal &&
	      "line" in aOriginal &&
	      "column" in aOriginal &&
	      aGenerated.line > 0 &&
	      aGenerated.column >= 0 &&
	      aOriginal.line > 0 &&
	      aOriginal.column >= 0 &&
	      aSource
	    ) ; else {
	      throw new Error(
	        "Invalid mapping: " +
	          JSON.stringify({
	            generated: aGenerated,
	            source: aSource,
	            original: aOriginal,
	            name: aName
	          })
	      );
	    }
	  }

	  /**
	   * Serialize the accumulated mappings in to the stream of base 64 VLQs
	   * specified by the source map format.
	   */
	  _serializeMappings() {
	    let previousGeneratedColumn = 0;
	    let previousGeneratedLine = 1;
	    let previousOriginalColumn = 0;
	    let previousOriginalLine = 0;
	    let previousName = 0;
	    let previousSource = 0;
	    let result = "";
	    let next;
	    let mapping;
	    let nameIdx;
	    let sourceIdx;

	    const mappings = this._mappings.toArray();
	    for (let i = 0, len = mappings.length; i < len; i++) {
	      mapping = mappings[i];
	      next = "";

	      if (mapping.generatedLine !== previousGeneratedLine) {
	        previousGeneratedColumn = 0;
	        while (mapping.generatedLine !== previousGeneratedLine) {
	          next += ";";
	          previousGeneratedLine++;
	        }
	      } else if (i > 0) {
	        if (
	          !util$1.compareByGeneratedPositionsInflated(mapping, mappings[i - 1])
	        ) {
	          continue;
	        }
	        next += ",";
	      }

	      next += base64VLQ.encode(
	        mapping.generatedColumn - previousGeneratedColumn
	      );
	      previousGeneratedColumn = mapping.generatedColumn;

	      if (mapping.source != null) {
	        sourceIdx = this._sources.indexOf(mapping.source);
	        next += base64VLQ.encode(sourceIdx - previousSource);
	        previousSource = sourceIdx;

	        // lines are stored 0-based in SourceMap spec version 3
	        next += base64VLQ.encode(
	          mapping.originalLine - 1 - previousOriginalLine
	        );
	        previousOriginalLine = mapping.originalLine - 1;

	        next += base64VLQ.encode(
	          mapping.originalColumn - previousOriginalColumn
	        );
	        previousOriginalColumn = mapping.originalColumn;

	        if (mapping.name != null) {
	          nameIdx = this._names.indexOf(mapping.name);
	          next += base64VLQ.encode(nameIdx - previousName);
	          previousName = nameIdx;
	        }
	      }

	      result += next;
	    }

	    return result;
	  }

	  _generateSourcesContent(aSources, aSourceRoot) {
	    return aSources.map(function(source) {
	      if (!this._sourcesContents) {
	        return null;
	      }
	      if (aSourceRoot != null) {
	        source = util$1.relative(aSourceRoot, source);
	      }
	      const key = util$1.toSetString(source);
	      return Object.prototype.hasOwnProperty.call(this._sourcesContents, key)
	        ? this._sourcesContents[key]
	        : null;
	    }, this);
	  }

	  /**
	   * Externalize the source map.
	   */
	  toJSON() {
	    const map = {
	      version: this._version,
	      sources: this._sources.toArray(),
	      names: this._names.toArray(),
	      mappings: this._serializeMappings()
	    };
	    if (this._file != null) {
	      map.file = this._file;
	    }
	    if (this._sourceRoot != null) {
	      map.sourceRoot = this._sourceRoot;
	    }
	    if (this._sourcesContents) {
	      map.sourcesContent = this._generateSourcesContent(
	        map.sources,
	        map.sourceRoot
	      );
	    }

	    return map;
	  }

	  /**
	   * Render the source map being generated to a string.
	   */
	  toString() {
	    return JSON.stringify(this.toJSON());
	  }
	};

	SourceMapGenerator$1.prototype._version = 3;
	sourceMapGenerator.SourceMapGenerator = SourceMapGenerator$1;

	var sourceNode = {};

	/* -*- Mode: js; js-indent-level: 2; -*- */

	/*
	 * Copyright 2011 Mozilla Foundation and contributors
	 * Licensed under the New BSD license. See LICENSE or:
	 * http://opensource.org/licenses/BSD-3-Clause
	 */

	const SourceMapGenerator = sourceMapGenerator.SourceMapGenerator;
	const util = util$3;

	// Matches a Windows-style `\r\n` newline or a `\n` newline used by all other
	// operating systems these days (capturing the result).
	const REGEX_NEWLINE = /(\r?\n)/;

	// Newline character code for charCodeAt() comparisons
	const NEWLINE_CODE = 10;

	// Private symbol for identifying `SourceNode`s when multiple versions of
	// the source-map library are loaded. This MUST NOT CHANGE across
	// versions!
	const isSourceNode = "$$$isSourceNode$$$";

	/**
	 * SourceNodes provide a way to abstract over interpolating/concatenating
	 * snippets of generated JavaScript source code while maintaining the line and
	 * column information associated with the original source code.
	 *
	 * @param aLine The original line number.
	 * @param aColumn The original column number.
	 * @param aSource The original source's filename.
	 * @param aChunks Optional. An array of strings which are snippets of
	 *        generated JS, or other SourceNodes.
	 * @param aName The original identifier.
	 */
	let SourceNode$2 = class SourceNode {
	  constructor(aLine, aColumn, aSource, aChunks, aName) {
	    this.children = [];
	    this.sourceContents = {};
	    this.line = aLine == null ? null : aLine;
	    this.column = aColumn == null ? null : aColumn;
	    this.source = aSource == null ? null : aSource;
	    this.name = aName == null ? null : aName;
	    this[isSourceNode] = true;
	    if (aChunks != null) this.add(aChunks);
	  }

	  /**
	   * Creates a SourceNode from generated code and a SourceMapConsumer.
	   *
	   * @param aGeneratedCode The generated code
	   * @param aSourceMapConsumer The SourceMap for the generated code
	   * @param aRelativePath Optional. The path that relative sources in the
	   *        SourceMapConsumer should be relative to.
	   */
	  static fromStringWithSourceMap(
	    aGeneratedCode,
	    aSourceMapConsumer,
	    aRelativePath
	  ) {
	    // The SourceNode we want to fill with the generated code
	    // and the SourceMap
	    const node = new SourceNode();

	    // All even indices of this array are one line of the generated code,
	    // while all odd indices are the newlines between two adjacent lines
	    // (since `REGEX_NEWLINE` captures its match).
	    // Processed fragments are accessed by calling `shiftNextLine`.
	    const remainingLines = aGeneratedCode.split(REGEX_NEWLINE);
	    let remainingLinesIndex = 0;
	    const shiftNextLine = function() {
	      const lineContents = getNextLine();
	      // The last line of a file might not have a newline.
	      const newLine = getNextLine() || "";
	      return lineContents + newLine;

	      function getNextLine() {
	        return remainingLinesIndex < remainingLines.length
	          ? remainingLines[remainingLinesIndex++]
	          : undefined;
	      }
	    };

	    // We need to remember the position of "remainingLines"
	    let lastGeneratedLine = 1,
	      lastGeneratedColumn = 0;

	    // The generate SourceNodes we need a code range.
	    // To extract it current and last mapping is used.
	    // Here we store the last mapping.
	    let lastMapping = null;
	    let nextLine;

	    aSourceMapConsumer.eachMapping(function(mapping) {
	      if (lastMapping !== null) {
	        // We add the code from "lastMapping" to "mapping":
	        // First check if there is a new line in between.
	        if (lastGeneratedLine < mapping.generatedLine) {
	          // Associate first line with "lastMapping"
	          addMappingWithCode(lastMapping, shiftNextLine());
	          lastGeneratedLine++;
	          lastGeneratedColumn = 0;
	          // The remaining code is added without mapping
	        } else {
	          // There is no new line in between.
	          // Associate the code between "lastGeneratedColumn" and
	          // "mapping.generatedColumn" with "lastMapping"
	          nextLine = remainingLines[remainingLinesIndex] || "";
	          const code = nextLine.substr(
	            0,
	            mapping.generatedColumn - lastGeneratedColumn
	          );
	          remainingLines[remainingLinesIndex] = nextLine.substr(
	            mapping.generatedColumn - lastGeneratedColumn
	          );
	          lastGeneratedColumn = mapping.generatedColumn;
	          addMappingWithCode(lastMapping, code);
	          // No more remaining code, continue
	          lastMapping = mapping;
	          return;
	        }
	      }
	      // We add the generated code until the first mapping
	      // to the SourceNode without any mapping.
	      // Each line is added as separate string.
	      while (lastGeneratedLine < mapping.generatedLine) {
	        node.add(shiftNextLine());
	        lastGeneratedLine++;
	      }
	      if (lastGeneratedColumn < mapping.generatedColumn) {
	        nextLine = remainingLines[remainingLinesIndex] || "";
	        node.add(nextLine.substr(0, mapping.generatedColumn));
	        remainingLines[remainingLinesIndex] = nextLine.substr(
	          mapping.generatedColumn
	        );
	        lastGeneratedColumn = mapping.generatedColumn;
	      }
	      lastMapping = mapping;
	    }, this);
	    // We have processed all mappings.
	    if (remainingLinesIndex < remainingLines.length) {
	      if (lastMapping) {
	        // Associate the remaining code in the current line with "lastMapping"
	        addMappingWithCode(lastMapping, shiftNextLine());
	      }
	      // and add the remaining lines without any mapping
	      node.add(remainingLines.splice(remainingLinesIndex).join(""));
	    }

	    // Copy sourcesContent into SourceNode
	    aSourceMapConsumer.sources.forEach(function(sourceFile) {
	      const content = aSourceMapConsumer.sourceContentFor(sourceFile);
	      if (content != null) {
	        if (aRelativePath != null) {
	          sourceFile = util.join(aRelativePath, sourceFile);
	        }
	        node.setSourceContent(sourceFile, content);
	      }
	    });

	    return node;

	    function addMappingWithCode(mapping, code) {
	      if (mapping === null || mapping.source === undefined) {
	        node.add(code);
	      } else {
	        const source = aRelativePath
	          ? util.join(aRelativePath, mapping.source)
	          : mapping.source;
	        node.add(
	          new SourceNode(
	            mapping.originalLine,
	            mapping.originalColumn,
	            source,
	            code,
	            mapping.name
	          )
	        );
	      }
	    }
	  }

	  /**
	   * Add a chunk of generated JS to this source node.
	   *
	   * @param aChunk A string snippet of generated JS code, another instance of
	   *        SourceNode, or an array where each member is one of those things.
	   */
	  add(aChunk) {
	    if (Array.isArray(aChunk)) {
	      aChunk.forEach(function(chunk) {
	        this.add(chunk);
	      }, this);
	    } else if (aChunk[isSourceNode] || typeof aChunk === "string") {
	      if (aChunk) {
	        this.children.push(aChunk);
	      }
	    } else {
	      throw new TypeError(
	        "Expected a SourceNode, string, or an array of SourceNodes and strings. Got " +
	          aChunk
	      );
	    }
	    return this;
	  }

	  /**
	   * Add a chunk of generated JS to the beginning of this source node.
	   *
	   * @param aChunk A string snippet of generated JS code, another instance of
	   *        SourceNode, or an array where each member is one of those things.
	   */
	  prepend(aChunk) {
	    if (Array.isArray(aChunk)) {
	      for (let i = aChunk.length - 1; i >= 0; i--) {
	        this.prepend(aChunk[i]);
	      }
	    } else if (aChunk[isSourceNode] || typeof aChunk === "string") {
	      this.children.unshift(aChunk);
	    } else {
	      throw new TypeError(
	        "Expected a SourceNode, string, or an array of SourceNodes and strings. Got " +
	          aChunk
	      );
	    }
	    return this;
	  }

	  /**
	   * Walk over the tree of JS snippets in this node and its children. The
	   * walking function is called once for each snippet of JS and is passed that
	   * snippet and the its original associated source's line/column location.
	   *
	   * @param aFn The traversal function.
	   */
	  walk(aFn) {
	    let chunk;
	    for (let i = 0, len = this.children.length; i < len; i++) {
	      chunk = this.children[i];
	      if (chunk[isSourceNode]) {
	        chunk.walk(aFn);
	      } else if (chunk !== "") {
	        aFn(chunk, {
	          source: this.source,
	          line: this.line,
	          column: this.column,
	          name: this.name
	        });
	      }
	    }
	  }

	  /**
	   * Like `String.prototype.join` except for SourceNodes. Inserts `aStr` between
	   * each of `this.children`.
	   *
	   * @param aSep The separator.
	   */
	  join(aSep) {
	    let newChildren;
	    let i;
	    const len = this.children.length;
	    if (len > 0) {
	      newChildren = [];
	      for (i = 0; i < len - 1; i++) {
	        newChildren.push(this.children[i]);
	        newChildren.push(aSep);
	      }
	      newChildren.push(this.children[i]);
	      this.children = newChildren;
	    }
	    return this;
	  }

	  /**
	   * Call String.prototype.replace on the very right-most source snippet. Useful
	   * for trimming whitespace from the end of a source node, etc.
	   *
	   * @param aPattern The pattern to replace.
	   * @param aReplacement The thing to replace the pattern with.
	   */
	  replaceRight(aPattern, aReplacement) {
	    const lastChild = this.children[this.children.length - 1];
	    if (lastChild[isSourceNode]) {
	      lastChild.replaceRight(aPattern, aReplacement);
	    } else if (typeof lastChild === "string") {
	      this.children[this.children.length - 1] = lastChild.replace(
	        aPattern,
	        aReplacement
	      );
	    } else {
	      this.children.push("".replace(aPattern, aReplacement));
	    }
	    return this;
	  }

	  /**
	   * Set the source content for a source file. This will be added to the SourceMapGenerator
	   * in the sourcesContent field.
	   *
	   * @param aSourceFile The filename of the source file
	   * @param aSourceContent The content of the source file
	   */
	  setSourceContent(aSourceFile, aSourceContent) {
	    this.sourceContents[util.toSetString(aSourceFile)] = aSourceContent;
	  }

	  /**
	   * Walk over the tree of SourceNodes. The walking function is called for each
	   * source file content and is passed the filename and source content.
	   *
	   * @param aFn The traversal function.
	   */
	  walkSourceContents(aFn) {
	    for (let i = 0, len = this.children.length; i < len; i++) {
	      if (this.children[i][isSourceNode]) {
	        this.children[i].walkSourceContents(aFn);
	      }
	    }

	    const sources = Object.keys(this.sourceContents);
	    for (let i = 0, len = sources.length; i < len; i++) {
	      aFn(util.fromSetString(sources[i]), this.sourceContents[sources[i]]);
	    }
	  }

	  /**
	   * Return the string representation of this source node. Walks over the tree
	   * and concatenates all the various snippets together to one string.
	   */
	  toString() {
	    let str = "";
	    this.walk(function(chunk) {
	      str += chunk;
	    });
	    return str;
	  }

	  /**
	   * Returns the string representation of this source node along with a source
	   * map.
	   */
	  toStringWithSourceMap(aArgs) {
	    const generated = {
	      code: "",
	      line: 1,
	      column: 0
	    };
	    const map = new SourceMapGenerator(aArgs);
	    let sourceMappingActive = false;
	    let lastOriginalSource = null;
	    let lastOriginalLine = null;
	    let lastOriginalColumn = null;
	    let lastOriginalName = null;
	    this.walk(function(chunk, original) {
	      generated.code += chunk;
	      if (
	        original.source !== null &&
	        original.line !== null &&
	        original.column !== null
	      ) {
	        if (
	          lastOriginalSource !== original.source ||
	          lastOriginalLine !== original.line ||
	          lastOriginalColumn !== original.column ||
	          lastOriginalName !== original.name
	        ) {
	          map.addMapping({
	            source: original.source,
	            original: {
	              line: original.line,
	              column: original.column
	            },
	            generated: {
	              line: generated.line,
	              column: generated.column
	            },
	            name: original.name
	          });
	        }
	        lastOriginalSource = original.source;
	        lastOriginalLine = original.line;
	        lastOriginalColumn = original.column;
	        lastOriginalName = original.name;
	        sourceMappingActive = true;
	      } else if (sourceMappingActive) {
	        map.addMapping({
	          generated: {
	            line: generated.line,
	            column: generated.column
	          }
	        });
	        lastOriginalSource = null;
	        sourceMappingActive = false;
	      }
	      for (let idx = 0, length = chunk.length; idx < length; idx++) {
	        if (chunk.charCodeAt(idx) === NEWLINE_CODE) {
	          generated.line++;
	          generated.column = 0;
	          // Mappings end at eol
	          if (idx + 1 === length) {
	            lastOriginalSource = null;
	            sourceMappingActive = false;
	          } else if (sourceMappingActive) {
	            map.addMapping({
	              source: original.source,
	              original: {
	                line: original.line,
	                column: original.column
	              },
	              generated: {
	                line: generated.line,
	                column: generated.column
	              },
	              name: original.name
	            });
	          }
	        } else {
	          generated.column++;
	        }
	      }
	    });
	    this.walkSourceContents(function(sourceFile, sourceContent) {
	      map.setSourceContent(sourceFile, sourceContent);
	    });

	    return { code: generated.code, map };
	  }
	};

	sourceNode.SourceNode = SourceNode$2;

	/*
	 * Copyright 2009-2011 Mozilla Foundation and contributors
	 * Licensed under the New BSD license. See LICENSE.txt or:
	 * http://opensource.org/licenses/BSD-3-Clause
	 */

	sourceMap.SourceMapGenerator = sourceMapGenerator.SourceMapGenerator;
	sourceMap.SourceNode = sourceNode.SourceNode;

	var SourceNode$1 = sourceMap.SourceNode;
	var GrammarLocation$2 = grammarLocation;
	var Stack$1 = (function () {
	    function Stack(ruleName, varName, type, bytecode) {
	        this.sp = -1;
	        this.maxSp = -1;
	        this.varName = varName;
	        this.ruleName = ruleName;
	        this.type = type;
	        this.bytecode = bytecode;
	        this.labels = {};
	        this.sourceMapStack = [];
	    }
	    Stack.prototype.name = function (i) {
	        if (i < 0) {
	            throw new RangeError("Rule '".concat(this.ruleName, "': The variable stack underflow: attempt to use a variable '").concat(this.varName, "<x>' at an index ").concat(i, ".\nBytecode: ").concat(this.bytecode));
	        }
	        return this.varName + i;
	    };
	    Stack.sourceNode = function (location, chunks, name) {
	        var start = GrammarLocation$2.offsetStart(location);
	        return new SourceNode$1(start.line, start.column ? start.column - 1 : null, String(location.source), chunks, name);
	    };
	    Stack.prototype.push = function (exprCode) {
	        if (++this.sp > this.maxSp) {
	            this.maxSp = this.sp;
	        }
	        var label = this.labels[this.sp];
	        var code = [this.name(this.sp), " = ", exprCode, ";"];
	        if (label) {
	            if (this.sourceMapStack.length) {
	                var sourceNode = Stack.sourceNode(label.location, code.splice(0, 2), label.label);
	                var _a = this.sourceMapPopInternal(), parts = _a.parts, location = _a.location;
	                var newLoc = (location.start.offset < label.location.end.offset)
	                    ? {
	                        start: label.location.end,
	                        end: location.end,
	                        source: location.source,
	                    }
	                    : location;
	                var outerNode = Stack.sourceNode(newLoc, code.concat("\n"));
	                this.sourceMapStack.push([parts, parts.length + 1, location]);
	                return new SourceNode$1(null, null, label.location.source, [sourceNode, outerNode]);
	            }
	            else {
	                return Stack.sourceNode(label.location, code.concat("\n"));
	            }
	        }
	        return code.join("");
	    };
	    Stack.prototype.pop = function (n) {
	        var _this = this;
	        if (n !== undefined) {
	            this.sp -= n;
	            return Array.from({ length: n }, function (v, i) { return _this.name(_this.sp + 1 + i); });
	        }
	        return this.name(this.sp--);
	    };
	    Stack.prototype.top = function () { return this.name(this.sp); };
	    Stack.prototype.index = function (i) {
	        if (i < 0) {
	            throw new RangeError("Rule '".concat(this.ruleName, "': The variable stack overflow: attempt to get a variable at a negative index ").concat(i, ".\nBytecode: ").concat(this.bytecode));
	        }
	        return this.name(this.sp - i);
	    };
	    Stack.prototype.result = function () {
	        if (this.maxSp < 0) {
	            throw new RangeError("Rule '".concat(this.ruleName, "': The variable stack is empty, can't get the result.\nBytecode: ").concat(this.bytecode));
	        }
	        return this.name(0);
	    };
	    Stack.prototype.defines = function () {
	        var _this = this;
	        if (this.maxSp < 0) {
	            return "";
	        }
	        return this.type + " " + Array.from({ length: this.maxSp + 1 }, function (v, i) { return _this.name(i); }).join(", ") + ";";
	    };
	    Stack.prototype.checkedIf = function (pos, generateIf, generateElse) {
	        var baseSp = this.sp;
	        var ifResult = generateIf();
	        if (!generateElse) {
	            return [ifResult];
	        }
	        var thenSp = this.sp;
	        this.sp = baseSp;
	        var elseResult = generateElse();
	        if (thenSp !== this.sp) {
	            throw new Error("Rule '" + this.ruleName + "', position " + pos + ": "
	                + "Branches of a condition can't move the stack pointer differently "
	                + "(before: " + baseSp + ", after then: " + thenSp + ", after else: " + this.sp + "). "
	                + "Bytecode: " + this.bytecode);
	        }
	        return [ifResult, elseResult];
	    };
	    Stack.prototype.checkedLoop = function (pos, generateBody) {
	        var baseSp = this.sp;
	        var result = generateBody();
	        if (baseSp !== this.sp) {
	            throw new Error("Rule '" + this.ruleName + "', position " + pos + ": "
	                + "Body of a loop can't move the stack pointer "
	                + "(before: " + baseSp + ", after: " + this.sp + "). "
	                + "Bytecode: " + this.bytecode);
	        }
	        return result;
	    };
	    Stack.prototype.sourceMapPush = function (parts, location) {
	        if (this.sourceMapStack.length) {
	            var top = this.sourceMapStack[this.sourceMapStack.length - 1];
	            if (top[2].start.offset === location.start.offset
	                && top[2].end.offset > location.end.offset) {
	                top[2] = {
	                    start: location.end,
	                    end: top[2].end,
	                    source: top[2].source,
	                };
	            }
	        }
	        this.sourceMapStack.push([
	            parts,
	            parts.length,
	            location,
	        ]);
	    };
	    Stack.prototype.sourceMapPopInternal = function () {
	        var elt = this.sourceMapStack.pop();
	        if (!elt) {
	            throw new RangeError("Rule '".concat(this.ruleName, "': Attempting to pop an empty source map stack.\nBytecode: ").concat(this.bytecode));
	        }
	        var parts = elt[0], index = elt[1], location = elt[2];
	        var chunks = parts.splice(index).map(function (chunk) { return (chunk instanceof SourceNode$1
	            ? chunk
	            : chunk + "\n"); });
	        if (chunks.length) {
	            var start = GrammarLocation$2.offsetStart(location);
	            parts.push(new SourceNode$1(start.line, start.column - 1, String(location.source), chunks));
	        }
	        return { parts: parts, location: location };
	    };
	    Stack.prototype.sourceMapPop = function (offset) {
	        var location = this.sourceMapPopInternal().location;
	        if (this.sourceMapStack.length
	            && location.end.offset
	                < this.sourceMapStack[this.sourceMapStack.length - 1][2].end.offset) {
	            var _a = this.sourceMapPopInternal(), parts = _a.parts, outer = _a.location;
	            var newLoc = (outer.start.offset < location.end.offset)
	                ? {
	                    start: location.end,
	                    end: outer.end,
	                    source: outer.source,
	                }
	                : outer;
	            this.sourceMapStack.push([
	                parts,
	                parts.length + (offset || 0),
	                newLoc,
	            ]);
	        }
	        return undefined;
	    };
	    return Stack;
	}());
	var stack = Stack$1;

	var version = "4.0.3";

	var utils = {};

	function hex(ch) { return ch.charCodeAt(0).toString(16).toUpperCase(); }
	utils.hex = hex;
	function stringEscape$1(s) {
	    return s
	        .replace(/\\/g, "\\\\")
	        .replace(/"/g, "\\\"")
	        .replace(/\0/g, "\\0")
	        .replace(/\x08/g, "\\b")
	        .replace(/\t/g, "\\t")
	        .replace(/\n/g, "\\n")
	        .replace(/\v/g, "\\v")
	        .replace(/\f/g, "\\f")
	        .replace(/\r/g, "\\r")
	        .replace(/[\x00-\x0F]/g, function (ch) { return "\\x0" + hex(ch); })
	        .replace(/[\x10-\x1F\x7F-\xFF]/g, function (ch) { return "\\x" + hex(ch); })
	        .replace(/[\u0100-\u0FFF]/g, function (ch) { return "\\u0" + hex(ch); })
	        .replace(/[\u1000-\uFFFF]/g, function (ch) { return "\\u" + hex(ch); });
	}
	utils.stringEscape = stringEscape$1;
	function regexpClassEscape$1(s) {
	    return s
	        .replace(/\\/g, "\\\\")
	        .replace(/\//g, "\\/")
	        .replace(/]/g, "\\]")
	        .replace(/\^/g, "\\^")
	        .replace(/-/g, "\\-")
	        .replace(/\0/g, "\\0")
	        .replace(/\x08/g, "\\b")
	        .replace(/\t/g, "\\t")
	        .replace(/\n/g, "\\n")
	        .replace(/\v/g, "\\v")
	        .replace(/\f/g, "\\f")
	        .replace(/\r/g, "\\r")
	        .replace(/[\x00-\x0F]/g, function (ch) { return "\\x0" + hex(ch); })
	        .replace(/[\x10-\x1F\x7F-\xFF]/g, function (ch) { return "\\x" + hex(ch); })
	        .replace(/[\u0100-\u0FFF]/g, function (ch) { return "\\u0" + hex(ch); })
	        .replace(/[\u1000-\uFFFF]/g, function (ch) { return "\\u" + hex(ch); });
	}
	utils.regexpClassEscape = regexpClassEscape$1;
	function base64$1(u8) {
	    var A = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
	    var rem = u8.length % 3;
	    var len = u8.length - rem;
	    var res = "";
	    for (var i = 0; i < len; i += 3) {
	        res += A[u8[i] >> 2];
	        res += A[((u8[i] & 0x3) << 4) | (u8[i + 1] >> 4)];
	        res += A[((u8[i + 1] & 0xf) << 2) | (u8[i + 2] >> 6)];
	        res += A[u8[i + 2] & 0x3f];
	    }
	    if (rem === 1) {
	        res += A[u8[len] >> 2];
	        res += A[(u8[len] & 0x3) << 4];
	        res += "==";
	    }
	    else if (rem === 2) {
	        res += A[u8[len] >> 2];
	        res += A[((u8[len] & 0x3) << 4) | (u8[len + 1] >> 4)];
	        res += A[(u8[len + 1] & 0xf) << 2];
	        res += "=";
	    }
	    return res;
	}
	utils.base64 = base64$1;

	var OPS_TO_PREFIXED_TYPES = {
	    "$": "text",
	    "&": "simple_and",
	    "!": "simple_not"
	};
	var OPS_TO_SUFFIXED_TYPES = {
	    "?": "optional",
	    "*": "zero_or_more",
	    "+": "one_or_more"
	};
	var OPS_TO_SEMANTIC_PREDICATE_TYPES = {
	    "&": "semantic_and",
	    "!": "semantic_not"
	};
	function peg$subclass(child, parent) {
	    function C() { this.constructor = child; }
	    C.prototype = parent.prototype;
	    child.prototype = new C();
	}
	function peg$SyntaxError(message, expected, found, location) {
	    var self = Error.call(this, message);
	    if (Object.setPrototypeOf) {
	        Object.setPrototypeOf(self, peg$SyntaxError.prototype);
	    }
	    self.expected = expected;
	    self.found = found;
	    self.location = location;
	    self.name = "SyntaxError";
	    return self;
	}
	peg$subclass(peg$SyntaxError, Error);
	function peg$padEnd(str, targetLength, padString) {
	    padString = padString || " ";
	    if (str.length > targetLength) {
	        return str;
	    }
	    targetLength -= str.length;
	    padString += padString.repeat(targetLength);
	    return str + padString.slice(0, targetLength);
	}
	peg$SyntaxError.prototype.format = function (sources) {
	    var str = "Error: " + this.message;
	    if (this.location) {
	        var src = null;
	        var k;
	        for (k = 0; k < sources.length; k++) {
	            if (sources[k].source === this.location.source) {
	                src = sources[k].text.split(/\r\n|\n|\r/g);
	                break;
	            }
	        }
	        var s = this.location.start;
	        var offset_s = (this.location.source && (typeof this.location.source.offset === "function"))
	            ? this.location.source.offset(s)
	            : s;
	        var loc = this.location.source + ":" + offset_s.line + ":" + offset_s.column;
	        if (src) {
	            var e = this.location.end;
	            var filler = peg$padEnd("", offset_s.line.toString().length, ' ');
	            var line = src[s.line - 1];
	            var last = s.line === e.line ? e.column : line.length + 1;
	            var hatLen = (last - s.column) || 1;
	            str += "\n --> " + loc + "\n"
	                + filler + " |\n"
	                + offset_s.line + " | " + line + "\n"
	                + filler + " | " + peg$padEnd("", s.column - 1, ' ')
	                + peg$padEnd("", hatLen, "^");
	        }
	        else {
	            str += "\n at " + loc;
	        }
	    }
	    return str;
	};
	peg$SyntaxError.buildMessage = function (expected, found) {
	    var DESCRIBE_EXPECTATION_FNS = {
	        literal: function (expectation) {
	            return "\"" + literalEscape(expectation.text) + "\"";
	        },
	        class: function (expectation) {
	            var escapedParts = expectation.parts.map(function (part) {
	                return Array.isArray(part)
	                    ? classEscape(part[0]) + "-" + classEscape(part[1])
	                    : classEscape(part);
	            });
	            return "[" + (expectation.inverted ? "^" : "") + escapedParts.join("") + "]";
	        },
	        any: function () {
	            return "any character";
	        },
	        end: function () {
	            return "end of input";
	        },
	        other: function (expectation) {
	            return expectation.description;
	        }
	    };
	    function hex(ch) {
	        return ch.charCodeAt(0).toString(16).toUpperCase();
	    }
	    function literalEscape(s) {
	        return s
	            .replace(/\\/g, "\\\\")
	            .replace(/"/g, "\\\"")
	            .replace(/\0/g, "\\0")
	            .replace(/\t/g, "\\t")
	            .replace(/\n/g, "\\n")
	            .replace(/\r/g, "\\r")
	            .replace(/[\x00-\x0F]/g, function (ch) { return "\\x0" + hex(ch); })
	            .replace(/[\x10-\x1F\x7F-\x9F]/g, function (ch) { return "\\x" + hex(ch); });
	    }
	    function classEscape(s) {
	        return s
	            .replace(/\\/g, "\\\\")
	            .replace(/\]/g, "\\]")
	            .replace(/\^/g, "\\^")
	            .replace(/-/g, "\\-")
	            .replace(/\0/g, "\\0")
	            .replace(/\t/g, "\\t")
	            .replace(/\n/g, "\\n")
	            .replace(/\r/g, "\\r")
	            .replace(/[\x00-\x0F]/g, function (ch) { return "\\x0" + hex(ch); })
	            .replace(/[\x10-\x1F\x7F-\x9F]/g, function (ch) { return "\\x" + hex(ch); });
	    }
	    function describeExpectation(expectation) {
	        return DESCRIBE_EXPECTATION_FNS[expectation.type](expectation);
	    }
	    function describeExpected(expected) {
	        var descriptions = expected.map(describeExpectation);
	        var i, j;
	        descriptions.sort();
	        if (descriptions.length > 0) {
	            for (i = 1, j = 1; i < descriptions.length; i++) {
	                if (descriptions[i - 1] !== descriptions[i]) {
	                    descriptions[j] = descriptions[i];
	                    j++;
	                }
	            }
	            descriptions.length = j;
	        }
	        switch (descriptions.length) {
	            case 1:
	                return descriptions[0];
	            case 2:
	                return descriptions[0] + " or " + descriptions[1];
	            default:
	                return descriptions.slice(0, -1).join(", ")
	                    + ", or "
	                    + descriptions[descriptions.length - 1];
	        }
	    }
	    function describeFound(found) {
	        return found ? "\"" + literalEscape(found) + "\"" : "end of input";
	    }
	    return "Expected " + describeExpected(expected) + " but " + describeFound(found) + " found.";
	};
	function peg$parse(input, options) {
	    options = options !== undefined ? options : {};
	    var peg$FAILED = {};
	    var peg$source = options.grammarSource;
	    var peg$startRuleFunctions = { Grammar: peg$parseGrammar, ImportsAndSource: peg$parseImportsAndSource };
	    var peg$startRuleFunction = peg$parseGrammar;
	    var peg$c0 = "import";
	    var peg$c1 = ";";
	    var peg$c2 = ",";
	    var peg$c3 = "*";
	    var peg$c4 = "as";
	    var peg$c5 = "{";
	    var peg$c6 = "}";
	    var peg$c7 = "from";
	    var peg$c8 = "=";
	    var peg$c9 = "/";
	    var peg$c10 = "@";
	    var peg$c11 = ":";
	    var peg$c12 = "|";
	    var peg$c13 = "..";
	    var peg$c14 = "(";
	    var peg$c15 = ")";
	    var peg$c16 = ".";
	    var peg$c17 = "\n";
	    var peg$c18 = "\r\n";
	    var peg$c19 = "/*";
	    var peg$c20 = "*/";
	    var peg$c21 = "//";
	    var peg$c22 = "\\";
	    var peg$c23 = "i";
	    var peg$c24 = "\"";
	    var peg$c25 = "'";
	    var peg$c26 = "[";
	    var peg$c27 = "^";
	    var peg$c28 = "]";
	    var peg$c29 = "-";
	    var peg$c30 = "0";
	    var peg$c31 = "b";
	    var peg$c32 = "f";
	    var peg$c33 = "n";
	    var peg$c34 = "r";
	    var peg$c35 = "t";
	    var peg$c36 = "v";
	    var peg$c37 = "x";
	    var peg$c38 = "u";
	    var peg$r0 = /^[!$&]/;
	    var peg$r1 = /^[*-+?]/;
	    var peg$r2 = /^[!&]/;
	    var peg$r3 = /^[\t\v-\f \xA0\u1680\u2000-\u200A\u202F\u205F\u3000\uFEFF]/;
	    var peg$r4 = /^[\n\r\u2028\u2029]/;
	    var peg$r5 = /^[\r\u2028-\u2029]/;
	    var peg$r6 = /^[A-Z_a-z\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376-\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u05D0-\u05EA\u05F0-\u05F2\u0620-\u064A\u066E-\u066F\u0671-\u06D3\u06D5\u06E5-\u06E6\u06EE-\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4-\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u08A0-\u08B4\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098C\u098F-\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC-\u09DD\u09DF-\u09E1\u09F0-\u09F1\u0A05-\u0A0A\u0A0F-\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32-\u0A33\u0A35-\u0A36\u0A38-\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2-\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0-\u0AE1\u0AF9\u0B05-\u0B0C\u0B0F-\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32-\u0B33\u0B35-\u0B39\u0B3D\u0B5C-\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99-\u0B9A\u0B9C\u0B9E-\u0B9F\u0BA3-\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D\u0C58-\u0C5A\u0C60-\u0C61\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0-\u0CE1\u0CF1-\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D5F-\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32-\u0E33\u0E40-\u0E46\u0E81-\u0E82\u0E84\u0E87-\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA-\u0EAB\u0EAD-\u0EB0\u0EB2-\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065-\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F5\u13F8-\u13FD\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1877\u1880-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191E\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE-\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1CE9-\u1CEC\u1CEE-\u1CF1\u1CF5-\u1CF6\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2-\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2E2F\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303C\u3041-\u3096\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FD5\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A-\uA62B\uA640-\uA66E\uA67F-\uA69D\uA6A0-\uA6EF\uA717-\uA71F\uA722-\uA788\uA78B-\uA7AD\uA7B0-\uA7B7\uA7F7-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA8FD\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uA9E0-\uA9E4\uA9E6-\uA9EF\uA9FA-\uA9FE\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA7E-\uAAAF\uAAB1\uAAB5-\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB65\uAB70-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40-\uFB41\uFB43-\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]/;
	    var peg$r7 = /^[$0-9_\u0300-\u036F\u0483-\u0487\u0591-\u05BD\u05BF\u05C1-\u05C2\u05C4-\u05C5\u05C7\u0610-\u061A\u064B-\u0669\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7-\u06E8\u06EA-\u06ED\u06F0-\u06F9\u0711\u0730-\u074A\u07A6-\u07B0\u07C0-\u07C9\u07EB-\u07F3\u0816-\u0819\u081B-\u0823\u0825-\u0827\u0829-\u082D\u0859-\u085B\u08E3-\u0903\u093A-\u093C\u093E-\u094F\u0951-\u0957\u0962-\u0963\u0966-\u096F\u0981-\u0983\u09BC\u09BE-\u09C4\u09C7-\u09C8\u09CB-\u09CD\u09D7\u09E2-\u09E3\u09E6-\u09EF\u0A01-\u0A03\u0A3C\u0A3E-\u0A42\u0A47-\u0A48\u0A4B-\u0A4D\u0A51\u0A66-\u0A71\u0A75\u0A81-\u0A83\u0ABC\u0ABE-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AE2-\u0AE3\u0AE6-\u0AEF\u0B01-\u0B03\u0B3C\u0B3E-\u0B44\u0B47-\u0B48\u0B4B-\u0B4D\u0B56-\u0B57\u0B62-\u0B63\u0B66-\u0B6F\u0B82\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD7\u0BE6-\u0BEF\u0C00-\u0C03\u0C3E-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55-\u0C56\u0C62-\u0C63\u0C66-\u0C6F\u0C81-\u0C83\u0CBC\u0CBE-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5-\u0CD6\u0CE2-\u0CE3\u0CE6-\u0CEF\u0D01-\u0D03\u0D3E-\u0D44\u0D46-\u0D48\u0D4A-\u0D4D\u0D57\u0D62-\u0D63\u0D66-\u0D6F\u0D82-\u0D83\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DE6-\u0DEF\u0DF2-\u0DF3\u0E31\u0E34-\u0E3A\u0E47-\u0E4E\u0E50-\u0E59\u0EB1\u0EB4-\u0EB9\u0EBB-\u0EBC\u0EC8-\u0ECD\u0ED0-\u0ED9\u0F18-\u0F19\u0F20-\u0F29\u0F35\u0F37\u0F39\u0F3E-\u0F3F\u0F71-\u0F84\u0F86-\u0F87\u0F8D-\u0F97\u0F99-\u0FBC\u0FC6\u102B-\u103E\u1040-\u1049\u1056-\u1059\u105E-\u1060\u1062-\u1064\u1067-\u106D\u1071-\u1074\u1082-\u108D\u108F-\u109D\u135D-\u135F\u1712-\u1714\u1732-\u1734\u1752-\u1753\u1772-\u1773\u17B4-\u17D3\u17DD\u17E0-\u17E9\u180B-\u180D\u1810-\u1819\u18A9\u1920-\u192B\u1930-\u193B\u1946-\u194F\u19D0-\u19D9\u1A17-\u1A1B\u1A55-\u1A5E\u1A60-\u1A7C\u1A7F-\u1A89\u1A90-\u1A99\u1AB0-\u1ABD\u1B00-\u1B04\u1B34-\u1B44\u1B50-\u1B59\u1B6B-\u1B73\u1B80-\u1B82\u1BA1-\u1BAD\u1BB0-\u1BB9\u1BE6-\u1BF3\u1C24-\u1C37\u1C40-\u1C49\u1C50-\u1C59\u1CD0-\u1CD2\u1CD4-\u1CE8\u1CED\u1CF2-\u1CF4\u1CF8-\u1CF9\u1DC0-\u1DF5\u1DFC-\u1DFF\u200C-\u200D\u203F-\u2040\u2054\u20D0-\u20DC\u20E1\u20E5-\u20F0\u2CEF-\u2CF1\u2D7F\u2DE0-\u2DFF\u302A-\u302F\u3099-\u309A\uA620-\uA629\uA66F\uA674-\uA67D\uA69E-\uA69F\uA6F0-\uA6F1\uA802\uA806\uA80B\uA823-\uA827\uA880-\uA881\uA8B4-\uA8C4\uA8D0-\uA8D9\uA8E0-\uA8F1\uA900-\uA909\uA926-\uA92D\uA947-\uA953\uA980-\uA983\uA9B3-\uA9C0\uA9D0-\uA9D9\uA9E5\uA9F0-\uA9F9\uAA29-\uAA36\uAA43\uAA4C-\uAA4D\uAA50-\uAA59\uAA7B-\uAA7D\uAAB0\uAAB2-\uAAB4\uAAB7-\uAAB8\uAABE-\uAABF\uAAC1\uAAEB-\uAAEF\uAAF5-\uAAF6\uABE3-\uABEA\uABEC-\uABED\uABF0-\uABF9\uFB1E\uFE00-\uFE0F\uFE20-\uFE2F\uFE33-\uFE34\uFE4D-\uFE4F\uFF10-\uFF19\uFF3F]/;
	    var peg$r10 = /^[\n\r"\\\u2028-\u2029]/;
	    var peg$r11 = /^[\n\r'\\\u2028-\u2029]/;
	    var peg$r12 = /^[\n\r\\-\]\u2028-\u2029]/;
	    var peg$r13 = /^["'\\]/;
	    var peg$r14 = /^[0-9ux]/;
	    var peg$r15 = /^[0-9]/;
	    var peg$r16 = /^[0-9a-f]/i;
	    var peg$r17 = /^[{}]/;
	    var peg$e0 = peg$anyExpectation();
	    var peg$e1 = peg$literalExpectation("import", false);
	    var peg$e2 = peg$literalExpectation(";", false);
	    var peg$e3 = peg$literalExpectation(",", false);
	    var peg$e4 = peg$literalExpectation("*", false);
	    var peg$e5 = peg$literalExpectation("as", false);
	    var peg$e6 = peg$literalExpectation("{", false);
	    var peg$e7 = peg$literalExpectation("}", false);
	    var peg$e8 = peg$literalExpectation("from", false);
	    var peg$e9 = peg$literalExpectation("=", false);
	    var peg$e10 = peg$literalExpectation("/", false);
	    var peg$e11 = peg$literalExpectation("@", false);
	    var peg$e12 = peg$literalExpectation(":", false);
	    var peg$e13 = peg$classExpectation(["!", "$", "&"], false, false);
	    var peg$e14 = peg$classExpectation([["*", "+"], "?"], false, false);
	    var peg$e15 = peg$literalExpectation("|", false);
	    var peg$e16 = peg$literalExpectation("..", false);
	    var peg$e17 = peg$literalExpectation("(", false);
	    var peg$e18 = peg$literalExpectation(")", false);
	    var peg$e19 = peg$literalExpectation(".", false);
	    var peg$e20 = peg$classExpectation(["!", "&"], false, false);
	    var peg$e21 = peg$otherExpectation("whitespace");
	    var peg$e22 = peg$classExpectation(["\t", ["\v", "\f"], " ", "\xA0", "\u1680", ["\u2000", "\u200A"], "\u202F", "\u205F", "\u3000", "\uFEFF"], false, false);
	    var peg$e23 = peg$classExpectation(["\n", "\r", "\u2028", "\u2029"], false, false);
	    var peg$e24 = peg$otherExpectation("end of line");
	    var peg$e25 = peg$literalExpectation("\n", false);
	    var peg$e26 = peg$literalExpectation("\r\n", false);
	    var peg$e27 = peg$classExpectation(["\r", ["\u2028", "\u2029"]], false, false);
	    var peg$e28 = peg$otherExpectation("comment");
	    var peg$e29 = peg$literalExpectation("/*", false);
	    var peg$e30 = peg$literalExpectation("*/", false);
	    var peg$e31 = peg$literalExpectation("//", false);
	    var peg$e32 = peg$otherExpectation("identifier");
	    var peg$e33 = peg$classExpectation([["A", "Z"], "_", ["a", "z"], "\xAA", "\xB5", "\xBA", ["\xC0", "\xD6"], ["\xD8", "\xF6"], ["\xF8", "\u02C1"], ["\u02C6", "\u02D1"], ["\u02E0", "\u02E4"], "\u02EC", "\u02EE", ["\u0370", "\u0374"], ["\u0376", "\u0377"], ["\u037A", "\u037D"], "\u037F", "\u0386", ["\u0388", "\u038A"], "\u038C", ["\u038E", "\u03A1"], ["\u03A3", "\u03F5"], ["\u03F7", "\u0481"], ["\u048A", "\u052F"], ["\u0531", "\u0556"], "\u0559", ["\u0561", "\u0587"], ["\u05D0", "\u05EA"], ["\u05F0", "\u05F2"], ["\u0620", "\u064A"], ["\u066E", "\u066F"], ["\u0671", "\u06D3"], "\u06D5", ["\u06E5", "\u06E6"], ["\u06EE", "\u06EF"], ["\u06FA", "\u06FC"], "\u06FF", "\u0710", ["\u0712", "\u072F"], ["\u074D", "\u07A5"], "\u07B1", ["\u07CA", "\u07EA"], ["\u07F4", "\u07F5"], "\u07FA", ["\u0800", "\u0815"], "\u081A", "\u0824", "\u0828", ["\u0840", "\u0858"], ["\u08A0", "\u08B4"], ["\u0904", "\u0939"], "\u093D", "\u0950", ["\u0958", "\u0961"], ["\u0971", "\u0980"], ["\u0985", "\u098C"], ["\u098F", "\u0990"], ["\u0993", "\u09A8"], ["\u09AA", "\u09B0"], "\u09B2", ["\u09B6", "\u09B9"], "\u09BD", "\u09CE", ["\u09DC", "\u09DD"], ["\u09DF", "\u09E1"], ["\u09F0", "\u09F1"], ["\u0A05", "\u0A0A"], ["\u0A0F", "\u0A10"], ["\u0A13", "\u0A28"], ["\u0A2A", "\u0A30"], ["\u0A32", "\u0A33"], ["\u0A35", "\u0A36"], ["\u0A38", "\u0A39"], ["\u0A59", "\u0A5C"], "\u0A5E", ["\u0A72", "\u0A74"], ["\u0A85", "\u0A8D"], ["\u0A8F", "\u0A91"], ["\u0A93", "\u0AA8"], ["\u0AAA", "\u0AB0"], ["\u0AB2", "\u0AB3"], ["\u0AB5", "\u0AB9"], "\u0ABD", "\u0AD0", ["\u0AE0", "\u0AE1"], "\u0AF9", ["\u0B05", "\u0B0C"], ["\u0B0F", "\u0B10"], ["\u0B13", "\u0B28"], ["\u0B2A", "\u0B30"], ["\u0B32", "\u0B33"], ["\u0B35", "\u0B39"], "\u0B3D", ["\u0B5C", "\u0B5D"], ["\u0B5F", "\u0B61"], "\u0B71", "\u0B83", ["\u0B85", "\u0B8A"], ["\u0B8E", "\u0B90"], ["\u0B92", "\u0B95"], ["\u0B99", "\u0B9A"], "\u0B9C", ["\u0B9E", "\u0B9F"], ["\u0BA3", "\u0BA4"], ["\u0BA8", "\u0BAA"], ["\u0BAE", "\u0BB9"], "\u0BD0", ["\u0C05", "\u0C0C"], ["\u0C0E", "\u0C10"], ["\u0C12", "\u0C28"], ["\u0C2A", "\u0C39"], "\u0C3D", ["\u0C58", "\u0C5A"], ["\u0C60", "\u0C61"], ["\u0C85", "\u0C8C"], ["\u0C8E", "\u0C90"], ["\u0C92", "\u0CA8"], ["\u0CAA", "\u0CB3"], ["\u0CB5", "\u0CB9"], "\u0CBD", "\u0CDE", ["\u0CE0", "\u0CE1"], ["\u0CF1", "\u0CF2"], ["\u0D05", "\u0D0C"], ["\u0D0E", "\u0D10"], ["\u0D12", "\u0D3A"], "\u0D3D", "\u0D4E", ["\u0D5F", "\u0D61"], ["\u0D7A", "\u0D7F"], ["\u0D85", "\u0D96"], ["\u0D9A", "\u0DB1"], ["\u0DB3", "\u0DBB"], "\u0DBD", ["\u0DC0", "\u0DC6"], ["\u0E01", "\u0E30"], ["\u0E32", "\u0E33"], ["\u0E40", "\u0E46"], ["\u0E81", "\u0E82"], "\u0E84", ["\u0E87", "\u0E88"], "\u0E8A", "\u0E8D", ["\u0E94", "\u0E97"], ["\u0E99", "\u0E9F"], ["\u0EA1", "\u0EA3"], "\u0EA5", "\u0EA7", ["\u0EAA", "\u0EAB"], ["\u0EAD", "\u0EB0"], ["\u0EB2", "\u0EB3"], "\u0EBD", ["\u0EC0", "\u0EC4"], "\u0EC6", ["\u0EDC", "\u0EDF"], "\u0F00", ["\u0F40", "\u0F47"], ["\u0F49", "\u0F6C"], ["\u0F88", "\u0F8C"], ["\u1000", "\u102A"], "\u103F", ["\u1050", "\u1055"], ["\u105A", "\u105D"], "\u1061", ["\u1065", "\u1066"], ["\u106E", "\u1070"], ["\u1075", "\u1081"], "\u108E", ["\u10A0", "\u10C5"], "\u10C7", "\u10CD", ["\u10D0", "\u10FA"], ["\u10FC", "\u1248"], ["\u124A", "\u124D"], ["\u1250", "\u1256"], "\u1258", ["\u125A", "\u125D"], ["\u1260", "\u1288"], ["\u128A", "\u128D"], ["\u1290", "\u12B0"], ["\u12B2", "\u12B5"], ["\u12B8", "\u12BE"], "\u12C0", ["\u12C2", "\u12C5"], ["\u12C8", "\u12D6"], ["\u12D8", "\u1310"], ["\u1312", "\u1315"], ["\u1318", "\u135A"], ["\u1380", "\u138F"], ["\u13A0", "\u13F5"], ["\u13F8", "\u13FD"], ["\u1401", "\u166C"], ["\u166F", "\u167F"], ["\u1681", "\u169A"], ["\u16A0", "\u16EA"], ["\u16EE", "\u16F8"], ["\u1700", "\u170C"], ["\u170E", "\u1711"], ["\u1720", "\u1731"], ["\u1740", "\u1751"], ["\u1760", "\u176C"], ["\u176E", "\u1770"], ["\u1780", "\u17B3"], "\u17D7", "\u17DC", ["\u1820", "\u1877"], ["\u1880", "\u18A8"], "\u18AA", ["\u18B0", "\u18F5"], ["\u1900", "\u191E"], ["\u1950", "\u196D"], ["\u1970", "\u1974"], ["\u1980", "\u19AB"], ["\u19B0", "\u19C9"], ["\u1A00", "\u1A16"], ["\u1A20", "\u1A54"], "\u1AA7", ["\u1B05", "\u1B33"], ["\u1B45", "\u1B4B"], ["\u1B83", "\u1BA0"], ["\u1BAE", "\u1BAF"], ["\u1BBA", "\u1BE5"], ["\u1C00", "\u1C23"], ["\u1C4D", "\u1C4F"], ["\u1C5A", "\u1C7D"], ["\u1CE9", "\u1CEC"], ["\u1CEE", "\u1CF1"], ["\u1CF5", "\u1CF6"], ["\u1D00", "\u1DBF"], ["\u1E00", "\u1F15"], ["\u1F18", "\u1F1D"], ["\u1F20", "\u1F45"], ["\u1F48", "\u1F4D"], ["\u1F50", "\u1F57"], "\u1F59", "\u1F5B", "\u1F5D", ["\u1F5F", "\u1F7D"], ["\u1F80", "\u1FB4"], ["\u1FB6", "\u1FBC"], "\u1FBE", ["\u1FC2", "\u1FC4"], ["\u1FC6", "\u1FCC"], ["\u1FD0", "\u1FD3"], ["\u1FD6", "\u1FDB"], ["\u1FE0", "\u1FEC"], ["\u1FF2", "\u1FF4"], ["\u1FF6", "\u1FFC"], "\u2071", "\u207F", ["\u2090", "\u209C"], "\u2102", "\u2107", ["\u210A", "\u2113"], "\u2115", ["\u2119", "\u211D"], "\u2124", "\u2126", "\u2128", ["\u212A", "\u212D"], ["\u212F", "\u2139"], ["\u213C", "\u213F"], ["\u2145", "\u2149"], "\u214E", ["\u2160", "\u2188"], ["\u2C00", "\u2C2E"], ["\u2C30", "\u2C5E"], ["\u2C60", "\u2CE4"], ["\u2CEB", "\u2CEE"], ["\u2CF2", "\u2CF3"], ["\u2D00", "\u2D25"], "\u2D27", "\u2D2D", ["\u2D30", "\u2D67"], "\u2D6F", ["\u2D80", "\u2D96"], ["\u2DA0", "\u2DA6"], ["\u2DA8", "\u2DAE"], ["\u2DB0", "\u2DB6"], ["\u2DB8", "\u2DBE"], ["\u2DC0", "\u2DC6"], ["\u2DC8", "\u2DCE"], ["\u2DD0", "\u2DD6"], ["\u2DD8", "\u2DDE"], "\u2E2F", ["\u3005", "\u3007"], ["\u3021", "\u3029"], ["\u3031", "\u3035"], ["\u3038", "\u303C"], ["\u3041", "\u3096"], ["\u309D", "\u309F"], ["\u30A1", "\u30FA"], ["\u30FC", "\u30FF"], ["\u3105", "\u312D"], ["\u3131", "\u318E"], ["\u31A0", "\u31BA"], ["\u31F0", "\u31FF"], ["\u3400", "\u4DB5"], ["\u4E00", "\u9FD5"], ["\uA000", "\uA48C"], ["\uA4D0", "\uA4FD"], ["\uA500", "\uA60C"], ["\uA610", "\uA61F"], ["\uA62A", "\uA62B"], ["\uA640", "\uA66E"], ["\uA67F", "\uA69D"], ["\uA6A0", "\uA6EF"], ["\uA717", "\uA71F"], ["\uA722", "\uA788"], ["\uA78B", "\uA7AD"], ["\uA7B0", "\uA7B7"], ["\uA7F7", "\uA801"], ["\uA803", "\uA805"], ["\uA807", "\uA80A"], ["\uA80C", "\uA822"], ["\uA840", "\uA873"], ["\uA882", "\uA8B3"], ["\uA8F2", "\uA8F7"], "\uA8FB", "\uA8FD", ["\uA90A", "\uA925"], ["\uA930", "\uA946"], ["\uA960", "\uA97C"], ["\uA984", "\uA9B2"], "\uA9CF", ["\uA9E0", "\uA9E4"], ["\uA9E6", "\uA9EF"], ["\uA9FA", "\uA9FE"], ["\uAA00", "\uAA28"], ["\uAA40", "\uAA42"], ["\uAA44", "\uAA4B"], ["\uAA60", "\uAA76"], "\uAA7A", ["\uAA7E", "\uAAAF"], "\uAAB1", ["\uAAB5", "\uAAB6"], ["\uAAB9", "\uAABD"], "\uAAC0", "\uAAC2", ["\uAADB", "\uAADD"], ["\uAAE0", "\uAAEA"], ["\uAAF2", "\uAAF4"], ["\uAB01", "\uAB06"], ["\uAB09", "\uAB0E"], ["\uAB11", "\uAB16"], ["\uAB20", "\uAB26"], ["\uAB28", "\uAB2E"], ["\uAB30", "\uAB5A"], ["\uAB5C", "\uAB65"], ["\uAB70", "\uABE2"], ["\uAC00", "\uD7A3"], ["\uD7B0", "\uD7C6"], ["\uD7CB", "\uD7FB"], ["\uF900", "\uFA6D"], ["\uFA70", "\uFAD9"], ["\uFB00", "\uFB06"], ["\uFB13", "\uFB17"], "\uFB1D", ["\uFB1F", "\uFB28"], ["\uFB2A", "\uFB36"], ["\uFB38", "\uFB3C"], "\uFB3E", ["\uFB40", "\uFB41"], ["\uFB43", "\uFB44"], ["\uFB46", "\uFBB1"], ["\uFBD3", "\uFD3D"], ["\uFD50", "\uFD8F"], ["\uFD92", "\uFDC7"], ["\uFDF0", "\uFDFB"], ["\uFE70", "\uFE74"], ["\uFE76", "\uFEFC"], ["\uFF21", "\uFF3A"], ["\uFF41", "\uFF5A"], ["\uFF66", "\uFFBE"], ["\uFFC2", "\uFFC7"], ["\uFFCA", "\uFFCF"], ["\uFFD2", "\uFFD7"], ["\uFFDA", "\uFFDC"]], false, false);
	    var peg$e34 = peg$literalExpectation("\\", false);
	    var peg$e35 = peg$classExpectation(["$", ["0", "9"], "_", ["\u0300", "\u036F"], ["\u0483", "\u0487"], ["\u0591", "\u05BD"], "\u05BF", ["\u05C1", "\u05C2"], ["\u05C4", "\u05C5"], "\u05C7", ["\u0610", "\u061A"], ["\u064B", "\u0669"], "\u0670", ["\u06D6", "\u06DC"], ["\u06DF", "\u06E4"], ["\u06E7", "\u06E8"], ["\u06EA", "\u06ED"], ["\u06F0", "\u06F9"], "\u0711", ["\u0730", "\u074A"], ["\u07A6", "\u07B0"], ["\u07C0", "\u07C9"], ["\u07EB", "\u07F3"], ["\u0816", "\u0819"], ["\u081B", "\u0823"], ["\u0825", "\u0827"], ["\u0829", "\u082D"], ["\u0859", "\u085B"], ["\u08E3", "\u0903"], ["\u093A", "\u093C"], ["\u093E", "\u094F"], ["\u0951", "\u0957"], ["\u0962", "\u0963"], ["\u0966", "\u096F"], ["\u0981", "\u0983"], "\u09BC", ["\u09BE", "\u09C4"], ["\u09C7", "\u09C8"], ["\u09CB", "\u09CD"], "\u09D7", ["\u09E2", "\u09E3"], ["\u09E6", "\u09EF"], ["\u0A01", "\u0A03"], "\u0A3C", ["\u0A3E", "\u0A42"], ["\u0A47", "\u0A48"], ["\u0A4B", "\u0A4D"], "\u0A51", ["\u0A66", "\u0A71"], "\u0A75", ["\u0A81", "\u0A83"], "\u0ABC", ["\u0ABE", "\u0AC5"], ["\u0AC7", "\u0AC9"], ["\u0ACB", "\u0ACD"], ["\u0AE2", "\u0AE3"], ["\u0AE6", "\u0AEF"], ["\u0B01", "\u0B03"], "\u0B3C", ["\u0B3E", "\u0B44"], ["\u0B47", "\u0B48"], ["\u0B4B", "\u0B4D"], ["\u0B56", "\u0B57"], ["\u0B62", "\u0B63"], ["\u0B66", "\u0B6F"], "\u0B82", ["\u0BBE", "\u0BC2"], ["\u0BC6", "\u0BC8"], ["\u0BCA", "\u0BCD"], "\u0BD7", ["\u0BE6", "\u0BEF"], ["\u0C00", "\u0C03"], ["\u0C3E", "\u0C44"], ["\u0C46", "\u0C48"], ["\u0C4A", "\u0C4D"], ["\u0C55", "\u0C56"], ["\u0C62", "\u0C63"], ["\u0C66", "\u0C6F"], ["\u0C81", "\u0C83"], "\u0CBC", ["\u0CBE", "\u0CC4"], ["\u0CC6", "\u0CC8"], ["\u0CCA", "\u0CCD"], ["\u0CD5", "\u0CD6"], ["\u0CE2", "\u0CE3"], ["\u0CE6", "\u0CEF"], ["\u0D01", "\u0D03"], ["\u0D3E", "\u0D44"], ["\u0D46", "\u0D48"], ["\u0D4A", "\u0D4D"], "\u0D57", ["\u0D62", "\u0D63"], ["\u0D66", "\u0D6F"], ["\u0D82", "\u0D83"], "\u0DCA", ["\u0DCF", "\u0DD4"], "\u0DD6", ["\u0DD8", "\u0DDF"], ["\u0DE6", "\u0DEF"], ["\u0DF2", "\u0DF3"], "\u0E31", ["\u0E34", "\u0E3A"], ["\u0E47", "\u0E4E"], ["\u0E50", "\u0E59"], "\u0EB1", ["\u0EB4", "\u0EB9"], ["\u0EBB", "\u0EBC"], ["\u0EC8", "\u0ECD"], ["\u0ED0", "\u0ED9"], ["\u0F18", "\u0F19"], ["\u0F20", "\u0F29"], "\u0F35", "\u0F37", "\u0F39", ["\u0F3E", "\u0F3F"], ["\u0F71", "\u0F84"], ["\u0F86", "\u0F87"], ["\u0F8D", "\u0F97"], ["\u0F99", "\u0FBC"], "\u0FC6", ["\u102B", "\u103E"], ["\u1040", "\u1049"], ["\u1056", "\u1059"], ["\u105E", "\u1060"], ["\u1062", "\u1064"], ["\u1067", "\u106D"], ["\u1071", "\u1074"], ["\u1082", "\u108D"], ["\u108F", "\u109D"], ["\u135D", "\u135F"], ["\u1712", "\u1714"], ["\u1732", "\u1734"], ["\u1752", "\u1753"], ["\u1772", "\u1773"], ["\u17B4", "\u17D3"], "\u17DD", ["\u17E0", "\u17E9"], ["\u180B", "\u180D"], ["\u1810", "\u1819"], "\u18A9", ["\u1920", "\u192B"], ["\u1930", "\u193B"], ["\u1946", "\u194F"], ["\u19D0", "\u19D9"], ["\u1A17", "\u1A1B"], ["\u1A55", "\u1A5E"], ["\u1A60", "\u1A7C"], ["\u1A7F", "\u1A89"], ["\u1A90", "\u1A99"], ["\u1AB0", "\u1ABD"], ["\u1B00", "\u1B04"], ["\u1B34", "\u1B44"], ["\u1B50", "\u1B59"], ["\u1B6B", "\u1B73"], ["\u1B80", "\u1B82"], ["\u1BA1", "\u1BAD"], ["\u1BB0", "\u1BB9"], ["\u1BE6", "\u1BF3"], ["\u1C24", "\u1C37"], ["\u1C40", "\u1C49"], ["\u1C50", "\u1C59"], ["\u1CD0", "\u1CD2"], ["\u1CD4", "\u1CE8"], "\u1CED", ["\u1CF2", "\u1CF4"], ["\u1CF8", "\u1CF9"], ["\u1DC0", "\u1DF5"], ["\u1DFC", "\u1DFF"], ["\u200C", "\u200D"], ["\u203F", "\u2040"], "\u2054", ["\u20D0", "\u20DC"], "\u20E1", ["\u20E5", "\u20F0"], ["\u2CEF", "\u2CF1"], "\u2D7F", ["\u2DE0", "\u2DFF"], ["\u302A", "\u302F"], ["\u3099", "\u309A"], ["\uA620", "\uA629"], "\uA66F", ["\uA674", "\uA67D"], ["\uA69E", "\uA69F"], ["\uA6F0", "\uA6F1"], "\uA802", "\uA806", "\uA80B", ["\uA823", "\uA827"], ["\uA880", "\uA881"], ["\uA8B4", "\uA8C4"], ["\uA8D0", "\uA8D9"], ["\uA8E0", "\uA8F1"], ["\uA900", "\uA909"], ["\uA926", "\uA92D"], ["\uA947", "\uA953"], ["\uA980", "\uA983"], ["\uA9B3", "\uA9C0"], ["\uA9D0", "\uA9D9"], "\uA9E5", ["\uA9F0", "\uA9F9"], ["\uAA29", "\uAA36"], "\uAA43", ["\uAA4C", "\uAA4D"], ["\uAA50", "\uAA59"], ["\uAA7B", "\uAA7D"], "\uAAB0", ["\uAAB2", "\uAAB4"], ["\uAAB7", "\uAAB8"], ["\uAABE", "\uAABF"], "\uAAC1", ["\uAAEB", "\uAAEF"], ["\uAAF5", "\uAAF6"], ["\uABE3", "\uABEA"], ["\uABEC", "\uABED"], ["\uABF0", "\uABF9"], "\uFB1E", ["\uFE00", "\uFE0F"], ["\uFE20", "\uFE2F"], ["\uFE33", "\uFE34"], ["\uFE4D", "\uFE4F"], ["\uFF10", "\uFF19"], "\uFF3F"], false, false);
	    var peg$e38 = peg$otherExpectation("literal");
	    var peg$e39 = peg$literalExpectation("i", false);
	    var peg$e40 = peg$otherExpectation("string");
	    var peg$e41 = peg$literalExpectation("\"", false);
	    var peg$e42 = peg$literalExpectation("'", false);
	    var peg$e43 = peg$classExpectation(["\n", "\r", "\"", "\\", ["\u2028", "\u2029"]], false, false);
	    var peg$e44 = peg$classExpectation(["\n", "\r", "'", "\\", ["\u2028", "\u2029"]], false, false);
	    var peg$e45 = peg$otherExpectation("character class");
	    var peg$e46 = peg$literalExpectation("[", false);
	    var peg$e47 = peg$literalExpectation("^", false);
	    var peg$e48 = peg$literalExpectation("]", false);
	    var peg$e49 = peg$literalExpectation("-", false);
	    var peg$e50 = peg$classExpectation(["\n", "\r", ["\\", "]"], ["\u2028", "\u2029"]], false, false);
	    var peg$e51 = peg$literalExpectation("0", false);
	    var peg$e52 = peg$classExpectation(["\"", "'", "\\"], false, false);
	    var peg$e53 = peg$literalExpectation("b", false);
	    var peg$e54 = peg$literalExpectation("f", false);
	    var peg$e55 = peg$literalExpectation("n", false);
	    var peg$e56 = peg$literalExpectation("r", false);
	    var peg$e57 = peg$literalExpectation("t", false);
	    var peg$e58 = peg$literalExpectation("v", false);
	    var peg$e59 = peg$classExpectation([["0", "9"], "u", "x"], false, false);
	    var peg$e60 = peg$literalExpectation("x", false);
	    var peg$e61 = peg$literalExpectation("u", false);
	    var peg$e62 = peg$classExpectation([["0", "9"]], false, false);
	    var peg$e63 = peg$classExpectation([["0", "9"], ["a", "f"]], false, true);
	    var peg$e64 = peg$otherExpectation("code block");
	    var peg$e65 = peg$classExpectation(["{", "}"], false, false);
	    var peg$f0 = function (imports, topLevelInitializer, initializer, rules) {
	        return {
	            type: "grammar",
	            imports: imports,
	            topLevelInitializer: topLevelInitializer,
	            initializer: initializer,
	            rules: rules,
	            location: location()
	        };
	    };
	    var peg$f1 = function (imports, body) {
	        return [imports, body];
	    };
	    var peg$f2 = function (code) {
	        return {
	            type: "top_level_initializer",
	            code: code,
	            codeLocation: location(),
	        };
	    };
	    var peg$f3 = function (code) {
	        return {
	            type: "top_level_initializer",
	            code: code,
	            codeLocation: location()
	        };
	    };
	    var peg$f4 = function (what, from) {
	        return {
	            type: "grammar_import",
	            what: what,
	            from: from,
	            location: location()
	        };
	    };
	    var peg$f5 = function (from) {
	        return {
	            type: "grammar_import", what: [],
	            from: from,
	            location: location()
	        };
	    };
	    var peg$f6 = function (first, others) {
	        if (!others) {
	            return [first];
	        }
	        if (Array.isArray(others)) {
	            others.unshift(first);
	            return others;
	        }
	        return [first, others];
	    };
	    var peg$f7 = function (binding) {
	        return {
	            type: 'import_binding_default',
	            binding: binding[0],
	            location: binding[1],
	        };
	    };
	    var peg$f8 = function (binding) {
	        return [{
	                type: 'import_binding_all',
	                binding: binding[0],
	                location: binding[1],
	            }];
	    };
	    var peg$f9 = function () { return []; };
	    var peg$f10 = function (rename, binding) {
	        return {
	            type: 'import_binding_rename',
	            rename: rename[0],
	            renameLocation: rename[1],
	            binding: binding[0],
	            location: binding[1],
	        };
	    };
	    var peg$f11 = function (binding) {
	        return {
	            type: 'import_binding',
	            binding: binding[0],
	            location: binding[1]
	        };
	    };
	    var peg$f12 = function (module) {
	        return { type: 'import_module_specifier', module: module, location: location() };
	    };
	    var peg$f13 = function (id) { return [id, location()]; };
	    var peg$f14 = function (id) { return [id, location()]; };
	    var peg$f15 = function (id) {
	        if (reservedWords.indexOf(id[0]) >= 0) {
	            error("Binding identifier can't be a reserved word \"".concat(id[0], "\""), id[1]);
	        }
	        return id[0];
	    };
	    var peg$f16 = function (code) {
	        return {
	            type: "top_level_initializer",
	            code: code[0],
	            codeLocation: code[1],
	            location: location()
	        };
	    };
	    var peg$f17 = function (code) {
	        return {
	            type: "initializer",
	            code: code[0],
	            codeLocation: code[1],
	            location: location()
	        };
	    };
	    var peg$f18 = function (name, displayName, expression) {
	        return {
	            type: "rule",
	            name: name[0],
	            nameLocation: name[1],
	            expression: displayName !== null
	                ? {
	                    type: "named",
	                    name: displayName,
	                    expression: expression,
	                    location: location()
	                }
	                : expression,
	            location: location()
	        };
	    };
	    var peg$f19 = function (head, tail) {
	        return tail.length > 0
	            ? {
	                type: "choice",
	                alternatives: [head].concat(tail),
	                location: location()
	            }
	            : head;
	    };
	    var peg$f20 = function (expression, code) {
	        return code !== null
	            ? {
	                type: "action",
	                expression: expression,
	                code: code[0],
	                codeLocation: code[1],
	                location: location()
	            }
	            : expression;
	    };
	    var peg$f21 = function (head, tail) {
	        return ((tail.length > 0) || (head.type === "labeled" && head.pick))
	            ? {
	                type: "sequence",
	                elements: [head].concat(tail),
	                location: location()
	            }
	            : head;
	    };
	    var peg$f22 = function (pluck, label, expression) {
	        if (expression.type.startsWith("semantic_")) {
	            error("\"@\" cannot be used on a semantic predicate", pluck);
	        }
	        return {
	            type: "labeled",
	            label: label !== null ? label[0] : null,
	            labelLocation: label !== null ? label[1] : pluck,
	            pick: true,
	            expression: expression,
	            location: location()
	        };
	    };
	    var peg$f23 = function (label, expression) {
	        return {
	            type: "labeled",
	            label: label[0],
	            labelLocation: label[1],
	            expression: expression,
	            location: location()
	        };
	    };
	    var peg$f24 = function () { return location(); };
	    var peg$f25 = function (label) {
	        if (reservedWords.indexOf(label[0]) >= 0) {
	            error("Label can't be a reserved word \"".concat(label[0], "\""), label[1]);
	        }
	        return label;
	    };
	    var peg$f26 = function (operator, expression) {
	        return {
	            type: OPS_TO_PREFIXED_TYPES[operator],
	            expression: expression,
	            location: location()
	        };
	    };
	    var peg$f27 = function (expression, operator) {
	        return {
	            type: OPS_TO_SUFFIXED_TYPES[operator],
	            expression: expression,
	            location: location()
	        };
	    };
	    var peg$f28 = function (expression, boundaries, delimiter) {
	        var min = boundaries[0];
	        var max = boundaries[1];
	        if (max.type === "constant" && max.value === 0) {
	            error("The maximum count of repetitions of the rule must be > 0", max.location);
	        }
	        return {
	            type: "repeated",
	            min: min,
	            max: max,
	            expression: expression,
	            delimiter: delimiter,
	            location: location(),
	        };
	    };
	    var peg$f29 = function (min, max) {
	        return [
	            min !== null ? min : { type: "constant", value: 0 },
	            max !== null ? max : { type: "constant", value: null },
	        ];
	    };
	    var peg$f30 = function (exact) { return [null, exact]; };
	    var peg$f31 = function (value) { return { type: "constant", value: value, location: location() }; };
	    var peg$f32 = function (value) { return { type: "variable", value: value[0], location: location() }; };
	    var peg$f33 = function (value) {
	        return {
	            type: "function",
	            value: value[0],
	            codeLocation: value[1],
	            location: location(),
	        };
	    };
	    var peg$f34 = function (expression) {
	        return expression.type === "labeled" || expression.type === "sequence"
	            ? { type: "group", expression: expression, location: location() }
	            : expression;
	    };
	    var peg$f35 = function (library, name) {
	        return {
	            type: "library_ref",
	            name: name[0],
	            library: library[0],
	            libraryNumber: -1,
	            location: location()
	        };
	    };
	    var peg$f36 = function (name) {
	        return { type: "rule_ref", name: name[0], location: location() };
	    };
	    var peg$f37 = function (operator, code) {
	        return {
	            type: OPS_TO_SEMANTIC_PREDICATE_TYPES[operator],
	            code: code[0],
	            codeLocation: code[1],
	            location: location()
	        };
	    };
	    var peg$f38 = function (head, tail) {
	        return [head + tail.join(""), location()];
	    };
	    var peg$f39 = function (value, ignoreCase) {
	        return {
	            type: "literal",
	            value: value,
	            ignoreCase: ignoreCase !== null,
	            location: location()
	        };
	    };
	    var peg$f40 = function (chars) { return chars.join(""); };
	    var peg$f41 = function (chars) { return chars.join(""); };
	    var peg$f42 = function (inverted, parts, ignoreCase) {
	        return {
	            type: "class",
	            parts: parts.filter(function (part) { return part !== ""; }),
	            inverted: inverted !== null,
	            ignoreCase: ignoreCase !== null,
	            location: location()
	        };
	    };
	    var peg$f43 = function (begin, end) {
	        if (begin.charCodeAt(0) > end.charCodeAt(0)) {
	            error("Invalid character range: " + text() + ".");
	        }
	        return [begin, end];
	    };
	    var peg$f44 = function () { return ""; };
	    var peg$f45 = function () { return "\0"; };
	    var peg$f46 = function () { return "\b"; };
	    var peg$f47 = function () { return "\f"; };
	    var peg$f48 = function () { return "\n"; };
	    var peg$f49 = function () { return "\r"; };
	    var peg$f50 = function () { return "\t"; };
	    var peg$f51 = function () { return "\v"; };
	    var peg$f52 = function (digits) {
	        return String.fromCharCode(parseInt(digits, 16));
	    };
	    var peg$f53 = function (digits) {
	        return String.fromCharCode(parseInt(digits, 16));
	    };
	    var peg$f54 = function () { return { type: "any", location: location() }; };
	    var peg$f55 = function (code) { return [code, location()]; };
	    var peg$f56 = function (digits) { return parseInt(digits, 10); };
	    var peg$currPos = options.peg$currPos | 0;
	    var peg$savedPos = peg$currPos;
	    var peg$posDetailsCache = [{ line: 1, column: 1 }];
	    var peg$maxFailPos = peg$currPos;
	    var peg$maxFailExpected = options.peg$maxFailExpected || [];
	    var peg$silentFails = options.peg$silentFails | 0;
	    var peg$result;
	    if (options.startRule) {
	        if (!(options.startRule in peg$startRuleFunctions)) {
	            throw new Error("Can't start parsing from rule \"" + options.startRule + "\".");
	        }
	        peg$startRuleFunction = peg$startRuleFunctions[options.startRule];
	    }
	    function text() {
	        return input.substring(peg$savedPos, peg$currPos);
	    }
	    function location() {
	        return peg$computeLocation(peg$savedPos, peg$currPos);
	    }
	    function error(message, location) {
	        location = location !== undefined
	            ? location
	            : peg$computeLocation(peg$savedPos, peg$currPos);
	        throw peg$buildSimpleError(message, location);
	    }
	    function peg$literalExpectation(text, ignoreCase) {
	        return { type: "literal", text: text, ignoreCase: ignoreCase };
	    }
	    function peg$classExpectation(parts, inverted, ignoreCase) {
	        return { type: "class", parts: parts, inverted: inverted, ignoreCase: ignoreCase };
	    }
	    function peg$anyExpectation() {
	        return { type: "any" };
	    }
	    function peg$endExpectation() {
	        return { type: "end" };
	    }
	    function peg$otherExpectation(description) {
	        return { type: "other", description: description };
	    }
	    function peg$computePosDetails(pos) {
	        var details = peg$posDetailsCache[pos];
	        var p;
	        if (details) {
	            return details;
	        }
	        else {
	            if (pos >= peg$posDetailsCache.length) {
	                p = peg$posDetailsCache.length - 1;
	            }
	            else {
	                p = pos;
	                while (!peg$posDetailsCache[--p]) { }
	            }
	            details = peg$posDetailsCache[p];
	            details = {
	                line: details.line,
	                column: details.column
	            };
	            while (p < pos) {
	                if (input.charCodeAt(p) === 10) {
	                    details.line++;
	                    details.column = 1;
	                }
	                else {
	                    details.column++;
	                }
	                p++;
	            }
	            peg$posDetailsCache[pos] = details;
	            return details;
	        }
	    }
	    function peg$computeLocation(startPos, endPos, offset) {
	        var startPosDetails = peg$computePosDetails(startPos);
	        var endPosDetails = peg$computePosDetails(endPos);
	        var res = {
	            source: peg$source,
	            start: {
	                offset: startPos,
	                line: startPosDetails.line,
	                column: startPosDetails.column
	            },
	            end: {
	                offset: endPos,
	                line: endPosDetails.line,
	                column: endPosDetails.column
	            }
	        };
	        return res;
	    }
	    function peg$fail(expected) {
	        if (peg$currPos < peg$maxFailPos) {
	            return;
	        }
	        if (peg$currPos > peg$maxFailPos) {
	            peg$maxFailPos = peg$currPos;
	            peg$maxFailExpected = [];
	        }
	        peg$maxFailExpected.push(expected);
	    }
	    function peg$buildSimpleError(message, location) {
	        return new peg$SyntaxError(message, null, null, location);
	    }
	    function peg$buildStructuredError(expected, found, location) {
	        return new peg$SyntaxError(peg$SyntaxError.buildMessage(expected, found), expected, found, location);
	    }
	    function peg$parseGrammar() {
	        var s0, s1, s2, s3, s4, s5, s6, s7;
	        s0 = peg$currPos;
	        s1 = peg$parseImportDeclarations();
	        s2 = peg$currPos;
	        s3 = peg$parse__();
	        s4 = peg$parseTopLevelInitializer();
	        if (s4 !== peg$FAILED) {
	            s2 = s4;
	        }
	        else {
	            peg$currPos = s2;
	            s2 = peg$FAILED;
	        }
	        if (s2 === peg$FAILED) {
	            s2 = null;
	        }
	        s3 = peg$currPos;
	        s4 = peg$parse__();
	        s5 = peg$parseInitializer();
	        if (s5 !== peg$FAILED) {
	            s3 = s5;
	        }
	        else {
	            peg$currPos = s3;
	            s3 = peg$FAILED;
	        }
	        if (s3 === peg$FAILED) {
	            s3 = null;
	        }
	        s4 = peg$parse__();
	        s5 = [];
	        s6 = peg$currPos;
	        s7 = peg$parseRule();
	        if (s7 !== peg$FAILED) {
	            peg$parse__();
	            s6 = s7;
	        }
	        else {
	            peg$currPos = s6;
	            s6 = peg$FAILED;
	        }
	        if (s6 !== peg$FAILED) {
	            while (s6 !== peg$FAILED) {
	                s5.push(s6);
	                s6 = peg$currPos;
	                s7 = peg$parseRule();
	                if (s7 !== peg$FAILED) {
	                    peg$parse__();
	                    s6 = s7;
	                }
	                else {
	                    peg$currPos = s6;
	                    s6 = peg$FAILED;
	                }
	            }
	        }
	        else {
	            s5 = peg$FAILED;
	        }
	        if (s5 !== peg$FAILED) {
	            peg$savedPos = s0;
	            s0 = peg$f0(s1, s2, s3, s5);
	        }
	        else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	        }
	        return s0;
	    }
	    function peg$parseImportsAndSource() {
	        var s0, s1, s2;
	        s0 = peg$currPos;
	        s1 = peg$parseImportsAsText();
	        s2 = peg$parseGrammarBody();
	        peg$savedPos = s0;
	        s0 = peg$f1(s1, s2);
	        return s0;
	    }
	    function peg$parseGrammarBody() {
	        var s0, s1, s2, s3;
	        s0 = peg$currPos;
	        s1 = peg$currPos;
	        s2 = [];
	        if (input.length > peg$currPos) {
	            s3 = input.charAt(peg$currPos);
	            peg$currPos++;
	        }
	        else {
	            s3 = peg$FAILED;
	            if (peg$silentFails === 0) {
	                peg$fail(peg$e0);
	            }
	        }
	        while (s3 !== peg$FAILED) {
	            s2.push(s3);
	            if (input.length > peg$currPos) {
	                s3 = input.charAt(peg$currPos);
	                peg$currPos++;
	            }
	            else {
	                s3 = peg$FAILED;
	                if (peg$silentFails === 0) {
	                    peg$fail(peg$e0);
	                }
	            }
	        }
	        s1 = input.substring(s1, peg$currPos);
	        peg$savedPos = s0;
	        s1 = peg$f2(s1);
	        s0 = s1;
	        return s0;
	    }
	    function peg$parseImportsAsText() {
	        var s0, s1;
	        s0 = peg$currPos;
	        s1 = peg$currPos;
	        peg$parseImportDeclarations();
	        s1 = input.substring(s1, peg$currPos);
	        peg$savedPos = s0;
	        s1 = peg$f3(s1);
	        s0 = s1;
	        return s0;
	    }
	    function peg$parseImportDeclarations() {
	        var s0, s1;
	        s0 = [];
	        s1 = peg$parseImportDeclaration();
	        while (s1 !== peg$FAILED) {
	            s0.push(s1);
	            s1 = peg$parseImportDeclaration();
	        }
	        return s0;
	    }
	    function peg$parseImportDeclaration() {
	        var s0, s2, s4, s5, s6, s7, s8, s9;
	        s0 = peg$currPos;
	        peg$parse__();
	        if (input.substr(peg$currPos, 6) === peg$c0) {
	            s2 = peg$c0;
	            peg$currPos += 6;
	        }
	        else {
	            s2 = peg$FAILED;
	            if (peg$silentFails === 0) {
	                peg$fail(peg$e1);
	            }
	        }
	        if (s2 !== peg$FAILED) {
	            peg$parse__();
	            s4 = peg$parseImportClause();
	            if (s4 !== peg$FAILED) {
	                s5 = peg$parse__();
	                s6 = peg$parseFromClause();
	                if (s6 !== peg$FAILED) {
	                    s7 = peg$currPos;
	                    s8 = peg$parse__();
	                    if (input.charCodeAt(peg$currPos) === 59) {
	                        s9 = peg$c1;
	                        peg$currPos++;
	                    }
	                    else {
	                        s9 = peg$FAILED;
	                        if (peg$silentFails === 0) {
	                            peg$fail(peg$e2);
	                        }
	                    }
	                    if (s9 !== peg$FAILED) {
	                        s8 = [s8, s9];
	                        s7 = s8;
	                    }
	                    else {
	                        peg$currPos = s7;
	                        s7 = peg$FAILED;
	                    }
	                    if (s7 === peg$FAILED) {
	                        s7 = null;
	                    }
	                    peg$savedPos = s0;
	                    s0 = peg$f4(s4, s6);
	                }
	                else {
	                    peg$currPos = s0;
	                    s0 = peg$FAILED;
	                }
	            }
	            else {
	                peg$currPos = s0;
	                s0 = peg$FAILED;
	            }
	        }
	        else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	        }
	        if (s0 === peg$FAILED) {
	            s0 = peg$currPos;
	            peg$parse__();
	            if (input.substr(peg$currPos, 6) === peg$c0) {
	                s2 = peg$c0;
	                peg$currPos += 6;
	            }
	            else {
	                s2 = peg$FAILED;
	                if (peg$silentFails === 0) {
	                    peg$fail(peg$e1);
	                }
	            }
	            if (s2 !== peg$FAILED) {
	                peg$parse__();
	                s4 = peg$parseModuleSpecifier();
	                if (s4 !== peg$FAILED) {
	                    s5 = peg$currPos;
	                    s6 = peg$parse__();
	                    if (input.charCodeAt(peg$currPos) === 59) {
	                        s7 = peg$c1;
	                        peg$currPos++;
	                    }
	                    else {
	                        s7 = peg$FAILED;
	                        if (peg$silentFails === 0) {
	                            peg$fail(peg$e2);
	                        }
	                    }
	                    if (s7 !== peg$FAILED) {
	                        s6 = [s6, s7];
	                        s5 = s6;
	                    }
	                    else {
	                        peg$currPos = s5;
	                        s5 = peg$FAILED;
	                    }
	                    if (s5 === peg$FAILED) {
	                        s5 = null;
	                    }
	                    peg$savedPos = s0;
	                    s0 = peg$f5(s4);
	                }
	                else {
	                    peg$currPos = s0;
	                    s0 = peg$FAILED;
	                }
	            }
	            else {
	                peg$currPos = s0;
	                s0 = peg$FAILED;
	            }
	        }
	        return s0;
	    }
	    function peg$parseImportClause() {
	        var s0, s1, s2, s4, s6;
	        s0 = peg$parseNameSpaceImport();
	        if (s0 === peg$FAILED) {
	            s0 = peg$parseNamedImports();
	            if (s0 === peg$FAILED) {
	                s0 = peg$currPos;
	                s1 = peg$parseImportedDefaultBinding();
	                if (s1 !== peg$FAILED) {
	                    s2 = peg$currPos;
	                    peg$parse__();
	                    if (input.charCodeAt(peg$currPos) === 44) {
	                        s4 = peg$c2;
	                        peg$currPos++;
	                    }
	                    else {
	                        s4 = peg$FAILED;
	                        if (peg$silentFails === 0) {
	                            peg$fail(peg$e3);
	                        }
	                    }
	                    if (s4 !== peg$FAILED) {
	                        peg$parse__();
	                        s6 = peg$parseNameSpaceImport();
	                        if (s6 === peg$FAILED) {
	                            s6 = peg$parseNamedImports();
	                        }
	                        if (s6 !== peg$FAILED) {
	                            s2 = s6;
	                        }
	                        else {
	                            peg$currPos = s2;
	                            s2 = peg$FAILED;
	                        }
	                    }
	                    else {
	                        peg$currPos = s2;
	                        s2 = peg$FAILED;
	                    }
	                    if (s2 === peg$FAILED) {
	                        s2 = null;
	                    }
	                    peg$savedPos = s0;
	                    s0 = peg$f6(s1, s2);
	                }
	                else {
	                    peg$currPos = s0;
	                    s0 = peg$FAILED;
	                }
	            }
	        }
	        return s0;
	    }
	    function peg$parseImportedDefaultBinding() {
	        var s0, s1;
	        s0 = peg$currPos;
	        s1 = peg$parseImportedBinding();
	        if (s1 !== peg$FAILED) {
	            peg$savedPos = s0;
	            s1 = peg$f7(s1);
	        }
	        s0 = s1;
	        return s0;
	    }
	    function peg$parseNameSpaceImport() {
	        var s0, s1, s3, s5;
	        s0 = peg$currPos;
	        if (input.charCodeAt(peg$currPos) === 42) {
	            s1 = peg$c3;
	            peg$currPos++;
	        }
	        else {
	            s1 = peg$FAILED;
	            if (peg$silentFails === 0) {
	                peg$fail(peg$e4);
	            }
	        }
	        if (s1 !== peg$FAILED) {
	            peg$parse__();
	            if (input.substr(peg$currPos, 2) === peg$c4) {
	                s3 = peg$c4;
	                peg$currPos += 2;
	            }
	            else {
	                s3 = peg$FAILED;
	                if (peg$silentFails === 0) {
	                    peg$fail(peg$e5);
	                }
	            }
	            if (s3 !== peg$FAILED) {
	                peg$parse__();
	                s5 = peg$parseImportedBinding();
	                if (s5 !== peg$FAILED) {
	                    peg$savedPos = s0;
	                    s0 = peg$f8(s5);
	                }
	                else {
	                    peg$currPos = s0;
	                    s0 = peg$FAILED;
	                }
	            }
	            else {
	                peg$currPos = s0;
	                s0 = peg$FAILED;
	            }
	        }
	        else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	        }
	        return s0;
	    }
	    function peg$parseNamedImports() {
	        var s0, s1, s3, s5, s6, s7;
	        s0 = peg$currPos;
	        if (input.charCodeAt(peg$currPos) === 123) {
	            s1 = peg$c5;
	            peg$currPos++;
	        }
	        else {
	            s1 = peg$FAILED;
	            if (peg$silentFails === 0) {
	                peg$fail(peg$e6);
	            }
	        }
	        if (s1 !== peg$FAILED) {
	            peg$parse__();
	            if (input.charCodeAt(peg$currPos) === 125) {
	                s3 = peg$c6;
	                peg$currPos++;
	            }
	            else {
	                s3 = peg$FAILED;
	                if (peg$silentFails === 0) {
	                    peg$fail(peg$e7);
	                }
	            }
	            if (s3 !== peg$FAILED) {
	                peg$savedPos = s0;
	                s0 = peg$f9();
	            }
	            else {
	                peg$currPos = s0;
	                s0 = peg$FAILED;
	            }
	        }
	        else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	        }
	        if (s0 === peg$FAILED) {
	            s0 = peg$currPos;
	            if (input.charCodeAt(peg$currPos) === 123) {
	                s1 = peg$c5;
	                peg$currPos++;
	            }
	            else {
	                s1 = peg$FAILED;
	                if (peg$silentFails === 0) {
	                    peg$fail(peg$e6);
	                }
	            }
	            if (s1 !== peg$FAILED) {
	                peg$parse__();
	                s3 = peg$parseImportsList();
	                if (s3 !== peg$FAILED) {
	                    peg$parse__();
	                    s5 = peg$currPos;
	                    if (input.charCodeAt(peg$currPos) === 44) {
	                        s6 = peg$c2;
	                        peg$currPos++;
	                    }
	                    else {
	                        s6 = peg$FAILED;
	                        if (peg$silentFails === 0) {
	                            peg$fail(peg$e3);
	                        }
	                    }
	                    if (s6 !== peg$FAILED) {
	                        s7 = peg$parse__();
	                        s6 = [s6, s7];
	                        s5 = s6;
	                    }
	                    else {
	                        peg$currPos = s5;
	                        s5 = peg$FAILED;
	                    }
	                    if (s5 === peg$FAILED) {
	                        s5 = null;
	                    }
	                    if (input.charCodeAt(peg$currPos) === 125) {
	                        s6 = peg$c6;
	                        peg$currPos++;
	                    }
	                    else {
	                        s6 = peg$FAILED;
	                        if (peg$silentFails === 0) {
	                            peg$fail(peg$e7);
	                        }
	                    }
	                    if (s6 !== peg$FAILED) {
	                        s0 = s3;
	                    }
	                    else {
	                        peg$currPos = s0;
	                        s0 = peg$FAILED;
	                    }
	                }
	                else {
	                    peg$currPos = s0;
	                    s0 = peg$FAILED;
	                }
	            }
	            else {
	                peg$currPos = s0;
	                s0 = peg$FAILED;
	            }
	        }
	        return s0;
	    }
	    function peg$parseFromClause() {
	        var s0, s1, s3;
	        s0 = peg$currPos;
	        if (input.substr(peg$currPos, 4) === peg$c7) {
	            s1 = peg$c7;
	            peg$currPos += 4;
	        }
	        else {
	            s1 = peg$FAILED;
	            if (peg$silentFails === 0) {
	                peg$fail(peg$e8);
	            }
	        }
	        if (s1 !== peg$FAILED) {
	            peg$parse__();
	            s3 = peg$parseModuleSpecifier();
	            if (s3 !== peg$FAILED) {
	                s0 = s3;
	            }
	            else {
	                peg$currPos = s0;
	                s0 = peg$FAILED;
	            }
	        }
	        else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	        }
	        return s0;
	    }
	    function peg$parseImportsList() {
	        var s0, s1, s2, s3, s4, s5, s6;
	        s0 = peg$currPos;
	        s1 = [];
	        s2 = peg$parseImportSpecifier();
	        while (s2 !== peg$FAILED) {
	            s1.push(s2);
	            s2 = peg$currPos;
	            s3 = peg$currPos;
	            s4 = peg$parse__();
	            if (input.charCodeAt(peg$currPos) === 44) {
	                s5 = peg$c2;
	                peg$currPos++;
	            }
	            else {
	                s5 = peg$FAILED;
	                if (peg$silentFails === 0) {
	                    peg$fail(peg$e3);
	                }
	            }
	            if (s5 !== peg$FAILED) {
	                s6 = peg$parse__();
	                s4 = [s4, s5, s6];
	                s3 = s4;
	            }
	            else {
	                peg$currPos = s3;
	                s3 = peg$FAILED;
	            }
	            if (s3 !== peg$FAILED) {
	                s3 = peg$parseImportSpecifier();
	                if (s3 === peg$FAILED) {
	                    peg$currPos = s2;
	                    s2 = peg$FAILED;
	                }
	                else {
	                    s2 = s3;
	                }
	            }
	            else {
	                s2 = s3;
	            }
	        }
	        if (s1.length < 1) {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	        }
	        else {
	            s0 = s1;
	        }
	        return s0;
	    }
	    function peg$parseImportSpecifier() {
	        var s0, s1, s3, s5;
	        s0 = peg$currPos;
	        s1 = peg$parseModuleExportName();
	        if (s1 !== peg$FAILED) {
	            peg$parse__();
	            if (input.substr(peg$currPos, 2) === peg$c4) {
	                s3 = peg$c4;
	                peg$currPos += 2;
	            }
	            else {
	                s3 = peg$FAILED;
	                if (peg$silentFails === 0) {
	                    peg$fail(peg$e5);
	                }
	            }
	            if (s3 !== peg$FAILED) {
	                peg$parse__();
	                s5 = peg$parseImportedBinding();
	                if (s5 !== peg$FAILED) {
	                    peg$savedPos = s0;
	                    s0 = peg$f10(s1, s5);
	                }
	                else {
	                    peg$currPos = s0;
	                    s0 = peg$FAILED;
	                }
	            }
	            else {
	                peg$currPos = s0;
	                s0 = peg$FAILED;
	            }
	        }
	        else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	        }
	        if (s0 === peg$FAILED) {
	            s0 = peg$currPos;
	            s1 = peg$parseImportedBinding();
	            if (s1 !== peg$FAILED) {
	                peg$savedPos = s0;
	                s1 = peg$f11(s1);
	            }
	            s0 = s1;
	        }
	        return s0;
	    }
	    function peg$parseModuleSpecifier() {
	        var s0, s1;
	        s0 = peg$currPos;
	        s1 = peg$parseStringLiteral();
	        if (s1 !== peg$FAILED) {
	            peg$savedPos = s0;
	            s1 = peg$f12(s1);
	        }
	        s0 = s1;
	        return s0;
	    }
	    function peg$parseImportedBinding() {
	        var s0, s1;
	        s0 = peg$currPos;
	        s1 = peg$parseBindingIdentifier();
	        if (s1 !== peg$FAILED) {
	            peg$savedPos = s0;
	            s1 = peg$f13(s1);
	        }
	        s0 = s1;
	        return s0;
	    }
	    function peg$parseModuleExportName() {
	        var s0, s1;
	        s0 = peg$parseIdentifierName();
	        if (s0 === peg$FAILED) {
	            s0 = peg$currPos;
	            s1 = peg$parseStringLiteral();
	            if (s1 !== peg$FAILED) {
	                peg$savedPos = s0;
	                s1 = peg$f14(s1);
	            }
	            s0 = s1;
	        }
	        return s0;
	    }
	    function peg$parseBindingIdentifier() {
	        var s0, s1;
	        s0 = peg$currPos;
	        s1 = peg$parseIdentifierName();
	        if (s1 !== peg$FAILED) {
	            peg$savedPos = s0;
	            s1 = peg$f15(s1);
	        }
	        s0 = s1;
	        return s0;
	    }
	    function peg$parseTopLevelInitializer() {
	        var s0, s1, s2, s3, s4;
	        s0 = peg$currPos;
	        if (input.charCodeAt(peg$currPos) === 123) {
	            s1 = peg$c5;
	            peg$currPos++;
	        }
	        else {
	            s1 = peg$FAILED;
	            if (peg$silentFails === 0) {
	                peg$fail(peg$e6);
	            }
	        }
	        if (s1 !== peg$FAILED) {
	            s2 = peg$parseCodeBlock();
	            if (s2 !== peg$FAILED) {
	                if (input.charCodeAt(peg$currPos) === 125) {
	                    s3 = peg$c6;
	                    peg$currPos++;
	                }
	                else {
	                    s3 = peg$FAILED;
	                    if (peg$silentFails === 0) {
	                        peg$fail(peg$e7);
	                    }
	                }
	                if (s3 !== peg$FAILED) {
	                    s4 = peg$parseEOS();
	                    if (s4 !== peg$FAILED) {
	                        peg$savedPos = s0;
	                        s0 = peg$f16(s2);
	                    }
	                    else {
	                        peg$currPos = s0;
	                        s0 = peg$FAILED;
	                    }
	                }
	                else {
	                    peg$currPos = s0;
	                    s0 = peg$FAILED;
	                }
	            }
	            else {
	                peg$currPos = s0;
	                s0 = peg$FAILED;
	            }
	        }
	        else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	        }
	        return s0;
	    }
	    function peg$parseInitializer() {
	        var s0, s1, s2;
	        s0 = peg$currPos;
	        s1 = peg$parseCodeBlock();
	        if (s1 !== peg$FAILED) {
	            s2 = peg$parseEOS();
	            if (s2 !== peg$FAILED) {
	                peg$savedPos = s0;
	                s0 = peg$f17(s1);
	            }
	            else {
	                peg$currPos = s0;
	                s0 = peg$FAILED;
	            }
	        }
	        else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	        }
	        return s0;
	    }
	    function peg$parseRule() {
	        var s0, s1, s3, s4, s6, s7;
	        s0 = peg$currPos;
	        s1 = peg$parseIdentifierName();
	        if (s1 !== peg$FAILED) {
	            peg$parse__();
	            s3 = peg$currPos;
	            s4 = peg$parseStringLiteral();
	            if (s4 !== peg$FAILED) {
	                peg$parse__();
	                s3 = s4;
	            }
	            else {
	                peg$currPos = s3;
	                s3 = peg$FAILED;
	            }
	            if (s3 === peg$FAILED) {
	                s3 = null;
	            }
	            if (input.charCodeAt(peg$currPos) === 61) {
	                s4 = peg$c8;
	                peg$currPos++;
	            }
	            else {
	                s4 = peg$FAILED;
	                if (peg$silentFails === 0) {
	                    peg$fail(peg$e9);
	                }
	            }
	            if (s4 !== peg$FAILED) {
	                peg$parse__();
	                s6 = peg$parseChoiceExpression();
	                if (s6 !== peg$FAILED) {
	                    s7 = peg$parseEOS();
	                    if (s7 !== peg$FAILED) {
	                        peg$savedPos = s0;
	                        s0 = peg$f18(s1, s3, s6);
	                    }
	                    else {
	                        peg$currPos = s0;
	                        s0 = peg$FAILED;
	                    }
	                }
	                else {
	                    peg$currPos = s0;
	                    s0 = peg$FAILED;
	                }
	            }
	            else {
	                peg$currPos = s0;
	                s0 = peg$FAILED;
	            }
	        }
	        else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	        }
	        return s0;
	    }
	    function peg$parseChoiceExpression() {
	        var s0, s1, s2, s3, s5, s7;
	        s0 = peg$currPos;
	        s1 = peg$parseActionExpression();
	        if (s1 !== peg$FAILED) {
	            s2 = [];
	            s3 = peg$currPos;
	            peg$parse__();
	            if (input.charCodeAt(peg$currPos) === 47) {
	                s5 = peg$c9;
	                peg$currPos++;
	            }
	            else {
	                s5 = peg$FAILED;
	                if (peg$silentFails === 0) {
	                    peg$fail(peg$e10);
	                }
	            }
	            if (s5 !== peg$FAILED) {
	                peg$parse__();
	                s7 = peg$parseActionExpression();
	                if (s7 !== peg$FAILED) {
	                    s3 = s7;
	                }
	                else {
	                    peg$currPos = s3;
	                    s3 = peg$FAILED;
	                }
	            }
	            else {
	                peg$currPos = s3;
	                s3 = peg$FAILED;
	            }
	            while (s3 !== peg$FAILED) {
	                s2.push(s3);
	                s3 = peg$currPos;
	                peg$parse__();
	                if (input.charCodeAt(peg$currPos) === 47) {
	                    s5 = peg$c9;
	                    peg$currPos++;
	                }
	                else {
	                    s5 = peg$FAILED;
	                    if (peg$silentFails === 0) {
	                        peg$fail(peg$e10);
	                    }
	                }
	                if (s5 !== peg$FAILED) {
	                    peg$parse__();
	                    s7 = peg$parseActionExpression();
	                    if (s7 !== peg$FAILED) {
	                        s3 = s7;
	                    }
	                    else {
	                        peg$currPos = s3;
	                        s3 = peg$FAILED;
	                    }
	                }
	                else {
	                    peg$currPos = s3;
	                    s3 = peg$FAILED;
	                }
	            }
	            peg$savedPos = s0;
	            s0 = peg$f19(s1, s2);
	        }
	        else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	        }
	        return s0;
	    }
	    function peg$parseActionExpression() {
	        var s0, s1, s2, s4;
	        s0 = peg$currPos;
	        s1 = peg$parseSequenceExpression();
	        if (s1 !== peg$FAILED) {
	            s2 = peg$currPos;
	            peg$parse__();
	            s4 = peg$parseCodeBlock();
	            if (s4 !== peg$FAILED) {
	                s2 = s4;
	            }
	            else {
	                peg$currPos = s2;
	                s2 = peg$FAILED;
	            }
	            if (s2 === peg$FAILED) {
	                s2 = null;
	            }
	            peg$savedPos = s0;
	            s0 = peg$f20(s1, s2);
	        }
	        else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	        }
	        return s0;
	    }
	    function peg$parseSequenceExpression() {
	        var s0, s1, s2, s3, s5;
	        s0 = peg$currPos;
	        s1 = peg$parseLabeledExpression();
	        if (s1 !== peg$FAILED) {
	            s2 = [];
	            s3 = peg$currPos;
	            peg$parse__();
	            s5 = peg$parseLabeledExpression();
	            if (s5 !== peg$FAILED) {
	                s3 = s5;
	            }
	            else {
	                peg$currPos = s3;
	                s3 = peg$FAILED;
	            }
	            while (s3 !== peg$FAILED) {
	                s2.push(s3);
	                s3 = peg$currPos;
	                peg$parse__();
	                s5 = peg$parseLabeledExpression();
	                if (s5 !== peg$FAILED) {
	                    s3 = s5;
	                }
	                else {
	                    peg$currPos = s3;
	                    s3 = peg$FAILED;
	                }
	            }
	            peg$savedPos = s0;
	            s0 = peg$f21(s1, s2);
	        }
	        else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	        }
	        return s0;
	    }
	    function peg$parseLabeledExpression() {
	        var s0, s1, s2, s3;
	        s0 = peg$currPos;
	        s1 = peg$parsePluck();
	        if (s1 !== peg$FAILED) {
	            s2 = peg$parseLabelColon();
	            if (s2 === peg$FAILED) {
	                s2 = null;
	            }
	            s3 = peg$parsePrefixedExpression();
	            if (s3 !== peg$FAILED) {
	                peg$savedPos = s0;
	                s0 = peg$f22(s1, s2, s3);
	            }
	            else {
	                peg$currPos = s0;
	                s0 = peg$FAILED;
	            }
	        }
	        else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	        }
	        if (s0 === peg$FAILED) {
	            s0 = peg$currPos;
	            s1 = peg$parseLabelColon();
	            if (s1 !== peg$FAILED) {
	                s2 = peg$parsePrefixedExpression();
	                if (s2 !== peg$FAILED) {
	                    peg$savedPos = s0;
	                    s0 = peg$f23(s1, s2);
	                }
	                else {
	                    peg$currPos = s0;
	                    s0 = peg$FAILED;
	                }
	            }
	            else {
	                peg$currPos = s0;
	                s0 = peg$FAILED;
	            }
	            if (s0 === peg$FAILED) {
	                s0 = peg$parsePrefixedExpression();
	            }
	        }
	        return s0;
	    }
	    function peg$parsePluck() {
	        var s0, s1;
	        s0 = peg$currPos;
	        if (input.charCodeAt(peg$currPos) === 64) {
	            s1 = peg$c10;
	            peg$currPos++;
	        }
	        else {
	            s1 = peg$FAILED;
	            if (peg$silentFails === 0) {
	                peg$fail(peg$e11);
	            }
	        }
	        if (s1 !== peg$FAILED) {
	            peg$savedPos = s0;
	            s1 = peg$f24();
	        }
	        s0 = s1;
	        return s0;
	    }
	    function peg$parseLabelColon() {
	        var s0, s1, s3;
	        s0 = peg$currPos;
	        s1 = peg$parseIdentifierName();
	        if (s1 !== peg$FAILED) {
	            peg$parse__();
	            if (input.charCodeAt(peg$currPos) === 58) {
	                s3 = peg$c11;
	                peg$currPos++;
	            }
	            else {
	                s3 = peg$FAILED;
	                if (peg$silentFails === 0) {
	                    peg$fail(peg$e12);
	                }
	            }
	            if (s3 !== peg$FAILED) {
	                peg$parse__();
	                peg$savedPos = s0;
	                s0 = peg$f25(s1);
	            }
	            else {
	                peg$currPos = s0;
	                s0 = peg$FAILED;
	            }
	        }
	        else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	        }
	        return s0;
	    }
	    function peg$parsePrefixedExpression() {
	        var s0, s1, s3;
	        s0 = peg$currPos;
	        s1 = peg$parsePrefixedOperator();
	        if (s1 !== peg$FAILED) {
	            peg$parse__();
	            s3 = peg$parseSuffixedExpression();
	            if (s3 !== peg$FAILED) {
	                peg$savedPos = s0;
	                s0 = peg$f26(s1, s3);
	            }
	            else {
	                peg$currPos = s0;
	                s0 = peg$FAILED;
	            }
	        }
	        else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	        }
	        if (s0 === peg$FAILED) {
	            s0 = peg$parseSuffixedExpression();
	        }
	        return s0;
	    }
	    function peg$parsePrefixedOperator() {
	        var s0;
	        s0 = input.charAt(peg$currPos);
	        if (peg$r0.test(s0)) {
	            peg$currPos++;
	        }
	        else {
	            s0 = peg$FAILED;
	            if (peg$silentFails === 0) {
	                peg$fail(peg$e13);
	            }
	        }
	        return s0;
	    }
	    function peg$parseSuffixedExpression() {
	        var s0, s1, s3;
	        s0 = peg$currPos;
	        s1 = peg$parsePrimaryExpression();
	        if (s1 !== peg$FAILED) {
	            peg$parse__();
	            s3 = peg$parseSuffixedOperator();
	            if (s3 !== peg$FAILED) {
	                peg$savedPos = s0;
	                s0 = peg$f27(s1, s3);
	            }
	            else {
	                peg$currPos = s0;
	                s0 = peg$FAILED;
	            }
	        }
	        else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	        }
	        if (s0 === peg$FAILED) {
	            s0 = peg$parseRepeatedExpression();
	            if (s0 === peg$FAILED) {
	                s0 = peg$parsePrimaryExpression();
	            }
	        }
	        return s0;
	    }
	    function peg$parseSuffixedOperator() {
	        var s0;
	        s0 = input.charAt(peg$currPos);
	        if (peg$r1.test(s0)) {
	            peg$currPos++;
	        }
	        else {
	            s0 = peg$FAILED;
	            if (peg$silentFails === 0) {
	                peg$fail(peg$e14);
	            }
	        }
	        return s0;
	    }
	    function peg$parseRepeatedExpression() {
	        var s0, s1, s3, s5, s7, s8, s10;
	        s0 = peg$currPos;
	        s1 = peg$parsePrimaryExpression();
	        if (s1 !== peg$FAILED) {
	            peg$parse__();
	            if (input.charCodeAt(peg$currPos) === 124) {
	                s3 = peg$c12;
	                peg$currPos++;
	            }
	            else {
	                s3 = peg$FAILED;
	                if (peg$silentFails === 0) {
	                    peg$fail(peg$e15);
	                }
	            }
	            if (s3 !== peg$FAILED) {
	                peg$parse__();
	                s5 = peg$parseBoundaries();
	                if (s5 !== peg$FAILED) {
	                    peg$parse__();
	                    s7 = peg$currPos;
	                    if (input.charCodeAt(peg$currPos) === 44) {
	                        s8 = peg$c2;
	                        peg$currPos++;
	                    }
	                    else {
	                        s8 = peg$FAILED;
	                        if (peg$silentFails === 0) {
	                            peg$fail(peg$e3);
	                        }
	                    }
	                    if (s8 !== peg$FAILED) {
	                        peg$parse__();
	                        s10 = peg$parseChoiceExpression();
	                        if (s10 !== peg$FAILED) {
	                            peg$parse__();
	                            s7 = s10;
	                        }
	                        else {
	                            peg$currPos = s7;
	                            s7 = peg$FAILED;
	                        }
	                    }
	                    else {
	                        peg$currPos = s7;
	                        s7 = peg$FAILED;
	                    }
	                    if (s7 === peg$FAILED) {
	                        s7 = null;
	                    }
	                    if (input.charCodeAt(peg$currPos) === 124) {
	                        s8 = peg$c12;
	                        peg$currPos++;
	                    }
	                    else {
	                        s8 = peg$FAILED;
	                        if (peg$silentFails === 0) {
	                            peg$fail(peg$e15);
	                        }
	                    }
	                    if (s8 !== peg$FAILED) {
	                        peg$savedPos = s0;
	                        s0 = peg$f28(s1, s5, s7);
	                    }
	                    else {
	                        peg$currPos = s0;
	                        s0 = peg$FAILED;
	                    }
	                }
	                else {
	                    peg$currPos = s0;
	                    s0 = peg$FAILED;
	                }
	            }
	            else {
	                peg$currPos = s0;
	                s0 = peg$FAILED;
	            }
	        }
	        else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	        }
	        return s0;
	    }
	    function peg$parseBoundaries() {
	        var s0, s1, s3, s5;
	        s0 = peg$currPos;
	        s1 = peg$parseBoundary();
	        if (s1 === peg$FAILED) {
	            s1 = null;
	        }
	        peg$parse__();
	        if (input.substr(peg$currPos, 2) === peg$c13) {
	            s3 = peg$c13;
	            peg$currPos += 2;
	        }
	        else {
	            s3 = peg$FAILED;
	            if (peg$silentFails === 0) {
	                peg$fail(peg$e16);
	            }
	        }
	        if (s3 !== peg$FAILED) {
	            peg$parse__();
	            s5 = peg$parseBoundary();
	            if (s5 === peg$FAILED) {
	                s5 = null;
	            }
	            peg$savedPos = s0;
	            s0 = peg$f29(s1, s5);
	        }
	        else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	        }
	        if (s0 === peg$FAILED) {
	            s0 = peg$currPos;
	            s1 = peg$parseBoundary();
	            if (s1 !== peg$FAILED) {
	                peg$savedPos = s0;
	                s1 = peg$f30(s1);
	            }
	            s0 = s1;
	        }
	        return s0;
	    }
	    function peg$parseBoundary() {
	        var s0, s1;
	        s0 = peg$currPos;
	        s1 = peg$parseInteger();
	        if (s1 !== peg$FAILED) {
	            peg$savedPos = s0;
	            s1 = peg$f31(s1);
	        }
	        s0 = s1;
	        if (s0 === peg$FAILED) {
	            s0 = peg$currPos;
	            s1 = peg$parseIdentifierName();
	            if (s1 !== peg$FAILED) {
	                peg$savedPos = s0;
	                s1 = peg$f32(s1);
	            }
	            s0 = s1;
	            if (s0 === peg$FAILED) {
	                s0 = peg$currPos;
	                s1 = peg$parseCodeBlock();
	                if (s1 !== peg$FAILED) {
	                    peg$savedPos = s0;
	                    s1 = peg$f33(s1);
	                }
	                s0 = s1;
	            }
	        }
	        return s0;
	    }
	    function peg$parsePrimaryExpression() {
	        var s0, s1, s3, s5;
	        s0 = peg$parseLiteralMatcher();
	        if (s0 === peg$FAILED) {
	            s0 = peg$parseCharacterClassMatcher();
	            if (s0 === peg$FAILED) {
	                s0 = peg$parseAnyMatcher();
	                if (s0 === peg$FAILED) {
	                    s0 = peg$parseRuleReferenceExpression();
	                    if (s0 === peg$FAILED) {
	                        s0 = peg$parseSemanticPredicateExpression();
	                        if (s0 === peg$FAILED) {
	                            s0 = peg$currPos;
	                            if (input.charCodeAt(peg$currPos) === 40) {
	                                s1 = peg$c14;
	                                peg$currPos++;
	                            }
	                            else {
	                                s1 = peg$FAILED;
	                                if (peg$silentFails === 0) {
	                                    peg$fail(peg$e17);
	                                }
	                            }
	                            if (s1 !== peg$FAILED) {
	                                peg$parse__();
	                                s3 = peg$parseChoiceExpression();
	                                if (s3 !== peg$FAILED) {
	                                    peg$parse__();
	                                    if (input.charCodeAt(peg$currPos) === 41) {
	                                        s5 = peg$c15;
	                                        peg$currPos++;
	                                    }
	                                    else {
	                                        s5 = peg$FAILED;
	                                        if (peg$silentFails === 0) {
	                                            peg$fail(peg$e18);
	                                        }
	                                    }
	                                    if (s5 !== peg$FAILED) {
	                                        peg$savedPos = s0;
	                                        s0 = peg$f34(s3);
	                                    }
	                                    else {
	                                        peg$currPos = s0;
	                                        s0 = peg$FAILED;
	                                    }
	                                }
	                                else {
	                                    peg$currPos = s0;
	                                    s0 = peg$FAILED;
	                                }
	                            }
	                            else {
	                                peg$currPos = s0;
	                                s0 = peg$FAILED;
	                            }
	                        }
	                    }
	                }
	            }
	        }
	        return s0;
	    }
	    function peg$parseRuleReferenceExpression() {
	        var s0, s1, s2, s3, s4, s5, s6, s7;
	        s0 = peg$currPos;
	        s1 = peg$parseIdentifierName();
	        if (s1 !== peg$FAILED) {
	            if (input.charCodeAt(peg$currPos) === 46) {
	                s2 = peg$c16;
	                peg$currPos++;
	            }
	            else {
	                s2 = peg$FAILED;
	                if (peg$silentFails === 0) {
	                    peg$fail(peg$e19);
	                }
	            }
	            if (s2 !== peg$FAILED) {
	                s3 = peg$parseIdentifierName();
	                if (s3 !== peg$FAILED) {
	                    peg$savedPos = s0;
	                    s0 = peg$f35(s1, s3);
	                }
	                else {
	                    peg$currPos = s0;
	                    s0 = peg$FAILED;
	                }
	            }
	            else {
	                peg$currPos = s0;
	                s0 = peg$FAILED;
	            }
	        }
	        else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	        }
	        if (s0 === peg$FAILED) {
	            s0 = peg$currPos;
	            s1 = peg$parseIdentifierName();
	            if (s1 !== peg$FAILED) {
	                s2 = peg$currPos;
	                peg$silentFails++;
	                s3 = peg$currPos;
	                s4 = peg$parse__();
	                s5 = peg$currPos;
	                s6 = peg$parseStringLiteral();
	                if (s6 !== peg$FAILED) {
	                    s7 = peg$parse__();
	                    s6 = [s6, s7];
	                    s5 = s6;
	                }
	                else {
	                    peg$currPos = s5;
	                    s5 = peg$FAILED;
	                }
	                if (s5 === peg$FAILED) {
	                    s5 = null;
	                }
	                if (input.charCodeAt(peg$currPos) === 61) {
	                    s6 = peg$c8;
	                    peg$currPos++;
	                }
	                else {
	                    s6 = peg$FAILED;
	                    if (peg$silentFails === 0) {
	                        peg$fail(peg$e9);
	                    }
	                }
	                if (s6 !== peg$FAILED) {
	                    s4 = [s4, s5, s6];
	                    s3 = s4;
	                }
	                else {
	                    peg$currPos = s3;
	                    s3 = peg$FAILED;
	                }
	                peg$silentFails--;
	                if (s3 === peg$FAILED) {
	                    s2 = undefined;
	                }
	                else {
	                    peg$currPos = s2;
	                    s2 = peg$FAILED;
	                }
	                if (s2 !== peg$FAILED) {
	                    peg$savedPos = s0;
	                    s0 = peg$f36(s1);
	                }
	                else {
	                    peg$currPos = s0;
	                    s0 = peg$FAILED;
	                }
	            }
	            else {
	                peg$currPos = s0;
	                s0 = peg$FAILED;
	            }
	        }
	        return s0;
	    }
	    function peg$parseSemanticPredicateExpression() {
	        var s0, s1, s3;
	        s0 = peg$currPos;
	        s1 = peg$parseSemanticPredicateOperator();
	        if (s1 !== peg$FAILED) {
	            peg$parse__();
	            s3 = peg$parseCodeBlock();
	            if (s3 !== peg$FAILED) {
	                peg$savedPos = s0;
	                s0 = peg$f37(s1, s3);
	            }
	            else {
	                peg$currPos = s0;
	                s0 = peg$FAILED;
	            }
	        }
	        else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	        }
	        return s0;
	    }
	    function peg$parseSemanticPredicateOperator() {
	        var s0;
	        s0 = input.charAt(peg$currPos);
	        if (peg$r2.test(s0)) {
	            peg$currPos++;
	        }
	        else {
	            s0 = peg$FAILED;
	            if (peg$silentFails === 0) {
	                peg$fail(peg$e20);
	            }
	        }
	        return s0;
	    }
	    function peg$parseSourceCharacter() {
	        var s0;
	        if (input.length > peg$currPos) {
	            s0 = input.charAt(peg$currPos);
	            peg$currPos++;
	        }
	        else {
	            s0 = peg$FAILED;
	            if (peg$silentFails === 0) {
	                peg$fail(peg$e0);
	            }
	        }
	        return s0;
	    }
	    function peg$parseWhiteSpace() {
	        var s0;
	        peg$silentFails++;
	        s0 = input.charAt(peg$currPos);
	        if (peg$r3.test(s0)) {
	            peg$currPos++;
	        }
	        else {
	            s0 = peg$FAILED;
	            if (peg$silentFails === 0) {
	                peg$fail(peg$e22);
	            }
	        }
	        peg$silentFails--;
	        if (s0 === peg$FAILED) {
	            if (peg$silentFails === 0) {
	                peg$fail(peg$e21);
	            }
	        }
	        return s0;
	    }
	    function peg$parseLineTerminator() {
	        var s0;
	        s0 = input.charAt(peg$currPos);
	        if (peg$r4.test(s0)) {
	            peg$currPos++;
	        }
	        else {
	            s0 = peg$FAILED;
	            if (peg$silentFails === 0) {
	                peg$fail(peg$e23);
	            }
	        }
	        return s0;
	    }
	    function peg$parseLineTerminatorSequence() {
	        var s0;
	        peg$silentFails++;
	        if (input.charCodeAt(peg$currPos) === 10) {
	            s0 = peg$c17;
	            peg$currPos++;
	        }
	        else {
	            s0 = peg$FAILED;
	            if (peg$silentFails === 0) {
	                peg$fail(peg$e25);
	            }
	        }
	        if (s0 === peg$FAILED) {
	            if (input.substr(peg$currPos, 2) === peg$c18) {
	                s0 = peg$c18;
	                peg$currPos += 2;
	            }
	            else {
	                s0 = peg$FAILED;
	                if (peg$silentFails === 0) {
	                    peg$fail(peg$e26);
	                }
	            }
	            if (s0 === peg$FAILED) {
	                s0 = input.charAt(peg$currPos);
	                if (peg$r5.test(s0)) {
	                    peg$currPos++;
	                }
	                else {
	                    s0 = peg$FAILED;
	                    if (peg$silentFails === 0) {
	                        peg$fail(peg$e27);
	                    }
	                }
	            }
	        }
	        peg$silentFails--;
	        if (s0 === peg$FAILED) {
	            if (peg$silentFails === 0) {
	                peg$fail(peg$e24);
	            }
	        }
	        return s0;
	    }
	    function peg$parseComment() {
	        var s0;
	        peg$silentFails++;
	        s0 = peg$parseMultiLineComment();
	        if (s0 === peg$FAILED) {
	            s0 = peg$parseSingleLineComment();
	        }
	        peg$silentFails--;
	        if (s0 === peg$FAILED) {
	            if (peg$silentFails === 0) {
	                peg$fail(peg$e28);
	            }
	        }
	        return s0;
	    }
	    function peg$parseMultiLineComment() {
	        var s0, s1, s2, s3, s4, s5;
	        s0 = peg$currPos;
	        if (input.substr(peg$currPos, 2) === peg$c19) {
	            s1 = peg$c19;
	            peg$currPos += 2;
	        }
	        else {
	            s1 = peg$FAILED;
	            if (peg$silentFails === 0) {
	                peg$fail(peg$e29);
	            }
	        }
	        if (s1 !== peg$FAILED) {
	            s2 = [];
	            s3 = peg$currPos;
	            s4 = peg$currPos;
	            peg$silentFails++;
	            if (input.substr(peg$currPos, 2) === peg$c20) {
	                s5 = peg$c20;
	                peg$currPos += 2;
	            }
	            else {
	                s5 = peg$FAILED;
	                if (peg$silentFails === 0) {
	                    peg$fail(peg$e30);
	                }
	            }
	            peg$silentFails--;
	            if (s5 === peg$FAILED) {
	                s4 = undefined;
	            }
	            else {
	                peg$currPos = s4;
	                s4 = peg$FAILED;
	            }
	            if (s4 !== peg$FAILED) {
	                s5 = peg$parseSourceCharacter();
	                if (s5 !== peg$FAILED) {
	                    s4 = [s4, s5];
	                    s3 = s4;
	                }
	                else {
	                    peg$currPos = s3;
	                    s3 = peg$FAILED;
	                }
	            }
	            else {
	                peg$currPos = s3;
	                s3 = peg$FAILED;
	            }
	            while (s3 !== peg$FAILED) {
	                s2.push(s3);
	                s3 = peg$currPos;
	                s4 = peg$currPos;
	                peg$silentFails++;
	                if (input.substr(peg$currPos, 2) === peg$c20) {
	                    s5 = peg$c20;
	                    peg$currPos += 2;
	                }
	                else {
	                    s5 = peg$FAILED;
	                    if (peg$silentFails === 0) {
	                        peg$fail(peg$e30);
	                    }
	                }
	                peg$silentFails--;
	                if (s5 === peg$FAILED) {
	                    s4 = undefined;
	                }
	                else {
	                    peg$currPos = s4;
	                    s4 = peg$FAILED;
	                }
	                if (s4 !== peg$FAILED) {
	                    s5 = peg$parseSourceCharacter();
	                    if (s5 !== peg$FAILED) {
	                        s4 = [s4, s5];
	                        s3 = s4;
	                    }
	                    else {
	                        peg$currPos = s3;
	                        s3 = peg$FAILED;
	                    }
	                }
	                else {
	                    peg$currPos = s3;
	                    s3 = peg$FAILED;
	                }
	            }
	            if (input.substr(peg$currPos, 2) === peg$c20) {
	                s3 = peg$c20;
	                peg$currPos += 2;
	            }
	            else {
	                s3 = peg$FAILED;
	                if (peg$silentFails === 0) {
	                    peg$fail(peg$e30);
	                }
	            }
	            if (s3 !== peg$FAILED) {
	                s1 = [s1, s2, s3];
	                s0 = s1;
	            }
	            else {
	                peg$currPos = s0;
	                s0 = peg$FAILED;
	            }
	        }
	        else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	        }
	        return s0;
	    }
	    function peg$parseMultiLineCommentNoLineTerminator() {
	        var s0, s1, s2, s3, s4, s5;
	        s0 = peg$currPos;
	        if (input.substr(peg$currPos, 2) === peg$c19) {
	            s1 = peg$c19;
	            peg$currPos += 2;
	        }
	        else {
	            s1 = peg$FAILED;
	            if (peg$silentFails === 0) {
	                peg$fail(peg$e29);
	            }
	        }
	        if (s1 !== peg$FAILED) {
	            s2 = [];
	            s3 = peg$currPos;
	            s4 = peg$currPos;
	            peg$silentFails++;
	            if (input.substr(peg$currPos, 2) === peg$c20) {
	                s5 = peg$c20;
	                peg$currPos += 2;
	            }
	            else {
	                s5 = peg$FAILED;
	                if (peg$silentFails === 0) {
	                    peg$fail(peg$e30);
	                }
	            }
	            if (s5 === peg$FAILED) {
	                s5 = peg$parseLineTerminator();
	            }
	            peg$silentFails--;
	            if (s5 === peg$FAILED) {
	                s4 = undefined;
	            }
	            else {
	                peg$currPos = s4;
	                s4 = peg$FAILED;
	            }
	            if (s4 !== peg$FAILED) {
	                s5 = peg$parseSourceCharacter();
	                if (s5 !== peg$FAILED) {
	                    s4 = [s4, s5];
	                    s3 = s4;
	                }
	                else {
	                    peg$currPos = s3;
	                    s3 = peg$FAILED;
	                }
	            }
	            else {
	                peg$currPos = s3;
	                s3 = peg$FAILED;
	            }
	            while (s3 !== peg$FAILED) {
	                s2.push(s3);
	                s3 = peg$currPos;
	                s4 = peg$currPos;
	                peg$silentFails++;
	                if (input.substr(peg$currPos, 2) === peg$c20) {
	                    s5 = peg$c20;
	                    peg$currPos += 2;
	                }
	                else {
	                    s5 = peg$FAILED;
	                    if (peg$silentFails === 0) {
	                        peg$fail(peg$e30);
	                    }
	                }
	                if (s5 === peg$FAILED) {
	                    s5 = peg$parseLineTerminator();
	                }
	                peg$silentFails--;
	                if (s5 === peg$FAILED) {
	                    s4 = undefined;
	                }
	                else {
	                    peg$currPos = s4;
	                    s4 = peg$FAILED;
	                }
	                if (s4 !== peg$FAILED) {
	                    s5 = peg$parseSourceCharacter();
	                    if (s5 !== peg$FAILED) {
	                        s4 = [s4, s5];
	                        s3 = s4;
	                    }
	                    else {
	                        peg$currPos = s3;
	                        s3 = peg$FAILED;
	                    }
	                }
	                else {
	                    peg$currPos = s3;
	                    s3 = peg$FAILED;
	                }
	            }
	            if (input.substr(peg$currPos, 2) === peg$c20) {
	                s3 = peg$c20;
	                peg$currPos += 2;
	            }
	            else {
	                s3 = peg$FAILED;
	                if (peg$silentFails === 0) {
	                    peg$fail(peg$e30);
	                }
	            }
	            if (s3 !== peg$FAILED) {
	                s1 = [s1, s2, s3];
	                s0 = s1;
	            }
	            else {
	                peg$currPos = s0;
	                s0 = peg$FAILED;
	            }
	        }
	        else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	        }
	        return s0;
	    }
	    function peg$parseSingleLineComment() {
	        var s0, s1, s2, s3, s4, s5;
	        s0 = peg$currPos;
	        if (input.substr(peg$currPos, 2) === peg$c21) {
	            s1 = peg$c21;
	            peg$currPos += 2;
	        }
	        else {
	            s1 = peg$FAILED;
	            if (peg$silentFails === 0) {
	                peg$fail(peg$e31);
	            }
	        }
	        if (s1 !== peg$FAILED) {
	            s2 = [];
	            s3 = peg$currPos;
	            s4 = peg$currPos;
	            peg$silentFails++;
	            s5 = peg$parseLineTerminator();
	            peg$silentFails--;
	            if (s5 === peg$FAILED) {
	                s4 = undefined;
	            }
	            else {
	                peg$currPos = s4;
	                s4 = peg$FAILED;
	            }
	            if (s4 !== peg$FAILED) {
	                s5 = peg$parseSourceCharacter();
	                if (s5 !== peg$FAILED) {
	                    s4 = [s4, s5];
	                    s3 = s4;
	                }
	                else {
	                    peg$currPos = s3;
	                    s3 = peg$FAILED;
	                }
	            }
	            else {
	                peg$currPos = s3;
	                s3 = peg$FAILED;
	            }
	            while (s3 !== peg$FAILED) {
	                s2.push(s3);
	                s3 = peg$currPos;
	                s4 = peg$currPos;
	                peg$silentFails++;
	                s5 = peg$parseLineTerminator();
	                peg$silentFails--;
	                if (s5 === peg$FAILED) {
	                    s4 = undefined;
	                }
	                else {
	                    peg$currPos = s4;
	                    s4 = peg$FAILED;
	                }
	                if (s4 !== peg$FAILED) {
	                    s5 = peg$parseSourceCharacter();
	                    if (s5 !== peg$FAILED) {
	                        s4 = [s4, s5];
	                        s3 = s4;
	                    }
	                    else {
	                        peg$currPos = s3;
	                        s3 = peg$FAILED;
	                    }
	                }
	                else {
	                    peg$currPos = s3;
	                    s3 = peg$FAILED;
	                }
	            }
	            s1 = [s1, s2];
	            s0 = s1;
	        }
	        else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	        }
	        return s0;
	    }
	    function peg$parseIdentifierName() {
	        var s0, s1, s2, s3;
	        peg$silentFails++;
	        s0 = peg$currPos;
	        s1 = peg$parseIdentifierStart();
	        if (s1 !== peg$FAILED) {
	            s2 = [];
	            s3 = peg$parseIdentifierPart();
	            while (s3 !== peg$FAILED) {
	                s2.push(s3);
	                s3 = peg$parseIdentifierPart();
	            }
	            peg$savedPos = s0;
	            s0 = peg$f38(s1, s2);
	        }
	        else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	        }
	        peg$silentFails--;
	        if (s0 === peg$FAILED) {
	            s1 = peg$FAILED;
	            if (peg$silentFails === 0) {
	                peg$fail(peg$e32);
	            }
	        }
	        return s0;
	    }
	    function peg$parseIdentifierStart() {
	        var s0, s1, s2;
	        s0 = input.charAt(peg$currPos);
	        if (peg$r6.test(s0)) {
	            peg$currPos++;
	        }
	        else {
	            s0 = peg$FAILED;
	            if (peg$silentFails === 0) {
	                peg$fail(peg$e33);
	            }
	        }
	        if (s0 === peg$FAILED) {
	            s0 = peg$currPos;
	            if (input.charCodeAt(peg$currPos) === 92) {
	                s1 = peg$c22;
	                peg$currPos++;
	            }
	            else {
	                s1 = peg$FAILED;
	                if (peg$silentFails === 0) {
	                    peg$fail(peg$e34);
	                }
	            }
	            if (s1 !== peg$FAILED) {
	                s2 = peg$parseUnicodeEscapeSequence();
	                if (s2 !== peg$FAILED) {
	                    s0 = s2;
	                }
	                else {
	                    peg$currPos = s0;
	                    s0 = peg$FAILED;
	                }
	            }
	            else {
	                peg$currPos = s0;
	                s0 = peg$FAILED;
	            }
	        }
	        return s0;
	    }
	    function peg$parseIdentifierPart() {
	        var s0;
	        s0 = peg$parseIdentifierStart();
	        if (s0 === peg$FAILED) {
	            s0 = input.charAt(peg$currPos);
	            if (peg$r7.test(s0)) {
	                peg$currPos++;
	            }
	            else {
	                s0 = peg$FAILED;
	                if (peg$silentFails === 0) {
	                    peg$fail(peg$e35);
	                }
	            }
	        }
	        return s0;
	    }
	    function peg$parseLiteralMatcher() {
	        var s0, s1, s2;
	        peg$silentFails++;
	        s0 = peg$currPos;
	        s1 = peg$parseStringLiteral();
	        if (s1 !== peg$FAILED) {
	            if (input.charCodeAt(peg$currPos) === 105) {
	                s2 = peg$c23;
	                peg$currPos++;
	            }
	            else {
	                s2 = peg$FAILED;
	                if (peg$silentFails === 0) {
	                    peg$fail(peg$e39);
	                }
	            }
	            if (s2 === peg$FAILED) {
	                s2 = null;
	            }
	            peg$savedPos = s0;
	            s0 = peg$f39(s1, s2);
	        }
	        else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	        }
	        peg$silentFails--;
	        if (s0 === peg$FAILED) {
	            s1 = peg$FAILED;
	            if (peg$silentFails === 0) {
	                peg$fail(peg$e38);
	            }
	        }
	        return s0;
	    }
	    function peg$parseStringLiteral() {
	        var s0, s1, s2, s3;
	        peg$silentFails++;
	        s0 = peg$currPos;
	        if (input.charCodeAt(peg$currPos) === 34) {
	            s1 = peg$c24;
	            peg$currPos++;
	        }
	        else {
	            s1 = peg$FAILED;
	            if (peg$silentFails === 0) {
	                peg$fail(peg$e41);
	            }
	        }
	        if (s1 !== peg$FAILED) {
	            s2 = [];
	            s3 = peg$parseDoubleStringCharacter();
	            while (s3 !== peg$FAILED) {
	                s2.push(s3);
	                s3 = peg$parseDoubleStringCharacter();
	            }
	            if (input.charCodeAt(peg$currPos) === 34) {
	                s3 = peg$c24;
	                peg$currPos++;
	            }
	            else {
	                s3 = peg$FAILED;
	                if (peg$silentFails === 0) {
	                    peg$fail(peg$e41);
	                }
	            }
	            if (s3 !== peg$FAILED) {
	                peg$savedPos = s0;
	                s0 = peg$f40(s2);
	            }
	            else {
	                peg$currPos = s0;
	                s0 = peg$FAILED;
	            }
	        }
	        else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	        }
	        if (s0 === peg$FAILED) {
	            s0 = peg$currPos;
	            if (input.charCodeAt(peg$currPos) === 39) {
	                s1 = peg$c25;
	                peg$currPos++;
	            }
	            else {
	                s1 = peg$FAILED;
	                if (peg$silentFails === 0) {
	                    peg$fail(peg$e42);
	                }
	            }
	            if (s1 !== peg$FAILED) {
	                s2 = [];
	                s3 = peg$parseSingleStringCharacter();
	                while (s3 !== peg$FAILED) {
	                    s2.push(s3);
	                    s3 = peg$parseSingleStringCharacter();
	                }
	                if (input.charCodeAt(peg$currPos) === 39) {
	                    s3 = peg$c25;
	                    peg$currPos++;
	                }
	                else {
	                    s3 = peg$FAILED;
	                    if (peg$silentFails === 0) {
	                        peg$fail(peg$e42);
	                    }
	                }
	                if (s3 !== peg$FAILED) {
	                    peg$savedPos = s0;
	                    s0 = peg$f41(s2);
	                }
	                else {
	                    peg$currPos = s0;
	                    s0 = peg$FAILED;
	                }
	            }
	            else {
	                peg$currPos = s0;
	                s0 = peg$FAILED;
	            }
	        }
	        peg$silentFails--;
	        if (s0 === peg$FAILED) {
	            s1 = peg$FAILED;
	            if (peg$silentFails === 0) {
	                peg$fail(peg$e40);
	            }
	        }
	        return s0;
	    }
	    function peg$parseDoubleStringCharacter() {
	        var s0, s1, s2, s3;
	        s0 = peg$currPos;
	        s1 = peg$currPos;
	        s2 = peg$currPos;
	        peg$silentFails++;
	        s3 = input.charAt(peg$currPos);
	        if (peg$r10.test(s3)) {
	            peg$currPos++;
	        }
	        else {
	            s3 = peg$FAILED;
	            if (peg$silentFails === 0) {
	                peg$fail(peg$e43);
	            }
	        }
	        peg$silentFails--;
	        if (s3 === peg$FAILED) {
	            s2 = undefined;
	        }
	        else {
	            peg$currPos = s2;
	            s2 = peg$FAILED;
	        }
	        if (s2 !== peg$FAILED) {
	            s3 = peg$parseSourceCharacter();
	            if (s3 !== peg$FAILED) {
	                s2 = [s2, s3];
	                s1 = s2;
	            }
	            else {
	                peg$currPos = s1;
	                s1 = peg$FAILED;
	            }
	        }
	        else {
	            peg$currPos = s1;
	            s1 = peg$FAILED;
	        }
	        if (s1 !== peg$FAILED) {
	            s0 = input.substring(s0, peg$currPos);
	        }
	        else {
	            s0 = s1;
	        }
	        if (s0 === peg$FAILED) {
	            s0 = peg$currPos;
	            if (input.charCodeAt(peg$currPos) === 92) {
	                s1 = peg$c22;
	                peg$currPos++;
	            }
	            else {
	                s1 = peg$FAILED;
	                if (peg$silentFails === 0) {
	                    peg$fail(peg$e34);
	                }
	            }
	            if (s1 !== peg$FAILED) {
	                s2 = peg$parseEscapeSequence();
	                if (s2 !== peg$FAILED) {
	                    s0 = s2;
	                }
	                else {
	                    peg$currPos = s0;
	                    s0 = peg$FAILED;
	                }
	            }
	            else {
	                peg$currPos = s0;
	                s0 = peg$FAILED;
	            }
	            if (s0 === peg$FAILED) {
	                s0 = peg$parseLineContinuation();
	            }
	        }
	        return s0;
	    }
	    function peg$parseSingleStringCharacter() {
	        var s0, s1, s2, s3;
	        s0 = peg$currPos;
	        s1 = peg$currPos;
	        s2 = peg$currPos;
	        peg$silentFails++;
	        s3 = input.charAt(peg$currPos);
	        if (peg$r11.test(s3)) {
	            peg$currPos++;
	        }
	        else {
	            s3 = peg$FAILED;
	            if (peg$silentFails === 0) {
	                peg$fail(peg$e44);
	            }
	        }
	        peg$silentFails--;
	        if (s3 === peg$FAILED) {
	            s2 = undefined;
	        }
	        else {
	            peg$currPos = s2;
	            s2 = peg$FAILED;
	        }
	        if (s2 !== peg$FAILED) {
	            s3 = peg$parseSourceCharacter();
	            if (s3 !== peg$FAILED) {
	                s2 = [s2, s3];
	                s1 = s2;
	            }
	            else {
	                peg$currPos = s1;
	                s1 = peg$FAILED;
	            }
	        }
	        else {
	            peg$currPos = s1;
	            s1 = peg$FAILED;
	        }
	        if (s1 !== peg$FAILED) {
	            s0 = input.substring(s0, peg$currPos);
	        }
	        else {
	            s0 = s1;
	        }
	        if (s0 === peg$FAILED) {
	            s0 = peg$currPos;
	            if (input.charCodeAt(peg$currPos) === 92) {
	                s1 = peg$c22;
	                peg$currPos++;
	            }
	            else {
	                s1 = peg$FAILED;
	                if (peg$silentFails === 0) {
	                    peg$fail(peg$e34);
	                }
	            }
	            if (s1 !== peg$FAILED) {
	                s2 = peg$parseEscapeSequence();
	                if (s2 !== peg$FAILED) {
	                    s0 = s2;
	                }
	                else {
	                    peg$currPos = s0;
	                    s0 = peg$FAILED;
	                }
	            }
	            else {
	                peg$currPos = s0;
	                s0 = peg$FAILED;
	            }
	            if (s0 === peg$FAILED) {
	                s0 = peg$parseLineContinuation();
	            }
	        }
	        return s0;
	    }
	    function peg$parseCharacterClassMatcher() {
	        var s0, s1, s2, s3, s4, s5;
	        peg$silentFails++;
	        s0 = peg$currPos;
	        if (input.charCodeAt(peg$currPos) === 91) {
	            s1 = peg$c26;
	            peg$currPos++;
	        }
	        else {
	            s1 = peg$FAILED;
	            if (peg$silentFails === 0) {
	                peg$fail(peg$e46);
	            }
	        }
	        if (s1 !== peg$FAILED) {
	            if (input.charCodeAt(peg$currPos) === 94) {
	                s2 = peg$c27;
	                peg$currPos++;
	            }
	            else {
	                s2 = peg$FAILED;
	                if (peg$silentFails === 0) {
	                    peg$fail(peg$e47);
	                }
	            }
	            if (s2 === peg$FAILED) {
	                s2 = null;
	            }
	            s3 = [];
	            s4 = peg$parseClassCharacterRange();
	            if (s4 === peg$FAILED) {
	                s4 = peg$parseClassCharacter();
	            }
	            while (s4 !== peg$FAILED) {
	                s3.push(s4);
	                s4 = peg$parseClassCharacterRange();
	                if (s4 === peg$FAILED) {
	                    s4 = peg$parseClassCharacter();
	                }
	            }
	            if (input.charCodeAt(peg$currPos) === 93) {
	                s4 = peg$c28;
	                peg$currPos++;
	            }
	            else {
	                s4 = peg$FAILED;
	                if (peg$silentFails === 0) {
	                    peg$fail(peg$e48);
	                }
	            }
	            if (s4 !== peg$FAILED) {
	                if (input.charCodeAt(peg$currPos) === 105) {
	                    s5 = peg$c23;
	                    peg$currPos++;
	                }
	                else {
	                    s5 = peg$FAILED;
	                    if (peg$silentFails === 0) {
	                        peg$fail(peg$e39);
	                    }
	                }
	                if (s5 === peg$FAILED) {
	                    s5 = null;
	                }
	                peg$savedPos = s0;
	                s0 = peg$f42(s2, s3, s5);
	            }
	            else {
	                peg$currPos = s0;
	                s0 = peg$FAILED;
	            }
	        }
	        else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	        }
	        peg$silentFails--;
	        if (s0 === peg$FAILED) {
	            s1 = peg$FAILED;
	            if (peg$silentFails === 0) {
	                peg$fail(peg$e45);
	            }
	        }
	        return s0;
	    }
	    function peg$parseClassCharacterRange() {
	        var s0, s1, s2, s3;
	        s0 = peg$currPos;
	        s1 = peg$parseClassCharacter();
	        if (s1 !== peg$FAILED) {
	            if (input.charCodeAt(peg$currPos) === 45) {
	                s2 = peg$c29;
	                peg$currPos++;
	            }
	            else {
	                s2 = peg$FAILED;
	                if (peg$silentFails === 0) {
	                    peg$fail(peg$e49);
	                }
	            }
	            if (s2 !== peg$FAILED) {
	                s3 = peg$parseClassCharacter();
	                if (s3 !== peg$FAILED) {
	                    peg$savedPos = s0;
	                    s0 = peg$f43(s1, s3);
	                }
	                else {
	                    peg$currPos = s0;
	                    s0 = peg$FAILED;
	                }
	            }
	            else {
	                peg$currPos = s0;
	                s0 = peg$FAILED;
	            }
	        }
	        else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	        }
	        return s0;
	    }
	    function peg$parseClassCharacter() {
	        var s0, s1, s2, s3;
	        s0 = peg$currPos;
	        s1 = peg$currPos;
	        s2 = peg$currPos;
	        peg$silentFails++;
	        s3 = input.charAt(peg$currPos);
	        if (peg$r12.test(s3)) {
	            peg$currPos++;
	        }
	        else {
	            s3 = peg$FAILED;
	            if (peg$silentFails === 0) {
	                peg$fail(peg$e50);
	            }
	        }
	        peg$silentFails--;
	        if (s3 === peg$FAILED) {
	            s2 = undefined;
	        }
	        else {
	            peg$currPos = s2;
	            s2 = peg$FAILED;
	        }
	        if (s2 !== peg$FAILED) {
	            s3 = peg$parseSourceCharacter();
	            if (s3 !== peg$FAILED) {
	                s2 = [s2, s3];
	                s1 = s2;
	            }
	            else {
	                peg$currPos = s1;
	                s1 = peg$FAILED;
	            }
	        }
	        else {
	            peg$currPos = s1;
	            s1 = peg$FAILED;
	        }
	        if (s1 !== peg$FAILED) {
	            s0 = input.substring(s0, peg$currPos);
	        }
	        else {
	            s0 = s1;
	        }
	        if (s0 === peg$FAILED) {
	            s0 = peg$currPos;
	            if (input.charCodeAt(peg$currPos) === 92) {
	                s1 = peg$c22;
	                peg$currPos++;
	            }
	            else {
	                s1 = peg$FAILED;
	                if (peg$silentFails === 0) {
	                    peg$fail(peg$e34);
	                }
	            }
	            if (s1 !== peg$FAILED) {
	                s2 = peg$parseEscapeSequence();
	                if (s2 !== peg$FAILED) {
	                    s0 = s2;
	                }
	                else {
	                    peg$currPos = s0;
	                    s0 = peg$FAILED;
	                }
	            }
	            else {
	                peg$currPos = s0;
	                s0 = peg$FAILED;
	            }
	            if (s0 === peg$FAILED) {
	                s0 = peg$parseLineContinuation();
	            }
	        }
	        return s0;
	    }
	    function peg$parseLineContinuation() {
	        var s0, s1, s2;
	        s0 = peg$currPos;
	        if (input.charCodeAt(peg$currPos) === 92) {
	            s1 = peg$c22;
	            peg$currPos++;
	        }
	        else {
	            s1 = peg$FAILED;
	            if (peg$silentFails === 0) {
	                peg$fail(peg$e34);
	            }
	        }
	        if (s1 !== peg$FAILED) {
	            s2 = peg$parseLineTerminatorSequence();
	            if (s2 !== peg$FAILED) {
	                peg$savedPos = s0;
	                s0 = peg$f44();
	            }
	            else {
	                peg$currPos = s0;
	                s0 = peg$FAILED;
	            }
	        }
	        else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	        }
	        return s0;
	    }
	    function peg$parseEscapeSequence() {
	        var s0, s1, s2, s3;
	        s0 = peg$parseCharacterEscapeSequence();
	        if (s0 === peg$FAILED) {
	            s0 = peg$currPos;
	            if (input.charCodeAt(peg$currPos) === 48) {
	                s1 = peg$c30;
	                peg$currPos++;
	            }
	            else {
	                s1 = peg$FAILED;
	                if (peg$silentFails === 0) {
	                    peg$fail(peg$e51);
	                }
	            }
	            if (s1 !== peg$FAILED) {
	                s2 = peg$currPos;
	                peg$silentFails++;
	                s3 = peg$parseDecimalDigit();
	                peg$silentFails--;
	                if (s3 === peg$FAILED) {
	                    s2 = undefined;
	                }
	                else {
	                    peg$currPos = s2;
	                    s2 = peg$FAILED;
	                }
	                if (s2 !== peg$FAILED) {
	                    peg$savedPos = s0;
	                    s0 = peg$f45();
	                }
	                else {
	                    peg$currPos = s0;
	                    s0 = peg$FAILED;
	                }
	            }
	            else {
	                peg$currPos = s0;
	                s0 = peg$FAILED;
	            }
	            if (s0 === peg$FAILED) {
	                s0 = peg$parseHexEscapeSequence();
	                if (s0 === peg$FAILED) {
	                    s0 = peg$parseUnicodeEscapeSequence();
	                }
	            }
	        }
	        return s0;
	    }
	    function peg$parseCharacterEscapeSequence() {
	        var s0;
	        s0 = peg$parseSingleEscapeCharacter();
	        if (s0 === peg$FAILED) {
	            s0 = peg$parseNonEscapeCharacter();
	        }
	        return s0;
	    }
	    function peg$parseSingleEscapeCharacter() {
	        var s0, s1;
	        s0 = input.charAt(peg$currPos);
	        if (peg$r13.test(s0)) {
	            peg$currPos++;
	        }
	        else {
	            s0 = peg$FAILED;
	            if (peg$silentFails === 0) {
	                peg$fail(peg$e52);
	            }
	        }
	        if (s0 === peg$FAILED) {
	            s0 = peg$currPos;
	            if (input.charCodeAt(peg$currPos) === 98) {
	                s1 = peg$c31;
	                peg$currPos++;
	            }
	            else {
	                s1 = peg$FAILED;
	                if (peg$silentFails === 0) {
	                    peg$fail(peg$e53);
	                }
	            }
	            if (s1 !== peg$FAILED) {
	                peg$savedPos = s0;
	                s1 = peg$f46();
	            }
	            s0 = s1;
	            if (s0 === peg$FAILED) {
	                s0 = peg$currPos;
	                if (input.charCodeAt(peg$currPos) === 102) {
	                    s1 = peg$c32;
	                    peg$currPos++;
	                }
	                else {
	                    s1 = peg$FAILED;
	                    if (peg$silentFails === 0) {
	                        peg$fail(peg$e54);
	                    }
	                }
	                if (s1 !== peg$FAILED) {
	                    peg$savedPos = s0;
	                    s1 = peg$f47();
	                }
	                s0 = s1;
	                if (s0 === peg$FAILED) {
	                    s0 = peg$currPos;
	                    if (input.charCodeAt(peg$currPos) === 110) {
	                        s1 = peg$c33;
	                        peg$currPos++;
	                    }
	                    else {
	                        s1 = peg$FAILED;
	                        if (peg$silentFails === 0) {
	                            peg$fail(peg$e55);
	                        }
	                    }
	                    if (s1 !== peg$FAILED) {
	                        peg$savedPos = s0;
	                        s1 = peg$f48();
	                    }
	                    s0 = s1;
	                    if (s0 === peg$FAILED) {
	                        s0 = peg$currPos;
	                        if (input.charCodeAt(peg$currPos) === 114) {
	                            s1 = peg$c34;
	                            peg$currPos++;
	                        }
	                        else {
	                            s1 = peg$FAILED;
	                            if (peg$silentFails === 0) {
	                                peg$fail(peg$e56);
	                            }
	                        }
	                        if (s1 !== peg$FAILED) {
	                            peg$savedPos = s0;
	                            s1 = peg$f49();
	                        }
	                        s0 = s1;
	                        if (s0 === peg$FAILED) {
	                            s0 = peg$currPos;
	                            if (input.charCodeAt(peg$currPos) === 116) {
	                                s1 = peg$c35;
	                                peg$currPos++;
	                            }
	                            else {
	                                s1 = peg$FAILED;
	                                if (peg$silentFails === 0) {
	                                    peg$fail(peg$e57);
	                                }
	                            }
	                            if (s1 !== peg$FAILED) {
	                                peg$savedPos = s0;
	                                s1 = peg$f50();
	                            }
	                            s0 = s1;
	                            if (s0 === peg$FAILED) {
	                                s0 = peg$currPos;
	                                if (input.charCodeAt(peg$currPos) === 118) {
	                                    s1 = peg$c36;
	                                    peg$currPos++;
	                                }
	                                else {
	                                    s1 = peg$FAILED;
	                                    if (peg$silentFails === 0) {
	                                        peg$fail(peg$e58);
	                                    }
	                                }
	                                if (s1 !== peg$FAILED) {
	                                    peg$savedPos = s0;
	                                    s1 = peg$f51();
	                                }
	                                s0 = s1;
	                            }
	                        }
	                    }
	                }
	            }
	        }
	        return s0;
	    }
	    function peg$parseNonEscapeCharacter() {
	        var s0, s1, s2, s3;
	        s0 = peg$currPos;
	        s1 = peg$currPos;
	        s2 = peg$currPos;
	        peg$silentFails++;
	        s3 = peg$parseEscapeCharacter();
	        if (s3 === peg$FAILED) {
	            s3 = peg$parseLineTerminator();
	        }
	        peg$silentFails--;
	        if (s3 === peg$FAILED) {
	            s2 = undefined;
	        }
	        else {
	            peg$currPos = s2;
	            s2 = peg$FAILED;
	        }
	        if (s2 !== peg$FAILED) {
	            s3 = peg$parseSourceCharacter();
	            if (s3 !== peg$FAILED) {
	                s2 = [s2, s3];
	                s1 = s2;
	            }
	            else {
	                peg$currPos = s1;
	                s1 = peg$FAILED;
	            }
	        }
	        else {
	            peg$currPos = s1;
	            s1 = peg$FAILED;
	        }
	        if (s1 !== peg$FAILED) {
	            s0 = input.substring(s0, peg$currPos);
	        }
	        else {
	            s0 = s1;
	        }
	        return s0;
	    }
	    function peg$parseEscapeCharacter() {
	        var s0;
	        s0 = peg$parseSingleEscapeCharacter();
	        if (s0 === peg$FAILED) {
	            s0 = input.charAt(peg$currPos);
	            if (peg$r14.test(s0)) {
	                peg$currPos++;
	            }
	            else {
	                s0 = peg$FAILED;
	                if (peg$silentFails === 0) {
	                    peg$fail(peg$e59);
	                }
	            }
	        }
	        return s0;
	    }
	    function peg$parseHexEscapeSequence() {
	        var s0, s1, s2, s3, s4, s5;
	        s0 = peg$currPos;
	        if (input.charCodeAt(peg$currPos) === 120) {
	            s1 = peg$c37;
	            peg$currPos++;
	        }
	        else {
	            s1 = peg$FAILED;
	            if (peg$silentFails === 0) {
	                peg$fail(peg$e60);
	            }
	        }
	        if (s1 !== peg$FAILED) {
	            s2 = peg$currPos;
	            s3 = peg$currPos;
	            s4 = peg$parseHexDigit();
	            if (s4 !== peg$FAILED) {
	                s5 = peg$parseHexDigit();
	                if (s5 !== peg$FAILED) {
	                    s4 = [s4, s5];
	                    s3 = s4;
	                }
	                else {
	                    peg$currPos = s3;
	                    s3 = peg$FAILED;
	                }
	            }
	            else {
	                peg$currPos = s3;
	                s3 = peg$FAILED;
	            }
	            if (s3 !== peg$FAILED) {
	                s2 = input.substring(s2, peg$currPos);
	            }
	            else {
	                s2 = s3;
	            }
	            if (s2 !== peg$FAILED) {
	                peg$savedPos = s0;
	                s0 = peg$f52(s2);
	            }
	            else {
	                peg$currPos = s0;
	                s0 = peg$FAILED;
	            }
	        }
	        else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	        }
	        return s0;
	    }
	    function peg$parseUnicodeEscapeSequence() {
	        var s0, s1, s2, s3, s4, s5, s6, s7;
	        s0 = peg$currPos;
	        if (input.charCodeAt(peg$currPos) === 117) {
	            s1 = peg$c38;
	            peg$currPos++;
	        }
	        else {
	            s1 = peg$FAILED;
	            if (peg$silentFails === 0) {
	                peg$fail(peg$e61);
	            }
	        }
	        if (s1 !== peg$FAILED) {
	            s2 = peg$currPos;
	            s3 = peg$currPos;
	            s4 = peg$parseHexDigit();
	            if (s4 !== peg$FAILED) {
	                s5 = peg$parseHexDigit();
	                if (s5 !== peg$FAILED) {
	                    s6 = peg$parseHexDigit();
	                    if (s6 !== peg$FAILED) {
	                        s7 = peg$parseHexDigit();
	                        if (s7 !== peg$FAILED) {
	                            s4 = [s4, s5, s6, s7];
	                            s3 = s4;
	                        }
	                        else {
	                            peg$currPos = s3;
	                            s3 = peg$FAILED;
	                        }
	                    }
	                    else {
	                        peg$currPos = s3;
	                        s3 = peg$FAILED;
	                    }
	                }
	                else {
	                    peg$currPos = s3;
	                    s3 = peg$FAILED;
	                }
	            }
	            else {
	                peg$currPos = s3;
	                s3 = peg$FAILED;
	            }
	            if (s3 !== peg$FAILED) {
	                s2 = input.substring(s2, peg$currPos);
	            }
	            else {
	                s2 = s3;
	            }
	            if (s2 !== peg$FAILED) {
	                peg$savedPos = s0;
	                s0 = peg$f53(s2);
	            }
	            else {
	                peg$currPos = s0;
	                s0 = peg$FAILED;
	            }
	        }
	        else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	        }
	        return s0;
	    }
	    function peg$parseDecimalDigit() {
	        var s0;
	        s0 = input.charAt(peg$currPos);
	        if (peg$r15.test(s0)) {
	            peg$currPos++;
	        }
	        else {
	            s0 = peg$FAILED;
	            if (peg$silentFails === 0) {
	                peg$fail(peg$e62);
	            }
	        }
	        return s0;
	    }
	    function peg$parseHexDigit() {
	        var s0;
	        s0 = input.charAt(peg$currPos);
	        if (peg$r16.test(s0)) {
	            peg$currPos++;
	        }
	        else {
	            s0 = peg$FAILED;
	            if (peg$silentFails === 0) {
	                peg$fail(peg$e63);
	            }
	        }
	        return s0;
	    }
	    function peg$parseAnyMatcher() {
	        var s0, s1;
	        s0 = peg$currPos;
	        if (input.charCodeAt(peg$currPos) === 46) {
	            s1 = peg$c16;
	            peg$currPos++;
	        }
	        else {
	            s1 = peg$FAILED;
	            if (peg$silentFails === 0) {
	                peg$fail(peg$e19);
	            }
	        }
	        if (s1 !== peg$FAILED) {
	            peg$savedPos = s0;
	            s1 = peg$f54();
	        }
	        s0 = s1;
	        return s0;
	    }
	    function peg$parseCodeBlock() {
	        var s0, s1, s2, s3;
	        peg$silentFails++;
	        s0 = peg$currPos;
	        if (input.charCodeAt(peg$currPos) === 123) {
	            s1 = peg$c5;
	            peg$currPos++;
	        }
	        else {
	            s1 = peg$FAILED;
	            if (peg$silentFails === 0) {
	                peg$fail(peg$e6);
	            }
	        }
	        if (s1 !== peg$FAILED) {
	            s2 = peg$parseBareCodeBlock();
	            if (input.charCodeAt(peg$currPos) === 125) {
	                s3 = peg$c6;
	                peg$currPos++;
	            }
	            else {
	                s3 = peg$FAILED;
	                if (peg$silentFails === 0) {
	                    peg$fail(peg$e7);
	                }
	            }
	            if (s3 !== peg$FAILED) {
	                s0 = s2;
	            }
	            else {
	                peg$currPos = s0;
	                s0 = peg$FAILED;
	            }
	        }
	        else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	        }
	        peg$silentFails--;
	        if (s0 === peg$FAILED) {
	            s1 = peg$FAILED;
	            if (peg$silentFails === 0) {
	                peg$fail(peg$e64);
	            }
	        }
	        return s0;
	    }
	    function peg$parseBareCodeBlock() {
	        var s0, s1;
	        s0 = peg$currPos;
	        s1 = peg$parseCode();
	        peg$savedPos = s0;
	        s1 = peg$f55(s1);
	        s0 = s1;
	        return s0;
	    }
	    function peg$parseCode() {
	        var s0, s1, s2, s3, s4, s5;
	        s0 = peg$currPos;
	        s1 = [];
	        s2 = [];
	        s3 = peg$currPos;
	        s4 = peg$currPos;
	        peg$silentFails++;
	        s5 = input.charAt(peg$currPos);
	        if (peg$r17.test(s5)) {
	            peg$currPos++;
	        }
	        else {
	            s5 = peg$FAILED;
	            if (peg$silentFails === 0) {
	                peg$fail(peg$e65);
	            }
	        }
	        peg$silentFails--;
	        if (s5 === peg$FAILED) {
	            s4 = undefined;
	        }
	        else {
	            peg$currPos = s4;
	            s4 = peg$FAILED;
	        }
	        if (s4 !== peg$FAILED) {
	            s5 = peg$parseSourceCharacter();
	            if (s5 !== peg$FAILED) {
	                s4 = [s4, s5];
	                s3 = s4;
	            }
	            else {
	                peg$currPos = s3;
	                s3 = peg$FAILED;
	            }
	        }
	        else {
	            peg$currPos = s3;
	            s3 = peg$FAILED;
	        }
	        if (s3 !== peg$FAILED) {
	            while (s3 !== peg$FAILED) {
	                s2.push(s3);
	                s3 = peg$currPos;
	                s4 = peg$currPos;
	                peg$silentFails++;
	                s5 = input.charAt(peg$currPos);
	                if (peg$r17.test(s5)) {
	                    peg$currPos++;
	                }
	                else {
	                    s5 = peg$FAILED;
	                    if (peg$silentFails === 0) {
	                        peg$fail(peg$e65);
	                    }
	                }
	                peg$silentFails--;
	                if (s5 === peg$FAILED) {
	                    s4 = undefined;
	                }
	                else {
	                    peg$currPos = s4;
	                    s4 = peg$FAILED;
	                }
	                if (s4 !== peg$FAILED) {
	                    s5 = peg$parseSourceCharacter();
	                    if (s5 !== peg$FAILED) {
	                        s4 = [s4, s5];
	                        s3 = s4;
	                    }
	                    else {
	                        peg$currPos = s3;
	                        s3 = peg$FAILED;
	                    }
	                }
	                else {
	                    peg$currPos = s3;
	                    s3 = peg$FAILED;
	                }
	            }
	        }
	        else {
	            s2 = peg$FAILED;
	        }
	        if (s2 === peg$FAILED) {
	            s2 = peg$currPos;
	            if (input.charCodeAt(peg$currPos) === 123) {
	                s3 = peg$c5;
	                peg$currPos++;
	            }
	            else {
	                s3 = peg$FAILED;
	                if (peg$silentFails === 0) {
	                    peg$fail(peg$e6);
	                }
	            }
	            if (s3 !== peg$FAILED) {
	                s4 = peg$parseCode();
	                if (input.charCodeAt(peg$currPos) === 125) {
	                    s5 = peg$c6;
	                    peg$currPos++;
	                }
	                else {
	                    s5 = peg$FAILED;
	                    if (peg$silentFails === 0) {
	                        peg$fail(peg$e7);
	                    }
	                }
	                if (s5 !== peg$FAILED) {
	                    s3 = [s3, s4, s5];
	                    s2 = s3;
	                }
	                else {
	                    peg$currPos = s2;
	                    s2 = peg$FAILED;
	                }
	            }
	            else {
	                peg$currPos = s2;
	                s2 = peg$FAILED;
	            }
	        }
	        while (s2 !== peg$FAILED) {
	            s1.push(s2);
	            s2 = [];
	            s3 = peg$currPos;
	            s4 = peg$currPos;
	            peg$silentFails++;
	            s5 = input.charAt(peg$currPos);
	            if (peg$r17.test(s5)) {
	                peg$currPos++;
	            }
	            else {
	                s5 = peg$FAILED;
	                if (peg$silentFails === 0) {
	                    peg$fail(peg$e65);
	                }
	            }
	            peg$silentFails--;
	            if (s5 === peg$FAILED) {
	                s4 = undefined;
	            }
	            else {
	                peg$currPos = s4;
	                s4 = peg$FAILED;
	            }
	            if (s4 !== peg$FAILED) {
	                s5 = peg$parseSourceCharacter();
	                if (s5 !== peg$FAILED) {
	                    s4 = [s4, s5];
	                    s3 = s4;
	                }
	                else {
	                    peg$currPos = s3;
	                    s3 = peg$FAILED;
	                }
	            }
	            else {
	                peg$currPos = s3;
	                s3 = peg$FAILED;
	            }
	            if (s3 !== peg$FAILED) {
	                while (s3 !== peg$FAILED) {
	                    s2.push(s3);
	                    s3 = peg$currPos;
	                    s4 = peg$currPos;
	                    peg$silentFails++;
	                    s5 = input.charAt(peg$currPos);
	                    if (peg$r17.test(s5)) {
	                        peg$currPos++;
	                    }
	                    else {
	                        s5 = peg$FAILED;
	                        if (peg$silentFails === 0) {
	                            peg$fail(peg$e65);
	                        }
	                    }
	                    peg$silentFails--;
	                    if (s5 === peg$FAILED) {
	                        s4 = undefined;
	                    }
	                    else {
	                        peg$currPos = s4;
	                        s4 = peg$FAILED;
	                    }
	                    if (s4 !== peg$FAILED) {
	                        s5 = peg$parseSourceCharacter();
	                        if (s5 !== peg$FAILED) {
	                            s4 = [s4, s5];
	                            s3 = s4;
	                        }
	                        else {
	                            peg$currPos = s3;
	                            s3 = peg$FAILED;
	                        }
	                    }
	                    else {
	                        peg$currPos = s3;
	                        s3 = peg$FAILED;
	                    }
	                }
	            }
	            else {
	                s2 = peg$FAILED;
	            }
	            if (s2 === peg$FAILED) {
	                s2 = peg$currPos;
	                if (input.charCodeAt(peg$currPos) === 123) {
	                    s3 = peg$c5;
	                    peg$currPos++;
	                }
	                else {
	                    s3 = peg$FAILED;
	                    if (peg$silentFails === 0) {
	                        peg$fail(peg$e6);
	                    }
	                }
	                if (s3 !== peg$FAILED) {
	                    s4 = peg$parseCode();
	                    if (input.charCodeAt(peg$currPos) === 125) {
	                        s5 = peg$c6;
	                        peg$currPos++;
	                    }
	                    else {
	                        s5 = peg$FAILED;
	                        if (peg$silentFails === 0) {
	                            peg$fail(peg$e7);
	                        }
	                    }
	                    if (s5 !== peg$FAILED) {
	                        s3 = [s3, s4, s5];
	                        s2 = s3;
	                    }
	                    else {
	                        peg$currPos = s2;
	                        s2 = peg$FAILED;
	                    }
	                }
	                else {
	                    peg$currPos = s2;
	                    s2 = peg$FAILED;
	                }
	            }
	        }
	        s0 = input.substring(s0, peg$currPos);
	        return s0;
	    }
	    function peg$parseInteger() {
	        var s0, s1, s2, s3;
	        s0 = peg$currPos;
	        s1 = peg$currPos;
	        s2 = [];
	        s3 = peg$parseDecimalDigit();
	        if (s3 !== peg$FAILED) {
	            while (s3 !== peg$FAILED) {
	                s2.push(s3);
	                s3 = peg$parseDecimalDigit();
	            }
	        }
	        else {
	            s2 = peg$FAILED;
	        }
	        if (s2 !== peg$FAILED) {
	            s1 = input.substring(s1, peg$currPos);
	        }
	        else {
	            s1 = s2;
	        }
	        if (s1 !== peg$FAILED) {
	            peg$savedPos = s0;
	            s1 = peg$f56(s1);
	        }
	        s0 = s1;
	        return s0;
	    }
	    function peg$parse__() {
	        var s0, s1;
	        s0 = [];
	        s1 = peg$parseWhiteSpace();
	        if (s1 === peg$FAILED) {
	            s1 = peg$parseLineTerminatorSequence();
	            if (s1 === peg$FAILED) {
	                s1 = peg$parseComment();
	            }
	        }
	        while (s1 !== peg$FAILED) {
	            s0.push(s1);
	            s1 = peg$parseWhiteSpace();
	            if (s1 === peg$FAILED) {
	                s1 = peg$parseLineTerminatorSequence();
	                if (s1 === peg$FAILED) {
	                    s1 = peg$parseComment();
	                }
	            }
	        }
	        return s0;
	    }
	    function peg$parse_() {
	        var s0, s1;
	        s0 = [];
	        s1 = peg$parseWhiteSpace();
	        if (s1 === peg$FAILED) {
	            s1 = peg$parseMultiLineCommentNoLineTerminator();
	        }
	        while (s1 !== peg$FAILED) {
	            s0.push(s1);
	            s1 = peg$parseWhiteSpace();
	            if (s1 === peg$FAILED) {
	                s1 = peg$parseMultiLineCommentNoLineTerminator();
	            }
	        }
	        return s0;
	    }
	    function peg$parseEOS() {
	        var s0, s1, s2, s3;
	        s0 = [];
	        s1 = peg$currPos;
	        s2 = peg$parse__();
	        if (input.charCodeAt(peg$currPos) === 59) {
	            s3 = peg$c1;
	            peg$currPos++;
	        }
	        else {
	            s3 = peg$FAILED;
	            if (peg$silentFails === 0) {
	                peg$fail(peg$e2);
	            }
	        }
	        if (s3 !== peg$FAILED) {
	            s2 = [s2, s3];
	            s1 = s2;
	        }
	        else {
	            peg$currPos = s1;
	            s1 = peg$FAILED;
	        }
	        if (s1 !== peg$FAILED) {
	            while (s1 !== peg$FAILED) {
	                s0.push(s1);
	                s1 = peg$currPos;
	                s2 = peg$parse__();
	                if (input.charCodeAt(peg$currPos) === 59) {
	                    s3 = peg$c1;
	                    peg$currPos++;
	                }
	                else {
	                    s3 = peg$FAILED;
	                    if (peg$silentFails === 0) {
	                        peg$fail(peg$e2);
	                    }
	                }
	                if (s3 !== peg$FAILED) {
	                    s2 = [s2, s3];
	                    s1 = s2;
	                }
	                else {
	                    peg$currPos = s1;
	                    s1 = peg$FAILED;
	                }
	            }
	        }
	        else {
	            s0 = peg$FAILED;
	        }
	        if (s0 === peg$FAILED) {
	            s0 = peg$currPos;
	            s1 = peg$parse_();
	            s2 = peg$parseSingleLineComment();
	            if (s2 === peg$FAILED) {
	                s2 = null;
	            }
	            s3 = peg$parseLineTerminatorSequence();
	            if (s3 !== peg$FAILED) {
	                s1 = [s1, s2, s3];
	                s0 = s1;
	            }
	            else {
	                peg$currPos = s0;
	                s0 = peg$FAILED;
	            }
	            if (s0 === peg$FAILED) {
	                s0 = peg$currPos;
	                s1 = peg$parse__();
	                s2 = peg$parseEOF();
	                if (s2 !== peg$FAILED) {
	                    s1 = [s1, s2];
	                    s0 = s1;
	                }
	                else {
	                    peg$currPos = s0;
	                    s0 = peg$FAILED;
	                }
	            }
	        }
	        return s0;
	    }
	    function peg$parseEOF() {
	        var s0, s1;
	        s0 = peg$currPos;
	        peg$silentFails++;
	        if (input.length > peg$currPos) {
	            s1 = input.charAt(peg$currPos);
	            peg$currPos++;
	        }
	        else {
	            s1 = peg$FAILED;
	            if (peg$silentFails === 0) {
	                peg$fail(peg$e0);
	            }
	        }
	        peg$silentFails--;
	        if (s1 === peg$FAILED) {
	            s0 = undefined;
	        }
	        else {
	            peg$currPos = s0;
	            s0 = peg$FAILED;
	        }
	        return s0;
	    }
	    var reservedWords = options.reservedWords || [];
	    peg$result = peg$startRuleFunction();
	    if (options.peg$library) {
	        return ({
	            peg$result: peg$result,
	            peg$currPos: peg$currPos,
	            peg$FAILED: peg$FAILED,
	            peg$maxFailExpected: peg$maxFailExpected,
	            peg$maxFailPos: peg$maxFailPos
	        });
	    }
	    if (peg$result !== peg$FAILED && peg$currPos === input.length) {
	        return peg$result;
	    }
	    else {
	        if (peg$result !== peg$FAILED && peg$currPos < input.length) {
	            peg$fail(peg$endExpectation());
	        }
	        throw peg$buildStructuredError(peg$maxFailExpected, peg$maxFailPos < input.length ? input.charAt(peg$maxFailPos) : null, peg$maxFailPos < input.length
	            ? peg$computeLocation(peg$maxFailPos, peg$maxFailPos + 1)
	            : peg$computeLocation(peg$maxFailPos, peg$maxFailPos));
	    }
	}
	var parser$1 = {
	    StartRules: ["Grammar", "ImportsAndSource"],
	    SyntaxError: peg$SyntaxError,
	    parse: peg$parse
	};

	var __spreadArray$2 = (commonjsGlobal && commonjsGlobal.__spreadArray) || function (to, from, pack) {
	    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
	        if (ar || !(i in from)) {
	            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
	            ar[i] = from[i];
	        }
	    }
	    return to.concat(ar || Array.prototype.slice.call(from));
	};
	var asts$5 = asts_1;
	var op = opcodes_1;
	var Stack = stack;
	var VERSION$1 = version;
	var _a = utils, stringEscape = _a.stringEscape, regexpClassEscape = _a.regexpClassEscape;
	var SourceNode = sourceMap.SourceNode;
	var GrammarLocation$1 = grammarLocation;
	var parse = parser$1.parse;
	function toSourceNode(code, location, name) {
	    var start = GrammarLocation$1.offsetStart(location);
	    var line = start.line;
	    var column = start.column - 1;
	    var lines = code.split("\n");
	    if (lines.length === 1) {
	        return new SourceNode(line, column, String(location.source), code, name);
	    }
	    return new SourceNode(null, null, String(location.source), lines.map(function (l, i) { return new SourceNode(line + i, i === 0 ? column : 0, String(location.source), i === lines.length - 1 ? l : [l, "\n"], name); }));
	}
	function wrapInSourceNode(prefix, chunk, location, suffix, name) {
	    if (location) {
	        var end = GrammarLocation$1.offsetEnd(location);
	        return new SourceNode(null, null, String(location.source), [
	            prefix,
	            toSourceNode(chunk, location, name),
	            new SourceNode(end.line, end.column - 1, String(location.source), suffix),
	        ]);
	    }
	    return new SourceNode(null, null, null, [prefix, chunk, suffix]);
	}
	function generateJS$1(ast, options) {
	    if (!ast.literals || !ast.locations || !ast.classes
	        || !ast.expectations || !ast.functions || !ast.importedNames) {
	        throw new Error("generateJS: generate bytecode was not called.");
	    }
	    var literals = ast.literals, locations = ast.locations, classes = ast.classes, expectations = ast.expectations, functions = ast.functions, importedNames = ast.importedNames;
	    if (!options.allowedStartRules) {
	        throw new Error("generateJS: options.allowedStartRules was not set.");
	    }
	    var allowedStartRules = options.allowedStartRules;
	    var dependencies = options.dependencies || {};
	    function indent2(code) {
	        var sawEol = true;
	        var inSourceNode = 0;
	        function helper(code) {
	            if (Array.isArray(code)) {
	                return code.map(function (s) { return helper(s); });
	            }
	            if (code instanceof SourceNode) {
	                inSourceNode++;
	                code.children = helper(code.children);
	                inSourceNode--;
	                return code;
	            }
	            if (sawEol) {
	                code = code.replace(/^(.+)$/gm, "  $1");
	            }
	            else {
	                code = code.replace(/\n(\s*\S)/g, "\n  $1");
	            }
	            sawEol = !inSourceNode || code.endsWith("\n");
	            return code;
	        }
	        return helper(code);
	    }
	    function l(i) { return "peg$c" + i; }
	    function r(i) { return "peg$r" + i; }
	    function e(i) { return "peg$e" + i; }
	    function f(i) { return "peg$f" + i; }
	    function gi(i) { return "peg$import" + i; }
	    function name(name) { return "peg$parse" + name; }
	    function generateTables() {
	        function buildLiteral(literal) {
	            return "\"" + stringEscape(literal) + "\"";
	        }
	        function buildRegexp(cls) {
	            return "/^["
	                + (cls.inverted ? "^" : "")
	                + cls.value.map(function (part) { return (Array.isArray(part)
	                    ? regexpClassEscape(part[0])
	                        + "-"
	                        + regexpClassEscape(part[1])
	                    : regexpClassEscape(part)); }).join("")
	                + "]/" + (cls.ignoreCase ? "i" : "");
	        }
	        function buildExpectation(e) {
	            switch (e.type) {
	                case "rule": {
	                    return "peg$otherExpectation(\"" + stringEscape(e.value) + "\")";
	                }
	                case "literal": {
	                    return "peg$literalExpectation(\""
	                        + stringEscape(e.value)
	                        + "\", "
	                        + e.ignoreCase
	                        + ")";
	                }
	                case "class": {
	                    var parts = e.value.map(function (part) { return (Array.isArray(part)
	                        ? "[\"" + stringEscape(part[0]) + "\", \"" + stringEscape(part[1]) + "\"]"
	                        : "\"" + stringEscape(part) + "\""); }).join(", ");
	                    return "peg$classExpectation(["
	                        + parts + "], "
	                        + e.inverted + ", "
	                        + e.ignoreCase
	                        + ")";
	                }
	                case "any": return "peg$anyExpectation()";
	                default: throw new Error("Unknown expectation type (" + JSON.stringify(e) + ")");
	            }
	        }
	        function buildFunc(a, i) {
	            return wrapInSourceNode("\n  var ".concat(f(i), " = function(").concat(a.params.join(", "), ") {"), a.body, a.location, "};");
	        }
	        return new SourceNode(null, null, options.grammarSource, __spreadArray$2([
	            literals.map(function (c, i) { return "  var " + l(i) + " = " + buildLiteral(c) + ";"; }).concat("", classes.map(function (c, i) { return "  var " + r(i) + " = " + buildRegexp(c) + ";"; })).concat("", expectations.map(function (c, i) { return "  var " + e(i) + " = " + buildExpectation(c) + ";"; })).concat("").join("\n")
	        ], functions.map(buildFunc), true));
	    }
	    function generateRuleHeader(ruleNameCode, ruleIndexCode) {
	        var parts = [];
	        parts.push("");
	        if (options.trace) {
	            parts.push("peg$tracer.trace({", "  type: \"rule.enter\",", "  rule: " + ruleNameCode + ",", "  location: peg$computeLocation(startPos, startPos, true)", "});", "");
	        }
	        if (options.cache) {
	            parts.push("var key = peg$currPos * " + ast.rules.length + " + " + ruleIndexCode + ";", "var cached = peg$resultsCache[key];", "", "if (cached) {", "  peg$currPos = cached.nextPos;", "");
	            if (options.trace) {
	                parts.push("if (cached.result !== peg$FAILED) {", "  peg$tracer.trace({", "    type: \"rule.match\",", "    rule: " + ruleNameCode + ",", "    result: cached.result,", "    location: peg$computeLocation(startPos, peg$currPos, true)", "  });", "} else {", "  peg$tracer.trace({", "    type: \"rule.fail\",", "    rule: " + ruleNameCode + ",", "    location: peg$computeLocation(startPos, startPos, true)", "  });", "}", "");
	            }
	            parts.push("  return cached.result;", "}", "");
	        }
	        return parts;
	    }
	    function generateRuleFooter(ruleNameCode, resultCode) {
	        var parts = [];
	        if (options.cache) {
	            parts.push("", "peg$resultsCache[key] = { nextPos: peg$currPos, result: " + resultCode + " };");
	        }
	        if (options.trace) {
	            parts.push("", "if (" + resultCode + " !== peg$FAILED) {", "  peg$tracer.trace({", "    type: \"rule.match\",", "    rule: " + ruleNameCode + ",", "    result: " + resultCode + ",", "    location: peg$computeLocation(startPos, peg$currPos, true)", "  });", "} else {", "  peg$tracer.trace({", "    type: \"rule.fail\",", "    rule: " + ruleNameCode + ",", "    location: peg$computeLocation(startPos, startPos, true)", "  });", "}");
	        }
	        parts.push("", "return " + resultCode + ";");
	        return parts;
	    }
	    function generateRuleFunction(rule) {
	        var parts = [];
	        var bytecode = (rule.bytecode);
	        var stack = new Stack(rule.name, "s", "var", bytecode);
	        function compile(bc) {
	            var ip = 0;
	            var end = bc.length;
	            var parts = [];
	            var value = undefined;
	            function compileCondition(cond, argCount, thenFn) {
	                var baseLength = argCount + 3;
	                var thenLength = bc[ip + baseLength - 2];
	                var elseLength = bc[ip + baseLength - 1];
	                var _a = stack.checkedIf(ip, function () {
	                    ip += baseLength + thenLength;
	                    return (thenFn || compile)(bc.slice(ip - thenLength, ip));
	                }, (elseLength > 0)
	                    ? function () {
	                        ip += elseLength;
	                        return compile(bc.slice(ip - elseLength, ip));
	                    }
	                    : null), thenCode = _a[0], elseCode = _a[1];
	                parts.push("if (" + cond + ") {");
	                parts.push.apply(parts, indent2(thenCode));
	                if (elseLength > 0) {
	                    parts.push("} else {");
	                    parts.push.apply(parts, indent2(elseCode));
	                }
	                parts.push("}");
	            }
	            function compileInputChunkCondition(condFn, argCount, inputChunkLength) {
	                var baseLength = argCount + 3;
	                var inputChunk = inputChunkLength === 1
	                    ? "input.charAt(peg$currPos)"
	                    : "input.substr(peg$currPos, " + inputChunkLength + ")";
	                var thenFn = null;
	                if (bc[ip + baseLength] === op.ACCEPT_N
	                    && bc[ip + baseLength + 1] === inputChunkLength) {
	                    parts.push(stack.push(inputChunk));
	                    inputChunk = stack.pop();
	                    thenFn = function (bc) {
	                        stack.sp++;
	                        var code = compile(bc.slice(2));
	                        code.unshift(inputChunkLength === 1
	                            ? "peg$currPos++;"
	                            : "peg$currPos += " + inputChunkLength + ";");
	                        return code;
	                    };
	                }
	                compileCondition(condFn(inputChunk, thenFn !== null), argCount, thenFn);
	            }
	            function compileLoop(cond) {
	                var baseLength = 2;
	                var bodyLength = bc[ip + baseLength - 1];
	                var bodyCode = stack.checkedLoop(ip, function () {
	                    ip += baseLength + bodyLength;
	                    return compile(bc.slice(ip - bodyLength, ip));
	                });
	                parts.push("while (" + cond + ") {");
	                parts.push.apply(parts, indent2(bodyCode));
	                parts.push("}");
	            }
	            function compileCall(baseLength) {
	                var paramsLength = bc[ip + baseLength - 1];
	                return f(bc[ip + 1]) + "("
	                    + bc.slice(ip + baseLength, ip + baseLength + paramsLength).map(function (p) { return stack.index(p); }).join(", ")
	                    + ")";
	            }
	            var _loop_1 = function () {
	                switch (bc[ip]) {
	                    case op.PUSH_EMPTY_STRING:
	                        parts.push(stack.push("''"));
	                        ip++;
	                        break;
	                    case op.PUSH_CURR_POS:
	                        parts.push(stack.push("peg$currPos"));
	                        ip++;
	                        break;
	                    case op.PUSH_UNDEFINED:
	                        parts.push(stack.push("undefined"));
	                        ip++;
	                        break;
	                    case op.PUSH_NULL:
	                        parts.push(stack.push("null"));
	                        ip++;
	                        break;
	                    case op.PUSH_FAILED:
	                        parts.push(stack.push("peg$FAILED"));
	                        ip++;
	                        break;
	                    case op.PUSH_EMPTY_ARRAY:
	                        parts.push(stack.push("[]"));
	                        ip++;
	                        break;
	                    case op.POP:
	                        stack.pop();
	                        ip++;
	                        break;
	                    case op.POP_CURR_POS:
	                        parts.push("peg$currPos = " + stack.pop() + ";");
	                        ip++;
	                        break;
	                    case op.POP_N:
	                        stack.pop(bc[ip + 1]);
	                        ip += 2;
	                        break;
	                    case op.NIP:
	                        value = stack.pop();
	                        stack.pop();
	                        parts.push(stack.push(value));
	                        ip++;
	                        break;
	                    case op.APPEND:
	                        value = stack.pop();
	                        parts.push(stack.top() + ".push(" + value + ");");
	                        ip++;
	                        break;
	                    case op.WRAP:
	                        parts.push(stack.push("[" + stack.pop(bc[ip + 1]).join(", ") + "]"));
	                        ip += 2;
	                        break;
	                    case op.TEXT:
	                        parts.push(stack.push("input.substring(" + stack.pop() + ", peg$currPos)"));
	                        ip++;
	                        break;
	                    case op.PLUCK: {
	                        var baseLength = 3;
	                        var paramsLength = bc[ip + baseLength - 1];
	                        var n = baseLength + paramsLength;
	                        value = bc.slice(ip + baseLength, ip + n);
	                        value = paramsLength === 1
	                            ? stack.index(value[0])
	                            : "[ ".concat(value.map(function (p) { return stack.index(p); }).join(", "), " ]");
	                        stack.pop(bc[ip + 1]);
	                        parts.push(stack.push(value));
	                        ip += n;
	                        break;
	                    }
	                    case op.IF:
	                        compileCondition(stack.top(), 0);
	                        break;
	                    case op.IF_ERROR:
	                        compileCondition(stack.top() + " === peg$FAILED", 0);
	                        break;
	                    case op.IF_NOT_ERROR:
	                        compileCondition(stack.top() + " !== peg$FAILED", 0);
	                        break;
	                    case op.IF_LT:
	                        compileCondition(stack.top() + ".length < " + bc[ip + 1], 1);
	                        break;
	                    case op.IF_GE:
	                        compileCondition(stack.top() + ".length >= " + bc[ip + 1], 1);
	                        break;
	                    case op.IF_LT_DYNAMIC:
	                        compileCondition(stack.top() + ".length < (" + stack.index(bc[ip + 1]) + "|0)", 1);
	                        break;
	                    case op.IF_GE_DYNAMIC:
	                        compileCondition(stack.top() + ".length >= (" + stack.index(bc[ip + 1]) + "|0)", 1);
	                        break;
	                    case op.WHILE_NOT_ERROR:
	                        compileLoop(stack.top() + " !== peg$FAILED");
	                        break;
	                    case op.MATCH_ANY:
	                        compileCondition("input.length > peg$currPos", 0);
	                        break;
	                    case op.MATCH_STRING: {
	                        var litNum_1 = bc[ip + 1];
	                        var literal_1 = literals[litNum_1];
	                        compileInputChunkCondition(function (inputChunk, optimized) {
	                            if (literal_1.length > 1) {
	                                return "".concat(inputChunk, " === ").concat(l(litNum_1));
	                            }
	                            inputChunk = !optimized
	                                ? "input.charCodeAt(peg$currPos)"
	                                : "".concat(inputChunk, ".charCodeAt(0)");
	                            return "".concat(inputChunk, " === ").concat(literal_1.charCodeAt(0));
	                        }, 1, literal_1.length);
	                        break;
	                    }
	                    case op.MATCH_STRING_IC: {
	                        var litNum_2 = bc[ip + 1];
	                        compileInputChunkCondition(function (inputChunk) { return "".concat(inputChunk, ".toLowerCase() === ").concat(l(litNum_2)); }, 1, literals[litNum_2].length);
	                        break;
	                    }
	                    case op.MATCH_CHAR_CLASS: {
	                        var regNum_1 = bc[ip + 1];
	                        compileInputChunkCondition(function (inputChunk) { return "".concat(r(regNum_1), ".test(").concat(inputChunk, ")"); }, 1, 1);
	                        break;
	                    }
	                    case op.ACCEPT_N:
	                        parts.push(stack.push(bc[ip + 1] > 1
	                            ? "input.substr(peg$currPos, " + bc[ip + 1] + ")"
	                            : "input.charAt(peg$currPos)"));
	                        parts.push(bc[ip + 1] > 1
	                            ? "peg$currPos += " + bc[ip + 1] + ";"
	                            : "peg$currPos++;");
	                        ip += 2;
	                        break;
	                    case op.ACCEPT_STRING:
	                        parts.push(stack.push(l(bc[ip + 1])));
	                        parts.push(literals[bc[ip + 1]].length > 1
	                            ? "peg$currPos += " + literals[bc[ip + 1]].length + ";"
	                            : "peg$currPos++;");
	                        ip += 2;
	                        break;
	                    case op.FAIL:
	                        parts.push(stack.push("peg$FAILED"));
	                        parts.push("if (peg$silentFails === 0) { peg$fail(" + e(bc[ip + 1]) + "); }");
	                        ip += 2;
	                        break;
	                    case op.LOAD_SAVED_POS:
	                        parts.push("peg$savedPos = " + stack.index(bc[ip + 1]) + ";");
	                        ip += 2;
	                        break;
	                    case op.UPDATE_SAVED_POS:
	                        parts.push("peg$savedPos = peg$currPos;");
	                        ip++;
	                        break;
	                    case op.CALL:
	                        value = compileCall(4);
	                        stack.pop(bc[ip + 2]);
	                        parts.push(stack.push(value));
	                        ip += 4 + bc[ip + 3];
	                        break;
	                    case op.RULE:
	                        parts.push(stack.push(name(ast.rules[bc[ip + 1]].name) + "()"));
	                        ip += 2;
	                        break;
	                    case op.LIBRARY_RULE: {
	                        var nm = bc[ip + 2];
	                        var cnm = (nm === -1) ? "" : ", \"" + importedNames[nm] + "\"";
	                        parts.push(stack.push("peg$callLibrary("
	                            + gi(bc[ip + 1])
	                            + cnm
	                            + ")"));
	                        ip += 3;
	                        break;
	                    }
	                    case op.SILENT_FAILS_ON:
	                        parts.push("peg$silentFails++;");
	                        ip++;
	                        break;
	                    case op.SILENT_FAILS_OFF:
	                        parts.push("peg$silentFails--;");
	                        ip++;
	                        break;
	                    case op.SOURCE_MAP_PUSH:
	                        stack.sourceMapPush(parts, locations[bc[ip + 1]]);
	                        ip += 2;
	                        break;
	                    case op.SOURCE_MAP_POP: {
	                        stack.sourceMapPop();
	                        ip++;
	                        break;
	                    }
	                    case op.SOURCE_MAP_LABEL_PUSH:
	                        stack.labels[bc[ip + 1]] = {
	                            label: literals[bc[ip + 2]],
	                            location: locations[bc[ip + 3]],
	                        };
	                        ip += 4;
	                        break;
	                    case op.SOURCE_MAP_LABEL_POP:
	                        delete stack.labels[bc[ip + 1]];
	                        ip += 2;
	                        break;
	                    default:
	                        throw new Error("Invalid opcode: " + bc[ip] + ".");
	                }
	            };
	            while (ip < end) {
	                _loop_1();
	            }
	            return parts;
	        }
	        var code = compile(bytecode);
	        parts.push(wrapInSourceNode("function ", name(rule.name), rule.nameLocation, "() {\n", rule.name));
	        if (options.trace) {
	            parts.push("  var startPos = peg$currPos;");
	        }
	        parts.push(indent2(stack.defines()));
	        parts.push.apply(parts, indent2(generateRuleHeader("\"" + stringEscape(rule.name) + "\"", asts$5.indexOfRule(ast, rule.name))));
	        parts.push.apply(parts, indent2(code));
	        parts.push.apply(parts, indent2(generateRuleFooter("\"" + stringEscape(rule.name) + "\"", stack.result())));
	        parts.push("}");
	        return parts;
	    }
	    function ast2SourceNode(node) {
	        if (node.codeLocation) {
	            return toSourceNode(node.code, node.codeLocation, "$" + node.type);
	        }
	        return node.code;
	    }
	    function generateToplevel() {
	        var parts = [];
	        var topLevel = ast.topLevelInitializer;
	        if (topLevel) {
	            if (Array.isArray(topLevel)) {
	                if (options.format === "es") {
	                    var imps = [];
	                    var codes = [];
	                    for (var _i = 0, topLevel_1 = topLevel; _i < topLevel_1.length; _i++) {
	                        var tli = topLevel_1[_i];
	                        var _a = (parse(tli.code, {
	                            startRule: "ImportsAndSource",
	                            grammarSource: new GrammarLocation$1(tli.codeLocation.source, tli.codeLocation.start),
	                        })), imports = _a[0], code = _a[1];
	                        if (imports.code) {
	                            imps.push(imports);
	                            codes.push(code);
	                        }
	                        else {
	                            codes.push(tli);
	                        }
	                    }
	                    topLevel = codes.concat(imps);
	                }
	                var reversed = topLevel.slice(0).reverse();
	                for (var _b = 0, reversed_1 = reversed; _b < reversed_1.length; _b++) {
	                    var tli = reversed_1[_b];
	                    parts.push(ast2SourceNode(tli));
	                    parts.push("");
	                }
	            }
	            else {
	                parts.push(ast2SourceNode(topLevel));
	                parts.push("");
	            }
	        }
	        parts.push("function peg$subclass(child, parent) {", "  function C() { this.constructor = child; }", "  C.prototype = parent.prototype;", "  child.prototype = new C();", "}", "", "function peg$SyntaxError(message, expected, found, location) {", "  var self = Error.call(this, message);", "  // istanbul ignore next Check is a necessary evil to support older environments", "  if (Object.setPrototypeOf) {", "    Object.setPrototypeOf(self, peg$SyntaxError.prototype);", "  }", "  self.expected = expected;", "  self.found = found;", "  self.location = location;", "  self.name = \"SyntaxError\";", "  return self;", "}", "", "peg$subclass(peg$SyntaxError, Error);", "", "function peg$padEnd(str, targetLength, padString) {", "  padString = padString || \" \";", "  if (str.length > targetLength) { return str; }", "  targetLength -= str.length;", "  padString += padString.repeat(targetLength);", "  return str + padString.slice(0, targetLength);", "}", "", "peg$SyntaxError.prototype.format = function(sources) {", "  var str = \"Error: \" + this.message;", "  if (this.location) {", "    var src = null;", "    var k;", "    for (k = 0; k < sources.length; k++) {", "      if (sources[k].source === this.location.source) {", "        src = sources[k].text.split(/\\r\\n|\\n|\\r/g);", "        break;", "      }", "    }", "    var s = this.location.start;", "    var offset_s = (this.location.source && (typeof this.location.source.offset === \"function\"))", "      ? this.location.source.offset(s)", "      : s;", "    var loc = this.location.source + \":\" + offset_s.line + \":\" + offset_s.column;", "    if (src) {", "      var e = this.location.end;", "      var filler = peg$padEnd(\"\", offset_s.line.toString().length, ' ');", "      var line = src[s.line - 1];", "      var last = s.line === e.line ? e.column : line.length + 1;", "      var hatLen = (last - s.column) || 1;", "      str += \"\\n --> \" + loc + \"\\n\"", "          + filler + \" |\\n\"", "          + offset_s.line + \" | \" + line + \"\\n\"", "          + filler + \" | \" + peg$padEnd(\"\", s.column - 1, ' ')", "          + peg$padEnd(\"\", hatLen, \"^\");", "    } else {", "      str += \"\\n at \" + loc;", "    }", "  }", "  return str;", "};", "", "peg$SyntaxError.buildMessage = function(expected, found) {", "  var DESCRIBE_EXPECTATION_FNS = {", "    literal: function(expectation) {", "      return \"\\\"\" + literalEscape(expectation.text) + \"\\\"\";", "    },", "", "    class: function(expectation) {", "      var escapedParts = expectation.parts.map(function(part) {", "        return Array.isArray(part)", "          ? classEscape(part[0]) + \"-\" + classEscape(part[1])", "          : classEscape(part);", "      });", "", "      return \"[\" + (expectation.inverted ? \"^\" : \"\") + escapedParts.join(\"\") + \"]\";", "    },", "", "    any: function() {", "      return \"any character\";", "    },", "", "    end: function() {", "      return \"end of input\";", "    },", "", "    other: function(expectation) {", "      return expectation.description;", "    }", "  };", "", "  function hex(ch) {", "    return ch.charCodeAt(0).toString(16).toUpperCase();", "  }", "", "  function literalEscape(s) {", "    return s", "      .replace(/\\\\/g, \"\\\\\\\\\")", "      .replace(/\"/g,  \"\\\\\\\"\")", "      .replace(/\\0/g, \"\\\\0\")", "      .replace(/\\t/g, \"\\\\t\")", "      .replace(/\\n/g, \"\\\\n\")", "      .replace(/\\r/g, \"\\\\r\")", "      .replace(/[\\x00-\\x0F]/g,          function(ch) { return \"\\\\x0\" + hex(ch); })", "      .replace(/[\\x10-\\x1F\\x7F-\\x9F]/g, function(ch) { return \"\\\\x\"  + hex(ch); });", "  }", "", "  function classEscape(s) {", "    return s", "      .replace(/\\\\/g, \"\\\\\\\\\")", "      .replace(/\\]/g, \"\\\\]\")", "      .replace(/\\^/g, \"\\\\^\")", "      .replace(/-/g,  \"\\\\-\")", "      .replace(/\\0/g, \"\\\\0\")", "      .replace(/\\t/g, \"\\\\t\")", "      .replace(/\\n/g, \"\\\\n\")", "      .replace(/\\r/g, \"\\\\r\")", "      .replace(/[\\x00-\\x0F]/g,          function(ch) { return \"\\\\x0\" + hex(ch); })", "      .replace(/[\\x10-\\x1F\\x7F-\\x9F]/g, function(ch) { return \"\\\\x\"  + hex(ch); });", "  }", "", "  function describeExpectation(expectation) {", "    return DESCRIBE_EXPECTATION_FNS[expectation.type](expectation);", "  }", "", "  function describeExpected(expected) {", "    var descriptions = expected.map(describeExpectation);", "    var i, j;", "", "    descriptions.sort();", "", "    if (descriptions.length > 0) {", "      for (i = 1, j = 1; i < descriptions.length; i++) {", "        if (descriptions[i - 1] !== descriptions[i]) {", "          descriptions[j] = descriptions[i];", "          j++;", "        }", "      }", "      descriptions.length = j;", "    }", "", "    switch (descriptions.length) {", "      case 1:", "        return descriptions[0];", "", "      case 2:", "        return descriptions[0] + \" or \" + descriptions[1];", "", "      default:", "        return descriptions.slice(0, -1).join(\", \")", "          + \", or \"", "          + descriptions[descriptions.length - 1];", "    }", "  }", "", "  function describeFound(found) {", "    return found ? \"\\\"\" + literalEscape(found) + \"\\\"\" : \"end of input\";", "  }", "", "  return \"Expected \" + describeExpected(expected) + \" but \" + describeFound(found) + \" found.\";", "};", "");
	        if (options.trace) {
	            parts.push("function peg$DefaultTracer() {", "  this.indentLevel = 0;", "}", "", "peg$DefaultTracer.prototype.trace = function(event) {", "  var that = this;", "", "  function log(event) {", "    function repeat(string, n) {", "       var result = \"\", i;", "", "       for (i = 0; i < n; i++) {", "         result += string;", "       }", "", "       return result;", "    }", "", "    function pad(string, length) {", "      return string + repeat(\" \", length - string.length);", "    }", "", "    if (typeof console === \"object\") {", "      console.log(", "        event.location.start.line + \":\" + event.location.start.column + \"-\"", "          + event.location.end.line + \":\" + event.location.end.column + \" \"", "          + pad(event.type, 10) + \" \"", "          + repeat(\"  \", that.indentLevel) + event.rule", "      );", "    }", "  }", "", "  switch (event.type) {", "    case \"rule.enter\":", "      log(event);", "      this.indentLevel++;", "      break;", "", "    case \"rule.match\":", "      this.indentLevel--;", "      log(event);", "      break;", "", "    case \"rule.fail\":", "      this.indentLevel--;", "      log(event);", "      break;", "", "    default:", "      throw new Error(\"Invalid event type: \" + event.type + \".\");", "  }", "};", "");
	        }
	        var startRuleFunctions = "{ "
	            + allowedStartRules.map(function (r) { return r + ": " + name(r); }).join(", ")
	            + " }";
	        var startRuleFunction = name(allowedStartRules[0]);
	        parts.push("function peg$parse(input, options) {", "  options = options !== undefined ? options : {};", "", "  var peg$FAILED = {};", "  var peg$source = options.grammarSource;", "", "  var peg$startRuleFunctions = " + startRuleFunctions + ";", "  var peg$startRuleFunction = " + startRuleFunction + ";", "", generateTables(), "", "  var peg$currPos = options.peg$currPos | 0;", "  var peg$savedPos = peg$currPos;", "  var peg$posDetailsCache = [{ line: 1, column: 1 }];", "  var peg$maxFailPos = peg$currPos;", "  var peg$maxFailExpected = options.peg$maxFailExpected || [];", "  var peg$silentFails = options.peg$silentFails | 0;", "");
	        if (options.cache) {
	            parts.push("  var peg$resultsCache = {};", "");
	        }
	        if (options.trace) {
	            parts.push("  var peg$tracer = \"tracer\" in options ? options.tracer : new peg$DefaultTracer();", "");
	        }
	        parts.push("  var peg$result;", "", "  if (options.startRule) {", "    if (!(options.startRule in peg$startRuleFunctions)) {", "      throw new Error(\"Can't start parsing from rule \\\"\" + options.startRule + \"\\\".\");", "    }", "", "    peg$startRuleFunction = peg$startRuleFunctions[options.startRule];", "  }", "", "  function text() {", "    return input.substring(peg$savedPos, peg$currPos);", "  }", "", "  function offset() {", "    return peg$savedPos;", "  }", "", "  function range() {", "    return {", "      source: peg$source,", "      start: peg$savedPos,", "      end: peg$currPos", "    };", "  }", "", "  function location() {", "    return peg$computeLocation(peg$savedPos, peg$currPos);", "  }", "", "  function expected(description, location) {", "    location = location !== undefined", "      ? location", "      : peg$computeLocation(peg$savedPos, peg$currPos);", "", "    throw peg$buildStructuredError(", "      [peg$otherExpectation(description)],", "      input.substring(peg$savedPos, peg$currPos),", "      location", "    );", "  }", "", "  function error(message, location) {", "    location = location !== undefined", "      ? location", "      : peg$computeLocation(peg$savedPos, peg$currPos);", "", "    throw peg$buildSimpleError(message, location);", "  }", "", "  function peg$literalExpectation(text, ignoreCase) {", "    return { type: \"literal\", text: text, ignoreCase: ignoreCase };", "  }", "", "  function peg$classExpectation(parts, inverted, ignoreCase) {", "    return { type: \"class\", parts: parts, inverted: inverted, ignoreCase: ignoreCase };", "  }", "", "  function peg$anyExpectation() {", "    return { type: \"any\" };", "  }", "", "  function peg$endExpectation() {", "    return { type: \"end\" };", "  }", "", "  function peg$otherExpectation(description) {", "    return { type: \"other\", description: description };", "  }", "", "  function peg$computePosDetails(pos) {", "    var details = peg$posDetailsCache[pos];", "    var p;", "", "    if (details) {", "      return details;", "    } else {", "      if (pos >= peg$posDetailsCache.length) {", "        p = peg$posDetailsCache.length - 1;", "      } else {", "        p = pos;", "        while (!peg$posDetailsCache[--p]) {}", "      }", "", "      details = peg$posDetailsCache[p];", "      details = {", "        line: details.line,", "        column: details.column", "      };", "", "      while (p < pos) {", "        if (input.charCodeAt(p) === 10) {", "          details.line++;", "          details.column = 1;", "        } else {", "          details.column++;", "        }", "", "        p++;", "      }", "", "      peg$posDetailsCache[pos] = details;", "", "      return details;", "    }", "  }", "", "  function peg$computeLocation(startPos, endPos, offset) {", "    var startPosDetails = peg$computePosDetails(startPos);", "    var endPosDetails = peg$computePosDetails(endPos);", "", "    var res = {", "      source: peg$source,", "      start: {", "        offset: startPos,", "        line: startPosDetails.line,", "        column: startPosDetails.column", "      },", "      end: {", "        offset: endPos,", "        line: endPosDetails.line,", "        column: endPosDetails.column", "      }", "    };", "    if (offset && peg$source && (typeof peg$source.offset === \"function\")) {", "      res.start = peg$source.offset(res.start);", "      res.end = peg$source.offset(res.end);", "    }", "    return res;", "  }", "", "  function peg$fail(expected) {", "    if (peg$currPos < peg$maxFailPos) { return; }", "", "    if (peg$currPos > peg$maxFailPos) {", "      peg$maxFailPos = peg$currPos;", "      peg$maxFailExpected = [];", "    }", "", "    peg$maxFailExpected.push(expected);", "  }", "", "  function peg$buildSimpleError(message, location) {", "    return new peg$SyntaxError(message, null, null, location);", "  }", "", "  function peg$buildStructuredError(expected, found, location) {", "    return new peg$SyntaxError(", "      peg$SyntaxError.buildMessage(expected, found),", "      expected,", "      found,", "      location", "    );", "  }", "");
	        if (ast.imports.length > 0) {
	            parts.push("  var peg$assign = Object.assign || function(t) {", "    var i, s;", "    for (i = 1; i < arguments.length; i++) {", "      s = arguments[i];", "      for (var p in s) {", "        if (Object.prototype.hasOwnProperty.call(s, p)) {", "          t[p] = s[p];", "        }", "      }", "    }", "    return t;", "  };", "", "  function peg$callLibrary(lib, startRule) {", "    const opts = peg$assign({}, options, {", "      startRule: startRule,", "      peg$currPos: peg$currPos,", "      peg$silentFails: peg$silentFails,", "      peg$library: true,", "      peg$maxFailExpected: peg$maxFailExpected", "    });", "    const res = lib.parse(input, opts);", "    peg$currPos = res.peg$currPos;", "    peg$maxFailPos = res.peg$maxFailPos;", "    peg$maxFailExpected = res.peg$maxFailExpected;", "    return (res.peg$result === res.peg$FAILED) ? peg$FAILED : res.peg$result;", "  }", "");
	        }
	        ast.rules.forEach(function (rule) {
	            parts.push.apply(parts, indent2(generateRuleFunction(rule)));
	            parts.push("");
	        });
	        if (ast.initializer) {
	            if (Array.isArray(ast.initializer)) {
	                for (var _c = 0, _d = ast.initializer; _c < _d.length; _c++) {
	                    var init = _d[_c];
	                    parts.push(ast2SourceNode(init));
	                    parts.push("");
	                }
	            }
	            else {
	                parts.push(ast2SourceNode(ast.initializer));
	                parts.push("");
	            }
	        }
	        parts.push("  peg$result = peg$startRuleFunction();", "", "  if (options.peg$library) {", "    return /** @type {any} */ ({", "      peg$result,", "      peg$currPos,", "      peg$FAILED,", "      peg$maxFailExpected,", "      peg$maxFailPos", "    });", "  }", "  if (peg$result !== peg$FAILED && peg$currPos === input.length) {", "    return peg$result;", "  } else {", "    if (peg$result !== peg$FAILED && peg$currPos < input.length) {", "      peg$fail(peg$endExpectation());", "    }", "", "    throw peg$buildStructuredError(", "      peg$maxFailExpected,", "      peg$maxFailPos < input.length ? input.charAt(peg$maxFailPos) : null,", "      peg$maxFailPos < input.length", "        ? peg$computeLocation(peg$maxFailPos, peg$maxFailPos + 1)", "        : peg$computeLocation(peg$maxFailPos, peg$maxFailPos)", "    );", "  }", "}");
	        return new SourceNode(null, null, options.grammarSource, parts.map(function (s) { return (s instanceof SourceNode ? s : s + "\n"); }));
	    }
	    function generateWrapper(toplevelCode) {
	        function generateGeneratedByComment() {
	            return [
	                "// @generated by Peggy ".concat(VERSION$1, "."),
	                "//",
	                "// https://peggyjs.org/",
	            ];
	        }
	        function generateParserObject() {
	            var res = ["{"];
	            if (options.trace) {
	                res.push("  DefaultTracer: peg$DefaultTracer,");
	            }
	            if (options.allowedStartRules) {
	                res.push("  StartRules: [" + options.allowedStartRules.map(function (r) { return '"' + r + '"'; }).join(", ") + "],");
	            }
	            res.push("  SyntaxError: peg$SyntaxError,", "  parse: peg$parse");
	            res.push("}");
	            return res.join("\n");
	        }
	        var generators = {
	            bare: function () {
	                if ((Object.keys(dependencies).length > 0)
	                    || (ast.imports.length > 0)) {
	                    throw new Error("Dependencies not supported in format 'bare'.");
	                }
	                return __spreadArray$2(__spreadArray$2([], generateGeneratedByComment(), true), [
	                    "(function() {",
	                    "  \"use strict\";",
	                    "",
	                    toplevelCode,
	                    "",
	                    indent2("return " + generateParserObject() + ";"),
	                    "})()",
	                ], false);
	            },
	            commonjs: function () {
	                var dependencyVars = Object.keys(dependencies);
	                var parts = generateGeneratedByComment();
	                parts.push("", "\"use strict\";", "");
	                if (dependencyVars.length > 0) {
	                    dependencyVars.forEach(function (variable) {
	                        parts.push("var " + variable
	                            + " = require(\""
	                            + stringEscape(dependencies[variable])
	                            + "\");");
	                    });
	                    parts.push("");
	                }
	                var impLen = ast.imports.length;
	                for (var i = 0; i < impLen; i++) {
	                    parts.push("var " + gi(i)
	                        + " = require(\""
	                        + stringEscape(ast.imports[i].from.module)
	                        + "\");");
	                }
	                parts.push("", toplevelCode, "", "module.exports = " + generateParserObject() + ";");
	                return parts;
	            },
	            es: function () {
	                var dependencyVars = Object.keys(dependencies);
	                var parts = generateGeneratedByComment();
	                parts.push("");
	                if (dependencyVars.length > 0) {
	                    dependencyVars.forEach(function (variable) {
	                        parts.push("import " + variable
	                            + " from \""
	                            + stringEscape(dependencies[variable])
	                            + "\";");
	                    });
	                    parts.push("");
	                }
	                for (var i = 0; i < ast.imports.length; i++) {
	                    parts.push("import * as " + gi(i)
	                        + " from \""
	                        + stringEscape(ast.imports[i].from.module)
	                        + "\";");
	                }
	                parts.push("", toplevelCode, "");
	                parts.push("const peg$allowedStartRules = [", "  " + (options.allowedStartRules ? options.allowedStartRules.map(function (r) { return '"' + r + '"'; }).join(",\n  ") : ""), "];", "");
	                parts.push("export {");
	                if (options.trace) {
	                    parts.push("  peg$DefaultTracer as DefaultTracer,");
	                }
	                parts.push("  peg$allowedStartRules as StartRules,", "  peg$SyntaxError as SyntaxError,", "  peg$parse as parse", "};");
	                return parts;
	            },
	            amd: function () {
	                if (ast.imports.length > 0) {
	                    throw new Error("Imports are not supported in format 'amd'.");
	                }
	                var dependencyVars = Object.keys(dependencies);
	                var dependencyIds = dependencyVars.map(function (v) { return dependencies[v]; });
	                var deps = "["
	                    + dependencyIds.map(function (id) { return "\"" + stringEscape(id) + "\""; }).join(", ")
	                    + "]";
	                var params = dependencyVars.join(", ");
	                return __spreadArray$2(__spreadArray$2([], generateGeneratedByComment(), true), [
	                    "define(" + deps + ", function(" + params + ") {",
	                    "  \"use strict\";",
	                    "",
	                    toplevelCode,
	                    "",
	                    indent2("return " + generateParserObject() + ";"),
	                    "});",
	                ], false);
	            },
	            globals: function () {
	                if ((Object.keys(dependencies).length > 0)
	                    || (ast.imports.length > 0)) {
	                    throw new Error("Dependencies not supported in format 'globals'.");
	                }
	                if (!options.exportVar) {
	                    throw new Error("No export variable defined");
	                }
	                return __spreadArray$2(__spreadArray$2([], generateGeneratedByComment(), true), [
	                    "(function(root) {",
	                    "  \"use strict\";",
	                    "",
	                    toplevelCode,
	                    "",
	                    indent2("root." + options.exportVar + " = " + generateParserObject() + ";"),
	                    "})(this);",
	                ], false);
	            },
	            umd: function () {
	                if (ast.imports.length > 0) {
	                    throw new Error("Imports are not supported in format 'umd'.");
	                }
	                var dependencyVars = Object.keys(dependencies);
	                var dependencyIds = dependencyVars.map(function (v) { return dependencies[v]; });
	                var deps = "["
	                    + dependencyIds.map(function (id) { return "\"" + stringEscape(id) + "\""; }).join(", ")
	                    + "]";
	                var requires = dependencyIds.map(function (id) { return "require(\"" + stringEscape(id) + "\")"; }).join(", ");
	                var params = dependencyVars.join(", ");
	                var parts = generateGeneratedByComment();
	                parts.push("(function(root, factory) {", "  if (typeof define === \"function\" && define.amd) {", "    define(" + deps + ", factory);", "  } else if (typeof module === \"object\" && module.exports) {", "    module.exports = factory(" + requires + ");");
	                if (options.exportVar) {
	                    parts.push("  } else {", "    root." + options.exportVar + " = factory();");
	                }
	                parts.push("  }", "})(this, function(" + params + ") {", "  \"use strict\";", "", toplevelCode, "", indent2("return " + generateParserObject() + ";"), "});");
	                return parts;
	            },
	        };
	        var parts = generators[options.format || "bare"]();
	        return new SourceNode(null, null, options.grammarSource, parts.map(function (s) { return (s instanceof SourceNode ? s : s + "\n"); }));
	    }
	    ast.code = generateWrapper(generateToplevel());
	}
	var generateJs = generateJS$1;

	var asts$4 = asts_1;
	var visitor$8 = visitor_1;
	function removeProxyRules$1(ast, options, session) {
	    function isProxyRule(node) {
	        return node.type === "rule" && node.expression.type === "rule_ref";
	    }
	    function replaceRuleRefs(ast, from, to) {
	        var replace = visitor$8.build({
	            rule_ref: function (node) {
	                if (node.name === from) {
	                    node.name = to;
	                    session.info("Proxy rule \"".concat(from, "\" replaced by the rule \"").concat(to, "\""), node.location, [{
	                            message: "This rule will be used",
	                            location: asts$4.findRule(ast, to).nameLocation,
	                        }]);
	                }
	            },
	        });
	        replace(ast);
	    }
	    var indices = [];
	    ast.rules.forEach(function (rule, i) {
	        if (isProxyRule(rule)) {
	            replaceRuleRefs(ast, rule.name, rule.expression.name);
	            if (options.allowedStartRules.indexOf(rule.name) === -1) {
	                indices.push(i);
	            }
	        }
	    });
	    indices.reverse();
	    indices.forEach(function (i) { ast.rules.splice(i, 1); });
	}
	var removeProxyRules_1 = removeProxyRules$1;

	var __assign = (commonjsGlobal && commonjsGlobal.__assign) || function () {
	    __assign = Object.assign || function(t) {
	        for (var s, i = 1, n = arguments.length; i < n; i++) {
	            s = arguments[i];
	            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
	                t[p] = s[p];
	        }
	        return t;
	    };
	    return __assign.apply(this, arguments);
	};
	var __spreadArray$1 = (commonjsGlobal && commonjsGlobal.__spreadArray) || function (to, from, pack) {
	    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
	        if (ar || !(i in from)) {
	            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
	            ar[i] = from[i];
	        }
	    }
	    return to.concat(ar || Array.prototype.slice.call(from));
	};
	var visitor$7 = visitor_1;
	function cloneOver(target, source) {
	    var t = (target);
	    var s = (source);
	    Object.keys(t).forEach(function (key) { return delete t[key]; });
	    Object.keys(s).forEach(function (key) { t[key] = s[key]; });
	}
	function cleanParts(parts) {
	    parts.sort(function (a, b) {
	        var _a = Array.isArray(a) ? a : [a, a], aStart = _a[0], aEnd = _a[1];
	        var _b = Array.isArray(b) ? b : [b, b], bStart = _b[0], bEnd = _b[1];
	        if (aStart !== bStart) {
	            return aStart < bStart ? -1 : 1;
	        }
	        if (aEnd !== bEnd) {
	            return aEnd > bEnd ? -1 : 1;
	        }
	        return 0;
	    });
	    var prevStart = "";
	    var prevEnd = "";
	    for (var i = 0; i < parts.length; i++) {
	        var part = parts[i];
	        var _a = Array.isArray(part) ? part : [part, part], curStart = _a[0], curEnd = _a[1];
	        if (curEnd <= prevEnd) {
	            parts.splice(i--, 1);
	            continue;
	        }
	        if (prevEnd.charCodeAt(0) + 1 >= curStart.charCodeAt(0)) {
	            parts.splice(i--, 1);
	            parts[i] = [prevStart, prevEnd = curEnd];
	            continue;
	        }
	        prevStart = curStart;
	        prevEnd = curEnd;
	    }
	    return parts;
	}
	function mergeCharacterClasses$1(ast) {
	    var rules = Object.create(null);
	    ast.rules.forEach(function (rule) { return (rules[rule.name] = rule.expression); });
	    var processedRules = Object.create(null);
	    var _a = [
	        function (node, clone) {
	            if (node.type === "class" && !node.inverted) {
	                if (clone) {
	                    node = __assign({}, node);
	                    node.parts = __spreadArray$1([], node.parts, true);
	                }
	                return node;
	            }
	            if (node.type === "literal" && node.value.length === 1) {
	                return {
	                    type: "class",
	                    parts: [node.value],
	                    inverted: false,
	                    ignoreCase: node.ignoreCase,
	                    location: node.location,
	                };
	            }
	            if (node.type === "rule_ref") {
	                var ref = rules[node.name];
	                if (ref) {
	                    if (!processedRules[node.name]) {
	                        processedRules[node.name] = true;
	                        merge(ref);
	                    }
	                    var cls = asClass(ref, true);
	                    if (cls) {
	                        cls.location = node.location;
	                    }
	                    return cls;
	                }
	            }
	            return null;
	        },
	        visitor$7.build({
	            choice: function (node) {
	                var prev = null;
	                var changed = false;
	                node.alternatives.forEach(function (alt, i) {
	                    var _a;
	                    merge(alt);
	                    var cls = asClass(alt);
	                    if (!cls) {
	                        prev = null;
	                        return;
	                    }
	                    if (prev && prev.ignoreCase === cls.ignoreCase) {
	                        (_a = prev.parts).push.apply(_a, cls.parts);
	                        node.alternatives[i - 1] = prev;
	                        node.alternatives[i] = prev;
	                        prev.location = {
	                            source: prev.location.source,
	                            start: prev.location.start,
	                            end: cls.location.end,
	                        };
	                        changed = true;
	                    }
	                    else {
	                        prev = cls;
	                    }
	                });
	                if (changed) {
	                    node.alternatives = node.alternatives.filter(function (alt, i, arr) { return !i || alt !== arr[i - 1]; });
	                    node.alternatives.forEach(function (alt, i) {
	                        if (alt.type === "class") {
	                            alt.parts = cleanParts(alt.parts);
	                            if (alt.parts.length === 1
	                                && !Array.isArray(alt.parts[0])
	                                && !alt.inverted) {
	                                node.alternatives[i] = {
	                                    type: "literal",
	                                    value: alt.parts[0],
	                                    ignoreCase: alt.ignoreCase,
	                                    location: alt.location,
	                                };
	                            }
	                        }
	                    });
	                    if (node.alternatives.length === 1) {
	                        cloneOver(node, node.alternatives[0]);
	                    }
	                }
	            },
	            text: function (node) {
	                merge(node.expression);
	                if (node.expression.type === "class"
	                    || node.expression.type === "literal") {
	                    var location = node.location;
	                    cloneOver(node, node.expression);
	                    node.location = location;
	                }
	            },
	        }),
	    ], asClass = _a[0], merge = _a[1];
	    ast.rules.forEach(function (rule) {
	        processedRules[rule.name] = true;
	        merge(rule.expression);
	    });
	}
	var mergeCharacterClasses_1 = mergeCharacterClasses$1;

	function reportDuplicateImports$1(ast, _options, session) {
	    var all = {};
	    for (var _i = 0, _a = ast.imports; _i < _a.length; _i++) {
	        var imp = _a[_i];
	        for (var _b = 0, _c = imp.what; _b < _c.length; _b++) {
	            var what = _c[_b];
	            if (what.type === "import_binding_all") {
	                if (Object.prototype.hasOwnProperty.call(all, what.binding)) {
	                    session.error("Module \"".concat(what.binding, "\" is already imported"), what.location, [{
	                            message: "Original module location",
	                            location: all[what.binding],
	                        }]);
	                }
	                all[what.binding] = what.location;
	            }
	        }
	    }
	}
	var reportDuplicateImports_1 = reportDuplicateImports$1;

	var visitor$6 = visitor_1;
	function reportDuplicateLabels$1(ast, options, session) {
	    function cloneEnv(env) {
	        var clone = {};
	        Object.keys(env).forEach(function (name) {
	            clone[name] = env[name];
	        });
	        return clone;
	    }
	    function checkExpressionWithClonedEnv(node, env) {
	        check(node.expression, cloneEnv(env));
	    }
	    var check = visitor$6.build({
	        rule: function (node) {
	            check(node.expression, {});
	        },
	        choice: function (node, env) {
	            node.alternatives.forEach(function (alternative) {
	                check(alternative, cloneEnv(env));
	            });
	        },
	        action: checkExpressionWithClonedEnv,
	        labeled: function (node, env) {
	            var label = node.label;
	            if (label && Object.prototype.hasOwnProperty.call(env, label)) {
	                session.error("Label \"".concat(node.label, "\" is already defined"), node.labelLocation, [{
	                        message: "Original label location",
	                        location: env[label],
	                    }]);
	            }
	            check(node.expression, env);
	            env[node.label] = node.labelLocation;
	        },
	        text: checkExpressionWithClonedEnv,
	        simple_and: checkExpressionWithClonedEnv,
	        simple_not: checkExpressionWithClonedEnv,
	        optional: checkExpressionWithClonedEnv,
	        zero_or_more: checkExpressionWithClonedEnv,
	        one_or_more: checkExpressionWithClonedEnv,
	        repeated: function (node, env) {
	            if (node.delimiter) {
	                check(node.delimiter, cloneEnv(env));
	            }
	            check(node.expression, cloneEnv(env));
	        },
	        group: checkExpressionWithClonedEnv,
	    });
	    check(ast);
	}
	var reportDuplicateLabels_1 = reportDuplicateLabels$1;

	var visitor$5 = visitor_1;
	function reportDuplicateRules$1(ast, options, session) {
	    var rules = {};
	    var check = visitor$5.build({
	        rule: function (node) {
	            if (Object.prototype.hasOwnProperty.call(rules, node.name)) {
	                session.error("Rule \"".concat(node.name, "\" is already defined"), node.nameLocation, [{
	                        message: "Original rule location",
	                        location: rules[node.name],
	                    }]);
	                return;
	            }
	            rules[node.name] = node.nameLocation;
	        },
	    });
	    check(ast);
	}
	var reportDuplicateRules_1 = reportDuplicateRules$1;

	var asts$3 = asts_1;
	var visitor$4 = visitor_1;
	function reportInfiniteRecursion$1(ast, options, session) {
	    var visitedRules = [];
	    var backtraceRefs = [];
	    var check = visitor$4.build({
	        rule: function (node) {
	            if (session.errors > 0) {
	                return;
	            }
	            visitedRules.push(node.name);
	            check(node.expression);
	            visitedRules.pop();
	        },
	        sequence: function (node) {
	            if (session.errors > 0) {
	                return;
	            }
	            node.elements.every(function (element) {
	                check(element);
	                if (session.errors > 0) {
	                    return false;
	                }
	                return !asts$3.alwaysConsumesOnSuccess(ast, element);
	            });
	        },
	        repeated: function (node) {
	            if (session.errors > 0) {
	                return;
	            }
	            check(node.expression);
	            if (node.delimiter
	                && !asts$3.alwaysConsumesOnSuccess(ast, node.expression)) {
	                check(node.delimiter);
	            }
	        },
	        rule_ref: function (node) {
	            if (session.errors > 0) {
	                return;
	            }
	            backtraceRefs.push(node);
	            var rule = asts$3.findRule(ast, node.name);
	            if (visitedRules.indexOf(node.name) !== -1) {
	                visitedRules.push(node.name);
	                session.error("Possible infinite loop when parsing (left recursion: "
	                    + visitedRules.join(" -> ")
	                    + ")", rule.nameLocation, backtraceRefs.map(function (ref, i, a) { return ({
	                    message: i + 1 !== a.length
	                        ? "Step ".concat(i + 1, ": call of the rule \"").concat(ref.name, "\" without input consumption")
	                        : "Step ".concat(i + 1, ": call itself without input consumption - left recursion"),
	                    location: ref.location,
	                }); }));
	                return;
	            }
	            if (rule) {
	                check(rule);
	            }
	            backtraceRefs.pop();
	        },
	    });
	    check(ast);
	}
	var reportInfiniteRecursion_1 = reportInfiniteRecursion$1;

	var asts$2 = asts_1;
	var visitor$3 = visitor_1;
	function reportInfiniteRepetition$1(ast, options, session) {
	    var check = visitor$3.build({
	        zero_or_more: function (node) {
	            if (!asts$2.alwaysConsumesOnSuccess(ast, node.expression)) {
	                session.error("Possible infinite loop when parsing (repetition used with an expression that may not consume any input)", node.location);
	            }
	        },
	        one_or_more: function (node) {
	            if (!asts$2.alwaysConsumesOnSuccess(ast, node.expression)) {
	                session.error("Possible infinite loop when parsing (repetition used with an expression that may not consume any input)", node.location);
	            }
	        },
	        repeated: function (node) {
	            if (node.delimiter) {
	                check(node.delimiter);
	            }
	            if (asts$2.alwaysConsumesOnSuccess(ast, node.expression)
	                || (node.delimiter
	                    && asts$2.alwaysConsumesOnSuccess(ast, node.delimiter))) {
	                return;
	            }
	            if (node.max.value === null) {
	                session.error("Possible infinite loop when parsing (unbounded range repetition used with an expression that may not consume any input)", node.location);
	            }
	            else {
	                var min = node.min ? node.min : node.max;
	                session.warning(min.type === "constant" && node.max.type === "constant"
	                    ? "An expression may not consume any input and may always match ".concat(node.max.value, " times")
	                    : "An expression may not consume any input and may always match with a maximum repetition count", node.location);
	            }
	        },
	    });
	    check(ast);
	}
	var reportInfiniteRepetition_1 = reportInfiniteRepetition$1;

	var asts$1 = asts_1;
	var visitor$2 = visitor_1;
	function reportUndefinedRules$1(ast, options, session) {
	    var check = visitor$2.build({
	        rule_ref: function (node) {
	            if (!asts$1.findRule(ast, node.name)) {
	                session.error("Rule \"".concat(node.name, "\" is not defined"), node.location);
	            }
	        },
	    });
	    check(ast);
	}
	var reportUndefinedRules_1 = reportUndefinedRules$1;

	var visitor$1 = visitor_1;
	function reportIncorrectPlucking$1(ast, options, session) {
	    var check = visitor$1.build({
	        action: function (node) {
	            check(node.expression, node);
	        },
	        labeled: function (node, action) {
	            if (node.pick) {
	                if (action) {
	                    session.error("\"@\" cannot be used with an action block", node.labelLocation, [{
	                            message: "Action block location",
	                            location: action.codeLocation,
	                        }]);
	                }
	            }
	            check(node.expression);
	        },
	    });
	    check(ast);
	}
	var reportIncorrectPlucking_1 = reportIncorrectPlucking$1;

	var __spreadArray = (commonjsGlobal && commonjsGlobal.__spreadArray) || function (to, from, pack) {
	    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
	        if (ar || !(i in from)) {
	            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
	            ar[i] = from[i];
	        }
	    }
	    return to.concat(ar || Array.prototype.slice.call(from));
	};
	var GrammarError$1 = grammarError;
	var Defaults = (function () {
	    function Defaults(options) {
	        options = typeof options !== "undefined" ? options : {};
	        if (typeof options.error === "function") {
	            this.error = options.error;
	        }
	        if (typeof options.warning === "function") {
	            this.warning = options.warning;
	        }
	        if (typeof options.info === "function") {
	            this.info = options.info;
	        }
	    }
	    Defaults.prototype.error = function () {
	    };
	    Defaults.prototype.warning = function () {
	    };
	    Defaults.prototype.info = function () {
	    };
	    return Defaults;
	}());
	var Session$1 = (function () {
	    function Session(options) {
	        this._callbacks = new Defaults(options);
	        this._firstError = null;
	        this.errors = 0;
	        this.problems = [];
	        this.stage = null;
	    }
	    Session.prototype.error = function () {
	        var _a;
	        var args = [];
	        for (var _i = 0; _i < arguments.length; _i++) {
	            args[_i] = arguments[_i];
	        }
	        ++this.errors;
	        if (this._firstError === null) {
	            this._firstError = new (GrammarError$1.bind.apply(GrammarError$1, __spreadArray([void 0], args, false)))();
	            this._firstError.stage = this.stage;
	            this._firstError.problems = this.problems;
	        }
	        this.problems.push(__spreadArray(["error"], args, true));
	        (_a = this._callbacks).error.apply(_a, __spreadArray([this.stage], args, false));
	    };
	    Session.prototype.warning = function () {
	        var _a;
	        var args = [];
	        for (var _i = 0; _i < arguments.length; _i++) {
	            args[_i] = arguments[_i];
	        }
	        this.problems.push(__spreadArray(["warning"], args, true));
	        (_a = this._callbacks).warning.apply(_a, __spreadArray([this.stage], args, false));
	    };
	    Session.prototype.info = function () {
	        var _a;
	        var args = [];
	        for (var _i = 0; _i < arguments.length; _i++) {
	            args[_i] = arguments[_i];
	        }
	        this.problems.push(__spreadArray(["info"], args, true));
	        (_a = this._callbacks).info.apply(_a, __spreadArray([this.stage], args, false));
	    };
	    Session.prototype.checkErrors = function () {
	        if (this.errors !== 0) {
	            throw this._firstError;
	        }
	    };
	    return Session;
	}());
	var session = Session$1;

	var addImportedRules = addImportedRules_1;
	var fixLibraryNumbers = fixLibraryNumbers_1;
	var generateBytecode = generateBytecode_1;
	var generateJS = generateJs;
	var inferenceMatchResult = inferenceMatchResult_1;
	var removeProxyRules = removeProxyRules_1;
	var mergeCharacterClasses = mergeCharacterClasses_1;
	var reportDuplicateImports = reportDuplicateImports_1;
	var reportDuplicateLabels = reportDuplicateLabels_1;
	var reportDuplicateRules = reportDuplicateRules_1;
	var reportInfiniteRecursion = reportInfiniteRecursion_1;
	var reportInfiniteRepetition = reportInfiniteRepetition_1;
	var reportUndefinedRules = reportUndefinedRules_1;
	var reportIncorrectPlucking = reportIncorrectPlucking_1;
	var Session = session;
	var visitor = visitor_1;
	var base64 = utils.base64;
	function processOptions(options, defaults) {
	    var processedOptions = {};
	    Object.keys(options).forEach(function (name) {
	        processedOptions[name] = options[name];
	    });
	    Object.keys(defaults).forEach(function (name) {
	        if (!Object.prototype.hasOwnProperty.call(processedOptions, name)) {
	            processedOptions[name] = defaults[name];
	        }
	    });
	    return processedOptions;
	}
	function isSourceMapCapable(target) {
	    if (typeof target === "string") {
	        return target.length > 0;
	    }
	    return target && (typeof target.offset === "function");
	}
	var compiler$1 = {
	    visitor: visitor,
	    passes: {
	        prepare: [
	            addImportedRules,
	            reportInfiniteRecursion,
	        ],
	        check: [
	            reportUndefinedRules,
	            reportDuplicateRules,
	            reportDuplicateLabels,
	            reportInfiniteRepetition,
	            reportIncorrectPlucking,
	            reportDuplicateImports,
	        ],
	        transform: [
	            fixLibraryNumbers,
	            removeProxyRules,
	            mergeCharacterClasses,
	            inferenceMatchResult,
	        ],
	        generate: [
	            generateBytecode,
	            generateJS,
	        ],
	    },
	    compile: function (ast, passes, options) {
	        options = options !== undefined ? options : {};
	        var defaultStartRules = [ast.rules[0].name];
	        options = processOptions(options, {
	            allowedStartRules: defaultStartRules,
	            cache: false,
	            dependencies: {},
	            exportVar: null,
	            format: "bare",
	            output: "parser",
	            trace: false,
	        });
	        if (options.allowedStartRules === null
	            || options.allowedStartRules === undefined) {
	            options.allowedStartRules = defaultStartRules;
	        }
	        if (!Array.isArray(options.allowedStartRules)) {
	            throw new Error("allowedStartRules must be an array");
	        }
	        if (options.allowedStartRules.length === 0) {
	            options.allowedStartRules = defaultStartRules;
	        }
	        var allRules = ast.rules.map(function (r) { return r.name; });
	        if (options.allowedStartRules.some(function (r) { return r === "*"; })) {
	            options.allowedStartRules = allRules;
	        }
	        else {
	            for (var _i = 0, _a = options.allowedStartRules; _i < _a.length; _i++) {
	                var rule = _a[_i];
	                if (allRules.indexOf(rule) === -1) {
	                    throw new Error("Unknown start rule \"".concat(rule, "\""));
	                }
	            }
	        }
	        if (((options.output === "source-and-map")
	            || (options.output === "source-with-inline-map"))
	            && !isSourceMapCapable(options.grammarSource)) {
	            throw new Error("Must provide grammarSource (as a string or GrammarLocation) in order to generate source maps");
	        }
	        var session = new Session(options);
	        Object.keys(passes).forEach(function (stage) {
	            session.stage = stage;
	            session.info("Process stage ".concat(stage));
	            passes[stage].forEach(function (pass) {
	                session.info("Process pass ".concat(stage, ".").concat(pass.name));
	                pass(ast, options, session);
	            });
	            session.checkErrors();
	        });
	        switch (options.output) {
	            case "parser":
	                return eval(ast.code.toString());
	            case "source":
	                return ast.code.toString();
	            case "source-and-map":
	                return ast.code;
	            case "source-with-inline-map": {
	                if (typeof TextEncoder === "undefined") {
	                    throw new Error("TextEncoder is not supported by this platform");
	                }
	                var sourceMap = ast.code.toStringWithSourceMap();
	                var encoder = new TextEncoder();
	                var b64 = base64(encoder.encode(JSON.stringify(sourceMap.map.toJSON())));
	                return sourceMap.code + "//# sourceMappingURL=data:application/json;charset=utf-8;base64,".concat(b64, "\n");
	            }
	            case "ast":
	                return ast;
	            default:
	                throw new Error("Invalid output format: " + options.output + ".");
	        }
	    },
	};
	var compiler_1 = compiler$1;

	var GrammarError = grammarError;
	var GrammarLocation = grammarLocation;
	var asts = asts_1;
	var compiler = compiler_1;
	var parser = parser$1;
	var VERSION = version;
	var RESERVED_WORDS = [
	    "break",
	    "case",
	    "catch",
	    "class",
	    "const",
	    "continue",
	    "debugger",
	    "default",
	    "delete",
	    "do",
	    "else",
	    "export",
	    "extends",
	    "finally",
	    "for",
	    "function",
	    "if",
	    "import",
	    "in",
	    "instanceof",
	    "new",
	    "return",
	    "super",
	    "switch",
	    "this",
	    "throw",
	    "try",
	    "typeof",
	    "var",
	    "void",
	    "while",
	    "with",
	    "null",
	    "true",
	    "false",
	    "enum",
	    "implements",
	    "interface",
	    "let",
	    "package",
	    "private",
	    "protected",
	    "public",
	    "static",
	    "yield",
	    "await",
	    "arguments",
	    "eval",
	];
	var peg = {
	    VERSION: VERSION,
	    RESERVED_WORDS: RESERVED_WORDS,
	    GrammarError: GrammarError,
	    GrammarLocation: GrammarLocation,
	    parser: parser,
	    compiler: compiler,
	    generate: function (grammar, options) {
	        options = options !== undefined ? options : {};
	        function copyPasses(passes) {
	            var converted = {};
	            Object.keys(passes).forEach(function (stage) {
	                converted[stage] = passes[stage].slice();
	            });
	            return converted;
	        }
	        var plugins = "plugins" in options ? options.plugins : [];
	        var config = {
	            parser: peg.parser,
	            passes: copyPasses(peg.compiler.passes),
	            reservedWords: peg.RESERVED_WORDS.slice(),
	        };
	        plugins.forEach(function (p) { p.use(config, options); });
	        if (!Array.isArray(grammar)) {
	            grammar = [{
	                    source: options.grammarSource,
	                    text: grammar,
	                }];
	        }
	        var combined = asts.combine(grammar.map(function (_a) {
	            var source = _a.source, text = _a.text;
	            return config.parser.parse(text, {
	                grammarSource: source,
	                reservedWords: config.reservedWords,
	            });
	        }));
	        return peg.compiler.compile(combined, config.passes, options);
	    },
	};
	var peg_1 = peg;


	var peg$1 = /*@__PURE__*/getDefaultExportFromCjs(peg_1);

	return peg$1;

}));
