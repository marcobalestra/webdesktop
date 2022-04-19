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
		if ( $(`link[href="${c.attr('href')}"]`,h).length ) return;
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
		#prop; #fs; #dock;
		constructor() {
			this.#prop = JSON.parse(JSON.stringify(pars));
			this.#prop.manifests = {};
			this.#prop.plugins = {};
			this.#prop.pluginsingletons = {};
			this.#prop.apps = {};
		};
		static init = async (mb) => {
			mb.loadCSS(mb.getProp('mabro_base')+'css/mabro.css');
			if ( typeof glob.localize.main !== 'object') glob.localize.main = {};
			if ( typeof glob.localize.main.icon !== 'object') glob.localize.main.icon = {};
			mb.getManifest(mb.getProp('mabro_base')).then( man => { loadLocales(man); });
			$(document.body).data('mabro',{});
			(await mb.getFs()).boot();
		};
		async init() {
			if ( this.#prop.skeleton ) return await MB.init(this);
			$( document.body ).load( this.getProp('mabro_base') + 'skeleton.html', undefined, () =>{
				this.#prop.skeleton = true;
				this.init();
			});
		};
		async start() {
			const wd = await this.app('webdesktop',{ system: this, wrap:$('body>.mabro-main-container>.mabro-main-wrap>.mabro-webdesktop') });
			await this.getMenu();
			const apps = this.#fs.apps();
			apps.forEach( uri => { this.app(uri) });
			wd.api.event('run');
			$(document.body)
				.on('mabro:closeWindow',(ev,args)=>{ this.closeWindow(args) })
				.on('mabro:changedApp',()=>{this.#dock.refresh()})
				.on('mabro:changedWindow',(ev,args)=>{ this.changedWindow(args) });
		};
		async launchedApp( uri ) {
			if ( this.#prop.apps[uri] ) this.#prop.apps[uri].running = true;
			const dd = $(document.body).data('mabro')||{};
			dd.activeApp = uri;
			$(document.body).data('mabro',dd);
			$(document.body).trigger('mabro:changedApp');
		};
		async app(uri,options) {
			if ( ! uri.includes('/') ) {
				uri = this.getProp('mabro_base') + 'apps/'+uri+'/';
			}
			if ( ! this.#prop.apps[uri] ) {
				const manifest = await this.getManifest(uri);
				if ( ! (manifest && typeof manifest === 'object') ) return;
				loadLocales( manifest, uri );
				const ao = { manifest: manifest };
				const isSystem = !! (options && options.system);
				if ( isSystem ) ao.system = true;
				if ( manifest.name ) ao.name = manifest.name;
				this.#prop.apps[uri] = ao;
			}
			if ( this.#prop.apps[uri] && ! this.#prop.apps[uri].api ) {
				const appapi = await this.plugin('appapi');
				await appapi.init( uri, this.#prop.apps[uri].manifest, options );
				this.#prop.apps[uri].api = appapi;
				(await this.getDock()).render();
				if ( ! this.#prop.apps[uri].system ) this.#fs.apps(true);
			}
			return this.#prop.apps[uri];
		};
		apps() { return this.#prop.apps; };
		runapp(uri) {
			const app = this.#prop.apps[uri];
			if ( ! app ) return;
			this.app(uri).then( a => {
				a.api.event('run');
				this.launchedApp(uri);
			})
		};
		closeWindow( w ) {
			const uri = $(w).attr('for');
			if ( ! uri ) return;
			const app = this.#prop.apps[uri];
			if ( ! app ) return;
			app.api.closeWindow($(w).attr('id'));
		};
		changedWindow( data ) {
			if ( ! (typeof data === 'object' && data && data.uri && data.id )) return;
			const app = this.#prop.apps[data.uri];
			if ( ! app ) return;
			const win = app.api.winById( data.id );
			if ( ! win ) return;
			app.api.dispatch('changedWindow',win);
		};
		quitapp(uri) {
			const app = this.#prop.apps[uri];
			if ( ! app || app.system ) return;
			delete app.running;
			app.api.event('quit').then( e => {
				delete app.api;
				this.app('webdesktop').then( wd => {
					wd.api.event('run');
					$(document.body).trigger('mabro:changedApp');
				});
			});
		};
		async dialog(options) { return await this.plugin('dialog',options); };
		loadCSS( ...args ) {
			if ( args.length === 1 && Array.isArray(args[0]) ) args = args[0];
			return loadCSS.call(window,this,args);
		};
		getProp(pname) { return this.#prop[pname]; };
		async getManifest(uri) {
			if ( typeof uri === 'undefined' ) uri = this.getProp('mabro_base');
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
			if ( typeof this.#fs === 'undefined' ) this.#fs = await this.plugin('fs');
			return this.#fs;
		};
		async getDock() {
			if ( typeof this.#dock === 'undefined' ) this.#dock = await this.plugin('dock');
			return this.#dock;
		};
		async getMenu() {
			if ( typeof this.#prop.menu === 'undefined' ) {
				this.#prop.menu = await this.plugin('menu');
				this.#prop.menu.init();
			}
			return this.#prop.menu;
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
					if ( manifest.css ) {
						if ( typeof manifest.css === 'string' ) manifest.css = [manifest.css];
						if ( Array.isArray(manifest.css) && manifest.css.length && ! manifest.cssParsed ) {
							manifest.css = manifest.css.map( u => (u.match(/^([^:]+:\/\/|\/)/) ? u : `${manifest.base_uri}${u}`));
							manifest.cssParsed = true;
							loadCSS( this, manifest.css );
						}
					};
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
