var fs                = require('fs');
var cheerio           = require('cheerio');
var request           = require('request');
var wiki_url          = process.argv[2];

if (wiki_url) {
  request(wiki_url, function(error, response, html) {
    if (!error) {
      var $             = cheerio.load(html);
      var $wrapper      = $('.wikitable');
      var $row_list     = $wrapper.find('tr');
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
          if (index == 0) return;
          var column_list    = $(row).find('td');
          var senator_img    = $($(column_list[0]).find('a')[0]).attr('href');
          var senator_page   = $($(column_list[0]).find('a')[1]).attr('href');
          var senator_name   = $($(column_list[0]).find('a')[1]).text();
          var senator_party  = $(column_list[1]).text();
          var terms          = $(column_list[2]).text().split(' –\n');
          var term_start     = terms[0]
          var term_end       = terms[1]
          var wikipedia_root = 'http://en.wikipedia.org'

          if (!senator_name) {
            if (senator_party) {
              senator_name  = 'Vacant';
              terms         = senator_party.split(' –\n');
              term_start    = terms[0];
              term_end      = terms[1];
              senator_img   = undefined;
              senator_page  = undefined;
              senator_party = undefined;
            } else {
              return;
            }
          }

          if (senator_page) { senator_page = wikipedia_root + senator_page; }
          if (senator_img)  { senator_img  = wikipedia_root + senator_img;  }

          senator_list.push({
            "name"         : senator_name,
            "party"        : senator_party,
            "senate_class" : class_id_list[i].senate_class,
            "wiki_url"     : senator_page,
            "photo_url"    : senator_img,
            "term_start"   : new Date(term_start),
            "term_end"     : new Date(term_end)
          });
        });
      };

      console.log(JSON.stringify(senator_list, null, 4));
    }

  });
} else {
  console.log('Error: please provide a wiki url');
}
