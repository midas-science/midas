class TypeChecker {
	static isNumber(val) {
		return /^\d+$/.test(val);
	}
}

export {TypeChecker as default}