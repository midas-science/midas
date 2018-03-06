class ArrayUtils {

    static arrayify(array) {
        if(!Array.isArray(array)) {
            return [array];
        }
        return array;
    }


    static arrayObjectify(array) {
		var keys = array.shift();
		var objects = array.map(function(values) {
		    return keys.reduce(function(o, k, i) {
		        o[k] = values[i];
		        return o;
		    }, {});
		});
		return objects;
    }

}

export { ArrayUtils as default}