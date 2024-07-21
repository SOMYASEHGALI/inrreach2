const express=require("express");
const router=express.Router({mergeParams:true});
const wrapAsync=require("../utils/wrapasync.js");
const ExpressError=require("../utils/expresserror.js");
const Review = require("../models/review.js");
const reviewRouter=require("../routes/review.js");
const review = require("../models/review.js");
const {listingSchema,reviewSchema}=require("../schema.js");
const Listing=require("../models/listing");
const validateReview=(req,res,next)=>{
    let {error}=Review.validate(req.body);
    if(error){
        let errMsg=error.details.map((el)=>el.message).join(",");
        throw new ExpressError(400,errMsg);
    } else {
        next();
    }
}
//const Review = require("./models/review.js");
router.post("/",validateReview,wrapAsync(async(req,res)=>{
    let listing=await Listing.findById(req.params.id)
let newReview=new Review(req.body.review);
listing.reviews.push(newReview);
await newReview.save();
await listing.save();

console.log("new review saved");
res.redirect(`/listings/${listing._id}`)
}))
router.delete("/:reviewId",wrapAsync(async(req,res)=>{ 
    let {id,reviewId}=req.params;
    await Listing.findByIdAndUpdate(id,{$pull:{reviews:reviewId}});
    console.log("deleted")
    await Review.findById(reviewId);
    res.redirect(`/listings/${id}`);
}))
module.exports=router;