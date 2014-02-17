L.Icon.Label = L.Icon.extend({
	options: {
		/*
		labelAnchor: (Point) (top left position of the label within the wrapper, default is right)
		wrapperAnchor: (Point) (position of icon and label relative to Lat/Lng)
		iconAnchor: (Point) (top left position of icon within wrapper)
		labelText: (String) (label's text component, if this is null the element will not be created)
		*/
		/* Icon options:
		iconUrl: (String) (required)
		iconSize: (Point) (can be set through CSS)
		iconAnchor: (Point) (centered by default if size is specified, can be set in CSS with negative margins)
		popupAnchor: (Point) (if not specified, popup opens in the anchor point)
		shadowUrl: (Point) (no shadow by default)
		shadowSize: (Point)
		*/
		labelClassName: ''
	},
	
	initialize: function (options) {
		L.Util.setOptions(this, options);
		L.Icon.prototype.initialize.call(this, this.options);
	},

	setLabelAsHidden: function () {
		this._labelHidden = true;
	},

	createIcon: function () {
		return this._createLabel(L.Icon.prototype.createIcon.call(this));
	},
	
	createShadow: function () {
		if (!this.options.shadowUrl) {
			return null;
		}
		var shadow = L.Icon.prototype.createShadow.call(this);
		//need to reposition the shadow
		if (shadow) {
			shadow.style.marginLeft = (-this.options.wrapperAnchor.x) + 'px';
			shadow.style.marginTop = (-this.options.wrapperAnchor.y) + 'px';
		}
		return shadow;
	},

	updateLabel: function (icon, text) {
		if (icon.nodeName.toUpperCase() === 'DIV') {
			icon.childNodes[1].innerHTML = text;
			
			this.options.labelText = text;
		}
	},

	showLabel: function (icon) {
		if (!this._labelTextIsSet()) {
			return;
		}

		icon.childNodes[1].style.display = 'block';
	},

	hideLabel: function (icon) {
		if (!this._labelTextIsSet()) {
			return;
		}

		icon.childNodes[1].style.display = 'none';
	},

	_createLabel: function (img) {
		if (!this._labelTextIsSet()) {
			return img;
		}

		var wrapper = document.createElement('div'),
			label = document.createElement('span');

		// set up wrapper anchor
		wrapper.style.marginLeft = (-this.options.wrapperAnchor.x) + 'px';
		wrapper.style.marginTop = (-this.options.wrapperAnchor.y) + 'px';

		wrapper.className = 'leaflet-marker-icon-wrapper leaflet-zoom-animated';

		// set up label
		label.className = 'leaflet-marker-iconlabel ' + this.options.labelClassName;

		label.innerHTML = this.options.labelText;

		label.style.marginLeft = this.options.labelAnchor.x + 'px';
		label.style.marginTop = this.options.labelAnchor.y + 'px';

		if (this._labelHidden) {
			label.style.display = 'none';
			// Ensure that the pointer cursor shows
			img.style.cursor = 'pointer';
		}
		
		//reset icons margins (as super makes them -ve)
		img.style.marginLeft = this.options.iconAnchor.x + 'px';
		img.style.marginTop = this.options.iconAnchor.y + 'px';
		
		wrapper.appendChild(img);
		wrapper.appendChild(label);

		return wrapper;
	},
	
	_labelTextIsSet: function () {
		return typeof this.options.labelText !== 'undefined' && this.options.labelText !== null;
	}
});

L.Icon.Label.Default = L.Icon.Label.extend({
	options: {
		//This is the top left position of the label within the wrapper. By default it will display at the right
		//middle position of the default icon. x = width of icon + padding
		//If the icon height is greater than the label height you will need to set the y value.
		//y = (icon height - label height) / 2
		labelAnchor: new L.Point(29, 8),
		
		//This is the position of the wrapper div. Use this to position icon + label relative to the Lat/Lng.
		//By default the point of the default icon is anchor
		wrapperAnchor: new L.Point(13, 41),
		
		//This is now the top left position of the icon within the wrapper.
		//If the label height is greater than the icon you will need to set the y value.
		//y = (label height - icon height) / 2
		iconAnchor: new L.Point(0, 0),
		
		//label's text component, if this is null the element will not be created
		labelText: null,
		
		/* From L.Icon.Default */
		iconUrl: L.Icon.Default.imagePath + '/marker-icon.png',
		iconSize: new L.Point(25, 41),
		popupAnchor: new L.Point(0, -33),

		shadowUrl: L.Icon.Default.imagePath + '/marker-shadow.png',
		shadowSize: new L.Point(41, 41)
	}
});

L.Marker.Label = L.Marker.extend({
	updateLabel: function (text) {
		this.options.icon.updateLabel(this._icon, text);
	},

	_initIcon: function () {
		if (!(this.options.icon instanceof L.Icon.Label)) {
			throw new Error('Icon must be an instance of L.Icon.Label.');
		}

		// Ensure that the label is hidden to begin with
		if (this.options.revealing) {
			this.options.icon.setLabelAsHidden();
		}

		L.Marker.prototype._initIcon.call(this);
	},

	_removeIcon: function () {
		if (this.options.revealing) {
			L.DomEvent
				.off(this._icon, 'mouseover', this._showLabel)
				.off(this._icon, 'mouseout', this._hideLabel);
		}

		L.Marker.prototype._removeIcon.call(this);
	},

	_initInteraction: function () {
		L.Marker.prototype._initInteraction.call(this);

		if (!this.options.revealing) {
			return;
		}

		L.DomEvent
			.on(this._icon, 'mouseover', this._showLabel, this)
			.on(this._icon, 'mouseout', this._hideLabel, this);
	},

	_showLabel: function () {
		this.options.icon.showLabel(this._icon);
	},

	_hideLabel: function () {
		this.options.icon.hideLabel(this._icon);
	}
});