(function(){
	var objects = {};

	function Rect(x, y, w, h) {
		this.x = x;
		this.y = y;
		this.w = w;
		this.h = h;
	}

	Rect.prototype.left = function(l) {
		if (!arguments.length) {
			return this.left;
		}
		this.x = l;
		return this;
	}
	Rect.prototype.top = function(t) {
		if (!arguments.length) {
			return this.top;
		}
		this.y = t;
		return this;
	}
	Rect.prototype.right = function(r) {
		if (!arguments.length) {
			return this.x+this.w;
		}
		this.x = r-this.w;
		return this;
	}
	Rect.prototype.bottom = function(b) {
		if (!arguments.length) {
			return this.y+this.h;
		}
		this.y = b-this.h;
		return this;
	}
	Rect.prototype.center = function(c) {
		if (!arguments.length) {
			return [this.x+this.w/2, this.y+this.h/2];
		}
		this.x = c[0]-this.w/2;
		this.y = c[1]-this.h/2;
		return this;
	}
	Rect.prototype.width = function(w) {
		if (!arguments.length) {
			return this.w;
		}
		this.w = w;
		return this;
	}
	Rect.prototype.height = function(h) {
		if (!arguments.length) {
			return this.h;
		}
		this.h = h;
		return this;
	}
	Rect.prototype.containsPoint = function(point) {
		return (point[0] > this.x) && (point[0] < this.right()) && (point[1] >this.y) && (point[1] < this.bottom());
	}

	Rect.prototype.collideRect = function(rect) {
        var xCollision = Math.abs(this.x-rect.x)+Math.abs(this.right()-rect.right())-(this.w+rect.w) < 0;
        var yCollision = Math.abs(this.y-rect.y)+Math.abs(this.bottom()-rect.bottom())-(this.h+rect.h) < 0;

        return xCollision && yCollision;
	}

	function Circle(x, y, r) {
		this.x = x;
		this.y = y;
		this.r = r;
	}
	Circle.prototype.centerX = function(x) {
		if (!arguments.length) {
			return this.x;
		}
		this.x = x;
		return this;
	}
	Circle.prototype.centerY = function(y) {
		if (!arguments.length) {
			return this.y;
		}
		this.y = y;
		return this;
	}
	Circle.prototype.center = function(c) {
		if (!arguments.length) {
			return [this.x, this.y];
		}
		this.x = c[0];
		this.y = c[1];
		return this;
	}
	Circle.prototype.radius = function(r) {
		if (!arguments.length) {
			return this.r;
		}
		this.r = r;
		return this;
	}
	Circle.prototype.containsPoint = function(point) {
		return Math.pow(point[0]-this.x, 2)+Math.pow(point[1]-this.y, 2) < Math.pow(this.r, 2);
	}
	Circle.prototype.collideCircle = function(circle) {
		return Math.pow(circle.x-this.x, 2)+Math.pow(circle.y-this.y, 2) < Math.pow(circle.r+this.r, 2);
	}

	objects.Circle = function(x, y, r) {
		return new Circle(x, y, r);
	}
	objects.Rect = function(x, y, w, h) {
		return new Rect(x, y, w, h);
	}

	this.objects = objects;
})()