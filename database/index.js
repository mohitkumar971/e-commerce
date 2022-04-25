module.exports.init = function()
{
  const mongoose = require('mongoose');
  mongoose.connect('mongodb+srv://mohitkumar41830:Mohit%4041830@cluster0.hphca.mongodb.net/ecommerce?retryWrites=true&w=majority')
  .then(function(res)
    {
      //console.log(res);
      (console.log("db is live"));
    })
    .catch(function(error)
    {
      console.log("error in db connection")
      console.log(error)
    })
}


