# Mudae Ranker
 Preference-based Mudae harem ranking app

## Summary
Original concept by: [DarkMage530](https://github.com/jonmervine)

Intended for use with the [Mudae bot for Discord](https://discordbots.org/bot/432610292342587392)

This app will allow you to sort your harem based on a series of "x vs y" questions. You will be presented with two characters and asked which one you prefer. When you have completed answering all of the questions, your harem will be sorted based on your responses. It will then generate the commands you need to run in order to sort your harem on Discord

This is something I threw together in my free time, I can't promise that it will be bug free or that every exception case will be handled. Please review the Issues section to see if there's any feature that's not working that you should be aware of. 

Note that this was implemented before the i- option was available, so if the instructions below reference Anilist a lot or in a seemingly strange why, that's why.

## Basic Instructions
This will walk you through importing your first batch of characters, sorting them, and then exporting the sort commands. To get started, simply download the project and open index.html in your browser.
1. Run **$mmai-s** in Discord.
   - **_NOTE_**: You will be spammed with direct messages from your maid (or Mudae if you don't have a maid) for every character in your harem, so the larger your harem is, the more spam you'll get.
2. Copy all of the series and character information from the direct message.
   - Do not copy the harem title or any other information.
   - Example:
     ```
     Tales of Zestiria - 1/12 
     Edna - https://imgur.com/UAofYTG.jpg
     Re:Zero kara Hajimeru Isekai Seikatsu - 2/48 
     Rem (RZ) - https://imgur.com/J7aspQh.gif.gif
        Ram | 🤷 - https://imgur.com/P9UzNXd.jpg
     
     Captain Toad: Treasure Tracker - 1/1 
        Captain Toad | Should be in Smash Bros - https://imgur.com/lLfBPIK.jpg
     ```
3. Paste the copied information into the input field
4. Click **Parse Input**
   - At this point, you should see a bunch of thumbnails pop up
   - If you accidentally ran $mmas instead of $mmai-s, or if an image is not available for a character for some reason, the image should load afterward after being looked up from [Anilist](https://anilist.co/), see the **Anilist** section below for some details related to character lookups.
5. Once the images are finished showing up, you can click on any thumbnail to view the full card for that character. See the **Character Card** section below for details on what is available on the card.
   - You can also drag individual characters around to resort them manually
6. At any point, you can click **Export All Characters** to export a dump of the characters that can be re-imported later. This is highly recommended as it will save all of the image paths for each character, meaning the next time you import, it will not have to look the characters up from Anilist and will be much faster. I recommend saving the dump to a text file with Unicode encoding.
7. When you're ready, click **Start Ranking**.
8. The ranking pop up will show you two characters. Click on the one that you prefer.
   - Note that you can also click the "Skip" button for a character, this will remove the character from the ranking process and throw them at the end of the list. If you want to bring them back, you will have to stop ranking and turn skip back off for them (see **Character Card**)
   - To stop ranking midway, simply click the ❎ in the popup. The **Resume Ranking** button will enable, allowing you to pick back up from where you left off (see **Important Notes** below).
9. After you have ranked all characters, the popup will go away and your harem should now be sorted based on your preferences.
   - It's highly recommended that you click **Export All Characters** at this point so you can import them in the same order they're in now that you've sorted them.
10. Now you can click **Generate Sort Commands** and the list of commands you need to run to sort your harem on Discord will be shown.

## Character Card
Full character cards have the following information and controls:
- Information
  - The character's name as shown in Mudae
  - The series the character is from as show in Mudae
  - A picture of the character
  - The url of the picture shown
- Controls
  - ❎ - Close the card
  - "Skip?" - If you check this, the card will turn red and the character will not be included in the ranking process. Usually you will do this for characters you have simply for trading or cleaning purposes.
  - 🗑️ - Delete the character. This will remove them from the list of characters and you will either have to add them back in with the 🆕 button (see **Adding New Characters**), with a merge (see **Merging Instructions**), or by starting over with your last $mmas dump or Mudae Ranker export.

## Merging Instructions
Claimed a bunch of characters and didn't keep your Mudae Ranker data up-to-date? Shame shame. But hey, that's what merging is for.
1. Paste your previously saved data into the input field, then click **Parse Input**
2. Run **$mmai-s** and copy the entire dump just like you did the first time you imported your harem
3. All new characters will be added and looked up from Anilist if necessary
   - As a bonus, characters that do not have their images set will also be looked up on Anilist on the off chance that something has changed and their images can be found now. It is actually possible for this to happen!
4. At this point, you can export the characters, go through the process of ranking, or do whatever.

## Adding New Characters
Sometimes you just want to add a single new character to your harem and don't feel like using the merge functionality. That's what the 🆕 button is for!
1. Click the 🆕 button, a popup will display with fields for you to fill out
2. Fill out the details, copying them from Mudae as they'd show up if you used the **$im** command on the character
3. Click the ✅ button when you're done to save the character, it will be added to the end of the list

## Anilist
Anilist is the fallback for character image lookups. It was necessary prior to the implementation of the i- option since there was no way to get the images for each character. Most images from Anilist are the same size as the images from Mudae, so they work well for the purpose of this app. There are some limitations when using the Anilist API, so I'll explain those below and their effects on the Mudae Ranker app.
- Anilist has a limit of 90 requests per minute. I limited the requests to 75 per minute just to be safe. This is one of the biggest slowdowns when it comes to populating the images from Anilist.
- Requests to Anilist are done by series, and up to 25 characters will be brought back for a series in one request. It's not guaranteed that all characters you own for a series will come back in the first request, so sometimes you need to make additional requests to pull back additional characters for a series.
- Anilist's query functionality can be really strange, so it may not return results for all series. Sometimes, even if a series is on Anilist, the top result when searching for that series name will be something completely different, in which case the character's images won't be populated.
- Anilist breaks down series a bit differently from Mudae. For example, Mudae lists Sinon as being from "Sword Art Online", but Anilist lists her as being from "Sword Art Online II", so her image lookup fails.
- Sometimes Anilist spells characters differently from Mudae. For example, Anilist might have "Lelei la Lelena" instead of "Lelei la Lalena", "Kisara Tendo" instead of "Kisara Tendou", or "Asuna Yuuki" instead of "Asuna". This app tries to handle most of the differences, but it can't catch every case. If you see a case that you think would be easy to handle, feel free to submit an Issue **with** the algorithm to resolve the difference.
- Finally, some series aren't on Anilist, especially when it comes to games, so images will not be returned for those.

## Important Notes
- Make sure you don't save your exports with ANSI encoding, it's entirely possible they could have special characters that will get lost if you save with the wrong encoding, and that would cause bad things.
- If you have your harem sorted before you go into this app and you're worried about something getting messed up, I recommend importing from $mmas and then immediately using the Export All Characters button to get your save dump followed by the Generate Sort Commands button to get your sort commands.
- Stopping ranking midway triggers the most complicated state of this app. If any bugs are going to show up, this is where I expect them to show. If you like to read (there will be no tl;dr), here's an attempted explanation of what's going on behind the scenes and what you can expect:
  - You can think of your characters as being split up into two different lists, the ranked characters and the unranked characters.
  - Ranked characters ones that you specifically made a decision on by clicking on them in the ranking popup, whereas unranked are all the rest
  - When you stop ranking, all of the ranked characters are going to be placed at the front of the list
  - Since you'll be back in "edit mode", you'll be able to drag characters around, mark them as skip, and delete them. I'll refer to these three operations as re-sorting the character.
  - If you re-sort unranked characters and all of your re-sorts are purely outside of the ranked characters, everything is fairly safe.
  - If you re-sort unranked characters into the middle of ranked characters, re-sort ranked characters within themselves, or re-sort ranked characters out into the unranked characters, this is where it gets complicated.
  - At any given time as you rank characters, there is one particular character that the app is trying to get you to rank. If you made at least one decision on that character, they become the special "in-progress" character.
  - If you drag and drop the in-progress character within the ranked characters, the app will accept your decision as deliberate and will move on to the next character once you resume ranking.
  - If you move an unranked character into the ranked characters, it will become a ranked character, the app will accept your decision as deliberate and will either continue with the in-progress character or will grab the next character for ranking once you resume ranking.
  - If you move a ranked character into the unranked characters, it will become an unranked character and you will be shown that character again later on.
