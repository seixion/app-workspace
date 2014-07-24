
var AnnotationEditor = function() {
	
	var out = {
		currentAnnotatedAsset : null,
		fabric: null,
		scope : null,
		loadSelectors : function()
		{
			//TODO: Search for all ng-click?
			$("div.annotations-carousel a img, ul.annotations-toolbar > li [ng-click]").livequery('click', function() 
			{
				var theimg = jQuery(this);
				var code = theimg.attr("ng-click");
				eval(code);
			});
		},
		loadModels : function()
		{
			var scope = this.scope;
			$.getScript(scope.apphome + "/components/annotations/ajax/FabricModel.js");
			
			fabric = scope.fabric;

			// load asset data
			jQuery.ajax({
				type: "GET",
				url: "" + scope.apphome + "/components/annotations/json/viewassets.json?id=" + scope.collectionid,
				async: false,
				error: function(data, status, err) {
					console.log('from error:', data);
				},
				success: function(data) {
					console.log('from success:', data);
					scope.add('assets', data);
					if( data.length > 0 )
					{
						scope.annotationEditor.currentAnnotatedAsset = createAnnotatedAsset(data[0]);
					}
				},
				failure: function(errMsg) {
					alert(errMsg);
				}
			});
		},
		createAnnotatedAsset = function(assetData)
		{
			var aa = new AnnotatedAsset();
			aa.assetData = assetData;
			
			//TODO: Get Annotations
			
			return aa;
		},
		findAssetData = function(inAssetId)
		{
			$.each(this.scope.assets,function(index,asset)
			{
				if( asset.id == inAssetId )
				{
					return asset;
				}
			}
			return null;
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
				base_destination = "ws://localhost:8080/entermedia/services/websocket/echoProgrammatic";
				final_destination = "" + base_destination + "?catalogid=" + scope.catalogid + "&collectionid=" + scope.collectionid;
				connection = new socket(final_destination);
				connection.onopen = function(e) {
					console.log('Opened a connection!');
					console.log(e);
				};
				connection.onclose = function(e) {
					console.log('Closed a connection!');
					console.log(e);
				};
				connection.onerror = function(e) {
					console.log('Connection error!');
					console.log(e);
				};
				connection.sendCommand = function(command)
				{
					connection.send( JSSON.stringify(command));
				};
				scope.add('connection', connection);
			}
			var command = SocketCommand("list");
			command.assetid( currentAnnotatedAsset.assetData.id );
			connection.sendCommand(command);
			
			//load user data
			/*
			$.getJSON( '/entermedia/services/json/users/status.json', function(data) {
				console.log('from user auth:', data);
				scope.add('currentUser', 	jAngular.init(scope);
				data);
			});
			*/
		}
		return out;
	}
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
		scope: null,
		annotations : null
	};
	return out;	
}
