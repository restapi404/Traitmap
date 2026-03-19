-- ============================================================
--  TraitMap: Personality-Based Career Recommendation System
--  Course  : 21CSC205P – Database Management Systems
--  Authors : Aditi Shikha [RA2411003011404]
--            Rithu Prabhu  [RA2411003011420]
-- ============================================================

DROP DATABASE IF EXISTS traitmap;
CREATE DATABASE traitmap;
USE traitmap;

-- ── TABLE 1: users
CREATE TABLE users (
    user_id         INT           PRIMARY KEY AUTO_INCREMENT,
    username        VARCHAR(100)  NOT NULL,
    email           VARCHAR(150)  UNIQUE NOT NULL,
    password_hash   VARCHAR(255)  NOT NULL,
    age             INT           CHECK (age > 0),
    education_level VARCHAR(100),
    created_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);

-- ── TABLE 2: mbti_profiles
CREATE TABLE mbti_profiles (
    mbti_id             INT     PRIMARY KEY AUTO_INCREMENT,
    user_id             INT     UNIQUE NOT NULL,
    mbti_type           VARCHAR(4),
    introversion_score  FLOAT,
    extraversion_score  FLOAT,
    sensing_score       FLOAT,
    intuition_score     FLOAT,
    thinking_score      FLOAT,
    feeling_score       FLOAT,
    judging_score       FLOAT,
    perceiving_score    FLOAT,
    computed_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- ── TABLE 3: job_fields
CREATE TABLE job_fields (
    jobfield_id   INT           PRIMARY KEY AUTO_INCREMENT,
    jobfield_name VARCHAR(150)  NOT NULL UNIQUE,
    description   TEXT,
    job_count     INT           DEFAULT 0
);

-- ── TABLE 4: job
CREATE TABLE job (
    job_id          INT           PRIMARY KEY AUTO_INCREMENT,
    job_title       VARCHAR(255)  NOT NULL,
    job_description TEXT,
    department      VARCHAR(255),
    salary_max      FLOAT,
    salary_min      FLOAT,
    jobfield_id     INT,
    FOREIGN KEY (jobfield_id) REFERENCES job_fields(jobfield_id)
        ON DELETE SET NULL
);

-- ── TABLE 5: job_profile
CREATE TABLE job_profile (
    jobprofile_id          INT         PRIMARY KEY AUTO_INCREMENT,
    job_id                 INT         NOT NULL,
    jobfield_id            INT         NOT NULL,
    mbti_type              VARCHAR(10) NOT NULL,
    compatibility_score    FLOAT,
    fuzzy_normalised_score FLOAT,
    weighted_scale_sum     FLOAT,
    FOREIGN KEY (job_id)      REFERENCES job(job_id)       ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (jobfield_id) REFERENCES job_fields(jobfield_id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- ── TABLE 6: USER_JOB_INTERACTION  (weak entity)
CREATE TABLE USER_JOB_INTERACTION (
    user_id               INT          NOT NULL,
    jobfield_id           INT          NOT NULL,
    interaction_type      VARCHAR(50)  NOT NULL,
    satisfied             TINYINT(1)   DEFAULT 0,
    interaction_timestamp TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, jobfield_id, interaction_timestamp),
    FOREIGN KEY (user_id)     REFERENCES users(user_id)      ON DELETE CASCADE,
    FOREIGN KEY (jobfield_id) REFERENCES job_fields(jobfield_id) ON DELETE CASCADE
);

-- ── TABLE 7: recommendations
CREATE TABLE recommendations (
    recommendation_id   INT           PRIMARY KEY AUTO_INCREMENT,
    user_id             INT           NOT NULL,
    job_id              INT           NOT NULL,
    recommendation_type VARCHAR(20)   NOT NULL
        CHECK (recommendation_type IN ('CBF','CF','HYBRID')),
    cbf_score           FLOAT,
    cf_score            FLOAT,
    final_score         FLOAT         NOT NULL,
    rank_position       INT,
    user_feedback       VARCHAR(255),
    created_at          TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (job_id)  REFERENCES job(job_id)    ON DELETE CASCADE
);

-- ── AUDIT LOG (for trigger)
CREATE TABLE interaction_audit_log (
    log_id        INT       PRIMARY KEY AUTO_INCREMENT,
    user_id       INT,
    jobfield_id   INT,
    action_type   VARCHAR(50),
    satisfied     TINYINT(1),
    logged_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
--  SEED DATA
-- ============================================================

INSERT INTO job_fields (jobfield_name, description, job_count) VALUES
('Data Science',         'Careers in data analysis, ML, and AI',              4),
('Software Development', 'Careers in coding and software building',            4),
('Healthcare',           'Careers in medicine, nursing, health management',    3),
('Finance',              'Careers in banking, investment, financial analysis',  3),
('Education',            'Careers in teaching, training, curriculum design',   2),
('Creative Arts',        'Careers in design, media, and creative production',  2),
('Management',           'Careers in project management and strategy',         2);

INSERT INTO job (job_title, job_description, department, salary_max, salary_min, jobfield_id) VALUES
('Machine Learning Engineer',  'Builds ML models and AI systems',            'AI & Data',       1800000, 800000,  1),
('Data Analyst',               'Analyses datasets and produces insights',     'Analytics',       1200000, 500000,  1),
('AI Research Scientist',      'Conducts deep learning research',             'Research',        2500000, 1200000, 1),
('Data Engineer',              'Builds pipelines and manages data lakes',     'Engineering',     1600000, 700000,  1),
('Frontend Developer',         'Develops UI/UX for web applications',         'Engineering',     1200000, 500000,  2),
('Backend Developer',          'Designs APIs and server-side logic',          'Engineering',     1400000, 600000,  2),
('DevOps Engineer',            'Manages CI/CD, cloud infra, deployments',     'Infrastructure',  1500000, 650000,  2),
('Full Stack Developer',       'Builds end-to-end web applications',          'Engineering',     1600000, 700000,  2),
('Clinical Data Analyst',      'Analyses clinical trial and patient data',    'Healthcare IT',   1100000, 450000,  3),
('Health Informatics Analyst', 'Manages health information systems',          'Informatics',     1000000, 400000,  3),
('Medical Coder',              'Codes diagnoses and procedures for billing',  'Administration',   700000, 350000,  3),
('Financial Analyst',          'Evaluates financial data and market trends',  'Finance',         1300000, 550000,  4),
('Investment Banker',          'Manages corporate finance and M&A deals',     'Investment',      2200000, 900000,  4),
('Risk Analyst',               'Identifies and mitigates financial risks',    'Risk Management', 1200000, 500000,  4),
('Instructional Designer',     'Creates e-learning content and curricula',    'EdTech',           900000, 400000,  5),
('Corporate Trainer',          'Delivers skill-development training',         'HR & L&D',         850000, 380000,  5),
('UX Designer',                'Designs intuitive user experiences',          'Design',          1200000, 500000,  6),
('Content Strategist',         'Develops content plans and editorial guides', 'Marketing',        900000, 400000,  6),
('Product Manager',            'Drives product roadmap and stakeholder sync', 'Product',         1800000, 800000,  7),
('Operations Manager',         'Oversees day-to-day business operations',     'Operations',      1400000, 600000,  7);

INSERT INTO job_profile (job_id, jobfield_id, mbti_type, compatibility_score, fuzzy_normalised_score, weighted_scale_sum) VALUES
(1,  1, 'INTJ', 0.92, 0.89, 0.90), (3,  1, 'INTJ', 0.90, 0.88, 0.89),
(1,  1, 'INTP', 0.88, 0.86, 0.87), (2,  1, 'INTP', 0.86, 0.84, 0.85),
(5,  2, 'ENFP', 0.85, 0.83, 0.84), (8,  2, 'ENFP', 0.82, 0.80, 0.81),
(9,  3, 'ISFJ', 0.88, 0.86, 0.87), (11, 3, 'ISFJ', 0.80, 0.78, 0.79),
(12, 4, 'ENTP', 0.87, 0.85, 0.86), (13, 4, 'ENTP', 0.91, 0.89, 0.90),
(17, 6, 'INFP', 0.89, 0.87, 0.88), (18, 6, 'INFP', 0.85, 0.83, 0.84),
(19, 7, 'ESTJ', 0.93, 0.91, 0.92), (20, 7, 'ESTJ', 0.90, 0.88, 0.89),
(17, 6, 'ESFP', 0.83, 0.81, 0.82), (18, 6, 'ESFP', 0.80, 0.78, 0.79),
(15, 5, 'ENFJ', 0.90, 0.88, 0.89), (16, 5, 'ENFJ', 0.87, 0.85, 0.86),
(14, 4, 'ISTJ', 0.89, 0.87, 0.88), (20, 7, 'ISTJ', 0.88, 0.86, 0.87),
(6,  2, 'ENTJ', 0.91, 0.89, 0.90), (19, 7, 'ENTJ', 0.93, 0.91, 0.92),
(1,  1, 'ISTP', 0.84, 0.82, 0.83), (7,  2, 'ISTP', 0.86, 0.84, 0.85),
(15, 5, 'INFJ', 0.88, 0.86, 0.87), (17, 6, 'INFJ', 0.85, 0.83, 0.84),
(5,  2, 'ESTP', 0.82, 0.80, 0.81), (13, 4, 'ESTP', 0.84, 0.82, 0.83),
(16, 5, 'ESFJ', 0.87, 0.85, 0.86), (9,  3, 'ESFJ', 0.90, 0.88, 0.89);

-- ============================================================
--  CHAPTER 3.1 – Aggregate Functions, Constraints, Set Ops
-- ============================================================

-- Total users
SELECT COUNT(*) AS total_users FROM users;

-- Users per education level
SELECT education_level, COUNT(*) AS user_count
FROM users GROUP BY education_level ORDER BY user_count DESC;

-- Avg final score per recommendation type
SELECT recommendation_type, ROUND(AVG(final_score), 4) AS avg_score
FROM recommendations GROUP BY recommendation_type;

-- Salary range per job field
SELECT jf.jobfield_name, MAX(j.salary_max) AS highest_salary, MIN(j.salary_min) AS lowest_salary
FROM job j JOIN job_fields jf ON j.jobfield_id = jf.jobfield_id
GROUP BY jf.jobfield_name ORDER BY highest_salary DESC;

-- Job fields with more than 2 jobs
SELECT jf.jobfield_name, COUNT(j.job_id) AS job_count
FROM job_fields jf JOIN job j ON jf.jobfield_id = j.jobfield_id
GROUP BY jf.jobfield_name HAVING COUNT(j.job_id) > 2;

-- MBTI types with avg compatibility > 0.87
SELECT mbti_type, ROUND(AVG(compatibility_score), 4) AS avg_compat
FROM job_profile GROUP BY mbti_type HAVING AVG(compatibility_score) > 0.87;

-- UNION: users with CBF or HYBRID recommendations
SELECT u.username, r.recommendation_type FROM users u JOIN recommendations r ON u.user_id = r.user_id WHERE r.recommendation_type = 'CBF'
UNION
SELECT u.username, r.recommendation_type FROM users u JOIN recommendations r ON u.user_id = r.user_id WHERE r.recommendation_type = 'HYBRID';

-- INTERSECT (emulated): users with BOTH CBF and HYBRID
SELECT DISTINCT u.username FROM users u JOIN recommendations r ON u.user_id = r.user_id
WHERE r.recommendation_type = 'CBF'
  AND u.user_id IN (SELECT user_id FROM recommendations WHERE recommendation_type = 'HYBRID');

-- EXCEPT (emulated): users with CBF but NOT HYBRID
SELECT DISTINCT u.username FROM users u JOIN recommendations r ON u.user_id = r.user_id
WHERE r.recommendation_type = 'CBF'
  AND u.user_id NOT IN (SELECT user_id FROM recommendations WHERE recommendation_type = 'HYBRID');

-- ============================================================
--  CHAPTER 3.2 – Subqueries, Joins, Views
-- ============================================================

-- INNER JOIN: users with MBTI type
SELECT u.user_id, u.username, u.education_level, m.mbti_type, m.introversion_score, m.extraversion_score
FROM users u INNER JOIN mbti_profiles m ON u.user_id = m.user_id;

-- 3-table JOIN: recommendations with user and job
SELECT u.username, j.job_title, jf.jobfield_name, r.recommendation_type, r.final_score, r.rank_position
FROM recommendations r
INNER JOIN users u       ON r.user_id = u.user_id
INNER JOIN job j         ON r.job_id  = j.job_id
INNER JOIN job_fields jf ON j.jobfield_id = jf.jobfield_id
ORDER BY u.username, r.rank_position;

-- LEFT JOIN: all users even without recommendations
SELECT u.username, r.recommendation_type, r.final_score
FROM users u LEFT JOIN recommendations r ON u.user_id = r.user_id;

-- Subquery: users whose score is above average
SELECT u.username, r.final_score, r.recommendation_type
FROM recommendations r JOIN users u ON r.user_id = u.user_id
WHERE r.final_score > (SELECT AVG(final_score) FROM recommendations)
ORDER BY r.final_score DESC;

-- Correlated subquery: each user's best recommendation
SELECT u.username, r.recommendation_type, r.final_score, j.job_title
FROM recommendations r
JOIN users u ON r.user_id = u.user_id
JOIN job   j ON r.job_id  = j.job_id
WHERE r.final_score = (SELECT MAX(r2.final_score) FROM recommendations r2 WHERE r2.user_id = r.user_id);

-- EXISTS subquery: MBTI types that have job_profile entries
SELECT DISTINCT m.mbti_type, u.username
FROM mbti_profiles m JOIN users u ON m.user_id = u.user_id
WHERE EXISTS (SELECT 1 FROM job_profile jp WHERE jp.mbti_type = m.mbti_type);

-- VIEW 1: full recommendation summary
CREATE OR REPLACE VIEW user_recommendation_summary AS
SELECT u.user_id, u.username, m.mbti_type, j.job_title, jf.jobfield_name,
       r.recommendation_type, r.cbf_score, r.cf_score, r.final_score, r.rank_position, r.user_feedback
FROM recommendations r
JOIN users u         ON r.user_id     = u.user_id
JOIN mbti_profiles m ON u.user_id     = m.user_id
JOIN job j           ON r.job_id      = j.job_id
JOIN job_fields jf   ON j.jobfield_id = jf.jobfield_id;

SELECT * FROM user_recommendation_summary ORDER BY username, rank_position;

-- VIEW 2: MBTI-job compatibility
CREATE OR REPLACE VIEW mbti_job_compatibility_view AS
SELECT jp.mbti_type, j.job_title, jf.jobfield_name,
       jp.compatibility_score, jp.fuzzy_normalised_score, jp.weighted_scale_sum
FROM job_profile jp
JOIN job j        ON jp.job_id      = j.job_id
JOIN job_fields jf ON jp.jobfield_id = jf.jobfield_id
ORDER BY jp.mbti_type, jp.compatibility_score DESC;

SELECT * FROM mbti_job_compatibility_view;

-- VIEW 3: interaction stats per field
CREATE OR REPLACE VIEW field_interaction_stats AS
SELECT jf.jobfield_name, COUNT(*) AS total_interactions,
       SUM(uji.satisfied) AS satisfied_count,
       ROUND(AVG(uji.satisfied) * 100, 1) AS satisfaction_pct
FROM USER_JOB_INTERACTION uji
JOIN job_fields jf ON uji.jobfield_id = jf.jobfield_id
GROUP BY jf.jobfield_name;

SELECT * FROM field_interaction_stats ORDER BY satisfaction_pct DESC;

-- ============================================================
--  CHAPTER 3.3 – Functions, Triggers, Cursors, Exception Handling
-- ============================================================

DELIMITER $$

-- FUNCTION 1: MBTI label
CREATE FUNCTION get_mbti_label(mbti_code VARCHAR(4))
RETURNS VARCHAR(50) DETERMINISTIC
BEGIN
    DECLARE label VARCHAR(50);
    CASE mbti_code
        WHEN 'INTJ' THEN SET label = 'The Architect';
        WHEN 'INTP' THEN SET label = 'The Logician';
        WHEN 'ENTJ' THEN SET label = 'The Commander';
        WHEN 'ENTP' THEN SET label = 'The Debater';
        WHEN 'INFJ' THEN SET label = 'The Advocate';
        WHEN 'INFP' THEN SET label = 'The Mediator';
        WHEN 'ENFJ' THEN SET label = 'The Protagonist';
        WHEN 'ENFP' THEN SET label = 'The Campaigner';
        WHEN 'ISTJ' THEN SET label = 'The Logistician';
        WHEN 'ISFJ' THEN SET label = 'The Defender';
        WHEN 'ESTJ' THEN SET label = 'The Executive';
        WHEN 'ESFJ' THEN SET label = 'The Consul';
        WHEN 'ISTP' THEN SET label = 'The Virtuoso';
        WHEN 'ISFP' THEN SET label = 'The Adventurer';
        WHEN 'ESTP' THEN SET label = 'The Entrepreneur';
        WHEN 'ESFP' THEN SET label = 'The Entertainer';
        ELSE SET label = 'Unknown Type';
    END CASE;
    RETURN label;
END$$

-- FUNCTION 2: score category
CREATE FUNCTION score_category(score FLOAT)
RETURNS VARCHAR(10) DETERMINISTIC
BEGIN
    IF score >= 0.85 THEN RETURN 'High';
    ELSEIF score >= 0.75 THEN RETURN 'Medium';
    ELSE RETURN 'Low';
    END IF;
END$$

-- TRIGGER 1: update job_count after recommendation insert
CREATE TRIGGER trg_after_recommendation_insert
AFTER INSERT ON recommendations FOR EACH ROW
BEGIN
    UPDATE job_fields jf
    SET jf.job_count = (
        SELECT COUNT(DISTINCT r.job_id) FROM recommendations r
        JOIN job j ON r.job_id = j.job_id WHERE j.jobfield_id = jf.jobfield_id
    )
    WHERE jf.jobfield_id = (SELECT jobfield_id FROM job WHERE job_id = NEW.job_id);
END$$

-- TRIGGER 2: validate score before update
CREATE TRIGGER trg_before_recommendation_update
BEFORE UPDATE ON recommendations FOR EACH ROW
BEGIN
    IF NEW.final_score < 0 OR NEW.final_score > 1 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error: final_score must be between 0 and 1.';
    END IF;
END$$

-- TRIGGER 3: audit log on interaction insert
CREATE TRIGGER trg_after_interaction_insert
AFTER INSERT ON USER_JOB_INTERACTION FOR EACH ROW
BEGIN
    INSERT INTO interaction_audit_log (user_id, jobfield_id, action_type, satisfied)
    VALUES (NEW.user_id, NEW.jobfield_id, NEW.interaction_type, NEW.satisfied);
END$$

-- STORED PROCEDURE: user report with cursor + exception handling
CREATE PROCEDURE generate_user_report(IN input_user_id INT)
BEGIN
    DECLARE v_done      INT DEFAULT 0;
    DECLARE v_job_title VARCHAR(255);
    DECLARE v_score     FLOAT;
    DECLARE v_type      VARCHAR(20);
    DECLARE v_exists    INT DEFAULT 0;

    DECLARE rec_cursor CURSOR FOR
        SELECT j.job_title, r.final_score, r.recommendation_type
        FROM recommendations r JOIN job j ON r.job_id = j.job_id
        WHERE r.user_id = input_user_id ORDER BY r.rank_position;

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = 1;

    SELECT COUNT(*) INTO v_exists FROM users WHERE user_id = input_user_id;
    IF v_exists = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error: user_id does not exist.';
    END IF;

    OPEN rec_cursor;
    read_loop: LOOP
        FETCH rec_cursor INTO v_job_title, v_score, v_type;
        IF v_done = 1 THEN LEAVE read_loop; END IF;
        SELECT input_user_id AS user_id, v_job_title AS job_title,
               v_type AS rec_type, ROUND(v_score, 4) AS final_score,
               score_category(v_score) AS band;
    END LOOP;
    CLOSE rec_cursor;
END$$

DELIMITER ;

-- Use the functions
SELECT m.mbti_type, get_mbti_label(m.mbti_type) AS label, u.username
FROM mbti_profiles m JOIN users u ON m.user_id = u.user_id;

SELECT u.username, j.job_title, r.final_score, score_category(r.final_score) AS band
FROM recommendations r JOIN users u ON r.user_id = u.user_id JOIN job j ON r.job_id = j.job_id;
