# filtaquilla-mailbox-opener-js: a FiltaQuilla "open mail folder on receiving mail" Javascript Action script

Among the many things the late, lamented Eudora email client spoiled me for was, when I checked my mail, opening all the mailboxes that had received mail in new windows. That way I could click through, looking at each mail window and closing it when I was done, and be sure I had seen all my new mail. 

This is a javascript you can paste into the FiltaQuilla addon's "Javascript Action" filter action which brings this behavior to Thunderbird. 

Requires ThunderBird 115 and the FiltaQuilla addon (https://addons.thunderbird.net/en-US/thunderbird/addon/filtaquilla/)

This script should be pasted into the "Javascript Action" action provided by Thunderbird's FiltaQuilla plugin. When executed, it will attach a folder listener to all your mail folders. That folderListener will look at any mail folder a message is added too, then check to see if that mail folder is currently open in the first tab of any open window. If not, it will open a new window to that mailbox.

For purposes of tracking whether an email is in its original folder or has been moved, it also adds a "x-first-folder-URI" header to any mail it filters, if there is not already one, listing the current folder. This way you can see and filter on emails that, say, came in to the Inbox, but are now in a different folder.

Recommended use is to have a filter set to act on any email with a status of New, which executes the "Javascript Action" action containing this script on matching emails, with no other actions.

Note that folders are NOT directly opened by this script. This filter merely attaches a folderListener to all folders, which is a set of functions that the folders trigger themselves when they see emails have moved too or from them. Setting the  "x-first-folder-URI" header, if necessary, is the only thing this script actually does with whatever emails it filters. 

Planned feature: an optional list of folders to exclude. Right now Spam, Trash, Drafts, etc. all open when things filter into them. I'll fix this in an upcoming version. 

Further notes & tips, primarily intended for developers, are at bottom in this script source.

All rights reserved, see attached license file for specifics. 

Be excellent to each other. 

# I am
Michael E. Kupietz, software engineering, consulting, & support for FileMaker Pro, Full-Stack Web, Desktop OS, & TradingView platforms  
https://kupietz.com (Business info)  
https://github.com/kupietools (Free software)  
https://michaelkupietz.com (Personal & creative showcase)  

