var mysql = require("mysql");
var dotenv = require("dotenv");
var inquirer = require('inquirer');
const cTable = require('console.table');
dotenv.config();

var connection = mysql.createConnection({
  host: process.env.DB_HOST,

  // Your port; if not 3306
  port: 3306,

  // Your username
  user: process.env.DB_USER,

  // Your password
  password: process.env.DB_PASS,
  database: "bamazon"
});

connection.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");
 //show the manager functions!
    supervisorMenu();
});

function supervisorMenu() {
    //set up the menu choice names and functions we want to call
    //this format lets us easily add new menu choice options in the future (or rearrange the options) simply by updating this array
    var menuOptions = [
        {
            name: "View All Departments",
            execute: viewDepartments
        },
        {
            name: "Add a New Department",
            execute: addDepartment
        },
        {
            name: "Quit",
            execute: function() {
                console.log("Goodbye!");
                connection.end();
            }
        }
    ];

    //build the display options that we give to inquirer
    var allChoices = [];
    menuOptions.forEach(function(option, index){
        allChoices.push({
            name: option.name, //we will show the user the name of the thing we're doing
            value: index       //and associate it with the index of the object in the array
        });
    });
    
    inquirer.prompt({
        type: 'list', 
        name: 'managerMenuChoice',
        message: "Please choose an action:",
        choices: allChoices
    }).then(function(answer) {
        //see which item the user chose
        var chosenOption = answer.managerMenuChoice;
        //attempt to run the correct function
        menuOptions[chosenOption].execute();
    });
}

function viewDepartments() {
    //open up a sql query for our department sales summary
    //NOTE: this particular query allows us to see also the results for any brand new
    //departments that don't yet have any products yet. This will show as null values
    connection.query('SELECT departments.department_id, departments.department_name, departments.over_head_costs,SUM(products.product_sales) AS "product_sales", SUM(products.product_sales)-departments.over_head_costs AS "total_profit" FROM departments LEFT JOIN products ON products.department_id = departments.department_id GROUP BY products.department_id ORDER BY departments.department_id', function(error, result) {
        if(error) throw error;
        //we probably got a lot of results back...let's show them pretty!
        console.table(result);
        //then go back to the main menu
        supervisorMenu();
    });
}

function addDepartment() {
    //first, ask the supervisor a couple questions...
    inquirer.prompt([{
        type: 'input', 
        name: 'deptName',
        message: 'What would you like to name the new department?',
        validate: function(val) {
            if(val==="") {
                console.log("\nPlease input a name!");
                return false;
            }
            return true;
        }
    },{
        type: 'input',
        name: 'overhead',
        message: 'What is the project yearly overhead cost (in dollars)?', 
        validate: function(val) {
            if(!isValidPrice(val)) {
                console.log("\nPlease input a price in dollars and cents (format: 1.32)");
                return false;
            }
            return true;
        }
    }]).then(function(answer){
        //then update the database with the new department's name and overhead costs!
        connection.query("INSERT INTO departments (department_name, over_head_costs) VALUES(?, ?)", [answer.deptName, answer.overhead] ,function(error, result) {
            if(error) throw error;
            if(result.changedRows) {
                console.log("Department added!");
            }
            else {
                console.log("Sorry, something went wrong. Please try your operation again later.");
            }   
            supervisorMenu();
        });

    });


}

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