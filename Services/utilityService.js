mudaeRanker.service('Utilities', ['$rootScope', '$timeout', function($rootScope, $timeout) {
	var service = {
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
		
		showError: function (errorString, concat)
		{
			var outputField = $('#OutputField')[0];
			
			if (outputField)
			{
				if (concat)
				{
					outputField.value = errorString + '\n\n' + outputField.value;
				}
				else
				{
					outputField.value = errorString;
				}

				outputField.className += ' FlashError';

				$timeout(function () { outputField.className = outputField.className.replace(' FlashError', ''); }, 1500, false);
			}
		},

		showSuccess: function (successString, concat)
		{
			var outputField = $('#OutputField')[0];
			
			if (outputField)
			{
				if (concat)
				{
					outputField.value = successString + '\n\n' + outputField.value;
				}
				else
				{
					outputField.value = successString;
				}

				outputField.className += ' FlashSuccess';

				$timeout(function () { outputField.className = outputField.className.replace(' FlashSuccess', ''); }, 1500, false);
			}
		},

		showWarning: function (warningString, concat)
		{
			var outputField = $('#OutputField')[0];
			
			if (outputField)
			{
				if (concat)
				{
					outputField.value = warningString + '\n\n' + outputField.value;
				}
				else
				{
					outputField.value = warningString;
				}

				outputField.className += ' FlashWarning';

				$timeout(function () { outputField.className = outputField.className.replace(' FlashWarning', ''); }, 1500, false);
			}
		},
		
		confirm: function (message, title)
		{
			return $.MessageBox({buttonDone: 'Yes', 
				buttonFail: 'No', 
				buttonsOrder: 'done fail', 
				message: message,
				title: title
			});
		}
	};
	
	return service;
}]);
