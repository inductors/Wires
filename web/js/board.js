$(function() {
    var b = new Board();
    var n1 = new Node(b, 25, 25);
    var n2 = new Node(b, 250, 50);
    b.nodes.push(n1);
    b.nodes.push(n2);
    var l = new Line(b, n1, n2);
    board.redraw();
});

function Board() {
    this.drawers = [];

    this.nodes = [];
    this.selected = [];
    this.drag = 0;
    this.drag_target = null;

    this.canvas = document.getElementById('board');
    this.ctx = this.canvas.getContext('2d');

    this.add_node = function(x, y) {
        this.nodes.push(new Node(this, x, y));
        this.redraw();
    }

    this.redraw = function() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        for (var i=0; i<this.drawers.length; i++) {
            this.drawers[i].draw(this.ctx);
        };
    }

    var board = this;
    $('#board').bind('mousedown', function(e) {
        for (var i=0; i<board.nodes.length; i++) {
            if (board.nodes[i].hit_test(e.offsetX, e.offsetY)) {
                board.drag_target = board.nodes[i];
                board.drag = 1;
            }
        }
    });

    $('#board').bind('mousemove', function(e) {
        console.log('mousemove');
        if (board.drag == 1) {
            board.drag = 2;
        }
        if (board.drag == 2) {
            board.drag_target.x = e.offsetX;
            board.drag_target.y = e.offsetY;
            board.redraw();
        }
    });

    $('#board').bind('mouseup', function(e) {
        console.log('mouseup');
        var hit = false;
        if (board.drag < 2) {
            for (var i=0; i<board.nodes.length; i++) {
                if (board.nodes[i].hit_test(e.offsetX, e.offsetY)) {
                    // Toggle.
                    board.nodes[i].selected ^= true;
                    board.redraw();
                    hit = true;
                    break;
                }
            }
            if (!hit) {
                board.add_node(e.offsetX, e.offsetY);
            }
        }

        board.drag = 0;
        board.drag_target = null;
    });
}

function Node(board, x, y) {
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
        var fuzzy_r = this.r + 3;

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
}
