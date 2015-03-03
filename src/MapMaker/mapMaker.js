window.addEventListener("load", function()
{
	var SC=µ.getModule("shortcut")({
		download:"download",
		find:"find",
		Board:"Board",
		kCon:"Controller.Keyboard",
		padCon:"Controller.Gamepad",
		Layer:"Layer",
		ControllerManager:"GUI.ControllerManager",
		MapMaker:"MapMaker",
		gIn:"getInputValues",
		Idb:"IDBConn"
	});
	
	var board=new SC.Board(document.querySelector("#bordContainer"));
	var kCon=new SC.kCon({
		"buttons": {
			" ": "0",
			"Enter": "1",
			
			//chrome
			"32": "0",
			"13": "1",
		},
		"buttonAxis": {
			"w": "1",
			"d": "0",
			"s": "-1",
			"a": "-0",
			"Up": "3",
			"Right": "2",
			"Down": "-3",
			"Left": "-2",
			
			//chrome keyCode
			"37": "-2",
			"38": "3",
			"39": "2",
			"40": "-3",
			"65": "-0",
			"68": "0",
			"83": "-1",
			"87": "1"
		}
	});
	board.addController(kCon);
	var controllerLayer=new SC.Layer();
	controllerLayer.domElement.classList.add("overlay");
	var manager=new SC.ControllerManager({
		styleClass:["panel","center"],
		buttons:2,
		analogSticks:2,
		mappings:[kCon.getMapping()],
		dbConn:new SC.Idb("mapMaker")
	});
	controllerLayer.add(manager);
	var mapMaker=new SC.MapMaker({
        board:board,
        cursorImage:"../resources/images/cursor_target.svg",
        images:[
            "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",//empty
            "../resources/images/erde.svg",
            "../resources/images/gras.svg",
            "../resources/images/holz.svg",
            "../resources/images/stein-hex.svg",
            "../resources/images/stein-welle.svg",
            "../resources/images/ziegel.svg"
        ],
        imageLayer:{
        	getTriggerValueHTML:function(image)
        	{
        		var actionType=image.trigger.value&&image.trigger.value[0]&&image.trigger.value[0].type||"";
        		return 'actions</td><td colspan="100%"><table><tr><td>Type</td><td><select name="type" data-action="actionType">'+
        			["","ABORT_QUEST","RESOLVE_QUEST","ACTIVATE_QUEST","CHANGE_MAP","SHOW_DIALOG","OPEN_GAMEMENU","EXECUTE"].map(function(type)
        			{
        				return '<option '+(type===actionType?'checked="checked" ':'')+ 'value="'+type+'">'+type+'</option>';
        			}).join("")+
        		'</select></label></td></tr></table>';
        		
        	},
        	getTriggerValue:function(tr)
        	{
        		return [SC.gIn(tr.querySelectorAll("[name]"))];
        	},
        	onAction:function(image,action,event)
        	{
        		switch (action)
        		{
        			case "actionType":
        				var tbody=event.target;
        				while(tbody&&tbody.tagName!=="TBODY")
        				{
        					tbody=tbody.parentNode;
        				}
        				if(tbody)
        				{
        					while(tbody.children.length>1)
        					{
        						tbody.lastElementChild.remove();
        					}
        					var add=[];
        					switch(event.target.value)
        					{
								case "ABORT_QUEST":
								case "RESOLVE_QUEST":
								case "ACTIVATE_QUEST":
									add.push('<td>Quest name</td><td><input type="text" name="questName"></td>');
									break;
								case "CHANGE_MAP":
									add.push('<td>Map name</td><td><input type="text" name="mapName"></td>');
									add.push('<td>position</td><td>X <input type="number" data-path="position" name="x"></td><td>Y <input type="number" data-path="position" name="y"></td>');
									break;
								case "SHOW_DIALOG":
									add.push('<td>Dialog name</td><td><input type="text" name="dialogName"></td>');
									break;
								case "OPEN_GAMEMENU":
									add.push('<td>Enable save</td><td><input type="checkbox" name="enableSave"></td>');
									break;
								case "EXECUTE":
									break;
        					}
        					for(var i=0;i<add.length;i++)
        					{
        						var tr=document.createElement("tr");
        						tr.innerHTML=add[i];
        						tbody.appendChild(tr);
        					}
        				}
        				else
        				{
        					µ.debug(new TypeError("tbody not found"),µ.debug.LEVEL.ERROR);
        				}
        				break;
        		}
        	}
        }
    });
	
	var actions={
		save:function()
		{
			SC.download(JSON.stringify(mapMaker.map),"map.json","application/json");
			board.focus();
		},
		load:function(e)
		{
			/* TODO
			e.target.nextElementSibling.click();
			/*/
			alert("noch nicht verfügbar");
			//*/
			board.focus();
		},
		toggleControllerManager:function()
        {
			if(board.hasLayer(controllerLayer))
			{
				board.removeLayer(controllerLayer);
			}
			else
			{
	            board.addLayer(controllerLayer);
	            manager.update();
			}
        }
	};
	
	window.addEventListener("click", function(e)
	{
		//execute actions
		var action=e.target.dataset.action;
		if(action)
		{
			if(!actions[action])
			{
				alert("action "+action+" is undefined");
			}
			else
			{
				actions[action](e);
			}
		}
	}, false);
	
	document.getElementById("loadInput").addEventListener("change", function(e)
	{
		var reader=new FileReader();
		reader.onload=function()
		{
			mapMaker.fromJSON(JSON.parse(reader.result));
		};
		reader.readAsText(e.target.files[0]);
		board.focus();
	}, false);

	board.focus();
}, false);