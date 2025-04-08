const express = require('express');
const router = express.Router();
const db = require('../db');

// Obtener ejercicios por día
router.get('/:day', (req, res) => {
  const { day } = req.params;
  const sql = 'SELECT * FROM exercises WHERE day = ?';
  db.query(sql, [day], (err, results) => {
    if (err) return res.status(500).send(err);
    res.json(results);
  });
});

// Agregar nuevo ejercicio (sin registros)
router.post('/', (req, res) => {
  const { name, day } = req.body;
  const sql = 'INSERT INTO exercises (name, day) VALUES (?, ?)';
  db.query(sql, [name, day], (err, result) => {
    if (err) return res.status(500).send(err);
    res.json({ id: result.insertId, name, day });
  });
});

// Eliminar ejercicio (y registros asociados por ON DELETE CASCADE)
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const sql = 'DELETE FROM exercises WHERE id = ?';
  db.query(sql, [id], (err) => {
    if (err) return res.status(500).send(err);
    res.sendStatus(204);
  });
});

// Obtener historial de registros para un ejercicio
router.get('/logs/:exerciseId', (req, res) => {
  const { exerciseId } = req.params;
  const sql = 'SELECT * FROM exercise_logs WHERE exercise_id = ? ORDER BY date DESC';
  db.query(sql, [exerciseId], (err, results) => {
    if (err) return res.status(500).send(err);
    res.json(results);
  });
});

// Agregar registro al historial de un ejercicio
router.post('/logs', (req, res) => {
  const { exercise_id, date, sets, reps, weight } = req.body;
  const sql = 'INSERT INTO exercise_logs (exercise_id, date, sets, reps, weight) VALUES (?, ?, ?, ?, ?)';
  db.query(sql, [exercise_id, date, sets, reps, weight], (err, result) => {
    if (err) return res.status(500).send(err);
    res.json({ id: result.insertId, exercise_id, date, sets, reps, weight });
  });
});
// Editar nombre de un ejercicio
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  db.query('UPDATE exercises SET name = ? WHERE id = ?', [name, id], (err) => {
    if (err) return res.status(500).send(err);
    res.sendStatus(200);
  });
});

// Editar un registro
router.put('/logs/:logId', (req, res) => {
  const { logId } = req.params;
  const { date, sets, reps, weight } = req.body;
  const sql = 'UPDATE exercise_logs SET date = ?, sets = ?, reps = ?, weight = ? WHERE id = ?';
  db.query(sql, [date, sets, reps, weight, logId], (err) => {
    if (err) return res.status(500).send(err);
    res.sendStatus(200);
  });
});
// Eliminar un registro
router.delete('/logs/:logId', (req, res) => {
  const { logId } = req.params;
  db.query('DELETE FROM exercise_logs WHERE id = ?', [logId], (err) => {
    if (err) return res.status(500).send(err);
    res.sendStatus(204);
  });
});

module.exports = router;
