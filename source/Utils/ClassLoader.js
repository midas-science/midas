class ClassLoader {

    static load_class(path) {
        return require(path);
    } 

    static load_classes(names) {
    	let result = [];
    	names.forEach((_class, index) => {
    		result.push(this.load_class(_class.path+'/'+_class.name));
    	});
    	return result;
    }

}

export { ClassLoader as default}