const express=require("express");
const router=express.Router({mergeParams:true});
const User=require("../models/user.js");
const wrapasync = require("../utils/wrapasync.js");
const passport=require("passport");
const { saveRedirectUrl } = require("../middleware.js");
router.get("/signup",(req,res)=>{
    res.render("users/signup.ejs");
})
router.post("/signup", wrapasync(async (req, res) => {
    try {
      // Extract username, password, and email (using destructuring for clarity)
      const { username, password, email } = req.body;
  
      // Input validation (consider using a validation library like Joi)
      
  
      // Create a new User instance
      const newUser = new User({ email, username });
  
      // Register the user with password hashing (assuming User.register handles hashing)
      const registeredUser = await User.register(newUser, password);
  
      // Log the registered user for debugging/monitoring (optional)
      console.log("Registered user:", registeredUser);
  
      // Authenticate the user (assuming req.login is a login function)
       req.login(registeredUser,(err)=>{
        if(err){
            return next(err);
        }
        req.flash("success", "Welcome to Wanderlust!");
  
      // Redirect to listings page
      res.redirect("/listings");
       });
  
      // Set a success flash message
      
    } catch (error) {
      // Handle errors gracefully
      console.error(error);  // Log the error for debugging
      req.flash("error", error.message || "Signup failed. Please try again.");
      res.redirect("/signup");
    }
  }));
router.get("/login",(req,res)=>{
    res.render("users/login.ejs");
})
router.post("/login",saveRedirectUrl,passport.authenticate("local",{
    failureRedirect:"/login",failureFlash:true}),
    async(req,res)=>{req.flash("success","welcome to wanderlst!you are logged in!")
let redirectUrl=res.locals.redirecrUrl;
    res.redirect("/listings");}

)
router.get("/logout",(req,res,next)=>{
    req.logout((err)=>{
        if(err){
            next(err);
        }
        req.flash("success","you are logged out");
        res.redirect("/listings");
    })

})
module.exports=router;