const catchAsync =require('./../utils/catchAsync');
const AppError =require('./../utils/appError');
const APIFeatures =require('./../utils/apiFeatures');


exports.deleteOne = Model => catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);
  
    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }
    res.status(204).json({
      status: 'success',
      data: null,
    });
  });
  
  exports.updateOne = Model => catchAsync(async (req, res, next) => {
    
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }
    res.status(200).json({
      status: 'success',
      data: {
         data : doc,
      },
    });
  });
  
  exports.createOne = Model => catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);
    res.status(201).json({
      status: 'success',
      data: {
        data : doc,
      },
    });
  });

  exports.getOne=(Model,populateOptions)=>catchAsync(async (req, res, next) => {
    let query = await Model.findById(req.params.id);
    if(populateOptions&&query)
    {
      query = query.populate(populateOptions);
    }
    const doc = await query;
    if (!doc) {
      return next(new AppError('No document  found with that ID', 404));
    }
    res.status(200).json({
      status: 'success',
      data: {
        data : doc
      },
    });
  });

  exports.getAll = Model =>catchAsync(async function (req, res, next) {
    let filter = {};
    if (req.params.tourId) {
      filter = { tour: req.params.tourId }; // Correctly set the filter for the tour ID
    }
    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sorting()
      .limitFields()
      .Pagination();
    // const doc = await features.query.explain();
    const doc = await features.query;
    res.status(200).json({
      status: 'success',
      results: doc.length,
      data: {
        data : doc,
      },
    });
  });