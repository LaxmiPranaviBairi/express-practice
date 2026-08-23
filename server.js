const express = require('express');
const app = express();

app.use(express.json());

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

let notes = [
  { id: 1, text: 'Buy groceries' },
  { id: 2, text: 'Finish Express project' },
];
let nextId = 3;

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

app.get('/products', (req, res) => {
  res.json(products);
});

app.get('/products/:id', (req, res) => {
  const id = Number(req.params.id);
  const product = products.find(p => p.id === id);

  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }

  res.json(product);
});

app.post('/echo', (req, res) => {
  res.json({ youSent: req.body });
});

app.get('/notes',(req,res)=>{
  res.json(notes);
});

app.get('/notes/:id',(req,res)=>{
  const id=Number(req.params.id);
  const note=notes.find(n=>n.id===id);

  if(!note){
    return res.status(404).json({message: 'Note not found'});
  }

  res.json(note);
});

app.post('/notes', (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ message: 'Text is required' });
  }

  const newNote = { id: nextId++, text };
  notes.push(newNote);
  res.status(201).json(newNote);
});

app.put('/notes/:id', (req, res) => {
  const id = Number(req.params.id);
  const note = notes.find(n => n.id === id);

  if (!note) {
    return res.status(404).json({ message: 'Note not found' });
  }

  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ message: 'Text is required' });
  }

  note.text = text;
  res.json(note);
});

app.delete('/notes/:id', (req, res) => {
  const id = Number(req.params.id);
  const noteIndex = notes.findIndex(n => n.id === id);

  if (noteIndex === -1) {
    return res.status(404).json({ message: 'Note not found' });
  }

  notes.splice(noteIndex, 1);
  res.status(204).send();
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});