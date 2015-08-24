var express = require("express")
var logfmt = require("logfmt")
var url = require('url')
var map = require('through2-map')
var querystring = require ('querystring')
var https = require('https');
var app = express();
app.use(logfmt.requestLogger());
var utf8 = require('utf8');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0


app.get('/', function(req, res) {
  res.send('Hello fool!');
});


// IMG STUFF 
//https://ajax.googleapis.com/ajax/services/search/images?v=1.0&q=fuzzy%20monkey

var img_options = {
	host: 'ajax.googleapis.com',
	path: ''
};

var img_path_const = '/ajax/services/search/images?v=1.0&q=';

img_cb = function(response) {
  var str = '';

  response.setEncoding('')
  //another chunk of data has been recieved, so append it to `str`
  response.on('data', function (chunk) {
    str += chunk;
  });

  //the whole response has been received, so we just print it out here
  response.on('end', function () {
    console.log('img_cb: ' + str);
    console.log('-1-');
    //var ic = new iconv.Iconv('utf-8', 'utf-8')
    w = JSON.parse(str);
    console.log("--" + w.responseData["results"]);
    /*
    for (prop in w.responseData["results"]) {
      e = w.responseData["results"][prop].url;
      //e = utf8.encode(e);
      if (typeof e != 'undefined')
      {
        console.log('wiktor_cb: ' + e);
        console.log('-2-');
        PostToSlack(e, "--", "imgbot");
      } 
      else
      {
        console.log("Query failed: ");
        PostToSlack("Query failed", "--", "imgbot");
      }
    }
    */
    e = w.responseData["results"][0].url;
    //e = utf8.encode(e);
    if (typeof e != 'undefined')
    {
      console.log('wiktor_cb: ' + e);
      console.log(w.responseData["results"][0].titleNoFormatting);
      console.log(w.responseData["results"][0].originalContextUrl);
      PostToSlack(e, "--", "imgbot");
      PostToSlack(w.responseData["results"][0].titleNoFormatting, "", "imgbot");
      PostToSlack(w.responseData["results"][0].originalContextUrl, "", "imgbot")
    } 
    else
    {
      console.log("Query failed: ");
      PostToSlack("Query failed", "--", "imgbot");
    }  
    
    img_options.path = '';
  });
}


app.post('/slackimg', function(req, res) {
	req.pipe(map(function (chunk) {
		parsed = querystring.parse(chunk.toString())
		console.log('app.post(/slackimg): ' + parsed)
		user_name = parsed['user_name'];
		text = parsed['text'];
		timestamp = parsed['timestamp'];
		date = new Date(parseInt(parsed['timestamp']) * 1000)

		console.log('user ' + user_name + ' said ' 
			+ text + ' at ' + date.toString());

		if (text.startsWith('!img ')){
			img_entry = text.slice('!img '.length, text.length);	
		}
		
		//urban_entry = toTitleCase(wiki_entry);
		img_entry = img_entry.replace(/ /g, '%20');
		console.log('img_entry: ' + img_entry);
		img_options.path = img_path_const + img_entry;
		https.request(img_options, img_cb).end();
	})).pipe(res)
})


var port = Number(process.env.PORT || 5000);
app.listen(port, function() {
  console.log("Listening on " + port);

});


if (typeof String.prototype.startsWith != 'function') {
  // see below for better implementation!
  String.prototype.startsWith = function (str){
    return this.indexOf(str) == 0;
  };
}

function PostToSlack(post_text, bot_name, bot_emoji) {
  // Build the post string from an object

    post_data = JSON.stringify(
  	{"text" : post_text, 
  	 "username" : bot_name,
  	 "icon_emoji" : bot_emoji
  	})

	//post_data = '{"text" : "' + post_text + '", "username" : "' + bot_name + 
	//'", "icon_emoji" : "' + bot_emoji + '"}';
  
  console.log(post_text)

  //path_str = '/services/hooks/incoming-webhook?token=mcmbhcqQpfoU2THsofvad3VA'; //#legible
  path_str = 'https://hooks.slack.com/services/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'; //#testing
  var post_options = {
      host: 'poundc.slack.com',
      port: '443',
      path: path_str,
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(post_data, 'utf8')
      }
  };

  // Set up the request
  var post_req = https.request(post_options, function(res) {
      res.setEncoding('utf8');
      res.on('data', function (chunk) {
          console.log('Response: ' + chunk);
      });
  });
  console.log("PostToSlack: POST data: " + post_data);

  post_req.write(post_data);
  post_req.end();
}
