const mabroMenu = async (me,mb) => {
	let $p = $(me.target);
	if ( ! $p.hasClass('mabro-menu-toggler')) $p = $p.closest('.mabro-menu-toggler');
	const obj = {highlight:$p,parent:$p,type:"menu",content:[]};
	obj.content.push( {icon: _icon('mabro-app'),label:_l('menu-mabro-About'),action:()=>{ mb.plugin('about',mb.getProp('mabro_base')+'about.html') }} );
	glob.menu(me.originalEvent,obj);
};

const buildMabroMenu = async ($m,mb) => {
	if ( ! $m.hasClass('mabro-menu-inited') ) {
		const id = glob.uid('menu-');
		const $mbmenu = $(`<div class="dropdown mabro-menu-toggler" id="${id}"></div>`).append(_icon('mabro-app'));
		$mbmenu.on('click', (e)=>{ mabroMenu(e,mb) } );
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
			$(document.body).on('mabro:changedApp',()=>{this.refresh()});
		};
		async init() {
			if ( ! glob.localize.loaded ) {
				setTimeout( ()=>{ this.init(mb);}, 100 );
				return;
			}
			this.#prop.menus = await buildMabroMenu(this.#prop.target,mb);
		};
		async refresh() {
		};
	}
	return MENU;
};

export default getClass;
