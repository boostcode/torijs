var express = require('express');
var router = express.Router();
var account = require('../models/account');
var action = require('../models/action');
var oID = require('mongodb').ObjectID;
var fs = require('fs');
var csv = require('fast-csv');
var _ = require('underscore');
var rbac = require('mongoose-rbac');
var permission = rbac.Permission;
var torii = require('../conf/torii.conf.js').torii;
var actionFunction = require('../routes/action');
var template = require('template');
var S = require('string');

  // list
  router.post('/list.json', function(req, res){
    var structure = req.db.collection('torii_structure');

    structure.find({}).toArray(function(err, collections){

      if(err){
        res.send(err);
        return;
      }

      var colls = [];

      if(collections){

        collections.forEach(function(col){

          var colName = col.nome_collezione;

          if((colName != 'system') && (colName != 'torii_structure') && (colName != 'torii_removed')){
            
            colls.push({
              'name': colName,
              'import': col.import
            });
          }
        });
      }

      var totElems = colls.length;

      if(req.body.iDisplayLength && req.body.iDisplayStart){
        if(req.body.iDisplayLength > 0){
          colls = colls.splice(req.body.iDisplayStart, req.body.iDisplayLength);
        }
      }

      res.send({
        sEcho: parseInt(req.body.sEcho),
        iTotalRecords: totElems,
        iTotalDisplayRecords: colls.length,
        aaData: colls,
        serverTime: new Date().getTime()
      });

    });
  });

  // check for updates
  router.post('/:collection_name/hasupdate', function(req, res){
    req.user.can('api-read', req.params.collection_name, function(err, can){
      if(err){
        res.send(err);
        return;
      }

      if(can || req.user.isDev){
        var collection = req.db.collection(req.params.collection_name);

        var data = req.body.last_update;

        var query = {
          last_update : {
            "$gt": parseFloat(data)
          }
        };

        collection.find(query).toArray(function(err, items){
          res.send({
            status: 'ok',
            data: items.length
          });
        });
      }else{
        res.send(401, 'user not allowed');
      }
    });
  });

  // document list
  router.post('/:collection_name/documents.json', function(req, res){

    req.user.can('api-read', req.params.collection_name, function(err, can){
      if(err){
        res.send(err);
        return;
      }
      if(can || req.params.collection_name == 'torii_structure' || req.user.isDev){
        
        var collezione;
        var objRemoved;

        if(req.body.queryRemoved){
          collezione = req.db.collection('torii_removed');
          collezione.find(req.body.queryRemoved).toArray(function(err, items){
            objRemoved = items;
          });
        }

        var collezione = req.db.collection(req.params.collection_name);
        
        var ordering = {};


        var collectionStructure = req.db.collection('torii_structure');

        collectionStructure.find({
          'nome_collezione': req.params.collection_name
        }).toArray(function(err, coll){

          if(err){
            res.send(err);
            return;
          }

          if(req.params.collection_name != 'torii_structure'){


            var orderKey = null;

            coll[0].struttura.forEach(function(element){
              if(element.order){
                orderKey = element.field_name;
              }
            });

            if(orderKey){
              ordering = {
                sort: [
                  [ orderKey, 'desc']
                ]
              };
            }
          }

          var query;
        
          if(req.body.sSearch){

            query = [];

            coll[0].struttura.forEach(function(field){

              var filter = {};

              filter[field.field_name] = { $regex : ".*"+req.body.sSearch+".*", $options: "i" };
            
              query.push( filter );

            });
            
            query = { $or : query };

          }

          if(req.body.query){
            query = req.body.query;
          }

          account.find({}, function(err, users){

          collezione.find(query, ordering).toArray(function(err, items){

            var totElems = items.length;
            
            // TODO: sub filter elements
            
            // order according selection
            // let's use underscore to sort but need to retrieve the element of the collection structu

            var totElementsFiltered = items.length;

            if(req.body.iDisplayLength && req.body.iDisplayStart){
              items = items.splice(req.body.iDisplayStart, req.body.iDisplayLength);
            }

            items.forEach(function(item){
              if(item.owner){
                users.forEach(function(user){
                  if(JSON.stringify(item.owner) == JSON.stringify(user._id)){
                    var usrName = (user.name) ? user.name : '';
                    var usrSurname = (user.surname) ? user.surname : '';
                    item.owner = usrName +' '+usrSurname+' '+user.username;
                  }
                });
              }
            });

            res.send({
              sEcho: parseInt(req.body.sEcho),
              iTotalRecords: totElems,
              iTotalDisplayRecords: totElementsFiltered,
              aaData: items,
              objRemoved: objRemoved,
              serverTime: new Date().getTime()
            });
          });
        });


        });
      }
    });
  });


  // create
  router.post('/:collection_name/create', function(req, res){
    req.db.createCollection(req.params.collection_name, function(err, col){
      if(err){
        res.send(err);
        return;
      }

      var struct = req.db.collection('torii_structure');
      
      // lovercase name of collection
      req.body.dati.nome_collezione = req.body.dati.nome_collezione.toLowerCase();
      
      struct.insert(req.body.dati, {w:1}, function(err, result){
      
        if(err){
          res.send(err);
          return;
        }

        var cleanName = req.body.dati.nome_collezione.replace(/ /g,'');

        permission.create([
          {
            subject: cleanName,
            action: 'backend-read'
          },
          {
            subject: cleanName,
            action: 'backend-write'
          },
          {
            subject: cleanName,
            action: 'api-read'
          },
          {
            subject: cleanName,
            action: 'api-write'
          }
        ], function(err){
          if(err){
            res.send(err);
            return;
          }
        });
        
        res.send({
          status: 'ok'
        });

      });
    });
  });

  // remove
  router.post('/:collection_name/delete', function(req, res){
    req.user.can('api-write', req.params.collection_name, function(err, can){
      if(err){
        res.send(err);
        return;
      }

      if(can || req.user.isDev){
        req.db.dropCollection(req.params.collection_name, function(err, coll){
          if(err){
            res.send(err);
            return;
          }

          var collection = req.db.collection('torii_structure');

          collection.remove({
            nome_collezione: req.params.collection_name
          },{w:1}, function(err, result){
            if(err){
              res.send(err);
            }

            res.send({
              status: 'ok',
              data: result
            });
          });
        
          permission.remove({
            subject: req.params.collection_name
          },function(err){
            if(err){
              res.send(err);
              return;
            }
          });

        });
      }else{
        res.send(401, 'user not allowed');  
      }
    });
  });

  // insert
  router.post('/:collection_name/insert', function(req, res){
    req.user.can('api-write', req.params.collection_name, function(err,can){
      if(can || req.user.isDev){
        var collection = req.db.collection(req.params.collection_name);

        var value = req.body.valori;

        value.last_update = new Date().getTime();

        value.text = '';

        value.owner = req.user._id;
        
        var responseJ = {};

        collection.insert(value, {w:1}, function(err, result){
          collection.ensureIndex('text', function(){});

          responseJ.status = 'ok';
          responseJ.data = result;

          console.log(req.params.collection_name);

          action.find({
            $and:[
              { 
                trigger: 'create'
              },
              {
                collectionName: req.params.collection_name
              }
            ]
          }, function(err, actions){
            
            var actionToSend = [];

            console.log(actions);
            
            console.log('UTENTE RICH: '+ req.user);

            actions.forEach(function(act){

                if(act.action == 'email'){
                  
                  var msgVal = [];
                  
                  act.message.forEach(function(msg) {
                    
                    msgVal.push(template(msg, {
                      creator: req.user, item: value
                    }));
                    
                  });
                  
                  var mailOptions = {
                    from: torii.conf.mail.from,
                    to: '',
                    subject: act.name + ' Notification - '+ result[0]._id,
                    text: msgVal
                  };
                  
                  var destArr = [];
                  
                  // If the CREATOR is one of the receivers
                  if (act.creatorMail == true) {
	                  
	                  // I add the CREATOR
									  destArr.push(req.user.username);
									   
									}
									
									var other = act.receiver.split(',');
									
									other.forEach(function(msgO) {
										
										destArr.push(S(msgO).trim().s);
										
									});
									
									mailOptions["to"] = destArr;
									
									console.log('MSG: '+ mailOptions["text"]);

                  if(act.message.length > 1){
                    actionToSend.push(mailOptions);
                  }else{
                  	mailOptions["text"] = mailOptions["text"][0];
                    req.body.mailActions = [mailOptions];
                    actionFunction.sendMail(req);
                  }
                  
                }else if(act.action == 'push'){
                  // TODO add push
                }
          
            });

            if(actionToSend.length > 0){
              responseJ.actions = actionToSend;
            }
            res.send(responseJ);
          }); 
        });
      }else{
        res.send(401, 'user not allowed');
      }
    });
  });

  // remove all documents from collection
  router.post('/:collection_name/delete_all', function(req, res){
    req.user.can('api-write', req.params.collection_name, function(err, can){
      if(err){
        res.send(err);
        return;
      }

      if(can || req.user.isDev){
        var collection = req.db.collection(req.params.collection_name);
        
        collection.remove(function(err, result){
          if(err){
            res.send(err);
            return;
          }

          res.send({
            status: 'ok',
            data: result
          });
        });

      }else{
        res.send(401, 'user not allowed');
      }
    });
  });

  // import csv
  router.post('/:collection_name/import',function(req, res){
    
    console.log('qua');
    
    // check permission
    req.user.can('api-write', req.params.collection_name, function(err, can){		
      if(err){
        res.send(err);
        return;
      }

      if(can || req.user.isDev){
        
        console.log('SEI AUTO');
        
        if(req.files.csv){
      
          var structure = req.db.collection('torii_structure');
      
          var uniqueId = '';
      
          structure.find({'nome_collezione': req.params.collection_name }).toArray(function(err, items) {
            if(err){
              res.send(err);
              return;
            }

            // let's assume that we have only a collection with that very name
            item = items[0];
        
            // loop within the structure
            item.struttura.forEach(function(element) {
                  
              if(element.unico == 'true'){
                uniqueId = element.field_name;
                return;
              }
            });
        
            // if structure has unique id
            if(uniqueId != ''){
          
              // retrieve collection items
              var collection = req.db.collection(req.params.collection_name);
              collection.find({}).toArray(function(err, colls){
                
                if(err){
                  res.send(err);
                  return;
                }
            
                // open csv file
                var stream = fs.createReadStream(req.files.csv.path);
            
                // process csv
                csv.fromStream(stream, {
                  headers : true,
                  delimiter : ';'
                })
                .on("record", function(data){
                          
                  var lists = [];
              
                  var query = {};
                  query[uniqueId] = data[uniqueId];
                          
                  // check if item exists
                  lists = _.where(colls, query);
                          
                  // if already exists
                  if(lists.length > 0){
                                            
                    // Cerco il document in base all'objectId e modifico i campi passati da req.body
                    collection.update({'_id':lists[0]._id}, {$set:data}, {w:1}, function(err, result) {
                
                        if(err) { 
                          res.send(err);
                          return;
                        }
                
                    });
                              
                  }else{ // create new
                
                    collection.insert(data, {w:1}, function(err, result) {
                      if(err){
                        res.send(err);
                        return;
                      }
                    });
                
                  }
              
                })
                .on("end", function(){
              
                  // unlink it
                  fs.unlink(req.files.csv.path);
              
                  // response 
                  res.json({
                    'status': 'Csv import completed!'
                  });
              
                });
            
              });
          
            }else{
              res.json({
                'error':'missing unique field for import'
              });
					}
			
				})
		
			}else{
				res.json({
					'error': 'csv file error'
				});
			}
			
		}else{
		
		console.log('non sei auto');
		
			res.send(401,'you are not allowed')
			
		}
	})	
});

// show document in collection
router.post('/:collection_name/:document_id', function(req, res){
  req.user.can('api-read', req.params.collection_name, function(err, can) {
    
    if(err){
      res.send(err);
      returnl;
    }
    
    if(can || req.user.isDev) {
    
      var collection = req.db.collection(req.params.collection_name);

      if(req.params.document_id) {
        var objectId = new oID.createFromHexString(req.params.document_id);
        //var objectId = req.params.document_id;
      }

      var query = {};

      if(objectId){
        query = {
          _id: objectId
        };
      }

      collection.find(query).toArray(function(err, items){
      
        if(err){
          res.send(err);
          return;
        }

        res.send({
          status: 'ok',
          data: items
        });
        
      });

    } else {
      res.send(401, 'user not allowed');
    }
  });
});

// update document
router.post('/:collection_name/:document_id/update', function(req, res){

	req.user.can('api-write', req.params.collection_name, function(err, can) {
  	
  	if(err){
      res.send(err);
      return;
    }

    var collection = req.db.collection(req.params.collection_name);

    var values = req.body.valori;

    values.last_update = new Date().getTime();

    var objectId = new oID.createFromHexString(req.params.document_id);
      
    collection.find({ _id: objectId }).toArray(function(err, items){
      
        if(err){
          res.send(err);
          return;
        }
        
        var keysOfValuesChanged = [];
        
        var item;
        
        if (items.length > 0) {
	        
	        item = items[0];
	        
	        console.log('ITEM: '+ JSON.stringify(item));
				
					for (var key in item) {
					
						if (item.hasOwnProperty(key)) {
						
							console.log('KEY: '+ key +' | '+ JSON.stringify(values[key]) + ' == ' + JSON.stringify(item[key]));

							if (!_.isEqual(values[key], item[key])) {
								
								keysOfValuesChanged.push(key);
								
							}
						
						}
						
					}
					
					keysOfValuesChanged = _.difference(keysOfValuesChanged, ['_id', 'text', 'last_update', 'owner']);
					
					console.log('VALUS CHANG : '+ JSON.stringify(keysOfValuesChanged));
	        
        }
        
        // aggiorno solo dopo aver controllato quali valori sono da modificare
        collection.update({ _id: objectId }, { $set: values }, { w: 1 }, function(err, result){
		      
		      if(err){
		        res.send(err);
		        return;
		      }
		      /*
		      res.send({
		        status: 'ok',
		        data: result
		      });*/
		      
					var responseJ = {};
					
					responseJ.status = 'ok';
          responseJ.data = result;
		    
		    action.find({
            $and:[
              { 
                trigger: 'edit'
              },
              {
                collectionName: req.params.collection_name
              },
              { field: { $in: keysOfValuesChanged } }
            ]
          }, function(err, actions){
            
            var actionToSend = [];
            
            console.log('ACTIONs : '+ JSON.stringify(actions));
            
            var actionsOk = [];
            
            actions.forEach(function(act) {
            
            	if (act.filter == 'value') {
	            	
	            	actionsOk.push(act);
	            	
            	} else if (act.filter == 'to') {
	            	
	            	console.log('KEY: '+ act.filter +' | '+ JSON.stringify(values) + ' == ' + JSON.stringify(act));
	            	
	            	if (_.isEqual(values[act.field], act.to)) {
		            	
		            	actionsOk.push(act);
		            	
	            	}
	            	
            	} else if (act.filter == 'from') {
            	
            		console.log('KEY: '+ act.filter +' | '+ JSON.stringify(item[act.field]) + ' == ' + JSON.stringify(act.from));
	            	
	            	if (_.isEqual(item[act.field], act.from)) {
		            	
		            	actionsOk.push(act);
		            	
	            	}
	            	
            	} else if (act.filter == 'fromto') {
	            	
	            	// TO DO
		            
		            actionsOk.push(act);
		            	
            	}
            
            });
            
           /* console.log('ACTIONs ok : '+ JSON.stringify(actionsOk));
						
						console.log('OWN: '+ item.owner);
						
						console.log('val: '+ JSON.stringify(values));
						
						console.log('result: '+ result);
						*/
						//var ownerId = new oID.createFromHexString(item.owner);
						
						collection.find({ _id: objectId }).toArray(function(err, itemsModified){
      
			        if(err){
			          res.send(err);
			          return;
			        }
			        
			        var keysOfValuesChanged = [];
			        
			        var itemModified;
			        
			        if (itemsModified.length > 0) {
				        
				        itemModified = itemsModified[0];
						
								// I find the email of CREATOR
			          account.findById(item.owner, '_id username role isAdmin isDev name surname extraFields', function(err, user) {
			                  
									if(err){
										res.send(err);
										return;
									}
		
									actionsOk.forEach(function(act) {
		
		                if(act.action == 'email'){
		                  
		                  console.log('lenght: '+ act.message.length);
		
		                  // Replace key with parameters
		                  
		                  var msgVal = [];
		                  
		                  act.message.forEach(function(msg) {
		                    
		                    msgVal.push(template(msg, {
		                      creator: user, item: itemModified, editor: req.user
		                    }));
		                    
		                  });
		                  
		                  // Email options
		                  var mailOptions = {
		                    from: torii.conf.mail.from,
		                    to: '',
		                    subject: act.name + ' Notification - '+ req.params.document_id,
		                    text: msgVal
		                  };
		                  
		                  var destArr = [];
		                                    
		                  // If there is also the EDITOR I add him
			                if ((act.editorMail == true)) {
			                  
			                  destArr.push(req.user.username);
			                  
			                }
		                  
		                  // If the CREATOR is one of the receivers
		                  if (act.creatorMail == true) {
			                  
			                 console.log('USER: '+ JSON.stringify(user));
			                  
			                  // I add the CREATOR
											  destArr.push(user.username);
											   
											}
											
											var other = act.receiver.split(',');
											
											other.forEach(function(msgO) {
												
												destArr.push(S(msgO).trim().s);
												
											});
											
											mailOptions["to"] = destArr;
											
											console.log('MSG: '+ mailOptions["text"]);
											
											// If only 1 message mail immediately otherwise I send message to the page
											if(act.message.length > 1) {
		                  	actionToSend.push(mailOptions);
											} else {
												mailOptions["text"] = mailOptions["text"][0];
												req.body.mailActions = [mailOptions];
												actionFunction.sendMail(req);
											}
											
		                } else if(act.action == 'push') {
		                  // TODO add push
		                }
		          
									});
									
								
							
							console.log("ACT TO:"+ actionToSend);
											
							if(actionToSend.length > 0){
								responseJ.actions = actionToSend;
							}
							res.send(responseJ);
            
            });
            
          
          
          
          	}
								
							});
          
          // close action find
         });
               
               
      // close update
	  });

    // close find
  });
  
  	// close api
  });
  
  // close function
});

// remove document
router.post('/:collection_name/:document_id/delete', function(req, res){
  req.user.can('api-write', req.params.collection_name, function(err, can){
    if(err){
      res.send(err);
      return;
    }

    if(can || req.user.isDev){
      var collection = req.db.collection(req.params.collection_name);

      var objectId = new oID.createFromHexString(req.params.document_id);
      
      var query = {};

      if(objectId){
        query = {
          _id: objectId
        };
      }

      var objToDel = {};
      objToDel['collection'] = req.params.collection_name;
      objToDel['remove_date'] = new Date().getTime();

      collection.find(query).toArray(function(err, items){
        if(err){
          res.send(err);
          return;
        }
        objToDel['object_removed'] = JSON.stringify(items[0]);
      });

      collection.remove({
        _id: objectId
      },{
        w: 1
      }, 
      function(err, result){
      
        if(err){
          res.send(err);
          return;
        }

        if(objToDel.collection != 'torii_removed'){
          collection = req.db.collection('torii_removed');

          collection.insert(objToDel, {w:1}, function(err, result){
            if(err){
              res.send(err);
              return;
            }
          });
        }

        res.send({
          status: 'ok',
          data: result
        });
      });

    }else{
      res.send(401, 'user not allowed');
    }
  });
});



module.exports = router;
