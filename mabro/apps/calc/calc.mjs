const newCalcOptions = {
	minWidth: '260px',
	minHeight: '180px',
	width: '320px',
	height : '200px',
};

const makeCalc = (co,$c) => {
	const $out = $(`<div class="p-2">
	<div class="btn-toolbar" role="toolbar">
		<div class="btn-group btn-group-sm mr-2" role="group">
			<button type="button" class="btn btn-warning calc-clear">C</button>
			<button type="button" class="btn btn-warning calc-mclear">MC</button>
			<button type="button" class="btn btn-warning calc-allclear">AC</button>
		</div>
		<div class="btn-group btn-group-sm" role="group">
			<button type="button" class="btn btn-secondary calc-mplus">M+</button>
			<button type="button" class="btn btn-secondary calc-mminus">M-</button>
			<button type="button" class="btn btn-secondary calc-mrecall">MR</button>
		</div>
	</div>
	<div class="mt-1 mb-1 calc-memory">
		<span>M: </span>
		<span class="calc-mcontent"></span>
	</div>
	</div>`);
	const $input = $('<input class="form-control calc-input" type="text" />');
	$input.on('change',()=>{ doCalc($c) });
	$input.bind("keydown",(e) => {
		switch ( e.originalEvent.key ) {
			case "=" : e.preventDefault(); doCalc($c); return;
			case "Clear" : e.preventDefault(); clearCalc($c); return;
			case "F13" :  e.preventDefault(); mPlus($c); return;
			case "F16" :  e.preventDefault(); mPlus($c); return;
			case "F14" :  e.preventDefault(); mMinus($c); return;
			case "F17" :  e.preventDefault(); mMinus($c); return;
			case "F15" :  e.preventDefault(); mRecall($c); return;
			case "F18" :  e.preventDefault(); mRecall($c); return;
		}
	});
	$('.calc-clear',$out).on('click',()=>{ clearCalc($c); });
	$('.calc-mclear',$out).on('click',()=>{ $('.calc-mcontent',$out).html(''); $input.focus(); });
	$('.calc-allclear',$out).on('click',()=>{ $('.calc-mcontent',$out).html(''); clearCalc($c) });
	$('.calc-mplus',$out).on('click',()=>{ mPlus($c) });
	$('.calc-mminus',$out).on('click',()=>{ mMinus($c) });
	$('.calc-mrecall',$out).on('click',()=>{ mRecall($c) });
	$out.append($input);
	$out.append('<div class="calc-error"></div>');
	$c.append($out);
	setTimeout( ()=>{ $input.focus() }, 100);
};

const mPlus = ($c) => {
	let v = doCalc($c);
	if ( typeof v === 'string' ) v = parseFloat(v);
	if ( typeof v === 'number' ) {
		const $m = $('.calc-mcontent',$c);
		let m = parseFloat($m.html()||'0');
		if ( isNaN(m) ) m = 0;
		$m.html( String( m + v ));
		$('input.calc-input',$c).select();
	}
};

const mMinus = ($c) => {
	let v = doCalc($c);
	if ( typeof v === 'string' ) v = parseFloat(v);
	if ( typeof v === 'number' ) {
		const $m = $('.calc-mcontent',$c);
		let m = parseFloat($m.html()||'0');
		if ( isNaN(m) ) m = 0;
		$m.html( String( m - v ));
		$('input.calc-input',$c).select();
	}
};

const mRecall = ($c) => {
	const $m = $('.calc-mcontent',$c);
	let v = $m.html();
	const $input = $('input.calc-input',$c);
	if ( v.length ) {
		$input.val( $input.val() + v );
	}
	$input.focus();
};

const doCalc = ($c) => {
	const $input = $('input.calc-input',$c);
	if ( $input.val() === '' ) return clearCalc($c);
	const $err = $('div.calc-error',$c);
	try {
		$input.val( eval( $input.val() ) );
		$err.html('');
	} catch(e) {
		$err.html( e.message );
		$input.focus();
		return undefined;
	}
	$input.focus();
	return $input.val();
};

const clearCalc = ($c) => {
	$('div.calc-error',$c).html('');
	$('input.calc-input',$c).val('').focus();
	return undefined;
};

const getClass = async (mb) => {
	const C = class {
		#prop; #api;
		constructor(api,options) {
			this.#prop = { options: options||{} };
			this.#api = api;
		};
		init() {
			this.#api.menubar([{ label: "File", items: [{label:'New',action: ()=>{ this.newCalc() } }] }]);
			this.newCalc();
		};
		newCalc() {
			const w = this.#api.newWindow(newCalcOptions);
			makeCalc(this, w.window());
			w.show();
		};
	}
	return C;
};

export default getClass;
