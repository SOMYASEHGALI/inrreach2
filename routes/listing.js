const express=require("express");
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken=process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding ({ accessToken: mapToken });


const router=express.Router();
const wrapAsync=require("../utils/wrapasync.js");
const Listing=require("../models/listing");
const ExpressError=require("../utils/expresserror.js");
const {listingSchema,reviewSchema}=require("../schema.js");
const {isLoggedIn}=require("../middleware.js");
const multer  = require('multer');
const {storage}=require("../cloudconfig.js")
const upload = multer({ storage })
const listingController=require("../controllers/listings.js");
const validateListing=(req,res,next)=>{
    let {error}=listingSchema.validate(req.body);
    if(error){
        let errMsg=error.details.map((el)=>el.message).join(",");
        throw new ExpressError(400,errMsg);
    } else {
        next();
    }
}
//index route
router.get("/",wrapAsync(listingController.index));
router.get("/",async (req,res)=>{
    const allListings= await Listing.find({});
    res.render("/index.ejs",{allListings});
    })
    router.get("/new",isLoggedIn,listingController.renderNewForm)
    router.put("/:id",upload.single("listing[image]"),async(req,res)=>{
        let {id}=req.params;
        let listing=await Listing.findById(id);
        // if(!listing.owner.equals(currUser._id)){
        // req.flash("success","u not have permission to edit");
        //res.redirect(`/listings/${id}`);
       let listings=await Listing.findByIdAndUpdate(id,{...req.body.listing});
if(typeof req.file !=="undefined"){let url=req.file.path;
    let filename=req.file.filename;
    listings.image={url,filename};
    await listings.save();}
       


       req.flash("success","Listing updated");
    res.redirect(`/listings/${id}`)
}),
    //show route
    router.get("/:id",async (req,res)=>{
        let {id}=req.params;
        const listing=await Listing.findById(id).populate("reviews").populate("owner");
        if(!listing){
            req.flash("error","listing you requested does not exist");
            res.redirect("/listings");
        }
        //console.log(listing);
        res.render("listings/show.ejs",{listing});
    }),
    //create route
    router.post("/",upload.single('listing[image]'),
    wrapAsync (async (req,res,next)=>{
       
            
            
        let url=req.file.path;
        let filename=req.file.filename;
        console.log(url,"..",filename);
        
        if(!req.body.listing){
            throw new ExpressError(400,"send valid data for listing")
        }
       // let {title,description,image,price,country,location}=req.body;
    {const newListing=new Listing(req.body.listing);
        newListing.owner=req.user._id;
        newListing.image={url,filename}
        //newListing.geometry=response.body.features[0].geometry;
        let savedlisting= await newListing.save();
        console.log(savedlisting);
        req.flash("success","new listing created!");
        res.redirect("/listings");}
        
       
    })),
    router.get("/rajeevbhawan",(req,res)=>{
        res.render("listings/razor.ejs")
    })
    //delete route
    router.delete(
        "/:id",isLoggedIn,wrapAsync(async(req,res)=>{
            let {id}=req.params;
            let deletedListing=await Listing.findByIdAndDelete(id);
            req.flash("success","listing deleted");
            res.redirect("/listings");
        })
    ),
    //edit route
    router.get("/:id/edit",isLoggedIn,wrapAsync(async(req,res)=>{
        let {id}=req.params;
        const listing=await Listing.findById(id);
        res.render("listings/edit.ejs",{listing})
    })),
    module.exports=router;