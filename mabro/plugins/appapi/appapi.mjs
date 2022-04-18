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
		if ( $(`.mabro-app.mabro-window[for="${uri}"]`).length > 1 ) {
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
	const $ws = $(`.mabro-app.mabro-window[for="${uri}"]`);
	if ( $ws.length < 2 ) return;
	$w.data('zIndex',10000);
	const ws = [];
	$ws.each( (idx,w) => { ws.push( {win: w, zIndex : $(w).data('zIndex')}) });
	ws.sort( (a,b)=>{ a.zIndex < b.zIndex ? 1 : -1 } ).map(x=>x.win).forEach((w,idx) => {
		$(w).css('z-index',idx).data('zIndex',idx);
	});
	dd.activeWindow = id;
	$(document.body).data('mabro',dd);
};

$(document).on("click", ".mabro-app.mabro-window", (e)=>{ e.stopPropagation(); activateWindow($(e.target)); });

const MBWstatic = {
	default : { width: '20%', height : '20%' },
	next : { top: 20, left : 20, step : 20 }
};

const MBW = class {
	#sysapi; #prop;
	constructor( sysapi, options ) {
		this.#sysapi = sysapi;
		this.#prop = { options : options||{} };
		if ( typeof this.#prop.options.title === 'undefined' ) this.#prop.options.title = sysapi.getAppName();
		this.#prop.id = glob.uid('win-');
		if (this.#prop.options.show) setTimeout( ()=>{ this.show(); }, 100 );
	};
	static parseLeft = (val) => {
		if ( typeof val === 'undefined' ) {
			val = MBWstatic.next.left + MBWstatic.next.step;
			if ( val >= (parseInt(window.innerWidth) / 2) ) val = MBWstatic.next.step;
			MBWstatic.next.left = val;
		}
		return MBW.parseSize(val);
	};
	static parseSize = ( val  ) => {
		if ( typeof val !== 'string' ) val = String(val);
		if ( val.match(/^[.0-9]+$/) ) return val+'px';
		return val;
	};
	static parseTop = (val) => {
		if ( typeof val === 'undefined' ) {
			val = MBWstatic.next.top + MBWstatic.next.step;
			if ( val >= (parseInt(window.innerHeight) / 2) ) val = MBWstatic.next.step;
			MBWstatic.next.top = val;
		}
		return MBW.parseSize(val);
	};
	static render = ( sysapi, prop ) => {
		const $w = $(`<div class="mabro-app mabro-window" for="${sysapi.getUri()}" id="${prop.id}"></div>`);
		$w.append($('<div class="mabro-window-titlebar"></div>').append($('<label></label>').append( prop.options.title ) ));
		const $c = $(`<div class="mabro-window-content""></div>`);
		if ( prop.options.fullscreen ) {
			$w.addClass('mabro-fullscreen');
		} else {
			$w.css({
				width: MBW.parseSize(prop.options.width||MBWstatic.default.width),
				height : MBW.parseSize(prop.options.height||MBWstatic.default.height),
				top: MBW.parseTop(prop.options.height),
				left: MBW.parseLeft(prop.options.height)
			})
		}
		$w.append( $c );
		$w.hide();
		sysapi.wrap().append( $w );
		return $w;
	};
	top(x) { this.wrap().css('top',MBW.parseSize(x)) };
	left(x) { this.wrap().css('left',MBW.parseSize(x)) };
	width(x) { this.wrap().css('width',MBW.parseSize(x)) };
	height(x) { this.wrap().css('height',MBW.parseSize(x)) };
	show() { this.toggle(true); };
	hide() { this.toggle(false); };
	toggle(status) { this.wrap().toggle(!!status); };
	title(t) {
		if ( typeof t !== 'string' ) return this.#prop.options.title;
		this.#prop.options.title = t;
		this.wrap().children('.mabro-title-bar').children('label').html(t);
		return t;
	};
	wrap() {
		if ( ! this.#prop.w ) this.#prop.w = MBW.render(this.#sysapi, this.#prop );
		return this.#prop.w;
	};
	window() { return this.wrap().children('.mabro-app-content'); };
};

const API = class {
	#sys; #app;
	constructor(sysapi) {
		this.#sys = sysapi;
	};
	init() {
		if ( ! this.#app ) this.#app = this.#sys.getApp();
		if ( typeof this.#app.init === 'function' ) setTimeout( ()=>{ this.#app.init() }, 100 );
		return this.#sys.wrap();
	};
	event(name,data) {
		if ( ! this.#app ) return;
		if ( typeof this.#app.event === 'function' ) this.#app.event(name,data);
	};
	windows() { return this.#sys.windows(); };
	wrap() { return this.#sys.wrap(); };
	menubar( data ) { this.#sys.makeMenuBar( data ); };
	newWindow( options ) { return this.#sys.newWindow(options); };
	quit() { this.#sys.quit(); };
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
			if ( name === 'run' ) {
				await this.load();
			} else if ( name === 'quit') {
				this.quit();
			} else {
				return this.dispatch(name,data);
			}
		};
		getApp() { return this.#app; };
		getAppName() { return this.#prop.manifest.app_name };
		getAppApi() { return this.#api; };
		getUri() { return this.#prop.uri };
		async load() {
			if ( this.#app ) {
				this.activate();
				return this.#app;
			}
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
				this.makeMenuBar();
				this.#api.init();
				this.#prop.mb.launchedApp( this.#prop.uri );
			}
			return this.#app;
		};
		makeMenuBar( data ) {
			if ( data ) {
				if ( ! data && typeof data === 'object' ) return;
				if ( ! Array.isArray(data) ) data = [data];
				data = data.filter( d => (d.label && d.items) );
			} else {
				data = [];
			}
			if ( ! this.#prop.system ) {
				if ( ! data[0] ) data[0] = {};
				if ( data[0] ) {
					data[0].label = _l('menu-File');
					if ( data[0].items ) data[0].items.push('-');
					else data[0].items = [];
					data[0].items.push({ label: _l('menu-Quit'), action: ()=>{ this.quit() }});
				}
			}
			this.#prop.mb.getMenu().then( m => { m.registerMenuBar( this.#prop.uri, data ); });
		};
		windows() { return this.#prop.wins; };
		newWindow(options) {
			const w = new MBW(this,options);
			this.#prop.wins.push(w);
			const idx = this.#prop.wins.length;
			w.wrap().css('z-index',idx).data('zIndex',idx);
			return w;
		};
		frontmostWindow() {
			const wins = this.windows();
			if ( ! wins.length ) return undefined;
			let w, z = 0;
			wins.forEach( wi => {
				const zi = wi.wrap().data('zIndex');
				if ( zi < z ) return;
				z = zi;
				w = wi;
			});
			return w;
		};
		activate() {
			const dd = $(document.body).data('mabro');
			dd.activeApp = this.#prop.uri;
			const w = this.frontmostWindow();
			if ( w ) dd.activeWindow = w.wrap().attr('id');
			else dd.activeWindow = '-';
			$(`.mabro-app.mabro-wrap:not([for="${this.#prop.uri}"])`).removeClass('active').addClass('inactive');
			$(`.mabro-app.mabro-wrap[for="${this.#prop.uri}"]`).removeClass('inactive').addClass('active');
			$(document.body).data('mabro',dd);
		};
		quit() {
			if ( this.#prop.quitting ) return;
			this.#prop.quitting = true;
			if ( this.#prop.wrap ) this.#prop.wrap.remove();
			this.#prop.mb.quitapp( this.#prop.uri );
			this.#app = false;
		};
		wrap(){
			if ( ! this.#prop.wrap ) {
				const $w = $(`<div class="mabro-app mabro-wrap" for="${this.#prop.uri}" id="${glob.uid('win-')}"></div>`);
				$('body>.mabro-main-container>.mabro-main-wrap').append($w);
				this.#prop.wrap = $w;
				this.activate();
			}
			return this.#prop.wrap;
		};
	};
	return SYSAPI;
};

export default getClass;
