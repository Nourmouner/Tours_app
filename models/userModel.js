const crypto = require('crypto');
const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, ' A user must have a name'],
    maxlength: [40, 'A user name must have less than or equal 40 characters'],
    minlength: [0, 'A user name must have more than or equal 0 characters'],
    //validate  : [validator.isAlpha,'A tour name must be all letters']
  },
  email: {
    type: String,
    required: [true, ' A user must have a email'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email'],

    //validate  : [validator.isAlpha,'A tour name must be all letters']
  },
  photo: {
    type: String,
    //required: [true, 'A user must have a profile picture'],
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-tour-guide', 'admin'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'A user must have a password'],
    minlength: [8, 'A password must have more than or equal 8 characters'],
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'please confirm your password'],
    validate: {
      //this only works on CREATE AND SAVE!!
      validator: function (el) {
        return el === this.password;
      },
      message: 'Passwords are not the same !',
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  PasswordResetExpires: Date,
  active : {
    type : Boolean,
    default : true,
    select :false,
  }
});

// Middleware to hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  
  try {
    this.password = await bcrypt.hash(this.password, 12);
    this.passwordConfirm = undefined;
    next(); // Proceed with save
  } catch (err) {
    next(err); // Pass error to Mongoose error handler
  }
});

// Middleware to update passwordChangedAt field
userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  try {
    this.passwordChangedAt = Date.now() - 3000;
    next(); // Proceed with save
  } catch (err) {
    next(err); // Pass error to Mongoose error handler
  }
});

userSchema.pre(/^find/, function (next) {
  this.find({active : true});
  next();

});


userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};
userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  // console.log({ resetToken }, this.passwordResetToken);
  this.PasswordResetExpires = Date.now() + 10 * 60 * 1000;
  return resetToken;
};
const User = mongoose.model('User', userSchema);
module.exports = User;
