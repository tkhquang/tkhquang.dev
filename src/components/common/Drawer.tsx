import {
  Dialog,
  DialogProvider,
  DialogDisclosure,
  DialogDescription,
  useDialogStore,
  useDialogContext,
  DialogHeading,
  DialogDismiss,
} from "@ariakit/react";
import { useState } from "react";

export default function Example() {
  const dialog = useDialogStore();

  return (
    <DialogProvider {...dialog}>
      <DialogDisclosure {...dialog.disclosure}>Show modal</DialogDisclosure>
      <Dialog store={dialog} className="dialog">
        <DialogHeading className="heading">Success</DialogHeading>
        <DialogDescription className="description">
          Your payment has been successfully processed. We have emailed your
          receipt.
        </DialogDescription>
        <div>
          <DialogDismiss className="button">OK</DialogDismiss>
        </div>
      </Dialog>
    </DialogProvider>
  );
}
