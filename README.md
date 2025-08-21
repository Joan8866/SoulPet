# Soulpet Quiz & NFT Mint

一個有趣的心理測驗 Web App，測驗結果可用 Lootex Plus API 鑄造成 NFT。

## 🎯 專案特色

- **心理測驗**: 8 個精心設計的問題，揭示你的靈魂動物
- **NFT 鑄造**: 測驗結果可鑄造成獨特的 NFT
- **現代 UI**: 活潑、色彩溫暖、簡單線條插畫風格
- **響應式設計**: 支援各種裝置尺寸

## 🚀 快速開始

### 安裝依賴
```bash
npm install
```

### 開發模式
```bash
npm run dev
```

開啟 [http://localhost:3000](http://localhost:3000) 查看結果。

## 📋 用戶流程

1. **首頁**: 輸入名稱開始測驗
2. **測驗**: 回答 8 個問題，每題 4 個選項
3. **結果**: 獲得靈魂動物結果
4. **鑄造**: 輸入錢包地址鑄造 NFT

## 🐾 靈魂動物

測驗結果會對應到以下 8 種動物之一：
- Cat (貓)
- Dog (狗)
- Rabbit (兔子)
- Fox (狐狸)
- Owl (貓頭鷹)
- Dolphin (海豚)
- Panda (熊貓)
- Tiger (老虎)

## 🖼 圖片需求

請將 8 張動物插畫圖片放置在以下路徑：
```
public/assets/animals/
├── Cat.png
├── Dog.png
├── Rabbit.png
├── Fox.png
├── Owl.png
├── Dolphin.png
├── Panda.png
└── Tiger.png
```

## 🔧 API 整合

專案包含兩個 API routes，需要您實作 Lootex Plus API 整合：

### `/api/upload-metadata`
- 上傳 NFT metadata
- 包含 name、description、image URL、attributes

### `/api/mint`
- 鑄造 NFT 到指定錢包
- 使用上傳的 metadata URI

## 📁 專案結構

```
src/
├── app/
│   ├── page.tsx              # 首頁 (名稱輸入)
│   ├── quiz/
│   │   └── page.tsx          # 測驗頁面
│   ├── result/
│   │   └── page.tsx          # 結果頁面
│   └── api/
│       ├── upload-metadata/
│       │   └── route.ts      # 上傳 metadata API
│       └── mint/
│           └── route.ts      # 鑄造 NFT API
public/
└── assets/
    └── animals/              # 動物圖片目錄
```

## 🎨 技術棧

- **Next.js 14** - React 框架
- **TypeScript** - 型別安全
- **Tailwind CSS** - 樣式框架
- **App Router** - Next.js 13+ 路由系統

## 📝 測驗題目

1. What's your ideal weekend activity? → Hiking / Reading / Party / Napping
2. Pick a snack: → Cheese / Berries / Chips / Sushi
3. Your favorite weather: → Sunny / Rainy / Snowy / Cloudy
4. If you had a superpower, it would be: → Flying / Invisibility / Super strength / Time travel
5. Pick a color: → Blue / Pink / Green / Yellow
6. How do you handle stress? → Exercise / Talk to friends / Listen to music / Sleep
7. What's your morning vibe? → Energetic / Calm / Slow / Moody
8. Pick a travel destination: → Mountains / Beach / City / Forest

## 🔢 結果計算

根據使用者選擇計算結果 index（將每個選項的 index 相加 mod 8），對應到動物列表：
- 0 → Cat
- 1 → Dog
- 2 → Rabbit
- 3 → Fox
- 4 → Owl
- 5 → Dolphin
- 6 → Panda
- 7 → Tiger

## 🚀 部署

```bash
npm run build
npm start
```

## 📄 授權

MIT License
