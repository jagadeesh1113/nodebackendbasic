var MongoClient = require('mongodb').MongoClient;
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var cors = require('cors');
var routesInitial = require('./routes/initial');
var dbUrl = "mongodb+srv://testAdmin:12345@cluster0-ja4r3.mongodb.net/ricehome";

MongoClient.connect(dbUrl, {useNewUrlParser: true},function (err, db) {
    if (err) throw err;
    console.log("Database created!");
    routesInitial.setDb(db,app);
});

app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(bodyParser.json());

var corsOptions = {
    origin: 'http://localhost:3001',
    optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}

app.use(cors(corsOptions));

app.listen(3000, () => {
    console.log('Server is running at Port 3000!')
});