const makeFolderWindow = ( wobj,folder ) => {
	const $w = wobj.wrap();
	$w.addClass('wd-folder-window').attr('fsid',folder.id);
	return $w;
};

const WDICON = class {
	#prop;
	constructor( options ) {
		this.#prop = { options: options };
		this.#prop.svg = options.svg||'-';
		this.#prop.label = options.label||'No name';
	};
	get() {
		if ( ! this.#prop.render ) this.#prop.render = WDICON.render(this,this.#prop);
		return this.#prop.render;
	};
	click(e) {
		if ( e && typeof e === 'object' && e.target) {
			e.preventDefault();
			e.stopPropagation();
		}
		this.get().toggleClass('wd-selected');
		if ( this.#prop.options.onclick ) this.#prop.options.onclick(e);
	};
	contextmenu(e) {
		if ( e ) {
			e.preventDefault();
			e.stopPropagation();
		};
		if ( this.#prop.options.oncontextmenu ) this.#prop.options.oncontextmenu(e);
	};
	dblclick(e){
		if ( e ) {
			e.preventDefault();
			e.stopPropagation();
		};
		this.get().removeClass('wd-selected');
		if ( this.#prop.options.ondblclick ) this.#prop.options.ondblclick(e);
	};
	static render(obj,p) {
		const $d = $(`<div class="wd-icon"></div>`);
		$d.append( p.svg );
		$d.append( $('<div></div>').append($('<label></label>').append(p.label )) );
		$d.attr('title',p.label);
		if ( p.options.node ) $d.attr('fsid',p.options.node.id );
		if ( p.options.css ) $d.css(p.options.css);
		$d.on('click',(e)=>{ obj.click(e) });
		$d.on('contextmenu',(e)=>{ obj.contextmenu(e) });
		$d.on('dblclick',(e)=>{ obj.dblclick(e) });
		if ( ! p.options.nodrag ) $d.attr('draggable',true);
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
			this.#prop.mainicon = new WDICON({
				node : root,
				label:root.name,
				svg: this.#prop.manifest.app_icon,
				id: root.id,
				css : { position: 'absolute', top: '40px', right: '40px' },
				ondblclick: ()=>{ this.openFolder( root.id) },
				nodrag: true
			});
			const i = this.#prop.mainicon.get();
			this.#wrap.append( i );
			$('.mabro-main-wrap').on('click',()=>{ this.#wrap.children('.wd-icon').removeClass('wd-selected') });
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
