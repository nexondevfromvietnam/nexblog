const express = require("express");
const mongoose = require("mongoose");
const axios = require("axios");
const { MongoClient } = require("mongodb");
const session = require("express-session");
const bodyParser = require("body-parser");
const User = require("./models/User");
const Post = require("./models/Post");
const users = require("./routes/users");
const posts = require("./routes/posts");
const textile = require("textile-js");
require("dotenv").config();
const serverPort = 80; //use 443 for HTTPS

const app = express();

app.get("/", (req, res) => {
  res.redirect("/home");
});

// Connect to MongoDB Atlas
mongoose
  .connect(process.env.MONGODB_URI, {})
  .then(() => console.log("MongoDB connected..."))
  .catch((err) => console.log(err));

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static("public"));

// Session middleware
app.use(
  session({
    secret: "my_secret_key",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // Set to true in production with HTTPS
  })
);

app.use("/users", users); // Use the user routes
app.use("/post", posts);

// Route to serve login/register page
app.get("/login", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

app.post("/register", async (req, res) => {
  const { username, password, registrationCode } = req.body;

  try {
    if (registrationCode === "applepizza1") {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.redirect("/login?error=Username already exists");
      }

      const user = new User({
        username,
        password,
        roles: "default", // Explicitly set roles to 'default'
      });

      await user.save();
      req.session.user = user;
    } else {
      return res.redirect(
        "/login?error=Registration Code invalid, ask your admin for new code"
      );
    }

    res.redirect("/dashboard");
  } catch (err) {
    console.error(err);
    res.redirect("/login?error=An error occurred");
  }
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.redirect("/login?error=Invalid username or password");
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.redirect("/login?error=Invalid username or password");
    }

    req.session.user = user;
    if (req.session.user.roles === "administrator") {
      const embed = {
        title: "New Admin login detected",
        description: `Username: ${req.session.user.username} \n IP: ${
          req.headers["x-forwarded-for"] || req.connection.remoteAddress
        }`,
        color: 0x00ff00, // Green color in hexadecimal
        footer: {
          text: "Send from Nexon Server | NodeJS",
        },
        timestamp: new Date(),
      };
      const message = {
        username: "Nexon Logs",
        //avatar_url: , // Optional: URL for the bot's avatar
        embeds: [embed], // Embed object goes here
      };
      axios
        .post(process.env.DISCORD_WEBHOOK, message)
        .then((response) => {
          console.log("Log send", response.data);
        })
        .catch((error) => {
          console.error("Error sending embed message:", error);
        });
    }
    res.redirect("/dashboard");
  } catch (err) {
    console.error(err);
    res.redirect("/login?error=An error occurred");
  }
});

// Dashboard Route
app.get("/dashboard", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  res.send(`
       <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard</title>
    <link type="text/css" rel="stylesheet" href="/css/dashboard/css.css"/>
    <link rel="icon" href="./img/a.jpg" type="image"/>
</head>
<body>
    <div class="navbar-container">
        <button class="nav-toggle" id="navToggle">☰</button>
        <nav class="navbar" id="navbar">
            <button class="close-btn" id="closeBtn">&times;</button>
            <div class="nav-title">Nexon Enterprise Dashboard</div>
            <ul class="nav-links">
                <li><a href="../post/all">Post</a></li>
                <li><a href="../post/submit">Submit post</a></li>
                <li><a href="../post/manage">Manage post</a></li>
                <li><a href="./author/all">Author</a></li>
                <li><a href="#">Moderation tools</a></li>
                <li><a href="./users/all">Users</a></li>
            </ul>
        </nav>
    </div>

    <div class="main-content">
        <div class="welcome-container">
            <h1>Welcome, <span id="username">${req.session.user.username}</span></h1>
            <p>Your roles: ${req.session.user.roles}</p>
            <a href="/logout" class="logout-button">Logout</a>
        </div>
    </div>

    <script>
        const navToggle = document.getElementById('navToggle');
        const navbar = document.getElementById('navbar');
        const closeBtn = document.getElementById('closeBtn');

        navToggle.addEventListener('click', function() {
            navbar.classList.add('show');
        });

        closeBtn.addEventListener('click', function() {
            navbar.classList.remove('show');
        });

        // Close menu if user clicks outside
        window.addEventListener('click', function(event) {
            if (navbar.classList.contains('show') && event.target !== navToggle && !navbar.contains(event.target)) {
                navbar.classList.remove('show');
            }
        });
    </script>
</body>
</html>

    `);
});
// Logout Route
app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.redirect("/dashboard");
    }
    res.clearCookie("connect.sid");
    res.redirect("/login");
  });
});
app.get("/post/submit", (req, res) => {
  if (
    (req.session.user && req.session.user.roles === "administrator") ||
    (req.session.user && req.session.user.roles === "editor") ||
    (req.session.user && req.session.user.roles === "moderator")
  ) {
    res.sendFile(__dirname + "/public/submitPost.html");
  } else {
    res.status(401).send("<h1>401 Unauthorized</h1>");
  }
});
app.post("/submit-post", async (req, res) => {
  const { postTitle, postContent, thumbnailLink } = req.body;

  try {
    const newPost = new Post({
      title: postTitle,
      content: postContent,
      thumbnailLink:
        thumbnailLink ||
        "https://www.hubspot.com/hs-fs/hubfs/best-time-to-post-on-instagram-3.jpg?width=595&height=400&name=best-time-to-post-on-instagram-3.jpg",
      createdTime: new Date(),
    });

    await newPost.save();
    res.redirect("/home");
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .sendFile(
        __dirname + "./public/error.html?error=500 Internal server error"
      );
  }
});

// Route to display all posts
app.get("/home", async (req, res) => {
  try {
    const posts = await Post.find();
    let postList = posts
      .map((post) => {
        const truncatedContent =
          post.content.length > 25
            ? post.content.substring(0, 25) + "..."
            : post.content;

        return `
                <div class="post">
                    ${
                      post.thumbnailLink
                        ? `<img src="${post.thumbnailLink}" alt="Thumbnail" style="max-width: 100px;">`
                        : ""
                    }
                    <h2><a href="/post/${post._id}">${post.title}</a></h2>
                    <p>${truncatedContent}</p>
                    <p>Created on: ${post.createdTime.toDateString()}</p>
                </div>`;
      })
      .join("");

    res.send(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Home | NEXBlog</title>
                <link rel="stylesheet" href="../css/home/css.css">
                <link rel="preconnect" href="https://fonts.googleapis.com">
                <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                <link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap" rel="stylesheet">
                <link rel="icon" href="./img/a.jpg" type="image"/>
            </head>
            <body>
                <h1 style="text-align: center;">NEXBlog | Home</h1><p style="position: fixed; float: right; bottom: 2vh; right: 2vw;"><a href="/login">Login/Register</a></p>
                <div class="post-container">
                    ${postList}
                </div>
            </body>
            </html>
        `);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// Route to display an individual post
app.get("/post/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).send("Post not found.");
    }

    // Convert Textile content to HTML
    const contentHtml = textile.parse(post.content);

    res.send(`
            <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${post.title}</title>
    <link rel="stylesheet" href="../css/post/css.css">
    <link rel="icon" href="../img/a.jpg" type="image"/>
</head>
<body>
    <div class="post-container">
        <h1>${post.title}</h1>
        <div class="post-content">${contentHtml}</div>
        <p>Created on: ${post.createdTime.toDateString()}</p>
        <a href="/home" class="back-link">Back to all posts</a>
        <p style="text-align: center">Made with <a style="text-decoration: none;" href="https://github.com/nexondevfromvietnam/nexblog">NEXBlog</a></p>
    </div>
</body>
</html>

        `);
  } catch (err) {
    console.error(err);
    res.status(500).send("An error occurred while fetching the post.");
  }
});
// Start the server
app.listen(serverPort, (e) => {
  if (e) {
    console.log(e);
  } else console.log(`Server is on! Port ${serverPort}`);
});
