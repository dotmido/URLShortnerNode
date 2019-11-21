const express = require('express');
const path = require('path');
const bodyParse = require('body-parser');
const dns = require('dns');

const app = express();
app.use(express.static(path.join(__dirname,'public')))
app.use(bodyParse.json());

app.get('/',(req,res)=>{
    const htmlhome = path.join(__dirname,'public','index.html');
    res.sendFile(htmlhome);
});

app.post('/short', (req, res) => {
    let originalURL;
    try{
        originalURL = new URL(req.body.url);
        
    } catch(err){
        return res.status(400).send({error : 'Invalid URL'});
    }
    dns.lookup(originalURL.hostname,(err)=>{
        if(err){
            return res.status(400).send({error: 'Address is not valid'});
        };
    });
});

const PORT = process.env.PORT || 8083;
app.listen(PORT, ()=>{
    console.log(`Server is running on port ${PORT} ..`);
    
});