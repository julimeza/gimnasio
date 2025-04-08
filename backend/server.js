const express = require('express');
const cors = require('cors');
const app = express();
const routinesRouter = require('./routes/routines');
const path = require('path');
app.use(express.static(path.join(__dirname, '../public')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});
app.use(cors());
app.use(express.json());
app.use('/api/routines', routinesRouter);
app.listen(3000, () => {
  console.log('Servidor backend corriendo en http://localhost:3000');
});
