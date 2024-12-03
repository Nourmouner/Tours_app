const express = require('express');
const reviewController = require('./../controllers/reviewController');
const authController = require('./../controllers/authController');
const router = express.Router({mergeParams : true});

router.use(authController.protect);

router
  .route('/')
  .get(reviewController.getAllReviews)
  .post(

    authController.restrictTo('user'),
    reviewController.setTourUserIds,
    reviewController.createReview
  );
  router
  .route('/:id')
  .get(reviewController.GetReview)
  .patch(authController.restrictTo('user','admin'), reviewController.UpdateReview)
  .delete(
    
    authController.restrictTo('admin', 'user'),
    reviewController.DeleteReview
  );

module.exports = router;
