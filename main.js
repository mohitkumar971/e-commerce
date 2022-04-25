const express = require("express");
const multer = require("multer");
const fs =require("fs");

const sendMail = require("./utility/sendMail");

var session = require("express-session");

const db = require("./database");

const userModelInstance = require("./database/models/user.js");
const cartModel = require("./database/models/cart.js");

const userModel = userModelInstance.model;
const userTypeEnums =  userModelInstance.userRoleEnums;

const app = express()
const port = 3000

// setting ejs as default templating engine
//by default is uses views as a directory 
app.set("views","views");
app.set('view engine', 'ejs');

//initiate database connection 
db.init();

//middlewares
app.use(express.static("uploads"));
app.use(express.static("public"));
app.use(express.urlencoded());
app.use(express.json());

app.use(session({
  secret: 'Something secret',
  resave: false,
  saveUninitialized: true,

}))

//multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads')
  },
  filename: function (req, file, cb) 
	{
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix)
  }
})

const upload = multer({ storage: storage })

//app.use(upload.single("profile_pic"))

app.get('/auth', function(req, res)
{
	res.render("auth");
})

//login - using form validation , signup - using agex
app.get('/login', function(req, res) 
{
	res.render("login",{ error : ""} );
})

app.post("/login", function(req, res )
{
	const username = req.body.username;
	const password = req.body.password;

	userModel.findOne({ username :username, password :password })
	.then(function(user)
	{
		if(!user)
		{
			res.render('login', {error : "user not found !"})
		}
    
		// bypassing user verification
		if( false && !user.isVerifiedMail)
		{
			res.render('login', { error : "Please Check your Mail"});
			return
		}
    req.session.isLoggedIn = true;
		req.session.user = user;

		res.redirect("/");

	})
})

app.route("/signup").get(function(req,res)
{
  res.render("signup", {error: ""} );
  }).post(upload.single("profile_pic"), function(req, res)
	{
		const username = req.body.username;
		const password = req.body.password;
		const file = req.file;

    //someone tries to singup by changing required property from console(Frontend)
		if(!username)
		{
			res.render("signup",{ error : "Please enter username"})
			return
		}
		if(!password)
		{
			res.render("signup",{ error : "Please enter password"})
			return
		}
		if(!file)
		{
			res.render("signup",{ error : "Please attach your profile pic"})
			return
		}

		userModel.create({
			username : username,
			password : password,
			profile_pic : file.filename,
			isVerifiedMail : false,
			userType : userTypeEnums.customer 
			})
			.then(function(updateUser)
			{
				// token encryption //
				//href = "link you can privide to get after verificaiton"
				var html = '<h1> click here to verify </h1>' +  
				'<a href="link to be updated'+username+'"> click here </a>'

				sendMail(
					username, 
					"welcome to ecommerce app",
					"Please click here to verify",
					html,
					function(error)
					{
						if(error)
						{
						  res.render("signup", {error : "unable to send email"})	
						}
						else
						{
							res.redirect("/login");
						}
					}
				)

				res.redirect("/login");
			})
			.catch(function(err){
				//console.log(err)
				res.render("singup", {error: "something went wrong"});
			})
	})

app.get("/", function(req, res)
{
	var user = null;

	if(req.session.isLoggedIn)
	{
		user = req.session.user
	}
	// else
	// {
  //   res.render("login")
	// }

	fs.readFile("products.js", "utf-8" , function(err, data)
	{
		res.render("index", 
		{ 
			user : user,
			products : JSON.parse(data)
		});
	})
})



app.get("/verifyUser/:username", function(req,res)
{
  const username = req.params.username;
	userModel.findOne( {username : username }). then(function(user)
	{
		if(user)
		{
			//console.log(user);
			userModel.updateOne({username: username}, { $set : {isVerifiedMail: true}}).then(function(){
			console.log("user is verified" );
			//verify user here
			res.send("user is verified, login");
			})
		}
		else
		{
			res.send("Verification Failed");
		}
	})
})



app.get('/getproduct',function(req,res){
	proNum = proNum + 5;
	// console.log(count);
	res.end();							
})

app.route('/logout').get((req,res)=>{
	req.session.destroy();
	res.redirect('/');
})

// app.route("/cart")
// .post(function(req,res)
// {

// 	var user = null;

// 	if(!req.session.isLoggedIn)
// 	{
// 		res.status(401).json({ status: false, message:"please login", data: null})
// 		return
// 	}

//   user = req.session.user
// 	var product_id = req.body.id;


// 	cartModel.create({ 
// 		product_id : product_id,
//     product_image: "random",
//     product_description:"abcdefgh",
//     user_id : user_id
//   //quantity :
// 	})
// 	.then(function()
// 	{
// 	  res.status(401).json({ status: true, message:"ky baat h", data: null})	
// 	})
// })


app.listen(port, function()
{
	console.log(`Example app listening at http://localhost:${port}`)
})

