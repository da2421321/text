import PptxGenJS from "pptxgenjs";

const pptx = new PptxGenJS();
pptx.author = "AutoGen";
pptx.company = "Shopping Project";
pptx.title = "RESTful API 设计";
pptx.subject = "原则、规范与最佳实践";

const themeColor = "0088CC";

function addTitleSlide(title, subtitle) {
  const slide = pptx.addSlide();
  slide.addText(title, { x: 1.0, y: 1.2, fontSize: 40, bold: true, color: themeColor });
  if (subtitle) {
    slide.addText(subtitle, { x: 1.0, y: 2.0, fontSize: 20, color: "666666" });
  }
}

function addBulletsSlide(title, bullets) {
  const slide = pptx.addSlide();
  slide.addText(title, { x: 0.8, y: 0.6, fontSize: 28, bold: true, color: themeColor });
  slide.addText(
    bullets.map((t) => `• ${t}`).join("\n"),
    { x: 0.9, y: 1.3, fontSize: 18, color: "333333", lineSpacing: 18 }
  );
}

addTitleSlide("RESTful API 设计", "原则、规范与最佳实践");

addBulletsSlide("什么是 REST", [
  "Representational State Transfer",
  "以资源为中心，使用统一接口",
  "无状态通信、可缓存、分层系统",
]);

addBulletsSlide("资源与路径设计", [
  "名词复数：/users, /orders",
  "层级关系：/users/{id}/orders",
  "避免动词：操作由 HTTP 方法表达",
]);

addBulletsSlide("HTTP 方法语义", [
  "GET：读取（安全、幂等）",
  "POST：创建/触发动作（非幂等）",
  "PUT：整体更新（幂等）、PATCH：部分更新",
  "DELETE：删除（幂等）",
]);

addBulletsSlide("状态码与响应", [
  "200/201/204 成功类",
  "400/401/403/404/409/422/429 客户端错误",
  "5xx 服务器错误",
  "统一响应结构：code/message/data",
]);

addBulletsSlide("请求规范与分页", [
  "Content-Type: application/json",
  "筛选/排序：?status=active&sort=-created_at",
  "分页：page/page_size 或 cursor",
  "时间：ISO8601 UTC",
]);

addBulletsSlide("幂等性与一致性", [
  "Idempotency-Key 防重复",
  "冲突：409 处理并给出重试建议",
  "最终一致性与重试策略",
]);

addBulletsSlide("认证与授权", [
  "Bearer JWT / OAuth2",
  "最小权限：RBAC/ABAC",
  "HTTPS 强制，敏感信息不入日志",
]);

addBulletsSlide("版本控制与兼容", [
  "路径版本：/v1",
  "Header 版本：Accept: ...;version=1",
  "Deprecation 流程与迁移窗口",
]);

addBulletsSlide("文档与可观测性", [
  "OpenAPI/Swagger",
  "示例与 Schema 校验",
  "RPS/错误率/延迟 指标与审计",
]);

addBulletsSlide("安全与速率限制", [
  "限流/节流/验证码",
  "输入校验/CORS/防注入",
  "数据脱敏与审计日志",
]);

await pptx.writeFile({ fileName: "RESTful-API-Design.pptx" });
console.log("生成成功: RESTful-API-Design.pptx");


















