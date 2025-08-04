require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const routes = require('./routes');
const path = require('path');

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));
app.use(routes);


const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Sunucu ${port} portunda çalışıyor.`);
});
