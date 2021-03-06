(function(µ,SMOD,GMOD){
	/**
	 * Depends on	: Morgas DB 
	 * Uses			: 
	 *
	 * DB.Connector for simple Javascript object
	 *
	 */
	var DBC=GMOD("DBConn"),
	LOGGER=GMOD("debug"),
	SC=GMOD("shortcut")({
		det:"Detached",
		it:"iterate",
		eq:"equals",
		find:"find",
		
		DBObj:"DBObj",
		DBFriend:"DBFriend"
	});
	
	var ICON=DBC.IndexedDBConnector=µ.Class(DBC,{

		init:function(dbName)
		{
			this.mega();
			this.name=dbName;

			SC.det.detacheAll(this,["_open"]);
		},
		
		save:function(signal,objs)
		{
			objs=[].concat(objs);
			var sortedObjs=ICON.sortObjs(objs);
			var classNames=Object.keys(sortedObjs);
			this._open(classNames).then(function(db)
			{
				var transactions=SC.it(sortedObjs,SC.det.detache(function(tSignal,objects,objectType)
				{
					var trans=db.transaction(objectType,"readwrite");
					trans.onerror=function(event)
					{
						LOGGER.error(event);
						tSignal.complete(event);
					};
					trans.oncomplete=function(event)
					{
						LOGGER.info(event);
						tSignal.complete();
					};
					
					var store = trans.objectStore(objectType);
					SC.it(objects,function(object,i)
					{
						var obj=object.toJSON(),
						method="put";
						if(obj.ID===undefined)
						{
							delete obj.ID;
							method="add";
						}
						var req=store[method](obj);
						req.onerror=LOGGER.error;
						req.onsuccess=function(event)
						{
							LOGGER.debug(event);
							object.setID&&object.setID(req.result);//if (!(object instanceof DBFRIEND)) {object.setID(req.result)} 
						}
					});
				}),false,true);
				db.close();
				signal.complete(new SC.det(transactions));
				this.complete();
			},signal.error);
		},
		load:function(signal,objClass,pattern)
		{
			this._open().then(function(db)
			{
				if(!db.objectStoreNames.contains(objClass.prototype.objectType))
				{
					db.close();
					signal.complete([]);
				}
				else
				{
					var trans=db.transaction(objClass.prototype.objectType,"readonly"),
					rtn=[];
					trans.onerror=function(event)
					{
						LOGGER.error(event);
						db.close();
						signal.error(event);
					};
					trans.oncomplete=function()
					{
						db.close();
						signal.complete(rtn);
					};

					var store = trans.objectStore(objClass.prototype.objectType);
					if(typeof pattern.ID==="number"|| Array.isArray(pattern.ID))
					{
						var reqs=SC.it([].concat(pattern.ID),function(ID)
						{
							var req=store.get(ID);
							req.onerror=function(event)
							{
								LOGGER.error(event);
							};
							req.onsuccess=function(event)
							{
								LOGGER.debug(event);
								if(SC.eq(req.result,pattern))
								{
									var inst=new objClass();
									inst.fromJSON(req.result);
									rtn.push(inst);
								}
							}
						});
					}
					else
					{
						var req=store.openCursor();
						req.onerror=function(event)
						{
							LOGGER.error(event);
							db.close();
							signal.error(event);
						};
						req.onsuccess=function(event)
						{
							if(req.result)
							{
								if(SC.eq(req.result.value,pattern))
								{
									var inst=new objClass();
									inst.fromJSON(req.result.value);
									rtn.push(inst);
								}
								req.result["continue"]();
							}
						}
					}
				}
				this.complete();
			},signal.error);
		},
		"delete":function(signal,objClass,toDelete)
		{
			var _self=this,
			objectType=objClass.prototype.objectType,
			collectingIDs=null;
			if(typeof toDelete==="number"||toDelete instanceof SC.DBObj||toDelete instanceof SC.DBFriend||Array.isArray(toDelete))
			{
				var ids=DBC.getDeletePattern(objClass,toDelete).ID;
				collectingIDs=SC.det.complete(ids);
			}
			else
			{
				collectingIDs=this._open().then(function(db)
				{
					var _collectingSelf=this,
					ids=[],
					trans=db.transaction(objectType,"readonly");
					trans.onerror=function(event)
					{
						LOGGER.error(event);
						db.close();
						signal.error(event);
						_collectingSelf.error(event);
					};
					trans.oncomplete=function()
					{
						db.close();
						_collectingSelf.complete(ids);
					};

					var store = trans.objectStore(objectType);
					var req=store.openCursor();
					req.onerror=function(event)
					{
						LOGGER.error(event);
						db.close();
						signal.error(event);
						_collectingSelf.error(event);
					};
					req.onsuccess=function(event)
					{
						if(req.result)
						{
							if(SC.eq(req.result.value,toDelete))
							{
								ids.push(req.result.key);
							}
							req.result["continue"]();
						}
					}
					
				},signal.error)
			}
			collectingIDs.then(function(ids)
			{
				if(ids.length>0)
				{
					return _self._open().then(function(db)
					{
						var trans=db.transaction(objClass.prototype.objectType,"readwrite");
						trans.onerror=function(event)
						{
							LOGGER.error(event);
							db.close();
							signal.error(event);
						};
						var store = trans.objectStore(objectType);
						
						var reqs=SC.it(ids,SC.det.detache(function(rSignal,ID)
						{
							var req=store["delete"](ID);
							req.onerror=function(event)
							{
								LOGGER.error(event);
								rSignal.complete(ID);
							};
							req.onsuccess=function(event)
							{
								LOGGER.debug(event);
								rSignal.complete();
							}
						}));
						return new SC.det(reqs).then(function()
						{
							db.close();
							signal.complete(Array.slice(arguments));
							this.complete();
						},LOGGER.error);
					});
				}
				else
				{
					signal.complete(false);
					this.complete();
				}
			},function(event){
				db.close();
				signal.error(event,0);
				this.complete();
			});
		},
		destroy:function()
		{
			
		},
		_open:function(signal,classNames)
		{
			var _self=this;
			var req=indexedDB.open(this.name);
			req.onerror=function(event){
				signal.error(event,0);
			};
			req.onsuccess=function()
			{
				var toCreate=[],
				db=req.result,
				version=req.result.version;
				for(var i=0;classNames&&i<classNames.length;i++)
				{
					if(!db.objectStoreNames.contains(classNames[i]))
					{
						toCreate.push(classNames[i]);
					}
				}
				if(toCreate.length===0)
				{
					signal.complete(db);
				}
				else
				{
					var req2=indexedDB.open(_self.name,version+1);
					req2.onerror=function(event){
						signal.error(event,0);
					};
					req2.onupgradeneeded=function()
					{
						for(var i=0;i<toCreate.length;i++)
						{
							req2.result.createObjectStore(toCreate[i],{keyPath:"ID",autoIncrement:true});
						}
					};
					req2.onsuccess=function()
					{
						_self.version=req2.result.version;
						signal.complete(req2.result);
					};
					db.close();
				}
			}
		}
	});
	
	ICON.sortObjs=function(objs)
	{
		var rtn={};
		for(var i=0;i<objs.length;i++)
		{
			var obj=objs[i],
			objType=obj.objectType;
			
			if(rtn[objType]===undefined)
			{
				rtn[objType]=[];
			}
			rtn[objType].push(obj);
		}
		return rtn;
	};
	SMOD("IndexedDBConnector",ICON);	
	SMOD("IDBConn",ICON);
})(Morgas,Morgas.setModule,Morgas.getModule);