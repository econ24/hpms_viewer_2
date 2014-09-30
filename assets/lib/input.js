function Input() {
	this.buttons = 0;
	this.keyboardState = {};

	this.buttonMap = null;

	this.events = [];
}

Input.prototype.init = function(buttonMap) {
	this.keydown = this.keyDown.bind(this);
	this.keyup = this.keyUp.bind(this);
	window.addEventListener('keydown', this.keydown, true);
	window.addEventListener('keyup', this.keyup, true);

	this.buttonMap = buttonMap;
}

Input.prototype.stop = function() {
	window.removeEventListener('keydown', this.keydown, true);
	window.removeEventListener('keyup', this.keyup, true);
}

Input.prototype.keyDown = function(key) {
	// console.log('pressed:', key.keyCode);
	
	if (key.keyCode in this.buttonMap) {
		if (!this.keyboardState[key.keyCode]) {
			this.events.push(this.buttonMap[key.keyCode]);
		}
		this.keyboardState[key.keyCode] = key.timeStamp;
	}
}

Input.prototype.keyUp = function(key) {
	// console.log('released:', key.keyCode);
	
	if (key.keyCode in this.buttonMap) {
		this.events.push(-this.buttonMap[key.keyCode]);
		this.keyboardState[key.keyCode] = 0;
	}
}

Input.prototype.getInput = function() {
	var prevButtons = this.buttons;

	this.buttons = this.getKeyboardState();

	return this.events;
}

Input.prototype.getKeyboardState = function() {
	var buttons = 0;

	for (var key in this.buttonMap) {
		var code = key,
			action = this.buttonMap[key];
		if (this.keyboardState[code]) {
			buttons |= action;
		}
	}

	return buttons;
}

Input.prototype.checkButton = function(button) {
	return this.buttons & button;
}