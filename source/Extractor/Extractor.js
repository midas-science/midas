class Extractor {

    constructor(config) {
        if(config == null || typeof config === 'undefined') {
              throw "No config is set";
        }

        this.config = config;
        this.config._source = this.config.source[Object.keys(this.config.source)[0]];
        this.config._source.type = Object.keys(this.config.source)[0];
    }

    get_type() {
       return this.config._source.type;
    }

}

export { Extractor as default}