const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");

// Disable Mongoose command buffering so queries fail fast if disconnected
mongoose.set("bufferCommands", false);

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
  }
  try {
    const data = fs.readFileSync(filepath, "utf8");
    let parsed = JSON.parse(data || "[]");

    // Auto-seed if empty
    if (parsed.length === 0) {
      try {
        const seedData = require("./seedData.json");
        if (filename === "menu.json") {
          parsed = seedData.defaultMenuItems.map((item, index) => ({
            _id: `seed-menu-${index + 1}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            ...item
          }));
          fs.writeFileSync(filepath, JSON.stringify(parsed, null, 2));
          console.log(`Auto-seeded ${parsed.length} local menu items in '${filename}'.`);
        } else if (filename === "admins.json") {
          const defaultAdmin = seedData.defaultAdmin;
          const hashedPassword = bcrypt.hashSync(defaultAdmin.password, 12);
          parsed = [{
            _id: "seed-admin-1",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            ...defaultAdmin,
            password: hashedPassword
          }];
          fs.writeFileSync(filepath, JSON.stringify(parsed, null, 2));
          console.log(`Auto-seeded local admin credentials in '${filename}'.`);
        }
      } catch (err) {
        console.error("Failed to auto-seed local database file:", err.message);
      }
    }
    return parsed;
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
  select(fields) {
    return this;
  }
  sort(sortOption) {
    return this;
  }
  limit(n) {
    if (Array.isArray(this.data)) {
      this.data = this.data.slice(0, n);
    }
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

  find(query = {}) {
    const items = readJSONFile(this.filename);
    const filtered = items.filter(item => {
      for (let key in query) {
        if (query[key] !== undefined && item[key] !== query[key]) {
          return false;
        }
      }
      return true;
    });
    return new LocalQuery(filtered);
  }

  findOne(query = {}) {
    const items = readJSONFile(this.filename);
    const found = items.find(item => {
      for (let key in query) {
        if (query[key] !== undefined && item[key] !== query[key]) {
          return false;
        }
      }
      return true;
    });
    if (!found) return new LocalQuery(null);
    return new LocalQuery(this._attachMethods(found));
  }

  findById(id) {
    const items = readJSONFile(this.filename);
    const idStr = id ? id.toString() : "";
    const found = items.find(item => item._id === idStr);
    if (!found) return new LocalQuery(null);
    return new LocalQuery(this._attachMethods(found));
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

  findByIdAndUpdate(id, updateData, options = {}) {
    const items = readJSONFile(this.filename);
    const idStr = id ? id.toString() : "";
    const index = items.findIndex(item => item._id === idStr);
    if (index === -1) return new LocalQuery(null);
    
    items[index] = {
      ...items[index],
      ...updateData,
      updatedAt: new Date().toISOString()
    };
    writeJSONFile(this.filename, items);
    return new LocalQuery(this._attachMethods(items[index]));
  }

  findByIdAndDelete(id) {
    const items = readJSONFile(this.filename);
    const idStr = id ? id.toString() : "";
    const index = items.findIndex(item => item._id === idStr);
    if (index === -1) return new LocalQuery(null);
    const deleted = items.splice(index, 1)[0];
    writeJSONFile(this.filename, items);
    return new LocalQuery(deleted);
  }

  async countDocuments(query = {}) {
    const queryResult = await this.find(query);
    return queryResult.length;
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

function wrapPromiseOrQuery(result, name, prop, args) {
  if (!result || typeof result.then !== "function") {
    return result;
  }
  
  return new Proxy(result, {
    get(target, key) {
      if (key === "then") {
        return function(onfulfilled, onrejected) {
          return target.then(onfulfilled).catch(async (err) => {
            const isConnectionError = 
              err.name === "MongooseError" || 
              err.name === "MongoNetworkError" ||
              err.message.includes("buffering") || 
              err.message.includes("connection") || 
              err.message.includes("timed out") ||
              err.message.includes("Mongo") ||
              err.message.includes("Topology");

            if (isConnectionError) {
              console.warn(`Database connection error on ${name}.${prop}: ${err.message}. Switching to local JSON database.`);
              useLocalFiles = true;
              const localModel = models[name].localModel;
              const localValue = localModel[prop];
              if (typeof localValue === "function") {
                const localResult = localValue.apply(localModel, args);
                return wrapPromiseOrQuery(localResult, name, prop, args);
              }
            }
            if (onrejected) return onrejected(err);
            throw err;
          });
        };
      }
      
      const val = target[key];
      if (typeof val === "function") {
        return function(...chainArgs) {
          const chainResult = val.apply(target, chainArgs);
          return wrapPromiseOrQuery(chainResult, name, prop, args);
        };
      }
      return val;
    }
  });
}

function getModel(name) {
  return new Proxy({}, {
    get(target, prop) {
      if (useLocalFiles) {
        const localModel = models[name].localModel;
        const value = localModel[prop];
        if (typeof value === "function") {
          return value.bind(localModel);
        }
        return value;
      }

      const mongooseModel = models[name].mongooseModel;
      const value = mongooseModel[prop];
      if (typeof value === "function") {
        return function(...args) {
          const res = value.apply(mongooseModel, args);
          return wrapPromiseOrQuery(res, name, prop, args);
        };
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
