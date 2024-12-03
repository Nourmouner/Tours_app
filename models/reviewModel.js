const mongoose = require('mongoose');
const Tour = require('./tourModel'); // Ensure this is correctly imported

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'A review cannot be empty'],
      maxlength: [
        100,
        'A review must have less than or equal to 100 characters',
      ],
      minlength: [5, 'A review must have more than or equal to 5 characters'],
    },
    rating: {
      type: Number,
      required: [true, 'A review must have a rating'],
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
    },
    createdAt: {
      type: Date,
      default: Date.now,
      select: false,
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'A review must belong to a tour'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'A review must belong to a user'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Populate the user field when fetching reviews
reviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'user',
    select: 'name photo',
  });
  next();
});
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

// Static method to calculate average ratings and number of ratings
reviewSchema.statics.calcAverageRatings = async function (tourId) {
  try {
    const stats = await this.aggregate([
      { $match: { tour: tourId } },
      {
        $group: {
          _id: '$tour',
          nRating: { $sum: 1 },
          avgRating: { $avg: '$rating' },
        },
      },
    ]);

    if (stats.length > 0) {
      await Tour.findByIdAndUpdate(tourId, {
        ratingsQuantity: stats[0].nRating,
        ratingsAverage: stats[0].avgRating,
      });
    } else {
      await Tour.findByIdAndUpdate(tourId, {
        ratingsQuantity: 0,
        ratingsAverage: 4.5, // default value
      });
    }
  } catch (err) {
    console.error(`Error calculating average ratings: ${err}`);
  }
};

// Recalculate average ratings after saving a review
reviewSchema.post('save', function () {
  this.constructor.calcAverageRatings(this.tour);
});

// Store the current document before updating or deleting it
reviewSchema.pre(/^findOneAnd/, async function (next) {
  this.r = await this.findOne();
  next();
});

// Recalculate average ratings after updating or deleting a review
reviewSchema.post(/^findOneAnd/, async function () {
  if (this.r) await this.r.constructor.calcAverageRatings(this.r.tour);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
