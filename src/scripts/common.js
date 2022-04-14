var RangeForDays = {
    days7: 'days7',
};
var InactivityInterval = {
    second30: 30,
};
var TypeListEnum = {
    ToDay: 1,
    All: 2,
    ByDays: 3,
};
var STORAGE_TABS = 'tabs';
var STORAGE_BLACK_LIST = 'black_list';
var STORAGE_RESTRICTION_LIST = 'restriction_list';
var STORAGE_NOTIFICATION_LIST = 'notification_list';
var STORAGE_NOTIFICATION_MESSAGE = 'notification_message';
var STORAGE_TIMEINTERVAL_LIST = 'time_interval';
var SETTINGS_INTERVAL_INACTIVITY_DEFAULT = InactivityInterval.second30;
var SETTINGS_INTERVAL_CHECK_DEFAULT = 1000;
var SETTINGS_INTERVAL_SAVE_STORAGE_DEFAULT = 5000;
var SETTINGS_INTERVAL_RANGE_DEFAULT = RangeForDays.days7;
var SETTINGS_VIEW_TIME_IN_BADGE_DEFAULT = true;
var SETTINGS_DARK_MODE_DEFAULT = false;
var STORAGE_NOTIFICATION_MESSAGE_DEFAULT = 'Dear User! You have spent a lot of time on this website';
var SETTINGS_INTERVAL_INACTIVITY = 'inactivity_interval';
var SETTINGS_INTERVAL_SAVE_STORAGE = 'interval_save_in_storage';
var SETTINGS_INTERVAL_RANGE = 'range_days';
var SETTINGS_DARK_MODE = 'night_mode';
var SETTINGS_VIEW_TIME_IN_BADGE = 'view_time_in_badge';
function isEmpty(obj) {
    for (var prop in obj) {
        if (obj.hasOwnProperty(prop))
            return false;
    }
    return JSON.stringify(obj) === JSON.stringify({});
}
// A method to convert the input time to seconds.
function convertTimeToSummaryTime(time) {
    var resultTimeValue = Number(time);
    if (!isNaN(resultTimeValue)){
        return resultTimeValue;
    }
    var timeValue = time.split(':');
    var hour = timeValue[0];
    var min = timeValue[1];
    resultTimeValue = 0;
    if (hour > 0)
        resultTimeValue = hour * 3600;
    resultTimeValue += min * 60;
    return resultTimeValue;
}
// A method to convert the time (in secs) to time in string format.
function convertSummaryTimeToBadgeString(summaryTime) {
    var sec = (summaryTime);
    var min = (summaryTime / 60).toFixed(0);
    var hours = (summaryTime / (60 * 60)).toFixed(1);
    var days = (summaryTime / (60 * 60 * 24)).toFixed(0);
    if (sec < 60) {
        return sec + "s";
    } else if (min < 60) {
        return min + "m";
    } else if (hours < 24) {
        return hours + "h";
    } else {
        return days + "d"
    }
}
// A method to convert the summary time (in secs) to time in string format.
function convertShortSummaryTimeToString(summaryTime) {
    var hours = Math.floor(summaryTime / 3600);
    var totalSeconds = summaryTime % 3600;
    var mins = Math.floor(totalSeconds / 60);
    hours = zeroAppend(hours);
    mins = zeroAppend(mins);
    return hours + 'h : ' + mins + 'm';
}
function convertShortSummaryTimeToLongString(summaryTime) {
    var hours = Math.floor(summaryTime / 3600);
    var totalSeconds = summaryTime % 3600;
    var mins = Math.floor(totalSeconds / 60);
    hours = zeroAppend(hours);
    mins = zeroAppend(mins);
    return hours + ' hour ' + mins + ' minutes';
}
function getArrayTime(summaryTime) {
    var days = Math.floor(summaryTime / 3600 / 24);
    var totalHours = summaryTime % (3600 * 24);
    var hours = Math.floor(totalHours / 3600);
    var totalSeconds = summaryTime % 3600;
    var mins = Math.floor(totalSeconds / 60);
    var seconds = totalSeconds % 60;
    days = zeroAppend(days);
    hours = zeroAppend(hours);
    mins = zeroAppend(mins);
    seconds = zeroAppend(seconds);
    return {
        'days': days,
        'hours': hours,
        'mins': mins,
        'seconds': seconds
    };
}
function convertSummaryTimeToString(summaryTime) {
    var days = Math.floor(summaryTime / 3600 / 24);
    var totalHours = summaryTime % (3600 * 24);
    var hours = Math.floor(totalHours / 3600);
    var totalSeconds = summaryTime % 3600;
    var mins = Math.floor(totalSeconds / 60);
    var seconds = totalSeconds % 60;
    hours = zeroAppend(hours);
    mins = zeroAppend(mins);
    seconds = zeroAppend(seconds);
    if (days > 0)
        return days + 'd ' + hours + 'h ' + mins + 'm ' + seconds + 's';
    else return hours + 'h ' + mins + 'm ' + seconds + 's';
}
// A function that appends 0s for example instead of 1h it will show 01h.
function zeroAppend(time) {
    if (time < 10)
        return '0' + time;
    else return time;
}
// A function to check whether a date is present in the range or not.
function isDateInRange(dateStr, range) {
    return new Date(dateStr) >= range.from && new Date(dateStr) <= range.to;
}
// A function whether the date is valid or not.
function isCorrectDate(range) {
    return range.from.getFullYear() >= 2022 && range.to.getFullYear() >= 2022;
}
function getDateFromRange(range) {
    return 7;
}
function treatAsUTC(date) {
    var result = new Date(date);
    result.setMinutes(result.getMinutes() - result.getTimezoneOffset());
    return result;
}
// A function that returns the number of days between start date and end date.
function daysBetween(startDate, endDate) {
    var millisecondsPerDay = 24 * 60 * 60 * 1000;
    return ((treatAsUTC(endDate) - treatAsUTC(startDate)) / millisecondsPerDay) + 1;
}
function todayLocalDate(){
    return new Date().toLocaleDateString('en-US');
}
