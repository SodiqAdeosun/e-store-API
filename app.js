require('dotenv').config();
const express = require('express');
const app = express();
port = 3000;
const morgan = require('morgan');
const mongoose = require('mongoose');
const productRouter = require('./routes/productRoute')
const categoryRouter = require('./routes/categoryRoute')
const orderRouter = require('./routes/orderRoute')
const userRouter = require('./routes/userRoute')
const cors = require('cors');
const appErr = require('./helper/appErr');
const globalErrHandler = require('./middlewares/globalErrHandler');


app.use(cors());
app.options("*", cors());

const api = process.env.API_URL;

//Middleware
app.use(express.json());
app.use(morgan('tiny'));
app.use('/public/uploads', express.static(__dirname + '/public/uploads'));

// routes
app.use(`${api}/products`, productRouter);
app.use(`${api}/category`, categoryRouter);
app.use(`${api}/users`, userRouter);
app.use(`${api}/orders`, orderRouter);


//Error handler middleware
app.use(globalErrHandler);


//404 error handler
app.use("*", (req, res) => {
    res.status(404).json({
        message: `${req.originalUrl} - Route not found`
    });
});

mongoose.connect(process.env.CONNECTION_STRING, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
        console.log('Database connection is ready...');
    }).catch((err) => {
        console.log(err);
    });

app.get('/', (req, res) => {
    res.send('WELCOME TO MY API')
})

app.listen(port, () => {
    console.log(`server is running on htpp://localhost:${port}`);
});