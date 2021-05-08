const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const cors = require("cors");
const { OAuth2Client } = require("google-auth-library");
const { response } = require("express");
const jwt = require("jsonwebtoken");

const User = require("./src/models/user");

const app = express();

const client = new OAuth2Client(
  "875493409490-80hsnftvg2l3l6gnecc3r49nfuj8m6rr.apps.googleusercontent.com"
);
//usages
app.use(cors());
app.use(bodyParser.json());

var dburl = "mongodb://127.0.0.1:27017/googleAuthDb";

mongoose
  .connect(dburl, {
    useUnifiedTopology: true,

    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => {
    console.log("Server has started.......");

    //google signup
    app.post("/googleSignup", async (req, res) => {
      console.log(req.body);
      const response = await client.verifyIdToken({
        idToken: req.body.tokenId,
        audience:
          "875493409490-80hsnftvg2l3l6gnecc3r49nfuj8m6rr.apps.googleusercontent.com",
      });
      console.log(response.payload);
      const { email_verified, name, email } = response.payload;

      if (email_verified) {
        //check if user exists or not
        let existingUser;
        try {
          existingUser = await User.findOne({ email: email });
        } catch (err) {
          return res.status(500).json("Error in finding user");
        }

        if (existingUser) {
          return res
            .status(500)
            .json("User already exist please login instead");
        }

        let password = email + "myToken";

        //save user to db
        let createdUser = new User({
          name,
          email,
          password,
        });
        try {
          await createdUser.save();
        } catch (err) {
          return res.status(500).json();
        }

        let token;
        try {
          token = jwt.sign(
            {
              userId: createdUser.id,
              email: createdUser.email,
            },
            "my toKen",
            { expiresIn: "21d" }
          );
        } catch (err) {
          const error = new HttpResponse(
            "Token generation failed, Login not done",
            500
          );
          return res.status(500).json({ response: error });
        }

        return res.status(200).json({
          userId: createdUser._id,
          name: createdUser.name,
          email: createdUser.email,
          token: token,
        });
      }
      return res.status(500).json("Error in verification");
    });

    //login api here
    app.post("/googleLogin",async (req,res)=>{
      console.log(req.body);
      const response = await client.verifyIdToken({
        idToken: req.body.tokenId,
        audience:
          "875493409490-80hsnftvg2l3l6gnecc3r49nfuj8m6rr.apps.googleusercontent.com",
      });
      console.log(response.payload);
      const { email_verified, name, email } = response.payload;

      if(email_verified){
          //check user exist or not
          let existingUser;
          try{
              existingUser=await User.findOne({email:email})
          }
          catch(err){
              return res.status(500).json("Error in finding user")
          }

          //if user not exist
          if(!existingUser){
              return res.status(401).json("User does not exist please signup")
          }

          //pass
          let pass=email+"myToken"
          //match password;
          if(existingUser.password!==pass){
              return res.status(401).json("Password didn't match")
          }

          let token;
        try {
          token = jwt.sign(
            {
              userId: existingUser.id,
              email: existingUser.email,
            },
            "my toKen",
            { expiresIn: "21d" }
          );
        } catch (err) {
          const error = new HttpResponse(
            "Token generation failed, Login not done",
            500
          );
          return res.status(500).json({ response: error });
        }

        return res.status(200).json({
          userId: existingUser._id,
          name: existingUser.name,
          email: existingUser.email,
          token: token,
        });
      }
      return res.status(500).json("Error in verification");
    })
    app.listen(process.env.PORT || 8081);
  })
  .catch((err) => {
    console.log(err);
  });
