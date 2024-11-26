# 社团活动管理系统

基于Next.js的社团活动管理系统。

## 本机安装调试指南

### 安装数据库

使用[PostgreSQL](#https://www.postgresql.org/)数据库，安装完成后，根据安装过程中配置的内容填写项目中的 `.env`文件。

```
DB_USER=用户名
DB_HOST=127.0.0.1
DB_NAME=数据库名称
DB_PASS=用户密码
DB_PORT=数据库监听端口
```

虽然可以使用安装时生成的 `postgres`数据库和用户，但仍然建议新建一个数据库和对应的用户。为了使用 `pgcrypto`插件，需要在使用的数据库中执行 `CREATE EXTENSION pgcrypto;`查询。

随后，使用SQL文件导入 `Society`模式。

另外，建议限制数据库的外网访问，具体方法自行查找。

你也可以通过 `Docker`快速安装 `PostgreSQL`，如此必须将 `DB_HOST`和 `DB_PORT`修改为容器的IP和容器内数据库的监听端口。

### 安装环境

项目基于 `Node.js`，并使用 `git`作为版本管理工具。需要安装的环境如下。

- [Node.js](#https://nodejs.org/en)
- [Git](#https://git-scm.com/)

`Node.js`为跨平台环境，在OS X和典型Linux发行版上应该都可正常运行。

### 克隆仓库

创建一个项目文件夹，打开命令行工具，进入该文件夹，执行以下命令，将仓库克隆到本地。

```cmd
git clone https://github.com/PfCommilitia/DatabaseAssginment .
```

### 安装依赖

项目中不包含依赖的模块，但相关信息已包含在 `package.json`中。为安装依赖，在项目文件夹执行以下命令。

```cmd
npm install
```

### 运行项目

#### 调试模式

以调试模式运行项目，不需要提前进行构建，可以动态加载更改内容，但运行速度较慢。在开发中推荐以此模式进行调试。在项目文件夹中执行以下命令。

```cmd
npm run dev
```

这将持续监听 `localhost:3000`端口的请求，直到进程关闭。在此期间，可以对项目文件进行修改，检测到修改后会自动重新加载。

#### 生产模式

以生产模式运行项目，提前准备项目运行所需的相关文件，提高运行速度，同时阻止用户利用开发模式中的工具。在项目文件夹中执行以下命令进行构建。

```cmd
npm run build
```

构建完成后，执行以下命令以运行项目。

```cmd
npm run start
```

这将持续监听 `localhost:3000`端口的请求，直到进程关闭。

注意，只有在运行 `npm run build`后，项目中的修改才会在生产模式中生效。

### 前后端融合

项目使用 `TypeScript`进行开发，可以将其理解为 `JavaScript + Type`，通过编译期进行检查减少类型错误。关于 `JavaScript`和 `TypeScript`的语法，请自行学习。

#### 1

**异步**是 `JavaScript`的核心之一，尤其在 `Node.js`，许多功能都是通过异步实现的。异步可以在不阻塞其他事务的情况下，等待一项工作完成。比如：

```typescript
async function add1000(): Promise<number> {
  let result = 0;
  let promises = [];
  for (let i = 0; i < 1000; i += 1) {
    const promise = new Promise(() => { result += 1; });
    promises.push(promise);
  }
  await Promise.allSettled(promises);
  return result;
}

let result = await add1000(); // 1000
```

这个函数创建了1000个 `Promise`，每个 `Promise`将 `result`的值加1。这1000个 `Promise`会并行执行，但执行循序、执行时间和并行任务数量都不定。`Promise.allSettled`从数组中创建一个新的 `Promise`，在数组中的 `Promise`都执行完后视为执行完成。`await`会阻塞当前代码执行，直到对应的 `Promise`被完成，且获取 `Promise`的内容。`async`函数是一种特殊的函数，其返回值为一个 `Promise`，但不需要显式的处理。

在 `Node.js`中，异步函数的使用非常普遍，因为异步函数具有传染性，如果函数体内要 `await`一个 `Promise`，函数就必须为异步函数。只有 `React`的客户端组件中，直接返回 `HTML`标签的函数不能是，且不能调用异步函数。

#### 2

`Next.js`是前后端融合开发的Web应用框架，前端使用 `React`组件。以 `tsx`为后缀名的组件即为 `React`组件。这些组件的用途与 `php`文件相似，通过一系列逻辑生成 `HTML`标签，返回调用者。因为服务端和客户端需要处理的逻辑不同，因此，`React`组件分为服务端组件和客户端组件。除了在文件开头显式标注 `"use client";`的组件外，都是服务器组件，在服务端执行。

虽然开发时，可以将前后端进行融合开发，但必须对前后端的划分具有清晰的概念。第一，不可能将所有逻辑都放在服务端执行，比如一些标签的生成，这将使服务端压力过大；第二，客户端是**不可信任的**，决不能将重要逻辑，尤其是需要验证的逻辑放到客户端去执行，服务端也必须对来自客户端的信息进行验证，以免发生篡改；第三，部分组件和模块， 只能在服务端或客户端组件中使用，而不能在另一种组件中使用。因此，虽然前后端在同一项目中开发，但划分是十分明确的。

在服务端组件中，可以导入客户端组件；在客户端组件中，也可以导入服务端组件。因此，如果需要在服务端组件中加入一些客户端逻辑，只需要另写一个客户端组件导入即可，反之亦然。

#### 3

在 `JavaScript/TypeScript`中，导入依赖有两种方式：`import`和 `require`，后者在 `Node.js`项目中几乎无用。导入模块必须在文件开头进行声明，如：

```typescript
import { Bar1, Bar2 } from 'path/to/foo'; // 指名导入
import Bar from 'path/to/foo'; // 导入目标模块的默认导出项
import { Bar1 as A, Bar2 as B } from 'path/to/foo'; // 指名导入，并分配变量名
import * as Foo from 'path/to/foo'; // 全部导入，必须分配命名空间
```

所有 `JavaScript/TypeScript`都可以有导出项，定义方法为：

```typescript
let someExport1 = 0;
export someExport1;
export let someExport2 = 0;
function someExport3() {}
export someExport3;
export function someExport4;
export default const someExportDefault = {};
```

`default`用于标记默认导出。`React`组件的入口就是由默认导出确定的。

#### 4

项目使用 `pg`模块处理与数据库的连接，后端共用同一个连接池，所有查询逻辑都应该满足以下要求：

```typescript
// 文件头
import { connect } from "@/app/dependencies/dataBackend/dataSource";

// 查询
const client = await connect(); // 从连接池获取连接
try {
  // 进行查询，第一个参数为模板，第二个参数为传入模板的参数数组
  const result = await client.query(
    "SELECT * FROM Individual WHERE Username = $1 AND PASSWORD = $2 AND IsActive",
    [ username, password ] // 上面定义两个参数，所以传入两个
  );
  // 对result进行处理。注意没有报错不代表查询结果不为空
} catch (e) { // 查询失败时的处理，所有数据库报错均在这里处理，如语法错误，不满足约束，触发器报错等
  
} finally { // 不论是否捕获到错误都会执行
  client.release(); // 必须释放连接，否则会造成连接泄漏
}
```

这里有两个注意点。第一，由于**客户端是不可信的**，必须假设会受到SQL注入攻击，因此所有来自客户端的参数，必须通过查询模板传参；这样传入的参数只会被视为字面量，而不是查询语句的一部分。第二，由于许多数据检查和处理都是在数据库中通过约束或触发器处理的，必须进行错误处理，但一般来讲，是通过 `throw e;`将错误抛给调用者去处理，调用者根据错误内容向用户展示不同的内容；但如果将错误抛出，如果调用者没有使用 `try catch`捕获错误，整个程序就会因为没有处理的错误崩溃。

#### 5

`src/app`中是服务逻辑，自动根据文件路径进行路由。比如，URI为 `/console`的请求会被路由到 `src/app/console/page.tsx`，向客户端返回该页面的默认导出。非 `page.tsx`文件，除非使用动态路由指定，否则一般不会被路由。

在项目中，不会路由的文件最好统一存放到 `src/app/dependencies`中，以免引起混淆。
