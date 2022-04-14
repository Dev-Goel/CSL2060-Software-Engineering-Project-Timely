var storage = new LocalStorage();
var blackList = [];
var restrictionList = [];
var notifyList = [];
var blockBtnList = ['settingsBtn', 'restrictionsBtn', 'notifyBtn', 'aboutBtn'];
var blockList = ['settingsBlock', 'restrictionsBlock', 'notifyBlock', 'aboutBlock'];
document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('settingsBtn').addEventListener('click', function () {
        setBlockEvent('settingsBtn', 'settingsBlock');
    });
    document.getElementById('restrictionsBtn').addEventListener('click', function () {
        setBlockEvent('restrictionsBtn', 'restrictionsBlock');
    });
    document.getElementById('notifyBtn').addEventListener('click', function () {
        setBlockEvent('notifyBtn', 'notifyBlock');
    });
    document.getElementById('aboutBtn').addEventListener('click', function () {
        setBlockEvent('aboutBtn', 'aboutBlock');
        loadVersion();
    });
    document.getElementById('clearAllData').addEventListener('click', function () {
        clearAllData();
    });
    document.getElementById('addBlackSiteBtn').addEventListener('click', function () {
        addNewSiteClickHandler('addBlackSiteLbl', null, actionAddBlackSiteToList, 'notifyForBlackList');
    });
    document.getElementById('addRestrictionSiteBtn').addEventListener('click', function () {
        addNewSiteClickHandler('addRestrictionSiteLbl', 'addRestrictionTimeLbl', actionAddRectrictionToList, 'notifyForRestrictionList');
    });
    document.getElementById('addNotifySiteBtn').addEventListener('click', function () {
        addNewSiteClickHandler('addNotifySiteLbl', 'addNotifyTimeLbl', actionAddNotifyToList, 'notifyForNotifyList');
    });
    document.getElementById('viewTimeInBadge').addEventListener('change', function () {
        storage.saveValue(SETTINGS_VIEW_TIME_IN_BADGE, this.checked);
    });
    document.getElementById('darkMode').addEventListener('change', function () {
        storage.saveValue(SETTINGS_DARK_MODE, this.checked);
    });
    $('.clockpicker').clockpicker();
    loadSettings();
});
// A method to set block event.
function setBlockEvent(btnName, blockName) {
    blockBtnList.forEach(element => {
        if (element === btnName) {
            document.getElementById(btnName).classList.add('active');
        }
        else document.getElementById(element).classList.remove('active');
    });
    blockList.forEach(element => {
        if (element === blockName) {
            document.getElementById(blockName).hidden = false;
        } else document.getElementById(element).hidden = true;
    });
}
// A method to set the load settings.
function loadSettings() {
    storage.getValue(SETTINGS_VIEW_TIME_IN_BADGE, function (item) {
        document.getElementById('viewTimeInBadge').checked = item;
    });
    storage.getValue(SETTINGS_DARK_MODE, function (item) {
        document.getElementById('darkMode').checked = item;
    });
    storage.getMemoryUse(STORAGE_TABS, function (integer) {
        document.getElementById('memoryUse').innerHTML = (integer / 1024).toFixed(2) + 'Kb';
    });
    storage.getValue(STORAGE_TABS, function (item) {
        let s = item;
    });
    storage.getValue(STORAGE_BLACK_LIST, function (items) {
        blackList = (items || []).map(item => new Url(item))
        viewBlackList(blackList);
    });
    storage.getValue(STORAGE_RESTRICTION_LIST, function (items) {
        restrictionList = (items || []).map(item => new Restriction(item.url || item.domain, item.time));
        viewRestrictionList(restrictionList);
    });
    storage.getValue(STORAGE_NOTIFICATION_LIST, function (items) {
        notifyList = (items || []).map(item => new Notification(item.url || item.domain, item.time));
        viewNotificationList(notifyList);
    });
    checkPermissionsForNotifications();
}
// A method to check permission for notifications.
function checkPermissionsForNotifications() {
    chrome.permissions.contains({
        permissions: ["notifications"]
    }, function (result) {
        if (result) {
            setUIForAnyPermissionForNotifications();
        }
    });
}
// A method to load version from manifest.
function loadVersion() {
    var version = chrome.runtime.getManifest().version;
    document.getElementById('version').innerText = 'v' + version;
}
// A method to view black list.
function viewBlackList(items) {
    if (items !== undefined) {
        for (var i = 0; i < items.length; i++) {
            addDomainToListBox(items[i]);
        }
    }
}
// A method to view notification list.
function viewNotificationList(items) {
    if (items !== undefined) {
        for (var i = 0; i < items.length; i++) {
            addDomainToEditableListBox(items[i], 'notifyList', actionEditSite, deleteNotificationSite, updateItemFromNotifyList, updateNotificationList);
        }
    }
}
// A method to view restriction list.
function viewRestrictionList(items) {
    if (items !== undefined) {
        for (var i = 0; i < items.length; i++) {
            addDomainToEditableListBox(items[i], 'restrictionsList', actionEditSite, deleteRestrictionSite, updateItemFromRestrictionList, updateRestrictionList);
        }
    }
}
// A method to clear all data.
function clearAllData() {
    var tabs = [];
    chrome.extension.getBackgroundPage().tabs = tabs;
    storage.saveTabs(tabs, allDataDeletedSuccess);
}
function allDataDeletedSuccess() {
    viewNotify('notify');
}
// A method to view notifications.
function viewNotify(elementName) {
    document.getElementById(elementName).hidden = false;
    setTimeout(function () { document.getElementById(elementName).hidden = true; }, 3000);
}
// A method to add restriciton to list.
function actionAddRectrictionToList(newSite, newTime) {
    if (!isContainsRestrictionSite(newSite)) {
        var restriction = new Restriction(newSite, newTime);
        addDomainToEditableListBox(restriction, 'restrictionsList', actionEditSite, deleteRestrictionSite, updateItemFromRestrictionList, updateRestrictionList);
        if (restrictionList === undefined)
            restrictionList = [];
        restrictionList.push(restriction);
        document.getElementById('addRestrictionSiteLbl').value = '';
        document.getElementById('addRestrictionTimeLbl').value = '';
        updateRestrictionList();
        return true;
    } else return false;
}
// A method to add blacksite to list.
function actionAddBlackSiteToList(newSite) {
    if (!isContainsBlackSite(newSite)) {
        addDomainToListBox(newSite);
        if (blackList === undefined)
            blackList = [];
        blackList.push(newSite);
        document.getElementById('addBlackSiteLbl').value = '';
        updateBlackList();
        return true;
    } else return false;
}
// A method to add notification to list.
function actionAddNotifyToList(newSite, newTime) {
    if (!isContainsNotificationSite(newSite)) {
        var notify = new Notification(newSite, newTime);
        addDomainToEditableListBox(notify, 'notifyList', actionEditSite, deleteNotificationSite, updateItemFromNotifyList, updateNotificationList);
        if (notifyList === undefined)
            notifyList = [];
        notifyList.push(notify);
        document.getElementById('addNotifySiteLbl').value = '';
        document.getElementById('addNotifyTimeLbl').value = '';
        updateNotificationList();
        return true;
    } else return false;
}
function addNewSiteClickHandler(lblName, timeName, actionCheck, notifyBlock) {
    var newSite = document.getElementById(lblName).value;
    var newTime;
    if (timeName != null)
        newTime = document.getElementById(timeName).value;
    if (newSite !== '' && (newTime === undefined || (newTime !== undefined && newTime !== ''))) {
        if (!actionCheck(newSite, newTime))
            viewNotify(notifyBlock);
    }
}
// A method to add domain to list box.
function addDomainToListBox(domain) {
    var li = document.createElement('li');
    li.innerText = domain;
    var del = document.createElement('img');
    del.height = 12;
    del.src = '/icons/delete.png';
    del.addEventListener('click', function (e) {
        deleteBlackSite(e);
    });
    document.getElementById('blackList').appendChild(li).appendChild(del);
}
function addDomainToEditableListBox(entity, elementId, actionEdit, actionDelete, actionUpdateTimeFromList, actionUpdateList) {
    var li = document.createElement('li');
    var domainLbl = document.createElement('input');
    domainLbl.type = 'text';
    domainLbl.classList.add('readonly-input', 'inline-block', 'element-item');
    domainLbl.value = entity.url.toString();
    domainLbl.readOnly = true;
    domainLbl.setAttribute('name', 'domain');
    var edit = document.createElement('img');
    edit.setAttribute('name', 'editCmd');
    edit.height = 14;
    edit.src = '/icons/edit.png';
    edit.addEventListener('click', function (e) {
        actionEdit(e, actionUpdateTimeFromList, actionUpdateList);
    });
    var del = document.createElement('img');
    del.height = 12;
    del.src = '/icons/delete.png';
    del.classList.add('margin-left-5');
    del.addEventListener('click', function (e) {
        actionDelete(e, actionUpdateTimeFromList, actionUpdateList);
    });
    var bloc = document.createElement('div');
    bloc.classList.add('clockpicker');
    bloc.setAttribute('data-placement', 'left');
    bloc.setAttribute('data-align', 'top');
    bloc.setAttribute('data-autoclose', 'true');
    var timeInput = document.createElement('input');
    timeInput.type = 'text';
    timeInput.classList.add('clock', 'clock-li-readonly');
    timeInput.setAttribute('readonly', true);
    timeInput.setAttribute('name', 'time');
    timeInput.value = convertShortSummaryTimeToString(entity.time);
    bloc.appendChild(timeInput);
    var hr = document.createElement('hr');
    var li = document.getElementById(elementId).appendChild(li);
    li.appendChild(domainLbl);
    li.appendChild(del);
    li.appendChild(edit);
    li.appendChild(bloc);
    li.appendChild(hr);
}
// A method to delete black site.
function deleteBlackSite(e) {
    var targetElement = e.path[1];
    blackList.splice(blackList.indexOf(targetElement.innerText), 1);
    document.getElementById('blackList').removeChild(targetElement);
    updateBlackList();
}
// A method to delete restriction site.
function deleteRestrictionSite(e) {
    var targetElement = e.path[1];
    var itemValue = targetElement.querySelector("[name='domain']").value;
    var item = restrictionList.find(x => x.url.isMatch(itemValue));
    restrictionList.splice(restrictionList.indexOf(item), 1);
    document.getElementById('restrictionsList').removeChild(targetElement);
    updateRestrictionList();
}
function deleteNotificationSite(e) {
    var targetElement = e.path[1];
    var itemValue = targetElement.querySelector("[name='domain']").value;
    var item = notifyList.find(x => x.url.isMatch(itemValue));
    notifyList.splice(notifyList.indexOf(item), 1);
    document.getElementById('notifyList').removeChild(targetElement);
    updateNotificationList();
}
function actionEditSite(e, actionUpdateTimeFromList, actionUpdateList) {
    var targetElement = e.path[1];
    var domainElement = targetElement.querySelector('[name="domain"]');
    var timeElement = targetElement.querySelector('[name="time"]');
    if (timeElement.classList.contains('clock-li-readonly')) {
        timeElement.classList.remove('clock-li-readonly');
        var hour = timeElement.value.split(':')[0].slice(0, 2);
        var min = timeElement.value.split(':')[1].slice(1, 3);
        timeElement.value = hour + ':' + min;
        var editCmd = targetElement.querySelector('[name="editCmd"]');
        editCmd.src = '/icons/success.png';
        $('.clockpicker').clockpicker();
    }
    else {
        var domain = domainElement.value;
        var time = timeElement.value;
        if (domain !== '' && time !== '') {
            var editCmd = targetElement.querySelector('[name="editCmd"]');
            editCmd.src = '/icons/edit.png';
            timeElement.classList.add('clock-li-readonly');
            var resultTime = convertShortSummaryTimeToString(convertTimeToSummaryTime(time));
            timeElement.value = resultTime;
            actionUpdateTimeFromList(domain, time);
            actionUpdateList();
        }
    }
}
// A method to check whether it contains the restriction site or not.
function isContainsRestrictionSite(domain) {
    return restrictionList.find(x => x.url.isMatch(domain)) != undefined;
}
// A method to check whether it contains the notification site or not.
function isContainsNotificationSite(domain) {
    return notifyList.find(x => x.url.isMatch(domain)) != undefined;
}
// A method to check whether it contains the black site or not.
function isContainsBlackSite(domain) {
    return blackList.find(x => x.isMatch(domain)) != undefined;
}
// A method to update from restriction list.
function updateItemFromRestrictionList(domain, time) {
    restrictionList.find(x => x.url.isMatch(domain)).time = convertTimeToSummaryTime(time);
}
// A method to update from notification list.
function updateItemFromNotifyList(domain, time) {
    notifyList.find(x => x.url.isMatch(domain)).time = convertTimeToSummaryTime(time);
}
// A method to update black list.
function updateBlackList() {
    storage.saveValue(STORAGE_BLACK_LIST, blackList);
}
// A method to update restriction list.
function updateRestrictionList() {
    storage.saveValue(STORAGE_RESTRICTION_LIST, restrictionList);
}
// A method to update notification list.
function updateNotificationList() {
    storage.saveValue(STORAGE_NOTIFICATION_LIST, notifyList);
}
