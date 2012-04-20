var Tool = Class.extend({
    type: "tool",

    init: function(self, board) {
        self.board = board;
    },

    mousedown: function() {},
    mouseup: function() {},
    mousemove: function() {},
    click: function() {},
    dragstart: function() {},
    drag: function() {},
    dragend: function() {},
});

var MoveTool = Tool.extend({
    type: "arrow-tool",

    init: function(self, board) {
        //self._super(board);
        self.board = board;
        self.elem = $('<div class="button icon-arrow" id="tool_arrow">Arrow</div>')
            .appendTo('#tools')
            .bind('click', function() {
                self.board.set_tool(self);
            }
        );
    },

    click: function(self, e, target) {
        self._super(e, target);

        if (target) {
            // toggle
            target.selected ^= true;
        } else {
            // deselect
            var selected = self.board.selected();
            for (i = 0; i < selected.length; i++) {
                selected[i].selected = false;
            }
        }
    },

    dragstart: function(self, e, target) {
        if (target) {
            self.last_drag_x = e.real_x;
            self.last_drag_y = e.real_y;

            // If we clicked on a non-selected element, unselect everything and
            // select it.
            if (!target.selected) {
                for (var i=0; i<self.board.nodes.length; i++) {
                    self.board.nodes[i].selected = false;
                }
                for (var i=0; i<self.board.elements.length; i++) {
                    self.board.elements[i].selected = false;
                }
                target.selected = true;
            }

            // Make snapping cool.
            if (self.board.snap) {
                var p = self.board.snap_to(target.x, target.y);
                for (var i=0; i<self.board.nodes.length; i++) {
                    var it = self.board.nodes[i];
                    if (it.selected) {
                        it.x += p.x - target.x;
                        it.y += p.y - target.y;
                    }
                }
                for (var i=0; i<self.board.elements.length; i++) {
                    var it = self.board.elements[i];
                    if (it.selected) {
                        it.x += p.x - target.x;
                        it.y += p.y - target.y;
                    }
                }
                target.x = p.x;
                target.y = p.y;
            }
        }
    },

    drag: function(self, e, target) {
        if (target) {
            var dx = e.real_x - self.last_drag_x;
            var dy = e.real_y - self.last_drag_y;

            if (self.board.snap) {
                dx -= dx % self.board.snap_size;
                dy -= dy % self.board.snap_size;
            }

            for (var i=0; i<self.board.nodes.length; i++) {
                if (self.board.nodes[i].selected) {
                    self.board.nodes[i].x += dx;
                    self.board.nodes[i].y += dy;
                }
            }
            for (var i=0; i<self.board.elements.length; i++) {
                if (self.board.elements[i].selected) {
                    var n1 = self.board.elements[i].n1;
                    var n2 = self.board.elements[i].n2;
                    if (!n1.selected) {
                        n1.x += dx;
                        n1.y += dy;
                    }
                    if (!n2.selected) {
                        n2.x += dx;
                        n2.y += dy;
                    }
                }
            }

            self.last_drag_x += dx;
            self.last_drag_y += dy;
        }
    },
});

var NodeTool = Tool.extend({
    type: "node-tool",
    init: function(self, board) {
        self._super(board);

        self.elem = $('<div class="button icon-node" id="tool_node">Nodes</div>')
            .appendTo('#tools')
            .bind('click', function() {
                self.board.set_tool(self);
            }
        );
    },

    click: function(self, e, target) {
        console.log('NodeTool.click');
        self._super(e, target);
        var p = self.board.snap_to(e.real_x, e.real_y);
        var n = new Node(self.board, p.x, p.y);
        if (self.board.deserializing == false) {
            self.board.undoAdd();
        }
    },
});

var WireTool = Tool.extend({
    type: "wire-tool",

    init: function(self, board) {
        self._super(board);
        self.make_elem();
        self.line_proto = ProtoWire;
        self.line_type = Wire;
    },

    make_elem: function(self) {
        self.elem = $('<div class="button icon-wire" id="tool_wire">Wires</div>')
            .appendTo('#tools')
            .bind('click', function() {
                self.board.set_tool(self);
            }
        );
    },

    dragstart: function(self, e, target) {
        console.log('WireTool.dragstart');
        self._super(e, target);
        var p = self.board.snap_to(e.real_x, e.real_y);
        if (self.temp_line) {
            // Why do we still have one of these?
            self.temp_line.remove();
            self.temp_line = null;
        }
        if (target && target.type == "node") {
            self.temp_end_node = {'x': e.real_x, 'y': e.real_y};
            self.temp_line = new self.line_proto(self.board, target, self.temp_end_node, 1);
        }
    },

    drag: function(self, e, target) {
        self._super(e, target);
        if (self.temp_end_node) {
            self.temp_end_node.x = e.real_x;
            self.temp_end_node.y = e.real_y;
        }
    },

    dragend: function(self, e, target) {
        console.log('WireTool.dragend');
        self._super(e, target);
        var hit = false;
        for (var i=0; i<self.board.nodes.length; i++) {
            var it = self.board.nodes[i];
            if (it.type == 'node' && it.hit_test(e.real_x, e.real_y)) {
                if (it != self.temp_line.n1) {
                    new self.line_type(self.board, self.temp_line.n1, it, 1);
                    self.temp_line.remove();
                    hit = true;
                }
                break;
            }
        }
        if (!hit) {
            self.temp_line.remove();
        } else {
	        self.board.undoAdd();
	    }
        self.temp_line = null;
        self.temp_end_node = null;
    },
});

var ResistorTool = WireTool.extend({
    type: "wire-tool",

    init: function(self, board) {
        self._super(board);
        self.line_proto = ProtoResistor;
        self.line_type = Resistor;
    },

    make_elem: function(self) {
        self.elem = $('<div class="button icon-resistor" id="tool_resistor">Resistors</div>')
            .appendTo('#tools')
            .bind('click', function() {
                self.board.set_tool(self);
            }
        );
    },
});
