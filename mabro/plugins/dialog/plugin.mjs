const getClass = async (mb) => {
	const DLOG = class {
		#prop;
		#dlog;
		constructor( options ) {
			const dlogDefaults = {
				uid : glob.uid('dlog'),
				canclose: true,
				size : 'lg',
				tooltip : '', title : '', body : '', footer : ''
			};
			if ( typeof options !== 'object' ) {
				options = dlogDefaults;
			} else {
				const okeys = Object.keys(options);
				const dkeys = Object.keys(dlogDefaults);
				dkeys.filter(k => (! okeys.includes(k))).forEach( k => { options[k] = dlogDefaults[k] });
			}
			this.#prop = options;
		};
		static makeDlog(p) {
			return $(`<div class="modal fade mabro-global-system-modal" id="${p.uid}" tabindex="-1" role="dialog" aria-labelledby="${p.tooltip}" data-backdrop="${p.canclose?true:'static'}" data-keyboard="${!!p.canclose}" aria-hidden="true">
				<div class="modal-dialog modal-dialog-${p.size} modal-dialog-centered" role="document">
					<div class="modal-content">
						<div class="modal-header">
							<h5 class="modal-title">${p.title}</h5>
							<button type="button" class="${ p.canclose ? 'close' : 'd-none'}" data-dismiss="modal" aria-label="Close">
								<span aria-hidden="true">&times;</span>
							</button>
						</div>
						<div class="modal-body">${p.body}</div>
						<div class="modal-footer">${p.footer}</div>
					</div>
				</div>
			</div>`);
		};
		getter() { return this.#dlog || ( this.#dlog = DLOG.makeDlog(this.#prop) ); };
		body(data) { const $b = $('.modal-body',this.getter()); return ( typeof data === 'undefined' ? $b : $b.empty().append( this.#prop.body = data ) ) };
		title(data) { const $b = $('.modal-title',this.getter()); return ( typeof data === 'undefined' ? $b : $b.empty().append(this.#prop.title = data) ) };
		footer(data) { const $b = $('.modal-footer',this.getter()); return ( typeof data === 'undefined' ? $b : $b.empty().append(this.#prop.footer = data) ) };
		tooltip(data) { const $b = $(this.getter()); return ( typeof data === 'undefined' ? $b.attr('aria-labelledby') : $b.attr('aria-labelledby',this.#prop.tooltip = data) ) };
		show() {
			$(`.mabro-global-system-modal`,document.body).remove();
			const $d = this.getter();
			$(document.body).append($d);
			$d.modal('show');
		};
		open() { this.show() };
		hide() { this.getter().modal('hide'); };
		close() { this.hide(); setTimeout( ()=>{ this.dispose() }, 1000 ) };
		dispose() { this.getter().remove(); this.#prop = this.#dlog = undefined; }
	};
	return DLOG;
};

export default getClass;
