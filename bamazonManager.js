var mysql = require("mysql");
var dotenv = require("dotenv");
var inquirer = require('inquirer');
const cTable = require('console.table');
var clear = require('clear');
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
 //show the manager functions!
    managerMenu();
});

function managerMenu() {
    //set up the menu choice names and functions we want to call
    //this format lets us easily add new menu choice options in the future (or rearrange the options) simply by updating this array
    var menuOptions = [
        {
            name: "View Products For Sale",
            execute: viewAllProducts
        },
        {
            name: "View Low Inventory",
            execute: viewLowInventory
        },
        {
            name: "Add To Inventory",
            execute: addInventory
        },
        {
            name: "Add New Product",
            execute: addNewProduct
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

function addNewProduct() {
    clear();
    //first, run a query to grab the department info (so that we can only add items to departments that our Bamazon Supervisors have provided)
    connection.query("SELECT department_id, department_name FROM departments", function(error, results) {
        if(results.length===0) {
            console.log("Sorry, something went wrong. Please try again later.");
            connection.end();
            return;
        }
        else {
        //make a quick department list for inquirer based on the results we got back from the db
        var departmentOptions = [];
        results.forEach(function(department) {
            departmentOptions.push({ name: department.department_name, value: department.department_id});
        });

        //now ask a number of questions about the product - what to call it, which category to put it in, etc
        inquirer.prompt([{
            type: 'input',
            name: 'itemName',
            message: "Please enter the item name:",
            validate: function(val) {
                if(val==="") {
                    console.log("\nItem name cannot be blank!");
                    return false;
                }
                return true;
             }
        },
        {
            type: 'input',
            name: 'itemDesc',
            message: "Please enter a description (optional):"
        },
        {
            type: 'list',
            name: 'itemDept',
            message: "Please select the department this item belongs to:",
            choices: departmentOptions
        },
        {
            type: 'input',
            name: 'itemPrice',
            message: "Please set the price per item:",
            validate: function(val) {
            if( !isValidPrice(val) ) {
                console.log("\nPlease input a valid (non-zero) price with two decimal places!");
                return false;
            }
            return true;
        }
        },
        {
            type: 'input',
            name: 'itemStock',
            message: "Please input the starting quantity:",
            validate: function(val) {
            if( !isPositiveInteger(val) ) { //we can only stock non-zero numbers
                console.log("\nPlease input a valid (non-negative) whole number for the starting quantity!");
                return false;
            }
            return true; 
            }
        }
        //now, insert the product into our db!
    ]).then(function(answer) {
            connection.query("INSERT INTO products (product_name, description, department_id, price, stock_quantity) VALUES (?,?, ?, ?, ?)", [answer.itemName, answer.itemDesc,   answer.itemDept, answer.itemPrice, answer.itemStock], function(error, result) {
                if(error) throw error;
                if(result.insertId) {
                    console.log("Successfully added " + answer.itemName + "!");
                 }
                    managerMenu();
                 }); 

                }

            );
        }
    });
}

//function to see all the products that exist (whether they are in stock or not)
function viewAllProducts() {
    clear();
    connection.query("SELECT products.item_id, products.product_name, departments.department_name, products.price, products.stock_quantity FROM products JOIN departments ON departments.department_id = products.department_id", function(error, result) {
        if(error) throw error; //if an error occurs, show the error
        console.log("All Products:\n") //otherwise, show a header,
        console.table(result); //then show all the results in a table
        managerMenu();  //return to the main manager menu
    });

}

//function to quick review items which have low stock (<5 on hand)
function viewLowInventory() {
    clear();
    connection.query("SELECT products.item_id, products.product_name, departments.department_name, products.price, products.stock_quantity FROM products JOIN departments ON departments.department_id = products.department_id WHERE stock_quantity < 5 ORDER BY stock_quantity DESC", function(error, result) {
        if(error) throw error;
        if(result.length===0) { //if we didn't get any results back, it means that we're fully stocked!
            console.log("\nAll items in stock!");
        }
        else { //otherwise, show the items which are low in stock
            console.log("Low Inventory:\n")
            console.table(result);
        }
        //return to the main manager menu
        managerMenu();
    });

}

function addInventory() {
    clear();
    //first, display all the products as a reminder
     connection.query("SELECT products.item_id, products.product_name, departments.department_name, products.price, products.stock_quantity FROM products JOIN departments ON departments.department_id = products.department_id ORDER BY stock_quantity ASC;", function(error, result) {
        if(error) throw error;
        console.log("All Products:\n")
        console.table(result);

        //next, ask which item we'd like to add inventory to
        inquirer.prompt([{  
        type: 'input',
        name: "itemID",
        message: "Which item # would you like to add inventory to?",
        validate: function(val) {
            if( !isPositiveInteger(val) ) {
                console.log("\nPlease enter a valid (non-negative) integer for the item ID!");
                    return false;
            }
                return true;
            }
        },
        {
            type: 'input',
            name: 'newQuantity',
            message: "Please enter how much stock to add:",
            validate: function(val) {
                if( !isPositiveInteger(val) ) {
                    console.log("\nPlease enter a valid (non-negative) integer for the amount to add!");
                        return false;
                }
                    return true;
            }
        }]).then(function(answer) {
            //now we attempt to update the stock quantity 
            connection.query("UPDATE products SET stock_quantity = stock_quantity + ? WHERE item_id = ?", [answer.newQuantity, answer.itemID], function(error, result) {
                if(error) throw error;
                if(result.changedRows) { //if the update was successful, let the user know
                    console.log(answer.newQuantity + " units added!");
                }
                else {  //otherwise, the insert failed - let the user know
                    console.log("Sorry, we weren't able to update item #" + answer.itemID + ". Please check the item ID and try again.");
                }
                managerMenu(); //return to the manager menu
            });
        });
    });
}

//VALIDATION HELPER FUNCTIONS
function isPositiveInteger(num) {
    //an item id or stock quantity is valid if it's a positive, non-zero integer
    var numToTest = Number(num); //cast the input string to a number, since sometimes we get strings
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