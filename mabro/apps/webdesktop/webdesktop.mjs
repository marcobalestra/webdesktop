const getWindowClass = ( sysapi, baseWindowClass ) => {
	const WDW = class extends baseWindowClass {
		#sysapi; #prop;
		constructor(options) {
			super(sysapi, options);
		}
	};
	return WDW;
};

const WDICON = class {
	#prop;
	constructor( options ) {
		this.#prop = { options: options };
		this.#prop.type = options.type||'big';
		this.#prop.svg = options.svg||'-';
		this.#prop.label = options.label||'No name';
	};
	get() {
		if ( ! this.#prop.render ) this.#prop.render = WDICON.render(this.#prop);
		return this.#prop.render;
	};
	static render(p) {
		const $d = $(`<div class="wd-icon wd-icon-${p.type}"></div>`);
		$d.append( p.svg );
		$d.append( $('<div></div>').append($('<label></label>').append(p.label )) );
		$d.attr('title',p.label);
		return $d;
	};
};

const getClass = async (manifest) => {
	const WD = class {
		#prop; #api; #mb; #wrap;#wclass;
		constructor(api,options) {
			if ( ! options.theme ) options.theme = 'default';
			this.#prop = { options: options, manifest: manifest };
			this.#api = api;
			this.#mb = options.system;
			this.#wrap = options.wrap;
			this.#wclass = getWindowClass( options.sysapi, options.windowClass );
			this.#mb.loadCSS(`${this.#prop.manifest.base_uri}themes/${this.#prop.options.theme}/style.css`);
			options.sysapi.wrap().addClass('mabro-webdesktop');
		};
		init() {
			this.#prop.mainicon = new WDICON({ label:"Data", svg: this.#prop.manifest.app_icon, type: 'big' });
			const i = this.#prop.mainicon.get();
			i.css({ position: 'absolute', top: '40px', right: '40px' });
			this.#wrap.append( i );
		};
		async event(name,data) {
			if ( name === 'run'|| name === 'activate' ) {
				let activate = (name === 'activate');
				if ( ! this.#prop.rendered ) {
					await this.render();
					activate = true;
				}
				if ( activate ) this.#wrap.trigger('click');
				return this.#wrap;
			}
		};
		async render() {

		};
		async refresh() {

		};
	}
	return WD;
};

export default getClass;
