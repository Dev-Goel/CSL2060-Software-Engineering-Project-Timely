"use strict";
var storage = new LocalStorage();
var blockSiteUrl;
var restrictionList = [];
// A method to check whether the current tab is in the restriction list or not, if it is in the restriciton list it will create the innerText of that tab else return.
document.addEventListener("DOMContentLoaded", function () {
  var url = new URL(document.URL);
  blockSiteUrl = new Url(url.searchParams.get("url"));
  document.getElementById("site").innerText = blockSiteUrl;
  storage.getValue(STORAGE_RESTRICTION_LIST, function (items) {
    restrictionList = (items || []).map(item => new Restriction(item.url || item.domain, item.time));
    if (restrictionList === undefined) restrictionList = [];
    var currentItem = restrictionList.find(x => x.url.isMatch(blockSiteUrl));
    if (currentItem !== undefined) {
      document.getElementById("site").innerText = currentItem.url.toString();
      document.getElementById("limit").innerText =
        convertShortSummaryTimeToString(currentItem.time);
    }
  });
});
