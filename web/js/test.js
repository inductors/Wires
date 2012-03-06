$(function() {
    new Foo().write();
    $('body').append('<br>');
    new Bar().write();
});

var Foo = Class.extend({
    init: function(self) {
        self.message = '"Hello, World!"';
    },

    write: function(self) {
        $('body').append('Message is: {0}, value is {1}.'.format(self.message, self.get_val()));
    },

    get_val: function(self) {
        return 5;
    },
});

var Bar = Foo.extend({
    init: function(self) {
        self.message = 'Woohoo!';
        self.mult = 2;
    },

    get_val: function(self) {
        return self._super() * self.mult;
    },
});
