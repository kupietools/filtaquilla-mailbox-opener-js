    /* FiltaQuilla "open mail folder on receiving mail" Javascript Action script 
     * 
     * Among the many things the late, lamented Eudora email client spoiled me for was, when I checked my mail, opening all 
     * the mailboxes that had received mail in new windows. That way I could click through, looking at each mail window and 
     * closing it when I was done, and be sure I had seen all my new mail. 
     * 
     * This is a javascript you can paste into the FiltaQuilla addon's "Javascript Action" filter action which brings this 
     * behavior to Thunderbird. 
     *
     * Requires ThunderBird 115 and the FiltaQuilla addon (https://addons.thunderbird.net/en-US/thunderbird/addon/filtaquilla/)
     * 
     * This script should be pasted into the "Javascript Action" action provided by Thunderbird's FiltaQuilla plugin. When 
     * executed, it will attach a folder listener to all your mail folders. That folderListener will look at any mail folder a 
     * message is added too, then check to see if that mail folder is currently open in the first tab of any open window. If not, 
     * it will open a new window to that mailbox.
     *
     * For purposes of tracking whether an email is in its original folder or has been moved, it also adds a "x-first-folder-URI" 
     * header to any mail it filters, if there is not already one, listing the current folder. This way you can see and filter on 
     * emails that, say, came in to the Inbox, but are now in a different folder.
     *
     * Recommended use is to have a filter set to act on any email with a status of New, which executes the "Javascript Action" 
     * action containing this script on matching emails, with no other actions.
     *
     * Note that folders are NOT directly opened by this script. This filter merely attaches a folderListener to all folders, which 
     * is a set of functions that the folders trigger themselves when they see emails have moved too or from them. Setting the  
     * "x-first-folder-URI" header, if necessary, is the only thing this script actually does with whatever emails it filters. 
     *
     *
     * Further notes & tips, primarily intended for developers, are at bottom.
     * 
     * Be excellent to each other. 
     *
     * Michael Kupietz
     * FileMaker Pro Consulting + More: https://kupietz.com
     * Art & Hobbies: https://michaelkupietz.com
     *
     */


//USER SETTINGS:

const folderNamesToSkip = [/Trash$/,/Spam$/,/Drafts$/]; //regexs of folder names not to open if they receive new messages
const debuggingDefault = false; //default to debugging messages on or off when script runs for the first time in a session

//END USER SETTINGS



var theGlobal = Services.appShell.hiddenDOMWindow;

if (typeof msgHdrs == "undefined") {
    var msgHdrs = [];
} //so can be run from console


//Assign x-first-folder-URI header if none:
for (let index = 0; index < msgHdrs.length; index++) {
    let hdrs = msgHdrs.queryElementAt ? msgHdrs.queryElementAt(index, Ci.nsIMsgDBHdr) : msgHdrs[index]; //Ci = Components.interfaces

    if (hdrs.getStringProperty("x-first-folder-URI") == "") {
        hdrs.setStringProperty("x-first-folder-URI", hdrs.folder.URI);
    }

}

/* Make sure functions exist in global context */

//first, create the basic object to hold them if it doesn't exist
if (typeof theGlobal.fqWO == "undefined") {
    theGlobal.fqWO = {};
}

//create debug logging setting if it doesn't exist
if (typeof theGlobal.fqWO.debug == "undefined") {
    theGlobal.fqWO.debug = debuggingDefault;
}

//create debugwarn logging function if it doesn't exist
if (typeof theGlobal.fqWO.debugwarn == "undefined") {
    theGlobal.fqWO.debugwarn = (function(...theLog) {
        if (Services.appShell.hiddenDOMWindow.fqWO.fqDebug) {
            console.warn(theLog);
        }
    });
}

//create mailfolder listener's message removal action if it doesn't exist
if (typeof theGlobal.fqWO.onMessageRemoved == "undefined") {
    theGlobal.fqWO.onMessageRemoved = (function(parentItem, item) {
        var debugwarn = Services.appShell.hiddenDOMWindow.fqWO.debugwarn;
        debugwarn("START ------------------------------------------");
        debugwarn("ItemRemoved- parentItem", parentItem.URI, parentItem, "Item", item.author, item.subject, item);
    });
}

//create mailfolder listener's message addition action if it doesn't exist
if (typeof theGlobal.fqWO.onMessageAdded == "undefined") {
    theGlobal.fqWO.onMessageAdded = (function(parentItem, item) {
        var theGlobal = Services.appShell.hiddenDOMWindow;
        var debugwarn = Services.appShell.hiddenDOMWindow.fqWO.debugwarn;
        debugwarn("ItemAdded BEGIN - parentItem", parentItem.URI, parentItem, "Item", item.author, item.subject, item);
        draftPropertyIndex = [...item.properties].indexOf("x-mozilla-draft-info");
        //note: properties was propertyEnumerator prior to TB 115
        debugwarn("OPENER - draft property index", draftPropertyIndex);
        if (draftPropertyIndex == -1) {
            debugwarn("OPENER - starting non-draft (-1) conditional code block");
            var theOpenWins = [];
            var theWins = [...Services.wm.getEnumerator("")];
            for (i in theWins) {
                if (theWins[i].document.URL == "chrome://messenger/content/messenger.xhtml") {
                    theOpenWins.push(theWins[i].GetSelectedMsgFolders()[0].URI);
                }
            };
            var theFound = theOpenWins.some(windowx => windowx == parentItem.URI);
            debugwarn("theOpenWins", theOpenWins);
            debugwarn("theWins", theWins);
            debugwarn("theFound", theFound);
            
            const shouldBeSkipped = folderNamesToSkip.some(rx => rx.test(parentItem.URI));

            if (theFound != true && !shouldBeSkipped ) {
                //   if (typeof theGlobal.fqWO.frontmostWindow == "undefined") {
                //                    theGlobal.fqWO.frontmostWindow = {};
                // }
                //don't know why needed to initialize it...
                theGlobal.fqWO.frontmostWindow = Services.ww.activeWindow;

                debugwarn("OPENER - Primary app window is: title", theGlobal.fqWO.frontmostWindow.location.title, "window object", theGlobal.fqWO.frontmostWindow, "message string properties are", [...item.properties]);
               
                debugwarn("OPENER - parentItem (parent folder passed to event handler)", parentItem);
                
/* IS THIS REALLY NEEDED? disabling. Watch out for problems and reenable if spot any.
                try {
                    Services.wm.getMostRecentWindow("").open("", parentItem.URI, "chrome=yes,toolbar=yes,status=yes").close();
                    debugwarn("OPENER - closed ok");
                } catch (openerr) {
                    debugwarn("OPENER - error on close ", openerr);
                }
                debugwarn("OPENER - opening target window");
                */
                var newwin = Services.wm.getMostRecentWindow("").openDialog("chrome://messenger/content/messenger.xhtml", parentItem.URI, "chrome=yes,toolbar=yes,status=yes", parentItem.URI);
                newwin.addEventListener('pageshow', function(e) {
                    theGlobal.fqWO.frontmostWindow.focus();
                    //return focus to the page the was last in front when new window loads
                });
                debugwarn("OPENER - opened window - newwin title", newwin.location.title, "newwin object", newwin, "parentItem.URI", parentItem.URI);
                //newwin.goDoCommand("cmd_toggleMessagePane")
                try {
                    newwin.gMessagePaneWrapper.collapsed = true;
                } catch (e) {
                    debugwarn("OPENER - collapsing message pane failed", e);
                }
                try {
                    theGlobal.fqWO.frontmostWindow.focus();
                    debugwarn("OPENER - focused", theGlobal.fqWO.frontmostWindow.document.title, "focused window is now", Services.ww.activeWindow.document.title);
                } catch (e) {
                    debugwarn("OPENER - focus failed", e);
                }
                debugwarn("OPENER - END parentItem", parentItem.URI, parentItem, "item", item.author, item.subject, item);
                debugwarn("END ------------------------------------------");
            } else {
                debugwarn("window already open");
            }
        } else {
            debugwarn("OPENER - skipped folder listener, DRAFT parentItem", parentItem.URI, parentItem, "item", item.author, item.subject, item);
        }


    });
}

//create mailfolder listener object if it doesn't exist
if (typeof theGlobal.fqWO.folderListener == "undefined") {
    theGlobal.fqWO.folderListener = {
        onMessageRemoved: function(parentItem, item) {
            Services.appShell.hiddenDOMWindow.fqWO.onMessageRemoved(parentItem, item);
        },
        onMessageAdded: function(parentItem, item) {
            Services.appShell.hiddenDOMWindow.fqWO.onMessageAdded(parentItem, item);
        }
    };
}

//create theUpdateFunction() that handles attaching listeners to folders if it doesn't exist
if (typeof theGlobal.fqWO.theUpdateFunction == "undefined") {
    //call theGlobal.fqWO.theUpdateFunction() when you want the folder listeners updated
    theGlobal.fqWO.theUpdateFunction = (function() {

        var theGlobal = Services.appShell.hiddenDOMWindow;
        var folderListener = theGlobal.fqWO.folderListener;
        var notifyFlags = Components.interfaces.nsIFolderListener.added | Components.interfaces.nsIFolderListener.removed;
        MailServices.mailSession.RemoveFolderListener(folderListener);
        MailServices.mailSession.AddFolderListener(folderListener, notifyFlags);



    });
}

//if no flag indicating listeners have been updated, perform theUpdateFunction() and create flag indicating listeners have been updated
if (typeof theGlobal.fqWO.listenersUpdated == "undefined" || theGlobal.fqWO.listenersUpdated != "1") {
    theGlobal.fqWO.theUpdateFunction();
    theGlobal.fqWO.listenersUpdated = "1";
}

    /* NOTES & TIPS: 
     *
     * Manually trigger folderlisteners to be refreshed next time the script runs by setting 
     * Services.appShell.hiddenDOMWindow.fqWO.listenersUpdated = "" in console.
     *
     * You can individually update the following child objects of Services.appShell.hiddenDOMWindow.fqWO: 
     * debugwarn() - the function that logs to console if Services.appShell.hiddenDOMWindow.fqWO.fqDebug is true
     * folderListener - the complete TB folderListener javascript object attached to folders by theUpdateFunction()
     * onMessageAdded() - the function executed by folderListener when a message is added to a folder
     * onMessageRemoved() - the function executed by folderListener when a message is removed from a folder. Currently does nothing, 
     * just included for troubleshooting when logging is on
     * theUpdateFunction() - the function that assigns the folderListener object to mail folders
     * After updating any of the above, changes are immediate. The new functions will be used next time the script runs (either by 
     * being run by FiltaQuilla's "Javascript Action" action, or by pasting the whole script in at the console to run it manually.) 
     *
     * You can reset *everything* by entering "delete Services.appShell.hiddenDOMWindow.fqWO" at the console, and then, copying and 
     * pasting this whole script into the console to run it manually.  
     *
     * When you run this script manually in the console, it will return "1" if everything is basically fine (IE, no fatal syntax errors... 
     * if you make code changes, you may introduce small problems that won't be noticeable when you first run it, that's on you.)
     *
     * You can turn console debugging messages on by entering "Services.appShell.hiddenDOMWindow.fqWO.fqDebug = true" in the console 
     * after the script has run once. Turn it off by resetting everything as described above, or entering 
     * "Services.appShell.hiddenDOMWindow.fqWO.fqDebug = false" in the console.
     *
     *
     */
