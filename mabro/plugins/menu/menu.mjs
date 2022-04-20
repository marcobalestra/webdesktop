const makeMenu = (node,funcarray) => {
	if ( typeof node === 'string' ) node = $('<label></label>').append(node);
	const $m = $(node);
	if ( ! $m.hasClass('mabro-menu-toggler') ) {
		const $mbmenu = $(`<div class="dropdown mabro-menu-toggler"></div>`).append($m);
		$mbmenu.on('click', (e)=>{ handleMenu(e,funcarray) } );
		return $mbmenu;
	}
	return $m;
};

const handleMenu = (me,funcarray) => {
	me.preventDefault();
	me.stopPropagation();
	let $p = $(me.target);
	if ( ! $p.hasClass('mabro-menu-toggler')) $p = $p.closest('.mabro-menu-toggler');
	const obj = {highlight:$p,parent:$p,type:"menu"};
	if ( typeof funcarray === 'function' ) {
		funcarray().then( items => {
			obj.content = items;
			glob.menu(me.originalEvent||me,obj);
		})
	} else if ( Array.isArray(funcarray) ) {
		obj.content = funcarray;
		glob.menu(me.originalEvent||me,obj);
	}
};

const mabroMenuItems = async (mb) => {
	const items = [];
	items.push( {icon: _icon('mabro-app'),label:_l('menu-mabro-About-app',{app:'MaBro.app'}),action:()=>{ mb.plugin('about',mb.getProp('mabro_base')+'about.html') }} );
	return items;
};

const buildMabroMenu = async ($m,mb) => {
	if ( ! $m.hasClass('mabro-menu-inited') ) {
		const $mbmenu = makeMenu($(_icon('mabro-app')),()=>{ return mabroMenuItems(mb) } );
		$m.append($mbmenu);
		$m.append('<div class="mabro-menu-bars"></div>');
		$m.addClass('mabro-menu-inited');
	}
	return $('.mabro-menu-bars',$m);
};

const makeAppMenu = (mb,app) => {
	const m = app.getManifest();
	const $appmenu = makeMenu((m.app_icon ? $(m.app_icon) : (m.app_name||'App')),()=>{ return appMenuItems(mb,app) } );
	return $appmenu;
};

const appMenuItems = async (mb,app) => {
	const items = [];
	const m = app.getManifest();
	if ( m ) {
		const about = { label:_l('menu-mabro-About-app',{app:m.app_name}),action:()=>{ mb.plugin('about',{ manifest: m }) }};
		if ( m.app_icon ) about.icon = m.app_icon;
		items.push(about);
	}
	const ws = app.windows();
	if ( ws && Array.isArray(ws) && ws.length ) {
		if ( items.length ) items.push('-');
		ws.forEach( w => {
			if ( w.active() ) {
				items.push({ label: '❖ ' + w.title() });
			} else {
				items.push({ label: w.title(), action: ()=>{  app.activateWindow(w) } });
			}
		});
	}
	if ( ! app.isSystem() ) {
		if ( items.length ) items.push('-');
		items.push({ icon: _icon("menu-exit"), label: _l('menu-Quit',{app:m.app_name}), action: ()=>{ app.quit() }});
	}
	return items;
};

const getClass = async (mb) => {
	const MENU = class {
		#prop;#menu;
		constructor(manifest) {
			this.#prop = {};
			this.#prop.registered = {system:[],apps:[]};
			this.#prop.manifest = manifest;
			this.#prop.mb = mb;
			this.#prop.target = $('body > .mabro-main-container > .mabro-menubar-wrap');
			$(document.body).on('mabro:changedApp',()=>{ setTimeout( ()=>{ this.refresh() }, 100 ) });
		};
		async init() {
			if ( ! glob.localize.loaded ) {
				setTimeout( ()=>{ this.init(mb);}, 100 );
				return;
			}
			this.#prop.menus = await buildMabroMenu(this.#prop.target,mb);
			this.refresh();
		};
		registerMenuBar(app,aa) {
			if ( ! this.#prop.menus ) {
				setTimeout( ()=>{ this.registerMenuBar(app,aa); }, 100 );
				return;
			}
			const uri = app.getUri();
			let $mb = $(`.mabro-menu-bar[for="${uri}"]`,this.#prop.menus);
			if ( ! $mb.length ) {
				$mb = $(`<div for="${uri}" class="mabro-menu-bar"></div>`);
				this.#prop.menus.append($mb);
			}
			$mb.empty();
			const $appmenu = makeAppMenu(this.#prop.mb, app);
			if ( $appmenu ) $mb.append( $appmenu );
			if ( Array.isArray(aa) ) aa.filter(a => a.label).forEach( a => {
				const $t = makeMenu( a.label, a.items );
				$mb.append( $t );
			});
			this.refresh();
		};
		async appContextMenu(event,ele,app) {
			event.preventDefault();
			event.stopPropagation();
			const obj = {highlight:ele,parent:ele};
			let items = [];
			if ( app.running ) {
				items = await appMenuItems(this.#prop.mb,app.api);
			} else {
				const ab = { label:_l('menu-mabro-About-app',{app:app.manifest.app_name}),action:()=>{ this.#prop.mb.plugin('about',{ manifest: app.manifest }) }};
				const mc = { icon: _icon('menu-launch'), label: _l('menu-launch-app',{app:app.manifest.app_name}), action: ()=>{ this.#prop.mb.runapp( app.manifest.base_uri ) }};
				if ( app.manifest && app.manifest.app_icon ) ab.icon = app.manifest.app_icon;
				items.push(ab,'-',mc);
			}
			if ( app.manifest.app_name ) items.unshift( app.manifest.app_name );
			obj.content = items;
			glob.menu(event.originalEvent||event,obj);
		};
		async refresh() {
			if ( ! this.#prop.menus ) return;
			const apps = this.#prop.mb.apps();
			const keys = Object.keys(apps).filter(k => apps[k].running);
			const aa = ($(document.body).data('mabro')||{}).activeApp;
			$('.mabro-menu-bar[for]',this.#prop.menus).removeClass('mabro-active');
			$('.mabro-menu-bar[for]',this.#prop.menus).each( (idx,mb) => {
				if ( ! keys.includes($(mb).attr('for'))) $(mb).remove();
			});
			if ( aa ) $(`.mabro-menu-bar[for="${aa}"]`,this.#prop.menus).addClass('mabro-active');
		};
	}
	return MENU;
};

export default getClass;
