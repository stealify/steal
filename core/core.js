// steal is a resource loader for JavaScript.  It is broken into the following parts:
//
// - Helpers - basic utility methods used internally
// - AOP - aspect oriented code helpers
// - Deferred - a minimal deferred implementation
// - Uri - methods for dealing with urls
// - Api - steal's API
// - Module - an object that represents a resource that is loaded and run and has dependencies.
// - Type - a type systems used to load and run different types of resources
// - Packages -  used to define packages
// - Extensions - makes steal pre-load a type based on an extension (ex: .coffee)
// - Mapping - configures steal to load resources in a different location
// - Startup - startup code
// - jQuery - code to make jQuery's readWait work
// - Error Handling - detect scripts failing to load
// - Has option - used to specify that one resources contains multiple other resources
// - Window Load - API for knowing when the window has loaded and all scripts have loaded
// - Interactive - Code for IE
// - Options - 
(function( undefined ) {

	/*# helpers.js #*/

	/*# deferred.js #*/

	/*# uri.js #*/

	/*# config_manager.js #*/

	/*# types.js #*/

	/*# module.js #*/

	function stealManager(kickoff, config, setStealOnWindow){

		// a startup function that will be called when steal is ready
		var interactiveScript,
			// key is script name, value is array of pending items
			interactives = {};
		var startup = function(){};

		// Removing because this will be passed in
		// var opts    = (typeof h.win.steal == "object" ? h.win.steal : {});
		
		var st = function() {
			
			// convert arguments into an array
			var args = h.map(arguments, function(options){
				if(options){
					var opts = h.isString(options) ? {
						id: options
					} : options;
					
					if( !opts.idToUri ){
						opts.idToUri =  st.idToUri
					} 
					return opts;
				} else {
					return options;
				}
			});
			if ( args.length ) {
				Module.pending.push.apply(Module.pending, args);
				// steal.after is called everytime steal is called
				// it kicks off loading these files
				st.after(args);
				// return steal for chaining
			}

			return st;
		};
		if(setStealOnWindow){
			h.win.steal = st;
		}
		st.clone = function(){
			return stealManager(false, config.cloneContext())
		}

		st.config = function(){
			st.config.called = true;
			return config.attr.apply(config, arguments)
		};
		st.require = function(){
			return config.require.apply(config, arguments);
		}
		st.config.called = false;
		st._id = Math.floor(1000 * Math.random());

		/*# config.js #*/
		
		/*# amd.js #*/

		/*# static.js #*/

		/*# packages.js #*/

		var Module = moduleManager(st, modules, interactives, config);
		resources  = Module.resources; 

		/*# shim.js #*/

		/*# startup.js #*/

		/*# interactive.js #*/


		// Use config.on to listen on changes in config. We primarily use this
		// to update resources' paths when stealconfig.js is loaded.
		config.on(function(configData){
			h.each(resources, function( id, resource ) {
				// if resource is not a function it means it's `src` is changeable
				if ( resource.options.type != "fn" ) {
					// finds resource's needs 
					// TODO this is terrible
					var needs = (resource.options.needs || []).slice(0),
						buildType = resource.options.buildType;
					resource.setOptions(resource.orig);
					var newId = resource.options.id;
					// this mapping is to move a config'd key

					if (id !== newId) {
						resources[newId] = resource;
						// TODO: remove the old one ....
					}
					resource.options.buildType = buildType;
					
					// if a resource is set to load
					// check if there are new needs
					if( resource.isSetupToExecute ) {
						// find all `needs` and set up "late dependencies"
						// this allows us to steal files that need to load
						// special converters without loading these converters
						// explicitely:
						// 
						//    steal('view.ejs', function(ejsFn){...})
						//
						// This will load files needed to convert .ejs files
						// without explicite steal
						h.each(resource.options.needs||[],function(i,need){
							if(h.inArray(needs, need) == -1){
								var n = steal.make(need);
								n.execute()
								resource.needsDependencies.push(n);
								resource.lateNeedDependency = n;
							}
						})
					}
				}				
			});
			// set up shims after paths are updated
			if(configData.shim){
				st.setupShims(configData.shim)
			}
		})

		st.File = st.URI = URI;

		if(kickoff){
			var stealModule = new Module({id:"steal"})
			stealModule.value = st;
			stealModule.loaded.resolve();
			stealModule.run.resolve();
			stealModule.executing = true;
			stealModule.completed.resolve();

			resources[stealModule.options.id] = stealModule;
		}

		startup();
		//win.steals = steals;
		st.resources = resources;
		st.Module = Module;

		return st;
	}

	stealManager(true, new ConfigManager(typeof h.win.steal == "object" ? h.win.steal : {}), true)

})();