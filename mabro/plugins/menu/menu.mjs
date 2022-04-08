const buildMabroMenu = ($m,mbicon) => {
	if ( ! $('.mabro-menu-title',$m).length ) {
		const id = glob.uid('menu-');
		const $mbcont = $('<div class="dropdown"></div>');
		$mbcont.append(`<button class="btn btn-link mabro-menu-title dropdown-toggle" id="${id}" type="button" data-toggle="dropdown" aria-expanded="false">${mbicon}</button>`);
		const $mbtent = $(`<div class="dropdown-menu" aria-labelledby="${id}"></div>`);
		const $about = $(`<a class="dropdown-item" href="#">${_l('menu-mabro-About')}</a>`);
		$mbtent.append($about);
		$mbcont.append($mbtent);
		$m.append($mbcont);
	}
	if ( ! $('.mabro-menu-content',$m).length ) {
		$m.append('<div class="mabro-menu-content"></div>');
	}
	return $('.mabro-menu-content',$m);
};

const getClass = async (mb) => {
	const MENU = class {
		#prop;#menu;
		constructor(manifest) {
			this.#prop = {};
			this.#prop.registered = {system:[],apps:[]};
			this.#prop.manifest = manifest;
			this.#prop.mb = mb;
			this.#prop.target = $('body > .mabro-main-container > .mabro-menu-wrap');
			$(document.body).on('mabro:changedApp',()=>{this.refresh()});
		};
		async init() {
			if ( ! glob.localize.loaded ) {
				setTimeout( ()=>{ this.init(mb);}, 100 );
				return;
			}
			this.#prop.menus = buildMabroMenu(this.#prop.target,(await mb.getManifest()).app_icon);
		};
		async refresh() {
		};
	}
	return MENU;
};

export default getClass;
