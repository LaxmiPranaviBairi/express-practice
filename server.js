require('dotenv').config();
const mongoose = require('mongoose');
const Note = require('./Note');

const bcrypt = require('bcrypt');
const User = require('./user');

//import jsonwebtoken and bcrypt 
const jwt = require('jsonwebtoken');

const authMiddleware = require('./authMiddleware');

const Group = require('./Group');

const Expense = require('./Expense');

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

//build the login route
app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

//add a simple protected test route
app.get('/auth/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

//create a group
app.post('/groups', authMiddleware, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'Group name is required' });

    const newGroup = await Group.create({
      name,
      members: [req.user.id],
      createdBy: req.user.id,
    });

    res.status(201).json(newGroup);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

//add a member to a group
app.post('/groups/:id/members', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: 'userId is required' });

    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const userToAdd = await User.findById(userId);
    if (!userToAdd) return res.status(404).json({ message: 'User not found' });

    if (group.members.includes(userId)) {
      return res.status(409).json({ message: 'User already in group' });
    }

    group.members.push(userId);
    await group.save();

    res.json(group);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

//get a group, with member details populated
app.get('/groups/:id', authMiddleware, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id).populate('members', 'name email');
    if (!group) return res.status(404).json({ message: 'Group not found' });

    res.json(group);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

//add an expense to a group
app.post('/groups/:id/expenses', authMiddleware, async (req, res) => {
  try {
    const { description, amount, paidBy, splitBetween } = req.body;

    if (!description || !amount || !paidBy || !splitBetween) {
      return res.status(400).json({ message: 'description, amount, paidBy, and splitBetween are required' });
    }

    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const totalShares = splitBetween.reduce((sum, s) => sum + s.share, 0);
    if (totalShares !== amount) {
      return res.status(400).json({ message: 'Shares must add up to the total amount' });
    }

    const newExpense = await Expense.create({
      group: req.params.id,
      description,
      amount,
      paidBy,
      splitBetween,
    });

    res.status(201).json(newExpense);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

//list all expenses for a group
app.get('/groups/:id/expenses', authMiddleware, async (req, res) => {
  try {
    const expenses = await Expense.find({ group: req.params.id })
      .populate('paidBy', 'name email')
      .populate('splitBetween.user', 'name email');

    res.json(expenses);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

//calculate net balance per person
function calculateNetBalances(expenses, memberIds) {
  const balances = {};
  memberIds.forEach(id => { balances[id.toString()] = 0; });

  expenses.forEach(expense => {
    const paidById = expense.paidBy.toString();
    balances[paidById] += expense.amount;

    expense.splitBetween.forEach(split => {
      const userId = split.user.toString();
      balances[userId] -= split.share;
    });
  });

  return balances;
}

//simplify into minimal settlements
function simplifyBalances(balances) {
  const creditors = [];
  const debtors = [];

  for (const [userId, amount] of Object.entries(balances)) {
    if (amount > 0) creditors.push({ userId, amount });
    else if (amount < 0) debtors.push({ userId, amount: -amount });
  }

  const settlements = [];
  let i = 0, j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    const settledAmount = Math.min(debtor.amount, creditor.amount);

    settlements.push({
      from: debtor.userId,
      to: creditor.userId,
      amount: settledAmount,
    });

    debtor.amount -= settledAmount;
    creditor.amount -= settledAmount;

    if (debtor.amount === 0) i++;
    if (creditor.amount === 0) j++;
  }

  return settlements;
}

//build the route using both functions
app.get('/groups/:id/balances', authMiddleware, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const expenses = await Expense.find({ group: req.params.id });

    const netBalances = calculateNetBalances(expenses, group.members);
    const settlements = simplifyBalances(netBalances);

    res.json({ netBalances, settlements });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});