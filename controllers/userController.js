const User = require('./../models/userModel');
const APIFeatures = require('./../utils/apiFeatures');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const Factory =require('./handlerFactory');

exports.getAllUsers = Factory.getAll(User);
exports.getuser =Factory.getOne(User);
exports.updateUser =Factory.updateOne(User);
exports.deleteUser = Factory.deleteOne(User);

const filterobj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) {
      newObj[el] = obj[el]; 
    }
  });
  return newObj;
};

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'this route is not defined please use signup instead !',
  });
}; 
exports.updateMe = catchAsync(async (req, res, next) => {
  if (req.body.password || req.body.passwordConfirm) {
    return next(new AppError('this route is not for updating passwords!', 400));
  }
  const filteredBody =filterobj(req.body,'name','email');
  const updatedUser = await User.findByIdAndUpdate(req.user.id,filteredBody,{new : true, runValidators : true
});

    res.status(200).json({
      status: 'success',
      data : {
        user : updatedUser
      },
      message: 'user is updated!',
    });
  
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id,{active : false})
    res.status(204).json({
      status: 'success',
      data :  null,
    });
  
});
exports.getMe =(req,res,next)=>{
  req.params.id =req.user.id;
  next();
}
