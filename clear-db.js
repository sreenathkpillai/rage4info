const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/care-resource-hub').then(async () => {
  console.log('Connected to MongoDB');

  const result = await mongoose.connection.db.collection('contents').deleteMany({});
  console.log(`Cleared ${result.deletedCount} documents from contents collection`);

  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});