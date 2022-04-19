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
	const currentstatus = $(document.body).data('mabro');
	if ( currentstatus && typeof currentstatus === 'object' && currentstatus.activeApp ) {
		const m = await mb.getManifest( currentstatus.activeApp );
		const mi = { label:_l('menu-mabro-About-app',{app:(m.app_name||m.base_uri)}),action:()=>{ mb.plugin('about',{ manifest: m }) }};
		if ( m.app_icon ) mi.icon = m.app_icon;
		items.push(mi);
	}
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
		registerMenuBar(uri,aa) {
			if ( ! this.#prop.menus ) {
				setTimeout( ()=>{ this.registerMenuBar(uri,aa); }, 100 );
				return;
			}
			let $mb = $(`.mabro-menu-bar[for="${uri}"]`,this.#prop.menus);
			if ( ! $mb.length ) {
				$mb = $(`<div for="${uri}" class="mabro-menu-bar"></div>`);
				this.#prop.menus.append($mb);
			}
			$mb.empty();
			if ( Array.isArray(aa) ) aa.filter(a => a.label).forEach( a => {
				const $t = makeMenu( a.label, a.items );
				$mb.append( $t );
			});
			this.refresh();
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
