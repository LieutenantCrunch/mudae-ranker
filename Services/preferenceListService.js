mudaeRanker.service('PreferenceList', [function() {
	var service = {
		size: 0,
		indicies: [0],
		current: {index: 1, centerIndex: 0, min: 0, max: 1},

		resetToCount: function (count)
		{
			service.size = count;
			service.indicies = [0];
			service.current = {index: 1, centerIndex: 0, min: 0, max: 1};
		},

		addAnswer: function(x, y, pref) 
		{
			if (pref == -1) // Left
				service.current.max = service.current.centerIndex
			else // Right
				service.current.min = service.current.centerIndex + 1;

			if (service.current.min == service.current.max)
			{
				service.indicies.splice(service.current.min, 0, service.current.index);
				service.current = {index: ++service.current.index, centerIndex: 0, min: 0, max: service.indicies.length};
			}
		},

		getQuestion: function()
		{
			if (service.current.index >= service.size) // If we've gone past the end of the array, stop
				return null;
				
			service.current.centerIndex = Math.floor((service.current.min + service.current.max) / 2); // Calculate the center index

			return({
				leftCompareIndex: service.current.index, 
				rightCompareIndex: service.indicies[service.current.centerIndex]
			});
		},

		getOrder: function()
		{
			var index = [];

			for (var i = 0; i < service.indicies.length; i++)
			{
				index.push(service.indicies[i]);
			}

			return(index);
		}
	};
	
	return service;
}]);