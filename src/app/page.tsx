import {
  Box,
  Button,
  Typography
} from "@mui/material";
import { getServerSession } from "next-auth";

function LoginButton() {
  return (
    <Button
      variant = "contained"
      color = "info"
      sx = { {
        marginLeft: "auto"
      } }
    >
      <Typography
        sx = { {
          color: "primary.contrastText"
        } }
      >
        󰍂 用户登录
      </Typography>
    </Button>
  );
}

function ConsoleButton() {
  return (
    <Box
      sx = { {
        display: "flex",
        marginLeft: "auto",
      } }
    >
      <Button
        variant = "text"
        color = "info"
      >
        <Typography
          variant = "h4"
          sx = { {
            color: "primary.contrastText"
          } }
        >
          󰀉
        </Typography>
      </Button>
      <Button
        variant = "contained"
        color = "info"
      >
        <Typography
          sx = { {
            color: "primary.contrastText"
          } }
        >
          󰆍 控制台
        </Typography>
      </Button>
    </Box>
  );
}


function TopLeftButton({ session }: {
  session: Awaited<ReturnType<typeof getServerSession>>
}) {
  return (
    <Box
      sx = { {
        display: "flex",
        minWidth: "100%",
        minHeight: "6vh",
        maxHeight: "6vh",
      } }
    >
      { session ? <ConsoleButton/> : <LoginButton/> }
    </Box>
  );
}

export default async function Home() {
  const session = await getServerSession();

  return (
    <Box
      sx = { {
        alignItems: "center",
        justifyItems: "center",
        minWidth: "100%",
        minHeight: "100vh",
      } }
    >
      <Box
        component = "header"
        sx = { {
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          bgcolor: "primary.dark",
          minWidth: "100%",
          minHeight: "10vh",
          maxHeight: "10vh",
        } }
      >
        <TopLeftButton session = { session }/>
      </Box>
      <Box
        sx = { {
          display: "grid",
          alignItems: "center",
          justifyItems: "center",
          bgcolor: "primary.main",
          minWidth: "100%",
          minHeight: "80vh",
        } }
      >
        <Box
          component = "main"
          sx = { {
            display: "flex",
            alignItems: "center",
            flexDirection: "column",
            width: "100%"
          } }
        >
          <Typography
            variant = "h1"
            sx = { {
              color: "primary.contrastText",
              paddingY: "0.1em"
            } }
          >
            你好，
            <Box
              component = "code"
            >
              Next.js
            </Box>
            ！
          </Typography>
          <Typography
            variant = "h5"
            sx = { {
              color: "primary.contrastText",
              paddingY: "0.1em",
              textAlign: "center"
            } }
          >
            <Box
              component = "code"
            >
              Next.js
            </Box>
            是一个支持服务端渲染和静态网站生成的
            <Box
              component = "code"
            >
              React
            </Box>
            组件。<br/>
            此页面由
            <Box
              component = "code"
            >
              Next.js
            </Box>
            生成。
          </Typography>
        </Box>
      </Box>
      <Box
        component = "footer"
        sx = { {
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "primary.dark",
          minWidth: "100%",
          minHeight: "10vh",
          maxHeight: "10vh",
        } }
      >
        <Typography
          sx = { {
            color: "primary.contrastText",
            paddingY: "0.1em",
            textAlign: "center"
          } }
        >
           2024
        </Typography>
      </Box>
    </Box>
  );
}
