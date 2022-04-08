const buildMabroMenu = ($m,mbicon) => {
	if ( ! $('.mabro-menu-title',$m).length ) {
		const id = glob.uid('menu-');
		const $mbcont = $('<div class="dropdown"></div>');
		$mbcont.append(`<button class="btn btn-link mabro-menu-title dropdown-toggle" id="${id}" type="button" data-toggle="dropdown" aria-expanded="false">${mbicon}</button>`);
		const $mbtent = $(`<div class="dropdown-menu" aria-labelledby="${id}"></div>`);
		$mbcont.append($mbtent);
		$m.append($mbcont);
	}
	return;
};

const buildMember = (k,x) => {
	const $out = $(`<div for="${k}"></div>`);
	if ( x.running ) $out.addClass('running');
	$out.append( x.manifest.app_icon || _icon("unknown_app") );
	if ( x.manifest.app_name ) {
		$out.append($('<label></label>').append(x.manifest.app_name) );
	}
	return $out;
};

const getClass = async (mb) => {
	const DOCK = class {
		#prop;#menu;
		constructor(manifest) {
			this.#prop = {};
			this.#prop.registered = {system:[],apps:[]};
			this.#prop.manifest = manifest;
			this.#prop.mb = mb;
			this.#prop.target = $('body > .mabro-main-container > .mabro-dock-wrap > .mabro-dock-content');
			this.#prop.menutarget = $('body > .mabro-main-container > .mabro-menu-wrap');
			mb.getManifest().then( m => {
				this.#prop.appsmenu = buildMabroMenu(this.#prop.menutarget,m.app_icon);
			});
		};
		async render() {
			this.#prop.target.empty();
			const apps = this.#prop.mb.apps();
			const syskeys = Object.keys(apps).filter( x => x.system );
			const appkeys = Object.keys(apps).filter( x => ! x.system );
			syskeys.forEach( k => this.#prop.target.append( buildMember(k,apps[k])) );
			appkeys.forEach( k => this.#prop.target.append( buildMember(k,apps[k])) );
		};
		async refresh() {
			const apps = this.#prop.mb.apps();
			$('div[for]',this.#prop.target).removeClass('running');
			Object.keys(apps).filter(k => apps[k].running).forEach( k => {
				$(`div[for="${k}"]`,this.#prop.target).addClass('running');
			});
		};
	}
	return DOCK;
};

export default getClass;
