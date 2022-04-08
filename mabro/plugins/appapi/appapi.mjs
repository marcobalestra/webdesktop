const activateWindow = ( $w ) => {
	const id = $w.attr('id');
	const uri = $w.attr('for');
	const dd = $(document.body).data('mabro');
	if ( dd.activeWindow === id ) return;
	if ( dd.activeApp === uri ) {
		activateDocument($w,id,uri);
	} else {
		$(`.mabro-app.mabro-wrap:not([for="${uri}"])`).removeClass('active').addClass('inactive');
		if ( uri.endsWith('/webdestop/') ) $(`.mabro-app.mabro-wrap:not([for="${uri}"])`).hide();
		$(`.mabro-app.mabro-wrap[for="${uri}"]`).addClass('active').show();
		dd.activeApp = uri;
		if ( $(`.mabro-app[for="${uri}"]:not(.mabro-wrap)`).length > 1 ) {
			$(document.body).data('mabro',dd);
			activateDocument($w,id,uri);
		} else {
			dd.activeWindow = id;
			$(document.body).data('mabro',dd);
		}
		$(document.body).trigger('mabro:changedApp');
	}
};

const activateDocument = ($w,id,uri) => {
	if ( typeof id === 'undefined') id = $w.attr('id');
	if ( typeof uri === 'undefined') uri = $w.attr('for');
	const dd = $(document.body).data('mabro');
	if ( dd.activeWindow == id ) return;
	const $ws = $(`.mabro-app[for="${uri}"]:not(.mabro-wrap)`);
	if ( $ws.length < 2 ) return;
	$w.data('zIndex',10000);
	const ws = [];
	$ws.each( (idx,w) => { ws.push( {win: w, zIndex : $(w).data('zIndex')}) });
	ws.sort( (a,b)=>{ a.zIndex < b.zIndex ? 1 : -1 } ).map(x=>x.win).forEach((w,idx) => {
		$(w).attr('z-index',idx).data('zIndex',idx);
	});
	dd.activeWindow = id;
	$(document.body).data('mabro',dd);
};

$(document).on("click", ".mabro-app:not(.mabro-wrap)", (e)=>{ e.stopPropagation(); activateWindow($(e.target)); });

const makewrap = (uri) => {
	const $w = $(`<div class="mabro-app mabro-wrap" for="${uri}" id="${glob.uid('win-')}"></div>`);
	$('body>.mabro-main-container>.mabro-main-wrap').append($w);
	return $w;
};

const API = class {
	#sys; #app;
	constructor(sysapi) {
		this.#sys = sysapi;
	};
	init() {
		if ( ! this.#app ) this.#app = this.#sys.getApp();
		return this.#sys.wrap();
	};
	event(name,data) {
		if ( ! this.#app ) return;
		if ( typeof this.#app.event === 'function' ) this.#app.event(name,data);
	};
	windows() { return this.#sys.windows(); };
	wrap() { return this.#sys.wrap(); };
};

const getClass = async (mb) => {
	const SYSAPI = class {
		#prop; #api; #app;
		constructor() {
			this.#prop = {};
			this.#prop.mb = mb;
			this.#prop.wins = [];
		};
		async init(uri,manifest,options) {
			this.#prop.uri = uri;
			this.#prop.manifest = manifest;
			if ( options ) {
				if ( options.system ) this.#prop.system = true;
				if ( options.wrap ) {
					const $w = $(options.wrap);
					if ( ! $w.attr('id') ) $w.attr('id',glob.uid('win-'));
					if ( ! $w.hasClass('mabro-app') ) $w.addClass('mabro-app');
					if ( ! $w.hasClass('mabro-wrap') ) $w.addClass('mabro-wrap');
					$w.attr('for',this.#prop.uri);
					this.#prop.wrap = $w;
				};
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
		windows() { return this.#prop.wins; };
		wrap(){
			if ( ! this.#prop.wrap ) this.#prop.wrap = makewrap(this.#prop.uri);
			return this.#prop.wrap;
		};
	};
	return SYSAPI;
};

export default getClass;
