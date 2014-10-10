var fs                = require('fs');
var cheerio           = require('cheerio');
var request           = require('request');
var wiki_url          = process.argv[2];

if (wiki_url) {
  request(wiki_url, function(error, response, html) {
    if (!error) {
      var $            = cheerio.load(html);
      var $wrapper     = $('.wikitable');
      var $row_list    = $wrapper.find('tr');
      var senator_list = [];

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

        senator_list.push({
          "name"       : senator_name,
          "party"      : senator_party,
          "wiki_url"   : wikipedia_root + senator_page,
          "photo_url"  : wikipedia_root + senator_img,
          "term_start" : new Date(term_start),
          "term_end"   : new Date(term_end)
        });
      });

      console.log(JSON.stringify(senator_list, null, 4));
    }

  });
} else {
  console.log('Error: please provide a wiki url');
}
