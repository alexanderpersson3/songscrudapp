const { MongoClient, ObjectId } = require("mongodb");

// Replace the connection string with your own
const uri = "mongodb://localhost:27017";

async function main() {
  const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  try {
    await client.connect();

    console.log("Connected successfully to server");

    const database = client.db("mydb");
    const collection = database.collection("cars");

    await addNewCar(collection);
    await findAllCars(collection);
    await updateCar(collection);
  } catch (err) {
    console.log(err.stack);
  } finally {
    await client.close();
    console.log("Closing client connection");
  }

  return "done!";
}

async function addNewCar(collection) {
  const newCar = {
    make: "Toyota",
    model: "Corolla",
    year: 2021,
  };

  const result = await collection.insertOne(newCar);

  console.log("Inserted new car", result.insertedId);
}

async function findAllCars(collection) {
  const cars = await collection.find({}).toArray();
  console.log("Found", cars.length, "cars:", cars);
}

async function updateCar(collection) {
  //   const objectId = new ObjectId("6436ae6b0187664672d232cb");
  const filter = {
    _id: new ObjectId("6436ae6b0187664672d232cb"),
    make: "Toyota",
  };
  const update = { $set: { model: "Camry" }, $set: { distance: 10000 } };
  const options = { upsert: false };

  const result = await collection.updateMany(filter, update, options);

  console.log("Updated", result.modifiedCount, "cars");
}

main().then(console.log).catch(console.error);
