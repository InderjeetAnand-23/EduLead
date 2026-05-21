const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const LEADS_FILE = path.join(DATA_DIR, 'leads.json');
const ADMINS_FILE = path.join(DATA_DIR, 'admins.json');
const STUDENTS_FILE = path.join(DATA_DIR, 'students.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Helper to read JSON
const readData = (filePath) => {
  if (!fs.existsSync(filePath)) {
    return [];
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (err) {
    return [];
  }
};

// Helper to write JSON
const writeData = (filePath, data) => {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
};

function matchesQuery(item, query) {
  if (!query || Object.keys(query).length === 0) return true;

  for (const key in query) {
    const val = query[key];

    // Handle $or
    if (key === '$or') {
      if (!Array.isArray(val)) continue;
      const orMatched = val.some(subQuery => matchesQuery(item, subQuery));
      if (!orMatched) return false;
      continue;
    }

    // Get item value for key
    const itemVal = item[key];

    if (val && typeof val === 'object' && !(val instanceof RegExp)) {
      // It's a query operator like $ne, $nin
      if ('$ne' in val) {
        if (val.$ne === null) {
          if (itemVal === null || itemVal === undefined) return false;
        } else {
          if (itemVal === val.$ne) return false;
        }
      }
      if ('$nin' in val) {
        if (Array.isArray(val.$nin)) {
          if (val.$nin.includes(itemVal)) return false;
        }
      }
    } else if (val instanceof RegExp) {
      if (!itemVal || !val.test(itemVal)) return false;
    } else {
      // Direct equality
      if (itemVal !== val) return false;
    }
  }
  return true;
}

class QueryChain {
  constructor(data) {
    this.data = data;
  }

  sort(sortObj) {
    if (!sortObj) return this;
    const key = Object.keys(sortObj)[0];
    const order = sortObj[key]; // 1 or -1

    this.data.sort((a, b) => {
      let valA = a[key];
      let valB = b[key];

      // Handle dates
      if (key === 'createdAt' || key === 'followUpDate') {
        valA = valA ? new Date(valA).getTime() : 0;
        valB = valB ? new Date(valB).getTime() : 0;
      }

      if (valA < valB) return order === 1 ? -1 : 1;
      if (valA > valB) return order === 1 ? 1 : -1;
      return 0;
    });

    return this;
  }

  limit(num) {
    if (typeof num === 'number') {
      this.data = this.data.slice(0, num);
    }
    return this;
  }

  // To act as a Promise (then/catch) so await works seamlessly!
  then(onFulfilled, onRejected) {
    return Promise.resolve(this.data).then(onFulfilled, onRejected);
  }
}

class LeadInstance {
  constructor(data) {
    Object.assign(this, data);
  }

  async save() {
    const data = readData(LEADS_FILE);
    const index = data.findIndex(item => item._id === this._id);
    this.createdAt = this.createdAt || new Date().toISOString();
    this.status = this.status || 'New';
    this.leadSource = this.leadSource || 'Website Inquiry Form';

    if (index !== -1) {
      data[index] = { ...this };
    } else {
      this._id = this._id || Math.random().toString(36).substring(2, 9);
      data.push({ ...this });
    }
    writeData(LEADS_FILE, data);
    return this;
  }
}

class Lead {
  constructor(data) {
    return new LeadInstance(data);
  }

  static find(query = {}) {
    const data = readData(LEADS_FILE);
    const filtered = data.filter(item => matchesQuery(item, query));
    return new QueryChain(filtered);
  }

  static async findById(id) {
    const data = readData(LEADS_FILE);
    const found = data.find(item => item._id === id.toString());
    if (!found) return null;
    return new LeadInstance(found);
  }

  static async findOne(query) {
    const data = readData(LEADS_FILE);
    const found = data.find(item => matchesQuery(item, query));
    if (!found) return null;
    return new LeadInstance(found);
  }

  static async findByIdAndUpdate(id, updateData, options = {}) {
    const data = readData(LEADS_FILE);
    const index = data.findIndex(item => item._id === id.toString());
    if (index === -1) return null;

    const updated = { ...data[index], ...updateData };
    data[index] = updated;
    writeData(LEADS_FILE, data);
    return new LeadInstance(updated);
  }

  static async findByIdAndDelete(id) {
    const data = readData(LEADS_FILE);
    const index = data.findIndex(item => item._id === id.toString());
    if (index === -1) return null;

    const deleted = data[index];
    data.splice(index, 1);
    writeData(LEADS_FILE, data);
    return deleted;
  }

  static async countDocuments(query = {}) {
    const data = readData(LEADS_FILE);
    const filtered = data.filter(item => matchesQuery(item, query));
    return filtered.length;
  }

  static async distinct(field) {
    const data = readData(LEADS_FILE);
    const values = data.map(item => item[field]).filter(Boolean);
    return [...new Set(values)];
  }

  static async aggregate(pipeline) {
    let data = readData(LEADS_FILE);
    for (const stage of pipeline) {
      if (stage.$group) {
        const groupField = stage.$group._id.replace('$', '');
        const groups = {};
        data.forEach(item => {
          const key = item[groupField] || 'Unknown';
          groups[key] = (groups[key] || 0) + 1;
        });
        data = Object.keys(groups).map(key => ({
          _id: key,
          count: groups[key]
        }));
      } else if (stage.$sort) {
        const sortField = Object.keys(stage.$sort)[0];
        const sortOrder = stage.$sort[sortField];
        data.sort((a, b) => {
          if (a[sortField] < b[sortField]) return sortOrder;
          if (a[sortField] > b[sortField]) return -sortOrder;
          return 0;
        });
      }
    }
    return data;
  }
}

class AdminInstance {
  constructor(data) {
    Object.assign(this, data);
  }

  async save() {
    const data = readData(ADMINS_FILE);
    const index = data.findIndex(item => item._id === this._id || item.email === this.email);
    this.createdAt = this.createdAt || new Date().toISOString();

    if (index !== -1) {
      data[index] = { ...this };
    } else {
      this._id = this._id || Math.random().toString(36).substring(2, 9);
      data.push({ ...this });
    }
    writeData(ADMINS_FILE, data);
    return this;
  }
}

class AdminQuery {
  constructor(promise) {
    this.promise = promise;
  }
  select(fields) {
    return this;
  }
  then(onFulfilled, onRejected) {
    return this.promise.then(onFulfilled, onRejected);
  }
}

class Admin {
  constructor(data) {
    return new AdminInstance(data);
  }

  static async findOne(query) {
    const data = readData(ADMINS_FILE);
    const found = data.find(item => matchesQuery(item, query));
    if (!found) return null;
    return new AdminInstance(found);
  }

  static findById(id) {
    const promise = (async () => {
      const data = readData(ADMINS_FILE);
      const found = data.find(item => item._id === id.toString());
      if (!found) return null;
      return new AdminInstance(found);
    })();
    return new AdminQuery(promise);
  }
}

class StudentInstance {
  constructor(data) {
    Object.assign(this, data);
  }

  async save() {
    const data = readData(STUDENTS_FILE);
    const index = data.findIndex(item => item._id === this._id || item.email === this.email);
    this.createdAt = this.createdAt || new Date().toISOString();

    if (index !== -1) {
      data[index] = { ...this };
    } else {
      this._id = this._id || Math.random().toString(36).substring(2, 9);
      data.push({ ...this });
    }
    writeData(STUDENTS_FILE, data);
    return this;
  }
}

class Student {
  constructor(data) {
    return new StudentInstance(data);
  }

  static async findOne(query) {
    const data = readData(STUDENTS_FILE);
    const found = data.find(item => matchesQuery(item, query));
    if (!found) return null;
    return new StudentInstance(found);
  }

  static findById(id) {
    const promise = (async () => {
      const data = readData(STUDENTS_FILE);
      const found = data.find(item => item._id === id.toString());
      if (!found) return null;
      return new StudentInstance(found);
    })();
    return new AdminQuery(promise);
  }
}

module.exports = {
  Lead,
  Admin,
  Student,
  readData,
  writeData,
  LEADS_FILE,
  ADMINS_FILE,
  STUDENTS_FILE
};
