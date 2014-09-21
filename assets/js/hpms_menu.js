(function() {
	var hpms = {};

	var activeStates =[],
		activeInterstates = [];

	hpms.init = function() {
		var menubar = avlmenu.Menubar();

		d3.select('#hpms-menubar').call(menubar);

		var dropdown = avlmenu.Dropdown()
			.data([{ text: 'HPMS Menu' }]);

		menubar.append(dropdown);

		var selector = avlmenu.Dropdown()
			.data([{ text: 'States', id: 'states' },
				   { text: 'Interstates', id: 'interstates' }
			]);

        dropdown.append(selector);

		var tabs = avlmenu.Tab()
			.data([
				{ text: 'States', id: '#hpms-map' },
				{ text: 'Interstates', id: '#hpms-interstates', },
				{ text: 'Data', id: '#hpms-data' }
			]);
		menubar.append(tabs);

	    d3.json("http://localhost:1337/hpms", function(error, data) {
			var toggles = avlmenu.Toggle()
				.multi(true);

        	data.sort(function(a, b) {
        		if (a.table_name < b.table_name) {
        			return -1;
        		}
        		else if (a.table_name > b.table_name) {
        			return 1;
        		}
        		return 0;
        	})

        	var toggleData = [];

        	data.forEach(function(state) {
        		var obj = {
        			text: formatName(state.table_name),
        			datum: state.table_name,
					select: updateSelectedState,
					deselect: updateUnselectedState
        		}
        		toggleData.push(obj);
            });

            toggles.data(toggleData);

            selector.append(toggles, { id: 'states' });
        });

	    d3.json("http://localhost:1337/hpms/interstates", function(error, data) {
			var toggles = avlmenu.Toggle()
				.multi(true);

			data.sort(function(a, b) { return a.route-b.route; })

        	var toggleData = [];

        	data.forEach(function(route) {
        		var obj = {
        			text: 'Interstate '+route.route,
        			datum: route.route,
					select: updateSelectedInterstate,
					deselect: updateUnselectedInterstate
        		}
        		toggleData.push(obj);
            });

            toggles.data(toggleData);

            selector.append(toggles, { id: 'interstates' });
        })
	}

	function updateSelectedState(data) {
    	activeStates.push(data.datum);

		hpms_map.selectedState(data.datum, activeStates);
	}

	function updateUnselectedState(data) {
    	esc.arrayRemove(activeStates, data.datum);

		hpms_map.unselectedState(data.datum, activeStates);
	}

	function updateSelectedInterstate(data) {
    	activeInterstates.push(data.datum);

		hpms_interstates.selectedInterstate(data.datum, activeInterstates);
	}

	function updateUnselectedInterstate(data) {
    	esc.arrayRemove(activeInterstates, data.datum);

		hpms_interstates.unselectedInterstate(data.datum, activeInterstates);
	}

    function formatName(name) {
        var regex = /(\d+)/;
        name = name.replace(regex, '');

        regex = /(new|south|west|north|rhode)/;
        name = name.replace(regex, '$1' + ' ');

        return esc.capitalizeAll(name);
    }

	this.hpms_menu = hpms;
})()