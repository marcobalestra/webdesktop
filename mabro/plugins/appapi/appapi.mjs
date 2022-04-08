const API = class {
	#sys; #app;
	constructor(sysapi) {
		this.#sys = sysapi;
	};
	init() { if ( ! this.#app ) this.#app = this.#sys.getApp(); }
	event(name,data) {
		if ( ! this.#app ) return;
		if ( typeof this.#app.event === 'function' ) this.#app.event(name,data);
	};
};

const activateWindow = ( $w ) => {
	const id = $w.attr('id');
	const dd = $(document.body).data('mabro');
	if ( dd.activeWindow == id ) return;
	$('.mabro-app').removeClass('active').addClass('inactive');
	if ( $w.hasClass('mabro-webdesktop') ) $('.mabro-app').hide();
	$w.removeClass('inactive').addClass('active').show();
	dd.activeWindow = id;
	$(document.body).data('mabro',dd);
	$(document.body).trigger('mabro:changedApp');
};

$(document).on("click", ".mabro-app.inactive", (e)=>{ activateWindow($(e)); });

const getClass = async (mb) => {
	const SYSAPI = class {
		#prop; #api; #app;
		constructor() {
			this.#prop = {};
			this.#prop.mb = mb;
		};
		async init(uri,manifest,options) {
			this.#prop.uri = uri;
			this.#prop.manifest = manifest;
			if ( options ) {
				if ( options.system ) this.#prop.system = true;
				if ( options.win ) {
					if ( ! $(options.win).attr('id') ) $(options.win).attr('id',glob.uid('win'));
					this.#prop.win = options.win;
				}
				this.#prop.options = options;
			} else {
				this.#prop.options = {};
			}
		};
		async dispatch( name, data ) {
			if ( ! ( this.#app && this.#prop.events ) ) return;
			if ( typeof name !== 'string' ) return;
			if ( name.startsWith('private:') || name.startsWith('system:') ) return;
			return await this.#app.event(name,data);
		};
		async event( name, data ) {
			switch ( name ) {
				case 'run' : await this.load();
				default : return this.dispatch(name,data);
			}
		};
		getApp() { return this.#app; };
		getAppApi() { return this.#api; };
		getUri() { return this.#prop.uri };
		async load() {
			if ( this.#app ) return this.#app;
			if ( ! this.#prop.classfunc ) {
				const m = this.#prop.manifest;
				if (m.script.includes('<mjs_suffix>')) m.script = m.script.replace(/\<mjs_suffix\>/,this.#prop.mb.getProp('mjs_suffix'));
				let mod,cl;
				try {
					mod = await import(`${m.base_uri}${m.script}`);
				} catch(e) {
					console.log("Error loading app script",m,e);
				}
				if ( mod ) {
					try {
						cl = await mod.default( m );
						if ( typeof cl === 'function' ) this.#prop.classfunc = cl;
					} catch (e) {
						console.log("Error loading app class",m,e);
					}
				}
			};
			if ( this.#prop.classfunc ) {
				if ( ! this.#api ) this.#api = new API(this);
				try {
					this.#app = (new this.#prop.classfunc(this.#api,this.#prop.options));
				} catch(e) {
					console.log("Error loading app",e);
				}
			};
			if ( this.#app ) {
				if ( typeof this.#app.event === 'function' ) this.#prop.events = true;
				this.#api.init();
				this.#prop.mb.launchedApp( this.#prop.uri );
			}
			return this.#app;
		};
		async win() {
			if ( this.#prop.win ) return this.#prop.win;

		};
	};
	return SYSAPI;
};

export default getClass;
