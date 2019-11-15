mudaeRanker.service('Characters', ['$http', '$interval', '$rootScope', 'MergeCode', 'Mode', 'PreferenceList', 'Utilities', function($http, $interval, $rootScope, MergeCode, Mode, PreferenceList, Utilities) {
	var service = {
		characters: [],
		
		// Sortable disabling support. Why there isn't an easier way to get the reference is beyond me. Maybe I'm just missing something.
		_sortableObject: null,

		getSortableObject: function ()
		{
			if (service.sortableObject != null)
			{
				return service.sortableObject;
			}

			var sortableDiv = $('.CharacterCardContainer')[0];

			for (var prop in sortableDiv)
			{
				if (prop.match(/Sortable\d+/))
				{
					service.sortableObject = sortableDiv[prop];
				}
			}

			return service.sortableObject;
		},

		disableSortable: function ()
		{
			var sortable = service.getSortableObject();
			
			if (sortable)
			{
				sortable.options.disabled = true;
			}
		},

		enableSortable: function ()
		{
			var sortable = service.getSortableObject();
			
			if (sortable)
			{
				sortable.options.disabled = false;
			}
		},
		
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
			service.getSortableObject(); // Initialize this up front

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
				try
				{
					if (mergeCharacters)
					{
						service.mergeAll(jsonInput.characters);
					}
					else
					{
						if (jsonInput.appState)
						{
							service.rankingInProgress = jsonInput.appState.rankingInProgress;
							PreferenceList.setState(jsonInput.appState.preferenceState);
						}
						
						if (jsonInput.characters)
						{
							service.updateAll(jsonInput.characters);
						}
						else
						{
							service.updateAll(jsonInput);
						}
					}
					
					Utilities.showSuccess('Done processing the input', true);
				}
				catch(e)
				{
					Utilities.showError('Well, you screwed something up: ' + e.Message, true);
				}
				
				return;
			}

			// Remove multiple newlines
			var initialText = inputText.replace(/\n\n+/g,'\n');
			
			// Remove zero-width spaces
			initialText = initialText.replace(/\u200b/g,'');

			// Get rid of timestamps
			initialText = initialText.replace(/\[([1-9]|1[12]):([0-5][0-9]) [AP]M\] BOTMuda(e|maid)( \d+)?: /gi, '');
			initialText = initialText.replace(/Muda(e|maid \d+)BOTToday at ([1-9]|1[12]):([0-5][0-9]) [AP]M/gi, '');

			// Clear the character counts on series and put a '$' before the series name for splitting
			initialText = initialText.replace(/(.*) (- | +)\d+\/\d+/g, '$$$1');
			
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
					var characterString = seriesData[j];
					// Strip off the image url and any comments
					var originalName = characterString.replace(/ - https:.*/i, '').replace(/(?: \| .*)?/gi, '').trim();
					var imageURLIndex = characterString.lastIndexOf(' - https:');
					var characterImage = null;
					
					if (imageURLIndex > 0)
					{
						characterImage = characterString.substring(imageURLIndex + 3).trim();
					}
					
					var characterName = originalName.replace(/(?: \([A-Z]+\))?/gi, '').trim();
					
					var character = { 
						className: 'CharacterThumb',
						imageUrl: characterImage, 
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
							if (imageURLIndex == -1)
							{
								lookupRequired = true;
							}
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
						
						if (imageURLIndex == -1)
						{
							lookupRequired = true;
						}
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

			// If there's no series at this point, it's probably because the interval fired before it could be cancelled at the end of this function
			if (!series)
			{
				return;
			}

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
							localCharacterName === characterFirstName || localCharacterName === characterLastName)
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

				if (seriesArray.length === 0)
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

		/* Start Mode Support */
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
				return 'Start Editing';
			case Mode.Edit:
			default:
				return 'Start Ranking';
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
				service.startRankMode();
				break;
			}
		},

		/* End Mode Support */

		/* Start Export support */
		exportJson: function ()
		{
			var exportData = {
				appState: {
					rankingInProgress: service.rankingInProgress,
					preferenceState: PreferenceList.getState()
				}, 
				characters: service.characters 
			};

			Utilities.showSuccess(angular.toJson(exportData), false);
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
				var output = '$firstmarry ' + chars[0].originalName;
				
				if (total > 1)
				{
					output += '\n\n$sortmarry pos ' + chars[0].originalName

					for (var i = 1; i < total; i++)
					{
						if (i % 20 === 0)
						{
							output += '\n\n$sortmarry pos ' + chars[i-1].originalName + '$' + chars[i].originalName;
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

		/* End Export support */

		activeIndex: -1,
		inMessageBox: false, // I don't like this, but oh well

		getCharacters: function ()
		{
			return service.characters;
		},

		hasCharacters: function ()
		{
			return service.characters.length > 0;
		},

		clean: function ()
		{
			service.characters.length = 0;
			service.rankingInProgress = false;
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

					service.enableSortable();
				}
			}
		},

		deleteActiveCard: function ()
		{
			return new Promise(function(resolve, reject) {
				if (service.mode === Mode.Edit)
				{
					if (service.activeIndex >= 0) // If there is a currently active character
					{
						service.inMessageBox = true;

						Utilities.confirm('Are you sure you want to delete this character?', 'Confirm Deletion').done(function (data, button) {
							service.characters.splice(service.activeIndex, 1);
							service.handleDeletedCharacter(service.activeIndex);

							// Reset the activeIndex to -1
							service.activeIndex = -1;
							service.inMessageBox = false;
							resolve();
						}).fail(function (data, button) {
							console.log('Then why did you click the delete button?');
							service.inMessageBox = false;
							reject();
						});
					}
				}
			});
		},

		clickCard: function (element, index)
		{
			if (service.mode === Mode.Edit)
			{
				if (index != service.activeIndex)
				{
					service.disableSortable();

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
			}
		},

		_rankedCharacters: [],
		_discardedCharacters: [],
		_rankingCardContainer: null,
		_rankingContainer: null,
		_currentLeftIndex: -1,
		_currentRightIndex: -1,
		leftCompare: null,
		rankingInProgress: false,
		
		getRankingInProgress: function ()
		{
			return service.rankingInProgress;
		},
		
		getLeftCompare: function ()
		{
			return service.leftCompare;
		},
		
		selectLeft: function ()
		{
			service.rankingInProgress = true;

			PreferenceList.addAnswer(-1);
			service.presentCardsForComparison();

			//console.log(service.getDebugInfo(true));
		},
		
		skipLeft: function ()
		{
			service.rankingInProgress = true;

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
			service.rankingInProgress = true;

			PreferenceList.addAnswer(1);
			service.presentCardsForComparison();

			//console.log(service.getDebugInfo(true));
		},
		
		skipRight: function ()
		{
			service.rankingInProgress = true;

			var skippedCharacter = service._rankedCharacters.splice(service._currentRightIndex, 1).pop();
			
			skippedCharacter.skip = true; // If the checkbox was actually working properly, this wouldn't really be necessary, but oh well
			service._discardedCharacters.push(skippedCharacter);
			PreferenceList.addAnswer(0);
			service.presentCardsForComparison();
		},

		_initializeRankMode: function ()
		{
			service.mode = Mode.Rank;
			
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
		},

		startRankMode: function()
		{
			// Display the Ranking Container
			service._initializeRankMode();

			// Reset the arrays and all data
			service._rankedCharacters.length = 0;
			service._discardedCharacters.length = 0;

			var totalCharacters = service.characters.length;

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

		pauseRankMode: function ()
		{
			service._rankingContainer.style.display = '';

			if (service.rankingInProgress)
			{
				PreferenceList.pause();

				var sortedIndices = PreferenceList.getOrder();
				PreferenceList.sortIndices(); // "Sort" them so if the user messes around with skip we can set the flag on the correct index

				var total = sortedIndices.length;
				var newCharacters = [];

				for (var i = 0; i < total; i++)
				{
					newCharacters.push(service._rankedCharacters[sortedIndices[i]]);
				}

				// Splice out the characters that were sorted, then add the remaining non-ranked after that
				sortedIndices.sort((a, b) => a - b);

				for (var i = total - 1; i >= 0; i--)
				{
					service._rankedCharacters.splice(sortedIndices[i], 1);
				}

				newCharacters.push(...service._rankedCharacters);
				newCharacters.push(...service._discardedCharacters);

				service.updateAll(newCharacters);
			}

			service.toggleMode();
		},

		resumeRankMode: function ()
		{
			service._initializeRankMode();

			// Reset the arrays and all data again
			service._rankedCharacters.length = 0;
			service._discardedCharacters.length = 0;
			
			var totalCharacters = service.characters.length;

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

			PreferenceList.resume(service._rankedCharacters.length);
			service.presentCardsForComparison();
		},

		endRankMode: function ()
		{
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

			service.rankingInProgress = false;
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
		},

		dragAndDropSortEnd: function (event)
		{
			if (service.rankingInProgress)
			{
				var oldIndex = event.oldIndex;
				var newIndex = event.newIndex;
				var sortedTotal = PreferenceList.indices.length;
				var currentInProgressIndex = PreferenceList.getIndexOfCurrentInProgress();

				// The PreferenceList service needs to be updated if the character was outside the range of the PreferenceList's indices and is now inside or if the character was inside the indices
				var characterWasOutside = (oldIndex >= sortedTotal);
				var characterWasInside = (oldIndex < sortedTotal);
				var characterIsNowOutside = (newIndex >= sortedTotal);
				var characterIsNowInside = (newIndex < sortedTotal);
				var currentInProgressIsInside = (currentInProgressIndex < sortedTotal);
				
				var preferenceListNeedsUpdate = ((characterWasOutside && characterIsNowInside) || characterWasInside);

				if (preferenceListNeedsUpdate)
				{
					if (characterWasInside)
					{
						if (characterIsNowInside)
						{
							if (currentInProgressIsInside)
							{
								if (oldIndex === currentInProgressIndex) // If they moved the character that was in progress when they paused it
								{
									// Accept their decision and move on to the next character
									PreferenceList.moveToNext();
								}
								else if (oldIndex < currentInProgressIndex) // If they moved a character ranked higher than the character in progress when they paused it
								{
									if (newIndex >= currentInProgressIndex) // If the moved character is now ranked lower than the in progress character
									{
										PreferenceList.incrementCurrentInProgressRank();
									}
								}
								else if (oldIndex > currentInProgressIndex) // If they moved a character ranked lower than the character in progress when they paused it
								{
									if (newIndex <= currentInProgressIndex) // If the moved character is now ranked higher than the in progress character
									{
										PreferenceList.decrementCurrentInProgressRank();
									}
								}
							}
						}
						else if (characterIsNowOutside)
						{
							PreferenceList.removeIndex(oldIndex, false);

							if (currentInProgressIsInside)
							{
								if (oldIndex === currentInProgressIndex) // If they moved the character that was in progress when they paused it
								{
									PreferenceList.moveToNext();
								}
								else if (oldIndex < currentInProgressIndex) // If they moved a character ranked higher than the character in progress when they paused it
								{
									PreferenceList.incrementCurrentInProgressRank();
								}
							}
						}
					}
					else if (characterWasOutside)
					{
						if (characterIsNowInside)
						{
							PreferenceList.addIndex(newIndex);

							if (currentInProgressIsInside)
							{
								if (newIndex <= currentInProgressIndex) // If they moved the character to a higher rank than the character in progress when they paused it
								{
									PreferenceList.decrementCurrentInProgressRank();
								}
							}
							else
							{
								// moveToNext will handle the new indices array size
								PreferenceList.moveToNext();
							}
						}
					}
				}
			}
		},

		handleSkippedCharacter: function (skipIndex)
		{
			if (service.mode === Mode.Edit && service.rankingInProgress)
			{
				// This happens before the check reaches the character, so the character's skip attribute will be the inverse of what it's about to be
				var isSkipping = !(service.characters.skip);
				var sortedTotal = PreferenceList.indices.length;

				var characterWasOutside = (skipIndex >= sortedTotal);
				var characterWasInside = (skipIndex < sortedTotal);

				if (characterWasOutside)
				{
					// Don't need to do anything special
				}
				else if (characterWasInside)
				{
					PreferenceList.markForSkip(skipIndex, isSkipping);
				}
			}
		},

		handleDeletedCharacter: function (deleteIndex)
		{
			if (service.mode === Mode.Edit && service.rankingInProgress)
			{
				var sortedTotal = PreferenceList.indices.length;

				var characterWasOutside = (deleteIndex >= sortedTotal);
				var characterWasInside = (deleteIndex < sortedTotal);

				if (characterWasOutside)
				{
					// Don't need to do anything special
				}
				else if (characterWasInside)
				{
					PreferenceList.removeIndex(deleteIndex, true);
				}
			}
		},
		
		// To call from the console: console.log(angular.element(document.body).injector().get('Characters').getDebugInfo(false))
		// This may not be 100% correct or easy to understand.
		getDebugInfo: function (isRanking)
		{
			var arrayToUse = service.characters;
			
			if (isRanking)
			{
				arrayToUse = service._rankedCharacters;
			}
			
			var indices = PreferenceList.indices;
			var indicesTotal = indices.length;
			var outputString = 'PreferenceList'
				+ '\n\tsize: ' + PreferenceList.size
				+ '\n\tcurrentIndex: ' + PreferenceList.currentIndex + ': ' + arrayToUse[PreferenceList.currentIndex].name + '\t\tLeft. This is the character being placed. Pause Note: This does not get updated until resume'
				+ '\n\tmin: ' + PreferenceList.min + ': ' + arrayToUse[PreferenceList.indices[PreferenceList.min].index].name
				+ '\n\tcenterIndex: ' + PreferenceList.centerIndex + ': ' + arrayToUse[PreferenceList.indices[PreferenceList.centerIndex].index].name + '\t\tRight.';
				
				if (PreferenceList.max < PreferenceList.indices.length)
				{
					outputString += '\n\tmax: ' + PreferenceList.max + ': ' + arrayToUse[PreferenceList.indices[PreferenceList.max].index].name;
				}
				else
				{
					outputString += '\n\tmax: ' + PreferenceList.max + ': ' + arrayToUse[PreferenceList.max].name;
				}

				outputString += '\n\tlastCompare: ' + PreferenceList.lastCompare + ': ' + arrayToUse[PreferenceList.indices[PreferenceList.lastCompare].index].name + '\t\tThis is the last character being compared against for resume purposes'
				+ '\n\tindices:';
			
			for (var i = 0; i < indicesTotal; i++) {
				var index = indices[i];

				if (!index.skip) {
					outputString += '\n\t\t' + i + ' (actual: ' + index.index + '): ' + arrayToUse[index.index].name;
				}
			}
			
			return outputString;
		}
	};
	
	return service;
}]);
