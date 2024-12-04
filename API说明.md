# API说明

## 要实现的“API”是什么？

实现的API包括：

- API路由，在`/api`目录下，用于接收前端请求，调用后端，并将数据返回前端
- API接口，在`/dependences/dataBackend`目录下，用于验证前端传参，与数据库交互，返回数据给API路由

比如，“修改密码”的API就包括：

- API路由：`/api/user/changePassword/route.ts`，这里`/api/user/changePassword`是客户端调用API的路径，`route.ts`是处理这个路径接收到的请求的文件
- API接口：`/dependences/dataBackend/user/changePassword.ts`，与数据库交互，返回执行结果

## API路由

API路由路径命名的原则是：`api/<页面名>/<接口名>`，比如“修改密码”的页面是“用户信息”，所以“页面名”是`user`；“修改密码”的接口是“修改密码”，所以“接口名”是`changePassword`。

又比如，“列出加入社团”的页面是“控制台”，接口属于“社团”一类，接口名为“列出加入社团”，那么API路由的路径就是`api/console/society/listJoined`。

API路由的写法，可以参考既有的API路由文件。比如`/api/user/changePassword/route.ts`：

```typescript
export async function POST(request: Request) {
  try {
    // 从请求获取参数，由于先写API路由后写请求，所以这里的参数可以自行定义
    const { username, password, passwordNew } = await request.json();
    // 调用API接口，返回执行结果
    const result = await changePassword(username, password, passwordNew);
    // 如果是列举类API，返回一个数组；如果是操作类API，可能返回一个对象，也可能返回null
    // 操作类API返回null即代表失败，这里需要根据返回值判断是否成功
    if (!result) {
      // 失败，原因是用户名或密码错误
      return NextResponse.json({ error: ERROR_INCORRECT_USERNAME_OR_PASSWORD.code }, { status: 404 });
    }
    // 成功，因为是操作类API，所以返回一个空的payload即可（统一格式）
    // 如果是列举类API，payload是一个数组
    return NextResponse.json({ payload: {} }, { status: 200 });
  } catch (e) {
    // 错误处理，不要管这一部分
    if (!(e instanceof ServerError)) {
      return NextResponse.json({ error: ERROR_UNKNOWN.code }, { status: 500 });
    }
    return NextResponse.json({ error: e.code }, { status: 500 });
  }
}
```

你还可以参考`/api/console/society/listJoined/route.ts`。

## API接口

API接口是用于验证前端传参，与数据库交互，返回数据给API路由的文件。

API接口只需要按功能名称命名，放到合适的目录下即可。比如“列出加入的社团”的接口：

```typescript
import { getServerSession } from "next-auth";
import {
  ERROR_NO_USER_IN_SESSION,
  ERROR_SESSION_NOT_FOUND
} from "@/app/dependencies/error/session";
import { connect } from "@/app/dependencies/dataBackend/dataSource";
import { ERROR_UNKNOWN } from "@/app/dependencies/error/unknown";
import processDBError from "@/app/dependencies/error/database";

export default async function listJoinedSociety() {
  // 获取当前登录的用户，只有登录用户的信息不需要从request中获取，也不能从request中获取
  // 用户名为session.user.name
  const session = await getServerSession();
  // 可能有登录的用户，也可能没有登录的用户，所以需要判断
  if (!session) {
    throw ERROR_SESSION_NOT_FOUND;
  }
  if (!session.user) {
    throw ERROR_NO_USER_IN_SESSION;
  }
  // 从连接池获取连接，这样就不需要管理数据库的连接了
  const client = await connect();
  try {
    // 进行查询，返回一个查询结果对象
    const result = await client.query(
        `SELECT s.Uuid, s.Name
       FROM "Society".Membership m
              JOIN "Society".Society s
                   ON m.Society = s.Uuid
       WHERE m.Individual = $1 AND m.IsActive;`,
        [ session.user.name ]
    );
    // 查询返回0条记录，返回空数组
    if (!result.rowCount) {
      return [];
    }
    // 查询返回一条以上记录，把每条记录转成一个数组，返回为一个二维数组
    return result.rows.map(row => [ row.uuid, row.name ]);
  } catch (e) {
    // 错误处理，不要管这一部分
    if (!(e instanceof Error)) {
      throw ERROR_UNKNOWN;
    }
    e = processDBError(e);
    throw e;
  } finally {
    // 一定要释放连接！
    client.release();
  }
}
```

你还可以参考`/dependences/dataBackend/user/changePassword.ts`。

## 注意

开发API时，务必遵循typescript、eslint和editorconfig规定的语法和格式要求。为求统一，请尽量使用WebStorm作为IDE，在设置/编辑器/代码样式开启editorconfig支持，以保证代码风格的一致性。