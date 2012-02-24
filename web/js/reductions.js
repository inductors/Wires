// returns true if valid, false if invalid
function series_test (resistors) {
    var i, j; // iterators
    var nodes; // node array
    var connected, uncleared; // resistor array
    var r; // resistor
    var n; // node
    var flag; // boolean

    for (i = 0; i < resistors.length; i++) {
        r = resistors[i];
        uncleared.push(r);
    }

    r = uncleared.pop;
    nodes = [r.n1, r.n2];

    for (i=0; i < nodes.length; i++) {
        n = nodes[i];
        flag = true;
        while (flag && (uncleared.length > 0)) {
            flag = false;
            connected = n.resistors;
            if connected.length == 2 {
                for (j=0; j < connected.length; j++) {
                    r = connected[j];
                    index = uncleared.indexOf(r)
                    if (index != -1) {
                        uncleared.splice(index, 1);
                        if n.connected(r.n1) {
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
        return false;
    } else {
        return true;
    }
}

// returns true if valid and successfully transformed, and false if invalid or unsuccessful
function series_reduce (resistors) {
    var i; // iterator
    var r, s; // resistor

    if series_test(resistors) {
        r = resistors[0];
        for (i = 1; i < resistors.length; i++) {
            s = resistors[i]
            r.resistance += s.resistance;
            s.type = 'line';
            Line(s.board, s.n1, s.n2);
            s.remove();
        }   
        return true;
    } else {
        return false;
    }
}

// returns true if valid, false if invalid
function parallel_test (resistors) {
    var i; // iterator
    var nodes, uncleared; // node array
    var n; // node
    var r; // resistor

    r = resistors[0];
    nodes = [r.n1, r.n2];
    n = nodes[0];
    
    for (i = 1; i < resistors.length; i++) {
        r = resistors[i];
        if n.connected(r.n1) {
            uncleared.push(r.n2);
        } else if n.connected(r.n2) {
            uncleared.push(r.n1);
        } else {
            return false;
        }
    }
    for n in uncleared
    for (i = 0; i < uncleared.length; i++) {
        n = uncleared[i];
        if (! nodes[1].connected(n)) {
            return false;
        }
    }
    return true;
}

// returns true if valid and successfully transformed, and false if invalid or unsuccessful
function parallel_reduce (resistors) {
    if parallel_test(resistors) {
        reduce;
        return true;
    } else {
        return false;
    }
}
function resistor_test (resistors) {
    ;
}
function resistor_reduce (resistors) {
    ;
}
function delta_wye_test (resistors) {
    ;
}
function delta_wye_reduce (resistors) {
    ;
}

// Returns the center node if valid, and false if invalid
function wye_delta_test (resistors) {
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
            if (flag == true) {
                return n;
            }
        }
    }
    return false;

}

// returns true if valid and successfully transformed, and false if invalid or unsuccessful
function wye_delta_reduce (resistors) {
    var n = wye_delta_test(resistors); // false or the center node

    if (n != false) {
        reduce;
        return true;
    } else {
        return false;
    }
}
