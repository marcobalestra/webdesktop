const initFs = async (mb) => {
	if ( ! glob.localize.loaded ) {
		setTimeout( ()=>{ initFs(mb);}, 100 );
		return;
	}
	const fs = await mb.getFs();
	const es = fs.existingStorages();
	if ( es.length == 1 ) {
		fs.init(es[0]);
		mb.start();
		return;
	}
	const $dlog = await mb.plugin('dialog',{ canclose: false });
	const $body = $dlog.body();
	let secured = false;
	let password = '';
	if ( es.length == 0 ) {
		$dlog.title(_l('StoragesNotFound'));
	} else {
		$dlog.title(_l('StoragesMultiFound'));
	}
	const ntbid = glob.uid('btn');
	const $ntb = $(`<p><input name="secured" checked="checked" type="radio" id="${ntbid}"><label for="${ntbid}"> <b>${_l('ComputerNotTrusted')}</b></label><br /><i>“${_l('ComputerNotTrustedDesc')}”</i><small style="display:block;font-size:75%;">${_l('ComputerNotTrustedHelp')}</small></p>`);
	$('input',$ntb).on('click',()=>{ secured = false; });
	const tbid = glob.uid('btn');
	const $tb = $(`<p><input name="secured" type="radio" id="${tbid}"><label for="${tbid}"> <b>${_l('ComputerIsTrusted')}</b></label><br /><i>“${_l('ComputerIsTrustedDesc')}”</i><small style="display:block;font-size:75%;">${_l('ComputerIsTrustedHelp')}</small></p>`);
	$('input',$tb).on('click',()=>{ secured = true; });
	$body.append(
		$('<p></p>').append(_l('Privacy level'),':'),
		$('<form class="d-block ml-4"></form>').append($ntb,$tb)
	);
	if ( window.location.href.startsWith('https://')) {
		const $pwd = $(`<p><input type="password" class="form-control"><small style="display:block;font-size:75%;">${_l('PasswordHelp')}</small></p>`);
		$('input',$pwd).on('keyup change',()=>{ password = $('input',$pwd).val() });
		$body.append($('<p></p>').append(_l('Password'),':'), $('<form class="d-block ml-4"></form>').append($pwd));
	}
	$body.append($('<div></div>').append( _l('ComputerChoiceCanSaveSession')));
	const initStorage = async () =>{
		$dlog.body(_l('Operation in progress'));
		$dlog.footer('');
		await fs.init((secured ? 'local' : 'session'),password);
		$dlog.close();
		mb.start();
	};
	const loadStorage = () => {

	};
	const $lsb = $(`<button type="button" class="btn btn-secondary mr-auto">${_l('StorageInitLoad')}</button>`);
	const $nsb = $(`<button type="button" class="btn btn-primary">${_l('StorageInitNew')}</button>`);
	$nsb.on('click',initStorage);
	$dlog.footer().append($lsb,$nsb);
	$dlog.open();
};

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
		//try {
			const importedPassword = await window.crypto.subtle.importKey( "raw", password, {name:"PBKDF2"}, false, ["deriveKey"] );
			this.#prop.key_object = await window.crypto.subtle.deriveKey(
				{ name: "PBKDF2", salt: pepper, iterations: 100000, hash: "SHA-256" },
				importedPassword,
				{ "name": "AES-GCM", "length": 128 },
				false,
				["encrypt", "decrypt"]
			);
		//} catch(e) {
		//	console.log("Error while importing key: " + e.message);
		//}
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
		}
		return window.btoa(data);
	};
	async decrypt( data ) {
		let key_object = await this.getKey();
		data = window.atob(data);
		if ( key_object ) {
			try {
				data = await window.crypto.subtle.decrypt({name: "AES-GCM", iv: this.#prop.vector }, key_object, data );
			} catch(e) {
				console.log('vault decrypt',e);
				return { error : 'decrypt', message : e.message };
			}
			data = arraybuffer2string(data);
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
		async boot() { initFs(mb) };
		async init(mode,password) {
			if ( mode === 'local' ) {
				this.#storage = window.localStorage;
			} else {
				this.#storage = window.sessionStorage;
			}
			if ( password ) this.#vault.setPassword( password );
			if ( this.#storage.getItem('mabro') ) {
				this.#data = await this.#vault.decrypt( this.#storage.getItem('mabro') );
			} else {
				this.#data = await glob.get( this.#prop.myuri + 'skeleton.json' );
				this.commit();
			}
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
	}
	return FS;
};

export default getClass;
