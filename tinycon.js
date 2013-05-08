/*!
 * Tinycon - A small library for manipulating the Favicon
 * Tom Moor, http://tommoor.com
 * Copyright (c) 2012 Tom Moor
 * MIT Licensed
 * @version 0.5
*/

(function(){

	var Tinycon = {};
	var currentFavicon = null;
	var originalFavicon = null;
	var originalTitle = document.title;
	var faviconImage = null;
	var canvas = null;
	var options = {};
	var defaults = {
		width: 10,
		height: 10,
		topPosition: 0,
		leftPosition: 0,
		font: '10px arial',
		colour: '#ffffff',
		background: '#F03D25',
		fallback: true,
		abbreviate: true
	};

	var ua = (function () {
		var agent = navigator.userAgent.toLowerCase();
		// New function has access to 'agent' via closure
		return function (browser) {
			return agent.indexOf(browser) !== -1;
		};
	}());

	var browser = {
		ie: ua('msie'),
		chrome: ua('chrome'),
		webkit: ua('chrome') || ua('safari'),
		safari: ua('safari') && !ua('chrome'),
		mozilla: ua('mozilla') && !ua('chrome') && !ua('safari')
	};

	// private methods
	var getFaviconTag = function(){

		var links = document.getElementsByTagName('link');

		for(var i=0, len=links.length; i < len; i++) {
			if ((links[i].getAttribute('rel') || '').match(/\bicon\b/)) {
				return links[i];
			}
		}

		return false;
	};

	var removeFaviconTag = function(){

		var links = document.getElementsByTagName('link');
		var head = document.getElementsByTagName('head')[0];

		for(var i=0, len=links.length; i < len; i++) {
			var exists = (typeof(links[i]) !== 'undefined');
			if (exists && (links[i].getAttribute('rel') || '').match(/\bicon\b/)) {
				head.removeChild(links[i]);
			}
		}
	};

	var getCurrentFavicon = function(){

		if (!originalFavicon || !currentFavicon) {
			var tag = getFaviconTag();
			originalFavicon = currentFavicon = tag ? tag.getAttribute('href') : '/favicon.ico';
		}

		return currentFavicon;
	};

	var getCanvas = function (){

		if (!canvas) {
			canvas = document.createElement("canvas");
			canvas.width = 16;
			canvas.height = 16;
		}

		return canvas;
	};

	var setFaviconTag = function(url){
		removeFaviconTag();

		var link = document.createElement('link');
		link.type = 'image/x-icon';
		link.rel = 'icon';
		link.href = url;
		document.getElementsByTagName('head')[0].appendChild(link);
	};

	var log = function(message){
		if (window.console) window.console.log(message);
	};

	var drawFavicon = function(label, colour) {

		// fallback to updating the browser title if unsupported
		if (!getCanvas().getContext || browser.ie || browser.safari || options.fallback === 'force') {
			return updateTitle(label);
		}

		var context = getCanvas().getContext("2d");
		var colour = colour || '#000000';
		var src = getCurrentFavicon();

		faviconImage = new Image();
		faviconImage.onload = function() {

			// clear canvas
			context.clearRect(0, 0, 16, 16);

			// draw original favicon
			context.drawImage(faviconImage, 0, 0, faviconImage.width, faviconImage.height, 0, 0, 16, 16);

			// draw bubble over the top
			if ((label + '').length > 0) drawBubble(context, label, colour);

			// refresh tag in page
			refreshFavicon();
		};

		// allow cross origin resource requests if the image is not a data:uri
		// as detailed here: https://github.com/mrdoob/three.js/issues/1305
		if (!src.match(/^data/)) {
			faviconImage.crossOrigin = 'anonymous';
		}

		faviconImage.src = src;
	};

	var updateTitle = function(label) {

		if (options.fallback) {
			if ((label + '').length > 0) {
				document.title = '(' + label + ') ' + originalTitle;
			} else {
				document.title = originalTitle;
			}
		}
	};

	var drawBubble = function(context, label, colour) {

		// automatic abbreviation for long (>2 digits) numbers
		if (typeof label == 'number' && label > 99 && options.abbreviate) {
			label = abbreviateNumber(label);
		}

		// bubble needs to be larger for double digits
		var len = (label + '').length-1;
		var x = options.leftPosition;
		var y = options.topPosition;
		var width = options.width + (6*len);
		var height = options.height;

		// webkit seems to render fonts lighter than firefox
		context.font = (browser.webkit ? 'bold ' : '') + options.font;
		context.fillStyle = options.background;
		context.strokeStyle = options.background;
		context.lineWidth = 1;

		// bubble
		context.fillRect(x,y,width,height);
		
		// bottom shadow
		context.beginPath();
		context.strokeStyle = options.background;
		context.moveTo(x,height);
		context.lineTo(width,height);
		context.stroke();

		// label
		context.fillStyle = options.colour;
		context.textAlign = "center";
		context.textBaseline = "middle";

		// unfortunately webkit/mozilla are a pixel different in text positioning
		context.fillText(label, x+(width/2), browser.mozilla ? y+(height/2)+1 : y+(height/2));
	};

	var refreshFavicon = function(){
		// check support
		if (!getCanvas().getContext) return;

		setFaviconTag(getCanvas().toDataURL());
	};

	var abbreviateNumber = function(label) {
		var metricPrefixes = [
			['G', 1000000000],
			['M',    1000000],
			['k',       1000],
			['C',        100]
		];

		for(var i = 0; i < metricPrefixes.length; ++i) {
			if (label >= metricPrefixes[i][1]) {
				label = round(label / metricPrefixes[i][1]) + metricPrefixes[i][0];
				break;
			}
		}

		return label;
	};

	var round = function (value, precision) {
		var number = new Number(value);
		return number.toFixed(precision);
	};

	// public methods
	Tinycon.setOptions = function(custom){
		options = {};

		for(var key in defaults){
			options[key] = custom.hasOwnProperty(key) ? custom[key] : defaults[key];
		}
		return this;
	};

	Tinycon.setImage = function(url){
		currentFavicon = url;
		refreshFavicon();
		return this;
	};

	Tinycon.setBubble = function(label, colour) {
		label = label || '';
		drawFavicon(label, colour);
		return this;
	};

	Tinycon.reset = function(){
		setFaviconTag(originalFavicon);
	};

	Tinycon.setOptions(defaults);
	window.Tinycon = Tinycon;
})();
