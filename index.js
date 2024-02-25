const express = require("express");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const db = require("./Config/db");

const app = express();
const PORT = 3000;
const SECRET_KEY = "hash";

app.use(bodyParser.json());

// Register a new user
app.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // Insert the new user into the database
    await db.query(
      "INSERT INTO users (username, email, password) VALUES ($1, $2, $3)",
      [username, email, password]
    );

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if user exists
    const userQuery = await db.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (userQuery.rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = userQuery.rows[0];
    // Check password
    if (password !== user.password) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user.user_id }, SECRET_KEY, {
      expiresIn: "24h",
    });
    res.json({ token });
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token == null) {
    return res.sendStatus(401);
  }

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      return res.sendStatus(403);
    }
    req.user = user;
    next();
  });
}

app.get("/api", authenticateToken, (req, res) => {
  res.json(req.user);
});

//get categories
app.get("/api/categories", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM categories");
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Get products by category
app.get("/api/products", async (req, res) => {
  const categoryId = req.query.category_id;
  try {
    const result = await db.query(
      "SELECT * FROM products WHERE category_id = $1",
      [categoryId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Get product details
app.get("/api/products/:productId", async (req, res) => {
  const productId = req.params.productId;
  try {
    const result = await db.query("SELECT * FROM products WHERE id = $1", [
      productId,
    ]);
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ message: "Product not found" });
    }
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Add to cart
app.post("/api/cart/add", async (req, res) => {
  const { userId, productId, quantity } = req.body;

  try {
    // Check if the product exists
    const productExistsQuery = await db.query(
      "SELECT * FROM products WHERE id = $1",
      [productId]
    );

    if (productExistsQuery.rows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Add the product to the cart
    const addToCartQuery = await db.query(
      "INSERT INTO carts (user_id, product_id, quantity) VALUES ($1, $2, $3)",
      [userId, productId, quantity]
    );

    res.json({ message: "Product added to cart" });
  } catch (error) {
    console.error("Error adding product to cart:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Update/Delete cart item
app.post("/api/cart/update", async (req, res) => {
  const { userId, productId, quantity } = req.body;

  try {
    if (quantity <= 0) {
      // If quantity is zero or less, remove the item from the cart
      await db.query(
        "DELETE FROM carts WHERE user_id = $1 AND product_id = $2",
        [userId, productId]
      );
    } else {
      // Otherwise, update the quantity of the item in the cart
      await db.query(
        "UPDATE carts SET quantity = $1 WHERE user_id = $2 AND product_id = $3",
        [quantity, userId, productId]
      );
    }

    res.json({ message: "Cart updated successfully" });
  } catch (error) {
    console.error("Error updating cart:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// View cart
app.get("/api/cart/view", async (req, res) => {
  //get userId from jwt token
  const token =
    req.headers.authorization && req.headers.authorization.split(" ")[1];
  const decoded = jwt.verify(token, SECRET_KEY);
  const userId = decoded.userId;
  try {
    const result = await db.query("SELECT * FROM carts WHERE user_id = $1", [
      userId,
    ]);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching cart:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Place order
app.post("/api/orders/place", async (req, res) => {
  try {
    // Extract userId from the JWT token
    const token =
      req.headers.authorization && req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, SECRET_KEY);
    const userId = decoded.userId;

    // Extract items from the request body
    const { items } = req.body;

    // Insert a new row into the Orders table
    const orderResult = await db.query(
      "INSERT INTO Orders (user_id, total_price, status) VALUES ($1, $2, $3) RETURNING order_id",
      [userId, calculateTotalPrice(items), "pending"]
    );

    const orderId = orderResult.rows[0].order_id;

    // Insert rows into the OrderItems table for each item in the order
    for (const item of items) {
      await db.query(
        "INSERT INTO OrderItems (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)",
        [orderId, item.product_id, item.quantity, item.price]
      );
    }

    res.json({ message: "Order placed successfully", orderId });
  } catch (error) {
    console.error("Error placing order:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Helper function to calculate the total price of the order based on the items
function calculateTotalPrice(items) {
  return items.reduce((total, item) => total + item.quantity * item.price, 0);
}

// Order history
app.get("/api/orders/history", async (req, res) => {
  try {
    // Extract userId from the JWT token
    const token =
      req.headers.authorization && req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, SECRET_KEY);
    const userId = decoded.userId;

    // Query the database to fetch order history for the user
    const orderHistory = await db.query(
      "SELECT * FROM Orders WHERE user_id = $1",
      [userId]
    );

    // Return the order history as JSON response
    res.json(orderHistory.rows);
  } catch (error) {
    console.error("Error fetching order history:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Get order details
app.get("/api/orders/:orderId", async (req, res) => {
  try {
    const orderId = req.params.orderId;

    // Query the database to fetch order details for the specified orderId
    const orderDetails = await db.query(
      "SELECT * FROM Orders WHERE order_id = $1",
      [orderId]
    );

    // Check if the order exists
    if (orderDetails.rows.length === 0) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json(orderDetails.rows[0]);
  } catch (error) {
    console.error("Error fetching order details:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
