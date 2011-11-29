function getCursorPosition(e, target) {
    var x;
    var y;
    if (e.pageX != undefined && e.pageY != undefined) {
        x = e.pageX;
        y = e.pageY;
    } else {
        x = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
        y = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
    }
    x -= target.position().left;
    y -= target.position().top;

    return {'x': x, 'y': y};
}

$(function() {
    var b = new Board();
    var n1 = new Node(b, 25, 25);
    var n2 = new Node(b, 250, 50);
    var l = new Line(b, n1, n2);
    b.redraw();

    var a = new ArrowTool(b);
    b.set_tool(a);
});

function Board() {
    this.type = "board";
    this.drawers = [];

    this.drag = 0;
    this.drag_target = null;

    this.canvas = document.getElementById('board');
    this.ctx = this.canvas.getContext('2d');

    this.add_node = function(x, y) {
        this.redraw();
    }

    this.redraw = function() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        for (var i=0; i<this.drawers.length; i++) {
            this.drawers[i].draw(this.ctx);
        };
    }

    this.set_tool = function(tool) {
        if (this.cur_tool) {
            $(this.cur_tool.elem).removeClass('active');
        }
        this.cur_tool = tool;
        $(this.cur_tool.elem).addClass('active');
    }

    var board = this;
    $('#board').bind('mousedown', function(e) {
        if (!board.cur_tool) {
            return;
        }
        var p = getCursorPosition(e, $('#board'));
        e.real_x = p.x; e.real_y = p.y;

        console.log(e.real_x + ' ' + e.real_y);
        for (var i=0; i<board.drawers.length; i++) {
            if (board.drawers[i].hit_test(e.real_x, e.real_y)) {
                board.drag_target = board.drawers[i];
                board.drag = 1;
            }
        }
        board.cur_tool.mousedown(e, board.drag_target);
    });

    $('#board').bind('mousemove', function(e) {
        if (!board.cur_tool) {
            return;
        }
        var p = getCursorPosition(e, $('#board'));
        e.real_x = p.x; e.real_y = p.y;

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
}

function Node(board, x, y) {
    this.type = "node";
    this.board = board;
    this.x = x;
    this.y = y;
    this.r = 5;
    this.selected = false;
    this.hover = false;

    board.drawers.push(this);

    this.draw = function() {
        var ctx = board.ctx;
        ctx.save();

        ctx.strokeStyle = 'rgb(0,0,0)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI*2, true);

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
            ctx.stroke();
        }

        ctx.restore();
    }

    /* Check if a given point is within the bounds of this node. */
    this.hit_test = function(x, y) {
        // Make clicking a bit easier.
        var fuzzy_r = this.r + 15;

        // Fast bounding box check
        if ((Math.abs(x - this.x) > fuzzy_r) || (Math.abs(y - this.y) > fuzzy_r)) {
            return false;
        }
        // Check the actual circle.
        var d_sq = Math.pow(x - this.x, 2) + Math.pow(y - this.y, 2);
        return d_sq < Math.pow(fuzzy_r, 2);
    }
}

function Line(board, n1, n2) {
    this.type = "line";
    this.board = board;
    this.nodes = [n1, n2];

    board.drawers.push(this);

    this.draw = function() {
        var ctx = board.ctx;
        ctx.save();
        ctx.strokeStyle = 'rgb(0,0,0)';
        ctx.strokeWeight = 2;

        ctx.moveTo(this.nodes[0].x, this.nodes[0].y);
        ctx.lineTo(this.nodes[1].x, this.nodes[1].y);
        ctx.stroke();

        ctx.restore();
    }

    this.hit_test = function() {
        return false;
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
    this.click = function(e, target) {
        var selected_objs = []
        for (var i=0; i<board.drawers.length; i++) {
            if (board.drawers[i].selected) {
                selected_objs.push(board.drawers[i]);
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
                console.log(selected_objs[0]);
                selected_objs[i].selected = false;
            }
        }
        this.board.redraw();
    };
    this.dragstart = function(e, target) {
        if (target) {
            this.drag_offset_x = e.real_x - target.x;
            this.drag_offset_y = e.real_y - target.y;
            target.selected = true;
        }
    };
    this.drag = function(e, target) {
        if (target) {
            var dx = e.real_x - (target.x + this.drag_offset_x);
            var dy = e.real_y - (target.y + this.drag_offset_y);
            console.log(dx + ' ' + dy);

            for (var i=0; i<board.drawers.length; i++) {
                if (board.drawers[i].selected) {
                    board.drawers[i].x += dx;
                    board.drawers[i].y += dy;
                }
            }
            this.board.redraw();
        }
    };
    this.dragend = function(){};
}
