if(process.env.NODE_ENV !="production"){
    require('dotenv').config();
}

const express = require("express");
const app = express();
const mongoose = require("mongoose")
const Listing = require("./models/listing.js");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
// const wrapAsync = require("./utils/wrapAsync.js")
const projectError = require("./utils/ExpressError.js");
// const {listingSchema} = require("./schema.js");
// const Review = require("./models/review.js");
// const {reviewSchema} = require("./schema.js");
const sesssion = require("express-session");
const MongoStore = require('connect-mongo');
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js")

const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");

app.set("view engine","ejs");
app.set("views",path.join(__dirname,"views"));
app.use(express.urlencoded({extended:true}));
app.use(methodOverride("_method"));
app.engine("ejs",ejsMate);
app.use(express.static(path.join(__dirname,"/public")));

const dbUrl = process.env.ATLASDB_URL;
main().then(()=>{
    console.log("connection successfull")
}).catch((err =>{
    console.log(err);
}));

async function main() {
  await mongoose.connect(dbUrl);
}

const store = MongoStore.create({
    mongoUrl: dbUrl,
    crypto:{
        secret:process.env.SECRET,
    },
    touchAfter:24 * 3600,
})
store.on("error",(err)=>{
    console.log("Error in Mongo Session",err);
});

const sessionOptions = {
    store,
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie:{
       expires:Date.now() + 7 * 24 * 60 * 60 * 1000,
       maxAge: 7 * 24 * 60 * 60 * 1000,
       httpOnly: true
    }
};


app.use(sesssion(sessionOptions)); //localhost session used
app.use(flash());  //flash is used 

app.use(passport.initialize());//used to initialized passport.js middleware
app.use(passport.session());//allow session based authentication

passport.use(new LocalStrategy(User.authenticate()));//use static authenticate methode of model in localstrategy
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
//  user related information are stored is called serialization and unstored is called deserialization

app.use((req,res,next)=>{
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currentUser = req.user;
    next();
});

app.get("/listings/search",async(req,res)=>{
    let destination = req.query.search;
    const selectedListing = await Listing.find({$regex: destination,$options: "i"});
    console.log(selectedListing);
})

app.use("/listings",listingRouter);
app.use("/listings/:id/reviews",reviewRouter);
app.use("/",userRouter);

app.all("*",(req,res,next)=>{
    next(new projectError("404","Page not found !!!"));
})

app.use((err,req,res,next)=>{
    let {statusCode=500,message="something went wrong"} = err;
    res.status(statusCode).render("listings/error.ejs",{message});
    // res.status(statusCode).send(message);
})

app.listen(8080,()=>{
    console.log("app is listening on port 8080");
})