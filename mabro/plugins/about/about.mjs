const getClass = async (mb) => {
	const ABOUT = class {
		#prop;
		constructor( manifest, options ) {
			if ( typeof options === 'string') options = { uri: options };
			if ( typeof options !== 'object' ) options = {};
			options.dlogOptions = {
				uid : glob.uid('dlog'),
				canclose: true,
				size : 'lg',
				tooltip : '', title : '', body : '', footer : ''
			};
			this.#prop = options;
			if ( this.#prop.uri ) this.show();
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
		}
		open() { this.show() };
		hide() { this.close(); };
		close() { this.#prop.dialog.dispose(); };
	};
	return ABOUT;
};

export default getClass;
