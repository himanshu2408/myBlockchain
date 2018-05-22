const express = require('express');
const app = express()
const bodyParser = require('body-parser');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

app.get('/blockchain', function (req, res) {
    res.send('Hello World.');
})

app.post('/transaction', function (req, res) {
    res.send('Hello World.');
})

app.get('/mine', function (req, res) {
    res.send('Hello World.');
})


app.listen(3000, function () {
    console.log('Listening on port 3000...');
})