//#region old code
// const fs = require('fs');
// const tours = JSON.parse(
//   fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)
// );

// exports.checkID = (req, res, next, val) => {
//   console.log(`Tour id is: ${val}`);

//   const id = val * 1;
//   if (id > tours.length) {
//     return res.status(404).json({
//       status: 'fail',
//       message: 'Invalid ID',
//     });
//   }
//   next();
// };

// exports.checkBody = (req, res, next) => {
//   if (!req.body.name || !req.body.price) {
//     return res.status(400).json({
//       status: 'fail',
//       message: 'Missing name or price',
//     });
//   }
//   next();
// };
//#endregion
const Tour = require('./../models/tourModel');
const APIFeatures = require('./../utils/apiFeatures');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const Factory =require('./handlerFactory');

exports.getAllTours =Factory.getAll(Tour);
exports.getTour = Factory.getOne(Tour,{path : 'reviews'});
exports.createTour =Factory.createOne(Tour);
exports.updateTour=Factory.updateOne(Tour);
exports.deleteTour=Factory.deleteOne(Tour);

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};



exports.GetTourStats = catchAsync(async (req, res, next) => {
  // try {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      //_id: null,
      $group: {
        _id: { $toUpper: '$difficulty' },
        num: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: { avgPrice: 1 },
    },
  ]);

  // Respond with the aggregated stats data
  res.status(200).json({
    status: 'success',
    data: {
      stats,
    },
  });
  // } catch (err) {
  //   console.error('Error while retrieving tour stats:', err);

  //   // Send failure response with descriptive error message
  //   res.status(404).json({
  //     status: 'fail',
  //     message: err.message || 'An error occurred while retrieving the tour stats',
  //   });
  // }
});

exports.getMonthlyPlan = catchAsync(
  async (req, res, next) => {
    // try{

    const year = req.params.year * 1;
    const plan = await Tour.aggregate([
      {
        $unwind: '$startDates',
      },
      {
        $match: {
          startDates: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`),
          },
        },
      },
      {
        $group: {
          _id: { $month: '$startDates' },
          numTourStarts: { $sum: 1 },
          tours: { $push: '$name' },
        },
      },
      {
        $addFields: { month: '$_id' },
      },
      {
        $project: { _id: 0 },
      },
      {
        $sort: { numTourStarts: -1 },
      },
      {
        $limit: 12,
      },
    ]);
    res.status(200).json({
      status: 'success',
      data: {
        plan,
      },
    });
  }
  // catch(err){
  //   console.error('Error while retrieving tour stats:', err);

  //   res.status(404).json({
  //     status: 'fail',
  //     message: err.message || 'An error occurred while retrieving the tour plan',
  //   });
  // }
);


exports.getAllToursWithin = catchAsync (async(req,res,next)=>{
  const {distance,latlng,unit} =req.params; 
  let radius
  if(unit==='mi'){
     radius = distance/3963.2;
  }
  else{
     radius = distance/6378.1;
  }
  const[lat,lng] =latlng.split(',');
  if(!lat||!lng){
    next(new AppError("please provide latitude and longitude in the format lat,lng.",400))
  };
const tours = await Tour.find({startLocation :{$geoWithin :{$centerSphere :[[lng,lat],radius]}}
});
if(tours.length>0){
  res.status(200).json({
    status: 'success',
    result : tours.length,
    data: {
      tours,
    },
  });
}
else{
  res.status(400).json({
    status: 'fail',
    message : ' no tours found within your area'
  });
}
});

exports.getDistances = catchAsync (async(req,res,next)=>{
  const {latlng,unit} =req.params; 
  let multiplier
  if(unit==='mi'){
     multiplier =0.000621371;
  }
  else{
     multiplier =0.001;
  }
  const[lat,lng] =latlng.split(',');
  if(!lat||!lng){
    next(new AppError("please provide latitude and longitude in the format lat,lng.",400))
  };
  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1] // Convert to numbers
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier  // Adjust distance to a smaller unit
      }
    },
    {
      $project: {
        distance: 1,
        name: 1 // Include only the distance and name fields in the result
      }
    }
  ]);
  
  if(distances.length>0){
    res.status(200).json({
      status: 'success',
      result : distances.length,
      data: {
        distances,
      },
    });
  }
  else{
    res.status(400).json({
      status: 'fail',
      message : ' no tours found near your point'
    });
  }
});

// exports.deleteTour = catchAsync(async (req, res, next) => {
//   // try {
//   const tour = await Tour.findByIdAndDelete(req.params.id);

//   if (!tour) {
//     return next(new AppError('No tour found with that ID', 404));
//   }
//   res.status(204).json({
//     status: 'success',
//     data: null,
//   });
//   // } catch (err) {
//   //   console.error('Error while deleting a tour:', err);

//   //   // Send failure response with more descriptive error message
//   //   res.status(404).json({
//   //     status: 'fail',
//   //     message: err.message || 'An error occurred while deleting the tour',
//   //   });
//   // }
// });

// exports.updateTour = catchAsync(async (req, res, next) => {
//   // try {
//   const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
//     new: true,
//     runValidators: true,
//   });
//   if (!tour) {
//     return next(new AppError('No tour found with that ID', 404));
//   }
//   res.status(200).json({
//     status: 'success',
//     data: {
//       tour: tour,
//     },
//   });
//   // } catch (err) {
//   //   console.error('Error while updating the tour:', err);

//   //   // Send failure response with more descriptive error message
//   //   res.status(400).json({
//   //     status: 'fail',
//   //     message: err.message || 'An error occurred while updating the tour',
//   //   });
//   // }
// });

//exports.createTour = catchAsync(async (req, res, next) => {
  //   // Use Mongoose's create() method to save the tour document
  //   // try {
  //   //   const newTour = await Tour.create(req.body);
  
  //   //   // Send success response
  //   //   res.status(201).json({
  //   //     status: 'success',
  //   //     data: {
  //   //       tour: newTour,
  //   //     },
  //   //   });
  //   // } catch (err) {
  //   //   // Log the error for debugging purposes
  //   //   console.error('Error while creating a tour:', err);
  
  //   //   // Send failure response with more descriptive error message
  //   //   res.status(400).json({
  //   //     status: 'fail',
  //   //     message: err.message || 'An error occurred while creating the tour',
  //   //   });
  //   // }
  //   const newTour = await Tour.create(req.body);
  
  //   // Send success response
  //   res.status(201).json({
  //     status: 'success',
  //     data: {
  //       tour: newTour,
  //     },
  //   });
  // });
  // exports.getTour = catchAsync(async (req, res, next) => {
//   // try {
//   const tour = await Tour.findById(req.params.id).populate('reviews');
//   if (!tour) {
//     return next(new AppError('No tour found with that ID', 404));
//   }
//   res.status(200).json({
//     status: 'success',
//     data: {
//       tour,
//     },
//   });
//   // } catch (err) {
//   //   console.error('Error while creating a tour:', err);

//   //   // Send failure response with more descriptive error message
//   //   res.status(400).json({
//   //     status: 'fail',
//   //     message: err.message || 'An error occurred while creating the tour',
//   //   });
//   // }
// });
//exports.getAllTours = catchAsync(async function (req, res, next) {
  //   // try {
  //   //#region  logic in apifeatures
  //   // Build query object from req.query
  //   //console.log(req.query);
  
  //   // const queryObj = { ...req.query };
  //   // const excludedFields = ['page', 'sort', 'limit', 'fields'];
  //   // excludedFields.forEach((el) => delete queryObj[el]);
  
  //   // // Advanced filtering with operators like gte, lte
  //   // let queryStr = JSON.stringify(queryObj);
  //   // queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
  
  //   // const queryObjWithOperators = JSON.parse(queryStr);
  //   // //console.log(queryObjWithOperators);
  
  //   // // Construct Mongoose query
  //   // let query = Tour.find(queryObjWithOperators);
  //   //sorting
  //   // if (req.query.sort) {
  //   //   const sortby = req.query.sort.split(',').join(' ');
  //   //   console.log(sortby);
  //   //   query = query.sort(sortby);
  //   // } else {
  //   //   query = query.sort('-createdAt');
  //   // }
  //   //selecting fields
  //   // if (req.query.fields) {
  //   //   const fields = req.query.fields.split(',').join(' ');
  //   //   console.log(fields);
  //   //   query = query.select(fields);
  //   // } else {
  //   //   query = query.select('-__v');
  //   // }
  //   //Pagination
  //   // const page = req.query.page * 1 || 1;
  //   // const limit = req.query.limit * 1 || 100;
  //   // const skip = (page - 1) * limit;
  //   // query = query.skip(skip).limit(limit);
  //   // if (req.query.page) {
  //   //   const numTours = await Tour.countDocuments();
  //   //   if (skip >= numTours) {
  //   //     throw new Error('this page does not exist');
  //   //   }
  //   // }
  //   //#endregion
  
  //   // Execute the query
  //   const features = new APIFeatures(Tour.find(), req.query)
  //     .filter()
  //     .sorting()
  //     .limitFields()
  //     .Pagination();
  //   const tours = await features.query;
  
  //   // Send the response
  //   res.status(200).json({
  //     status: 'success',
  //     results: tours.length,
  //     data: {
  //       tours: tours,
  //     },
  //   });
  //   // } catch (err) {
  //   //   console.error('An error occurred while retrieving all tours:', err);
  //   //   res.status(500).json({
  //   //     status: 'fail',
  //   //     message: 'Error retrieving tours',
  //   //   });
  //   // }
  // });
  