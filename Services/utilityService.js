mudaeRanker.service('Utilities', ['$rootScope', '$http', '$interval', 'Characters', function($rootScope, $http, $interval, Characters) {
	var service = {
		// Need to create an array of characters, not an array of series
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

		tryParseJson: function (text)
		{
			try
			{
				return JSON.parse(text);
			}
			catch (e)
			{
				return null;
			}
		},

		parseDiscordDump: function (inputText)
		{
			if (!inputText || inputText === '')
			{
				return;
			}

			var jsonInput = service.tryParseJson(inputText);
			
			if (jsonInput)
			{
				Characters.updateAll(jsonInput);
				return;
			}

			var initialText = inputText.replace(/\n\n/g,'\n') // Remove double newlines

			initialText = initialText.replace(/\[([1-9]|1[12]):([0-5][0-9]) [AP]M\] BOTMuda(e|maid)( \d+)?: /gi, ''); // Get rid of timestamps

			initialText = initialText.replace(/(.*) - \d+\/\d+/g, '$$$1'); // Clear the character counts on series and put a '$' before the series name for splitting
			
			var initialSeriesArray = initialText.split('$').slice(1); // Remove the first object in the array since it's an empty string
			var seriesLength = initialSeriesArray.length;
			var seriesArray = [];

			Characters.clean();
			
			for (var i = 0; i < seriesLength; i++)
			{
				var seriesData = initialSeriesArray[i].trim().split('\n');
				var seriesName = seriesData.splice(0,1)[0].trim();
				var series = { name: seriesName, characters: [], page: 1 };
				
				seriesArray.push(series);
				
				var charactersLength = seriesData.length;
				
				for (var j = 0; j < charactersLength; j++)
				{
					// Retain the optional series abbreviation this is stripping off on the character object
					// Example: Raven (GR), strip off "(GR)" and store it on the character so it can be displayed on the full card
					var characterName = seriesData[j].replace(/(?: \([A-Z]+\))?(?: \| .*)?/gi, '').trim();
					var character = { 
						className: 'CharacterThumb',
						name: characterName, 
						minimizedName: Characters.minimizeName(characterName),
						series: seriesName, 
						imageUrl: null, 
						skip: false 
					};
					
					Characters.addCharacter(character);
					series.characters.push(character);
				}
			}

			console.log('Parse Complete');
			
			service.anilistReqInterval = $interval(this.fetchSeries, 1500, 0, true, seriesArray);
			service.anilistReqInterval.then(this.intervalResolve, this.intervalReject);
		},
		
		intervalResolve: function ()
		{
			console.log('Interval Resolved');
		},
		
		intervalReject: function()
		{
			console.log('Interval Rejected (most likely this is due to it being cancelled, meaning the fetching is complete)');
		},

		fetchSeries: function (seriesArray)
		{
			var series = seriesArray.pop();
			var queryVariables = {seriesName: series.name, pageNumber: series.page};
			var queryBody = JSON.stringify({query: service.characterQuery, variables: queryVariables});

			$http.post(service.anilistApiUrl, queryBody, service.anilistConfig).then(function(response){
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
							characterFirstName = Characters.minimizeName(characterFirstName);
						}
					}

					if (characterLastName && characterLastName.length)
					{
						characterLastName = characterLastName.trim();
						
						if (characterLastName.length)
						{
							hasLastName = true;
							characterLastName = Characters.minimizeName(characterLastName);
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
								var alternativeName = Characters.minimizeName(alternativeNames[k]);
								
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
				
			}, function (response) {
				console.error(response);
			});
		}
		

		/* Example
		Ratchet & Clank - 1/4 
		   Clank (RC) | Fav Robots
		Re:Zero kara Hajimeru Isekai Seikatsu - 2/48 
		Rem (RZ)
		   Ram | Meh

		Saenai Heroine no Sodatekata - 1/10 
		   Utaha Kasumigaoka
		*/
	};
	
	return service;
}]);