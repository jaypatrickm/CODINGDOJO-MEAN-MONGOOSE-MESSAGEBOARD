//=======================================================
//Project: messageBoard -- server.js by JM 5.22.15
//=======================================================

//=======================================================
//requires: path, express, bodyParser, mongoose, validate
//=======================================================
var path = require("path");
var express = require("express");
var bodyParser = require("body-parser");
var mongoose = require('mongoose');
var validate = require('mongoose-validator');
//=======================================================

//=======================================================
//app setup : invoke express, use bodyParser, set server
//=======================================================
var app = express();
var server = app.listen(3333, function() { console.log("listening on port 3333") });
app.use(bodyParser.urlencoded());
//=======================================================

//=======================================================
//views setup : using ejs, located in views folder
//=======================================================
app.set('views', path.join(__dirname, './views'));
app.set('view engine', 'ejs');
//=======================================================

//=======================================================
//db setup : mongodb, setup mongoose connect, validators,
// schemas 
//=======================================================
// This is how we connect to the mongodb using mongoose -- 
// "basic_mongoose" is the name of our db in mongodb -- 
// this should match the name of the db you are to use for your project
mongoose.connect('mongodb://localhost/messaging');
var Schema = mongoose.Schema;

//=======================================================
//validators: custom
//name
var nameValidator = [
	validate({
		validator: 'isLength',
		arguments: [4],
		message: 'Name should be at least 4 characters'
	})
];
//=======================================================

//=======================================================
//models : post, comment
//post
var postSchema = new mongoose.Schema({
	name: {
		type: String,
		validate: nameValidator
	},
	message: String,
	comments: [{type: Schema.Types.ObjectId, ref: 'Comment'}]
});
var Post = mongoose.model('Post', postSchema);

//comment
var commentSchema = new mongoose.Schema({
	_post: {type: Schema.ObjectId, ref: 'Post'},
	name: String,
	comment: String
});
var Comment = mongoose.model('Comment', commentSchema);
//=======================================================

//=======================================================
//validators: attachment using path
//postSchema: name, message
postSchema.path('name').required(true, 'Name cannot be blank');
postSchema.path('message').required(true, 'Message cannot be blank');
//commentSchema: name, comment
// commentSchema.path('name').required(true, 'Name cannot be blank');
// commentSchema.path('comment').required(true, 'Comment cannot be blank');
//=======================================================

//=======================================================
//Routes: Handling HTTP Requests
//=======================================================
app.get('/', function(req, res) {
	Post.find({},  function(err, posts){
		posts = posts.reverse();
		Comment.find({}, function(err, comments) {
			res.render('index', {posts: posts, comments: comments})
		})
	})
})

app.post('/message', function(req, res) {
	var newPosts = '';
	console.log("POST DATA", req.body);
	var postM = new Post({name: req.body.name, message: req.body.message});
	postM.save(function(err) {
		//if there is an error console.log that something went wrong!
		if(err)
		{
			Post.find({},  function(errs, posts){
				if(errs)
				{
					console.log('could not get posts');
				}
				else 
				{
					console.log(err);
					if (typeof(err.errors.message)!= 'undefined')
					{
						var messageErr = err.errors.message.message;
					}
					if (typeof(err.errors.name.message)!= 'undefined')
					{
						var nameErr = err.errors.name.message;
					}
					posts = posts.reverse();
					Comment.find({}, function(err, comments) {
						res.render('index', {title: 'you have errors!', messageErr: messageErr, nameErr: nameErr, posts: posts, comments: comments})
					})
				}
			});
			
		}
		else
		{
			console.log('successfully added a user!');
			res.redirect('/');
		}
	})
})

app.post('/comment/:id', function(req, res) {
	var comment = new Comment({name: req.body.name, comment: req.body.comment});
	comment._post = req.params.id;
	
	Post.findOne({_id: req.params.id}, function(err, post){

		post.comments.push(comment);
		comment.save(function(err){
			post.save(function(err){
				if(err) 
				{
					console.log('Error');
				}
				else
				{
					res.redirect('/');
				}
			})
		})
	})
})