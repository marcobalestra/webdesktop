
const getClass = async (mb) => {
	const WD = class {
		#prop; #api; #mb; #win
		constructor(api,options) {
			this.#prop = { options: options };
			this.#api = api;
			this.#mb = options.system;
			this.#win = options.win;
		};
		async event(name,data) {
			if ( name === 'run'|| name === 'activate' ) {
				let activate = (name === 'activate');
				if ( ! this.#prop.rendered ) {
					await this.render();
					activate = true;
				}
				if ( activate ) this.#win.trigger('click');
				return this.#win;
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
