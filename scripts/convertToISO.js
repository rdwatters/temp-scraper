//Note that this function is very specific to the way that the date is presented inside 
//of the rendered HTML for news detail pages inside uta.edu/news/..
function convertToISO(dateStr) {
    var monthDictionary = {
        "January": "01",
        "February": "02",
        "March": "03",
        "April": "04",
        "May": "05",
        "June": "06",
        "July": "07",
        "August": "08",
        "September": "09",
        "October": "10",
        "November": "11",
        "December": "12"
    }
    var dateStringArr = dateStr.split(", ");
    var theYearString = dateStringArr[2];
    var monthAndDay = dateStringArr[1].split(" ");
    var theMonthStr = monthAndDay[0];
    var theDayStr = monthAndDay[1];
    if (theDayStr.length < 2){
        theDayStr = "0" + theDayStr;
    }
    var theMonthISO = monthDictionary[theMonthStr];
    var fullISOarray = [theYearString,theMonthISO,theDayStr];
    var fullISODate = fullISOarray.join("-");
    return fullISODate;
}

module.exports = convertToISO;