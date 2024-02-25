const pg = require("pg");

const conString =
  "postgres://nbtgwwle:BqeVKObgoM50cw9dBHMcjdF4bMnHrCvL@rain.db.elephantsql.com/nbtgwwle"; //insert your own connection url given by elephantSQL

const client = new pg.Client(conString);

client.on("connect", () => {
  console.log("Connected to PostgreSQL database!");
  createTables();
});

async function createTables() {
  try {
    await client.query(`
        CREATE TABLE IF NOT EXISTS categories (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) UNIQUE NOT NULL
        )
    `);

    await client.query(`
        CREATE TABLE IF NOT EXISTS Products (
            id SERIAL PRIMARY KEY,
            category_id INT NOT NULL,
            title VARCHAR(255) NOT NULL,
            price DECIMAL(10, 2) NOT NULL,
            description TEXT,
            availability BOOLEAN NOT NULL,
            UNIQUE (category_id, title),
            FOREIGN KEY (category_id) REFERENCES categories(id)
        )
    `);

    // Create Users Table
    await client.query(`
        CREATE TABLE IF NOT EXISTS Users (
            user_id SERIAL PRIMARY KEY,
            username VARCHAR(50) NOT NULL,
            email VARCHAR(255) NOT NULL,
            password VARCHAR(255) NOT NULL
        )
    `);

    // Create Carts Table
    await client.query(`
        CREATE TABLE IF NOT EXISTS Carts (
            cart_id SERIAL PRIMARY KEY,
            user_id INT NOT NULL,
            product_id INT NOT NULL,
            quantity INT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES Users(user_id),
            FOREIGN KEY (product_id) REFERENCES Products(id)
        )
    `);

    // Create Orders Table
    await client.query(`
        CREATE TABLE IF NOT EXISTS Orders (
            order_id SERIAL PRIMARY KEY,
            user_id INT NOT NULL,
            total_price DECIMAL(10, 2) NOT NULL,
            status VARCHAR(50) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES Users(user_id)
        )
    `);

    // Create OrderItems Table
    await client.query(`
        CREATE TABLE IF NOT EXISTS OrderItems (
            order_item_id SERIAL PRIMARY KEY,
            order_id INT NOT NULL,
            product_id INT NOT NULL,
            quantity INT NOT NULL,
            price DECIMAL(10, 2) NOT NULL,
            FOREIGN KEY (order_id) REFERENCES Orders(order_id),
            FOREIGN KEY (product_id) REFERENCES Products(id)
        )
    `);
  } catch (error) {
    console.error("Error creating tables:", error);
  }
}

// Connect to the database
client.connect();

module.exports = client;
