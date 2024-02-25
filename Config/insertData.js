const pg = require("pg");

const conString =
  "postgres://nbtgwwle:BqeVKObgoM50cw9dBHMcjdF4bMnHrCvL@rain.db.elephantsql.com/nbtgwwle";

const client = new pg.Client(conString);

client.on("connect", () => {
  console.log("Connected to PostgreSQL database!");
  insertData();
});

async function insertData() {
  try {
    //DROP categories and product table initially
    //await client.query(`DROP TABLE IF EXISTS categories, products CASCADE`)

    // Insert categories
    const { rows } = await client.query(`
        SELECT COUNT(*) AS count FROM categories
    `);

    // If the count is 0, insert data into categories table
    if (rows[0].count === "0") {
      await client.query(`
          INSERT INTO categories (name) VALUES
          ('electronics'),
          ('clothing'),
          ('books')
      `);
      console.log("Categories inserted successfully.");
    } else {
      console.log("Categories already exist.");
    }

    // Insert products
    await client.query(`
      INSERT INTO products (category_id, title, price, description, availability)
      VALUES
      ('1', 'Smartphone', 499.99, 'Latest smartphone model', true),
      ('1', 'Laptop', 999.99, 'High-performance laptop', true),
      ('2', 'T-shirt', 19.99, 'Cotton T-shirt', true),
      ('2', 'Jeans', 39.99, 'Denim jeans', true),
      ('3', 'Python Programming', 29.99, 'Python programming book', true),
      ('3', 'JavaScript Basics', 19.99, 'Introduction to JavaScript', true)
      ON CONFLICT (category_id, title) DO NOTHING;
    `);
    console.log("Products inserted successfully.");

    console.log("Data inserted successfully");
    await client.end(); // Close the client connection
  } catch (error) {
    console.error("Error inserting data:", error);
    await client.end(); // Close the client connection
  }
}
client.connect();
