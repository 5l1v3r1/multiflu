const trees=[null, null];
const segments=[null, null];
const node_map = {};
const height=600;
const width=600;
const tangle_width=100;
const prefix = "yam_3y_";
const tangle = d3.select("#tangle");
tangle.attr("width", tangle_width).attr("height",height);

var branchHover = function(node){
    console.log("Hover", node.n.strain);

};

var branchMouseOut = function(node){
    console.log("Hover", node.n.strain);
};

var branchClick = function(node){
    console.log("click", node.n.strain);
};

var tipHover = function(tip){
    console.log("tipHover", tip.n.strain);
    trees[0].selectTip(tip);
    trees[1].selectTip(tip);
};

var tipMouseOut = function(tip){
  console.log("tipHover", tip.n.strain);
  for (var ti=0; ti<trees.length; ti++){
      trees[ti].svg.select("#tip_"+tip.n.clade)
        .style("stroke", function(d) {return "#AAA";})
        .style("stroke-dasharray", function(d) {return "none";})
        .style("fill", function(d) { return d.fill||"#CCC";});
  }
};

var tipClick = function(tip){
    console.log("tipClick", tip.n.strain);
};

const callbacks = {onBranchHover:branchHover, onBranchClick:branchClick, onBranchMouseOut:branchMouseOut,
                   onTipClick:tipClick, onTipHover: tipHover, onTipMouseOut:tipMouseOut}

var loadTree = function(tid, name) {
    d3.json(name+'_tree.json', function(err,data){
        const tree = d3.layout.tree().size([1,1]);
        const nodes = tree.nodes(data);
        trees[tid-1] = new PhyloTree(nodes[0]);
        const treeplot = d3.select("#treeplot"+tid.toString());
        treeplot.attr("width", width).attr("height", height);
        trees[tid-1].render(treeplot, "rectangular", "div", {orientation:[tid===1?1:-1,1]}, callbacks);
        const tips = trees[tid-1].nodes.filter(function (d) {return d.terminal;});
        for (var ni=0; ni<tips.length; ni++){
            if (typeof node_map[tips[ni].n.strain] === "undefined"){
                node_map[tips[ni].n.strain] = [[],[]];
            }
            node_map[tips[ni].n.strain][tid-1].push(tips[ni]);
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
    console.log("making tangle");
    const node_pairs = [];
    for (var d in node_map){
        var x = node_map[d]
        for (var n1=0; n1<x[0].length; n1++){
            for (var n2=0; n2<x[1].length; n2++){
                node_pairs.push([x[0][n1], x[1][n2]]);
            }
        }
    }
    tangle.selectAll(".tangles").remove();
    tangle.selectAll(".tangles").data(node_pairs).enter()
        .append("path")
        .attr("class","tangles")
        .attr("d",function(d){
            var d = "M 0 " + (d[0].yTip).toString() + " L "+tangle_width.toString()+" "+(d[1].yTip).toString();
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
