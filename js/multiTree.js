const trees=[null, null];
const segments=[null, null];
let virus="h3n2";
let resolution="3y";
var node_map = {};
const height=900;
const width=600;
const tangle_width=100;
const prefix = "/data/flu_";
const tangle = d3.select("#tangle");
tangle.attr("width", tangle_width).attr("height",height);
const segment_order = {'pb1':0, 'pb2':1, 'pa':2, 'ha':3, 'np':4, 'na':5, 'm':6, 'ns':7}
const colorby = "ha_ladder";
let untangle = true;
const r=3, highlightR = 5;
const highlightFill = "#DA4", highlightStroke = "#C93";
const colors =   ["#426FCE", "#4B8DC2", "#59A3AA", "#6BB18D", "#82BA71", "#9CBE5B", "#B7BD4B", "#CFB541", "#DFA43B", "#E68735", "#E35E2D", "#DD3124"];
const genericDomain = [ 0, 0.111, 0.222, 0.333, 0.444, 0.555, 0.666, 0.777, 0.888, 1.0 ];

var colorTree =function(t1, t2) {
    var cScale = d3.scale.linear().domain(genericDomain).range(colors);
    var nTips= trees[0].numberOfTips;
    var cols = trees[0].nodes.map(function (d){return cScale(1.0*d.n.clade/nTips);});
    var nTips= trees[1].numberOfTips;
    //var colsPartner = trees[1].nodes.map(function (d){return d.partners?cScale(1.0*d.partners[0].n.clade/nTips):"#CCCCCC";});
    var colsPartner = trees[1].nodes.map(function (d){return cScale(1.0*d.n.clade/nTips);});
    if (trees[0]){
        var attrs = {'r': trees[0].nodes.map(function(d){return d.selected?highlightR:r;})};
        trees[0].updateMultipleArray('.tip', attrs, {fill:cols, stroke:cols.map(function(d){return d3.rgb(d).darker();})}, 0);
        attrs = {'r': trees[1].nodes.map(function(d){return d.selected?highlightR:r;})};
        trees[1].updateMultipleArray('.tip', attrs, {fill:colsPartner, stroke:colsPartner.map(function(d){return d3.rgb(d).darker();})}, 0);
    }
}

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
    const attrs = {'r': trees[ti].nodes.map(function(d){return d.selected?highlightR:r;})};
    const styles = {'fill': trees[ti].nodes.map(function(d){return d.selected?highlightFill:d.fill;}),
                    'stroke': trees[ti].nodes.map(function(d){return d.selected?highlightStroke:d.stroke;})};
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
    colorTree();
    tangle.selectAll(".tangles")
        .style("stroke","#CCC")
        .style("stroke-width",2);
};

var branchClick = function(node){
    console.log("click", node.n.strain);
};

var tipHover = function(tip){
  trees[tip.tree].svg.select("#tip_"+tip.n.clade)
        .attr("r", highlightR)
        .style("stroke", function(d) {return highlightStroke;})
        .style("fill", function(d) { return highlightFill;});
  for (var pi=0; pi<tip.partners.length; pi++)
  {
    var ptip = tip.partners[pi];
    trees[ptip.tree].svg.select("#tip_"+ptip.n.clade)
        .attr("r", highlightR)
        .style("stroke", function(d) {return highlightStroke;})
        .style("fill", function(d) { return highlightFill;});
  }
  for (var ci=0; ci<tip.tangles.length; ci++){
    tangle.select("#tangle_"+tip.tangles[ci])
        .style("stroke",highlightFill)
        .style("stroke-width",r);
  }
};

var tipMouseOut = function(tip){
  colorTree();
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

var postorder = function(node, func){
    if (node.children){
        for (var ci=0; ci<node.children.length; ci++){
            postorder(node.children[ci], func);
        }
    }
    func(node);
}

var loadTree = function(tid, name) {
    d3.json(name+'_tree.json', function(err,data){
        const tree = d3.layout.tree().size([1,1]);
        const nodes = tree.nodes(data);
        const treeplot = d3.select("#treeplot"+tid.toString());
        if (tid===2 && untangle){
            var orderFunc = function() {
                const other_tree = segment_order[segments[0]];
                //return function (d){return d.attr.ladder_ranks[other_tree];};
                return function (d){return 1.0;};
            }
            var ofunc = orderFunc();
            // nodes.filter(function (d){return typeof d.children!=="undefined";})
            //      .forEach(function(d){
            //         d.children.sort(function(a,b){return ofunc(a)-ofunc(b);});
            //     });
            var totalNodes = nodes.filter(function(d){return (typeof d.children=="undefined");}).length;
            var processFunc = function(d){
                var count=0;
                return function(d){
                    if (d.children){
                        var ysum=0;
                        for (var ci=0; ci<d.children.length; ci++){
                            ysum+=d.children[ci].yValue;
                        }
                        d.yValue = ysum/d.children.length;
                    }else{
                        //console.log(d.strain, d.yvalue, count);
                        d.yValue = totalNodes - count;
                        count++;
                    }
                };
            }
            postorder(nodes[0], processFunc());
            const other_tree = segment_order[segments[0]];
            nodes.forEach(function(d){d.yvalue=d.yValue;});
        }

        trees[tid-1] = new PhyloTree(nodes[0]);
        treeplot.attr("width", width).attr("height", height);
        trees[tid-1].render(treeplot, "rectangular", "num_date", {orientation:[tid===1?1:-1,1]}, callbacks);
        trees[tid-1].nodes.forEach(function (d) {return d.tree=tid-1;});
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
    var tmp_virus = document.getElementById("virus").value
    var tmp_resolution = document.getElementById("resolution").value
    var seg1 = document.getElementById("tree1").value
    var seg2 = document.getElementById("tree2").value
    console.log(tmp_virus, tmp_resolution, seg1, seg2);

    var dataset = tmp_virus+"_"  + seg1 +"_" + tmp_resolution +"_cell_hi";
    segments[0]=seg1;
    loadTree(1,prefix + dataset);

    var dataset = tmp_virus+"_"  + seg2 +"_" + tmp_resolution +"_cell_hi";
    segments[1]=seg2;
    loadTree(2,prefix+ dataset);

    setTimeout( makeTangle, 3000);
    virus=tmp_virus;
    resolution=tmp_resolution;
}

var makeTangle = function(){
    tangle.selectAll(".tangles").remove();
    var node_pairs = [];
    for (var ti=0; ti<trees.length; ti++){
        const tips = trees[ti].nodes.filter(function (d) {return d.terminal;});
        console.log("tree", ti, ": number of tips:", tips.length);
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
    colorTree();
}


d3.select("#makeTangle").on("click", function(d){console.log("Button pressed"); makeTangle();});

d3.select("#tree1").on("change", function() {
    changeTrees();
})

d3.select("#tree2").on("change", function() {
    changeTrees();
})

d3.select("#virus").on("change", function() {
    changeTrees();
})

d3.select("#resolution").on("change", function() {
    changeTrees();
})

d3.select("#untangle").on("change", function() {
    untangle = document.getElementById("untangle").checked;
})

changeTrees();
