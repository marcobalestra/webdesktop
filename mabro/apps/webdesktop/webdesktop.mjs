const cache = {
	labels: {},
	icons: {},
	buttons: {},
	tb : {}
};

glob.dd.set('wd-icon',{
	effectAllowed : 'move',
	data : (d) => {
		const $i = d.element;
		let obj = (d.data && typeof d.data === 'object') ? d.data : undefined;
		if ( ! obj && $i.attr('fsid') && $i.attr('fstype')) {
			switch ( $i.attr('fstype') ) {
				case 'folder' : obj = cache.fs.getDir( $i.attr('fsid') ); break;
				case 'file' : obj = cache.fs.getFile( $i.attr('fsid') ); break;
			}
		}
		return obj;
	},
	dragstart : (d) =>{
		d.element.css({ opacity: '.5', 'background-color' : 'transparent'});
	},
	dragend : (d) => {
		d.element.css({ opacity: '', 'background-color' : ''});
	},
	canaccept : (d) => {
		const fsid = d.target.attr('fsid');
		if ( fsid === d.data.parent ) return false;
		const list = cache.fs.listAncestors( fsid, [fsid] );
		if ( list.includes(d.data.id) ) return false;
		return true;
	},
	drop : (d) => {
		const ele = d.data;
		const tgt = cache.fs.getDir( d.target.attr('fsid') );
		const parent = cache.fs.getDir( ele.parent );
		if ( tgt.role === 'trash' ) {
			cache.wd.trashItem( ele.id );
			return;
		}
		const type = ele.id.startsWith('dir-') ? 'folder' : 'file';
		delete ele.deleted;
		ele.parent = tgt.id;
		if ( type === 'file' ) {
			parent.files = parent.files.filter( x => (x !== ele.id));
			if ( ! Array.isArray( tgt.files )) tgt.files = [];
			tgt.files.push(ele.id);
			cache.fs.setFile(ele);
		} else {
			parent.dirs = parent.dirs.filter( x => (x !== ele.id));
			if ( ! Array.isArray( tgt.dirs )) tgt.dirs = [];
			tgt.dirs.push(ele.id);
			cache.fs.setDir(ele);
		}
		cache.fs.setDir(tgt);
		cache.fs.setDir(parent);
		cache.wd.refreshWindowByFsid( tgt.id );
		cache.wd.refreshWindowByFsid( parent.id );
	}
});

const getLabel = (l) => (cache.labels[l] || ( cache.labels[l] = _l(l) ));
const getIcon = (l) => (cache.icons[l] || ( cache.icons[l] = _icon(l) ));
const getButton = (l) => {
	if ( ! cache.buttons[l] ) {
		const $d =$('<div></div>');
		$d.append( $('<button type="button" class="btn"></button>').addClass(l).attr('title',getLabel(l)).append(getIcon(l)) );
		cache.buttons[l] = $d.html();
	}
	return cache.buttons[l];
};
const getFolderToolbar = (w,f) => {
	const $out = $('<div></div>');
	if ( ! cache.tb.folder ) {
		const $d=$('<div class="btn-toolbar" role="toolbar"></div>');
		const $g1 = $('<div class="btn-group" role="group">');
		$g1.append(getButton('wd-parent-folder'));
		$d.append($g1);
		const $g2 = $('<div class="btn-group" role="group">');
		$g2.append(getButton('wd-view-thumbnails'));
		$g2.append(getButton('wd-view-list'));
		$d.append($g2);
		cache.tb.folder = $d.prop('outerHTML');
	}
	$out.append(cache.tb.folder);
	const wdata = w.wrap().data('wd-nav')||{};
	const setView = (v) => { wdata.view=v; w.wrap().data('wd-nav',wdata); makeFolderWindow(w,f) };
	if ( f.parent ) {
		$('button.wd-parent-folder',$out).on('click', async ()=>{ await cache.wd.openFolder(f.parent); cache.wd.selectIconByFsId(f.id); });
	} else {
		$('button.wd-parent-folder',$out).parent().remove();
	}
	if ( wdata.view === 'list' ) {
		$('button.wd-view-list',$out).addClass('active');
		$('button.wd-view-thumbnails',$out).on('click',()=>{ setView('thumbnails') });
	} else {
		$('button.wd-view-thumbnails',$out).addClass('active');
		$('button.wd-view-list',$out).on('click',()=>{ setView('list') });
	}
	const svg = svgByFs(f);
	let ti;
	if ( svg.lock ) {
		$out.append( $('<div class="wd-view-folder-lock"></div>').append(svg.lock));
		ti = svg.lock
	} else if ( svg.icon ) {
		ti = svg.icon;
	}
	if ( ti ) {
		$('.mabro-window-titlebar .title svg',w.wrap()).remove();
		$('.mabro-window-titlebar .title',w.wrap()).prepend(ti);
	}
	return $out;
};

const makeFolderWindow = ( wobj,folder ) => {
	if ( wobj instanceof jQuery ) wobj = cache.wd.winById( wobj.closest('.mabro-window').attr('id') );
	const $w = wobj.wrap();
	if ( typeof folder === 'undefined' ) {
		folder = cache.fs.getDir( $w.attr('fsid') );
	} else if (! $w.attr('fsid') ) {
		$w.addClass('wd-folder-window').attr('fsid',folder.id).attr('fstype','folder');
	}
	const wdata = $w.data('wd-nav')||{};
	const $c = wobj.window();
	$c.empty();
	$c.append( $('<div class="wd-nav-bar"></div>').append( getFolderToolbar(wobj,folder) ) );
	const $list = $(`<div class="wd-content wd-content-${wdata.view||'thumbnails'}"></div>`);
	if ( Array.isArray(folder.dirs) ) folder.dirs.map( d => cache.fs.getDir(d) ).cisort('name').forEach( d => {
		if ( !d || (d.deleted && folder.role !== 'trash')  ) return;
		const i = new WDICON({
			node : d,
			type: 'folder',
			label: d.name,
			id: d.id
		});
		$list.append( i.get() );
	});
	if ( Array.isArray(folder.files) ) folder.files.map( f => cache.fs.getFile(f) ).cisort('name').forEach( f => {
		if ( f.deleted && folder.role !== 'trash'  ) return;
		const i = new WDICON({
			node : f,
			type: 'file',
			label: f.name,
			id: f.id
		});
		$list.append( i.get() );
	});
	$c.append($list);
	if ( folder.role === 'trash' ) $w.on('contextmenu',(e)=>{ trashCM(e) });
	else $w.on('contextmenu',(e)=>{ folderCM(e) });
	setTimeout( ()=>{ glob.dd.get('wd-icon').droppable($w) }, 1);
	return $w;
};

const svgByFs = ( o ) => {
	const out = {};
	if ( o.role ) {
		switch (o.role) {
			case 'trash' : out.lock = out.icon = getIcon('wd-trash'); return out;
			case 'root' : out.lock = out.icon = cache.wd.appIcon(); return out;
		}
	}
	if ( o.id.startsWith('dir-') ) {
		out.icon = getIcon('wd-folder');
	} else {
		out.icon = getIcon('wd-file');
	}
	return out;
};

const folderCM = (e) => {
	e.preventDefault();
	e.stopPropagation();
	const o = { content:[] };
	o.highlight = $(e.target);
	if (! o.highlight.is('.wd-icon,.wd-folder-window') ) o.highlight = o.highlight.closest('.wd-icon,.wd-folder-window');
	const isIcon = o.highlight.is('.wd-icon');
	let f = cache.fs.getDir( o.highlight.attr('fsid') );
	o.content.push( f.name.escape(), { label: getLabel('wd-open-info'), action: ()=>{ cache.wd.folderInfo( f.id ) }} );
	if ( ! f.deleted ) {
		if ( isIcon ) {
			o.content.push({ label: getLabel('wd-open-folder'), action: ()=>{ cache.wd.openFolder( f.id ) } },'-');
		} else {
			o.content.push({ icon: getIcon("wd-folder-plus"), label: getLabel('wd-folder-create'), action: ()=>{ cache.wd.createFolder( f.id ) } },'-');
			if ( f.parent ) o.content.push({ icon: getIcon("wd-parent-folder"), label: getLabel('wd-parent-folder'), action: ()=>{ cache.wd.openFolder( f.parent ) } },'-');
		}
	}
	if ( ! f.role ) {
		if ( f.deleted ) {
			o.content.push( { icon: getIcon("wd-folder"), label: getLabel('wd-trash-putback'), action: ()=>{ cache.wd.untrashItem( f ) } } );
		} else {
			o.content.push( { icon: getIcon("wd-trash"), label: getLabel('wd-move-to-trash'), action: ()=>{ cache.wd.trashItem( f ) } } );
		}
	}
	glob.menu(e.originalEvent||e,o);
};

const trashCM = (e) => {
	e.preventDefault();
	e.stopPropagation();
	const o = { content:[] };
	o.highlight = $(e.target);
	if (! o.highlight.is('.wd-icon,.wd-folder-window') ) o.highlight = o.highlight.closest('.wd-icon,.wd-folder-window');
	let f = cache.fs.getDir( o.highlight.attr('fsid') );
	const isIcon = o.highlight.is('.wd-icon');
	o.content.push( f.name.escape() );
	if ( isIcon ) o.content.push({ label: getLabel('wd-open-trash'), action: ()=>{ cache.wd.openFolder( f.id ) } },'-');
	o.content.push( { icon: getIcon("wd-trash"), label: getLabel('wd-empty-trash'), action: ()=>{ cache.wd.emptyTrash() } } );
	glob.menu(e.originalEvent||e,o);
};

const WDICON = class {
	#prop;
	constructor( options ) {
		this.#prop = { options: options };
		this.#prop.label = options.label||'No name';
		this.#prop.type = options.type;
		if ( ! this.#prop.type && options.node && options.node.id ) {
			if ( options.node.id.startsWith('dir-')) this.#prop.type = 'folder';
			else if ( options.node.id.startsWith('file-')) this.#prop.type = 'file';
		}
		if ( ! this.#prop.type ) this.#prop.type = 'file';
		const svg = options.node ? svgByFs(options.node) : {};
		this.#prop.svg = options.svg || svg.icon;
		this.#prop.subsvg = options.subsvg || svg.subicon;
	};
	get() {
		if ( ! this.#prop.render ) this.#prop.render = WDICON.render(this,this.#prop);
		return this.#prop.render;
	};
	click(e) {
		if ( e && typeof e === 'object' && e.target) {
			e.preventDefault();
			e.stopPropagation();
		}
		const $w = this.get();
		$(`.wd-icon:not([fsid="${$w.attr('fsid')}"])`,$w.closest('.mabro-wrap')).removeClass('wd-selected');
		$w.toggleClass('wd-selected');
		if ( this.#prop.options.onclick ) this.#prop.options.onclick(e);
	};
	contextmenu(e) {
		if ( e ) {
			e.preventDefault();
			e.stopPropagation();
		}
		cache.wd.selectIconByFsId();
		if ( this.#prop.options.oncontextmenu ) this.#prop.options.oncontextmenu(e);
		else if  ( this.#prop.type === 'folder' ) folderCM(e);
	};
	dblclick(e){
		if ( e ) {
			e.preventDefault();
			e.stopPropagation();
		};
		cache.wd.selectIconByFsId();
		if ( this.#prop.options.ondblclick ) this.#prop.options.ondblclick(e);
		else if ( this.#prop.type === 'folder' && this.#prop.options.node ) cache.wd.openFolder( this.#prop.options.node.id );
	};
	static render(obj,p) {
		const $d = $(`<div class="wd-icon"></div>`);
		const $svg = $('<div class="icon"></div>').append(p.svg);
		if ( p.subsvg ) $svg.append($('<div class="sub-icon"></div>').append(p.subsvg));
		$d.append( $svg );
		$d.append( $('<div class="label"></div>').append($('<label></label>').append( p.label.escape() )) );
		$d.attr('title',p.label);
		if ( p.options.node ) $d.attr('fsid',p.options.node.id );
		if ( p.type ) {
			$d.attr('fstype',p.type);
			if ( p.type === 'folder' ) setTimeout( ()=>{ glob.dd.get('wd-icon').droppable($d) }, 1);
		}
		if ( p.options.css ) $d.css(p.options.css);
		$d.on('click',(e)=>{ obj.click(e) });
		$d.on('contextmenu',(e)=>{ obj.contextmenu(e) });
		$d.on('dblclick',(e)=>{ obj.dblclick(e) });
		if ( ! p.options.nodrag && p.options.node ) setTimeout( ()=>{ glob.dd.get('wd-icon').draggable( $d, p.options.node ) }, 1 );
		return $d;
	};
};

const getClass = async (manifest) => {
	const WD = class {
		#prop; #api; #mb; #wrap;#fs; #sysapi;
		constructor(api,options) {
			if ( ! options.theme ) options.theme = 'default';
			this.#prop = { options: options, manifest: manifest };
			this.#api = api;
			this.#mb = options.system;
			this.#sysapi = options.sysapi;
			this.#wrap = options.wrap;
			this.#mb.loadCSS(`${this.#prop.manifest.base_uri}themes/${this.#prop.options.theme}/style.css`);
			this.#wrap.addClass('mabro-webdesktop mabro-active');
		};
		appIcon(){ return this.#prop.manifest.app_icon; };
		async init() {
			if ( ! glob.localize.loaded ) {
				setTimeout( ()=>{ this.init();}, 100 );
				return;
			}
			cache.wd = this;
			this.#fs = await this.#mb.getFs();
			cache.fs = this.#fs;
			const root = this.#fs.getRoot();
			this.#prop.mainicon = new WDICON({
				node : root,
				label:root.name,
				svg: this.#prop.manifest.app_icon,
				type: 'folder',
				id: root.id,
				css : { position: 'absolute', top: '40px', right: '40px' },
				nodrag: true
			});
			this.#wrap.append( this.#prop.mainicon.get() );
			const trash = this.#fs.getTrash();
			this.#prop.trashicon = new WDICON({
				node : trash,
				label:trash.name,
				svg: getIcon('wd-trash'),
				type: 'folder',
				id: trash.id,
				css : { position: 'absolute', bottom: '40px', right: '40px' },
				oncontextmenu : (e)=>{ trashCM(e) },
				nodrag: true
			});
			this.#wrap.append( this.#prop.trashicon.get() );
			$('.mabro-main-wrap').on('click',()=>{ this.selectIconByFsId() }).on( 'contextmenu', (e) => {
				if ( ! $(e.target).hasClass('mabro-main-wrap')) return;
				e.preventDefault();
				const apps = this.#mb.apps();
				const app = apps[ $(document.body).data('mabro').activeApp ];
				if ( app ) this.#mb.getMenu().then( m => { m.appContextMenu( e, e.target, app ) });
			});
		};
		async event(name,data) {
			if ( name === 'run'|| name === 'activate' ) {
				let activate = (name === 'activate');
				if ( activate ) this.#wrap.trigger('click');
				return this.#wrap;
			}
		};
		async openFolder(id) {
			if ( typeof id === 'object' ) id = id.id;
			let $w = $(`.wd-folder-window[fsid="${id}"]`,this.#wrap);
			if ( ! $w.length) {
				const f = this.#fs.getDir(id);
				if ( ! f ) return;
				const w = this.#api.newWindow({ title: f.name.escape(), width: '320px', height: '160px', minWidth: '240px', minHeight: '140px' });
				makeFolderWindow( w, f );
				w.show();
				$w = w.wrap();
			}
			$w.trigger("mouseup");
			return $w;
		};
		async folderInfo( id ) {
			if ( typeof id === 'object' ) id = id.id;
			let f = this.#fs.getDir(id);
			if ( f ) this.itemInfo('folder',f);
		};
		async itemInfo( type, data ) {
			const dlog = await this.#api.dialog({ title: data.name.escape() });
			const $c = $(`<div class="input-group mb-3"><input class="form-control wd-item-name" type="text" /><div class="input-group-append"><button type="button" class="btn btn-secondary btn-rename">${getLabel('wd-item-rename')}</button></div></div>`);
			const renameFunc = () => {
				let n = $('input.wd-item-name',$c).val().normalizespace();
				if ( ! n.length ) {
					$('input.wd-item-name',$c).val(data.name).select();
					return;
				}
				if ( type === 'folder') {
					data.name = n;
					this.#fs.setDir(data);
				} else if ( type === 'file' ) {
					data.name = n;
					this.#fs.setFile(data);
				} else {
					return;
				}
				$(`.wd-icon[fsid="${data.id}"] div.label label`,this.#wrap).html(n.escape());
				$(`.wd-folder-window[fsid="${data.id}"]>.mabro-window-titlebar>label`,this.#wrap).html(n.escape());
				if ( data.parent ) this.refreshWindowByFsid( data.parent );
				dlog.close();
			};
			$('input.wd-item-name',$c).val(data.name);
			$('button.btn-rename',$c).on('click',()=>{ renameFunc() });
			dlog.body($c);
			dlog.footer().remove();
			dlog.show( ()=>{ $('input.wd-item-name',$c).select() } );
		};
		async createFolder( parentid ) {
			if ( typeof parentid === 'object' ) parentid = parentid.id;
			let parent = this.#fs.getDir(parentid);
			if ( ! parent ) return;
			const dlog = await this.#api.dialog({ title: "In: "+parent.name.escape() });
			const $c = $(`<div class="input-group mb-3"><input class="form-control wd-item-name" type="text" /><div class="input-group-append"><button type="button" class="btn btn-secondary btn-create">${getLabel('wd-item-create')}</button></div></div>`);
			const createFunc = () => {
				let n = $('input.wd-item-name',$c).val().normalizespace();
				if ( ! n.length )  return;
				let data = { name : n, id : glob.uid('dir-'), parent: parentid };
				this.#fs.setDir(data);
				if ( ! Array.isArray(parent.dirs) ) parent.dirs = [];
				parent.dirs.push(data.id);
				this.#fs.setDir(parent);
				this.refreshWindowByFsid( parent.id );
				dlog.close();
			};
			$('button.btn-create',$c).on('click',()=>{ createFunc() });
			dlog.body($c);
			dlog.footer().remove();
			dlog.show( ()=>{ $('input.wd-item-name',$c).focus() } );
		};
		trashItem( oid ) {
			if ( typeof oid === 'object' ) oid = oid.id;
			const type = oid.startsWith('dir-') ? 'folder' : 'file';
			const o = type === 'folder' ? this.#fs.getDir(oid) : this.#fs.getFile(oid);
			o.deleted = true;
			const t = this.#fs.getTrash();
			if ( type === 'folder' ){
				this.#fs.setDir(o);
				if ( ! Array.isArray(t.dirs) ) t.dirs=[];
				t.dirs.push(oid);
			} else {
				this.#fs.setFile(o);
				if ( ! Array.isArray(t.files) ) t.files=[];
				t.files.push(oid);
			}
			this.#fs.setDir(t);
			this.closeWindowByFsid(oid);
			this.refreshWindowByFsid(o.parent);
			this.refreshWindowByFsid(t.id);
		}
		untrashItem( oid ) {
			if ( typeof oid === 'object' ) oid = oid.id;
			const type = oid.startsWith('dir-') ? 'folder' : 'file';
			const o = type === 'folder' ? this.#fs.getDir(oid) : this.#fs.getFile(oid);
			delete o.deleted;
			const t = this.#fs.getTrash();
			if ( ! this.#fs.getDir(o.parent) ) {
				const root = this.#fs.getRoot();
				o.parent = root.id;
				if ( type === 'folder') {
					if ( ! root.dirs ) root.dirs = [];
					root.dirs.push(o.id);
				} else {
					if ( ! root.files ) root.files = [];
					root.files.push(o.id);
				}
				this.#fs.setDir(root);
			}
			if ( type === 'folder' ){
				this.#fs.setDir(o);
				t.dirs = t.dirs.filter( id => ( id !== oid ));
			} else {
				this.#fs.setFile(o);
				t.files = t.files.filter( id => ( id !== oid ));
			}
			this.#fs.setDir(t);
			this.refreshWindowByFsid(o.parent);
			this.refreshWindowByFsid(t.id);
			this.selectIconByFsId(o.id);
		};
		emptyTrash() {
			const t = this.#fs.getTrash();
			if ( Array.isArray(t.dirs) ) t.dirs.forEach( d => { this.#fs.rmDir(d) });
			if ( Array.isArray(t.files) ) t.files.forEach( f => { this.#fs.rmFile(f) });
			delete t.dirs;
			delete t.files;
			this.#fs.setDir(t);
			this.closeWindowByFsid(t.id);
			this.selectIconByFsId();
		};
		selectIconByFsId( fsid ) {
			if ( fsid ) {
				$(`.wd-icon:not([fsid="${fsid}"])`,this.#wrap).removeClass('wd-selected');
				$(`.wd-icon[fsid="${fsid}"]`,this.#wrap).addClass('wd-selected');
			} else {
				$(`.wd-icon`,this.#wrap).removeClass('wd-selected');
			}
		};
		closeWindowByFsid( fsid ) {
			$(`.wd-folder-window[fsid="${fsid}"]`,this.#wrap).each( (idx,w)=>{ this.#api.closeWindow( $(w).attr('id') ); });
		};
		refreshWindowByFsid( fsid ) {
			$(`.wd-folder-window[fsid="${fsid}"]`,this.#wrap).each( (idx,w)=>{
				const wobj = this.winById( $(w).attr('id') );
				if ( wobj ) makeFolderWindow( wobj, this.#fs.getDir( fsid ) );
			});
		};
		winById(id) { return this.#sysapi.winById( id ); };
		async refresh() {

		};
	}
	return WD;
};

export default getClass;
