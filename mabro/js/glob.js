/*
	Exposes:
	glob object => all global methods and properties
	_l => localize function
	_lang => current user language
	_icon => localize in icon language
*/
if ( typeof glob !== 'object' ) window.glob = {};
if ( typeof glob.prop !== 'object' ) glob.prop = {};
glob.prop.select2_dopDownPosition = 'auto'; // auto, below, above

$(document).on('click','button *:not([onclick])',(ev) => {
	ev.preventDefault();
	ev.stopPropagation();	
	$(ev.target).closest('button').trigger('click');
});

/*** Additional prototype methods **/

if (!String.prototype.escape) {
	glob.prop.cleanerdiv = $(document.createElement("div"));
	String.prototype.escape = function() {
		glob.prop.cleanerdiv.text(this);
		return glob.prop.cleanerdiv.html().replace(/"/g,'&#34;').replace(/'/g,'&#39;');
	};
}

String.prototype.normalizespace = function() { return String(this).replace(/\s+/g,' ').trim(); };

Number.prototype.normalizespace = function() { return this.toString(); };

if ( ! Array.prototype.forEachAwait ) Array.prototype.forEachAwait = async function( asyncfunc ) {
	for ( let i = 0; i < this.length; i++ ) {
		await asyncfunc.call(window,this[i],i);
	}
	return this;
};

Array.prototype.cisort = function( name ) {
	if ( name ) return this.sort( (a,b)=>(a[name].toLowerCase() > b[name].toLowerCase() ? 1 : -1) );
	return this.sort( (a,b)=>(a.toLowerCase() > b.toLowerCase() ? 1 : -1) );
};

glob.clone = (so) => {
	if ( so ) {
		if ( Array.isArray(so) ) {
			let o = [];
			so.forEach( si => ( o.push(glob.clone(si)) ));
			return o;
		}
		if ( typeof so === 'object' ) {
			if ( typeof so.getTime === 'function' ) return so.getTime();
			let o = {};
			Object.keys(so).forEach( k => ( o[k] = glob.clone(so[k]) ));
			return o;
		}
	}
	return so;
};

glob.getCookies = () => {
	let cobj = {};
	document.cookie.split(/\s*;\s*/).forEach( pair => {
		let kv = pair.split(/\s*=\s*/);
		let n = kv.shift();
		if ( typeof n !== 'string' ) return;
		if ( n === '' ) return;
		cobj[ n ] = window.decodeURIComponent( kv[0]||'' );;
	});
	return cobj;
};

glob.getCookie = cn => glob.getCookies()[cn];

glob.setCookie = (n,v,o) => {
	o = typeof o === 'object' ? o : {};
	let s = n+'='+ window.encodeURIComponent(v||'');
	if ( o.path ) s+= ';path='+o.path;
	if ( o.domain === true ) o.domain = window.location.hostname;
	if ( o.firstLevel ) {
		let d = o.domain ? o.domain : window.location.hostname;
		d = d.replace(/^.*\.([^.]+)\.([^.]+)$/,"$1.$2");
		if ( o.domain || ( d !== location.hostname ) ) o.domain = d;
	}
	if ( typeof o.sameSite !== 'undefined' ) {
		if ( o.sameSite ) {
			s += ';SameSite=Strict';
		} else {
			s += ';SameSite=None';
			o.secure=true;
		}
	}
	if ( o.secure ) s += ';Secure';
	if ( (typeof o.domain === 'string') && (o.domain !== '') ) s += ';domain='+o.domain;
	if ( o.maxAge ) s+= ';max-age='+o.maxAge;
	if ( o.expires ) {
		if ( o.expires instanceof Date ) o.expires = o.expires.toUTCString();
		s += ';expires=' + o.expires;
	}
	document.cookie = s;
	return s;
};

glob.rmCookie = (n,o) => {
	let c = glob.getCookie(n);
	if ( typeof c === 'undefined' ) return false;
	o = typeof o === 'object' ? o : {};
	o.expires = 'Thu, 01 Jan 1970 00:00:01 GMT';
	o.sameSite = true;
	if ( o.domain === true ) o.domain = window.location.hostname;
	if ( typeof o.domain === 'string' && o.domain !== '' ) o.domain = o.domain.replace(/^\./,'');
	let out = glob.setCookie( n, '', o );
	if ( ! o.domain ) o.domain = window.location.hostname;
	o.domain = '.' + o.domain;
	glob.setCookie( n, '', o );
	return out;
};

glob.uid = (base) => ((base||'')+(([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c => (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16))));

glob.localize = {
	def : 'en',
	init : ( lang ) => {
		if ( (! document) || (! document.documentElement) ) return setTimeout( ()=>{ glob.localize.init(lang); }, 10 );
		if ( lang && (typeof lang === 'string') && ( lang.length >= 2 ) ) {
			glob.localize.setLanguage( lang.replace(/^(..).*$/,"$1").toLowerCase() );
		} else if ( (glob.getCookie('forcelang')||'').match(/^[a-z]{2}/i) ) {
			glob.localize.setLanguage( glob.getCookie('forcelang').replace(/^([a-z]{2}).*$/i,"$1").toLowerCase() );
		} else if ( document.documentElement.getAttribute('lang') ) {
			glob.localize.setLanguage( document.documentElement.getAttribute('lang').replace(/^(..).*$/,"$1").toLowerCase() );
		} else if ( document.documentElement.getAttribute('xml:lang') ) {
			glob.localize.setLanguage( document.documentElement.getAttribute('xml:lang').replace(/^(..).*$/,"$1").toLowerCase() );
		} else if ( (glob.getCookie('language')||'').match(/^[a-z]{2}/i ) ) {
			glob.localize.setLanguage( glob.getCookie('language').replace(/^([a-z]{2}).*$/i,"$1").toLowerCase() );
		} else if ( (glob.getCookie('lang')||'').match(/^[a-z]{2}/i ) ) {
			glob.localize.setLanguage( glob.getCookie('lang').replace(/^([a-z]{2}).*$/i,"$1").toLowerCase() );
		} else if ( window.navigator.userLanguage || window.navigator.language ) {
			glob.localize.setLanguage( (window.navigator.userLanguage || window.navigator.language).replace(/^(..).*$/,"$1").toLowerCase() );
		} else if ( Array.isArray(window.navigator.languages) && window.navigator.languages.length ) {
			glob.localize.setLanguage( (window.navigator.languages[0]).replace(/^(..).*$/,"$1").toLowerCase() );
		} else {
			glob.localize.setLanguage();
		}
		setTimeout( glob.localize.page, 1 );
	},
	forceLang: (l) => { glob.setCookie('forcelang',l,{path:'/', domain: true, firstLevel: true, sameSite: true }); },
	labelize : ( txt ) => {
		while ( txt.match(/\{\{label:[^}]+\}(\{[^:]+:[^}]+\})*\}/) ) {
			txt = txt.replace(/\{\{label:([^}]+)\}((\{[^:]+:[^}]*\})*)\}/g,(x,y,z) => {
				let v = false;
				if ( z && (z.length > 0) ) {
					v = {};
					z = z.replace(/\{([^:]+):([^}]*)\}/g,(a,b,c) => {
						c = c.replace(/^label:(.+)/g,(m,n) => { return glob.localize.label(n) });
						v[b] = c;
						return '';
					});
				}
				return glob.localize.label(y,v);
			});
		}
		while ( txt.match(/\{\{icon:[^}]+\}\}/) ) {
			txt = txt.replace(/\{\{icon:([^}]+)\}\}/g,function(x,y){ return glob.localize.label(y,undefined,'icon') });
		}
		return txt;
	},
	labelizeAll : ( iterations ) => {
		if (document.documentElement.querySelector('head meta[name="glob.localize.dontLabelize"]')) {
			glob.localize.newloadstarted = false;
			glob.localize.loading = false;
			glob.localize.loaded = true;
			return true;
		}
		iterations = iterations || 0;
		if ( iterations > 30 ) {
			glob.localize.newloadstarted = false;
			glob.localize.loading = false;
			glob.localize.loaded = true;
			return void(0);
		}
		iterations++;
		if ( glob.localize.pending > 0 ) return setTimeout( ()=>{ glob.localize.labelizeAll( iterations ); }, 100);
		if ( typeof glob.localize.main !== 'object' ) return setTimeout( ()=>{ glob.localize.labelizeAll( iterations ); }, 100);
		try {
			let body = document.getElementsByTagName('body')[0];
			if ( typeof body === 'undefined' ) return  setTimeout( glob.localize.labelizeAll, 10)
			glob.localize.loading = true;
			body.innerHTML = glob.localize.labelize( body.innerHTML );
			let h = document.documentElement.querySelector('head');
			let wt = h.querySelector('title');
			if ( wt ) {
				try {
					let ot = wt.innerHTML;
					let nt = glob.localize.labelize( ot );
					if ( ot !== nt ) {
						wt.innerHTML  = nt;
						document.title = nt;
					}
				} catch(e) {
					console.debug(e);
				}
			}
			let cs = h.querySelectorAll('style.ASloadingLanguages');
			if ( cs.length > 0 ) cs.forEach( (c) => { h.removeChild(c) });
			glob.localize.newloadstarted = false;
			glob.localize.loading = false;
			glob.localize.loaded = true;
		} catch(e) {
			return setTimeout( ()=>{ glob.localize.labelizeAll( iterations ); }, 100);
		}
	},
	langloaded: false,
	loaded : false,
	loading : false,
	loadjs : ( uri, lang, skipNewLoad ) => {
		if (document.documentElement.querySelector('head meta[name="glob.localize.dontLoad"]')) return true;
		glob.localize.pending++;
		glob.localize.loaded = false;
		window.fetch(uri).then( (response)=>{
			return response.json();
		}).then( (data) => {
			if ( typeof glob.localize.main !== 'object') glob.localize.main = {};
			Object.entries(data).forEach( ([k,v]) => {
				if ( typeof glob.localize.main[k] !== 'object' ) glob.localize.main[k]={};
				if ( lang === 'multi' ) {
					if ( ! v ) return;
					if ( typeof v == "object" ) {
						Object.keys(v).forEach( kv => { glob.localize.main[k][kv] = v[kv] });
					} else if ( typeof v === "string" ) {
						if ( ! glob.localize.main[k][glob.localize.current] ) glob.localize.main[k][glob.localize.current] = v;
					}
				} else {
					glob.localize.main[k][lang] = v;
				}
			});
			glob.localize.pending--;
			if (glob.localize.pending === 0) glob.localize.loaded = true;
			glob.localize.langloaded = true;
		}).catch( (e) => {
			glob.localize.pending--;
			if (glob.localize.pending === 0) glob.localize.loaded = true;
			glob.localize.langloaded = true;
		})
		if ( skipNewLoad ) return true;
		glob.localize.newload();
	},
	main: false,
	newload : () => {
		if (document.documentElement.querySelector('head meta[name="glob.localize.dontLoad"]')) return void(0);
		if (document.documentElement.querySelector('head meta[name="glob.localize.dontLabelize"]')) return void(0);
		if ( glob.localize.newloadstarted ) return void(0);
		glob.localize.newloadstarted = true;
		let c = document.createElement('style');
		c.setAttribute('type','text/css');
		c.setAttribute('class','ASloadingLanguages');
		c.innerHTML = 'body { display: none !important; }';
		document.documentElement.querySelector('head').prepend(c);
		return setTimeout(glob.localize.labelizeAll,100);
	},
	newloadstarted : false,
	page : ( showAll ) => {
		let ns = document.querySelectorAll('body *[lang]');
		if ( ns.length < 1 ) return void(0);
		if ( showAll ) {
			ns.forEach( (n) => { n.style.display=''; } );
		} else {
			let re = new RegExp('^(..).*$');
			let ul = 'en';
			let allLangs = {};
			ns.forEach( (n)=> { allLangs[ n.getAttribute('lang').replace(re,"$1").toLowerCase() ] = true; } );
			if ( ! glob.getCookie('forcelang') ) {
				window.navigator.languages.forEach( (wl) => {
					let l = wl.replace(re,"$1").toLowerCase();
					if ( allLangs[l] ) {
						ul = String(l);
						return;
					}
				})
			}
			ns.forEach( (n) => {
				n.style.display = (( n.getAttribute('lang').replace(re,"$1").toLowerCase() === ul ) ? '' : 'none');
			});
		}
	},
	pending : 0,
	setLanguage : ( mainLang ) => {
		if ( typeof mainLang === 'string' ) window._lang = glob.localize.current = mainLang.toLowerCase();
		let d = new Date();
		d.setFullYear( d.getFullYear() + 1 );
		glob.setCookie('language',glob.localize.current,{expires:d,path:'/',sameSite:true});
		if ( document.documentElement.querySelector('head meta[name="glob.localize.dontLoadAuto"]')) return void(0);
	},
	ready : () => { return !! glob.localize.loaded; },
	label : ( key, values, lang ) => {
		if ( ! lang ) lang = glob.localize.current||'en';
		let txt = glob.localize.main[key] || undefined;
		if ( typeof txt === 'undefined' ) {
				txt = key;
		} else if ( typeof txt === 'object' ) {
			txt = txt[lang] || txt.en || key;
		}
		//txt = glob.localize.labelize( txt );
		if ( typeof values === 'object' ) {
			for (const [i, vi] of Object.entries(values)) {
				let re;
				if ( (vi === '') || (typeof vi == 'undefined')) {
					re = new RegExp('\{\{'+i+'\}\}','g');
				} else {
					re = new RegExp('\{\{'+i+'(\\|[^}]*)?\}\}','g');
				}
				txt = txt.replace( re, String(vi) );
			}
		}
		txt = txt.replace(/\{\{[^|}]+\|([^}]*)\}\}/g,"$1");
		return txt;
	}
}

glob.blockUI = ( ...args ) => {
	let parent = document.body, progress, message, mode = true;
	args.forEach( a => {
		if ( typeof a == 'boolean' ) mode = a;
		else if ( a instanceof jQuery ) parent = a;
		else if ( a instanceof HTMLElement ) parent = a;
		else if ( typeof a === 'number' ) progress = a;
		else if ( typeof a === 'string' ) message = a;
	});
	mode = !! mode;
	const cur = !! $('.UiBlockerDiv',parent).length;
	if ( cur === mode ) return;
	if ( mode ) {
		const $block = $('<div class="UiBlockerDiv"></div>');
		$block.append($('<div class="spinner"></div>').append($(_l('iconPrefs'))));
		$(parent).append($block);
		if ( progress ) glob.blockUIAddProgress(progress);
		if ( message ) glob.blockUIMessage(message);
	} else {
		$('.UiBlockerDiv',parent).remove();
	}
};

glob.blockUIAddProgress = ( val, classname ) => {
	const $block = $('.UiBlockerDiv');
	if ( val && typeof val == 'number' && $block.length ) {
		if ( typeof classname === 'undefined' ) classname = 'success';
		if ($('.progress',$block).length) {
			$('.progress .progress-bar',$block).remove();
			$('.progress',$block).append($(`<div class="progress-bar bg-${classname}" role="progressbar" style="width:0%;" aria-valuenow="0" aria-valuemin="0" aria-valuemax="${val}"></div>`));
		} else {
			$block.append($(`<div class="progress"><div class="progress-bar bg-${classname}" role="progressbar" style="width:0%;" aria-valuenow="0" aria-valuemin="0" aria-valuemax="${val}"></div></div>`));
		}
	}
};

glob.blockUIProgress = ( val ) => {
	const $pb = $('.UiBlockerDiv .progress .progress-bar');
	if ( ! $pb.length ) return;
	if ( typeof val !== 'number' ) val = parseInt($pb.attr('aria-valuenow')) +1;
	const max = parseInt($pb.attr('aria-valuemax'));
	$pb.attr('aria-valuenow',val).css('width',(100 * val / max).toFixed(2)+'%');
};

glob.blockUIMessage = ( m ) => {
	const $block = $('.UiBlockerDiv');
	if ( ! $block.length ) return;
	if ( $('.message',$block).length ) $('.message',$block).html(m);
	else $block.append($('<div class="message"></div>').html(m) );
};

glob.unblockUI = ( parent ) => { glob.blockUI(false,parent) };

glob.get = async ( url = '') => {
	const response = await fetch(url,{
		method: 'GET',
		cache: 'reload', // *default, no-cache, reload, force-cache, only-if-cached
		redirect: 'follow', // manual, *follow, error
		// referrerPolicy: 'no-referrer',
		// headers : {
		// 	'pragma': 'no-cache',
		// 	'cache-control': 'no-cache'
		// }
	});
	switch ( response.status ) {
		case 200 : return response.json();
		case 204 : return undefined;
		case 401 : window.location.href = '/'; return undefined;
		default : console.log(`Error fetching from "${url}"`,response);
	}
	return undefined;
};

glob.smartSize = ( size ) => {
	const i = Math.floor(Math.log(size) / Math.log(1024));
	return (size / Math.pow(1024, i)).toFixed(2) * 1 + ' ' + ['B', 'KB', 'MB', 'GB', 'TB'][i];					
};

glob.select2 = {
	withkeys : (c,v) => `${c}: ${v}`,
	addKeys : ( data, withEmpty ) => {
		if ( Array.isArray(data.results) ) {
			data.results.forEach( i => { i.text = glob.select2.withkeys( i.id, i.text );} );
			if ( withEmpty ) data.results.unshift({id:'',text:''});
		}
		return data;
	},
	selEvents : ( $sel, opts ) => {
		if ( $sel.hasClass('glob-select2-events') ) return;
		if ( opts.allowClear ) $sel.on('select2:clearing', (e)=>{
			e.preventDefault();
			if ( opts.selectType === 'search') $sel.html('');
			setTimeout( ()=>{ $sel.select2('close').val('').trigger('change'); },10);
		});
		if ( opts.multiple ) $sel.on('select2:unselecting', (e)=>{
			const v = $sel.val();
			if ( v && v.length > 1 ) {
				setTimeout( ()=>{ $sel.select2('close'); },10);
			} else {
				e.preventDefault();
				if ( opts.selectType === 'search') $sel.html('');
				setTimeout( ()=>{ $sel.select2('close').val('').trigger('change'); },10);
			}
		});
		$sel.addClass('glob-select2-events');
	},
	ls : (opts,node) => {
		const so = { dropdownPosition : glob.prop.select2_dopDownPosition, minimumResultsForSearch: -1 };
		const $sel = $(node);
		if ( typeof opts === 'string' ) opts = { uri: opts };
		if ( opts && typeof opts === 'object' ) {
			if ( opts.placeholder ) so.placeholder = opts.placeholder;
			if ( opts.allowClear ) so.allowClear = opts.allowClear;
			if ( opts.multiple ) so.multiple = true;
			if ( opts.dropdownParent ) so.dropdownParent = opts.dropdownParent;
			if ( typeof opts.uri == 'string' && opts.uri.length > 0 ) {
				if ( opts.uri.indexOf('/') !== 0 ) opts.uri = '/cl/' + opts.uri;
				if ( ! opts.uri.match(/\/list\/?$/) ) opts.uri += '/list';
				so.ajax = { url: opts.uri, dataType: 'json', delay: 250 };
				if ( opts.keys ) so.ajax.processResults = glob.select2.addKeys;
				else if ( opts.processResults ) so.ajax.processResults = opts.processResults;
			}
		}
		opts.selectType = 'ls';
		$sel.select2(so).addClass(`glob-select2 glob-select2-${opts.selectType}`);
		glob.select2.selEvents($sel,opts);
		return true;
	},
	search : (opts,node) => {
		const so = { dropdownPosition : glob.prop.select2_dopDownPosition };
		const $sel = $(node);
		if ( typeof opts === 'string' ) opts = { uri: opts };
		if ( opts && typeof opts === 'object' ) {
			if ( opts.placeholder ) so.placeholder = opts.placeholder;
			if ( opts.allowClear ) so.allowClear = opts.allowClear;
			if ( opts.multiple ) so.multiple = true;
			if ( opts.dropdownParent ) so.dropdownParent = opts.dropdownParent;
			if ( typeof opts.min === 'number' ) so.minimumInputLength = opts.min;
			if ( typeof opts.uri == 'string' && opts.uri.length > 0 ) {
				if ( opts.uri.indexOf('/') !== 0 ) opts.uri = '/cl/' + opts.uri;
				if ( ! opts.uri.match(/\/search\/?$/) ) opts.uri += '/search';
				so.ajax = { url: opts.uri, dataType: 'json', delay: 250 };
				if ( typeof opts.data === 'function' ) so.ajax.data = opts.data;
				if ( opts.keys ) so.ajax.processResults = glob.select2.addKeys;
				else if ( opts.processResults ) so.ajax.processResults = opts.processResults;
			}
		}
		opts.selectType = 'search';
		$sel.select2(so).addClass(`glob-select2 glob-select2-${opts.selectType}`);
		glob.select2.selEvents($sel,opts);
		return true;
	},
	std : async (opts,node) => {
		const so = { dropdownPosition : glob.prop.select2_dopDownPosition };
		const $sel = $(node);
		const $selnode = $('option[selected]',$sel);
		const selected = $selnode.length ? ($selnode.attr('value')||$selnode.html()||false) : false;
		if ( typeof opts === 'string' ) opts = { uri: opts };
		if ( opts && typeof opts === 'object' ) {
			so.placeholder = opts.placeholder||_l('Choose');
			if ( opts.allowClear ) so.allowClear = opts.allowClear;
			if ( opts.multiple ) so.multiple = true;
			if ( opts.dropdownParent ) so.dropdownParent = opts.dropdownParent;
		}
		if ( typeof opts.uri === 'string' && opts.uri.length > 0 ) {
			if ( opts.uri.indexOf('/') !== 0 ) opts.uri = '/cl/' + opts.uri;
			if ( ! opts.uri.match(/\/list\/?$/) ) opts.uri += '/list';
			let data = await glob.get(opts.uri);
			if ( data && data.results && Array.isArray(data.results) ) {
				if ( typeof opts.processResults === 'function' ) data = opts.processResults(data);
				else if ( opts.keys ) data = glob.select2.addKeys(data,opts.allowClear);
				$sel.html('');
				data.results.forEach( o => { $sel.append( new Option(o.text,o.id) ); });
			}
		}
		opts.selectType = 'std';
		$sel.select2(so).addClass(`glob-select2 glob-select2-${opts.selectType}`);
		glob.select2.selEvents($sel,opts);
		return true;
	}
};

glob.menu = (ev,menu)=>{
	ev.preventDefault();
	ev.stopPropagation();
	const zapMenus = () => {
		document.querySelectorAll('.mabro-menu-wrap').forEach( el=>{ $(el).fadeOut(10,()=>{ $(el).remove();} ); } );
		$('.mabro-menu-highlight-element').removeClass('mabro-menu-highlight-element');
		$('.mabro-menu-highlight-tent').remove();
		$('.mabro-menu-active').removeClass('mabro-menu-active');
		$(document.body).off('click contextmenu', zapMenus );
	};
	zapMenus();
	const testNode = n=>(typeof n == 'string' || typeof n == 'html' || n instanceof Node || n instanceof NodeList || n instanceof jQuery);
	if ( Array.isArray(menu) || testNode(menu) ) menu = { content : menu };
	if ( typeof menu != 'object' ) return undefined;
	if ( ! menu.type ) menu.type = 'context';
	const $cm = $('<div class="dropdown clearfix mabro-menu-wrap"></div>');
	$cm.appendTo(document.body);
	if ( testNode( menu.content ) ) {
		$cm.append( menu.content );
	} else if ( Array.isArray(menu.content) ) {
		const $ul = $(`<ul class="dropdown-menu mabro-menu-content" role="menu" aria-labelledby="dropdownMenu" style="max-width:${$(window).width()}px;"></ul>`);
		const parseli = v => {
			const $li = $('<li></li>');
			if ( typeof v == 'string' ) {
				if ( v === '-') {
					$li.html('<hr />');
				} else {
					$li.addClass('title').html( v );
				}
			} else if ( typeof v == 'object') {
				let lab = '';
				const ricon = v.ricon || '';
				// if ( (typeof v.ricon == 'undefined') && (typeof v.action == 'string') ) {
				// 	ricon = (v.download && 'icon-download4')||( v.target && 'icon-square-up-right')||'icon-arrow-right16';
				// 	riconKey = (v.download && 'download')||( v.target && 'newwin')||'arrow-right';
				// }
				if ( ricon ) lab += `<i class="rIcon">${_l(ricon)}</i>`;
				if ( v.icon ) lab += `<i class="${ v.iconClass ? v.iconClass : 'icon'}">${_l(v.icon)}</i>`;
				if ( v.label ) lab += v.label;
				if ( typeof v.title == 'string' ) $li.attr('title',v.title);
				try {
					let eva = eval(v.action);
					if ( typeof eva == 'function' ) v.action = eva;
				} catch(e) {}
				if ( typeof v.action == 'function' ) {
					let $a = $(`<a>${lab}</a>`);
					$a.on('contextmenu click',lev=>{
						lev.preventDefault();
						lev.stopPropagation();
						v.action.call(window,ev,lev);
						zapMenus();
					});
					$a.addClass('clickable');
					$li.append($a);
				} else if ( typeof v.action == 'string' ) {
					let $a = $(`<a href="${v.action}">${lab}</a>`);
					if ( v.download ) $a.attr('download',v.download);
					if ( v.target ) $a.attr('target',v.target);
					$a.addClass('clickable');
					$li.append($a);
				} else {
					$li.addClass('disabled').append(`<a>${lab}</a>`);
				}
			} else {
				return '';
			}
			if ( Array.isArray( v.content ) && v.content.length ) {
				const $sul = $('<ul></ul>');
				v.content.forEach( c=>{ $sul.append( parseli(c) ) } );
				$li.addClass('subMenu')
				$li.append($sul);
			}
			return $li;
		}
		menu.content.forEach( v=>{ $ul.append( parseli(v) ) } );
		$cm.append($ul);
	} else {
		$cm.remove();
		console.log('glob.menu error',e,menu);
		return undefined;
	}
	let left, top;
	const cmw = $cm.width();
	const cmh = $cm.height();
	if ( menu.type === 'button' ) {
		if ( ! menu.parent ) menu.parent = menu.highlight||'button';
		const $parent = $(ev.target).closest(menu.parent);
		const pos = $parent.offset();
		left = menu.x || Math.floor( pos.left - 2 );
		top = menu.y || Math.floor( pos.top - 2 );
		if ( (top - $(window).scrollTop() + cmh) >= $(window).height() ) {
			top = Math.ceil( pos.top + $parent.outerHeight() - cmh );
			$('ul.mabro-menu-content',$cm).append( Array.from($('ul.mabro-menu-content>li',$cm)).reverse() );
		}
		if ( (left - $(window).scrollLeft() + cmw) >= $(window).width() ) {
			left = Math.ceil( pos.left + $parent.outerWidth() - $cm.width() +1);
		}
	} else if ( menu.type === 'menu' ) {
		if ( typeof menu.sticky === 'undefined' ) menu.sticky = true;
		if ( ! menu.parent ) menu.parent = menu.highlight||'a';
		const $parent = $(ev.target).closest(menu.parent);
		$parent.addClass('mabro-menu-highlight-element')
		const pos = $parent.offset();
		left = menu.x || Math.floor( pos.left );
		top = menu.y || Math.floor( pos.top + $parent.outerHeight() - 2 );
		$cm.addClass('mabro-menu-menu');
		if ( (top - $(window).scrollTop() + cmh) >= $(window).height() ) {
			top = Math.ceil( pos.top - cmh +2 );
			$('ul.mabro-menu-content',$cm).append( Array.from($('ul.mabro-menu-content>li',$cm)).reverse() );
		}
		if ( (left - $(window).scrollLeft() + cmw) >= $(window).width() ) {
			left = Math.ceil( pos.left + $parent.outerWidth() - cmw +1);
		}
		$parent.addClass('mabro-menu-active');
	} else {  /* menu.type == 'context' */
		left = menu.x || (ev.pageX -20);
		top = menu.y || (ev.pageY -20);
		if ( (top - $(window).scrollTop() + cmh) >= $(window).height() ) {
			top -= (cmh -40);
			$('ul.mabro-menu-content',$cm).append( Array.from($('ul.mabro-menu-content>li',$cm)).reverse() );
		}
		if ( (left - $(window).scrollLeft() + cmw) >= $(window).width() ) {
			left -= (cmw -40);
		}
	}
	if ( left < 0 ) left = 0;
	if ( top < 0 ) top = 0;
	if ( ! menu.parent ) {
		let hl = false;
		if ( menu.highlight ) {
			hl = $(ev.target).closest(menu.highlight);
		} else if ( typeof menu.highlight == 'undefined' ) {
			hl = $(ev.target);
		}
		if ( hl ) {
			const os = hl.offset();
			$(`<div class="mabro-menu-highlight-tent" style="top:${os.top}px;left:${os.left}px;width:${hl.width()}px;height:${hl.height()}px;"> </div>`).appendTo(document.body);
			//$cm.prepend($(`<div class="mabro-menu-highlight-tent" style="top:${os.top}px;left:${os.left}px;width:${hl.width()}px;height:${hl.height()}px;"> </div>`));
			hl.addClass('mabro-menu-highlight-element');
		}
	}
	$(document.body).on('click contextmenu', zapMenus );
	$cm.css({
		transition: `all ${ menu.duration||100 }ms`,
		transform: `translateY(${parseInt( ev.pageY - top - (cmh/2) )}px) scaleY(0)`,
		left: `${left}px`,
		top: `${top}px`,
		display: 'block'
	});
	const rmtrans = e=>{
		if ( ! menu.sticky ) $cm.on('mouseleave', zapMenus );
		$(e.target).off('transitionend',rmtrans).css({ transition: 'unset', transform: 'unset' });
	};
	$cm.on('transitionend',rmtrans);
	window.setTimeout( ()=>{ $cm.css({ transform: 'translateY(0) scaleY(1)' }); }, 0);
};

/* ***************** Drag&Drop *********************** */

glob.dd = {
	axles: {},
	get : (axle) => { return axle ? glob.dd.axles[axle] : undefined },
	set : (axle,options) => {
		if ( ! axle || typeof  axle !== 'string' ) return;
		return glob.dd.axles[axle] = new glob.dd.ddobj( axle, options );
	},
	ddobj : class {
		#axle;#dd;#prop;#func;
		constructor( axle, options ) {
			this.#axle = axle;
			this.#prop = {};
			this.#func = {};
			this.#dd = {};
			if ( typeof options !== 'object' ) options = {};
			Object.keys( options ).forEach( k => {
				if ( typeof options[k] === 'function') {
					this.#func[k] = options[k];
				} else {
					this.#prop[k] = options[k];
				}
			})
		};
		draggable( el, data ) {
			if ( el instanceof $ ) el = el.get(0);
			const $el = $(el);
			const dd = $el.data('glob-dd')||{};
			const axles = dd.draggable||{};
			if ( axles[this.#axle] ) return undefined;
			$el.attr('draggable',true);
			axles[this.#axle] = true;
			dd.draggable = axles;
			$el.data('glob-dd',dd);
			el.addEventListener('dragstart',(e)=>{ this.dragstart(e,$el,data) },false);
			el.addEventListener('dragend', (e)=>{ this.dragend(e,$el,data) },false);
			if ( this.#func.draggable ) this.#func.draggable({ event: e, element: $el });
		};
		droppable( el ) {
			if ( el instanceof $ ) el = el.get(0);
			const $el = $(el);
			const dd = $el.data('glob-dd')||{};
			const axles = dd.droppable||{};
			if ( axles[this.#axle] ) return undefined;
			axles[this.#axle] = true;
			dd.droppable = axles;
			const inited = dd.droppableInited||{};
			if ( ! inited[this.#axle] ) {
				el.addEventListener('dragover',(e)=>{ this.dragover(e) },false);
				el.addEventListener('dragleave', (e)=>{ this.dragleave(e) },false);
				el.addEventListener('drop', (e)=>{ this.drop(e) },false);
				inited[this.#axle] = true;
				dd.droppableInited = inited;
			}
			$el.data('glob-dd',dd);
			$el.addClass('glob-dd-accept');
			if ( this.#func.droppable ) this.#func.droppable($el);
		};
		undroppable( el ) {
			if ( el instanceof $ ) el = el.get(0);
			const $el = $(el);
			const dd = $el.data('glob-dd')||{};
			const axles = dd.droppable||{};
			delete axles[this.#axle];
			if ( ! Object.keys(axles).length ) $el.removeClass('glob-dd-accept');
			dd.droppable = axles;
			$el.data('glob-dd',dd);
		};
		canaccept(e) {
			if ( ! this.#dd.element ) return undefined;
			const $tgt = $(e.target).closest('.glob-dd-accept');
			if ( ! $tgt.length ) return false;
			const axles = ($tgt.data('glob-dd')||{}).droppable||{};
			if ( ! axles[this.#axle] ) return undefined;
			if ( this.#func.canaccept && ! this.#func.canaccept({ event: e, element: this.#dd.element, data: this.#dd.data, target: $tgt }) ) return false;
			if (e.preventDefault) e.preventDefault();
			return $tgt;
		};
		cleardrag( timedout ) {
			if ( ! timedout ) {
				setTimeout( ()=>{ this.cleardrag(true) }, 100);
				return;
			}
			if ( this.#dd.dropped ) this.#dd.dropped.removeClass('dd-dragover');
			if ( this.#func.clear ) this.#func.clear({ event: e, element: this.#dd.element, data: this.#dd.data });
			this.#dd = {};
		};
		dragstart(e,$el,data) {
			this.#dd.element = $el;
			this.#dd.data = this.#func.data ? this.#func.data({ event: e, element: $el, data: data }) : data;
			e.dataTransfer.effectAllowed = this.#prop.effectAllowed||'move';
			let tdata;
			if ( this.#func.transferData ) tdata = this.#func.transferData({ event: e, element: $el, data: this.#dd.data });
			if ( Array.isArray(tdata) && tdata.length === 2 ) {
				e.dataTransfer.setData(tdata[0], tdata[1] );
			} else if ( tdata !== false ) {
				e.dataTransfer.setData('text/html', $el.html() );
			}
			if ( this.#func.dragstart ) this.#func.dragstart({ event: e, element: $el, data: this.#dd.data });
		};
		dragend(e) {
			if ( this.#func.dragend ) this.#func.dragend({ event: e, element: this.#dd.element, data: this.#dd.data });
			this.cleardrag();
		};
		dragover(e) {
			const $tgt = this.canaccept(e);
			if ( ! $tgt ) return false;
			$tgt.addClass('dd-dragover');
			if ( this.#func.dragover ) this.#func.dragover({ event: e, element: this.#dd.element, data: this.#dd.data, target: $tgt });
		};
		dragleave(e) {
			const $tgt = this.canaccept(e);
			if (!$tgt) return false;
			$tgt.removeClass('dd-dragover');
			if ( this.#func.dragleave ) this.#func.dragleave({ event: e, element: this.#dd.element, data: this.#dd.data, target: $tgt });
		};
		drop(e) {
			const $tgt = this.canaccept(e);
			if ( ! $tgt ) return false;
			if ( e.stopPropagation ) e.stopPropagation();
			if ( this.#dd.dropped ) return;
			e.dataTransfer.dropEffect = this.#prop.dropEffect ||'move';
			this.#dd.dropped = $tgt;
			if ( this.#func.drop ) this.#func.drop({ event: e, element: this.#dd.element, data: this.#dd.data, target: $tgt });
			this.cleardrag();
			return true;
		};
	}
};

/* ***************** Startup operation *********************** */

/* Immediate */

(() => {
	glob.localize.init();
	window._l = glob.label = glob.localize.label;
	window._icon = (x)=>(glob.localize.label(x,undefined,'icon'));
})();

/* When document is loaded */

$( ()=> {
	if ( glob.prop.MBobjStarted ) return;
	const s = document.documentElement.getElementsByTagName('head')[0].querySelector('script[tag="mabro-starter"]');
	if ( ! s ) return;
	const src = s.getAttribute('src');
	const is_prod = !! src.includes('://');
	const opts = {
		mabro_base : src.replace(/js\/[^\/]+$/,''),
		mjs_suffix : is_prod ? "min.mjs" : "mjs",
		js_suffix : is_prod ? "min.js" : "js"
	};
	opts[is_prod?'is_prod':'is_dev'] = true;
	import(`${opts.mabro_base}js/mabro.${opts.mjs_suffix}`).then( mbmodule => {
		mbmodule.default(opts).then( mbclass => {
			glob.prop.MBobjStarted = true;
			(new mbclass(opts.mabro_base)).init();
		});
	});
});
