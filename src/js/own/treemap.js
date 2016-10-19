function truncateDecimals (num, digits) {
    var numS = num.toString(),
        decPos = numS.indexOf('.'),
        substrLength = decPos == -1 ? numS.length : 1 + decPos + digits,
        trimmedResult = numS.substr(0, substrLength),
        finalResult = isNaN(trimmedResult) ? 0 : trimmedResult;

    return parseFloat(finalResult);
}

$( document ).ready(function() {

    /* Begin GLOBAL */

    var year, type = '';

    setGlobalSelectedValues();

    $('.global-change').click(function(e) {
        setGlobalSelectedValues(e);
    });

    function setGlobalSelectedValues(e) {
        if (typeof e === 'undefined') {
            // Initialize
            year = $(".nav-pills li.active")[0].firstElementChild.firstChild.data;
            type = $('input:radio[name=budget-type]:checked').val();
        } else {
            if (e.target.nodeName == "A") {
                year = e.target.firstChild.data;
            } else {
                year = $(".nav-pills li.active")[0].firstElementChild.firstChild.data;
                type = e.target.getAttribute('data-type');
            }
        }
        $("#selectedYear").val(year);
        $("#selectedType").val(type);

        /// ***** ///
        loadTreemap(year, type);
        /// ***** ///

    }

    /* End GLOBAL */

});



function loadTreemap(year, type) {

  var margin = {top: 20, right: 20, bottom: 20, left: 20},
      width = $(window).width() - margin.top - margin.bottom,
      height = $(window).height() - margin.top - margin.bottom,
      formatNumber = d3.format(",d"),
      transitioning,
      extrabox = 100,
      total = 0;

  // Height and width max controls
  if (height > 500) { height = 500; }
  if (width > 960) { width = 960; }

  var color = d3.scale.ordinal().range(["#8dd3c7","#ffffb3","#bebada","#fb8072","#80b1d3","#fdb462","#b3de69","#fccde5"]);

  var x = d3.scale.linear()
      .domain([0, width])
      .range([0, width]);

  var y = d3.scale.linear()
      .domain([0, height])
      .range([0, height]);

  var treemap = d3.layout.treemap()
      .children(function(d, depth) { return depth ? null : d._children; })
      .sort(function(a, b) { return a.value - b.value; })
      .ratio(height / width * 0.5 * (1 + Math.sqrt(5)))
      .round(false);

  d3.json("/assets/data/"+type+year+".json", function(root) {

    if (root) {

      $("#treemap").empty();
      var svg = d3.select("#treemap").append("svg")
          .attr("width", width + margin.left + margin.right)
          .attr("height", height + margin.bottom + margin.top + extrabox)
          .style("margin-left", -margin.left + "px")
          .style("margin.right", -margin.right + "px")
        .append("g")
          .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
          .style("shape-rendering", "crispEdges");

      var grandparent = svg.append("g")
          .attr("class", "grandparent");

      grandparent.append("rect")
          .attr("y", -margin.top)
          .attr("width", width)
          .attr("height", margin.top*3);

      grandparent.append("text")
          .attr("class", "gp-title")
          .attr("x", 6)
          .attr("y", 6 - margin.top)
          .attr("dy", ".75em");

      grandparent.append("text")
          .attr("x", 6)
          .attr("y", 6 - margin.top)
          .attr("dy", "2em")
          .attr("class", "gp-money");

      initialize(root);
      total = accumulate(root);
      layout(root);
      display(root);

    }
    else {
      $("#treemap").html("<p class='info-alert'><i class='fa fa-warning fa-2x'></i><br/>Datos no encontrados</p>");
    }

    function initialize(root) {
      root.x = root.y = 0;
      root.dx = width;
      root.dy = height;
      root.depth = 0;
    }

    // Aggregate the values for internal nodes. This is normally done by the
    // treemap layout, but not here because of our custom implementation.
    // We also take a snapshot of the original children (_children) to avoid
    // the children being overwritten when layout is computed.
    // function accumulate(d) {
    //   return (d._children = d.children)
    //       ? d.value = d.children.reduce(function(p, v) { return p + accumulate(v); }, 0)
    //       : d.value;
    // }
    // MOVE ACCUMULATE TO COMMON.JS

    // Compute the treemap layout recursively such that each group of siblings
    // uses the same size (1×1) rather than the dimensions of the parent cell.
    // This optimizes the layout for the current zoom state. Note that a wrapper
    // object is created for the parent node for each group of siblings so that
    // the parent’s dimensions are not discarded as we recurse. Since each group
    // of sibling was laid out in 1×1, we must rescale to fit using absolute
    // coordinates. This lets us use a viewport to zoom.
    function layout(d) {
      if (d._children) {
        treemap.nodes({_children: d._children});
        d._children.forEach(function(c) {
          c.x = d.x + c.x * d.dx;
          c.y = d.y + c.y * d.dy;
          c.dx *= d.dx;
          c.dy *= d.dy;
          c.parent = d;
          layout(c);
        });
      }
    }

    function display(d) {
      grandparent
          .datum(d.parent)
          .on("click", transition)
          .on("mouseover", show_helptip)
          .on("mouseout", hide_helptip)
        .select(".gp-title")
          .text(name(d));

      svg.select(".gp-money")
         .text(d.value.formatMoney(2, ',', '.', '€'));
        
      var g1 = svg.insert("g", ".grandparent")
          .datum(d)
          .attr("class", "depth")
          .attr("transform", "translate(" + 0 + "," + margin.top*2 + ")");

      var g = g1.selectAll("g")
          .data(d._children)
        .enter().append("g");

      g.filter(function(d) { return d._children; })
          .classed("children", true)
          .on("click", transition);

      g.selectAll(".child")
          .data(function(d) { return d._children || [d]; })
        .enter().append("rect")
          .attr("class", "child")
          .style("fill", function(d) { return color(d.parent.value); })
          .call(rect);
        // .append("title")
          // .text(function(d) { return d.name + " (" + d.value.formatMoney(2, ',', '.', '€') + ")"; });

      g.append("rect")
          .attr("class", "parent")
          .on("mouseover", show_tooltip)
          .on("mouseout", hide_tooltip)
          .style("fill", function(d) { return color(d.value); })
          .call(rect);
        // .append("title")
          // .text(function(d) { return d.name + " (" + d.value.formatMoney(2, ',', '.', '€') + ")"; });

      /*g.append("text")
          .attr("dy", ".75em")
          .attr("class", "title")
          .text(function(d) { if ((d.value*100)/d.parent.value >= 5) { return d.name; } else { return "...";  } })
          .call(text);*/

      /*g.append("text")
          .attr("dy", "2em")
          .attr("class", "money")
          .text(function(d) { if ((d.value*100)/d.parent.value >= 5) { return d.value.formatMoney(2, ',', '.', '€'); } })
          .call(text);*/

      svg.selectAll(".total-percentage").remove();
      svg.append("text")
          .attr("y", height + 20)
          .attr("dy", "2em")
          .attr("class", "total-percentage")
          .text(function() { return truncateDecimals( (d.value/total)*100, 2 ) + "% del total"; });

      svg.selectAll(".progress-bg").remove();
      svg.append("rect")
          .attr("class", "progress-bg")
          .attr("y", height + 80)
          .attr("width", width)
          .attr("height", margin.top);

      svg.selectAll(".progress-fg").remove();
      svg.append("rect")
          .attr("class", "progress-fg")
          .attr("y", height + 80)
          .attr("width", (d.value*width)/total )
          .attr("height", margin.top);

      if (!transitioning) {
        cleanTitleTexts();
        textified(g, d);
      }

      function transition(d) {
        if (transitioning || !d) return;
        transitioning = true;

        var g2 = display(d),
            t1 = g1.transition().duration(750),
            t2 = g2.transition().duration(750);

        // Update the domain only after entering new elements.
        x.domain([d.x, d.x + d.dx]);
        y.domain([d.y, d.y + d.dy]);

        // Enable anti-aliasing during the transition.
        svg.style("shape-rendering", null);

        // Draw child nodes on top of parent nodes.
        svg.selectAll(".depth").sort(function(a, b) { return a.depth - b.depth; });

        // Fade-in entering text.
        g2.selectAll("text").style("fill-opacity", 0);

        // Transition to the new view.
        t1.selectAll("text").call(text).style("fill-opacity", 0);
        t2.selectAll("text").call(text).style("fill-opacity", 1);
        t1.selectAll("rect").call(rect);
        t2.selectAll("rect").call(rect);

        // Remove the old node when the transition is finished.
        t1.remove().each("end", function() {
          svg.style("shape-rendering", "crispEdges");
          transitioning = false;
          cleanTitleTexts();
          textified(g2, d);
        });
      }

      return g;
    }

    function cleanTitleTexts() {
      svg.selectAll(".title").remove();
    }

    function textified(group, tempdata) {
      group.selectAll("rect.parent")
        .each(function(d) {

          var text = d3.select(this.parentNode)
            .append("text");

          // Skip too small rectangles
          // if ( d.dx < 20 || d.dy < 20 ) {  return; }

          var real_width = Math.max(x(d.x + d.dx) - x(d.x) - 8, 0);
          var width = real_width * 0.9   // .9 is a safety margin
          var height = Math.max(y(d.y + d.dy) - y(d.y) - 8, 0);
          var length = textWidth(d.name);
          var area = width * height;
          var size = 10*Math.sqrt(area/(length*10));

          text.attr("width", width)
            .attr("height", height)
            .style("font-size", Math.min(size,60)+"px" )
            .attr("x", x(d.x) + real_width/2 )
            .attr("y", y(d.y) )
            .attr("dy", 1.2)
            .attr("class", "title")
            .text(d.name)
            .style("fill", function(d) { return d3.rgb(color(d.value)).darker();  })
            .call(wrap)
            .style("fill-opacity", 0)
            .transition().duration(750)
            .style("fill-opacity", 1);

        });
    }

    function text(text) {
      text.attr("x", function(d) { return x(d.x) + 6; })
          .attr("y", function(d) { return y(d.y) + 6; });
    }

    function rect(rect) {
      rect.attr("x", function(d) { return x(d.x); })
          .attr("y", function(d) { return y(d.y); })
          .attr("width", function(d) { return x(d.x + d.dx) - x(d.x); })
          .attr("height", function(d) { return y(d.y + d.dy) - y(d.y); });
    }

    function name(d) {
      return d.parent ? " .. / " + d.name : d.name;
    }

    function wrap(text) {
      text.each(function() {
        var text = d3.select(this),
            words = text.text().split(/\s+/).reverse(),
            width = text.attr("width"),
            maxTextWidth = 0,
            word,
            line = [],
            lineNumber = 0,
            lineHeight = 1.1, // ems
            x = text.attr("x"),
            y = text.attr("y"),
            dy = parseFloat(text.attr("dy")),
            tspan = text.text(null).append("tspan").attr("x", x).attr("y", y).attr("dy", dy + "em");

        while (word = words.pop()) {
          line.push(word);
          tspan.text(line.join(" "));
          if (tspan.node().getComputedTextLength() > width && line.length > 1) {
            line.pop();
            tspan.text(line.join(" "));
            maxTextWidth = Math.max(maxTextWidth, tspan.node().getComputedTextLength()); // Keep track of max length line
            line = [word];
            tspan = text.append("tspan").attr("x", x).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
          }
        }
        maxTextWidth = Math.max(maxTextWidth, tspan.node().getComputedTextLength()); // Check last line

        if ( maxTextWidth > width ) {
          var currentSize = parseFloat(text.style("font-size"));
          text.style("font-size", (currentSize*width/maxTextWidth)+"px");
        }
      });
    }

    function textWidth(str) {
      function charW(c) {
        if (c == 'W' || c == 'M') return 15;
        else if (c == 'w' || c == 'm') return 12;
        else if (c == 'I' || c == 'i' || c == 'l' || c == 't' || c == 'f') return 4;
        else if (c == 'r') return 8;
        else if (c == c.toUpperCase()) return 12;
        else return 10;
      }
   
      var length = 0;
      for (var i = 0, len = str.length; i < len; i++) {
        length += charW(str[i]);
      };
      return length;
    }

    function show_helptip() {
      var w = $('#helptip').width();
      var h = $('#helptip').height();
      var popLeft = d3.event.pageX - w/2;
      var popTop = d3.event.pageY -h-15;
      $("#helptip").css({"left":popLeft,"top":popTop});
      $('#helptip').show();
    }

    function hide_helptip() {
      $('#helptip').hide();
    }

    function show_tooltip(d) {
      $('#tooltip-title').html(d.name);
      $('#tooltip-money').html(d.value.formatMoney(2, ',', '.', '€'));
      var w = $('#tooltip').width();
      var h = $('#tooltip').height();
      var popLeft = d3.event.pageX - w/2;
      var popTop = d3.event.pageY -h-15;
      $("#tooltip").css({"left":popLeft,"top":popTop});
      $('#tooltip').show();
    }

    function hide_tooltip(d) {
      $('#tooltip').hide();
    }

  });

}
