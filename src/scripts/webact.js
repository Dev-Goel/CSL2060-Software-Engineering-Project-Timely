'use strict';
var tabsFromBackground;
var storage = new LocalStorage();
var ui = new UI();
var totalTime, averageTime;
var tabsFromStorage;
var targetTabs;
var currentTypeOfList;
var setting_range_days;
var setting_dark_mode;
var restrictionList;
// A event listener that implements navigation between 'today', 'all-time', 'last week' and 'settings'
document.addEventListener('DOMContentLoaded', function () {
    ui.setPreloader();

    storage.getValue(SETTINGS_INTERVAL_RANGE, function (item) { setting_range_days = item; });
    document.getElementById('btnToday').addEventListener('click', function () {
        currentTypeOfList = TypeListEnum.ToDay;
        ui.setUIForToday();
        getDataFromStorage();
    });
    document.getElementById('donutChartBtn').addEventListener('click', function () {
        ui.setUIForDonutChart();
        getDataFromStorage();
    });
    document.getElementById('btnAll').addEventListener('click', function () {
        currentTypeOfList = TypeListEnum.All;
        ui.setUIForAll();
        getDataFromStorage();
    });
    document.getElementById('btnByDays').addEventListener('click', function () {
        currentTypeOfList = TypeListEnum.ByDays;
        ui.setUIForByDays(setting_range_days);
        getDataFromStorageByDays();
    });
    document.getElementById('settings').addEventListener('click', function () {
        if (chrome.runtime.openOptionsPage) {
            chrome.runtime.openOptionsPage();
        } else {
            window.open(chrome.runtime.getURL('options.html'));
        }
    });
});
firstInitPage();
// A method to initialize the page.
function firstInitPage() {
    chrome.runtime.getBackgroundPage(function (bg) {
        setting_dark_mode = bg.setting_dark_mode;
        ui.setMode();
        tabsFromBackground = bg.tabs;
        currentTypeOfList = TypeListEnum.ToDay;
        getLimitsListFromStorage();
        getDataFromStorage();
    });
}
window.addEventListener('click', function (e) {
    if (e.target.nodeName == 'SPAN' && e.target.className == 'span-url' && e.target.attributes.href.value != undefined){
        chrome.tabs.create({ url: e.target.attributes.href.value })
    }
});
 // A method to get restriction list from storage
function getLimitsListFromStorage(callback) {
    callback = callback || (() => {});
    if (!restrictionList) {
        storage.loadTabs(STORAGE_RESTRICTION_LIST, items => {
            getLimitsListFromStorageCallback(items);
            callback();
        });
    } else {
        callback();
    }
}
// A method to get tabs data from storage
function getDataFromStorage() {
    if (tabsFromBackground != undefined && tabsFromBackground != null && tabsFromBackground.length > 0)
        getTabsFromStorage(tabsFromBackground);
    else fillEmptyBlock();
}
function getDataFromStorageByDays() {
    if (tabsFromBackground != undefined && tabsFromBackground != null && tabsFromBackground.length > 0)
        getTabsByDays(tabsFromBackground);
}
function getLimitsListFromStorageCallback(items) {
    restrictionList = (items || []).map(item => new Restriction(item.url, item.time));
}
// A method to remove preloader and show chart.
function fillEmptyBlock() {
    ui.removePreloader();
    ui.fillEmptyBlock('chart');
}
// A method to create activity table all tabs for 'today' and 'all-time'
function getTabsFromStorage(tabs) {
    tabsFromStorage = tabs;
    targetTabs = [];
    ui.clearUI();
    if (tabs === null) {
      ui.fillEmptyBlock("chart");
      return;
    }
    var counterOfSite;
    if (currentTypeOfList === TypeListEnum.All) {
        targetTabs = tabs;
      if (targetTabs.length > 0) {
        totalTime = getTotalTime(targetTabs, currentTypeOfList);
      } else {
        ui.fillEmptyBlock("chart");
        return;
      }
      counterOfSite = tabs.length;
    }
    if (currentTypeOfList === TypeListEnum.ToDay) {
      targetTabs = tabs.filter((x) =>
        x.days.find((s) => s.date === todayLocalDate())
      );
      counterOfSite = targetTabs.length;
      if (targetTabs.length > 0) {
        targetTabs = targetTabs.sort(function (a, b) {
          return (
            b.days.find((s) => s.date === todayLocalDate()).summary -
            a.days.find((s) => s.date === todayLocalDate()).summary
          );
        });
        totalTime = getTotalTime(targetTabs, currentTypeOfList);
      } else {
        ui.fillEmptyBlock("chart");
        return;
      }
    }
    if (currentTypeOfList === TypeListEnum.All)
      ui.addTableHeader(
        currentTypeOfList,
        counterOfSite,
        totalTime,
        getFirstDay()
      );
    if (currentTypeOfList === TypeListEnum.ToDay)
      ui.addTableHeader(currentTypeOfList, counterOfSite, totalTime);
    var currentTab = getCurrentTab();
    var tabsForChart = [];
    var summaryCounter = 0;
    var tabGroups = getTabGroups(targetTabs, currentTypeOfList);
    for (var i = 0; i < tabGroups.length; i++) {
      var summaryTime = 0;
      var counter = 0;
      var tabGroup = tabGroups[i];
      summaryTime = tabGroup.summaryTime;
      counter = tabGroup.counter;
      summaryCounter += counter;
      const targetTab = tabGroup.tabs.find(t => t.url.isMatch(currentTab)) || tabGroup.tabs[0];
      if (
        currentTypeOfList === TypeListEnum.ToDay ||
        (currentTypeOfList === TypeListEnum.All && i <= 30)
      )
        ui.addLineToTableOfSite(
          targetTab,
          currentTab,
          summaryTime,
          currentTypeOfList,
          counter
        );
      else ui.addExpander();
      var tabForChartUrl = i <= 8 ? tabGroup.host : 'Others';
      addTabForChart(tabsForChart, tabForChartUrl, summaryTime, counter);
    }
    ui.addHrAfterTableOfSite();
    ui.createTotalBlock(totalTime, currentTypeOfList, summaryCounter);
    ui.drawChart(tabsForChart);
    ui.setActiveTooltip(currentTab);
    ui.removePreloader();
  }  
function getTabGroups(tabs, typeOfList, date) {
    var result = [];
    var tabGroups = groupTabsByHost(tabs);
    for(const host in tabGroups){
        var groupedTabs = tabGroups[host];
        result.push({
            host: host,
            counter: getTotalCount(groupedTabs, typeOfList, date),
            summaryTime: getTotalTime(groupedTabs, typeOfList, date),
            tabs: groupedTabs
        });
    }
    result.sort(function (a, b) {
        return b.summaryTime - a.summaryTime;
    });
    return result;
}
// A method to group tabs by host
function groupTabsByHost(tabs) {
    var tabGroups = tabs.reduce((groups, tab) => {
        var key = tab.url.host;
        (groups[key] = groups[key] || []).push(tab);
        return groups;
      }, {});
      return tabGroups;
}
function getTabsForExpander() {
    if (tabsFromBackground != undefined && tabsFromBackground != null && tabsFromBackground.length > 0)
        getTabsFromStorageForExpander(tabsFromBackground);
}
// A method to get the time interval list.
function getTimeIntervalList() {
    storage.getValue(STORAGE_TIMEINTERVAL_LIST, drawTimeChart);
}
function getTabsFromStorageForExpander(tabs) {
    tabsFromStorage = tabs;
    targetTabs = [];
    var currentTab = getCurrentTab();
    var tabGroups = getTabGroups(tabs, currentTypeOfList);
    for (var i = 31; i < tabGroups.length; i++) {
        var tabGroup = tabGroups[i];
        ui.addLineToTableOfSite(tabGroup, currentTab, tabGroup.summaryTime, currentTypeOfList, tabGroup.counter);
    }
    var table = ui.getTableOfSite();
    table.removeChild(table.getElementsByTagName('hr')[0]);
    ui.addHrAfterTableOfSite();
}
// A method to get all visits of a particular website
function getTotalCount(tabs, typeofList, date) {
    var total;
    if (typeofList === TypeListEnum.ToDay) {
        date = date || todayLocalDate();
        total = tabs.reduce((tot, tab) => {
            let item = tab.days.find((x) => x.date == date);
            return tot + (item.counter || 0);
        }, 0);
    } else if (typeofList === TypeListEnum.All) {
        total = tabs.reduce((tot, tab) => tot + tab.counter, 0);
    }
  
    return total;
}
// A method to get total time spent till date.
function getTotalTime(tabs, typeOfList, date) {
    var total;
    switch(typeOfList){
        case TypeListEnum.ByDays:
        case TypeListEnum.ToDay:
            date = date || todayLocalDate();
            var summaryTimeList = tabs.map(function (a) { return a.days.find(s => s.date === date).summary; });
            total = summaryTimeList.reduce(function (a, b) { return a + b; })
            break;
        case TypeListEnum.All:
            var summaryTimeList = tabs.map(function (a) { return a.summaryTime; });
            total = summaryTimeList.reduce(function (a, b) { return a + b; })
            break;
        default:               
    }
    return total;
}
// A method to get total time spent today.
function getTotalTimeForDay(day, tabs) {
    var total;
    var summaryTimeList = tabs.map(function (a) { return a.days.find(s => s.date === day).summary; });
    total = summaryTimeList.reduce(function (a, b) { return a + b; })
    return total;
}
// A method to get time spent in percentage.
function getPercentage(time) {
    return ((time / totalTime) * 100).toFixed(2) + ' %';
}
// A method to get time spent in percentage for chart.
function getPercentageForChart(time) {
    return ((time / totalTime) * 100).toFixed(2) / 100;
}
// A method to get current tab.
function getCurrentTab() {
    return chrome.extension.getBackgroundPage().currentTab;
}
function addTabForChart(tabsForChart, url, summaryTime, counter) {
    var tab = tabsForChart.find(x => x.url == url);
    if (tab === undefined) {
        tabsForChart.push({
            'url': url,
            'percentage': getPercentageForChart(summaryTime),
            'summary': summaryTime,
            'visits': counter
        });
    } else {
        tab['summary'] += summaryTime;
        tab['percentage'] = getPercentageForChart(tab['summary']);
        tab['visits'] += counter;
    }
}
function getFirstDay() {
    var array = [];
    tabsFromStorage.map(function (a) {
        return a.days.map(function (a) {
            if (array.indexOf(a.date) === -1)
                return array.push(a.date);
        });
    });

    array = array.sort(function (a, b) {
        return new Date(a) - new Date(b);
    });

    setStatData(array);
    return {
        'countOfDays': array.length,
        'minDate': array[0]
    };
}
function setStatData(array) {
    var arrayAscByTime = [];
    var arrayAscByTimeWithoutCurrentDay = [];
    tabsFromStorage.forEach(tab => {
        return tab.days.forEach(day => {
            var item = arrayAscByTime.find(x => x.date == day.date);
            if (item !== undefined) {
                return item.total += day.summary;
            }
            if (item === undefined)
                return arrayAscByTime.push({
                    'date': day.date,
                    'total': day.summary
                });
        });
    });
    arrayAscByTimeWithoutCurrentDay = arrayAscByTime.filter(function (item) {
        return item.date != todayLocalDate();
    })
    arrayAscByTime = arrayAscByTime.sort(function (a, b) {
        return a.total - b.total;
    });
    arrayAscByTimeWithoutCurrentDay = arrayAscByTimeWithoutCurrentDay.sort(function (a, b) {
        return a.total - b.total;
    });
}
// A method to get tabs by days.
function getTabsByDays(tabs) {
    var range = ui.getDateRange();
    if (tabs === undefined) {
        ui.fillEmptyBlockForDays();
        return;
    }
    if (range.from !== 'Invalid Date' && range.to !== 'Invalid Date' && isCorrectDate(range)) {
        var listOfDays = [];
        tabs.forEach(tab => {
            return tab.days.forEach(day => {
                var item = listOfDays.find(x => x.date == day.date);
                if (item !== undefined) {
                    return item.total += day.summary;
                }
                if (item === undefined && isDateInRange(day.date, range))
                    return listOfDays.push({
                        'date': day.date,
                        'total': day.summary
                    });
            });
        });
        listOfDays = listOfDays.sort(function (a, b) {
            return new Date(a.date) - new Date(b.date);
        });
        var getDaysArray = function (start, end) {
            let first = start;
            let second = end;
            var arr = [];
            for (let i = first; i <= second; i = new Date(i.setDate(i.getDate() + 1))) {
                arr.push(new Date(i).toLocaleDateString("en-US"));
            }
            return arr;
        };
        ui.fillListOfDays(listOfDays, getDaysArray(range.from, range.to));
    } else {
        ui.fillEmptyBlockForDaysIfInvalid();
    }
}
// A method to get tabs form storage by days.
function getTabsFromStorageByDay(day, blockName) {
    targetTabs = [];
    if (tabsFromStorage === null) {
        ui.fillEmptyBlock(blockName);
        return;
    }
    targetTabs = tabsFromStorage.filter(x => x.days.find(s => s.date === day));
    if (targetTabs.length > 0) {
        targetTabs = targetTabs.sort(function (a, b) {
            return b.days.find(s => s.date === day).summary - a.days.find(s => s.date === day).summary;
        });
        totalTime = getTotalTimeForDay(day, targetTabs);
    } else {
        ui.fillEmptyBlock(blockName);
        return;
    }
    var currentTab = getCurrentTab();
    var content = document.createElement('div');
    content.classList.add('content-inner');
    content.id = blockName + '_content';
    document.getElementById(blockName).appendChild(content);
    var tabGroups = getTabGroups(targetTabs, TypeListEnum.ByDays, day);
    for (const tabGroup of tabGroups){
        var summaryTime = tabGroup.summaryTime;
        var counter = tabGroup.counter;
        const targetTab = tabGroup.tabs.find(t => t.url.isMatch(currentTab)) || tabGroup.tabs[0];
        ui.addLineToTableOfSite(targetTab, currentTab, summaryTime, TypeListEnum.ByDays, counter, blockName + '_content');
    }
}
function fillValuesForBlockWithInActiveDay(prefix, dayValue, timeValue, flag) {
    if (flag == 'true') {
        document.getElementById(prefix).classList.add('hide');
        document.getElementById(prefix + 'Time').classList.add('hide');
        document.getElementById(prefix + 'WithoutCurrentDay').classList.remove('hide');
        document.getElementById(prefix + 'TimeWithoutCurrentDay').classList.remove('hide');
        document.getElementById(prefix + 'Title').innerHTML = 'Include the current day in the calculation of statistics';
        document.getElementById(prefix + 'Icon').dataset.today = false;
        document.getElementById(prefix + 'Icon').src = "/icons/no-today.svg";
        document.getElementById(prefix + 'WithoutCurrentDay').value = dayValue;
        document.getElementById(prefix + 'TimeWithoutCurrentDay').value = timeValue;
    }
    else {
        document.getElementById(prefix).classList.remove('hide');
        document.getElementById(prefix + 'Time').classList.remove('hide');
        document.getElementById(prefix + 'WithoutCurrentDay').classList.add('hide');
        document.getElementById(prefix + 'TimeWithoutCurrentDay').classList.add('hide');
        document.getElementById(prefix + 'Title').innerHTML = "Don't Include the current day in the calculation of statistics";
        document.getElementById(prefix + 'Icon').dataset.today = true;
        document.getElementById(prefix + 'Icon').src = "/icons/today.svg";
        document.getElementById(prefix).value = dayValue;
        document.getElementById(prefix + 'Time').value = timeValue;
    }
}
