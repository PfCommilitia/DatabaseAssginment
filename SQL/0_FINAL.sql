CREATE EXTENSION pgcrypto;

CREATE SCHEMA "Society";

SET SCHEMA 'Society';

SET SEARCH_PATH TO 'Society', 'public';

-- 用户表
CREATE TABLE Individual
(
  Username      CHAR(10) PRIMARY KEY,           -- 10位学工号
  Name          TEXT    NOT NULL,               -- 姓名
  IsActive      BOOLEAN NOT NULL DEFAULT TRUE,  -- 是否激活
  IsInitialized BOOLEAN NOT NULL DEFAULT TRUE, -- 是否已初始化
  PasswordHash  TEXT    NOT NULL                -- 密码哈希
  -- Organisation INT REFERENCES Organisation (Uuid) NOT NULL DEFAULT 0
);

-- 组织表
CREATE TABLE Organisation
(
  Uuid           SERIAL PRIMARY KEY,                                             -- ID
  Name           TEXT    NOT NULL,                                               -- 名称
  IsActive       BOOLEAN NOT NULL                          DEFAULT TRUE,         -- 是否激活
  Representative CHAR(10) REFERENCES Individual (Username) DEFAULT '0000000000', -- 负责人，未激活的组织可以没有负责人
  Parent         INT REFERENCES Organisation (Uuid)                              -- 上级组织
);

-- 初始化管理员用户
INSERT INTO Individual(Username, Name, IsInitialized, PasswordHash)
VALUES ('0000000000', '管理员', TRUE, CRYPT('admin', GEN_SALT('bf')));

-- 初始化默认组织
INSERT INTO Organisation(Name, Representative, Parent)
VALUES ('待分配组织', '0000000000', NULL);

-- 为用户添加组织字段，默认为待分配组织
ALTER TABLE Individual
  ADD COLUMN Organisation INT REFERENCES Organisation (Uuid) NOT NULL DEFAULT 1;

-- 待分配组织应该是所有其他组织的终极上级组织
ALTER TABLE Organisation
  ALTER COLUMN Parent SET DEFAULT 1;

-- 社团表
CREATE TABLE Society
(
  Uuid           SERIAL PRIMARY KEY,                                       -- UUIDv7
  Name           TEXT                               NOT NULL,              -- 名称
  Organisation   INT REFERENCES Organisation (Uuid) NOT NULL,              -- 所属组织
  IsActive       BOOLEAN                            NOT NULL DEFAULT TRUE, -- 是否激活
  Representative CHAR(10) REFERENCES Individual (Username),                -- 负责人，未激活的社团可以没有负责人
  ImageURL       TEXT,                                                     -- 社团图片URL
  Description    TEXT                                                      -- 社团描述
);

-- 社团成员表
CREATE TABLE Membership
(
  Individual CHAR(10) REFERENCES Individual (Username) NOT NULL,              -- 成员
  Society    INT REFERENCES Society (Uuid)             NOT NULL,              -- 社团
  IsActive   BOOLEAN                                   NOT NULL DEFAULT TRUE, -- 状态
  PRIMARY KEY (Society, Individual)
);

CREATE TABLE Venue
(
  Uuid         SERIAL PRIMARY KEY,                                       -- UUIDv7
  Name         TEXT                               NOT NULL,              -- 场所名称
  Address      TEXT                               NOT NULL,              -- 场所地址
  Description  TEXT,                                                     -- 场所描述
  isAvailable  BOOLEAN                            NOT NULL DEFAULT TRUE, -- 场所是否可用
  Organisation INT REFERENCES Organisation (Uuid) NOT NULL,              -- 场所所属组织
  Capacity     INTEGER                            NOT NULL DEFAULT -1,   -- 场所容量
  ImageURL     TEXT                                                      -- 场所图片URL
);

-- 活动申请表
CREATE TABLE EventApplication
(
  Uuid        SERIAL PRIMARY KEY,                                              -- UUIDv7
  Applicant   CHAR(10) REFERENCES Individual (Username) NOT NULL,              -- 申请人
  Society     INT REFERENCES Society (Uuid)             NOT NULL,              -- 社团
  Venue       INT REFERENCES Venue (Uuid)               NOT NULL,              -- 场所
  TimeRange   TSTZRANGE                                 NOT NULL,              -- 时间范围
  isActive    BOOLEAN                                   NOT NULL DEFAULT TRUE, -- 是否激活
  Title       TEXT                                      NOT NULL,              -- 活动标题
  Description TEXT                                      NOT NULL,              -- 活动描述
  Capacity    INTEGER                                   NOT NULL DEFAULT -1    -- 容量
);

-- 活动申请审批表
CREATE TABLE EventApplicationApproval
(
  Application INT REFERENCES EventApplication (Uuid)    NOT NULL,                          -- 活动申请
  Approver    CHAR(10) REFERENCES Individual (Username) NOT NULL,                          -- 审批者
  Result      BOOLEAN                                   NOT NULL DEFAULT FALSE,            -- 审批结果
  Comment     TEXT,                                                                        -- 审批意见
  Timestamp   TIMESTAMP                                 NOT NULL DEFAULT CURRENT_TIMESTAMP -- 审批时间
);

-- 活动参与表
CREATE TABLE EventParticipationApplication
(
  Uuid          SERIAL PRIMARY KEY,                                                          -- UUIDv7
  Applicant     CHAR(10) REFERENCES Individual (Username) NOT NULL,                          -- 申请人
  ApplyingEvent INT REFERENCES EventApplication (Uuid)    NOT NULL,                          -- 活动申请
  isActive      BOOLEAN                                   NOT NULL DEFAULT TRUE,             -- 是否激活
  Timestamp     TIMESTAMP                                 NOT NULL DEFAULT CURRENT_TIMESTAMP -- 申请时间
);

-- 活动参与审批表
CREATE TABLE EventParticipationApproval
(
  Application INT REFERENCES EventParticipationApplication (Uuid) NOT NULL,                          -- 活动参与申请
  Approver    CHAR(10) REFERENCES Individual (Username)           NOT NULL,                          -- 审批者
  Result      BOOLEAN                                             NOT NULL DEFAULT FALSE,            -- 审批结果
  Comment     TEXT,                                                                                  -- 审批意见
  Timestamp   TIMESTAMP                                           NOT NULL DEFAULT CURRENT_TIMESTAMP -- 审批时间
);
