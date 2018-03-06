class Loader {

    constructor(config) {
        this.config = config;
        this.config._target = this.config.target[Object.keys(this.config.target)[0]];
        this.config._target.type = Object.keys(this.config.target)[0];
    }

    get_type() {
       return this.config._target.type;
    }

}

export { Loader as default}