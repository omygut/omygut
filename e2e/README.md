# E2E Testing with miniprogram-automator

This directory contains end-to-end tests for the MyGut WeChat mini program using [miniprogram-automator](https://developers.weixin.qq.com/miniprogram/dev/devtools/auto/).

## Prerequisites

1. **WeChat DevTools** must be installed on your machine
   - macOS: `/Applications/wechatwebdevtools.app`
   - Windows: `C:\Program Files (x86)\Tencent\微信web开发者工具`

2. **Enable automation in DevTools**
   - Open WeChat DevTools
   - Go to Settings > Security
   - Enable "Service Port" (服务端口)

3. **Build the project first**
   ```bash
   pnpm build
   ```

## Running Tests

```bash
pnpm test:e2e
```

## Test Cases

- **Home Page**: Verifies the main page loads correctly with title and menu items
- **Navigation**: Tests navigation from home to health records page
- **Add Health Record**: Tests the add record form UI elements
- **Records List**: Tests the health records list page

## Limitations

- Requires WeChat DevTools GUI (cannot run in headless mode)
- Only works on macOS and Windows
- CI integration requires special setup with virtual display

## Customizing DevTools Path

If your WeChat DevTools is installed in a non-standard location, you can specify the CLI path:

```typescript
await automator.launch({
  projectPath: './dist',
  cliPath: '/path/to/wechatwebdevtools/cli',
});
```
