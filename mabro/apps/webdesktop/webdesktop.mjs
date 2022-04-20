const makeFolderWindow = ( wobj,folder ) => {
	const $w = wobj.wrap();
	$w.addClass('wd-folder-window').attr('fsid',folder.id);
	return $w;
};

const WDICON = class {
	#prop;
	constructor( options ) {
		this.#prop = { options: options };
		this.#prop.size = options.size||'big';
		this.#prop.svg = options.svg||'-';
		this.#prop.label = options.label||'No name';
	};
	get() {
		if ( ! this.#prop.render ) this.#prop.render = WDICON.render(this.#prop);
		return this.#prop.render;
	};
	static render(p) {
		const $d = $(`<div class="wd-icon wd-icon-${p.size}"></div>`);
		$d.append( p.svg );
		$d.append( $('<div></div>').append($('<label></label>').append(p.label )) );
		$d.attr('title',p.label);
		if ( p.options.id ) $d.attr('fsid',p.options.id);
		return $d;
	};
};

const getClass = async (manifest) => {
	const WD = class {
		#prop; #api; #mb; #wrap;#wclass;#fs;
		constructor(api,options) {
			if ( ! options.theme ) options.theme = 'default';
			this.#prop = { options: options, manifest: manifest };
			this.#api = api;
			this.#mb = options.system;
			this.#wrap = options.wrap;
			this.#mb.loadCSS(`${this.#prop.manifest.base_uri}themes/${this.#prop.options.theme}/style.css`);
			this.#wrap.addClass('mabro-webdesktop mabro-active');
		};
		async init() {
			this.#fs = await this.#mb.getFs();
			const root = this.#fs.getRoot();
			this.#prop.mainicon = new WDICON({ label:root.name, svg: this.#prop.manifest.app_icon, size: 'big', id: root.id });
			const i = this.#prop.mainicon.get();
			i.css({ position: 'absolute', top: '40px', right: '40px' });
			i.on('dblclick',()=>{ this.openFolder( root.id) });
			this.#wrap.append( i );
		};
		async event(name,data) {
			if ( name === 'run'|| name === 'activate' ) {
				let activate = (name === 'activate');
				if ( activate ) this.#wrap.trigger('click');
				return this.#wrap;
			}
		};
		async openFolder(id) {
			if ( typeof id === 'object' ) id = id.id;
			let $w = $(`.wd-folder-window[fsid="${id}"]`,this.#wrap);
			if ( $w.length ) {
				$w.trigger("mouseup");
				return $w;
			}
			const f = this.#fs.getDir(id);
			if ( ! f ) return;
			const w = this.#api.newWindow({ title: f.name });
			makeFolderWindow( w, f );
			w.show();
			return w.wrap();
		};
		async refresh() {

		};
	}
	return WD;
};

export default getClass;
