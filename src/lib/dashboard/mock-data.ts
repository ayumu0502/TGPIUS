export type MockAthlete = {
  id: string;
  name: string;
  sport: string;
  followers: string;
  avatarInitial: string;
};

export type MockEvent = {
  id: string;
  title: string;
  date: string;
  type: string;
  status: "受付中" | "満席" | "終了";
};

export type MockPost = {
  id: string;
  title: string;
  date: string;
  status: "公開中" | "下書き";
};

export type MockGift = {
  id: string;
  from: string;
  amount: number;
  date: string;
  message: string;
};

export type MockCampaign = {
  id: string;
  title: string;
  status: "進行中" | "募集中" | "完了";
  budget: string;
};

export type MockContract = {
  id: string;
  athlete: string;
  sport: string;
  period: string;
  amount: string;
};

export type MockMessage = {
  id: string;
  from: string;
  preview: string;
  time: string;
  unread: boolean;
};

export const supportedAthletes: MockAthlete[] = [
  { id: "1", name: "田中 翔", sport: "陸上競技", followers: "12.4K", avatarInitial: "田" },
  { id: "2", name: "佐藤 美咲", sport: "水泳", followers: "8.7K", avatarInitial: "佐" },
];

export const recommendedAthletes: MockAthlete[] = [
  { id: "3", name: "山本 健", sport: "ボクシング", followers: "15.2K", avatarInitial: "山" },
  { id: "4", name: "鈴木 彩", sport: "テニス", followers: "9.1K", avatarInitial: "鈴" },
  { id: "5", name: "高橋 蓮", sport: "バスケットボール", followers: "21.0K", avatarInitial: "高" },
  { id: "6", name: "伊藤 楓", sport: "体操", followers: "6.8K", avatarInitial: "伊" },
];

export const fanEvents: MockEvent[] = [
  { id: "1", title: "田中翔 ファンミーティング", date: "2026/07/15", type: "オンライン", status: "受付中" },
  { id: "2", title: "TGPLUS 応援フェス", date: "2026/07/22", type: "対面", status: "受付中" },
  { id: "3", title: "佐藤美咲 トークセッション", date: "2026/08/05", type: "オンライン", status: "満席" },
];

export const athletePosts: MockPost[] = [
  { id: "1", title: "大会前のメッセージ", date: "2026/07/01", status: "公開中" },
  { id: "2", title: "トレーニング日記 #24", date: "2026/06/28", status: "公開中" },
  { id: "3", title: "スポンサー向け活動報告", date: "2026/06/20", status: "下書き" },
];

export const giftHistory: MockGift[] = [
  { id: "1", from: "ファンA", amount: 500, date: "2026/07/02", message: "大会頑張って！" },
  { id: "2", from: "ファンB", amount: 1000, date: "2026/06/30", message: "いつも応援しています" },
  { id: "3", from: "ファンC", amount: 300, date: "2026/06/25", message: "次の試合楽しみに！" },
];

export const sponsorCampaigns: MockCampaign[] = [
  { id: "1", title: "夏季プロモーション", status: "進行中", budget: "¥500,000" },
  { id: "2", title: "新商品ローンチ", status: "募集中", budget: "¥800,000" },
  { id: "3", title: "SNSキャンペーン", status: "完了", budget: "¥300,000" },
];

export const sponsorContracts: MockContract[] = [
  { id: "1", athlete: "田中 翔", sport: "陸上競技", period: "2026/04 - 2027/03", amount: "¥1,200,000" },
  { id: "2", athlete: "佐藤 美咲", sport: "水泳", period: "2026/01 - 2026/12", amount: "¥900,000" },
];

export const sponsorMessages: MockMessage[] = [
  { id: "1", from: "田中 翔", preview: "案件の詳細についてご相談があります", time: "2時間前", unread: true },
  { id: "2", from: "TGPLUS サポート", preview: "請求書の発行が完了しました", time: "1日前", unread: false },
  { id: "3", from: "佐藤 美咲", preview: "契約更新の件、ご確認ください", time: "3日前", unread: false },
];

export const searchableAthletes: MockAthlete[] = [
  { id: "1", name: "田中 翔", sport: "陸上競技", followers: "12.4K", avatarInitial: "田" },
  { id: "2", name: "佐藤 美咲", sport: "水泳", followers: "8.7K", avatarInitial: "佐" },
  { id: "3", name: "山本 健", sport: "ボクシング", followers: "15.2K", avatarInitial: "山" },
  { id: "4", name: "鈴木 彩", sport: "テニス", followers: "9.1K", avatarInitial: "鈴" },
];
