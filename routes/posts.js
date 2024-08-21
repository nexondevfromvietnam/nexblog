const express = require("express");
const router = express.Router();
const Post = require("../models/Post");

// Get all users and display them in HTML format
router.get("/all", async (req, res) => {
  if (req.session.user) {
    try {
      const posts = await Post.find({});
      let postHtml = `
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
                <h1>Posts List | <a href="../dashboard">Back to Dashboard</a></h1>
            `;

      posts.forEach((post) => {
        postHtml += `
                    <div class="user-container">
                        <div class="user-title">Title: ${post.title}</div>
                        <div class="user-details">Author: ${post.author}</div>
                        <div class="user-details">Post content (raw): ${post.content}</div>
                        <div class="user-details">Timestamp: ${post.createdTime}</div>
                        <div class="user-details">Link: <a href="./${post._id}">Here</a></div>
                    </div>
                `;
      });

      postHtml += `
                </body>
                </html>
            `;

      res.send(postHtml);
    } catch (err) {
      console.error(err);
      res.status(500).send("An error occurred while fetching users");
    }
  } else {
    res.status(401).send(`401 Unauthorized`);
  }
});

router.get(`/post/manage/`, async (req, res) => {
  if (req.session.user) {
    try {
      const post = await Post.find({});
      let postHtml = `
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
                    .submit-btn {
                        background-color: #4CAF50;
                        color: white;
                        padding: 10px 20px;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                        text-align: center;
                        display: block;
                        width: 100%;
                    }

                </style>
            </head>
            <body>
                <h1>Posts List | <a href="../dashboard">Back to Dashboard</a></h1>
            `;

      post.forEach((post) => {
        postHtml += `
                    <div class="user-container">
                        <div class="user-title">Title: ${post.title}</div>
                        <div class="user-details">Author: ${post.author}</div>
                        <div class="user-details">Post content (raw): ${post.content}</div>
                        <div class="user-details">Timestamp: ${post.createdTime}</div>
                        <div class="user-details">Link: <a href="./${post._id}">Here</a></div>
                        <div class="user-details"><a class="submit-btn">Delete this post</a></div>
                    </div>
                `;
      });

      postHtml += `
                </body>
                </html>
            `;

      res.send(postHtml);
    } catch (err) {
      console.error(err);
      res.status(500).send("An error occurred while fetching users");
    }
  } else {
    res.status(401).send(`401 Unauthorized`);
  }
});

module.exports = router;
