var mq_client = require('../../rpc/client');
var utility = require('./utility');

exports.addProduct = addProduct;
exports.updateProduct = updateProduct;
exports.soldProduct = soldProduct;
exports.getProduct = getProduct;

function getProduct(req,res){
	var msg_payload = {
			"type":"get"
	}
	
	utility.get_request('product_queue',msg_payload,req,res);
}

function soldProduct(req,res){
	var msg_payload = {
			"product_id":req.params("productID"),
			"product_cost":req.params("productCost"),
			"type":"sold"
	}
	
	utility.send_request('product_queue',msg_payload,req,res);
	
}
function addProduct(req,res){

	var msg_payload = {
			"product_code":req.params("productCode"),
			"product_name":req.params("productName"),
			"product_price":req.params("productPrice"),
			"store_id":2,
			"type":"add"
	}
	
	utility.send_request('product_queue',msg_payload,req,res);
}

function updateProduct(req,res){

	var msg_payload = {
			"product_code":req.params("productCode"),
			"product_name":req.params("productName"),
			"product_price":req.params("productPrice"),
			"store_id":2,
			"type":"update"
	}	
	utility.send_request('product_queue',msg_payload,req,res);
}
