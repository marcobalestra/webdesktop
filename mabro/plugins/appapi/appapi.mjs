document.addEventListener('dragover', (e)=>{ e.preventDefault() });

const activateWindow = ( $w ) => {
	if ( ! $w.hasClass('.mabro-window') ) $w = $w.closest('.mabro-window');
	const id = $w.attr('id');
	const uri = $w.attr('for');
	const dd = $(document.body).data('mabro');
	if ( dd.activeWindow === id ) return;
	if ( dd.activeApp === uri ) {
		activateDocument($w,id,uri);
	} else {
		$(`.mabro-app.mabro-wrap:not([for="${uri}"])`).removeClass('mabro-active').addClass('mabro-inactive');
		if ( uri.endsWith('/webdestop/') ) $(`.mabro-app.mabro-wrap:not([for="${uri}"])`).hide();
		$(`.mabro-app.mabro-wrap[for="${uri}"]`).addClass('mabro-active').show();
		dd.activeApp = uri;
		if ( $(`.mabro-app.mabro-window[for="${uri}"]`).length > 1 ) {
			$(document.body).data('mabro',dd);
			activateDocument($w,id,uri);
		} else {
			$w.addClass('mabro-active');
			dd.activeWindow = id;
			$(document.body).data('mabro',dd);
		}
		$(document.body).trigger('mabro:changedApp');
	}
};

const activateDocument = ($w,id,uri) => {
	if ( ! $w.hasClass('.mabro-window') ) $w = $w.closest('.mabro-window');
	if ( typeof id === 'undefined') id = $w.attr('id');
	if ( typeof uri === 'undefined') uri = $w.attr('for');
	const dd = $(document.body).data('mabro');
	if ( dd.activeWindow == id ) return;
	const $ws = $(`.mabro-app.mabro-window[for="${uri}"]`);
	if ( $ws.length < 2 ) {
		$w.addClass('mabro-active');
		return;
	}
	$ws.removeClass('mabro-active');
	$w.data('zIndex',10000);
	$w.addClass('mabro-active');
	const ws = [];
	$ws.each( (idx,w) => { ws.push( {win: w, zIndex : $(w).data('zIndex')}) });
	ws.sort( (a,b)=>(a .zIndex < b.zIndex ? -1 : 1 ) ).map(x=>x.win).forEach((w,idx) => {
		$(w).css('z-index',idx).data('zIndex',idx);
	});
	dd.activeWindow = id;
	$(document.body).data('mabro',dd);
};

$(document).on("mouseup", ".mabro-app.mabro-window:not(.mabro-gui-action)", (e)=>{ e.stopPropagation(); activateWindow($(e.target)); });

const makeDraggableWindow = ($w) => {
	const $tb = $('.mabro-window-titlebar',$w);
	$tb.on('mouseenter',()=>{ if ( ! $w.hasClass('mabro-fullscreen') ) $w.attr('draggable',true)  });
	$tb.on('dblclick',(e)=>{ e.preventDefault(); e.stopPropagation(); $w.trigger('mabro:togglefs') });
	$tb.on('mouseleave',()=>{ $w.attr('draggable',false)  });
	const w = $w.get(0);
	w.addEventListener('dragstart',(e)=>{
		if( $w.attr('draggable') !== 'true' ) return;
		e.stopPropagation();
		activateWindow($w);
		const ddata = {
			ex0 : e.pageX,
			ey0 : e.pageY,
			x0 : parseInt($w.css('left')),
			y0 : parseInt($w.css('top')),
			minx : 0,
			miny: 0,
			maxx : $w.closest('.mabro-wrap').width(),
			maxy : $w.closest('.mabro-wrap').height()
		};
		$w.data('mabro-drag',ddata);
		$w.addClass('mabro-dragging mabro-gui-action');
		return false;
	},true);
	w.addEventListener('drag',(e)=>{
		if ( ! $w.hasClass('mabro-dragging') ) return;
		e.preventDefault();
		e.stopPropagation();
		if ( e.pageY <= 0 || e.pageX <= 0 ) return;
		const ddata = $w.data('mabro-drag');
		$w.css({
			top: String( Math.min(Math.max((ddata.y0 + e.pageY - ddata.ey0),ddata.miny),ddata.maxy) )+'px',
			left: String( Math.min(Math.max((ddata.x0 + e.pageX - ddata.ex0),ddata.minx),ddata.maxx) )+'px'
		});
		return false;
	},true);
	w.addEventListener('dragend',(e)=>{
		if ( ! $w.hasClass('mabro-dragging') ) return;
		e.preventDefault();
		e.stopPropagation();
		$w.removeData('mabro-drag');
		$w.removeClass('mabro-dragging mabro-gui-action');
		return false;
	},true);
};

const makeResizeableWindow = ($w) => {
	const $rb = $('.mabro-resize-button',$w);
	$rb.on('mouseenter',()=>{ if ( ! $w.hasClass('mabro-fullscreen') ) $rb.attr('draggable',true)  });
	$rb.on('mouseleave',()=>{ $rb.attr('draggable',false)  });
	const w = $w.get(0);
	const rb = $rb.get(0);
	rb.addEventListener('dragstart',(e)=>{
		if( $rb.attr('draggable') !== 'true' ) return;
		e.stopPropagation();
		const opts = $w.data('mabro-options');
		const ddata = {
			ex0 : e.pageX,
			ey0 : e.pageY,
			x0 : $w.width(),
			y0 : $w.height(),
			minx : opts.minWidth ? parseInt(opts.minWidth) : 197,
			miny: opts.minHeight ? parseInt(opts.minHeight) : 55,
			maxx : opts.maxWidth ? parseInt(opts.maxWidth) : ($w.closest('.mabro-wrap').width() - parseInt($w.css('left'))),
			maxy : opts.maxHeight ? parseInt(opts.maxHeight) : ($w.closest('.mabro-wrap').height()  - parseInt($w.css('top')))
		};
		$w.data('mabro-resize',ddata);
		$w.addClass('mabro-resizing mabro-gui-action');
		return false;
	},true);
	rb.addEventListener('drag',(e)=>{
		if( ! $w.hasClass('mabro-resizing') ) return;
		e.preventDefault();
		e.stopPropagation();
		if ( e.pageY <= 0 || e.pageX <= 0 ) return;
		const ddata = $w.data('mabro-resize');
		$w.css({
			width: String( Math.min(Math.max((ddata.x0 + e.pageX - ddata.ex0),ddata.minx),ddata.maxx) )+'px',
			height: String( Math.min(Math.max((ddata.y0 + e.pageY - ddata.ey0),ddata.miny),ddata.maxy) )+'px'
		});
		return false;
	},true);
	rb.addEventListener('dragend',(e)=>{
		if( ! $w.hasClass('mabro-resizing') ) return;
		e.preventDefault();
		e.stopPropagation();
		$w.removeData('mabro-resize');
		$w.removeClass('mabro-resizing mabro-gui-action');
		return false;
	},true);
};

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
	static render = ( wobj, sysapi, prop ) => {
		const $w = $(`<div class="mabro-app mabro-window" for="${sysapi.getUri()}" id="${prop.id}"></div>`);
		const $titlebar = $('<div class="mabro-window-titlebar"></div>').append( $('<label></label>').append( prop.options.title ) );
		if ( ! prop.options.cantClose ) {
			const $closer = $('<span class="mabro-win-button mabro-close-button"></span>');
			$w.on('mabro:close',()=>{ sysapi.closeWindow(wobj) });
			$closer.on('click',()=>{ $w.trigger('mabro:close') } );
			$titlebar.append( $closer );
		}
		if ( ! prop.options.fixedSize ) {
			const $fstoggler = $('<span class="mabro-win-button mabro-zoom-button"></span>');
			$fstoggler.on('click',()=>{ $w.trigger('mabro:togglefs') } );
			$w.on('mabro:togglefs',()=>{ wobj.toggleFullscreen() });
			$titlebar.append( $fstoggler );
		}
		$w.append( $titlebar );
		const $c = $(`<div class="mabro-window-content"></div>`);
		if ( prop.options.cssBase ) $c.addClass( prop.options.cssBase );
		$w.css({
			width: MBW.parseSize(prop.options.width||MBWstatic.default.width),
			height : MBW.parseSize(prop.options.height||MBWstatic.default.height),
			top: MBW.parseTop(prop.options.top),
			left: MBW.parseLeft(prop.options.left)
		});
		$w.append( $c );
		$w.hide();
		$w.data('mabro-options',prop.options);
		sysapi.wrap().append( $w );
		if ( prop.options.fullscreen ) wobj.toggleFullscreen(true,$w);
		if ( ! prop.options.fixedSize ) {
			const $resizer = $('<span class="mabro-win-button mabro-resize-button"></span>');
			$w.append($resizer);
			makeResizeableWindow($w);
		}
		makeDraggableWindow($w);
		return $w;
	};
	top(x) { this.wrap().css('top',MBW.parseSize(x)) };
	left(x) { this.wrap().css('left',MBW.parseSize(x)) };
	width(x) { this.wrap().css('width',MBW.parseSize(x)) };
	height(x) { this.wrap().css('height',MBW.parseSize(x)) };
	show() { this.toggle(true); };
	hide() { this.toggle(false); };
	toggle(status) { this.wrap().toggle(!!status); };
	toggleFullscreen(status,$w) {
		if ( typeof status === 'undefined' ) status = this.#prop.fullscreen = ! this.#prop.fullscreen;
		else this.#prop.fullscreen = !! status;
		if ( typeof $w === 'undefined') $w = this.wrap();
		if ( status ) {
			$w.data('mabro-winsize',{ top: $w.css('top'), left: $w.css('left'), width: $w.css('width'), height: $w.css('height') });
			$w.css({top:'',left:'',width:'',height:''}).addClass('mabro-fullscreen');
		} else {
			const ps = $w.data('mabro-winsize');
			$w.css({top:ps.top,left:ps.left,width:ps.width,height:ps.height}).removeClass('mabro-fullscreen');
			$w.removeData('mabro-winsize');
		}
	};
	title(t) {
		if ( typeof t !== 'string' ) return this.#prop.options.title;
		this.#prop.options.title = t;
		this.wrap().children('.mabro-title-bar').children('label').html(t);
		return t;
	};
	wrap() {
		if ( ! this.#prop.w ) this.#prop.w = MBW.render(this, this.#sysapi, this.#prop );
		return this.#prop.w;
	};
	window() { return this.wrap().children('.mabro-window-content'); };
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
	closeWindow(w) { return this.#sys.closeWindow(w); };
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
				if ( m.css ) {
					if ( typeof m.css === 'string' ) m.css = [ m.css ];
					await m.css.forEachAwait( async (u) => {
						if ( ! u.match(/^([^:]+:\/\/|\/)/) ) u = `${m.base_uri}${u}`;
						await this.#prop.mb.loadCSS( u );
					});
				}
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
			if ( typeof options === 'undefined' ) options = {};
			if ( typeof options.cssBase === 'undefined' && this.#prop.manifest.cssBase ) options.cssBase = this.#prop.manifest.cssBase;
			const w = new MBW(this,options);
			this.#prop.wins.push(w);
			const idx = this.#prop.wins.length;
			w.wrap().css('z-index',idx).data('zIndex',idx);
			activateWindow(w.wrap());
			return w;
		};
		closeWindow( w ) {
			if ( typeof w === 'string' ) w = this.winById(w);
			if ( ! w ) return;
			const $w = w.wrap();
			const id = $w.attr('id');
			$w.remove();
			this.#prop.wins = this.#prop.wins.filter( w => ( w.wrap().attr('id') !== id ));
			const fm = this.frontmostWindow();
			if ( fm ) activateWindow( fm.wrap() );
			else this.quit();
		};
		frontmostWindow() {
			const wins = this.windows();
			if ( ! wins.length ) return undefined;
			if ( wins.length == 1 ) return wins[0];
			let dw,w,z=-1;
			wins.forEach( wi => {
				if ( dw ) return;
				const $w = wi.wrap();
				if ( $w.hasClass('mabro-active')) dw = w = wi;
				const zi = $w.data('zIndex');
				if ( zi > z ) {
					z = zi;
					w = wi;
				}
			});
			if ( w && ! dw ) dw = w;
			return dw;
		};
		winById(id) {
			const wins = this.windows();
			if ( ! wins.length ) return undefined;
			let w;
			wins.forEach( wi => {
				if ( w ) return;
				if ( wi.wrap().attr('id') == id ) w = wi;
			});
			return w;
		};
		activate() {
			const dd = $(document.body).data('mabro');
			dd.activeApp = this.#prop.uri;
			const w = this.frontmostWindow();
			if ( w ) dd.activeWindow = w.wrap().attr('id');
			else dd.activeWindow = '-';
			$(`.mabro-app.mabro-wrap:not([for="${this.#prop.uri}"])`).removeClass('mabro-active').addClass('mabro-inactive');
			$(`.mabro-app.mabro-wrap[for="${this.#prop.uri}"]`).removeClass('mabro-inactive').addClass('mabro-active');
			$(document.body).data('mabro',dd);
		};
		quit() {
			if ( this.#prop.quitting ) return;
			this.#prop.quitting = true;
			if ( this.#prop.wrap ) this.#prop.wrap.remove();
			this.#prop.mb.quitapp( this.#prop.uri );
			this.#app = false;
			this.#api = false;
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
