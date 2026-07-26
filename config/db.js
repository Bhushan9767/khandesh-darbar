const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");

let useLocalFiles = false;

async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.warn("WARNING: MONGODB_URI is empty. Falling back to local JSON files in '/data'.");
    useLocalFiles = true;
    return;
  }
  try {
    // Set a timeout of 3 seconds so it fails fast if MongoDB is not running locally
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000
    });
    console.log("MongoDB Database Connected Successfully.");
  } catch (error) {
    console.warn("MongoDB connection failed:", error.message);
    console.warn("Falling back to local JSON files in '/data'.");
    useLocalFiles = true;
  }
}

const DATA_DIR = path.join(__dirname, "../data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readJSONFile(filename) {
  const filepath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filepath)) {
    fs.writeFileSync(filepath, JSON.stringify([]));
    return [];
  }
  try {
    const data = fs.readFileSync(filepath, "utf8");
    return JSON.parse(data || "[]");
  } catch (err) {
    console.error(`Error reading local db file ${filename}:`, err);
    return [];
  }
}

function writeJSONFile(filename, data) {
  const filepath = path.join(DATA_DIR, filename);
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
}

// Mimics a Mongoose model query result list that has methods or acts as a promise
class LocalQuery {
  constructor(data) {
    this.data = data;
  }
  sort(sortOption) {
    // Simplistic sorting
    return this;
  }
  async exec() {
    return this.data;
  }
  then(onfulfilled, onrejected) {
    return Promise.resolve(this.data).then(onfulfilled, onrejected);
  }
}

class LocalModel {
  constructor(name, filename) {
    this.name = name;
    this.filename = filename;
  }

  async find(query = {}) {
    const items = readJSONFile(this.filename);
    const filtered = items.filter(item => {
      for (let key in query) {
        if (query[key] !== undefined && item[key] !== query[key]) {
          return false;
        }
      }
      return true;
    });
    return filtered;
  }

  async findOne(query = {}) {
    const items = readJSONFile(this.filename);
    const found = items.find(item => {
      for (let key in query) {
        if (query[key] !== undefined && item[key] !== query[key]) {
          return false;
        }
      }
      return true;
    });
    if (!found) return null;
    return this._attachMethods(found);
  }

  async findById(id) {
    const items = readJSONFile(this.filename);
    const idStr = id ? id.toString() : "";
    const found = items.find(item => item._id === idStr);
    if (!found) return null;
    return this._attachMethods(found);
  }

  async create(data) {
    const items = readJSONFile(this.filename);
    const newItem = {
      _id: Math.random().toString(36).substring(2, 9),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...data
    };

    // If saving an Admin, hash the password
    if (this.name === "Admin" && newItem.password) {
      newItem.password = await bcrypt.hash(newItem.password, 12);
    }

    items.push(newItem);
    writeJSONFile(this.filename, items);
    return this._attachMethods(newItem);
  }

  async findByIdAndUpdate(id, updateData, options = {}) {
    const items = readJSONFile(this.filename);
    const idStr = id ? id.toString() : "";
    const index = items.findIndex(item => item._id === idStr);
    if (index === -1) return null;
    
    items[index] = {
      ...items[index],
      ...updateData,
      updatedAt: new Date().toISOString()
    };
    writeJSONFile(this.filename, items);
    return this._attachMethods(items[index]);
  }

  async findByIdAndDelete(id) {
    const items = readJSONFile(this.filename);
    const idStr = id ? id.toString() : "";
    const index = items.findIndex(item => item._id === idStr);
    if (index === -1) return null;
    const deleted = items.splice(index, 1)[0];
    writeJSONFile(this.filename, items);
    return deleted;
  }

  async countDocuments(query = {}) {
    const items = await this.find(query);
    return items.length;
  }

  _attachMethods(item) {
    if (!item) return null;
    // Add comparePassword function if this is an Admin model
    if (this.name === "Admin") {
      item.comparePassword = function(candidate) {
        return bcrypt.compare(candidate, this.password);
      };
    }
    return item;
  }
}

// Models holder
const models = {};

function registerModel(name, filename, mongooseModel) {
  models[name] = {
    mongooseModel,
    localModel: new LocalModel(name, filename)
  };
}

function getModel(name) {
  return new Proxy({}, {
    get(target, prop) {
      const activeModel = useLocalFiles ? models[name].localModel : models[name].mongooseModel;
      const value = activeModel[prop];
      if (typeof value === "function") {
        return value.bind(activeModel);
      }
      return value;
    }
  });
}

module.exports = {
  connectDB,
  registerModel,
  getModel,
  isLocal: () => useLocalFiles
};
