# Mudae Ranker
 Preference-based Mudae harem ranking app

## Summary
Original concept by: [DarkMage530](https://github.com/jonmervine)

Intended for use with the [Mudae bot for Discord](https://discordbots.org/bot/432610292342587392)

This app will allow you to sort your harem based on a series of "x vs y" questions. You will be presented with two characters and asked which one you prefer. When you have completed answering all of the questions, your harem will be sorted based on your responses. It will then generate the commands you need to run in order to sort your harem on Discord

This is something I threw together in my free time, I can't promise that it will be bug free or that every exception case will be handled. Please review the Issues section to see if there's any feature that's not working that you should be aware of.

## Instructions
1. Run **$mmas** in Discord.
   - **_NOTE_**: You will be spammed with direct messages from your maid (or Mudae if you don't have a maid) for every character in your harem, so the larger your harem is, the more spam you'll get.
2. Copy all of the series and character information from the direct message.
   - Do not copy the harem title or any other information.
   - Example:
     ```
     Tales of Zestiria - 1/12 
     Edna
     Re:Zero kara Hajimeru Isekai Seikatsu - 2/48 
     Rem (RZ)
        Ram | 🤷
     
     Captain Toad: Treasure Tracker - 1/1 
        Captain Toad | Should be in Smash Bros
     ```
3. Paste the copied information into the input field
4. Click **Parse Input**
   - At this point, you should see a bunch of thumbnails pop up and the images should start loading from the end
   - All character images are initially looked up from [Anilist](https://anilist.co/), see the Anilist section below for some details related to character lookups.
5. Once the images are finished showing up, you can click on any thumbnail to view the full information for that character, and you can also change or set an image for the character if you'd like.
6. At any point, you can click **Export All Characters** to export a dump of the characters that can be re-imported later. This is highly recommended as it will save all of the image paths for each character, meaning the next time you import, it will not have to look the characters up from Anilist and will be much faster.
7. When you're ready, click **Rank Mode**.
8. The ranking pop up will show you two characters. Click on the one that you prefer. Keep doing this until the ranking popup goes away.
9. Your harem should now be sorted based on your preferences.
   - It's highly recommended that you click **Export All Characters** at this point so you can import them in the same order they're in now that you've sorted them.
10. Now you can click **Generate Sort Commands** and the list of commands you need to run to sort your harem on Discord will be shown.

## Anilist
You may wonder why not all characters have images, why the images are different from what you see on Discord, or why it takes so long for all of the images to show up when you parse your $mmas dump the first time. This is because Mudae does not have an API, so all characters have to be looked up somewhere in order to get images for them. Fortunately, Anilist provides an API to request animanga characters and the images for them, and it seems as though some of Mudae's images were ripped from Anilist (or vice versa... but I doubt it), so it works well for populating the images. There are some limitations when using the Anilist API, so I'll explain those below and their effects on the Mudae Ranker app.
- Anilist has a limit of 90 requests per minute. In v1.0 I limited the requests to 75 per minute just to be safe. This is one of the biggest slowdowns when it comes to populating the images the first time.
- Requests to Anilist are done by series, and up to 25 characters will be brought back for a series in one request. It's not guaranteed that all characters you own for a series will come back in the first request, so sometimes you need to make additional requests to pull back additional characters for a series.
- Anilist's query functionality can be really strange, so it may not return results for all series. Sometimes, even if a series is on Anilist, the top result when searching for that series name will be something completely different, in which case the character's images won't be populated.
- Anilist breaks down series a bit differently from Mudae. For example, Mudae lists Sinon as being from "Sword Art Online", but Anilist lists her as being from "Sword Art Online II", so her image lookup fails.
- Sometimes Anilist spells characters differently from Mudae. For example, Anilist might have "Lelei la Lelena" instead of "Lelei la Lalena", "Kisara Tendo" instead of "Kisara Tendou", or "Asuna Yuuki" instead of "Asuna". This app tries to handle most of the differences, but it can't catch every case. If you see a case that you think would be easy to handle, feel free to submit an Issue **with** the algorithm to resolve the difference.
- Finally, some series aren't on Anilist, especially when it comes to games, so images will not be returned for those.
