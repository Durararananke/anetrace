# AneTrace

AneTrace 是一个轻量、开源的术中病例回放与教学标注工具。它把公开匿名的真实监护趋势放进可交互时间轴，让学习者先盲读未来数据，再回答趋势识别问题，并在任意时间点留下本地教学标注。

> **仅用于教学与研究。** AneTrace 不是医疗设备，不提供诊断、风险预测、给药剂量或处置建议，不得用于临床决策。

## 现在能做什么

- 回放 5 个 VitalDB 真实匿名病例的 HR、MAP、SpO₂、EtCO₂、BIS 趋势。
- 以 30×–240× 速度播放、跳转和重置时间轴。
- “盲读未来”模式隐藏尚未发生的信号，适合课堂推演。
- 在关键趋势处自动暂停并提问；所有自动题目均显示“待专业审核”。
- 在任意时间点记录观察、讨论问题和教学点。
- 标注只存于浏览器本地，可导入或导出 JSON，不上传服务器。
- 响应式界面、PWA 清单和基础离线缓存；无需后端、账号或数据库。

## 快速开始

需要 Node.js 20.15 或更高版本。

```bash
npm install
npm run dev
```

生产构建与本地预览：

```bash
npm run build
npm run preview
```

## 数据来源与生成

演示数据来自 [VitalDB v1.0.0（PhysioNet）](https://physionet.org/content/vitaldb/1.0.0/)，许可证为 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)。代码许可证与病例数据许可证不同，详见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。

`public/cases/cases.json` 是可直接部署的静态病例包。要从 VitalDB 官方 API 重新构建：

```bash
python scripts/build_vitaldb_cases.py
```

生成脚本会：

1. 获取病例目录和监护轨道；
2. 仅保留预设的匿名病例编号；
3. 对监护值做基本生理范围过滤并按 10 秒采样；
4. 将年龄转换为十年区间；
5. 生成仅描述信号变化、明确待专业审核的教学题目。

它不会推断诊断，也不会生成治疗建议。若用于正式课程，麻醉专业人员必须审核病例选择、题目、答案与讲解。

## 项目结构

```text
src/components/                 回放、趋势图、题目与标注界面
src/lib/                        数据加载、格式化与本地存储
public/cases/cases.json         构建后的静态病例包
scripts/build_vitaldb_cases.py  VitalDB 数据构建脚本
public/sw.js                    基础离线缓存
```

## 质量检查

```bash
npm run lint
npm test
npm run build
```

## 发布到你自己的 GitHub 仓库

本项目当前没有配置远程仓库。新建一个空 GitHub 仓库后执行：

```bash
git remote add origin https://github.com/<你的账号>/<仓库名>.git
git push -u origin main
```

贡献前请阅读 [CONTRIBUTING.md](CONTRIBUTING.md)。代码使用 [MIT](LICENSE) 许可证。
