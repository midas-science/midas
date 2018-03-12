class RateLimiter {

    static async async_stall(rate = -1, time_unit = 's', stall_time = 0) {

    	let t_factor = 1000;

    	if(time_unit == 's') {
    		t_factor = 1000;
    	} else if (time_unit == 'm') {
    		t_factor = 1000 * 60;
    	} else if (t_factor == 'h') {
    		t_factor = 1000 * 60 * 60;
    	}

    	if(rate == -1) {
    		stall_time = 0 
    		return Promise.resolve(true);
    	} else {
    		stall_time = t_factor / rate;
    	}    	

        await new Promise(resolve => setTimeout(resolve, stall_time));
    }
}

export { RateLimiter as default}