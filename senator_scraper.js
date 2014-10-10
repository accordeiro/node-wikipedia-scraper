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
        var column_list   = $(row).find('td');
        var senator_img   = $($(column_list[0]).find('a')[0]).attr('href');
        var senator_page  = $($(column_list[0]).find('a')[1]).attr('href');
        var senator_name  = $($(column_list[0]).find('a')[1]).text();
        var senator_party = $(column_list[1]).text();
        var senate_term   = $(column_list[2]).text();

        senator_list.push({
          "name"       : senator_name,
          "party"      : senator_party,
          "wiki_url"   : senator_page,
          "photo_url"  : senator_img,
          "term"       : senate_term
        });
      });

      console.log(senator_list);
    }

  });
} else {
  console.log("Error: please provide a wiki url");
}
