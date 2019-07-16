// Based on code from: https://stackoverflow.com/questions/31298996/sorting-a-set-of-objects-by-a-users-preference
mudaeRanker.service('PreferenceList', [function() {
	var service = {
		size: 0,
		indices: [0],
		currentIndex: 1, 
		centerIndex: 0, 
		min: 0, 
		max: 1,
		lastCompare: 0,

		resetToCount: function (count)
		{
			service.size = count;
			service.indices = [0];
			service.currentIndex = 1;
			service.centerIndex = 0;
			service.min = 0;
			service.max = 1;
			service.lastCompare = 0;
		},

		addAnswer: function(pref) 
		{
			if (pref == -1) // Left
			{
				service.max = service.lastCompare = service.centerIndex;
			}
			else if (pref == 1) // Right
			{
				service.min = service.lastCompare = service.centerIndex + 1;
			}
			else // Skip
			{
				service.size--;
				return;
			}

			if (service.min == service.max)
			{
				service.indices.splice(service.min, 0, service.currentIndex);
				service.currentIndex = service.currentIndex < service.indices.length ? service.indices.length : service.currentIndex + 1;
				service.centerIndex = 0;
				service.min = 0;
				service.max = service.indices.length;
			}
		},

		pause: function ()
		{
			if (service.max == service.indices.length && service.min == 0) // They haven't made a choice on the current character
			{
				// Leave the indices as they are, there's no reason to add the current character in
			}
			else
			{
				// They made at least one choice, splice the character in at the last choice that was made
				service.indices.splice(service.lastCompare, 0, service.currentIndex);
			}
		},

		resume: function ()
		{
			var indicesLength = service.indices.length;
			
			service.indices.length = 0; // Reset the indices array
			
			for (var i = 0; i < indicesLength; i++) // Repopulate the array to the same size but now sorted as 0...n since those are the new indices
			{
				service.indices.push(i);
			}

			if (service.currentIndex < indicesLength) // If the current index was added to the indices
			{
				// Then we need to pop the index out and update it to its new value
				service.currentIndex = service.indices.splice(service.lastCompare, 1)[0];
			}
		},

		getQuestion: function()
		{
			if (service.currentIndex >= service.size) // If we've gone past the end of the array, stop
				return null;
				
			service.centerIndex = Math.floor((service.min + service.max) / 2); // Calculate the center index

			return({
				leftCompareIndex: service.currentIndex, 
				rightCompareIndex: service.indices[service.centerIndex]
			});
		},

		getOrder: function()
		{
			var index = [];

			for (var i = 0; i < service.indices.length; i++)
			{
				index.push(service.indices[i]);
			}

			return index;
		}
	};
	
	return service;
}]);
