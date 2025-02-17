const express = require('express');
// const fs = require('fs');
const userController = require('./../controllers/userController');
const authController = require('../controllers/authController');

const router = express.Router();
router.post('/signup', authController.signUp);

router.post('/login', authController.login);

router.post('/forgotPassword', authController.forgotPassword);

router.patch('/resetPassword/:token', authController.resetPassword);

router.use(authController.protect);
router.patch('/updateMyPassword',authController.updatePassword);

router.patch('/updateMe',userController.updateMe);

router.delete('/deleteMe',userController.deleteMe);

router.get('/me',userController.getMe,userController.getuser);

router.use(authController.restrictTo('admin'));
router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);

router
  .route('/:id')
  .get(userController.getuser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
