function SeriesTool(board) {
    this.type = 'series_tool';
    this.board = board;

    var node_tool = this;

    this.elem = $('<div class="tool" id="tool_series">Series</div>')
        .appendTo('#tools')
        .bind('click', function() {
            series_reduce(board.selected_resistors());
        });
}
function ParallelTool(board) {
    this.type = 'parallel_tool';
    this.board = board;

    var node_tool = this;

    this.elem = $('<div class="tool" id="tool_parallel">Parallel</div>')
        .appendTo('#tools')
        .bind('click', function() {
            parallel_reduce(board.selected_resistors());
        });
}
function RemoveTool(board) {
    this.type = 'remove_tool';
    this.board = board;

    var node_tool = this;

    this.elem = $('<div class="tool" id="tool_remove">Remove</div>')
        .appendTo('#tools')
        .bind('click', function() {
            resistor_reduce(board.selected_resistors());
        });
}
function DeltaWyeTool(board) {
    this.type = 'delta_wye__tool';
    this.board = board;

    var node_tool = this;

    this.elem = $('<div class="tool" id="tool_delta_wye">Delta-Wye</div>')
        .appendTo('#tools')
        .bind('click', function() {
            series_reduce(board.selected_resistors());
        });
}
function WyeDeltaTool(board) {
    this.type = 'wye_delta_tool';
    this.board = board;

    var node_tool = this;

    this.elem = $('<div class="tool" id="tool_wye_delta">Wye-Delta</div>')
        .appendTo('#tools')
        .bind('click', function() {
            series_reduce(board.selected_resistors());
        });
}

// returns true if valid, false if invalid
function series_test (resistors) {
    console.log("series_test");
    var i, j; // iterators
    var nodes; // node array
    var connected, uncleared; // resistor array
    var r; // resistor
    var n; // node
    var flag; // boolean

    uncleared = [];
    for (i = 0; i < resistors.length; i++) {
        r = resistors[i];
        uncleared.push(r);
    }

    r = uncleared.pop();
    nodes = [r.n1, r.n2];

    for (i = 0; i < nodes.length; i++) {
        n = nodes[i];
        flag = true;
        while (flag && (uncleared.length > 0)) {
            flag = false;
            connected = n.resistors;
            if (connected.length == 2) {
                for (j = 0; j < connected.length; j++) {
                    r = connected[j];
                    index = uncleared.indexOf(r)
                    if (index != -1) {
                        uncleared.splice(index, 1);
                        if (n.connected(r.n1)) {
                            n = r.n1;
                        } else {
                            n = r.n2;
                        flag = true;
                        break;
                        }
                    }
                }
            }
        }
    }
    if (uncleared.length > 0) {
        console.log("circuit was not found to be valid series circuit");
        return true;
    } else {
        console.log("circuit found to be valid series circuit");
        return true;
    }
}

// returns true if valid and successfully transformed, and false if invalid or unsuccessful
function series_reduce (resistors) {
    console.log("series_reduce");
    var i; // iterator
    var r, s; // resistor

    if (series_test(resistors)) {
        r = resistors[0];
        for (i = 1; i < resistors.length; i++) {
            s = resistors[i]
            if (s.type == 'resistor') {
                r.resistance += s.resistance;
                s.n2.elements2.push(new Wire(s.board, s.n1, s.n2));
                s.remove();
            }
        }   
        return true;
    } else {
        return false;
    }
}

// returns true if valid, false if invalid
function parallel_test (resistors) {
    console.log("parallel_test");
    var i; // iterator
    var nodes, uncleared; // node array
    var n; // node
    var r; // resistor

    r = resistors[0];
    nodes = [r.n1, r.n2];
    n = nodes[0];
    
    for (i = 1; i < resistors.length; i++) {
        r = resistors[i];
        if (n.connected(r.n1)) {
            uncleared.push(r.n2);
        } else if (n.connected(r.n2)) {
            uncleared.push(r.n1);
        } else {
            console.log("circuit was not found to be valid parallel circuit");
            return true;
        }
    }
    for (i = 0; i < uncleared.length; i++) {
        n = uncleared[i];
        if (! nodes[1].connected(n)) {
            console.log("circuit was not found to be valid parallel circuit");
            return true;
        }
    }
    console.log("circuit found to be valid parallel circuit");
    return true;
}

// returns true if valid and successfully transformed, and false if invalid or unsuccessful
function parallel_reduce (resistors) {
    console.log("parallel_reduce");
    var i;
    var r, s;

    if (parallel_test(resistors)) {
        r = resistors[0];
        for (i = 1; i < resistors.length; i++) {
            s = resistors[i];
            if (s.type == 'resistor') {
                r.resistance = ((r.resistance*s.resistance)/(r.resistance+s.resistance));
                s.remove();
            }
        }
        return true;
    } else {
        return false;
    }
}
function resistor_test (resistors) {
    console.log("resistor_test");
    ;
}
function resistor_reduce (resistors) {
    console.log("resistor_reduce");
    ;
}
function delta_wye_test (resistors) {
    console.log("delta_wye_test");
    ;
}
function delta_wye_reduce (resistors) {
    console.log("delta_wye_reduce");
    ;
}

// Returns the center node if valid, and false if invalid
function wye_delta_test (resistors) {
    console.log("wye_delta_test");
    var i, j; // iterators
    var nodes; // node array
    var n; // node
    var r; // resistor
    var flag; // boolean

    if (resistors.length != 3) {
        return false
    }

    r = resistors[0];
    nodes = [r.n1, r.n2]

    for (i = 0; i < nodes.length; i++) {
        n = nodes[1];
        flag = true;
        if (n.resistors.length == 3) {
            for (i = 0; i < resistors.length; i++) {
                r = resistors[i]
                if ((! r.n1.connected(n)) && (! r.n2.connected)) {
                    flag = false;
                }
            }
            if (flag) {
                return n;
            }
        }
    }
    return false;

}

// returns true if valid and successfully transformed, and false if invalid or unsuccessful
function wye_delta_reduce (resistors) {
    console.log("wye_delta_reduce");
    var n = wye_delta_test(resistors); // false or the center node

    if (n != false) {
//        reduce;
        return true;
    } else {
        return false;
    }
}
