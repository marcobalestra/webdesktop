const run = async (mb,fss, initData ) => {
	if ( ! glob.localize.loaded ) {
		setTimeout( ()=>{ run(mb,fss,initData); }, 100 );
		return;
	}
	const es = [];
	if ( window.sessionStorage.getItem('mabro') ) es.push('session');
	if ( window.localStorage.getItem('mabro') ) es.push('local');
	if ( initData.autostart && es.length === 1 ) {
		const fs = await mb.getFs();
		await fs.init({ mode: es[0] });
		mb.start();
		return;
	}
	const $dlog = await mb.plugin('dialog',{ canclose: initData.cancancel });
	const $body = $dlog.body();
	let secured = false;
	let password = '';
	if ( initData.autostart ) {
		if ( es.length === 0 ) {
			$dlog.title(_l('StoragesNotFound'));
		} else {
			$dlog.title(_l('StoragesMultiFound'));
		}
	} else {
		$dlog.title( _l('StorageChoose') );
	}
	const $form = $('<form class="d-block ml-4"></form>');
	if ( window.crypto && typeof window.crypto.subtle === 'object' ) {
		const $pwd = $(`<div class="mb-3" data-placement="bottom" data-html="true">${_l('PasswordDesc')}<div class="input-group"><input type="password" autocomplete="new-password" class="form-control"><div class="input-group-append"><span class="input-group-text">${_l('Password')}</span></div></div></div>`);
		$pwd.attr('title',_l('PasswordHelp'));
		$pwd.tooltip();
		$('input',$pwd).on('keyup change',()=>{ password = $('input',$pwd).val() });
		$form.append($pwd);
	}
	const ntbid = glob.uid('btn');
	const $ntb = $(`<div class="mb-3" data-placement="right" data-html="true"><input name="secured" checked="checked" type="radio" id="${ntbid}"><label for="${ntbid}"> <b>${_l('ComputerNotTrusted')}</b></label><br /><i>“${_l('ComputerNotTrustedDesc')}”</i></div>`);
	$ntb.attr('title', _l('ComputerNotTrustedHelp'));
	$ntb.tooltip();
	$('input',$ntb).on('click',()=>{ secured = false; });
	const tbid = glob.uid('btn');
	const $tb = $(`<div class="mb-3" data-placement="right" data-html="true"><input name="secured" type="radio" id="${tbid}"><label for="${tbid}"> <b>${_l('ComputerIsTrusted')}</b></label><br /><i>“${_l('ComputerIsTrustedDesc')}”</i></div>`);
	$tb.attr('title',_l('ComputerIsTrustedHelp'));
	$tb.tooltip();
	$('input',$tb).on('click',()=>{ secured = true; });
	$form.append($ntb,$tb);
	$body.append(
		$('<div class="mb-2"></div>').append(_l('Privacy level'),':'),
		$form,
		$('<div></div>').append( _l('ComputerChoiceCanSaveSession'))
	);
	const initStorage = async () =>{
		$dlog.body(_l('Operation in progress'));
		$dlog.footer('');
		const fs = await mb.getFs();
		await fs.init({ mode: (secured ? 'local' : 'session'), password: password });
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

const getClass = async (mb) => {
	const FSStarter = class {
		#prop;#data;
		constructor(manifest,initData) {
			this.#prop = {};
			this.#prop.manifest = manifest;
			this.#prop.mb = mb;
			this.#prop.myuri = manifest.base_uri;
			if ( ! initData ) initData = { cancancel: true };
			this.#data = initData;
			run(mb,this,this.#data);
		};
	}
	return FSStarter;
};

export default getClass;
