/* OOP helper. Prototype-Class
 * Simple JavaScript Inheritance
 * By John Resig http://ejohn.org/
 * MIT Licensed.
 * Inspired by base2 and Prototype
 */
(function(){
    var initializing = false, fnTest = /xyz/.test(function(){xyz;}) ? /\b_super\b/ : /.*/;

    // The base Class implementation (does nothing)
    this.Class = function(){};

    // Create a new Class that inherits from this class
    Class.extend = function(prop) {
        var _super = this.prototype;

        // Instantiate a base class (but only create the instance,
        // don't run the init constructor)
        initializing = true;
        var prototype = new this();
        initializing = false;

        // Copy the properties over onto the new prototype
        for (var name in prop) {
            // Check if we're overwriting an existing function
            if (typeof prop[name] == 'function' && typeof _super[name] == "function" && fnTest.test(prop[name])) {
                var closure = function(name, fn) {
                    return function() {
                        var tmp = this._super;

                        // Add a new ._super() method that is the same method
                        // but on the super-class
                        this._super = _super[name];

                        // The method only need to be bound temporarily, so we
                        // remove it when we're done executing.
                        var ret = fn.apply(this, make_self(this, arguments));
                        this._super = tmp;

                        return ret;
                    };
                };
                prototype[name] = closure(name, prop[name])
            } else if (typeof prop[name] == 'function') {
                var closure = function(name, fn) {
                    return function() {
                        return fn.apply(this, make_self(this, arguments));
                    }
                }
                prototype[name] = closure(name, prop[name])
            } else {
                prototype[name] = prop[name];
            }
        }

        // The dummy class constructor
        function Class() {
            // All construction is actually done in the init method
            if ( !initializing && this.init ) {
                // We don't need make_self here, since it is calling the one we made above.
                this.init.apply(this, arguments);
            }
        }

        // Populate our constructed prototype object
        Class.prototype = prototype;

        // Enforce the constructor to be what we expect
        Class.prototype.constructor = Class;

        // And make this class extendable
        Class.extend = arguments.callee;

        return Class;
    };
})();

/* Take an arguments object, which looks and acts a lot like an array, but
 * isn't quite, and put something at it's front.
 */
var make_self = function(first, args) {
    var new_args = [first];
    var i;
    for (i=0; i < args.length; i++) {
        new_args[i+1] = args[i];
    }
    return new_args;
};

/* Give strings a format function.
 *
 *     "Hello {0}, how are you this fine {1}?".format(user_name, time_of_day);
 *
 * Returns "Hello Mike, how are you this fine morning?"
 */
String.prototype.format = function() {
    var formatted = this;
    for (var i = 0; i < arguments.length; i++) {
        var regexp = new RegExp('\\{'+i+'\\}', 'gi');
        formatted = formatted.replace(regexp, arguments[i]);
    }
    return formatted;
}

// Cross browser utility to get the offset within an element of a mouse event.
function getCursorPosition(e, target) {
    var x, y;
    if (e.offsetX != undefined && e.offsetY != undefined) {
        // Chrome
        x = e.offsetX;
        y = e.offsetY;
    } else if (e.pageX != undefined && e.pageY != undefined) {
        // Firefox
        x = e.pageX - $(target).position().left;
        x -= parseInt($(target).css('margin-left'));
        y = e.pageY - $(target).position().top;
        y -= parseInt($(target).css('margin-top'));
    } else {
        // IE?
        x = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
        y = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
    }

    return {'x': x, 'y': y};
}

/* Convert a function from rgb(255, 0, 0) notation (native to javascript)
 * to #FF0000 (native to CSS) */
function colorToHex(color) {
    if (color.substr(0, 1) === '#') {
        return color;
    }
    var digits = /(.*?)rgb\((\d+), (\d+), (\d+)\)/.exec(color);

    var red = parseInt(digits[2]);
    var green = parseInt(digits[3]);
    var blue = parseInt(digits[4]);

    var rgb = blue | (green << 8) | (red << 16);
    return digits[1] + '#' + rgb.toString(16);
};
