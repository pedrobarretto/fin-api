const express = require('express');
const { v4: uuid } = require('uuid');

const app = express();

app.use(express.json());

const customers = [];

// Middleware
function VerifyIfDocExists(req, res, next) {
  const { doc } = req.headers;
  const customer = customers.find(x => x.doc === doc);

  if (!customer)
    return res.status(400).send({ error: 'Customer not found' });

  req.customer = customer;

  return next();
};

function getBalance(statement) {
  const balance = statement.reduce((acc, operation) => {
    if (operation.type === 'credit') {
      return acc + operation.amount;
    } else {
      return acc - operation.amount;
    }
  }, 0);

  return balance;
};

// All routes above this line will use this middleware
// app.use(VerifyIfDocExists);


app.get('/account', VerifyIfDocExists, (req, res) => {
  const { customer } = req;
  return res.json(customer);
});

app.get('/account/all', (req, res) => {
  return res.json(customers);
});

app.post('/account', (req, res) => {
  const { doc, name } = req.body;

  const customerAlreadyExists = customers.some(x => x.doc === doc);

  if (customerAlreadyExists)
    return res.status(401).json({ error: 'Customer already exists' });

  const newCostumer = { doc, name, id: uuid(), statement: [] };

  customers.push(newCostumer);

  return res.status(201).json(newCostumer);
});

app.put('/account', VerifyIfDocExists, (req, res) => {
  const { customer } = req;
  const { name } = req.body;

  if (!name)
    return res.status(400).send({ error: 'Name must have length higher than 0' });

  customer.name = name;

  return res.status(201).json(customer); 
})

app.get('/statement', VerifyIfDocExists, (req, res) => {
  const { customer } = req;
  return res.json(customer.statement);
});

app.get('/statement/date', VerifyIfDocExists, (req, res) => {
  const { customer } = req;
  const { date } = req.query;

  const formatedDate = new Date(date + ' 00:00');

  const statement = customer.statement.filter(x => 
    x.createdAt.toDateString() === new Date(formatedDate).toDateString());

  return res.json(statement);
});

app.post('/deposit', VerifyIfDocExists, (req, res) => {
  const { customer } = req;
  const { description, amount } = req.body;

  const statementOperation = {
    description,
    amount,
    createdAt: new Date(),
    type: 'credit'
  };

  customer.statement.push(statementOperation);
  
  return res.status(201).json(customer.statement);
});

app.post('/withdraw', VerifyIfDocExists, (req, res) => {
  const { customer } = req;
  const { amount } = req.body;

  const balance = getBalance(customer.statement);

  if (!amount)
    return res.status(400).send({ error: 'Amount does not exists' });

  if (balance < amount)
    return res.status(400).send({ error: 'Insufficient founds' });

  const statementOperation = {
    amount,
    createdAt: new Date(),
    type: 'debit'
  };

  customer.statement.push(statementOperation);

  return res.status(201).json(statementOperation);
});

app.delete('/account', VerifyIfDocExists, (req, res) => {
  const { customer } = req;

  const index = customers.findIndex(x => x.doc === customer.doc);
  
  customers.splice(index, 1);

  return res.json(customers);
});

app.listen(8080, () => console.log('Listening on port 8080'));
