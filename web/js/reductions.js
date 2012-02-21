function series_test (resistors) {
    var i, j;
    var nodes;
    var connected;
    var uncleared;
    var r;
    for r in resistors
        uncleared.push(r);
    var n;
    var flag;

    r = uncleared.pop;
    nodes = [r.n1, r.n2];

    for n in nodes
        flag = true;
        while flag && (uncleared.length > 0)
            flag = false;
            connected = n.resistors;
            if connected.length == 2
                for r in connected
                    if uncleared.contains(r)
                        uncleared.remove(r);
                        if n.connected(r.n1)
                            n = r.n1;
                        else
                            n = r.n2;
                        flag = true;
                        break;
    if uncleared.length > 0
        return false;
    else
        return true;
}
function series_reduce (resistors) {
	if series_test(resistors)
        reduce;
    else
        return false;
}
function parallel_test (resistors) {
	nodes;
    n;
    r;
    uncleared;

    r = resistors[0];
    nodes = [r.n1, r.n2];
    n = nodes[0];
    
    for (i = 1; i < resistors.length; i++)
        r = resistors[i];
        if n.connected(r.n1)
            uncleared.push(r.n2);
        else if n.connected(r.n2)
            uncleared.push(r.n1);
        else
            return false;
    for n in uncleared
        if ! nodes[1].connected(n)
            return false;
    return true;
}
function parallel_reduce (resistors) {
	if parallel_test(resistors)
        reduce;
    else
        return false;
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
function wye_delta_test (resistors) {
	nodes;
    n;
    r;
    flag;

    r = resistors[0];
    nodes = [r.n1, r.n2]

    for n in nodes
        flag = true;
        if n.resistors.length == 3
            for r in resistors
                if ( ! r.n1.connected(n) ) && ( ! r.n2.connected )
                    flag = false;
            if flag == true
                return n;
    return false;

}
function wye_delta_reduce (resistors) {
	n = wye_delta_test(resistors);

    if n != false
        reduce;
    else
        return false;
}
