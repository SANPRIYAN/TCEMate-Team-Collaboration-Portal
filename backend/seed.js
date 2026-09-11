require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const mongoose = require('mongoose');
const connectDB = require('./config/db');

const models = [
  require('./models/User'),
  require('./models/Project'),
  require('./models/Discussion'),
  require('./models/Applicant'),
  require('./models/Interest'),
  require('./models/Notification')
];

const collectionNames = models.map((model) => model.collection.name);

const ensureCollectionsAndIndexes = async () => {
  const existingCollections = new Set(
    (await mongoose.connection.db.listCollections({}, { nameOnly: true }).toArray())
      .map((collection) => collection.name)
  );

  for (const model of models) {
    if (!existingCollections.has(model.collection.name)) {
      await model.createCollection();
    }
    await model.init();
  }
};

const verifyCollectionsAndModels = async () => {
  const actualCollections = new Set(
    (await mongoose.connection.db.listCollections({}, { nameOnly: true }).toArray())
      .map((collection) => collection.name)
  );

  const missingCollections = collectionNames.filter((name) => !actualCollections.has(name));
  if (missingCollections.length) {
    throw new Error(`Collection verification failed for: ${missingCollections.join(', ')}`);
  }

  const modelChecks = {};
  for (const model of models) {
    await model.findOne({}).select('_id').lean();
    modelChecks[model.collection.name] = true;
  }

  const counts = {};
  for (const name of collectionNames) {
    counts[name] = await mongoose.connection.db.collection(name).countDocuments();
  }

  return { counts, modelChecks };
};

const runSeed = async () => {
  const connected = await connectDB();
  if (!connected) {
    throw new Error('MongoDB connection failed; seed script cannot proceed without a valid MONGO_URI.');
  }

  try {
    await ensureCollectionsAndIndexes();
    const result = await verifyCollectionsAndModels();
    console.log('MongoDB collection initialization succeeded.');
    console.log(`Collections: ${collectionNames.join(', ')}`);
    console.log(`Document counts: ${JSON.stringify(result.counts)}`);
    console.log(`Mongoose model checks: ${JSON.stringify(result.modelChecks)}`);
  } catch (error) {
    console.error('MongoDB collection initialization failed:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

runSeed();