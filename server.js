const nanoid = require('nanoid');
require('dotenv').config();

const express = require('express');
const path = require('path');
const bodyParse = require('body-parser');
const dns = require('dns');
const {
    MongoClient
} = require('mongodb');

const databaseUrl = process.env.DATABASE;



const app = express();
app.use(express.static(path.join(__dirname, 'public')))
app.use(bodyParse.json());

MongoClient.connect(databaseUrl, {
        useNewUrlParser: true
    })
    .then(client => {
        app.locals.db = client.db('shortener');
    })
    .catch(() => console.error('Failed to connect to the database'));


const shortenURL = (db, url) =>{
    const urlshortened = db.collection('shortenedURLs');
    return urlshortened.findOneAndUpdate({original_url: url}, {
        $setOnInsert: {
            original_url: url,
            short_id: nanoid(7),
        },
    },{
        returnOriginal: false,
        upsert:true,
    });
};


app.get('/', (req, res) => {
    const htmlhome = path.join(__dirname, 'public', 'index.html');
    res.sendFile(htmlhome);
});

const checkIfexists = (db,shorturl) => db.collection('shortenedURLs').findOne({short_id: shorturl});

app.get('/:short_id',(req,res) =>{
    const short_id =req.params.short_id;
    const {db} = req.app.locals;
    checkIfexists(db,short_id)
    .then(doc => {
        if(doc === null) return res.send('URL not found!');
        res.redirect(doc.original_url)
    }).catch(console.error);
    
});

app.post('/short', (req, res) => {
    let originalURL;
    try {
        originalURL = new URL(req.body.url);

    } catch (err) {
        return res.status(400).send({
            error: 'Invalid URL'
        });
    }
    dns.lookup(originalURL.hostname, (err) => {
        if (err) {
            return res.status(400).send({
                error: 'Address is not valid'
            });
        };
        const {db} = req.app.locals;
        shortenURL(db, originalURL.href)
        .then(result =>{
            const doc = result.value;
            res.json({
                original_url: doc.original_url,
                short_id: doc.short_id,
            });
        }).catch(console.error);
    });
});

const PORT = process.env.PORT || 8083;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT} ..`);

});