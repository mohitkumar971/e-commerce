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
			res.render("error.ejs",{ error : "Please enter username"})
			return
		}
		if(!password)
		{
			res.render("error",{ error : "Please enter password"})
			return
		}
		if(!file)
		{
			res.render("error",{ error : "Please attach your profile pic"})
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
				'<a href="http://localhost:3000/verifyUser/'+username+'"> click here </a>'
				sendMail(
					username, 
					"welcome to ecommerce app",
					"Please click here to verify",
					html,
					function(error)
					{
						if(error)
						{
						  res.render("error.ejs", {error : "unable to send email"})	
						}
						else
						{
							res.render("message.ejs",{ msg: "Please check your mail for verification" });
						}
					}
				)
				//res.redirect("/login");
			})
			.catch(function(err){
				//console.log(err)
				res.render("error.ejs", {error: "something went wrong"});
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



//login 

app.route('/login').get(function(req, res) 
{
	res.render("login",{ error : ""} );
})
.post(function(req, res )
{
	var username = req.body.username;
	var password = req.body.password;

	userModel.findOne({ username :username, password :password })
	.then(function(user)
	{
		if(!user)
		{
			res.render('error.ejs', {error : "user not found !"})
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


app.route("/forget").get(function(req,res)
{
	res.render("forgetpassword.ejs")
}).post(function(req,res)
{
	var username = req.body.username;
	req.session.username = username;
	userModel.findOne({username:username}).then(function(data)
	{
		var user_id=(data.id);
		// console.log(user_id);
		var isVerifiedMail=data.isVerifiedMail;
		if(isVerifiedMail)
		{
			
			// console.log("user is verified")
			var url='<a href= "http://localhost:3000/resetpass/'+user_id+'"> Reset Password</a>'
			sendMail(
				username,
				"Forgot PassWord?",
				"click here to reset it",
				url,
				function(err)
				{
					if(err)
					{
						res.render("error.ejs",{
							error:"Error - Your password cannot be reset"
						})
					}
					else{
						console.log("Password Change success");
						res.status(200);
						res.render("message.ejs",{msg:"check your mail to change password"});

					}
				}
			)
		}
		else
		{
			res.render("error.ejs",{ error:"invalid email" })
		}

	})
	.catch(function()
	{
			res.render("error.ejs",{ error:"invalid email"	})
	})
})


app.get("/resetpass/:user_id",function(req,res)
{
	res.render("resetpass.ejs");
})


app.post("/setnewpass",function(req,res)
{
	var username=req.session.username;
	var newpassword=req.body.password;
	userModel.updateOne({username:username},{password:newpassword})
	.then(function(data){
		console.log(data);
		res.render("login.ejs",{error:''})
			sendMail(username,
			"Password Changed",
			"Password Changed Successfully",
			"",
			function(err)
			{
				if(err)
				{
					res.render("error.ejs",{error : "Error while Changing Password!"})
				}
				else
				{
					console.log("Password Changed Successfully");
					res.status(200);
					res.render("message.ejs",{msg:"Password Changed"});

				}
			})
	}).catch(function()
	{
			res.render("error.ejs",{ error:"error ,password not set" })
	})
})


// app.get('/getproduct',function(req,res){
// 	proNum = proNum + 5;
// 	// console.log(count);
// 	res.end();							

// })

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



// admin side 


// const adminRoutes = require("./routes/admin");

// app.use("/admin", function(req, res, next)
// {
// 	// check is login or not 
// 	// if session then if admin
// 	// if not then redirect login 
	
// 	next()

// })

// app.use("/admin/auth", adminRoutes.auth );
// app.use("/admin/product", adminRoutes.product );
