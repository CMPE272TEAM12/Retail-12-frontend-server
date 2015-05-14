var mq_client = require('../../rpc/client');
var utility = require('./utility');

function after_login (req, res) {

	console.log(req.param("employeecode"));
	var msg_payload = {
			"empcode":req.param("employeecode"),
			"type":"login"
	}
	
	utility.send_request('login_queue',msg_payload,req,res);
}

function logout (req,res){
	var msg_payload = { "ssn": req.session.ssn, 
			"type" : "logout" };
	
	console.log("In logout");
	
	mq_client.make_request('login_queue', msg_payload, function(err,results){
		
		console.log("Results: "+ results.code);
		if(err){
			console.log("logout Post request Error");
			throw err;
		} else  {
			if(results.code === "200"){
				
				console.log("Session destroyed.");
				req.session.destroy();
				res.send({"value":"Success", "status": true});
			} else {    
				console.log("Session not destroyed.");
				res.send({"value":"Fail", "status":false});
			}
		}  
	});
}

exports.logout = logout;
exports.after_login = after_login;