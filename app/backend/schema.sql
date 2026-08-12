-- Run this once against the RDS MySQL instance to create the
-- minimal table the prototype app reads from and writes to.
-- Example: mysql -h <rds-endpoint> -u admin -p abc_healthcare < schema.sql

CREATE DATABASE IF NOT EXISTS abc_healthcare;
USE abc_healthcare;

CREATE TABLE IF NOT EXISTS patients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  date_of_birth DATE NOT NULL,
  phone VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- A couple of sample rows so the list view isn't empty on first load.
INSERT INTO patients (full_name, date_of_birth, phone) VALUES
  ('Anita Sharma', '1990-04-12', '555-0101'),
  ('Bikash Thapa', '1985-11-02', '555-0102');
