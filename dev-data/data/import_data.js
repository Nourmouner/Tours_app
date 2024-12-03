// const dotenv = require('dotenv');
// const fs = require('fs');
// dotenv.config({ path: './config.env' });
// const mongoose = require('mongoose');
// const Tour = require('./../../models/tourModel');

// mongoose
//   .connect(process.env.DATABASE_LOCAL, {})
//   .then(() => console.log('DB connection successful'))
//   .catch((err) => console.error('DB connection error:', err));

// const tours = JSON.parse(
//   fs.readFileSync(`${__dirname}/tours.json`, 'utf-8')
// );
// const importdata = async () => {
//   try {
//     await Tour.create(tours);
//     console.log('data successfully transfered');
//     process.exit();
//   } catch (err) {
//     console.log(err);
//   }
// };
// if (process.argv[2] == '--import') {
//   importdata();
// }
// console.log(process.argv);
