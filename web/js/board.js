/* Main */
$(function() {
    var b = new Board();

    var t = new MoveTool(b);
    new NodeTool(b);
    new WireTool(b);
    new ResistorTool(b);

    new Serializer(b);
    new Deserializer(b);

    new SeriesTool(b);

    b.set_tool(t);
});

/*    var MyClass = Class.extend({
 *         init: function(self) {  // this is the constructor
 *             self.thing = 5;
 *         }
 *         add_to: function(self, n) {
 *             self.thing += n;
 *         }
 *    });
 *
 *    var MyExtension = MyClass.extend({
 *        init: function(self) {
 *            seld.thing = 10;
 *        },
 *    });
 */

var Board = Class.extend({
    type: "board",

    init: function(self) {
        self.nodes = [];
        self.wires = [];

        self.drag = 0;
        self.drag_target = null;

        self.canvas = document.getElementById('board');
        self.ctx = self.canvas.getContext('2d');

        self.snap = false;
        self.snap_size = 20;

        setInterval($.proxy(self.redraw, self), 33);
        setInterval($.proxy(self.ui, self), 200);

        $('#board').bind('mousedown', $.proxy(self.mousedown, self));
        $('#board').bind('mousemove', $.proxy(self.mousemove, self));
        $('#board').bind('mouseup', $.proxy(self.mouseup, self));
        $('#board').bind('mousedown', $.proxy(self.mousedown, self));

        $('#snap').bind('change', function(e) {
            self.snap = $(this).prop('checked');
        });

    },

    redraw: function(self) {
        self.ctx.clearRect(0, 0, self.canvas.width, self.canvas.height);
        for (var i=0; i < self.wires.length; i++) {
            self.wires[i].draw();
        }
        for (var i=0; i < self.nodes.length; i++) {
            self.nodes[i].draw();
        }
    },

    ui: function(self) {
        var selected = [];
        var kinds = 0;

        for (var i=0; i<self.wires.length; i++) {
            var w = self.wires[i];
            if (w.selected) {
                selected.push(w);
                kinds |= 1;
            }
        }
        for (var i=0; i<self.nodes.length; i++) {
            var n = self.nodes[i];
            if (n.selected) {
                selected.push(n);
                kinds |= 2;
            }
        }
        output = '';
        if (selected.length > 0) {
            if (selected.length == 1) {
                output += ('<p>' + selected.length + " item selected.</p>");
            } else {
                output += ('<p>' + selected.length + " items selected.</p>");
            }

            if (kinds == 1) {
                // All wires
                output += '<ul>'
                for (var i=0; i<selected.length; i++) {
                    output += '<li>Resistance: ' + selected[i].resistance + '</li>';
                }
                output += '</ul>'
            } else if (kinds == 2) {
                // All nodes
            } else {
                // Mixed
            }
        } else {
            output += '<p>None</p>';
        }
        $('#selectedinfo').html(output);
    },

    selected: function(self) {
        return self.selected_nodes().concat(self.selected_elements());
    },

    selected_nodes: function(self) {
        var selected = [];
        var i;
        var n;

        for (i = 0; i < self.nodes.length; i++) {
            n = self.nodes[i];
            if (n.selected) {
                selected.push(n);
            }
        }

        return selected;
    },

    selected_elements: function(self) {
        var selected = [];
        var i;
        var w;

        for (i = 0; i < self.wires.length; i++) {
            w = self.wires[i];
            if (w.selected) {
                selected.push(w);
            }
        }

        return selected
    },

    selected_wires: function(self) {
        var selected = [];
        var i;
        var w;

        for (i = 0; i < self.wires.length; i++) {
            w = self.wires[i];
            if (w.selected && (w.type == 'wire')) {
                selected.push(w);
            }
        }

        return selected
    },

    selected_resistors: function(self) {
        var selected = [];
        var i;
        var w;

        for (i = 0; i < self.wires.length; i++) {
            w = self.wires[i];
            if (w.selected && (w.type == 'resistor')) {
                selected.push(w);
            }
        }

        return selected
    },

    set_tool: function(self, tool) {
        if (self.cur_tool) {
            $(self.cur_tool.elem).removeClass('active');
        }
        self.cur_tool = tool;
        $(self.cur_tool.elem).addClass('active');
    },

    mousedown: function(self, e) {
        if (!self.cur_tool) {
            console.log("No tool selected. self.cur_tool=" + self.cur_tool)
            return;
        }
        var p = getCursorPosition(e, $('#board'));
        e.real_x = p.x; e.real_y = p.y;

        for (var i=0; i<self.wires.length; i++) {
            if (self.wires[i].hit_test(e.real_x, e.real_y)) {
                self.drag_target = self.wires[i];
                self.drag = 1;
            }
        }
        for (var i=0; i<self.nodes.length; i++) {
            if (self.nodes[i].hit_test(e.real_x, e.real_y)) {
                self.drag_target = self.nodes[i];
                self.drag = 1;
            }
        }
        self.cur_tool.mousedown(e, self.drag_target);
    },

    mousemove: function(self, e) {
        if (!self.cur_tool) {
            return;
        }
        var p = getCursorPosition(e, $('#board'));
        e.real_x = p.x; e.real_y = p.y;

        for (var i=0; i<self.wires.length; i++) {
            var d = self.wires[i];
            d.hover = d.hit_test(e.real_x, e.real_y);
        }
        for (var i=0; i<self.nodes.length; i++) {
            var d = self.nodes[i];
            d.hover = d.hit_test(e.real_x, e.real_y);
        }

        if (self.drag == 0) {
            self.cur_tool.mousemove(e);
        }
        if (self.drag == 1) {
            self.drag = 2;
            self.cur_tool.dragstart(e, self.drag_target);
        }
        if (self.drag == 2) {
            self.cur_tool.drag(e, self.drag_target);
        }
    },

    mouseup: function(self, e) {
        if (!self.cur_tool) {
            return;
        }
        var p = getCursorPosition(e, $('#board'));
        e.real_x = p.x; e.real_y = p.y;

        if (self.drag >= 2) {
            self.cur_tool.dragend(e, self.drag_target);
        } else {
            self.cur_tool.click(e, self.drag_target);
        }
        self.cur_tool.mouseup(e, self.drag_target);

        self.drag = 0;
        self.drag_target = null;
    },

    snap_to: function(self, x, y) {
        if (!self.snap) {
            return {'x': x, 'y': y};
        }
        var mx = x % self.snap_size;
        var my = y % self.snap_size;

        if (mx < self.snap_size / 2) {
            x -= mx;
        } else {
            x += self.snap_size - mx;
        }
        if (my < self.snap_size / 2) {
            y -= my;
        } else {
            y += self.snap_size - my;
        }

        return {'x': x, 'y': y};
    },

    serialize: function(self) {
        for (var i=0; i<self.nodes.length; i++) {
            self.nodes[i].id = i;
        }
        for (var i=0; i<self.wires.length; i++) {
            self.wires[i].n1_id = self.wires[i].n1.id;
            self.wires[i].n2_id = self.wires[i].n2.id;
        }
        var keys = ["id", "nodes", "wires", "type", "x", "y", "n1_id", "n2_id", "resistance", "notes"];
        var text = JSON.stringify(self, keys);
        document.getElementById("frm1").elements[0].value = text;
    },

    deserialize: function(self) {
        var text = document.getElementById("frm1").elements[0].value;
        var boardData = JSON.parse(text);
        self.nodes = [];
        var text = document.getElementById("frm1").elements[0].value;
        var boardData = JSON.parse(text);
        self.nodes = [];
        for (var i=0; i<boardData.nodes.length; i++) {
            self.nodes[i] = new Node(self, boardData.nodes[i].x, boardData.nodes[i].y);
            self.nodes[i].notes = boardData.nodes[i].notes;
        }
        self.wires = [];
        for (var i=0; i<boardData.wires.length; i++) {
            if (boardData.wires[i].type == "line") {
                self.wires[i] = new Wire(self, self.nodes[boardData.wires[i].n1_id], self.nodes[boardData.wires[i].n2_id]);
            }
            if (boardData.wires[i].type == "resistor") {
                self.wires[i] = new Resistor(self, self.nodes[boardData.wires[i].n1_id], self.nodes[boardData.wires[i].n2_id], boardData.wires[i].resistance);
            }
            self.wires[i].notes = boardData.wires[i].notes;
        }
        document.getElementById("frm1").reset();
        for (var i=0; i<boardData.nodes.length; i++) {
            self.nodes[i] = new Node(self, boardData.nodes[i].x, boardData.nodes[i].y);
            self.nodes[i].notes = boardData.nodes[i].notes;
        }
        self.wires = [];
        for (var i=0; i<boardData.wires.length; i++) {
            if (boardData.wires[i].type == "line") {
                self.wires[i] = new Wire(self, self.nodes[boardData.wires[i].n1_id], self.nodes[boardData.wires[i].n2_id]);
            }
            if (boardData.wires[i].type == "resistor") {
                self.wires[i] = new Resistor(self, self.nodes[boardData.wires[i].n1_id], self.nodes[boardData.wires[i].n2_id], boardData.wires[i].resistance);
            }
            self.wires[i].notes = boardData.wires[i].notes;
        }
        document.getElementById("frm1").reset();
    }
});

var ScreenObject = Class.extend({
    type: "screenobject",

    init: function(self, board) {
        self.board = board;
    },
});

var Node = ScreenObject.extend({
    type: "node",

    init: function(self, board, x, y) {
        self._super(board);
        self.x = x;
        self.y = y;
        self.r = 5;
        self.elements1 = [];
        self.elements2 = [];
        self.selected = false;
        self.hover = false;

        self.board.nodes.push(self);
    },

    draw: function(self) {
        var ctx = self.board.ctx;
        ctx.save()

        ctx.strokeStyle = 'rgb(0,0,0)';
        ctx.beginPath();
        ctx.arc(self.x, self.y, self.r, 0, Math.PI*2, true);
        ctx.closePath();

        if (self.hover) {
            ctx.fillStyle = 'rgb(196, 196, 196)';
        } else {
            ctx.fillStyle = 'rgb(128, 128, 128)';
        }

        ctx.fill();
        ctx.stroke();

        if (self.selected) {
            ctx.strokeStyle = 'rgb(255,0,0)';
            ctx.beginPath();
            ctx.arc(self.x, self.y, self.r + 3, 0, Math.PI*2, true);
            ctx.closePath();
            ctx.stroke();
        }

        ctx.restore();
    },

    /* Check if a given point is within the bounds of self node. */
    hit_test: function(self, x, y) {
        // Make clicking a bit easier.
        var fuzzy_r = self.r + 5;

        // Fast bounding box check
        if ((Math.abs(x - self.x) > fuzzy_r) || (Math.abs(y - self.y) > fuzzy_r)) {
            return false;
        }
        // Check the actual circle.
        var d_sq = Math.pow(x - self.x, 2) + Math.pow(y - self.y, 2);
        return d_sq < Math.pow(fuzzy_r, 2);
    },

    element_count: function(self) {
        return self.elements1.length + self.elements2.length;
    },

    connected: function(self, node) {
        var i, j;
        var flag;
        var n1, n2;
        var cleared_nodes = [];
        var uncleared_nodes = [self];

        while (uncleared_nodes.length > 0) {
            n1 = uncleared_nodes.pop();
            if (n1 === node) {
                return true;
            }
            cleared_nodes.push(n1);
            for (i = 0; i < n1.elements1.length; i++) {
                if (n1.elements1[i].type == "line") {
                    n2 = n1.elements1[i].n2;
                    flag = false;
                    for (j = 0; (j < cleared_nodes.length && ! flag); j++) {
                        if (n2 === cleared_nodes[j]) {
                            flag = true;
                        }
                    }
                    for (j = 0; (j < uncleared_nodes.length && ! flag); j++) {
                        if (n2 === uncleared_nodes[j]) {
                            flag = true;
                        }
                    }
                    if (! flag) {
                        uncleared_nodes.push(n2);
                    }
                }
            }
            for (i = 0; i < self.elements2.length; i++) {
                if (n1.elements2[i].type == "line") {
                    n2 = n1.elements2[i].n1;
                    flag = false;
                    for (j = 0; (j < cleared_nodes.length && ! flag); j++) {
                        if (n2 === cleared_nodes[j]) {
                            flag = true;
                        }
                    }
                    for (j = 0; ( j <uncleared_nodes.length && ! flag); j++) {
                        if (n2 === uncleared_nodes[j]) {
                            flag = true;
                        }
                    }
                    if (! flag) {
                        uncleared_nodes.push(n2);
                    }
                }
            }
        }
        return false;
    },

    elements: function(self) {
        return self.elements1 + self.elements2;
    },

    resistors: function(self) {
        var i, j;
        var flag;
        var n1, n2;
        var r = [];
        var cleared_nodes = [];
        var uncleared_nodes = [self];
        while (uncleared_nodes.length > 0) {
            n1 = uncleared_nodes.pop();
            cleared_nodes.push(n1);
            for (i = 0; i < n1.elements1.length; i++) {
                if (n1.elements1[i].type == "line") {
                    n2 = n1.elements1[i].n2;
                    flag = false;
                    for (j = 0; (j < cleared_nodes.length && ! flag); j++) {
                        if (n2 === cleared_nodes[j]) {
                            flag = true;
                        }
                    }
                    for (j = 0; (j < uncleared_nodes.length && ! flag); j++) {
                        if (n2 === uncleared_nodes[j]) {
                            flag = true;
                        }
                    }
                    if (! flag) {
                        uncleared_nodes.push(n2);
                    }
                } else if (n1.elements1[i].type == "resistor") {
                    r.push(n1.elements1[i]);
                }
            }
            for (i = 0; i < self.elements2.length; i++) {
                if (n1.elements2[i].type == "line") {
                    n2 = n1.elements2[i].n1;
                    flag = false;
                    for (j = 0; (j < cleared_nodes.length && ! flag); j++) {
                        if (n2 === cleared_nodes[j]) {
                            flag = true;
                        }
                    }
                    for (j = 0; (j < uncleared_nodes.length && ! flag); j++) {
                        if (n2 === uncleared_nodes[j]) {
                            flag = true;
                        }
                    }
                    if (! flag) {
                        uncleared_nodes.push(n2);
                    }
                } else if (n1.elements2[i].type == "resistor") {
                    r.push(n1.elements2[i]);
                }
            }
        }
        return r;
    },
});

var Wire = ScreenObject.extend({
    type: "wire",

    init: function(self, board, n1, n2) {
        self._super(board);
        self.n1 = n1;
        //n1.elements1.push(self)
        self.n2 = n2;
        self.notes = [];

        self.board.wires.push(self)
        console.log('Wire.init');
    },

    draw: function(self) {
        var ctx = self.board.ctx;
        ctx.save();

        if (self.selected) {
            ctx.strokeStyle = 'rgb(255,0,0)';
        } else {
            ctx.strokeStyle = 'rgb(0,0,0)';
        }
        ctx.strokeWeight = 2;

        ctx.beginPath();
        ctx.moveTo(self.n1.x, self.n1.y);
        ctx.lineTo(self.n2.x, self.n2.y);
        ctx.closePath();
        ctx.stroke();

        var text_x = (self.n1.x + self.n2.x) / 2;
        var text_y = (self.n1.y + self.n2.y) / 2;
        if (self.n1.x == self.n2.x) {
            var slope = NaN;
        } else {
            var slope = (self.n1.y - self.n2.y) / (self.n1.x - self.n2.x);
        }

        if (slope > 0) {
            var per_line = -14;
        } else {
            var per_line = 14;
        }
        text_x += Math.abs(per_line / 2);
        text_y += per_line / 2;
        for (var key in self.notes) {
            ctx.fillText(self.notes[key], text_x, text_y);
            text_y += per_line;
        }

        ctx.restore();
    },

    hit_test: function(self, x, y) {
        // This magic geometry is from http://mathworld.wolfram.com/Point-LineDistance2-Dimensional.html
        var lx = self.n2.x - self.n1.x;
        var ly = self.n2.y - self.n1.y;

        var rx = self.n1.x - x;
        var ry = self.n1.y - y;

        var distance = Math.abs((lx * ry) - (ly * rx)) / Math.sqrt(lx * lx + ly * ly);

        return distance < 5;
    },

    remove: function(self) {
        var idx = self.board.wires.indexOf(self);
        if (idx != -1) {
            self.board.wires.splice(idx, 1); // remove if found
        }
        return null;
    },
});

var Resistor = Wire.extend({
    type: "resistor",

    init: function(self, board, n1, n2, resistance) {
        self._super(board, n1, n2);
        self.resistance = resistance;
    },

    draw: function(self) {
        var ctx = self.board.ctx;
        ctx.save();
        if (self.selected) {
            ctx.strokeStyle = 'rgb(255,0,0)';
        } else {
            ctx.strokeStyle = 'rgb(0,0,0)';
        }
        ctx.strokeWeight = 2;

        var mid = {
            x: (self.n1.x + self.n2.x) / 2,
            y: (self.n1.y + self.n2.y) / 2,
        };
        var l = {
            x: self.n1.x - self.n2.x,
            y: self.n1.y - self.n2.y,
        }
        var r1 = {
            x: mid.x + (l.x * 0.1),
            y: mid.y + (l.y * 0.1),
        };
        var r2 = {
            x: mid.x - (l.x * 0.1),
            y: mid.y - (l.y * 0.1),
        };
        var squiggle_count = 10;
        var squiggle_height = 5;
        // Delta r - the distance to travel per squiggle
        var dr = {
            x: (r2.x - r1.x) * (1.0 / squiggle_count),
            y: (r2.y - r1.y) * (1.0 / squiggle_count)
        };
        dr.d = Math.sqrt((dr.x * dr.x) + (dr.y * dr.y));
        // Normal r - the vector from the line to the peak of a postive squiggle
        var nr = {
            x: (r2.y - r1.y) * 0.1,
            y: (r1.x - r2.x) * 0.1
        };

        ctx.beginPath();
        ctx.moveTo(self.n1.x, self.n1.y);
        ctx.lineTo(r1.x, r1.y);
        var sign = 1;
        for (var d=0; d<10; d++) {
            var sx = r1.x + (dr.x * (d + 0.5)) + (nr.x * sign);
            var sy = r1.y + (dr.y * (d + 0.5)) + (nr.y * sign);
            ctx.lineTo(sx, sy);
            sign *= -1;
        }
        ctx.lineTo(r2.x, r2.y);
        ctx.lineTo(self.n2.x, self.n2.y);
        ctx.stroke();

        var text_x = (self.n1.x + self.n2.x) / 2;
        var text_y = (self.n1.y + self.n2.y) / 2;
        if (self.n1.x == self.n2.x) {
            var slope = NaN;
        } else {
            var slope = (self.n1.y - self.n2.y) / (self.n1.x - self.n2.x);
        }

        if (slope > 0) {
            var per_line = -14;
        } else {
            var per_line = 14;
        }
        text_x += Math.abs(per_line / 2);
        text_y += per_line / 2;
        /*for (var i=0; i<self.notes.length; i++) {
            ctx.fillText(self.notes[i], text_x, text_y);
            text_y += per_line;
        }*/

        ctx.restore();
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
                for (var i=0; i<self.board.wires.length; i++) {
                    self.board.wires[i].selected = false;
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
                for (var i=0; i<self.board.wires.length; i++) {
                    var it = self.board.wires[i];
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
            for (var i=0; i<self.board.wires.length; i++) {
                if (self.board.wires[i].selected) {
                    var n1 = self.board.wires[i].n1;
                    var n2 = self.board.wires[i].n2;
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
        self.elem = $('<div class="tool icon-arrow" id="tool_arrow">Arrow</div>')
            .appendTo('#tools')
            .bind('click', function() {
                self.board.set_tool(self);
            }
        );
    },

    click: function(self, e, target) {
        self._super(e, target);
        var selected_objs = [];
        for (var i=0; i<self.board.nodes.length; i++) {
            if (self.board.nodes[i].selected) {
                selected_objs.push(self.board.nodes[i]);
            }
        }
        for (var i=0; i<self.board.wires.length; i++) {
            if (self.board.wires[i].selected) {
                selected_objs.push(self.board.wires[i]);
            }
        }
        if (target) {
            var should_select = !target.selected;
            if (!e.shiftKey) {
                if (selected_objs.length > 1 && target.selected) {
                    should_select = true;
                }
                for (var i=0; i<selected_objs.length; i++) {
                    selected_objs[i].selected = false;
                }
            }
            target.selected = should_select;
        } else {
            for (var i=0; i<selected_objs.length; i++) {
                selected_objs[i].selected = false;
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
                for (var i=0; i<self.board.wires.length; i++) {
                    self.board.wires[i].selected = false;
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
                for (var i=0; i<self.board.wires.length; i++) {
                    var it = self.board.wires[i];
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
            for (var i=0; i<self.board.wires.length; i++) {
                if (self.board.wires[i].selected) {
                    var n1 = self.board.wires[i].n1;
                    var n2 = self.board.wires[i].n2;
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

        self.elem = $('<div class="tool icon-node" id="tool_node">Nodes</div>')
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
    },
});

var WireTool = Tool.extend({
    type: "wire-tool",

    init: function(self, board) {
        self._super(board);
        self.make_elem();
        self.line_kind = Wire;
    },

    make_elem: function(self) {
        self.elem = $('<div class="tool icon-wire" id="tool_wire">Wires</div>')
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
            self.temp_line = new self.line_kind(self.board, target, self.temp_end_node, 1);
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
                    self.temp_line.n2 = it;
                    it.elements2.push(this.temp_line);
                    hit = true;
                }
                break;
            }
        }
        if (!hit) {
            self.temp_line.remove();
        }
        self.temp_line = null;
        self.temp_end_node = null;
    },
});

var ResistorTool = WireTool.extend({
    type: "wire-tool",

    init: function(self, board) {
        self._super(board);
        self.line_kind = Resistor;
    },

    make_elem: function(self) {
        self.elem = $('<div class="tool icon-resistor" id="tool_resistor">Resistors</div>')
            .appendTo('#tools')
            .bind('click', function() {
                self.board.set_tool(self);
            }
        );
    },
});

var Serializer = Class.extend({
    type: "serializer",

    init: function(self, board) {
        self.elem = $('<div class="tool" id="tool_save">Save</div>')
            .appendTo('#serial')
            .bind('click', function() {
                self.board.serialize();
            }
        );
    },
});

var Deserializer = Class.extend({
    type: "deserializer",

    init: function(self, board) {
        self.elem = $('<div class="tool" id="tool_load">Load</div>')
            .appendTo('#serial')
            .bind('click', function() {
                self.board.deserialize();
            }
        );
    },
});
