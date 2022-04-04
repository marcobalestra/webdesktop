const getSkeleton = (mb) => {
	const id = glob.uid('dir');
	const sk = { dirs : {}, files : {}, apps : [], root : id, prefs : {} };
	sk.dirs[uid] = { name : _l("Archive") };
	sk.apps.push({ uri: mb.getProp('mabro_base')+'webdesktop/' });
	return sk;
};

const existingStorages = () => {
	const out = [];
	if ( window.sessionStorage.getItem('mabro') ) out.push('session');
	if ( window.localStorage.getItem('mabro') ) out.push('local');
	return out;
};

const getClass = async () => {
	const FS = class {
		#prop;
		constructor(mb) {
			this.#prop = {};
			this.#prop.mb = mb;
		};
		static init = async () => {

		};
		async init() {
			return await FS.init(this);
		};
		existingStorages() { return existingStorages(); };
	}
	return FS;
};

export default getClass;
