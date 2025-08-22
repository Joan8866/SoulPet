# 🚀 Vercel 部署指南

## 🔐 環境變數設定

在 Vercel 專案設定中，需要設定以下環境變數：

### Lootex API 配置
```
LOOTEX_SECRET_KEY=sk-NQDYstnF4S1ZAzPKW-GscGJ2BsZL4D-NE6cKLHTVX9Y
LOOTEX_API_BASE=https://api.lootexplus.com
LOOTEX_CHAIN_ID=1868
LOOTEX_CONTRACT_ADDRESS=0xb5d1f4f52f1af704dc818d77a8a0c445b4e7f6cd
LOOTEX_PROJECT_WALLET_ADDRESS=0xFad9b94BAD9aDF7788B8302A4347A17C6f6e8Ac3
```

### Cloudinary 配置
```
CLOUDINARY_CLOUD_NAME=dsek8ctg1
CLOUDINARY_API_KEY=522784641652668
CLOUDINARY_API_SECRET=rh0872PaX7SHCuCKmdXWqyqyruI
```

### 公開資源配置
```
```

## 🔒 資安檢查清單

✅ **已完成的安全措施：**
- 敏感資訊已從程式碼中移除
- `.env.local` 已加入 `.gitignore`
- 所有 API keys 和 secrets 都使用環境變數
- 沒有硬編碼的敏感資訊

⚠️ **部署後建議：**
- 定期更換 API keys
- 監控 API 使用量
- 設定適當的 rate limiting
- 考慮使用 Vercel 的 Edge Functions 來保護 API routes

## 📝 部署步驟

1. 將專案推送到 GitHub
2. 在 Vercel 中連接 GitHub 專案
3. 設定上述環境變數
4. 部署專案

## 🌐 部署後功能

- 用戶可以完成 Soulpet 測驗
- 生成個人化的結果圖
- 圖片自動上傳到 Cloudinary
- 鑄造 NFT 到 SoulPet collection
- 提供 Biru 查看連結
