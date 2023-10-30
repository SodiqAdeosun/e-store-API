const express = require('express');
const { Category } = require('../model/Category');
const router =express.Router();
const mongoose = require('mongoose');
const isLogin = require('../middlewares/isLogin');
const isAdmin = require('../middlewares/isAdmin');
const appErr = require('../helper/appErr');




//To create category
router.post(`/`,isLogin, isAdmin, async (req, res, next) => {
const {name, icon, color} =req.body

           // Check if the Category name already exists in the database
           const nameExist = await Category.findOne({ name });
           if (nameExist) {
              return next(appErr(`${name} already exists in the database`, 404)); 
           }

    const category = new Category({
        name,
        icon,
        color
    })

await category.save();
if (!category) {
    res.status(500).send('Category not created')
}
res.send(category)
});

//To get all categories
router.get(`/`,isLogin, async (req, res) => {
    const categories = await Category.find();    
    if (!categories) {
        res.status(404).send('Categories not found')
    }
    res.send(categories)
});

//To get single category
router.get('/:id', async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(404).send("INVALID PRODUCT ID");
    }
    const category = await Category.findById(req.params.id);
    if (!category) {
       return res.status(404).send('Category with the ID is not found')
    }
    res.send(category);
});

//To update
router.put('/:id', isLogin, isAdmin, async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(404).send("INVALID PRODUCT ID");
    }
    const category = await Category.findByIdAndUpdate(
        req.params.id, 
        {
        name: req.body.name,
        icon: req.body.icon,
        color: req.body.color,
        },
         {
            new: true,
         }
         );
    if (!category) {
        res.status(404).send('Category with the ID is not found')
    }
    res.send(category);
});

//To delete
router.delete('/:id', isLogin, isAdmin,  (req, res) => {
    Category.findByIdAndRemove(req.params.id).then((category) => {
    if (category) {
        return res.status(200).json({
            success: true,
            message: 'category deleted successfully!'
        });
    } else {
        return res.status(500).json({
            success: false,
            message: 'category could not be found'
        });
    }
}).catch((err) => {
    return res.status(400).json({ success: false, message: err})
});
});

//To count the number of categories
router.get(`/get/count`, async (req, res) => {
    const categoryCount = await Category.countDocuments();
    if (!categoryCount) {
        res.status(404).json({success: false});
    }
    res.send({
        categoryCount: categoryCount
    });
});


module.exports = router;


