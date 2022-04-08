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
		#prop;
		constructor(manifest) {
			this.#prop = {};
			this.#prop.registered = {system:[],apps:[]};
			this.#prop.manifest = manifest;
			this.#prop.mb = mb;
			this.#prop.target = $('body > .mabro-main-container > .mabro-dock-wrap > .mabro-dock-content');
			$(document.body).on('mabro:changedApp',()=>{this.refresh()});
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
