(function() {
	var hpms = {};

	var dispatcher,
		pageLoader;

	hpms.init = function() {
		var menubar = avlmenu.Menubar();

		d3.select('#hpms-menubar').call(menubar);

		var dropdown = avlmenu.Dropdown()
			.data([{ text: 'HPMS Menu' }]);

		menubar.append(dropdown);

		var selector = avlmenu.Dropdown()
			.data([{ text: 'States (A-I)', id: 'states-a-i' },
					{ text: 'States (J-N)', id: 'states-j-n' },
					{ text: 'States (O-Z)', id: 'states-o-z' },
				   	{ text: 'Interstates', id: 'interstates' }
			]);

        dropdown.append(selector);

		var tabs = avlmenu.Tab()
			.data([
				{ text: 'States Tab', id: '#hpms-map', obj: hpms_map, types: ['statechange'] },
				{ text: 'Interstates Tab', id: '#hpms-interstates', obj: hpms_interstates, types: ['statechange', 'interstatechange'] },
				{ text: 'Data Tab', id: '#hpms-data', obj: hpms_data, types: ['interstatechange'] }
			]);
		menubar.append(tabs);

		tabs.on('tabfocus', onTabSelect);
		tabs.on('tabunfocus', onTabDeselect)

		function onTabSelect(d, i) {
			d.obj.active = true;
			pageLoader(d.obj);
		}
		function onTabDeselect(d, i) {
			d.obj.active = false;
		}

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

        	var togglesA_I = [],
        		togglesJ_N = [],
        		togglesO_Z = [];

        	data.forEach(function(state) {
        		var obj = {
        			text: hpms.formatName(state.table_name),
        			datum: state.table_name,
        			fips: state.state_fips,
					select: selectState,
					deselect: unselectState
        		}
        		if (obj.text < 'J') {
        			togglesA_I.push(obj);
        		}
        		else if (obj.text < 'O') {
        			togglesJ_N.push(obj);
        		}
        		else {
        			togglesO_Z.push(obj);
        		}
            });

            toggles.data(togglesA_I);
            selector.append(toggles, { id: 'states-a-i' });

            toggles.data(togglesJ_N);
            selector.append(toggles, { id: 'states-j-n' });

            toggles.data(togglesO_Z);
            selector.append(toggles, { id: 'states-o-z' });
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
					select: selectInterstate,
					deselect: unselectInterstate
        		}
        		toggleData.push(obj);
            });

            toggles.data(toggleData);

            selector.append(toggles, { id: 'interstates' });
        })

        dispatcher = d3.dispatch('statechange', 'interstatechange');
        pageLoader = PageLoader().init();

        hpms_map.active = true;
	}
	hpms.register = function(type, cb) {
		dispatcher.on(type, cb);
	}

    hpms.formatName = function(name) {
        var regex = /(\d+)/;
        name = name.replace(regex, '');

        regex = /(new|south|west|north|rhode)/;
        name = name.replace(regex, '$1' + ' ');

        return esc.capitalizeAll(name);
    }

	function selectState(data) {
		dispatcher.statechange.call(this, data, true);
	}
	function unselectState(data) {
		dispatcher.statechange.call(this, data, false);
	}

	function selectInterstate(data) {
		dispatcher.interstatechange.call(this, data, true);
	}
	function unselectInterstate(data) {
		dispatcher.interstatechange.call(this, data, false);
	}

	this.hpms_menu = hpms;
})()