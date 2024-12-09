SET SCHEMA 'Society';

SET SEARCH_PATH TO 'Society', 'public';

CREATE OR REPLACE FUNCTION On_Individual_Change()
  RETURNS TRIGGER AS
$$
BEGIN
  -- 不允许移动到未启用的组织
  IF NOT EXISTS (SELECT 1
                 FROM "Society".Organisation
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
                 FROM "Society".Society
                 WHERE Representative = NEW.Username) OR EXISTS (SELECT 1
                                                                 FROM "Society".Organisation
                                                                 WHERE Representative = NEW.Username) THEN
        RAISE EXCEPTION 'TRIGGER EXCEPTION 7: Deactivating Representative';
      END IF;
    END IF;

    IF OLD.Organisation != NEW.Organisation THEN
      -- 检查用户是否在管理的组织或其上级组织中
      DECLARE
        hierarchy INT[];
      BEGIN
        SELECT ARRAY_AGG(Uuid)
        INTO hierarchy
        FROM (WITH RECURSIVE OrganisationHierarchy AS (SELECT Uuid
                                                       FROM "Society".Organisation
                                                       WHERE Uuid = NEW.Organisation
                                                       UNION
                                                       SELECT o.Uuid
                                                       FROM "Society".Organisation o
                                                              JOIN OrganisationHierarchy h
                                                                   ON h.Uuid = o.Parent)
              SELECT Uuid
              FROM OrganisationHierarchy) AS OrganisationHierarchy;

        IF EXISTS (SELECT 1
                   FROM "Society".Organisation
                   WHERE NOT (Uuid = ANY (hierarchy))
                     AND Representative = NEW.Username) THEN
          RAISE EXCEPTION 'TRIGGER EXCEPTION 10: Representative not in hierarchy';
        END IF;

        -- 检查用户是否在管理的社团上级组织中
        IF EXISTS (SELECT 1
                   FROM "Society".Society
                   WHERE NOT (Organisation = ANY (hierarchy))
                     AND Representative = NEW.Username) THEN
          RAISE EXCEPTION 'TRIGGER EXCEPTION 10: Representative not in hierarchy';
        END IF;
      END;
    END IF;

    IF OLD.IsActive AND NOT NEW.IsActive THEN
      -- 将用户从社团中移除
      UPDATE "Society".Membership SET IsActive = FALSE WHERE Individual = NEW.Username;

      -- 撤销用户的待处理活动申请
      UPDATE "Society".EventApplication
      SET IsActive = FALSE
      WHERE Applicant = NEW.Username
        AND IsActive
        AND NOT EXISTS (SELECT 1
                        FROM "Society".EventApplicationApproval
                        WHERE Application = Uuid);

      -- 撤销用户的待处理活动参与申请
      UPDATE "Society".EventParticipationApplication
      SET IsActive = FALSE
      WHERE Applicant = NEW.Username
        AND IsActive
        AND NOT EXISTS (SELECT 1
                        FROM "Society".EventParticipationApproval
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
                                  FROM "Society".Individual
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
                                          UNION
                                          SELECT o.Uuid, o.Parent
                                          FROM "Society".Organisation o
                                                 JOIN OrganisationHierarchy h
                                                      ON o.Uuid = h.Parent)
                     SELECT 1
                     FROM OrganisationHierarchy
                     WHERE Uuid = (SELECT Organisation
                                   FROM "Society".Individual
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
                 FROM "Society".Individual
                 WHERE Organisation = NEW.Uuid) OR EXISTS (SELECT 1
                                                           FROM "Society".Society
                                                           WHERE Organisation = NEW.Uuid) OR
         EXISTS (SELECT 1
                 FROM "Society".Venue
                 WHERE Organisation = NEW.Uuid) OR EXISTS (SELECT 1
                                                           FROM "Society".Organisation
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
                                  FROM "Society".Individual
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
                                          FROM "Society".Organisation
                                          WHERE Uuid = NEW.Organisation
                                          UNION
                                          SELECT o.Uuid, o.Parent
                                          FROM "Society".Organisation o
                                                 JOIN OrganisationHierarchy h
                                                      ON o.Uuid = h.Parent)
                     SELECT 1
                     FROM OrganisationHierarchy
                     WHERE Uuid = (SELECT Organisation
                                   FROM "Society".Individual
                                   WHERE Username = NEW.Representative)) THEN
        RAISE EXCEPTION 'TRIGGER EXCEPTION 10: Representative Not in Organisation Hierarchy';
      END IF;
    END IF;
  END IF;

  -- 检查社团所属组织是否启用
  IF NEW.IsActive AND NOT EXISTS (SELECT 1
                                  FROM "Society".Organisation
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
      UPDATE "Society".Membership
      SET IsActive = FALSE
      WHERE Society = NEW.Uuid;

      -- 撤销社团的待处理活动申请
      UPDATE "Society".EventApplication
      SET IsActive = FALSE
      WHERE Society = NEW.Uuid
        AND IsActive
        AND NOT EXISTS (SELECT 1
                        FROM "Society".EventApplicationApproval
                        WHERE Application = Uuid);

      -- 审批活动参与申请为拒绝
      INSERT INTO "Society".EventParticipationApproval(Application, Approver, Result, Comment)
      SELECT epa.Uuid, OLD.Representative, FALSE, '社团停止活动'
      FROM "Society".EventParticipationApplication epa
             JOIN "Society".EventApplication ea ON ApplyingEvent = ea.Uuid
      WHERE Society = NEW.Uuid
        AND epa.IsActive
        AND NOT EXISTS (SELECT 1
                        FROM "Society".EventParticipationApproval
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
                   FROM "Society".Individual
                   WHERE Username = NEW.Individual
                     AND IsActive) THEN
      RAISE EXCEPTION 'TRIGGER EXCEPTION 11: Inactive User';
    END IF;

    -- 检查社团是否启用
    IF NOT EXISTS (SELECT 1
                   FROM "Society".Society
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
                 FROM "Society".Organisation
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

CREATE OR REPLACE FUNCTION On_Event_Application_Change()
  RETURNS TRIGGER AS
$$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- 检查用户是否已经启用
    IF NOT EXISTS (SELECT 1
                   FROM "Society".Individual
                   WHERE Username = NEW.Applicant
                     AND IsActive) THEN
      RAISE EXCEPTION 'TRIGGER EXCEPTION 11: Inactive User';
    END IF;

    -- 检查场所是否启用
    IF NOT EXISTS (SELECT 1
                   FROM "Society".Venue
                   WHERE Uuid = NEW.Venue
                     AND isAvailable) THEN
      RAISE EXCEPTION 'TRIGGER EXCEPTION 18: Unavailable Venue';
    END IF;

    -- 检查社团是否启用
    IF NOT EXISTS (SELECT 1
                   FROM "Society".Society
                   WHERE Uuid = NEW.Society
                     AND IsActive) THEN
      RAISE EXCEPTION 'TRIGGER EXCEPTION 12: Inactive Society';
    END IF;

    -- 检查场所是否有已经通过的活动
    IF EXISTS (SELECT 1
               FROM "Society".EventApplication
               WHERE Venue = NEW.Venue
                 AND TimeRange && NEW.TimeRange
                 AND EXISTS (SELECT 1
                             FROM "Society".EventApplicationApproval
                             WHERE Application = Uuid
                               AND Result)) THEN
      RAISE EXCEPTION 'TRIGGER EXCEPTION 19: Venue Occupied';
    END IF;

    -- 容量默认为场所容量
    IF NEW.Capacity IS NULL THEN
      NEW.Capacity := (SELECT Capacity
                       FROM "Society".Venue
                       WHERE Uuid = NEW.Venue);
    END IF;

    -- 检查社团是否有重叠申请
    IF EXISTS (SELECT 1
               FROM "Society".EventApplication
               WHERE Society = NEW.Society
                 AND TimeRange && NEW.TimeRange
                 AND Venue = NEW.Venue
                 AND IsActive
                 AND NOT EXISTS (SELECT 1
                                 FROM "Society".EventApplicationApproval
                                 WHERE Application = Uuid
                                   AND NOT Result)) THEN
      RAISE EXCEPTION 'TRIGGER EXCEPTION 20: Conflicting Application';
    END IF;

    -- 递归检查申请者是否是社团、组织或其上级组织的负责人
    IF NOT EXISTS (SELECT 1
                   FROM "Society".Society
                   WHERE Uuid = NEW.Society
                     AND Representative = NEW.Applicant) AND
       NOT EXISTS (WITH RECURSIVE OrganisationHierarchy
                                    AS (SELECT Uuid, Parent, Representative
                                        FROM "Society".Organisation
                                        WHERE Uuid = (SELECT Organisation
                                                      FROM "Society".Society
                                                      WHERE Uuid = NEW.Society)
                                        UNION
                                        SELECT o.Uuid, o.Parent, o.Representative
                                        FROM "Society".Organisation o
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
      INSERT INTO "Society".EventParticipationApproval (Application, Approver, Result, Comment)
      SELECT Uuid, NEW.Applicant, FALSE, '活动取消'
      FROM "Society".EventParticipationApplication
      WHERE ApplyingEvent = OLD.Uuid
        AND IsActive
        AND NOT EXISTS (SELECT 1
                        FROM "Society".EventParticipationApproval
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
                   FROM "Society".EventApplication
                   WHERE Uuid = NEW.Application
                     AND IsActive) THEN
      RAISE EXCEPTION 'TRIGGER EXCEPTION 15: Already Cancelled';
    END IF;

    -- 检查申请是否已经被处理
    IF EXISTS (SELECT 1
               FROM "Society".EventApplicationApproval
               WHERE Application = NEW.Application) THEN
      RAISE EXCEPTION 'TRIGGER EXCEPTION 16: Already Processed';
    END IF;

    -- 检查审批者是否启用
    IF NOT EXISTS (SELECT 1
                   FROM "Society".Individual
                   WHERE Username = NEW.Approver
                     AND IsActive) THEN
      RAISE EXCEPTION 'TRIGGER EXCEPTION 11: Inactive User';
    END IF;

    -- 递归检查审批者是否是场所组织或其上级组织的负责人
    IF NOT EXISTS (WITH RECURSIVE OrganisationHierarchy
                                    AS (SELECT Uuid, Parent, Representative
                                        FROM "Society".Organisation
                                        WHERE Uuid = (SELECT Organisation
                                                      FROM "Society".Venue
                                                      WHERE Uuid =
                                                            (SELECT Venue
                                                             FROM "Society".EventApplication
                                                             WHERE Uuid = NEW.Application))
                                        UNION
                                        SELECT o.Uuid, o.Parent, o.Representative
                                        FROM "Society".Organisation o
                                               JOIN OrganisationHierarchy h
                                                    ON o.Uuid = h.Parent)
                   SELECT 1
                   FROM OrganisationHierarchy
                   WHERE Representative = NEW.Approver) THEN
      RAISE EXCEPTION 'TRIGGER EXCEPTION 17: User Not Permitted';
    END IF;

    IF NEW.Result THEN
      -- 拒绝所有冲突申请
      INSERT INTO "Society".EventApplicationApproval (Application, Approver, Result, Comment)
      SELECT Uuid, NEW.Approver, FALSE, '冲突申请'
      FROM "Society".EventApplication
      WHERE UUid != NEW.Application
        AND Venue = (SELECT Venue
                     FROM "Society".EventApplication
                     WHERE Uuid = NEW.Application)
        AND TimeRange && (SELECT TimeRange
                          FROM "Society".EventApplication
                          WHERE Uuid = NEW.Application)
        AND IsActive
        AND NOT EXISTS (SELECT 1
                        FROM "Society".EventApplicationApproval
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
                   FROM "Society".Individual
                   WHERE Username = NEW.Applicant
                     AND IsActive) THEN
      RAISE EXCEPTION 'TRIGGER EXCEPTION 11: Inactive User';
    END IF;

    -- 检查活动是否启用
    IF EXISTS (SELECT 1
                   FROM "Society".EventApplication
                   WHERE Uuid = NEW.ApplyingEvent
                     AND NOT IsActive) THEN
      RAISE EXCEPTION 'TRIGGER EXCEPTION 15: Already Cancelled';
    END IF;

    -- 检查活动是否有空余名额
    IF EXISTS (SELECT 1
               FROM "Society".EventApplication
               WHERE Uuid = NEW.ApplyingEvent
                 AND Capacity >= 0
                 AND Capacity <= (SELECT COUNT(*)
                                  FROM "Society".EventParticipationApplication
                                  WHERE ApplyingEvent = NEW.ApplyingEvent
                                    AND IsActive
                                    AND EXISTS (SELECT 1
                                                FROM "Society".EventParticipationApproval
                                                WHERE Application = Uuid
                                                  AND Result))) THEN
      RAISE EXCEPTION 'TRIGGER EXCEPTION 21: Event Full';
    END IF;

    -- 检查是否有重叠申请
    IF EXISTS (SELECT 1
               FROM "Society".EventParticipationApplication
               WHERE Applicant = NEW.Applicant
                 AND (SELECT Timerange
                      FROM "Society".EventApplication
                      WHERE Uuid = ApplyingEvent) && (SELECT Timerange
                                                      FROM "Society".EventApplication
                                                      WHERE Uuid = NEW.ApplyingEvent)
                 AND IsActive
                 AND NOT EXISTS (SELECT 1
                                 FROM "Society".EventParticipationApproval
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
                   FROM "Society".EventParticipationApplication
                   WHERE Uuid = NEW.Application
                     AND IsActive) THEN
      RAISE EXCEPTION 'TRIGGER EXCEPTION 15: Already Cancelled';
    END IF;

    -- 检查申请是否已经被处理
    IF EXISTS (SELECT 1
               FROM "Society".EventParticipationApproval
               WHERE Application = NEW.Application) THEN
      RAISE EXCEPTION 'TRIGGER EXCEPTION 16: Already Processed';
    END IF;

    -- 检查审批者是否启用
    IF NOT EXISTS (SELECT 1
                   FROM "Society".Individual
                   WHERE Username = NEW.Approver
                     AND IsActive) THEN
      RAISE EXCEPTION 'TRIGGER EXCEPTION 11: Inactive User';
    END IF;

    -- 递归检查审批者是否是活动、社团或其上级组织的负责人
    IF NOT EXISTS (SELECT 1
                   FROM "Society".EventApplication
                   WHERE Uuid = (SELECT ApplyingEvent
                                 FROM "Society".EventParticipationApplication
                                 WHERE Uuid = NEW.Application)
                     AND Applicant = NEW.Approver) AND
       NOT EXISTS (SELECT 1
                   FROM "Society".Society
                   WHERE Uuid =
                         (SELECT Society
                          FROM "Society".EventApplication
                          WHERE Uuid =
                                (SELECT ApplyingEvent
                                 FROM"Society". EventParticipationApplication
                                 WHERE Uuid = NEW.Application))
                     AND Representative = NEW.Approver) AND
       NOT EXISTS (WITH RECURSIVE OrganisationHierarchy
                                    AS (SELECT Uuid, Parent, Representative
                                        FROM "Society".Organisation
                                        WHERE Uuid = (SELECT Organisation
                                                      FROM "Society".Society
                                                      WHERE Uuid =
                                                            (SELECT Society
                                                             FROM "Society".EventApplication
                                                             WHERE Uuid =
                                                                   (SELECT ApplyingEvent
                                                                    FROM "Society".EventParticipationApplication
                                                                    WHERE Uuid = NEW.Application)))
                                        UNION
                                        SELECT o.Uuid, o.Parent, o.Representative
                                        FROM "Society".Organisation o
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
                 FROM "Society".EventApplication
                 WHERE Uuid = (SELECT ApplyingEvent
                               FROM "Society".EventParticipationApplication
                               WHERE Uuid = NEW.Application)
                   AND Capacity >= 0
                   AND Capacity <= (SELECT COUNT(*)
                                    FROM "Society".EventParticipationApplication
                                    WHERE ApplyingEvent = (SELECT ApplyingEvent
                                                           FROM "Society".EventParticipationApplication
                                                           WHERE Uuid = NEW.Application)
                                      AND IsActive
                                      AND EXISTS (SELECT 1
                                                  FROM "Society".EventParticipationApproval
                                                  WHERE Application = Uuid
                                                    AND Result))) THEN
        RAISE EXCEPTION 'TRIGGER EXCEPTION 22: Event Full';
      END IF;

      -- 如果通过后人满，拒绝所有冲突申请
      IF EXISTS (SELECT 1
                 FROM "Society".EventApplication
                 WHERE Uuid = (SELECT ApplyingEvent
                               FROM "Society".EventParticipationApplication
                               WHERE Uuid = NEW.Application)
                   AND Capacity >= 0
                   AND Capacity <= (SELECT COUNT(*)
                                    FROM "Society".EventParticipationApplication
                                    WHERE ApplyingEvent = (SELECT ApplyingEvent
                                                           FROM "Society".EventParticipationApplication
                                                           WHERE Uuid = NEW.Application)
                                      AND IsActive
                                      AND EXISTS (SELECT 1
                                                  FROM "Society".EventParticipationApproval
                                                  WHERE Application = Uuid
                                                    AND Result)) + 1) THEN
        INSERT INTO "Society".EventParticipationApproval (Application, Approver, Result, Comment)
        SELECT Uuid, NEW.Approver, FALSE, '人数已满'
        FROM "Society".EventParticipationApplication
        WHERE Uuid != NEW.Application
          AND ApplyingEvent = (SELECT ApplyingEvent
                               FROM "Society".EventParticipationApplication
                               WHERE Uuid = NEW.Application)
          AND IsActive
          AND NOT EXISTS (SELECT 1
                          FROM "Society".EventParticipationApproval
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
