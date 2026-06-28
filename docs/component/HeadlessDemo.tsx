import * as css from '@plumeria/core';
import {
  Dialog,
  DialogTrigger,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverArrow,
  PopoverClose,
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipArrow,
  Accordion,
  AccordionItem,
  AccordionHeader,
  AccordionTrigger,
  AccordionContent,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
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
    ['&:last-child']: {
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
    ['&[data-state="active"]']: {
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
});

export const HeadlessDemo = () => {
  return (
    <div styleName={styles.container}>
      <div>
        <h4 styleName={styles.sectionTitle}>Dialog</h4>
        <Dialog>
          <DialogTrigger styleName={styles.button}>Open Dialog</DialogTrigger>
          <DialogPortal>
            <DialogOverlay styleName={styles.dialogOverlay} />
            <DialogContent styleName={styles.dialogContent}>
              <DialogTitle styleName={styles.dialogTitle}>Edit Profile</DialogTitle>
              <DialogDescription styleName={styles.dialogDescription}>
                Make changes to your profile here. Click close when you are done.
              </DialogDescription>
              <DialogClose styleName={styles.dialogClose}>Close</DialogClose>
            </DialogContent>
          </DialogPortal>
        </Dialog>
      </div>

      <div>
        <h4 styleName={styles.sectionTitle}>Popover</h4>
        <Popover>
          <PopoverTrigger styleName={styles.button}>Show Popover</PopoverTrigger>
          <PopoverContent styleName={styles.popoverContent} sideOffset={6}>
            <PopoverArrow styleName={styles.popoverArrow} />
            <PopoverClose styleName={styles.popoverClose}>✕</PopoverClose>
            <div>
              <strong>Dimensions</strong>
              <p style={{ margin: '6px 0 0' }}>Set the dimensions for the layer.</p>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <div>
        <h4 styleName={styles.sectionTitle}>Tooltip</h4>
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger styleName={styles.button}>Hover me</TooltipTrigger>
            <TooltipContent styleName={styles.tooltipContent} sideOffset={6}>
              <TooltipArrow styleName={styles.tooltipArrow} />
              Add to library
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div>
        <h4 styleName={styles.sectionTitle}>Accordion</h4>
        <Accordion type="single" collapsible styleName={styles.accordionRoot}>
          <AccordionItem value="item-1" styleName={styles.accordionItem}>
            <AccordionHeader styleName={styles.accordionHeader}>
              <AccordionTrigger styleName={styles.accordionTrigger}>Is it accessible?</AccordionTrigger>
            </AccordionHeader>
            <AccordionContent styleName={styles.accordionContent}>
              Yes. It adheres to the WAI-ARIA design pattern.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2" styleName={styles.accordionItem}>
            <AccordionHeader styleName={styles.accordionHeader}>
              <AccordionTrigger styleName={styles.accordionTrigger}>Is it styled?</AccordionTrigger>
            </AccordionHeader>
            <AccordionContent styleName={styles.accordionContent}>
              Yes. It is styled with Plumeria zero-cost styling!
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      <div>
        <h4 styleName={styles.sectionTitle}>Tabs</h4>
        <Tabs defaultValue="tab1" styleName={styles.tabsRoot}>
          <TabsList styleName={styles.tabsList}>
            <TabsTrigger value="tab1" styleName={styles.tabsTrigger}>
              Account
            </TabsTrigger>
            <TabsTrigger value="tab2" styleName={styles.tabsTrigger}>
              Password
            </TabsTrigger>
          </TabsList>
          <TabsContent value="tab1" styleName={styles.tabsContent}>
            Make changes to your account here.
          </TabsContent>
          <TabsContent value="tab2" styleName={styles.tabsContent}>
            Change your password here.
          </TabsContent>
        </Tabs>
      </div>

      <div>
        <h4 styleName={styles.sectionTitle}>Collapsible</h4>
        <Collapsible styleName={styles.collapsibleRoot}>
          <div styleName={styles.collapsibleHeader}>
            <span styleName={styles.collapsibleLabel}>@alexeriksson starred 3 repositories</span>
            <CollapsibleTrigger styleName={styles.collapsibleTrigger}>Toggle</CollapsibleTrigger>
          </div>
          <CollapsibleContent styleName={styles.collapsibleContent}>
            <div>@radix-ui/primitives</div>
            <div>@plumeria/core</div>
            <div>@plumeria/headlessui</div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
};
