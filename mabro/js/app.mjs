const cache = { loaded : {} };

const loadCSS = ( mb, cssfiles ) => {
	const h = document.documentElement.querySelector('head')||document.body;
	let count = 0;
	cssfiles.forEach( c => {
		if ( typeof c === 'string' ) {
			c = $('<link rel="stylesheet" charset="utf-8" />').attr('href',c);
		} else if ( c instanceof HTMLElement ) {
			c = $(c);
		}
		if ( ! (c instanceof jQuery) ) {
			console.debug('[MB.loadCSS] Error loading CSS: need string, node or jquery objects',c);
			return;
		}
		if ( $(`link[href="${c.attr('href')}"]`,h).length ) {
			console.debug('[MB.loadCSS] Duplicated CSS',c);
			return;
		}
		c.on('error',(e)=>{ console.debug('[MB.loadCSS] Error loading CSS',c,e) });
		try { $(h).append( c ); count++; }
		catch(e) { console.debug('[MB.loadCSS] Error trying to load CSS',c,e); }
	});
	return count;
};

const loadLocales = ( manifest ) => {
	if ( ! Array.isArray(manifest.locales) ) return;
	manifest.locales.forEach( l => {
		const uri = manifest.base_uri + manifest.locales_dir + l + manifest.locales_suffix;
		if ( cache.loaded[uri] ) return;
		glob.localize.loadjs( uri, l, true );
		cache.loaded[uri] = true;
	});
};

const getClass = async (pars) => {
	const MB = class {
		#prop;
		#fs;
		constructor() {
			this.#prop = JSON.parse(JSON.stringify(pars));
			this.#prop.manifests = {};
			this.#prop.plugins = {};
		};
		static init = async (mb) => {
			mb.loadCSS(mb.getProp('mabro_base')+'css/mabro.css');
			if ( typeof glob.localize.main !== 'object') glob.localize.main = {};
			if ( typeof glob.localize.main.icon !== 'object') glob.localize.main.icon = {};
			mb.getManifest(mb.getProp('mabro_base')).then( man => { loadLocales(man); });
			const fs = await mb.getFs();
		};
		async init() {
			return await MB.init(this);
		};
		loadCSS( ...args ) { return loadCSS.call(window,this,args) };
		getProp(pname) { return this.#prop[pname]; };
		async getManifest(uri) {
			uri = uri.replace(/\/[^\/]*$/,"/");
			const muri = uri + 'manifest.json';
			if ( ! this.#prop.manifests[uri] ) {
				this.#prop.manifests[uri] = (await glob.get(muri))||{error:"Not found"};
				this.#prop.manifests[uri].base_uri = uri;
				if ( this.#prop.manifests[uri].app_icon && this.#prop.manifests[uri].app_name ) {
					glob.localize.main.icon[ 'app_' + this.#prop.manifests[uri].app_name ] = this.#prop.manifests[uri].app_icon;
				}
			}
			return this.#prop.manifests[uri];
		};
		async getFs() {
			if ( typeof this.#fs === 'undefined' ) this.#fs = this.loadPlugin(this.getProp('mabro_base')+'plugins/fs/',this);
			return this.#fs;
		};
		async loadPlugin(uri,initData) {
			const pc = await this.loadPluginClass(uri);
			if ( pc ) return (new pc(initData));
			return false;
		};
		async loadPluginClass(puri) {
			if ( puri.endsWith('plugin.mjs') ) puri = puri.replace(/plugin\.mjs/,'');
			if ( ! puri.endsWith('/') ) puri += '/';
			if ( typeof this.#prop.plugins[puri] === 'undefined' ) {
				const mod = await import(`${puri}plugin.${this.getProp('mjs_suffix')}`);
				try {
					this.#prop.plugins[puri] = mod.default();
				} catch (e) {
					console.log("Error loading plugin",puri,e);
					this.#prop.plugins[puri] = false;
				}
			}
			return this.#prop.plugins[puri]
		};
	};
	return MB;
};

export default getClass;
