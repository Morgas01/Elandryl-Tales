//Morgas/src/Morgas.js
﻿(function MorgasInit(oldµ){
	Morgas={version:"0.3"};
	µ=Morgas;
	/**
	 * revert "µ" to its old value
	 */
	µ.revert=function()
	{
		return µ=oldµ;
	};
	
	µ.constantFunctions={
			"ndef":function(){return undefined},
			"nul":function(){return null},
			"f":function(){return false},
			"t":function(){return true;},
			"zero":function(){return 0;},
			"boolean":function(val){return !!val}
		};

	/** Modules
	 *	Every class and utility function should define a Module, which can
	 *	be replaced by any other function or class that has similar structure.
	 *
	 *	However they should NEVER only define a Module! It should only be used to
	 *	shortcut paths and ensure flexibility.
	 */
	(function(){
		var modules={};
		µ.setModule=function(key,value)
		{
			if(modules[key])
			{
				µ.debug("module "+key+" is overwritten",2);
			}
			return modules[key]=value;
		};
		µ.hasModule=function(key)
		{
			return !!modules[key];
		};
		µ.getModule=function(key)
		{
			if(!modules[key])
				µ.debug("module "+key+" is not defined\n use µ.hasModule to check for existence",0);
			return modules[key];
		};
	})();
	var SMOD=µ.setModule,GMOD=µ.getModule,HMOD=µ.hasModule;
	
	/**
	 * Debug message if it's verbose is >= the current verbose.
	 * If a message is a function its return value will be logged.
	 * 
	 * Set µ.debug.verbose to any number >= 0 to control wich events should be logged.
	 * Set it to False to turn it off.
	 * 
	 * Set µ.debug.out to any function you like to log the events and errors.
	 */
	µ.debug=function(msg,verbose)
	{
		if(!verbose)
		{
			verbose=0;
		}
		if(µ.debug.verbose!==false&&µ.debug.verbose>=verbose)
		{
			if(typeof msg == "function")
				msg=msg();
				
			µ.debug.out(msg,verbose);
		}
	};
	SMOD("debug",µ.debug);
	
	µ.debug.LEVEL={
		OFF:false,
		ERROR:0,
		WARNING:1,
		INFO:2,
		DEBUG:3
	};
	µ.debug.verbose=µ.debug.LEVEL.WARNING;
	µ.getDebug=function(){return µ.debug.verbose};
	µ.setDebug=function(debug){µ.debug.verbose=debug};
	µ.debug.out=function(msg,verbose)
	{
		switch(verbose)
		{
			case 0:
				console.error(msg);
				break;
			case 1:
				console.warn(msg);
				break;
			case 2:
				console.info(msg);
				break;
			case 3:
			default:
				console.log(msg);
		}
	};
	µ.debug.error=function(msg){µ.debug(msg,µ.debug.LEVEL.ERROR)};
	µ.debug.warning=function(msg){µ.debug(msg,µ.debug.LEVEL.WARNING)};
	µ.debug.info=function(msg){µ.debug(msg,µ.debug.LEVEL.INFO)};
	µ.debug.debug=function(msg){µ.debug(msg,µ.debug.LEVEL.DEBUG)};
	
	/** shortcut
	 * creates an object that will evaluate its values defined in {map} on its first call.
	 * when {context} is provided and {map.value} is not a function it will treated as a path from {context}
	 *
	 * uses goPath
	 *
	 * map:	{key:("moduleOrPath",function)}
	 * context: any (optional)
	 * target: {} (optional)
	 *
	 * returns {key:value}
	 */
	µ.shortcut=function(map,target,context,dynamic)
	{
		if(!target)
		{
			target={};
		}
		for(var m in map){(function(path,key)
		{
			var value=undefined;
			Object.defineProperty(target,key,{
				configurable:false,
				enumerable:true,
				get:function()
				{
					if(value==null||dynamic)
					{
						if(typeof path=="function")
							value=path(context);
						else if(context&&HMOD("goPath"))
							value=GMOD("goPath")(context,path);
						else if (HMOD(path))
							value=GMOD(path);
						else
							GMOD("debug")("shortcut: could not evaluate "+path)
					}
					return value;
				}
			});
		})(map[m],m)}
		return target;
	};
	SMOD("shortcut",µ.shortcut);
	
	/** Class function
	 * Designed to create JavaScript Classes
	 * 
	 *  It does the inheritance, checks for arguments,
	 *  adds the core patch to it and calls the init() method.
	 *  
	 *  
	 *  To create a class do this:
	 *  
	 *  myClass=µ.Class(mySuperClass,myPrototype)
	 *  
	 *  OR
	 *  
	 *  myClass=µ.Class(mySuperClass)
	 *  myClass.protoype.init=function()
	 *  {
	 *  	//call constructor of superclass
	 *  	mySuperClass.prototype.init.call(this,arg1,arg2...);
	 *  	//or this.mega();
	 *  
	 *  	//your constructor
	 *  }
	 *  
	 *  You also can derive this classes with "ordinary" classes like this:
	 *  
	 *  myClass=µ.Class(mySuperClass,myPrototype)
	 *  mySubClass=function()
	 *  {
	 *  	//whatever you like
	 *  }
	 *  mySubClass.protoytpe=new myClass(µ._EXTEND);
	 *  mySubClass.prototype.constructor=mySubClass;
	 *  
	 *  @param	superClass	(optional)	default: µ.BaseClass
	 *  @param	prototype	(optional)
	 */
	var CLASS=µ.Class=function ClassFunc(superClass,prot)
	{
		var newClass = function ClassConstructor()
		{
			this.init.apply(this,arguments);
			if(HMOD("Listeners")&&this instanceof GMOD("Listeners"))
			{
				this.setState(".created");
			}
		};

		if(typeof superClass !== "function")
		{
			prot=superClass;
			superClass=BASE;
		}
		if(superClass) //only undefined when creating BaseClass
		{
			newClass.prototype=Object.create(superClass.prototype);
			newClass.prototype.constructor=newClass;
		}
		
		for(var i in prot)
		{
			newClass.prototype[i]=prot[i];
		}
		return newClass;
	};
	SMOD("Class",CLASS);
	
	/** Base Class
	 *	allows to check of being a class ( foo instanceof µ.BaseClass )
	 *	provides mega and basic destroy method
	 */
	var BASE=µ.BaseClass=CLASS(
	{
		init:function baseInit(){},
		mega:function mega()
		{
			var isFirstCall=false,rtn;
			if(this.__magaKey===undefined)
			{
				isFirstCall=true;
				searchPrototype:for(var prot=Object.getPrototypeOf(this);prot!==null;prot=Object.getPrototypeOf(prot))
				{
					for(var i=0,names=Object.getOwnPropertyNames(prot);i<names.length;i++)
					{
						if(this.mega.caller===prot[names[i]])
						{
							Object.defineProperties(this,{
								__megaKey:{configurable:true,writable:true,value:names[i]},
								__megaProt:{configurable:true,writable:true,value:prot}
							});
							break searchPrototype;
						}
					}
				}
				if(this.__megaKey===undefined)
				{
					µ.debug("caller was not a member",µ.debug.LEVEL.ERROR);
					return;
				}
			}
			while((this.__megaProt=Object.getPrototypeOf(this.__megaProt))!==null&&!this.__megaProt.hasOwnProperty(this.__megaKey));
			var error=null;
			try
			{
				if(this.__megaProt===null)
				{
					µ.debug("no mega found for "+this.__megaKey,µ.debug.LEVEL.ERROR);
				}
				else
				{
					rtn=this.__megaProt[this.__megaKey].apply(this,arguments);
				}
			}
			catch (e){error=e;}
			if(isFirstCall)
			{
				delete this.__megaKey;
				delete this.__megaProt;
				if(error)µ.debug(error,µ.debug.LEVEL.ERROR);
			}
			if(error) throw error;
			return rtn;
		},
		destroy:function()
		{
			if(this.patches)for(var p in this.patches)this.patches[p].destroy();
			for(var i in this)
			{
				if(this[i]&&typeof this[i].destroy==="function")this[i].destroy();
				delete this[i];
			}
			this.destroy=undefined;//overwrite prototype method
		}
	});
	SMOD("Base",BASE);
})(this.µ);

//TalePlay.Board.js
(function(µ,SMOD,GMOD,HMOD){

    var TALE=this.TalePlay=this.TalePlay||{};
    
	var SC=GMOD("shortcut")({
		rs:"rescope",
        node:"NodePatch"
	});
	
	var CTRL_EVENTS="analogStickChanged buttonChanged";
	var BOARD=TALE.Board=µ.Class({
		init:function(container)
		{
			this.controllers=[];
			this.nodePatch=new SC.node(this,{
				children:"layers",
				addChild:"addLayer",
				removeChild:"removeLayer",
				hasChild:"hasLayer"
			});
			//this.layers=[];
			
			this.disabled=false;
			this.playerDisabled={};
			

			SC.rs.all(this,["focus"]);
			
			this.domElement=document.createElement("div");
			this.domElement.classList.add("Board");
			
			this.keyTrigger=document.createElement("textarea");
			this.domElement.appendChild(this.keyTrigger);
			this.keyTrigger.classList.add("keyTrigger");
			this.keyTrigger.style.position="absolute";
			this.keyTrigger.style.zIndex="-1";
			this.keyTrigger.style.height=this.keyTrigger.style.width="0";
			this.keyTrigger.style.resize="none";
			
			this.domElement.addEventListener("click", this.focus, false);
			
			if(container)
			{
				container.appendChild(this.domElement);
			}
		},
		setDisabled:function()
		{
			//TODO
		},
		setPlayerDisabled:function()
		{
			//TODO
		},
		addController:function(controller,player)
		{
			this.removeController(controller);
			this.controllers.push({controller:controller,player:player||1});
			controller.addListener(CTRL_EVENTS,this,"_ctrlCallback");
			//TODO no key events on a div
			/**/
			if(HMOD("Controller.Keyboard")&&controller instanceof GMOD("Controller.Keyboard"))
			{
				controller.setDomElement(this.keyTrigger);
			}
			//*/
		},
		removeController:function(controller)
		{
			for(var i=this.controllers.length-1;i>=0;i--)
			{
				if(this.controllers[i].controller===controller)
				{
					controller.removeListener(CTRL_EVENTS,this,"_ctrlCallback");
					if(HMOD("Controller.Keyboard")&&controller instanceof GMOD("Controller.Keyboard"))
					{
						controller.setDomElement();
					}
					this.controllers.splice(i,1);
					return true;
				}
			}
			return false;
		},
		_ctrlCallback:function(event)
		{
			if(!this.disabled&&this.layers.length>0)
			{
				var args=Array.prototype.slice.call(arguments);
				event.player=null;
				for(var i=this.controllers.length-1;i>=0;i--)
				{
					if(this.controllers[i].controller===event.source)
					{
						event.player=i;
						break;
					}
				}
				if(!this.playerDisabled[event.player])
				{
					this.layers[this.layers.length-1].onController(event);
				}
			}
		},
		addLayer:function(layer)
		{
			if(HMOD("Layer")&&layer instanceof GMOD("Layer")&&this.nodePatch.addChild(layer))
			{
				this.domElement.appendChild(layer.domElement);
				return true;
			}
			return false;
		},
		removeLayer:function(layer)
		{
			if(this.nodePatch.removeChild(layer))
			{
				layer.domElement.remove();
				return true;
			}
			return false;
		},
		focus:function(event)
		{
			if(!event||(event.target.tagName!=="INPUT"&&event.target.tagName!=="SELECT"&&event.target.tagName!=="TEXTAREA"))
			{
				this.keyTrigger.focus();
			}
		}
	});
	SMOD("Board",BOARD);
})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule);
//Morgas/src/Morgas.Listeners.js
(function(µ,SMOD,GMOD){
	
	var BASECLASS=GMOD("Base");
	
	/**Listener Class
	 * Holds Arrays of functions to fire or fire once when "fire" is called
	 * When fired and a listening function returns false firing is aborted
	 * When added a type can be passed:
	 * 		"first" function gets prepended
	 * 		"normal" function gets appended (default)
	 * 		"last" function gets appended
	 * 		"once" function is removed after call 
	 * 			(will only be called when previous listeners haven't abort firing.
	 * 			cant abort other "once" listening functions)
	 *  
	 * Can be disabled
	*/
	var LISTENER=µ.Listener=µ.Class(BASECLASS,
	{
		init:function ListenerInit()
		{
			this.listeners=new Map(); //TODO use WeakMap when its capable of iterations
			this.disabled=false;
		},
		addListener:function addListener(fn,scope,type)
		{
            var fnType=typeof fn;
			if(fnType==="function"||fnType==="string")
			{
                scope=scope||this;
                var entry=null;
                if(this.listeners.has(scope))
                {
                    entry=this.listeners.get(scope);
                    if(entry.first.has(fn)||entry.normal.has(fn)||entry.last.has(fn)||entry.once.has(fn))
                    {
                        return null;//already listens
                    }
                }
                else
                {
                    entry={first:new Set(),normal:new Set(),last:new Set(),once:new Set()};
                    this.listeners.set(scope,entry);
                }
				if(type)
				{
					type=type.toLowerCase();
				}
				switch(type)
				{
					case "first":
						entry.first.add(fn);
						break;
					case "normal":
                    default:
                        entry.normal.add(fn);
                        break;
					case "last":
						entry.last.add(fn);
						break;
					case "once":
						entry.once.add(fn);
                        break;
				}
				return fn;
			}
			return null;//no function
		},
        addListeners:function addListeners(fns,scope,type)
        {
            fns=[].concat(fns);
            var rtn=[];
            for(var i=0;i<fns.length;i++)
            {
                rtn.push(this.addListener(fns[i],scope,type));
            }
            return rtn;
        },
		removeListener:function removeListener(fn,scope)
		{
            //TODO remove fn from all scopes
			var timesFound=0;
            var entry=this.listeners.get(scope);
            if(entry)
            {
                if(typeof fn=="string"&&fn.toLowerCase()=="all")
                {
                    timesFound=entry.first.size+entry.normal.size+entry.last.size+entry.once.size;
                    this.listeners.delete(scope);
                }
                else
                {
                    if(entry.first.delete(fn))
                    {
                        timesFound++;
                    }
                    if(entry.normal.delete(fn))
                    {
                        timesFound++;
                    }
                    if(entry.last.delete(fn))
                    {
                        timesFound++;
                    }
                    if(entry.once.delete(fn))
                    {
                        timesFound++;
                    }
                    if(entry.first.size===0&&entry.normal.size===0&&entry.last.size===0&&entry.once.size===0)
                    {
                        this.listeners.delete(scope);
                    }
                }
                return timesFound;
            }
            else if (typeof fn=="string"&&fn.toLowerCase()=="all"&&scope===undefined)
            {
            	this.listeners.clear();
            	return -1;//unknown count
            }
            return null;
		},
		removeListeners:function removeListeners(fns,scope)
		{
			fns=[].concat(fns);
			var rtn=[];
			if(fns.length==0)fns.push("all");
			for(var i=0;i<fns.length;i++)
			{
				rtn.push(this.removeListener(fns[i],scope));
			}
			return rtn;
		},
		fire:function fire(source,event)
		{
			event=event||{};
			event.source=source;
			if(!this.disabled)
			{
				var run=true;
                for(var entries=this.listeners.entries(),entryStep=entries.next();!entryStep.done;entryStep=entries.next())
                {
					var scope=entryStep.value[0],entry=entryStep.value[1];
                    var it=entry.first.values();
                    var step=undefined;
                    var value=undefined;
                    while(run&&(step=it.next(),value=step.value,!step.done))
                    {
                        if(typeof value==="string")
                        {
                            value=scope[value];
                        }
                        run=false!==value.call(scope,event);
                    }
                    it=entry.normal.values();
                    while(run&&(step=it.next(),value=step.value,!step.done))
                    {
                        if(typeof value==="string")
                        {
                            value=scope[value];
                        }
                        run=false!==value.call(scope,event);
                    }
                    it=entry.last.values();
                    while(run&&(step=it.next(),value=step.value,!step.done))
                    {
                        if(typeof value==="string")
                        {
                            value=scope[value];
                        }
                        run=false!==value.call(scope,event);
                    }
                    it=entry.once.values();
                    while((step=it.next(),value=step.value,!step.done))
                    {
                        if(typeof value==="string")
                        {
                            value=scope[value];
                        }
                        value.call(scope,event);
                    }
                    entry.once.clear();
                    if(entry.first.size===0&&entry.normal.size===0&&entry.last.size===0 &&this.listeners)//if destroyed while firing
                    {
                        this.listeners["delete"](scope);
                    }
                }
				return run;
			}
			return null;
		},
		setDisabled:function setDisabled(bool){this.disabled=bool===true;},
		isDisabled:function isDisabled(){return this.disabled;},
		destroy:function()
		{
			this.removeListeners();
			this.mega();
		}
	});
	SMOD("Listener",LISTENER);
	
	/** StateListener Class
	 * Listener that fires only when "setState" is called
	 * When state is set it fires added listening functions with last arguments immediately
	 * reset trough "resetState";
	 */
	var STATELISTENER=LISTENER.StateListener=µ.Class(LISTENER,
	{
		init:function StateListenerInit()
		{
			this.mega();
			this.state=null;
			this.stateDisabled=false;
			this.disabled=true
		},
		setDisabled:function setDisabled(bool){this.stateDisabled=bool===true;},
		isDisabled:function isDisabled(){return this.stateDisabled;},
		setState:function setState(source,event)
		{
			this.state=event||{};
			this.state.source=source;

			var rtn=false;
			if(!this.stateDisabled)
			{
				this.disabled=false;
				rtn=this.fire(this,this.state);
				this.disabled=true
			}
			return rtn;
		},
		resetState:function resetState(){this.state=null;},
		getState:function getState(){return this.state},
		addListener:function addListener(fn,scope,type)
		{
			var doFire=this.state&&!this.stateDisabled;
			if(doFire)
			{
				fn.apply(scope,this.state);
			}
			if(!(doFire&&typeof type=="string"&&type.toLowerCase()=="once"))
			{
				return this.mega.apply(this,arguments);
			}
			return null;
		},
		destroy:function()
		{
			this.resetState();
			this.mega();
		}
	});
	SMOD("StateListener",STATELISTENER);
	
	/** Listeners Class
	 * Manages several Listener instances
	 * provides a "createListener" function:
	 * 		prefix "." indicates a StateListener
	 * 	when adding a listening function the type
	 * 	can be passed followed after the name separated by ":" 
	 */
	var LISTENERS=µ.Listeners=µ.Class(BASECLASS,
	{
		rNames:/[\s|,]+/,
		rNameopt:":",
		init:function ListenersInit(dynamic)
		{
			this.listeners={};
			this.createListener(".created destroy");
			this.dynamicListeners=dynamic===true;
		},
		createListener:function createListener(types)
		{
			var typeArr=types.split(this.rNames);
			var fnarr=[].slice.call(arguments,1);
			for(var i=0;i<typeArr.length;i++)
			{
				var name_type=typeArr[i].split(this.rNameopt);
				if(this.listeners[name_type[0]]==null)
				{
					if(name_type[0][0]=='.')
					{
						this.listeners[name_type[0]]=new STATELISTENER({});
					}
					else
					{
						this.listeners[name_type[0]]=new LISTENER({});	
					}
				}
			}
		},
		addListener:function addListener(types,scope/*,functions...*/)
		{
			if(this.dynamicListeners) this.createListener(types);
			var typeArr=types.split(this.rNames);
			var fnarr=[].slice.call(arguments,2);
			for(var i=0;i<typeArr.length;i++)
			{
				var name_type=typeArr[i].split(this.rNameopt);
				if(this.listeners[name_type[0]]!==undefined)
				{
					this.listeners[name_type[0]].addListeners(fnarr,scope,name_type[1]);
				}
			}
		},
		removeListener:function removeListener(names,scope/*,functions...*/)
		{
			var removeCount=0;
			if(names.toLowerCase()=="all")
			{
				for(var i in this.listeners)
				{
					removeCount+=this.listeners[i].removeListeners(names,scope);
				}
			}
			else
			{
				var nameArr=names.split(this.rNames);
				var fnarr=[].slice.call(arguments,2);
				for(var i=0;i<nameArr.length;i++)
				{
					var name=nameArr[i];
					if(this.listeners[name]!==undefined)
					{
						removeCount+=this.listeners[name].removeListeners(fnarr,scope);
					}
				}
			}
			return removeCount;
		},
		fire:function fire(name,event)
		{
			event=event||{};
			event.type=name;
			if(this.listeners[name])
			{
				return this.listeners[name].fire(this,event);
			}
			return undefined
		},
		disableListener:function disableListener(names,bool)
		{
			if(names.toLowerCase()=="all")
			{
				for(var i in this.listeners)
				{
					this.listeners[i].setDisabled(bool);
				}
			}
			else
			{
				var nameArr=names.split(this.rNames);
				for(var i=0;i<nameArr.length;i++)
				{
					var lstnr=this.listeners[nameArr[i]];
					if(lstnr!=null)
						lstnr.setDisabled(bool);
				}
			}
		},
		isListenerDisabled:function isDisabled(name)
		{
			var lstnr=this.listeners[name];
			if(lstnr===undefined) return undefined;
			else return lstnr.isDisabled();
		},
		setState:function setState(name,state)
		{
			var event={value:state};
			event.type=name;
			var lstnr=this.listeners[name];
			if (lstnr&&lstnr instanceof STATELISTENER)
			{
				return lstnr.setState(this,event);
			}
			return undefined;
		},
		resetState:function resetState(names)
		{
			if(names.toLowerCase()=="all")
			{
				for(var i in this.listeners)
				{
					if(this.listeners[i] instanceof STATELISTENER)
					this.listeners[i].resetState();
				}
			}
			else
			{
				var nameArr=names.split(this.rNames);
				for(var i=0;i<nameArr.length;i++)
				{
					var lstnr=this.listeners[nameArr[i]];
					if(lstnr!=null&&lstnr instanceof STATELISTENER)
						lstnr.resetState();
				}
			}
		},
		getState:function getState(name)
		{
			var lstnr=this.listeners[name];
			if(lstnr!=null&&lstnr instanceof STATELISTENER) return lstnr.getState();
			return undefined;
		},
		destroy:function()
		{
			this.fire("destroy");
			for(var i in this.listeners)
			{
				this.listeners[i].destroy();
				delete this.listeners[i];
			}
			this.mega();
		}
	});
	SMOD("Listeners",LISTENERS);
	LISTENERS.attachListeners=function attachListeners(instance)
	{
		for(var i in LISTENERS.prototype)
		{
			if (!(i in instance))
				instance[i]=LISTENERS.prototype[i];
		}
		LISTENERS.prototype.init.call(instance);
		instance.setState(".created");
	};
	SMOD("attachListeners",LISTENERS.attachListeners);
	
})(Morgas,Morgas.setModule,Morgas.getModule);
//TalePlay.Layer.js
(function(µ,SMOD,GMOD,HMOD){

    var TALE=this.TalePlay=this.TalePlay||{};

	var LST=GMOD("Listeners");
	
    var SC=GMOD("shortcut")({
	    node:"NodePatch",
    });
	
	var LAYER=TALE.Layer=µ.Class(LST,{
		init:function(param)
		{
			this.mega();
			param=param||{};
			this.nodePatch=new SC.node(this,{
				parent:"board",
				children:"GUIElements",
				addChild:"add",
				removeChild:"remove",
		        hasChild:"has"
			},true);
			//this.board=null;
			//this.GUIElements=[];
			
			this.mode=param.mode||LAYER.Modes.ALL;
			this.domElement=document.createElement("div");
			this.domElement.classList.add("Layer");
			
			this.focused=null;
		},
		onController:function(event)
		{
			switch(this.mode)
			{
				case LAYER.Modes.ALL:
				default:
					for(var i=0;i<this.GUIElements.length;i++)
					{
						this.GUIElements[i][LAYER._CONTROLLER_EVENT_MAP[event.type]](event);
					}
					break;
				case LAYER.Modes.FIRST:
					if(this.GUIElements.length>0) this.GUIElements[0][LAYER._CONTROLLER_EVENT_MAP[event.type]](event);
					break;
				case LAYER.Modes.LAST:
					if(this.GUIElements.length>0) this.GUIElements[this.GUIElements.length-1][LAYER._CONTROLLER_EVENT_MAP[event.type]](event);
					break;
				case LAYER.Modes.FOCUSED:
					if(this.focused) this.focused[LAYER._CONTROLLER_EVENT_MAP[event.type]](event);
					break;
			}
		},
		add:function(guiElement,target)
		{
			if(HMOD("GUIElement")&&guiElement instanceof GMOD("GUIElement")&&this.nodePatch.addChild(guiElement))
			{
				if(typeof target==="string")
				{
					target=this.domElement.querySelector(target);
				}
				if(!target)
				{
					target=this.domElement;
				}
				target.appendChild(guiElement.domElement);
				return true;
			}
			return false;
		},
		remove:function(guiElement)
		{
			if(this.nodePatch.removeChild(guiElement))
			{
				guiElement.domElement.remove();
				guiElement.removeListener("all",this);
				return true;
			}
			return false;
		},
		destroy:function()
		{
			this.nodePatch.remove();
			var c=this.GUIElements.slice();
			for(var i=0;i<c.length;i++)
			{
				c[i].destroy();
			}
			this.mega();
		}
	});
	LAYER.Modes={
		ALL:0,
		FIRST:1,
		LAST:2,
		FOCUSED:3
	};
	LAYER._CONTROLLER_EVENT_MAP={
			"analogStickChanged":"onAnalogStick",
			"buttonChanged":"onButton"
	};
	SMOD("Layer",LAYER);
})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule);
//GUI/TalePlay.GUIElement.js
(function(µ,SMOD,GMOD){

    var TALE=this.TalePlay=this.TalePlay||{};

	var LST=GMOD("Listeners");
	var SC=GMOD("shortcut")({
		sc:"shortcut",
        node:"NodePatch",
        Layer:"Layer"
    });
	
	var GE=TALE.GUIElement=µ.Class(LST,{
		init:function(param)
		{
			param=param||{};
			this.mega();
			this.nodePatch=new SC.node(this,{
		        parent:"parent",
		        children:"children",
		        addChild:"addChild",
		        removeChild:"removeChild"
			},true);
			
			SC.sc({layer:function(node)
			{
				var layer=node.parent;
				while(layer&&!(layer instanceof SC.Layer))
				{
					layer=layer.parent
				}
				return layer;
			}},this,this.nodePatch,true);
			//this.layer=null;

			this.domElement=document.createElement(param.element||"div");
			this.addStyleClass("GUIElement");
			
			if (param.styleClass)
			{
				this.addStyleClass(param.styleClass);
			}
		},
		addStyleClass:function(styleClass)
		{
			var list=this.domElement.classList;
			if(Array.isArray(styleClass))
			{
				list.add.apply(list,styleClass);
			}
			else
			{
				list.add(styleClass);
			}
		},
		removeStyleClass:function(styleClass)
		{
			var list=this.domElement.classList;
			if(Array.isArray(styleClass))
			{
				list.remove.apply(list,styleClass);
			}
			else
			{
				list.remove(styleClass);
			}
		},
		addChild:function(guiElement,target)
		{
			if(guiElement instanceof GE&&this.nodePatch.addChild(guiElement))
			{
				if(typeof target==="string")
				{
					target=this.domElement.querySelector(target);
				}
				if(!target)
				{
					target=this.domElement;
				}
				target.appendChild(guiElement.domElement);
				return true;
			}
			return false;
		},
		removeChild:function(guiElement)
		{
			if(this.nodePatch.removeChild(guiElement))
			{
				guiElement.domElement.remove();
				guiElement.removeListener("all",this);
				return true;
			}
			return false;
		},
		onAnalogStick:function(event)
		{
			//overwrite when needed
		},
		onButton:function(event)
		{
			//overwrite when needed
		},
		destroy:function()
		{
			this.nodePatch.remove();
			var c=this.children.slice();
			for(var i=0;i<c.length;i++)
			{
				c[i].destroy();
			}
			this.mega();
		}
	});
	
	SMOD("GUIElement",GE);
	
})(Morgas,Morgas.setModule,Morgas.getModule);
//Math/TalePlay.Math.Point.js
(function(µ,SMOD,GMOD){

    var TALE=this.TalePlay=this.TalePlay||{};
	TALE.Math=TALE.Math||{};
	
	var SC=GMOD("shortcut")({
		debug:"debug"
	});
	
	var POINT=TALE.Math.Point=µ.Class({
		init:function(numberOrPoint,y)
		{
			this.x=0;
			this.y=0;
			this.set(numberOrPoint,y);
		},
		set:function(numberOrPoint,y)
		{
			if(typeof numberOrPoint==="object"&&numberOrPoint!==null)
			{
				this.x=1*numberOrPoint.x;
				this.y=1*numberOrPoint.y;
			}
			else if (numberOrPoint!==undefined)
			{
				this.x=1*numberOrPoint;
				if(y===undefined)
				{
					y=numberOrPoint;
				}
				this.y=1*y;
			}
			if(isNaN(this.x)||isNaN(this.y))
			{
				SC.debug(["Point became NaN",this],SC.debug.LEVEL.WARNING);
			}
			return this;
		},
		clone:function(cloning)
		{
			if(!cloning)
			{
				cloning=new POINT();
			}
			cloning.set(this.x,this.y);
			return cloning;
		},
		equals:function(numberOrPoint,y)
		{
			if(typeof numberOrPoint==="object"&&numberOrPoint!==null)
			{
				return this.x==numberOrPoint.x&&this.y==numberOrPoint.y;
			}
			else if (numberOrPoint!==undefined)
			{
				if(y===undefined)
				{
					y=numberOrPoint;
				}
				return this.x==numberOrPoint&&this.y==y;
			}
			return false;
		},
		add:function(numberOrPoint,y)
		{
			if(typeof numberOrPoint==="object"&&numberOrPoint!==null)
			{
				this.x+=1*numberOrPoint.x;
				this.y+=1*numberOrPoint.y;
			}
			else if (numberOrPoint!==undefined)
			{
				this.x+=1*numberOrPoint;
				if(y===undefined)
				{
					y=numberOrPoint;
				}
				this.y+=1*y;
			}
			if(isNaN(this.x)||isNaN(this.y))
			{
				SC.debug(["Point became NaN",this],SC.debug.LEVEL.WARNING);
			}
			return this;
		},
		sub:function(numberOrPoint,y)
		{
			if(typeof numberOrPoint==="object"&&numberOrPoint!==null)
			{
				this.x-=numberOrPoint.x;
				this.y-=numberOrPoint.y;
			}
			else if (numberOrPoint!==undefined)
			{
				this.x-=numberOrPoint;
				if(y===undefined)
				{
					y=numberOrPoint;
				}
				this.y-=y;
			}
			if(isNaN(this.x)||isNaN(this.y))
			{
				SC.debug(["Point became NaN",this],SC.debug.LEVEL.WARNING);
			}
			return this;
		},
		mul:function(numberOrPoint,y)
		{
			if(typeof numberOrPoint==="object"&&numberOrPoint!==null)
			{
				this.x*=numberOrPoint.x;
				this.y*=numberOrPoint.y;
			}
			else if (numberOrPoint!==undefined)
			{
				this.x*=numberOrPoint;
				if(y===undefined)
				{
					y=numberOrPoint;
				}
				this.y*=y;
			}
			if(isNaN(this.x)||isNaN(this.y))
			{
				SC.debug(["Point became NaN",this],SC.debug.LEVEL.WARNING);
			}
			return this;
		},
		div:function(numberOrPoint,y)
		{
			if(typeof numberOrPoint==="object"&&numberOrPoint!==null)
			{
				this.x/=numberOrPoint.x;
				this.y/=numberOrPoint.y;
			}
			else if (numberOrPoint!==undefined)
			{
				this.x/=numberOrPoint;
				if(y===undefined)
				{
					y=numberOrPoint;
				}
				this.y/=y;
			}
			if(isNaN(this.x)||isNaN(this.y))
			{
				SC.debug(["Point became NaN",this],SC.debug.LEVEL.WARNING);
			}
			return this;
		},
		negate:function()
		{
			this.x=-this.x;
			this.y=-this.y;
			return this;
		},
		invert:function()
		{
			this.x=1/this.x;
			this.y=1/this.y;
			return this;
		},
		abs:function()
		{
			this.x=Math.abs(this.x);
			this.y=Math.abs(this.y);
			return this;
		},
		length:function()
		{
			return Math.sqrt(this.x*this.x+this.y*this.y);
		},
		normalize:function()
		{
			var l=this.length();
			if(l)
			{
				this.div(l);
			}
			return this;
		},
		getAngle:function()
		{
			if(this.y!==0||this.x!==0)
			{
				var a=Math.asin(this.y/this.length());
				if(this.x>=0)
				{
					a=Math.PI/2-a;
				}
				else
				{
					a+=Math.PI*1.5;
				}
				return a;
			}
			return 0;
		},
		getDirection4:function()
		{//0:none 1:up 2:right 3:down 4:left
			if(this.y===0&&this.x===0)
			{
				return 0;
			}
			else if(Math.abs(this.y)>Math.abs(this.x))
			{
				if(this.y>0)
				{
					return 1;
				}
				else
				{
					return 3;
				}
			}
			else
			{
				if(this.x>0)
				{
					return 2;
				}
				else
				{
					return 4;
				}
			}
		},
		getDirection8:function()
		{
			//0:none 1:up 2:up-right 3:right 4:down-right ...
			if(this.y===0&&this.x===0)
			{
				return 0;
			}
			else
			{
				return 1+Math.floor((this.getAngle()/Math.PI*4+0.5)%8);
			}
		},
		doMath:function(fn,numberOrPoint,y)
		{
			if(typeof numberOrPoint==="object"&&numberOrPoint!==null)
			{
				this.x=fn(this.x,1*numberOrPoint.x);
				this.y=fn(this.y,1*numberOrPoint.y);
			}
			else if (numberOrPoint!==undefined)
			{
				this.x=fn(this.x,1*numberOrPoint);
				if(y===undefined)
				{
					y=1*numberOrPoint;
				}
				this.y=fn(this.y,y);
			}
			if(isNaN(this.x)||isNaN(this.y))
			{
				SC.debug(["Point became NaN",this],SC.debug.LEVEL.WARNING);
			}
			return this;
		}
	});
	
	SMOD("Math.Point",POINT);
	
})(Morgas,Morgas.setModule,Morgas.getModule);
//TalePlay.Controller.js
(function(µ,SMOD,GMOD){

    var TALE=this.TalePlay=this.TalePlay||{};
	
	var LST=GMOD("Listeners");
	var POINT=GMOD("Math.Point");
	
	var SC=µ.shortcut({
		mapping:"Controller.Mapping"
	});
	
	var CTRL=TALE.Controller=µ.Class(LST,{
		init:function(mapping,mappingName)
		{
			this.mega();
			
			this.analogSticks={};
			this.buttons={};
			this.mapping=null;
			
			this.setMapping(mapping,mappingName);
			this.createListener("changed analogStickChanged buttonChanged .disabled .connected");
			this.addListener(".disabled",this,"reset");
			//TODO this.addListener(".connected",this,"reset");
		},
		getMapping:function()
		{
			return this.mapping;
		},
		setMapping:function(mapping,mappingName)
		{
			if(mapping)
			{
				if(!(mapping instanceof SC.mapping))
				{
					mapping=new SC.mapping({data:mapping,name:mappingName||"default"});
				}
				this.mapping=mapping;
			}
			else
			{
				this.mapping=null;
			}
		},
		getAnalogStick:function(axisIndex)
		{
			if(this.analogSticks[axisIndex]===undefined)
			{
				this.analogSticks[axisIndex]=new CTRL.AnalogStick();
			}
			return this.analogSticks[axisIndex];
		},
		setButton:function(buttonMap)
		{
			var changed=false,axisMap=undefined;
			if(this.mapping)
			{
				var remapped={};
				axisMap={};
				for(var i in buttonMap)
				{
					var axisIndex=this.mapping.getButtonAxisMapping(i);
					if(axisIndex!==undefined)
					{
						axisMap[Math.abs(axisIndex)]=this.mapping.convertAxisValue(axisIndex,buttonMap[i]);
					}
					else
					{
						remapped[this.mapping.getButtonMapping(i)]=buttonMap[i];
					}
				}
				buttonMap=remapped;
			}
			
			for(var index in buttonMap)
			{
				var value=buttonMap[index];
				if(this.buttons[index]===undefined||this.buttons[index]!==value)
				{
					var old=this.buttons[index]||0;
					this.buttons[index]=value;
					this.fire("buttonChanged",{index:1*index,value:value,oldValue:old});
					changed=true;
				}
			}
			if(axisMap)
			{
				changed=this.setAxis(axisMap,true)||changed;
			}
			if(changed)
			{
				this.fire("changed");
			}
			return changed;
		},
		setAxis:function(axisMap,fromButton)
		{
			var changed=false;
			if(this.mapping&&!fromButton)
			{
				var remapped={};
				for(var i in axisMap)
				{
					var index=this.mapping.getAxisMapping(i);
					remapped[Math.abs(index)]=this.mapping.convertAxisValue(index,axisMap[i]);
				}
				axisMap=remapped;
			}
			
			var keys=Object.keys(axisMap);
			while(keys.length>0)
			{
				var key=keys.shift(), xAxis=undefined, yAxis=undefined; index=-1;
				var aStick=this.getAnalogStick(key>>1);
				if(key%2==0)
				{
					xAxis=axisMap[key];
					yAxis=axisMap[key*1+1]||aStick.y;
					
					index=keys.indexOf(key*1+1);
					if(index!==-1) keys.splice(index,1);
				}
				else
				{
					xAxis=axisMap[key-1]||aStick.x;
					yAxis=axisMap[key];
					
					index=keys.indexOf(key-1);
					if(index!==-1) keys.splice(index,1);
				}
				aStick.set(xAxis,yAxis);
				if(aStick.hasChanged())
				{
					changed=true;
					this.fire("analogStickChanged",{index:key>>1,analogStick:aStick});
				}
			}
			if(changed&&!fromButton)
			{
				this.fire("changed");
			}
			return changed;
		},
		set:function(buttons,axes)
		{
			this.setButton(buttons);
			this.setAxis(axes);
		},
		reset:function()
		{
			var changed=false;
			for(var b in this.buttons)
			{
				var oldValue=this.buttons[b];
				if(oldValue!==0)
				{
					this.buttons[b]=0;
					this.fire("buttonChanged",{index:1*b,value:0,oldValue:old});
					changed=true;
				}
			}
			for(var a in this.analogSticks)
			{
				var aStick=this.analogSticks[a];
				aStick.set(0,0);
				if(aStick.hasChanged())
				{
					this.fire("analogStickChanged",{index:1*a,analogStick:aStick});
					changed=true;
				}
			}
		},
		setDisabled:function(disabled)
		{
			if(disabled) this.setState(".disabled");
			else this.resetState(".disabled");
		},
		destroy:function()
		{
			//TODO;
			this.mega();
		},
		toString:function()
		{
			return JSON.stringify(this);
		},
		toJSON:function()
		{
			return {buttons:this.buttons,analogSticks:this.analogSticks};
		}
	});
	//TODO use Math.Point
	CTRL.AnalogStick=µ.Class(POINT,{
		init:function(x,y)
		{
			this.old={x:0,y:0};
			this.mega(x,y);
		},
		clone:function(cloning)
		{
			if(!cloning)
			{
				cloning=new CTRL.AnalogStick();
			}
			this.mega(cloning);
			cloning.old.x=this.old.x;
			cloning.old.y=this.old.y;
			return cloning;
		},
		clonePoint:function()
		{
			return POINT.prototype.clone.call(this);
		},
		pushOld:function()
		{
			this.old.x=this.x;
			this.old.y=this.y;
			return this;
		},
		hasChanged:function()
		{
			return !this.equals(this.old);
		},
		getDifference:function()
		{
			return new POINT(this.old).sub(this);
		},
		setComponent:function(index,value)
		{
			this.pushOld();
			
			if(index%2===0)
			{
				this.x=value;
			}
			else
			{
				this.y=value;
			}
			return this;
		},
		set:function(numberOrPoint,y)
		{
			this.pushOld();
			this.mega(numberOrPoint,y);
		}
	});
	
	
	SMOD("Controller",CTRL);
	
})(Morgas,Morgas.setModule,Morgas.getModule);
//TalePlay.Controller.Gamepad.js
(function(µ,SMOD,GMOD){

	var CTRL=GMOD("Controller");

	var SC=GMOD("shortcut")({
		rs:"rescope"
	});
	
	var GP=CTRL.Gamepad=µ.Class(CTRL,{
		init:function(gamepad,map,precision)
		{
			this.mega(map);
			SC.rs.all(this,["update"]);
			
			this.gamepad=gamepad;
			this.gamepadIndex=gamepad.index;
			this.precision=precision||1;
			this.pollKey=null;
			
			this.addListener(".created:once",this,"update");
		},
		update:function()
		{
			this.gamepad=navigator.getGamepads()[this.gamepadIndex];
			if(this.gamepad.connected)
			{
				this.set(this.gamepad.buttons.map(function(b){return b.value}),this.gamepad.axes.map(function(a){return a.toFixed(this.precision)*1}));
			}
			this.pollKey=requestAnimationFrame(this.update);
		},
		toJSON:function()
		{
			var json=CTRL.prototype.toJSON.call(this);
			json.gpIndex=this.gpIndex;
			return json;
		},
		setDisabled:function(disabled)
		{
			this.mega(disabled);
			if(disabled)
			{
				cancelAnimationFrame(this.pollKey);
			}
			else
			{
				this.update();
			}
		}
	});
	SMOD("Controller.Gamepad",GP);
})(Morgas,Morgas.setModule,Morgas.getModule);
//TalePlay.Controller.Keyboard.js
(function(µ,SMOD,GMOD){

	var CTRL=GMOD("Controller");
	
	var SC=µ.shortcut({
		rescope:"rescope"
	});
	
	CTRL.Keyboard=µ.Class(CTRL,{
		init:function(mapping,mappingName,domElement)
		{
			this.mega(mapping!==undefined ? mapping : CTRL.Keyboard.stdMapping,mappingName);
			
			SC.rescope.all(this,["onKeyDown","onKeyUp"]);
			
			this.domElement=null;
			this.setDomElement(domElement||window)
		},
		setMapping:function(mapping)
		{
			this.mega(mapping);
			if(this.mapping)
			{
				this.mapping.setValueOf("type","Keyboard");
			}
		},
		setDomElement:function(domElement)
		{
			if(this.domElement)
			{
				this.domElement.removeEventListener("keydown", this.onKeyDown, false);
				this.domElement.removeEventListener("keyup", this.onKeyUp, false);
				this.domElement=null;
			}
			if(domElement)
			{
				this.domElement=domElement;
				domElement.addEventListener("keydown", this.onKeyDown, false);
				domElement.addEventListener("keyup", this.onKeyUp, false);
			}
		},
		onKeyDown:function(event)
		{
			this.onKey(event,1);
		},
		onKeyUp:function(event)
		{
			this.onKey(event,0);
		},
		onKey:function(event,value)
		{
			if(!this.disabled&&this.mapping)
			{
				if(this.mapping.hasButtonMapping(event.code||event.keyCode)||this.mapping.hasButtonAxisMapping(event.code||event.keyCode))
				{
					event.preventDefault();
					event.stopPropagation();
					
					var map={};
					map[event.code||event.keyCode]=value;
					this.setButton(map);
				}
			}
		},
		destroy:function()
		{
			this.setDomElement();
			this.mega();
		}
	});
	CTRL.Keyboard.stdMapping={
		"buttons": {
			"Space": "0",
			"ShiftLeft": "1",
			"Numpad1": "2",
			"Numpad2": "3",
			"Numpad3": "4",
			"Numpad4": "5",
			"Numpad5": "6",
			"Numpad6": "7",
			"Pause": "8",
			"Enter": "9",
			
			//chrome keyCode
			"13": "9",
			"16": "1",
			"19": "8",
			"32": "0",
			"97": "2",
			"98": "3",
			"99": "4",
			"100": "5",
			"101": "6",
			"102": "7",
		},
		"buttonAxis": {
			"KeyW": "1",
			"KeyD": "0",
			"KeyS": "-1",
			"KeyA": "-0",
			"ArrowUp": "3",
			"ArrowRight": "2",
			"ArrowDown": "-3",
			"ArrowLeft": "-2",

			//chrome keyCode
			"37": "-2",
			"38": "3",
			"39": "2",
			"40": "-3",
			"65": "-0",
			"68": "0",
			"83": "-1",
			"87": "1"
		},
		"axes": {}
	};
	SMOD("Controller.Keyboard",CTRL.Keyboard)

})(Morgas,Morgas.setModule,Morgas.getModule);
//GUI/TalePlay.GUIElement.ControllerManager.js
(function(µ,SMOD,GMOD){
	
	//TODO change to Layer
	
	var GUI=GMOD("GUIElement");
	
	var SC=GMOD("shortcut")({
		rs:"rescope",
		bind:"bind",
		mapping:"Controller.Mapping",
		ctrlK:"Controller.Keyboard",
		ctrlG:"Controller.Gamepad",
		GMenu:"GUI.Menu",
		config:"GUI.ControllerConfig"
	});
	
	var template=
	'<table>'+
		'<tr>'+
			'<td class="DeviceActions">'+
				'<select class="devices"></select>'+
				'<button data-action="addDevice">add Device</button>'+
				'<button data-action="removeController">remove Controller</button>'+
			'</td>'+
			'<td class="MappingActions">'+
				'<button data-action="newMapping">New</button>'+
				'<button data-action="setMapping">Set</button>'+
				'<button data-action="editMapping">Edit</button>'+
				'<button data-action="deleteMapping">Delete</button>'+
			'</td>'+
		'</tr>'+
		'<tr>'+
			'<td class="controllers"></td>'+
			'<td class="mappings"></td>'+
		'</tr>'+
	'</table>'+
	'<button data-action="close">OK</button>';
	var MANAGER=GUI.ControllerManager=µ.Class(GUI,{
		init:function(param)
		{
			param=param||{};
			param.styleClass=param.styleClass||"overlay";
			
			this.mega(param);
			this.addStyleClass("ControllerManager");
			SC.rs.all(this,["_Click","_playerChanged","_mappingsLoaded"]);
			this.domElement.addEventListener("click",this._Click);

			this.buttons=param.buttons!==undefined ? param.buttons : 10;
			this.analogSticks=param.analogSticks!==undefined ? param.analogSticks : 2;

			this.controllers=new SC.GMenu({
				type:SC.GMenu.Types.TABLE,
				header:["No.","Device","Mapping","Player"],
				selectionType:SC.GMenu.SelectionTypes.SINGLE,
				converter:MANAGER.controllerConverter
			});
			this.controllers.addListener("select",this,"_MenuSelect");

			param.mappings=param.mappings||[];
			param.mappings.unshift(null);
			this.mappings=new SC.GMenu({
				type:SC.GMenu.Types.TABLE,
				header:["Name","Type"],
				selectionType:SC.GMenu.SelectionTypes.SINGLE,
				converter:MANAGER.mappingConverter,
				items:param.mappings
			});
			this.mappings.addListener("select",this,"_MenuSelect");
			
			this.dbConn=param.dbConn||null;
			if(this.dbConn)
			{
				this.dbConn.load(SC.mapping,{}).complete(this._mappingsLoaded);
			}

            this.config=null;
			
			this.domElement.innerHTML=template;

			this.domElement.querySelector(".controllers").addEventListener("change",this._playerChanged);
			this.domElement.querySelector(".controllers").appendChild(this.controllers.domElement);
			this.domElement.querySelector(".mappings").appendChild(this.mappings.domElement);
			
			this.update();
			
			this._gamepadListener=SC.bind(this.update,this,"devices");
			window.addEventListener("gamepadconnected",this._gamepadListener);
		},
		update:function(part)
		{
			if(part===undefined||part==="devices")
			{
				var html='<option>Keyboard</option>';
				var gamepads=navigator.getGamepads();
				for(var i=0;i<gamepads.length;i++)
				{
					if(gamepads[i])
					{
						html+='<option>'+gamepads[i].id+'</option>';
					}
				}
				this.domElement.querySelector(".devices").innerHTML=html;
			}

			if(this.layer&&this.layer.board&&(part===undefined||part==="controllers"))
			{
				this.controllers.clear().addAll(this.layer.board.controllers)
			}

			if(part===undefined||part==="actions")
			{
				var controller=this.controllers.getSelectedItems()[0],
				mapping=this.mappings.getSelectedItems()[0];

				this.domElement.querySelector('[data-action="removeController"]').disabled=
					this.domElement.querySelector('[data-action="newMapping"]').disabled=!controller;
				this.domElement.querySelector('[data-action="setMapping"]').disabled=!controller||!mapping;
				this.domElement.querySelector('[data-action="editMapping"]').disabled=!controller||!controller.value.controller.getMapping();
				this.domElement.querySelector('[data-action="deleteMapping"]').disabled=!mapping;
			}
		},
		_mappingsLoaded:function(mappings)
		{
			this.mappings.addAll(mappings);
		},
		_Click:function(event)
		{
			var action=event.target.dataset.action;
			if(action!==undefined)
			{
				event.stopPropagation();
				this[action]();
			}
		},
		addDevice:function()
		{
			var index=this.domElement.querySelector(".devices").selectedIndex;
			if(index===0)
			{
				this.addController(new SC.ctrlK());
			}
			else
			{
				var gamepad=navigator.getGamepads()[--index];
				this.addController(new SC.ctrlG(gamepad));
			}
		},
		removeController:function()
		{
			var controller=this.controllers.getSelectedItems()[0];
			if(controller)
			{
				this.layer.board.removeController(controller.value.controller);
				this.update("controllers");
			}
		},
		newMapping:function()
		{
			this._openControllerConfig(true);
		},
		setMapping:function()
		{
			var controller=this.controllers.getSelectedItems()[0],
			mapping=this.mappings.getSelectedItems()[0];
			if(controller&&mapping)
			{
				controller.value.controller.setMapping(mapping.value);
				this.update("controllers");
			}
		},
		editMapping:function()
		{
			this._openControllerConfig(false);
		},
		deleteMapping:function()
		{
			var mapping=this.mappings.getSelectedItems()[0];
			if(mapping&&mapping.value!==null)
			{
				this.mappings.removeItem(mapping.value);
				if(this.dbConn&&mapping.value.getID()!==undefined)
				{
					this.dbConn["delete"](SC.mapping,mapping.value);
				}
			}
		},
		addController:function(controller)
		{
			this.layer.board.addController(controller);
			this.update("controllers");
		},
		_MenuSelect:function()
		{
			this.update("actions");
		},
		_openControllerConfig:function(isNew)
		{
			var controller=this.controllers.getSelectedItems()[0];
			if(controller&&!this.config)
			{
				controller=controller.value.controller;
				var mapping=controller.getMapping();
                this.config=new SC.config({
					buttons:this.buttons,
					analogSticks:this.analogSticks,
					controller:controller,
					name:!!isNew
				});
				if(isNew)
				{
					controller.setMapping(null);
				}
				else if (!mapping)
				{
					return false;
				}
				this.config.addStyleClass("panel","overlay");
				this.layer.add(this.config);
				this.config.addListener("submit:once",this,function(event)
				{
					switch(true)
					{
						case event.value==="ok":
							if(isNew)//make new mapping
							{
								mapping=event.source.getMapping();
								this.mappings.addItem(mapping);
							}
							else//update mapping
							{
								mapping.setValueOf("data",event.source.getData());
							}
							if(this.dbConn&&(isNew||mapping.getID()!==undefined))
							{
								this.dbConn.save(mapping);
							}
						case !!isNew://reset old mapping or set new
							controller.setMapping(mapping);
					}
					event.source.destroy();
                    this.config=null;
					this.update("controllers");
				});
				return true;
			}
			return false;
		},
		close:function()
		{
			if(this.layer&&this.layer.board)this.layer.board.focus();
			this.destroy();
		},
		_playerChanged:function(event)
		{
			if(event.target.dataset.controllerindex!==undefined)
			{
				this.layer.board.controllers[event.target.dataset.controllerindex].player=1*event.target.value||1;
			}
		},
		destroy:function()
		{
			this.mega();
			window.removeEventListener("gamepadconnected",this._gamepadListener);
		}
	});
	MANAGER.controllerConverter=function(item,index,selected)
	{
		return [
			index,
			(item.controller instanceof SC.ctrlK)?"Keyboard":item.controller.gamepad.id,
			((item.controller.mapping&&item.controller.mapping.getValueOf("name"))||"None"),
			'<input type="number" min="1" value="'+item.player+'" data-controllerindex="'+index+'" >'
	    ];
	};
	MANAGER.mappingConverter=function(item,index,selected)
	{
		if(!item)
		{
			return ["none",""];
		}
		else
		{
			return [item.getValueOf("name"),item.getValueOf("type")];
		}
	};
	SMOD("GUI.ControllerManager",MANAGER);
	
})(Morgas,Morgas.setModule,Morgas.getModule);
//GUI/TalePlay.GUIElement.Menu.js
(function(µ,SMOD,GMOD){
	
	var GUI=GMOD("GUIElement");
	
	var SC=GMOD("shortcut")({
		MENU:"Menu",
		rescope:"rescope"
	});
	
	var MENU=GUI.Menu=µ.Class(GUI,{
		init:function(param)
		{
			SC.rescope.all(this,["_stepActive","onClick"]);
			
			param=param||{};
			
			this.mega(param);
			this.menu=new SC.MENU(param);
			this.addStyleClass("Menu");
			
			this.domElement.addEventListener("click",this.onClick,false);
			
			this.createListener("activeChanged select");

			this.type=param.type||MENU.Types.VERTICAL;
			this.converter=param.converter||MENU.defaultConverter;
			this.converterInfo=param.converterInfo||{};
			this.rows=param.rows||null;
			this.columns=param.columns||null;
			this.header=param.header||null;
			
			this.stepDirection=null;
			this.stepID=null;
			this.stepDelay=param.stepDelay||500;
			this.stepAcceleration=Math.min(1/param.stepAcceleration,param.stepAcceleration)||0.75;
			this.minStepDelay=param.minStepDelay||50;
			this.currentStepDelay=null;
			
			this.domElement.dataset.type = reverseTypes[this.type];
			
			this.update();
		},
		onAnalogStick:function(event)
		{
			var direction=event.analogStick.clonePoint().doMath(Math.round,0);
			if(!direction.equals(this.stepDirection))
			{
				if(this.stepID)
				{
					clearTimeout(this.stepID);
					this.stepID=null;
				}
				this.stepDirection=direction;
				this._stepActive();
			}
		},
		_stepActive:function()
		{
			var step=0;
			switch(this.type)
			{
				case MENU.Types.VERTICAL:
				case MENU.Types.TABLE:
					step=-this.stepDirection.y;
					break;
				case MENU.Types.GRID:
					var gridLayout=this.getGridLayout();
					if(this.stepDirection.y===1)
					{
						step=-gridLayout.columns;
						var lastRowItems=this.menu.items.length%gridLayout.columns;
						if(this.menu.active<=gridLayout.columns&&lastRowItems!==0)
						{
						
							step=(lastRowItems>this.menu.active ? -lastRowItems : step-lastRowItems);
						}
					}
					else if (this.stepDirection.y===-1)
					{
						step=gridLayout.columns;
						if(this.menu.active+step>=this.menu.items.length)
						{
							step=this.menu.active%gridLayout.columns;
							step=this.menu.items.length-this.menu.active+step;
						}
					}
					case MENU.Types.HORIZONTAL:
					step+=this.stepDirection.x;
					break;
			}
			if(step!==0)
			{
				this.menu.moveActive(step);
				this._updateActive();
				this.fire("activeChanged");
				
				if(this.stepID===null)
				{
					this.currentStepDelay=this.stepDelay;
				}
				else if (this.currentStepDelay!==this.minStepDelay)
				{
					this.currentStepDelay=Math.max(this.minStepDelay,this.currentStepDelay*this.stepAcceleration);
				}
				this.stepID=setTimeout(this._stepActive, this.currentStepDelay);
			}
			else
			{
				clearTimeout(this.stepID);
				this.stepDirection=this.stepID=null;
			}
		},
		_updateActive:function()
		{
			for(var i=0,actives=this.domElement.querySelectorAll(".menuitem.active");i<actives.length;i++)
			{
				actives[i].classList.remove("active");
			}
			
			if(this.menu.active!==-1)
			{
				this.getItemDomElement(this.menu.active).classList.add("active");
			}
		},
		onClick:function(event)
		{
			var target=event.target,
			index=-1;
			if(target.tagName==="INPUT"||target.tagName==="SELECT"||target.tagName==="TEXTAREA")
			{
				return ;
			}
			while(target&&target!==document&&!target.classList.contains("menuitem"))
			{
				target=target.parentNode;
			}
			if(this.type===MENU.Types.GRID)
			{
				var column=Array.prototype.indexOf.call(target.parentNode.children,target),
				row=Array.prototype.indexOf.call(this.domElement.children,target.parentNode),
				gridLayout=this.getGridLayout();
				index=row*gridLayout.columns+column;
			}
			else if (this.type===MENU.Types.TABLE&&this.header)
			{
				index=Array.prototype.indexOf.call(this.domElement.children,target)-1;
			}
			else
			{
				index=Array.prototype.indexOf.call(this.domElement.children,target);
			}
			if(index>-1)
			{
				event.stopPropagation();
				if(this.layer&&this.layer.board)
				{
					this.layer.board.focus();
				}
				this.setActive(index);
				this.toggleSelect(index);
			}
		},
		onButton:function(event)
		{
			if (event.value===1)
			{
				if(this.menu.active!==-1)
				{
					this.toggleSelect(this.menu.active)
				}
			}
		},
		toggleSelect:function(index)
		{
			var cl=this.getItemDomElement(index).classList;
			if(this.menu.selectionType===SC.MENU.SelectionTypes.SINGLE&&!this.menu.isSelected(index)&&this.menu.selectedIndexs.length>0)
			{
				this.getItemDomElement(this.menu.selectedIndexs[0]).classList.remove("selected");
			}
			if(this.menu.toggleSelect(index,true))
			{
				cl.add("selected");
			}
			else
			{
				cl.remove("selected");
			}
			this.fire("select",this.menu.getItem(index));
		},
		getGridLayout:function()
		{
			var rtn={rows:this.rows,columns:this.columns};
			if(rtn.rows===null&&rtn.columns===null)
			{
				rtn.columns=Math.ceil(Math.sqrt(this.menu.items.length));
			}
			if(rtn.rows==null)
			{
				rtn.rows=Math.ceil(this.menu.items.length/rtn.columns);
			}
			else if(rtn.columns==null)
			{
				rtn.columns=Math.ceil(this.menu.items.length/rtn.rows);
			}
			return rtn;
		},
		update:function()
		{
			this.domElement.innerHTML="";
			if(this.type===MENU.Types.TABLE&&this.header)
			{
				this.domElement.innerHTML='<span class="menuheader"><span>'+this.header.join('</span><span>')+'</span></span>'
			}
			if(this.type===MENU.Types.GRID&&this.menu.items.length>0)
			{
				var gridLayout=this.getGridLayout();
				
				for(var r=0,row=document.createElement("span");r<gridLayout.rows;r++,row=document.createElement("span"))
				{
					row.classList.add("row");
					this.domElement.appendChild(row);
					for(var c=0,index=r*gridLayout.columns;c<gridLayout.columns&&index<this.menu.items.length;c++,index=r*gridLayout.columns+c)
					{
						row.appendChild(this.convertItem(this.menu.items[index],index));
					}
				}
			}
			else
			{
				for(var i=0;i<this.menu.items.length;i++)
				{
					this.domElement.appendChild(this.convertItem(this.menu.items[i],i));
				}
			}
		},
		convertItem:function(item,index)
		{
			var converted=this.converter(item,index,this.converterInfo);
			var element=null;
			if(converted instanceof HTMLElement)
			{
				element=converted;
			}
			else
			{
				element=document.createElement("span");
				if(Array.isArray(converted))
				{
					converted="<span>"+converted.join("</span><span>")+"</span>";
				}
				element.innerHTML=converted;
			}
			
			element.classList.add("menuitem");
			if(this.menu.isSelected(item))
			{
				element.classList.add("selected");
			}
			if(this.menu.isDisabled(item))
			{
				element.classList.add("disabled");
			}
			if(this.menu.active===index)
			{
				element.classList.add("active");
			}
			return element;
		},
		addItem:function(item)
		{
			this.menu.addItem(item);
			if(this.type===MENU.Types.GRID) update();
			else this.domElement.appendChild(this.convertItem(item,this.menu.items.length-1));
			return this;
		},
		addAll:function(items)
		{
			for(var i=0;i<items.length;i++)
			{
				this.addItem(items[i]);
			}
			return this;
		},
		removeItem:function(item)
		{
			var index=this.menu.removeItem(item);
			if(index!==-1)
			{
				this.getItemDomElement(index).remove();
			}
			return index;
		},
		getItemDomElement:function(index)
		{
			if(this.type===MENU.Types.GRID)
			{
				var gridLayout=this.getGridLayout(),
				row=Math.floor(index/gridLayout.columns),
				column=index-row*gridLayout.columns;
				return this.domElement.children[row].children[column];
			}
			else if (this.type===MENU.Types.TABLE&&this.header)
			{
				return this.domElement.children[index+1];
			}
			else
			{
				return this.domElement.children[index];
			}
		},
		getItem:function(index)
		{
			var rtn=this.menu.getItem(index);
			rtn.domElement=this.getItemDomElement(index);
			return rtn;
		},
		getSelectedItems:function()
		{
			var rtn=[];
			for(var i=0;i<this.menu.selectedIndexs.length;i++)
			{
				rtn.push(this.getItem(this.menu.selectedIndexs[i]));
			}
			return rtn;
		},
		clear:function()
		{
			this.menu.clear();
			while(!this.header&&this.domElement.lastChild||this.domElement.lastChild!==this.domElement.firstChild)
			{
				this.domElement.lastChild.remove();
			}
			return this;
		},
        getActive:function()
        {
            return this.getItem(this.menu.active);
        },
		setActive:function(index)
		{
			this.menu.setActive(index);
			this._updateActive();
		}
	});
	GMOD("shortcut")({SelectionTypes:function(){return GMOD("Menu").SelectionTypes}},MENU);
	MENU.Types={
		VERTICAL:1,
		HORIZONTAL:2,
		TABLE:3,
		GRID:4
	};
	MENU.defaultConverter=function(item,index,selected)
	{
		return ""+item;
	};
	
	var reverseTypes={};
	for(var t in MENU.Types)
	{
		reverseTypes[MENU.Types[t]]=[t];
	}
	
	SMOD("GUI.Menu",MENU);
	
})(Morgas,Morgas.setModule,Morgas.getModule);
//Math/TalePlay.Math.Rect.js
(function(µ,SMOD,GMOD){

    var TALE=this.TalePlay=this.TalePlay||{};
	TALE.Math=TALE.Math||{};
	
	var SC=GMOD("shortcut")({
		POINT:"Math.Point"
	});
	
	var RECT=TALE.Rect=µ.Class(
	{
		init:function(position,size)
		{
			this.position=new SC.POINT();
			this.size=new SC.POINT();
			
			this.setPosition(position);
			this.setSize(size);
		},
		clone:function()
		{
			return new RECT(this.position,this.size);
		},
		setPosition:function(x,y)
		{
			this.position.set(x,y);
			return this;
		},
		setSize:function(x,y)
		{
			this.size.set(x,y);
			return this;
		},
		set:function(posX,posY,sizeX,sizeY)
		{
			this.position.set(posX,posY);
			this.size.set(sizeX,sizeY);
			return this;
		},
		setAbsolute:function(x1,y1,x2,y2)
		{
			var _x1=Math.min(x1,x2),
			_y1=Math.min(y1,y2),
			_x2=Math.max(x1,x2),
			_y=Math.max(y1,y2);
			this.set(_x1, _y1, _x2-_x1, _y2-_y1);
			return this;
		},
		getAbsolute:function()
		{
			return {min:this.position.clone(),max:this.position.clone().add(this.size)};
		},
		collide:function(rect)
		{
			if(rect===this)
			{
				return true;
			}
			else
			{
				var me=this.getAbsolute(),
				that=rect.getAbsolute();
				
				return !(me.min.x>=that.max.x||me.min.y>=that.max.y||me.max.x<=that.min.x||me.max.y<=that.min.y);
			}
		},
        contains:function(numberOrPoint,y)
        {
            var p=new SC.POINT(numberOrPoint,y);
            return (this.position.x <= p.x && this.position.x+this.size.x > p.x &&
                    this.position.y <= p.y && this.position.y+this.size.y > p.y);
        },
        copy:function(rect)
        {
        	this.position.set(rect.position);
        	this.size.set(rect.size);
        	return this;
        }
	});
	SMOD("Math.Rect",RECT);
})(Morgas,Morgas.setModule,Morgas.getModule);
//RPGPlayer/TalePlay.RPGPlayer.js
(function(µ,SMOD,GMOD){
	
	var Layer=GMOD("Layer");

	var SC=µ.getModule("shortcut")({
		det:"Detached",
		rj:"request.json",
		debug:"debug",
		idb:"IDBConn",
		
		Map:"GUI.Map",
		Dialog:"GUI.Dialog",
		GameSave:"RPGPlayer.GameSave"
		/* default modules:
		 * StartMenu
		 * RPGPlayer.GameMenu
		 */
	});
	
	var requestCallbacks={
		quests:{
			loaded:function quests_loaded(quests)
            {
            	for(var i in quests)
            	{
            		var quest=new RPGPlayer.Quest(quests[i]);
            		this.quests.set(i,quest);
            	}
            	return this;
            },
			error:function quest_load_error(error)
            {
				SC.debug(["Could not load Quests: ",error],0);
				return error;
            }
		},
		dialogs:{
			loaded:function dialogs_loaded(dialogs)
            {
            	for(var i in dialogs)
            	{
            		this.dialogs.set(i,dialogs[i]);
            	}
            	return this;
            },
			error:function dialogs_load_error(error)
            {
            	SC.debug(["Could not load Dialogs: ",error],0);
				return error;
            }
		}
	};

    var RPGPlayer=Layer.RPGPlayer=µ.Class(Layer,{
        init:function(param)
        {
            param=param||{};
            this.mega(param);
			this.domElement.classList.add("RPGPlayer");
			
			if(!param.board)
			{
				throw "board is undefined";
			}
			else
			{
				param.board.addLayer(this);
			}
			
			if(!param.gameName)
			{
				throw "gameName is undefined";
			}
			else
			{
				this.gameName=param.gameName;
				this.domElement.dataset.gamename=this.gameName;
				this.dbConn=new SC.idb(this.gameName);
			}
			this.createListener("ready quest-activate quest-complete quest-abort execute");
			
			this.baseUrl=param.baseUrl||"";
			this.imageBaseUrl=param.imageBaseUrl||param.baseUrl||"";
			this.mapBaseUrl=param.mapBaseUrl||param.baseUrl||"";
			this.gameSave=new SC.GameSave({
				cursor:new SC.Map.Cursor()
			});

            this.quests=new Map();
            this.questsReady=SC.rj(this.baseUrl+"quests.json",this).then(requestCallbacks.quests.loaded,requestCallbacks.quests.error);
            
            this.dialogs=new Map();
            SC.rj(this.baseUrl+"dialogs.json",this).then(requestCallbacks.dialogs.loaded,requestCallbacks.dialogs.error);
            
            this.focused=null;
			this.map=new SC.Map();
			this.map.addListener("trigger",this,"_onTrigger");
			
			this._StartMenu=(typeof param.startMenu==="function")?param.startMenu:GMOD(param.startMenu||"StartMenu");
			this._GameMenu=(typeof param.gameMenu==="function")?param.gameMenu:GMOD(param.gameMenu||"RPGPlayer.GameMenu");
			
			this._openStartMenu();
        },
        _openStartMenu:function()
        {
        	this.focused=null;
        	var smenu=new this._StartMenu({
        		dbConn:this.dbConn,
        		saveClass:SC.GameSave,
        		saveConverter:RPGPlayer.saveConverter,
        		newGameUrl:this.baseUrl+"newgame.json"
        	});
        	smenu.addListener("start:once",this,function(event)
			{
				event.source.destroy();
				this.focused=this.map;
				if(!this.has(this.map)) this.add(this.map);
				this.loadSave(event.save);
			});
			this.board.addLayer(smenu);
        },
		_openGameMenu:function(enableSave)
		{
			this.map.movingCursors["delete"](this.gameSave.getCursor());
			this.map.setPaused(true);
			this.focused=null;
			var gmenu=new this._GameMenu({
				dbConn:this.dbConn,
        		saveClass:SC.GameSave,
				saveConverter:RPGPlayer.saveConverter,
				saveData:enableSave?this.getSave():null
			});
			gmenu.addListener("close:once",this,function(event)
			{
				event.source.destroy();
				this.focused=this.map;
				this.map.setPaused(false);
			});
			this.board.addLayer(gmenu);
		},
		onController:function(event)
		{
			if(this.focused)
			{
				if(this.focused===this.map&&event.type==="buttonChanged")
				{
					switch (event.index)
					{
						case 1:
							//TODO speed up?
						case 2:
							this.focused[Layer._CONTROLLER_EVENT_MAP[event.type]](event);
							break;
						case 3:
							if(event.value==1) this._openGameMenu();
							break;
					}
				}
				else
				{
					this.focused[Layer._CONTROLLER_EVENT_MAP[event.type]](event);
				}
			}
		},
		loadSave:function(save)
		{
			this.setCursor(save.getCursor());
			
			var activeQuests=this.gameSave.getQuests();
			activeQuests.length=0;
			
			var saveQuests=save.getQuests();
        	for(var i=0;i<saveQuests.length;i++)
        	{
        		if(this.quests.has(saveQuests[i]))
        		{
        			if(activeQuests.indexOf(saveQuests[i])===-1)activeQuests.push(saveQuests[i]);
        		}
        		else
        		{
        			SC.debug("quest "+saveQuests[i]+" not found",SC.debug.LEVE.ERROR);
        		}
        	}
            this._changeMap(save.getMap(), save.getPosition());
            if(save.getActions())
            {
            	this.doActions(save.getActions());
            }
		},
		setCursor:function(cursor)
		{
			var _self=this;
			cursor.urls=cursor.urls.map(function(u){return u ? _self.imageBaseUrl+u : u});
			cursor.name=cursor.name||"";
			cursor.collision=cursor.collision!==false;
			this.gameSave.getCursor().fromJSON(cursor);
		},
		getSave:function()
		{
			this.gameSave.setTimeStamp(new Date());
			this.gameSave.setPosition(this.gameSave.getCursor().getPosition());
			
			var clone=new SC.GameSave();
			clone.fromJSON(JSON.parse(JSON.stringify(this.gameSave)));
			var cursor=clone.getCursor();
			var _self=this;
			cursor.urls=cursor.urls.map(function(u){return u ? u.slice(u.lastIndexOf("/")+1) : u});
			
			return clone;
		},
		_changeMap:function(name,position)
		{
			this.map.setPaused(true);
			return SC.rj(this.mapBaseUrl+name+".json",this).then(function changeMap_loaded(json)
			{
				var todo=json.cursors.concat(json.images);
				while(todo.length>0)
				{
					var image=todo.shift();
					image.url=this.imageBaseUrl+image.url;
				}
				json.position=position;
				var animation=this.map.movingCursors.get(this.gameSave.getCursor());
				this.map.fromJSON(json);
				this.gameSave.getCursor().setPosition(position);
				this.map.add(this.gameSave.getCursor());
				if(animation)
				{
					this.map.movingCursors.set(this.gameSave.getCursor(),animation);
				}
				this.map.setPaused(false);
				this.gameSave.setMap(name);
            	return name;
			},
			function changeMap_Error(error)
			{
				SC.debug(["Could not load Map: ",name,error],0);
				return error;
			});
		},
		_stopCursor:function()
		{
			if(this.gameSave.getCursor().direction)
			{
				this.gameSave.getCursor().direction.set(0);
			}
		},
		_showDialog:function(dialogName)
		{
			var dialog=this.dialogs.get(dialogName);
			if(dialog)
			{
				dialog.styleClass="panel";
				this.focused=new SC.Dialog(dialog);
				this.focused.addListener("dialogEnd:once",this,function(event)
				{
					this.focused.destroy();
					this.focused=this.map;
					if(event.actions)
					{
						this.doActions(event.actions);
					}
				});
				this.add(this.focused);
				this._stopCursor();
			}
		},
		_onTrigger:function(e)
		{
			this.doActions(e.value);
		},
		doActions:function(actions)
		{
			for(var i=0;i<actions.length;i++)
			{
				var a=actions[i];
				if(a.condition&&!this.resolveContidion(a.condition))
				{
					continue;
				}
				var activeQuests=this.gameSave.getQuests();
				var questIndex=null;
				var quest=null;
				switch (a.type) 
				{
					case "ABORT_QUEST":
						if((questIndex=activeQuests.indexOf(a.questName))!==-1) quest=this.quests.get(a.questName);
						if(quest)
						{
							activeQuests.splice(questIndex,1);
							this.fire("quest-abort",{value:quest});
						}
						break;
					case "RESOLVE_QUEST":
						if((questIndex=activeQuests.indexOf(a.questName))!==-1) quest=this.quests.get(a.questName);
						if(quest)
						{
							activeQuests.splice(questIndex,1);
							this.fire("quest-complete",{value:quest});
							actions=actions.concat(quest.resolve);
						}
						break;
					case "ACTIVATE_QUEST":
						quest=this.quests.get(a.questName);
						if(quest&&activeQuests.indexOf(a.questName)===-1)
						{
							activeQuests.push(a.questName);
							this.fire("quest-activate",{value:quest});
						}
						break;
					case "CHANGE_MAP":
						this._changeMap(a.mapName, a.position);
						break;
					case "SHOW_DIALOG":
						this._showDialog(a.dialogName);
						break;
					case "OPEN_GAMEMENU":
						this._openGameMenu(a.enableSave);
						break;
					case "EXECUTE":
						this.fire("execute",{action:a});
						break;
				}
			}
			return null;
		},
		resolveContidion:function(conditionString)
		{
			var rtn=false;
			var conditions=conditionString.split("||");
			for(var c=0;c<conditions.length&&!rtn;c++)
			{
				var aspectResult=true;
				var aspects=conditions[c].split("&");
				for(var a=0;a<aspects.length&&aspectResult;a++)
				{
					var terms=aspects[a].match(/(!?\w+)\s*:\s*([\w\s]*\w)/);
					if(terms)
					{
						var negative=false;
						if(terms[1][0]==="!")
						{
							negative=true;
							terms[1]=terms[1].slice(1);
						}
						switch(terms[1])
						{
							case "quest":
								var hasQuest=this.gameSave.getQuests().indexOf(terms[2])!==-1;
								aspectResult=hasQuest&&!negative||!hasQuest&&negative;
								break;
							case "item":
								break;
							case "quest_item":
								break;
							default:
								SC.debug.error("unknown term: "+aspects[a]);
								aspectResult=false;
								break;
						}
					}
					else
					{
						SC.debug.error("invalid term: "+aspects[a]);
						return false;
					}
				}
				rtn=aspectResult;
			}
			return rtn;
		}
    });
	RPGPlayer.saveConverter=function(save,index)
	{
		if(!save)
			return [index,"EMPTY","&nbsp;"];
		try
		{
			return [index,save.getTimeStamp().toLocaleString(),save.getMap()];
		}
		catch(error)
		{
			SC.debug([error,save],SC.debug.LEVEL.ERROR);
			return [index,"CORRUPT DATA","&nbsp;"];
		}
	};
	SMOD("RPGPlayer",RPGPlayer);

	RPGPlayer.Quest=µ.Class({
		init:function(param)
		{
			param=param||{};
			
			this.description=param.description||"NO DESCRIPTION!";
			this.tasks=param.tasks||null;
			this.resolve=param.resolve||[];
		},
		tasksCompleted:function(tasks)
		{//TODO
			return true;
		},
		clone:function(cloning)
		{
			if(!cloning)
			{
				cloning=new RPGPlayer.Quest();
			}
			cloning.name=this.name;
			cloning.description=this.description;
			cloning.resolve=this.resolve.slice();
			
			return cloning;
		},
		toJSON:function(){return this.name}
	});
	SMOD("RPGPlayer.Quest",RPGPlayer.Quest);
})(Morgas,Morgas.setModule,Morgas.getModule);
//Morgas/src/Morgas.util.function.rescope.js
(function(µ,SMOD,GMOD){
	
	var util=µ.util=µ.util||{};
	var uFn=util.function||{};
	
	/** rescope
	 * faster than bind but only changes the scope.
	 */
	uFn.rescope=function(fn,scope)
	{
		return function()
		{
			return fn.apply(scope,arguments);
		}
	};
	uFn.rescope.all=function(scope,keys)
	{
		keys=keys||Object.keys(scope);
		for(var i=0;i<keys.length;i++)
		{
			if(typeof scope[keys[i]]==="function")scope[keys[i]]=uFn.rescope(scope[keys[i]],scope);
		}
	};
	SMOD("rescope",uFn.rescope);
	
})(Morgas,Morgas.setModule,Morgas.getModule);
//Morgas/src/Morgas.Patch.js
(function(µ,SMOD,GMOD){

	/**Patch Class
	 * Adds functionality to an instance
	 * 
	 * Patches add themself in a the "patches" map of the instance with their patchID
	 * The core patch adds the "patches" map and the functions "hasPatch" and "getPatch"
	 * 
	 * Normaly a Patch does not add functions direct to the instance but uses listeners
	 * 
	 * 
	 * To create a new patch do sth. like this
	 * 
	 * var myPatch=µ.Class(µ.patch,
	 * {
	 * 		patchID:"myPatchID",
	 * 		patch:function(param,noListeners)
	 * 		{
	 * 			this.mega();// in case of µ.Patch its not necessary 
	 * 			//your constructor after instance is created
	 * 		}
	 * }
	 * 
	 * The "patch" function is called on the create event (when the constructor of the instance is finished)
	 * If the instance has no listeners, "noListeners" is true and "patch" was called immediately
	 * 
	 * If you want to override the init function do it like this:
	 * 
	 * var myPatch=µ.Class(mySuperPatch,
	 * {
	 * 		patchID:"myPatchID",
	 * 		init:function(instance,param)
	 * 		{
	 * 			//call constructor of superclass
	 * 			this.mega(instance,param);
	 * 
	 * 			if(this.instance!=null)
	 * 			{
	 * 				//your constructor
	 * 				//post patch:  this.instance.addListener(".created",function(param,noListeners){}) 
	 * 			}
	 * 		},
	 * 		patch:function(param,noListeners)
	 * 		{
	 * 			this.mega(param,noListeners);// in case of µ.Patch its not necessary 
	 * 			//post constructor
	 * 		}
	 * }  
	 */
	var _hasPatch=function hasPatch(patch)
	{
		return this.getPatch(patch)!==undefined;
	};
	var _getPatch=function getPatch(patch)
	{
		return this.patches[patch.patchID||patch.prototype.patchID];
	};
	var _callPatch=function()
	{
		this.patch(this._patchParam,false);
		delete this._patchParam;
	};
	
	var PATCH=µ.Patch=µ.Class(
	{
		init:function Patchinit(instance,param,doPatchNow)
		{
			if(instance.patches==null)
			{
				instance.patches={};
				instance.hasPatch=_hasPatch;
				instance.getPatch=_getPatch;
			}
			if(!instance.hasPatch(this))
			{
				this.instance=instance;
				instance.patches[this.patchID]=this;
				if(typeof this.instance.addListener==="function")//instanceof Listeners or has Listeners attached
				{
					this._patchParam=param;
					this.instance.addListener(".created:once",this,_callPatch);
					if(doPatchNow) this.patchNow();
				}
				else
				{
					this.patch(param,true);
				}
			}
		},
		patchNow:function()
		{
			if(this.instance.patches[this.patchID]===this&&typeof this.instance.removeListener==="function"&&this.instance.removeListener(".created",this))
			{
				this.patch(this._patchParam,false);
			}
		},
		patch:function patch(param,noListeners){},
		destroy:function()
		{
			if(this.instance.patches[this.patchID]==this) delete this.instance.patches[this.patchID]
			delete this.instance;
			this.mega();
		}
	});
	SMOD("Patch",PATCH);
	PATCH.hasPatch=function(instance, patch)
	{
		if(instance.hasPatch)
			return instance.hasPatch(patch);
		return false;
	};
	PATCH.getPatch=function(instance, patch)
	{
		if(instance&&instance.getPatch)
			return instance.getPatch(patch);
		return null;
	};
	
})(Morgas,Morgas.setModule,Morgas.getModule);
//Morgas/src/Morgas.NodePatch.js
(function(µ,SMOD,GMOD){

    var Patch=GMOD("Patch");
	var SC=GMOD("shortcut")({
		p:"proxy",
        d:"debug"
	});

	var NODE=µ.NodePatch=µ.Class(Patch,{
		patchID:"NodePatch",
		patch:function(aliasMap)
		{

			this.parent=null;
			this.children=[];

			aliasMap=aliasMap||{};
            this.aliasMap={};
            var proxyMap={};
			for (var i=0;i<NODE.Aliases.length;i++)
			{
                var target=NODE.Aliases[i];
                if(target in aliasMap)
                {
                    this.aliasMap[target]=aliasMap[target];
                    if(this.instance[this.aliasMap[target]]===undefined)
                    {
                        proxyMap[target]=this.aliasMap[target];
                    }
                }
			}
            SC.p(getNode,proxyMap,this.instance);

			for (var i=0;i<NODE.Symbols.length;i++)
			{
                var symbol=NODE.Symbols[i];
                if(symbol in aliasMap)
                {
                    setSymbol(this,symbol,aliasMap[symbol])
                }
			}
		},
		addChild:function(child,index)
		{
			var childPatch=getNode(child),alias;
            var childIndex=this.children.indexOf(child);
            if(!childPatch)
            {//is not a Node
            	SC.d([child," is not a Node"]);
            	return false;
            }
            else if(childIndex===-1)
			{//has not that child jet
				if(index!==undefined)
				{
					this.children.splice(index,0,child);
				}
				else
				{
                    index=this.children.length;
					this.children.push(child);
				}
				if(childPatch.parent!==null&&childPatch.parent!==this.instance)
				{//has other parent
					//remove other parent
                    alias=childPatch.aliasMap.remove;
                    if(alias)
                    {
                        if(!child[alias]())
                        {//won't var go of parent
                            SC.d(["rejected remove child ",child," from old parent ",childPatch.parent],SC.d.LEVEL.INFO);
                            this.children.splice(index,1);
                            return false;
                        }
                    }
                    else
                    {
					    childPatch.remove();
                    }
				}
				//add to parent
				alias=childPatch.aliasMap.setParent;
                if(alias)
                {
                    if(!child[alias](this.instance))
                    {//won't attach to me
                        SC.d(["rejected to set parent",this.instance," of child ",child],SC.d.LEVEL.INFO);
                        this.children.splice(index,1);
                        return false;
                    }
                }
                else
                {
                    childPatch.setParent(this.instance);
                }
			}
			return true;
		},
		removeChild:function(child)
		{
			var index=this.children.indexOf(child);
			if(index!==-1)
			{//has child
				this.children.splice(index, 1);
				var childPatch=getNode(child);
				if(childPatch&&childPatch.parent===this.instance)
				{//is still parent of child
					var alias=childPatch.aliasMap.remove;
	                if(alias)
	                {
	                    if(!child[alias]())
	                    {//won't var go of me
	                        SC.d(["rejected remove child ",child," from parent ",this.instance],SC.d.LEVEL.INFO);
	                        this.children.splice(index,0,child);
	                        return false;
	                    }
	                }
	                else
	                {
					    childPatch.remove();
	                }
                }
			}
			return true;
		},
		setParent:function(parent)
		{
			var parentPatch=getNode(parent),alias;
			if(!parentPatch)
			{//is not a Node
            	SC.d([parent," is not a Node"]);
            	return false;
			}
			if(parent&&this.parent!==parent)
			{
				if(this.parent!==null)
				{//has other parent
					//remove other parent
                    alias=childPatch.aliasMap.remove;
                    if(alias)
                    {
                        if(!child[alias]())
                        {//won't var go of parent
                            SC.d(["rejected remove child ",child," from old parent ",childPatch.parent],SC.d.LEVEL.INFO);
                            this.children.splice(index,1);
                            return false;
                        }
                    }
                    else
                    {
					    childPatch.remove();
                    }
				}
				this.parent=parent;
				alias=parentPatch.aliasMap.addChild;
				if(parentPatch.children.indexOf(this.instance)===-1)
				{//not already called from addChild
					if(alias)
					{
						if(!this.parent[alias](this.instance))
						{//won't accept me
							SC.d(["rejected to add child ",this.instance," to parent ",parent],SC.d.LEVEL.INFO);
							this.parent=null;
							return false;
						}
					}
					else
					{
						parentPatch.addChild(this.instance);
					}
				}
			}
            return true;

		},
		remove:function()
		{
			if(this.parent!==null)
			{
				var oldParent=this.parent;
				var oldParentPatch=getNode(oldParent);
				this.parent=null;
				if(oldParentPatch.children.indexOf(this.instance)!==-1)
				{//is still old parents child
					var alias=oldParentPatch.aliasMap.removeChild;
					if(alias)
					{
						if(!oldParent[alias](this.instance))
						{//I won't var go of parent
							this.parent=oldParent;
							SC.d(["rejected to remove child ",this.instance," from parent ",this.parent],SC.d.LEVEL.INFO);
							return false;
						}
					}
					else
					{
						oldParentPatch.removeChild(this.instance);
					}
				}
			}
			return true;
		},
		hasChild:function(child)
		{
			return this.children.indexOf(child)!==-1;
		},
        isChildOf:function(parent)
        {
            var parentPatch=getNode(parent);
            return parent&&parent.hasChild(this.instance);
        }
	});
	NODE.Aliases=["addChild","removeChild","remove","setParent","hasChild"];
    NODE.Symbols=["parent","children"];
    NODE.BasicAliases={
        parent:"parent",
        children:"children",
        addChild:"addChild",
        removeChild:"removeChild",
        remove:"remove",
        setParent:"setParent",
        hasChild:"hasChild"
    };
	NODE.Basic=µ.Class({
		init:function(aliasMap)
		{
			aliasMap=aliasMap||{};
			var map={};
            for(var i=0,targets=Object.keys(NODE.BasicAliases);i<targets.length;i++)
			{
            	var target=targets[i];
				var alias=aliasMap[target];
				if(alias===undefined)
				{
					alias=NODE.BasicAliases[target];
				}
				if(alias!==null)
				{
					map[target]=""+alias;
				}
			}
			new NODE(this,map);
		}
	});
	
	var getNode=function(obj)
	{
        if(typeof obj==="string")
        {//used as proxy getter
            obj=this
        }
        if(obj instanceof NODE)
        {
            return obj;
        }
        else
        {
        	return Patch.getPatch(obj,NODE);
        }
	};
	//TODO replace with GMOD("shortcut") dynamic
    var setSymbol=function(node,symbol,alias)
    {
        if(typeof node[symbol]!=="function")
        {
            Object.defineProperty(node.instance,alias,{
                get:function()
                {
                    return node[symbol];
                },
                set:function(arg)
                {
                    node[symbol]=arg;
                }
            })
        }
        else
        {
            node.instance[alias]=node[symbol];
        }
    };
	
	SMOD("NodePatch",NODE);
})(Morgas,Morgas.setModule,Morgas.getModule);
//Morgas/src/DB/Morgas.DB.js
(function(µ,SMOD,GMOD){
	/**
	 * Depends on	: Morgas
	 * Uses			: util.object, Detached
	 *
	 * Database Classes
	 *
	 */

	var SC=GMOD("shortcut")({
		debug:"debug",
		det:"Detached"
	});
	
	var DB=µ.DB=µ.DB||{};
	
	var DBC,TRAN,STMT,DBOBJECT,REL,FIELD;
	
	DBC=DB.Connector=µ.Class(
	{
		/* override these */
		init:function()
		{
			SC.det.detacheAll(this,["save","load","delete","destroy"]);
		},
		
		save:function(signal,objs)
		{
			/*
			objs=[].concat(objs);
			var sortedObjs=DBC.sortObjs(objs);
			*/
			throw new Error("abstract Class DB.Connector");
		},
		load:function(signal,objClass,pattern)
		{
			throw new Error("abstract Class DB.Connector");
		},
		"delete":function(signal,objClass,toDelete)
		{
			/*
			var toDelete=DBC.getDeletePattern(objClass,toDelete);
			*/
			throw new Error("abstract Class DB.Connector");
		},
		destroy:function()
		{
			throw new Error("abstract Class DB.Connector");
		},
		
		/* these should be same for everyone*/
		saveChildren:function(obj,relationName)
		{
			return this.save(obj.getChildren(relationName));
		},
		saveFriendships:function(obj,relationName)
		{
			var rel=obj.relations[relationName],
				friends=obj.friends[relationName];
			if(!friends)
			{
				SC.debug("no friends in relation "+relationName+" found",2);
				return new SC.det.complete(false);
			}
			var fRel=friends[0].relations[rel.targetRelationName],
				id=obj.getID();
			if(id==null)
			{
				SC.debug("friend id is null",2);
				return new SC.det.complete(false);
			}
			var fids=[];
			for(var i=0;i<friends.length;i++)
			{
				var fid=friends[i].getID();
				if(fid!=null)
					fids.push(fid);
			}
			if(fids.length===0)
			{
				SC.debug("no friend with friend id found");
				return new SC.det.complete(false);
			}
			var tableName=DBC.getFriendTableName(obj.objectType,relationName,friends[0].objectType,rel.targetRelationName),
				idName=obj.objectType+"_ID",
				fidName=friends[0].objectType+"_ID",
				toSave=[];
			if (rel.relatedClass===fRel.relatedClass)
			{
				fidName+=2;
			}
			for(var i=0;i<fids.length;i++)
			{
				toSave.push(new DBFRIEND(tableName,idName,id,fidName,fids[i]));
			}
			return this.save(toSave);
		},
		
		loadParent:function(obj,relationName)
		{
			var relation=obj.relations[relationName],
				parentClass=relation.relatedClass,
				fieldName=relation.fieldName;
			return this.load(parentClass,{ID:obj.getValueOf(fieldName)}).then(function(result)
			{
				var parent=result[0];
				parent.addChild(relationName,obj);
				this.complete(parent);
			});
		},
		loadChildren:function(obj,relationName,pattern)
		{
			var relation=obj.relations[relationName],
				childClass=rel.relatedClass,
				fieldName=relation.fieldName;
			pattern[fieldName]=this.getID();
			return this.load(childClass,pattern).then(function(children)
			{
				obj.addChildren(children);
				this.complete(children);
			});
		},
		loadFriends:function(obj,relationName,pattern)
		{
			var _self=this,
				rel=obj.relations[relationName],
				friendClass=rel.relatedClass,
				fRel=new friendClass().relations[rel.targetRelationName],
				id=obj.objectType+"_ID",
				fid=friendClass.prototype.objectType+"_ID",
				type=DBC.getFriendTableName(obj.objectType,relationName,friendClass.prototype.objectType,rel.targetRelationName),
				fPattern={};
			
			if (rel.relatedClass===fRel.relatedClass)
			{
				fid+=2;
			}
			fPattern[id]=obj.getID();
			var friendship=DBFRIEND.Generator(type,id,fid);
			
			var p=this.load(friendship,fPattern);
			
			if (rel.relatedClass===fRel.relatedClass)
			{
				p=p.then(function(results)
				{
					var signal=this;
					fPattern[fid]=fPattern[id];
					delete fPattern[id];
					_self.load(friendship,fPattern).then(function(results2)
					{
						for(var i=0;i<results2.length;i++)
						{
							var t=results2[i].fields[id].value;
							results2[i].fields[id].value=results2[i].fields[fid].value;
							results2[i].fields[fid].value=t;
						}
						signal.complete(results.concat(results2));
					},SC.debug);
				},SC.debug)
			}
			return p.then(function(results)
			{
				pattern.ID=results.map(function(val)
				{
					return val.fields[fid].value;
				});
				return _self.load(friendClass,pattern);
			},SC.debug);
		},
		deleteFriendships:function(obj,relationName)
		{
			var rel=obj.relations[relationName],
				friends=obj.friends[relationName];
			if(!friends)
			{
				SC.debug("no friends in relation "+relationName+" found",2);
				return new SC.det.complete(false);
			}
			var fRel=friends[0].relations[rel.targetRelationName],
				id=obj.getID();
			if(id==null)
			{
				SC.debug("friend id is null",2);
				return new SC.det.complete(false);
			}
			var fids=[];
			for(var i=0;i<friends.length;i++)
			{
				var fid=friends[i].getID();
				if(fid!=null)
					fids.push(fid);
			}
			if(fids.length===0)
			{
				SC.debug("no friend with friend id found");
				return new SC.det.complete(false);
			}
			var tableName=DBC.getFriendTableName(obj.objectType,relationName,friends[0].objectType,rel.targetRelationName),
				idName=obj.objectType+"_ID",
				fidName=friends[0].objectType+"_ID",
				toDelete=[];
			if (rel.relatedClass===fRel.relatedClass)
			{
				fidName+=2;
				var pattern={};
				pattern[idName]=fids;
				pattern[fidName]=id;
				toDelete.push(pattern);
			}
			var pattern={};
			pattern[idName]=id;
			pattern[fidName]=fids;
			toDelete.push(pattern);
			
			var wait=[],
			fClass=DBFRIEND.Generator(tableName,idName,fidName);
			for(var i=0;i<toDelete.length;i++)
			{
				wait.push(this["delete"](fClass,toDelete[i]));
			}
			return new SC.det(wait)
		}
	});

	DBC.sortObjs=function(objs)
	{
		var rtn={friend:{},fresh:{},preserved:{}};
		for(var i=0;i<objs.length;i++)
		{
			var obj=objs[i],
			type=(obj instanceof DBFRIEND ? "friend" :(obj.getID()===undefined ? "fresh" : "preserved")),
			objType=obj.objectType;
			
			if(rtn[type][objType]===undefined)
			{
				rtn[type][objType]=[];
			}
			rtn[type][objType].push(obj);
		}
		return rtn;
	};
	//make toDelete a Pattern from Number, DB.Object or Array
	DBC.getDeletePattern=function(objClass,toDelete)
	{
		var type=typeof toDelete;
		if(type==="number" || toDelete instanceof DB.Object)
		{
			toDelete=[toDelete];
		}
		if(Array.isArray(toDelete))
		{
			for(var i=0;i<toDelete.length;i++)
			{
				if(toDelete[i] instanceof objClass)
				{
					toDelete[i]=toDelete[i].getID();
				}
			}
			toDelete={ID:toDelete};
		}
		return toDelete;
	};
	DBC.getFriendTableName=function(objType,relationName,friendType,friendRelationName)
	{
		return [objType,relationName,friendType,friendRelationName].sort().join("_");
	};
	SMOD("DBConn",DBC);
	
	DBOBJECT=DB.Object=µ.Class(
	{
		objectType:null,
		init:function(param)
		{
			param=param||{};
			if(this.objectType==null)
				throw "DB.Object: objectType not defined";
						
			this.fields={};
			
			this.relations={};
			this.parents={};	//n:1
			this.children={};	//1:n
			this.friends={};	//n:m
			
			this.addField("ID",FIELD.TYPES.INT,param.ID,{UNIQUE:true,AUTOGENERATE:true});
		},
		addRelation:function(name,relatedClass,type,targetRelationName,fieldName)
		{
			this.relations[name]=new REL(relatedClass,type,targetRelationName||name,fieldName);
		},
		addField:function(name,type,value,options)
		{
			this.fields[name]=new FIELD(type,value,options);
		},
		getValueOf:function(fieldName){return this.fields[fieldName].getValue();},
		setValueOf:function(fieldName,val){if(fieldName!="ID")this.fields[fieldName].setValue(val);},
		setID:function(val)
		{
			this.fields["ID"].setValue(val);
			for(var c in this.children)
			{
				var children=this.children[c];
				for(var i=0;i<children.length;i++)
				{
					children[i]._setParent(this.relations[c],this);
				}
			}
		},
		getID:function(){return this.getValueOf("ID");},
		getParent:function(relationName)
		{
			return this.parents[relationName];
		},
		_setParent:function(pRel,parent)
		{
			var cRel=this.relations[pRel.targetRelationName];
			this.parents[pRel.targetRelationName]=parent;
			this.setValueOf(cRel.fieldName,parent.getValueOf(pRel.fieldName));
		},
		_add:function(container,relationName,value)
		{
			var c=container[relationName]=container[relationName]||[];
			if(c.indexOf(value)==-1)
				c.push(value);
		},
		_get:function(container,relationName)
		{
			return (container[relationName]||[]).slice(0);
		},
		addChild:function(relationName,child)
		{
			if(this.relations[relationName].type==REL.TYPES.CHILD)
			{
				this._add(this.children,relationName,child);
				child._setParent(this.relations[relationName],this);
			}
		},
		addChildren:function(relationName,children)
		{
			for(var i=0;i<children.length;i++)
			{
				this.addChild(relationName,children[i]);
			}
		},
		getChildren:function(relationName)
		{
			return this._get(this.children,relationName);
		},
		addFriend:function(relationName,friend)
		{
			if(this.relations[relationName].type==REL.TYPES.FRIEND)
			{
				this._add(this.friends,relationName,friend);
				friend._add(friend.friends,this.relations[relationName].targetRelationName,this);
			}
		},
		addFriends:function(relationName,friends)
		{
			for(var i=0;i<friends.length;i++)
			{
				this.addFriend(relationName,friends[i]);
			}
		},
		getFriends:function(relationName)
		{
			return this._get(this.friends,relationName);
		},
		toJSON:function()
		{
			var rtn={};
			for(var f in this.fields)
			{
				rtn[f]=this.fields[f].toJSON();
			}
			return rtn;
		},
		fromJSON:function(jsonObject)
		{
			for(var i in this.fields)
			{
				if(jsonObject[i]!==undefined)
				{
					this.fields[i].fromJSON(jsonObject[i]);
				}
			}
			return this;
		},
		toString:function()
		{
			return JSON.stringify(this);
		}
	});
	SMOD("DBObj",DBOBJECT);
	
	var DBFRIEND=DB.Firendship=µ.Class(
	{
		init:function(type,fieldName1,value1,fieldName2,value2)
		{
			this.objectType=type;
			this.fields={};
			this.fields[fieldName1]=new FIELD(FIELD.TYPES.INT,value1);
			this.fields[fieldName2]=new FIELD(FIELD.TYPES.INT,value2);
		},
		toJSON:DBOBJECT.prototype.toJSON,
		fromJSON:DBOBJECT.prototype.fromJSON
	});
	DBFRIEND.Generator=function(type,fieldname1,fieldname2)
	{
		return µ.Class(DBFRIEND,
		{
			objectType:type,
			init:function(){
				this.mega(type,fieldname1,null,fieldname2,null);
			}
		});
	};
	SMOD("DBFriend",DBFRIEND);
	
	REL=DB.Relation=µ.Class(
	{
		init:function(relatedClass,type,targetRelationName,fieldName)
		{
			if(fieldName==null)
			{
				if(type==REL.TYPES.PARENT)
					throw "DB.Relation: "+type+" relation needs a fieldName";
				else
					fieldName="ID";
			}
			this.type=type;
			this.relatedClass=relatedClass;
			this.fieldName=fieldName;
			this.targetRelationName=targetRelationName;
		}
	});
	REL.TYPES={
		"PARENT"	:-1,
		"FRIEND"	:0,
		"CHILD"		:1
	};
	SMOD("DBRel",REL);
	
	FIELD=DB.Field=µ.Class(
	{
		init:function(type,value,options)
		{
			this.type=type;
			this.value=value;
			this.options=options||{};	// depends on connector
		},
		setValue:function(val)
		{
			this.value=val;
		},
		getValue:function(){return this.value;},
		toJSON:function()
		{
			switch(this.type)
			{
				case FIELD.TYPES.DATE:
					var date=this.getValue();
					if(date instanceof Date)
						return date.getUTCFullYear()+","+date.getUTCMonth()+","+date.getUTCDate()+","+date.getUTCHours()+","+date.getUTCMinutes()+","+date.getUTCSeconds()+","+date.getUTCMilliseconds();
					break;
				default:
					return this.getValue();
			}
		},
		fromJSON:function(jsonObj)
		{
			switch(this.type)
			{
				case FIELD.TYPES.DATE:
					this.value=new Date(Date.UTC.apply(Date,jsonObj.split(",")));
					break;
				default:
					this.value=jsonObj;
			}
		},
		toString:function()
		{
			return JSON.stringify(this);
		},
		fromString:function(val)
		{
			switch(this.type)
			{
				case FIELD.TYPES.BOOL:
					this.value=!!(~~val);
					break;
				case FIELD.TYPES.INT:
					this.value=~~val;
					break;
				case FIELD.TYPES.DOUBLE:
					this.value=1*val;
					break;
				case FIELD.TYPES.DATE:
					this.fromJSON(JSON.parse(val));
					break;
				case FIELD.TYPES.STRING:
				case FIELD.TYPES.JSON:
				default:
					this.value=JSON.parse(val);
					break;
			}
		}
	});
	FIELD.TYPES={
		"BOOL"		:0,
		"INT"		:1,
		"DOUBLE"	:2,
		"STRING"	:3,
		"DATE"		:4,
		"JSON"		:5,
		"BLOB"		:6
	};
	SMOD("DBField",FIELD);
})(Morgas,Morgas.setModule,Morgas.getModule);
//TalePlay.Controller.Mapping.js
(function(µ,SMOD,GMOD){
	
	var CTRL=GMOD("Controller");
	var DBObj=GMOD("DBObj");
	
	var SC=GMOD("shortcut")({
		DBField:"DBField"
	});
	
	var MAPPING=CTRL.Mapping=µ.Class(DBObj,{
		objectType:"ControllerMapping",
		init:function(param)
		{
			param=param||{};
			this.mega(param);
			
			this.addField("name",SC.DBField.TYPES.STRING,param.name||"");
			this.addField("type",SC.DBField.TYPES.STRING,param.type||"");
			
			var data={
					buttons:{},
					buttonAxis:{},
					axes:{}
			};
			if(param.data)
			{
				data.buttons=param.data.buttons||data.buttons;
				data.buttonAxis=param.data.buttonAxis||data.buttonAxis;
				data.axes=param.data.axes||data.axes;
			}
			this.addField("data",SC.DBField.TYPES.JSON,  data);
		},
		setMapping:function(type,from,to)
		{
			var mapping=this.getValueOf("data")[type];
			if(mapping)
			{
				if(to===undefined||to===null)
				{
					delete mapping[from];
				}
				else
				{
					mapping[from]=to;
				}
			}
		},
		getMapping:function(type,from)
		{
			return this.getValueOf("data")[type][from];
		},
		removeMapping:function(type,from)
		{
			this.setMapping(type, from);
		},
		hasMapping:function(type,from)
		{
			var mapping=this.getValueOf("data")[type];
			if(mapping)
			{
				return from in mapping;
			}
			return false;
		},
		setMappingAll:function(type,map)
		{
			for(var i in map)
			{
				this.setMapping(type, i, map[i]);
			}
		},

		setButtonMapping:function(from,to){this.setMapping("buttons", from, to);},
		getButtonMapping:function(from)
		{
			var to=this.getMapping("buttons", from);
			if(to===undefined)
				to=from;
			return to;
		},
		removeButtonMapping:function(from){this.removeMapping("buttons", from)},
		hasButtonMapping:function(from){return this.hasMapping("buttons", from)},

		setButtonAxisMapping:function(from,to){this.setMapping("buttonAxis", from, to);},
		getButtonAxisMapping:function(from){return this.getMapping("buttonAxis", from)},
		removeButtonAxisMapping:function(from){this.removeMapping("buttonAxis", from)},
		hasButtonAxisMapping:function(from){return this.hasMapping("buttonAxis", from)},

		setAxisMapping:function(from,to){this.setMapping("axes", from, to);},
		getAxisMapping:function(from)
		{
			var to=this.getMapping("axes", from);
			if(to===undefined)
				to=from;
			return to;
		},
		removeAxisMapping:function(from){this.removeMapping("axes", from)},
		hasAxisMapping:function(from){return this.hasMapping("axes", from)},
		
		convertAxisValue:function(index,value){return Math.sign(1/index)*value;},
		
		getReverseMapping:function()
		{
			var mapping=this.getValueOf("data");
			var reverse={
				buttons:{},
				buttonAxis:{},
				axes:{}
			};
			for(var type in mapping)
			{
				for(var i in mapping[type])
				{
					var index=mapping[type][i];
					if(type==="axes"&&1/index<0)
					{
						index=-index;
						i="-"+i;
					}
					else if(index===0&&1/index<0)
					{
						index="-0";
					}
					reverse[type][index]=i;
				}
			}
			return reverse;
		}
		
	});
	SMOD("Controller.Mapping",MAPPING);
})(Morgas,Morgas.setModule,Morgas.getModule);
//Morgas/src/Morgas.util.function.bind.js
(function(µ,SMOD,GMOD){
	
	var util=µ.util=µ.util||{};
	var uFn=util.function||{};
	
	/** bind
	 * For more compatibility redefine the module.
	 * For more flexibility consider Callback
	 */
	uFn.bind=Function.bind.call.bind(Function.bind);
	SMOD("bind",uFn.bind);
	
})(Morgas,Morgas.setModule,Morgas.getModule);
//TalePlay.Menu.js
(function(µ,SMOD,GMOD){

    var TALE=this.TalePlay=this.TalePlay||{};
	
	var MENU=TALE.Menu=µ.Class({
		init:function(param)
		{	
			param=param||{};
			
			this.items=param.items||[];
			this.selectionType=param.selectionType||MENU.SelectionTypes.MULTI;
			this.loop=param.loop!==false;
			
			this.selectedIndexs=[];
			this.disabledIndexs=[];
			this.active=-1;
			
			if (param.active!==undefined&&param.active>-1&&param.active<this.items.length)
			{
				this.active=param.active;
			}
			if(param.selected!==undefined)
			{
				for(var i=0;i<param.selected.length;i++)this.addSelect(param.selected[i]);
			}
			if(param.disabled!==undefined)
			{
				for(var i=0;i<param.disabled.length;i++)this.setDisabled(param.disabled[i],true);
			}
		},
		addItem:function(item)
		{
			this.items.push(item);
			return this;
		},
		addAll:function(items)
		{
			for(var i=0;i<items.length;i++)
			{
				this.addItem(items[i]);
			}
			return this;
		},
		removeItem:function(item)
		{
			var index=this.items.indexOf(item);
			if(index!==-1)
			{
				this.items.splice(index, 1);
				var sIndex=this.selectedIndexs.indexOf(index);
				if(sIndex!==-1)
				{
					this.selectedIndexs.splice(sIndex, 1);
				}
				var dIndex=this.disabledIndexs.indexOf(index);
				if(dIndex!==-1)
				{
					this.disabledIndexs.splice(sIndex, 1);
				}
				if(this.active>index)
				{
					this.active--;
				}
				else if (this.active===index)
				{
					this.setActive(-1);
				}
			}
			return index;
		},
		getItem:function(index)
		{
			return {
				index:index,
				value:this.items[index],
				active:this.active===index,
				selected:this.selectedIndexs.indexOf(index)!==-1,
				disabled:this.disabledIndexs.indexOf(index)!==-1
			};
		},
		clearSelect:function()
		{
			this.selectedIndexs.length=0;
		},
		isSelected:function(item)
		{
			var index=this.items.indexOf(item);
			if(index===-1)
			{
				index=item;
			}
			return this.selectedIndexs.indexOf(index)!==-1;
		},
		addSelect:function(item)
		{
			if(this.selectionType===MENU.SelectionTypes.NONE)
			{
				return false;
			}
			
			var index=this.items.indexOf(item);
			if(index===-1)
			{
				index=item;
			}
			if(this.items.hasOwnProperty(index)&&this.selectedIndexs.indexOf(index)===-1)
			{
				if(this.selectionType===MENU.SelectionTypes.SINGLE)
				{
					this.selectedIndexs[0]=index;
				}
				else
				{
					this.selectedIndexs.push(index);
				}
				return true;
			}
			return false;
		},
		removeSelect:function(item)
		{
			var index=this.items.indexOf(item);
			if(index===-1)
			{
				index=item;
			}
			index=this.selectedIndexs.indexOf(index);
			if(index!==-1)
			{
				this.selectedIndexs.splice(index,1);
				return true;
			}
			return false;
		},
		toggleSelect:function(item,isIndex)
		{
			if(this.selectionType===MENU.SelectionTypes.NONE)
			{
				return false;
			}
			
			var index=isIndex?item:this.items.indexOf(item);
			if(index===-1)
			{
				index=item;
			}
			if(this.items.hasOwnProperty(index))
			{
				var sIndex=this.selectedIndexs.indexOf(index);
				if(sIndex===-1)
				{
					if(this.selectionType===MENU.SelectionTypes.SINGLE)
					{
						this.selectedIndexs[0]=index;
					}
					else
					{
						this.selectedIndexs.push(index);
					}
					return true;
				}
				else
				{
					this.selectedIndexs.splice(sIndex,1);
					return false;
				}
			}
			return null;
		},
        getActive:function()
        {
            return this.getItem(this.active);
        },
		setActive:function(index)
		{
			var min=-1,max=this.items.length-1;
			index=!(min<=index)?min:(max<index?max:index);
			if(this.active!==index)
			{
				this.active=index;
			}
		},
		moveActive:function(val)
		{
			var next=this.active+val;
			if(!this.loop)
			{
				next=0>next?0:next;
			}
			else
			{
				if(this.active===-1&&val<0)
				{
					next++;
				}
				next=next%this.items.length;
				if(next<0)
				{
					next=this.items.length+next;
				}
			}
			this.setActive(next);
		},
		toggleActive:function()
		{
			return this.toggleSelect(this.active);
		},
		getSelectedItems:function()
		{
			var rtn=[];
			for(var i=0;i<this.selectedIndexs.length;i++)
			{
				rtn.push(this.getItem(this.selectedIndexs[i]));
			}
			return rtn;
		},
		setDisabled:function(item,boolen)
		{
			var index=this.items.indexOf(item);
			if(index===-1)
			{
				index=item;
			}
			if(this.items.hasOwnProperty(index)&&this.disabledIndexs.indexOf(index)===-1)
			{
				this.disabledIndexs.push(index);
				return true;
			}
			return false;
		},
		isDisabled:function(item)
		{
			var index=this.items.indexOf(item);
			if(index===-1)
			{
				index=item;
			}
			return this.disabledIndexs.indexOf(index)!==-1;
		},
		getType:function()
		{
			return this.selectionType;
		},
		setType:function(selectionType)
		{
			switch(selectionType)
			{
				case MENU.SelectionTypes.NONE:
					this.selectedIndexs.length=0;
					break;
				case MENU.SelectionTypes.SINGLE:
					this.selectedIndexs.length=1;
					break;
			}
			this.selectionType=selectionType;
		},
		clear:function()
		{
			this.items.length=this.selectedIndexs.lengt=this.disabledIndexs.length=0;
			this.active=-1;
			return this;
		}
	});
	
	MENU.SelectionTypes={
		NONE:1,
		SINGLE:2,
		MULTI:3
	};
	
	SMOD("Menu",MENU);
	
})(Morgas,Morgas.setModule,Morgas.getModule);
//GUI/TalePlay.GUIElement.ControllerConfig.js
(function(µ,SMOD,GMOD,HMOD){
	
	var SC=GMOD("shortcut")({
		rs:"rescope",
		mapping:"Controller.Mapping"
	});
	
	var controllerTypes={
		Keyboard:1,
		Gamepad:2
	};
	
	var GUI=GMOD("GUIElement");
	
	var getTitle=function(code)
	{
		var title="";
		switch(code)
		{
			case 32:
			case " ":
				title="space";
				break;
			case 16:
				title="shift";
				break;
			case 19:
				title="pause";
				break;
			case 13:
				title="enter";
				break;
			case 37:
				title="left";
				break;
			case 38:
				title="up";
				break;
			case 39:
				title="right";
				break;
			case 40:
				title="down";
				break;
			case 96:
				title="num 0";
				break;
			case 97:
				title="num 1";
				break;
			case 98:
				title="num 2";
				break;
			case 99:
				title="num 3";
				break;
			case 100:
				title="num 4";
				break;
			case 101:
				title="num 5";
				break;
			case 102:
				title="num 6";
				break;
			case 103:
				title="num 7";
				break;
			case 104:
				title="num 8";
				break;
			case 105:
				title="num 9";
				break;
			default:
				if(typeof code==="string")
				{
					title=code;
				}
				else
				{
					title=String.fromCharCode(code);
				}
		}
		
		return title;
	};
	var getHTML=function(buttons,analogSticks,name)
	{
		var html='';
		if(name)
		{
			html+='<input type="text" data-field="name"';
			if(typeof name==="string")
			{
				html+=' value="'+name+'"';
			}
			html+='>';
		}
		html+='<div class="buttons">';
		for(var i=0;i<buttons;i++)
		{
			html+=
			'<span class="button">'+
				'<span>'+i+'</span>'+
				'<input type="text" size="3" data-button="'+i+'">'+
			'</span>';
		}
		html+='</div><div class="analogSticks">';
		for(var i=0;i<analogSticks*2;i+=2)
		{
			html+=
			'<span class="analogStick">'+
				'<span>'+(i/2)+'</span>'+
				'<label class="axisButton" for="axisButton'+(i/2)+'"> buttons </label><input class="axisButton" type="checkbox" id="axisButton'+(i/2)+'">'+
				'<span>'+
					'<input type="text" size="3" class="axis-y pos" data-axis="'+(i+1)+'">'+
					'<input type="text" size="3" class="axis-x pos" data-axis="'+i+'">'+
					'<input type="text" size="3" class="axis-y neg" data-axis="-'+(i+1)+'">'+
					'<input type="text" size="3" class="axis-x neg" data-axis="-'+i+'">'+
				'</span>'+
			'</span>';
		}
		html+='</div><button data-value="ok">OK</button><button data-value="cancel">Cancel</button>';
		return html;
	};
	
	
	var CONF=GUI.ControllerConfig=µ.Class(GUI,
	{
		init:function(param)
		{
			param=param||{};
			this.mega(param);
			SC.rs.all(this,["onInputChange","onClick"]);
			this.createListener("submit");
			
			this.addStyleClass("ControllerConfig");
			this.domElement.addEventListener("keydown",this.onInputChange,true);
			this.domElement.addEventListener("click",this.onClick,true);
			
			this.domElement.innerHTML=getHTML(param.buttons,param.analogSticks,param.name);
			
			this.controllerType=0;
			this.controller=null;
			this.setController(param.controller)
		},
		setController:function(controller)
		{
			if(this.controller!==controller)
			{
				if(this.controller)
				{
					this.controller.setMapping(this.oldMapping);
					this.controller.removeListener("analogStickChanged buttonChanged",this,this.controllerChanged);
					
					this.controllerType=0;
					this.domElement.classList.remove("Keyboard");
					this.domElement.classList.remove("Gamepad");
					
					this.controller=null;
				}
				this.controller=controller||null;
			}
			if(this.controller)
			{
				if(HMOD("Controller.Keyboard")&&this.controller instanceof GMOD("Controller.Keyboard"))
				{
					this.controllerType=controllerTypes.Keyboard;
					this.domElement.classList.add("Keyboard");
				}
				else
				{
					this.controllerType=controllerTypes.Gamepad;
					this.domElement.classList.add("Gamepad");
					this.controller.addListener("analogStickChanged buttonChanged",this,"controllerChanged");
				}
				this.oldMapping=this.controller.getMapping();
				this.controller.setMapping(null);
				
				if(this.oldMapping)
				{
					var reverseMap=this.oldMapping.getReverseMapping();
	
					var buttons=this.getButtons();
					for(var i=0;i<buttons.length;i++)
					{
						var btn=buttons[i];
						btn.value=reverseMap.buttons[btn.dataset.button];
						if(controller===controllerTypes.Keyboard)
						{
							btn.title=getTitle(reverseMap.buttons[btn.dataset.button]);
						}
					}
	
					var axes=this.getAxes();
					for(var i=0;i<axes.length;i++)
					{
						var axis=axes[i];
						axis.value=reverseMap.axes[axis.dataset.axis];
						if(controller===controllerTypes.Keyboard)
						{
							axis.title=getTitle(reverseMap.axes[axis.dataset.axis]);
						}
					}
	
					var axisButtons=this.getAxisButtons();
					for(var i=0;i<axisButtons.length;i++)
					{
						var btnAxis=axisButtons[i];
						btnAxis.value=reverseMap.buttonAxis[btnAxis.dataset.axis];
						if(controller===controllerTypes.Keyboard)
						{
							btnAxis.title=getTitle(reverseMap.buttonAxis[btnAxis.dataset.axis]);
						}
					}
				}
			}
		},
		getButtons:function()
		{
			return this.domElement.querySelectorAll("input[data-button]");
		},
		getAxisButtons:function()
		{
			if(this.controllerType===controllerTypes.Keyboard)
			{
				return this.domElement.querySelectorAll(".analogStick [data-axis]");
			}
			else
			{
				return this.domElement.querySelectorAll(".axisButton:checked+* > input");
			}
		},
		getAxes:function()
		{
			if(this.controllerType!==controllerTypes.Keyboard)
			{
				return this.domElement.querySelectorAll(".axisButton:not(:checked)+* > .pos");
			}
			else
			{
				return [];
			}
		},
		onInputChange:function(event)
		{
			if(event.target.tagName==="INPUT"&&event.target.dataset.field!=="name"&&event.key!=="Backspace"&&this.controllerType===controllerTypes.Keyboard)
			{
				event.preventDefault();
				event.stopPropagation();
				
				var input=event.target;
				input.value=event.code||event.keyCode;
				input.title=getTitle(event.code||event.keyCode);
			}
		},
		onClick:function(event)
		{
			if(event.target.tagName==="BUTTON")
			{
				this.fire("submit",{value:event.target.dataset.value})
			}
		},
		controllerChanged:function(event)
		{
			if(event.type==="buttonChanged"&&							//button changed
			  (document.activeElement.dataset.button!==undefined||		//& button input
			   document.activeElement.dataset.axis!==undefined&&		// || buttonAxis input
			  (document.activeElement.parentNode.previousSibling.checked===true||this.controllerType===controllerTypes.Keyboard)))
			{
				document.activeElement.value=event.index;
			}
			else if(event.type==="analogStickChanged"&&						//axis changed
					document.activeElement.dataset.axis!==undefined&&		//&& axis input
					document.activeElement.parentNode.previousSibling.checked===false)
			{
				var x=Math.abs(event.analogStick.x),
				y=Math.abs(event.analogStick.y);
				if(x>0.5||y>0.5)
				{
					if(x>y)
					{
						var sign="";
						if(event.analogStick.x<0)
						{
							sign="-";
						}
						document.activeElement.value=sign+(event.index*2);
					}
					else
					{
						var sign="";
						if(event.analogStick.y<0)
						{
							sign="-";
						}
						document.activeElement.value=sign+(event.index*2+1);
					}
				}
			}
		},
		getData:function()
		{
			var data={
					buttons:{},
					buttonAxis:{},
					axes:{}
			};
			var btns=this.getButtons();
			for(var i=0;i<btns.length;i++)
			{
				var btn=btns[i];
				data.buttons[btn.value]=btn.dataset.button;
			}
			var buttonAxis=this.getAxisButtons();
			for(var i=0;i<buttonAxis.length;i++)
			{
				data.buttonAxis[buttonAxis[i].value]=buttonAxis[i].dataset.axis;
			}
			var axes=this.getAxes();
			for(var i=0;i<axes.length;i++)
			{
				var axis=axes[i];
				var from=axis.value;
				var to=axis.dataset.axis;
				if(1/from<0)
				{
					from=-from;
					to="-"+to;
				}
				data.axes[from]=to;
			}
			return data;
		},
		getMapping:function()
		{
			var type="";
			switch (this.controllerType)
			{
				case controllerTypes.Keyboard:
					type="KEYBOARD";
					break;
				case controllerTypes.Gamepad:
					type="GAMEPAD";
					break;
			}
			var name=this.domElement.querySelector('[data-field="name"]');
			if(name)
			{
				name=name.value;
			}
			return new SC.mapping({data:this.getData(),type:type,name:name});
		},
		destroy:function()
		{
			this.setController(null);
			this.mega();
		}
	});
	SMOD("GUI.ControllerConfig",CONF);
	
})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule);
//Morgas/src/Morgas.Detached.js
(function(µ,SMOD,GMOD){
	 /**
	 * Depends on	: Morgas
	 * Uses			: 
	 *
	 * Detached class for asynchronous notification
	 *
	 */
	
	var SC=GMOD("shortcut")({
		debug:"debug"
	});
	
	var wrapFunction=function(fn,args)
	{
		return function(resolve,reject)
		{
			try {
				var p=fn.apply({complete:resolve,error:reject},args);
				if(p&&typeof p.then==="function")
				{
					p.then(resolve,reject);
				}
				else if (p!==undefined)
				{
					resolve(p);
				}
			} catch (e) {
				SC.debug(e,1);
				reject(e);
			}
		}
	};
	
	var DET=µ.Detached=µ.Class(
	{
		/**
		*	fn		function or [function]
		*/
		init:function(fn,args)
		{
			var wait=fn===DET.WAIT;
			if(wait)
				fn=arguments[1];

			this.fn=[].concat(fn||[]);
			this.onError=[];
			this.onComplete=[];
			this.onAlways=[];
			this.onPropagate=[];
			this.status=0;
			this.args=undefined;

			if(!wait)
			{
				if(this.fn.length===0)
				{
					this.status=1;
				}
				else
				{
					this._start(args);
				}
			}
		},
		_start:function(args)
		{
			for(var i=0;i<this.fn.length;i++)
			{
				if(typeof this.fn[i]==="function")
				{
					this.fn[i]=new Promise(wrapFunction(this.fn[i],args));
				}
			}
			var _self=this;
			Promise.all(this.fn).then(function(args)
			{
				_self._setStatus(1,args);
			},
			function()
			{
				_self._setStatus(-1,Array.prototype.slice.call(arguments,0));
			});
		},
		_setStatus:function(status,args)
		{
			this.status=status;
			this.args=args;
			if(status===1)
			{
				while(this.onComplete.length>0)
				{
					this.onComplete.shift()._start(this.args);
				}
			}
			else if (status===-1)
			{
				while(this.onError.length>0)
				{
					this.onError.shift()._start(this.args);
				}
				while(this.onPropagate.length>0)
				{
					this.onPropagate.shift()._setStatus(status,this.args);
				}

			}
			var alwaysArgs=[(this.status===1)].concat(this.args);
			while(this.onAlways.length>0)
			{
				this.onAlways.shift()._start(alwaysArgs);
			}
			this.onComplete.length=this.onError.length=this.onPropagate.length=this.onAlways.length=this.fn.length=0;
		},
		error:function(fn)
		{
			fn=[].concat(fn);
			for(var i=0;i<fn.length;i++)
			{
				fn[i]=new DET(DET.WAIT,fn[i]);
				if(this.status==-1&&this.finished>=this.fn.length)
				{
					fn[i]._start(this.args);
				}
				else if (this.status===0)
				{
					this.onError.push(fn[i]);
				}
			}
			return fn[fn.length-1];
		},
		complete:function(fn)
		{
			fn=[].concat(fn);
			for(var i=0;i<fn.length;i++)
			{
				fn[i]=new DET(DET.WAIT,fn[i]);
				if(this.status==1)
				{
					fn[i]._start(this.args);
				}
				else if (this.status==0)
				{
					this.onComplete.push(fn[i]);
				}
			}
			return fn[fn.length-1];
		},
		then:function(complete,error)
		{
			var next=this.complete(complete);
			if(error===true)
			{
				this.propagateError(next);
			}
			else
			{
				this.error(error);
			}
			return next;
		},
		always:function(fn)
		{
			fn=[].concat(fn);
			for(var i=0;i<fn.length;i++)
			{
				fn[i]=new DET(DET.WAIT,fn[i]);
				if(this.status!==0)
				{
					var args=[(this.status===1)].concat(this.args);
					fn[i]._start(args);
				}
				else if (this.status===0)
				{
					this.onAlways.push(fn[i]);
				}
			}
			return fn[fn.length-1];
		},
		propagateError:function(detached)
		{
			if(this.status===0)
			{
				this.onPropagate.push(detached);
			}
			else if (this.status===-1&&detached.status===0)
			{
				detached._setStatus(-1,this.args);
			}
		}
	});
	DET.WAIT={};
	SMOD("Detached",DET);
	DET.complete=function()
	{
		var d=new DET();
		d.args=arguments;
		return d;
	};
	DET.error=function()
	{
		var d=new DET();
		d.status=-1;
		d.args=arguments;
		return d;
	};
	DET.detache=function(fn,scope)
	{
		scope=scope||window;
		return function()
		{
			var args=Array.prototype.slice.call(arguments,0);
			return new DET(function()
			{
				args.unshift(this);
				try
				{
					return fn.apply(scope,args);
				}
				catch(e)
				{
					SC.debug(e,1);
					this.error(e);
				}
			})
		}
	};
	DET.detacheAll=function(scope,keys)
	{
		keys=[].concat(keys);
		for(var i=0;i<keys.length;i++)
		{
			var fn=scope[keys[i]];
			scope[keys[i]]=DET.detache(fn,scope);
		}
	};
})(Morgas,Morgas.setModule,Morgas.getModule);
//Morgas/src/Morgas.util.Request.js
(function(µ,SMOD,GMOD,HMOD){
	
	µ.util=µ.util||{};

	var SC=GMOD("shortcut")({
		debug:"debug",
		prom:"Promise"
	});
	var doRequest=function(signal,urls,param)
	{
		if(urls.length==0) signal.reject();
		else
		{
			var url=urls.shift();
			var req=new XMLHttpRequest();
			req.open(param.method,url,true,param.user,param.password);
			req.responseType=param.responseType;
			req.onload=function()
			{
				if (req.status == 200)
				{
					signal.resolve(req.response);
				}
				else
				{
					SC.debug({url:url,status:req.statusText})
					doRequest(signal,urls,param);
				}
			};
			req.onerror=function()
			{
				SC.debug({url:url,status:"Network Error"})
				doRequest(signal,urls,param);
			};
			if(param.progress)
			{
				req.onprogress=param.progress;
			}
			signal.onAbort(function(){
				urls.length=0;
				req.abort();
			});
			req.send(param.data);
		}
	}
	REQ=µ.util.Request=function Request_init(param,scope)
	{
		var urls;
		if(typeof param ==="string")
		{
			urls=[param];
		}
		else if (Array.isArray(param))
		{
			urls=param.slice();
		}
		else
		{
			urls=[].concat(param.url);
		}
		param={
			method:param.method||(param.data?"POST":"GET"),
			user:param.user,//||undefined
			password:param.password,//||undefined
			responseType:param.responseType||"",
			withCredentials:param.withCredentials===true,
			contentType:param.contentType,//||undefined
			data:param.data//||undefined
		};
		return new SC.prom(doRequest,[urls,param],scope);
	};
	SMOD("request",REQ);

	REQ.json=function Request_Json(param,scope)
	{
		if(typeof param ==="string")
		{
			param={url:param};
		}
		param.responseType="json";
		return REQ(param,scope);
	};
	SMOD("request.json",REQ.json);
})(Morgas,Morgas.setModule,Morgas.getModule);
//Morgas/src/DB/Morgas.DB.IndexedDBConnector.js
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
	
	var ICON=µ.Class(DBC,{

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
							signal.complete(Array.prototype.slice.call(arguments));
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
//TalePlay.Map.js
(function(µ,SMOD,GMOD){

    var TALE=this.TalePlay=this.TalePlay||{};

    var SC=GMOD("shortcut")({
        find:"find",
        Node:"NodePatch",
        point:"Math.Point",
        RECT:"Math.Rect"
    });
    var MAP=TALE.Map=µ.Class(
    {
        init:function(param)
        {
        	this.nodePatch=new SC.Node(this,{
        		children:"images",
        		addChild:"add",
        		removeChild:"remove"
        	});
        	
        	param=param||{};
        	
            this.position=new SC.point();
            this.size=new SC.point(param.size);
            
            this.domElement=param.domElement||document.createElement("div");
            this.domElement.classList.add("Map");
            this.stage=document.createElement("div");
            this.stage.classList.add("stage");
            this.domElement.appendChild(this.stage);
            
            param.images&&this.addAll(param.images);
            
            if(this.size.equals(0))
            {
            	this.calcSize();
            }
            
            this.setPosition(param.position);
        },
        addAll:function(images)
        {
        	images=[].concat(images);
            for(var i=0;i<images.length;i++)
            {
                this.add(images[i]);
            }
        },
        add:function(image)
        {
            if(this.nodePatch.addChild(image))
            {
                this.stage.appendChild(image.domElement);
                image.update();
                return true;
            }
            return false;
        },
        remove:function(image)
        {
        	if(this.nodePatch.removeChild(image))
        	{
        		this.stage.removeChild(image.domElement);
        		return true;
        	}
        	return false;
        },
        setPosition:function(position,y)
        {
            this.position.set(position,y);
            this.position.doMath(Math.max,0).doMath(Math.min,this.getSize());
            this.update(true);
        },
        getPosition:function()
        {
            return this.position;
        },
        move:function(numberOrPoint,y)
        {
            this.position.add(numberOrPoint,y);
            this.position.doMath(Math.max,0).doMath(Math.min,this.getSize());
            this.update(true);
        },
        update:function(noimages)
        {
        	var pos=this.position.clone();
            var b=this.domElement.getBoundingClientRect();
            
            pos.sub(b.width/2,b.height/2);
            
            this.stage.style.top=-pos.y+"px";
            this.stage.style.left=-pos.x+"px";
            for(var i=0;!noimages&&i<this.images.length;i++)
            {
                this.images[i].update();
            }
        },
        getImages:function(pattern)
        {
            return SC.find(this.images,pattern,true);
        },
        getSize:function()
        {
        	return this.size;
        },
        setSize:function(numberOrPoint,y)
        {
        	this.size.set(numberOrPoint,y);
        },
        calcSize:function(filter)
        {
        	this.size.set(0);
        	for(var i=0;i<this.images.length;i++)
        	{
        		if(!filter||filter(this.images[i]))
        		{
        			this.size.doMath(Math.max,this.images[i].rect.position.clone().add(this.images[i].rect.size));
        		}
        	}
        },
        empty:function()
        {
        	while(this.images.length>0)
			{
				this.remove(this.images[0]);
			}
        },
		toJSON:function()
		{
			return {
				images:this.images.slice(),
				position:this.position.clone(),
				size:this.size.clone()
			};
		},
		fromJSON:function(json)
		{
			this.empty();
			for(var i=0;i<json.images.length;i++)
			{
				var image=json.images[i];
				if(!(image instanceof MAP.Image))
				{
					image=new MAP.Image().fromJSON(image);
				}
				this.add(image);
			}
			this.size.set(json.size);
			if(this.size.equals(0))
            {
            	this.calcSize();
            }
			this.setPosition(json.position);
			return this;
		}
    });
    MAP.Image= µ.Class(
    {
        init:function(url,position,size,name)
        {
        	new SC.Node(this,{
        		parent:"map",
        		remove:"remove"
        	});
        	
        	this.rect=new SC.RECT(position,size);
            this.domElement=document.createElement("img");
            Object.defineProperty(this,"url",{
            	enumerable:true,
            	get:function(){return this.domElement.src;},
            	set:function(url){this.domElement.src=url;}
            });
            this.url=url;
            Object.defineProperty(this,"name",{
            	enumerable:true,
            	get:function(){return this.domElement.dataset.name;},
            	set:function(name){this.domElement.dataset.name=name;}
            });
            this.name=name||"";
        },
        update:function()
        {
            this.domElement.style.top=this.rect.position.y+"px";
            this.domElement.style.left=this.rect.position.x+"px";
            this.domElement.style.height=this.rect.size.y+"px";
            this.domElement.style.width=this.rect.size.x+"px";
        },
    	getPosition:function()
    	{
    		return this.rect.position.clone();
    	},
        setPosition:function(numberOrPoint,y)
        {
        	this.move(this.getPosition().negate().add(numberOrPoint,y));
            this.update();
        },
        move:function(numberOrPoint,y)
        {
            this.rect.position.add(numberOrPoint,y);
            this.update();
        },
		toJSON:function()
		{
			return {
				url:this.url,
				position:this.rect.position,
				size:this.rect.size,
				name:this.name
			};
		},
		fromJSON:function(json)
		{
			this.url=json.url;
			this.rect.setPosition(json.position);
			this.rect.setSize(json.size);
			this.name=json.name;
			
			this.update();
			
			return this;
		}
    });
    SMOD("Map",MAP);
})(Morgas,Morgas.setModule,Morgas.getModule);
//GUI/TalePlay.GUIElement.Map.js
(function(µ,SMOD,GMOD){

	var GUI=GMOD("GUIElement"),
	MAP=GMOD("Map"),
	SC=GMOD("shortcut")({
		find:"find",
		rescope:"rescope",
		proxy:"proxy",
        Org:"Organizer",
		point:"Math.Point",
		debug:"debug"
	});
	
	var cursorFilter= function(image){return image instanceof GUI.Map.Cursor};
	var cursorGetter= function(GuiMap){return GuiMap.organizer.getFilter("cursors")};
	
	GUI.Map=µ.Class(GUI,{
		init:function(param)
		{
			param=param||{};
			
			this.mega(param);
			this.createListener("trigger");
			SC.rescope.all(this,["_animateCursor"]);
			
			this.map=new MAP({
				domElement:this.domElement,
				images:param.images,
				position:param.position
			}); //note: sets class "map" to domElement
			this.map.gui=this;
			SC.proxy("map",[
				"setPosition",
				"move",
				"getImages",
				"getSize",
				"update"
			],this);
			
        	this.organizer=new SC.Org()
        	.filter("cursors",cursorFilter)
        	.filter("collision","collision")
        	.group("trigger","trigger.type");
			
            this.threshold=new SC.point();
            GMOD("shortcut")({cursors:cursorGetter},this,this,true);
            this.movingCursors=new Map();
            this.setThreshold(param.threshold);
            param.cursors&&this.addAll(param.cursors);
            this.assignFilter=param.assignFilter||null;
            this.animationRquest=null;
            this.paused=param.paused===true;
		},
        addAll:function(images)
        {
        	images=[].concat(images);
            for(var i=0;i<images.length;i++)
            {
                this.add(images[i]);
            }
        },
        add:function(image)
        {
            if(this.map.add(image))
            {
                this.organizer.add([image]);
            }
        },
        remove:function(image)
        {
        	if(this.map.remove(image))
        	{
        		this.organizer.remove(image);
        		this.movingCursors["delete"](image);
        	}
        },
		getCursors:function(pattern)
		{
			return SC.find(this.cursors,pattern,true);
		},
		updateSize:function()
		{
			this.map.calcSize(function(img){return !(img instanceof GUI.Map.Cursor)});
		},
		setThreshold:function(numberOrPoint,y)
		{
			this.threshold.set(numberOrPoint,y);
		},
		setPaused:function(paused)
		{
			this.paused=!!paused;
			if(this.animationRquest!==null&&this.paused)
			{
				cancelAnimationFrame(this.animationRquest);
				this.animationRquest=null;
			}
			else if(!this.paused)
			{
				var now=Date.now();
				for(var entries=this.movingCursors.entries(),entryStep=entries.next();!entryStep.done;entryStep=entries.next())
				{
					var data=entryStep.value[1];
					data.lastTime=now-performance.timing.navigationStart;
				}
				this.animationRquest=requestAnimationFrame(this._animateCursor);
			}
		},
		isPaused:function()
		{
			return this.paused;
		},
        collide:function(rect)
        {
        	var rtn=[],
        	cImages=this.organizer.getFilter("collision");
        	for(var i=0;i<cImages.length;i++)
        	{
        		if(cImages[i].rect.collide(rect))
        		{
        			rtn.push(cImages[i]);
        		}
        	}
        	return rtn;
        },
        trigger:function(type,numberOrPoint,y)
        {
        	var rtn=[],
        	tImages=this.organizer.getGroupValue("trigger",type);
        	for(var i=0;i<tImages.length;i++)
        	{
        		if(tImages[i].rect.contains(numberOrPoint,y))
        		{
        			rtn.push(tImages[i]);
        		}
        	}
        	return rtn;
        },
		onAnalogStick:function(event)
		{
			for(var i=0;i<this.cursors.length;i++)
			{
				if(!this.assignFilter||this.assignFilter(event,this.cursors[i],i))
				{
					var data=this.movingCursors.get(this.cursors[i]);
					if(!data)
					{
						data={
							direction:null,
							lastTime:Date.now()-performance.timing.navigationStart
						};
						this.movingCursors.set(this.cursors[i],data);
					}
					data.direction=event.analogStick.clonePoint()
					.mul(1,-1);//negate y for screen coordinates;
				}
			}
			if(this.animationRquest===null&&!this.paused)
			{
				this.animationRquest=requestAnimationFrame(this._animateCursor);
			}
		},
		_animateCursor:function(time)
		{
			for(var entries=this.movingCursors.entries(),entryStep=entries.next();!entryStep.done;entryStep=entries.next())
			{
				var cursor=entryStep.value[0],data=entryStep.value[1];
				var timeDiff=Math.min(time-data.lastTime,GUI.Map.MAX_TIME_DELAY);
	            if(data.animation)
	            {
	            	data.direction=data.animation.step(timeDiff);
	            }
				if(!data.direction.equals(0)&&cursor)
				{
		            cursor.domElement.classList.add("moving");
		            var info=cursor.move(data.direction,timeDiff);

					//step trigger
		            //TODO step in/over/out
					var stepTrigger=this.trigger("step",cursor.getPosition());
					for(var i=0;i<stepTrigger.length;i++)
					{
						this.fire("trigger",{
							triggerType:"step",
							image:stepTrigger[i],
							cursor:cursor,
							value:stepTrigger[i].trigger.value,
							distance:info.distance
						});
					}
					
					data.lastTime=time;
					
					//move map
					var pos=cursor.getPosition();
					var mapPos=this.map.getPosition();
					if(pos.x<mapPos.x-this.threshold.x)
					{
						this.move(pos.x-mapPos.x+this.threshold.x,0);
					}
					else if(pos.x>mapPos.x+this.threshold.x)
					{
						this.move(pos.x-mapPos.x-this.threshold.x,0);
					}
					if(pos.y<mapPos.y-this.threshold.y)
					{
						this.move(0,pos.y-mapPos.y+this.threshold.y);
					}
					else if(pos.y>mapPos.y+this.threshold.y)
					{
						this.move(0,pos.y-mapPos.y-this.threshold.y);
					}
				}
	            else
	            {
	                cursor.domElement.classList.remove("moving");
	                this.movingCursors["delete"](cursor);
	            }
			}
			if(this.movingCursors.size>0&&!this.paused)
			{
				this.animationRquest=requestAnimationFrame(this._animateCursor);
			}
			else
			{
				this.animationRquest=null;
			}
		},
		onButton:function(event)
		{
			if(event.value===1&&!this.paused)
			{
				for(var i=0;i<this.cursors.length;i++)
				{
					var cursor=this.cursors[i];
					if(!this.assignFilter||this.assignFilter(event,cursor,i))
					{
						var activateTrigger=this.trigger("activate",cursor.getPosition());
						if(activateTrigger.length===0&&cursor.direction)
						{
							var dir=cursor.direction;
							var pos=new SC.point(
								cursor.rect.position.x+(dir.x===0 ? cursor.offset.x : dir.x>0 ? cursor.rect.size.x : 0),
								cursor.rect.position.y+(dir.y===0 ? cursor.offset.y : dir.y<0 ? cursor.rect.size.y : 0)
							);
							activateTrigger=this.trigger("activate",pos);
						}
						for(var t=0;t<activateTrigger.length;t++)
						{
							if(activateTrigger[t].trigger.type==="activate")
							{
								this.fire("trigger",{
									triggerType:"activate",
									image:activateTrigger[t],
									cursor:this.cursors[i],
									value:activateTrigger[t].trigger.value,
									controllerEvent:event
								});
							}
						}
					}
				}
			}
		},
		playAnimation:function(animation)
		{
			var data=this.movingCursors.get(animation.cursor);
			if(!data)
			{
				data={
					direction:null,
					animation:null,
					lastTime:Date.now()-performance.timing.navigationStart
				};
				this.movingCursors.set(animation.cursor,data);
			}
			data.animation=animation;

			if(this.animationRquest===null&&!this.paused)
			{
				this.animationRquest=requestAnimationFrame(this._animateCursor);
			}
		},
		toJSON:function()
		{
			var json=this.map.toJSON();
			json.cursors=this.cursors.slice();
			json.threshold=this.threshold.clone;
			for(var i=0;i<this.cursors.length;i++)
			{
				json.images.splice(json.images.indexOf(this.cursors[i]),1);
			}
			return json;
		},
		fromJSON:function(json)
		{
			this.movingCursors.clear();
			for(var i=0;i<json.images.length;i++)
			{
				json.images[i]=new GUI.Map.Image().fromJSON(json.images[i]);
			}
			for(var i=0;i<json.cursors.length;i++)
			{
				json.images.push(new GUI.Map.Cursor().fromJSON(json.cursors[i]));
			}
			this.map.fromJSON(json);
			this.organizer.clear().add(json.images);
			this.threshold.set(json.threshold);
		}
	});
	GUI.Map.MAX_TIME_DELAY=250;
    GUI.Map.Image=µ.Class(MAP.Image,{
    	init:function(url,position,size,name,collision,trigger){
    		this.mega(url,position,size,name);
			
			GMOD("shortcut")({"guiMap":["map","gui"]},this,this,true);

            this.collision=!!collision;
            this.trigger={
            	type:null,
            	value:null
            };
            if(trigger)
            {
            	this.trigger.type=trigger.type||null;
            	this.trigger.value=trigger.value||null;
            }
    	},
		toJSON:function()
		{
			var json=MAP.Image.prototype.toJSON.call(this);
			json.collision=this.collision;
			json.trigger=this.trigger;
			return json;
		},
		fromJSON:function(json)
		{
			this.mega(json);
			this.collision=json.collision;
			this.trigger=json.trigger;
			
			return this;
		}
    });
	GUI.Map.Cursor=µ.Class(GUI.Map.Image,{
    	init:function(urls,position,size,offset,name,colision,viewOffset,viewSize,trigger,speed)
    	{
    		this.mega(GUI.Map.Cursor.emptyImage,position,size,name,colision,trigger);
    		
    		this.viewRect=this.rect.clone();
    		this.viewRect.set(viewOffset,viewSize);
    		
    		this.domElement.classList.add("cursor");
            this.domElement.style.zIndex=GUI.Map.Cursor.zIndexOffset;
            
            Object.defineProperty(this,"backUrl",{
            	enumerable:true,
            	get:function(){return this.domElement.style.backgroundImage;},
            	set:function(url){this.domElement.style.backgroundImage='url("'+url+'")';}
            });
    		this.urls=null;
    		this.setUrls(urls);
    		
    		this.offset=new SC.point(this.rect.size).div(2);
    		this.setOffset(offset);
    		
    		this.speed=new SC.point(200);
    		this.setSpeed(speed);
    		
    		this.direction=null;
    		this.updateDirection();
    	},
        updateDirection:function()
        {
        	this.domElement.classList.remove("up","right","down","left");
        	if(this.direction)
        	{
        		// y axis is inverted on screen
	            var direction8=this.direction.clone().mul(1,-1).getDirection8();
	            if(this.urls[direction8]) this.backUrl=this.urls[direction8];
	            else if (direction8!==0&&direction8%2===0&&this.urls[direction8-1]) this.backUrl=this.urls[direction8-1];
	            else this.backUrl=this.urls[0];
	            
	            if(direction8>=1&&(direction8<=2||direction8===8))
	            {
	                this.domElement.classList.add("up");
	            }
	            if(direction8>=2&&direction8<=4)
	            {
	            	this.domElement.classList.add("right");
	            }
	            if(direction8>=4&&direction8<=6)
	            {
	            	this.domElement.classList.add("down");
	            }
	            if(direction8>=6&&direction8<=8)
	            {
	            	this.domElement.classList.add("left");
	            }
            }
        },
    	setOffset:function(numberOrPoint,y)
    	{
    		this.rect.position.add(this.offset);
    		this.offset.set(numberOrPoint,y);
    		this.rect.position.sub(this.offset);
    		this.update();
    	},
    	setPosition:function(numberOrPoint,y)
    	{
            this.rect.position.set(numberOrPoint,y).sub(this.offset);
            this.update();
    	},
    	getPosition:function()
    	{
    		return this.rect.position.clone().add(this.offset);
    	},
    	setSpeed:function(numberOrPoint,y)
    	{
            this.speed.set(numberOrPoint,y);
    	},
    	setUrls:function(urls)
    	{
    		this.urls=[].concat(urls);
    		this.backUrl=this.urls[0];
    		if(this.domElement)this.updateDirection();
    	},
    	move:function(direction,timediff)
    	{
    		this.direction=direction;
    		var rtn={
				distance:new SC.point(this.direction).mul(this.speed).mul(timediff/1000),
				collided:false
			};
			if(this.guiMap)
			{
				var size=this.map.getSize();
				
				//map boundary
				var pos=this.rect.position.clone().add(this.offset);
				if(pos.x+rtn.distance.x<0)
				{
					rtn.distance.x=-pos.x;
				}
				else if (pos.x+rtn.distance.x>size.x)
				{
					rtn.distance.x=size.x-pos.x;
				}
				if(pos.y+rtn.distance.y<0)
				{
					rtn.distance.y=-pos.y;
				}
				else if (pos.y+rtn.distance.y>size.y)
				{
					rtn.distance.y=size.y-pos.y;
				}
				//collision
				if(this.collision)
				{
					var progress=1;
					var rect=this.rect.clone();
					rect.position.add(rtn.distance);
					var collisions=this.guiMap.collide(rect);
					for(var i=0;i<collisions.length;i++)
					{
						var cImage=collisions[i];
						var p=null;
						if(cImage===this||this.rect.collide(cImage.rect)||cImage.rect.collide(this.rect))
						{//is self or inside
							continue;
						}
						rtn.collided=true;
						if(rtn.distance.x>0&&this.rect.position.x+this.rect.size.x<=cImage.rect.position.x)
						{
							p=Math.max(p,(cImage.rect.position.x-this.rect.position.x-this.rect.size.x)/rtn.distance.x);
						}
						else if (rtn.distance.x<0&&this.rect.position.x>=cImage.rect.position.x+cImage.rect.size.x)
						{
							p=Math.max(p,(cImage.rect.position.x+cImage.rect.size.x-this.rect.position.x)/rtn.distance.x);
						}
						
						if(rtn.distance.y>0&&this.rect.position.y+this.rect.size.y<=cImage.rect.position.y)
						{
							p=Math.max(p,(cImage.rect.position.y-this.rect.position.y-this.rect.size.y)/rtn.distance.y);
						}
						else if (rtn.distance.y<0&&this.rect.position.y>=cImage.rect.position.y+cImage.rect.size.y)
						{
							p=Math.max(p,(cImage.rect.position.y+cImage.rect.size.y-this.rect.position.y)/rtn.distance.y);
						}
						
						if(p!==null)
						{
							progress=Math.min(progress,p);
						}
					}
					rtn.distance.mul(progress);
				}
			}
			this.mega(rtn.distance);
			this.updateDirection();
			return rtn;
    	},
        update:function()
        {
        	var pos=this.rect.position,vPos=this.viewRect.position,vSize=this.viewRect.size;
            this.domElement.style.top=pos.y+vPos.y+"px";
            this.domElement.style.left=pos.x+vPos.x+"px";
            this.domElement.style.height=vSize.y+"px";
            this.domElement.style.width=vSize.x+"px";
        },
		toJSON:function()
		{
			var json=GUI.Map.Image.prototype.toJSON.call(this);
			json.offset=this.offset;
			json.speed=this.speed;
			delete json.url;
			json.urls=this.urls.slice();
			json.viewOffset=this.viewRect.position;
			json.viewSize=this.viewRect.size;
			return json;
		},
		fromJSON:function(json)
		{
			json.url=GUI.Map.Cursor.emptyImage;
			this.mega(json);
			this.offset.set(json.offset);
			this.speed.set(json.speed);
			this.setUrls(json.urls);
			this.viewRect.copy(this.rect)
			.setPosition(json.viewOffset)
			.setSize(json.viewSize);
			return this;
		}
    });
	GUI.Map.Cursor.emptyImage="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
    GUI.Map.Cursor.zIndexOffset=100;
    GUI.Map.Cursor.Animation=µ.Class({
    	init:function(cursor)
    	{
    		this.cursor=cursor;
    		this.done=true;
			this.activeAction=null;
    	},
		doAction:function(action)
		{
			this.activeAction=action;
			this.done=false;
		},
    	step:function(timeDiff)
    	{
    		if(this.activeAction)
			{
				switch (this.activeAction.type.toUpperCase)
				{
					case "SET":
						this.cursor.setPosition(this.activeAction.position);
						this.activeAction=null
						break;
					case "FACE":
						this.cursor.direction.set(this.activeAction.direction);
						this.cursor.updateDirection();
						this.activeAction=null
						break;
					case "WAIT":
						if(this.activeAction.time-=timeDiff<0) this.activeAction=null;
						break;
					case "TURN":
						break;
					case "MOVE":
						var dist=this.cursor.getPosition().negate().add(this.activeAction.position);
						var dir=dist.clone().div(Math.max(Math.abs(dist.x),Math.abs(dist.y)));
						var info=this.cursor.move(dir,timeDiff);
						if(info.distance.length()>=dist.length())
						{
							this.cursor.setPosition(this.activeAction.position);
							this.activeAction=null;
						}
						else if (info.collided)this.activeAction=null;
						break;
					default:
						SC.debug("unknown action type: "+this.activeAction.type,SC.debug.LEVEL.ERROR);
						this.activeAction=null
				}
			}
			if(!this.activeAction) this.done=true;
			return this.done;
    	}
    });
    GUI.Map.Cursor.Animation.Key=µ.Class(GUI.Map.Cursor.Animation,{ //key animation
    	init:function(cursor,keys)
    	{
    		this.mega(cursor);
    		this.keys=keys;
    		
    		this.cursor.setPosition(this.keys[0]);
    		this.progress=1;//next key
    	},
    	step:function(timediff)
    	{
    		if(this.keys[this.progress])
    		{
    			var dir=this.cursor.getPosition().negate().add(this.keys[this.progress]);
    			var dist=this.cursor.speed.clone().mul(timediff/1000);
    			if( (dist.x>Math.abs(dir.x)&&dist.y>Math.abs(dir.y)) && (this.keys.length>this.progress+1))
    			{
    				var remaining=dist.clone().sub(dir.abs()).div(dist);
    				dir=new SC.point(this.keys[this.progress+1]).sub(this.keys[this.progress]).mul(remaining).add(this.keys[this.progress]);
    				dir=this.cursor.getPosition().negate().add(dir);
    				this.progress++;
    			}
    			dir.div(dist);
    			var absX=Math.abs(dir.x),absY=Math.abs(dir.y)
    			if(absX>1||absY>1) dir.mul(1/(absX>absY ? absX : absY));
    			else
    			{
    				dir.set(0);
    			}
    			return dir;
    		}
    		else
    		{
    			return new SC.point();
    		}
    	}
    });
	SMOD("GUI.Map",GUI.Map);
	
})(Morgas,Morgas.setModule,Morgas.getModule);
//RPGPlayer/TalePlay.GUIElement.Dialog.js
(function(µ,SMOD,GMOD){
	
	var GUI=GMOD("GUIElement"),
	
	SC=GMOD("shortcut")({
		proxy:"proxy",
		tb:"GUI.TextBox",
		menu:"GUI.Menu"
	});
	
	var DIALOG=GUI.Dialog=µ.Class(GUI,{
		init:function(param)
		{
			param=param||{};
			param.element="fieldset";
			
			this.mega(param);
			this.addStyleClass("Dialog");
			this.createListener("dialogEnd");
			
			this.legend=document.createElement("legend");
			this.domElement.appendChild(this.legend);
			
			this.dialogParts=param.dialogParts?param.dialogParts.slice():[];
			this.actions=param.actions||[];
			this.active=null;
			
			SC.proxy("active",["onAnalogStick","onButton"],this);
			
			this.next();
		},
		next:function(event)
		{
			if(this.active)
			{
				this.active.destroy();
			}
			
			if(this.dialogParts.length>0)
			{
				var dPart=this.dialogParts.shift();
				
				var styles=["width","height","top","right","bottom","left"];
				for(var s=0;s<styles.length;s++)
				{
					this.domElement.style[styles[s]]=dPart[styles[s]]||"";
				}
				if(dPart.parts)
				{//textBox
					this.legend.textContent=dPart.title;
					this.active=new SC.tb({
						parts:dPart.parts
					});
					this.active.addListener("complete:once",this,"next");
					this.active.start();
				}
				else if (dPart.choices)
				{//choice
					this.active=new SC.menu({
						items:dPart.choices,
						converter:DIALOG.MENU_CONVERTER,
						loop:false,
						active:0,
						selectionType:SC.menu.SelectionTypes.NONE
					});
					this.active.addListener("select:once",this,"next");
				}
				this.addChild(this.active);
			}
			else
			{
				var actions;
				if(event&&event.type==="select"&&event.value.actions)
				{
					actions=this.actions.concat(event.value.actions)
				}
				else
				{
					actions=this.actions;
				}
				this.fire("dialogEnd",{actions:actions});
			}
		}
	});
	DIALOG.MENU_CONVERTER=function(item){return item.name};
	
	SMOD("GUI.Dialog",DIALOG);
	
})(Morgas,Morgas.setModule,Morgas.getModule);
//RPGPlayer/TalePlay.RPGPlayer.GameSave.js
(function(µ,SMOD,GMOD,HMOD){
	
	var PLAYER=GMOD("RPGPlayer");
	var DBOBJ=GMOD("DBObj");
	
	var SC=GMOD("shortcut")({
		field:"DBField"
	});
	
	var GSAVE=PLAYER.GameSave=µ.Class(DBOBJ,{
		objectType:"GameSave",
		init:function(param)
		{
			param=param||{};
			
			this.mega(param);
			
			this.addField("map",		SC.field.TYPES.String,param.map);
			this.addField("position",	SC.field.TYPES.JSON,param.position);
			this.addField("cursor",		SC.field.TYPES.JSON,param.cursor);
			this.addField("quests",		SC.field.TYPES.JSON,param.quests||[]);
			this.addField("actions",	SC.field.TYPES.JSON,param.actions||[]);
			this.addField("info",		SC.field.TYPES.String,param.info);
			this.addField("timeStamp",	SC.field.TYPES.DATE,param.timeStamp||new Date());
			this.addField("customData",	SC.field.TYPES.JSON,param.customData||{});
		},
		getMap:			function(){return this.getValueOf("map");},
		setMap:			function(v){return this.setValueOf("map",v);},
		getPosition:	function(){return this.getValueOf("position");},
		setPosition:	function(v){return this.setValueOf("position",v);},
		getCursor:		function(){return this.getValueOf("cursor");},
		setCursor:		function(v){return this.setValueOf("cursor",v);},
		getQuests:		function(){return this.getValueOf("quests");},
		setQuests:		function(v){return this.setValueOf("quests",v);},
		getActions:		function(){return this.getValueOf("actions");},
		setActions:		function(v){return this.setValueOf("actions",v);},
		getInfo:		function(){return this.getValueOf("info");},
		setInfo:		function(v){return this.setValueOf("info",v);},
		getTimeStamp:	function(){return this.getValueOf("timeStamp");},
		setTimeStamp:	function(v){return this.setValueOf("timeStamp",v);},
		getCustomData:	function(){return this.getValueOf("customData");},
		setCustomData:	function(v){return this.setValueOf("customData",v);}
	});
	SMOD("RPGPlayer.GameSave",GSAVE);
	
})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule);
//TalePlay.Layer.ActionMenu.js
(function(µ,SMOD,GMOD){
	
	//TODO change to Layer
	
	var LAYER=GMOD("Layer");
	
	var SC=GMOD("shortcut")({
		Menu:"GUI.Menu",
		debug:"debug"
	});
	
	var AMENU=LAYER.ActionMenu=µ.Class(LAYER,{
		init:function(param)
		{
			param=param||{};
			
			this.mega({mode:LAYER.Modes.LAST});

			this.domElement.classList.add("ActionMenu");
			
			this.menu=new SC.Menu({
				styleClass:param.styleClass,
				items:param.actions,
				active:param.active||0,
				loop:param.loop===true,
				selectionType:SC.Menu.SelectionTypes.NONE,
				converter:param.converter||AMENU.defaultConverter,
				disabled:param.disabled
			});
			
			this.add(this.menu);
			this.menu.addListener("select",this,"_onSelect");

		},
		_onSelect:function(event)
		{
			if(typeof this[event.value.action]==="function")
			{
				this[event.value.action](event.value);
			}
			else
			{
				SC.debug(event.value.action+" is not a function",SC.debug.LEVEL.ERROR);
			}
		}
	});
	AMENU.defaultConverter=function(item)
	{
		return item.text;
	};
	SMOD("Layer.ActionMenu",AMENU);
	
})(Morgas,Morgas.setModule,Morgas.getModule);
//TalePlay.Layer.ActionMenu.StartMenu.js
(function(µ,SMOD,GMOD){
	
	//TODO change to Layer
	
	var AMENU=GMOD("Layer.ActionMenu");
	
	var SC=GMOD("shortcut")({
		manager:"GUI.ControllerManager",
		rj:"request.json",
		debug:"debug"
		/* default module
		 * Layer.Persistance
		 */
	});
	
	var SMENU=AMENU.StartMenu=µ.Class(AMENU,{
		init:function(param)
		{
			param=param||{};
			
			this.mega({
				styleClass:["panel","center"],
				actions:[
					{
						text:"New Game",
						action:"newGame",
						url:param.newGameUrl
					},
					{
						text:"Controllers",
						action:"openControllerManager",
						controllerLayout:param.controllerLayout||{}
					},
					{
						text:"Load",
						action:"loadSave"
					},
					{
						text:"import from File",
						action:"fileImport"
					}
				]
			});

			this.domElement.classList.add("StartMenu");
			this.createListener("start");
		
			this.persistanceLayer=(typeof param.persistanceLayer==="function")?param.persistanceLayer:GMOD(param.persistanceLayer||"Layer.Persistance");
			this.dbConn=param.dbConn;
			this.saveClass=param.saveClass;
			this.saveConverter=param.saveConverter;

		},
		onController:function(event)
		{
			if(event.type==="buttonChanged"&&event.value==1)
			{
				switch(event.index)
				{
					case 1:
						this.menu.setActive(0);
						break;
					case 2:
						this.mega(event);
						break;
				}
			}
			else
			{
				this.mega(event);
			}
		},
		newGame:function(item)
		{
			SC.rj(item.url,this).then(function(newGameJson)
			{
				var save=new this.saveClass();
				save.fromJSON(newGameJson);
				this.fire("start",{save:save});
			},
			function(error)
			{
				SC.debug(["could not load new game: ",error],SC.debug.LEVEL.ERROR);
			});
		},
		openControllerManager:function(item)
		{
			var param={
				styleClass:["panel","overlay"],
				buttons:item.controllerLayout.buttons,
				analogSticks:item.controllerLayout.analogSticks,
				dbConn:this.dbConn
			};
			var m=new SC.manager(param);
			this.add(m);
			m.update("controllers");
		},
		loadSave:function()
		{
			var p=new this.persistanceLayer({
				dbConn:this.dbConn,
				saveClass:this.saveClass,
				saveConverter:this.saveConverter
			});
			p.addListener("load:once",this,function(event)
			{
				this.fire("start",{save:event.save});
				event.source.destroy();
			});
			this.board.addLayer(p);
		},
		fileImport:function()
		{
			//TODO
		}
	});
	SMOD("StartMenu",SMENU);
	
})(Morgas,Morgas.setModule,Morgas.getModule);
//RPGPlayer/TalePlay.Layer.ActionMenu.GameMenu.js
(function(µ,SMOD,GMOD){
	
	//TODO change to Layer
	
	var AMENU=GMOD("Layer.ActionMenu");

	var SC=GMOD("shortcut")({
		manager:"GUI.ControllerManager",
		debug:"debug"
		/* default module
		 * Layer.Persistance
		 */
	});

	var GMENU=AMENU.GameMenu=µ.Class(AMENU,{
		init:function(param)
		{
			param=param||{};
			
			var menuParam={
				styleClass:["panel"],
				actions:[
					{
						text:"Controllers",
						action:"openControllerManager",
						controllerLayout:param.controllerLayout||{}
					},
					{
						text:"save",
						action:"saveGame",
						data:param.saveData
					},
					{
						text:"close",
						action:"close"
					}
				]
			};
			if(!param.saveData)
			{
				menuParam.disabled=[1];
			}
			else menuParam.active=1;
			this.mega(menuParam);

			this.domElement.classList.add("GameMenu");
			this.createListener("start close");
		
			this.persistanceLayer=(typeof param.persistanceLayer==="function")?param.persistanceLayer:GMOD(param.persistanceLayer||"Layer.Persistance");
			this.dbConn=param.dbConn;
			this.saveClass=param.saveClass;
			this.saveConverter=param.saveConverter;

		},
		onController:function(event)
		{
			if(event.type==="buttonChanged"&&event.value==1)
			{
				switch(event.index)
				{
					case 1:
						this.menu.setActive(2);
						break;
					case 2:
						this.mega(event);
						break;
				}
			}
			else
			{
				this.mega(event);
			}
		},
		openControllerManager:function(item)
		{
			var param={
				styleClass:["panel","overlay"],
				buttons:item.controllerLayout.buttons,
				analogSticks:item.controllerLayout.analogSticks,
				dbConn:this.dbConn
			};
			var m=new SC.manager(param);
			this.add(m);
			m.update("controllers");
		},
		saveGame:function(item)
		{
			if(item.data)
			{
				var p=new this.persistanceLayer({
					dbConn:this.dbConn,
					saveClass:this.saveClass,
					saveConverter:this.saveConverter,
					saveData:item.data
				});
				this.board.addLayer(p);
			}
		},
		close:function()
		{
			this.fire("close");
		}
	});
	SMOD("RPGPlayer.GameMenu",GMENU);
	
})(Morgas,Morgas.setModule,Morgas.getModule);
//Morgas/src/Morgas.util.function.proxy.js
(function(µ,SMOD,GMOD){
	
	var util=µ.util=µ.util||{};
	var uFn=util["function"]||{};
	
	var SC=GMOD("shortcut")({
		it:"iterate"
	});
	
	/** proxy
	 * proxy methods from source to target.
	 */
	uFn.proxy=function(source,listOrMapping,target)
	{
		var isKey=false,
		isGetter=false;
		switch(typeof source)
		{
			case "string":
				isKey=true;
				break;
			case "function":
				isGetter=true;
				break;
		}
		SC.it(listOrMapping,function(value,key,index,isObject)
		{
			var sKey=(isObject?key:value),
			tKey=value,
			fn=null;
			if(isKey)
			{
				fn=function(){return this[source][sKey].apply(this[source],arguments)};
			}
			else if (isGetter)
			{
				fn=function(){var scope=source.call(this,sKey);return scope[sKey].apply(scope,arguments);};
			}
			else
			{
				fn=function(){return source[sKey].apply(source,arguments)};
			}
			target[tKey]=fn;
		});
	};
	SMOD("proxy",uFn.proxy);
	
})(Morgas,Morgas.setModule,Morgas.getModule);
//Morgas/src/Morgas.Promise.js
(function(µ,SMOD,GMOD,HMOD){

	var SC=GMOD("shortcut")({
		debug:"debug",
		rs:"rescope"
	});
	var PROM=µ.Promise=µ.Class({
		init:function(fns,args,scope)
		{
			SC.rs.all(this,["_start","_error"]);
			
			this.scope=scope;
			var _=this._={};
			this.original=new Promise(function(rs,rj)
			{
				_.rs=rs;
				_.rj=rj;
			});
			if(!args||args!==PROM._WAIT)
			{
				Promise.all(PROM._MAPFNS(fns,args,scope,SC.rs(this.original.catch,this.original))).then(_.rs,_.rj);
				delete _.rs
			}
			else
			{
				_.fns=fns;
			}
			var _self=this,cleanup=function(){delete _self._;}
			this.original.then(cleanup,cleanup);
		},
		_start:function(args)
		{
			this._.rs(Promise.all(PROM._MAPFNS(this._.fns,args,this.scope,SC.rs(this.original.catch,this.original))));
		},
		_error:function(error)
		{
			this._.rj(error);
		},
		complete:function(fn)
		{
			var rtn=new PROM(fn,PROM._WAIT,this.scope);
			this.original.then(rtn._start,rtn._error);
			return rtn;
		},
		error:function(efn)
		{
			var rtn=new PROM(efn,PROM._WAIT,this.scope);
			this.original.then(rtn._error,rtn._start);
			return rtn;
		},
		then:function(fn,efn)
		{
			this.error(efn);
			return this.complete(fn);
		},
		always:function(fn)
		{
			var rtn=new PROM(fn,PROM._WAIT,this.scope);
			this.original.then(rtn._start,rtn._start);
			return rtn;
		},
		abort:function()
		{
			if(this._)this._error("abort");
		},
		destroy:function()
		{
			this.abort();
			this.mega();
		}
	});
	PROM._WAIT={};
	PROM._MAPFNS=function(fns,args,scope,onAbort)
	{
		args=[].concat(args);
		return [].concat(fns).map(function(fn)
		{
			if(typeof fn==="function")return new Promise(function(rs,rj)
			{
				var sArgs=args.slice();
				//TODO change signal detection
				var hasSignal=/\(\s*signal\s*[,\)]/.exec(fn);
				if(hasSignal)
				{
					var signal={
						resolve:rs,
						reject:rj,
						scope:scope,
						onAbort:onAbort
					};
					sArgs.unshift(signal);
				}
				try
				{
					var result=fn.apply(scope,sArgs);
					if(result&&typeof result.then==="function")
					{
						if(result instanceof PROM)result.original.then(function(r){return rs(r[0])},rj);
						else result.then(rs,rj);
					}
					else if (result!==undefined||!hasSignal)
					{
						rs(result);
					}
				}
				catch (e)
				{
					SC.debug(e,SC.debug.LEVEL.ERROR);
					rj(e);
				}
			});
			return fn;
		});
	};
	PROM.pledge=function(fn,scope,args)
	{
		if(args===undefined)args=[];
		else args=[].concat(args);
		return function vow(sig)
		{
			if(vow.caller===PROM._MAPFNS)
			{//called as chained µ.Promise
				return fn.apply(scope,[sig].concat(args,Array.prototype.slice.call(arguments,1)));
			}
			var vArgs=args.concat(Array.prototype.slice.call(arguments));
			return new PROM(fn,vArgs	,scope);
		}
	};
	PROM.pledgeAll=function(scope,keys)
	{
		keys=keys||Object.keys(scope);
		for(var i=0;i<keys.length;i++)
		{
			if(typeof scope[keys[i]]==="function")scope[keys[i]]=PROM.pledge(scope[keys[i]],scope);
		}
	};
	
	SMOD("Promise",PROM);
	
})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule);
//Morgas/src/Morgas.util.object.equals.js
(function(µ,SMOD,GMOD){

	var util=µ.util=µ.util||{};
	var uObj=util.object||{};

	/** equals
	 * Matches {obj} against {pattern}.
	 * Returns: Boolean
	 *
	 * Matches strictly (===) and RegExp, function, Array, and Object.
	 * 
	 * RegExp: try to match strictly match and
	 * then return pattern.test(obj)
	 * 
	 * function: try to match strictly match and
	 * then if obj is not a function test it with
	 * the pattern function and return its result
	 *
	 * Array: try to match strictly match and
	 * then return pattern.indexOf(obj)!==-1
	 *
	 * Object: recurse.
	 *
	 */
	uObj.equals=function(obj,pattern)
	{
		if(obj===pattern)
			return true;
		if(obj===undefined||obj===null)
			return false;
		if(pattern instanceof RegExp)
			return pattern.test(obj);
		if(typeof pattern==="function")
		{
			if(typeof obj==="function")
				return false;
			else
				return pattern(obj);
		}
		if(typeof obj.equals==="function")
        {
            return obj.equals(pattern);
        }
		if(typeof pattern==="object")
		{
            if(typeof obj!=="object"&&Array.isArray(pattern))
            {
				return pattern.indexOf(obj)!==-1;
            }
			for(var i in pattern)
			{
				if(!uObj.equals(obj[i],pattern[i]))
					return false;
			}
			return true;
		}
		return false;
	};
	SMOD("equals",uObj.equals);
	
})(Morgas,Morgas.setModule,Morgas.getModule);
//Morgas/src/Morgas.util.object.find.js
(function(µ,SMOD,GMOD){

	var util=µ.util=µ.util||{};
	var obj=util.object||{};
	
	var SC=GMOD("shortcut")({
		eq:"equals",
		it:"iterate"
	});
	
	/** find
	 * Iterates over {source}.
	 * Returns an Array of {pattern} matching values 
	 */
	obj.find=function(source,pattern,onlyValues)
	{
		var rtn=[];
		SC.it(source,function(value,index)
		{
			if(SC.eq(value,pattern))
			rtn.push(onlyValues?value:{value:value,index:index});
		});
		return rtn;
	};
	SMOD("find",obj.find);
	
})(Morgas,Morgas.setModule,Morgas.getModule);
//Morgas/src/Morgas.util.object.iterate.js
(function(µ,SMOD,GMOD){

	var util=µ.util=µ.util||{};
	var obj=util.object||{};
	
	/** createIterator
	 * Creates an iterator for {any} in {backward} order.
	 * {isObject} declares {any} as a Map or Array. 
	 */
	//TODO iterator & Set & Map
	obj.createIterator=function* (any,backward,isObject)
	{
		if(any.length>=0&&!isObject)
		{
			for(var i=(backward?any.length-1:0);i>=0&&i<any.length;i+=(backward?-1:1))
			{
				yield [any[i],i];
			}
		}
		else if (typeof any.next==="function"||typeof any.entries==="function")
		{
			if(typeof any.entries==="function")
			{
				any=any.entries();
			}
			var step=null;
			while(step=any.next(),!step.done)
			{
				yield step.value.reverse();
			}
		}
		else
		{
			var k=Object.keys(any);
			if(backward)
			{
				k.revert();
			}
			for(var i=0;i<k.length;i++)
			{
				yield [any[k[i]],k[i]];
			}
		}
		
	};
	/** iterate
	 * Iterates over {any} calling {func} with {scope} in {backward} order.
	 * {isObject} declares {any} as an Object with a length property.
	 * 
	 * returns Array of {func} results
	 */
	//TODO iterator & Set & Map
	obj.iterate=function(any,func,backward,isObject,scope)
	{
		var rtn=[];
		if(!scope)
		{
			scope=window;
		}
		if(any.length>=0&&!isObject)
		{
			for(var i=(backward?any.length-1:0);i>=0&&i<any.length;i+=(backward?-1:1))
			{
				rtn.push(func.call(scope,any[i],i,i,false));
			}
		}
		else if (typeof any.next==="function"||typeof any.entries==="function")
		{
			if(typeof any.entries==="function")
			{
				any=any.entries();
			}
			var step=null,index=0;
			while(step=any.next(),!step.done)
			{
                isObject=step.value[1]!==step.value[0]&&step.value[0]!==index;
				rtn.push(func.call(scope,step.value[1],step.value[0],index,isObject));
                index++;
			}
		}
		else
		{
			var k=Object.keys(any);
			if(backward)
			{
				k.revert();
			}
			for(var i=0;i<k.length;i++)
			{
				rtn.push(func.call(scope,any[k[i]],k[i],i,true));
			}
		}
		return rtn;
	};
	SMOD("Iterator",obj.createIterator);
	SMOD("iterate",obj.iterate);
	
})(Morgas,Morgas.setModule,Morgas.getModule);
//Morgas/src/Morgas.Organizer.js
(function(µ,SMOD,GMOD){
	 /**
	 * Depends on	: Morgas
	 * Uses			: util.object
	 *
	 * Organizer to reindex and group arrays
	 *
	 */
	var SC=GMOD("shortcut")({
		it:"iterate",
		eq:"equals",
		path:"goPath"
	});
	 
	var ORG=µ.Organizer=µ.Class({
		init:function(values)
		{
			this.values=[];
			this.filters={};
			this.maps={};
			this.groups={};
			
			if(values)
				this.add(values);
		},
		add:function(values,groupName,groupKey)
		{
			if(groupName&&groupKey)
			{
				this.group(groupName);
				this.groups[groupName].values[groupKey]=[]
			}
			SC.it(values,function(value)
			{
				var index=this.values.length;
				this.values.push(value);
				for(var m in this.maps)
				{
					this._map(this.maps[m],index);
				}
				for(var f in this.filters)
				{
					this._filter(this.filters[f],index);
				}
				for(var g in this.groups)
				{
					this._group(this.groups[g],index);
				}
				
				if(groupName&&groupKey)
				{
					this.groups[groupName].values[groupKey].push(index);
				}
			},false,false,this);
			return this;
		},
		remove:function(value)
		{
			var valuesIndex=this.values.indexOf(value);
			if(valuesIndex!==-1)
			{
				for(var i in this.filters)
				{
					var index=this.filters[i].values.indexOf(valuesIndex);
					if(index!==-1)
					{
						this.filters[i].values.splice(index,1);
					}
				}
				for(var i in this.maps)
				{
					var map=this.maps[i].values;
					var keys=Object.keys(map);
					for(var i=0;i<keys.length;i++)
					{
						if(map[keys[i]]===value)
						{
							delete map[keys[i]];
							break;
						}
					}
				}
				for(var i in this.groups)
				{
					var group=this.groups[i].values;
					var keys=Object.keys(group);
					for(var i=0;i<keys.length;i++)
					{
						var index=group[keys[i]].indexOf(valuesIndex);
						if(index!==-1)
						{
							group[keys[i]].splice(index,1);
							break;
						}
					}
				}
				delete this.values[valuesIndex];
			}
			return this;
		},
		_removeType:function(type,name)
		{
			delete this[type][name];
		},
		clear:function()
		{
			for(var i in this.filters)
			{
				this.filters[i].values.length=0;
			}
			for(var i in this.maps)
			{
				this.maps[i].values={};
			}
			for(var i in this.groups)
			{
				this.groups[i].values={};
			}
			this.values.length=0;
			return this;
		},
		
		map:function(mapName,fn)
		{
			if(typeof fn==="string")
				fn=ORG._pathWrapper(fn);
			this.maps[mapName]={fn:fn,values:{}};
			for(var i=0;i<this.values.length;i++)
			{
				this._map(this.maps[mapName],i);
			}
			return this;
		},
		_map:function(map,index)
		{
			var key=""+map.fn(this.values[index]);
			map.values[key]=index;
		},
		getMap:function(mapName)
		{
			var rtn={};
			if(this.maps[mapName]!=null)
			{
				SC.it(this.maps[mapName].values,function(index,gIndex)
				{
					rtn[gIndex]=this.values[index];
				},false,true,this);
			}
			return rtn;
		},
		hasMap:function(mapName)
		{
			return !!this.maps[mapName];
		},
		hasMapKey:function(mapName,key)
		{
			return this.maps[mapName]&&key in this.maps[mapName].values;
		},
		getMapValue:function(mapName,key)
		{
			if(this.hasMapKey(mapName,key))
				return this.values[this.maps[mapName].values[key]];
			return undefined;
		},
		getMapKeys:function(mapName)
		{
			if(this.hasMap(mapName))
				return Object.keys(this.maps[mapName].values);
			return [];
		},
		removeMap:function(mapName)
		{
			this._removeType("maps",mapName);
			return this;
		},
		
		filter:function(filterName,filterFn,sortFn)
		{
			switch(typeof filterFn)
			{
				case "string":
					filterFn=ORG._pathWrapper(filterFn);
					break;
				case "object":
					filterFn=ORG.filterPattern(filterFn);
					break;
			}
			if(typeof sortFn==="string")
				sortFn=ORG.pathSort(sortFn);
			this.filters[filterName]={filterFn:filterFn,sortFn:sortFn,values:[]};
			for(var i=0;i<this.values.length;i++)
			{
				this._filter(this.filters[filterName],i);
			}
			return this;
		},
		_filter:function(filter,index)
		{
			if(!filter.filterFn||filter.filterFn(this.values[index]))
			{
				if(!filter.sortFn)
				{
					filter.values.push(index);
				}
				else
				{
					var i=ORG.getOrderIndex(this.values[index],this.values,filter.sortFn,filter.values);
					filter.values.splice(i,0,index);
				}
			}
		},
		hasFilter:function(filterName)
		{
			return !!this.filters[filterName];
		},
		getFilter:function(filterName)
		{
			var rtn=[];
			if(this.filters[filterName]!=null)
			{
				SC.it(this.filters[filterName].values,function(index,gIndex)
				{
					rtn[gIndex]=this.values[index];
				},false,false,this);
			}
			return rtn;
		},
		getFilterValue:function(filterName,index)
		{
			if(this.filters[filterName]&&this.filters[filterName].values[index])
				return this.values[this.filters[filterName].values[index]];
			return undefined;
		},
		getFilterLength:function(filterName)
		{
			if(this.filters[filterName])
				return this.filters[filterName].values.length;
			return 0;
		},
		removeFilter:function(filterName)
		{
			this._removeType("filters",filterName);
			return this;
		},
		
		group:function(groupName,groupFn)
		{
			if(typeof groupFn==="string")
				groupFn=ORG._pathWrapper(groupFn);
			this.groups[groupName]={values:{},fn:groupFn};
			if(groupFn)
			{
				for(var i=0;i<this.values.length;i++)
				{
					this._group(this.groups[groupName],i);
				}
			}
			return this;
		},
		_group:function(group,index)
		{
			if(group.fn)
			{
				var gKey=group.fn(this.values[index]);
				group.values[gKey]=group.values[gKey]||[];
				group.values[gKey].push(index);
			}
		},
		hasGroup:function(groupName)
		{
			return !!this.groups[groupName];
		},
		getGroup:function(groupName)
		{
			var rtn={};
			if(this.hasGroup(groupName))
			{
				for(var gKey in this.groups[groupName].values)
				{
					rtn[gKey]=this.getGroupValue(groupName,gKey);
				}
			}
			return rtn;
		},
		getGroupValue:function(groupName,key)
		{
			var rtn=[];
			if(this.hasGroup(groupName)&&this.groups[groupName].values[key])
			{
				var groupValues=this.groups[groupName].values[key];
				for(var i=0;i<groupValues.length;i++)
				{
					rtn.push(this.values[groupValues[i]]);
				}
			}
			return rtn;
		},
		hasGroupKey:function(groupName,key)
		{
			return this.hasGroup(groupName)&&key in this.groups[groupName].values;
		},
		getGroupKeys:function(groupName)
		{
			if(this.hasGroup(groupName))
				return Object.keys(this.groups[groupName].values);
			return [];
		},
		removeGroup:function(groupName)
		{
			this._removeType("groups",groupName);
			return this;
		},
		
		destroy:function()
		{
			this.values=this.filters=this.maps=this.groups=null;
			this.add=this.filter=this.map=this.group=µ.constantFunctions.ndef
		}
	});
	ORG._pathWrapper=function(path)
	{
		return function(obj)
		{
			return SC.path(obj,path);
		}
	};
	ORG.sort=function(obj,obj2,DESC)
	{
		return (DESC?-1:1)*(obj>obj2)?1:(obj<obj2)?-1:0;
	};
	ORG.pathSort=function(path,DESC)
	{
		path=path.split(",");
		return function(obj,obj2)
		{
			var rtn=0;
			for(var i=0;i<path.length&&rtn===0;i++)
			{
				rtn=ORG.sort(SC.path(obj,path[i]),SC.path(obj2,path[i]),DESC)
			}
			return rtn;
		}
	};
	ORG.filterPattern=function(pattern)
	{
		return function(obj)
		{
			return SC.eq(obj,pattern);
		}
	};
	
	/**
	 * get index of the {item} in the {source} or {order} defined by {sort}
	 * 
	 * item		any
	 * source	[any]
	 * sort		function		// param: item, source[?]  returns 1,0,-1 whether item is higher,equal,lower than source[?]
	 * order	[source index]	// optional
	 *
	 * returns	number
	 */
	ORG.getOrderIndex=function(item,source,sort,order)
	{
		//start in the middle
		var length=(order?order:source).length;
		var jump=Math.ceil(length/2);
		var i=jump;
		var lastJump=null;
		while(jump/*!=0||NaN||null*/&&i>0&&i<=length&&!(jump===1&&lastJump===-1))
		{
			lastJump=jump;
			var compare=order?source[order[i-1]] : source[i-1];
			//jump half the size in direction of this sort			(if equals jump 1 to conserv the order)
			jump=Math.ceil(Math.abs(jump)/2)*Math.sign(sort(item,compare)) ||1;
			i+=jump;
		}
		i=Math.min(Math.max(i-1,0),length);
		return i
	};
	/**
	 * create an Array of ordered indexes of {source} using {sort}
	 *
	 * source	[any]
	 * sort		function		// param: item, source[?]  returns 1,0,-1 whether item is higher,equal,lower than source[?]
	 *
	 * return [number]
	 */
	ORG.getSortedOrder=function(source,sort)
	{
		var order=[];
		SC.it(source,function(item,index)
		{
			var orderIndex=ORG.getOrderIndex(item,source,sort,order);
			order.splice(orderIndex,0,index);
		});
		return order;
	};
	
	SMOD("Organizer",ORG);
	
})(Morgas,Morgas.setModule,Morgas.getModule);
//GUI/TalePlay.GUIElement.TextBox.js
(function(µ,SMOD,GMOD){
	
	var GUI=GMOD("GUIElement"),
	
	SC=GMOD("shortcut")({
		rs:"rescope"
	});
	
	var BOX=GUI.TextBox=µ.Class(GUI,{
		init:function(param)
		{
			SC.rs.all(this,["_run"]);
			
			param=param||{};
			
			this.mega(param);
			this.addStyleClass("TextBox");
			this.createListener("complete");
			
			this.parts=[];
			for(var i=0,l=param.parts&&param.parts.length;i<l;i++)
			{
				var p=param.parts[i];
				this.addPart(p.text, p.speed, p.stop, p.styleClass, p.tag);
			}
			
			this._timeout=null;
		},
		addPart:function(text,speed,stop,styleClass,tag)
		{
			this.parts.push({
				text:text||"",
				speed:(1000/speed)||25,
				stop:!!stop,
				styleClass:styleClass,
				tag:tag||"span"
			});
		},
		start:function()
		{
			if(this._timeout===null)
			{
				this.domElement.classList.remove("complete","stop");
				this._run();
			}
		},
		_run:function()
		{
			this._timeout=null;
			if(this.parts.length>0)
			{
				var part=this.parts[0];
				if(!part.domElement)
				{
					part.domElement=document.createElement(part.tag);
					part.styleClass&&part.domElement.classList.add(part.styleClass);
					this.domElement.appendChild(part.domElement);
				}
				part.domElement.textContent+=part.text[part.domElement.textContent.length];
				if(part.domElement.textContent.length===part.text.length)
				{
					this.parts.shift();
					if(part.stop)
					{
						this.domElement.classList.add("stop");
						return;
					}
				}
				this._timeout=setTimeout(this._run, part.speed);
			}
			else
			{
				this.domElement.classList.add("complete");
			}
		},
		show:function(untillStop)
		{
			if(this._timeout!==null)
			{
				clearTimeout(this._timeout);
				this._timeout=null;
			}
			while(this.parts.length>0)
			{
				var part=this.parts[0];
				if(!part.domElement)
				{
					part.domElement=document.createElement(part.tag);
					part.domElement.classList.add(part.styleClass);
					this.domElement.appendChild(part.domElement);
				}
				part.domElement.textContent=part.text;
				this.parts.splice(0,1);
				if(untillStop&&part.stop)
				{
					this.domElement.classList.add("stop");
					return;
				}
			}
			this.domElement.classList.add("complete");
		},
		onButton:function(event)
		{
			if(event.value==1)
			{
				if(this._timeout===null)
				{
					if(this.parts.length===0)
					{
						this.fire("complete");
					}
					else
					{
						this.start();
					}
				}
				else
				{
					this.show(true);
				}
			}
		}
	});
	
	SMOD("GUI.TextBox",BOX);
	
})(Morgas,Morgas.setModule,Morgas.getModule);
//TalePlay.Layer.Persistance.js
(function(µ,SMOD,GMOD){
	
	var LAYER=GMOD("Layer");
	
	var SC=GMOD("shortcut")({
		rs:"rescope",
		Menu:"GUI.Menu",
		debug:"debug",
		download:"download"
	});
	
	var PERSISTANCE=LAYER.Persistance=µ.Class(LAYER,{
		init:function(param)
		{
			param=param||{};
			
			this.mega({mode:LAYER.Modes.LAST});
			SC.rs.all(this,["_update","_fillMenu"]);
			
			this.createListener("load");

			this.domElement.classList.add("Persistance");
			
			this.dbConn=param.dbConn;
			this.saveClass=param.saveClass;
			this.saveData=param.saveData;
			
			this.menu=new SC.Menu({
				type:param.type||SC.Menu.Types.TABLE,
				styleClass:"center",
				active:param.active||0,
				loop:param.loop===true,
				selectionType:SC.Menu.SelectionTypes.NONE,
				converter:param.saveConverter
			});
			
			this.add(this.menu);
			this.menu.addListener("select",this,"_onSelect");
			
			this._update();
		},
		onController:function(event)
		{
			if(event.type==="buttonChanged"&&event.value==1)
			{
				switch(event.index)
				{
					case 1:
						if(this.GUIElements.length>1)this.GUIElements[1].setActive(3);//submenu
						else this.destroy();
						break;
					case 2:
						this.mega(event);
						break;
				}
			}
			else
			{
				this.mega(event);
			}
		},
		_update:function()
		{
			this.dbConn.load(this.saveClass,{}).then(this._fillMenu);
			return null;
		},
		_fillMenu:function(results)
		{
			this.menu.clear();
			var saves=[];
			for(var i=0;i<results.length;i++)
			{
				saves[results[i].getID()]=results[i];
			}
			saves.push(null);
			this.menu.addAll(saves);
			if(this.menu.getActive().index===-1)this.menu.setActive(0);
			return null;
		},
		_onSelect:function(event)
		{
			if(event.value)
			{
				var subMenu=new SC.Menu({
					styleClass:["panel","center"],
					items:[
					   this.saveData ? "Save" : "Load",
					   "Export",
					   "Delete",
					   "Cancel"
					],
					active:0,
					loop:false,
					selectionType:SC.Menu.SelectionTypes.NONE
				});
				subMenu.addListener("select",this,"_onSubSelect");
				this.add(subMenu);
			}
			else if (this.saveData)
			{
				this.saveData.setID(event.index);
				this.dbConn.save([this.saveData]).then(this._update);
			}
		},
		_onSubSelect:function(event)
		{
			switch (event.value)
			{
				case "Load":
					this.fire("load",{save:this.menu.getActive().value});
					break;
				case "Save":
					this.saveData.setID(this.menu.getActive().index);
					this.dbConn.save([this.saveData]).then(this._update);
					break;
				case "Export":
					SC.download(JSON.stringify(this.menu.getActive().value),"save.json","application/json");
					break;
				case "Delete":
					this.dbConn["delete"](this.saveClass,[this.menu.getActive().value]).then(this._update);
					break;
				case "Cancel":
					break;
			}
			event.source.destroy();
		}
	});
	SMOD("Layer.Persistance",PERSISTANCE);
	
})(Morgas,Morgas.setModule,Morgas.getModule);
//Morgas/src/Morgas.util.object.goPath.js
(function(µ,SMOD,GMOD){

	var util=µ.util=µ.util||{};
	var uObj=util.object||{};

	/** goPath
	 * Goes the {path} from {obj} checking all but last step for existance.
	 * 
	 * goPath(obj,"path.to.target") === goPath(obj,["path","to","target"]) === obj.path.to.target
	 */
	uObj.goPath=function(obj,path,create)
	{
		var todo=path;
		if(typeof todo=="string")todo=todo.split(".");
		else todo=todo.slice();
		
		while(todo.length>0&&obj)
		{
			if(create&&!(todo[0] in obj)) obj[todo[0]]={};
			obj=obj[todo.shift()];
		}
		if(todo.length>0)
		{
			return undefined
		}
		return obj;
	};
	SMOD("goPath",uObj.goPath);
	
})(Morgas,Morgas.setModule,Morgas.getModule);
//Morgas/src/Morgas.util.download.js
(function(µ,SMOD,GMOD){
	
	var util=µ.util=µ.util||{};
	util.download=function(data,name,mediaType)
	{
		if(data instanceof Blob)
		{
			data=URL.createObjectURL(data)
		}
		name=name||"file";
		mediaType=mediaType||"";
		
		util.download.el.download=name;
		if(data.startsWith("data:")||data.startsWith("blob:"))
		{
			util.download.el.href=data;
		}
		else
		{
			util.download.el.href="data:"+mediaType+";base64,"+btoa(unescape(encodeURIComponent(data)));
		}
		document.body.appendChild(util.download.el);
		util.download.el.click();
		util.download.el.remove();
	};
	util.download.el=document.createElement("a");
	SMOD("download",util.download);
	
})(Morgas,Morgas.setModule,Morgas.getModule);