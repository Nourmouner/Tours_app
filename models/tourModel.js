const mongoose = require('mongoose');
const slugify = require('slugify');
const validator =require('validator');
// const User =require('./userModel');
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, ' A tour must have a name'],
      unique: true,
      maxlength: [40, 'A tour name must have less than or equal 40 characters'],
      minlength: [10, 'A tour name must have more than or equal 10 characters'],
      // validate: [validator.isAlpha, 'A tour name must be all letters']
    },

    slug: String,

    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, ' A tour must have a price'],
    },
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a GroupSize'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either easy, medium, or difficult',
      },
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          // this only points to current doc on New document creation
          return val <= this.price;
        },
        message: 'Discount price ({VALUE}) should be below tour price',
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a description'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    startDates: [Date],
    secretTours: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point', 
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
      },
    ],
    guides : [
     {
      type : mongoose.Schema.ObjectId,
      ref : 'User',
     }
    ]
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);
tourSchema.index({price : 1 , ratingsAverage : -1});
tourSchema.index({startLocation :'2dsphere'})
tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});
tourSchema.virtual('reviews',{
  ref : 'Review',
  foreignField : 'tour',
  localField : '_id',
});

//embedding user schemas
// tourSchema.pre('save', async function(next) {
//   try {
//     // If guides are already populated, skip fetching them again
//     if (!this.isModified('guides')) return next();

//     // Map guide IDs to full user documents
//     const guidesPromises = this.guides.map(async id => await User.findById(id));
//     this.guides = await Promise.all(guidesPromises);

//     next();
//   } catch (err) {
//     next(err);
//   }
// });
//#region MongoDB middelwares
//Document Middleware : runs before .save() and .Create()
// tourSchema.pre('save', function (next) {
//   this.slug = slugify(this.name, { lower: true });
//   next();
// });
// tourSchema.post('save', function (doc,next) {
//   console.log(doc);
//   next();
// });

//Query MiddleWare :
// tourSchema.pre(/^find/, function (next) {
//   this.find({ secretTours: { $ne: true } });
//   next();
//   this.start = Date.now();
// });
// tourSchema.post(/^find/, function (docs, next) {
//   console.log(`Query took ${Date.now() - this.start}miliseconds!`);
//   console.log(docs);
//   next();
// });

// //Aggregation Middleware :
// tourSchema.pre('aggregate', function (next) {
//   this.pipeline().unshift({ $match: { secretTours: { $ne: true } } });
//   console.log(this);
//   next();
// });
//#endregion
tourSchema.pre(/^find/, function (next) {
  this.populate({
    path : 'guides',
    select : '-__v -passwordChangedAt' 
   });
  next();
 
});


const Tour = mongoose.model('Tour', tourSchema);
module.exports = Tour;
