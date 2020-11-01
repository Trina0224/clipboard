//jshint esversion:6
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const _ = require("lodash");
const mongoose = require('mongoose');

const fs = require('fs');
const path = require('path');
//require('dotenv/config');
const multer = require('multer');
//Image module
//let imgModel = require('./model');



const PORT = process.env.PORT || 3000;


const homeStartingContent = "Click the link below and copy-paste anythin you want to keep it a while. The system will delete it after you read it or a while.";
const aboutContent = "Hac habitasse platea dictumst vestibulum rhoncus est pellentesque. Dictumst vestibulum rhoncus est pellentesque elit ullamcorper. Non diam phasellus vestibulum lorem sed. Platea dictumst quisque sagittis purus sit. Egestas sed sed risus pretium quam vulputate dignissim suspendisse. Mauris in aliquam sem fringilla. Semper risus in hendrerit gravida rutrum quisque non tellus orci. Amet massa vitae tortor condimentum lacinia quis vel eros. Enim ut tellus elementum sagittis vitae. Mauris ultrices eros in cursus turpis massa tincidunt dui.";
const contactContent = "The photo only accept less than 16MB, if you upload a photo which is larger than 16MB, you will lost it. The system will delete this file after a while. Please download it in the grace period.";
const errorContent = "The page already removed because expired or wrong link address.";

const app = express();

// Set EJS as templating engine
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

//app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json());




// Connecting to the database
mongoose.connect(process.env.MONGODB_APP_LINK,
    { useNewUrlParser: true, useUnifiedTopology: true }, err => {
        console.log('DB connected')
    });



//console.log(process.env.MONGODB_APP_LINK);
mongoose.set('useFindAndModify', false);

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "title field is required."]
  },
  content: {
    type: String,
    required: [true, "content field is required."]
  },
  timeStamp:{
    type: String,
    required: [true,"timeStamp is required."]
  }
});


const Post = mongoose.model("Post", postSchema);
//
const imageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "title field is required."]
  },
	desc: String,
	img:
	{
		data: Buffer,
		contentType: String
	},
  timeStamp:{
    type: String,
    required: [true,"timeStamp is required."]
  },
  timePeriod: {
    type: String,
    //required: [true, "time period field is required."]
  },
  oneTimeOnly: String

});
//Image is a model which has a schema imageSchema
//module.exports = new mongoose.model('Image', imageSchema);
const ImgModel = mongoose.model("Image", imageSchema);


//Image Upload Method:
//var fs = require('fs');
//var path = require('path');
//var multer = require('multer');

let storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, 'public/img') //truly path.
	},
	filename: (req, file, cb) => {
    const ext = file.mimetype.split('/')[1]; //which looks like 'image/jpeg'
		cb(null, `${file.fieldname}_${Date.now()}.${ext}`);

	}
});

const multerFilter = (req, file, cb) => { //is iamge?...
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload an image.', 400), false);
  }
};
//產生一個middle-ware,
const upload = multer({ storage: storage, fileFilter: multerFilter});
//const upload2 = multer({ storage: storage});






let posts = [];

app.get("/", function(req, res){

  Post.find({}, function(err, posts){
    res.render("home", {
      startingContent: homeStartingContent,
      posts: posts
      });
  });
});


app.get("/about", function(req, res){
  res.render("about", {aboutContent: aboutContent});
});

// Retriving the image
app.get("/contact", function(req, res){
  ImgModel.find({}, (err, items) => {
      if (err) {
          console.log(err);
      }
      else {
          res.render("contact", {
            contactContent: contactContent,
             items: items
          });
      }
  });

});

app.get("/compose", function(req, res){
  res.render("compose");
});

app.post("/compose", function(req, res){
  let current= new Date().getTime();
  const post = new Post({
    title: req.body.postTitle,
    content: req.body.postBody,
    timeStamp: current
  });


  post.save(function(err){
    if (!err){
        res.redirect("/");
    }
  });
});

// Uploading the image
app.post('/imageupload', upload.single('image'), (req, res, next) => {
//app.post('/imageupload', upload2.single('image'), (req, res, next) => {
    //console.log(__dirname);
    console.log("saveimagestate");
    console.log(req.body);
    let current= new Date().getTime();
    if(req.body.img){
    var obj = {
          name: req.body.name,
          desc: req.body.desc,
          img: {
              data: fs.readFileSync(path.join(__dirname + '/public/img/' + req.file.filename)),
              contentType: 'image/png'
          },
          timeStamp: current,
          timePeriod: req.body.timePeriod,
          oneTimeOnly: req.body.oneTimeOnly
        }
    }
    else{
      var obj = {
          name: req.body.name,
          desc: req.body.desc,
          timeStamp: current,
          timePeriod: req.body.timePeriod,
          oneTimeOnly: req.body.oneTimeOnly
          }
    }


    ImgModel.create(obj, (err, item) => {
        if (err) {
            console.log(err);
        }
        else {
            // item.save();
            res.redirect('/contact');
        }
    });
});

app.post("/remove", function(req, res){
  console.log(req.body.postBody);
  ImgModel.findByIdAndRemove(req.body.postBody, function(err) {
    if (err) {
      console.log(err);
    } else {
      res.redirect("/");
    }
  });

});



app.get("/:postId", function(req, res){
  //const requestedTitle = _.lowerCase(req.params.postName);
  const requestedPostId = req.params.postId;

    //Post.findOne({_id: requestedPostId}, function(err, post){
    ImgModel.findOne({name: requestedPostId}, function(err, img){
      console.log(err);
      console.log(`${'img.img' in img}`);
      console.log(img);
      if(!err){
        if(img.img  && img.oneTimeOnly == ""){
          res.render("post", {
            title: img.name,
            content: img.desc,
            image:img,
            _id: img._id
            });
        }
        else{
            if(img.img && img.oneTimeOnly == "oneTime"){
            //has image, but need to remove this collection.
            ImgModel.findByIdAndRemove(img._id, function(err) {
              if (err) {
                console.log(err);
              } else {
                res.render("post", {
                  title: img.name,
                  content: img.desc,
                  image:img,
                  _id: "This is one time reading. The record is removed."
                  });
              }
            });
          }else{//no image
            if(img.oneTimeOnly == "oneTime"){
              res.render("postNoImg", {
                title: img.name,
                content: img.desc,
                _id: "This is one time reading. The record is removed."
                });
              ImgModel.findByIdAndRemove(img._id, function(err) {
                if (err) {
                  console.log(err);
                } else {
                  ;
                }
              });
            }
            else{
              res.render("postNoImg", {
                title: img.name,
                content: img.desc,
                _id: img._id
                });
            }

          }
        }
      }
    })
    .orFail(
      function(){
        // => new Error('Not Found')
        res.render("error", {errorContent: errorContent});

    });


});

app.listen(PORT, function(err) {
  if (err)
      throw err;
  console.log("Server started on port "+PORT );
});
