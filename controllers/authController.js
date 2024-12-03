// Controller for user authentication and password reset

const crypto = require('crypto');
const { promisify } = require('util');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const jwt = require('jsonwebtoken');
const AppError = require('./../utils/appError');
const sendEmail = require('./../utils/email');
// const redis = require('redis');


// Helper function to sign a JWT token for user authentication
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

// Function to create and send token in the response
const CreateSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const value =24*60*60*1000;
  const cookieOptions = {
    expires: new Date(Date.now()+process.env.JWT_COOKIE_EXPIRES_IN*value),
    httpOnly : true
  };
  if(process.env.NODE_ENV==='production'){
    cookieOptions.secure=true;
  }
  res.cookie('jwt',token,cookieOptions);
  user.password=undefined;
  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

// Signup function for creating a new user
exports.signUp = catchAsync(async (req, res, next) => {
  // Create a new user from the request body
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    role: req.body.role,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });

  // Send the token to the client
  CreateSendToken(newUser, 201, res);
});

// Login function to authenticate an existing user
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1. Check if email and password are provided
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  // 2. Check if the user exists and if the password is correct
  const user = await User.findOne({ email }).select('+password');

  // Verify the password
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  // 3. If everything is OK, send the token to the client
  CreateSendToken(user, 200, res);
});

// Protect middleware to guard routes (only accessible by authenticated users)
exports.protect = catchAsync(async (req, res, next) => {
  let token;

  // 1. Get token from authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  // 2. Check if the token exists
  if (!token) {
    return next(
      new AppError('You are not logged in! Please log in to get access', 401)
    );
  }

  // 3. Verify the token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 4. Check if the user still exists
  const freshUser = await User.findById(decoded.id);
  if (!freshUser) {
    return next(
      new AppError('The user belonging to this token no longer exists.', 401)
    );
  }

  // 5. Check if the user changed the password after the token was issued
  if (freshUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password! Please log in again.', 401)
    );
  }

  // Grant access to protected route
  req.user = freshUser;
  next();
});

// Restrict access to specific roles (e.g., 'admin' or 'lead-guide')
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // Check if the user's role is authorized
    console.log(`User role: ${req.user.role}`); // Log the role
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }
    next();
  };
};

// Forgot password functionality
exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1. Find the user based on the provided email
  const user = await User.findOne({ email: req.body.email });

  // 2. If the user does not exist, return an error
  if (!user) {
    return next(new AppError('There is no user with this email address', 404));
  }

  // 3. Generate a password reset token for the user
  const resetToken = user.createPasswordResetToken();

  // 4. Save the user without validating other fields
  await user.save({ validateBeforeSave: false });

  // 5. Send the reset URL via email to the user
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;
  const message = `Forgot your password? Submit a PATCH request to this URL: ${resetURL}.\nIf you didn't forget your password, please ignore this email!`;

  // 6. Try to send the email, and if successful, respond with a success message
  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password reset token (valid for 10 minutes)',
      message,
    });

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!',
    });

    // 7. If sending the email fails, remove the reset token and expiration, and return an error
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        'There was an error sending the email. Try again later!',
        500
      )
    );
  }
});

// Reset password functionality
exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1. Hash the token provided in the request params
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  // 2. Find the user by the hashed reset token and check if the token is still valid
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // 3. If the token is invalid or expired, return an error
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }

  // 4. Update the user's password and clear the reset token and expiration
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  // 5. Save the updated user
  await user.save();

  // 6. Send a new token to the client for the updated user
  CreateSendToken(user, 200, res);
});

// Update password for logged-in users
exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1. Find the user by their ID, selecting the password field explicitly
  const user = await User.findById(req.user.id).select('+password');
  console.log('User:', user);

  // 2. Check if the provided current password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(
      new AppError('This password is incorrect! Please try again.', 404)
    );
  }

  // 3. Update the user's password and save the changes
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  // 4. Send a new token to the client for the updated user
  CreateSendToken(user, 200, res);
});
