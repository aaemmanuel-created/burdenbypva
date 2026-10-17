// Route param map for the BURDEN-native stack.
import type { NavigatorScreenParams } from '@react-navigation/native';

export type TabParamList = {
  Home: undefined;
  Discover: undefined;
  Giving: undefined;
  About: undefined;
};

export type RootStackParamList = {
  Tabs: NavigatorScreenParams<TabParamList>;
  Campaign: { campaignId: string };
  Give: { campaignId: string };
  // giftId from inside the app; gift + t when the payment server sends
  // the donor back via burden://gift?gift=<id>&t=<token>.
  Gift: { giftId?: string; gift?: string; t?: string };
};
