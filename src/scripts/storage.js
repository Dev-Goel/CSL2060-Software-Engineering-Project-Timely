'use strict';
// Class 'Local Storage' to store tabs and memory usage by the user.
class LocalStorage {
    // A function to load tabs from chrome local storage.
    loadTabs(name, callback, callbackIsUndefined) {
        chrome.storage.local.get(name, function(item) {
            if (item[name] !== undefined) {
                var result = item[name];
                if (result !== undefined)
                    callback(result);
            } else {
                if (callbackIsUndefined !== undefined)
                    callbackIsUndefined();
            }
        });
    }
    // A function to save tabs from chrome local storage.
    saveTabs(value, callback) {
        chrome.storage.local.set({ tabs: value });
        if (callback !== undefined)
            callback();
    }
    // A function to save values from chrome local storage.
    saveValue(name, value) {
        chrome.storage.local.set({
            [name]: value
        });
    }
    // A function to get values from chrome local storage.
    getValue(name, callback) {
        chrome.storage.local.get(name, function(item) {
            if (item !== undefined) {
                callback(item[name]);
            }
        });
    }
    // A function to get memory usage from chrome local storage.
    getMemoryUse(name, callback) {
        chrome.storage.local.getBytesInUse(name, callback);
    };
}
