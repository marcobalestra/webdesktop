const makeCalc = ($c) => {
	$c.append('foo');
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
			const w = this.#api.newWindow();
			makeCalc(w.window());
			w.show();
		};
	}
	return C;
};

export default getClass;
