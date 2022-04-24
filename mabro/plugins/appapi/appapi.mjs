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
		//if ( uri.endsWith('/webdesktop/') ) $(`.mabro-app.mabro-wrap:not([for="${uri}"])`).hide();
		$(`.mabro-app.mabro-wrap[for="${uri}"]`).addClass('mabro-active');
		dd.activeApp = uri;
		if ( $(`.mabro-app.mabro-window[for="${uri}"]`).length > 1 ) {
			$(document.body).data('mabro',dd);
			activateDocument($w,id,uri);
		} else {
			$w.addClass('mabro-active');
			dd.activeWindow = id;
			$(document.body).data('mabro',dd);
		}
		$(document.body).trigger('mabro:changedApp',{ uri: uri });
	}
};

const activateDocument = ($w,id,uri) => {
	if ( ! $w.hasClass('.mabro-window') ) $w = $w.closest('.mabro-window');
	if ( typeof id === 'undefined') id = $w.attr('id');
	if ( typeof uri === 'undefined') uri = $w.attr('for');
	const dd = $(document.body).data('mabro');
	if ( dd.activeWindow === id ) return;
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
	$(document.body).data('mabro',dd).trigger('mabro:changedWindow',{ uri: uri, id: id });
};

$(document).on("mouseup", ".mabro-app.mabro-window:not(.mabro-gui-action)", (e)=>{ e.stopPropagation(); activateWindow($(e.target)); });

if ( ! glob.dd.get('mabro-window-drag')) glob.dd.set('mabro-window-drag',{
	data : (d) => {
		return {
			ex0 : d.event.pageX,
			ey0 : d.event.pageY,
			x0 : parseInt(d.element.css('left')),
			y0 : parseInt(d.element.css('top')),
			minx : 0,
			miny: 0,
			maxx : d.element.closest('.mabro-wrap').width(),
			maxy : d.element.closest('.mabro-wrap').height()
		};
	},
	draggable : (d) => {
		// { element: $el }
		if ( ! d.element.hasClass('mabro-window-drag-inited') ) {
			d.element.attr('draggable',false);
			const $tb = $('.mabro-window-titlebar',d.element);
			$tb.on('mouseenter',()=>{ if ( ! d.element.hasClass('mabro-fullscreen') ) d.element.attr('draggable',true)  });
			$tb.on('dblclick',(e)=>{ e.preventDefault(); e.stopPropagation(); d.element.trigger('mabro:togglefs') });
			$tb.on('mouseleave',()=>{ d.element.attr('draggable',false)  });
			d.element.addClass('mabro-window-drag-inited');
		}
	},
	dragstart : (d) =>{
		d.element.addClass('mabro-dragging mabro-gui-action');
		return false;
	},
	drag : (d) => {
		if ( ! d.element.hasClass('mabro-dragging') ) return;
		if ( d.event.pageY <= 0 || d.event.pageX <= 0 ) return;
		d.element.css({
			top: String( Math.min(Math.max((d.data.y0 + d.event.pageY - d.data.ey0),d.data.miny),d.data.maxy) )+'px',
			left: String( Math.min(Math.max((d.data.x0 + d.event.pageX - d.data.ex0),d.data.minx),d.data.maxx) )+'px'
		});
		return false;
	},
	dragend : (d) => {
		if ( ! d.element.hasClass('mabro-dragging') ) return;
		d.element.removeClass('mabro-dragging mabro-gui-action');
		$(document.body).trigger('mabro:changedWindow',{ uri: d.element.attr('for'), id: d.element.attr('id') });
		return false;
	}
});

if ( ! glob.dd.get('mabro-window-resize')) glob.dd.set('mabro-window-resize',{
	data : (d) => {
		const $w = d.element.closest('.mabro-window');
		const opts = $w.data('mabro-options');
		return {
			win : $w,
			ex0 : d.event.pageX,
			ey0 : d.event.pageY,
			x0 : $w.width(),
			y0 : $w.height(),
			minx : opts.minWidth ? parseInt(opts.minWidth) : 197,
			miny: opts.minHeight ? parseInt(opts.minHeight) : 55,
			maxx : opts.maxWidth ? parseInt(opts.maxWidth) : ($w.closest('.mabro-wrap').width() - parseInt($w.css('left')) - 100),
			maxy : opts.maxHeight ? parseInt(opts.maxHeight) : ($w.closest('.mabro-wrap').height()  - parseInt($w.css('top')) -100)
		};
	},
	draggable : (d) => {
		if ( ! d.element.hasClass('mabro-window-resize-inited') ) {
			d.element.attr('draggable',false);
			const $w = d.element.closest('.mabro-window');
			d.element.on('mouseenter',()=>{ if ( ! $w.hasClass('mabro-fullscreen') ) d.element.attr('draggable',true)  });
			d.element.on('mouseleave',()=>{ d.element.attr('draggable',false)  });
			d.element.addClass('mabro-window-resize-inited');
		}
	},
	dragstart : (d) =>{
		d.data.win.addClass('mabro-resizing mabro-gui-action');
		return false;
	},
	drag : (d) => {
		if ( ! ( d.data.win && d.data.win.hasClass('mabro-resizing') ) ) return;
		if ( d.event.pageY <= 0 || d.event.pageX <= 0 ) return;
		d.data.win.css({
			width: String( Math.min(Math.max((d.data.x0 + d.event.pageX - d.data.ex0),d.data.minx),d.data.maxx) )+'px',
			height: String( Math.min(Math.max((d.data.y0 + d.event.pageY - d.data.ey0),d.data.miny),d.data.maxy) )+'px'
		});
		return false;
	},
	dragend : (d) => {
		if ( ! ( d.data.win && d.data.win.hasClass('mabro-resizing') ) ) return;
		d.data.win.removeClass('mabro-resizing mabro-gui-action');
		$(document.body).trigger('mabro:changedWindow',{ uri: d.data.win.attr('for'), id: d.data.win.attr('id') });
		return false;
	}
});

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
			if ( val >= (parseInt(window.innerWidth) / 2) ) val = MBWstatic.next.top = MBWstatic.next.step;
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
			if ( val >= (parseInt(window.innerHeight) / 2) ) val = MBWstatic.next.left = MBWstatic.next.step;
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
			setTimeout( ()=>{ glob.dd.get('mabro-window-resize').draggable($('.mabro-resize-button',$w)) }, 1);
		}
		setTimeout( ()=>{ glob.dd.get('mabro-window-drag').draggable($w); }, 1);
		return $w;
	};
	active(){ return this.wrap().hasClass('mabro-active') };
	top(x) { this.wrap().css('top',MBW.parseSize(x)) };
	left(x) { this.wrap().css('left',MBW.parseSize(x)) };
	width(x) { this.wrap().css('width',MBW.parseSize(x)) };
	height(x) { this.wrap().css('height',MBW.parseSize(x)) };
	show() { this.toggle(true); };
	hide() { this.toggle(false); };
	toggle(status) {
		const $w = this.wrap();
		$w.toggle(!!status);
		$(document.body).trigger('mabro:changedWindow',{ uri: $w.attr('for'), id: $w.attr('id') });
	};
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
		$(document.body).trigger('mabro:changedWindow',{ uri: $w.attr('for'), id: $w.attr('id') });
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
	close() { this.#sysapi.closeWindow( this); };
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
	async dialog( options ) { return await this.#sys.dialog(options); };
	windows() { return this.#sys.windows(); };
	frontmostWindow() { return this.#sys.frontmostWindow() };
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
				if ( options.system ) {
					this.#prop.system = true;
					options.sysapi = this;
					options.windowClass = MBW;
				}
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
				return this.quit();
			}
			return this.dispatch(name,data);
		};
		getApp() { return this.#app; };
		getManifest() { return this.#prop.manifest }; 
		getAppName() { return this.#prop.manifest.app_name };
		getAppApi() { return this.#api; };
		getUri() { return this.#prop.uri };
		isSystem() { return !! this.#prop.system };
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
				if (m.script.includes('<mjs_suffix>')) m.script = m.script.replace(/<mjs_suffix>/,this.#prop.mb.getProp('mjs_suffix'));
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
			}
			if ( this.#prop.classfunc ) {
				if ( ! this.#api ) this.#api = new API(this);
				try {
					this.#app = (new this.#prop.classfunc(this.#api,this.#prop.options));
				} catch(e) {
					console.log("Error loading app",e);
				}
			}
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
			this.#prop.mb.getMenu().then( m => { m.registerMenuBar( this, data ); });
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
			else if (! (this.#prop.system || this.#prop.manifest.windowless ) ) this.quit();
		};
		frontmostWindow() {
			const wins = this.windows();
			if ( ! wins.length ) return undefined;
			if ( wins.length === 1 ) return wins[0];
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
				if ( wi.wrap().attr('id') === id ) w = wi;
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
		activateWindow(w) {
			activateWindow( w.wrap() );
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
		async dialog( options ) { return await this.#prop.mb.dialog(options); };
	};
	return SYSAPI;
};

export default getClass;
