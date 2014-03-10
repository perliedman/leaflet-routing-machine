(function() {
	function exampleLinks(current) {
		var examples = {
				'index.html': 'Basic control',
				'styling.html': 'Styling',
				'interaction.html': 'Changing interaction'
			},
			fold = L.DomUtil.get('example-fold'),
			list = L.DomUtil.get('examples'),
			li,
			page;

		for (page in examples) {
			li = L.DomUtil.create('li', '', list);
			if (page !== current) {
				li.innerHTML = '<a href="' + page + '">' + examples[page] + '</a>';
			} else {
				li.innerHTML = examples[page];
			}
		}

		L.DomEvent.addListener(fold, 'click', function() {
			var opening = L.DomUtil.hasClass(fold, 'closed');
			L.DomUtil[opening ? 'removeClass' : 'addClass'](fold, 'closed');
			L.DomUtil[opening ? 'removeClass' : 'addClass'](list, 'hide');
		});
	}

	exampleLinks(window.location.pathname.replace(/.*?([a-z]+.html).*/g, '$1'));
})();
