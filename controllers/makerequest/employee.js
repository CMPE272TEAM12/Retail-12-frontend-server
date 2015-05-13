var mq_client = require('../../rpc/client');
var utility = require('./utility');

exports.addEmployee = addEmployee;
exports.getEmployee = getEmployee;


function getEmployee(req,res){
	var msg_payload = {		
			"type":"get"
	}
	
	utility.get_request('employee_queue',msg_payload,req,res);
}
function addEmployee(req,res){
	var msg_payload = {
			"emp_code":req.params("empCode"),
			"emp_name":req.params("empName"),
			"emp_address":req.params("empAddress"),
			"emp_state":req.params("empState"),
			"emp_zipcode":req.params("empZipCode"),
			"emp_phone":req.params("empPhone"),
			"store_id":1,
			"type":"add"
	}
	
	utility.send_request('employee_queue',msg_payload,req,res);
}