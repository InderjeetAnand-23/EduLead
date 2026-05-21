const fs = require('fs');
const path = require('path');
const session = require('express-session');

const SESSIONS_FILE = path.join(__dirname, '..', 'data', 'sessions.json');

class FileSessionStore extends session.Store {
  constructor() {
    super();
    // Ensure data directory exists
    const dataDir = path.join(__dirname, '..', 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    if (!fs.existsSync(SESSIONS_FILE)) {
      fs.writeFileSync(SESSIONS_FILE, JSON.stringify({}), 'utf8');
    }
  }

  readSessions() {
    try {
      if (!fs.existsSync(SESSIONS_FILE)) return {};
      return JSON.parse(fs.readFileSync(SESSIONS_FILE, 'utf8'));
    } catch (e) {
      return {};
    }
  }

  writeSessions(sessions) {
    try {
      fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions, null, 2), 'utf8');
    } catch (e) {
      console.error('Failed to write sessions:', e);
    }
  }

  get(sid, callback) {
    const sessions = this.readSessions();
    const sess = sessions[sid];
    if (!sess) {
      return callback(null, null);
    }
    // Check expiration
    if (sess.cookie && sess.cookie.expires) {
      const expires = new Date(sess.cookie.expires);
      if (new Date() > expires) {
        this.destroy(sid, () => {});
        return callback(null, null);
      }
    }
    callback(null, sess);
  }

  set(sid, sess, callback) {
    const sessions = this.readSessions();
    sessions[sid] = sess;
    this.writeSessions(sessions);
    callback(null);
  }

  destroy(sid, callback) {
    const sessions = this.readSessions();
    delete sessions[sid];
    this.writeSessions(sessions);
    callback(null);
  }
}

module.exports = FileSessionStore;
