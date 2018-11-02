//VALIDATION HELPER FUNCTIONS
function isPositiveInteger(num) {
    //an item id or stock quantity is valid if it's a positive, non-zero integer
    var numToTest = Number(num); //cast the input string to a number, since sometimes we get strings
    console.log(numToTest);
    if(isNaN(numToTest)) { //if the number could not be cast, it's not valid
        return false;
    }
    //okay, it's a number!  let's make sure it's a positive integer 
    else if(numToTest <= 0 || !Number.isInteger(numToTest) ) 
    {
        return false;
    }
    return true;
}

function isValidPrice(num) {
    //an item id or stock quantity is valid if it's a positive, non-zero integer
    var numToTest = Number(num); //cast the input string to a number, since sometimes we get strings
    console.log(numToTest);
    if(isNaN(numToTest)) { //if the number could not be cast, it's not valid
        return false;
    }
    //okay, it's a number!  let's make sure it's positive and non-zero
    else if(numToTest <= 0 ) 
    {
        return false;
    }
    //lastly, make sure that it passes our check for currency (two decimal places max)
    else if (!numToTest.toString().match(/^[0-9]\d*(?:\.\d{0,2})?$/)) {
        return false;
    }
    return true;
}
