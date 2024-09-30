const Listing = require("../models/listing.js");
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });//service start

module.exports.index = async(req,res)=>{
    const allListing = await Listing.find({});
    res.render("listings/index.ejs", {allListing});
}

module.exports.renderNewform = async(req,res)=>{
    res.render("listings/new.ejs");
}

module.exports.showListing = async(req,res)=>{
    let {id } =req.params;
    const listing = await Listing.findById(id).
    populate({
      path:"reviews",
      populate:{
          path:"author",
    },
  })
    .populate("owner");
    if(!listing){
        req.flash("error","Listing you requested, does not exist!");
        res.redirect("/listings");
    }  
    res.render("listings/show.ejs",{listing});
}

module.exports.createListing = async(req,res,next)=>{
    // let {title,description,image,price,location,country} = req.body; 
    let response = await geocodingClient
    .forwardGeocode({
        query: req.body.listing.location,
        limit: 1,
    })
    .send();

    let url = req.file.path;
    let filename = req.file.filename;

    const newListing = new Listing(req.body.listing);     
    newListing.owner = req.user._id;  //session store user id & its info
    newListing.image = {url,filename};
    newListing.geometry = response.body.features[0].geometry;

    let savedlisting = await newListing.save();
    req.flash("success","New Listing is created!");
    res.redirect("/listings"); 
}

module.exports.renderEditForm = async(req,res)=>{
    let {id} = req.params;
    const listing = await Listing.findById(id);
    if(!listing){
        req.flash("error","Listing you requested, does not exist!");
        res.redirect("/listings");
    }
    let originalImageUrl = listing.image.url;
    originalImageUrl = originalImageUrl.replace("/upload","/upload/w_250");
    res.render("listings/edit.ejs",{listing,originalImageUrl});
}

module.exports.updateListing = async(req,res)=>{
    let {id} = req.params;         
    let updListing = await Listing.findByIdAndUpdate(id,{...req.body.listing});

    if(typeof req.file !== "undefined"){
      let url = req.file.path;
      let filename = req.file.filename;
      updListing.image = {url,filename};
      await updListing.save();
    }

    req.flash("success","Listing updated!");
    res.redirect(`/listings/${id}`);
}

module.exports.destroyListing = async(req,res)=>{
    let {id} = req.params;
    await Listing.findByIdAndDelete(id);
    req.flash("success","Listing Deleted!");
    res.redirect("/listings");
}

// module.exports.selectedListing = async(req,res)=>{
//     console.log("Query Parameters:", req.query);
//     let country = req.query.country;
//     console.log(country);

//     const selectedListing = await Listing.find({country:country});
//     res.render("listings/index.ejs",{selectedListing});
// }