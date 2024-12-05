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
  IsInitialized BOOLEAN NOT NULL DEFAULT FALSE, -- 是否已初始化
  PasswordHash  TEXT    NOT NULL,               -- 密码哈希
  PortraitURL   TEXT                            -- 头像URL
  -- Organisation INT REFERENCES Organisation (Uuid) NOT NULL DEFAULT 0
);

-- 组织表
CREATE TABLE Organisation
(
  Uuid           UUID PRIMARY KEY,                                               -- UUIDv7
  Name           TEXT    NOT NULL,                                               -- 名称
  IsActive       BOOLEAN NOT NULL                          DEFAULT TRUE,         -- 是否激活
  Representative CHAR(10) REFERENCES Individual (Username) DEFAULT '0000000000', -- 负责人，未激活的组织可以没有负责人
  Parent         UUID REFERENCES Organisation (Uuid)                             -- 上级组织
);

-- 初始化管理员用户
INSERT INTO Individual(Username, Name, IsInitialized, PasswordHash)
VALUES ('0000000000', '管理员', TRUE, CRYPT('admin', GEN_SALT('bf')));

-- 初始化默认组织
INSERT INTO Organisation(Uuid, Name, Representative, Parent)
VALUES ('01936653-b2ef-7535-9242-384f150caccc', '待分配组织', '0000000000',
        NULL);

-- 为用户添加组织字段，默认为待分配组织
ALTER TABLE Individual
  ADD COLUMN Organisation UUID REFERENCES Organisation (Uuid) NOT NULL DEFAULT '01936653-b2ef-7535-9242-384f150caccc';

-- 待分配组织应该是所有其他组织的终极上级组织
ALTER TABLE Organisation
  ALTER COLUMN Parent SET DEFAULT '01936653-b2ef-7535-9242-384f150caccc';

-- 社团表
CREATE TABLE Society
(
  Uuid           UUID PRIMARY KEY,                                          -- UUIDv7
  Name           TEXT                                NOT NULL,              -- 名称
  Organisation   UUID REFERENCES Organisation (Uuid) NOT NULL,              -- 所属组织
  IsActive       BOOLEAN                             NOT NULL DEFAULT TRUE, -- 是否激活
  Representative CHAR(10) REFERENCES Individual (Username),                 -- 负责人，未激活的社团可以没有负责人
  ImageURL       TEXT,                                                      -- 社团图片URL
  Description    TEXT                                                       -- 社团描述
);

-- 社团成员表
CREATE TABLE Membership
(
  Individual CHAR(10) REFERENCES Individual (Username) NOT NULL,              -- 成员
  Society    UUID REFERENCES Society (Uuid)            NOT NULL,              -- 社团
  IsActive   BOOLEAN                                   NOT NULL DEFAULT TRUE, -- 状态
  PRIMARY KEY (Society, Individual)
);

-- 社团申请表
CREATE TABLE SocietyApplication
(
  Uuid        UUID PRIMARY KEY,                                                            -- UUIDv7
  Applicant   CHAR(10) REFERENCES Individual (Username) NOT NULL,                          -- 申请人
  Society     UUID REFERENCES Society (Uuid)            NOT NULL,                          -- 社团
  Description TEXT                                      NOT NULL,                          -- 社团描述
  isActive    BOOLEAN                                   NOT NULL DEFAULT TRUE,             -- 是否激活
  Timestamp   TIMESTAMP                                 NOT NULL DEFAULT CURRENT_TIMESTAMP -- 申请时间
);

-- 社团申请审批表
CREATE TABLE SocietyApplicationApproval
(
  Application UUID REFERENCES SocietyApplication (Uuid) NOT NULL,                          -- 社团申请
  Approver    CHAR(10) REFERENCES Individual (Username) NOT NULL,                          -- 审批者
  Result      BOOLEAN                                   NOT NULL DEFAULT FALSE,            -- 审批结果
  Comment     TEXT,                                                                        -- 审批意见
  Timestamp   TIMESTAMP                                 NOT NULL DEFAULT CURRENT_TIMESTAMP -- 审批时间
);

CREATE TABLE Venue
(
  Uuid         UUID PRIMARY KEY,                                          -- UUIDv7
  Name         TEXT                                NOT NULL,              -- 场所名称
  Address      TEXT                                NOT NULL,              -- 场所地址
  Description  TEXT,                                                      -- 场所描述
  isAvailable  BOOLEAN                             NOT NULL DEFAULT TRUE, -- 场所是否可用
  Organisation UUID REFERENCES Organisation (Uuid) NOT NULL,              -- 场所所属组织
  Capacity     INTEGER                             NOT NULL DEFAULT -1,   -- 场所容量
  ImageURL     TEXT                                                       -- 场所图片URL
);

-- 活动申请表
CREATE TABLE EventApplication
(
  Uuid        UUID PRIMARY KEY,                                                -- UUIDv7
  Applicant   CHAR(10) REFERENCES Individual (Username) NOT NULL,              -- 申请人
  Society     UUID REFERENCES Society (Uuid)            NOT NULL,              -- 社团
  Venue       UUID REFERENCES Venue (Uuid)              NOT NULL,              -- 场所
  TimeRange   TSTZRANGE                                 NOT NULL,              -- 时间范围
  isActive    BOOLEAN                                   NOT NULL DEFAULT TRUE, -- 是否激活
  Title       TEXT                                      NOT NULL,              -- 活动标题
  Description TEXT                                      NOT NULL,              -- 活动描述
  Capacity    INTEGER                                   NOT NULL DEFAULT -1    -- 容量
);

-- 活动申请审批表
CREATE TABLE EventApplicationApproval
(
  Application UUID REFERENCES EventApplication (Uuid)   NOT NULL,                          -- 活动申请
  Approver    CHAR(10) REFERENCES Individual (Username) NOT NULL,                          -- 审批者
  Result      BOOLEAN                                   NOT NULL DEFAULT FALSE,            -- 审批结果
  Comment     TEXT,                                                                        -- 审批意见
  Timestamp   TIMESTAMP                                 NOT NULL DEFAULT CURRENT_TIMESTAMP -- 审批时间
);

-- 活动参与表
CREATE TABLE EventParticipationApplication
(
  Uuid          UUID PRIMARY KEY,                                                            -- UUIDv7
  Applicant     CHAR(10) REFERENCES Individual (Username) NOT NULL,                          -- 申请人
  ApplyingEvent UUID REFERENCES EventApplication (Uuid)   NOT NULL,                          -- 活动申请
  isActive      BOOLEAN                                   NOT NULL DEFAULT TRUE,             -- 是否激活
  Timestamp     TIMESTAMP                                 NOT NULL DEFAULT CURRENT_TIMESTAMP -- 申请时间
);

-- 活动参与审批表
CREATE TABLE EventParticipationApproval
(
  Application UUID REFERENCES EventParticipationApplication (Uuid) NOT NULL,                          -- 活动参与申请
  Approver    CHAR(10) REFERENCES Individual (Username)            NOT NULL,                          -- 审批者
  Result      BOOLEAN                                              NOT NULL DEFAULT FALSE,            -- 审批结果
  Comment     TEXT,                                                                                   -- 审批意见
  Timestamp   TIMESTAMP                                            NOT NULL DEFAULT CURRENT_TIMESTAMP -- 审批时间
);


CREATE OR REPLACE FUNCTION On_Individual_Change()
  RETURNS TRIGGER AS
$$
BEGIN
  -- 不允许移动到未启用的组织
  IF NOT EXISTS (SELECT 1
                 FROM Organisation
                 WHERE Uuid = NEW.Organisation
                   AND IsActive) THEN
    RAISE EXCEPTION 'TRIGGER EXCEPTION 6: Inactive Organisation';
  END IF;

  IF TG_OP = 'UPDATE' THEN
    -- 不允许修改用户名
    IF OLD.Username != NEW.Username THEN
      RAISE EXCEPTION 'TRIGGER EXCEPTION 7: Field Not Editable';
    END IF;

    IF OLD.IsActive AND NOT NEW.IsActive THEN
      -- 检查社团和组织负责人的有效性
      IF EXISTS (SELECT 1
                 FROM Society
                 WHERE Representative = NEW.Username) OR EXISTS (SELECT 1
                                                                 FROM Organisation
                                                                 WHERE Representative = NEW.Username) THEN
        RAISE EXCEPTION 'TRIGGER EXCEPTION 7: Deactivating Representative';
      END IF;
    END IF;

    IF OLD.Organisation != NEW.Organisation THEN
      -- 检查用户是否在管理的组织或其上级组织中
      DECLARE
        hierarchy UUID[];
      BEGIN
        SELECT ARRAY_AGG(Uuid)
        INTO hierarchy
        FROM (WITH RECURSIVE OrganisationHierarchy AS (SELECT Uuid
                                                       FROM Organisation
                                                       WHERE Uuid = NEW.Organisation
                                                       UNION ALL
                                                       SELECT o.Uuid
                                                       FROM Organisation o
                                                              JOIN OrganisationHierarchy h
                                                                   ON h.Uuid = o.Parent)
              SELECT Uuid
              FROM OrganisationHierarchy) AS OrganisationHierarchy;

        IF EXISTS (SELECT 1
                   FROM Organisation
                   WHERE NOT (Uuid = ANY (hierarchy))
                     AND Representative = NEW.Username) THEN
          RAISE EXCEPTION 'TRIGGER EXCEPTION 10: Representative not in hierarchy';
        END IF;

        -- 检查用户是否在管理的社团上级组织中
        IF EXISTS (SELECT 1
                   FROM Society
                   WHERE NOT (Organisation = ANY (hierarchy))
                     AND Representative = NEW.Username) THEN
          RAISE EXCEPTION 'TRIGGER EXCEPTION 10: Representative not in hierarchy';
        END IF;
      END;
    END IF;

    IF OLD.IsActive AND NOT NEW.IsActive THEN
      -- 将用户从社团中移除
      UPDATE Membership SET IsActive = FALSE WHERE Individual = NEW.Username;

      -- 撤销用户的待处理入社申请
      UPDATE SocietyApplication
      SET IsActive = FALSE
      WHERE Applicant = NEW.Username
        AND IsActive
        AND NOT EXISTS (SELECT 1
                        FROM SocietyApplicationApproval
                        WHERE Application = Uuid);

      -- 撤销用户的待处理活动申请
      UPDATE EventApplication
      SET IsActive = FALSE
      WHERE Applicant = NEW.Username
        AND IsActive
        AND NOT EXISTS (SELECT 1
                        FROM EventApplicationApproval
                        WHERE Application = Uuid);

      -- 撤销用户的待处理活动参与申请
      UPDATE EventParticipationApplication
      SET IsActive = FALSE
      WHERE Applicant = NEW.Username
        AND IsActive
        AND NOT EXISTS (SELECT 1
                        FROM EventParticipationApproval
                        WHERE Application = Uuid);
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER Before_Individual_Change
  BEFORE INSERT OR UPDATE
  ON Individual
  FOR EACH ROW
EXECUTE FUNCTION On_Individual_Change();

CREATE OR REPLACE FUNCTION On_Organisation_Change()
  RETURNS TRIGGER AS
$$
BEGIN
  -- 检查负责人是否存在
  IF NEW.Representative IS NULL AND NEW.IsActive THEN
    RAISE EXCEPTION 'TRIGGER EXCEPTION 8: No Active Representative';
  END IF;

  -- 检查负责人是否启用
  IF NEW.IsActive AND NOT EXISTS (SELECT 1
                                  FROM Individual
                                  WHERE Username = NEW.Representative
                                    AND IsActive) THEN
    RAISE EXCEPTION 'TRIGGER EXCEPTION 8: No Active Representative';
  END IF;

  IF NOT NEW.IsActive THEN
    -- 无效组织不应该有负责人
    NEW.Representative := NULL;
  ELSE
    IF NEW.IsActive THEN
      -- 递归检查负责人是否在组织或其上级组织中
      IF NOT EXISTS (WITH RECURSIVE OrganisationHierarchy
                                      AS (SELECT NEW.Uuid, NEW.Parent
                                          UNION ALL
                                          SELECT o.Uuid, o.Parent
                                          FROM Organisation o
                                                 JOIN OrganisationHierarchy h
                                                      ON o.Uuid = h.Parent)
                     SELECT 1
                     FROM OrganisationHierarchy
                     WHERE Uuid = (SELECT Organisation
                                   FROM Individual
                                   WHERE Username = NEW.Representative)) THEN
        RAISE EXCEPTION 'TRIGGER EXCEPTION 10: Representative Not in Organisation Hierarchy';
      END IF;
    END IF;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    -- 不允许修改ID
    IF OLD.Uuid != NEW.Uuid THEN
      RAISE EXCEPTION 'TRIGGER EXCEPTION 9: Field Not Editable';
    END IF;

    IF OLD.IsActive AND NOT NEW.IsActive THEN
      -- 检查组织是否有成员、场所、社团或启用的子组织，不能修改为未启用
      IF EXISTS (SELECT 1
                 FROM Individual
                 WHERE Organisation = NEW.Uuid) OR EXISTS (SELECT 1
                                                           FROM Society
                                                           WHERE Organisation = NEW.Uuid) OR
         EXISTS (SELECT 1
                 FROM Venue
                 WHERE Organisation = NEW.Uuid) OR EXISTS (SELECT 1
                                                           FROM Organisation
                                                           WHERE Parent = NEW.Uuid
                                                             AND IsActive) THEN
        RAISE EXCEPTION 'TRIGGER EXCEPTION 9: Deactivating with active members';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER Before_Organisation_Change
  BEFORE UPDATE OR INSERT
  ON Organisation
  FOR EACH ROW
EXECUTE FUNCTION On_Organisation_Change();

CREATE OR REPLACE FUNCTION On_Society_Change()
  RETURNS TRIGGER AS
$$
BEGIN
  -- 检查负责人是否存在
  IF New.Representative IS NULL AND NEW.IsActive THEN
    RAISE EXCEPTION 'TRIGGER EXCEPTION 8: No Active Representative';
  END IF;

  -- 检查负责人是否启用
  IF NEW.IsActive AND NOT EXISTS (SELECT 1
                                  FROM Individual
                                  WHERE Username = NEW.Representative
                                    AND IsActive) THEN
    RAISE EXCEPTION 'TRIGGER EXCEPTION 8: No Active Representative';
  END IF;

  IF NOT NEW.IsActive THEN
    -- 无效社团不应该有负责人
    NEW.Representative := NULL;
  ELSE
    IF NEW.IsActive THEN
      -- 递归检查负责人是否在组织或其上级组织中
      IF NOT EXISTS (WITH RECURSIVE OrganisationHierarchy
                                      AS (SELECT Uuid, Parent
                                          FROM Organisation
                                          WHERE Uuid = NEW.Organisation
                                          UNION ALL
                                          SELECT o.Uuid, o.Parent
                                          FROM Organisation o
                                                 JOIN OrganisationHierarchy h
                                                      ON o.Uuid = h.Parent)
                     SELECT 1
                     FROM OrganisationHierarchy
                     WHERE Uuid = (SELECT Organisation
                                   FROM Individual
                                   WHERE Username = NEW.Representative)) THEN
        RAISE EXCEPTION 'TRIGGER EXCEPTION 10: Representative Not in Organisation Hierarchy';
      END IF;
    END IF;
  END IF;

  -- 检查社团所属组织是否启用
  IF NEW.IsActive AND NOT EXISTS (SELECT 1
                                  FROM Organisation
                                  WHERE Uuid = NEW.Organisation
                                    AND IsActive) THEN
    RAISE EXCEPTION 'TRIGGER EXCEPTION 6: Inactive Organisation';
  END IF;

  IF TG_OP = 'UPDATE' THEN
    -- 不允许修改ID
    IF OLD.Uuid != NEW.Uuid THEN
      RAISE EXCEPTION 'TRIGGER EXCEPTION 9: Field Not Editable';
    END IF;

    IF OLD.IsActive AND NOT NEW.IsActive THEN
      -- 将用户从社团中移除
      UPDATE Membership
      SET IsActive = FALSE
      WHERE Society = NEW.Uuid;

      -- 撤销社团的待处理活动申请
      UPDATE EventApplication
      SET IsActive = FALSE
      WHERE Society = NEW.Uuid
        AND IsActive
        AND NOT EXISTS (SELECT 1
                        FROM EventApplicationApproval
                        WHERE Application = Uuid);

      -- 审批入社申请为拒绝
      INSERT INTO SocietyApplicationApproval(Application, Approver, Result, Comment)
      SELECT Uuid, OLD.Representative, FALSE, '社团停止活动'
      FROM SocietyApplication
      WHERE Society = NEW.Uuid
        AND IsActive
        AND NOT EXISTS (SELECT 1
                        FROM SocietyApplicationApproval
                        WHERE Application = Uuid);

      -- 审批活动参与申请为拒绝
      INSERT INTO EventParticipationApproval(Application, Approver, Result, Comment)
      SELECT epa.Uuid, OLD.Representative, FALSE, '社团停止活动'
      FROM EventParticipationApplication epa
             JOIN EventApplication ea ON ApplyingEvent = ea.Uuid
      WHERE Society = NEW.Uuid
        AND epa.IsActive
        AND NOT EXISTS (SELECT 1
                        FROM EventParticipationApproval
                        WHERE Application = epa.Uuid);
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER Before_Society_Change
  BEFORE INSERT OR UPDATE
  ON Society
  FOR EACH ROW
EXECUTE FUNCTION On_Society_Change();


CREATE OR REPLACE FUNCTION On_Membership_Change()
  RETURNS TRIGGER AS
$$
BEGIN
  IF NEW.IsActive THEN
    -- 检查用户是否启用
    IF NOT EXISTS (SELECT 1
                   FROM Individual
                   WHERE Username = NEW.Individual
                     AND IsActive) THEN
      RAISE EXCEPTION 'TRIGGER EXCEPTION 11: Inactive User';
    END IF;

    -- 检查社团是否启用
    IF NOT EXISTS (SELECT 1
                   FROM Society
                   WHERE Uuid = NEW.Society
                     AND IsActive) THEN
      RAISE EXCEPTION 'TRIGGER EXCEPTION 12: Inactive Society';
    END IF;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    -- 只能修改状态
    IF OLD.Individual != NEW.Individual OR OLD.Society != NEW.Society THEN
      RAISE EXCEPTION 'TRIGGER EXCEPTION 9: Field Not Editable';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER Before_Membership_Change
  BEFORE INSERT OR UPDATE
  ON Membership
  FOR EACH ROW
EXECUTE FUNCTION On_Membership_Change();


CREATE OR REPLACE FUNCTION On_Venue_Change()
  RETURNS TRIGGER AS
$$
BEGIN
  -- 检查场所所属组织是否启用
  IF NOT EXISTS (SELECT 1
                 FROM Organisation
                 WHERE Uuid = NEW.Organisation
                   AND IsActive) THEN
    RAISE EXCEPTION 'TRIGGER EXCEPTION 6: Inactive Organisation';
  END IF;

  IF TG_OP = 'UPDATE' THEN
    -- 不允许修改ID
    IF OLD.Uuid != NEW.Uuid THEN
      RAISE EXCEPTION 'TRIGGER EXCEPTION 9: Field Not Editable';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER Before_Venue_Change
  BEFORE UPDATE OR INSERT
  ON Venue
  FOR EACH ROW
EXECUTE FUNCTION On_Venue_Change();

CREATE OR REPLACE FUNCTION On_Society_Application_Change()
  RETURNS TRIGGER AS
$$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- 检查用户是否已经是社团成员
    IF EXISTS (SELECT 1
               FROM Membership
               WHERE Individual = NEW.Applicant
                 AND Society = NEW.Society
                 AND IsActive) THEN
      RAISE EXCEPTION 'TRIGGER EXCEPTION 13: Already A Member';
    END IF;

    -- 检查用户是否启用
    IF NOT EXISTS (SELECT 1
                   FROM Individual
                   WHERE Username = NEW.Applicant
                     AND IsActive) THEN
      RAISE EXCEPTION 'TRIGGER EXCEPTION 11: Inactive User';
    END IF;

    -- 检查社团是否启用
    IF NOT EXISTS (SELECT 1
                   FROM Society
                   WHERE Uuid = NEW.Society
                     AND IsActive) THEN
      RAISE EXCEPTION 'TRIGGER EXCEPTION 12: Inactive Society';
    END IF;

    -- 检查是否有重复申请
    IF EXISTS (SELECT 1
               FROM SocietyApplication
               WHERE Applicant = NEW.Applicant
                 AND Society = NEW.Society
                 AND IsActive
                 AND NOT EXISTS (SELECT 1
                                 FROM SocietyApplicationApproval
                                 WHERE Application = Uuid)) THEN
      RAISE EXCEPTION 'TRIGGER EXCEPTION 14: Duplicate Application';
    END IF;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    -- 只能修改状态
    IF OLD.Uuid != NEW.Uuid OR OLD.Applicant != NEW.Applicant OR
       OLD.Society != NEW.Society OR
       OLD.Description != NEW.Description OR OLD.Timestamp != NEW.Timestamp THEN
      RAISE EXCEPTION 'TRIGGER EXCEPTION 9: Field Not Editable';
    END IF;

    -- 检查是否已经取消
    IF NOT OLD.IsActive THEN
      RAISE EXCEPTION 'TRIGGER EXCEPTION 15: Already Cancelled';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER Before_Society_Application_Change
  BEFORE INSERT OR UPDATE
  ON SocietyApplication
  FOR EACH ROW
EXECUTE FUNCTION On_Society_Application_Change();

CREATE OR REPLACE FUNCTION On_Society_Application_Approval_Change()
  RETURNS TRIGGER AS
$$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- 检查申请是否存在
    IF NOT EXISTS (SELECT 1
                   FROM SocietyApplication
                   WHERE Uuid = NEW.Application
                     AND IsActive) THEN
      RAISE EXCEPTION 'TRIGGER EXCEPTION 15: Already Cancelled';
    END IF;

    -- 检查申请是否已经被处理
    IF EXISTS (SELECT 1
               FROM SocietyApplicationApproval
               WHERE Application = NEW.Application) THEN
      RAISE EXCEPTION 'TRIGGER EXCEPTION 16: Already Processed';
    END IF;

    -- 检查审批者是否启用
    IF NOT EXISTS (SELECT 1
                   FROM Individual
                   WHERE Username = NEW.Approver
                     AND IsActive) THEN
      RAISE EXCEPTION 'TRIGGER EXCEPTION 11: Inactive User';
    END IF;

    -- 递归检查审批者是否是社团、组织或其上级组织的负责人
    IF NOT EXISTS (SELECT 1
                   FROM Society
                   WHERE Uuid = (SELECT Society
                                 FROM SocietyApplication
                                 WHERE Uuid = NEW.Application)
                     AND Representative = NEW.Approver) AND
       NOT EXISTS (WITH RECURSIVE OrganisationHierarchy
                                    AS (SELECT Uuid, Parent, Representative
                                        FROM Organisation
                                        WHERE Uuid = (SELECT Organisation
                                                      FROM Society
                                                      WHERE Uuid =
                                                            (SELECT Society
                                                             FROM SocietyApplication
                                                             WHERE Uuid = NEW.Application))
                                        UNION ALL
                                        SELECT o.Uuid, o.Parent, o.Representative
                                        FROM Organisation o
                                               JOIN OrganisationHierarchy h ON o.Uuid = h.Parent)
                   SELECT 1
                   FROM OrganisationHierarchy
                   WHERE Representative = NEW.Approver) THEN
      RAISE EXCEPTION 'TRIGGER EXCEPTION 17: User Not Permitted';
    END IF;

    IF NEW.Result THEN
      -- 添加成员记录或修改记录状态
      IF EXISTS (SELECT 1
                 FROM Membership
                 WHERE Individual = (SELECT Applicant
                                     FROM SocietyApplication
                                     WHERE Uuid = NEW.Application)
                   AND Society = (SELECT Society
                                  FROM SocietyApplication
                                  WHERE Uuid = NEW.Application)) THEN
        UPDATE Membership
        SET IsActive = TRUE
        WHERE Individual = (SELECT Applicant
                            FROM SocietyApplication
                            WHERE Uuid = NEW.Application)
          AND Society = (SELECT Society
                         FROM SocietyApplication
                         WHERE Uuid = NEW.Application);
      ELSE
        INSERT INTO Membership (Individual, Society, IsActive)
        VALUES ((SELECT Applicant
                 FROM SocietyApplication
                 WHERE Uuid = NEW.Application), (SELECT Society
                                                 FROM SocietyApplication
                                                 WHERE Uuid = NEW.Application),
                TRUE);
      END IF;
    END IF;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    RAISE EXCEPTION 'TRIGGER EXCEPTION 9: Field Not Editable';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER Before_Society_Application_Approval_Change
  BEFORE INSERT OR UPDATE
  ON SocietyApplicationApproval
  FOR EACH ROW
EXECUTE FUNCTION On_Society_Application_Approval_Change();

CREATE OR REPLACE FUNCTION On_Event_Application_Change()
  RETURNS TRIGGER AS
$$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- 检查用户是否已经启用
    IF NOT EXISTS (SELECT 1
                   FROM Individual
                   WHERE Username = NEW.Applicant
                     AND IsActive) THEN
      RAISE EXCEPTION 'TRIGGER EXCEPTION 11: Inactive User';
    END IF;

    -- 检查场所是否启用
    IF NOT EXISTS (SELECT 1
                   FROM Venue
                   WHERE Uuid = NEW.Venue
                     AND isAvailable) THEN
      RAISE EXCEPTION 'TRIGGER EXCEPTION 18: Unavailable Venue';
    END IF;

    -- 检查社团是否启用
    IF NOT EXISTS (SELECT 1
                   FROM Society
                   WHERE Uuid = NEW.Society
                     AND IsActive) THEN
      RAISE EXCEPTION 'TRIGGER EXCEPTION 12: Inactive Society';
    END IF;

    -- 检查场所是否有已经通过的活动
    IF EXISTS (SELECT 1
               FROM EventApplication
               WHERE Venue = NEW.Venue
                 AND TimeRange && NEW.TimeRange
                 AND EXISTS (SELECT 1
                             FROM EventApplicationApproval
                             WHERE Application = Uuid
                               AND Result)) THEN
      RAISE EXCEPTION 'TRIGGER EXCEPTION 19: Venue Occupied';
    END IF;

    -- 容量默认为场所容量
    IF NEW.Capacity IS NULL THEN
      NEW.Capacity := (SELECT Capacity
                       FROM Venue
                       WHERE Uuid = NEW.Venue);
    END IF;

    -- 检查社团是否有重叠申请
    IF EXISTS (SELECT 1
               FROM EventApplication
               WHERE Society = NEW.Society
                 AND TimeRange && NEW.TimeRange
                 AND Venue = NEW.Venue
                 AND IsActive
                 AND NOT EXISTS (SELECT 1
                                 FROM EventApplicationApproval
                                 WHERE Application = Uuid
                                   AND NOT Result)) THEN
      RAISE EXCEPTION 'TRIGGER EXCEPTION 20: Conflicting Application';
    END IF;

    -- 递归检查申请者是否是社团、组织或其上级组织的负责人
    IF NOT EXISTS (SELECT 1
                   FROM Society
                   WHERE Uuid = NEW.Society
                     AND Representative = NEW.Applicant) AND
       NOT EXISTS (WITH RECURSIVE OrganisationHierarchy
                                    AS (SELECT Uuid, Parent, Representative
                                        FROM Organisation
                                        WHERE Uuid = (SELECT Organisation
                                                      FROM Society
                                                      WHERE Uuid = NEW.Society)
                                        UNION ALL
                                        SELECT o.Uuid, o.Parent, o.Representative
                                        FROM Organisation o
                                               JOIN OrganisationHierarchy h
                                                    ON o.Uuid = h.Parent)
                   SELECT 1
                   FROM OrganisationHierarchy
                   WHERE Representative = NEW.Applicant) THEN
      RAISE EXCEPTION 'TRIGGER EXCEPTION 17: User Not Permitted';
    END IF;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    -- 只能修改状态或容量
    IF OLD.Uuid != NEW.Uuid OR OLD.Applicant != NEW.Applicant OR
       OLD.Society != NEW.Society OR OLD.Venue != NEW.Venue OR
       OLD.TimeRange != NEW.TimeRange OR OLD.Title != NEW.Title OR
       OLD.Description != NEW.Description THEN
      RAISE EXCEPTION 'TRIGGER EXCEPTION 9: Field Not Editable';
    END IF;

    -- 检查是否已经取消
    IF NOT OLD.IsActive THEN
      RAISE EXCEPTION 'TRIGGER EXCEPTION 15: Already Cancelled';
    END IF;

    -- 取消时，拒绝所有活动参与申请
    IF OLD.IsActive AND NOT NEW.IsActive THEN
      INSERT INTO EventParticipationApproval (Application, Approver, Result, Comment)
      SELECT Uuid, NEW.Applicant, FALSE, '活动取消'
      FROM EventParticipationApplication
      WHERE ApplyingEvent = OLD.Uuid
        AND IsActive
        AND NOT EXISTS (SELECT 1
                        FROM EventParticipationApproval
                        WHERE Application = Uuid);
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER Before_Event_Application_Change
  BEFORE INSERT OR UPDATE
  ON EventApplication
  FOR EACH ROW
EXECUTE FUNCTION On_Event_Application_Change();

CREATE OR REPLACE FUNCTION On_Event_Application_Approval_Change()
  RETURNS TRIGGER AS
$$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- 检查申请是否存在
    IF NOT EXISTS (SELECT 1
                   FROM EventApplication
                   WHERE Uuid = NEW.Application
                     AND IsActive) THEN
      RAISE EXCEPTION 'TRIGGER EXCEPTION 15: Already Cancelled';
    END IF;

    -- 检查申请是否已经被处理
    IF EXISTS (SELECT 1
               FROM EventApplicationApproval
               WHERE Application = NEW.Application) THEN
      RAISE EXCEPTION 'TRIGGER EXCEPTION 16: Already Processed';
    END IF;

    -- 检查审批者是否启用
    IF NOT EXISTS (SELECT 1
                   FROM Individual
                   WHERE Username = NEW.Approver
                     AND IsActive) THEN
      RAISE EXCEPTION 'TRIGGER EXCEPTION 11: Inactive User';
    END IF;

    -- 递归检查审批者是否是场所组织或其上级组织的负责人
    IF NOT EXISTS (WITH RECURSIVE OrganisationHierarchy
                                    AS (SELECT Uuid, Parent, Representative
                                        FROM Organisation
                                        WHERE Uuid = (SELECT Organisation
                                                      FROM Venue
                                                      WHERE Uuid =
                                                            (SELECT Venue
                                                             FROM EventApplication
                                                             WHERE Uuid = NEW.Application))
                                        UNION ALL
                                        SELECT o.Uuid, o.Parent, o.Representative
                                        FROM Organisation o
                                               JOIN OrganisationHierarchy h
                                                    ON o.Uuid = h.Parent)
                   SELECT 1
                   FROM OrganisationHierarchy
                   WHERE Representative = NEW.Approver) THEN
      RAISE EXCEPTION 'TRIGGER EXCEPTION 17: User Not Permitted';
    END IF;

    IF NEW.Result THEN
      -- 拒绝所有冲突申请
      INSERT INTO EventApplicationApproval (Application, Approver, Result, Comment)
      SELECT Uuid, NEW.Approver, FALSE, '冲突申请'
      FROM EventApplication
      WHERE UUid != NEW.Application
        AND Venue = (SELECT Venue
                     FROM EventApplication
                     WHERE Uuid = NEW.Application)
        AND TimeRange && (SELECT TimeRange
                          FROM EventApplication
                          WHERE Uuid = NEW.Application)
        AND IsActive
        AND NOT EXISTS (SELECT 1
                        FROM EventApplicationApproval
                        WHERE Application = Uuid);
    END IF;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    RAISE EXCEPTION 'TRIGGER EXCEPTION 9: Field Not Editable';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER Before_Event_Application_Approval_Change
  BEFORE INSERT OR UPDATE
  ON EventApplicationApproval
  FOR EACH ROW
EXECUTE FUNCTION On_Event_Application_Approval_Change();

CREATE OR REPLACE FUNCTION On_Event_Participation_Application_Change()
  RETURNS TRIGGER AS
$$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- 检查用户是否已经启用
    IF NOT EXISTS (SELECT 1
                   FROM Individual
                   WHERE Username = NEW.Applicant
                     AND IsActive) THEN
      RAISE EXCEPTION 'TRIGGER EXCEPTION 11: Inactive User';
    END IF;

    -- 检查活动是否启用
    IF NOT EXISTS (SELECT 1
                   FROM EventApplication
                   WHERE Uuid = NEW.ApplyingEvent
                     AND IsActive) THEN
      RAISE EXCEPTION 'TRIGGER EXCEPTION 15: Already Cancelled';
    END IF;

    -- 检查活动是否有空余名额
    IF EXISTS (SELECT 1
               FROM EventApplication
               WHERE Uuid = NEW.ApplyingEvent
                 AND Capacity >= 0
                 AND Capacity <= (SELECT COUNT(*)
                                  FROM EventParticipationApplication
                                  WHERE ApplyingEvent = NEW.ApplyingEvent
                                    AND IsActive
                                    AND EXISTS (SELECT 1
                                                FROM EventParticipationApproval
                                                WHERE Application = Uuid
                                                  AND Result))) THEN
      RAISE EXCEPTION 'TRIGGER EXCEPTION 21: Event Full';
    END IF;

    -- 检查是否有重叠申请
    IF EXISTS (SELECT 1
               FROM EventParticipationApplication
               WHERE Applicant = NEW.Applicant
                 AND (SELECT Timerange
                      FROM EventApplication
                      WHERE Uuid = ApplyingEvent) && (SELECT Timerange
                                                      FROM EventApplication
                                                      WHERE Uuid = NEW.ApplyingEvent)
                 AND IsActive
                 AND NOT EXISTS (SELECT 1
                                 FROM EventParticipationApproval
                                 WHERE Application = Uuid
                                   AND NOT Result)) THEN
      RAISE EXCEPTION 'TRIGGER EXCEPTION 20: Conflicting Application';
    END IF;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    -- 只能修改状态
    IF OLD.Uuid != NEW.Uuid OR OLD.Applicant != NEW.Applicant OR
       OLD.ApplyingEvent != NEW.ApplyingEvent OR
       OLD.Timestamp != NEW.Timestamp THEN
      RAISE EXCEPTION 'TRIGGER EXCEPTION 9: Field Not Editable';
    END IF;

    -- 检查是否已经取消
    IF NOT OLD.IsActive THEN
      RAISE EXCEPTION 'TRIGGER EXCEPTION 15: Already Cancelled';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER Before_Event_Participation_Application_Change
  BEFORE INSERT OR UPDATE
  ON EventParticipationApplication
  FOR EACH ROW
EXECUTE FUNCTION On_Event_Participation_Application_Change();

CREATE OR REPLACE FUNCTION On_Event_Participation_Approval_Change()
  RETURNS TRIGGER AS
$$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- 检查申请是否存在
    IF NOT EXISTS (SELECT 1
                   FROM EventParticipationApplication
                   WHERE Uuid = NEW.Application
                     AND IsActive) THEN
      RAISE EXCEPTION 'TRIGGER EXCEPTION 15: Already Cancelled';
    END IF;

    -- 检查申请是否已经被处理
    IF EXISTS (SELECT 1
               FROM EventParticipationApproval
               WHERE Application = NEW.Application) THEN
      RAISE EXCEPTION 'TRIGGER EXCEPTION 16: Already Processed';
    END IF;

    -- 检查审批者是否启用
    IF NOT EXISTS (SELECT 1
                   FROM Individual
                   WHERE Username = NEW.Approver
                     AND IsActive) THEN
      RAISE EXCEPTION 'TRIGGER EXCEPTION 11: Inactive User';
    END IF;

    -- 递归检查审批者是否是活动、社团或其上级组织的负责人
    IF NOT EXISTS (SELECT 1
                   FROM EventApplication
                   WHERE Uuid = (SELECT ApplyingEvent
                                 FROM EventParticipationApplication
                                 WHERE Uuid = NEW.Application)
                     AND Applicant = NEW.Approver) AND
       NOT EXISTS (SELECT 1
                   FROM Society
                   WHERE Uuid =
                         (SELECT Society
                          FROM EventApplication
                          WHERE Uuid =
                                (SELECT ApplyingEvent
                                 FROM EventParticipationApplication
                                 WHERE Uuid = NEW.Application))
                     AND Representative = NEW.Approver) AND
       NOT EXISTS (WITH RECURSIVE OrganisationHierarchy
                                    AS (SELECT Uuid, Parent, Representative
                                        FROM Organisation
                                        WHERE Uuid = (SELECT Organisation
                                                      FROM Society
                                                      WHERE Uuid =
                                                            (SELECT Society
                                                             FROM EventApplication
                                                             WHERE Uuid =
                                                                   (SELECT ApplyingEvent
                                                                    FROM EventParticipationApplication
                                                                    WHERE Uuid = NEW.Application)))
                                        UNION ALL
                                        SELECT o.Uuid, o.Parent, o.Representative
                                        FROM Organisation o
                                               JOIN OrganisationHierarchy h
                                                    ON o.Uuid = h.Parent)
                   SELECT 1
                   FROM OrganisationHierarchy
                   WHERE Representative = NEW.Approver) THEN
      RAISE EXCEPTION 'TRIGGER EXCEPTION 17: User Not Permitted';
    END IF;

    IF NEW.Result THEN
      -- 检查活动是否有空余名额
      IF EXISTS (SELECT 1
                 FROM EventApplication
                 WHERE Uuid = (SELECT ApplyingEvent
                               FROM EventParticipationApplication
                               WHERE Uuid = NEW.Application)
                   AND Capacity >= 0
                   AND Capacity <= (SELECT COUNT(*)
                                    FROM EventParticipationApplication
                                    WHERE ApplyingEvent = (SELECT ApplyingEvent
                                                           FROM EventParticipationApplication
                                                           WHERE Uuid = NEW.Application)
                                      AND IsActive
                                      AND EXISTS (SELECT 1
                                                  FROM EventParticipationApproval
                                                  WHERE Application = Uuid
                                                    AND Result))) THEN
        RAISE EXCEPTION 'TRIGGER EXCEPTION 22: Event Full';
      END IF;

      -- 如果通过后人满，拒绝所有冲突申请
      IF EXISTS (SELECT 1
                 FROM EventApplication
                 WHERE Uuid = (SELECT ApplyingEvent
                               FROM EventParticipationApplication
                               WHERE Uuid = NEW.Application)
                   AND Capacity >= 0
                   AND Capacity <= (SELECT COUNT(*)
                                    FROM EventParticipationApplication
                                    WHERE ApplyingEvent = (SELECT ApplyingEvent
                                                           FROM EventParticipationApplication
                                                           WHERE Uuid = NEW.Application)
                                      AND IsActive
                                      AND EXISTS (SELECT 1
                                                  FROM EventParticipationApproval
                                                  WHERE Application = Uuid
                                                    AND Result)) + 1) THEN
        INSERT INTO EventParticipationApproval (Application, Approver, Result, Comment)
        SELECT Uuid, NEW.Approver, FALSE, '人数已满'
        FROM EventParticipationApplication
        WHERE Uuid != NEW.Application
          AND ApplyingEvent = (SELECT ApplyingEvent
                               FROM EventParticipationApplication
                               WHERE Uuid = NEW.Application)
          AND IsActive
          AND NOT EXISTS (SELECT 1
                          FROM EventParticipationApproval
                          WHERE Application = Uuid);
      END IF;
    END IF;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    RAISE EXCEPTION 'TRIGGER EXCEPTION 9: Field Not Editable';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER Before_Event_Participation_Approval_Change
  BEFORE INSERT OR UPDATE
  ON EventParticipationApproval
  FOR EACH ROW
EXECUTE FUNCTION On_Event_Participation_Approval_Change();
