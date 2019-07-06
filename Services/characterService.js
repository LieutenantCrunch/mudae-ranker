mudaeRanker.service('Characters', ['$rootScope', 'Mode', 'PreferenceList', function($rootScope, Mode, PreferenceList) {
	var service = {
		characters: [],

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

		activeIndex: -1,

		blockingDiv: null,

		getCharacters: function () {
			return service.characters;
		},

		clean: function () {
			service.characters.length = 0;
			return service.characters;
		},

		addCharacter: function (character) {
			service.characters.push(character);
		},

		addNewCharacter: function (characterName, seriesName, imageUrl, skip) {
			var character = { 
				className: 'CharacterThumb',
				name: characterName, 
				minimizedName: service.minimizeName(characterName),
				series: seriesName, 
				imageUrl: imageUrl, 
				skip: skip 
			};

			service.characters.push(character);
		},

		updateAll: function (newCharacters) {
			service.characters.length = 0; // Clean the existing array
			service.characters.push(...newCharacters); // Push all new records. This can cause problems if newCharacters.length > 100000
			$rootScope.$apply();
		},
		
		updateCharacterImage: function (index, source)
		{
			service.characters[index].imageUrl = source;
			$rootScope.$apply();
		},

		removeCharacter: function (name, series) {
			var totalCharacters = service.characters.length;
			var characterRemoved = false;

			for (var i = 0; i < totalCharacters; i++)
			{
				var aCharacter = service.characters[i];
				if (aCharacter.name == name && aCharacter.series == series)
				{
					service.characters.splice(i, 1);
					characterRemoved = true;
					break;
				}
			}
		},
		
		exportJson: function (element)
		{
			if (element.tagName)
			{
				var anElementTagName = element.tagName.toUpperCase();
				
				if (anElementTagName == 'TEXTAREA' || (anElementTagName == 'input' && element.type.toUpperCase == 'text'))
				{
					element.value = angular.toJson(service.characters);
				}
			}
		},

		exportSort: function (element)
		{
			var chars = service.characters;
			var total = chars.length;

			if (total > 0)
			{
				var output = '$firstmarry ' + chars[0].name + '\n';
				
				if (total > 1)
				{
					output += '$sortmarry pos ' + chars[0].name

					for (var i = 1; i < total; i++)
					{
						if (i % 20 === 0)
						{
							output += '\n$sortmarry pos ' + chars[i-1].name + '$' + chars[i].name;
						}
						else
						{
							output += '$' + chars[i].name;
						}
					}
				}
				
				if (element.tagName)
				{
					var anElementTagName = element.tagName.toUpperCase();
					
					if (anElementTagName == 'TEXTAREA' || (anElementTagName == 'input' && element.type.toUpperCase == 'text'))
					{
						element.value = output;
					}
				}
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
			else if (service.mode === Mode.Rank)
			{
				var answer = (index === service._currentLeftIndex ? -1 : 1);

				PreferenceList.addAnswer(service._currentLeftIndex, service._currentRightIndex, answer);

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
			}
		},

		minimizeName: function (name)
		{
			/*
			Anilist doesn't support double vowels.
			In order to try to have fast string comparisons when trying to match Mudae names with Anilist names, I'll do the following:
			1: Eliminate all double characters - replace(/(.)\1/gi, '$1') - finds any character followed by itself, replace with the matched character
			2: Replace all instances of 'ou' with 'o'
			3: Eliminate all spaces
			4: Convert the name to all caps
			*/
			return name.replace(/(.)\1/gi, '$1').replace(/ou/gi, 'o').replace(/ /g, '').toUpperCase();
		},

		_rankedCharacters: [],
		_discardedCharacters: [],
		_rankingCardContainer: null,
		_rankingContainer: null,
		_currentLeftIndex: -1,
		_currentRightIndex: -1,
		
		endRankMode: function()
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
				newCharacters.push(service.characters[sortedIndices[i]]);
			}

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

			var displayCards = PreferenceList.getQuestion();

			if (displayCards)
			{
				service.presentCardsForComparison(displayCards.leftCompareIndex, displayCards.rightCompareIndex);
			}
			else
			{
				service.endRankMode(); // Or do something else?
			}
		},
		
		presentCardsForComparison: function (leftIndex, rightIndex)
		{
			service._currentLeftIndex = leftIndex;
			service._currentRightIndex = rightIndex;

			// Bug: This will give us the index for the entire set of characters, not just for the ranked characters
			var leftCharacterClone = $('*[data-character-index="' + leftIndex + '"]')[0].cloneNode(true);
			var rightCharacterClone = $('*[data-character-index="' + rightIndex + '"]')[0].cloneNode(true);

			leftCharacterClone.className += ' CharacterFull';
			rightCharacterClone.className += ' CharacterFull';

			service._rankingCardContainer.appendChild(leftCharacterClone);
			service._rankingCardContainer.appendChild(rightCharacterClone);

			angular.element(leftCharacterClone).on('click', function(event) {
				service.clickCard(this, leftIndex);
			});

			angular.element(rightCharacterClone).on('click', function(event) {
				service.clickCard(this, rightIndex);
			});
		}
	};
	
	return service;
}]);