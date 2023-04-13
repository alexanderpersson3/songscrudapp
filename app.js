const express = require("express");
const exphbs = require("express-handlebars");
const { MongoClient, ObjectId } = require("mongodb");
const bodyParser = require("body-parser");
require("dotenv").config();

(async () => {
  const connectionUrl = process.env.CONNECTION_URL;

  const client = new MongoClient(connectionUrl);

  const dbName = "SongsCrudApp";

  await client.connect();

  async function getSongsCollection() {
    const db = client.db(dbName);
    const collection = db.collection("songs");
    return collection;
  }

  async function getArtistsCollection() {
    const db = client.db(dbName);
    const collection = db.collection("artists");
    return collection;
  }

  const app = express();
  app.use(bodyParser.urlencoded({ extended: false }));

  app.engine(
    "hbs",
    exphbs.engine({
      defaultLayout: "main",
      extname: ".hbs",
    })
  );

  app.set("view engine", "hbs");

  app.use(express.static("public"));

  app.get("/", async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const perPage = 5;
    const collection = await getSongsCollection();
    const totalSongs = await collection.countDocuments();
    const totalPages = Math.ceil(totalSongs / perPage);
    const songs = await collection
      .find()
      .sort({ updatedAt: -1, createdAt: -1 })
      .skip((page - 1) * perPage)
      .limit(perPage)
      .toArray();

    res.render("home", { songs, page, totalPages });
  });

  app.get("/new-song", async (req, res) => {
    const artistsCollection = await getArtistsCollection();
    const artists = await artistsCollection.find().toArray();
    res.render("new-song", { artists });
  });

  app.post("/new-song", async (req, res) => {
    const newSong = {
      title: req.body.title,
      artist: req.body.artist,
      album: req.body.album,
      year: req.body.year,
      genre: req.body.genre,
      updatedAt: new Date(),
      createdAt: new Date(),
    };
    const collection = await getSongsCollection();

    await collection.insertOne(newSong);

    res.redirect("/");
  });

  app.get("/edit-song/:id", async (req, res) => {
    const id = req.params.id;
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).send("Invalid ID");
    }
    const objectId = new ObjectId(id);
    const collection = await getSongsCollection();
    const song = await collection.findOne({ _id: objectId });
    const artistsCollection = await getArtistsCollection();
    const artists = await artistsCollection.find().toArray();
    res.render("edit-song", { song, artists });
  });

  app.get("/songs/:id", async (req, res) => {
    const id = req.params.id;
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).send("Invalid ID");
    }
    const objectId = new ObjectId(id);
    const collection = await getSongsCollection();
    const song = await collection.findOne({ _id: objectId });

    if (!song) {
      return res.status(404).send("Song not found");
    }

    res.render("song", { song });
  });

  app.post("/edit-song/:id", async (req, res) => {
    const artistId = req.body.artist;
    const isValidId = /^[0-9a-fA-F]{24}$/.test(artistId);
    if (!isValidId) {
      return res.status(400).send("Invalid artist id");
    }

    const updatedSong = {
      title: req.body.title,
      artist: new ObjectId(artistId),
      album: req.body.album,
      year: req.body.year,
      updatedAt: new Date(),
    };

    const objectId = new ObjectId(req.params.id);
    const collection = await getSongsCollection();
    const song = await collection.updateOne(
      { _id: objectId },
      { $set: updatedSong }
    );

    res.redirect("/");
  });

  app.listen(8000, () => {
    console.log("http://localhost:8000/");
  });
})();
