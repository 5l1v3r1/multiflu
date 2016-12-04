const trees=[null, null];
const segments=[null, null];
var node_map = {};
const height=600;
const width=600;
const tangle_width=100;
const prefix = "/data/yam_3y_";
const tangle = d3.select("#tangle");
tangle.attr("width", tangle_width).attr("height",height);

var branchHover = function(node){
    console.log("Hover", node.n.strain);
    for (var ti=0; ti<trees.length; ti++){
        for (var ni=0; ni<trees[ti].nodes.length; ni++){
            trees[ti].nodes[ni].selected=false;
        }
    }
    const tanglesToUpdate = [];
    var makeCallback = function(){
	const ttu =tanglesToUpdate;
	return function(d){
	if (d.terminal){
	d.selected=true;
	for (var i=0; i<d.partners.length; i++){
	    d.partners[i].selected=true;
	}
	for (var i=0; i<d.tangles.length; i++){
	    ttu.push(d.tangles[i]);
	}
	}
    };
    };
    applyToChildren(node, makeCallback());
    for (var ti=0; ti<trees.length; ti++){
	const attrs = {'r': trees[ti].nodes.map(function(d){return d.selected?8:3;})};
	const styles = {'fill': trees[ti].nodes.map(function(d){return d.selected?"#DA4":"#CCC";}),
			'stroke': trees[ti].nodes.map(function(d){return d.selected?"#C93":"#CCC";})};
	    trees[ti].updateMultipleArray('.tip', attrs, styles, dt=0);
    }
    for (var ti=0; ti<tanglesToUpdate.length; ti++){
	tangle.select("#tangle_"+tanglesToUpdate[ti])
        .style("stroke","#DA4")
        .style("stroke-width",3);
    } 
};

var branchMouseOut = function(node){
    for (var ti=0; ti<trees.length; ti++){
        for (var ni=0; ni<trees[ti].nodes.length; ni++){
            trees[ti].nodes[ni].selected=false;
        }
    }
    for (var ti=0; ti<trees.length; ti++){
	const attrs = {'r': trees[ti].nodes.map(function(d){return d.selected?8:3;})};
	const styles = {'fill': trees[ti].nodes.map(function(d){return d.selected?"#DA4":"#CCC";}),
			'stroke': trees[ti].nodes.map(function(d){return d.selected?"#C93":"#CCC";})};
	    trees[ti].updateMultipleArray('.tip', attrs, styles, dt=0);
    }
	tangle.selectAll(".tangles")
        .style("stroke","#CCC")
        .style("stroke-width",2);
};

var branchClick = function(node){
    console.log("click", node.n.strain);
};

var tipHover = function(tip){
  for (var ti=0; ti<trees.length; ti++){
      trees[ti].svg.select("#tip_"+tip.n.clade)
        .attr("r", 8)
        .style("stroke", function(d) {return "#DA4";})
        .style("stroke-dasharray", function(d) {return "none";})
        .style("fill", function(d) { return "#C93";});
  }
  for (var ci=0; ci<tip.tangles.length; ci++){
    tangle.select("#tangle_"+tip.tangles[ci])
        .style("stroke","#DA4")
        .style("stroke-width",3);
  }
};

var tipMouseOut = function(tip){
  for (var ti=0; ti<trees.length; ti++){
      trees[ti].svg.select("#tip_"+tip.n.clade)
        .attr("r", function(d){return d.r ||5;})
        .style("stroke", function(d) {return "#AAA";})
        .style("stroke-dasharray", function(d) {return "none";})
        .style("fill", function(d) { return d.fill||"#CCC";});
  }
  for (var ci=0; ci<tip.tangles.length; ci++){
    tangle.select("#tangle_"+tip.tangles[ci])
        .style("stroke","#CCC")
        .style("stroke-width",2);
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
    node_map = {};
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
    tangle.selectAll(".tangles").remove();
    var node_pairs = [];
    for (var ti=0; ti<trees.length; ti++){
        const tips = trees[ti].nodes.filter(function (d) {return d.terminal;});
        for (var ni=0; ni<tips.length; ni++){
            tips[ni].partners = [];
            tips[ni].tangles = [];
        }
    }
    let tangle_id = 0;
    for (var d in node_map){
        var x = node_map[d]
        for (var n1=0; n1<x[0].length; n1++){
            for (var n2=0; n2<x[1].length; n2++){
                node_pairs.push([x[0][n1], x[1][n2], tangle_id.toString()]);
                x[0][n1].partners.push(x[1][n2]);
                x[1][n2].partners.push(x[0][n1]);

                x[0][n1].tangles.push(tangle_id);
                x[1][n2].tangles.push(tangle_id);
                tangle_id+=1;
            }
        }
    }

    tangle.selectAll(".tangles").data(node_pairs).enter()
        .append("path")
        .attr("class","tangles")
        .attr("id",function(d){return "tangle_"+d[2];})
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
