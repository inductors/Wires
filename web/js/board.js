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
        // ...idk?
        x = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
        y = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
    }

    return {'x': x, 'y': y};
}

/* Main */
$(function() {
    var b = new Board();

    var a = new ArrowTool(b);
    var n = new NodeTool(b);
    var n = new LineTool(b);
    var s = new Serializer(b);
    var d = new Deserializer(b);

    b.set_tool(a);
});

function Board() {
    this.type = "board";
    this.nodes = [];
    this.wires = [];

    this.drag = 0;
    this.drag_target = null;

    this.canvas = document.getElementById('board');
    this.ctx = this.canvas.getContext('2d');

    this.snap = false;
    this.snap_size = 20;
    var board = this;

    board.redraw = function() {
        board.ctx.clearRect(0, 0, board.canvas.width, board.canvas.height);
        for (var i=0; i<board.wires.length; i++) {
            board.wires[i].draw();
        };
        for (var i=0; i<board.nodes.length; i++) {
            board.nodes[i].draw();
        };
    }
    // Redraw 50 times a second.
    setInterval(this.redraw, 20);

    this.set_tool = function(tool) {
        if (this.cur_tool) {
            $(this.cur_tool.elem).removeClass('active');
        }
        this.cur_tool = tool;
        $(this.cur_tool.elem).addClass('active');
    }

    $('#board').bind('mousedown', function(e) {
        if (!board.cur_tool) {
            return;
        }
        var p = getCursorPosition(e, $('#board'));
        e.real_x = p.x; e.real_y = p.y;

        for (var i=0; i<board.wires.length; i++) {
            if (board.wires[i].hit_test(e.real_x, e.real_y)) {
                board.drag_target = board.wires[i];
                board.drag = 1;
            }
        }
        for (var i=0; i<board.nodes.length; i++) {
            if (board.nodes[i].hit_test(e.real_x, e.real_y)) {
                board.drag_target = board.nodes[i];
                board.drag = 1;
            }
        }
        console.log(e.real_x + ' ' + e.real_y);
        board.cur_tool.mousedown(e, board.drag_target);
    });

    $('#board').bind('mousemove', function(e) {
        if (!board.cur_tool) {
            return;
        }
        var p = getCursorPosition(e, $('#board'));
        e.real_x = p.x; e.real_y = p.y;

        for (var i=0; i<board.wires.length; i++) {
            var d = board.wires[i];
            d.hover = d.hit_test(e.real_x, e.real_y);
        }
        for (var i=0; i<board.nodes.length; i++) {
            var d = board.nodes[i];
            d.hover = d.hit_test(e.real_x, e.real_y);
        }

        if (board.drag == 0) {
            board.cur_tool.mousemove(e);
        }
        if (board.drag == 1) {
            board.drag = 2;
            board.cur_tool.dragstart(e, board.drag_target);
        }
        if (board.drag == 2) {
            board.cur_tool.drag(e, board.drag_target);
        }
    });

    $('#board').bind('mouseup', function(e) {
        if (!board.cur_tool) {
            return;
        }
        var p = getCursorPosition(e, $('#board'));
        e.real_x = p.x; e.real_y = p.y;

        if (board.drag >= 2) {
            board.cur_tool.dragend(e, board.drag_target);
        } else {
            board.cur_tool.click(e, board.drag_target);
        }
        board.cur_tool.mouseup(e, board.drag_target);

        board.drag = 0;
        board.drag_target = null;
    });

    $('<input type="checkbox"/>Snap</input>').appendTo('#tools')
        .bind('change', function(e) {
            board.snap = $(this).prop('checked');
        });

    this.snap_to = function(x, y) {
        if (!this.snap) {
            return {'x': x, 'y': y};
        }
        var mx = x % this.snap_size;
        var my = y % this.snap_size;

        if (mx < this.snap_size / 2) {
            x -= mx;
        } else {
            x += this.snap_size - mx;
        }
        if (my < this.snap_size / 2) {
            y -= my;
        } else {
            y += this.snap_size - my;
        }

        return {'x': x, 'y': y};
    }

    this.serialize = function() {
        var keys = ["nodes", "wires", "x", "y", "n1", "n2", "notes"]
            var text = JSON.stringify(board, keys);
        document.getElementById("frm1").elements[0].value = text;
    }

    this.deserialize = function() {
        var text = document.getElementById("frm1").elements[0].value;
        var boardData = JSON.parse(text);
        board.nodes = [];
        for (var i=0; i<boardData.nodes.length; i++) {
            board.nodes[i] = new Node(board, boardData.nodes[i].x, boardData.nodes[i].y);
            board.nodes[i].notes = boardData.nodes[i].notes;
        }
        board.wires = [];
        for (var i=0; i<boardData.wires.length; i++) {
            board.wires[i] = new Line(board, boardData.wires[i].n1, boardData.wires[i].n2);
            board.wires[i].notes = boardData.wires[i].notes;
        }
        document.getElementById("frm1").reset();
    }
}

function Node(board, x, y) {
    this.type = "node";
    this.board = board;
    this.notes = [];
    this.x = x;
    this.y = y;
    this.r = 5;
	this.elements1 = [];
	this.elements2 = [];
    this.selected = false;
    this.hover = false;

    board.nodes.push(this);

    this.draw = function() {
        var ctx = board.ctx;
        ctx.save();

        ctx.strokeStyle = 'rgb(0,0,0)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI*2, true);
        ctx.closePath();

        if (this.hover) {
            ctx.fillStyle = 'rgb(196, 196, 196)';
        } else {
            ctx.fillStyle = 'rgb(128, 128, 128)';
        }

        ctx.fill();
        ctx.stroke();

        if (this.selected) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.r + 3, 0, Math.PI*2, true);
            ctx.closePath();
            ctx.stroke();
        }

        ctx.fillStyle = "rgba(0,0,0,0.7)"
            var text_x = this.x + 10;
        var text_y = this.y + 10;
        for (var i=0; i<this.notes.length; i++) {
            ctx.fillText(key + ': ' + this.notes[i], text_x, text_y);
            text_y += 12;
        }

        ctx.restore();
    }

    /* Check if a given point is within the bounds of this node. */
    this.hit_test = function(x, y) {
        // Make clicking a bit easier.
        var fuzzy_r = this.r + 5;

        // Fast bounding box check
        if ((Math.abs(x - this.x) > fuzzy_r) || (Math.abs(y - this.y) > fuzzy_r)) {
            return false;
        }
        // Check the actual circle.
        var d_sq = Math.pow(x - this.x, 2) + Math.pow(y - this.y, 2);
        return d_sq < Math.pow(fuzzy_r, 2);
    }

	this.connected = function(node) {
		var i;
		var n1, n2;
		var cleared_nodes = [];
		var uncleared_nodes = [this];
		while (uncleared_nodes.length > 0) {
			n1 = uncleared_nodes.pop()
			if (n1 === node {
				return true;
			}
			cleared_nodes.push(n1);
			for (i=0; i<n1.elements1.length; i++) {
				if (n1.elements1[i].type == 'line') {
					n2 = n1.elements1[i].n2;
					if (($.inArray(n2, cleared_nodes) == -1) and ($.inArray(n2, uncleared_nodes) == -1)) {
						uncleared_nodes.push(n2);
					}
				}
			}
			for (i=0; i<this.elements2.length; i++) {
				if (n1.elements2[i].type == 'line') {
					n2 = n1.elements2[i].n1;
					if (($.inArray(n2, cleared_nodes) == -1) and ($.inArray(n2, uncleared_nodes) == -1)) {
						uncleared_nodes.push(n2);
					}
				}
			}
		}
	}

	this.element_count = function() {
		return this.elements1.length + this.elements2.length;
	}
}

function Line(board, n1, n2) {
    this.type = "line";
    this.board = board;
    this.n1 = n1;
	this.n1.elements1.push(this);
    this.n2 = n2;

    this.notes = [];

    board.wires.push(this);

    this.draw = function() {
        var ctx = board.ctx;
        ctx.save();
        if (this.selected) {
            ctx.strokeStyle = 'rgb(255,0,0)';
        } else {
            ctx.strokeStyle = 'rgb(0,0,0)';
        }
        ctx.strokeWeight = 2;

        ctx.beginPath();
        ctx.moveTo(this.n1.x, this.n1.y);
        ctx.lineTo(this.n2.x, this.n2.y);
        ctx.closePath();
        ctx.stroke();

        var text_x = (this.n1.x + this.n2.x) / 2;
        var text_y = (this.n1.y + this.n2.y) / 2;
        if (this.n1.x == this.n2.x) {
            var slope = NaN;
        } else {
            var slope = (this.n1.y - this.n2.y) / (this.n1.x - this.n2.x)
        }

        if (slope > 0) {
            var per_line = -14;
        } else {
            var per_line = 14;
        }
        text_x += Math.abs(per_line / 2);
        text_y += per_line / 2;
        for (var i=0; i<this.notes.length; i++) {
            ctx.fillText(this.notes[i], text_x, text_y);
            text_y += per_line;
        }

        ctx.restore();
    }

    this.hit_test = function(x, y) {
        // This magic geometry is from http://mathworld.wolfram.com/Point-LineDistance2-Dimensional.html
        var lx = this.n2.x - this.n1.x;
        var ly = this.n2.y - this.n1.y;

        var rx = this.n1.x - x;
        var ry = this.n1.y - y;

        var distance = Math.abs((lx * ry) - (ly * rx)) / Math.sqrt(lx * lx + ly * ly);

        return distance < 5;
    }

    this.remove = function() {
        var idx = this.board.wires.indexOf(this);
        if (idx != -1) {
            this.board.wires.splice(idx, 1); // remove if found
        }
        return null;
    }
}

function Resistor(board, n1, n2, resistance) {
    this.type = "resistor";
    this.board = board;
    this.n1 = n1;
	this.n1.elements1.push(this);
    this.n2 = n2;

    this.resistance = resistance

    board.wires.push(this);

    this.draw = function() {
        var ctx = board.ctx;
        ctx.save();
        if (this.selected) {
            ctx.strokeStyle = 'rgb(255,0,0)';
        } else {
            ctx.strokeStyle = 'rgb(0,0,0)';
        }
        ctx.strokeWeight = 2;

        var mid = {
            x: (this.n1.x + this.n2.x) / 2,
            y: (this.n1.y + this.n2.y) / 2,
        };
        var l = {
            x: this.n1.x - this.n2.x,
            y: this.n1.y - this.n2.y,
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
        dr.d = Math.sqrt((dr.x * dr.x) + (dr.y * dr.y))
        // Normal r - the vector from the line to the peak of a postive squiggle
        var nr = {
            x: (r2.y - r1.y) * 0.1,
            y: (r1.x - r2.x) * 0.1
        };

        ctx.beginPath();
        ctx.moveTo(this.n1.x, this.n1.y);
        ctx.lineTo(r1.x, r1.y);
        var sign = 1;
        for (var d=0; d<10; d++) {
            var sx = r1.x + (dr.x * (d + 0.5)) + (nr.x * sign);
            var sy = r1.y + (dr.y * (d + 0.5)) + (nr.y * sign);
            ctx.lineTo(sx, sy);
            sign *= -1;
        }
        ctx.lineTo(r2.x, r2.y);
        ctx.lineTo(this.n2.x, this.n2.y);
        ctx.stroke();

        var text_x = (this.n1.x + this.n2.x) / 2;
        var text_y = (this.n1.y + this.n2.y) / 2;
        if (this.n1.x == this.n2.x) {
            var slope = NaN;
        } else {
            var slope = (this.n1.y - this.n2.y) / (this.n1.x - this.n2.x)
        }

        if (slope > 0) {
            var per_line = -14;
        } else {
            var per_line = 14;
        }
        text_x += Math.abs(per_line / 2);
        text_y += per_line / 2;
        /*for (var i=0; i<this.notes.length; i++) {
            ctx.fillText(this.notes[i], text_x, text_y);
            text_y += per_line;
        }*/

        ctx.restore();
    }

    this.hit_test = function(x, y) {
        // This magic geometry is from http://mathworld.wolfram.com/Point-LineDistance2-Dimensional.html
        var lx = this.n2.x - this.n1.x;
        var ly = this.n2.y - this.n1.y;

        var rx = this.n1.x - x;
        var ry = this.n1.y - y;

        var distance = Math.abs((lx * ry) - (ly * rx)) / Math.sqrt(lx * lx + ly * ly);

        return distance < 5;
    }
    this.remove = function() {
        var idx = this.board.wires.indexOf(this);
        if (idx != -1) {
            this.board.wires.splice(idx, 1); // remove if found
        }
        return null;
    }
}

function ArrowTool(board) {
    this.type = "arrow-tool";
    this.board = board;

    this.drag_offset_x = 0;
    this.drag_offset_y = 0;

    var arrow_tool = this;

    this.elem = $('<div class="tool" id="tool_arrow">Arrow</div>')
        .appendTo('#tools')
        .bind('click', function() {
            arrow_tool.board.set_tool(arrow_tool);
        });

    this.mousedown = function(){};
    this.mouseup = function(){};
    this.mousemove = function(){};
    this.click = function(e, target) {
        var selected_objs = [];
        for (var i=0; i<board.nodes.length; i++) {
            if (board.nodes[i].selected) {
                selected_objs.push(board.nodes[i]);
            }
        }
        for (var i=0; i<board.wires.length; i++) {
            if (board.wires[i].selected) {
                selected_objs.push(board.wires[i]);
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
    };
    this.dragstart = function(e, target) {
        if (target) {
            this.last_drag_x = e.real_x;
            this.last_drag_y = e.real_y;

            // If we clicked on a non-selected element, unselect everything and
            // select it.
            if (!target.selected) {
                for (var i=0; i<this.board.nodes.length; i++) {
                    this.board.nodes[i].selected = false;
                }
                for (var i=0; i<this.board.wires.length; i++) {
                    this.board.wires[i].selected = false;
                }
                target.selected = true;
            }

            // Make snapping cool.
            if (this.board.snap) {
                var p = this.board.snap_to(target.x, target.y);
                for (var i=0; i<this.board.nodes.length; i++) {
                    var it = this.board.nodes[i];
                    if (it.selected) {
                        it.x += p.x - target.x;
                        it.y += p.y - target.y;
                    }
                }
                for (var i=0; i<this.board.wires.length; i++) {
                    var it = this.board.wires[i];
                    if (it.selected) {
                        it.x += p.x - target.x;
                        it.y += p.y - target.y;
                    }
                }
                target.x = p.x;
                target.y = p.y;
            }
        }
    };
    this.drag = function(e, target) {
        if (target) {
            var dx = e.real_x - this.last_drag_x;
            var dy = e.real_y - this.last_drag_y;

            if (board.snap) {
                dx -= dx % board.snap_size;
                dy -= dy % board.snap_size;
            }

            for (var i=0; i<board.nodes.length; i++) {
                if (this.board.nodes[i].selected) {
                    this.board.nodes[i].x += dx;
                    this.board.nodes[i].y += dy;
                }
            }
            for (var i=0; i<board.wires.length; i++) {
                if (this.board.wires[i].selected) {
                    var n1 = this.board.wires[i].n1;
                    var n2 = this.board.wires[i].n2;
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

            this.last_drag_x += dx;
            this.last_drag_y += dy;
        }
    };
    this.dragend = function(){};
}

function NodeTool(board) {
    this.type = "node-tool";
    this.board = board;

    // `this` is overwritten in jquery callbacks, so save it here.
    var node_tool = this;

    this.elem = $('<div class="tool" id="tool_node">Nodes</div>')
        .appendTo('#tools')
        .bind('click', function() {
            node_tool.board.set_tool(node_tool);
        });

    this.mousedown = function(){};
    this.mouseup = function(){};
    this.mousemove = function(){};
    this.click = function(e) {
        var p = this.board.snap_to(e.real_x, e.real_y);
        var x = p.x;
        var y = p.y;

        new Node(this.board, x, y);
    };
    this.dragstart = function(){};
    this.drag = function(){};
    this.dragend = function(){};
}

function LineTool(board) {
    this.type = "line-tool";
    this.board = board;

    // `this` is overwritten in jquery callbacks, so save it here.
    var line_tool = this;

    this.temp_end_node = null
    this.temp_line = null;

    // Set the kind of line to make, so sub classes can overwrite it.
    this.line_kind = Resistor;

    this.elem = $('<div class="tool" id="tool_line">Lines</div>')
        .appendTo('#tools')
        .bind('click', function() {
            line_tool.board.set_tool(line_tool);
        });

    this.mousedown = function(e, target) {};
    this.mouseup = function() {}
    this.click = function(e) {}
    this.mousemove = function(e) {}
    this.dragstart = function(e, target) {;
        if (this.temp_line) {
            // Why do we still have one of these?
            this.temp_line.remove();
            this.temp_line = null;
        }
        if (target && target.type == "node") {
            this.temp_end_node = {'x': e.real_x, 'y': e.real_y};
            this.temp_line = new this.line_kind(this.board, target, this.temp_end_node);
        }
    }
    this.drag = function(e, target) {
        if (this.temp_end_node) {
            this.temp_end_node.x = e.real_x;
            this.temp_end_node.y = e.real_y;
        }
    };
    this.dragend = function(e) {
        var hit = false;
        for (var i=0; i<this.board.nodes.length; i++) {
            var it = this.board.nodes[i];
            if (it.type == 'node' && it.hit_test(e.real_x, e.real_y)) {
                if (it != this.temp_line.n1) {
                    this.temp_line.n2 = it;
                    hit = true;
                }
                break;
            }
        }
        if (!hit) {
            this.temp_line.remove();
        }
        this.temp_line = null;
        this.temp_end_node = null;
    }
}

function Serializer(board) {
    this.type = "serializer";
    this.board = board;

    // `this` is overwritten in jquery callbacks, so save it here.
    var node_tool = this;

    this.elem = $('<div class="tool" id="tool_save">Save</div>')
        .appendTo('#serial')
        .bind('click', function() {
            node_tool.board.serialize();
        });

}

function Deserializer(board) {
    this.type = "deserializer";
    this.board = board;

    // `this` is overwritten in jquery callbacks, so save it here.
    var node_tool = this;

    this.elem = $('<div class="tool" id="tool_load">Load</div>')
        .appendTo('#serial')
        .bind('click', function() {
            node_tool.board.deserialize();
        });

}



