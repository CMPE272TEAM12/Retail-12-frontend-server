/**
 * Module dependencies.
 */
var express = require('express')
  , http = require('http')
  , path = require('path')
  , session = require('express-session')
  , RedisStore = require('connect-redis')(session)
  , employee = require('./controllers/makerequest/employee')
  , product = require('./controllers/makerequest/product')
  , routes = require('./controllers/routes/index')
  , loginMediator = require('./controllers/makerequest/login')


var apicache = require('apicache').options({ debug: true }).middleware;

var app = express();
var twitter = require('ntwitter');
var sentimental = require('Sentimental');
var twit = require('twit');

// all environments
app.set('port', process.env.PORT || 3232);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.methodOverride());
app.use(express.bodyParser());
app.use(express.cookieParser());
//app.use(session({
//	store: new RedisStore({ // Session stored in redis
//		  host:'127.0.0.1', // redis-server thats on localhost
//		  port: 6379, // access on port
//		  ttl: 60*1000 // in seconds
//		}), 
//	secret: 'CMPE273TEAM2' 
//}));

app.use(express.session({secret: 'name it', cookie: { maxAge: 600000}}));

app.use(express.static(path.join(__dirname, 'public')));
app.use('/controllers',  express.static(__dirname + '/controllers'));
app.use('/views',  express.static(__dirname + '/views'));
app.use('/bower_components',  express.static(__dirname + '/bower_components'));
app.use('/node_modules',  express.static(__dirname + '/node_modules'));
app.use('/assets',  express.static(__dirname + '/views/assets'));
app.use('/audio',  express.static(__dirname + '/views/audio'));
app.use('/images',  express.static(__dirname + '/views/images'));
app.use('/img',  express.static(__dirname + '/views/images/img'));
app.use(app.router);

// This is used to CORS issue. (Cross Browsing scripting Error) while handling two Node servers. 
// Note : Using RabbitMQ this error doesn't occur or wasn't discovered yet I've added this code for Future safety
app.use(function(req, res, next) {
	// Allow request coming from any origin, if you need any specific Originator, instead of '*' specify the required URI
	res.header('Access-Control-Allow-Origin', '*');
	// Specify allowed headers that you require, If you require to provide access any more header values specify here
	res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
	// This is for sending cookie data with the request, as by default they're not sent and this value is set to false, for security reasons. Thus setting it to True explicitly
	res.header("Access-Control-Allow-Credentials", true);
	
	// Before any request is actually triggered, Chrome sends an dummy request as 'OPTIONS', thus this checks if our server will accept the headers and credentials with that type of request
	// on success response for this, Chrome sends the Original originated request. Thus used to counter it. 
	if (req.method === "OPTIONS") {
		res.end('');
	} else {
		next();
	}
});

// development only
if ('development' === app.get('env')) {
  app.use(express.errorHandler());
}

/**
 * This is used to restrict user if he is not authenticate, before trigerring the request.
 * @param req
 * @param res
 * @param next
 */
function restrict(req, res, next) {
console.log("token : "+req.session.token);
  if (req.session.token) { // If token is present authenticate user
	  console.log("User Ok");
	  next();
  } else { // Else send unauthorised access error
	console.log(".....401.....");
    req.session.error = 'Access denied!';
    res.end('401');
  }
}

// All get request defined here
//get Request
//app.get('/', routes.index);
//get login page
app.get('/login', routes.login);
app.get('/error',routes.error);
app.get('/dashboard', routes.dashboard); 
app.get('/client_dashboard', routes.load);
app.get('/guard_dashboard', routes.guardPage);


app.post('/addproduct',product.addProduct);

app.post('/updateproduct',product.updateProduct);

app.post('/soldproduct',product.soldProduct);

app.get('/getproduct',product.getProduct);

app.get('/addemployee',employee.addEmployee);

app.get('/getemployee',employee.getEmployee);

app.get('/getproductshistory',product.getproducthistory);

var tweetCount = 0;
var tweetTotalSentiment = 0;
var monitoringPhrase;

//var config = require("./config");
	

//app.get('/twitterCheck', function (req, res) {
//    tweeter.verifyCredentials(function (error, data) {
//        res.send("Hello, " + data.name + ".  I am in your twitters.");
//    });
//});


//app.get('/reset',function resetMonitoring() {
//    monitoringPhrase = "";
//});



//app.get('/monitor',function beginMonitoring(phrase) {
//    var stream;
//    // cleanup if we're re-setting the monitoring
//    if (monitoringPhrase) {
//        resetMonitoring();
//    }
//    monitoringPhrase = 'NDTV';
//    //console.log("hh"+phrase);
//    tweetCount = 0;
//    tweetTotalSentiment = 0;
//    tweeter.verifyCredentials(function (error, data) {
//        if (error) {
//            return "Error connecting to Twitter: " + error;
//        } else {
//            stream = tweeter.stream('statuses/filter', {
//                'track': monitoringPhrase
//            }, function (stream) {
//                console.log("Monitoring Twitter for " + data.lang);
//                stream.on('data', function (data) {
//                    // only evaluate the sentiment of English-language tweets
//                    if (data.lang === 'en') {
//                        sentiment(monitoringPhrase, function (err, result) {
//                        	console.log("Total TweetCount"+tweetCount+"Sentiment"+tweetTotalSentiment);
//                            tweetCount++;
//                            tweetTotalSentiment += result.score;
//                        });
//                    }
//                });
//            });
//            return stream;
//        }
//    });
//});


app.get('/',
    function (req, res) {
        var welcomeResponse = "<HEAD>" +
            "<title>Twitter Sentiment Analysis</title>\n" +
            "</HEAD>\n" +
            "<BODY>\n" +
            "<P>\n" +
            "Welcome to the Twitter Sentiment Analysis app.<br>\n" + 
            "What would you like to monitor?\n" +
            "</P>\n" +
            "<FORM action=\"/monitor\" method=\"get\">\n" +
            "<P>\n" +
            "<INPUT type=\"text\" name=\"phrase\"><br><br>\n" +
            "<INPUT type=\"submit\" value=\"Go\">\n" +
            "</P>\n" + "</FORM>\n" + "</BODY>";
        if (!monitoringPhrase) {
            res.send(welcomeResponse);
        } else {
            var monitoringResponse = "<HEAD>" +
                "<META http-equiv=\"refresh\" content=\"5; URL=http://" +
                req.headers.host +
                "/\">\n" +
                "<title>Twitter Sentiment Analysis</title>\n" +
                "</HEAD>\n" +
                "<BODY>\n" +
                "<P>\n" +
                "The Twittersphere is feeling<br>\n" +
                "<IMG align=\"middle\" src=\"" + sentimentImage() + "\"/><br>\n" +
                "about " + monitoringPhrase + ".<br><br>" +
                "Analyzed " + tweetCount + " tweets...<br>" +
                "</P>\n" +
                "<A href=\"/reset\">Monitor another phrase</A>\n" +
                "</BODY>";
            res.send(monitoringResponse);
        }
    });


function sentimentImage() {
    var avg = tweetTotalSentiment / tweetCount;
    if (avg > 0.5) { // happy
        return "/images/excited.png";
    }
    if (avg < -0.5) { // angry
        return "/images/angry.png";
    }
    // neutral
    return "/images/content.png";
}


app.get('/monitor',function (req,res) {
    var stream;
    var score
    // cleanup if we're re-setting the monitoring
//    if (monitoringPhrase) {
//        resetMonitoring();
//    }
    monitoringPhrase = 'ISIS';
    var today = new Date();
    //console.log("hh"+phrase);
    tweetCount = 0;
    tweetTotalSentiment = 0;
    //tweeter.verifyCredentials(function (error, data) {
    //    if (error) {
    //        return "Error connecting to Twitter: " + error;
    //    } else {
        	tweeter.get('search/tweets', {q: '' + monitoringPhrase + ' since:' + today.getFullYear() + '-' +
        	      (today.getMonth() + 1) + '-' + today.getDate(), count:200}, function(err, data) {
        	        // perform sentiment analysis
        	    	// console.log(data['statuses']);
        	        score = performAnalysis(data['statuses']);
        	        console.log("score:", score);
        	      //  console.log("choice:", choices[i]);
        	        //  determine winner
//        	        if(score > highestScore) {
//        	          highestScore = score;
//        	          highestChoice = choices[i];
//        	          console.log("winner:",choices[i]);
//        	        }
        	 //       console.log("");
        	      });
           // return stream;
     //   }
   // });
});

function performAnalysis(tweetSet) {
	  //set a results variable
	  var results = 0;
	  // iterate through the tweets, pulling the text, retweet count, and favorite count
	  for(var i = 0; i < tweetSet.length; i++) {
	    tweet = tweetSet[i]['text'];
	    retweets = tweetSet[i]['retweet_count'];
	    favorites = tweetSet[i]['favorite_count'];
	    // remove the hastag from the tweet text
	    tweet = tweet.replace('#', '');
	    // perform sentiment on the text
	    var score = sentimental.analyze(tweet)['score'];
	    // calculate score
	    results += score;
	    if(score > 0){
	      if(retweets > 0) {
	        results += (Math.log(retweets)/Math.log(2));
	      }
	      if(favorites > 0) {
	        results += (Math.log(favorites)/Math.log(2));
	      }
	    }
	    else if(score < 0){
	      if(retweets > 0) {
	        results -= (Math.log(retweets)/Math.log(2));
	      }
	      if(favorites > 0) {
	        results -= (Math.log(favorites)/Math.log(2));
	      }
	    }
	    else {
	      results += 0;
	    }
	  }
	  // return score
	  results = results / tweetSet.length;
	  return results;
	}



app.post('/login', loginMediator.after_login);
//app.post('/addalertdetail',guardMediator.add_alert);
app.post('/logout', loginMediator.logout);


http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});