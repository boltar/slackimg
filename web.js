var express = require("express")
var logfmt = require("logfmt")
var url = require('url')
var map = require('through2-map')
var querystring = require ('querystring')
var https = require('https');
var app = express();
app.use(logfmt.requestLogger());
var utf8 = require('utf8');
var util = require('util');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0


app.get('/', function(req, res) {
  res.send('Hello fool 2');
});


// IMG STUFF 
//https://ajax.googleapis.com/ajax/services/search/images?v=1.0&q=fuzzy%20monkey

var img_options = {
	host: 'ajax.googleapis.com',
	path: '',
  channel_name: '',
  trigger_word: ''
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
    console.log('-------- end -------');
    //var ic = new iconv.Iconv('utf-8', 'utf-8')
    w = JSON.parse(str);
    console.log("--" + w.responseData["results"]);
    img_index = parseInt(img_options.trigger_word.charAt(4));
    img_index--; // 0-based index
    console.log('img_index: ') + img_index;
    
    img_url             = w.responseData["results"][img_index].unescapedUrl;
    title               = w.responseData["results"][img_index].titleNoFormatting;
    originalContextUrl  = w.responseData["results"][img_index].originalContextUrl;

    //e = utf8.encode(e);
    if (typeof img_url != 'undefined')
    {
      console.log('img_cb: ' + img_url);
      console.log(title);
      console.log(originalContextUrl);
      //PostToSlack(img_options.channel_name, img_url, "img_bot", "picture_frame");
      PostToSlack(img_options.channel_name, "<" + img_url + "|" + title + ">", "img_bot", "picture_frame");
    } 
    else
    {
      console.log("Query failed: ");
      PostToSlack(img_options.channel_name, "Query failed", "img_bot", "picture_frame");
    }  
    
    img_options.path = '';
    img_options.channel_name = '';
    img_options.trigger_word = '';
  });
}


app.post('/slackimg', function(req, res) {
	req.pipe(map(function (chunk) {
		parsed = querystring.parse(chunk.toString())
		console.log('app.post(/slackimg): ')
		user_name = parsed['user_name'];
		text = parsed['text'];
		timestamp = parsed['timestamp'];
    channel_name = parsed['channel_name'];
    trigger_word = parsed['trigger_word'];
		date = new Date(parseInt(parsed['timestamp']) * 1000)

		console.log('user ' + user_name + ' said ' 
			+ text + ' at ' + date.toString());

    img_entry = text.slice('!img'.length+2, text.length);  // strip off the !img + index + space
		
		img_entry = img_entry.replace(/ /g, '%20');
		console.log('img_entry: ' + img_entry);
    console.log('trigger_word: ' + trigger_word);
		img_options.path = img_path_const + img_entry;
    img_options.channel_name = channel_name;
    img_options.trigger_word = trigger_word;
    https.request(img_options, img_cb).end();	
  console.log('req:' + util.inspect(req));
  console.log('res:' + util.inspect(res));
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

function PostToSlack(channel_name, post_text, bot_name, bot_emoji) {
  // Build the post string from an object

    post_data = JSON.stringify(
  	{"text" : post_text, 
  	 "username" : bot_name,
  	 "icon_emoji" : bot_emoji
  	})

	//post_data = '{"text" : "' + post_text + '", "username" : "' + bot_name + 
	//'", "icon_emoji" : "' + bot_emoji + '"}';
  
  console.log(post_text)

  if (channel_name === "legible")
  {
    //#legible
    path_str = '/services/hooks/incoming-webhook?token=mcmbhcqQpfoU2THsofvad3VA'; 
    host_str = 'poundc.slack.com';
  } else if (channel_name == "football") {
    //#football, stingtalk
    path_str = 'https://hooks.slack.com/services/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';
    host_str = 'stingtalk.slack.com'
  } else {
    // we can technically not use this 2nd incoming webhook... leave it in for now
    //#testing
    path_str = 'https://hooks.slack.com/services/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'; 
    host_str = 'poundc.slack.com'    
  }

  var post_options = {
      host: host_str,
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
