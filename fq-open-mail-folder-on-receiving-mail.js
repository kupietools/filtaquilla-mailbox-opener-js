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

var foldersToSkip = [/Trash$/,/Spam$/,/Drafts$/]; //regexs of folder names not to open if they receive new messages
var debuggingMessagesDefault = false; //default to debugging messages on or off when script runs for the first time in a session

//END USER SETTINGS



var theGlobal = Services.appShell.hiddenDOMWindow;

/* Make sure functions exist in global context */

//first, create the basic object to hold them if it doesn't exist
if (typeof theGlobal.fqWO == "undefined") {
    theGlobal.fqWO = {};
}

//store foldersToSkip
theGlobal.fqWO.foldersToSkip = foldersToSkip;

//create debug logging setting if it doesn't exist
if (typeof theGlobal.fqWO.fqDebug == "undefined") {
    theGlobal.fqWO.fqDebug = debuggingMessagesDefault;
}

//create debugwarn logging function if it doesn't exist
if (typeof theGlobal.fqWO.debugwarn == "undefined") {
    theGlobal.fqWO.debugwarn = (function(...theLog) {
        if (Services.appShell.hiddenDOMWindow.fqWO.fqDebug) {
        for (let index = 0; index < theLog.length; index++) {
            console.warn(theLog[index]);
            }
        }
    });
}

//initial debugging output
var debugwarn = theGlobal.fqWO.debugwarn;
debugwarn ("A1. theGlobal.fqWO preliminaries done. theGlobal.fqWO is", theGlobal.fqWO);


//create mailfolder listener's message removal action if it doesn't exist
if (typeof theGlobal.fqWO.onMessageRemoved == "undefined") {
    theGlobal.fqWO.onMessageRemoved = (function(parentItem, item) {
    //right now onMessageRemoved does nothing, just logs for troubleshooting purpose.
        var debugwarn = Services.appShell.hiddenDOMWindow.fqWO.debugwarn;
        debugwarn("B1. START theGlobal.fqWO.onMessageRemoved ------------------------------------------");
        debugwarn("B2. ItemRemoved- parentItem", parentItem.URI, parentItem, "Item", item.author, item.subject, item);
    });
}

//create mailfolder listener's message addition action if it doesn't exist
if (typeof theGlobal.fqWO.onMessageAdded == "undefined") {
debugwarn("A2. theGlobal.fqWO.onMessageAdded == undefined");
    theGlobal.fqWO.onMessageAdded = (function(parentItem, item) {
        var theGlobal = Services.appShell.hiddenDOMWindow;
        var debugwarn = Services.appShell.hiddenDOMWindow.fqWO.debugwarn;
        debugwarn ("C1. inside onMessageAdded. theGlobal.fqWO is", theGlobal.fqWO);
         debugwarn("C2. START theGlobal.fqWO.onMessageAdded ------------------------------------------");
        debugwarn("C3. ItemAdded BEGIN - parentItem", parentItem.URI, parentItem, "Item", item.author, item.subject, item);
        draftPropertyIndex = [...item.properties].indexOf("x-mozilla-draft-info");
        //note: properties was propertyEnumerator prior to TB 115
        debugwarn("C4. OPENER - draft property index", draftPropertyIndex);
        if (draftPropertyIndex == -1) {
            debugwarn("C5. OPENER - starting non-draft (-1) conditional code block");
            var theOpenWins = [];
            var theWins = [...Services.wm.getEnumerator("")];
            debugwarn("C6. theWins is", theWins);
            for (i in theWins) {
            debugwarn("G1. looping through theWins, i=", i);
              debugwarn("G2. theWins[i]=", theWins[i]);
                if (theWins[i].document.URL == "chrome://messenger/content/messenger.xhtml") {
                      if (typeof theWins[i].GetSelectedMsgFolders == "function") {
                      debugwarn("G3. theWins[i].GetSelectedMsgFolders == function succeeded, theWins[i].GetSelectedMsgFolders()="); var theGet=theWins[i].GetSelectedMsgFolders();debugwarn(theGet);
                    if(theGet.length >0)
                    {theOpenWins.push(theWins[i].GetSelectedMsgFolders()[0].URI);}
                    else
                    {debugwarn("G3b. theWins[i].GetSelectedMsgFolders() length was 0.");}
                    }
                    else {
                     debugwarn("G4. ERROR - theWins[i].GetSelectedMsgFolders is not a function!");
                           debugwarn("G5. done i is", i);
                        debugwarn("G6. done theWins[i] is", theWins[i]);
                }
                }
            };
            var theFound = theOpenWins.some(windowx => windowx == parentItem.URI);
            debugwarn("C7. theOpenWins=", theOpenWins);
            
            debugwarn("C8. theFound=", theFound);
            debugwarn("C9. about to check should be skipped - parentItem.URI", parentItem.URI);
            
            var shouldBeSkipped = theGlobal.fqWO.foldersToSkip.some(rx => rx.test(parentItem.URI));
            
            debugwarn("C10. shouldBeSkipped is ",shouldBeSkipped);

            if (theFound != true && !shouldBeSkipped ) {
            debugwarn ("C11. theFound != true && !shouldBeSkipped");
                //   if (typeof theGlobal.fqWO.frontmostWindow == "undefined") {
                //                    theGlobal.fqWO.frontmostWindow = {};
                // }
                //don't know why needed to initialize it...
                debugwarn("C12. Services.ww.activeWindow=",Services.ww.activeWindow)
                theGlobal.fqWO.frontmostWindow = Services.ww.activeWindow;
debugwarn("C13. theGlobal.fqWO.frontmostWindow=",theGlobal.fqWO.frontmostWindow);
if (theGlobal.fqWO.frontmostWindow != null) {
                debugwarn("C14. OPENER - Primary app window is: title", theGlobal.fqWO.frontmostWindow.location.title ); } else { debugwarn("C15. OPENER - Primary app window is: title logging failed; window is null");}
                debugwarn ("C16. message string passed to handler's properties are", [...item.properties]);
               
                debugwarn("C17. OPENER - parentItem (parent folder passed to event handler) is ", parentItem);
                
/* IS THIS REALLY NEEDED? I think this was a previous attempt to deal with duplicate windows by closing an existing match. Disabling. Watch out for problems and reenable if spot any.
                try {
                    Services.wm.getMostRecentWindow("").open("", parentItem.URI, "chrome=yes,toolbar=yes,status=yes").close();
                    debugwarn("OPENER - closed ok");
                } catch (openerr) {
                    debugwarn("OPENER - error on close ", openerr);
                }
                debugwarn("OPENER - opening target window");
                */
                var newwin = theGlobal.openDialog("chrome://messenger/content/messenger.xhtml", parentItem.URI, "chrome=yes,toolbar=yes,status=yes", parentItem.URI);
                newwin.addEventListener('pageshow', function(e)
                 {
              var theGlobal = Services.appShell.hiddenDOMWindow;
                  var debugwarn = Services.appShell.hiddenDOMWindow.fqWO.debugwarn;
       debugwarn ("F1. inside addEventListener(pageshow). theGlobal.fqWO is", theGlobal.fqWO);
      
                    debugwarn("F2. newwin event listener function running");
                    
                    if (theGlobal.fqWO.frontmostWindow != null) {
                    theGlobal.fqWO.frontmostWindow.focus();  debugwarn("F3. focused on theGlobal.fqWO.frontmostWindow");} else {debugwarn("F4. couldn't focus, frontmost window is null.");}
                    //return focus to the page the was last in front when new window loads
                  
                });
                debugwarn("C18. OPENER - opened window - newwin title", newwin.location.title, "newwin object", newwin, "parentItem.URI", parentItem.URI);
                //newwin.goDoCommand("cmd_toggleMessagePane")
                try {
                    newwin.gMessagePaneWrapper.collapsed = true;
                    debugwarn("C19. OPENER - collapsing message pane failed", e);
                } catch (e) 
                {
                    debugwarn("C20. OPENER - collapsing message pane failed", e);
                }
                try {
                    theGlobal.fqWO.frontmostWindow.focus();
                    debugwarn("C21. OPENER - focused", theGlobal.fqWO.frontmostWindow.document.title, "focused window is now", Services.ww.activeWindow.document.title);
                } catch (e) 
                {
                    debugwarn("C22. OPENER - focus failed", e);
                }
                debugwarn("C23. OPENER - END parentItem", parentItem.URI, parentItem, "item", item.author, item.subject, item);
                debugwarn("C24. END ------------------------------------------");
            } else 
            {
                debugwarn("C25. window already open");
            }
        } else
         {
            debugwarn("C26. OPENER - skipped folder listener, DRAFT parentItem", parentItem.URI, parentItem, "item", item.author, item.subject, item);
        }


    });
}

//create mailfolder listener object if it doesn't exist
if (typeof theGlobal.fqWO.folderListener == "undefined") {
    theGlobal.fqWO.folderListener = {
        onMessageRemoved: function(parentItem, item) {
            Services.appShell.hiddenDOMWindow.fqWO.debugwarn("E1. about to call onMessageRemoved with ",parentItem,item);
            Services.appShell.hiddenDOMWindow.fqWO.onMessageRemoved(parentItem, item);
               Services.appShell.hiddenDOMWindow.fqWO.debugwarn("E2. Done calling onMessageRemoved with ",parentItem,item);
        },
        onMessageAdded: function(parentItem, item) {
           Services.appShell.hiddenDOMWindow.fqWO.debugwarn("E3. about to call onMessageAdded with ",parentItem,item);
            Services.appShell.hiddenDOMWindow.fqWO.onMessageAdded(parentItem, item);
               Services.appShell.hiddenDOMWindow.fqWO.debugwarn("E4. done calling onMessageAdded with ",parentItem,item);
        }
    };
}

//create theUpdateFunction() that handles attaching listeners to folders if it doesn't exist
if (typeof theGlobal.fqWO.theUpdateFunction == "undefined") {
    //call theGlobal.fqWO.theUpdateFunction() when you want the folder listeners updated
    theGlobal.fqWO.theUpdateFunction = (function() {

        var theGlobal = Services.appShell.hiddenDOMWindow;
        var debugwarn = theGlobal.fqWO.debugwarn;
        debugwarn ("D1. inside theUpdateFunction. theGlobal.fqWO is", theGlobal.fqWO);
        var folderListener = theGlobal.fqWO.folderListener;
        var notifyFlags = Components.interfaces.nsIFolderListener.added | Components.interfaces.nsIFolderListener.removed;
        MailServices.mailSession.RemoveFolderListener(folderListener);
        MailServices.mailSession.AddFolderListener(folderListener, notifyFlags);



    });
}

//if no flag indicating listeners have been updated, perform theUpdateFunction() and create flag indicating listeners have been updated



//Make sure msgHdrs is defined; since 115 for some reason it's not always
var fqWO_msgHdrs = ['']; //using unique variable name for console debugging purposes
if (typeof msgHdrs == "undefined") {
    debugwarn ("A3. fqWO_msgHdrs manually set");
    debugwarn ("A4. fqWO_msgHdrs is", fqWO_msgHdrs);
    //so can be run from console
} else {
    fqWO_msgHdrs = msgHdrs;
}


//Assign x-first-folder-URI header if none:
    debugwarn ("A5. about to loop through fqWO_msgHdrs, length is");
   debugwarn (fqWO_msgHdrs.length);

for (let index = 0; index < fqWO_msgHdrs.length; index++) {
    debugwarn ("A6. index is ", index );
    debugwarn ("A7. fqWO_msgHdrs.queryElementAt ", fqWO_msgHdrs.queryElementAt ? "exists":"doesn't exist");
    let hdrs = fqWO_msgHdrs.queryElementAt ? fqWO_msgHdrs.queryElementAt(index, Ci.nsIMsgDBHdr) : fqWO_msgHdrs[index]; //Ci = Components.interfaces
    debugwarn ("A8. hdrs is");
    debugwarn (hdrs);
    if (typeof hdrs.getStringProperty != "function") {
    debugwarn("A9. typeof hdrs.getStringProperty() != function");} 
    else {
    if (hdrs.getStringProperty("x-first-folder-URI") == "") {
        debugwarn ("A11. about to set x-first-folder-URI to ");
        debugwarn (hdrs.folder.URI);
        hdrs.setStringProperty("x-first-folder-URI", hdrs.folder.URI);
        debugwarn ("A13. hdrs.getStringProperty(x-first-folder-URI) is now");
        debugwarn (hdrs.getStringProperty("x-first-folder-URI"));
    }
    }

}

if (typeof theGlobal.fqWO.listenersUpdated == "undefined" || theGlobal.fqWO.listenersUpdated != "1") {
debugwarn("A14. about to call theUpdateFunction()");
    theGlobal.fqWO.theUpdateFunction();
       debugwarn("A15. done calling theUpdateFunction(). theGlobal.fqWO is");
       debugwarn (theGlobal.fqWO);
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
