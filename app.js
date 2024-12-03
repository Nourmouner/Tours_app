const fs = require('fs');
const express = require('express');
const morgan = require('morgan');
const rateLimit =require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize =require('express-mongo-sanitize'); 
const xss=require('xss-clean');
const hpp =require('hpp');
const AppError = require('./utils/appError');
const globalErrorHandler =require('./controllers/errorController'); 
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');

const { json } = require('body-parser');
const { dirname } = require('path');  
const MS = 60*60*1000;
const limiter =rateLimit(
  {
 
  max : 100,
  windowMs : MS,
  message : 'Too many requests from this IP,Please try again in an Hour !'

})

const app = express();

app.use(helmet())

//#region middlewares

// app.use((req, res, next) => {
//   console.log('hello from the middleware');
//   next();
// });

// const logTimeMiddleware = (req, res, next) => {
//   const now = new Date();
//   console.log(`Request received at: ${now.toISOString()}`);
//   next();
// };
//#endregion

if(process.env.NODE_ENV==='development'){
  app.use(morgan('dev'));
}
app.use('/api',limiter);

app.use(express.json({limit : '10kb'}));

app.use(mongoSanitize());

app.use(xss());

app.use(hpp({
  whitelist :[
    'duration',
    'ratingsQuantity',
    'ratingsAverage',
    'maxGroupSize',
    'difficulty',
    'price',

  ]
}));

app.use(express.static(`${__dirname}/public`));
// Routes
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.all('*', (req, res, next) => {
  // res.status(400).json({

    // status: 'fail',
    // message: `Can't find ${req.originalUrl} on this server !`,
  // });
  // const err = new Error(`Can't find ${req.originalUrl} on this server !`);
  // err.statusCode=404;
  // err.status='fail'
  
  next(new AppError(`Can't find ${req.originalUrl} on this server !`,404));
});
app.use(globalErrorHandler); 

module.exports = app;
