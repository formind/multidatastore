YUI.add('dbmodel-sync-rest-ext', function(Y) {

var Lang = Y.Lang,

    sub        = Lang.sub,
    isValue    = Lang.isValue,
    isString   = Lang.isString,
    isNumber   = Lang.isNumber,
    isFunction = Lang.isFunction,
    build_count	= "1.0.001";


	
	
	Y.DbModelSyncExt = Y.Base.create('dbmodelsyncext', Y.ModelSync.REST, [], {
	
		root: '',
		url : '',
		CSRF_TOKEN : YUI.Env.CSRF_TOKEN,
		EMULATE_HTTP : false,
		HTTP_HEADERS : {
			'Accept'      : 'application/json',
			'Content-Type': 'application/json; charset=UTF-8;'
		},

		HTTP_METHODS : {
			'create': 'POST',
			'read'  : 'GET',
			'update': 'PUT',
			'delete': 'DELETE'
		},

		HTTP_TIMEOUT : 30000,

		
		initializer: function (config) {
			config || (config = {});
			isValue(config.url) && (this.url = config.url);
			Y.log('dbmodel-sync-rest-ext ' + build_count, "info");
		},
		
		sync: function (action, options, callback) {
			options || (options = {});

			var url       = this.getURL(action, options),
				method    = this.HTTP_METHODS[action],
				headers   = Y.merge(this.HTTP_HEADERS, options.headers),
				timeout   = options.timeout || this.HTTP_TIMEOUT,
				csrfToken = options.csrfToken || this.CSRF_TOKEN,
				entity;

			// Prepare the content if we are sending data to the server.
			if (method === 'POST' || method === 'PUT') {
				//headers['Content-Type'] = 'application/x-www-form-urlencoded; charset=UTF-8';
				entity = this.serialize(action);
			} else {
				// Remove header, no content is being sent.
				delete headers['Content-Type'];
			}

			// Setup HTTP emulation for older servers if we need it.
			if (this.EMULATE_HTTP &&
					(method === 'PUT' || method === 'DELETE')) {

				// Pass along original method type in the headers.
				headers['X-HTTP-Method-Override'] = method;

				// Fall-back to using POST method type.
				method = 'POST';
			}

			// Add CSRF token to HTTP request headers if one is specified and the
			// request will cause side effects on the server.
			if (csrfToken &&
					(method === 'POST' || method === 'PUT' || method === 'DELETE')) {

				headers['X-CSRF-Token'] = csrfToken;
			}

			this._sendSyncIORequest({
				action  : action,
				callback: callback,
				entity  : entity,
				headers : headers,
				method  : method,
				timeout : timeout,
				url     : url
			});
		},

		_sendSyncIORequest: function (config) {
			this.req = new Y.ExtIo();
			this.req.send(config.url, {
				'arguments': {
					action  : config.action,
					callback: config.callback,
					url     : config.url
				},

				context: this,
				data   : config.entity,
				headers: config.headers,
				method : config.method,
				timeout: config.timeout,

				on: {
					start  : this._onSyncIOStart,
					failure: this._onSyncIOFailure,
					success: this._onSyncIOSuccess,
					end    : this._onSyncIOEnd
				}
			});
		},
		
		_onSyncIOEnd: function (txId, details) {},

		
		_onSyncIOFailure: function (txId, res, details) {
			Y.log("_onSyncIOFailure ", "error");
			var callback = details.callback;

			if (callback) {
				callback({
					code: res.status,
					msg : res.statusText
				}, res);
			}
		},
	
		_onSyncIOSuccess: function (txId, res, details) {
			Y.log("_onSyncIOSuccess ", "info");
			var callback = details.callback;

			if (callback) {
				callback(null, res);
			}
		},
		
		_onSyncIOStart: function (txId, details) {},
		
		parseIOResponse: function (response) {
			Y.log("parseIOResponse ", "info");
			return response.responseText;
		}

	},	{	
			NAME	: 	"DbModelSyncExt", 
		
			ATTRS	:	{	
  					
  				}
  	});
	
	


}, '1.0.1' ,{requires:["base-base", "model-sync-rest", "extio", "json-stringify"], skinnable:false});
