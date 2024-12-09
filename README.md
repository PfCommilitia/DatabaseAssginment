# 社团活动管理系统

基于Next.js的社团活动管理系统。

## 运行项目

### 安装数据库

使用[PostgreSQL](#https://www.postgresql.org/)数据库，创建一个数据库和对应的用户。按照编号依次使用`SQL`文件夹的文件初始化模式。

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

### 配置环境变量

在项目根目录下创建 `.env`文件，填入以下内容。

```
DB_USER=用户名
DB_HOST=数据库地址
DB_NAME=数据库名称
DB_PASS=用户密码
DB_PORT=数据库监听端口
NEXTAUTH_SECRET=jwt密钥
NEXTAUTH_URL=网站完整URL，如http://localhost:3000或https://foo.bar.com
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

### （可选）使用反向代理提供HTTPS支持和公共网络访问

在生产环境中，禁止从公共网络使用HTTP协议访问此项目，因为HTTP流量为明文传输，安全性没有任何保证。

如需向公共网络使用此项目提供服务，必须前置反向代理以提供HTTPS支持。具体配置方式请参考使用的反向代理工具，推荐使用`Caddy`，此工具配置简单，带有自动HTTPS功能；次选`Nginx`，此工具需要进行更多配置，并手动申请和管理SSL证书，但功能更加强大。