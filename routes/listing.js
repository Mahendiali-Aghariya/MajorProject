const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const Listing = require("../models/listing.js");
const {isLoggedIn, isOwner,validateListing} = require("../middleware.js");
const multer  = require('multer');
const { storage } = require("../cloudConfig.js");
const upload = multer({ storage});//automatically stored file in uploads folder

const listingController = require("../controllers/listing.js")

router.route("/")
.get(wrapAsync(listingController.index))
.post(
    isLoggedIn,
    upload.single('listing[image]'),
    validateListing,
    wrapAsync(listingController.createListing)
);


// New route-i)give form
router.get("/new",isLoggedIn,wrapAsync(listingController.renderNewform
    // console.log(req.user);//it stored the user related information because we use User schema in  passport authentication 
    // if(!req.isAuthenticated()){//isAuthentication is trigger by req.user
    //     req.flash("error","You must logged in to create listing");
    //     return res.redirect("/login");
    // }
));

router.route("/:id")
.get(wrapAsync(listingController.showListing))
.put(
    isLoggedIn,
    isOwner,
    upload.single('listing[image]'),
    validateListing,
    wrapAsync(listingController.updateListing)
)
.delete(
    isLoggedIn,
    isOwner,
    wrapAsync(listingController.destroyListing)
);

// search for country
// router.get("/country",wrapAsync(listingController.selectedListing));

// Index Route
// router.get("/",
//     wrapAsync(listingController.index));



// ii)add in DB->create route
// router.post("/",
//     isLoggedIn,
//     validateListing,
//     wrapAsync(listingController.createListing));

// show route
// router.get("/:id",
//     wrapAsync(listingController.showListing));

// edit route i)give form
router.get("/:id/edit",
    isLoggedIn,
    isOwner,
    wrapAsync(listingController.renderEditForm));

// ii)update
// router.put("/:id",
//     isLoggedIn,
//     isOwner,
//     validateListing,
//     wrapAsync(listingController.updateListing));

// delete route
// router.delete("/:id",
//     isLoggedIn,
//     isOwner,
//     wrapAsync(listingController.destroyListing));

module.exports = router;