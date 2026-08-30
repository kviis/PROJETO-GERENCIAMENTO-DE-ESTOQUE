//server
const express = require('express');
const cors = require('cors');
const app = express();
const routes = require('./routes/rotas.routes');
const port = 3000;
 
require('dotenv').config({ path: './.env' });
require('dotenv').config({ path: './seguranca.env' });
 
app.use(cors({
    origin: [
        'http://localhost:5500',
        'http://127.0.0.1:5500',
        'http://localhost:3000',
        'http://127.0.0.1:3000'
    ]
}));
 
app.use(express.json());
 
app.use('/', routes);

app.listen(port, () => {
    console.log(`servidor rodando na porta ${port}`);
});