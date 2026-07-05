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
    border: `1.5px solid ${theme.cardBorder}`,
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
    border: 'none',
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
    border: `1px solid ${theme.cardBorder}`,
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
    border: `1px solid ${theme.cardBorder}`,
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
    border: `1px solid ${theme.cardBorder}`,
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
    border: 'none',
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
    border: `1px solid ${theme.cardBorder}`,
    borderRadius: '8px',
  },
  accordionItem: {
    borderBottom: `1px solid ${theme.cardBorder}`,
    [':last-child']: {
      borderBottom: 'none',
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
    border: 'none',
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
    borderTop: `1px solid ${theme.cardBorder}`,
  },
  tabsRoot: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    overflow: 'hidden',
    background: theme.dropdownBg,
    border: `1px solid ${theme.cardBorder}`,
    borderRadius: '8px',
  },
  tabsList: {
    display: 'flex',
    backgroundColor: 'rgba(100, 100, 100, 0.03)',
    borderBottom: `1px solid ${theme.cardBorder}`,
  },
  tabsTrigger: {
    flex: 1,
    padding: '12px',
    fontSize: '13.5px',
    fontWeight: '600',
    color: theme.textSecondary,
    cursor: 'pointer',
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: '2px solid transparent',
    transition: 'all 0.2s',
    [pseudos.hover]: {
      color: theme.textPrimary,
      backgroundColor: 'rgba(100, 100, 100, 0.05)',
    },
    ['[data-state="active"]']: {
      color: theme.plumeAccent,
      borderBottom: `2px solid ${theme.plumeAccent}`,
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
    border: `1px solid ${theme.cardBorder}`,
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
    border: 'none',
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
    border: `1px solid ${theme.cardBorder}`,
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
    border: `1.5px solid ${theme.cardBorder}`,
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
    border: 'none',
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
    border: `1.5px solid ${theme.cardBorder}`,
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
    border: `2px solid ${theme.plumeAccent}`,
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
    border: `1.5px solid ${theme.cardBorder}`,
    borderRadius: '6px',
    [pseudos.hover]: {
      borderColor: theme.plumeAccent,
    },
  },
  selectContent: {
    zIndex: 50,
    overflow: 'hidden',
    backgroundColor: theme.dropdownBg,
    border: `1px solid ${theme.cardBorder}`,
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
    border: `1px solid ${theme.cardBorder}`,
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
    border: `1px solid ${theme.cardBorder}`,
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
    border: 'none',
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
    border: `1px solid ${theme.cardBorder}`,
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
    border: 'none',
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
    border: `1px solid ${theme.cardBorder}`,
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
    border: `1px solid ${theme.cardBorder}`,
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
    border: `1px solid ${theme.cardBorder}`,
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
    border: `1.5px solid ${theme.cardBorder}`,
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
    border: `1px solid ${theme.cardBorder}`,
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
    border: 'none',
    borderRight: `1px solid ${theme.cardBorder}`,
    transition: 'all 0.2s',
    [pseudos.hover]: {
      backgroundColor: 'rgba(100, 100, 100, 0.05)',
    },
    ['[data-state="on"]']: {
      color: '#fff',
      backgroundColor: theme.plumeAccent,
    },
    [':last-child']: {
      borderRight: 'none',
    },
  },
  scrollAreaRoot: {
    width: '100%',
    height: '150px',
    overflow: 'hidden',
    backgroundColor: theme.dropdownBg,
    border: `1px solid ${theme.cardBorder}`,
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
    borderBottom: `1px solid ${theme.cardBorder}`,
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
    border: `1px solid ${theme.cardBorder}`,
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
    border: `1px solid ${theme.cardBorder}`,
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
    border: 'none',
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
    border: `2px dashed ${theme.cardBorder}`,
    borderRadius: '8px',
  },
});

export const HeadlessDemo = () => {
  const [toastOpen, setToastOpen] = React.useState(false);

  return (
    <div styleName={styles.container}>
      <div>
        <h4 styleName={styles.sectionTitle}>Dialog</h4>
        <Dialog>
          <Dialog.Trigger styleName={styles.button}>Open Dialog</Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay styleName={styles.dialogOverlay} />
            <Dialog.Content styleName={styles.dialogContent}>
              <Dialog.Title styleName={styles.dialogTitle}>Edit Profile</Dialog.Title>
              <Dialog.Description styleName={styles.dialogDescription}>
                Make changes to your profile here. Click close when you are done.
              </Dialog.Description>
              <Dialog.Close styleName={styles.dialogClose}>Close</Dialog.Close>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog>
      </div>

      <div>
        <h4 styleName={styles.sectionTitle}>Popover</h4>
        <Popover>
          <Popover.Trigger styleName={styles.button}>Show Popover</Popover.Trigger>
          <Popover.Content styleName={styles.popoverContent} sideOffset={6}>
            <Popover.Arrow styleName={styles.popoverArrow} />
            <Popover.Close styleName={styles.popoverClose}>✕</Popover.Close>
            <div>
              <strong>Dimensions</strong>
              <p style={{ margin: '6px 0 0' }}>Set the dimensions for the layer.</p>
            </div>
          </Popover.Content>
        </Popover>
      </div>

      <div>
        <h4 styleName={styles.sectionTitle}>Tooltip</h4>
        <Tooltip.Provider delayDuration={200}>
          <Tooltip>
            <Tooltip.Trigger styleName={styles.button}>Hover me</Tooltip.Trigger>
            <Tooltip.Content styleName={styles.tooltipContent} sideOffset={6}>
              <Tooltip.Arrow styleName={styles.tooltipArrow} />
              Add to library
            </Tooltip.Content>
          </Tooltip>
        </Tooltip.Provider>
      </div>

      <div>
        <h4 styleName={styles.sectionTitle}>Accordion</h4>
        <Accordion type="single" collapsible styleName={styles.accordionRoot}>
          <Accordion.Item value="item-1" styleName={styles.accordionItem}>
            <Accordion.Header styleName={styles.accordionHeader}>
              <Accordion.Trigger styleName={styles.accordionTrigger}>Is it accessible?</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Content styleName={styles.accordionContent}>
              Yes. It adheres to the WAI-ARIA design pattern.
            </Accordion.Content>
          </Accordion.Item>
          <Accordion.Item value="item-2" styleName={styles.accordionItem}>
            <Accordion.Header styleName={styles.accordionHeader}>
              <Accordion.Trigger styleName={styles.accordionTrigger}>Is it styled?</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Content styleName={styles.accordionContent}>
              Yes. It is styled with Plumeria zero-cost styling!
            </Accordion.Content>
          </Accordion.Item>
        </Accordion>
      </div>

      <div>
        <h4 styleName={styles.sectionTitle}>Tabs</h4>
        <Tabs defaultValue="tab1" styleName={styles.tabsRoot}>
          <Tabs.List styleName={styles.tabsList}>
            <Tabs.Trigger value="tab1" styleName={styles.tabsTrigger}>
              Account
            </Tabs.Trigger>
            <Tabs.Trigger value="tab2" styleName={styles.tabsTrigger}>
              Password
            </Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="tab1" styleName={styles.tabsContent}>
            Make changes to your account here.
          </Tabs.Content>
          <Tabs.Content value="tab2" styleName={styles.tabsContent}>
            Change your password here.
          </Tabs.Content>
        </Tabs>
      </div>

      <div>
        <h4 styleName={styles.sectionTitle}>Collapsible</h4>
        <Collapsible styleName={styles.collapsibleRoot}>
          <div styleName={styles.collapsibleHeader}>
            <span styleName={styles.collapsibleLabel}>@alexeriksson starred 3 repositories</span>
            <Collapsible.Trigger styleName={styles.collapsibleTrigger}>Toggle</Collapsible.Trigger>
          </div>
          <Collapsible.Content styleName={styles.collapsibleContent}>
            <div>@radix-ui/primitives</div>
            <div>@plumeria/core</div>
            <div>@plumeria/headlessui</div>
          </Collapsible.Content>
        </Collapsible>
      </div>

      <div>
        <h4 styleName={styles.sectionTitle}>DropdownMenu</h4>
        <DropdownMenu>
          <DropdownMenu.Trigger styleName={styles.button}>Options</DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content styleName={styles.dropdownMenuContent} sideOffset={5}>
              <DropdownMenu.Item styleName={styles.dropdownMenuItem}>New Tab</DropdownMenu.Item>
              <DropdownMenu.Item styleName={styles.dropdownMenuItem}>New Window</DropdownMenu.Item>
              <DropdownMenu.Separator styleName={styles.dropdownMenuSeparator} />
              <DropdownMenu.Item styleName={styles.dropdownMenuItem}>Settings</DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu>
      </div>

      <div>
        <h4 styleName={styles.sectionTitle}>Select</h4>
        <Select defaultValue="apple">
          <Select.Trigger styleName={styles.selectTrigger}>
            <Select.Value />
            <Select.Icon>▼</Select.Icon>
          </Select.Trigger>
          <Select.Portal>
            <Select.Content styleName={styles.selectContent}>
              <Select.Viewport styleName={styles.selectViewport}>
                <Select.Item value="apple" styleName={styles.selectItem}>
                  <Select.ItemText>Apple</Select.ItemText>
                  <Select.ItemIndicator styleName={styles.selectItemIndicator}>✓</Select.ItemIndicator>
                </Select.Item>
                <Select.Item value="banana" styleName={styles.selectItem}>
                  <Select.ItemText>Banana</Select.ItemText>
                  <Select.ItemIndicator styleName={styles.selectItemIndicator}>✓</Select.ItemIndicator>
                </Select.Item>
                <Select.Item value="orange" styleName={styles.selectItem}>
                  <Select.ItemText>Orange</Select.ItemText>
                  <Select.ItemIndicator styleName={styles.selectItemIndicator}>✓</Select.ItemIndicator>
                </Select.Item>
              </Select.Viewport>
            </Select.Content>
          </Select.Portal>
        </Select>
      </div>

      <div>
        <h4 styleName={styles.sectionTitle}>Checkbox</h4>
        <div styleName={styles.checkboxContainer}>
          <Checkbox id="c1" styleName={styles.checkboxRoot}>
            <Checkbox.Indicator styleName={styles.checkboxIndicator}>✓</Checkbox.Indicator>
          </Checkbox>
          <label htmlFor="c1" styleName={styles.checkboxLabel}>
            Accept terms and conditions
          </label>
        </div>
      </div>

      <div>
        <h4 styleName={styles.sectionTitle}>Switch</h4>
        <div styleName={styles.switchContainer}>
          <Switch id="s1" styleName={styles.switchRoot}>
            <Switch.Thumb styleName={styles.switchThumb} />
          </Switch>
          <label htmlFor="s1" styleName={styles.checkboxLabel}>
            Enable notifications
          </label>
        </div>
      </div>

      <div>
        <h4 styleName={styles.sectionTitle}>RadioGroup</h4>
        <RadioGroup defaultValue="default" styleName={styles.radioGroupRoot}>
          <div styleName={styles.radioGroupContainer}>
            <RadioGroup.Item value="default" id="r1" styleName={styles.radioGroupItem}>
              <RadioGroup.Indicator styleName={styles.radioGroupIndicator} />
            </RadioGroup.Item>
            <label htmlFor="r1" styleName={styles.checkboxLabel}>
              Default
            </label>
          </div>
          <div styleName={styles.radioGroupContainer}>
            <RadioGroup.Item value="comfortable" id="r2" styleName={styles.radioGroupItem}>
              <RadioGroup.Indicator styleName={styles.radioGroupIndicator} />
            </RadioGroup.Item>
            <label htmlFor="r2" styleName={styles.checkboxLabel}>
              Comfortable
            </label>
          </div>
        </RadioGroup>
      </div>

      <div>
        <h4 styleName={styles.sectionTitle}>Slider</h4>
        <Slider defaultValue={[50]} max={100} step={1} styleName={styles.sliderRoot}>
          <Slider.Track styleName={styles.sliderTrack}>
            <Slider.Range styleName={styles.sliderRange} />
          </Slider.Track>
          <Slider.Thumb styleName={styles.sliderThumb} />
        </Slider>
      </div>

      <div>
        <h4 styleName={styles.sectionTitle}>ContextMenu</h4>
        <ContextMenu>
          <ContextMenu.Trigger styleName={styles.contextMenuTrigger}>Right click here</ContextMenu.Trigger>
          <ContextMenu.Portal>
            <ContextMenu.Content styleName={styles.dropdownMenuContent}>
              <ContextMenu.Item styleName={styles.dropdownMenuItem}>Back</ContextMenu.Item>
              <ContextMenu.Item styleName={styles.dropdownMenuItem}>Forward</ContextMenu.Item>
              <ContextMenu.Separator styleName={styles.dropdownMenuSeparator} />
              <ContextMenu.Item styleName={styles.dropdownMenuItem}>Reload</ContextMenu.Item>
            </ContextMenu.Content>
          </ContextMenu.Portal>
        </ContextMenu>
      </div>

      <div>
        <h4 styleName={styles.sectionTitle}>Menubar</h4>
        <Menubar styleName={styles.menubarRoot}>
          <Menubar.Menu>
            <Menubar.Trigger styleName={styles.menubarTrigger}>File</Menubar.Trigger>
            <Menubar.Portal>
              <Menubar.Content styleName={styles.dropdownMenuContent} align="start" sideOffset={5}>
                <Menubar.Item styleName={styles.dropdownMenuItem}>New Tab</Menubar.Item>
                <Menubar.Item styleName={styles.dropdownMenuItem}>New Window</Menubar.Item>
              </Menubar.Content>
            </Menubar.Portal>
          </Menubar.Menu>
          <Menubar.Menu>
            <Menubar.Trigger styleName={styles.menubarTrigger}>Edit</Menubar.Trigger>
            <Menubar.Portal>
              <Menubar.Content styleName={styles.dropdownMenuContent} align="start" sideOffset={5}>
                <Menubar.Item styleName={styles.dropdownMenuItem}>Undo</Menubar.Item>
                <Menubar.Item styleName={styles.dropdownMenuItem}>Redo</Menubar.Item>
              </Menubar.Content>
            </Menubar.Portal>
          </Menubar.Menu>
        </Menubar>
      </div>

      <div>
        <h4 styleName={styles.sectionTitle}>NavigationMenu</h4>
        <NavigationMenu styleName={styles.navigationMenuRoot}>
          <NavigationMenu.List styleName={styles.navigationMenuList}>
            <NavigationMenu.Item>
              <NavigationMenu.Trigger styleName={styles.navigationMenuTrigger}>Learn</NavigationMenu.Trigger>
              <NavigationMenu.Content styleName={styles.navigationMenuContent}>
                <NavigationMenu.Link href="/docs" styleName={styles.navigationMenuLink}>
                  Documentation
                </NavigationMenu.Link>
                <NavigationMenu.Link href="/guide" styleName={styles.navigationMenuLink}>
                  Getting Started
                </NavigationMenu.Link>
              </NavigationMenu.Content>
            </NavigationMenu.Item>
          </NavigationMenu.List>
        </NavigationMenu>
      </div>

      <div>
        <h4 styleName={styles.sectionTitle}>Toast</h4>
        <Toast.Provider swipeDirection="right">
          <button
            styleName={styles.button}
            onClick={() => {
              setToastOpen(true);
            }}
          >
            Show Toast
          </button>
          <Toast open={toastOpen} onOpenChange={setToastOpen} styleName={styles.toastRoot}>
            <Toast.Title styleName={styles.toastTitle}>Scheduled Event</Toast.Title>
            <Toast.Description styleName={styles.toastDescription}>
              Upcoming meeting tomorrow at 10:00 AM.
            </Toast.Description>
            <Toast.Close styleName={styles.toastCloseButton}>Dismiss</Toast.Close>
          </Toast>
          <Toast.Viewport styleName={styles.toastViewport} />
        </Toast.Provider>
      </div>

      <div>
        <h4 styleName={styles.sectionTitle}>Toggle</h4>
        <Toggle styleName={styles.toggleRoot}>Bold</Toggle>
      </div>

      <div>
        <h4 styleName={styles.sectionTitle}>ToggleGroup</h4>
        <ToggleGroup type="single" defaultValue="center" styleName={styles.toggleGroupRoot}>
          <ToggleGroup.Item value="left" styleName={styles.toggleGroupItem}>
            Left
          </ToggleGroup.Item>
          <ToggleGroup.Item value="center" styleName={styles.toggleGroupItem}>
            Center
          </ToggleGroup.Item>
          <ToggleGroup.Item value="right" styleName={styles.toggleGroupItem}>
            Right
          </ToggleGroup.Item>
        </ToggleGroup>
      </div>

      <div>
        <h4 styleName={styles.sectionTitle}>ScrollArea</h4>
        <ScrollArea type="always" styleName={styles.scrollAreaRoot}>
          <ScrollArea.Viewport styleName={styles.scrollAreaViewport}>
            {Array.from({ length: 15 }, (_, i) => (
              <div key={i} styleName={styles.scrollAreaItem}>
                Item {i + 1}
              </div>
            ))}
          </ScrollArea.Viewport>
          <ScrollArea.Scrollbar orientation="vertical" styleName={styles.scrollAreaScrollbar}>
            <ScrollArea.Thumb styleName={styles.scrollAreaThumb} />
          </ScrollArea.Scrollbar>
        </ScrollArea>
      </div>

      <div>
        <h4 styleName={styles.sectionTitle}>AlertDialog</h4>
        <AlertDialog>
          <AlertDialog.Trigger styleName={styles.button}>Delete Account</AlertDialog.Trigger>
          <AlertDialog.Portal>
            <AlertDialog.Overlay styleName={styles.alertDialogOverlay} />
            <AlertDialog.Content styleName={styles.alertDialogContent}>
              <AlertDialog.Title styleName={styles.alertDialogTitle}>Are you sure?</AlertDialog.Title>
              <AlertDialog.Description styleName={styles.alertDialogDescription}>
                This action cannot be undone. This will permanently delete your account.
              </AlertDialog.Description>
              <div styleName={styles.alertDialogActions}>
                <AlertDialog.Cancel styleName={styles.alertDialogCancel}>Cancel</AlertDialog.Cancel>
                <AlertDialog.Action styleName={styles.alertDialogAction}>Delete</AlertDialog.Action>
              </div>
            </AlertDialog.Content>
          </AlertDialog.Portal>
        </AlertDialog>
      </div>
    </div>
  );
};
