if(process.env.NODE_ENV!="production"){
    require("dotenv").config();
}
require('dotenv').config();
console.log(process.env.SECRET);
const express=require("express");
const app=express();
const mongoose=require("mongoose");
const Listing=require("./models/listing");
const path=require("path");
const listings=require("./routes/listing.js");
const methodOverride=require("method-override");
const ejsMate=require("ejs-mate");
const wrapAsync=require("./utils/wrapasync.js");
const ExpressError=require("./utils/expresserror.js");
const {listingSchema,reviewSchema}=require("./schema.js");
const review = require("./models/review.js");
const Review = require("./models/review.js");
const reviewRouter=require("./routes/review.js");
const session=require("express-session");
const MongoStore = require('connect-mongo');
const flash=require("connect-flash");
const passport=require("passport");
const LocalStratergy=require("passport-local");
const User=require("./models/user.js");
const user=require("./routes/user.js");
const dbUrl=process.env.ATLASDB_URL;
const MONGO_URL="mongodb://127.0.0.1:27017/wanderlust"
main()
.then(()=>{
    console.log("connected to DB");
})
.catch((err)=>{
    console.log(err);
})
//somya:Somya@2004@cluster0.kakwy3e.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
const store=MongoStore.create({
    mongoUrl:dbUrl ,
    crypto:{
        secret:"mysupersecretcode"
    },
    touchAfter:24*3600,
})
store.on("error",()=>{
    console.log("error in mongo",err);
})
const sessionOptions={
    store,
    secret:"mysupersecretcode",
    resave:false,
    saveUninitialized:true,
    cookie:{
        expires:Date.now()+7*24*60*60*1000,
        maxAge:7*24*60*60*1000,
        httpOnly:true,
    }
}

app.get("/",(req,res)=>{
    res.send("hi i am root");
});
app.use(session(sessionOptions));
app.use(flash());
//before done by 
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStratergy(User.authenticate()));
passport.serializeUser(User.serializeUser());
  
passport.deserializeUser(User.deserializeUser());
  
  

//flash before routes
app.use((req,res,next)=>{
    res.locals.success=req.flash("success");
    res.locals.error=req.flash("error");
    res.locals.currUser=req.user;
    next();
})
app.use(express.json()); // Middleware to parse JSON bodies

let cart = [];

// Route to add items to the cart
app.post('/cart/add', (req, res) => {
    const { id } = req.body;
    Listing.findById(id, (err, listing) => {
        if (err) {
            return res.status(500).json({ success: false });
        }
        cart.push(listing);
        res.json({ success: true });
    });
});

// Route to view the cart
app.get('/cart', (req, res) => {
    res.redirect("listings/cart.ejs",{cart});
});

// Route to handle checkout
app.post('/cart/checkout', (req, res) => {
    // Handle the payment process here
    cart = [];
    res.redirect('/success');
});

// Route to show success message
app.get('/success', (req, res) => {
    res.send('Payment successful!');
});

app.get("/testListing",async (req,res)=>{
    let sampleListing=new Listing({
        title:"my new Villa",
        description:"by the beach",
        price:1200,
        location:"Calangute,Goa",
        country:"India",
    });
    await sampleListing.save();
    console.log("sample was saved");
    res.send("successful testing");
});
app.get("/demouser",async(req,res)=>{
    let fakeuser=new User({
        email:"student@gmail.com",
        username:"delta-student"
    });
    let registereduser=await User.register(fakeuser,"helloworld");
    res.send(registereduser)
})
app.listen(8080,()=>{
    console.log("server is listening to port 8080");

});
app.get("/listings",async (req,res)=>{
    const allListings= await Listing.find({});
    res.render("listings/index.ejs",{allListings});
    })
app.set("view engine","ejs");
app.set("views",path.join(__dirname,"views"));
app.use(express.static(path.join(__dirname,"/public")));
app.use(express.urlencoded({extended:true}));
app.use(methodOverride("_method"));
app.engine('ejs',ejsMate);
app.use("/listings",listings);
app.use("/",user);

app.get("/listings")
async function main(){
    await mongoose.connect(dbUrl);
}
app.use("/listings/:id/reviews",reviewRouter);
app.get("/listings/new",(req,res)=>{
    res.render("listings/new.ejs");
})
app.put("/listings/:id",async(req,res)=>{
    let {id}=req.params;
   await Listing.findByIdAndUpdate(id,{...req.body.listing})
res.redirect("/listings");
})
//update route

//pull operator of mongoose
//by it it sees then delete it 
// app.use((err,req,res,next)=>{
//     let {statusCode=500,message="something went wrong"}=err;
//     res.status(statusCode).send(message);
//     res.render("error.ejs");
// })
//post route
//npm i passport  and npm install passport-local 
//passport local mongoose

exports = async function(changeEvent) {
    // A Database Trigger will always call a function with a changeEvent.
    // Documentation on ChangeEvents: https://docs.mongodb.com/manual/reference/change-events/
  
    // This sample function will listen for events and replicate them to a collection in a different Database
  
    // Access the _id of the changed document:
    const docId = changeEvent.documentKey._id;
  
    // Get the MongoDB service you want to use (see "Linked Data Sources" tab)
    // Note: In Atlas Triggers, the service name is defaulted to the cluster name.
    const serviceName = "mongodb-atlas";
    const database = "other_db";
    const collection = context.services.get(serviceName).db(database).collection(changeEvent.ns.coll);
  
    // Get the "FullDocument" present in the Insert/Replace/Update ChangeEvents
    try {
      // If this is a "delete" event, delete the document in the other collection
      if (changeEvent.operationType === "delete") {
        await collection.deleteOne({"_id": docId});
      }
  
      // If this is an "insert" event, insert the document into the other collection
      else if (changeEvent.operationType === "insert") {
        await collection.insertOne(changeEvent.fullDocument);
      }
  
      // If this is an "update" or "replace" event, then replace the document in the other collection
      else if (changeEvent.operationType === "update" || changeEvent.operationType === "replace") {
        await collection.replaceOne({"_id": docId}, changeEvent.fullDocument);
      }
    } catch(err) {
      console.log("error performing mongodb write: ", err.message);
    }
  };