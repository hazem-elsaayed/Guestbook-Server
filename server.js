const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Post = require('./Models/Posts');
const User = require('./Models/Users');

const app = express();

app.use(express.json());

//preventing CORS error
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept'
  );
  res.header(
    'Access-Control-Allow-Methods',
    'GET, POST, OPTIONS, PUT, DELETE'
  );
  next();
});

//connecting to DB
mongoose
  .connect(
    'mongodb+srv://user:test1945@cluster0-306uy.mongodb.net/test?retryWrites=true&w=majority',
    { useUnifiedTopology: true, useNewUrlParser: true }
  )
  .then(() => console.log('Successfully connected to the database'))
  .catch((err) =>
    console.log('Could not connect to the database. Exiting now...', err)
  );

//root endpoint
app.get('/', (req, res) => {
  Post.find()
    .sort('-date')
    .then((data) => res.json(data))
    .catch((err) => res.status(400).json('Unable to get data'));
});

//new post endpoint
app.post('/post', (req, res) => {
  const { title, description, createdBy, email } = req.body;
  const post = new Post({
    title: title,
    description: description,
    createdBy: createdBy,
    email: email,
  });
  post
    .save()
    .then((data) => res.json(data))
    .catch((err) => res.status(400).json(err));
});

//edit post endpoint
app.post('/edit/:postId', (req, res) => {
  const { title, description } = req.body;
  if (!title || !description) {
    return res
      .status(400)
      .json('You can not submit empty Title and/or Description');
  }
  Post.findByIdAndUpdate(req.params.postId, {
    $set: { title: title, description: description, date: Date.now() },
  })
    .then((data) => res.json(data))
    .catch((err) => res.status(400).json(err));
});

//delete post endpoint
app.delete('/delete/:postId', (req, res) => {
  Post.findByIdAndDelete(req.params.postId)
    .then((data) => res.json(data))
    .catch((err) => res.status(400).json('Unable to delete post'));
});

//reply to post endpoint
app.post('/reply/:postId', (req, res) => {
  const { description, writtenBy } = req.body;
  if (!description) {
    return res.status(400).json('You can not submit empty description');
  }
  Post.findById(req.params.postId)
    .then((post) => {
      post.replies.push({ description: description, writtenBy: writtenBy });
      post
        .save()
        .then((data) => res.json(data))
        .catch((err) => res.status(400).json('Unable to save the data'));
    })
    .catch((err) => res.status(400).json('Unable to reply the post'));
});

//register new user end point
app.post('/register', (req, res) => {
  const { name, email, password } = req.body;
  let mailformat = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  if (!name || !email || !password || !email.match(mailformat)) {
    return res.status(400).json('Wrong Inputs');
  }
  let hashPass = bcrypt.hashSync(password);
  const user = new User({
    name: name,
    email: email,
    password: hashPass,
  });
  user
    .save()
    .then((user) =>
      res.json({
        id: user._id,
        name: user.name,
        email: user.email,
        date: user.date,
      })
    )
    .catch((err) => res.status(400).json(err));
});

//signin endpoint
app.post('/signin', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json('Empty Inputs');
  }
  User.findOne({ email: email })
    .then((user) => {
      const validPass = bcrypt.compareSync(password, user.password);
      if (validPass) {
        return res.json({
          id: user._id,
          name: user.name,
          email: user.email,
          date: user.date,
        });
      } else {
        return res.status(400).json('Wrong Credentials');
      }
    })
    .catch((err) => res.status(400).json('Unable to get the user'));
});

app.listen(5000, () => console.log('App is working on port 5000'));
