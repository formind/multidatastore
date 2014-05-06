YUI.add("dbmulti-datastore", function(Y, NAME) {
  
	var build_count	= "1.0.001",
		Lang 		= Y.Lang,
		sub        	= Lang.sub,
		isValue    	= Lang.isValue,
		isString   	= Lang.isString,
		isNumber   	= Lang.isNumber,
		isArray		= Lang.isArray,
		isFunction 	= Lang.isFunction,
		isObject	= Lang.isObject,
		YObject    	= Y.Object;
  
	
	function DbMultiDataStore(config){
		DbMultiDataStore.superclass.constructor.apply(this, arguments);
	}
	
	
	Y.DbMultiDataStore = Y.extend(DbMultiDataStore, Y.DbMultiDsBase, {
	
	//Y.DbMultiDataStore = Y.Base.create("dbmultidatastore", Y.ModelList, [Y.DbModelSyncExt], {
	
	
		o_viewhndlb	: null,
		url			: "./component/srv/app_coordinator.php", 
		sendParam	: ["process_name", "process_step", "isType"],
		model		: null,
		
		DB_OPERATIONS : {
			'create'	: 'set_data',
			'select'  	: 'get_init_data',
			'update'	: 'upd_data',
			'delete'	: 'del_data'
		},
  		
		/** 
			protected method
		**/
		getStoreInfo: function (store) {
			if (Lang.isString(store)) {
				return this.stores[store];
			}

			return store && this._storeInfoMap[Y.stamp(store, true)];
		},
		
		createStore: function (name, config, data) {
			Y.log("multidatastore : createView ", "info");
			var storeInfo 	= this.getStoreInfo(name),
				type     	= (storeInfo && storeInfo.type) || YObject,
				StoreConstructor, store, attributes;
				// Looks for a namespaced constructor function on `Y`.
			StoreConstructor = Lang.isString(type) ?
						YObject.getValue(Y, type.split('.')) : type;

			// Create the datastore instance and map it with its metadata.
			
			/* validation success if a model, or inherited model NAME is set */
			if ( !isValue(StoreConstructor.NAME) ){
				store = new StoreConstructor(data);
				
			} else {
				var attributes = {};

				for (key in config) {
					if (key !== "dstores")
						attributes[key] = config[key];
				}
				if ( !isObject(storeInfo.instance) ){
					store = new StoreConstructor();
				} else {
					store = storeInfo.instance;
				}
				//store.setAttrs(attributes);
				//
				//attributes = {};
				for (key in config.dstores) {
					if (key === name ){
						var addattr = config.dstores[key];
						for ( attr in addattr ){
							if ( attr !== "type" ){
								Y.log("bkey " + attr );
								attributes[attr] = addattr[attr];
								if (attr === "idAttribute"){
									store.idAttribute = attributes[attr];
								}
							}
						}
					}
				}
				store.setAttrs( attributes );
				if (isArray(data) ){
					store.set( "data", data );
				} else {
					store.setAttrs(data);
				}
			
				
			}
			
			storeInfo.instance = store;
			var ykey	= Y.stamp(store, true);
			this._storeInfoMap[ykey] = storeInfo;
			store.yuikey = ykey;
			return store;
		},
		
		_setStoresInfo : function(config){
			var stores = {};
			// Merges-in specified stores metadata into local `stores` object.
			function mergeStoresConfig(store, name) {
				stores[name] = Y.merge(stores[name], store);
			}
			// First, each store in the `stores` prototype object gets its metadata
			// merged-in, providing the defaults.
			YObject.each(this.stores, mergeStoresConfig);

			// Then, each view in the specified `config.views` object gets its
			// metadata merged-in.
			YObject.each(config, mergeStoresConfig);
			
			this.stores        = stores;
			this._storeInfoMap = {};
		},
		
		initializer : function (config){
			config || (config = {});
			isValue(config.url) && (this.url = config.url);
			//
			if (isValue(config.dstores)){
				this._setStoresInfo(config.dstores);
			}
			this.config = config;
		},

		

		
		onRetrieveStart : function(){
		},
		
		onRetrieveEnd : function(e){
			var value = "", semaphore,
				storeInfo 	= this.getStoreInfo("view_template");
			
			//storeInfo.template_ready.call(e);
			if ( isValue(storeInfo) ){
				semaphore = (isObject(storeInfo.template_ready)) ? storeInfo.template_ready : null;
				if (semaphore) {
					var callfn = (isFunction(semaphore.valueFn)) ? semaphore.valueFn : null;
					if(callfn) {
						
						value = callfn.call(semaphore.caller, arguments, semaphore.caller);
						Y.log('onRetrieveEnd onRetrieveEnd call ');
					}
					else {
					}
				}
			}
			
			this.fire("afterRetrieveEnd", this);
			return this;
		},
		
		onSrvResult  : function(results){
    		Y.log("DbMultiDatastore : onSrvResult ");
			var res, ex;
			if (results.response.readyState === 4 && results.response.status === 200){
				try {
					res = Y.JSON.parse_uid(results.response.responseText);
				} catch(jx){
					res = results.response.responseText;
					ex	= jx;
				}
			}
			Y.fire("dbmultidatastore:dataSaveEnd", {
						error   : ex,
						response: res,
						src     : 'onSrvResult'
					});
		},
		
	
		getStoredData : function(key){
			var storeInfo = this.getStoreInfo(key),
				nullRet   = null;
				
			if (storeInfo && storeInfo.instance ){
				if ( Y.Lang.isArray(storeInfo.instance) ) {
					return storeInfo.instance;
				} else {
					return storeInfo.instance.toJSON();
				}
				
			}
			return nullRet;
		},
		
		setStoredData : function(storeName, dataKey, dataValue ){
			var storeInfo = this.getStoreInfo(storeName),
				nullRet   = null;
				
			if (storeInfo && storeInfo.instance ){
				if ( Y.Lang.isArray(storeInfo.instance) ) {
					storeInfo.instance[dataKey] = dataValue;
				} else {
					storeInfo.instance.set(dataKey, dataValue);
				}
			}
			return 1;
		},
		
		setrefreshParams : function(options){
			if ( isValue( options.refreshParams )){
				for (key in options.refreshParams ) {
					if (YObject.owns(options.refreshParams, key)) {
						this.set(key, options.refreshParams[key] );
						this.sendParam.push(key);
					}
				}
			}
			return 0;
		},
		
		/* 
		*/
		serialize : function (action){
			Y.log('DbModelioBase : serialize ' + build_count, "info");
			this.setAttrs( {  	process_name 	: this.get("process_name"),
								process_step 	: this.DB_OPERATIONS[action],
								isType		 	: this.get("isType"),
								sys_uid			: Y.Env.flowApp.keyholder.get('key')
									} );
			/* if (options){
				this.setrefreshParams(options);
			} */
			var attr	= this.selectedtoJSON(this.sendParam);
			return Y.JSON.stringify(attr);
		},
		
		
		getURL: function (action, options) {
			var url ;
			switch (action) {
				
				case 'read':
					this.setAttrs( {  	process_name 	: this.get("process_name"),
										process_step 	: this.DB_OPERATIONS['select'],
										isType		 	: this.get("isType")
							} );
					if (options){
						this.setrefreshParams(options);
					}
					url = this.url + "?sjon=" + Y.JSON.stringify(this.selectedtoJSON(this.sendParam) );
					break;
					
				case 'create':
				case 'update':
					Y.log("DbModelioBase : save", "info") ;
					if (options && options.silent === true){
						return this.save({silent : true});
					}
					var action = this.isNew() ? 'create' : 'update';
					this.setAttrs( {  	process_name 	: this.get("process_name"),
										process_step 	: this.DB_OPERATIONS[action],
										isType		 	: this.get("isType"),
										sys_uid			: Y.Env.flowApp.keyholder.get('key')
									} );
					if (options){
						this.setrefreshParams(options);
					}
					url = this.url;
					break;
				case 'delete':
				default:
					callback('Invalid action');
			}
			return url;
			//var url = this.getURL(action, options);
			//Y.DbModelioBase.superclass.url = this.url;
			//Y.DbModelioBase.superclass.setURL(url, action, options);
			//Y.DbModelioBase.superclass.sync(action, options, callback);
		},
		
		selectedtoJSON: function ( selected ) {
			var attrs = this.getAttrs();
			var tmpattrs = {};
						
			if (selected ){
				selected || [];
				for ( i = 0, len = selected.length; i < len; i++ ){
					tmpattrs[selected[i] ] = attrs[selected[i] ];
				}
				attrs 	= tmpattrs;
			}
			
			attrs["stampid"] = Y.Env.flowApp.keyholder.get("key");	
			return attrs;
		},
		
		/*
		*/
		
		
		remove : function (action, options, callback) {
			options || (options = {});
		},
		
		save : function (storeName, options, callback) {
			options || (options = {});
			var stored = this.getStoreInfo(storeName);
			if (stored && stored.instance){
				stored.instance.after("save", Y.bind("onSrvResult", this));
				stored.instance.save(options, callback);
				//Y.DbMultiDataStore.superclass.create(stored.instance, options, callback);
			}
		},

		
		parse	:	function(txid){
    		Y.log("DbMultiDatastore : parse");
			//this.req.detachAll(); //('io:complete');
			if (txid.readyState === 4 && txid.status === 200){
				var res = Y.JSON.parse_uid(txid.responseText);
				//var res = this.getAttrs();
				if (isObject( res ) ){
					
					for (key in res ) {
						if (YObject.owns(this.stores, key)) {
							var astore, store, storeInfo;
							try {
								storeInfo = this.getStoreInfo(key);
								if ( storeInfo ) {
									store = this.createStore(key, this.config, res[key] );
								}
								
							} catch (e) {
								Y.log("Store " + key + " not found ", "error");
							}
						}
					}
				}
				this.onRetrieveEnd();
			} else {
				alert("error json");
			}
			
  		},
		
		get_model_data : function(storeName, key) {
			var stored  = this.getStoreInfo(storeName);
			var retdata;
			if (stored && stored.instance){
				retdata = stored.instance.get(key);
			}
			return retdata;
		},
		
		get_model_data_arr : function(storeName, index) {
			// if index = -1 then return all element
			var stored  = this.getStoreInfo(storeName);
			var retdata, 
				tmp 	= new Y.Array;
			if (stored && stored.instance){
				retdata = stored.instance.get("data");
				if ( index >= 0 && index < retdata.length ){
					tmp = retdata[index];
				} else if ( index === -1 ){
					tmp = retdata;
				}
			}
			return tmp;
		},
		
		
		
		get_model_data_json : function(storeName, index) {
			var retdata = this.get_model_data_arr(storeName, index);
			return Y.JSON.stringify(retdata);
		},
		
		setItem : function( storeName, index, key, value ){
			var stored = this.getStoreInfo(storeName);
			if (stored && stored.instance){
				stored.instance.setItem(index, key, value);
			}
		}
		
		
		
		
		
  		
  	}, 	{ 	NAME	: 	"DbMultiDataStore",
			
			ATTRS 	: 
			{			
					process_name	: 	{ value : "" },
					process_step	: 	{ value : "" },
					isType			: 	{ value : "" },
					template_ready	: 	{ value : null },
					dstores			: 	{ 	getter   : '_getStoresInfo',
											setter   : this._setStoresInfo
										}
										/** example config
											dstores: {  formcols : {
																	sendtosrv: true,
																	type : Y.DbModelioBase,
																	resultLocator : "formcolumns"
														},
														states  : {
																	sendtosrv: false,
																	type : Y.Array
														},
														meta 	: {
																	sendtosrv: false,
																	resultLocator : "view_template"
																	type : Y.Array
														}
													}
											 
										**/
						
  	  		}
  	});
	
	Y.DbMultiDataStore = DbMultiDataStore;
	
}, "1.0.1", {"requires": ["base-build", "dbmulti-ds-base", "json-parse-uid"]});
