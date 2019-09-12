// Based on code from: https://stackoverflow.com/questions/31298996/sorting-a-set-of-objects-by-a-users-preference
mudaeRanker.service('PreferenceList', ['RankChoice', function(RankChoice) {
	var service = {
		size: 0,
		indices: [{index: 0, skip: false}],
		currentIndex: 1, 
		centerIndex: 0, 
		min: 0, 
		max: 1,
		lastCompare: 0,

		resetToCount: function (count)
		{
			service.size = count;
			service.indices = [{index: 0, skip: false}];
			service.currentIndex = 1;
			service.centerIndex = 0;
			service.min = 0;
			service.max = 1;
			service.lastCompare = 0;
		},

		getState: function ()
		{
			return { indices: service.indices, 
				currentIndex: service.currentIndex, 
				centerIndex: service.centerIndex, 
				min: service.min, 
				max: service.max, 
				lastCompare: service.lastCompare 
			};
		},

		setState: function (state)
		{
			service.indices = state.indices;
			service.currentIndex = state.currentIndex;
			service.centerIndex = state.centerIndex;
			service.min = state.min;
			service.max = state.max;
			service.lastCompare = state.lastCompare;
		},

		addAnswer: function(pref) 
		{
			if (pref === RankChoice.Left) // Left
			{
				service.max = service.lastCompare = service.centerIndex;
			}
			else if (pref === RankChoice.Right) // Right
			{
				service.min = service.lastCompare = service.centerIndex + 1;
			}
			else // Skip
			{
				service.size--;
				return;
			}

			if (service.min === service.max)
			{
				service.indices.splice(service.min, 0, {index: service.currentIndex, skip: false});
				service.currentIndex = service.currentIndex < service.indices.length ? service.indices.length : service.currentIndex + 1;
				service.centerIndex = 0;
				service.min = 0;
				service.max = service.indices.length;
			}
		},

		pause: function ()
		{
			if (service.max !== service.indices.length || service.min !== 0) // They made a choice on the current character
			{
				// They made at least one choice, splice the character in at the last choice that was made
				service.indices.splice(service.lastCompare, 0, {index: service.currentIndex, skip: false});
			}
		},

		resume: function (count)
		{
			service.size = count;

			var indicesLength = service.indices.length;
			var indexOfCurrentInProgress = service.getIndexOfCurrentInProgress();

			for (var i = indicesLength - 1; i >= 0; i--)
			{
				if (service.indices[i].skip)
				{
					service.removeIndex(i, false);

					if (i === indexOfCurrentInProgress)
					{
						service.moveToNext();
					}
					else if (i < indexOfCurrentInProgress)
					{
						service.incrementCurrentInProgressRank();
						indicesLength--;
					}
					else if (i > indexOfCurrentInProgress)
					{
						indicesLength--;
					}
				}
			}

			if (service.currentIndex < indicesLength) // If the current index was added to the indices
			{
				// Then we need to pop the index out and update it to its new value
				service.currentIndex = service.indices.splice(service.lastCompare, 1)[0].index;
			}
		},

		getQuestion: function()
		{
			if (service.currentIndex >= service.size) // If we've gone past the end of the array, stop
				return null;
				
			service.centerIndex = Math.floor((service.min + service.max) / 2); // Calculate the center index

			return({
				leftCompareIndex: service.currentIndex, 
				rightCompareIndex: service.indices[service.centerIndex].index
			});
		},

		getOrder: function()
		{
			var index = [];

			for (var i = 0; i < service.indices.length; i++)
			{
				index.push(service.indices[i].index);
			}

			return index;
		},

		sortIndices: function ()
		{
			var indicesLength = service.indices.length;

			service.indices.length = 0; // Reset the indices array

			for (var i = 0; i < indicesLength; i++) // Repopulate the array to the same size but now sorted as 0...n since those are the new indices
			{
				service.indices.push({index: i, skip: false});
			}
		},

		// Only call the below methods when in-progress ranking has been paused
		getIndexOfCurrentInProgress: function ()
		{
			if (service.currentIndex < service.indices.length) // If the current index was added to the indices
			{
				return service.lastCompare; // The character would have been inserted here
			}
			
			return service.indices.length; // We were working on the next character outside the array
		},

		moveToNext: function () // Based on addAnswer
		{
			service.currentIndex = service.indices.length;
			service.centerIndex = 0;
			service.min = 0;
			service.max = service.indices.length;
		},

		addIndex: function (index)
		{
			var currentInProgressIndex = service.indices.length;

			if (service.currentIndex < service.indices.length) // If the current index was added to the indices
			{
				currentInProgressIndex = service.lastCompare; // The character would have been inserted here
			}

			service.indices.splice(index, 0, {index: -1, skip: false}); // Can push -1 since we're paused
			
			// Shift everything after it up one index
			var indicesLength = service.indices.length;

			for (var i = index; i < indicesLength; i++)
			{
				service.indices[i].index++;
			}
		},

		removeIndex: function (index, isPermanent)
		{
			var currentInProgressIndex = service.indices.length;

			if (service.currentIndex < service.indices.length) // If the current index was added to the indices
			{
				currentInProgressIndex = service.lastCompare; // The character would have been inserted here
			}
			
			service.indices.splice(index, 1);
			if (index != currentInProgressIndex)
			{
				service.currentIndex = -1; // Force an update of the currentIndex when we come back in since the array size will have changed
			}

			// Shift everything after it down one index
			var indicesLength = service.indices.length;

			for (var i = index; i < indicesLength; i++)
			{
				service.indices[i].index--;
			}
			
			if (isPermanent)
			{
				service.size--;
			}
		},

		// Increment decreases and decrement increases since a lower number is a higher rank. Gotta make it confusing somehow.
		incrementCurrentInProgressRank: function ()
		{
			if (service.lastCompare > 0)
			{
				service.lastCompare--;
				service.max--;
			}
		},

		decrementCurrentInProgressRank: function ()
		{
			if (service.lastCompare < service.indices.length)
			{
				service.lastCompare++;
				service.max++;
			}
		},

		markForSkip: function (index, isSkip)
		{
			service.indices[index].skip = isSkip;
		}
	};
	
	return service;
}]);
