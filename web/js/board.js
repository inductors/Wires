/* Main */
$(function() {
    var b = new Board();

    var t = new MoveTool(b);
    new NodeTool(b);
    new WireTool(b);
    new ResistorTool(b);

    new Serializer(b);
    new Deserializer(b);

    new Undo(b);
    new Redo(b);
    new Delete(b);

    new SeriesReduction(b);
    new ParallelReduction(b);
    new RemoveReduction(b);
    new DeltaWyeReduction(b);
    new WyeDeltaReduction(b);

    b.set_tool(t);
});

var Board = Class.extend({
    type: "board",

    init: function(self) {
        self.nodes = [];
        self.elements = [];
        self.undoLog = [];
        self.curUndo = -1;
        self.undoLock = false;

        self.drag = 0;
        self.drag_target = null;

        self.canvas = document.getElementById('board');
        self.ctx = self.canvas.getContext('2d');

        self.snap = true;
        self.snap_size = 20;

        setInterval($.proxy(self.redraw, self), 33);
        setInterval($.proxy(self.ui, self), 200);

        $('#board').bind('mousedown', $.proxy(self.mousedown, self));
        $('#board').bind('mousemove', $.proxy(self.mousemove, self));
        $('#board').bind('mouseup', $.proxy(self.mouseup, self));
        $('#board').bind('mousedown', $.proxy(self.mousedown, self));

        $('#snap').bind('change', function(e) {
            self.snap = $(this).prop('checked');
        }).prop('checked', self.snap);

    },

    redraw: function(self) {
        self.ctx.clearRect(0, 0, self.canvas.width, self.canvas.height);
        for (var i=0; i < self.elements.length; i++) {
            self.elements[i].draw();
        }
        for (var i=0; i < self.nodes.length; i++) {
            self.nodes[i].draw();
        }
    },

    ui: function(self) {
        // Is this even needed anymore?
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

        for (i = 0; i < self.elements.length; i++) {
            w = self.elements[i];
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

        for (i = 0; i < self.elements.length; i++) {
            w = self.elements[i];
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

        for (i = 0; i < self.elements.length; i++) {
            w = self.elements[i];
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
        console.log('mousedown');
        if (!self.cur_tool) {
            console.log("No tool selected. self.cur_tool=" + self.cur_tool)
            return;
        }
        var p = getCursorPosition(e, $('#board'));
        e.real_x = p.x; e.real_y = p.y;

        for (var i=0; i<self.elements.length; i++) {
            if (self.elements[i].hit_test(e.real_x, e.real_y)) {
                self.drag_target = self.elements[i];
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

        for (var i=0; i<self.elements.length; i++) {
            var d = self.elements[i];
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

    undoAdd: function(self) {
        if (self.undoLock == true) {
            return;
        }
        var text = self.serialize(false);
        self.curUndo++;
        console.log(self.curUndo);
        var diff = self.undoLog.length - self.curUndo;
        for (var i=0; i<diff; i++) {
            self.undoLog.pop();
        }
        self.undoLog.push(text);
    },

    undo: function(self) {
        if (self.undoLock == true) {
            return;
        }
        self.curUndo--;
        console.log(self.curUndo);
        console.log(self.undoLog[self.curUndo]);
        if (self.curUndo < 0) {
            self.curUndo = 0;
        }
        self.deserialize(self.undoLog[self.curUndo], false);
    },

    redo: function(self) {
        if (self.undoLock == true) {
            return;
        }
        self.curUndo++;
        console.log(self.curUndo);
        console.log(self.undoLog[self.curUndo]);
        if (self.curUndo > (self.undoLog.length-1)) {
            self.curUndo = self.undoLog.length-1;
        }
        self.deserialize(self.undoLog[self.curUndo], false);
    },

    serialize: function(self, full) {
        for (var i=0; i<self.nodes.length; i++) {
            self.nodes[i].id = i;
        }
        for (var i=0; i<self.elements.length; i++) {
            self.elements[i].n1_id = self.elements[i].n1.id;
            self.elements[i].n2_id = self.elements[i].n2.id;
        }
        var keys = ["id", "nodes", "elements", "type", "x", "y", "n1_id", "n2_id", "resistance", "notes"];
        if (full == true) {
            keys = keys.concat(['undoLog', 'curUndo']);
        }
        var text = JSON.stringify(self, keys);
        console.log(text);
        return text;
    },

    deserialize: function(self, text, full) {
        self.undoLock = true;
        var boardData = JSON.parse(text);

        while (self.nodes.length > 0) {
            self.nodes[0].remove();
        }
        // This is probably un-needed, because removing all nodes should remove
        // all elements. But it can't hurt.
        while (self.elements.length > 0) {
            self.elements[0].remove();
        }

        for (var i=0; i<boardData.nodes.length; i++) {
            new Node(self, boardData.nodes[i].x, boardData.nodes[i].y);
            self.nodes[i].notes = boardData.nodes[i].notes;
        }
        for (var i=0; i<boardData.elements.length; i++) {
            var n1 = self.nodes[boardData.elements[i].n1_id];
            var n2 = self.nodes[boardData.elements[i].n2_id];
            if (boardData.elements[i].type == "wire") {
                new Wire(self, n1, n2);
            }
            if (boardData.elements[i].type == "resistor") {
                var r = boardData.elements[i].resistance;
                new Resistor(self, n1, n2, r);
            }
            self.elements[i].notes = boardData.elements[i].notes;
        }
        if (full == true) {
            self.undoLog = []
            for (var i=0; i<boardData.undoLog.length; i++) {
                self.undoLog[i] = boardData.undoLog[i];
            }
            self.curUndo = boardData.curUndo;
        }
        self.undoLock = false;
    }
});

var ScreenObject = Class.extend({
    type: "screenobject",

    init: function(self, board) {
        self.board = board;
        Object.defineProperty(self, 'selected', {
            get: self._get_selected,
            set: self._set_selected,
        });

        self.old_selected = false;
        self.selected = false;
        self.widget_elem = null;
    },

    _get_selected: function (self) {
        return self._selected;
    },
    _set_selected: function (self, val) {
        self.old_selected = self._selected;
        self._selected = val;
    }
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
        self.hover = false;

        self.board.nodes.push(self);
    },

    _set_selected: function (self, val) {
        self._super(val);
        if (self.selected && !self.old_selected) {
            self.widget_elem = $('<li>Node</li>').appendTo('#selectedinfo');
        } else if (!self.selected && self.old_selected) {
            if (self.widget_elem) {
                self.widget_elem.remove();
            }
        }
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

    nodes: function(self) {
        var i, j;
        var elements = [];
        var nodes = [self];

        for (i = 0; i < nodes.length; i++) {
            elements = nodes[i].elements();
            for (j = 0; j < elements.length; j++) {
                if (elements[j].type == "wire") {
                    if (nodes.indexOf(elements[j].n1) == -1) {
                        nodes.push(elements[j].n1);
                    }
                    if (nodes.indexOf(elements[j].n2) == -1) {
                        nodes.push(elements[j].n2);
                    }
                }
            }
        }
        return nodes;
    },

    wired: function(self, node) {
        return (self.nodes().indexOf(node) != -1);
    },

    elements: function(self) {
        return self.elements1.concat(self.elements2);
    },

    resistors: function(self) {
        var i, j;
        var elements = [];
        var resistors = [];
        var nodes = [self];

        for (i = 0; i < nodes.length; i++) {
            elements = nodes[i].elements();
            for (j = 0; j < elements.length; j++) {
                if (elements[j].type == "wire") {
                    if (nodes.indexOf(elements[j].n1) == -1) {
                        nodes.push(elements[j].n1);
                    }
                    if (nodes.indexOf(elements[j].n2) == -1) {
                        nodes.push(elements[j].n2);
                    }
                } else if (elements[j].type == "resistor") {
                    if (resistors.indexOf(elements[j]) == -1) {
                        resistors.push(elements[j]);
                    }
                }
            }
        }
        return resistors;
    },

    remove: function(self) {
        var index;
        self.board.undoLock = true;
        index = self.board.nodes.indexOf(self);
        if (index != -1) {
            self.board.nodes.splice(index, 1); // remove if found
        }
        // Remove backwards, since elements will being removed from the array.
        for (var i = self.elements1.length - 1; i >= 0; i--) {
            self.elements1[i].remove();
        }
        for (var i = self.elements2.length - 1; i >= 0; i--) {
            self.elements2[i].remove();
        }
        self.selected = false;
        self.board.undoLock = true;
        self.board.undoAdd();
        return null;
    },
});

var ProtoWire = ScreenObject.extend({
    type: "protowire",

    init: function(self, board, n1, n2) {
        self._super(board);
        self.n1 = n1;
        self.n2 = n2;
        self.notes = [];

        if (board) {
            self.board.elements.push(self);
        }
        console.log('Element.init');

        self.color = 'rgb(0,0,0)';
        self.selected_color = 'rgb(255,0,0)';
    },

    draw: function(self) {
        var ctx = self.board.ctx;
        ctx.save();

        if (self.selected) {
            ctx.strokeStyle = self.selected_color;
        } else {
            ctx.strokeStyle = self.color;
        }
        ctx.strokeWeight = 2;

        ctx.beginPath();
        ctx.moveTo(self.n1.x, self.n1.y);
        ctx.lineTo(self.n2.x, self.n2.y);
        ctx.closePath();
        ctx.stroke();

        self.draw_notes(ctx);

        ctx.restore();
    },

    draw_notes: function (self, ctx) {
        var text_x = (self.n1.x + self.n2.x) / 2;
        var text_y = (self.n1.y + self.n2.y) / 2;
        if (self.n1.x == self.n2.x) {
            var slope = NaN;
        } else {
            var slope = (self.n1.y - self.n2.y) / (self.n1.x - self.n2.x);
        }

        if (slope > 0) {
            var per_line = -14;
            text_x += Math.abs(per_line / 2);
            text_y += per_line / 2;
        } else {
            var per_line = 14;
            text_x += Math.abs(per_line / 2);
            text_y += per_line;
        }
        for (var i=0; i<self.notes.length; i++) {
            ctx.fillText(self.notes[i], text_x, text_y);
            text_y += per_line;
        }
    },

    hit_test: function(self, x, y) {
        var fuzzy_r = 7;
        // Find bounding box.
        var left = self.n1.x;
        var right = self.n2.x;
        var top = self.n1.y;
        var bottom = self.n2.y;
        if (left > right) {
            var tmp = right;
            right = left;
            left = tmp;
        }
        if (top > bottom) {
            var tmp = top;
            top = bottom;
            bottom = tmp;
        }
        left -= fuzzy_r;
        right += fuzzy_r;
        top -= fuzzy_r;
        bottom += fuzzy_r;

        // outside bounds?
        if (x > right || x < left || y > bottom || y < top) {
            return false;
        }

        // Now do an actually line collision check.
        // This magic geometry is from http://mathworld.wolfram.com/Point-LineDistance2-Dimensional.html
        // length
        var lx = self.n2.x - self.n1.x;
        var ly = self.n2.y - self.n1.y;
        // dist from n1
        var rx = self.n1.x - x;
        var ry = self.n1.y - y;

        var distance = ((lx * ry) - (rx * ly)) / Math.sqrt(lx * lx + ly * ly);
        // This makes it work, for some reason. Wat.
        distance = Math.abs(distance + 3);

        return distance < fuzzy_r;
    },

    nodes: function(self) {
        return [self.n1, self.n2];
    },

    // reassociate this element from the current n1 to n
    n1_migrate: function(self, n) {
        var index
        if (self.n1.elements1) {
            index = self.n1.elements1.indexOf(self);
            if (index != -1) {
                self.n1.elements1.splice(index, 1);
            }
        }

        n.elements1.push(self);
        self.n1 = n;
    },

    // reassociate this element from the current n2 to n
    n2_migrate: function(self, n) {
        var index
        if (self.n2.elements2) {
            index = self.n2.elements2.indexOf(self);
            if (index != -1) {
                self.n2.elements2.splice(index, 1);
            }
        }

        n.elements2.push(self);
        self.n2 = n;
    },

    remove: function(self) {
        var index
        index = self.board.elements.indexOf(self);
        if (index != -1) {
            self.board.elements.splice(index, 1); // remove if found
        }
        if (self.widget_elem) {
            self.widget_elem.remove();
        }
        self.selected = false;
        self.board.undoAdd();
        return null;
    },
});

var Wire = ProtoWire.extend({
    type: "wire",

    init: function(self, board, n1, n2) {
        self._super(board, n1, n2);
        n1.elements1.push(self);
        n2.elements2.push(self);
    },

    _set_selected: function (self, val) {
        self._super(val);
        if (self.selected && !self.old_selected) {
            self.widget_elem = $('<li>Wire</li>').appendTo('#selectedinfo');
        } else if (!self.selected && self.old_selected) {
            if (self.widget_elem) {
                self.widget_elem.remove();
            }
        }
    },

    remove: function(self) {
        var index

        self._super();

        index = self.n1.elements1.indexOf(self);
        if (index != -1) {
            self.n1.elements1.splice(index, 1);
        }
        index = self.n2.elements2.indexOf(self);
        if (index != -1) {
            self.n2.elements2.splice(index, 1);
        }
        self.selected = false;
        return null;
    },
});

var ProtoResistor = ProtoWire.extend({
    type: "protoresistor",

    init: function(self, board, n1, n2, resistance) {
        self._super(board, n1, n2);

        Object.defineProperty(self, 'resistance', {
            get: self._get_resistance,
            set: self._set_resistance,
        });

        self.resistance = resistance;
    },

    _get_resistance: function (self) {
        return self._resistance;
    },
    _set_resistance: function (self, r) {
        self._resistance = r;
        self.notes[0] = "{0}Ω".format(r);
        if (self.widget_elem) {
            self.widget_elem.children('input').val(self._resistance);
        }
    },

    draw: function(self) {
        var ctx = self.board.ctx;
        ctx.save();
        if (self.selected) {
            ctx.strokeStyle = self.selected_color;
        } else {
            ctx.strokeStyle = self.color;
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

        self.draw_notes(ctx);

        ctx.restore();
    },
});

var Resistor = ProtoResistor.extend({
    type: "resistor",

    init: function(self, board, n1, n2, resistance) {
        self._super(board, n1, n2, resistance);
        n1.elements1.push(self);
        n2.elements2.push(self);
    },

    _set_selected: function (self, val) {
        self._super(val);
        if (self.selected && !self.old_selected) {
            self.widget_elem = $('<li></li>').appendTo('#selectedinfo');
            $('<label>Resistance</label> <input type="text" value="{0}" size="1" />'.format(self.resistance))
                .bind('change', function (e) {
                    console.log('Changing resistance with ');
                    console.log(this);
                    self.resistance = parseFloat($(this).val());
                })
                .appendTo(self.widget_elem)

        } else if (!self.selected && self.old_selected) {
            if (self.widget_elem) {
                self.widget_elem.remove();
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

    remove: function(self) {
        var index

        self._super();

        index = self.n1.elements1.indexOf(self);
        if (index != -1) {
            self.n1.elements1.splice(index, 1);
        }
        index = self.n2.elements2.indexOf(self);
        if (index != -1) {
            self.n2.elements2.splice(index, 1);
        }
        self.selected = false;
        return null;
    },
});


var Undo = Class.extend({
    type: "undo",

    init: function(self, board) {
        self.board = board;
        self.elem = $('<div class="button" id="tool_undo">Undo</div>')
            .appendTo('#actions')
            .bind('click', function() {
                console.log('Undoing.');
                self.board.undo();
            }
        );
    },
});

var Redo = Class.extend({
    type: "redo",

    init: function(self, board) {
        self.board = board;
        self.elem = $('<div class="button">Redo</div>')
            .appendTo('#actions')
            .bind('click', function() {
                console.log('Redoing.');
                self.board.redo();
            }
        );
    },
});

var Delete = Class.extend({
    type: "delete",

    init: function(self, board) {
        self.board = board;
        self.elem = $('<div class="button" id="delete_button">Delete</div>')
            .appendTo('#actions')
            .bind('click', function() {
                var selected = self.board.selected();
                for (var i=0; i<selected.length; i++) {
                    selected[i].remove();
                }
            }
        );
    },
});


var Serializer = Class.extend({
    type: "serializer",

    init: function(self, board) {
        self.board = board;
        self.elem = $('<div class="button" id="tool_save">Save</div>')
            .appendTo('#serial')
            .bind('click', function() {
                console.log('Serializing.');
        $('#serial input').val(self.board.serialize(true));
            }
        );
    },
});

var Deserializer = Class.extend({
    type: "deserializer",

    init: function(self, board) {
        self.board = board;
        self.elem = $('<div class="button" id="tool_load">Load</div>')
            .appendTo('#serial')
            .bind('click', function() {
                console.log('Deserializing.');
        var text = $('#serial input').val();
                self.board.deserialize(text, true);
        $('#serial input').val("");
            }
        );
    },
});
