// ==UserScript==
// @name          Twitter DM Deleter
// @description   Delete all your sensitive messages
// @include       http://twitter.com/direct_messages
// ==/UserScript==
(function(){

	var Version = '0.2.5';
	var lastUpdate = '2008.05.03';
	var scriptURL = 'http://dcortesi.com/dm_deleter/tdmd.js';
	var scriptText = '';

    var side = document.getElementById('side');
    if(side == null) return;
    side.innerHTML = '<div style="margin-bottom:20px"><B>Twitter DM Deleter</B><br/><div style="margin-left:10px;color:#666666;margin-bottom:10px;">version:'+Version+'<br/>last update:'+lastUpdate+scriptText+'</div><b>Select DM\'s to Delete</b><br/><form id="frm_delete" name="frm_delete"><input id="delete_dm_all" type="radio" value="all" name="delete_dm_type" checked="checked"/> <label for="delete_dm_all">all dm\'s</label><br /><input id="delete_dm_user" type="radio" value="user" name="delete_dm_type" /> <label for="delete_dm_user">dm\'s with user:</label><input onfocus="$(\'delete_dm_user\').checked=true" id="delete_dm_username" type="text" name="delete_dm_username" /><br /><br /><input id="delete_dm_inbox" type="checkbox" value="delete_inbox" name="delete_dm_inbox" checked="true" /> <label for="delete_dm_inbox">include Inbox items</label><br /><input id="delete_dm_sent" type="checkbox" value="delete_sent" name="delete_dm_sent" /> <label for="delete_dm_sent">include Sent items</label><br /><br /><input type="button" id="delete_dm_submit" value="Delete!" /></form></div>' + side.innerHTML;
    
    var deleteMessages = function(iframe) {
        // Function to delete messages in the iframe that called it
        // Determine our proper iframe usage
        var bg_twitter;
        if (iframe.contentDocument) {   // Firefox/safari
            var bg_twitter = iframe.contentDocument;
        } else if (iframe.contentWindow) {  // IE
            var bg_twitter = iframe.contentWindow.document;
        }
        
        var url = 'http://twitter.com/direct_messages';
        if ($('dpc_twitter_dms').src.indexOf("/sent") > 0) {
            url += '/sent';
        } else if ($('delete_dm_inbox').checked == false && $('delete_dm_sent').checked == true) {
            url += '/sent';
        }
        
        // See if we've reached the end.
        if (!bg_twitter.getElementsByTagName('table')[0] || bg_twitter.getElementsByTagName('table')[0].getElementsByTagName('td').length == 0) {
            if ($('delete_dm_sent').checked && ($('dpc_twitter_dms').src.indexOf("/sent") < 0)) {
                $('dpc_twitter_dms').src = url + '/sent?page=1';
                return;
            } else {
                alert('You\'re all done!\nThanks for using the Twitter DM Deleter.\n\n--@dacort');
                location.href = "http://twitter.com/direct_messages";
            }
        }
        
        // Retrieve the settings for the user, default to all
        var delete_type = 'all';
        for(var i = 0; i < document.frm_delete.delete_dm_type.length; i++) {
            if (document.frm_delete.delete_dm_type[i].checked)
                delete_type = document.frm_delete.delete_dm_type[i].value;
        }
        // Get the username, if necessary
        if (delete_type == "user") {
            var username_to_del = $('delete_dm_username').value.toLowerCase();
            if (!username_to_del) {
                alert('You need to enter a username for that option.');
                $('delete_dm_username').focus();
                return;
            }
        }
        
        // Replace the contents of the table on screen with the contents of the iframe
        // If this user has no messages, we have to use the h2 header
        if (document.getElementsByTagName('table')[0]) {
            document.getElementsByTagName('table')[0].parentNode.innerHTML = bg_twitter.getElementsByTagName('table')[0].parentNode.innerHTML
        } else {
            document.getElementById('content').getElementsByTagName('h2')[0].parentNode.innerHTML = bg_twitter.getElementsByTagName('table')[0].parentNode.innerHTML
        }
        var visible_td = document.getElementsByTagName('table')[0].getElementsByTagName('td');
 
        // With this for loop, we're assuming that Twitter outputs it's td's in the same order (i+=3)
        for(var i = 0;i<=visible_td.length-3;i+=3){
            // Retrieve the destroy link and the username
            var messages_deleted = 0;
            var arr_deleted = [];
            var delete_link = visible_td[i].getElementsByTagName("a")[0].href;
            var username = visible_td[i+2].getElementsByTagName("a")[0].innerHTML;
            
            // If we're deleting by user, check this message
            if (delete_type == "user" && username.toLowerCase() == username_to_del) {
                //flare++
                visible_td[i].parentNode.style.opacity = "0.25";
                var dm_id = delete_link.substr(delete_link.lastIndexOf("/")+1);
                // visible_td[i].parentNode.id = dm_id;
                visible_td[i].getElementsByTagName('img')[0].id = 'dpc_img_' + dm_id;
                visible_td[i].getElementsByTagName('img')[0].onerror=function(){this.parentNode.parentNode.parentNode.parentNode.parentNode.style.display = 'none';};
                // visible_td[i].getElementsByTagName('img')[0].onerror=function(){
                //     var tr = this.parentNode.parentNode.parentNode.parentNode.parentNode;
                //     tr.parentNode.removechild(tr);
                // };
                visible_td[i].getElementsByTagName('img')[0].src = delete_link;
                arr_deleted[messages_deleted] = visible_td[i].getElementsByTagName('img')[0].id
                messages_deleted++;
            } else if (delete_type == "all") {
                //flare++
                visible_td[i].parentNode.style.opacity = "0.25";
                visible_td[i].getElementsByTagName('img')[0].id = 'dpc_img_' + dm_id;
                visible_td[i].getElementsByTagName('img')[0].onerror=function(){this.parentNode.parentNode.parentNode.parentNode.parentNode.style.display = 'none';};
                visible_td[i].getElementsByTagName('img')[0].src = delete_link;
                arr_deleted[messages_deleted] = visible_td[i].getElementsByTagName('img')[0].id
                messages_deleted++;
            }
        }
        
        var wait = true;
        var now = new Date();
        var startingMSeconds = now.getTime();
        
        var waitForComplete = function() {
            var done = 0;
            for (var i=0; i<arr_deleted.length; i++) {
                if (document.getElementById(arr_deleted[i].readyState == 4)) {
                    done++;
                }
            }
            if (done == arr_deleted.length) { // Let's go!
                wait = false;
            }
            if ((new Date().getTime() - startingMSeconds) > 10000) {
                wait = false;
            }
            if (wait) {
                setTimeout(waitForComplete, 500);
            } else {
                
                // We've looped through, now let's try to load the next page
                var current_page = $('dpc_twitter_dms').src.substr($('dpc_twitter_dms').src.lastIndexOf("=")+1);
                if (messages_deleted == 0) {
                    current_page++;
                }

                // Make sure we even have another page (TODO)
                $('dpc_twitter_dms').src = url + '?page='+current_page;
            }
        }
        
        setTimeout(waitForComplete, 500);
        
        
    }
    
    var loadFrame = function() {
        var divs = document.getElementsByTagName("div");
        var url = 'http://twitter.com/direct_messages?page=1';
        
        // Error checking - make sure at least one checkbox is marked
        if ($('delete_dm_inbox').checked == false && $('delete_dm_sent').checked == false) {
            alert('You need to select either "Inbox" or "Sent" to delete.');
            return;
        } else if ($('delete_dm_inbox').checked == false && $('delete_dm_sent').checked == true) {
            url = 'http://twitter.com/direct_messages/sent?page=1';
        }
        
        // Error checking - prompt the user to delete all
        var delete_type = 'all';
        for(var i = 0; i < document.frm_delete.delete_dm_type.length; i++) {
            if (document.frm_delete.delete_dm_type[i].checked)
                delete_type = document.frm_delete.delete_dm_type[i].value;
        }
        if (delete_type == "all") {
            var really = confirm("You selected all - are you sure you want to wipe out all your Direct Messages?");
            if (!really) {
                return;
            }
        }
        
        var iframe =  document.createElement('iframe'); 
        iframe.style.border = '1px solid #FFFFFF';
        iframe.frameBorder = '0';
        iframe.style.display = 'none';
        iframe.style.height = '100px';
        iframe.style.width = '100%';       
        iframe.id = 'dpc_twitter_dms';
        iframe.onload=function(){deleteMessages(document.getElementById('dpc_twitter_dms'))};
        iframe.src = url;
        divs[27].parentNode.appendChild(iframe);
        
    }
    if ($('delete_dm_submit').addEventListener)
        $('delete_dm_submit').addEventListener('click', loadFrame, false)
    else
        $('delete_dm_submit').attachEvent('onclick', loadFrame)

})()