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
	µ.getDebug=function(debug){µ.debug.verbose=debug};
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
	 *  	//or this.superInit(mySuperClass,arg1,arg2...);
	 *  	//or this.superInitApply(mySuperClass,arguments);
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
		if(superClass)
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
	 */
	var BASE=µ.BaseClass=CLASS(
	{
		init:function baseInit(){},
		superInit:function superInit(_class/*,arg1,arg2,...,argN*/)
		{
			_class.prototype.init.apply(this,[].slice.call(arguments,1));
		},
		superInitApply:function superInitApply(_class,args)
		{
			this.superInit.apply(this,[_class].concat([].slice.call(args)));
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
			

			SC.rs.all(["focus"],this);
			
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
		setControllerDisabled:function()
		{
			//TODO
		},
		_ctrlCallback:function(event)
		{
			if(!this.disabled&&this.layers.length>0)
			{
				var args=Array.prototype.slice.call(arguments,0);
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
	
	/**Listener Class
	 * Holds Arrays of functions to fire or fire once when "fire" is called
	 * When fired and a listening function returns false firing is aborted
	 * When added a type can be passed:
	 * 		"first" function gets prepended
	 * 		"last" function gets appended (default)
	 * 		"once" function is removed after call 
	 * 			(will only be called when "normal" listeners haven't abort firing.
	 * 			cant abort other "once" listening functions)
	 *  
	 * Can be disabled
	*/
	var LISTENER=µ.Listener=µ.Class(
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
                    if(entry.first.size===0&&entry.normal.size===0&&entry.last.size===0)
                    {
                        this.listeners["delete"](scope);
                    }
                }
				return run;
			}
			return null;
		},
		setDisabled:function setDisabled(bool){this.disabled=bool===true;},
		isDisabled:function isDisabled(){return this.disabled;}
	});
	SMOD("Listener",LISTENER);
	
	/** StateListener Class
	 * Listener that fires only when "setState" is called
	 * When state is set it fires added listening functions with last arguments immediately
	 * reset trough "resetState";
	 */
	var STATELISTENER=LISTENER.StateListener=µ.Class(LISTENER,
	{
		init:function StateListenerInit(param)
		{
			this.superInit(LISTENER);
			this.state=param.state===true;
			this.stateDisabled=false;
			this.lastEvent=null;
		},
		setDisabled:function setDisabled(bool){this.stateDisabled=bool===true;},
		isDisabled:function isDisabled(){return this.stateDisabled;},
		setState:function setState(source,event)
		{
            event=event||{};
            event.source=source;

			this.state=true;
			this.lastEvent=event;

			var rtn=false;
			if(!this.stateDisabled)
			{
				this.disabled=false;
				rtn=this.fire.apply(this,this.lastEvent);
				this.disabled=true
			}
			return rtn;
		},
		resetState:function resetState(){this.state=false;},
		getState:function getState(){return this.state},
		addListener:function addListener(fn,scope,type)
		{
			var doFire=this.state&&!this.stateDisabled;
			if(doFire)
			{
				fn.apply(scope,this.lastEvent);
			}
			if(!(doFire&&typeof type=="string"&&type.toLowerCase()=="once"))
			{
				return LISTENER.prototype.addListener.apply(this,arguments);
			}
			return null;
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
	var LISTENERS=µ.Listeners=µ.Class(
	{
		rNames:/[\s|,]+/,
		rNameopt:":",
		init:function ListenersInit(dynamic)
		{
			this.listeners={};
			this.createListener(".created");
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
		setDisabled:function setDisabled(names,bool)
		{
			var nameArr=names.split(this.rNames);
			for(var i=0;i<nameArr.length;i++)
			{
				var lstnr=this.listeners[nameArr[i]];
				if(lstnr!=null)
					lstnr.setDisabled(bool);
			}
		},
		isDisabled:function isDisabled(names)
		{
			var rtn=true;
			var nameArr=names.split(this.rNames);
			for(var i=0;rtn&&i<nameArr.length;i++)
			{
				var lstnr=this.listeners[nameArr[i]];
				if(lstnr!=null)
					rtn&=lstnr.isDisabled();
			}
			return rtn;
		},
		setState:function setState(name,event)
		{
			event=event||{};
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
			var nameArr=names.split(this.rNames);
			for(var i=0;i<nameArr.length;i++)
			{
				var lstnr=this.listeners[nameArr[i]];
				if(lstnr!=null&&lstnr instanceof STATELISTENER)
					lstnr.resetState();
			}
		},
		getState:function getState(names)
		{
			var rtn=true;
			var nameArr=names.split(this.rNames);
			for(var i=0;rtn&&i<nameArr.length;i++)
			{
				var lstnr=this.listeners[nameArr[i]];
				if(lstnr!=null&&lstnr instanceof STATELISTENER)
					rtn&=lstnr.getState();
			}
			return rtn
		},
		destroy:function()
		{
			this.removeListener("all");
		}
	});
	SMOD("Listeners",LISTENERS);
	LISTENERS.attachListeners=function attachListeners(instance)
	{
		for(var i in LISTENERS.prototype)
		{
			if (i!="init"&&i!="constructor"&&i!="superInit"&&i!="superInitApply")
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
			this.superInit(LST);
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
			LST.prototype.destroy.call(this);
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
			this.superInit(LST);
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
			LST.prototype.destroy.call(this);
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
			this.superInit(LST);
			
			this.disabled=false;
			this.analogSticks={};
			this.buttons={};
			this.mapping=null;
			
			this.setMapping(mapping,mappingName);
			this.createListener("changed analogStickChanged buttonChanged");
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
		setDisabled:function(disabled)
		{
			this.disabled=disabled===true;
			for(var i in this.listeners)
			{
				this.listeners[i].setDisabled(this.disabled);
			}
		},
		destroy:function()
		{
			//TODO;
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
			this.superInit(POINT,x,y);
		},
		clone:function(cloning)
		{
			if(!cloning)
			{
				cloning=new CTRL.AnalogStick();
			}
			POINT.prototype.clone.call(this,cloning);
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
			POINT.prototype.set.call(this,numberOrPoint,y);
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
			this.superInit(CTRL,map);
			SC.rs.all(["update"],this);
			
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
			CTRL.prototype.setDisabled.call(this,disabled);
			if(this.disabled)
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
			this.superInit(CTRL,mapping!==undefined ? mapping : CTRL.Keyboard.stdMapping,mappingName);
			
			SC.rescope.all(["onKeyDown","onKeyUp"],this);
			
			this.domElement=null;
			this.setDomElement(domElement||window)
		},
		setMapping:function(mapping)
		{
			CTRL.prototype.setMapping.call(this, mapping);
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
				if(this.mapping.hasButtonMapping(event.code||event.key||event.keyCode)||this.mapping.hasButtonAxisMapping(event.code||event.key||event.keyCode))
				{
					event.preventDefault();
					event.stopPropagation();
					
					var map={};
					map[event.code||event.key||event.keyCode]=value;
					this.setButton(map);
				}
			}
		},
		destroy:function()
		{
			this.setDomElement();
			CTRL.prototype.destroy.call(this);
		}
	});
	CTRL.Keyboard.stdMapping={
		"buttons": {
			"1": "2",
			"2": "3",
			"3": "4",
			"4": "5",
			"5": "6",
			"6": "7",
			" ": "0",
			"Shift": "1",
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
			
			this.superInit(GUI,param);
			this.addStyleClass("ControllerManager");
			SC.rs.all(["_Click","_playerChanged","_mappingsLoaded"],this);
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
			GUI.prototype.destroy.call(this);
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
			SC.rescope.all(["_stepActive","onClick"],this);
			
			param=param||{};
			
			this.superInit(GUI,param);
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
				var step=this._stepActive();
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
						if(this.menu.active+step<0)
						{
							var r=this.menu.items.length%gridLayout.columns;
							step=(r===0||r>this.menu.active) ? -r : step-r;
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
        }
	});
	SMOD("Math.Rect",RECT);
})(Morgas,Morgas.setModule,Morgas.getModule);
//TalePlay.Layer.MapMaker.js
(function(µ,SMOD,GMOD){
	
	var Layer=GMOD("Layer");

	var SC=µ.getModule("shortcut")({
		rs:"rescope",
		setIn:"setInputValues",
		getIn:"getInputValues",
		Map:"GUI.Map",
		Menu:"GUI.Menu"
	});
	
	//inner class
	var imageLayer=µ.Class(Layer,{
		init:function(param)
		{
			this.image=param.image;
			this.callback=param.callback;
			this.scope=param.scope||this;
			this.image.trigger=this.image.trigger||{value:""};
			
			this.getTriggerValueHTML=param.getTriggerValueHTML||this.getTriggerValueHTML;
			this.getTriggerValue=param.getTriggerValue||this.getTriggerValue;
			this.onAction=param.onAction||this.onAction;
			
			this.superInit(Layer);
			SC.rs.all(["onClick"],this);
			this.domElement.classList.add("overlay","imageLayer");
			this.domElement.innerHTML='<div class="panel">'+
				'<table>'+
					'<tr><td>Name</td><td colspan="100%"><input type="text" name="name"></td></tr>'+
					'<tr><td>Position</td><td>X</td><td><input type="number" min="0" data-path="rect.position" name="x"></td>'+
						'<td>Y</td><td colspan="100%"><input type="number" min="0"  data-path="rect.position" name="y"></td></tr>'+
					'<tr><td>Size</td><td>X</td><td><input type="number" min="0" data-path="rect.size" name="x"></td>'+
						'<td>Y</td><td colspan="100%"><input type="number" min="0"  data-path="rect.size" name="y"></td></tr>'+
					'<tr><td>Collision</td><td colspan="100%"><input type="checkbox" name="collision"></td></tr>'+
					'<tr><td>Trigger type</td><td colspan="100%"><select data-path="trigger" name="type"><option>none</option>'+
						'<option value="activate">activate</option><option value="step">step</option><option value="move" disabled>move</option></select></td></tr>'+
					'<tr class="triggerValue"><td>'+this.getTriggerValueHTML(this.image)+'</td></tr>'+
					'</table>'+
				'<button data-action="ok">OK</button><button data-action="cancel">cancel</button>'+(this.image.map ? '<button data-action="remove">remove</button>':'')+
			'</div>';
			SC.setIn(this.domElement.querySelectorAll("[name]"),this.image);
			
			this.domElement.addEventListener("click",this.onClick,false);
			this.domElement.addEventListener("change",this.onClick,false);
			param.board.addLayer(this);
			this.domElement.querySelector('[name="name"]').focus();
		},
		onClick:function(e)
		{
			var action=e.target.dataset.action;
			if(action)
			{
				e.stopPropagation();
				switch(e.target.dataset.action)
				{
					case "ok":
						SC.getIn(this.domElement.querySelectorAll("[name]"),this.image);
						this.image.trigger.value=this.getTriggerValue(this.domElement.querySelector(".triggerValue"));
						break;
					case "cancel":
						//does nothing
						break;
					case "remove":
						//does nothing
						break;
					default:
						this.onAction(this.image,e.target.dataset.action,e);
						return; //do not close layer on other actions
				}
				this.callback.call(this.scope,this.image,e.target.dataset.action);
				this.destroy();
			}
		},
		destroy:function()
		{
			this.image=this.callback=this.scope=undefined;
			Layer.prototype.destroy.call(this);
		},
		
		getTriggerValueHTML:function(image)
		{
			return 'Trigger value</td><td colspan="100%"><input type="text" data-path="trigger" name="value">';
		},
		getTriggerValue:function(tr)
		{
			tr.childNodes[1].childNodes[0].value;
		},
		onAction:function(image,action,event){}//dummy
	});
	
	var MapMaker=Layer.MapMaker=µ.Class(Layer,{
		init:function(param)
		{
			param=param||{};
			this.superInit(Layer);
			this.domElement.classList.add("MapMaker");
			if(param.board)
			{
				param.board.addLayer(this);
			}
			this.imageLayerParam=param.imageLayer||{};
			this.map=new SC.Map({
				cursors:new SC.Map.Cursor(param.cursorImage||"../Images/cursor_target.svg",0,{x:100,y:100},{x:50,y:50})
			});
			this.add(this.map);
			this.images=new SC.Menu({
				styleClass:["images","panel"],
				type:SC.Menu.Types.VERTICAL,
				selectionType:SC.Menu.SelectionTypes.NONE,
				columns:1,
				converter:function(item,index,selected){
					return '<img src="'+item.url+'">';
				}
			});
			if(param.images) this.addImages(param.images);
			this.add(this.images);
			this.images.addListener("select",this,"placeImage");
			
			this.map.setPosition(0);
		},
		onController:function(event)
		{
			var i=Math.min(event.index,1);
			switch(event.type)
			{
				case "analogStickChanged":
					this.GUIElements[i].onAnalogStick(event);
					break;
				case "buttonChanged":
                    if(i===0)
                    {
                        this.selectImage(event);
                    }
                    else
                    {
                        this.GUIElements[1].onButton(event);
                    }
					break;
			}
		},
		addImages:function(imageSrc)
		{
			if(imageSrc)
			{
				var images=[].concat(imageSrc).map(function(val)
				{
					var rtn={url:undefined};
					if(val instanceof File)
					{
						rtn.url=URL.createObjectURL(val);
						rtn.fileType=val.type;
						var reader=new FileReader();
						reader.onload=function(e)
						{
							rtn.file=Array.prototype.slice.call(new Uint8Array(e.target.result,0,e.target.result.byteLength));
						};
						reader.readAsArrayBuffer(val);
					}
					else if(typeof val==="string")
					{
						rtn.url=val;
					}
					else
					{
						rtn=val;
					}
					return rtn;
				});
				this.images.addAll(images);
			}
		},
		placeImage:function(e)
        {
            new imageLayer({
            	board:this.board,
            	image:new SC.Map.Image(e.value.url,this.map.cursors[0].getPosition(),100),
            	callback:function(image,action)
            	{
    				if(action==="ok")
    				{
    					this.map.add(image);
    					image.update();
    					this.map.updateSize();
    				}
    				this.board.focus();
    			},
                scope:this,
                
                getTriggerValueHTML:this.imageLayerParam.getTriggerValueHTML,
                getTriggerValue:this.imageLayerParam.getTriggerValue,
                onAction:this.imageLayerParam.onAction,
           });
		},
        selectImage:function()
        {
            var pos=this.map.cursors[0].getPosition();
            var _self=this;
            var image=this.map.getImages(function(val){return val!==_self.map.cursors[0]&&val.rect.contains(pos)})[0];
            if(image)
            {
                new imageLayer({
                	board:this.board,
                	image:image,
                	callback:function(image,action)
	                {
	                	if(action==="ok")
	                	{
		                    image.update();
	                	}
	                    else if(action==="remove")
	    				{
	    					image.remove();
	    				}
	                	if(action!=="cancel")
	                	{
	    					this.map.updateSize();
	                	}
	                    this.board.focus();
	                },
	                scope:this,
	                
	                getTriggerValueHTML:this.imageLayerParam.getTriggerValueHTML,
	                getTriggerValue:this.imageLayerParam.getTriggerValue,
	                onAction:this.imageLayerParam.onAction,
	           });
            }
        },
		toJSON:function()
		{
			return {
				map:this.map,
				images:this.images.menu.items
			};
		},
		fromJSON:function(json)
		{
			for(var i=0;i<json.images.length;i++)
			{
				if(json.images[i].file)
				{
					var oldUrl=json.images[i].url;
					json.images[i].url=URL.createObjectURL(new Blob([new Uint8Array(json.images[i].file)],{type:json.images[i].fileType}));
					var mapImages=json.map.map.images;
					for(var l=0;l<mapImages.length;l++)
					{
						if(mapImages[l].url===oldUrl)
						{
							mapImages[l].url=json.images[i].url;
						}
					}
				}
			}
			this.map.fromJSON(json.map);
			this.images.clear();
			this.images.addAll(json.images);
			return this;
		}
	});
	SMOD("MapMaker",MapMaker);
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
	uFn.rescope.all=function(keys,scope)
	{	
		keys=keys||Object.keys(scope);
		for(var i=0;i<keys.length;i++)
		{
			scope[keys[i]]=uFn.rescope(scope[keys[i]],scope);
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
	 * 			this.superPatch(µ.patch);//call super.patch // in case of µ.Patch its not necessary 
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
	 * 			this.superInit(mySuperPatch,instance,param);
	 * 			//or this.superInitApply(mySuperPatch,arguments);
	 * 
	 * 			if(this.instance!=null)
	 * 			{
	 * 				//your constructor
	 * 				//post patch:  this.instance.addListener("created",function(param,noListeners){}) 
	 * 			}
	 * 		},
	 * 		patch:function(param,noListeners)
	 * 		{
	 * 			this.superPatch(mySuperPatch,param,noListeners);
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
		superPatch:function superPatch(_class/*,arg1,arg2,...,argN*/)
		{
			_class.prototype.patch.apply(this,[].slice.call(arguments,1));
		},
		superPatchApply:function superPatchApply(_class,args)
		{
			this.superPatch.apply(this,[_class].concat([].slice.call(args)));
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
				this.superInit(DBFRIEND,type,fieldname1,null,fieldname2,null);
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
			this.superInit(DBObj,param);
			
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
			this.superInit(GUI,param);
			SC.rs.all(["onInputChange","onClick"],this);
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
				input.value=event.code||event.key||event.keyCode;
				input.title=getTitle(event.code||event.key||event.keyCode);
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
			GUI.prototype.destroy.call(this);
		}
	});
	SMOD("GUI.ControllerConfig",CONF);
	
})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule);
//Morgas/src/Morgas.util.object.inputValues.js
(function(µ,SMOD,GMOD){

	var util=µ.util=µ.util||{};
	var obj=util.object||{};
	
	var SC=GMOD("shortcut")({
		goPath:"goPath"
	});
	
	/**
	 * set input values from object
	 * path in object is defined by data-path attribute
	 * key in object is defined by data-field attribute
	 * @param inputs[] input Nodes
	 * @param {object} source
	 */
	obj.setInputValues=function(inputs,source)
	{
		for(var i=0;i<inputs.length;i++)
		{
			var path=(inputs[i].dataset.path ? inputs[i].dataset.path+"." : "")+inputs[i].name;
			var value=SC.goPath(source, path);
			if(value!==undefined)
			{
				if(inputs[i].type==="checkbox")
				{
					inputs[i].checked=!!value;
				}
				else
				{
					inputs[i].value=value;
				}
			}
		}
	};

	/**
	 * collect input values into object
	 * path in object is defined by data-path attribute
	 * key in object is defined by data-field attribute
	 * @param inputs[] input Nodes
	 * @param {object} target
	 */
	obj.getInputValues=function(inputs,target,create)
	{
		var rtn=target||{};
		for(var i=0;i<inputs.length;i++)
		{
			var t=rtn;
			if(inputs[i].dataset.path)
			{
				t=SC.goPath(t, inputs[i].dataset.path,!target||create);
			}
			if(t!==undefined&&(inputs[i].name in t||!target||create))
			{
				if(inputs[i].type==="checkbox")
				{
					t[inputs[i].name]=inputs[i].checked;
				}
				else
				{
					t[inputs[i].name]=inputs[i].value;
				}
			}
		}
		return rtn;
	};
	
	SMOD("setInputValues",obj.setInputValues);
	SMOD("getInputValues",obj.getInputValues);
	
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
		point:"Math.Point"
	});
	
	var cursorFilter= function(image){return image instanceof GUI.Map.Cursor};
	var cursorGetter= function(GuiMap){return GuiMap.organizer.getFilter("cursors")};
	
	GUI.Map=µ.Class(GUI,{
		init:function(param)
		{
			param=param||{};
			
			this.superInit(GUI,param);
			this.createListener("trigger");
			SC.rescope.all(["_animateCursor"],this);
			
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
		            var distance=cursor.move(data.direction,timeDiff);

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
							distance:distance
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
    		this.superInit(MAP.Image,url,position,size,name);

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
			MAP.Image.prototype.fromJSON.call(this,json);
			this.collision=json.collision;
			this.trigger=json.trigger;
			
			return this;
		}
    });
	GUI.Map.Cursor=µ.Class(GUI.Map.Image,{
    	init:function(urls,position,size,offset,name,colision,trigger,speed)
    	{
    		this.superInit(GUI.Map.Image,GUI.Map.Cursor.emptyImage,position,size,name,colision,trigger);
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
        update:function()
        {
        	GUI.Map.Image.prototype.update.call(this);
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
    		var distance=new SC.point();
			if(this.map)
			{
				var size=this.map.getSize();
				distance.set(this.direction).mul(this.speed).mul(timediff/1000);
				
				//map boundary
				var pos=this.rect.position.clone().add(this.offset);
				if(pos.x+distance.x<0)
				{
					distance.x=-pos.x;
				}
				else if (pos.x+distance.x>size.x)
				{
					distance.x=size.x-pos.x;
				}
				if(pos.y+distance.y<0)
				{
					distance.y=-pos.y;
				}
				else if (pos.y+distance.y>size.y)
				{
					distance.y=size.y-pos.y;
				}
				//collision
				if(this.collision)
				{
					var progress=1;
					var rect=this.rect.clone();
					rect.position.add(distance);
					var collisions=this.map.gui.collide(rect);
					for(var i=0;i<collisions.length;i++)
					{
						var cImage=collisions[i];
						var p=null;
						if(cImage===this||this.rect.contains(cImage.rect)||cImage.rect.contains(this.rect))
						{//is self or inside
							continue;
						}
						
						if(distance.x>0&&this.rect.position.x+this.rect.size.x<=cImage.rect.position.x)
						{
							p=Math.max(p,(cImage.rect.position.x-this.rect.position.x-this.rect.size.x)/distance.x);
						}
						else if (distance.x<0&&this.rect.position.x>=cImage.rect.position.x+cImage.rect.size.x)
						{
							p=Math.max(p,(cImage.rect.position.x+cImage.rect.size.x-this.rect.position.x)/distance.x);
						}
						
						if(distance.y>0&&this.rect.position.y+this.rect.size.y<=cImage.rect.position.y)
						{
							p=Math.max(p,(cImage.rect.position.y-this.rect.position.y-this.rect.size.y)/distance.y);
						}
						else if (distance.y<0&&this.rect.position.y>=cImage.rect.position.y+cImage.rect.size.y)
						{
							p=Math.max(p,(cImage.rect.position.y+cImage.rect.size.y-this.rect.position.y)/distance.y);
						}
						
						if(p!==null)
						{
							progress=Math.min(progress,p);
						}
					}
					distance.mul(progress);
				}
				GUI.Map.Image.prototype.move.call(this,distance);
			}
			this.updateDirection();
			return distance;
    	},
		toJSON:function()
		{
			var json=GUI.Map.Image.prototype.toJSON.call(this);
			json.offset=this.offset;
			json.speed=this.speed;
			delete json.url;
			json.urls=this.urls.slice();
			return json;
		},
		fromJSON:function(json)
		{
			json.url=GUI.Map.Cursor.emptyImage;
			GUI.Map.Image.prototype.fromJSON.call(this,json);
			this.offset.set(json.offset);
			this.speed.set(json.speed);
			this.setUrls(json.urls);
			
			return this;
		}
    });
	GUI.Map.Cursor.emptyImage="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
    GUI.Map.Cursor.zIndexOffset=100;
    GUI.Map.Cursor.Animation=µ.Class({
    	init:function(cursor)
    	{
    		this.cursor=cursor;
    		this.progress=0;
    	},
    	step:function(timeDiff)
    	{
    		SC.debug("Abstract GUI.Map.Cursor.Animation used",SC.debug.LEVEL.WARNING);
    	}
    });
    GUI.Map.Cursor.Animation.Key=µ.Class(GUI.Map.Cursor.Animation,{ //key animation
    	init:function(cursor,keys)
    	{
    		this.superInit(GUI.Map.Cursor.Animation,cursor);
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
		if(typeof todo=="string")
			todo=todo.split(".");
		
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