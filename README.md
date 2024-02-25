# Triveous

Backend E-commerce API

To run the project

- clone the repository
- inside the main repository directory open new terminal
- run `npm install`
- run `nodemon index.js`

- for first time runners, you may change the connection string (i got mine from ElephantSQL).
  - run `node ./Config/insertData.js` only once this will automatically insert data inside categories and products table

API endpoints(tested on POSTMAN)

- /register
  - {
    "username":"userName",
    "email": "Email",
    "password": "Password"
    }
  - above json object to be added in body section in raw tab
  - method -> POST

![alt text](static/register.png)

- /login
  - {
    "email": "Email",
    "password": "Password"
    }
  - above json object to be added in body section in raw tab
  - method -> POST

![alt text](static/login.png)

- /api

  - except above two rest routes are protected
  - /api acts as middleware
  - in POSTMAN be sure to add bearer token as whatever token in returned by login route

- /api/categories
  - method -> GET
  - fetches all categories available

![alt text](static/categories.png)

- /api/products
  - method -> GET
  - {
    "category_id": "2"
    }
  - fetches all products available for that category

![alt text](static/products.png)

- /api/products/:productId
  - method -> GET
  - fetches product based on id's

![alt text](static/productsid.png)

- /api/cart/add
  - method -> POST
  - {
    "userId": "1",
    "productId": "1",
    "quantity": "2"
    }
  - adds item to cart table

![alt text](static/addToCart.png)

- /api/cart/view
  - method -> GET
  - fetches userId stored in jwt token and gives cart detail w.r.t. specific user

![alt text](static/cartView.png)

- /api/cart/update
  - method -> POST
  - update quantity of item, if quantity is less than zero it deletes that item

![alt text](static/cartUpdate.png)

- /api/orders/place 
    - method -> POSt 
    -   {
            "items": [
                {
                    "product_id": 1,
                    "quantity": 2,
                    "price": 10.99
                },
                {
                    "product_id": 2,
                    "quantity": 1,
                    "price": 29.99
                }
            ]
        }
    - adds items into order_item table and order in Order table

![alt text](static/placeOrder.png)

- /api/orders/history
    - method -> GET
    - fethes all order based on userId

![alt text](static/orderHistory.png)

- /api/orders/:orderId
    - method -> GET
    - fethches order based on order id

![alt text](static/orderById.png)

**feel free to connect with me regarding project