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
        self.elem = $('<div class="button" id="' + self.type + '">' + self.name + '</div>')
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
        console.log(self.name.concat(" validate"));
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
        console.log(self.name.concat(" reduce"));
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
                return undefined;
            }
        }
        for (i = 0; i < uncleared.length; i++) {
            n = uncleared[i];
            if (! nodes[1].wired(n)) {
                return undefined;
            }
        }
        return nodes;
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
    	var corner1 = resistors[0].n1.nodes();
		var corner2 = resistors[0].n2.nodes();
		var corner3 = [];
		var i;
		var cent_cords = {'x': 0, 'y': 0};
		var cent_node;
		var corn1_res = (resistors[0].resistance * resistors[1].resistance * resistors[2].resistance) / (resistors[0].resistance + resistors[1].resistance + resistors[2].resistance);
		var corn2_res = corn1_res, corn3_res =corn1_res; 
		if (corner1.indexOf(resistors[1].n1) != -1) {
			corner3 = resistors[1].n2.nodes();
		} else if (corner2.indexOf(resistors[1].n1) != -1) {
			corner3 = resistors[1].n2.nodes();
		} else {
			corner3 = resistors[1].n1.nodes();
		}
		cent_cords.x = (corner1[0].x + corner2[0].x + corner3[0].x) / 3;
		cent_cords.y = (corner1[0].y + corner2[0].y + corner3[0].y) / 3;
		cent_cords = self.board.snap_to(cent_cords.x, cent_cords.y);
		cent_node = new Node(self.board, cent_cords.x, cent_cords.y);
		for (i = 0; i < 3; i++) {
			if (corner1.indexOf(resistors[i].n1) == -1 && corner1.indexOf(resistors[i].n2) == -1) {
				corn1_res = corn1_res / resistors[i].resistance;
			}
			if (corner2.indexOf(resistors[i].n1) == -1 && corner2.indexOf(resistors[i].n2) == -1) {
				corn2_res = corn2_res / resistors[i].resistance;
			}
			if (corner3.indexOf(resistors[i].n1) == -1 && corner3.indexOf(resistors[i].n2) == -1) {
				corn3_res = corn3_res / resistors[i].resistance;
			}
		}
		resistors[0].n1 = corner1[0];
		resistors[0].n2 = cent_node;
		resistors[0].resistance = corn1_res;
		resistors[1].n1 = corner2[0];
		resistors[1].n2 = cent_node;
		resistors[1].resistance = corn2_res;
		resistors[2].n1 = corner3[0];
		resistors[2].n2 = cent_node;
		resistors[2].resistance = corn3_res;
		self.board.undoAdd();
		return true;
        } else {
            return false;
        }
    },

    validate: function(self, resistors) {
        self._super(resistors);
	if (resistors.length != 3) {
		return false;
	} else {
		var corner1 = resistors[0].n1.nodes();
		var corner2 = resistors[0].n2.nodes();
		var corner3 = [];
		var corn_val1 = 0, corn_val2 = 0, corn_val3 = 0;
		var i;
		if (corner1.indexOf(resistors[1].n1) != -1) {
			corner3 = resistors[1].n2.nodes();
		} else if (corner2.indexOf(resistors[1].n1) != -1) {
			corner3 = resistors[1].n2.nodes();
		} else {
			corner3 = resistors[1].n1.nodes();
		}
		for (i = 0; i < 3; i++) {
			if (resistors[i].n1.wired(resistors[i].n2)) {
				return false;
			}
			if (corner1.indexOf(resistors[i].n1) != -1){
				corn_val1++;
			}
			if (corner1.indexOf(resistors[i].n2) != -1){
				corn_val1++;
			}
			if (corner2.indexOf(resistors[i].n1) != -1){
				corn_val2++;
			}
			if (corner2.indexOf(resistors[i].n2) != -1){
				corn_val2++;
			}
			if (corner3.indexOf(resistors[i].n1) != -1){
				corn_val3++;
			}
			if (corner3.indexOf(resistors[i].n2) != -1){
				corn_val3++;
			}
		}
		if (corn_val1 == 2 && corn_val2 == 2 && corn_val3 == 2){
			return true;
		} else {
			return false;
		}
	}
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
        var nodes = [], nodes2 = []; // node array
        var n; // node
        var r; // resistor
        var flag; // boolean

        self._super(resistors);

        if (resistors.length != 3) {
            return undefined;
        }

        nodes = resistors[0].nodes();

        for (i = 0; i < nodes.length; i++) {
            n = nodes[i];
            flag = true;
            if (n.resistors().length == 3) {
                nodes2 = [nodes[((i - 1)* -1)]];
                for (j = 0; j < resistors.length; j++) {
                    r = resistors[j]
                    if (r.n1.wired(n)) {
                        nodes2.push(r.n2);
                    } else if (r.n2.wired(n) {
                        nodes2.push(r.n1);
                    } else {
                        flag = false;
                    }
                }
                if (flag) {
                    return nodes2;
                }
            }
        }
        return undefined;
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
