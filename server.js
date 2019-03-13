'use strict';

let express = require('express');
let mongo = require('mongodb');
let mongoose = require('mongoose');
let bodyParser = require('body-parser');
let cors = require('cors');
let dns = require('dns');

let app = express();

// Basic Configuration 
let port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true });

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here
app.use(bodyParser.urlencoded({extended: false}));

/* Create collection */
let Schema = mongoose.Schema;
let ShortenerSchema = new Schema({
  original_url: {type: String, required: true, unique: true},
  short_url: {type: String, unique: true}
})
let Shortener = mongoose.model('Shortener', ShortenerSchema);

let createShortener = function(req, res, done) {
  
 Shortener.countDocuments({}, function(Err, count) {
   
   let urlToCheck = req.body.url.replace(/https?:\/\//, "")
    
   dns.lookup(urlToCheck, function(err, address, family) {
    
     if(err) {
       res.json({"error":"invalid URL"});
       return
     }
    let form = new Shortener({original_url: req.body.url, short_url: count+1});

    form.save(function(err, data) {
      
      Shortener.find({original_url: req.body.url}, function(err, data) {
      
        res.json({user: req.body.url,
                 short_url: data[0]['short_url']
                 });
        
        if(err) done(err);
        done(null, data);
      });
    });
     
   });
   

  }); 
}                  

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

app.get('/api/shorturl/:url', function(req, res) {
  Shortener.find({short_url: req.params.url}, function(err, data) {
    res.redirect(data[0].original_url);
  });
});

// Return a JSON with all the shortcuts that are available
app.get('/api/list', function(req, res, next) {
  Shortener.find({}, function(err, data) {
    if(err) console.log(err);
    data = data.map((item) => {
      return {original_url: item.original_url, short_url: item.short_url} });
    res.json(data);
  });
});

// Post a new url to the database with it's shortcut so it can be used later by the user
app.post("/api/shorturl/new", function(req, res, next) {
  
  createShortener(req, res, function(err, data) {
    
    if(err) { return (next(err)); }
    if(!data) {
      console.log('Missing `done()` argument');
      return next({message: 'Missing callback argument'});
    }
  });
});

app.listen(port, function () {
  console.log('Node.js listening ...');
});
