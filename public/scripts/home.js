var addToCartNodes = document.querySelectorAll(".addToCart");


addToCartNodes.forEach(function(element)
{
  element.addEventListener("click", function(event)
  {
    addToCart(event.target.getAttribute("id") );
  })

})

function addToCart(id)
{
  var request = new XMLHttpRequest();
  
  request.open("post", "/cart");
  request.setRequestHeader("Content-type", "application/json");
  request.send(JSON.stringify({ id : id }));

  request.addEventListener("load", function()
  {
     console.log(request)
  })

}
