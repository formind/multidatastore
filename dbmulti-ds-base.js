YUI.add('dbmulti-ds-base', function (Y, NAME) {

	var build_count	= "1.0.001";

	
	
	Y.DbMultiDsBase = Y.Base.create('dbmultidsbase', Y.ModelList, [Y.DbModelSyncExt], {
		
		EVT_ERROR 		: 'error',
		sendParam		: ["process_name", "process_step", "isType"],
		url				: "",
		DB_OPERATIONS 	: {
			'create'	: 'set_data',
			'select'  : 'get_init_data',
			'update'	: 'upd_data',
			'delete'	: 'del_data'
		},
		
		/* getURL: function (action, options) {
			return this.url;
		},
		
		setURL : function (url, action, options) {
			this.url = url;
		}, */
		
		parse: function (resp) {
			Y.log("dbmultiBase : parse", "info") ;
			if (typeof resp.responseText === 'string') {
				try {
					var jparsed = Y.JSON.parse_uid(resp.responseText);
					return jparsed;
				} catch (ex) {
					this.fire(this.EVT_ERROR, {
						error   : ex,
						response: resp,
						src     : 'parse'
					});

					return null;
				}
			}
			return resp;
		}
		
	}, {
			NAME 		: "DbMultiDsBase",
			ATTRS: {
						
					}
		});
		
	
}, '1.0.1', {"requires": ["model-list", "dbmodel-sync-rest-ext", "json-parse-uid"]});
