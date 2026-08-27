require('dotenv').config();
const mongoose = require('mongoose');
const Note = require('./Note');

const bcrypt = require('bcrypt');
const User = require('./user');

const express = require('express');
const app = express();

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

app.use(express.json());

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

const products = [
  { id: 1, name: 'Laptop', price: 50000 },
  { id: 2, name: 'Phone', price: 20000 },
  { id: 3, name: 'Headphones', price: 2000 },
];

app.get('/', (req, res) => {
  res.send('Hello World');
});

app.get('/about', (req, res) => {
  res.json({ name: 'your name', learning: 'Express' });
});

app.get('/greet/:name', (req, res) => {
  res.send(`Hello, ${req.params.name}!`);
});

app.get('/search', (req, res) => {
  const { term, limit } = req.query;
  res.json({ searchedFor: term, limit: limit });
});


// Get all notes from MongoDB
app.get('/notes', async (req, res) => {
  try {
    const notes = await Note.find();
    res.json(notes);
  } catch (err) {
    res.status(500).json({ message: 'Server error',error: err.message });
  }
});

// Get a single note by ID from MongoDB
app.get('/notes/:id', async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }
    res.json(note);
  } catch (err) {
    res.status(400).json({ message: 'Invalid ID format' });
  }
});

// Create a new note in MongoDB
app.post('/notes', async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ message: 'Text is required' });
  }

  try {
    const newNote = await Note.create({ text });
    res.status(201).json(newNote);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update a note by ID in MongoDB
app.put('/notes/:id', async (req, res) => {
  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ message: 'Text is required' });
  }

  try {
    const updatedNote = await Note.findByIdAndUpdate(
      req.params.id,
      { text },
      { new: true, runValidators: true }
    );

    if (!updatedNote) {
      return res.status(404).json({ message: 'Note not found' });
    }

    res.json(updatedNote);
  } catch (err) {
    res.status(400).json({ message: 'Invalid ID format' });
  }
});

// Delete a note by ID from MongoDB
app.delete('/notes/:id', async (req, res) => {
  try {
    const deletedNote = await Note.findByIdAndDelete(req.params.id);

    if (!deletedNote) {
      return res.status(404).json({ message: 'Note not found' });
    }

    res.status(204).send();
  } catch (err) {
    res.status(400).json({ message: 'Invalid ID format' });
  }
});

//build the signup route
app.post('/auth/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    res.status(201).json({
      id: newUser._id,
      name: newUser.name,
      email: newUser.email,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});