//generate 9 groups with 3 students in each group
//9 groups with 3 students in each group
//assume the # of students is divisible by 3?  else, have the remainder be a crappy group

var students = ['Albert', 'Amber', 'Bryan', 'Craig', 'Dave', 'Hy', 'Jarred', 'Jules', 'Jover', 'Jia', 'James', 'Kayla', 'Kelvin', 'Kimmy', 'Keo', 'Kyle', 'Lakshmi', 'Michael', 'Nick', 'Pushpinder', 'Rudy', 'Scott', 'Simin', 'Theresa', 'Tassa', 'Trae', 'Ethan', 'Kevin', 'Chi', 'Jared'];

var groups = []; //create an array that will hold our groups

function formGroups(arr, groupSize) {
    if (arr.length > groupSize) { 
        //if we have more group members than the requested groupsize, we will slice it the normal way
        var currentGroup = [];
        for(let i = 0; i < groupSize; i++) {
            //grab a random index from our array
            var randomIndex = Math.floor(Math.random()*arr.length);
            currentGroup.push(arr[randomIndex]); //push the randomly selected person to the current group
            arr.splice(randomIndex, 1); //remove that person from the original array
        }
        groups.push(currentGroup.join(", "));
        formGroups(arr, groupSize);
    }
    else { 
        //we are on the last (possibly awkward numbered) group
        groups.push(arr.join(", ")); //add the remaining people into the groups collection
        arr = []; //then zero out the array
        //and we stop recursing because we're done!
    }
}

formGroups(students, 3);
console.log(groups);
