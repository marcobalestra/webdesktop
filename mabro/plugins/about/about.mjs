const buildByManifest = (m) => {
	const $out = $('<div></div>');
	if ( m.app_icon || m.app_name ) {
		const $h = $('<h3 style="height:44px;"></h3>');
		if ( m.app_icon ) $h.append( m.app_icon, ' ' );
		if ( m.app_name ) $h.append( $(`<b style="font-family: 'Roboto Condensed', sans-serif;"></b>`).append(m.app_name) );
		$out.append( $h );
	}
	if ( m.base_uri ) $out.append( $(`<p><small>${m.base_uri}</small></p>`) );
	const lis = [];
	if ( m.version ) lis.push(`${_l('Version')}: <b>${m.version}</b>`);
	if ( m.copyright_link ) {
		lis.push(`© <a href="${m.copyright_link}" target="_blank"><b>${m.copyright||m.copyright_link}</b></a>`);
	} else if ( m.copyright ) {
		lis.push(`© <b>${m.copyright}</b>`);
	}
	if ( m.developer_link ) {
		lis.push(`${_l('Developer')}: <a href="${m.developer_link}" target="_blank"><b>${m.developer||m.developer_link}</b></a>`);
	} else if ( m.developer ) {
		lis.push(`${_l('Developer')}: <b>${m.developer||m.developer_link}</b>`);
	}
	if ( lis.length ) {
		const $ul = $('<ul></ul>');
		lis.forEach( li => { $ul.append( $('<li></li>').append(li) ) });
		$out.append($ul);
	}
	return $out;
};

const getClass = async (mb) => {
	const ABOUT = class {
		#prop;
		constructor( manifest, options ) {
			console.log(options);
			if ( typeof options === 'string') options = { uri: options };
			if ( typeof options !== 'object' ) options = {};
			options.dlogOptions = {
				uid : glob.uid('dlog'),
				canclose: true,
				size : 'lg',
				tooltip : '', title : '', body : '', footer : ''
			};
			this.#prop = options;
			this.open();
		};
		show( uri ) {
			if ( typeof uri === 'undefined' ) uri = this.#prop.uri;
			if ( typeof uri === 'undefined' ) return;
			mb.plugin('dialog',this.#prop.dlogOptions ).then( (d) => {
				this.#prop.dialog = d;
				const $c = d.getter();
				$('.modal-header',$c).remove();
				$('.modal-footer',$c).remove();
				const $b = $('.modal-body',$c);
				$b.load(uri,()=>{
					$b.html( glob.localize.labelize( $b.html() ) );
					d.show();
				});
			});
		};
		async build() {
			if ( typeof this.#prop.manifest !== 'object' ) return;
			if ( this.#prop.manifest.about ) return this.show( this.#prop.manifest.base_uri + this.#prop.manifest.about );
			const $content = await buildByManifest( this.#prop.manifest );
			if ( ! $content || ! $content.html().length ) return;
			const d = await mb.plugin('dialog',this.#prop.dlogOptions );
			this.#prop.dialog = d;
			const $c = d.getter();
			$('.modal-header',$c).remove();
			$('.modal-footer',$c).remove();
			const $b = $('.modal-body',$c);
			$b.empty().append( $content );
			$b.html( glob.localize.labelize( $b.html() ) );
			d.show();
		};
		open() {
			if ( this.#prop.manifest ) this.build()
			else if ( this.#prop.uri ) this.show();
		};
		hide() { this.close(); };
		close() { this.#prop.dialog.dispose(); };
	};
	return ABOUT;
};

export default getClass;
