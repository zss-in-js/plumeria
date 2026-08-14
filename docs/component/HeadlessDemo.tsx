'use client';

import * as React from 'react';
import * as css from '@plumeria/core';
import {
  Dialog,
  Popover,
  Tooltip,
  Accordion,
  Tabs,
  Collapsible,
  DropdownMenu,
  Select,
  Checkbox,
  Switch,
  RadioGroup,
  Slider,
  ContextMenu,
  Menubar,
  NavigationMenu,
  Toast,
  Toggle,
  ToggleGroup,
  ScrollArea,
  AlertDialog,
} from '@plumeria/headlessui';
import { theme } from 'lib/theme';
import { pseudos } from 'lib/pseudos';

const styles = css.create({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    maxWidth: '480px',
    padding: '24px',
    margin: '24px auto',
    background: theme.cardBg,
    borderColor: theme.cardBorder,
    borderStyle: 'solid',
    borderWidth: '1.5px',
    borderRadius: '12px',
    boxShadow: theme.cardShadow,
  },
  sectionTitle: {
    margin: '0 0 12px 0',
    fontSize: '16px',
    fontWeight: '700',
    color: theme.textPrimary,
  },
  button: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#fff',
    cursor: 'pointer',
    backgroundColor: theme.plumeAccent,
    borderColor: 'currentColor',
    borderStyle: 'none',
    borderWidth: 'medium',
    borderRadius: '6px',
    transition: 'opacity 0.2s',
    [pseudos.hover]: {
      opacity: 0.9,
    },
  },
  dialogOverlay: {
    position: 'fixed',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 50,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  dialogContent: {
    position: 'fixed',
    top: '50%',
    left: '50%',
    zIndex: 51,
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    width: '90vw',
    maxWidth: '420px',
    padding: '24px',
    background: theme.dropdownBg,
    borderColor: theme.cardBorder,
    borderStyle: 'solid',
    borderWidth: '1px',
    borderRadius: '12px',
    boxShadow: theme.cardShadow,
    transform: 'translate(-50%, -50%)',
  },
  dialogTitle: {
    margin: 0,
    fontSize: '18px',
    fontWeight: '700',
    color: theme.textPrimary,
  },
  dialogDescription: {
    margin: 0,
    fontSize: '14px',
    lineHeight: 1.5,
    color: theme.textSecondary,
  },
  dialogClose: {
    alignSelf: 'flex-end',
    padding: '6px 14px',
    fontSize: '13px',
    fontWeight: '600',
    color: theme.textPrimary,
    cursor: 'pointer',
    backgroundColor: theme.iconBg,
    borderColor: theme.cardBorder,
    borderStyle: 'solid',
    borderWidth: '1px',
    borderRadius: '6px',
    transition: 'opacity 0.2s',
    [pseudos.hover]: {
      opacity: 0.85,
    },
  },
  popoverContent: {
    zIndex: 50,
    width: '240px',
    padding: '14px',
    fontSize: '13.5px',
    color: theme.textSecondary,
    background: theme.dropdownBg,
    borderColor: theme.cardBorder,
    borderStyle: 'solid',
    borderWidth: '1px',
    borderRadius: '8px',
    boxShadow: theme.cardShadow,
  },
  popoverClose: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    padding: '2px 6px',
    fontSize: '12px',
    color: theme.textMuted,
    cursor: 'pointer',
    backgroundColor: 'transparent',
    borderColor: 'currentColor',
    borderStyle: 'none',
    borderWidth: 'medium',
    [pseudos.hover]: {
      color: theme.textPrimary,
    },
  },
  popoverArrow: {
    fill: theme.dropdownBg,
  },
  tooltipContent: {
    zIndex: 50,
    padding: '6px 12px',
    fontSize: '12px',
    color: theme.dropdownBg,
    background: theme.textPrimary,
    borderRadius: '6px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
  },
  tooltipArrow: {
    fill: '#18181b',
  },
  accordionRoot: {
    width: '100%',
    overflow: 'hidden',
    background: theme.dropdownBg,
    borderColor: theme.cardBorder,
    borderStyle: 'solid',
    borderWidth: '1px',
    borderRadius: '8px',
  },
  accordionItem: {
    borderBottomColor: theme.cardBorder,
    borderBottomStyle: 'solid',
    borderBottomWidth: '1px',
    [':last-child']: {
      borderBottomColor: 'currentColor',
      borderBottomStyle: 'none',
      borderBottomWidth: 'medium',
    },
  },
  accordionHeader: {
    display: 'flex',
    margin: 0,
  },
  accordionTrigger: {
    display: 'flex',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 18px',
    fontSize: '14px',
    fontWeight: '600',
    color: theme.textPrimary,
    textAlign: 'left',
    cursor: 'pointer',
    backgroundColor: 'transparent',
    borderColor: 'currentColor',
    borderStyle: 'none',
    borderWidth: 'medium',
    transition: 'background-color 0.2s',
    [pseudos.hover]: {
      backgroundColor: 'rgba(100, 100, 100, 0.05)',
    },
  },
  accordionContent: {
    padding: '14px 18px',
    fontSize: '13.5px',
    color: theme.textSecondary,
    backgroundColor: 'rgba(100, 100, 100, 0.02)',
    borderTopColor: theme.cardBorder,
    borderTopStyle: 'solid',
    borderTopWidth: '1px',
  },
  tabsRoot: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    overflow: 'hidden',
    background: theme.dropdownBg,
    borderColor: theme.cardBorder,
    borderStyle: 'solid',
    borderWidth: '1px',
    borderRadius: '8px',
  },
  tabsList: {
    display: 'flex',
    backgroundColor: 'rgba(100, 100, 100, 0.03)',
    borderBottomColor: theme.cardBorder,
    borderBottomStyle: 'solid',
    borderBottomWidth: '1px',
  },
  tabsTrigger: {
    flex: 1,
    padding: '12px',
    fontSize: '13.5px',
    fontWeight: '600',
    color: theme.textSecondary,
    cursor: 'pointer',
    backgroundColor: 'transparent',
    borderColor: 'currentColor',
    borderStyle: 'none',
    borderWidth: 'medium',
    borderBottomColor: 'transparent',
    borderBottomStyle: 'solid',
    borderBottomWidth: '2px',
    transition: 'all 0.2s',
    [pseudos.hover]: {
      color: theme.textPrimary,
      backgroundColor: 'rgba(100, 100, 100, 0.05)',
    },
    ['[data-state="active"]']: {
      color: theme.plumeAccent,
      borderBottomColor: theme.plumeAccent,
      borderBottomStyle: 'solid',
      borderBottomWidth: '2px',
    },
  },
  tabsContent: {
    padding: '16px',
    fontSize: '13.5px',
    color: theme.textSecondary,
  },
  collapsibleRoot: {
    width: '100%',
    padding: '16px',
    background: theme.dropdownBg,
    borderColor: theme.cardBorder,
    borderStyle: 'solid',
    borderWidth: '1px',
    borderRadius: '8px',
  },
  collapsibleHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  collapsibleLabel: {
    fontSize: '14px',
    fontWeight: '500',
    color: theme.textPrimary,
  },
  collapsibleTrigger: {
    padding: '8px 14px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#fff',
    cursor: 'pointer',
    backgroundColor: theme.plumeAccent,
    borderColor: 'currentColor',
    borderStyle: 'none',
    borderWidth: 'medium',
    borderRadius: '6px',
    transition: 'opacity 0.2s',
    [pseudos.hover]: {
      opacity: 0.9,
    },
  },
  collapsibleContent: {
    padding: '12px',
    marginTop: '12px',
    fontSize: '13.5px',
    color: theme.textSecondary,
    backgroundColor: 'rgba(100, 100, 100, 0.02)',
    borderColor: theme.cardBorder,
    borderStyle: 'solid',
    borderWidth: '1px',
    borderRadius: '6px',
  },
  checkboxContainer: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  checkboxRoot: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '20px',
    height: '20px',
    cursor: 'pointer',
    backgroundColor: theme.dropdownBg,
    borderColor: theme.cardBorder,
    borderStyle: 'solid',
    borderWidth: '1.5px',
    borderRadius: '4px',
    transition: 'border-color 0.2s',
    [pseudos.hover]: {
      borderColor: theme.plumeAccent,
    },
    ['[data-state="checked"]']: {
      backgroundColor: theme.plumeAccent,
      borderColor: theme.plumeAccent,
    },
  },
  checkboxIndicator: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    fontSize: '10px',
    fontWeight: 'bold',
    color: '#fff',
  },
  checkboxLabel: {
    fontSize: '14px',
    color: theme.textSecondary,
    cursor: 'pointer',
  },
  switchContainer: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  switchRoot: {
    position: 'relative',
    width: '42px',
    height: '24px',
    cursor: 'pointer',
    backgroundColor: theme.cardBorder,
    borderColor: 'currentColor',
    borderStyle: 'none',
    borderWidth: 'medium',
    borderRadius: '9999px',
    transition: 'background-color 0.2s',
    ['[data-state="checked"]']: {
      backgroundColor: theme.plumeAccent,
    },
  },
  switchThumb: {
    display: 'block',
    width: '20px',
    height: '20px',
    backgroundColor: '#fff',
    borderRadius: '9999px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    transform: 'translateX(2px)',
    transition: 'transform 0.2s',
    ['[data-state="checked"]']: {
      transform: 'translateX(20px)',
    },
  },
  radioGroupRoot: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  radioGroupContainer: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  radioGroupItem: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '20px',
    height: '20px',
    cursor: 'pointer',
    backgroundColor: theme.dropdownBg,
    borderColor: theme.cardBorder,
    borderStyle: 'solid',
    borderWidth: '1.5px',
    borderRadius: '50%',
    transition: 'border-color 0.2s',
    [pseudos.hover]: {
      borderColor: theme.plumeAccent,
    },
    ['[data-state="checked"]']: {
      borderColor: theme.plumeAccent,
    },
  },
  radioGroupIndicator: {
    display: 'block',
    width: '10px',
    height: '10px',
    backgroundColor: theme.plumeAccent,
    borderRadius: '50%',
  },
  sliderRoot: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    height: '20px',
    touchAction: 'none',
    userSelect: 'none',
  },
  sliderTrack: {
    position: 'relative',
    flexGrow: 1,
    height: '4px',
    backgroundColor: theme.cardBorder,
    borderRadius: '9999px',
  },
  sliderRange: {
    position: 'absolute',
    height: '100%',
    backgroundColor: theme.plumeAccent,
    borderRadius: '9999px',
  },
  sliderThumb: {
    display: 'block',
    width: '20px',
    height: '20px',
    cursor: 'pointer',
    backgroundColor: '#fff',
    borderColor: theme.plumeAccent,
    borderStyle: 'solid',
    borderWidth: '2px',
    borderRadius: '10px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    [pseudos.hover]: {
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
    },
  },
  selectTrigger: {
    display: 'inline-flex',
    gap: '8px',
    alignItems: 'center',
    justifyContent: 'space-between',
    minWidth: '120px',
    padding: '8px 12px',
    fontSize: '13px',
    fontWeight: '500',
    color: theme.textPrimary,
    cursor: 'pointer',
    backgroundColor: theme.dropdownBg,
    borderColor: theme.cardBorder,
    borderStyle: 'solid',
    borderWidth: '1.5px',
    borderRadius: '6px',
    [pseudos.hover]: {
      borderColor: theme.plumeAccent,
    },
  },
  selectContent: {
    zIndex: 50,
    overflow: 'hidden',
    backgroundColor: theme.dropdownBg,
    borderColor: theme.cardBorder,
    borderStyle: 'solid',
    borderWidth: '1px',
    borderRadius: '6px',
    boxShadow: theme.cardShadow,
  },
  selectViewport: {
    padding: '4px',
  },
  selectItem: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '6px 24px 6px 12px',
    fontSize: '13px',
    color: theme.textSecondary,
    cursor: 'pointer',
    userSelect: 'none',
    borderRadius: '4px',
    ['[data-highlighted]']: {
      color: theme.textPrimary,
      outline: 'none',
      backgroundColor: 'rgba(100, 100, 100, 0.08)',
    },
  },
  selectItemIndicator: {
    position: 'absolute',
    right: '6px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '10px',
  },
  dropdownMenuContent: {
    zIndex: 50,
    minWidth: '160px',
    padding: '4px',
    backgroundColor: theme.dropdownBg,
    borderColor: theme.cardBorder,
    borderStyle: 'solid',
    borderWidth: '1px',
    borderRadius: '6px',
    boxShadow: theme.cardShadow,
  },
  dropdownMenuItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '6px 8px',
    fontSize: '13px',
    color: theme.textSecondary,
    cursor: 'pointer',
    userSelect: 'none',
    outline: 'none',
    borderRadius: '4px',
    ['[data-highlighted]']: {
      color: theme.textPrimary,
      backgroundColor: 'rgba(100, 100, 100, 0.08)',
    },
  },
  dropdownMenuSeparator: {
    height: '1px',
    margin: '4px 0',
    backgroundColor: theme.cardBorder,
  },
  menubarRoot: {
    display: 'flex',
    gap: '4px',
    padding: '4px',
    backgroundColor: theme.dropdownBg,
    borderColor: theme.cardBorder,
    borderStyle: 'solid',
    borderWidth: '1px',
    borderRadius: '6px',
  },
  menubarTrigger: {
    padding: '6px 10px',
    fontSize: '13px',
    fontWeight: '500',
    color: theme.textSecondary,
    cursor: 'pointer',
    outline: 'none',
    backgroundColor: 'transparent',
    borderColor: 'currentColor',
    borderStyle: 'none',
    borderWidth: 'medium',
    borderRadius: '4px',
    ['[data-state="open"]']: {
      color: theme.textPrimary,
      backgroundColor: 'rgba(100, 100, 100, 0.08)',
    },
  },
  navigationMenuRoot: {
    position: 'relative',
    zIndex: 10,
    display: 'flex',
    justifyContent: 'center',
    width: '100%',
  },
  navigationMenuList: {
    display: 'flex',
    gap: '6px',
    justifyContent: 'center',
    padding: '4px',
    margin: 0,
    listStyle: 'none',
    backgroundColor: theme.dropdownBg,
    borderColor: theme.cardBorder,
    borderStyle: 'solid',
    borderWidth: '1px',
    borderRadius: '6px',
  },
  navigationMenuTrigger: {
    display: 'inline-flex',
    gap: '4px',
    alignItems: 'center',
    padding: '8px 12px',
    fontSize: '13px',
    fontWeight: '500',
    color: theme.textSecondary,
    cursor: 'pointer',
    outline: 'none',
    backgroundColor: 'transparent',
    borderColor: 'currentColor',
    borderStyle: 'none',
    borderWidth: 'medium',
    borderRadius: '4px',
    [pseudos.hover]: {
      color: theme.textPrimary,
    },
  },
  navigationMenuContent: {
    position: 'absolute',
    top: '100%',
    left: 0,
    boxSizing: 'border-box',
    minWidth: '220px',
    padding: '16px',
    marginTop: '6px',
    backgroundColor: theme.dropdownBg,
    borderColor: theme.cardBorder,
    borderStyle: 'solid',
    borderWidth: '1px',
    borderRadius: '6px',
    boxShadow: theme.cardShadow,
  },
  navigationMenuLink: {
    display: 'block',
    padding: '6px 8px',
    fontSize: '13.5px',
    color: theme.textSecondary,
    textDecoration: 'none',
    borderRadius: '4px',
    [pseudos.hover]: {
      color: theme.textPrimary,
      backgroundColor: 'rgba(100, 100, 100, 0.05)',
    },
  },
  toastViewport: {
    position: 'fixed',
    right: 0,
    bottom: 0,
    zIndex: 9999,
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    width: '390px',
    maxWidth: '100vw',
    padding: '24px',
    margin: 0,
    outline: 'none',
    listStyle: 'none',
  },
  toastRoot: {
    display: 'grid',
    gridTemplateAreas: '"title action" "description action"',
    gridTemplateColumns: 'auto max-content',
    columnGap: '15px',
    alignItems: 'center',
    padding: '16px',
    backgroundColor: theme.dropdownBg,
    borderColor: theme.cardBorder,
    borderStyle: 'solid',
    borderWidth: '1px',
    borderRadius: '8px',
    boxShadow: theme.cardShadow,
    ['[data-state="open"]']: {
      animation: 'slideIn 150ms cubic-bezier(0.16, 1, 0.3, 1)',
    },
  },
  toastTitle: {
    gridArea: 'title',
    fontSize: '14px',
    fontWeight: '600',
    color: theme.textPrimary,
  },
  toastDescription: {
    gridArea: 'description',
    margin: 0,
    fontSize: '13px',
    lineHeight: 1.3,
    color: theme.textSecondary,
  },
  toastCloseButton: {
    gridArea: 'action',
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: '600',
    color: theme.textPrimary,
    cursor: 'pointer',
    backgroundColor: theme.iconBg,
    borderColor: theme.cardBorder,
    borderStyle: 'solid',
    borderWidth: '1px',
    borderRadius: '4px',
    transition: 'opacity 0.2s',
    [pseudos.hover]: {
      opacity: 0.85,
    },
  },
  toggleRoot: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: '600',
    color: theme.textSecondary,
    cursor: 'pointer',
    backgroundColor: theme.dropdownBg,
    borderColor: theme.cardBorder,
    borderStyle: 'solid',
    borderWidth: '1.5px',
    borderRadius: '6px',
    transition: 'all 0.2s',
    [pseudos.hover]: {
      backgroundColor: 'rgba(100, 100, 100, 0.05)',
    },
    ['[data-state="on"]']: {
      color: '#fff',
      backgroundColor: theme.plumeAccent,
      borderColor: theme.plumeAccent,
    },
  },
  toggleGroupRoot: {
    display: 'inline-flex',
    gap: '0px',
    overflow: 'hidden',
    backgroundColor: theme.dropdownBg,
    borderColor: theme.cardBorder,
    borderStyle: 'solid',
    borderWidth: '1px',
    borderRadius: '6px',
  },
  toggleGroupItem: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: '600',
    color: theme.textSecondary,
    cursor: 'pointer',
    backgroundColor: 'transparent',
    borderColor: 'currentColor',
    borderStyle: 'none',
    borderWidth: 'medium',
    borderRightColor: theme.cardBorder,
    borderRightStyle: 'solid',
    borderRightWidth: '1px',
    transition: 'all 0.2s',
    [pseudos.hover]: {
      backgroundColor: 'rgba(100, 100, 100, 0.05)',
    },
    ['[data-state="on"]']: {
      color: '#fff',
      backgroundColor: theme.plumeAccent,
    },
    [':last-child']: {
      borderRightColor: 'currentColor',
      borderRightStyle: 'none',
      borderRightWidth: 'medium',
    },
  },
  scrollAreaRoot: {
    width: '100%',
    height: '150px',
    overflow: 'hidden',
    backgroundColor: theme.dropdownBg,
    borderColor: theme.cardBorder,
    borderStyle: 'solid',
    borderWidth: '1px',
    borderRadius: '8px',
  },
  scrollAreaViewport: {
    width: '100%',
    height: '100%',
  },
  scrollAreaScrollbar: {
    display: 'flex',
    padding: '2px',
    touchAction: 'none',
    userSelect: 'none',
    transition: 'background 160ms ease-out',
    [pseudos.hover]: {
      backgroundColor: 'rgba(100, 100, 100, 0.08)',
    },
    ['[data-orientation="vertical"]']: {
      width: '10px',
    },
  },
  scrollAreaThumb: {
    position: 'relative',
    flex: 1,
    backgroundColor: theme.cardBorder,
    borderRadius: '10px',
    ['::before']: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      width: '100%',
      minWidth: '44px',
      height: '100%',
      minHeight: '44px',
      content: '""',
      transform: 'translate(-50%, -50%)',
    },
  },
  scrollAreaItem: {
    padding: '8px 16px',
    fontSize: '13.5px',
    color: theme.textSecondary,
    borderBottomColor: theme.cardBorder,
    borderBottomStyle: 'solid',
    borderBottomWidth: '1px',
  },
  alertDialogOverlay: {
    position: 'fixed',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 50,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  alertDialogContent: {
    position: 'fixed',
    top: '50%',
    left: '50%',
    zIndex: 51,
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    width: '90vw',
    maxWidth: '420px',
    padding: '24px',
    background: theme.dropdownBg,
    borderColor: theme.cardBorder,
    borderStyle: 'solid',
    borderWidth: '1px',
    borderRadius: '12px',
    boxShadow: theme.cardShadow,
    transform: 'translate(-50%, -50%)',
  },
  alertDialogTitle: {
    margin: 0,
    fontSize: '18px',
    fontWeight: '700',
    color: theme.textPrimary,
  },
  alertDialogDescription: {
    margin: 0,
    fontSize: '14px',
    lineHeight: 1.5,
    color: theme.textSecondary,
  },
  alertDialogActions: {
    display: 'flex',
    gap: '8px',
    justifyContent: 'flex-end',
  },
  alertDialogCancel: {
    padding: '6px 14px',
    fontSize: '13px',
    fontWeight: '600',
    color: theme.textPrimary,
    cursor: 'pointer',
    backgroundColor: theme.iconBg,
    borderColor: theme.cardBorder,
    borderStyle: 'solid',
    borderWidth: '1px',
    borderRadius: '6px',
    transition: 'opacity 0.2s',
    [pseudos.hover]: {
      opacity: 0.85,
    },
  },
  alertDialogAction: {
    padding: '6px 14px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#fff',
    cursor: 'pointer',
    backgroundColor: '#e5484d',
    borderColor: 'currentColor',
    borderStyle: 'none',
    borderWidth: 'medium',
    borderRadius: '6px',
    transition: 'opacity 0.2s',
    [pseudos.hover]: {
      opacity: 0.9,
    },
  },
  contextMenuTrigger: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '80px',
    color: theme.textSecondary,
    userSelect: 'none',
    borderColor: theme.cardBorder,
    borderStyle: 'dashed',
    borderWidth: '2px',
    borderRadius: '8px',
  },
});

export const HeadlessDemo = () => {
  const [toastOpen, setToastOpen] = React.useState(false);

  return (
    <div classStyle={styles.container}>
      <div>
        <h4 classStyle={styles.sectionTitle}>Dialog</h4>
        <Dialog>
          <Dialog.Trigger classStyle={styles.button}>Open Dialog</Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay classStyle={styles.dialogOverlay} />
            <Dialog.Content classStyle={styles.dialogContent}>
              <Dialog.Title classStyle={styles.dialogTitle}>Edit Profile</Dialog.Title>
              <Dialog.Description classStyle={styles.dialogDescription}>
                Make changes to your profile here. Click close when you are done.
              </Dialog.Description>
              <Dialog.Close classStyle={styles.dialogClose}>Close</Dialog.Close>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog>
      </div>

      <div>
        <h4 classStyle={styles.sectionTitle}>Popover</h4>
        <Popover>
          <Popover.Trigger classStyle={styles.button}>Show Popover</Popover.Trigger>
          <Popover.Content classStyle={styles.popoverContent} sideOffset={6}>
            <Popover.Arrow classStyle={styles.popoverArrow} />
            <Popover.Close classStyle={styles.popoverClose}>✕</Popover.Close>
            <div>
              <strong>Dimensions</strong>
              <p style={{ margin: '6px 0 0' }}>Set the dimensions for the layer.</p>
            </div>
          </Popover.Content>
        </Popover>
      </div>

      <div>
        <h4 classStyle={styles.sectionTitle}>Tooltip</h4>
        <Tooltip.Provider delayDuration={200}>
          <Tooltip>
            <Tooltip.Trigger classStyle={styles.button}>Hover me</Tooltip.Trigger>
            <Tooltip.Content classStyle={styles.tooltipContent} sideOffset={6}>
              <Tooltip.Arrow classStyle={styles.tooltipArrow} />
              Add to library
            </Tooltip.Content>
          </Tooltip>
        </Tooltip.Provider>
      </div>

      <div>
        <h4 classStyle={styles.sectionTitle}>Accordion</h4>
        <Accordion type="single" collapsible classStyle={styles.accordionRoot}>
          <Accordion.Item value="item-1" classStyle={styles.accordionItem}>
            <Accordion.Header classStyle={styles.accordionHeader}>
              <Accordion.Trigger classStyle={styles.accordionTrigger}>Is it accessible?</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Content classStyle={styles.accordionContent}>
              Yes. It adheres to the WAI-ARIA design pattern.
            </Accordion.Content>
          </Accordion.Item>
          <Accordion.Item value="item-2" classStyle={styles.accordionItem}>
            <Accordion.Header classStyle={styles.accordionHeader}>
              <Accordion.Trigger classStyle={styles.accordionTrigger}>Is it styled?</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Content classStyle={styles.accordionContent}>
              Yes. It is styled with Plumeria zero-cost styling!
            </Accordion.Content>
          </Accordion.Item>
        </Accordion>
      </div>

      <div>
        <h4 classStyle={styles.sectionTitle}>Tabs</h4>
        <Tabs defaultValue="tab1" classStyle={styles.tabsRoot}>
          <Tabs.List classStyle={styles.tabsList}>
            <Tabs.Trigger value="tab1" classStyle={styles.tabsTrigger}>
              Account
            </Tabs.Trigger>
            <Tabs.Trigger value="tab2" classStyle={styles.tabsTrigger}>
              Password
            </Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="tab1" classStyle={styles.tabsContent}>
            Make changes to your account here.
          </Tabs.Content>
          <Tabs.Content value="tab2" classStyle={styles.tabsContent}>
            Change your password here.
          </Tabs.Content>
        </Tabs>
      </div>

      <div>
        <h4 classStyle={styles.sectionTitle}>Collapsible</h4>
        <Collapsible classStyle={styles.collapsibleRoot}>
          <div classStyle={styles.collapsibleHeader}>
            <span classStyle={styles.collapsibleLabel}>@alexeriksson starred 3 repositories</span>
            <Collapsible.Trigger classStyle={styles.collapsibleTrigger}>Toggle</Collapsible.Trigger>
          </div>
          <Collapsible.Content classStyle={styles.collapsibleContent}>
            <div>@radix-ui/primitives</div>
            <div>@plumeria/core</div>
            <div>@plumeria/headlessui</div>
          </Collapsible.Content>
        </Collapsible>
      </div>

      <div>
        <h4 classStyle={styles.sectionTitle}>DropdownMenu</h4>
        <DropdownMenu>
          <DropdownMenu.Trigger classStyle={styles.button}>Options</DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content classStyle={styles.dropdownMenuContent} sideOffset={5}>
              <DropdownMenu.Item classStyle={styles.dropdownMenuItem}>New Tab</DropdownMenu.Item>
              <DropdownMenu.Item classStyle={styles.dropdownMenuItem}>New Window</DropdownMenu.Item>
              <DropdownMenu.Separator classStyle={styles.dropdownMenuSeparator} />
              <DropdownMenu.Item classStyle={styles.dropdownMenuItem}>Settings</DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu>
      </div>

      <div>
        <h4 classStyle={styles.sectionTitle}>Select</h4>
        <Select defaultValue="apple">
          <Select.Trigger classStyle={styles.selectTrigger}>
            <Select.Value />
            <Select.Icon>▼</Select.Icon>
          </Select.Trigger>
          <Select.Portal>
            <Select.Content classStyle={styles.selectContent}>
              <Select.Viewport classStyle={styles.selectViewport}>
                <Select.Item value="apple" classStyle={styles.selectItem}>
                  <Select.ItemText>Apple</Select.ItemText>
                  <Select.ItemIndicator classStyle={styles.selectItemIndicator}>✓</Select.ItemIndicator>
                </Select.Item>
                <Select.Item value="banana" classStyle={styles.selectItem}>
                  <Select.ItemText>Banana</Select.ItemText>
                  <Select.ItemIndicator classStyle={styles.selectItemIndicator}>✓</Select.ItemIndicator>
                </Select.Item>
                <Select.Item value="orange" classStyle={styles.selectItem}>
                  <Select.ItemText>Orange</Select.ItemText>
                  <Select.ItemIndicator classStyle={styles.selectItemIndicator}>✓</Select.ItemIndicator>
                </Select.Item>
              </Select.Viewport>
            </Select.Content>
          </Select.Portal>
        </Select>
      </div>

      <div>
        <h4 classStyle={styles.sectionTitle}>Checkbox</h4>
        <div classStyle={styles.checkboxContainer}>
          <Checkbox id="c1" classStyle={styles.checkboxRoot}>
            <Checkbox.Indicator classStyle={styles.checkboxIndicator}>✓</Checkbox.Indicator>
          </Checkbox>
          <label htmlFor="c1" classStyle={styles.checkboxLabel}>
            Accept terms and conditions
          </label>
        </div>
      </div>

      <div>
        <h4 classStyle={styles.sectionTitle}>Switch</h4>
        <div classStyle={styles.switchContainer}>
          <Switch id="s1" classStyle={styles.switchRoot}>
            <Switch.Thumb classStyle={styles.switchThumb} />
          </Switch>
          <label htmlFor="s1" classStyle={styles.checkboxLabel}>
            Enable notifications
          </label>
        </div>
      </div>

      <div>
        <h4 classStyle={styles.sectionTitle}>RadioGroup</h4>
        <RadioGroup defaultValue="default" classStyle={styles.radioGroupRoot}>
          <div classStyle={styles.radioGroupContainer}>
            <RadioGroup.Item value="default" id="r1" classStyle={styles.radioGroupItem}>
              <RadioGroup.Indicator classStyle={styles.radioGroupIndicator} />
            </RadioGroup.Item>
            <label htmlFor="r1" classStyle={styles.checkboxLabel}>
              Default
            </label>
          </div>
          <div classStyle={styles.radioGroupContainer}>
            <RadioGroup.Item value="comfortable" id="r2" classStyle={styles.radioGroupItem}>
              <RadioGroup.Indicator classStyle={styles.radioGroupIndicator} />
            </RadioGroup.Item>
            <label htmlFor="r2" classStyle={styles.checkboxLabel}>
              Comfortable
            </label>
          </div>
        </RadioGroup>
      </div>

      <div>
        <h4 classStyle={styles.sectionTitle}>Slider</h4>
        <Slider defaultValue={[50]} max={100} step={1} classStyle={styles.sliderRoot}>
          <Slider.Track classStyle={styles.sliderTrack}>
            <Slider.Range classStyle={styles.sliderRange} />
          </Slider.Track>
          <Slider.Thumb classStyle={styles.sliderThumb} />
        </Slider>
      </div>

      <div>
        <h4 classStyle={styles.sectionTitle}>ContextMenu</h4>
        <ContextMenu>
          <ContextMenu.Trigger classStyle={styles.contextMenuTrigger}>Right click here</ContextMenu.Trigger>
          <ContextMenu.Portal>
            <ContextMenu.Content classStyle={styles.dropdownMenuContent}>
              <ContextMenu.Item classStyle={styles.dropdownMenuItem}>Back</ContextMenu.Item>
              <ContextMenu.Item classStyle={styles.dropdownMenuItem}>Forward</ContextMenu.Item>
              <ContextMenu.Separator classStyle={styles.dropdownMenuSeparator} />
              <ContextMenu.Item classStyle={styles.dropdownMenuItem}>Reload</ContextMenu.Item>
            </ContextMenu.Content>
          </ContextMenu.Portal>
        </ContextMenu>
      </div>

      <div>
        <h4 classStyle={styles.sectionTitle}>Menubar</h4>
        <Menubar classStyle={styles.menubarRoot}>
          <Menubar.Menu>
            <Menubar.Trigger classStyle={styles.menubarTrigger}>File</Menubar.Trigger>
            <Menubar.Portal>
              <Menubar.Content classStyle={styles.dropdownMenuContent} align="start" sideOffset={5}>
                <Menubar.Item classStyle={styles.dropdownMenuItem}>New Tab</Menubar.Item>
                <Menubar.Item classStyle={styles.dropdownMenuItem}>New Window</Menubar.Item>
              </Menubar.Content>
            </Menubar.Portal>
          </Menubar.Menu>
          <Menubar.Menu>
            <Menubar.Trigger classStyle={styles.menubarTrigger}>Edit</Menubar.Trigger>
            <Menubar.Portal>
              <Menubar.Content classStyle={styles.dropdownMenuContent} align="start" sideOffset={5}>
                <Menubar.Item classStyle={styles.dropdownMenuItem}>Undo</Menubar.Item>
                <Menubar.Item classStyle={styles.dropdownMenuItem}>Redo</Menubar.Item>
              </Menubar.Content>
            </Menubar.Portal>
          </Menubar.Menu>
        </Menubar>
      </div>

      <div>
        <h4 classStyle={styles.sectionTitle}>NavigationMenu</h4>
        <NavigationMenu classStyle={styles.navigationMenuRoot}>
          <NavigationMenu.List classStyle={styles.navigationMenuList}>
            <NavigationMenu.Item>
              <NavigationMenu.Trigger classStyle={styles.navigationMenuTrigger}>Learn</NavigationMenu.Trigger>
              <NavigationMenu.Content classStyle={styles.navigationMenuContent}>
                <NavigationMenu.Link href="/docs" classStyle={styles.navigationMenuLink}>
                  Documentation
                </NavigationMenu.Link>
                <NavigationMenu.Link href="/guide" classStyle={styles.navigationMenuLink}>
                  Getting Started
                </NavigationMenu.Link>
              </NavigationMenu.Content>
            </NavigationMenu.Item>
          </NavigationMenu.List>
        </NavigationMenu>
      </div>

      <div>
        <h4 classStyle={styles.sectionTitle}>Toast</h4>
        <Toast.Provider swipeDirection="right">
          <button
            classStyle={styles.button}
            onClick={() => {
              setToastOpen(true);
            }}
          >
            Show Toast
          </button>
          <Toast open={toastOpen} onOpenChange={setToastOpen} classStyle={styles.toastRoot}>
            <Toast.Title classStyle={styles.toastTitle}>Scheduled Event</Toast.Title>
            <Toast.Description classStyle={styles.toastDescription}>
              Upcoming meeting tomorrow at 10:00 AM.
            </Toast.Description>
            <Toast.Close classStyle={styles.toastCloseButton}>Dismiss</Toast.Close>
          </Toast>
          <Toast.Viewport classStyle={styles.toastViewport} />
        </Toast.Provider>
      </div>

      <div>
        <h4 classStyle={styles.sectionTitle}>Toggle</h4>
        <Toggle classStyle={styles.toggleRoot}>Bold</Toggle>
      </div>

      <div>
        <h4 classStyle={styles.sectionTitle}>ToggleGroup</h4>
        <ToggleGroup type="single" defaultValue="center" classStyle={styles.toggleGroupRoot}>
          <ToggleGroup.Item value="left" classStyle={styles.toggleGroupItem}>
            Left
          </ToggleGroup.Item>
          <ToggleGroup.Item value="center" classStyle={styles.toggleGroupItem}>
            Center
          </ToggleGroup.Item>
          <ToggleGroup.Item value="right" classStyle={styles.toggleGroupItem}>
            Right
          </ToggleGroup.Item>
        </ToggleGroup>
      </div>

      <div>
        <h4 classStyle={styles.sectionTitle}>ScrollArea</h4>
        <ScrollArea type="always" classStyle={styles.scrollAreaRoot}>
          <ScrollArea.Viewport classStyle={styles.scrollAreaViewport}>
            {Array.from({ length: 15 }, (_, i) => (
              <div key={i} classStyle={styles.scrollAreaItem}>
                Item {i + 1}
              </div>
            ))}
          </ScrollArea.Viewport>
          <ScrollArea.Scrollbar orientation="vertical" classStyle={styles.scrollAreaScrollbar}>
            <ScrollArea.Thumb classStyle={styles.scrollAreaThumb} />
          </ScrollArea.Scrollbar>
        </ScrollArea>
      </div>

      <div>
        <h4 classStyle={styles.sectionTitle}>AlertDialog</h4>
        <AlertDialog>
          <AlertDialog.Trigger classStyle={styles.button}>Delete Account</AlertDialog.Trigger>
          <AlertDialog.Portal>
            <AlertDialog.Overlay classStyle={styles.alertDialogOverlay} />
            <AlertDialog.Content classStyle={styles.alertDialogContent}>
              <AlertDialog.Title classStyle={styles.alertDialogTitle}>Are you sure?</AlertDialog.Title>
              <AlertDialog.Description classStyle={styles.alertDialogDescription}>
                This action cannot be undone. This will permanently delete your account.
              </AlertDialog.Description>
              <div classStyle={styles.alertDialogActions}>
                <AlertDialog.Cancel classStyle={styles.alertDialogCancel}>Cancel</AlertDialog.Cancel>
                <AlertDialog.Action classStyle={styles.alertDialogAction}>Delete</AlertDialog.Action>
              </div>
            </AlertDialog.Content>
          </AlertDialog.Portal>
        </AlertDialog>
      </div>
    </div>
  );
};
