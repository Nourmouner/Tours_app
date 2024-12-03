// Server setup
process.on('uncaughtException',err=>{
  console.log('Unhandled exception ! shutting down');
  console.log(err.name,err.message);
  process.exit(1);
});
const dotenv = require('dotenv');
// Load environment variable  s from config.env
dotenv.config({ path: './config.env' });
const app = require('./app');
const mongoose = require('mongoose');

// Set the port
const port = process.env.PORT || 3000;

// MongoDB connection

mongoose
  .connect(process.env.DATABASE_LOCAL, {
    // Add this to use the unified topology engine
  })
  .then(() => console.log('DB connection successful'))
  .catch((err) => console.error('DB connection error:', err));

//console.log(process.env);
//#region making a test tour
// let testTour = new Tour({
//   name: 'nour1',
//   rating: 4.5,
//   price: 423,
// });
// testTour
//   .save()
//   .then((doc) => {
//     console.log(doc);
//   })
//   .catch((err) => {
//     console.error('Error while saving document:', err);
//   });
//#endregion

const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});
process.on('unhandledRejections',err=>{
  console.log('Unhandled rejection ! shutting down');
  console.log(err.name,err.message);
  server.close(()=>{ process.exit(1);

  })
});
 

