var years = [2014, 2015, 2016];
var types = ["incomes", "expenses"];

var incomes = [];
var expenses = [];

$( document ).ready(function() {

    /* Begin COMPARE */

    incomes.push(load_budget('2014', 'incomes'));
    incomes.push(load_budget('2015', 'incomes'));
    incomes.push(load_budget('2016', 'incomes'));
    expenses.push(load_budget('2014', 'expenses'));
    expenses.push(load_budget('2015', 'expenses'));
    expenses.push(load_budget('2016', 'expenses'));

    var incomes_terms = [];
    var incomes_names = [];
    get_code_name(incomes[2], incomes_terms, incomes_names);
    // get_code_name(incomes[1], incomes_terms, incomes_names);
    // get_code_name(incomes[0], incomes_terms, incomes_names);
    var expenses_terms = [];
    var expenses_names = [];
    get_code_name(expenses[2], expenses_terms, expenses_names);
    // get_code_name(expenses[1], expenses_terms, expenses_names);
    // get_code_name(expenses[0], expenses_terms, expenses_names);

    var incomes_values = [[], [], []];
    _.each(incomes, function(d, i){ if (d) { get_code_value(d, incomes_values[i]); } });
    var expenses_values = [[], [], []];
    _.each(expenses, function(d, i){ if (d) { get_code_value(d, expenses_values[i]); } });

    var incomes_observations = [[], [], []];
    _.each(incomes, function(d, i){ if (d) { get_code_observation(d, incomes_observations[i]); } });
    var expenses_observations = [[], [], []];
    _.each(expenses, function(d, i){ if (d) { get_code_observation(d, expenses_observations[i]); } });


    $('#autocomplete-expenses').autocomplete({
      lookup: expenses_terms,
      lookupLimit: 10,
      minChars: 2,
      onSelect: function (suggestion) {
        $('#searchvalue').val(suggestion.data);
      }
    });
    $('#autocomplete-incomes').autocomplete({
      lookup: incomes_terms,
      lookupLimit: 10,
      minChars: 2,
      onSelect: function (suggestion) {
        $('#searchvalue').val(suggestion.data);
      }
    });

    function clean_observations() {
      $('#observation1').html('');
      $('#observation2').html('');
      $('#observation3').html('');
    }

    $('.select-budget-type').click(function() {
      setCompareSelectedValues();
    });

    $('#select-expenses').change(function() {
      $('#autocomplete-expenses').val("");
      $('#searchvalue').val($('#select-expenses option:selected').val());
    });

    $('#autocomplete-expenses').keypress(function() {
      $('#select-expenses option[value="-1"]').prop("selected", true);
    });

    $('#select-incomes').change(function() {
      $('#autocomplete-incomes').val("");
      $('#searchvalue').val($('#select-incomes option:selected').val());
    });

    $('#autocomplete-incomes').keypress(function() {
      $('#select-incomes option[value="-1"]').prop("selected", true);
    });


    $('#refresh').click(function() {
        clean_observations();
        if ($('#searchvalue').val() != -1) {
          var vtype = ($('input:radio[name=budget-type]:checked').val() == 'incomes') ? 'incomes' : 'expenses';
          if (blacklist_engine(vtype, $('#searchvalue').val())) {
            $("#area-graph").html("<p class='info-alert small'><i class='fa fa-legal fa-2x'></i><br/>Los cambios introducidos por la Orden HAP/419/2014, de 14 de marzo, por la que se modifica la Orden EHA/3565/2008, de 3 de diciembre, imposibilita la comparación entre los años 2014, 2015 y 2016 de esta partida presupuestaria.</p>");
          } else {
            vdata = (vtype == 'incomes') ? incomes_values : expenses_values;
            odata = (vtype == 'incomes') ? incomes_observations : expenses_observations;

            $('#input1').val(_.find(vdata[0], function(d){ return d.data == changelist_engine(vtype, $('#searchvalue').val()); }).value);
            $('#input2').val(_.find(vdata[1], function(d){ return d.data == $('#searchvalue').val(); }).value);
            $('#input3').val(_.find(vdata[2], function(d){ return d.data == $('#searchvalue').val(); }).value);

            var o1 = _.find(odata[0], function(d){ return d.data == changelist_engine(vtype, $('#searchvalue').val()); }).value;
            if (o1 != '') {
              $('#observation1').html(years[0] + ': ' + o1);
            }
            var o2 = _.find(odata[1], function(d){ return d.data == $('#searchvalue').val(); }).value;
            if (o2 != '') {
              $('#observation2').html(years[1] + ': ' + o2);
            }
            var o3 = _.find(odata[2], function(d){ return d.data == $('#searchvalue').val(); }).value;
            if (o3 != '') {
              $('#observation3').html(years[2] + ': ' + o3);
            }

            /// ***** ///
            update_graph();
            /// ***** ///
          }
        } else {
          $('#area-graph').html('');
        }
    });

    function setCompareSelectedValues() {
        var type = $('input:radio[name=budget-type]:checked').val();
        if (type == 'expenses') {
          $('#select-expenses').show();
          $('#select-incomes').hide();
          $('#autocomplete-expenses').show();
          $('#autocomplete-incomes').hide();
          $('#autocomplete-incomes').val("");
        } else {
          $('#select-incomes').show();
          $('#select-expenses').hide();
          $('#autocomplete-incomes').show();
          $('#autocomplete-expenses').hide();
          $('#autocomplete-expenses').val("");
        }
    }

    /* End COMPARE */

});




var margin = {top: 30, right: 100, bottom: 30, left: 100},
        extra_xaxis = 160,
        spacing_jumps = 10,
        width = $(window).width() - margin.left - margin.right,
        height = $(window).height() - margin.top - margin.bottom;
var rect_padding_top = -20;

// Height and width max controls
if (height > 500) { height = 500; }
if (width > 960) { width = 960; }



      function update_graph() {

        var amounts = [parseFloat($('#input1').val()), parseFloat($('#input2').val()), parseFloat($('#input3').val())];
        $('#area-graph').html('');

        var x = d3.scale.ordinal()
            .rangeBands([0, width]);

        var xvalues = d3.scale.ordinal()
            .rangeBands([0, width]);

        var xpercentages = d3.scale.ordinal()
            .rangeBands([0, width]);

        var y = d3.scale.linear()
            .range([height, 0]);

        var xAxis = d3.svg.axis()
            .scale(x)
            .orient("bottom");

        var xvalAxis = d3.svg.axis()
            .scale(xvalues)
            .tickFormat(function(d){ return d + "€"; })
            .orient("bottom");
              
        var xpercAxis = d3.svg.axis()
            .scale(xpercentages)
            .tickFormat(function(d, i){ return (d != 0) ? percentages_symbols[i] + d + "%" : "="; })
            .orient("bottom");

        var yAxis = d3.svg.axis()
            .scale(y)
            .tickPadding(5)
            .tickFormat(function(d){ return d.formatMoney(2, ',', '.', '€').replace(',00', ''); })
            .orient("left");

        var line = d3.svg.line()
            .x(function(d) { return x(d.year); })
            .y(function(d) { return y(d.amount); });

        if ( _.reduce(amounts, function(a, b){ return a + b;  }, 0) != 0) {
          
          var svg = d3.select("#area-graph").append("svg")
              .attr("width", width + margin.left + margin.right)
              .attr("height", height + margin.top + margin.bottom + extra_xaxis + 70)
              .append("g")
              .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

                          var data = new Array(years.length);
                          var percentages = Array(years.length);
                          var percentages_symbols = Array(years.length);
                          last_amount = 0;
                          years.forEach(function(y, i) {
                            obj = new Object();
                            obj.year = y;
                            obj.amount = amounts[i];
                            data[i] = obj;
                            if (i == 0) {
                              percentages[i] = '0.00';
                              percentages_symbols[i] = '';
                              last_amount = amounts[i];
                            } else {
                              difference = ((amounts[i] * 100) / last_amount) - 100;
                              percentages[i] = parseFloat(Math.abs(difference)).toFixed(2);
                              percentages_symbols[i] = (difference > 0) ? '+' : (difference < 0) ? '-': '=';
                              last_amount = amounts[i];
                            }
                          });
                          
                          load_rectangles(svg, percentages_symbols);

                          x.domain(years);
                          xvalues.domain(amounts);
                          xpercentages.domain(percentages);

                          max = parseFloat(d3.max(_.pluck(data, 'amount')));
                          min = parseFloat(d3.min(_.pluck(data, 'amount')));
                          diff = parseFloat(max - min);
                          // Avoid zero difference
                          if (diff == 0) {
                            diff = 100;
                          }
                          y.domain( [(min - diff),(max + diff)] )

                            svg.append("g")
                                  .attr("class", "x axis")
                                  .attr("transform", "translate(0," + height + ")")
                                  .call(xAxis);

                            svg.append("text")
                                  .attr("class", "xval axis")
                                  .attr("x", (width/3)/2)
                                  .attr("y", height + spacing_jumps*5 )
                                  .attr("width", width/3)
                                  .attr("text-anchor","middle")
                                  .text(amounts[0].formatMoney(2, ',', '.', '€'));

                            svg.append("text")
                                  .attr("class", "xval axis")
                                  .attr("x", (width/3)+((width/3)/2) )
                                  .attr("y", height + spacing_jumps*5 )
                                  .attr("width", width/3)
                                  .attr("text-anchor","middle")
                                  .text(amounts[1].formatMoney(2, ',', '.', '€'));

                            svg.append("text")
                                  .attr("class", "xval axis")
                                  .attr("x", (width/3)*2+((width/3)/2) )
                                  .attr("y", height + spacing_jumps*5 )
                                  .attr("width", width/3)
                                  .attr("text-anchor","middle")
                                  .text(amounts[2].formatMoney(2, ',', '.', '€'));

                            svg.append("text")
                                  .attr("class", function() { return (percentages_symbols[0] == "+") ? "xperc axis positive" : (percentages_symbols[0] == "-") ? "xperc axis negative" : ""; })
                                  .attr("x", (width/3)/2)
                                  .attr("y", height + spacing_jumps*15 )
                                  .attr("width", width/3)
                                  .attr("text-anchor","middle")
                                  .text(function() { return (percentages[0] != 0) ? percentages_symbols[0] + percentages[0] + "%": ""; });

                            svg.append("text")
                                  .attr("class", function() { return (percentages_symbols[1] == "+") ? "xperc axis positive" : (percentages_symbols[1] == "-") ? "xperc axis negative" : "xperc axis equal"; })
                                  .attr("x", (width/3)+((width/3)/2) )
                                  .attr("y", height + spacing_jumps*15 )
                                  .attr("width", width/3)
                                  .attr("text-anchor","middle")
                                  .text(function() { return (percentages[1] != 0) ? percentages_symbols[1] + percentages[1] + "%": percentages_symbols[1]; });

                            svg.append("text")
                                  .attr("class", function() { return (percentages_symbols[2] == "+") ? "xperc axis positive" : (percentages_symbols[2] == "-") ? "xperc axis negative" : "xperc axis equal"; })
                                  .attr("x", (width/3)*2+((width/3)/2) )
                                  .attr("y", height + spacing_jumps*15 )
                                  .attr("width", width/3)
                                  .attr("text-anchor","middle")
                                  .text(function() { return (percentages[2] != 0) ? percentages_symbols[2] + percentages[2] + "%": percentages_symbols[2]; });

                            svg.append("g")
                                  .attr("class", "y axis")
                                  .call(yAxis)
                                  .append("text")
                                  .attr("transform", "rotate(-90)")
                                  .attr("y", 6)
                                  .attr("dy", ".71em")
                                  .style("text-anchor", "end")
                                  .text("");

                            svg.append("path")
                                    .datum(data)
                                    .attr("class", "line")
                                    .attr("d", line)
                                    .attr("transform", "translate(" + ((width/3)/2) + "," + 0 + ")");


                            svg.selectAll("circle")
                                .data(data)
                                .enter().append("circle")
                                .attr("class", "dot")
                                .attr("r", 5)
                                .attr("cx", function(d) { return x(d.year); })
                                .attr("cy", function(d) { return y(d.amount); })
                                .attr("transform", "translate(" + ((width/3)/2) + "," + 0 + ")");


        } // end if

      } // end function


function load_rectangles(svg, percentages_symbols) {

  svg.append("rect")
      .attr("class", "zebra1")
      .attr("x", -100)
      .attr("y", rect_padding_top)
      .attr("width", 100)
      .attr("height", height + margin.top + margin.bottom + extra_xaxis - rect_padding_top);


  svg.append("rect")
      .attr("class", "zebra2")
      .attr("x", 0)
      .attr("y", rect_padding_top)
      .attr("width", width/3)
      .attr("height", height + margin.top + margin.bottom + extra_xaxis - rect_padding_top);

  svg.append("rect")
      .attr("class", "zebra1")
      .attr("x", width/3)
      .attr("y", rect_padding_top)
      .attr("width", width/3)
      .attr("height", height + margin.top + margin.bottom + extra_xaxis - rect_padding_top);

  svg.append("rect")
      .attr("class", function(d){ return (percentages_symbols[1] == '+') ? 'positive' : (percentages_symbols[1] == '-') ? 'negative': 'equal'; })
      .attr("x", width/3)
      .attr("y", height + margin.top + margin.bottom + extra_xaxis + 5)
      .attr("width", width/3)
      .attr("height", 50 );

  svg.append("rect")
      .attr("class", "zebra2")
      .attr("x", (width/3)*2)
      .attr("y", rect_padding_top)
      .attr("width", width/3)
      .attr("height", height + margin.top + margin.bottom + extra_xaxis - rect_padding_top);

  svg.append("rect")
      .attr("class", function(d){ return (percentages_symbols[2] == '+') ? 'positive' : (percentages_symbols[2] == '-') ? 'negative': 'equal'; })
      .attr("x", (width/3)*2)
      .attr("y", height + margin.top + margin.bottom + extra_xaxis + 5)
      .attr("width", width/3)
      .attr("height", 50 );
}



// Updating graph

update_graph();
$('#refresh').click(function() {
  update_graph();
});

