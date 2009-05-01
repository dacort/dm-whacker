// ==UserScript==
// @name          Twitter DM Deleter
// @description   Delete all your sensitive messages
// @include       http://twitter.com/direct_messages
// ==/UserScript==
(function(){

	var Version = '0.6.1';
	var lastUpdate = '2009.05.01';
	var scriptURL = 'http://dcortesi.com/dm_deleter/twitdm_dev.js';
	var scriptText = "javascript:(function(){if(!location.href.match(/http:\/\/twitter.com\/direct_messages/) && !location.href.match(/timeline\/direct_messages$/) && !location.href.match(/http:\/\/twitter.com\#inbox/)){if(confirm('You%20must%20be%20on%20the%20Twitter%20direct%20messages%20page.\nWould%20you%20like%20me%20to%20take%20you%20there?')){location.href='http://twitter.com/direct_messages';};return%20false;};var%20s%20=%20document.createElement('script');s.charset='utf-8';s.type='text/javascript';s.src='" + scriptURL + "';document.body.appendChild(s);})();void(0);";

    var side = document.getElementById('side');
    if(side == null) return;
    side.innerHTML = '<div class="section" style="margin-bottom:20px"><B>Twitter DM Deleter</B><br/><div style="margin-left:10px;color:#666666;margin-bottom:10px;">version:'+Version+'<br/>last update:'+lastUpdate+'</div><b>Select DM\'s to Delete</b><br/><form id="frm_delete" name="frm_delete"><input id="delete_dm_all" type="radio" value="all" name="delete_dm_type" checked="checked"/> <label for="delete_dm_all">all dm\'s</label><br /><input id="delete_dm_user" type="radio" value="user" name="delete_dm_type" /> <label for="delete_dm_user">dm\'s with user:</label><input onfocus="$(\'#delete_dm_user\').attr(\'checked\',true)" id="delete_dm_username" type="text" name="delete_dm_username" /><br /><br /><input id="delete_dm_inbox" type="checkbox" value="delete_inbox" name="delete_dm_inbox" checked="true" /> <label for="delete_dm_inbox">include Inbox items</label><br /><input id="delete_dm_sent" type="checkbox" value="delete_sent" name="delete_dm_sent" /> <label for="delete_dm_sent">include Sent items</label><br /><br /><a href="#" id="advlink" onclick="$(\'#advanced_feat\').slideToggle(\'normal\',function(){$(\'#advlink\')[0].innerHTML = ($(\'#advlink\')[0].innerHTML == \'+ Advanced Features\'? \'- Advanced Features\':\'+ Advanced Features\')})">+ Advanced Features</a><div id="advanced_feat" style="display: none;"><br /><input id="delete_dm_match" type="checkbox" value="match" name="delete_dm_match" /> <label for="delete_dm_match">dm\'s containing text:</label><input onfocus="$(\'#delete_dm_match\').attr(\'checked\',true)" id="delete_dm_matchtext" type="text" name="delete_dm_matchtext" /><br /><input id="match_type_simple" type="radio" value="simple" name="match_type" checked="checked"/> <label for="match_type_simple">Simple</label> <input id="match_type_regex" type="radio" value="regex" name="match_type" onclick="if (!confirm(\'Regular expressions are intended for advanced users. Please click OK only if you know what you are doing. :)\\n\\nPlease note, all searches are currently NOT case-sensitive.\')) {$(\'#match_type_simple\').attr(\'checked\', true);}" /> <label for="match_type_regex">RegEx Power!</label></div><br /><br /><input type="button" id="delete_dm_submit" value="Delete!" /><input type="hidden" id="delete_dm_count_inbox" value="0"/><input type="hidden" id="delete_dm_count_sent" value="0"/><br /><br /></form></div>' + side.innerHTML;
    
    var deleteMessages = function(url) {
        // Function to delete messages in the, with the current_url passed as a parameter

        var base_url = 'http://twitter.com/direct_messages';
        
        if (url && url.indexOf("/sent") > 0) {
            base_url += '/sent';
        } else if ($('#delete_dm_inbox').attr("checked") == false && $('#delete_dm_sent').attr("checked") == true) {
            base_url += '/sent';
        }
        
        // See if we've reached the end.
        if ($("#timeline").length == 0 || $("li.direct_message").length == 0) {
            if ($('#delete_dm_sent').attr("checked") && (url.indexOf("/sent") < 0)) {
                url = base_url + '/sent?page=1';
                $("#timeline").load(url + " #timeline li", '', function(){deleteMessages(url)})
                return;
            } else {
                var del_inbox = $('#delete_dm_count_inbox').attr("value");
                var del_sent = $('#delete_dm_count_sent').attr("value");
                
                alert('You\'re all done!\nThanks for using the Twitter DM Deleter.\n\n'+del_inbox+' inbox messages whacked and '+del_sent+' sent messages.\n\n@dacort');
                location.href = "http://twitter.com/direct_messages";
                return;
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
            var username_to_del = $('#delete_dm_username').attr("value").toLowerCase();
            if (!username_to_del) {
                alert('You need to enter a username for that option.');
                $('#delete_dm_username').focus();
                return;
            }
        }
        
        // Retrieve the settings for matching text, default to none
        var match_text = false;
        if (document.frm_delete.delete_dm_match.checked && $("#delete_dm_matchtext").val().length > 0) {
          match_text = $("#delete_dm_matchtext").val().toLowerCase();
        }
        
        // Replace the contents of the table on screen with the contents of the iframe
        // If this user has no messages, we have to use the h2 header
        // TODO: replace this functionality
        // if (document.getElementById('timeline')) {
        //     document.getElementById('timeline').parentNode.innerHTML = $("#timeline", twitter_data).parent().html();
        // } else {
        //     document.getElementById('content').getElementsByTagName('h2')[0].parentNode.innerHTML = $("#timeline", twitter_data).parent().html();
        // }
        var tweet_list = document.getElementById('timeline').getElementsByTagName('li');
        
        var messages_deleted = 0;
        var arr_deleted = [];
        var callbacks = 0;
 
        // Fortunately(HAH!), Twitter updated their UI and I can select by clean class name now.
        for(var i = 0;i<tweet_list.length;i+=1){
            // Retrieve the destroy link and the username
            var username = tweet_list[i].getElementsByClassName('status-body')[0].getElementsByTagName("a")[0].innerHTML;
            
            // The status's numerical ID
            var dm_id = tweet_list[i].id.replace(/direct_message_/, '');
            var link = '/direct_messages/destroy/' + dm_id
            var token = twttr.form_authenticity_token
            
            // Determine if basic or advanced mode is selected and match appropriately
            var match = -1;
            if (match_text && $("#match_type_simple")[0].checked) {
              match = tweet_list[i].getElementsByClassName('entry-content')[0].textContent.toLowerCase().indexOf(match_text);
            } else if (match_text && $("#match_type_regex")[0].checked) {
              match = tweet_list[i].getElementsByClassName('entry-content')[0].textContent.search(new RegExp(match_text, "i"));
            }
            
            // If dm's matching text are to be deleted, see if we have a match
            // If no match, skip to the next one.
            if (match_text && match == -1) {
              continue;
            }
            
            // If we're deleting by user, check this message
            if (delete_type == "user" && username.toLowerCase() == username_to_del) {
                //flare++
                tweet_list[i].style.opacity = "0.25";
                
                // This is used later to track deleted elements
                tweet_list[i].getElementsByTagName('img')[0].id = 'dpc_img_' + dm_id;
                tweet_list[i].getElementsByTagName('img')[0].onerror=function(){this.parentNode.parentNode.parentNode.style.display = 'none';};
                
                // Make an AJAX query using Twitter's included jQuery library
                jQuery.post(link,{authenticity_token: token},function() {callbacks++;});
                arr_deleted[messages_deleted] = tweet_list[i].getElementsByTagName('img')[0].id;
                messages_deleted++;
            } else if (delete_type == "all") {
                //flare++
                tweet_list[i].style.opacity = "0.25";
                tweet_list[i].getElementsByTagName('img')[0].id = 'dpc_img_' + dm_id;
                tweet_list[i].getElementsByTagName('img')[0].onerror=function(){this.parentNode.parentNode.parentNode.style.display = 'none';};
                jQuery.post(link,{authenticity_token: token},function() {callbacks++;});
                arr_deleted[messages_deleted] = tweet_list[i].getElementsByTagName('img')[0].id;
                messages_deleted++;
            }
        }
        
        // Update the slick counters
        if (url.indexOf("/sent") > 0) {
            var val = parseInt($('#delete_dm_count_sent').attr("value"));
            $('#delete_dm_count_sent').attr("value", val + messages_deleted);
        } else {
            var val = parseInt($('#delete_dm_count_inbox').attr("value"));
            $('#delete_dm_count_inbox').attr("value", val + messages_deleted);
        }
        
        var wait = true;
        var now = new Date();
        var startingMSeconds = now.getTime();
        
        var waitForComplete = function() {
            var done = 0;
            
            // The jQuery callback increments callbacks
            if (callbacks == arr_deleted.length) { // Let's go!
                wait = false;
            }
            if ((new Date().getTime() - startingMSeconds) > 10000) {
                wait = false;
            }
            if (wait) {
                setTimeout(waitForComplete, 100);
            } else {
                
                // We've looped through, now let's try to load the next page
                var current_page = url.substr(url.lastIndexOf("=")+1);
                if (messages_deleted == 0) {
                    current_page++;
                }

                // Make sure we even have another page (TODO)
                url = base_url + '?page='+current_page;
                $("#timeline").load(url + " #timeline li", '', function(){deleteMessages(url)});
            }
        }
        
        setTimeout(waitForComplete, 100);
        
        
    }
    
    var loadFrame = function() {
        var divs = document.getElementsByTagName("div");
        var url = 'http://twitter.com/direct_messages?page=1';
        
        // Error checking - make sure at least one checkbox is marked
        if ($('#delete_dm_inbox').attr("checked") == false && $('#delete_dm_sent').attr("checked") == false) {
            alert('You need to select either "Inbox" or "Sent" to delete.');
            return;
        } else if ($('#delete_dm_inbox').attr("checked") == false && $('#delete_dm_sent').attr("checked") == true) {
            url = 'http://twitter.com/direct_messages/sent?page=1';
        }
        
        // Error checking - prompt the user to delete all
        var delete_type = 'all';
        for(var i = 0; i < document.frm_delete.delete_dm_type.length; i++) {
            if (document.frm_delete.delete_dm_type[i].checked)
                delete_type = document.frm_delete.delete_dm_type[i].value;
        }
        if (delete_type == "all") {
          var msg = "You selected all - are you sure you want to wipe out all your Direct Messages";
          if (document.frm_delete.delete_dm_match.checked && $("#delete_dm_matchtext").val().length > 0) {
            if ($("#match_type_simple")[0].checked) {
              msg += " containing the text \"" + $("#delete_dm_matchtext").val() + "\"";
            } else if ($("#match_type_regex")[0].checked) {
              msg += " matching the regular expression \"" + $("#delete_dm_matchtext").val() + "\"";
            }
            
          }
            var really = confirm(msg + "?");
            if (!really) {
                return;
            }
        }
        
        // Load our data into the current timeline
        $("#timeline").load(url + " #timeline li", '', function(){deleteMessages(url)});

    }
    // Now using jquery, one statement
    $('#delete_dm_submit').bind('click', loadFrame);

})()
