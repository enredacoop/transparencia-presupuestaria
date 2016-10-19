Number.prototype.formatMoney = function(c, d, t, symbol){
  var n = this, 
  c = isNaN(c = Math.abs(c)) ? 2 : c, 
  d = d == undefined ? "." : d, 
  t = t == undefined ? "," : t, 
  s = n < 0 ? "-" : "", 
  i = parseInt(n = Math.abs(+n || 0).toFixed(c)) + "", 
  j = (j = i.length) > 3 ? j % 3 : 0;
  return s + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "") + symbol;
};

d3.locale(
{
  "decimal": ".",
  "thousands": ",",
  "grouping": [2],
  "currency": ["€", ""],
  "dateTime": "%a %b %e %X %Y",
  "date": "%d/%m/%Y",
  "time": "%H:%M:%S",
  "periods": ["AM", "PM"],
  "days": ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"],
  "shortDays": ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"],
  "months": ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"],
  "shortMonths": ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
}
);

// Define blacklist (items that must not be compared)
var blacklist_incomes = [];
var blacklist_expenses = [];

// Return true if val is in the specific blacklist, false otherwise
function blacklist_engine(type, val) {
  if (type == "incomes") {
    return (_.indexOf(blacklist_incomes, val) != -1) ? true : false;
  } else {
    return (_.indexOf(blacklist_expenses, val) != -1) ? true : false;
  }
}

// Define comparison change list (items that must be compared)
var changelist_incomes = {}
var changelist_expenses = {}

// Return relational value from val (it depends on type)
function changelist_engine(type, val) {
  if (type == "incomes") {
    return (_.has(changelist_incomes, val)) ? changelist_expenses[val] : val;
  } else {
    return (_.has(changelist_expenses, val)) ? changelist_expenses[val] : val;
  }
}

// Load and return a budget json object
function load_budget(year, type) {
  var csv = null;
  $.ajax({
    'async': false,
    'global': false,
    'type': 'GET',
    dataType: 'text',
    'url': '/assets/data/'+type+year+'.csv',
    'success': function (data) {
        csv = $.csv.toObjects(data);
    },
    'error': function(error) {
      console.log("error loading data budget");
    }
  });
  return csv;
}

// Return a list of [code, name] based on a budget
function get_code_name(objs, res, added_list) {
  _.forEach(objs, function(obj) {
    added_list.push(obj.name);
    res.push({data: obj.code, value: obj.code +' - '+ obj.name});
  });
}

// Return a list of [code, value] based on a budget
function get_code_value(objs, res) {
  _.forEach(objs, function(obj) {
    res.push({data: obj.code, value: obj.value});
  });
}

// Return a list of [code, observation] based on a budget
function get_code_observation(objs, res) {
  _.forEach(objs, function(obj) {
    res.push({data: obj.code, value: obj.observations});
  });
}

function accumulate(d) {
  return (d._children = d.children)
      ? d.value = d.children.reduce(function(p, v) { return p + accumulate(v); }, 0)
      : d.value;
}
