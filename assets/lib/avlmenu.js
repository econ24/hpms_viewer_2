var avlmenu = (function() {
	var avlmenu = {};

	var uniqueID = 0;

	function uniqueGroupID() {
		return 'avl-menu-group-'+uniqueID++;
	}
	function appendUniqueGroup(selection) {
		selection.append('g')
			.attr('id', uniqueGroupID);
	}

	avlmenu.populateTable = function(selection, data) {
			var tables = selection.selectAll('table')
				.data(data);

			tables.exit().remove();

			tables.enter().append('table')
				.attr('class', 'avl-menu-table');

			var rows = tables.selectAll('tr')
				.data(function(d) { return d; });

			rows.exit().remove();

			rows.enter().append('tr');

			rows.classed('avl-menu-odd-row', function(d, i) { return i%2 })
				.classed('avl-menu-table-header', function(d) { return d.tableHeader; })
				.classed('avl-menu-row-header', function(d) { return d.rowHeader; });

			var columns = rows.selectAll('td')
				.data(function(d) { return d; });

			columns.exit().remove();

			columns.enter().append('td');

			columns
				.text(function(d) { return textAccessor(d); })
				.attr('class', 'avl-menu-table-column')
				.classed('avl-menu-row-header', function(d, i) { return i===0; });

			d3.selectAll('.avl-menu-table-header')
				.each(function(d) {
					if (d.span) {
						d3.select(this).selectAll('td')
							.attr('colspan', d.span);
					}
				})
	}

	avlmenu.Popup = function() {
		var _popup = null,
			visible = false,
			data = [],
			position = 'top-right',
			allPositions = {
				'top-right': 'avl-menu-top-right',
				'bottom-right': 'avl-menu-bottom-right',
				'bottom-left': 'avl-menu-bottom-left',
				'top-left': 'avl-menu-top-left'
			}
			textAccessor = function(d) { return d; };

		function popup() {
			_popup.classed('avl-menu-popup-hide', !visible);

			for (var key in allPositions) {
				_popup.classed(allPositions[key], false);
			}
			_popup.classed(allPositions[position], true);

			_popup.call(avlmenu.populateTable, data);
		}
		popup.init = function(selection) {
			_popup = selection.append('div')
				.attr('class', 'avl-menu-popup')
				.classed('avl-menu-popup-hide', !visible);
		}
		popup.position = function(p) {
			if (!arguments.length) {
				return position;
			}
			position = p;
			return popup;
		}
		popup.visible = function(bool) {
			if (!arguments.length) {
				return visible;
			}
			visible = bool;
			return popup;
		}
		popup.data = function(d) {
			if (!arguments.length) {
				return data;
			}
			data = d;
			return popup;
		}

		return popup;
	}

	avlmenu.Tab = function() {
		var _tab,
			_button,
			parent,
			groupID,
			data = [],
			text = function(d) { return d.text; };

		function tab(selection, _styles) {
			if (selection) {
				parent = selection;
				groupID = '#'+selection.attr('id');
			}
			if (_styles) {
				styles = _styles;
			}
			if (!(selection || parent)) {
				parent = d3.select('body');
			}

			var container = parent
				.selectAll(groupID+' > .avl-menu-tab-container')
				.data(data);

			container.exit().remove();

			container.enter().append('g')
				.attr('class', 'avl-menu-tab-container')
				.each(createTab);

			var tabs = [];

 			_button = parent.selectAll(groupID+' > .avl-menu-tab-container > g > .avl-menu-button')
 				.each(function(d) { tabs.push(d.tab.attr('id')); });

 			_tab = d3.selectAll('.avl-menu-tab')
 				.filter(function(d) { return tabs.indexOf(d3.select(this).attr('id')) >= 0; });

 			if (selection) {
 				_button.filter(function(d, i) { return i === 0; })
 					.each(toggleTab);
 			}

			if (styles) {
				container.style(styles);
			}
			if (styles['text-indent']) {
				indent = parseInt(styles['text-indent']);
			}
		}
		tab.data = function(d) {
			if (!arguments.length) {
				return data;
			}
			data = d;
			return tab;
		}

		function createTab(d, i) {
			var container = d3.select(this),
				t;

			if (d.id) {
				t = d3.select(d.id)
					.attr('class', 'avl-menu-tab');
			}

			var button = avlmenu.Button()
				.data([{ text: text(d), tab: t }])
				.on('click.avl-menu-tab-toggle', toggleTab)

			if (d.on) {
				button.on(d.on);
			}

			container.insert('g', ':first-child')
				.attr('id', uniqueGroupID).call(button);
		}

		function toggleTab(d) {
			_button
				.classed('avl-menu-button-selected', false);

			_tab.style('display', 'none');

			d3.select(this)
				.classed('avl-menu-button-selected', true);

			d.tab.style('display', 'block');
		}

		return tab;
	}

	avlmenu.Dropdown = function() {
		var _dropdown,
			_toggles,
			parent,
			groupID,
			styles,
			data = [],
			text = function(d) { return d.text; },
			multi = false,
			indent = 0;

		function dropdown(selection, _styles) {
			if (selection) {
				parent = selection;
				groupID = '#'+selection.attr('id');
			}
			if (_styles) {
				styles = _styles;
			}
			if (!(selection || parent)) {
				parent = d3.select('body');
			}

			var container = parent.selectAll(groupID+' > .avl-menu-dropdown-container')
				.data(data);

			container.exit().each(function(){console.log('bye',data)}).remove();

			container.enter().append('div')
				.attr('class', 'avl-menu-dropdown-container')
				.each(createDropdown);

 			_toggles = parent.selectAll(groupID+' > .avl-menu-dropdown-container > g > .avl-menu-button');

			_dropdown = parent.selectAll(groupID+' > .avl-menu-dropdown-container > .avl-menu-dropdown');

			_dropdown.style('max-height', function() {
				var maxHeight = window.innerHeight-this.offsetTop;

				return maxHeight+'px';
			});

			if (styles) {
				container.style(styles);
				_dropdown.style(styles);
			}
			if (styles['text-indent']) {
				indent = parseInt(styles['text-indent']);
			}
		}
		dropdown.data = function(d) {
			if (!arguments.length) {
				return data;
			}
			data = d;
			return dropdown;
		}
		dropdown.each = function(func) {
			var savedDropdown = _dropdown,
				x = 0;

			savedDropdown.each(function(d, i) {
				_dropdown = savedDropdown.filter(function(d, idx) { return x === idx; });

				func.bind(this)(d, i);

				x++;
			});

			_dropdown = savedDropdown;
			return dropdown;
		}
		dropdown.append = function(object, obj) {
			var styles = {'max-height': 'none', 'overflow-y': 'hidden', 'text-indent': (indent+15)+'px'},
				selection = _dropdown;

			if (arguments.length == 2) {
				if (obj.id) {
					selection = _dropdown
						.filter(function(d) { return d.id == obj.id; });
				}
				else if (obj.filter) {
					selection = _dropdown
						.filter(function(d, i) { return obj.filter.bind(this)(d, i); });
				}
			}

			selection
				.append('g').attr('id', uniqueGroupID)
				.call(object, styles);

			return dropdown;
		}
		dropdown.multi = function(m) {
			if (!arguments.length) {
				return multi;
			}
			multi = m;
			return dropdown;
		}

		function createDropdown(d, i) {
			var container = d3.select(this);

			var dd = container
				.append('div')
				.attr('class', 'avl-menu-dropdown')
				.style('height', '0px');

			var toggle = avlmenu.Toggle()
				.data([{ text: text(d), select: toggleDropdown, deselect: toggleDropdown, dropdown: dd }]);

			container.insert('g', ':first-child').attr('id', uniqueGroupID).call(toggle);

			// dd.style('max-height', function() {
			// 	var maxHeight = window.innerHeight-this.offsetTop;

			// 	return maxHeight+'px';
			// });
		}

		function toggleDropdown(d) {
			var dd = d.dropdown,
				button = this;

			if (!multi) {
				_toggles
					.filter(function() { return this != button; })
					.each(function() { this.selected = false; })
					.classed('avl-menu-button-selected', false);

				var filtered = _dropdown
					.filter(function(d) { return d.dropdown != dd; });

				adjustHeight(filtered, 0);
			}

			if (this.selected) {
				dd.style('height', 'auto');
				var height = dd.node().offsetHeight;
				dd.style('height', '0px');

				adjustHeight(dd, height, true);
			}
			else {
				adjustHeight(dd, 0);
			}
		}

		function adjustHeight(selection, height, auto) {
			selection
				.transition()
				.duration(250)
				.style('height', height+'px')
				.each('end', function() {
					if (auto) {
						selection.style('height', 'auto');
					}
				});
		}

		return dropdown;
	}

	avlmenu.Button = function() {
		var _button,
			parent,
			groupID,
			styles,
			data = [],
			text = function(d) { return d.text; },
			events = {};

		function button(selection, _styles) {
			if (selection) {
				parent = selection;
				groupID = '#'+selection.attr('id');
			}
			if (_styles) {
				styles = _styles;
			}
			if (!(selection || parent)) {
				parent = d3.select('body');
			}

			_button = parent
				.selectAll(groupID+' > .avl-menu-button')
				.data(data);

			_button.exit().remove();

			_button.enter().append('a')
				.attr('class', 'avl-menu-button');

			_button
				.text(function(d) { return text(d); });

			if (styles) {
				_button.style(styles);
			}
			_button.on(events);
			events = {};
		}
		button.on = function(event, action) {
			var obj = {};
			if (arguments.length == 1) {
				obj = arguments[0];
			}
			else {
				obj[event] = action;
			}
			if (_button) {
				_button.on(obj);
			}
			else {
				for (var key in obj) {
					events[key] = obj[key];
				}
			}
			return button;
		}
		button.data = function(d) {
			if (!arguments.length) {
				return data;
			}
			data = d;
			return button;
		}
		button.text = function(t) {
			if (!arguments.length) {
				return text;
			}
			text = t;
			return button;
		};

		return button;
	}

	avlmenu.Toggle = function() {
		var _toggle,
			parent,
			groupID,
			styles,
			data = [],
			text = function(d) { return d.text; },
			select = function(d) { return d.select; },
			deselect = function(d) { return d.deselect; },
			multi = false;

		function toggle(selection, _styles) {
			if (selection) {
				parent = selection;
				groupID = '#'+selection.attr('id');
			}
			if (_styles) {
				styles = _styles;
			}
			if (!(selection || parent)) {
				parent = d3.select('body');
			}

			_toggle = parent
				.selectAll(groupID+' >.avl-menu-button')
				.data(data);

			_toggle.exit().remove();

			_toggle.enter().append('a')
				.attr('class', 'avl-menu-button');

			_toggle
				.text(function(d) { return text(d); })
				.on('click', toggled);

			if (styles) {
				_toggle.style(styles);
			}
		}
		toggle.data = function(d) {
			if (!arguments.length) {
				return data;
			}
			data = d;
			return toggle;
		}
		toggle.text = function(t) {
			if (!arguments.length) {
				return text;
			}
			text = t;
			return toggle;
		};
		toggle.select = function(s) {
			if (!arguments.length) {
				return select;
			}
			select = s;
			return toggle;
		}
		toggle.deselect = function(ds) {
			if (!arguments.length) {
				return deselect;
			}
			deselect = ds;
			return toggle;
		}
		toggle.multi = function(m) {
			if (!arguments.length) {
				return multi;
			}
			multi = m;
			return toggle;
		}

		function toggled(d) {
			var button = d3.select(this),
				self = this;

			this.selected = !this.selected;

			if (this.selected && !multi) {
				_toggle
					.filter(function() { return this != self; })
					.classed('avl-menu-button-selected', false)
					.each(function(d) {
						if (this.selected) {
							var func = deselect(d);
							if (func) {
								func.bind(self)(d);
							}
							this.selected = false;
						}
					});
			}

			button.classed('avl-menu-button-selected', this.selected);

			if (this.selected) {
				var func = select(d);
				if (func) {
					func.bind(self)(d);
				}
			}
			else if (!this.selected) {
				var func = deselect(d);
				if (func) {
					func.bind(self)(d);
				}
			}
		}

		return toggle;
	}

	avlmenu.Menubar = function() {
		var _menubar;

		function menubar(selection) {
			_menubar = selection.append('div')
				.attr('class', 'avl-menu-menubar');
		}
		menubar.append = function(object) {
			_menubar.append('g').attr('id', uniqueGroupID)
				.call(object, {float: 'left'});
			return menubar;
		}

		return menubar;
	}

	avlmenu.Sidebar = function() {
		var _sidebar;

		function sidebar(selection) {
			_sidebar = selection.append('div')
				.attr('class', 'avl-menu-sidebar')
				.style('max-height', function() {
					var maxHeight = window.innerHeight-this.offsetTop;
					return maxHeight+'px';
				});
		}
		sidebar.append = function(object) {
			_sidebar.append('g').attr('id', uniqueGroupID)
				.call(object, {display: 'block', 'max-height': 'none'})
				.append('div').style('height', '0px');
			return sidebar;
		}

		return sidebar;
	}

	return avlmenu;
})()