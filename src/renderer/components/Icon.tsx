import { 
  AlertTriangle,
  Box, 
  Check, 
  ChevronDown, 
  ChevronRight, 
  Clipboard, 
  Download, 
  Edit, 
  HelpCircle, 
  MessageCircle, 
  MessageSquare, 
  MoreVertical, 
  Pencil,
  Plus, 
  RefreshCw, 
  Send, 
  Settings, 
  User, 
  Waves, 
  X, 
  Zap,
  ArrowDown,
  Lightbulb
} from "lucide-react";
import React, { ReactElement } from "react";

export enum IconName {
  AI = "ai",
  AlertTriangle = "alert-triangle",
  ArrowDown = "arrow-down",
  Box = "box",
  CaretDown = "caret-down",
  Cancel = "cancel",
  Chat = "chat",
  Check = "check",
  ChevronDown = "chevron-down",
  ChevronRight = "chevron-right",
  Clipboard = "clipboard",
  Close = "close",
  Download = "download",
  Edit = "edit",
  Help = "help",
  Lightbulb = "lightbulb",
  Logo = "logo",
  Message = "message",
  More = "more",
  Pencil = "pencil",
  Plus = "plus",
  Refresh = "refresh",
  Ripple = "ripple",
  Ripples = "ripples",
  Send = "send",
  Settings = "settings",
  User = "user",
  Wave = "wave",
  Zap = "zap"
}

interface IconProps {
  name: IconName;
  className?: string;
  size?: number;
  color?: string;
}

export const Icon = ({ name, className = "", size = 24, color = "currentColor" }: IconProps): ReactElement => {
  const iconProps = {
    className,
    width: size,
    height: size,
    color
  };

  switch (name) {
    case IconName.AI:
      return <MessageSquare {...iconProps} />;
    case IconName.AlertTriangle:
      return <AlertTriangle {...iconProps} />;
    case IconName.ArrowDown:
      return <ArrowDown {...iconProps} />;
    case IconName.Box:
      return <Box {...iconProps} />;
    case IconName.CaretDown:
      return <ChevronDown {...iconProps} />;
    case IconName.Cancel:
      return <X {...iconProps} />;
    case IconName.Chat:
      return <MessageCircle {...iconProps} />;
    case IconName.Check:
      return <Check {...iconProps} />;
    case IconName.ChevronDown:
      return <ChevronDown {...iconProps} />;
    case IconName.ChevronRight:
      return <ChevronRight {...iconProps} />;
    case IconName.Clipboard:
      return <Clipboard {...iconProps} />;
    case IconName.Close:
      return <X {...iconProps} />;
    case IconName.Download:
      return <Download {...iconProps} />;
    case IconName.Edit:
      return <Edit {...iconProps} />;
    case IconName.Help:
      return <HelpCircle {...iconProps} />;
    case IconName.Lightbulb:
      return <Lightbulb {...iconProps} />;
    case IconName.Logo:
      return <MessageSquare {...iconProps} />;
    case IconName.Message:
      return <MessageCircle {...iconProps} />;
    case IconName.More:
      return <MoreVertical {...iconProps} />;
    case IconName.Pencil:
      return <Pencil {...iconProps} />;
    case IconName.Plus:
      return <Plus {...iconProps} />;
    case IconName.Refresh:
      return <RefreshCw {...iconProps} />;
    case IconName.Ripple:
      return <RefreshCw {...iconProps} />;
    case IconName.Ripples:
      return <Waves {...iconProps} />;
    case IconName.Send:
      return <Send {...iconProps} />;
    case IconName.Settings:
      return <Settings {...iconProps} />;
    case IconName.User:
      return <User {...iconProps} />;
    case IconName.Wave:
      return <Waves {...iconProps} />;
    case IconName.Zap:
      return <Zap {...iconProps} />;
    default:
      return <Box {...iconProps} />;
  }
};

export default Icon;
