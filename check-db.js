const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/care-resource-hub').then(async () => {
  console.log('Connected to MongoDB');

  // Check document count
  const count = await mongoose.connection.db.collection('contents').countDocuments();
  console.log('Documents in contents collection:', count);

  // Get the content
  const content = await mongoose.connection.db.collection('contents').findOne();

  if (content) {
    console.log('\nDocument structure:');
    console.log('- Has _id:', !!content._id);
    console.log('- Has caregiver:', !!content.caregiver);
    console.log('- Has carerecipient:', !!content.carerecipient);

    if (content.caregiver) {
      console.log('- Caregiver tabs count:', content.caregiver.tabs?.length || 0);
    }

    if (content.carerecipient) {
      console.log('- Care recipient tabs count:', content.carerecipient.tabs?.length || 0);
    }

    console.log('\nFull document:');
    console.log(JSON.stringify(content, null, 2));
  } else {
    console.log('No content found in database');
  }

  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});