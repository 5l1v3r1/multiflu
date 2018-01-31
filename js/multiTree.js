const trees=[null, null];
const segments=[null, null];
let virus="h3n2";
let resolution="3y";
var node_map = {};
var w = window.innerWidth;
const width=w*0.35;
const height=width*1.4;
const tangle_width=w*0.1;
const highlightTangleSWidth=2.0;
const TangleSWidth=0.5;
const treeStrokeWidth=2.0;
const prefix = "/multiflu/data/flu_";
const tangle = d3.select("#tangle");
tangle.attr("width", tangle_width).attr("height",height);
const segment_order = {'pb1':0, 'pb2':1, 'pa':2, 'ha':3, 'np':4, 'na':5, 'm':6, 'ns':7}
let untangle = true;
const r=w/500, highlightR = w/300;
const highlightFill = "#DA4", highlightStroke = "#C93";
const colors =   ["#426FCE", "#4B8DC2", "#59A3AA", "#6BB18D", "#82BA71", "#9CBE5B", "#B7BD4B", "#CFB541", "#DFA43B", "#E68735", "#E35E2D", "#DD3124"];
var genotypeColors = ["#60AA9E", "#D9AD3D", "#5097BA", "#E59637",  "#E67030", "#AABD52","#8EBC66", "#DF4327", "#C4B945", "#75B681"];
const genericDomain = [ 0, 0.111, 0.222, 0.333, 0.444, 0.555, 0.666, 0.777, 0.888, 1.0 ];
var cScale;
var colorby;
var divergence_measure="div";

var colorTree =function(t1, t2) {
    if (!cScale){
        if (colorby=="clade"){
            colorByClade();
        }else{
            colorByGenotype();
        }
    }
    if (!cScale){
        return "fail";
    }
    var nTips= trees[0].numberOfTips;
    var cols = trees[0].nodes.map(function (d){return cScale(d.coloring);});
    var nTips= trees[1].numberOfTips;
    var colsPartner = trees[1].nodes.map(function (d){return cScale(d.coloring);});
    if (trees[0]){
        var attrs = {'r': trees[0].nodes.map(function(d){return d.selected?highlightR:r;})};
        trees[0].updateMultipleArray('.tip', attrs, {fill:cols, stroke:cols.map(function(d){return d3.rgb(d).darker();})}, 0);
        trees[0].updateMultipleArray('.branch', {}, {fill:cols, stroke:cols}, 0);
        attrs = {'r': trees[1].nodes.map(function(d){return d.selected?highlightR:r;})};
        trees[1].updateMultipleArray('.tip', attrs, {fill:colsPartner, stroke:colsPartner.map(function(d){return d3.rgb(d).darker();})}, 0);
        trees[1].updateMultipleArray('.branch', {}, {fill:colsPartner, stroke:colsPartner}, 0);
    }
    return "success";
}

function colorByClade() {
    for (var ti=1; ti>=0; ti--){
        if (!trees[ti]){
            return;
        }
        var clades = trees[ti].nodes.map(function (d) {
            if (d.n.attr.named_clades){
                d.coloring = d.n.attr.named_clades.join('/');
            }else{
                d.coloring="unassigned";
            }
            if (!d.coloring){
                d.coloring="unassigned";
            }
            return d.coloring;});
        if (ti==0){
            var unique_clades = d3.set(clades).values();
            var clade_counts = {};
            for (var i=0; i<unique_clades.length; i++){clade_counts[unique_clades[i]]=0;}
            clades.forEach(function (d) {clade_counts[d]+=1;});
            clade_counts["unassigned"] = -1;
            unique_clades.sort(function (a,b){
                var res;
                if (clade_counts[a]>clade_counts[b]){ res=-1;}
                else if (clade_counts[a]<clade_counts[b]){ res=1;}
                else {res=0;}
                return res;});

            var cols = [];
            console.log("unique_clades",unique_clades);
            for (var i=0; i<unique_clades.length; i++){
                if (unique_clades[i]=="unassigned"){
                    cols.push("#CCCCCC");
                }else{
                    cols.push(genotypeColors[i%genotypeColors.length]);
                }
            }
            cScale = d3.scale.ordinal()
                .domain(unique_clades)
                .range(cols);
        }
    }
}


function colorByGenotype(gene, pos) {
    for (var ti=1; ti>=0; ti--){
        if (!trees[ti]){
            return;
        }
        trees[ti].nodes[0].coloring='ancestral';
        let anc, der, mpos;
        let root_state = 'unknown';
        const strpos = pos.toString();
        trees[ti].nodes.forEach(function (d) {
            d.coloring = d.n.parent.shell.coloring;
            if (d.n.aa_muts[gene]){
                for (var mi=0; mi<d.n.aa_muts[gene].length; mi++){
                    if (d.n.aa_muts[gene][mi].substring(1,d.n.aa_muts[gene][mi].length-1)==strpos){
                        d.coloring = d.n.aa_muts[gene][mi][strpos.length+1];
                        if (root_state=='unknown'){
                            root_state = d.n.aa_muts[gene][mi][0];
                        }
                        break;
                    }
                }
            }
        });
        const genotypes = trees[ti].nodes.map(function (d) {
            if (d.coloring == "ancestral"){d.coloring=root_state;}
            return d.coloring;
        });
        if (ti==0){
            var unique_genotypes = d3.set(genotypes).values();
            console.log(unique_genotypes);
            var genotype_counts = {};
            for (var i=0; i<unique_genotypes.length; i++){genotype_counts[unique_genotypes[i]]=0;}
            genotypes.forEach(function (d) {genotype_counts[d]+=1;});
            unique_genotypes.sort(function (a,b){
                var res;
                if (genotype_counts[a]>genotype_counts[b]){ res=-1;}
                else if (genotype_counts[a]<genotype_counts[b]){ res=1;}
                else {res=0;}
                return res;});

            var cols = [];
            for (var i=0; i<unique_genotypes.length; i++){
                cols.push(genotypeColors[i%genotypeColors.length]);
            }
            cScale = d3.scale.ordinal()
                .domain(unique_genotypes)
                .range(cols);
        }
    }
}

var branchHover = function(node){
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
        const styles = {}; //'fill': trees[ti].nodes.map(function(d){return d.selected?highlightFill:d.fill;}),
                           //'stroke': trees[ti].nodes.map(function(d){return d.selected?highlightStroke:d.stroke;})};
        trees[ti].updateMultipleArray('.tip', attrs, styles, dt=0);
    }
    for (var ti=0; ti<tanglesToUpdate.length; ti++){
    tangle.select("#tangle_"+tanglesToUpdate[ti])
        .style("stroke","#DA4")
        .style("stroke-width",highlightTangleSWidth);
    }
    linkTooltip.show(node.n, this);
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
        .style("stroke-width",TangleSWidth);
    linkTooltip.hide(node.n, this);
};

var branchClick = function(node){
    console.log("click", node.n.strain);
    trees[node.tree].zoomIntoClade(node,200);
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
  virusTooltip.show(tip.n, this);
};

var tipMouseOut = function(tip){
  colorTree();
  for (var ci=0; ci<tip.tangles.length; ci++){
    tangle.select("#tangle_"+tip.tangles[ci])
        .style("stroke","#CCC")
        .style("stroke-width",2);
  }
  virusTooltip.hide(tip.n, this);
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
        treeplot.call(virusTooltip);
        treeplot.call(linkTooltip);
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
        trees[tid-1].render(treeplot, "rectangular", divergence_measure, {orientation:[tid===1?1:-1,1]}, callbacks);
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

var toggleTimeTree = function() {
    for (var tid=0; tid<2; tid++){
        trees[tid].updateDistance(divergence_measure, 200);
    }
}

var changeTrees = function() {
    node_map = {};
    var tmp_virus = document.getElementById("virus").value
    var tmp_resolution = document.getElementById("resolution").value
    var seg1 = document.getElementById("tree1").value
    var seg2 = document.getElementById("tree2").value
    console.log(tmp_virus, tmp_resolution, seg1, seg2);

    var dataset = tmp_virus+"_"  + seg1 +"_" + tmp_resolution;
    segments[0]=seg1;
    trees[0]=false;
    loadTree(1,prefix + dataset);

    var dataset = tmp_virus+"_"  + seg2 +"_" + tmp_resolution;
    segments[1]=seg2;
    trees[1]=false;
    loadTree(2,prefix+ dataset);

    cScale=false;
    var total_time=0;
    function wait(){
        if (trees[0]&&trees[1]){
            makeTangle();
            colorTree();
        }else{
            total_time+=100;
            console.log("waiting ", total_time);
            setTimeout(wait, 100);
        }
    }
    wait();
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
}


d3.select("#makeTangle").on("click", function(d){console.log("Button pressed"); makeTangle();});

d3.select("#colorby").on("change", function() {
    cScale=false;
    if (document.getElementById("colorby").value=='clade'){
        colorby=="clade";
        document.getElementById("gt-color").value="";
        colorTree();
    }else if (document.getElementById("colorby").value=='gt'){
        console.log("genotype coloring");
    }

})

d3.select("#gt-color").on("keyup", function() {
    var gt_text= document.getElementById("gt-color").value;
    console.log(gt_text);
    var pieces = gt_text.split(':');
    if (pieces.length==2){
        colorby=="gt";
        var gene=pieces[0], pos=parseInt(pieces[1]);
        console.log(pieces, gene, pos);
        if (colorByGenotype(gene, pos)=="fail"){
            colorby="clade";
        }else{
            colorTree();
            document.getElementById("colorby").value='gt';
        }
    }
});

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

d3.select("#timetree").on("change", function() {
    divergence_measure = document.getElementById("timetree").checked?"num_date":"div";
    toggleTimeTree();
})

colorby = document.getElementById("colorby").value;
changeTrees();
