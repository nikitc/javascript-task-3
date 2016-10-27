'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
exports.isStar = true;

/**
 * @param {Object} schedule – Расписание Банды
 * @param {Number} duration - Время на ограбление в минутах
 * @param {Object} workingHours – Время работы банка
 * @param {String} workingHours.from – Время открытия, например, "10:00+5"
 * @param {String} workingHours.to – Время закрытия, например, "18:00+5"
 * @returns {Object}
 */
var TIME_AFTER_ROBBERY = 30;
var ROBBERY_DAYS = 3;
var DAYS_IN_NUM = {
    'ПН': 0,
    'ВТ': 1,
    'СР': 2,
    'ЧТ': 3,
    'ПТ': 4,
    'СБ': 5,
    'ВС': 6
};

var DAYS_FROM_NUM = {
    0: 'ПН',
    1: 'ВТ',
    2: 'СР'
};

function getTimeZone(time) {
    var regTimeZone = /\+\d+/g;

    return parseInt(time.match(regTimeZone)[0], 10);
}

function parseBankWork(time) {
    var hours = parseInt(time.slice(0, 2), 10);
    var minutes = parseInt(time.slice(3, 5), 10);

    return hours * 60 + minutes;
}

function parseDay(day, hours, minutes, delta) {
    hours += delta;
    if (hours > 23) {
        day += 1;
        hours -= 24;
    }

    if (hours < 0) {
        day -= 1;
        hours += 24;
    }

    return { day: day, minutes: day * 24 * 60 + hours * 60 + minutes };
}

function timeConversion(time, delta) {
    var hours = parseInt(time.slice(3, 5), 10);
    var day = DAYS_IN_NUM[time.slice(0, 2)];
    var minutes = parseInt(time.slice(6, 8), 10);

    return parseDay(day, hours, minutes, delta);
}

function getFriendSchedule(schedule, timeZone) {
    var newSchedule = [];
    schedule.forEach(function (meet) {
        var meetTimeZone = getTimeZone(meet.from);
        var delta = timeZone - meetTimeZone;

        newSchedule.push({
            from: timeConversion(meet.from, delta),
            to: timeConversion(meet.to, delta)
        });
    });

    return newSchedule;
}

function leadToBankTime(schedule, workingHours) {
    var timeZone = getTimeZone(workingHours.from);
    var newSchedule = {};
    var friends = Object.keys(schedule);
    friends.forEach(function (friend) {
        newSchedule[friend] = getFriendSchedule(schedule[friend], timeZone);
    });

    return newSchedule;
}


function getHours(startTime, day) {
    return Math.floor((startTime - 60 * 24 * day) / 60);
}

function getMinutes(startTime, day, hours) {
    return startTime - 60 * 24 * day - hours * 60;
}

function convertToBegin(timeRobbery) {
    if (timeRobbery.minutes < 10) {
        timeRobbery.minutes = '0' + timeRobbery.minutes;
    }

    if (timeRobbery.hours < 10) {
        timeRobbery.hours = '0' + timeRobbery.hours;
    }

    return timeRobbery;
}

function getFormatRobbery(startTime) {
    var currentDay = Math.floor(startTime / (60 * 24));
    var currentHours = getHours(startTime, currentDay);

    return convertToBegin({
        day: currentDay,
        hours: currentHours,
        minutes: getMinutes(startTime, currentDay, currentHours)
    });
}

function compareIntervals(a, b) {
    if (a.value > b.value) {
        return 1;
    }
    if (a.value < b.value) {
        return -1;
    }

    if (a.segment === 'from') {
        return -1;
    }
}

function getAllIntervals(schedule) {
    var intervals = [];
    var friends = Object.keys(schedule);
    friends.forEach(function (friend) {
        schedule[friend].forEach(function (interval) {
            intervals.push({ segment: 'from', value: interval.from.minutes });
            intervals.push({ segment: 'to', value: interval.to.minutes });
        });
    });

    return intervals.sort(compareIntervals);
}

function getFreeIntervals(intervals) {
    intervals.push({ segment: 'from', value: ROBBERY_DAYS * 24 * 60 + 1 });
    intervals.push({ segment: 'to', value: ROBBERY_DAYS * 24 * 60 + 1 });
    var counter = 0;
    var prev = 0;
    var freeIntervals = [];
    intervals.forEach(function (interval) {
        if (!counter) {
            freeIntervals.push({ from: prev, to: interval.value });
        }
        if (interval.segment === 'from') {
            counter++;
        } else {
            counter--;
        }
        prev = interval.value;
    });

    return freeIntervals;
}

function isTimeBank(from, to, interval) {
    return (from <= interval.from <= to ||
            from <= interval.to <= to);
}

function getRobberyDay(from, to, freeIntervals) {
    freeIntervals.filter(function (interval) {
        return isTimeBank(from, to, interval);
    });

    return freeIntervals.map(function (interval) {
        return {
            from: Math.max(from, interval.from),
            to: Math.min(to, interval.to)
        };
    });
}

function getComfortableIntervals(freeIntervals, workingHours) {

    var robberyIntervals = [];
    for (var day = 0; day < ROBBERY_DAYS; day++) {
        var delta = day * 24 * 60;
        var currentRobberyDay = getRobberyDay(workingHours.from + delta,
                                                workingHours.to + delta,
                                                freeIntervals);
        robberyIntervals = robberyIntervals.concat(currentRobberyDay);
    }

    return robberyIntervals;
}

function getRobberyIntervals(schedule, workingHours) {
    var intervals = getAllIntervals(schedule);
    var freeIntervals = getFreeIntervals(intervals);

    return getComfortableIntervals(freeIntervals, workingHours);
}

function findTimeRobbery(robberyIntervals, duration) {
    var startTime = -1;
    for (var index = 0; index < robberyIntervals.length; index++) {
        var currentFrom = robberyIntervals[index].from;
        var currentTo = robberyIntervals[index].to;
        if (currentTo - currentFrom >= duration) {
            startTime = currentFrom;
            robberyIntervals[index].from += TIME_AFTER_ROBBERY;
            break;
        }
    }

    return startTime;
}

exports.getAppropriateMoment = function (schedule, duration, workingHours) {
    console.info(schedule, duration, workingHours);
    var newSchedule = leadToBankTime(schedule, workingHours);
    var newWorkingHours = { from: parseBankWork(workingHours.from),
                            to: parseBankWork(workingHours.to) };

    var robberyIntervals = getRobberyIntervals(newSchedule, newWorkingHours);
    var startTime = findTimeRobbery(robberyIntervals, duration);
    var startRobbery = getFormatRobbery(startTime);
    var exist = startTime !== -1;

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {

            return exist;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например,
         *   "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */

        format: function (template) {
            if (!exist) {
                return '';
            }

            return template
                .replace('%HH', startRobbery.hours)
                .replace('%MM', startRobbery.minutes)
                .replace('%DD', DAYS_FROM_NUM[startRobbery.day]);
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            var newStartTime = findTimeRobbery(robberyIntervals, duration);
            if (newStartTime === -1) {
                return false;
            }
            startTime = newStartTime;
            startRobbery = getFormatRobbery(startTime);

            return true;
        }
    };
};
