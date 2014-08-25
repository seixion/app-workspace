
//Controller
var AnnotationEditor = function(scope) {
	
	var out = {
		currentAnnotatedAsset : null,
		fabricModel: null,
		scope : scope,
		annotatedAssets: [],
		userData: null,
		imageCarouselPageAssetCount: 8,
		imageCarouselPageIndex: 1,
		currentTool: null,
		connection: null,
		loadSelectors : function()
		{
		}
		,
		loadModels : function()
		{
			var scope = this.scope;

			loadFabricModel(scope);

			// load asset data

			jQuery.ajax({
				type: "GET",
				url: "" + scope.apphome + "/components/annotations/json/viewassets.json?id=" + scope.collectionid,
				async: false,
				error: function(data, status, err) {
					console.log('from error:', data);
				},
				success: function(data) {
					// console.log('from success:', data);
					scope.add('assets', data);
					if( data.length > 0 )
					{
						$.each(data, function(index, annotation)
						{
							var annotationToAdd = scope.annotationEditor.createAnnotatedAsset(annotation);
							scope.annotationEditor.annotatedAssets.push(annotationToAdd);
						});
						scope.annotationEditor.setCurrentAnnotatedAsset(scope.annotationEditor.annotatedAssets[0]);
					}
					var colors = ["#723421","#523421","#323421","#123421", "#fff000"];
			
					var colorpicker = {hex:colors[4]};
					scope.colorpicker = colorpicker;
					
					scope.annotationEditor.fabricModel.selectTool("draw");
					
				},
				failure: function(errMsg) {
					alert(errMsg);
				}
			});

			// get user data, should this be in connect?
			$.getJSON('/entermedia/services/json/users/status.json', function(data) {
				scope.annotationEditor.userData = data;
			});
		}
		,
		removeAnnotation: function(annotationid)
		{
			var editor = this;
			
			var annotationToRemove = editor.currentAnnotatedAsset.getAnnotationById(annotationid);
			
			$.each(annotationToRemove.fabricObjects, function(index, item)
			{
				editor.fabricModel.canvas.remove(item);
			});
			editor.currentAnnotatedAsset.removeAnnotation(annotationid);
			scope.annotations = editor.currentAnnotatedAsset.annotations;
			jAngular.render("#annotationlist");
					
		}
		,
		createAnnotatedAsset: function(assetData)
		{
			var aa = new AnnotatedAsset();
			aa.assetData = assetData;
			aa.scope = scope;
			aa.annotations = [];
			//TODO: Get Annotations from server on session instantiation
			
			return aa;
		}
		,
		toggleCommentEdit: function(annotationid)
		{
			var annotation = this.currentAnnotatedAsset.getAnnotationById(annotationid);
			var html = jQuery("#annotation-template").html();
			
			jQuery("#annotation" + annotationid).html(html); //replace div
			var localscope = this.scope.createScope();
			localscope.annotation = annotation;
			jAngular.replace("#annotation" + annotationid, localscope);
		}
		,
		saveComment: function(annotationid)
		{
			var annotation = this.currentAnnotatedAsset.getAnnotationById(annotationid);
		
			var comment = $("#annotation" + annotationid + " .user-comment-input").val();
		
			annotation.comment = comment;
			
			//update UI?
			
			this.notifyAnnotationModified(annotation);
			jAngular.render("#annotationtab");
		
		
		}
		,
		cancelComment: function(annotationid)
		{
			jAngular.render("#annotationtab");
		}
		,
		setCurrentAnnotatedAsset: function(annotatedAsset)
		{
			this.currentAnnotatedAsset = annotatedAsset;
			//  appname    prefixmedium   sourcepath appendix
			var url = this.scope.apphome + "/views/modules/asset/downloads/preview/large/" + annotatedAsset.assetData.sourcepath + "/image.jpg";
			
			this.fabricModel.clearCanvas();

			this.fabricModel.setBackgroundImage(url);

			var editor = this;

			this.scope.annotations = annotatedAsset.annotations;
			$.each(editor.scope.annotations, function(index, annotation)
			{
				var oldAnnotations = annotation.fabricObjects;
				// annotation.fabricObjects = [];
				if (annotation.isLive())
				{
					$.each(oldAnnotations, function(index, item)
					{
						// annotation.fabricObjects.push(item);
						item.annotationid = annotation.id;
						
						editor.fabricModel.canvas.addInternal(item);
					});
				} 
				else 
				{
					fabric.util.enlivenObjects(oldAnnotations, function(group)
						{
						 origRenderOnAddRemove = editor.scope.fabricModel.canvas.renderOnAddRemove
						 editor.scope.fabricModel.canvas.renderOnAddRemove = false
						 $.each(group, function(index, item) {
						 	 //item.junk = "21412124";
							 annotation.fabricObjects[index] = item;
							 item.annotationid = annotation.id;
						     editor.scope.fabricModel.canvas.addInternal(item);
						 });
						 editor.scope.fabricModel.canvas.renderOnAddRemove = origRenderOnAddRemove;
						});
					// annotation.fromSocket = false;
				
				}

				// below code might be needed for recreating objects from JSON data
				// currently the whole objects are saved rather than parsed

				
			});
			this.scope.fabricModel.canvas.renderAll();
			jAngular.render("#annotationtab");
			// this method also needs to clear the canvas and comments and update from the persisted data
			// DONE: Clear canvas state, refresh with AnnotatedAsset data
			// DONE: Clear comments, refresh with AnnotatedAsset data
			// TODO: above two things with server persisted data instead of client for when page is refreshed


		}
		,
		createNewAnnotation: function(annotatedAsset)
		{
			var annot = new Annotation();
			annot.user = this.userData.userid;
			annot.assetid = annotatedAsset.assetData.id;
			annot.id = Math.floor(Math.random() * 100000000).toString();
			annot.indexCount = annotatedAsset.nextIndex();
			annot.date = new Date();
			return annot;
		}
		,
		fabricObjectAdded: function(fabricObject)
		{
			//if( this.currentAnnotatedAsset.currentAnnotation == null )
			//{
			this.currentAnnotatedAsset.currentAnnotation = this.createNewAnnotation(this.currentAnnotatedAsset);
				
			this.currentAnnotatedAsset.pushAnnotation( this.currentAnnotatedAsset.currentAnnotation );
			
			var currentAnnotation = this.currentAnnotatedAsset.currentAnnotation;
			// need to make sure the object is not selectable by default
			// we have mouse:move events which may be the best bet for toggling
			// can also toggle it off on selection:cleared? maybe that is too expensive
			// looks like easiest way to implement move tool is a loop through the existing objects on selectTool
			fabricObject.selectable = false;
			// make object immobile ?
			fabricObject.evented = false;
			currentAnnotation.pushFabricObject(fabricObject);
			
			this.scope.add("annotations",this.currentAnnotatedAsset.annotations);
			
			jAngular.render("#annotationlist");
			return currentAnnotation;
		},
		notifyAnnotationAdded: function(currentAnnotation)
		{
			//Update network?
			var command = SocketCommand("annotation.added");
			command.annotationdata = currentAnnotation;
			this.sendSocketCommand( command );
		},
		notifyAnnotationModified: function(currentAnnotation)
		{
			//Update network?
			var command = SocketCommand("annotation.modified");
			command.annotationdata = currentAnnotation;
			this.sendSocketCommand( command );
		}
/*		,
		addAnnotation: function(inAnnotation)
		{
			// update scope.annotations and currentAnnotationAsset
			// might not be appropriate for all calls when the asset
			// is not in scope, but it's here for now
			this.currentAnnotatedAsset.annotations.push(inAnnotation);
			scope.annotations = this.currentAnnotatedAsset.annotations;
		}
*/		
		,
		modifyAnnotation: function(modifiedAnnotation)
		{
			var modasset = this.getAnnotatedAsset(modifiedAnnotation.assetid);
			var foundAnnotationIndex = modasset.getAnnotationIndexById(modifiedAnnotation.id);
			modasset.annotations[foundAnnotationIndex] = modifiedAnnotation;
			
			//For now, render it all. later select parts
			this.setCurrentAnnotatedAsset(this.currentAnnotatedAsset);
			
		}
		,
		findAssetData: function(inAssetId)
		{
			var outAsset = null;
			$.each(this.scope.assets,function(index,asset)
			{
				if( asset.id == inAssetId )
				{
					outAsset = asset;
				}
			});
			return outAsset;
		}
		,
		getAnnotatedAsset: function(inAssetId) 
		{
			var outAsset = null;
			$.each(this.scope.annotationEditor.annotatedAssets,function(index,asset)
			{
				if( asset.assetData.id == inAssetId )
				{
					outAsset = asset;
					return true;
				}
			});
			return outAsset;
		}
		,
		switchToAsset: function(inAssetId) {
			// if we have an annotatedAsset object already, we should use that
			// otherwise we have to make a new one.
			// make a new one for now since no data persists currently
			var toAsset = this.getAnnotatedAsset(inAssetId);
			console.log( "trying to get ", inAssetId);
			console.log( "got ", toAsset);
			this.setCurrentAnnotatedAsset(toAsset);
			//jAngular.render("#annotationtab");
		}
		,
		connect : function()
		{
			//socket initialization
			if (window.WebSocket) {
				socket = WebSocket;
			} else if (window.MozWebSocket) {
				socket = MozWebSocket;
			} else {
				console.log("We're screwed");
				socket = null;
			}
		
			if (socket)
			{
				var scope = this.scope;
				var editor = this;
				base_destination = "ws://localhost:8080/entermedia/services/websocket/echoProgrammatic";
				final_destination = "" + base_destination + "?catalogid=" + scope.catalogid + "&collectionid=" + scope.collectionid;
				connection = new socket(final_destination);
				connection.onopen = function(e)
				{
					//console.log('Opened a connection!');
					//console.log(e);
					
					var command = SocketCommand("list");
					command.assetid = editor.currentAnnotatedAsset.assetData.id;
					connection.sendCommand(command);    
				};
				connection.onclose = function(e)
				{
					console.log('Closed a connection!');
					console.log(e);
				};
				connection.onerror = function(e)
				{
					console.log('Connection error!');
					console.log(e);
				};
				connection.sendCommand = function(command)
				{
					this.send( JSON.stringify(command));
				};
				connection.onmessage = function(e)
				{
				 	var received_msg = e.data;
					var command = JSON.parse(received_msg);
					
					if( command.command == "annotation.added" )
					{
						//Show it on the screen
						var data = command.annotationdata;
						console.log("Got message" + data);
						var anonasset = editor.getAnnotatedAsset( data.assetid );

						// we only want to push the annotation if it doesn't already exist
						
						var newannotation = new Annotation(data);
						console.log(newannotation);
						// newannotation.fromSocket = true;
						if (anonasset.getAnnotationById(newannotation.id) == null)
						{
							anonasset.pushAnnotation( newannotation );
							
							editor.currentAnnotatedAsset.currentAnnotation = newannotation;

							editor.switchToAsset(editor.currentAnnotatedAsset.assetData.id);
						}
						else
						{
							// this should never happen
							console.log("Already had annotation" + newannotation.id);
						}

					} 
					else if (command.command == "annotation.modified")
					{
						/*
						check if client has annotation (getAnnotationById)
						if they don't have it, this is bad, so log it for now
						if they do have it we'll need to enliven the command data
						and replace the existing annotation, then re-render
						currently we re-render by (switchToAsset)
						*/
						console.log("annotation.modified: ", command);
						var modifiedAnnotation = new Annotation(command.annotationdata);
						editor.modifyAnnotation(modifiedAnnotation);
						if( editor.currentAnnotatedAsset.assetData.id == modifiedAnnotation.assetid )
						{
							editor.switchToAsset(editor.currentAnnotatedAsset.assetData.id);
						}	
					}
				};
			this.connection = connection; // connection lives on the editor. more explicit
			}
			
		}
		,
		sendSocketCommand: function( inSocketCommand )
		{
			// send out info here
			// too many layers?
			this.connection.sendCommand( inSocketCommand );
		}
	}
	return out;
}   

var SocketCommand = function(inCommand) {
	var out = {
		command : inCommand,
		assetid: null,
		data: null
	};
	return out; 
}

var AnnotatedAsset = function() {   
	var out = {
		assetData: null,
		annotations : [],
		currentAnnotation: null,
		annotationIndex: 1,
		pushAnnotation: function( inAnnotation )
		{
			this.annotations.push( inAnnotation );
		},
		nextIndex: function() {
			return this.annotationIndex++;
		},
		getAnnotationById: function(inAnnotationId) {
			var outAnnotation = null;
			$.each(this.annotations, function(index, annotation)
			{
				if (annotation.id === inAnnotationId)
				{
					outAnnotation = annotation;
					return true;
				}
			});
			return outAnnotation;
		}
		,
		getAnnotationIndexById: function(inAnnotationId)
		{
			var outAnnotationIndex = -1;
			$.each(this.annotations, function(index, annotation)
			{
				if (annotation.id === inAnnotationId)
				{
					outAnnotationIndex = index;
					return true;
				}
			});
			return outAnnotationIndex;
		}
		,
		removeAnnotation: function(annotationid)
		{
			var annotationToRemove = this.getAnnotationById(annotationid);
			this.annotations = _.without(this.annotations, annotationToRemove);
			
		}
	};
	return out; 
}

var Annotation = function(inAnnotationData) {   
	var out = {
		id: null,
		indexCount: null,
		user: null,
		comment: "",
		date : [],
		fabricObjects: [], 
		assetid: null,
		fromSocket: false
	};
	if (inAnnotationData)
	{
		var inAnnotation = arguments[0];
		$.each(Object.keys(out), function(index, key)
		{
			out[key] = inAnnotationData[key];
		});
	}
		out.getUserName = function()
		{
			var userOut = "demouser";
			if (this.user !== null)
			{
				userOut = this.user;
			}
			return userOut;
		};
		out.pushFabricObject = function( inObject )
		{
			this.fabricObjects.push( inObject );
		};
		out.isLive = function() 
		{
			if (this.fabricObjects.length > 0 && this.fabricObjects[0].canvas)
			{
				return true;
			}
			return false;
		};
		out.hasObject = function(inObj)
		{
			return $.inArray(inObj, this.fabricObjects) !== -1;
		};
	return out; 
}


var loadFabricModel = function(scope)
{
	var fabricModel = new FabricModel(scope);
	scope.annotationEditor.fabricModel = fabricModel;
	scope.add("fabricModel",fabricModel);

}