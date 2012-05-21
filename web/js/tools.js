var Tool = Class.extend({
    type: "tool",

    init: function(self, board) {
        self.board = board;
        self._state = {};
    },

    down: function() {},
    up: function() {},
    move: function() {},
    click: function() {},
    dragstart: function() {},
    drag: function() {},
    dragend: function() {},

    state: function(self, id, action) {
        if (action === undefined) {
            action = 'get';
        }
        switch (action) {
            case 'get':
                if (self._state[id] === undefined) {
                    self._state[id] = {};
                }
                return self._state[id];
                break;
            case 'delete':
                self._state[id] = undefined;
                break;
        }
    },
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

    click: function(self, x, y, id, target) {
        self._super(x, y, id, target);

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

    dragstart: function(self, x, y, id, target) {
        if (target) {
            self.state(id).last_drag = {'x': x, 'y': y};

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

            self.state(id).claim = [];
            var selected = self.board.selected();
            for (var i=0; i<selected.length; i++) {
                var elem = selected[i];
                if (!elem.claimed) {
                    self.state(id).claim.push(elem);
                    elem.claimed = true;
                }
            }

            // Make snapping cool.
            if (self.board.snap) {
                var p = self.board.snap_to(target.x, target.y);
                for (var i=0; i<self.state(id).claim.length; i++) {
                    var elem = self.state(id).claim[i];
                    elem.x += p.x - target.x;
                    elem.y += p.y - target.y;
                }
                target.x = p.x;
                target.y = p.y;
            }
        }
    },

    drag: function(self, x, y, id, target) {
        if (target) {
            var dx = x - self.state(id).last_drag.x;
            var dy = y - self.state(id).last_drag.y;

            if (self.board.snap) {
                dx -= dx % self.board.snap_size;
                dy -= dy % self.board.snap_size;
            }

            for (var i=0; i<self.state(id).claim.length; i++) {
                var elem = self.state(id).claim[i];
                if (elem.type == 'node') {
                    self.state(id).claim[i].x += dx;
                    self.state(id).claim[i].y += dy;
                } else {
                    var n1 = self.state(id).claim[i].n1;
                    var n2 = self.state(id).claim[i].n2;
                    if (self.state(id).claim.indexOf(n1) == -1) {
                        n1.x += dx;
                        n1.y += dy;
                    }
                    if (self.state(id).claim.indexOf(n2) == -1) {
                        n2.x += dx;
                        n2.y += dy;
                    }
                }
            }

            self.state(id).last_drag.x += dx;
            self.state(id).last_drag.y += dy;

            self.board.undoAddTimed('move', 30e3);
        }
    },

    dragend: function(self, x, y, id, target) {
        for (var i=0; i<self.state(id).claim.length; i++) {
            self.state(id).claim[i].claimed = false;
        }
        self.state(id, 'delete');
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

    click: function(self, x, y, id, target) {
        self._super(x, y, id, target);
        var p = self.board.snap_to(x, y);
        var n = new Node(self.board, p.x, p.y);
        self.board.undoAdd();
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

    dragstart: function(self, x, y, id, target) {
        self._super(x, y, id, target);
        var p = self.board.snap_to(x, y);
        if (target && target.type == "node") {
            self.state(id).temp_end_node = {'x': x, 'y': y};
            self.state(id).temp_line = new self.line_proto(self.board, target,
            self.state(id).temp_end_node, 1);
        }
    },

    drag: function(self, x, y, id, target) {
        self._super(x, y, id, target);
        if (self.state(id)) {
            self.state(id).temp_end_node.x = x;
            self.state(id).temp_end_node.y = y;
        }
    },

    dragend: function(self, x, y, id, target) {
        self._super(x, y, id, target);

        var hit = false;
        for (var i=0; i<self.board.nodes.length; i++) {
            var it = self.board.nodes[i];
            if (it.type == 'node' && it.hit_test(x, y)) {
                if (it != self.state(id).temp_line.n1) {
                    new self.line_type(self.board, self.state(id).temp_line.n1, it, 1);
                    self.state(id).temp_line.remove();
                    hit = true;
                }
                break;
            }
        }
        if (!hit) {
            self.state(id).temp_line.remove();
        } else {
            self.board.undoAdd();
        }
        self.state(id, 'delete');
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

var OmniTool = Tool.extend({
    type: "omni-tool",

    init: function(self, board) {
        self._super(board);
        self.make_elem();
        self.line_proto = ProtoWire;
        self.line_type = Wire;
    },

    make_elem: function(self) {
        self.elem = $('<div class="button" id="tool_wire">Omnitool</div>')
            .appendTo('#tools')
            .bind('click', function() {
                self.board.set_tool(self);
            }
        );
    },

    click: function(self, x, y, id, target) {
        self._super(x, y, id, target);
        if (target) {
            // Toggle
            target.selected ^= true;
        } else {
            var things = self.board.nodes.concat(self.board.elements);
            var min_distance = NaN;
            for (var i=0; i<thing.length; i++) {
                var d = thing.distance(x, y);
                // The seemingly backwards logic is to NaN works out right.
                // NaN < * and NaN > * both return false.
                if (!(d > min_distance)) {
                    min_distance = d;
                }
            }
            if (min_distance > self.board.fuzzy_hit * 3) {
                var selected = self.board.selected();
                for (var i=0; i<selected.length; i++) {
                    selected[i].selected = false;
                }
            }

        }/* else {
            var p = self.board.snap_to(x, y);
            var n = new Node(self.board, p.x, p.y);
            self.board.undoAdd();
        }*/
    },

    dragstart: function(self, x, y, id, target) {
        self._super(x, y, id, target);

        if (target && target.selected) {
            self.state(id).claim = [];
            var selected = self.board.selected();
            for (var i=0; i<selected.length; i++) {
                var elem = selected[i];
                if (!elem.claimed) {
                    self.state(id).claim.push(elem);
                    elem.claimed = true;
                }
            }

            if (self.board.snap) {
                var p = self.board.snap_to(target.x, target.y);
                for (var i=0; i<self.state(id).claim.length; i++) {
                    var elem = self.state(id).claim[i];
                    elem.x += p.x - target.x;
                    elem.y += p.y - target.y;
                }
                target.x = p.x;
                target.y = p.y;
            }

            self.state(id).last_drag = {'x': x, 'y': y};
            self.state(id).drag_action = "move";

        } else if (target && target.type == "node") {
            self.state(id).temp_end_node = {'x': x, 'y': y};
            self.state(id).temp_line = new self.line_proto(self.board, target,
            self.state(id).temp_end_node, 1);

            self.state(id).drag_action = "line";
        }
    },

    drag: function(self, x, y, id, target) {
        self._super(x, y, id, target);
        if (self.state(id).drag_action == "move") {
            var dx = x - self.state(id).last_drag.x;
            var dy = y - self.state(id).last_drag.y;

            if (self.board.snap) {
                dx -= dx % self.board.snap_size;
                dy -= dy % self.board.snap_size;
            }

            for (var i=0; i < self.state(id).claim.length; i++) {
                var elem = self.state(id).claim[i];
                if (elem.type === 'node') {
                    self.state(id).claim[i].x += dx;
                    self.state(id).claim[i].y += dy;
                } else {
                    var n1 = self.state(id).claim[i].n1;
                    var n2 = self.state(id).claim[i].n2;
                    if (self.state(id).claim.indexOf(n1) == -1) {
                        n1.x += dx;
                        n1.y += dy;
                    }
                    if (self.state(id).claim.indexOf(n2) == -1) {
                        n2.x += dx;
                        n2.y += dy;
                    }
                }
            }

            self.state(id).last_drag.x += dx;
            self.state(id).last_drag.y += dy;

            self.board.undoAddTimed('move', 10e3);

        } else if (self.state(id).drag_action = 'line') {
            if (self.state(id)) {
                self.state(id).temp_end_node.x = x;
                self.state(id).temp_end_node.y = y;
            }
        }
    },

    dragend: function(self, x, y, id, target) {
        self._super(x, y, id, target);

        if (self.state(id).drag_action === 'move') {
            for (var i=0; i<self.state(id).claim.length; i++) {
                self.state(id).claim[i].claimed = false;
            }
            self.state(id, 'delete');

        } else if (self.state(id).drag_action == 'line') {
            var hit = false;
            for (var i=0; i<self.board.nodes.length; i++) {
                var it = self.board.nodes[i];
                if (it.type == 'node' && it.hit_test(x, y)) {
                    if (it != self.state(id).temp_line.n1) {
                        new self.line_type(self.board, self.state(id).temp_line.n1, it, 1);
                        self.state(id).temp_line.remove();
                        hit = true;
                    }
                    break;
                }
            }
            if (!hit) {
                self.state(id).temp_line.remove();
            } else {
                self.board.undoAdd();
            }
            self.state(id, 'delete');
        }
    },
});
