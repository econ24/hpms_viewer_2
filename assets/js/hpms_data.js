(function() {
	var hpms = {};

	var activeStates = [],
		activeInterstates = [];

	hpms.init = function() {

	}

	hpms.selectedState = function(datum, array) {
    	activeStates = array;
	}

	hpms.unselectedState = function(datum, array) {
    	activeStates = array;
    }

	hpms.selectedInterstate = function(datum, array) {
		activeInterstates = array;
	}

	hpms.unselectedInterstate = function(datum, array) {
		activeInterstates = array;
	}

	this.hpms_data = hpms;
})()