const mongoose = require("mongoose");

module.exports.userRoleEnums = {
  admin : 1,
  customer : 2
}

const userSchema = new mongoose.Schema({
  username : {
    type : String,
    required : true,
  },

  password : {
    type : String,
    required : true
  }, 
  profile_pic : {
    type : String,
    required : true
  },
  isVerifiedMail : {
    type : Boolean,
    required : true
  },
  userType:{
    type : Number,
    required : true
  }
},

{ timestamp : true }
);

const userModel = mongoose.model('user', userSchema);

module.exports.model = userModel;