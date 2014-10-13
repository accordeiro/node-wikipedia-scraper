var fs                = require('fs');
var cheerio           = require('cheerio');
var request           = require('request');
var wiki_url          = process.argv[2];


function parse_regular_row($, column_list, senate_class) {
  var senator_img    = $($(column_list[0]).find('a')[0]).attr('href');
  var senator_page   = $($(column_list[0]).find('a')[1]).attr('href');
  var senator_name   = $($(column_list[0]).find('a')[1]).text();
  var senator_party  = $(column_list[1]).text();
  var terms          = $(column_list[2]).text().split(' –\n');
  var term_start     = terms[0]
  var term_end       = terms[1]
  var wikipedia_root = 'http://en.wikipedia.org'

  senator_page = wikipedia_root + senator_page;
  senator_img  = wikipedia_root + senator_img;

  data_json = {
    "name"         : senator_name,
    "party"        : senator_party,
    "senate_class" : senate_class,
    "wiki_url"     : senator_page,
    "photo_url"    : senator_img,
    "term_start"   : new Date(term_start),
    "term_end"     : new Date(term_end)
  };

  return data_json;
}


function parse_vacant_row($, column_list, senate_class) {
  var terms      = $(column_list[1]).text().split(' –\n');
  var term_start = terms[0];
  var term_end   = terms[1];

  var data_json = {
    "name"         : "Vacant",
    "term_start"   : new Date(term_start),
    "term_end"     : new Date(term_end),
    "senate_class" : senate_class
  };

  return data_json;
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
            if (column_list.length >= 4) {
              data_json = parse_regular_row($, column_list, class_id_list[i].senate_class);
            } else {
              data_json = parse_vacant_row($, column_list, class_id_list[i].senate_class);
            }

            if (!isNaN(data_json.term_start) && !isNaN(data_json.term_end)) {
              senator_list.push(data_json);
            }
          });
        };

        console.log(JSON.stringify(senator_list, null, 4));
      }

    });
  } else {
    console.log('Error: please provide a wiki url');
  }
}

// Perform main function:
main();
