
const getClass = async (mb) => {
	const DOCK = class {
		#prop;
		constructor(manifest) {
			this.#prop = {};
			this.#prop.registered = {system:[],apps:[]};
			this.#prop.manifest = manifest;
			this.#prop.mb = mb;
			this.#prop.target = $('body > .mabro-dock-wrapper > .mabro-dock-content');
		};
		async render() {
			
		};
		async refresh() {
			// to be done
		};
	}
	return DOCK;
};

export default getClass;
