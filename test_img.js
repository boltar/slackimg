
http = require('http')
var querystring = require('querystring');

var options = {
	hostname: 'localhost',
	port: 5000,
	path: '/slackimg',
	method: 'POST'
}

date = new Date()

var post_data = [];

post_data[0] = querystring.stringify({
      'user_id' : 'U02A2NEUX',
      'user_name' : 'boltar',
      'timestamp': '1402359176.000029', //date.getTime(),
      'text' : '!img strawberry cake', 
      'trigger_word': '!img1'
  });

post_data[1] = querystring.stringify({
      'user_id' : 'U02A2NEUX',
      'user_name' : 'boltar',
      'timestamp': '1402359176.000029', //date.getTime(),
      'text' : '!img2 latte art', // test img2
      'trigger_word': '!img2'
  });

post_data[2] = querystring.stringify({
      'user_id' : 'U02A2NEUX',
      'user_name' : 'boltar',
      'timestamp': '1402359176.000029', //date.getTime(),
      'text' : '!img3 super mario bros', // test img2
      'trigger_word': '!img3'
  });

var req = http.request(options, function(res) {
	res.setEncoding('utf8')
	res.on('data', function (chunk) {
		console.log('BODY: ' + chunk)
	})
})

req.on('error', function (e) {
	console.log('problem with request: ' + e.message)
})

//req.write(post_data[0])
//req.write(post_data[1])
req.write(post_data[2])
//req.write(post_data[4]) --> will fail due to caps

req.end()
