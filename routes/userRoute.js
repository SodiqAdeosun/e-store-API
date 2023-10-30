const express = require('express');
const bcrypt = require("bcryptjs")
const router =express.Router();
const mongoose = require('mongoose');
const { User } = require('../model/User');
const generateToken = require('../helper/generateToken');
const isLogin = require('../middlewares/isLogin');
const isAdmin = require('../middlewares/isAdmin');

//To Register a User
router.post(`/register`, async (req, res) => {
    const {name,email,password,phone,isAdmin,street,apartment,zip,city,country}  = req.body;

  const userFound = await User.findOne({email});
  if (userFound) {
    return res.status(401).json({message: "User alraedy exists!"});
  }
  const salt = await bcrypt.genSalt(10);
  const hashPassword = await bcrypt.hash(password, salt);
    const user = new User({
        name,email,passwordHash: hashPassword,phone,isAdmin,street,apartment,zip,city,country
    });
    await user.save();
   if(!user){
    res.status(404).send("user not created")
   }
   res.send(user);
});

//Login
router.post('/login', async (req, res) =>{
const {email, password} = req.body;
//To check if email exists
const userEmailFound = await User.findOne({email});
if (!userEmailFound) {
    return res.json({message: "Invalid login credentials"});
}

//To verify password
const isPasswordMatched = await bcrypt.compare(password, userEmailFound.passwordHash);
if (!isPasswordMatched) {
    return res.json({message: "Invalid login credentials"});
}
res.json({
    status: "success",
    data: {
        email: userEmailFound.email,
        name: userEmailFound.name,
        isAdmin: userEmailFound.isAdmin,
        token: generateToken(userEmailFound._id)
    }
});
});

//To GET all Users
router.get(`/`,isLogin, isAdmin, async (req, res) => {
    // let filter = {}
    // if (req.query.categories) {
    //     filter = { category: req.query.categories.split(",") };
    // }
    const user = await User.find();
    if (!user) {
        res.status(404).send("No User data found");
    }
    res.send(user);
});

//To GET single User
router.get('/profile',isLogin, async (req, res) => {
    // if (!mongoose.isValidObjectId(req.params.id)) {
    //     return res.status(404).send("INVALID USER ID");
    // }
    const user = await User.findById(req.userAuth);
    if (!user) {
       return res.status(404).json({message: 'User with the ID is not found'})
    }
    res.send(user);
});

//To UPDATE User
router.put('/:id', isLogin, async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(404).send("INVALID PRODUCT ID");
    }
    const {name,email,password,phone,isAdmin,street,apartment,zip,city,country}  = req.body;
    const user = await User.findByIdAndUpdate(
        req.params.id, 
        {
            name,email,password,phone,isAdmin,street,apartment,zip,city,country
        },
         {
            new: true,
         }
         );
    if (!user) {
        return next(appErr("User with the ID is not found", 404));
    }
    res.send(user);
});

//To delete
router.delete('/:id', isLogin, isAdmin,  (req, res) => {
    User.findByIdAndRemove(req.params.id).then((user) => {
    if (user) {
        return res.status(200).json({
            success: true,
            message: 'Product deleted successfully!'
        });
    } else {
        return res.status(500).json({
            success: false,
            message: 'Product could not be found'
        });
    }
}).catch((err) => {
    return res.status(400).json({ success: false, message: err})
});
});


module.exports = router;