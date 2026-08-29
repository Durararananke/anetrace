# Contributing

感谢参与 AneTrace。提交代码前，请运行：

```bash
npm install
npm run lint
npm test
npm run build
```

## 医学内容边界

- 不得把本项目描述为医疗设备或临床决策工具。
- 不得加入患者可识别信息。
- 新增病例时须记录数据集、版本、许可证、原始病例编号和采样方式。
- 自动生成的题目必须保持 `needs-expert-review`，直到具备相应资质的专业人员完成内容审核。
- 病例题目只应训练趋势观察与复盘，不应提供诊断结论、用药剂量或治疗指令。

## 代码约定

- 保持无后端的轻量架构；引入新依赖前说明必要性。
- UI 文案优先使用明确、可审计的表述。
- 功能变更应附带测试；数据生成逻辑必须可复现。
- 提交信息使用 conventional commits，例如 `feat(replay): add event filters`。
