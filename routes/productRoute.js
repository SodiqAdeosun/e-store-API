const express = require('express');
const Product = require('../model/Product');
const { Category } = require('../model/Category');
const mongoose = require('mongoose');
const appErr = require('../helper/appErr');
const isLogin = require('../middlewares/isLogin');
const isAdmin = require('../middlewares/isAdmin');
const multer = require('multer')
const router =express.Router();

const  FILE_TYPE_MAP = {
    'image/png': 'png',
    'image/jpeg': 'jpeg',
    'image/peg': 'peg'
};

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const isValid = FILE_TYPE_MAP[file.mimetype];
        let uploadError = new Error('Invalid Image Type');
        if (isValid) {
            uploadError = null;
        }
        cb(uploadError, 'public/uploads');
    },
    filename: function (req, file, cb) {
        const fileName = file.originalname.replace(' ', '-');
        const extension = FILE_TYPE_MAP[file.mimetype];
        cb(null, `${fileName}-${Date.now()}.${extension}`);
    }
});

const upload = multer({storage: storage});

//To CREATE/POST a product
router.post(`/`,  isLogin, isAdmin, upload.single('image'), async (req, res, next) => {
    const categoryId = await Category.findById(req.body.category);
    if (!categoryId) {
       return next(appErr("Invalid Category ID", 404));
    }

    const  file = req.file;
    if (!file) {
        return next(appErr('Product image file is missing', 405));
    }
    const {name,shortDiscription,longtDiscription,image,brand,price,category,countInStock,rating,numReviews, isFeatured } = req.body;

    const fileName = req.file.filename;
    const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;

           // Check if the product name already exists in the database
           const nameExist = await Product.findOne({ name });
           if (nameExist) {
              return next(appErr(`${name} already exists in the database`, 404)); 
           }
       
    const product = new Product({
        name,shortDiscription,longtDiscription,image: `${basePath}${fileName}`,brand,price,category,countInStock,rating,numReviews, isFeatured
    });
    
    await product.save();
   if(!product){
    return next(appErr('Product not created', 404)); 
}
   res.send(product);
});

//To GET all product
router.get(`/`, async (req, res) => {
    let filter = {}
    if (req.query.categories) {
        filter = { category: req.query.categories.split(",") };
    }
    const products = await Product.find(filter).populate("category");
    if (!products) {
        res.status(404).send("No product data found");
    }
    res.send(products);
});

//To GET single product
router.get('/:id', async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(404).send("INVALID PRODUCT ID");
    }
    const product = await Product.findById(req.params.id).select("name image category -_id").populate("category");
    if (!product) {
       return res.status(404).json({message: 'Product with the ID is not found'})
    }
    res.send(product);
});

//To UPDATE a product
router.put('/:id', upload.single('image'), isLogin, isAdmin, async (req, res) => {


    const {name,shortDiscription,longtDiscription,image,brand,price,category,countInStock,rating,numReviews, isFeatured } = req.body;

    if (!mongoose.isValidObjectId(req.params.id)) {
        return next(appErr("Invalid Product ID", 404));
    }

    const categoryId = await Category.findById(req.body.category);
    if (!categoryId) {
       return next(appErr("Invalid Category ID", 404));
    }

    const productFound = await Product.findById(req.params.id);
    if (!productFound) {
       return next(appErr("Invalid Product ID", 404));
    }
    
    const file = req.file
    let imagePath;
    if (file) {
        const fileName = req.file.filename;
        const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;
        imagePath = `${basePath}${fileName}`;
    } else {
        imagePath = productFound.image;
    }

    const product = await Product.findByIdAndUpdate(
        req.params.id, 
        {
            name,shortDiscription,longtDiscription,image: imagePath, brand, price, category, countInStock, rating, numReviews,  isFeatured
        },
         {
            new: true,
         }
         );
    if (!product) {
        res.status(404).send('Product with the ID is not found')
    }
    res.send(product);
});

//To delete
router.delete('/:id', isLogin, isAdmin,  (req, res) => {
    Product.findByIdAndRemove(req.params.id).then((product) => {
    if (product) {
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

router.get(`/get/count`, isLogin,isAdmin, async (req, res) => {
    const productCount = await Product.countDocuments();
    if (!productCount) {
        res.status(404).json({success: false});
    }
    res.send({
        productCount: productCount
    });
});

router.get(`/get/featured/:count`, async (req, res) => {
    const count = req.params.count;
    const products = await Product.find({isFeatured: true}).limit(+count);
    if (!products) {
        res.status(404).json({success: false});
    }
    res.send(products);
});

//Update Multiple Images
router.put('/gallery-images/:id', upload.array('images', 10), async (req, res, next) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return next(appErr("Invalid Product ID", 404));
    }
    const files = req.files;
    let imagesPaths = [];
    const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;
    if (files) {
        files.map((file) => {
            imagesPaths.push(`${basePath}${file.filename}`)
        });
    }
    const product = await Product.findByIdAndUpdate(req.params.id, 
        {
            images: imagesPaths
        },
        {
            new: true
        });
        if (!product) {
            return res.status(404).send('Product not Updated');
        }
        res.send(product)
});

module.exports = router;