// Based on code from: https://stackoverflow.com/questions/31298996/sorting-a-set-of-objects-by-a-users-preference
mudaeRanker.service('PreferenceList', [function() {
	var service = {
		size: 0,
		indices: [0],
		current: {index: 1, centerIndex: 0, min: 0, max: 1},

		resetToCount: function (count)
		{
			service.size = count;
			service.indices = [0];
			service.current = {index: 1, centerIndex: 0, min: 0, max: 1};
		},

		addAnswer: function(pref) 
		{
			if (pref == -1) // Left
				service.current.max = service.current.centerIndex;
			else if (pref == 1) // Right
				service.current.min = service.current.centerIndex + 1;
			else // Skip
			{
				service.size--;
				return;
			}

			if (service.current.min == service.current.max)
			{
				service.indices.splice(service.current.min, 0, service.current.index);
				service.current = {index: ++service.current.index, centerIndex: 0, min: 0, max: service.indices.length};
			}
		},

		getQuestion: function()
		{
			if (service.current.index >= service.size) // If we've gone past the end of the array, stop
				return null;
				
			service.current.centerIndex = Math.floor((service.current.min + service.current.max) / 2); // Calculate the center index

			return({
				leftCompareIndex: service.current.index, 
				rightCompareIndex: service.indices[service.current.centerIndex]
			});
		},

		getOrder: function()
		{
			var index = [];

			for (var i = 0; i < service.indices.length; i++)
			{
				index.push(service.indices[i]);
			}

			return(index);
		}
	};
	
	return service;
}]);