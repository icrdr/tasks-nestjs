import { Settings as LayoutSettings } from '@ant-design/pro-layout';

export interface currentUser {
  avatar?: string;
  name?: string;
  title?: string;
  group?: string;
  signature?: string;
  tags?: {
    key: string;
    label: string;
  }[];
  userid?: string;
  access?: 'user' | 'guest' | 'admin';
  unreadCount?: number;
}

export interface initialState {
  settings?: LayoutSettings;
  currentUser?: currentUser;
}
