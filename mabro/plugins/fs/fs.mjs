const existingStorages = () => {
	const out = [];
	if ( window.sessionStorage.getItem('mabro') ) out.push('session');
	if ( window.localStorage.getItem('mabro') ) out.push('local');
	return out;
};

const string2arraybuffer = (str) => {
	let encoder = new TextEncoder("utf-8");
	return encoder.encode(str);
};
const arraybuffer2string = (buffer) => {
	let decoder = new TextDecoder("utf-8");
	return decoder.decode(buffer);
}

const VAULT = class {
	#prop;
	constructor( password ) {
		this.#prop = {
			password : password||"", // the password
			key_object : null,
			vector : window.crypto.getRandomValues(new Uint8Array(16))
		};
	};
	async getKey() {
		if ( this.#prop.key_object ) return this.#prop.key_object;
		if ( ! this.#prop.password ) return false;
		const password = string2arraybuffer(this.#prop.password);
		const pepper = string2arraybuffer("¡Hasta la victoria siempre!");
		try {
			const importedPassword = await window.crypto.subtle.importKey( "raw", password, {name:"PBKDF2"}, false, ["deriveKey"] );
			this.#prop.key_object = await window.crypto.subtle.deriveKey(
				{ name: "PBKDF2", salt: pepper, iterations: 100000, hash: "SHA-256" },
				importedPassword,
				{ "name": "AES-GCM", "length": 128 },
				false,
				["encrypt", "decrypt"]
			);
		} catch(e) {
			console.log("Error while importing key: " + e.message);
		}
		return this.#prop.key_object;
	};
	setPassword( password ) {
		this.#prop.password = password;
		this.#prop.key_object = null;
	};
	async isEncrypted() { return !! ( this.#prop.password && (await this.getKey()) ) };
	async encrypt( data ) {
		let key_object = await this.getKey();
		if ( typeof data === 'object' ) data = JSON.stringify(data);
		if ( key_object ) {
			data = string2arraybuffer(data);
			data = await window.crypto.subtle.encrypt({name: "AES-GCM", iv: this.#prop.vector}, key_object, data);
			data = arraybuffer2string(data);
			data = window.encodeURIComponent(data);
		} else {
			data = window.btoa(window.encodeURIComponent(data));
		}
		return data;
	};
	async decrypt( data ) {
		let key_object = await this.getKey();
		if ( key_object ) {
			data = window.decodeURIComponent(data);
			try {
				data = await window.crypto.subtle.decrypt({name: "AES-GCM", iv: this.#prop.vector }, key_object, data );
			} catch(e) {
				console.log('vault decrypt',e);
				return { error : 'decrypt', message : e.message };
			}
			data = arraybuffer2string(data);
		} else {
			data = window.decodeURIComponent(window.atob(data));
		}
		return JSON.parse( data );
	};
};

const getClass = async (mb) => {
	const writeLatency = 2000;
	const FS = class {
		#prop; #storage; #data; #vault;
		constructor(manifest) {
			this.#prop = {};
			this.#prop.manifest = manifest;
			this.#prop.mb = mb;
			this.#prop.myuri = manifest.base_uri;
			this.#vault = (new VAULT());
		};
		async boot() { mb.plugin('fs-starter',{ cancancel: false, autostart: true }) };
		async init(idata) {
			if ( typeof  idata !== 'object' ) idata = { mode: 'local' };
			if ( idata.mode === 'local' ) {
				this.#storage = window.localStorage;
			} else {
				this.#storage = window.sessionStorage;
			}
			if ( idata.password ) this.#vault.setPassword( idata.password );
			if ( this.#storage.getItem('mabro') ) {
				this.#data = await this.#vault.decrypt( this.#storage.getItem('mabro') );
			} else {
				if ( ! idata.profile ) idata.profile = 'skeleton';
				this.#data = await glob.get( this.#prop.myuri + idata.profile + '.json' );
				this.commit();
			}
		};
		apps( refresh ) {
			if ( refresh ) {
				const apps = [];
				const appshash = this.#prop.mb.apps();
				Object.keys( appshash ).forEach( k => {
					if ( appshash[k].system ) return;
					apps.push(k);
				});
				this.#data.apps = apps;
				this.commit();
			}
			return JSON.parse( JSON.stringify( this.#data.apps ));
		};
		commit(force) {
			if ( this.#prop.commitTimeout ) {
				window.clearTimeout( this.#prop.commitTimeout );
				delete this.#prop.commitTimeout;
			}
			if ( force ) {
				this.#vault.encrypt( this.#data ).then( enc => {
					this.#storage.setItem('mabro',enc);
					this.#vault.isEncrypted().then( isE => {
						if ( isE ) {
							this.#storage.setItem('mabro-encrypted',"true");
						} else if ( this.#storage.getItem('mabro-encrypted') ) {
							this.#storage.removeItem('mabro-encrypted');
						}
					});
				});
			} else {
				this.#prop.commitTimeout = window.setTimeout( ()=>{ this.commit(true); }, writeLatency);
			}
		};
		existingStorages() { return existingStorages(); };
		getDir(id) {
			let d = this.#data.dirs[id];
			if ( ! d ) return undefined;
			d = JSON.parse(JSON.stringify(d));
			d.id = id;
			return d;
		};
		setDir( data ) {
			if ( ! ( data.id && data.name ) ) return;
			let d = JSON.parse(JSON.stringify(data));
			let id = d.id;
			delete d.id;
			this.#data.dirs[id] = d;
			this.commit();
		};
		rmDir( id ) {
			if ( typeof id == 'object' && id.id ) id = id.id;
			let data = this.#data.dirs[id];
			if ( typeof data !== 'object' ) return;
			if ( Array.isArray( data.dirs ) ) data.dirs.forEach( sd => { this.rmDir(sd) });
			if ( Array.isArray( data.files ) ) data.files.forEach( f => { this.rmFile(f) });
			if ( data.parent ) this.#data.dirs[data.parent].dirs = this.#data.dirs[data.parent].dirs.filter( x => ( x !== id ));
			delete this.#data.dirs[id];
			this.commit();
		};
		rmFile( id ) {
			if ( typeof id == 'object' && id.id ) id = id.id;
			let data = this.#data.files[id];
			if ( typeof data !== 'object' ) return;
			if ( data.parent ) this.#data.dirs[data.parent].files = this.#data.dirs[data.parent].files.filter( x => ( x !== id ));
			delete this.#data.files[id];
			this.commit();
		};
		getRoot(){ return this.getDir( this.#data.root ) };
		getTrash(){ return this.getDir( this.#data.trash ) };
		listAncestors( id, list ) {
			if ( typeof list === 'undefined' ) list = [];
			else list.push(id);
			const o = this.#data.dirs[id];
			if ( o.parent ) return this.listAncestors( o.parent, list )
			return list;
		};
		dump() { console.log( this.#data ); }
	}
	return FS;
};

export default getClass;
