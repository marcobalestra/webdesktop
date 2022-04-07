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

const loadLocales = ( manifest, prefix ) => {
	if ( ! Array.isArray(manifest.locales) ) return;
	const ls = [];
	if ( manifest.locales.includes('en') ) ls.push('en');
	if ( manifest.locales.includes('multi') ) ls.push('multi');
	if ( manifest.locales.includes('icon') ) ls.push('icon');
	if ( _lang !== 'en' && manifest.locales.includes(_lang) ) ls.push(_lang);
	if ( ls.length ) ls.forEach( l => {
		const uri = manifest.base_uri + manifest.locales_dir + l + manifest.locales_suffix;
		if ( cache.loaded[uri] ) return;
		glob.localize.loadjs( uri, l, true, prefix );
		cache.loaded[uri] = true;
	});
};

const getClass = async (pars) => {
	const MB = class {
		#prop; #fs;
		constructor() {
			this.#prop = JSON.parse(JSON.stringify(pars));
			this.#prop.manifests = {};
			this.#prop.plugins = {};
			this.#prop.pluginsingletons = {};
		};
		static init = async (mb) => {
			mb.loadCSS(mb.getProp('mabro_base')+'css/mabro.css');
			if ( typeof glob.localize.main !== 'object') glob.localize.main = {};
			if ( typeof glob.localize.main.icon !== 'object') glob.localize.main.icon = {};
			mb.getManifest(mb.getProp('mabro_base')).then( man => { loadLocales(man); });
			(await mb.getFs()).boot();
		};
		async init() { return await MB.init(this); };
		async start() {
			
		};
		async dialog(options) { return await this.plugin('dialog',options); };
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
			if ( typeof this.#fs === 'undefined' ) this.#fs = this.plugin('fs');
			return this.#fs;
		};
		async plugin(pluginName,initData,uri,classInitData) {
			const pc = await this.pluginClass(pluginName,uri,classInitData);
			if ( pc ) {
				if ( pc.manifest.singleton && this.#prop.pluginsingletons[pluginName] ) return this.#prop.pluginsingletons[pluginName];
				const o = (new pc.classfunc(pc.manifest,initData));
				if ( pc.manifest.singleton ) this.#prop.pluginsingletons[pluginName] = o;
				return o;
			}
			return false;
		};
		async pluginClass(pluginName,puri,classInitData) {
			if ( typeof this.#prop.plugins[pluginName] === 'undefined' ) {
				if ( ! puri ) {
					if ( typeof classInitData === 'undefined' ) classInitData = this;
					puri = this.getProp('mabro_base') + 'plugins/'+pluginName+'/';
				}
				const manifest = await this.getManifest(puri);
				if ( manifest && typeof manifest === 'object' ) {
					loadLocales( manifest );
					this.#prop.plugins[pluginName] = { manifest: manifest }
					if ( typeof manifest.script === "string" ) {
						if (manifest.script.includes('<mjs_suffix>')) manifest.script = manifest.script.replace(/\<mjs_suffix\>/,this.getProp('mjs_suffix'));
						let mod,cl;
						try {
							mod = await import(`${manifest.base_uri}${manifest.script}`);
						} catch(e) {
							console.log("Error loading plugin script",manifest,e);
						}
						if ( mod ) {
							try {
								cl = await mod.default(classInitData);
								if ( typeof cl === 'function' ) this.#prop.plugins[pluginName].classfunc = cl;
							} catch (e) {
								console.log("Error loading plugin class",manifest,e);
							}
						}
					}
				}
			}
			return this.#prop.plugins[pluginName];
		};
	};
	return MB;
};

export default getClass;
