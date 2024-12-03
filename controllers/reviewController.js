const Review = require('../models/reviewModel');
const APIFeatures = require('./../utils/apiFeatures');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const Factory =require('./handlerFactory');

// 

  exports.setTourUserIds =(req,res,next)=>{
    if(!req.body.tour) {
        req.body.tour =req.params.tourId;
    }
    if(!req.body.user) {
        req.body.user =req.user.id;
    } 
    next();  
  };
  exports.getAllReviews =Factory.getAll(Review);
  exports.GetReview =Factory.getOne(Review);
  exports.createReview =Factory.createOne(Review);
  exports.DeleteReview = Factory.deleteOne(Review);
  exports.UpdateReview =Factory.updateOne(Review);
  

  // exports.getAllReviews = catchAsync(async function (req, res, next) {
  //   // Set the filter if tourId is specified in the URL
  //   let filter = {};
  //   if (req.params.tourId) {
  //     filter = { tour: req.params.tourId }; // Correctly set the filter for the tour ID
  //   }
  
  //   // Apply the filter to the Review query
  //   const features = new APIFeatures(Review.find(filter), req.query)
  //   .filter()
  //   .sorting()
  //   .limitFields()
  //   .Pagination();
  //   // Execute the query to get reviews
  //   const reviews = await features.query;
  
  //   res.status(200).json({
  //     status: 'success',
  //     results: reviews.length,
  //     data: {
  //       reviews: reviews,
  //     },
  //   });
  // });