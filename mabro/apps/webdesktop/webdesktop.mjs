
const getClass = async (mb) => {
	const WD = class {
		#prop; #api; #mb; #wrap;
		constructor(api,options) {
			this.#prop = { options: options };
			this.#api = api;
			this.#mb = options.system;
			this.#wrap = options.wrap;
		};
		async event(name,data) {
			if ( name === 'run'|| name === 'activate' ) {
				let activate = (name === 'activate');
				if ( ! this.#prop.rendered ) {
					await this.render();
					activate = true;
				}
				if ( activate ) this.#wrap.trigger('click');
				return this.#wrap;
			}
		};
		async render() {

		};
		async refresh() {

		};
	}
	return WD;
};

export default getClass;
