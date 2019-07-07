mudaeRanker.service('Characters', ['$http', '$interval', '$rootScope', 'MergeCode', 'Mode', 'PreferenceList', 'Utilities', function($http, $interval, $rootScope, MergeCode, Mode, PreferenceList, Utilities) {
	var service = {
		characters: [],
		
		/* Anilist request support */
		anilistApiUrl: 'https://graphql.anilist.co',

		anilistConfig: {headers: {'Content-Type': 'application/json', 'Accept': 'application/json'}},

		characterQuery: `
			query ($seriesName: String, $pageNumber: Int) {
				Media (search: $seriesName, type: ANIME) {
				characters (page: $pageNumber) {
				  pageInfo {
				    currentPage
					hasNextPage
				  }
				  edges {
					node {
					  name {
						first
						last
						alternative
					  }
					  image {
						large
					  }
					}
				  }
				}
			  }
			}`,
		
		anilistReqInterval: null,
		
		parseInputField: function (inputText)
		{
			if (!inputText || inputText === '')
			{
				return;
			}
			
			var mergeCharacters = false;

			if (service.characters.length)
			{
				mergeCharacters = true;
			}

			var jsonInput = Utilities.tryParseJson(inputText);
			
			if (jsonInput)
			{
				if (mergeCharacters)
				{
					service.mergeAll(jsonInput);
				}
				else
				{
					service.updateAll(jsonInput);
				}

				Utilities.showSuccess('Done processing the input', true);
				return;
			}

			 // Remove double newlines
			var initialText = inputText.replace(/\n\n/g,'\n');

			 // Get rid of timestamps
			initialText = initialText.replace(/\[([1-9]|1[12]):([0-5][0-9]) [AP]M\] BOTMuda(e|maid)( \d+)?: /gi, '');
			initialText = initialText.replace(/Muda(e|maid \d+)BOTToday at ([1-9]|1[12]):([0-5][0-9]) [AP]M/gi, '');

			// Clear the character counts on series and put a '$' before the series name for splitting
			initialText = initialText.replace(/(.*) - \d+\/\d+/g, '$$$1');
			
			// Remove the first object in the array since it's an empty string
			var initialSeriesArray = initialText.split('$').slice(1);
			var seriesLength = initialSeriesArray.length;
			var seriesArray = [];
			
			for (var i = 0; i < seriesLength; i++)
			{
				var seriesData = initialSeriesArray[i].trim().split('\n');
				var seriesName = seriesData.splice(0,1)[0].trim();
				var series = { name: seriesName, characters: [], page: 1 };

				var charactersLength = seriesData.length;
				var lookupRequired = false;
				
				for (var j = 0; j < charactersLength; j++)
				{
					// Strip off any comments.
					var originalName = seriesData[j].replace(/(?: \| .*)?/gi, '').trim();
					var characterName = originalName.replace(/(?: \([A-Z]+\))?/gi, '').trim();
					
					var character = { 
						className: 'CharacterThumb',
						imageUrl: null, 
						minimizedName: Utilities.minimizeName(characterName),
						name: characterName, 
						originalName: originalName,
						series: seriesName, 
						skip: false 
					};
					
					if (mergeCharacters)
					{
						var mergeResults = service.mergeCharacter(character);
						
						switch (mergeResults.code)
						{
						case MergeCode.NotFound:
							lookupRequired = true;
							break;
						case MergeCode.Lookup:
							lookupRequired = true;
							character = mergeResults.match;
							break;
						case MergeCode.NoAction:
						default:
							break;
						}
					}
					else
					{
						service.addCharacter(character);
						lookupRequired = true;
					}

					if (lookupRequired) // If a character was added, then add it to the series array, we'll have to look it up from Anilist
					{
						series.characters.push(character);
					}
				}
				
				if (lookupRequired) // If a character was added, the add the series to the seriesArray, since we'll have to look it up from Anilist
				{
					seriesArray.push(series);
				}
			}

			Utilities.showSuccess('Done processing the input', true);
			console.log('Parse Complete');

			if (seriesArray.length > 0) // No reason to go to Anilist if there are no series to look up
			{
				Utilities.showWarning('Looking up characters from Anilist', true);
				service.anilistReqInterval = $interval(this.fetchSeries, 800, 0, true, seriesArray);
				service.anilistReqInterval.then(this.requestIntervalResolve, this.requestIntervalReject);
			}
		},
		
		requestIntervalResolve: function ()
		{
			console.log('Interval Resolved');
		},
		
		requestIntervalReject: function()
		{
			Utilities.showSuccess('Done looking up characters from Anilist', true);
			console.log('Interval Rejected (most likely this is due to it being cancelled, meaning the fetching is complete)');
		},

		fetchSeries: function (seriesArray)
		{
			var series = seriesArray.pop();
			var queryVariables = {seriesName: series.name, pageNumber: series.page};
			var queryBody = JSON.stringify({query: service.characterQuery, variables: queryVariables});

			$http.post(service.anilistApiUrl, queryBody, service.anilistConfig).then(function(response)
			{
				var characterList = response.data.data.Media.characters.edges;
				var characterCount = characterList.length;

				for (var i = 0; i < characterCount; i++)
				{
					var character = characterList[i].node;
					var characterFirstName = character.name.first;
					var characterLastName = character.name.last;
					var hasFirstName = false;
					var hasLastName = false;
					var hasFullName = false;

					if (characterFirstName && characterFirstName.length)
					{
						characterFirstName = characterFirstName.trim();
						
						if (characterFirstName.length)
						{
							hasFirstName = true;
							characterFirstName = Utilities.minimizeName(characterFirstName);
						}
					}

					if (characterLastName && characterLastName.length)
					{
						characterLastName = characterLastName.trim();
						
						if (characterLastName.length)
						{
							hasLastName = true;
							characterLastName = Utilities.minimizeName(characterLastName);
						}
					}
					
					hasFullName = (hasFirstName && hasLastName);

					var characterNameUS = (hasFirstName ? characterFirstName : '') + /*(hasFullName ? ' ' : '') + */(hasLastName ? characterLastName : '');
					var characterNameJP = (hasLastName ? characterLastName : '') + /*(hasFullName ? ' ' : '') + */(hasFirstName ? characterFirstName : '');

					var localCharacters = series.characters;
					var localCharactersLength = localCharacters.length;

					for (var j = 0; j < localCharactersLength; j++)
					{
						var localCharacter = localCharacters[j];
						var localCharacterName = localCharacter.minimizedName;
						var characterFound = false;

						if (localCharacterName === characterNameUS || localCharacterName === characterNameJP || 
							localCharacterName == characterFirstName || localCharacterName == characterLastName)
						{
							characterFound = true;
						}
						else
						{
							// Alternative names don't have a first/last component to them. If they fail because of the names being reversed, oh well.
							var alternativeNames = character.name.alternative;
							var alternativeNamesLength = alternativeNames.length;

							for (var k = 0; k < alternativeNamesLength; k++)
							{
								var alternativeName = Utilities.minimizeName(alternativeNames[k]);
								
								if (localCharacterName === alternativeName)
								{
									characterFound = true;
									break;
								}
							}
						}
						
						if (characterFound)
						{
							localCharacter.imageUrl = character.image.large;
							localCharacters.splice(j, 1);
							j--;
							localCharactersLength--;
							break;
						}
					}
				}

				if (localCharactersLength > 0)
				{
					var hasAdditionalPages = response.data.data.Media.characters.pageInfo.hasNextPage;
					
					if (hasAdditionalPages)
					{
						series.page++;
						seriesArray.push(series);
					}
				}

				if (seriesArray.length == 0)
				{
					$interval.cancel(service.anilistReqInterval);
				}
				
			}, 

			function (response) 
			{
				console.error(response);
			});
		}, 

		/* End Anilist Request Support */

		activeIndex: -1,
		mode: Mode.Edit,
		
		getModeClassName: function ()
		{
			switch(service.mode)
			{
			case Mode.Rank:
				return 'RankMode';
			case Mode.Edit:
			default:
				return 'EditMode';
			}
		},

		getNextModeName: function ()
		{
			switch(service.mode)
			{
			case Mode.Rank:
				return 'Edit Mode';
			case Mode.Edit:
			default:
				return 'Rank Mode';
			}
		},

		toggleMode: function ()
		{
			switch(service.mode)
			{
			case Mode.Rank:
				service.mode = Mode.Edit;
				break;
			case Mode.Edit:
			default:
				service.mode = Mode.Rank;
				service.startRankMode();
				break;
			}
		},

		getCharacters: function ()
		{
			return service.characters;
		},

		clean: function ()
		{
			service.characters.length = 0;
			return service.characters;
		},

		addCharacter: function (character)
		{
			service.characters.push(character);
		},

		addNewCharacter: function (originalName, seriesName, imageUrl, skip)
		{
			var characterName = originalName.replace(/(?: \([A-Z]+\))?/gi, '').trim();

			var character = { 
				className: 'CharacterThumb',
				imageUrl: imageUrl, 
				minimizedName: Utilities.minimizeName(characterName),
				name: characterName, 
				originalName: originalName,
				series: seriesName, 
				skip: skip 
			};

			service.characters.push(character);
		},

		mergeCharacter: function (character)
		{
			// This linear search won't be pretty, but it'll have to do for now
			var characterArray = service.characters;
			var total = characterArray.length;

			for (var i = 0; i < total; i++)
			{
				var matchCharacter = characterArray[i];
				
				if (matchCharacter.minimizedName === character.minimizedName && matchCharacter.series === character.series)
				{
					// Do not use Object.assign here since we don't want to override all properties
					// Right now the only merging we're going to do is to merge the originalName due to it not existing when DM and I first processed our harems
					// In the future this could be used for additional upgrades or some other merge functionality
					matchCharacter.originalName = character.originalName;

					if (matchCharacter.imageUrl != null && matchCharacter.imageUrl != '')
					{
						return { code: MergeCode.NoAction, match: matchCharacter }; // Should probably turn the codes into an Enum
					}
					
					return { code: MergeCode.Lookup, match: matchCharacter };
				}
			}

			// If we didn't find anything, we have to add it to the array. Return null to indicate that the merge didn't find a character.
			characterArray.push(character);

			return { code: MergeCode.NotFound, match: null };
		},
		
		mergeAll: function (newCharacters)
		{
			var total = newCharacters.length;
			
			for (var i = 0; i < total; i++)
			{
				// Don't bother doing a lookup when we're merging in off of JSON... for now.
				service.mergeCharacter(newCharacters[i]);
			}
		},

		updateAll: function (newCharacters)
		{
			service.characters.length = 0; // Clean the existing array
			service.characters.push(...newCharacters); // Push all new records. This can cause problems if newCharacters.length > 100000
			$rootScope.$apply();
		},
		
		updateCharacterImage: function (index, source)
		{
			service.characters[index].imageUrl = source;
			$rootScope.$apply();
		},

		// Probably could easily rework this to run off scope.$index in a directive
		removeCharacter: function (name, series)
		{
			var totalCharacters = service.characters.length;
			var characterRemoved = false;
			var minimizedName = Utilities.minimizeName(name)

			for (var i = 0; i < totalCharacters; i++)
			{
				var aCharacter = service.characters[i];
				if (aCharacter.minimizedName == minimizedName && aCharacter.series == series)
				{
					service.characters.splice(i, 1);
					characterRemoved = true;
					break;
				}
			}
		},
		
		exportJson: function ()
		{
			Utilities.showSuccess(angular.toJson(service.characters), false);
		},

		exportSort: function ()
		{
			var chars = service.characters;
			var total = chars.length;
			
			if (chars[0]['originalName'] === undefined)
			{
				Utilities.showError('Looks like your characters don\'t have their original names stored. Run another $mmas and Parse Input so it can merge in the proper information, and then try again.', true);
				return;
			}

			if (total > 0)
			{
				var output = '$firstmarry ' + chars[0].originalName + '\n';
				
				if (total > 1)
				{
					output += '$sortmarry pos ' + chars[0].originalName

					for (var i = 1; i < total; i++)
					{
						if (i % 20 === 0)
						{
							output += '\n$sortmarry pos ' + chars[i-1].originalName + '$' + chars[i].originalName;
						}
						else
						{
							output += '$' + chars[i].originalName;
						}
					}
				}

				Utilities.showSuccess(output, false);
			}
		},

		minimizeActiveCard: function ()
		{
			if (service.mode === Mode.Edit)
			{
				if (service.activeIndex >= 0) // If there is a currently active character
				{
					// Remove the CharacterFull class from the currently active character
					var aClass = service.characters[service.activeIndex].className;
					service.characters[service.activeIndex].className = aClass.replace(/(?: )?CharacterFull( )?/,'$1');

					// Reset the activeIndex to -1
					service.activeIndex = -1;
				}
			}
		},

		clickCard: function (element, index)
		{
			if (service.mode === Mode.Edit)
			{
				if (index != service.activeIndex)
				{
					if (service.activeIndex >= 0) // If there is a currently active character
					{
						// Remove the CharacterFull class from the currently active character
						var aClass = service.characters[service.activeIndex].className;
						service.characters[service.activeIndex].className = aClass.replace(/(?: )?CharacterFull( )?/,'$1');
					}

					// Add the CharacterFull class to the character being sent in
					service.characters[index].className += ' CharacterFull';
					
					// Update the activeIndex to the character being sent in
					service.activeIndex = index;
				}
				/*
				This was removed once the close button was added
				else // If the character being sent in is the currently active character
				{
					// Remove the CharacterFull class from the currently active character
					var aClass = service.characters[index].className;
					service.characters[index].className = aClass.replace(/(?: )?CharacterFull( )?/,'$1');

					// Reset the activeIndex to -1
					service.activeIndex = -1;
				}
				*/
			}
			// This was removed once the left/right placeholder cards were added to the Ranking Container
			/*else if (service.mode === Mode.Rank)
			{
				var answer = (index === service._currentLeftIndex ? -1 : 1);

				PreferenceList.addAnswer(answer);

				while (service._rankingCardContainer.hasChildNodes()) {
					angular.element(service._rankingCardContainer.lastChild).remove();
				}

				var displayCards = PreferenceList.getQuestion();

				if (displayCards)
				{
					service.presentCardsForComparison(displayCards.leftCompareIndex, displayCards.rightCompareIndex);
				}
				else
				{
					service.endRankMode();
				}
			}*/
		},

		_rankedCharacters: [],
		_discardedCharacters: [],
		_rankingCardContainer: null,
		_rankingContainer: null,
		_currentLeftIndex: -1,
		_currentRightIndex: -1,
		leftCompare: null,
		
		getLeftCompare: function ()
		{
			return service.leftCompare;
		},
		
		selectLeft: function ()
		{
			PreferenceList.addAnswer(-1);
			service.presentCardsForComparison();
		},
		
		skipLeft: function ()
		{
			var skippedCharacter = service._rankedCharacters.splice(service._currentLeftIndex, 1).pop();

			skippedCharacter.skip = true; // If the checkbox was actually working properly, this wouldn't really be necessary, but oh well
			service._discardedCharacters.push(skippedCharacter);
			PreferenceList.addAnswer(0);
			service.presentCardsForComparison();
		},

		rightCompare: null,
		
		getRightCompare: function ()
		{
			return service.rightCompare;
		},
		
		selectRight: function ()
		{
			PreferenceList.addAnswer(1);
			service.presentCardsForComparison();
		},
		
		skipRight: function ()
		{
			var skippedCharacter = service._rankedCharacters.splice(service._currentRightIndex, 1).pop();
			
			skippedCharacter.skip = true; // If the checkbox was actually working properly, this wouldn't really be necessary, but oh well
			service._discardedCharacters.push();
			PreferenceList.addAnswer(0);
			service.presentCardsForComparison();
		},
		
		endRankMode: function ()
		{
			// Make sure we have a reference to the ranking container
			if (!service._rankingContainer)
			{
				service._rankingContainer = $('#RankingContainer')[0];
			}

			service._rankingContainer.style.display = '';
			
			var sortedIndices = PreferenceList.getOrder();
			var total = sortedIndices.length;
			var newCharacters = [];

			for (var i = 0; i < total; i++)
			{
				newCharacters.push(service._rankedCharacters[sortedIndices[i]]);
			}

			newCharacters.push(...service._discardedCharacters);

			service.updateAll(newCharacters);
			service.toggleMode();
		},

		startRankMode: function()
		{
			// Ideally it would be nice if they could pause in the middle of ranking and come back in, buttttt we'll do that later
			// Reset the arrays and all data
			service._rankedCharacters.length = 0;
			service._discardedCharacters.length = 0;

			// Display the Ranking Container
			var totalCharacters = service.characters.length;
			
			// Make sure we have a reference to the ranking container
			if (!service._rankingContainer)
			{
				service._rankingContainer = $('#RankingContainer')[0];
			}

			service._rankingContainer.style.display = 'block';

			// Make sure we have a reference to the ranking card container
			if (!service._rankingCardContainer)
			{
				service._rankingCardContainer = $('#RankingCardContainer')[0];
			}

			// Populate the arrays we'll be sorting and discarding
			for (var i = 0; i < totalCharacters; i++)
			{
				var character = service.characters[i];
				
				if (character.skip)
				{
					service._discardedCharacters.push(character);
				}
				else
				{
					service._rankedCharacters.push(character);
				}
			}

			PreferenceList.resetToCount(service._rankedCharacters.length);
			service.presentCardsForComparison();
		},
		
		presentCardsForComparison: function ()
		{
			var displayCards = PreferenceList.getQuestion();
			
			if (displayCards)
			{
				service._currentLeftIndex = displayCards.leftCompareIndex;
				service._currentRightIndex = displayCards.rightCompareIndex;

				service.leftCompare = service._rankedCharacters[service._currentLeftIndex];
				service.rightCompare = service._rankedCharacters[service._currentRightIndex];
			}
			else
			{
				service.endRankMode(); // Or do something else?
			}
		}
	};
	
	return service;
}]);
