# 08 - Docker 一键打包与线上部署

由于 Go 是一门**编译型静态语言**，它可以被直接打包成一个完全独立的二进制可执行文件。这意味着我们不再需要像 Node.js 部署时那样在线上服务器安装大堆的 NPM 环境，或者像 Java 一样受限于 JDK 环境了。

我们在服务器上部署 Go 应用可以说是所有语言里最爽的：构建、拷贝二进制文件、执行，完成。

但为了更标准的云原生持续交付，我们使用 **Docker 手工编写多阶段构建 Dockerfile** 是必经的实战。

## 1. 编写最佳实践 Dockerfile (Multi-stage Build)

我们在你项目的根目录建立一个文件名为 `Dockerfile` (无后缀)：

多阶段构建的核心思路：先开一个带好完整 Go 环境的大容器用于编译代码，最后把编译完纯净的系统二进制包扔进另一个只有 10MB 的极简系统发行镜像 (Alpine) 执行。

```dockerfile
# --------- 阶段 1：构建阶段 ---------
# 使用官方带有环境的 Go 镜像作为基础
FROM golang:1.21 AS builder

# 设置 Go 项目里的各个环境变量
ENV GO111MODULE=on \
    GOPROXY=https://goproxy.cn,direct \
    CGO_ENABLED=0 \
    GOOS=linux \
    GOARCH=amd64

# 在镜像里创建一个工作目录
WORKDIR /build

# 先把包清单 copy 进去（这样如果没有依赖改版，能复用 Docker 缓存）
COPY go.mod go.sum ./
RUN go mod download

# 把你所有的代码文件扔进去
COPY . .

# 编译成名为 "app" 的二进制可执行文件
# -ldflags="-s -w" 用来进一步剥去符号表，减小生成的二进制文件体积
RUN go build -ldflags="-s -w" -o app cmd/server/main.go


# --------- 阶段 2：运行阶段 ---------
# 从一个空系统（极简 Linux 发行版）起步！只有几 MB
FROM alpine:latest

# 解决系统时区问题和 HTTPS 证书问题
RUN apk --no-cache add ca-certificates tzdata
ENV TZ=Asia/Shanghai

WORKDIR /app

# 从刚才的 builder 镜像里，只把那个名为 app 的二进制文件拷过来
COPY --from=builder /build/app .
# 如果你有配置文件，也拷过来
COPY --from=builder /build/config/config.yaml ./config/config.yaml

# 使用非 root 用户运行，降低容器逃逸风险
RUN addgroup -S app && adduser -S app -G app
USER app

# 暴露给外部真实的端口
EXPOSE 8080

# 执行那个二进制文件启动你的服务！
CMD ["./app"]
```

## 2. 怎么玩转它？

这套 Dockerfile 你配好以后：
1. **打包：** 在你的项目目录跑 `docker build -t my-go-backend-v1 .`
   - 它会耗费几分钟完成所有步骤。你会发现最终打出来的镜像可能只有 20 MB！(对比动辄 500 MB 的 Node Server 令人感动)
2. **运行：** 测试刚才打包的镜像能否跑通
   - `docker run -d -p 8080:8080 my-go-backend-v1`
3. **部署：** 你可以将这个打包好的镜像直接 `docker push` 到阿里云或是公域（DockerHub）的镜像仓库中。然后你在真正的线上 CentOS/Ubuntu 生产服务器里，只需要敲一行命令 `docker pull` 拉下来启动即可！

## 3. 别忘了 `.dockerignore`
建议在项目根目录添加 `.dockerignore`，减少构建上下文体积：

```text
.git
.idea
*.log
tmp/
dist/
node_modules/
```

## 4. 健康检查与重启策略
线上容器建议添加健康检查（可在 Compose/K8s 配置）与重启策略，避免“进程假活着”。

## 为什么说 Go 是云原生时代的王储？

如果你用 Node.js 跑 PM2，或者写 Spring Boot，光是起步服务就得占用几百兆甚至半个 GB 物理内存。
但在 Go 下面，像刚才那种打包出来不仅极小的 Docker 镜像，刚跑起来内存占用可能仅仅不到 10 MB。这也是为何微服务架构以及 K8s 会如此偏爱 Go！
