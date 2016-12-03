const trees=[null, null];
const segments=[null, null];
const node_map = {};
const height=600;
const width=600;
const tangle_width=100;
const prefix = "yam_3y_";
const tangle = d3.select("#tangle");
tangle.attr("width", tangle_width).attr("height",height);

var loadTree = function(tid, name) {
    d3.json(name+'_tree.json', function(err,data){
        const tree = d3.layout.tree().size([1,1]);
        const nodes = tree.nodes(data);
        trees[tid-1] = new PhyloTree(nodes[0]);
        const treeplot = d3.select("#treeplot"+tid.toString());
        treeplot.attr("width", width).attr("height", height);
        trees[tid-1].render(treeplot, "rectangular", "div", {orientation:[tid===1?1:-1,1]});
        const tips = trees[tid-1].nodes.filter(function (d) {return d.terminal;});
        for (var ni=0; ni<tips.length; ni++){
            if (typeof node_map[tips[ni].n.strain] === "undefined"){
                node_map[tips[ni].n.strain] = [null,null];
            }
            node_map[tips[ni].n.strain][tid-1] = tips[ni];
        }
    });
};

var changeTrees = function() {
    var seg1 = document.getElementById("tree1").value
    var seg2 = document.getElementById("tree2").value
    console.log(seg1, seg2);
    if (seg1!==segments[0]){
        loadTree(1,prefix+seg1);
    }
    if (seg2!==segments[1]){
        loadTree(2,prefix+seg2);
    }
    setTimeout( makeTangle, 300);
}

var makeTangle = function(){
    console.log("making tangle", node_map);
    tangle.selectAll(".tangles").remove();
    tangle.selectAll(".tangles").data(Object.keys(node_map).map(function(d) {return node_map[d];})).enter()
        .append("path")
        .attr("class","tangles")
        .attr("d",function(d){
            var d = "M 0 " + (d[0].yTip).toString() + " L "+tangle_width.toString()+" "+(d[1].yTip).toString();
            console.log(d);
            return d;
        })
        .style("stroke",function(){return "#CCC";})
        .style("stroke-width",function(){return 2;});
}


d3.select("#makeTangle").on("click", function(d){console.log("Button pressed"); makeTangle();});

d3.select("#tree1").on("change", function() {
    var seg = document.getElementById("tree1").value
    console.log("tree1:", seg);
    changeTrees();
})

d3.select("#tree2").on("change", function() {
    var seg = document.getElementById("tree2").value
    console.log("tree2:", seg);
    changeTrees();
})

changeTrees();
