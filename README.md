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
   - All characters are looked up from [Anilist](https://anilist.co/), which has a limit of 90 requests per minute. In v1.0 I limited the requests to 40 per minute just to be safe. Requests are done by series, so multiple characters can be brought back at once.
   - Anilist's query functionality can be really strange, so it may not return results for all series. Additionally, sometimes Anilist spells characters differently from Mudae (Ex: Lelei la Lelena vs Lelei la Lalena). This app tries to handle some of the differences, but it can't catch every case. Finally, some series aren't on Anilist, especially when it comes to games, so images will not be returned for those.
5. Once the images are finished showing up, you can click on any thumbnail to view the full information for that character, and you can also change or set an image for the character if you'd like. **_SKIP DOES NOT WORK, DON'T USE IT_**
6. At any point, you can click **Export All Characters** to export a dump of the characters that can be re-imported later. This is highly recommended as it will save all of the image paths for each character, meaning the next time you import, it will not have to look the characters up from Anilist and will be much faster.
7. When you're ready, click **Rank Mode**.
8. The ranking pop up will show you two characters. Click on the one that you prefer. Keep doing this until the ranking popup goes away.
9. Your harem should now be sorted based on your preferences.
   - It's highly recommended that you click **Export All Characters** at this point so you can import them in the same order they're in now that you've sorted them.
10. **_DON'T ACTUALLY DO THIS YET, IT'S NOT WORKING_** Now you can click **Generate Sort Commands** and the list of commands you need to run to sort your harem on Discord will be shown.
