const express = require('express');
const { v4: uuid } = require('uuid');

const app = express();

app.use(express.json());

const customers = [];

/**
 * doc - string
 * name - string
 * id - uuid
 * statement - []
 */

app.post('/account', (req, res) => {
  const { doc, name } = req.body;

  const customerAlreadyExists = customers.some(x => x.doc === doc);

  if (customerAlreadyExists)
    return res.status(401).json({ error: 'Costumer already exists' });

  customers.push({ doc, name, id: uuid(), statement: [] });
  return res.status(201).send();
});

app.listen(8080, () => console.log('Listening on port 8080'));
