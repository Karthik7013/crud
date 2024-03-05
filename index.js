const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const app = express();
const SECRET_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NWUxYTkxNzdkMGQ2YWI3N2VmZGQxYWMiLCJ1c2VybmFtZSI6ImthcnRoaWsiLCJpYXQiOjE3MDkyOTAyNDIsImV4cCI6MTcwOTI5Mzg0Mn0.RoaUt2IQKxD55PasZWN7avHc55ytfPGptzOnvq1gENU";
app.use(express.json());

app.use(cors());
mongoose
  .connect(
    "mongodb+srv://root:1234@cluster0.gbzago5.mongodb.net/crud?retryWrites=true&w=majority"
  )
  .then(() => {
    console.log("db connected");
    app.listen(8000, () => {
      console.log("server running on port 8000");
    });
  })
  .catch((err) => {
    console.log("failed to connect db", err);
  });

const postSchema = mongoose.Schema({
  post: { type: String, require: true },
  author:{type:String,require:true},
  created_by: { type: String, require: true },
  created_date: { type: Date, default: Date.now() },
  update_date: { type: Date, default: Date.now() },
});

const userSchema = mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  created_date: { type: Date, default: Date.now() },
});
const posts = mongoose.model("posts", postSchema);
const user = mongoose.model("user", userSchema);

// token verify middle ware
function verifyJWT(req, res, next) {
  console.log(req.headers, "headers");
  const token = req.headers["authorization"].split(" ")[1];
  if (!token) {
    return res.status(403).json({ message: "Token Not Provided" });
  }

  jwt.verify(token, SECRET_KEY, (err, decode) => {
    if (err) {
      return res.status(401).json({ message: "Invalid token" });
    }
    req.user = decode;
    next();
  });
}

// post routes
app.get("/", (req, res) => {
  res.status(200).json({ message: "REST FULL" });
});

app.get("/post/all", async (req, res) => {
  try {
    let allposts = await posts.find({});
    res.status(200).json({ posts: allposts });
  } catch (error) {
    res.status(500).json({ message: "Internal Error !" });
  }
});

app.post("/post/add", verifyJWT, async (req, res) => {
  try {
    let { userId } = req.user;
    let { post,author } = req.body;
    if (userId) {
      let newPost = {
        post,
        author,
        created_by: req.user.userId,
        created_date: Date.now(),
        update_date: Date.now(),
      };
      await posts.create(newPost);
      res.status(200).json({ message: "post added success !" });
    } else {
      res.status(400).json({ message: "Internal Error !" });
    }
  } catch (error) {
    res.status(500).json({ message: { ...error } });
  }
});

app.put("/post/edit/:id", (req, res) => {
  try {
    const { id } = req.params;
    res.status(200).json({ message: "post edit success !" });
  } catch (error) {
    res.status(500).json({ message: { ...error } });
  }
});

app.patch("/post/update/:id", (req, res) => {
  try {
    const { id } = req.params;
    res.status(200).json({ message: "post updated success !" });
  } catch (error) {
    res.status(500).json({ message: { ...error } });
  }
});

app.delete("/post/delete/:id", (req, res) => {
  try {
    const { id } = req.params;
    res.status(200).json({ message: "post deleted success !" });
  } catch (error) {
    res.status(500).json({ message: { ...error } });
  }
});

app.post("/account/signin", async (req, res) => {
  try {
    let { email, password } = req.body;
    let userExists = await user.findOne({ email: email });
    if (userExists) {
      if (userExists.password === password) {
        const token = jwt.sign(
          { userId: userExists._id, username: userExists.name },
          SECRET_KEY,
          { expiresIn: "1h" }
        );
        res
          .status(200)
          .json({ id: userExists._id, name: userExists.name, token });
      } else {
        res.status(401).json({ message: "wrong password" });
      }
    } else {
      res.status(404).json({ message: "user not found !" });
    }
  } catch (error) {
    res.status(500).json({ message: { ...error } });
  }
});

app.post("/account/signup", async (req, res) => {
  try {
    let { name, email, password } = req.body;
    await user.create({ name, email, password });
    res.status(200).json({ message: "registered success!" });
  } catch (error) {
    if (error.code === 11000) {
      res.status(401).json({ message: "Email is already Taken" });
    } else {
      res.status(500).json({ message: { ...error } });
    }
  }
});

app.get("/token", verifyJWT, (req, res) => {
  if (req.user) {
    res.status(200).json({ ...req.user });
  } else {
    res.status(201).json({ message: "login failed" });
  }
});

app.get("/user/:id", async (req, res) => {
  try {
    let { id } = req.params;
    let result = await user.findOne({ _id: id });
    if (result) {
      res.status(200).json({ message: result });
    } else {
      res.status(400).json({ message: "no user found" });
    }
  } catch (error) {
    res.status(500).json({ message: "internal error" });
  }
});