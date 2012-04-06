var Reduction = Class.extend({
    type: "reduction",
    name: "Reduce",

    init: function(self, board) {
        self.board = board;
        self.make_elem();
    },

    //  @always:
    //      add a button to the reduction section for the given type of reduction
    make_elem: function(self) {
        self.elem = $('<div class="button" id="tool_series">'.concat(self.name.concat('</div>')))
            .appendTo('#reductions')
            .bind('click', function() {
                self.reduce(self.board.selected_resistors());
            });
    },
    
    /*
    @always:
        logs the function call to the console
    @args:
        resistors: array of resistors to attempt to apply the reduction to    
    @return:
        invalid reduction:
            undef
        valid reduction:
            nodes[] : an array of edge nodes to build the new graph on
    */
    validate: function(self, resistors) {
        console.log(self.type.concat(" validate"));
    },

    /*
    @always:
        logs the funciton call to the console
        pushes reduction to action stack
    @args:
        resistors: array of resistors to attempt to apply the reduction to    
    @return:
        reduction failed:
            false
        reduction succeeded:
            true
    */
    reduce: function(self, resistors) {
        console.log(self.type.concat(" reduce"));
    },
});

// tool for series reductions
var SeriesReduction = Reduction.extend({
    type: "series-reduction",
    name: "Series",

    init: function(self, board) {
        self._super(board);
    },

    reduce: function series_reduce (self, resistors) {
        var i, j; // iterator
        var flag; // boolean
        var r, s; // resistor
        var res = []; // resistor array
        var n0, n1, n2; // nodes
        var nodes = []; // nodes array

        self._super(resistors);

        if (self.validate(resistors)) {
            r = resistors[0];
            for (i = 1; i < resistors.length; i++) {
                s = resistors[i];
                if (s.type == 'resistor') {
                    r.resistance += s.resistance;
                    new Wire(self.board, s.n1, s.n2);
                    s.remove();
                }
            }
            prettify_resistor(r);
            self.board.undoAdd();
            return true;
        } else {
            return false;
        }
    },
    
    validate: function series_test (self, resistors) {
        var i, j; // iterator
        var nodes = []; // node array
        var connected = [], uncleared = []; // resistor array
        var r; // resistor
        var n; // node
        var flag; // boolean

        self._super(resistors);

        uncleared = [];
        for (i = 0; i < resistors.length; i++) {
            uncleared.push(resistors[i]);
        }

        nodes = uncleared.pop().nodes();

        for (i = 0; i < nodes.length; i++) {
            n = nodes[i];
            flag = true;
            while (flag && (uncleared.length > 0)) {
                flag = false;
                connected = n.resistors();
                if (connected.length == 2) {
                    for (j = 0; j < connected.length; j++) {
                        r = connected[j];
                        index = uncleared.indexOf(r)
                        if (index != -1) {
                            uncleared.splice(index, 1);
                            if (n.wired(r.n1)) {
                                n = r.n2;
                            } else {
                                n = r.n1;
                            }
                            flag = true;
                            break;
                        }
                    }
                }
            }
            nodes[i] = n; // commit the end node back to the nodes array
        }
        if (uncleared.length > 0) {
            return undefined;
        } else {
            return nodes;
        }
    },
});

var ParallelReduction = Reduction.extend({
    type: "parallel-reduction",
    name: "Parallel",

    init: function(self, board) {
        self._super(board);
    },

    reduce: function(self, resistors) {
        var nodes; // node array
        var i; // iterator
        var r, s; // resistor

        self._super(resistors);

        nodes = self.validate(resistors);
        if (nodes) {
            r = resistors[0];
            for (i = 1; i < resistors.length; i++) {
                s = resistors[i];
                if (s.type == 'resistor') {
                    r.resistance = ((r.resistance*s.resistance)/(r.resistance+s.resistance));
                    s.remove();
                }
            }
            prettify_resistor(r);
            self.board.undoAdd();
            return true;
        } else {
            return false;
        }
    },

    validate: function(self, resistors) {
        var i; // iterator
        var nodes = [], uncleared = []; // node array
        var n; // node
        var r; // resistor

        self._super(resistors);

        nodes = resistors[0].nodes();
        n = nodes[0];
        
        for (i = 1; i < resistors.length; i++) {
            r = resistors[i];
            if (n.wired(r.n1)) {
                uncleared.push(r.n2);
            } else if (n.wired(r.n2)) {
                uncleared.push(r.n1);
            } else {
                console.log("circuit was not found to be valid parallel circuit");
                return false;
            }
        }
        for (i = 0; i < uncleared.length; i++) {
            n = uncleared[i];
            if (! nodes[1].wired(n)) {
                console.log("circuit was not found to be valid parallel circuit");
                return false;
            }
        }
        console.log("circuit found to be valid parallel circuit");
        return true;
    },
});

var RemoveReduction = Reduction.extend({
    type: "remove-reduction",
    name: "Remove",

    init: function(self, board) {
        self._super(board);
    },

    reduce: function(self, resistors) {
        var nodes; // node array
        var i;

        self._super(resistors);

        nodes = self.validate(resistors);
        if (nodes) {
            for (i = 0; i < resistors.length; i++) {
                if (resistors[i].type == 'resistor') {
                    resistors[i].remove();
                }
            }
            self.board.undoAdd();
            return true;
        } else {
            return false;
        }
    },

    validate: function(self, resistors) {
        self._super(resistors);
        return true;
    },
});

var DeltaWyeReduction = Reduction.extend({
    type: "delta-wye-reduction",
    name: "Delta-Wye",

    init: function(self, board) {
        self._super(board);
    },

    reduce: function(self, resistors) {
        var nodes; // node array

        self._super(resistors);

        nodes = self.validate(resistors);
        if (nodes) {
            self.board.undoAdd();
            return true;
        } else {
            return false;
        }
    },

    validate: function(self, resistors) {
        self._super(resistors);
    },
});

var WyeDeltaReduction = Reduction.extend({
    type: "wye-delta-reduction",
    name: "Wye-Delta",

    init: function(self, board) {
        self._super(board);
    },

    reduce: function(self, resistors) {
        var nodes; // node array

        self._super(resistors);

        nodes = self.validate(resistors);
        if (nodes) {
            self.board.undoAdd();
            return true;
        } else {
            return false;
        }
    },

    validate: function(self, resistors) {
        var i, j; // iterators
        var nodes = []; // node array
        var n; // node
        var r; // resistor
        var flag; // boolean

        self._super(resistors);

        if (resistors.length != 3) {
            return false
        }

        nodes = resistors[0].nodes();

        for (i = 0; i < nodes.length; i++) {
            n = nodes[i];
            flag = true;
            if (n.resistors().length == 3) {
                for (j = 0; j < resistors.length; j++) {
                    r = resistors[j]
                    if (! ( r.n1.wired(n) || r.n2.wired(n))) {
                        flag = false;
                    }
                }
                if (flag) {
                    // collect the outside nodes for the new graph
                    return nodes;
                }
            }
        }
        return false;
    },
});


/*
@args:
    a: node, or object with a.x and a.y
    b: node, or object with a.x and a.y
    ignore_elements: a list of elements to ignore collisions from
@return:
    collision:
        true
    no-collision:
        false
*/
function prettify_collision(a, b, ignore_elements) {
    var i, j; // iterator
    var e; // element
    var n; // node
    var board_elements = []; // element array
    var nodes = [], ignore_nodes = [], board_nodes = []; // node array
    var index; // integers
    console.log("prettify_collision");
    
    // find all nodes connected to an element in elements
    for (i = 0; i < ignore_elements.length; i++) {
        e = ignore_elements[i];
        nodes = e.nodes();
        for (j = 0; j < nodes.length; j++) {
            if (ignore_nodes.indexOf(nodes[j]) == -1) {
                ignore_nodes.push(nodes[j]);
            }
        }
    }

    //find any nodes that collide with the line from a to b
    board_nodes = a.board.nodes;
    for (i = 0; i < board_nodes.length; i++) {
        n = board_nodes[i];
        if (ignore_nodes.indexOf(n) == -1) {
            if ((new ProtoWire(undefined, a, b)).hit_test(n.x, n.y)) {
                console.log("node collision detected");
                return true;
            }
        }
    }

    board_elements = a.board.elements;
    for (i = 0; i < board_elements.length; i++){
        e = board_elements[i];
        if (((e.n1 === a) && (e.n2 === b)) ||
                ((e.n2 === a) && (e.n1 === b))) {
            if (ignore_elements.indexOf(e) == -1) {
                console.log("element collision detected");
                return true;
            }
        }
    }

    console.log("clear to prettify");
    return false;
}

/*
@args:
    resistor: a single resistor that may need the wires around it cleaned
@return:
    no pretty-fying occured:
        false
    pretty-fying occured:
        true
*/
function prettify_resistor(resistor) {
    var i, j; // iterator
    var r = false, flag; // boolean
    var n; // node
    var nodes = []; // node array
    var e; // element
    var elements = []; // element array
    var reduction_elements = [[],[]]; // array of element arrays

    nodes = resistor.nodes();
    for (i = 0; i < nodes.length; i++) {
        n = nodes[i];
        r &= prettify_trim_wire(n);

        e = resistor;
        while (true) {
            elements = n.elements();
            if (elements.length == 2) {
                flag = false;
                for (j = 0; j < elements.length; j++) {
                    if (! (elements[j] === e)) {
                        if (! (elements[j].type == "wire")) {
                            flag = true;
                        } else {
                            e = elements[j];
                            reduction_elements[i].push(e);
                            if (e.n1 === n) {
                                n = e.n2;
                            } else {
                                n = e.n1;
                            }
                            break;
                        }
                    }
                }
                if (flag) {
                    break;
                }
            } else {
                break;
            }
        }

        nodes[i] = n;
    }
    
    while (true) {
        flag = prettify_collision(nodes[0], nodes[1], 
                 reduction_elements[0].concat(reduction_elements[1]).concat([resistor]));
        if (! flag) {
            break;
        } else {
            //bring nodes[0] in one
            n = nodes[0];
            e = reduction_elements[0].pop();
            if (e) {
                if (e.n1 === nodes[0]) {
                    nodes[0] = e.n2;
                } else {
                    nodes[0] = e.n1;
                }
            }

            flag = prettify_collision(nodes[0], nodes[1], 
                     reduction_elements[0].concat(reduction_elements[1]).concat([resistor]));
            if (! flag) {
                break;
            } else {
                // push nodes[0] out one
                if (e) {
                    reduction_elements[0].push(e);
                    nodes[0] = n;
                }

                // bring nodes[1] in one
                e = reduction_elements[1].pop();
                if (e) {
                    if (e.n1 === nodes[1]) {
                        nodes[1] = e.n2;
                    } else {
                        nodes[1] = e.n1;
                    }
                }

                flag = prettify_collision(nodes[0], nodes[1], 
                         reduction_elements[0].concat(reduction_elements[1]).concat([resistor]));
                if (! flag) {
                    break;
                }  else {
                    // bring nodes[0] in one
                    e = reduction_elements[0].pop();
                    if (e) {
                        if (e.n1 === nodes[0]) {
                            nodes[0] = e.n2;
                        } else {
                            nodes[0] = e.n1;
                        }
                    }
                    
                    if ((reduction_elements[0].length == 0) && (reduction_elements[1].length == 0)) {
                        return r;
                    }
                }
            }
        }
    }

    resistor.n1_migrate(nodes[0]);
    resistor.n2_migrate(nodes[1]);

    for (i = 0; i < reduction_elements.length; i++) {
        elements = reduction_elements[i];
        for (j = 0; j < elements.length; j++) {
            e = elements[j];
            e.remove();
            if (nodes.indexOf(e.n1) == -1) {
                e.n1.remove();
            }
            if (nodes.indexOf(e.n2) == -1) {
                e.n2.remove();
            }
        }
    }

    return true;
}

/*
@args:
    resistors: an array of *three* resistors that make up a delta circuit,
        and may need wires around them cleaned
@return:
    no pretty-fying occured:
        false
    pretty-fying occured:
        true
*/
function prettify_delta(resistors) {
}

/*
@args
    resistors: an array of *three* resistors that make up a wye circuit,
        and may need wires around them cleaned
@return:
    no pretty-fying occured:
        false
    pretty-fying occured:
        true
*/
function prettify_wye(resistors) {
}

/*
@args
    n: a node whose wires may have extraneous branches to purge
@return:
    no pretty-fying occured:
        false
    pretty-fying occured:
        true
*/
function prettify_trim_wire(node) {
    var i; // iterator
    var nodes = []; // node array

    nodes = node.nodes();

    for (i = 0; i < nodes.length; i++) {
        n = nodes[i];
        elements = n.elements();
        while ((elements.length == 1) && (elements[0].type == "wire")) {
            elements[0].remove();
            n.remove();
            if (n === elements[0].n1) {
                n = elements[0].n2;
            } else {
                n = elements[0].n1;
            }
            elements = n.elements();
        }
    }
}
