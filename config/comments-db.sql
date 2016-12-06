CREATE DATABASE IF NOT EXISTS iiab_feedback;

CREATE USER IF NOT EXISTS iiab_commenter@localhost IDENTIFIED BY 'g0adm1n';

USE iiab_feedback;

CREATE TABLE IF NOT EXISTS `comments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `session_id` VARCHAR(64),
  `name` VARCHAR(40),
  `email` VARCHAR(40),
  `about_you` VARCHAR(2000),
  `rating` DECIMAL(3,2),
  `comments` VARCHAR(40000),
  `datetime_created` DATETIME,
  PRIMARY KEY (`id`),
  KEY `session_id` (`session_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, DROP, INDEX, ALTER, CREATE TEMPORARY TABLES ON iiab_feedback.* TO 'iiab_commenter'@'localhost';
