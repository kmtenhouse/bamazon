DROP DATABASE IF EXISTS bamazon;
CREATE DATABASE bamazon;
USE bamazon;

CREATE TABLE departments( 
    department_id MEDIUMINT NOT NULL AUTO_INCREMENT,
	department_name VARCHAR(255) NOT NULL,
    over_head_costs DECIMAL(6,2) NOT NULL, 
	PRIMARY KEY(department_id)
);

CREATE TABLE products(
	item_id MEDIUMINT NOT NULL AUTO_INCREMENT,
    product_name VARCHAR(255) NOT NULL,
    description VARCHAR(1024),
    price DECIMAL(10,2) NOT NULL,
    stock_quantity INTEGER(11) NOT NULL DEFAULT 0,
    department_id MEDIUMINT,
    product_sales DECIMAL(50,2) NOT NULL DEFAULT 0,
    PRIMARY KEY(item_id)
);