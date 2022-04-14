'use strict';
var tabs;
var timeIntervalList;
var currentTab;
var isNeedDeleteTimeIntervalFromTabs = false;
var activity = new Activity();
var storage = new LocalStorage();
var setting_black_list;
var setting_restriction_list;
var setting_interval_save;
var setting_interval_inactivity;
var setting_view_in_badge;
var setting_dark_mode;
var setting_notification_list;
var setting_notification_message;
var isHasPermissioForNotification;
// A method to update summary time.
function updateSummaryTime() {
    setInterval(backgroundCheck, SETTINGS_INTERVAL_CHECK_DEFAULT);
}
// A method to update storage.
function updateStorage() {
    setInterval(backgroundUpdateStorage, SETTINGS_INTERVAL_SAVE_STORAGE_DEFAULT);
}
// A method to keep track/check of background
function backgroundCheck() {
    chrome.windows.getLastFocused({ populate: true }, function(currentWindow) {
        if (currentWindow.focused) {
            var activeTab = currentWindow.tabs.find(t => t.active === true);
            if (activeTab !== undefined && activity.isValidPage(activeTab)) {
                var activeUrl = new Url(activeTab.url);
                var tab = activity.getTab(activeUrl);
                if (tab === undefined) {
                    activity.addTab(activeTab);
                }
                if (activity.isInBlackList(activeUrl)) {
                    chrome.browserAction.setBadgeBackgroundColor({ color: '#FF0000' })
                    chrome.browserAction.setBadgeText({
                        tabId: activeTab.id,
                        text: 'n/a'
                    });
                } else {
                    if (tab !== undefined) {
                        if (!tab.url.isMatch(currentTab)) {
                            activity.setCurrentActiveTab(tab.url);
                        }
                        chrome.idle.queryState(parseInt(setting_interval_inactivity), function(state) {
                            if (state === 'active') {
                                mainTRacker(activeUrl, tab, activeTab);
                            } else checkDOM(state, activeUrl, tab, activeTab);
                        });
                    }
                }
            }
        } else activity.closeIntervalForCurrentTab(true);
    });
}
// A main method to track the tabs
function mainTRacker(activeUrl, tab, activeTab) {
    if (activity.isLimitExceeded(activeUrl, tab)) {
        setBlockPageToCurrent(activeTab.url);
    }
    if (!activity.isInBlackList(activeUrl)) {
        if (activity.isNeedNotifyView(activeUrl, tab)) {
            if (isHasPermissioForNotification) {
                showNotification(activeUrl, tab);
            } else {
                checkPermissionsForNotifications(showNotification, activeUrl, tab);
            }
        }
        tab.incSummaryTime();
    }
    if (setting_view_in_badge === true) {
        chrome.browserAction.setBadgeBackgroundColor({ color: '#1aa1434d' })
        var summary = tab.days.find(s => s.date === todayLocalDate()).summary;
        chrome.browserAction.setBadgeText({
            tabId: activeTab.id,
            text: String(convertSummaryTimeToBadgeString(summary))
        });
    } else {
        chrome.browserAction.setBadgeBackgroundColor({ color: [0, 0, 0, 0] })
        chrome.browserAction.setBadgeText({
            tabId: activeTab.id,
            text: ''
        });
    }
}
// A method to show notificaitons.
function showNotification(activeUrl, tab) {
    chrome.notifications.clear('watt-site-notification', function(wasCleared) {
        if (!wasCleared) {
            console.log('!wasCleared');

            chrome.notifications.create(
                'watt-site-notification', {
                    type: 'basic',
                    iconUrl: 'icons/128x128.png',
                    title: "Timely",
                    contextMessage: activeUrl + ' ' + convertShortSummaryTimeToString(tab.getTodayTime()),
                    message: setting_notification_message
                },
                function(notificationId) {
                    console.log(notificationId);
                    chrome.notifications.clear('watt-site-notification', function(wasCleared) {
                        if (wasCleared)
                            notificationAction(activeUrl, tab);
                    });
                });
        } else {
            notificationAction(activeUrl, tab);
        }
    });
}
function notificationAction(activeUrl, tab) {
    chrome.notifications.create(
        'watt-site-notification', {
            type: 'basic',
            iconUrl: 'icons/128x128.png',
            title: "Timely",
            contextMessage: activeUrl + ' ' + convertShortSummaryTimeToString(tab.getTodayTime()),
            message: setting_notification_message
        });
}
// A method to set current page as block page.
function setBlockPageToCurrent(currentUrl) {
    var blockUrl = chrome.runtime.getURL("block.html") + '?url=' + currentUrl;
    chrome.tabs.query({ currentWindow: true, active: true }, function(tab) {
        chrome.tabs.update(tab.id, { url: blockUrl });
    });
}
// A method to check if video is being played on tab or not.
function isVideoPlayedOnPage() {
    var videoElement = document.getElementsByTagName('video')[0];
    if (videoElement !== undefined && videoElement.currentTime > 0 && !videoElement.paused && !videoElement.ended && videoElement.readyState > 2) {
        return true;
    } else return false;
}
function backgroundUpdateStorage() {
    if (tabs != undefined && tabs.length > 0)
        storage.saveTabs(tabs);
    if (timeIntervalList != undefined && timeIntervalList.length > 0)
        storage.saveValue(STORAGE_TIMEINTERVAL_LIST, timeIntervalList);
}
// A method to set default settings.
function setDefaultSettings() {
    storage.saveValue(SETTINGS_INTERVAL_INACTIVITY, SETTINGS_INTERVAL_INACTIVITY_DEFAULT);
    storage.saveValue(SETTINGS_INTERVAL_RANGE, SETTINGS_INTERVAL_RANGE_DEFAULT);
    storage.saveValue(SETTINGS_VIEW_TIME_IN_BADGE, SETTINGS_VIEW_TIME_IN_BADGE_DEFAULT);
    storage.saveValue(SETTINGS_BLOCK_DEFERRAL, SETTINGS_BLOCK_DEFERRAL_DEFAULT);
    storage.saveValue(SETTINGS_DARK_MODE, SETTINGS_DARK_MODE_DEFAULT);
    storage.saveValue(SETTINGS_INTERVAL_SAVE_STORAGE, SETTINGS_INTERVAL_SAVE_STORAGE_DEFAULT);
    storage.saveValue(STORAGE_NOTIFICATION_MESSAGE, STORAGE_NOTIFICATION_MESSAGE_DEFAULT);
}
function checkSettingsImEmpty() {
    chrome.storage.local.getBytesInUse(['inactivity_interval'], function(item) {
        if (item == 0) {
            setDefaultSettings();
        }
    });
}
function setDefaultValueForNewSettings() {
    loadNotificationMessage();
}
// A method to change settings based on the event by the user.
function addListener() {
    chrome.tabs.onActivated.addListener(function(info) {
        chrome.tabs.get(info.tabId, function(tab) {
            activity.addTab(tab);
        });
    });
    chrome.webNavigation.onCompleted.addListener(function(details) {
        chrome.tabs.get(details.tabId, function(tab) {
            activity.updateFavicon(tab);
        });
    });
    chrome.runtime.onInstalled.addListener(function(details) {
        if (details.reason == 'install') {
            storage.saveValue(SETTINGS_SHOW_HINT, SETTINGS_SHOW_HINT_DEFAULT);
            setDefaultSettings();
        }
        if (details.reason == 'update') {
            storage.saveValue(SETTINGS_SHOW_HINT, SETTINGS_SHOW_HINT_DEFAULT);
            checkSettingsImEmpty();
            setDefaultValueForNewSettings();
            isNeedDeleteTimeIntervalFromTabs = true;
        }
    });
    chrome.storage.onChanged.addListener(function(changes, namespace) {
        for (var key in changes) {
            if (key === STORAGE_BLACK_LIST) {
                loadBlackList();
            }
            if (key === STORAGE_RESTRICTION_LIST) {
                loadRestrictionList();
            }
            if (key === STORAGE_NOTIFICATION_LIST) {
                loadNotificationList();
            }
            if (key === STORAGE_NOTIFICATION_MESSAGE) {
                loadNotificationMessage();
            }
            if (key === SETTINGS_INTERVAL_INACTIVITY) {
                storage.getValue(SETTINGS_INTERVAL_INACTIVITY, function(item) { setting_interval_inactivity = item; });
            }
            if (key === SETTINGS_VIEW_TIME_IN_BADGE) {
                storage.getValue(SETTINGS_VIEW_TIME_IN_BADGE, function(item) { setting_view_in_badge = item; });
            }
            if (key === SETTINGS_DARK_MODE) {
                storage.getValue(SETTINGS_DARK_MODE, function(item) { setting_dark_mode = item; });
            }
        }
    });
}
// A method to load tabs from storage.
function loadTabs() {
    storage.loadTabs(STORAGE_TABS, function(items) {
        tabs = [];
        items = items || [];
        for (var i = 0; i < items.length; i++) {
            tabs.push(new Tab(items[i].url, items[i].favicon, items[i].days, items[i].summaryTime, items[i].counter));
        }
        if (isNeedDeleteTimeIntervalFromTabs)
            deleteTimeIntervalFromTabs();
    });
}
// A method to delete time intervals from tabs.
function deleteTimeIntervalFromTabs() {
    tabs.forEach(function(item) {
        item.days.forEach(function(day) {
            if (day.time != undefined)
                day.time = [];
        })
    })
}
function deleteYesterdayTimeInterval() {
    timeIntervalList = timeIntervalList.filter(x => x.day == todayLocalDate());
}
// A method to load black list.
function loadBlackList() {
    storage.getValue(STORAGE_BLACK_LIST, function(items) {
        setting_black_list = [];
        items = items || [];
            
        for (var i = 0; i < items.length; i++) {
            setting_black_list.push(new Url(url));
        }
    })
}
// A method to load time intervals.
function loadTimeIntervals() {
    storage.getValue(STORAGE_TIMEINTERVAL_LIST, function(items) {
        timeIntervalList = [];
        items = items || [];
        for (var i = 0; i < items.length; i++) {
            timeIntervalList.push(new TimeInterval(items[i].day, items[i].url || items[i].domain, items[i].intervals));
        }
        deleteYesterdayTimeInterval();
    });
}
// A method to load restriction list.
function loadRestrictionList() {
    storage.getValue(STORAGE_RESTRICTION_LIST, function(items) {
        setting_restriction_list = [];
        items = items || [];      
        for (var i = 0; i < items.length; i++) {
            setting_restriction_list.push(new Restriction(items[i].url || items[i].domain, items[i].time));
        }
    });
}
// A method to load notification list.
function loadNotificationList() {
    storage.getValue(STORAGE_NOTIFICATION_LIST, function(items) {
        setting_notification_list = [];
        items = items || [];
        for (var i = 0; i < items.length; i++) {
            setting_notification_list.push(new Notification(items[i].url || items[i].domain, items[i].time));
        }
    });
}
// A method to load notification message.
function loadNotificationMessage() {
    storage.getValue(STORAGE_NOTIFICATION_MESSAGE, function(item) {
        setting_notification_message = item;
        if (isEmpty(setting_notification_message)) {
            storage.saveValue(STORAGE_NOTIFICATION_MESSAGE, STORAGE_NOTIFICATION_MESSAGE_DEFAULT);
            setting_notification_message = STORAGE_NOTIFICATION_MESSAGE_DEFAULT;
        }
    });
}
// A method to load settings.
function loadSettings() {
    storage.getValue(SETTINGS_INTERVAL_INACTIVITY, function(item) { setting_interval_inactivity = item; });
    storage.getValue(SETTINGS_VIEW_TIME_IN_BADGE, function(item) { setting_view_in_badge = item; });
    storage.getValue(SETTINGS_DARK_MODE, function(item) { setting_dark_mode = item; });
}
// A method to load/add data from storage.
function loadAddDataFromStorage() {
    loadTabs();
    loadTimeIntervals();
    loadBlackList();
    loadRestrictionList();
    loadNotificationList();
    loadNotificationMessage();
    loadSettings();
}
// A method to load permissions for notifications.
function loadPermissions() {
    checkPermissionsForNotifications();
}
// A method to check permissions for notifications
function checkPermissionsForNotifications(callback, ...props) {
    chrome.permissions.contains({
        permissions: ["notifications"]
    }, function(result) {
        if (callback != undefined && result)
            callback(...props);
        isHasPermissioForNotification = result;
    });
}
loadPermissions();
addListener();
loadAddDataFromStorage();
updateSummaryTime();
updateStorage();
