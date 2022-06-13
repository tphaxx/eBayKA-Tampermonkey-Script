// ==UserScript==
// @name         Ebay Kleinanzeigen ReNew Own Articles
// @namespace    http://tampermonkey.net/
// @version      0.9
// @description  This script renews all own articles in time interval (default: 30 min.)
// @author       tphaxx
// @match        https://www.ebay-kleinanzeigen.de/m-meine-anzeigen.html
// @icon         https://www.google.com/s2/favicons?sz=64&domain=ebay-kleinanzeigen.de
// @downloadURL  https://github.com/tphaxx/eBayKA-Tampermonkey-Script/raw/master/eBayKA_autorenew.js
// @grant        none
// ==/UserScript==

(function(){
    'use strict';

    //debugger;

    // refresh time for update
    const REFRESH_TIME_MINUTES = 30;

    // other constants
    const TIME_FACTOR = 60 * 1000;
    const ADITEM_FOOTER_INDEX = 1;
    const RENEWITEM_LINKLIST_INDEX = 4;
    const GERMAN_NEXT = '[title="Nächste"]';
    const ENGLISH_NEXT = '[title="Next"]';
    const BUTTON_CLASS_DISABLED = "is-disabled";

    // wait time for competed page
    const STARTTIME_AFTER_COMPLETED_DOC_MS = 2000;

    // wait time for next button click action
    const STARTTIME_AFTER_NEXT_CLICK_MS = 2000;

    let refreshTime = REFRESH_TIME_MINUTES * TIME_FACTOR;
    let pageCounter = 0;
    let oneShotEnabled = false;

    // update event for reloading the page
    setTimeout(function(){ location.reload(); }, refreshTime);

    // User logged in?
    function isLogIn(){
        let linkedText = document.getElementById("user-logout");
        return linkedText != null;
    }

    // Is a renew possible?
    function isRenewable(renewButton){
        let attributes = renewButton.attributes;
        let attribute = attributes.getNamedItem("class");
        let nodeValue = attribute.nodeValue;
        let foundIndex = nodeValue.indexOf(BUTTON_CLASS_DISABLED)

        return foundIndex == -1;
    }

    // Get the renew button from ad element.
    function getRenewButton(adElement){
        let footerItem = adElement.firstChild.childNodes[ADITEM_FOOTER_INDEX];
        let linkList = footerItem.firstChild.firstChild;
        let renewElement = linkList.childNodes[RENEWITEM_LINKLIST_INDEX];
        let renewButton = renewElement.firstChild;

        return renewButton;
    }

    // get next button from page
    function getNextPageButton(){
        let navBarNode = document.querySelector(GERMAN_NEXT);
        
        if (navBarNode === null){
            return document.querySelector(ENGLISH_NEXT);
        }

        return navBarNode;
    }

    // restart for new page
    function restart(milliseconds){
        oneShotEnabled = true;
        setTimeout(function(){ renew(); }, milliseconds);
    }

    // renew action
    function renew(){
        if (oneShotEnabled){
            let renewed = false;
            oneShotEnabled = false;

            if (isLogIn()){
                let adList = document.getElementById("my-manageads-adlist");
                let nextButton = getNextPageButton();
                let startTime = Date.now();
    
                console.log(`function renew started at ${startTime}`);
    
                if (adList != null){
                    for (let n = 0; n < adList.childNodes.length; n++) {
                        let adElement = adList.childNodes[n];
                        let adDescription = adElement.innerText.split('\n')[2];
                        let renewButton = getRenewButton(adElement);
    
                        if (isRenewable(renewButton)){
                            renewButton.click();
                            console.log(`Renewed item with description "${adDescription}".`);
                            renewed = true;
                        }
                        }
                }
    
                pageCounter++;
                console.log(`function renew ended at page ${pageCounter}`);
    
                // next page
                if ((nextButton != null) && (typeof(nextButton) != "undefined")){
                    console.log("addEventListener");
                    nextButton.addEventListener('click', async function(){
                        restart(STARTTIME_AFTER_NEXT_CLICK_MS);
                    });
    
                    nextButton.click();
                }
                else{
                    console.log("no next page button");
                }

                if (renewed){
                    console.log("press escape for close the hint");
                    document.dispatchEvent(
                        new KeyboardEvent("keypress", {
                          key: "escape",
                          keyCode: 27, // example values.
                          code: "KeyEsc", // put everything you need in this object.
                          which: 27,
                          shiftKey: false, // you don't need to include values
                          ctrlKey: false,  // if you aren't going to use them.
                          metaKey: false   // these are here for example's sake.
                        })
                      );
                }
            }
        }
    }

    // complete state
    document.onreadystatechange = function () {
        if (document.readyState === 'complete') {
            restart(STARTTIME_AFTER_COMPLETED_DOC_MS);
        }
    }
    
    // checking the state if we missed the change of page
    if (document.readyState === 'complete'){
        restart(STARTTIME_AFTER_COMPLETED_DOC_MS);
    }
}());
