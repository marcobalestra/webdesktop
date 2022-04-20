/*
	The Calculator is an app designed to be an example.

	The files of this app (all in the same folder) are:
	- this file, calc.mjs (and its minified version .min.mjs, for production environment)
	- manifest.json
	- calc.css (and its .scss)

	At the very end of the module we have the "default" export declaration.

	Please note:
		1) Every app module must export only one default function
		2) The default function returns the CLASS of the app.
		3) The app itself is an instance of the class (an object).
		4) jQuery and Bootstrap are available yet.

	Here starts the code of the app itself.
	First of all we declare a function the will be the default export.
	This function returns a class, and is expected to be async.

	The default export function receives as input parameter the manifest object,
	enriched with the "base_uri" element.
*/

const getClass = async ( manifest ) => {
	const C = class {
		/*
			The constructor of the app object.
			When the app is launched an instance of the object is created.
			The creator receives a reference to its own API with Mabro.app,
			and optionally a launch argument (object).

			The API is the only channel the app can use to communicate with MaBro.app
		*/
		#prop; #api;
		constructor(api,options) {
			this.#prop = { options: options||{}, manifest: manifest };
			this.#api = api;
		};
		/*
			Once the object has been created, the app is launched.
			Then a "init" handler of the object (if any) is invoked.

			In this case we use the API to register a menubar, then trigger a local method.
		*/
		init() {
			this.#api.menubar([{ label: this.#prop.manifest.app_name, items: [{label:'New',action: ()=>{ this.newCalc() } }] }]);
			this.newCalc();
		};
		/*
			If the app provides an "event" interface function it can receive events,
			e.g.:
			- "changedWindow" event when a window changes (changed focus, size or position), the window is the argument.
			- "run" when the app becomes the frontmost app (no argument)
		*/
		event( eventName, eventData ) {
			if ( eventName === 'changedWindow' ) {
				if ( eventData ) $('input.calc-input',eventData.window()).focus();
			}
		};
		/*
			Our local object method to build a new Calculator.
			This method uses the API to request a new window,
			then passes its area to a local utility to manage it.
		*/
		newCalc() {
			/* see below for newCalcOptions local object and makeCalc local function */
			const w = this.#api.newWindow(newCalcOptions);
			makeCalc(this, w.window());
			w.show();
		};
	}
	return C;
};

/*
	In this case we have some local constants (default value and functions).
	"Local" means that they "live" only in this module, don't overwrite other code
	and aren't available outside this module.

	The MJS (Javascript module) of the application can host a lot of "local" functions and variables.
	The only global objects in MaBro.app are:
	- "$" and "jQuery"
	- "glob" object with many helper functions, plus 3 aliases:
	- "_lang" variable sith the lowercase two-characters current language
	- "_l" function to localize labels
	- "_icon" function to localize in "icon" language.

	All the "local" functions and code the app uses:
*/

const newCalcOptions = {
	minWidth: '260px',
	minHeight: '180px',
	width: '320px',
	height : '220px',
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
	$('.calc-mclear',$out).on('click',()=>{ $('.calc-mcontent',$out).html(''); });
	$('.calc-allclear',$out).on('click',()=>{ $('.calc-mcontent',$out).html(''); clearCalc($c) });
	$('.calc-mplus',$out).on('click',()=>{ mPlus($c) });
	$('.calc-mminus',$out).on('click',()=>{ mMinus($c) });
	$('.calc-mrecall',$out).on('click',()=>{ mRecall($c) });
	$out.append($input);
	$out.append('<div class="calc-error"></div>');
	$c.append($out);
	$c.on('click',()=>{ $input.focus() });
	const $w = $c.closest('.mabro-window');
	const $t = $c.closest('.mabro-wrap');
	$c.on('mouseover',()=>{ if ( $t.hasClass('mabro-active') && $w.hasClass('mabro-active') ) $input.focus() });
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
};

const doCalc = ($c) => {
	const $input = $('input.calc-input',$c);
	if ( $input.val() === '' ) return clearCalc($c);
	const $err = $('div.calc-error',$c);
	let txt = $input.val();
	try {
		txt = txt
			.replace(/\^/g,'**')
			.replace(/(a?sin|a?cos|a?tan|abs|round)/g,"Math.$1")
			.replace(/(ln|log2)/,'Math.log2')
			.replace(/(LOG|log10)/,'Math.log10')
			.replace(/(pi?|Pi?|π|∏)/g,'Math.PI')
			.replace(/e/g,'Math.E');
		$input.val( eval( txt ) );
		$err.html('');
	} catch(e) {
		$err.html(`${e.message}<br />“${txt}”`);
		$input.focus();
		return undefined;
	}
	return $input.val();
};

const clearCalc = ($c) => {
	$('div.calc-error',$c).html('');
	$('input.calc-input',$c).val('');
	return undefined;
};

export default getClass;
