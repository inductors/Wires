/* OOP helper. Prototype-Class
 *
 * Make a class like this
 *
 *    var MyClass = PClass.create({
 *         init: function() {  // this is the constructor
 *             this.thing = 5;
 *         }
 *         add_to: function(n) {
 *             this.thing += n;
 *         }
 *    });
 *
 * Extend a class like this
 *
 *     var MyExtension = MyClass.extend({
 *         init: function() {
 *             this._super();
 *             this.thing *= 2;
 *         }
 *         add_to: function(n) {
 *             this.thing += n*2;
 *         }
 *     });
 */
(function(){
  var isFn = function(fn) { return typeof fn == "function"; };
  PClass = function(){};
  PClass.create = function(proto) {
    var k = function(magic) { // call init only if there's no magic cookie
      if (magic != isFn && isFn(this.init)) this.init.apply(this, arguments);
    };
    k.prototype = new this(isFn); // use our private method as magic cookie
    for (key in proto) (function(fn, sfn){ // create a closure
      k.prototype[key] = !isFn(fn) || !isFn(sfn) ? fn : // add _super method
        function() { this._super = sfn; return fn.apply(this, arguments); };
    })(proto[key], k.prototype[key]);
    k.prototype.constructor = k;
    k.extend = this.extend || this.create;
    return k;
  };
})();

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

