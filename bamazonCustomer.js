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
 //attempt to take their order
  takeOrder();
});

//function to place orders 
//ASSUMES an active db connection
function takeOrder() {
 //start by clearing the screen and displaying the current stock list to the user 
 //NOTE: we don't show any items that are out of stock
 clear();
 var query = "SELECT products.item_id, products.product_name, departments.department_name, products.price, products.stock_quantity FROM products JOIN departments ON products.department_id = departments.department_id WHERE stock_quantity > 0 ORDER BY item_id ASC;"
 connection.query(query,function(error,results){
   if(error) throw error;
   if(results.length===0) {
     console.log("No items found.");
     connection.end(); //end the connection
     return; //and break out of the program altogether
   }
   else {
     //otherwise, show them what we have right now...
     console.table(results);
     //figure out the upper and lower bounds of the item_ids
     var startID = results[0].item_id;
     var endID = results[results.length-1].item_id
     
    //next, ask the customer what they'd like to order, and how much
    inquirer.prompt([{
        type: 'number',
       name: 'itemNumber',
       message: 'Which item number would you like to order?',
       validate: function(val) {
        if ( !isPositiveInteger(val) ) {
            console.log("\nPlease enter a positive, non-zero item number!");
        }
       else if(val < startID || val > endID ) {
         console.log("\nPlease enter the item id of a product.");
         return false;
       }
       return true;
       }
   }, 
   {
       type: 'number',
       name: 'quantity',
       message: 'How many would you like to order?', 
       validate: function(val) {
           if( !isPositiveInteger(val) ) {
               console.log("\nPlease enter a valid (non-zero) quantity!");
               return false;
           }   
           return true;
       }
   }]).then(function(answer){
        var itemNumber = answer.itemNumber;
        var requestedQuantity = answer.quantity;
        //attempt to update the item quantity!
        updateItemQuantity(itemNumber, requestedQuantity);
   });
     
    }
 });
}

function updateItemQuantity(itemID, requestedQuantity) {
    //first, look up how many we have on hand...we won't update the quantity if we can't fulfill the order (no partial orders)
    connection.query("SELECT stock_quantity from products WHERE item_id = ?",[itemID],function(error, result) {
        if(error) throw error;

        if(result.length===0) {
            console.log("Sorry, something went wrong...we are unable to find that item right now. Please try again later.");
            connection.end();
        }
        else {
            //first, make sure we have enough stock to handle the request!  If not, we'll tell them that we need to order more 
            //grab the stock quantity that we have currently...
            var onHands = result[0].stock_quantity;
            if(onHands < requestedQuantity) {
                //if the user asked for more product than we can fulfill, we need to tell them
                //FUTURE ENHANCEMENT: allow backorders!
                console.log("Unfortunately, we only have " + onHands + " right now. Please try ordering a different amount.");
                askToContinue("Would you like to do that now?");
            }
            else {
                //otherwise, we update the quantity!
                    connection.query("UPDATE products SET stock_quantity=stock_quantity - ?, product_sales = product_sales + (price * ?) WHERE item_id=? AND stock_quantity-? >=0", [requestedQuantity, requestedQuantity, itemID, requestedQuantity], function(error,result){
                        if(error) throw error;
                        if(result.changedRows) {
                            console.log("Great!  We have put in your order for " + requestedQuantity + ".");
                            askToContinue("Would you like to make another order?");
                        }
                        else {
                            console.log("Sorry, we aren't able to place that order!  Please try again.");
                            askToContinue("Would you like to do that now?");
                        }
                });
            }

        }

    });  
}

//a function to ask the user if they'd like to keep making orders
function askToContinue(customMessage) {
    inquirer.prompt(
        {
           type: 'confirm',
           message: customMessage,
           name: 'continue'
        }
    ).then(function(answer) {
        if(answer.continue) {
            takeOrder();
        }
        else {
            console.log("Goodbye!");
            connection.end();
        }
    }
    );
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
