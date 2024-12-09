SET SCHEMA 'Society';

SET SEARCH_PATH TO 'Society', 'public';

INSERT INTO organisation (name)
VALUES ('崇实书院'),
       ('明理书院'),
       ('文艺书院'),
       ('学工部门');

INSERT INTO organisation (name, parent)
VALUES ('经济学院', 3),
       ('应用经济学院', 3),
       ('财政金融学院', 3),
       ('信息学院', 4),
       ('高瓴人工智能学院', 4),
       ('理学院', 4),
       ('数学学院', 4),
       ('艺术学院', 5),
       ('文学院', 5),
       ('学工处', 6),
       ('团委', 6);

INSERT INTO Individual (Username, name, passwordhash, organisation)
VALUES ('2021080001', '李华', CRYPT('password2021080001', GEN_SALT('bf')), 8),
       ('2021080002', '张明', CRYPT('password2021080002', GEN_SALT('bf')), 8),
       ('2021080003', '王丽', CRYPT('password2021080003', GEN_SALT('bf')), 8),
       ('2021080004', '赵强', CRYPT('password2021080004', GEN_SALT('bf')), 8);

INSERT INTO Individual (Username, name, passwordhash, organisation)
VALUES ('2021090001', '张伟', CRYPT('password2021090001', GEN_SALT('bf')), 9),
       ('2021090002', '李军', CRYPT('password2021090002', GEN_SALT('bf')), 9);

INSERT INTO Individual (Username, name, passwordhash, organisation)
VALUES ('2021100001', '王芳', CRYPT('password2021100001', GEN_SALT('bf')), 10);

INSERT INTO Individual (Username, name, passwordhash, organisation)
VALUES ('2021110001', '赵杰', CRYPT('password2021110001', GEN_SALT('bf')), 11),
       ('2021110002', '李娜', CRYPT('password2021110002', GEN_SALT('bf')), 11);

INSERT INTO Individual (Username, name, passwordhash, organisation)
VALUES ('2021120001', '王伟', CRYPT('password2021120001', GEN_SALT('bf')), 12);

INSERT INTO individual (username, name, passwordhash, organisation)
VALUES ('2021130001', '赵丽', CRYPT('password2021130001', GEN_SALT('bf')), 13),
       ('2021130002', '李强', CRYPT('password2021130002', GEN_SALT('bf')), 13),
       ('2021130003', '王明', CRYPT('password2021130003', GEN_SALT('bf')), 13);

INSERT INTO individual (username, name, passwordhash, organisation)
VALUES ('2021140001', '王博海', CRYPT('password2021140001', GEN_SALT('bf')),
        14);

INSERT INTO individual (username, name, passwordhash, organisation)
VALUES ('2021150001', '李汉娜', CRYPT('password2021150001', GEN_SALT('bf')),
        15),
       ('2021150002', '赵瑞克', CRYPT('password2021150002', GEN_SALT('bf')),
        15);

INSERT INTO individual (username, name, passwordhash, organisation)
VALUES ('2021160001', '王瑞', CRYPT('password2021160001', GEN_SALT('bf')), 16);

INSERT INTO individual (username, name, passwordhash, organisation)
VALUES ('2021031001', '弗哈耶', CRYPT('password2021031001', GEN_SALT('bf')), 3),
       ('2021031002', '梅凯恩', CRYPT('password2021031002', GEN_SALT('bf')), 3);

INSERT INTO individual (username, name, passwordhash, organisation)
VALUES ('2021041001', '李启明', CRYPT('password2021041001', GEN_SALT('bf')), 4),
       ('2021041002', '金钟负', CRYPT('password2021041002', GEN_SALT('bf')), 4),
       ('2021041003', '车豸愚', CRYPT('password2021041003', GEN_SALT('bf')), 4),
       ('2021041004', '全石泰', CRYPT('password2021041004', GEN_SALT('bf')), 4);

INSERT INTO individual (username, name, passwordhash, organisation)
VALUES ('2021051001', '路由校', CRYPT('password2021051001', GEN_SALT('bf')), 5),
       ('2021051002', '赵煜', CRYPT('password2021051002', GEN_SALT('bf')), 5);

INSERT INTO individual (username, name, passwordhash, organisation)
VALUES ('2021171001', '张美玉', CRYPT('password2021171001', GEN_SALT('bf')),
        17),
       ('2021171002', '燕时珍', CRYPT('password2021171002', GEN_SALT('bf')),
        17),
       ('2021171003', '李德全', CRYPT('password2021171003', GEN_SALT('bf')),
        17),
       ('2021171004', '孙连英', CRYPT('password2021171004', GEN_SALT('bf')),
        17);

INSERT INTO individual (username, name, passwordhash, organisation)
VALUES ('2021181001', '海德怀', CRYPT('password2021181001', GEN_SALT('bf')),
        18);

INSERT INTO individual (username, name, passwordhash, organisation)
VALUES ('2021061001', '刘三明', CRYPT('password2021061001', GEN_SALT('bf')), 6),
       ('2021061002', '宋三', CRYPT('password2021061002', GEN_SALT('bf')), 6);

UPDATE organisation
SET representative = '2021080001'
WHERE uuid = 8;

UPDATE organisation
SET representative = '2021090001'
WHERE uuid = 9;

UPDATE organisation
SET representative = '2021100001'
WHERE uuid = 10;

UPDATE organisation
SET representative = '2021110001'
WHERE uuid = 11;

UPDATE organisation
SET representative = '2021120001'
WHERE uuid = 12;

UPDATE organisation
SET representative = '2021130001'
WHERE uuid = 13;

UPDATE organisation
SET representative = '2021140001'
WHERE uuid = 14;

UPDATE organisation
SET representative = '2021150001'
WHERE uuid = 15;

UPDATE organisation
SET representative = '2021160001'
WHERE uuid = 16;

UPDATE organisation
SET representative = '2021061001'
WHERE uuid = 17;

UPDATE organisation
SET representative = '0000000000'
WHERE uuid = 18;

UPDATE organisation
SET representative = '2021031001'
WHERE uuid = 3;

UPDATE organisation
SET representative = '2021041001'
WHERE uuid = 4;

UPDATE organisation
SET representative = '2021051001'
WHERE uuid = 5;

UPDATE organisation
SET representative = '0000000000'
WHERE uuid = 6;

INSERT INTO society (name, organisation, representative, description)
VALUES ('经济学守英勤院社', 8, '2021080002', '经济学院官方社团');

INSERT INTO society (name, organisation, representative, description)
VALUES ('大数据应用翼赞社', 9, '2021090001', '应用经济学院官方社团');

INSERT INTO society (name, organisation, representative, description)
VALUES ('财政金融行动', 10, '2021100001', '财政金融学院官方社团');

INSERT INTO society (name, organisation, representative, description)
VALUES ('信息学院数据库课题自治联合会', 11, '2021110001', '信息学院官方社团');

INSERT INTO society (name, organisation, representative, description)
VALUES ('人工智能运动', 12, '2021120001', '高瓴人工智能学院官方社团');

INSERT INTO society (name, organisation, representative, description)
VALUES ('理学院正统派社团', 13, '2021130002', '理学院官方社团');

INSERT INTO society (name, organisation, representative, description)
VALUES ('数学分析社', 14, '2021140001', '数学学院官方社团');

INSERT INTO society (name, organisation, representative, description)
VALUES ('艺术学院学生社团', 15, '2021150001', '艺术学院官方社团');

INSERT INTO society (name, organisation, representative, description)
VALUES ('惊雷文学社', 16, '2021160001', '文学院官方社团');

INSERT INTO society (name, organisation, representative, description)
VALUES ('学校志愿者协会', 17, '2021171001', '学工处官方社团');

INSERT INTO society (name, organisation, representative, description)
VALUES ('学校团委志愿协会', 18, '2021181001', '团委官方社团');

INSERT INTO society (name, organisation, representative, description)
VALUES ('学生会', 1, '0000000000', '学生会官方社团');

INSERT INTO membership (individual, society)
VALUES ('2021080001', 1),
       ('2021080002', 1),
       ('2021080003', 1),
       ('2021090001', 2),
       ('2021100001', 3),
       ('2021110001', 4),
       ('2021120001', 5),
       ('2021130001', 6),
       ('2021130002', 6),
       ('2021140001', 7),
       ('2021150001', 8),
       ('2021150002', 8),
       ('2021160001', 9),
       ('2021171001', 10),
       ('2021171002', 10),
       ('2021171003', 10),
       ('2021181001', 11),
       ('2021061001', 12);

INSERT INTO individual (username, name, passwordhash, organisation)
VALUES ('2021181002', '徐克思', CRYPT('password2021181002', GEN_SALT('bf')),
        18);

INSERT INTO membership (individual, society)
VALUES ('2021181002', 1),
       ('2021181002', 2),
       ('2021181002', 3),
       ('2021181002', 4),
       ('2021181002', 5),
       ('2021181002', 6),
       ('2021181002', 7),
       ('2021181002', 8),
       ('2021181002', 9),
       ('2021181002', 10),
       ('2021181002', 11),
       ('2021181002', 12);

INSERT INTO Venue (Name, Address, Description, Organisation, Capacity)
VALUES ('崇实书院学生活动室', '立德楼201', '崇实书院的学生活动室', 3, 15),
       ('明理书院学生活动室', '理工楼404', '明理书院的学生活动室', 4, 20),
       ('文艺书院学生活动室', '艺术楼101', '文艺书院的学生活动室', 5, 25),
       ('经济学院会议室', '明德主楼803', '经济学院的会议室', 8, 100),
       ('应用经济学院会议室', '明德主楼905', '应用经济学院的会议室', 9, 100),
       ('财政金融学院会议室', '明德主楼1001', '财政金融学院的会议室', 10, 100),
       ('信息学院机房', '理工配楼207', '信息学院的机房', 11, 20),
       ('高瓴人工智能学院机房', '理工配楼301', '高瓴人工智能学院的机房', 12,
        20),
       ('理学院实验室', '理工楼101', '理学院的实验室', 13, 30),
       ('数学学院实验室', '理工楼201', '数学学院的实验室', 14, 30),
       ('艺术学院美术室', '艺术楼201', '艺术学院的美术室', 15, 8),
       ('文学院学生活动室', '艺术楼301', '文学院的学生活动室', 16, 15),
       ('学工处会议室', '明德主楼1101', '学工处的会议室', 17, 100),
       ('团委会议室', '明德主楼1201', '团委的会议室', 18, 100),
       ('八百人大会堂', '明德主楼大厅', '学校的大会堂', 1, 800);