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
};
