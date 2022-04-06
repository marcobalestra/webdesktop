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
	$body.append( $('<p></p>').append(_l('Privacy level'),':'));
	$body.append( $('<form class="d-block ml-4"></form>').append($ntb,$tb) );
	$body.append( $('<div></div>').append( _l('ComputerChoiceCanSaveSession')) );
	const initStorage = async () =>{
		$dlog.body(_l('Operation in progress'));
		$dlog.footer('');
		await fs.init(secured ? 'local' : 'session');
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

const getClass = async (mb) => {
	const FS = class {
		#prop;
		#storage;
		#data;
		constructor(manifest) {
			this.#prop = {};
			this.#prop.manifest = manifest;
			this.#prop.mb = mb;
			this.#prop.myuri = manifest.base_uri;
		};
		async boot() { initFs(mb) };
		async init(mode) {
			if ( mode === 'local' ) {
				this.#storage = window.localStorage;
			} else {
				this.#storage = window.sessionStorage;
			}
			if ( this.#storage.getItem('mabro') ) {
				this.#data = JSON.parse( this.#storage.getItem('mabro') );
			} else {
				this.#data = await glob.get( this.#prop.myuri + 'skeleton.json' );
				console.log( this.#prop );
				this.commit();
			}
		};
		commit(force) {
			if ( this.#prop.commitTimeout ) {
				clearTimeout( this.#prop.commitTimeout );
				delete this.#prop.commitTimeout;
			}
			if ( force ) {
				this.#storage.setItem('mabro',JSON.stringify(this.#data));
			} else {
				this.#prop.commitTimeout = setTimeout( ()=>{ this.commit(true); }, 1000);
			}
		};
		existingStorages() { return existingStorages(); };
	}
	return FS;
};

export default getClass;
