DROP TABLE IF EXISTS user;
DROP TABLE IF EXISTS project;
DROP TABLE IF EXISTS prompt;
DROP TABLE IF EXISTS customprompt;
DROP TABLE IF EXISTS system;


CREATE TABLE user (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  project_id INTEGER,
  FOREIGN KEY (project_id) REFERENCES project (id)
);

CREATE TABLE project (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  author_id INTEGER NOT NULL,
  created TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  title TEXT DEFAULT 'Untitled',
  type TEXT NOT NULL CHECK (type IN ('description', 'image', 'label')),
  info TEXT,
  img_url TEXT,
  system TEXT,
  FOREIGN KEY (author_id) REFERENCES user (id)
);

CREATE TABLE prompt (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  prompt TEXT,
  flow TEXT,
  node TEXT,
  userinfo TEXT DEFAULT ' ',
  project_id INTEGER,
  FOREIGN KEY (project_id) REFERENCES project (id)
);

CREATE TABLE customprompt (
  id INTEGER PRIMARY KEY AUTOINCREMENT, 
  flow TEXT,
  node TEXT,
  img TEXT,
  canvas TEXT,
  project_id INTEGER UNIQUE,
  FOREIGN KEY (project_id) REFERENCES project (id)
);


CREATE TABLE system (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sysname TEXT NOT NULL,
  color TEXT NOT NULL
);

