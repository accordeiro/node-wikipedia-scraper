var cheerio    = require('cheerio');
var fs         = require('fs');
var json2csv   = require('json2csv');
var request    = require('request');
var wiki_url   = process.argv[2];
var file_name  = process.argv[3];


function fix_dates(term_start, term_end) {
  var term_start = new Date(term_start);
  var term_end   = new Date(term_end);

  // Subtract one day from term_end to avoid overlapping
  term_end.setDate(term_end.getDate() - 1);

  return [term_start, term_end];
}


function date_to_str(date) {
  if (!isNaN(date)) {
    var d = date.getDate();
    var m = date.getMonth() + 1;
    var y = date.getFullYear();
    return '' + (m<=9 ? '0' + m : m) + '/' + (d <= 9 ? '0' + d : d) + '/'  + y;
  } else {
    return null;
  }
}


function parse_regular_row($, column_list, senate_class) {
  var senator_img    = $($(column_list[0]).find('a')[0]).attr('href');
  var senator_page   = $($(column_list[0]).find('a')[1]).attr('href');
  var senator_name   = $($(column_list[0]).find('a')[1]).text();
  var senator_party  = $(column_list[1]).text();
  var terms          = $(column_list[2]).text().split(' –\n');
  var term_dates     = fix_dates(terms[0], terms[1]);
  var term_start     = term_dates[0];
  var term_end       = term_dates[1];
  var wikipedia_root = 'http://en.wikipedia.org'

  senator_page = wikipedia_root + senator_page;
  senator_img  = wikipedia_root + senator_img;

  data_json = {
    "name"         : senator_name,
    "party"        : senator_party,
    "senate_class" : senate_class,
    "wiki_url"     : senator_page,
    "photo_url"    : senator_img,
    "term_start"   : date_to_str(term_start),
    "term_end"     : date_to_str(term_end)
  };

  return data_json;
}


function parse_vacant_row($, column_list, senate_class) {
  var terms      = $(column_list[1]).text().split(' –\n');
  var term_dates = fix_dates(terms[0], terms[1]);
  var term_start = term_dates[0];
  var term_end   = term_dates[1];


  var data_json = {
    "name"         : "Vacant",
    "term_start"   : date_to_str(term_start),
    "term_end"     : date_to_str(term_end),
    "senate_class" : senate_class
  };

  return data_json;
}


function export_to_csv(senator_list, file_name) {
  json2csv({
    data: senator_list,
    fields: [
      'name',
      'party',
      'senate_class',
      'wiki_url',
      'photo_url',
      'term_start',
      'term_end'
    ]
  },
  function(err, csv) {
    if (err) console.log(err);
    fs.writeFile(file_name + '.csv', csv, function(err) {
      if (err) throw err;
      console.log('file saved');
    });
  });
}


function export_to_json(senator_list, file_name) {
  var output = JSON.stringify(senator_list, null, 4);
  fs.writeFile(file_name + '.json', output, function(err) {
    if (err) throw err;
    console.log('file saved');
  });
}


function main() {
  if (wiki_url) {
    request(wiki_url, function(error, response, html) {
      if (!error) {
        var $             = cheerio.load(html);
        var senator_list  = [];
        var class_id_list = [
          { "obj_id": "#Class_1", "senate_class": 1 },
          { "obj_id": "#Class_2", "senate_class": 2 },
          { "obj_id": "#Class_3", "senate_class": 3 }
        ];

        for (var i = 0; i < class_id_list.length; i++) {
          var table     = $(class_id_list[i].obj_id).parent().next('.wikitable');
          var $row_list = $(table).find('tr');

          $row_list.each(function(index, row) {
            // First row doesn't contain any data:
            if (index == 0) return;

            // Parse following rows:
            var data_json = {};
            var column_list = $(row).find('td');
            if (column_list.length >= 5) {
              data_json = parse_regular_row($, column_list, class_id_list[i].senate_class);

            } else {
              data_json = parse_vacant_row($, column_list, class_id_list[i].senate_class);
            }

            // Ensure the data retrieved is valid:
            if (data_json.term_start && data_json.term_end) {
              senator_list.push(data_json);
            }
          });
        };

        if (!file_name) { file_name = 'out' }
        export_to_json(senator_list, file_name);
        export_to_csv(senator_list, file_name);
      }
    });
  } else {
    console.log('Error: please provide a wiki url');
  }
}

// Perform main function:
main();
