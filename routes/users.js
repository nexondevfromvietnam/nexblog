const express = require("express");
const router = express.Router();
const User = require("../models/User");

// Get all users and display them in HTML format
router.get("/all", async (req, res) => {
  if (
    (req.session.user && req.session.user.roles === "administrator") ||
    (req.session.user && req.session.user.roles === "advanced")
  ) {
    try {
      const users = await User.find({});
      let userHtml = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>User List</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        background-color: #f4f4f4;
                        margin: 0;
                        padding: 20px;
                    }
                    .user-container {
                        background-color: #fff;
                        margin: 10px 0;
                        padding: 15px;
                        border-radius: 8px;
                        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
                    }
                    .user-title {
                        font-size: 18px;
                        font-weight: bold;
                        color: #333;
                    }
                    .user-details {
                        font-size: 14px;
                        color: #555;
                    }
                </style>
            </head>
            <body>
                <h1>User List | <a href="../dashboard">Back to Dashboard</a></h1>
            `;

      users.forEach((user) => {
        userHtml += `
                    <div class="user-container">
                        <div class="user-title">Username: ${user.username}</div>
                        <div class="user-details">DB ID: ${user._id}</div>
                        <div class="user-details">Roles: ${user.roles}</div>
                    </div>
                `;
      });

      userHtml += `
                </body>
                </html>
            `;

      res.send(userHtml);
    } catch (err) {
      console.error(err);
      res.status(500).send("An error occurred while fetching users");
    }
  } else {
    res.status(401).sendFile("../public/error.html?error=401 Unauthorized");
  }
});

module.exports = router;
